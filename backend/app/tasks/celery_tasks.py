import logging
from datetime import datetime, timedelta
from app.core.celery_app import celery_app
from app.db.database import SessionLocal
from app.models.all_models import Booking, Complaint, Visitor
from app.core.webhooks import WebhookManager
from app.core.scheduler import process_queues

logger = logging.getLogger("Celery-Tasks")

@celery_app.task
def process_queues_task():
    print("Celery task executed: process_queues_task")
    logger.info("Executing process_queues_task remotely via Celery API endpoint...")
    db = SessionLocal()
    try:
        process_queues(db)
    except Exception as e:
        logger.error(f"Error executing process_queues_task: {e}")
    finally:
        db.close()
    return "Queues processed"

@celery_app.task
def auto_escalate_complaints():
    print("Celery task executed: auto_escalate_complaints")
    logger.info("Executing auto_escalate_complaints background task...")
    db = SessionLocal()
    try:
        # Escalate any complaints stuck 'pending' or 'assigned' for > 24 hours
        threshold = datetime.utcnow() - timedelta(hours=24)
        stale_complaints = db.query(Complaint).filter(
            Complaint.status.in_(["pending", "assigned_for_resolution"]),
            Complaint.created_at < threshold
        ).all()
        
        for c in stale_complaints:
            # Force max priority level
            c.priority = 1
            WebhookManager._send_notification("complaint_escalated_SLA_breach", {
                "complaint_id": c.id, 
                "customer": c.customer.email if c.customer else "Unknown", 
                "message": "Automated Escalation: Unresolved for > 24 hours! Priority forced to Level 1."
            }, ["email", "sms"])

        db.commit()
        
        if stale_complaints:
            # Directly trigger scheduler heuristic logic to re-evaluate assignments
            logger.info(f"Escalated {len(stale_complaints)} complaints natively. Reprocessing system queues...")
            process_queues(db)
            
    except Exception as e:
        logger.error(f"Error executing auto_escalate_complaints: {e}")
    finally:
        db.close()
    return "Operations Processed"

@celery_app.task
def check_visitor_overstays():
    print("Celery task executed: check_visitor_overstays")
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        # Find Checked-IN visitors whose expected_check_out_time has passed
        overstayed = db.query(Visitor).filter(
            Visitor.status == "Checked-IN",
            Visitor.expected_check_out_time < now
        ).all()
        
        for v in overstayed:
            v.status = "Overstay"
            # Alert implementation - Notify Resident
            if v.resident and v.resident.email:
                try:
                    WebhookManager.trigger_visitor_overstay(
                        user_email=v.resident.email,
                        visitor_name=v.name,
                        flat_id=v.flat_id,
                        checkout_time=v.expected_check_out_time.strftime("%Y-%m-%d %H:%M") if v.expected_check_out_time else "N/A"
                    )
                except Exception as e:
                    logger.error(f"Failed to send overstay alert for visitor {v.id}: {e}")
            
            logger.warning(f"SECURITY ALERT: Visitor {v.name} (Token: {v.secure_token}) has exceeded expected stay in Flat {v.flat_id}!")
            
        db.commit()
        return f"Detected {len(overstayed)} overstayed visitors"
    except Exception as e:
        logger.error(f"Error executing check_visitor_overstays: {e}")
    finally:
        db.close()
    return "Overstay check completed"

@celery_app.task
def send_service_reminders():
    print("Celery task executed: send_service_reminders")
    logger.info("Executing recurring send_service_reminders task...")
    db = SessionLocal()
    reminded_users = set()
    try:
        # Find explicit tasks from ~6 months ago (Time to clean fan/AC/tank)
        six_months_ago = datetime.utcnow() - timedelta(days=180)
        window_start = six_months_ago - timedelta(days=1)
        window_end = six_months_ago + timedelta(days=1)
        
        old_bookings = db.query(Booking).filter(
            Booking.created_at > window_start,
            Booking.created_at < window_end,
            Booking.status == "completed"
        ).all()
        
        for b in old_bookings:
            if b.customer_id not in reminded_users and b.customer:
                WebhookManager._send_notification("recurring_service_reminder", {
                    "user_email": b.customer.email,
                    "message": f"Hi FixNest Customer! It has been roughly 6 months since your last {b.service.category} service call. Proactive maintenance is recommended! Time to book a checkup!"
                }, ["email", "whatsapp"])
                reminded_users.add(b.customer_id)
                
    except Exception as e:
        logger.error(f"Error in send_service_reminders loop: {e}")
    finally:
        db.close()
    return f"Processed {len(reminded_users)} recurring alert notifications."
