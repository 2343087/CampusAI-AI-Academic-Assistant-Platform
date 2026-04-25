from app.core.celery_app import celery_app
from app.services.notifications.service import notification_service
from app.core.database import AsyncSessionLocal
from app.models.all import Student
from sqlalchemy import select, update
import asyncio
import logging

logger = logging.getLogger(__name__)

@celery_app.task(name="check_all_students_risk")
def check_all_students_risk():
    """Periodic task to audit all students for academic risks."""
    async def run_audit():
        async with AsyncSessionLocal() as db:
            # Get all students
            res = await db.execute(select(Student))
            students = res.scalars().all()
            
            for student in students:
                risks = await notification_service.check_academic_risks(student.id, db)
                if risks:
                    # In a real app, here we would send push notifications/emails/WA
                    logger.info(f"⚠️ Academic Risks for Student {student.nim}: {risks}")
                    
    asyncio.run(run_audit())

@celery_app.task(name="check_single_student_risk")
def check_single_student_risk(student_id: int):
    """Task to check risk for a specific student (e.g., after grade update)."""
    async def run_audit():
        async with AsyncSessionLocal() as db:
            risks = await notification_service.check_academic_risks(student_id, db)
            return risks
            
    return asyncio.run(run_audit())


@celery_app.task(name="process_ai_thesis_review")
def process_ai_thesis_review(submission_id: int, content: str):
    """Background task to review thesis using LLM."""
    async def run_review():
        from app.services.ai.thesis_reviewer import thesis_reviewer
        from app.models.all import ThesisSubmission
        
        try:
            # 1. Get AI Feedback
            ai_feedback = await thesis_reviewer.review_draft(content)
            
            # 2. Save to DB
            async with AsyncSessionLocal() as db:
                stmt = (
                    update(ThesisSubmission)
                    .where(ThesisSubmission.id == submission_id)
                    .values(ai_feedback=ai_feedback)
                )
                await db.execute(stmt)
                await db.commit()
            
            logger.info(f"✅ AI Review completed for submission {submission_id}")
        except Exception as e:
            logger.error(f"❌ AI Review failed for submission {submission_id}: {str(e)}")

    asyncio.run(run_review())

