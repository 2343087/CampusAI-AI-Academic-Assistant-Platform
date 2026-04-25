from app.core.celery_app import celery_app
from app.services.notifications.service import notification_service
from app.core.database import AsyncSessionLocal
from app.models.all import Student
from sqlalchemy import select
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
