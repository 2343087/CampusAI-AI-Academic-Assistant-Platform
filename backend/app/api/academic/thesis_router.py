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

    # 3. Get AI Feedback
    ai_feedback = await thesis_reviewer.review_draft(request.content)

    # 4. Save submission
    new_submission = ThesisSubmission(
        thesis_id=request.thesis_id,
        content=request.content,
        ai_feedback=ai_feedback,
        version=next_version,
    )

    db.add(new_submission)
    await db.commit()
    await db.refresh(new_submission)

    return {
        "status": "success",
        "version": new_submission.version,
        "ai_feedback": ai_feedback,
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
        for s in submissions
    ]
