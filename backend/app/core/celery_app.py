from celery import Celery
from celery.schedules import crontab
import os

# Using Redis as the broker and backend
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "fixnest_tasks",
    broker=redis_url,
    backend=redis_url,
    include=["app.tasks.celery_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
)

# Celery Beat Schedule for recurring background processes
celery_app.conf.beat_schedule = {
    "escalate-complaints-every-hour": {
        "task": "app.tasks.celery_tasks.auto_escalate_complaints",
        "schedule": crontab(minute=0, hour="*"), # Triggers every hour globally
    },
    "send-service-reminders-daily": {
        "task": "app.tasks.celery_tasks.send_service_reminders",
        "schedule": crontab(minute=0, hour=9), # Triggers strictly every day at 9:00 AM
    }
}
