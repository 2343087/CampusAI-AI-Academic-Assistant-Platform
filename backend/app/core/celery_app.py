from celery import Celery
import os
import sys

# Hack Fix for Python 3.14 + Kombu/Redis incompatibility
try:
    import redis
    if redis is None or not hasattr(redis, "Redis"):
        import redis.asyncio
        sys.modules["redis"] = redis
except ImportError:
    pass

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "campusai_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Jakarta",
    enable_utc=True,
)

from celery.schedules import crontab

# Auto-discover tasks
celery_app.autodiscover_tasks(["app.services.notifications"])

# Configure Beat Schedule
celery_app.conf.beat_schedule = {
    "check-academic-deadlines-every-6h": {
        "task": "app.tasks.check_deadlines",
        "schedule": crontab(hour="*/6", minute=0),
    },
    "send-morning-briefing-8am": {
        "task": "app.tasks.morning_briefing",
        "schedule": crontab(hour=8, minute=0),
    },
}
