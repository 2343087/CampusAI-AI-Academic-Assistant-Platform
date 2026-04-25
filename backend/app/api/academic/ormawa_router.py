from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.all import Ormawa, OrmawaMember, Student
from pydantic import BaseModel

router = APIRouter(prefix="/ormawa", tags=["ormawa"])

class JoinOrmawaRequest(BaseModel):
    ormawa_id: int

@router.get("/")
async def get_all_ormawas(db: AsyncSession = Depends(get_db)):
    """List all available ORMAWAs."""
    result = await db.execute(select(Ormawa))
    ormawas = result.scalars().all()
    return [{"id": o.id, "name": o.name, "category": o.category, "description": o.description} for o in ormawas]

@router.post("/join")
async def join_ormawa(
    req: JoinOrmawaRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Student joins an ORMAWA."""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Hanya mahasiswa yang dapat bergabung dengan ORMAWA.")

    # Get student
    student_res = await db.execute(select(Student).filter(Student.user_id == current_user["id"]))
    student = student_res.scalars().first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Profil mahasiswa tidak ditemukan.")

    # Check if ormawa exists
    ormawa_res = await db.execute(select(Ormawa).filter(Ormawa.id == req.ormawa_id))
    if not ormawa_res.scalars().first():
        raise HTTPException(status_code=404, detail="ORMAWA tidak ditemukan.")

    # Check if already joined
    existing = await db.execute(
        select(OrmawaMember).filter(OrmawaMember.ormawa_id == req.ormawa_id, OrmawaMember.student_id == student.id)
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Anda sudah bergabung di ORMAWA ini.")

    # Join
    new_member = OrmawaMember(ormawa_id=req.ormawa_id, student_id=student.id, role="member")
    db.add(new_member)
    await db.commit()

    return {"status": "success", "message": "Berhasil bergabung ke ORMAWA."}

@router.get("/my")
async def get_my_ormawas(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get ORMAWAs joined by current student."""
    if current_user.get("role") != "student":
        return []

    student_res = await db.execute(select(Student).filter(Student.user_id == current_user["id"]))
    student = student_res.scalars().first()
    if not student:
        return []

    result = await db.execute(
        select(Ormawa, OrmawaMember)
        .join(OrmawaMember)
        .filter(OrmawaMember.student_id == student.id)
    )
    
    return [
        {
            "id": ormawa.id,
            "name": ormawa.name,
            "category": ormawa.category,
            "role": member.role,
            "joined_at": member.joined_at.isoformat() if member.joined_at else None
        }
        for ormawa, member in result.all()
    ]
