from sqlalchemy.ext.asyncio import AsyncSession
from app.models.all import Notification
from app.core.database import SessionLocal
from app.services.notifications.whatsapp import whatsapp_service
import logging

class NotificationService:
    def __init__(self):
        self.logger = logging.getLogger("campusai.notifications")

    async def add_alert(self, user_id: int, title: str, message: str, type: str = "info", send_wa: bool = False):
        """Add an alert to the DB and optionally send WhatsApp."""
        async with SessionLocal() as db:
            try:
                new_notif = Notification(
                    user_id=user_id,
                    title=title,
                    message=message,
                    type=type
                )
                db.add(new_notif)
                await db.commit()
                
                if send_wa:
                    # In a real scenario, we'd fetch the student's phone number here
                    pass
                
                return True
            except Exception as e:
                self.logger.error(f"Failed to add alert: {str(e)}")
                return False

    async def check_academic_risks(self, student_id: int, db: AsyncSession):
        """Analyze academic data and return urgent alerts/risks based on DB data."""
        from app.models.all import Enrollment, Student, Course
        from sqlalchemy import select, func
        
        alerts = []
        try:
            # 1. Fetch Student Info
            student_res = await db.execute(select(Student).where(Student.id == student_id))
            student = student_res.scalars().first()
            if not student: return []

            # 2. Calculate Real GPA & SKS
            stmt = select(Enrollment, Course).join(Course).filter(Enrollment.student_id == student_id)
            enrolls = (await db.execute(stmt)).all()
            
            total_sks = sum(e.course.sks for e in enrolls)
            
            grade_map = {"A": 4.0, "B": 3.0, "C": 2.0, "D": 1.0, "E": 0.0}
            total_points = sum((grade_map.get(e.enrollment.grade, 0) * e.course.sks) for e in enrolls if e.enrollment.grade)
            
            gpa = total_points / total_sks if total_sks > 0 else 0.0

            # --- RISK LOGIC ---
            
            # Risk 1: Low GPA
            if gpa < 2.5 and gpa > 0:
                alerts.append({
                    "level": "danger",
                    "message": f"IPK kamu ({round(gpa, 2)}) saat ini di bawah standar 2.5. Segera konsultasi dengan Dosen Wali."
                })
            
            # Risk 2: SKS Progress (e.g., Sem 5 but < 80 SKS)
            if student.semester >= 5 and total_sks < 80:
                alerts.append({
                    "level": "warning",
                    "message": f"Progress SKS kamu ({total_sks}) tertinggal untuk semester {student.semester}. Pertimbangkan ambil semester pendek."
                })

            # Default: KRS Reminder
            alerts.append({
                "level": "info",
                "message": "Batas akhir pengisian KRS tinggal 3 hari lagi. Pastikan kamu sudah berkonsultasi dengan Dosen Wali."
            })
            
            return alerts
        except Exception as e:
            self.logger.error(f"Error checking risks: {str(e)}")
            return []

notification_service = NotificationService()
