import asyncio
from datetime import datetime, timedelta
from sqlalchemy import select
from app.core.database import SessionLocal
from app.models.all import Student, Enrollment, Schedule, Thesis
from app.services.notifications.service import notification_service
from celery import shared_task

async def _async_check_deadlines():
    """Logic to scan for upcoming academic deadlines."""
    async with SessionLocal() as db:
        # 1. Check KRS Deadlines (Mock logic: all students with 0 enrollments)
        res = await db.execute(select(Student))
        students = res.scalars().all()
        
        for student in students:
            # Check enrollment count
            res_en = await db.execute(select(Enrollment).where(Enrollment.student_id == student.id))
            enroll_count = len(res_en.all())
            
            if enroll_count == 0:
                await notification_service.add_alert(
                    student.user_id,
                    "KRS Deadline",
                    "Kamu belum mengisi KRS untuk semester ini. Segera selesaikan sebelum periode ditutup!",
                    "warning"
                )

async def _async_daily_schedule():
    """Logic to send morning briefings."""
    days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
    today = days[datetime.now().weekday()]
    
    async with SessionLocal() as db:
        # Find students with classes today
        # (Simplified: check all students)
        res = await db.execute(select(Student))
        students = res.scalars().all()
        
        for student in students:
            # This is where we'd find their classes and send a specific reminder
            # For now, we'll just log the check
            pass

@shared_task(name="app.tasks.check_deadlines")
def check_deadlines_task():
    loop = asyncio.get_event_loop()
    loop.run_until_complete(_async_check_deadlines())

@shared_task(name="app.tasks.morning_briefing")
def morning_briefing_task():
    loop = asyncio.get_event_loop()
    loop.run_until_complete(_async_daily_schedule())
