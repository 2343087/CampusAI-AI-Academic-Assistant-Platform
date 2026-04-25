from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.security import get_current_user, require_role
from app.tasks.notifications import send_whatsapp_notification, send_push_notification

router = APIRouter(prefix="/notifications", tags=["notifications"])


class WANotificationRequest(BaseModel):
    phone: str
    message: str


class PushNotificationRequest(BaseModel):
    user_id: str
    title: str
    body: str


from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.all import Notification


@router.get("/active")
async def get_active_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Fetch unread notifications for the current user."""
    user_id = current_user.get("user_id")
    if not user_id:
        return []

    stmt = (
        select(Notification)
        .where(Notification.user_id == user_id)
        .where(Notification.is_read == 0)
        .order_by(Notification.created_at.desc())
        .limit(10)
    )
    result = await db.execute(stmt)
    notifs = result.scalars().all()

    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notifs
    ]


@router.post("/whatsapp")
async def trigger_whatsapp(
    request: WANotificationRequest,
    current_user: dict = Depends(require_role("admin", "developer")),
):
    """Admin/Developer only — dispatch WhatsApp notification via Celery."""
    task = send_whatsapp_notification.delay(request.phone, request.message)
    return {"status": "queued", "task_id": task.id}


@router.post("/push")
async def trigger_push(
    request: PushNotificationRequest,
    current_user: dict = Depends(require_role("admin", "developer")),
):
    """Admin/Developer only — dispatch push notification via Celery."""
    task = send_push_notification.delay(request.user_id, request.title, request.body)
    return {"status": "queued", "task_id": task.id}
