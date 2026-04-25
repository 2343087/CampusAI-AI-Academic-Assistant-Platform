from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from app.services.ai.engine import ai_engine, clean_text
from app.services.ai.memory import chat_memory
from app.services.ai.vector_store import vector_service
from app.core.security import get_current_user, require_role
from app.core.database import get_db
from app.models.all import ChatHistory, User, Student, Enrollment, Course
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.responses import StreamingResponse
import json
import asyncio
import os
import groq

router = APIRouter(prefix="/chat", tags=["chat"])

client = groq.Groq(api_key=os.getenv("GROQ_API_KEY"))


class ChatRequest(BaseModel):
    message: str


class IngestRequest(BaseModel):
    text: str
    title: Optional[str] = None
    category: str = "faq"
    prodi: str = "umum"
    year: Optional[int] = None
    priority: str = "normal"


async def classify_intent(message: str):
    """Classify user intent to route to RAG, DB, or Hybrid."""
    prompt = f"""
    Classify the user intent into one of these:
    - PERSONAL: Queries about student's own grades, schedule, or progress.
    - KNOWLEDGE: Queries about university rules, FAQs, or general info.
    - STRATEGY: Complex queries requiring both personal data and rules.
    - GENERAL: Greetings or unrelated talk.
    
    User message: "{message}"
    Return ONLY the category name.
    """
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )
    return completion.choices[0].message.content.strip().upper()


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Stream chat response — authenticated. Saves full response to DB after completion."""
    user_id = str(current_user.get("user_id", ""))
    chat_memory_text = await chat_memory.get_history(user_id)

    async def event_generator():
        full_response = ""
        async for chunk in ai_engine.astream_response(
            query=request.message,
            user_id=user_id,
            db=db,
            chat_history=chat_memory_text,
        ):
            full_response += chunk
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"

        # Save to SQL for permanent logs ONLY AFTER completion
        new_history = ChatHistory(
            user_id=int(user_id),
            query=clean_text(request.message),
            response=clean_text(full_response),
            intent="hybrid",
        )
        db.add(new_history)
        await db.commit()
        
        # Save to Redis for fast session memory ONLY AFTER completion
        await chat_memory.add_message(user_id, request.message, full_response)
        
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/")
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Chat with AI — authenticated. Saves history to DB."""
    try:
        user_id = str(current_user.get("user_id", ""))

        # Get memory from Redis
        chat_memory_text = await chat_memory.get_history(user_id)

        # Get AI response
        response = await ai_engine.get_response(
            query=request.message,
            user_id=user_id,
            db=db,
            chat_history=chat_memory_text,
        )

        # Save to SQL
        if user_id.isdigit():
            new_history = ChatHistory(
                user_id=int(user_id),
                query=clean_text(request.message),
                response=clean_text(response["answer"]),
                intent=response.get("intent", "unknown"),
            )
            db.add(new_history)
            await db.commit()
            
            # Save to Redis
            await chat_memory.add_message(user_id, request.message, response["answer"])

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_chat_history(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get chat history for the current user."""
    user_id = current_user.get("user_id")
    if not user_id:
        return []

    stmt = (
        select(ChatHistory)
        .filter(ChatHistory.user_id == user_id)
        .order_by(ChatHistory.timestamp.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    chats = result.scalars().all()
    chats.reverse()

    return [
        {
            "id": c.id,
            "query": c.query,
            "response": c.response,
            "intent": c.intent,
            "timestamp": c.timestamp.isoformat() if c.timestamp else None,
        }
        for c in chats
    ]


@router.delete("/history")
async def clear_chat_history(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Clear all chat history for the current user (SQL & Redis)."""
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        # 1. Clear SQL
        from sqlalchemy import delete
        stmt = delete(ChatHistory).where(ChatHistory.user_id == user_id)
        await db.execute(stmt)
        await db.commit()

        # 2. Clear Redis Memory
        await chat_memory.clear_history(str(user_id))

        return {"status": "success", "message": "History cleared"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ingest/url")
async def ingest_url(
    url: str,
    category: str = "knowledge",
    prodi: str = "umum",
    year: Optional[int] = None,
    priority: str = "normal",
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin", "developer")),
):
    """Scrape a URL and add to RAG knowledge base with metadata."""
    import requests
    from bs4 import BeautifulSoup
    from app.services.ai.engine import clean_text
    from app.models.all import Document
    
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        }

        content_type = "url_web"
        title = f"Web: {url[:30]}..."
        clean_content = ""

        # Check if YouTube URL
        if "youtube.com" in url or "youtu.be" in url:
            from youtube_transcript_api import YouTubeTranscriptApi
            video_id = None
            if "youtube.com/watch?v=" in url: video_id = url.split("v=")[1].split("&")[0]
            elif "youtu.be/" in url: video_id = url.split("youtu.be/")[1].split("?")[0]
            
            if not video_id: raise Exception("ID Video YouTube tidak ditemukan")
            
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=['id', 'en'])
            text = " ".join([t['text'] for t in transcript_list])
            clean_content = clean_text(text)
            content_type = "url_youtube"
            title = f"YouTube: {video_id}"
        else:
            res = requests.get(url, headers=headers, timeout=15)
            res.raise_for_status()
            soup = BeautifulSoup(res.text, "html.parser")
            for element in soup(["script", "style", "nav", "footer", "header"]): element.extract()
            text = soup.get_text(separator=" ", strip=True)
            clean_content = clean_text(text)
            title = soup.title.string[:100] if soup.title else f"Web: {url[:30]}..."

        if len(clean_content) < 50:
            raise Exception("Konten website terlalu pendek atau tidak dapat diakses.")

        # Save to DB
        db_doc = Document(
            title=title, file_path=url, content_type=content_type,
            category=category, prodi=prodi, year=year, priority=priority, is_processed=0
        )
        db.add(db_doc)
        await db.commit()
        await db.refresh(db_doc)

        metadata = {
            "document_id": db_doc.id, "source": url, "type": content_type,
            "title": title, "prodi": prodi, "year": year, "priority": priority
        }
        chunks = await vector_service.add_documents([clean_content], [metadata])
        
        db_doc.is_processed = 1
        db_doc.chunk_count = chunks
        await db.commit()
        
        return {"status": "success", "chunks": chunks, "document_id": db_doc.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengambil data: {str(e)}")


@router.post("/ingest")
async def ingest_knowledge(
    request: IngestRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin", "developer")),
):
    """Add raw text knowledge to RAG."""
    from app.models.all import Document
    try:
        title = request.title or f"Text: {request.text[:30]}..."
        
        db_doc = Document(
            title=title, file_path="raw_text", content_type="text",
            category=request.category, prodi=request.prodi,
            year=request.year, priority=request.priority, is_processed=0
        )
        db.add(db_doc)
        await db.commit()
        await db.refresh(db_doc)

        metadata = {
            "document_id": db_doc.id, "prodi": request.prodi, "type": "text",
            "category": request.category, "year": request.year, "priority": request.priority
        }
        
        chunks = await vector_service.add_documents([request.text], [metadata])
        
        db_doc.is_processed = 1
        db_doc.chunk_count = chunks
        await db.commit()
        
        return {"status": "success", "chunks": chunks, "document_id": db_doc.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
