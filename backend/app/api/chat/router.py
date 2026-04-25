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
    metadata: Optional[dict] = None


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
    current_user: dict = Depends(require_role("admin", "developer")),
):
    """Admin only — scrape a URL and add to RAG knowledge base."""
    import requests
    from bs4 import BeautifulSoup
    from app.services.ai.engine import clean_text
    
    try:
        # Check if YouTube URL
        if "youtube.com" in url or "youtu.be" in url:
            from youtube_transcript_api import YouTubeTranscriptApi
            import re
            
            # Extract video ID
            video_id = None
            if "youtube.com/watch?v=" in url:
                video_id = url.split("v=")[1].split("&")[0]
            elif "youtu.be/" in url:
                video_id = url.split("youtu.be/")[1].split("?")[0]
            
            if not video_id:
                raise Exception("ID Video YouTube tidak ditemukan")
            
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=['id', 'en'])
            text = " ".join([t['text'] for t in transcript_list])
            clean_content = clean_text(text)
            
            count = await vector_service.add_documents(
                [clean_content],
                [{"source": url, "type": "youtube_transcript", "video_id": video_id}]
            )
            return {"status": "success", "url": url, "type": "youtube", "chunks_added": count}

        # Standard Web Scrape
        res = requests.get(url, timeout=10)
        soup = BeautifulSoup(res.text, "html.parser")
        
        # Remove script/style elements
        for script in soup(["script", "style"]):
            script.extract()
            
        text = soup.get_text(separator=" ", strip=True)
        clean_content = clean_text(text)
        
        count = await vector_service.add_documents(
            [clean_content],
            [{"source": url, "type": "web_scrape"}]
        )
        return {"status": "success", "url": url, "type": "web", "chunks_added": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scraping failed: {str(e)}")


@router.post("/ingest")
async def ingest_knowledge(
    request: IngestRequest,
    current_user: dict = Depends(require_role("admin", "developer")),
):
    """Admin/Developer only — add knowledge to RAG vector store."""
    try:
        count = await vector_service.add_documents(
            [request.text],
            [request.metadata] if request.metadata else None,
        )
        return {"status": "success", "chunks_added": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
