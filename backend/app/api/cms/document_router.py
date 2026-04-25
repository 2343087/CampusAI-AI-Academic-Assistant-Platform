import os
import shutil
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from app.core.database import get_db
from app.core.security import require_role
from app.models.all import Document
from app.services.ai.vector_store import vector_service
from sqlalchemy import select

router = APIRouter(prefix="/documents", tags=["cms-documents"])

UPLOAD_DIR = "uploads/knowledge"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form("peraturan"),
    prodi: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin", "developer")),
):
    """Upload a PDF document, save to disk, and ingest into RAG vector store."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Hanya file PDF yang didukung saat ini.")

    file_path = os.path.join(UPLOAD_DIR, f"{title.replace(' ', '_')}_{file.filename}")
    
    # Save file to disk
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menyimpan file: {str(e)}")

    # Create DB record
    new_doc = Document(
        title=title,
        file_path=file_path,
        content_type="pdf",
        category=category,
        prodi=prodi,
        is_processed=0
    )
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)

    # Ingest directly to Vector Store for immediate availability
    try:
        metadata = {"title": title, "category": category}
        if prodi:
            metadata["prodi"] = prodi
            
        await vector_service.ingest_pdf(file_path, metadata)
        
        # Update DB status
        new_doc.is_processed = 1
        await db.commit()
        
        return {
            "status": "success",
            "document_id": new_doc.id,
            "message": f"Dokumen '{title}' berhasil diproses dan masuk ke memori AI."
        }
    except Exception as e:
        new_doc.is_processed = -1
        await db.commit()
        raise HTTPException(status_code=500, detail=f"Gagal memicu background task: {str(e)}")

@router.get("/")
async def list_documents(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin", "developer")),
):
    """List all institutional knowledge documents."""
    stmt = select(Document).order_by(Document.uploaded_at.desc())
    result = await db.execute(stmt)
    docs = result.scalars().all()
    return docs

@router.delete("/{doc_id}")
async def delete_document(
    doc_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin", "developer")),
):
    """Delete document and its file (vector store cleanup is manual in this version)."""
    stmt = select(Document).where(Document.id == doc_id)
    result = await db.execute(stmt)
    doc = result.scalars().first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan.")
        
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
        
    await db.delete(doc)
    await db.commit()
    return {"message": "Dokumen berhasil dihapus."}
