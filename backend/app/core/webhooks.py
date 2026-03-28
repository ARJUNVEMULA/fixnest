import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("FixNest-Webhooks")

class WebhookManager:
    @staticmethod
    def _send_notification(event_type: str, payload: dict, channels: list[str] = None):
        if channels is None:
            channels = ["email", "sms"]
        for channel in channels:
            logger.info(f"[{channel.upper()}] Event '{event_type}' fired with payload: {payload}")

    @classmethod
    def trigger_booking_created(cls, booking_id: int, user_email: str):
        cls._send_notification("booking_created", {"booking_id": booking_id, "user_email": user_email})

    @classmethod
    def trigger_worker_assigned(cls, task_type: str, task_id: int, worker_id: int, user_email: str):
        cls._send_notification("worker_assigned", {"task_type": task_type, "task_id": task_id, "worker_id": worker_id}, ["sms", "whatsapp"])

    @classmethod
    def trigger_complaint_raised(cls, complaint_id: int, user_email: str):
        cls._send_notification("complaint_raised", {"complaint_id": complaint_id, "user_email": user_email}, ["email"])

    @classmethod
    def trigger_subscription_expiring(cls, user_email: str, plan_name: str):
        cls._send_notification("subscription_expiring", {"user_email": user_email, "plan_name": plan_name}, ["email", "sms"])

    @classmethod
    def trigger_visitor_overstay(cls, user_email: str, visitor_name: str, flat_id: str, checkout_time: str):
        cls._send_notification("visitor_overstay", {
            "user_email": user_email,
            "visitor_name": visitor_name,
            "flat_id": flat_id,
            "expected_checkout": checkout_time,
            "message": f"ALERT: Your visitor {visitor_name} has exceeded their expected stay in Flat {flat_id}. Please coordinate or extend their stay via the dashboard."
        }, ["email", "sms", "whatsapp"])
