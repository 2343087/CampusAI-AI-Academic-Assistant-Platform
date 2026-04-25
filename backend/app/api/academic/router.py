from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.all import Student, Enrollment, Course, Schedule, User
from app.services.notifications.service import notification_service
from typing import List

router = APIRouter(prefix="/academic", tags=["academic"])


import asyncio
from sqlalchemy.orm import joinedload

@router.get("/dashboard")
async def get_student_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Optimized Dashboard — parallel fetching & joined queries."""
    user_email = current_user["email"]

    # 1. Fetch Student + User in ONE query with joinedload
    stmt = (
        select(Student)
        .join(User)
        .options(joinedload(Student.user))
        .filter(User.email == user_email)
    )
    result = await db.execute(stmt)
    student = result.scalars().first()
    
    if not student:
        # Fallback to User only if Student profile missing
        user_res = await db.execute(select(User).filter(User.email == user_email))
        user = user_res.scalars().first()
        if not user:
            raise HTTPException(status_code=404, detail="User tidak ditemukan")
    else:
        user = student.user

    # 2. Parallel Fetching for the rest
    async def fetch_enrollments():
        if not student: return [], 0, 0
        enroll_stmt = (
            select(Enrollment, Course)
            .join(Course, Enrollment.course_id == Course.id)
            .filter(Enrollment.student_id == student.id)
        )
        res = await db.execute(enroll_stmt)
        return res.all()

    async def fetch_schedule():
        if not student: return []
        sched_stmt = (
            select(Schedule, Course)
            .join(Course, Schedule.course_id == Course.id)
            .join(Enrollment, Course.id == Enrollment.course_id)
            .filter(Enrollment.student_id == student.id)
        )
        res = await db.execute(sched_stmt)
        return res.all()

    # Run tasks in parallel
    enroll_task = fetch_enrollments()
    sched_task = fetch_schedule()
    risk_task = notification_service.check_academic_risks(student.id if student else 0, db)
    
    enroll_results, sched_results, alerts = await asyncio.gather(enroll_task, sched_task, risk_task)

    # Process enrollments
    courses_data = []
    total_sks = 0
    total_points = 0
    grade_points = {"A": 4.0, "A-": 3.75, "B+": 3.5, "B": 3.0, "B-": 2.75, "C+": 2.5, "C": 2.0, "D": 1.0, "E": 0.0}
    
    for enrollment, course in enroll_results:
        courses_data.append({
            "id": course.id,
            "name": course.name,
            "sks": course.sks,
            "grade": enrollment.grade
        })
        total_sks += course.sks
        if enrollment.grade:
            total_points += (grade_points.get(enrollment.grade, 0) * course.sks)

    ipk = total_points / total_sks if total_sks > 0 else 0.0

    # Process schedule
    schedule_data = []
    for sched, course in sched_results:
        schedule_data.append({
            "subject": course.name,
            "day": sched.day,
            "time": f"{sched.start_time} - {sched.end_time}",
            "room": sched.room,
            "lecturer": sched.lecturer or "TBA"
        })

    return {
        "student_info": {
            "name": user.full_name or "Mahasiswa",
            "nim": student.nim if student else "-",
            "prodi": student.prodi if student else "-",
            "semester": student.semester if student else 1,
        },
        "stats": {
            "ipk": round(ipk, 2),
            "sks_completed": total_sks,
            "sks_total": 144,
            "attendance": "92%", 
        },
        "alerts": alerts,
        "courses": courses_data,
        "schedule": schedule_data,
        "deadlines": [
            {"title": "KRS Semester Ganjil", "date": "20 Agustus 2026", "urgent": True},
            {"title": "Draft Skripsi", "date": "15 September 2026", "urgent": False},
        ],
        "gpa_history": [{"semester": 1, "gpa": round(ipk, 2)}],
    }
