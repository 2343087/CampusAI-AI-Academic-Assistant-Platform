import asyncio
import os
import sys
from dotenv import load_dotenv

load_dotenv()

# Add backend to sys.path so we can import app
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.all import User, UserRole
from sqlalchemy import select

async def seed_db():
    print("🚀 Connecting to database to create tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        email = "dev@campusai.com"
        result = await db.execute(select(User).filter(User.email == email))
        user = result.scalars().first()

        if not user:
            print(f"🌱 Creating seed user: {email}...")
            new_user = User(
                email=email,
                hashed_password=get_password_hash("admin123"),
                full_name="Main Developer",
                role=UserRole.DEVELOPER
            )
            db.add(new_user)
            await db.commit()
            print("✅ Seed user created successfully!")
        else:
            print("✨ Seed user already exists.")

if __name__ == "__main__":
    asyncio.run(seed_db())
