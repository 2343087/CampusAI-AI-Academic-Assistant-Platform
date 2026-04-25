from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.all import AttendanceSession, AttendanceRecord, Schedule, Lecturer, Student
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import secrets

router = APIRouter(prefix="/attendance", tags=["attendance"])

class StartSessionRequest(BaseModel):
    schedule_id: int
    duration_minutes: int = 15

class StartSessionResponse(BaseModel):
    session_id: int
    session_code: str
    valid_until: datetime

class SubmitAttendanceRequest(BaseModel):
    session_code: str
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None

class SubmitAttendanceResponse(BaseModel):
    status: str
    message: str

@router.post("/start", response_model=StartSessionResponse)
async def start_attendance_session(
    req: StartSessionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Ensure user is a lecturer
    if current_user.get("role") != "lecturer":
        raise HTTPException(status_code=403, detail="Hanya dosen yang bisa memulai sesi absensi.")
    
    # Get lecturer
    lecturer_res = await db.execute(select(Lecturer).filter(Lecturer.user_id == current_user["id"]))
    lecturer = lecturer_res.scalars().first()
    if not lecturer:
        raise HTTPException(status_code=404, detail="Profil dosen tidak ditemukan.")

    # Check if schedule exists
    schedule_res = await db.execute(select(Schedule).filter(Schedule.id == req.schedule_id))
    schedule = schedule_res.scalars().first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan.")

    # Generate a random 6 character OTP
    session_code = secrets.token_hex(3).upper()

    # Create session
    valid_until = datetime.now(timezone.utc) + timedelta(minutes=req.duration_minutes)
    new_session = AttendanceSession(
        schedule_id=req.schedule_id,
        lecturer_id=lecturer.id,
        session_code=session_code,
        status="active",
        valid_until=valid_until
    )
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)

    return StartSessionResponse(
        session_id=new_session.id,
        session_code=new_session.session_code,
        valid_until=new_session.valid_until
    )

@router.post("/submit", response_model=SubmitAttendanceResponse)
async def submit_attendance(
    req: SubmitAttendanceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Ensure user is a student
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Hanya mahasiswa yang bisa melakukan absen.")

    # Get student
    student_res = await db.execute(select(Student).filter(Student.user_id == current_user["id"]))
    student = student_res.scalars().first()
    if not student:
        raise HTTPException(status_code=404, detail="Profil mahasiswa tidak ditemukan.")

    # Find active session by code
    session_res = await db.execute(select(AttendanceSession).filter(
        AttendanceSession.session_code == req.session_code,
        AttendanceSession.status == "active"
    ))
    session = session_res.scalars().first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Kode sesi absensi tidak valid atau sesi telah ditutup.")

    if datetime.now(timezone.utc) > session.valid_until.replace(tzinfo=timezone.utc):
        # Auto-close expired session
        session.status = "closed"
        await db.commit()
        raise HTTPException(status_code=400, detail="Sesi absensi telah berakhir.")

    # Check if already submitted
    existing_record_res = await db.execute(select(AttendanceRecord).filter(
        AttendanceRecord.session_id == session.id,
        AttendanceRecord.student_id == student.id
    ))
    if existing_record_res.scalars().first():
        return SubmitAttendanceResponse(status="already_present", message="Anda sudah melakukan absensi untuk sesi ini.")

    # Record attendance
    new_record = AttendanceRecord(
        session_id=session.id,
        student_id=student.id,
        status="present",
        location_lat=req.location_lat,
        location_lng=req.location_lng
    )
    db.add(new_record)
    await db.commit()

    return SubmitAttendanceResponse(status="success", message="Absensi berhasil dicatat.")
