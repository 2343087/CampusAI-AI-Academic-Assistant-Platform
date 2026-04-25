from fastapi import APIRouter, Depends
from app.core.security import require_role
from typing import List, Dict
import random

router = APIRouter(prefix="/cms", tags=["cms"])

# Mock data — will be replaced with real metrics in Phase 2
MOCK_LOGS = [
    {"id": 1, "user": "Student_001", "query": "Kapan deadline KRS?", "response": "Deadline KRS adalah 15 Agustus 2026.", "latency": 0.45, "timestamp": "2026-04-24T21:00:00Z"},
    {"id": 2, "user": "Student_042", "query": "Siapa dosen wali saya?", "response": "Dosen wali Anda adalah Dr. Budi Santoso.", "latency": 0.32, "timestamp": "2026-04-24T21:05:00Z"},
]


@router.get("/health")
async def get_system_health(
    current_user: dict = Depends(require_role("admin", "developer")),
):
    """Admin/Dev only — system health check."""
    return {
        "status": "healthy",
        "uptime": "14d 6h 32m",
        "services": {
            "database": "connected",
            "redis": "connected",
            "chroma": "connected",
            "openai_api": "active",
        },
        "resources": {
            "cpu_usage": f"{random.randint(5, 15)}%",
            "memory_usage": f"{random.randint(200, 400)}MB",
        },
    }


@router.get("/logs")
async def get_ai_logs(
    current_user: dict = Depends(require_role("admin", "developer")),
):
    """Admin/Dev only — AI interaction logs."""
    return MOCK_LOGS


@router.get("/stats/cost")
async def get_cost_stats(
    current_user: dict = Depends(require_role("admin", "developer")),
):
    """Admin/Dev only — AI cost monitoring."""
    return {
        "daily_cost": [
            {"date": "2026-04-18", "cost": 0.45},
            {"date": "2026-04-19", "cost": 0.82},
            {"date": "2026-04-20", "cost": 0.55},
            {"date": "2026-04-21", "cost": 1.20},
            {"date": "2026-04-22", "cost": 0.90},
            {"date": "2026-04-23", "cost": 1.50},
            {"date": "2026-04-24", "cost": 1.10},
        ],
        "total_month": 18.45,
        "quota_remaining": 81.55,
    }
