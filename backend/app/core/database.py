import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://campusai:password123@localhost:5432/campusai_db")

engine = create_async_engine(
    DATABASE_URL, 
    echo=False,  # Set False in production/high load to reduce overhead
    pool_size=20,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
SessionLocal = AsyncSessionLocal # Backward compatibility alias

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
