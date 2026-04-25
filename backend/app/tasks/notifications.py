import time
import asyncio
from datetime import datetime
from app.core.celery_app import celery_app
from app.core.database import AsyncSessionLocal
from app.models.all import User, Student, Enrollment, Schedule, Course
from sqlalchemy import select

@celery_app.task(name="send_whatsapp_notification")
def send_whatsapp_notification(phone: str, message: str):
    """Simulasi pengiriman WhatsApp."""
    print(f"--- WA NOTIFICATION START ---")
    print(f"TO: {phone}")
    print(f"MESSAGE: {message}")
    time.sleep(1) 
    print(f"--- WA NOTIFICATION SENT ---")
    return {"status": "sent", "phone": phone}

@celery_app.task(name="send_push_notification")
def send_push_notification(user_id: str, title: str, body: str):
    """Simulasi pengiriman Push Notification."""
    print(f"--- PUSH NOTIFICATION START ---")
    print(f"USER: {user_id}")
    print(f"TITLE: {title}")
    print(f"BODY: {body}")
    print(f"--- PUSH NOTIFICATION SENT ---")
    return {"status": "delivered", "user_id": user_id}

async def _daily_schedule_check_logic():
    """Logic to find students and their schedules for today."""
    days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
    today = days[datetime.now().weekday()]
    
    async with AsyncSessionLocal() as db:
        # Get all students
        res = await db.execute(select(Student))
        students = res.scalars().all()
        
        for student in students:
            # Get their enrollments
            res_en = await db.execute(select(Enrollment).where(Enrollment.student_id == student.id))
            course_ids = [en.course_id for en in res_en.scalars().all()]
            
            if not course_ids:
                continue
                
            # Get today's schedule for these courses
            res_sch = await db.execute(
                select(Schedule, Course)
                .join(Course)
                .where(Schedule.course_id.in_(course_ids))
                .where(Schedule.day == today)
            )
            schedules = res_sch.all()
            
            if schedules:
                msg = f"Halo {student.nim}! Hari ini ({today}) kamu ada kuliah:\n"
                for sch, co in schedules:
                    msg += f"- {co.name} jam {sch.time} di {sch.room}\n"
                
                # In real app, we'd get phone from User model
                # send_whatsapp_notification.delay("0812...", msg)
                print(f"DEBUG: Proactive alert for {student.nim}: {msg}")

@celery_app.task(name="daily_schedule_reminder")
def daily_schedule_reminder():
    """Triggered by Celery Beat to remind students of their schedule."""
    loop = asyncio.get_event_loop()
    if loop.is_running():
        asyncio.ensure_future(_daily_schedule_check_logic())
    else:
        loop.run_until_complete(_daily_schedule_check_logic())
    return "Reminders processed"
