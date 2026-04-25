from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.all import Thesis, ThesisSubmission
from app.services.ai.thesis_reviewer import thesis_reviewer
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/thesis", tags=["thesis"])


class ThesisSubmit(BaseModel):
    thesis_id: int
    content: str


from app.tasks.academic_tasks import process_ai_thesis_review

@router.post("/submit")
async def submit_draft(
    request: ThesisSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Submit thesis draft for AI review — authenticated."""
    # 1. Fetch thesis
    result = await db.execute(select(Thesis).filter(Thesis.id == request.thesis_id))
    thesis = result.scalars().first()
    if not thesis:
        raise HTTPException(status_code=404, detail="Skripsi tidak ditemukan")

    # 2. Count existing submissions for version number
    sub_count_result = await db.execute(
        select(ThesisSubmission).filter(ThesisSubmission.thesis_id == request.thesis_id)
    )
    existing_subs = sub_count_result.scalars().all()
    next_version = len(existing_subs) + 1

    # 3. Save submission initially with pending AI feedback
    new_submission = ThesisSubmission(
        thesis_id=request.thesis_id,
        content=request.content,
        ai_feedback="AI Review sedang diproses...",
        version=next_version,
    )

    db.add(new_submission)
    await db.commit()
    await db.refresh(new_submission)

    # 4. Trigger Celery Task for background AI Review
    process_ai_thesis_review.delay(new_submission.id, request.content)

    return {
        "status": "success",
        "version": new_submission.version,
        "message": "Draft berhasil disubmit. Review AI sedang diproses di background.",
    }


class ThesisReview(BaseModel):
    submission_id: int
    lecturer_feedback: str
    status: Optional[str] = None # proposed, in_progress, review, completed


@router.post("/review")
async def review_submission(
    request: ThesisReview,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("lecturer", "admin", "developer")),
):
    """Lecturer review a submission — authenticated (lecturer+)."""
    # 1. Fetch submission
    result = await db.execute(select(ThesisSubmission).filter(ThesisSubmission.id == request.submission_id))
    submission = result.scalars().first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submisi tidak ditemukan")

    # 2. Update feedback
    submission.lecturer_feedback = request.lecturer_feedback
    
    # 3. Update thesis status if provided
    if request.status:
        res_thesis = await db.execute(select(Thesis).where(Thesis.id == submission.thesis_id))
        thesis = res_thesis.scalars().first()
        if thesis:
            thesis.status = request.status

    await db.commit()
    return {"status": "success", "message": "Feedback berhasil disimpan"}


@router.get("/{thesis_id}/history")
async def get_thesis_history(
    thesis_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get all submissions for a thesis — FIXED: was filtering by wrong column."""
    result = await db.execute(
        select(ThesisSubmission)
        .filter(ThesisSubmission.thesis_id == thesis_id)  # FIX: was .id before
        .order_by(ThesisSubmission.created_at.desc())
    )
    submissions = result.scalars().all()
    return [
        {
            "id": s.id,
            "version": s.version,
            "ai_feedback": s.ai_feedback,
            "lecturer_feedback": s.lecturer_feedback,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
    ]

@router.get("/lecturer/submissions")
async def get_lecturer_submissions(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("lecturer", "admin", "developer")),
):
    """Get all thesis submissions assigned to the lecturer."""
    from app.models.all import Lecturer, Student, User
    
    # 1. Get lecturer ID
    res_lec = await db.execute(select(Lecturer).filter(Lecturer.user_id == current_user["id"]))
    lecturer = res_lec.scalars().first()
    if not lecturer and current_user["role"] == "lecturer":
        raise HTTPException(status_code=404, detail="Profil dosen tidak ditemukan")

    # 2. Get theses assigned to this lecturer
    query = (
        select(ThesisSubmission, Thesis, Student, User)
        .join(Thesis, ThesisSubmission.thesis_id == Thesis.id)
        .join(Student, Thesis.student_id == Student.id)
        .join(User, Student.user_id == User.id)
    )
    
    if lecturer:
        query = query.filter(Thesis.lecturer_id == lecturer.id)
        
    query = query.order_by(ThesisSubmission.created_at.desc())
    
    result = await db.execute(query)
    rows = result.all()
    
    return [
        {
            "submission_id": sub.id,
            "thesis_id": thesis.id,
            "thesis_title": thesis.title,
            "student_name": user.full_name,
            "student_nim": student.nim,
            "version": sub.version,
            "ai_feedback": sub.ai_feedback,
            "lecturer_feedback": sub.lecturer_feedback,
            "status": thesis.status,
            "created_at": sub.created_at.isoformat() if sub.created_at else None,
        }
        for sub, thesis, student, user in rows
    ]
