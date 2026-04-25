from dotenv import load_dotenv
load_dotenv()

import os
import sys

# Force UTF-8 for Windows legacy environments
os.environ["PYTHONUTF8"] = "1"
os.environ["PGCLIENTENCODING"] = "utf-8"

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.cms.router import router as cms_router
from app.api.cms.document_router import router as doc_router
from app.api.chat.router import router as chat_router
from app.api.auth.router import router as auth_router
from app.api.academic.router import router as academic_router
from app.api.academic.thesis_router import router as thesis_router
from app.api.notifications.router import router as notification_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup & shutdown logic — replaces deprecated on_event."""
    # --- STARTUP ---
    from app.core.database import engine, Base
    import app.models.all  # Ensure all models are loaded
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables ready.")

    yield  # App is running

    # --- SHUTDOWN ---
    print("🔻 Shutting down CampusAI API...")


app = FastAPI(
    title="CampusAI API",
    description="API for CampusAI - AI Academic Assistant Platform",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS Configuration — restricted origins
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(auth_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(academic_router, prefix="/api")
app.include_router(thesis_router, prefix="/api")
app.include_router(cms_router, prefix="/api")
app.include_router(doc_router, prefix="/api/cms")
app.include_router(notification_router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "Welcome to CampusAI API", "status": "online", "version": "0.1.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
