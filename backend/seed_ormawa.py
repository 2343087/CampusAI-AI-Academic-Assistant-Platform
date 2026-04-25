import asyncio
from app.core.database import SessionLocal
from app.models.all import Ormawa

async def seed_ormawa():
    async with SessionLocal() as db:
        ormawas = [
            Ormawa(name="BEM Universitas", category="BEM", description="Badan Eksekutif Mahasiswa tingkat universitas."),
            Ormawa(name="HIMA Informatika", category="HIMA", description="Himpunan Mahasiswa program studi Teknik Informatika."),
            Ormawa(name="UKM Robotika", category="UKM", description="Unit Kegiatan Mahasiswa di bidang riset dan pengembangan robotika."),
            Ormawa(name="UKM Paduan Suara", category="UKM", description="Paduan suara mahasiswa CampusAI divisi seni."),
        ]
        db.add_all(ormawas)
        await db.commit()
        print("✅ Ormawa seeded successfully.")

import sys

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(seed_ormawa())
