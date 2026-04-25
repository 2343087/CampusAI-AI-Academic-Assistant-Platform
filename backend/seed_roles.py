import asyncio
import sys
import selectors
from dotenv import load_dotenv

# Load .env variables before importing database
load_dotenv()

# Fix Windows ProactorEventLoop issue with psycopg
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.core.database import SessionLocal
from app.models.all import User, Student, UserRole
from app.core.security import get_password_hash
from sqlalchemy import select

async def seed_roles():
    async with SessionLocal() as db:
        # 1. Seed Lecturer
        lecturer_email = "lecturer@campusai.id"
        res = await db.execute(select(User).filter(User.email == lecturer_email))
        if not res.scalars().first():
            lecturer = User(
                email=lecturer_email,
                hashed_password=get_password_hash("lecturer123"),
                full_name="Dr. Aris Purwanto, M.Kom",
                role=UserRole.LECTURER.value
            )
            db.add(lecturer)
            print(f"SUCCESS: Lecturer seeded: {lecturer_email}")

        # 2. Seed Admin
        admin_email = "admin@campusai.id"
        res = await db.execute(select(User).filter(User.email == admin_email))
        if not res.scalars().first():
            admin = User(
                email=admin_email,
                hashed_password=get_password_hash("admin123"),
                full_name="System Admin",
                role=UserRole.ADMIN.value
            )
            db.add(admin)
            print(f"SUCCESS: Admin seeded: {admin_email}")

        await db.commit()

if __name__ == "__main__":
    asyncio.run(seed_roles())
