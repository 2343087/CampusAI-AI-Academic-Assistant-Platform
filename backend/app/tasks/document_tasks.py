from app.core.celery_app import celery_app
from app.services.ai.vector_store import vector_service
from app.core.database import AsyncSessionLocal
from app.models.all import Document
from sqlalchemy import update
import asyncio
import logging

logger = logging.getLogger(__name__)

@celery_app.task(name="process_document_task")
def process_document_task(doc_id: int, file_path: str, metadata: dict = None):
    """Background task to process PDF and add to vector store."""
    
    # Since Celery is sync, and our services are async, we use asyncio.run
    async def run_ingestion():
        try:
            # 1. Ingest to Vector Store
            await vector_service.ingest_pdf(file_path, metadata)
            
            # 2. Update DB status
            async with AsyncSessionLocal() as db:
                await db.execute(
                    update(Document)
                    .where(Document.id == doc_id)
                    .values(is_processed=1)
                )
                await db.commit()
            
            logger.info(f"✅ Document {doc_id} processed successfully.")
            
        except Exception as e:
            logger.error(f"❌ Failed to process document {doc_id}: {str(e)}")
            async with AsyncSessionLocal() as db:
                await db.execute(
                    update(Document)
                    .where(Document.id == doc_id)
                    .values(is_processed=-1)
                )
                await db.commit()

    asyncio.run(run_ingestion())
