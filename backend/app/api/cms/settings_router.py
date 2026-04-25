from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import require_role
from app.models.all import SystemSetting
import json
from typing import List, Dict, Any

router = APIRouter(prefix="/settings", tags=["cms-settings"])

DEFAULT_SETTINGS = {
    "knowledge_categories": [
        "Peraturan Kampus", "Kalender Akademik", "FAQ Mahasiswa", 
        "Kurikulum", "Info Beasiswa", "Prosedur Skripsi", 
        "Info Dosen", "Kegiatan ORMAWA", "Layanan Kampus"
    ],
    "knowledge_prodi": [
        "Semua prodi", "Teknik Informatika", "Sistem Informasi", 
        "Manajemen", "Hukum", "Kedokteran", "Teknik Sipil"
    ],
    "knowledge_years": [2024, 2025, 2026],
    "knowledge_priorities": ["low", "normal", "high"]
}

@router.get("/knowledge-base")
async def get_kb_settings(db: AsyncSession = Depends(get_db)):
    """Fetch knowledge base list settings."""
    keys = list(DEFAULT_SETTINGS.keys())
    stmt = select(SystemSetting).where(SystemSetting.key.in_(keys))
    result = await db.execute(stmt)
    settings = result.scalars().all()
    
    settings_dict = {s.key: json.loads(s.value) for s in settings}
    
    # Fill defaults if missing
    for key, val in DEFAULT_SETTINGS.items():
        if key not in settings_dict:
            settings_dict[key] = val
            
    return settings_dict

@router.post("/knowledge-base/{key}")
async def update_kb_setting(
    key: str, 
    values: List[Any], 
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin", "developer"))
):
    """Update a specific setting list."""
    if key not in DEFAULT_SETTINGS:
        raise HTTPException(status_code=400, detail="Invalid setting key")
        
    stmt = select(SystemSetting).where(SystemSetting.key == key)
    result = await db.execute(stmt)
    setting = result.scalars().first()
    
    if setting:
        setting.value = json.dumps(values)
    else:
        new_setting = SystemSetting(key=key, value=json.dumps(values))
        db.add(new_setting)
        
    await db.commit()
    return {"status": "success", "message": f"Setting {key} updated.", "data": values}
