from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.all import User, Student, UserRole
from pydantic import BaseModel, EmailStr
from typing import Optional

router = APIRouter(prefix="/auth", tags=["auth"])

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.STUDENT
    nim: Optional[str] = None
    prodi: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

@router.post("/register", response_model=Token)
async def register(user_in: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new user with atomic transaction."""
    try:
        # 1. Check Email & NIM Existence first
        result_email = await db.execute(select(User).filter(User.email == user_in.email))
        if result_email.scalars().first():
            raise HTTPException(status_code=400, detail="Email sudah terdaftar.")

        if user_in.role == UserRole.STUDENT and user_in.nim:
            result_nim = await db.execute(select(Student).filter(Student.nim == user_in.nim))
            if result_nim.scalars().first():
                raise HTTPException(status_code=400, detail="NIM sudah terdaftar.")

        # 2. Create User
        new_user = User(
            email=user_in.email,
            hashed_password=get_password_hash(user_in.password),
            full_name=user_in.full_name,
            role=user_in.role.value,
        )
        db.add(new_user)
        await db.flush()  # Get ID without committing

        # 3. Create Student record if applicable
        if user_in.role == UserRole.STUDENT and user_in.nim:
            student = Student(
                user_id=new_user.id,
                nim=user_in.nim,
                prodi=user_in.prodi or "Umum",
            )
            db.add(student)

        # 4. Final Commit
        await db.commit()
        await db.refresh(new_user)

        access_token = create_access_token(
            data={"sub": new_user.email, "role": new_user.role, "user_id": new_user.id}
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": new_user.id,
                "email": new_user.email,
                "full_name": new_user.full_name,
                "role": new_user.role,
            },
        }
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Registrasi gagal: {str(e)}")

@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login with JSON data (email + password)."""
    result = await db.execute(select(User).filter(User.email == login_data.email))
    user = result.scalars().first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah",
        )

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "user_id": user.id}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
        },
    }

@router.get("/me")
async def get_me(
    db: AsyncSession = Depends(get_db),
    # Support traditional OAuth2 header
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)),
):
    """Get current user info."""
    if not token:
         raise HTTPException(status_code=401, detail="Token missing")
         
    from app.core.security import get_current_user
    user_data = await get_current_user(token)

    result = await db.execute(select(User).filter(User.email == user_data["email"]))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
    }
