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
    prodi: Optional[str] = Form("umum"),
    year: Optional[int] = Form(None),
    priority: Optional[str] = Form("normal"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin", "developer")),
):
    """Upload a PDF document with rich metadata."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Hanya file PDF yang didukung.")

    file_path = os.path.join(UPLOAD_DIR, f"{title.replace(' ', '_')}_{file.filename}")
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menyimpan file: {str(e)}")

    new_doc = Document(
        title=title,
        file_path=file_path,
        content_type="pdf",
        category=category,
        prodi=prodi,
        year=year,
        priority=priority,
        is_processed=0
    )
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)

    try:
        metadata = {
            "document_id": new_doc.id,
            "title": title, 
            "category": category,
            "prodi": new_doc.prodi,
            "year": year,
            "priority": priority,
            "source": file_path
        }
            
        chunks = await vector_service.ingest_pdf(file_path, metadata)
        
        new_doc.is_processed = 1
        new_doc.chunk_count = chunks
        await db.commit()
        
        return {"status": "success", "document_id": new_doc.id, "chunks": chunks}
    except Exception as e:
        new_doc.is_processed = -1
        await db.commit()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload/csv")
async def upload_csv(
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form("dosen"),
    prodi: Optional[str] = Form("umum"),
    year: Optional[int] = Form(None),
    priority: Optional[str] = Form("normal"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin", "developer")),
):
    """Upload CSV/Excel knowledge."""
    if not file.filename.endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Format file tidak didukung (Gunakan CSV/Excel).")

    file_path = os.path.join(UPLOAD_DIR, f"data_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    new_doc = Document(
        title=title, file_path=file_path, content_type="csv",
        category=category, prodi=prodi, year=year, priority=priority, is_processed=0
    )
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)

    try:
        metadata = {"document_id": new_doc.id, "title": title, "category": category, "prodi": prodi, "year": year, "priority": priority}
        chunks = await vector_service.ingest_csv(file_path, metadata)
        new_doc.is_processed = 1
        new_doc.chunk_count = chunks
        await db.commit()
        return {"status": "success", "chunks": chunks}
    except Exception as e:
        new_doc.is_processed = -1
        await db.commit()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload/bulk")
async def upload_bulk(
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form("knowledge"),
    prodi: Optional[str] = Form("umum"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin", "developer")),
):
    """Bulk import via ZIP."""
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Hanya file ZIP yang didukung.")

    file_path = os.path.join(UPLOAD_DIR, f"bulk_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    new_doc = Document(
        title=title, file_path=file_path, content_type="zip",
        category=category, prodi=prodi, is_processed=0
    )
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)

    try:
        metadata = {"document_id": new_doc.id, "title": title, "category": category, "prodi": prodi}
        chunks = await vector_service.ingest_zip(file_path, metadata)
        new_doc.is_processed = 1
        new_doc.chunk_count = chunks
        await db.commit()
        return {"status": "success", "chunks": chunks}
    except Exception as e:
        new_doc.is_processed = -1
        await db.commit()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Get global vector database stats."""
    from sqlalchemy import func
    
    # Get document count
    doc_count_stmt = select(func.count(Document.id))
    doc_res = await db.execute(doc_count_stmt)
    total_docs = doc_res.scalar()
    
    # Get total chunk count
    chunk_count_stmt = select(func.sum(Document.chunk_count))
    chunk_res = await db.execute(chunk_count_stmt)
    total_chunks = chunk_res.scalar() or 0
    
    return {
        "total_docs": total_docs,
        "total_chunks": total_chunks,
        "collection": "campus_knowledge",
        "embedding": "all-MiniLM-L6-v2",
        "reranking_active": False,
        "metadata_filter_active": True
    }

@router.get("/")
async def list_documents(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin", "developer")),
):
    """List all documents."""
    stmt = select(Document).order_by(Document.uploaded_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.delete("/{doc_id}")
async def delete_document(
    doc_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin", "developer")),
):
    """Delete document and chunks."""
    stmt = select(Document).where(Document.id == doc_id)
    result = await db.execute(stmt)
    doc = result.scalars().first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
        
    if os.path.exists(doc.file_path):
        try: os.remove(doc.file_path)
        except: pass
        
    try:
        vector_service.delete_by_document_id(doc_id)
    except Exception as e:
        print(f"⚠️ Vector DB Error: {str(e)}")

    await db.delete(doc)
    await db.commit()
    return {"message": "Deleted successfully"}
