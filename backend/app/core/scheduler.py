import heapq
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.all_models import WorkerProfile, Booking, Complaint, Attendance
from app.core.webhooks import WebhookManager

CLUSTER_ADJACENCY = {
    "Downtown": ["Northside", "Westside"],
    "Northside": ["Downtown", "Westside"],
    "Westside": ["Downtown", "Northside"]
}

def find_worker(db: Session, skill: str, target_location: str, is_emergency: bool = False, required_date: str = None, required_time: str = None):
    locations = [target_location] + CLUSTER_ADJACENCY.get(target_location, [])
    
    target_date = required_date if required_date else datetime.utcnow().strftime("%Y-%m-%d")
    
    # Active assignments for the given time slot
    active_booking_workers = db.query(Booking.worker_id).filter(
        Booking.status == "assigned", 
        Booking.worker_id.isnot(None),
        Booking.date == required_date,
        Booking.time_slot == required_time
    ).subquery()
    
    active_complaint_workers = db.query(Complaint.worker_id).filter(
        Complaint.status == "assigned_for_resolution", 
        Complaint.worker_id.isnot(None)
    ).subquery()
    
    absent_workers = db.query(Attendance.worker_id).filter(
        Attendance.date == target_date,
        Attendance.status == "absent"
    ).subquery()

    for loc in locations:
        q = db.query(WorkerProfile).filter(
            WorkerProfile.skills == skill,
            WorkerProfile.location == loc,
            WorkerProfile.is_available == True,
            WorkerProfile.id.notin_(db.query(active_booking_workers.c.worker_id)),
            WorkerProfile.id.notin_(db.query(active_complaint_workers.c.worker_id)),
            WorkerProfile.id.notin_(db.query(absent_workers.c.worker_id))
        )
        if not is_emergency:
            q = q.filter(WorkerProfile.is_emergency_reserved == False)
            
        worker = q.first()
        if worker:
            return worker
            
    # Preemption logic: if emergency and no worker found
    if is_emergency:
        for loc in locations:
            # Find a normal booking to preempt
            preemptable_booking = db.query(Booking).join(WorkerProfile, Booking.worker_id == WorkerProfile.id).filter(
                WorkerProfile.skills == skill,
                WorkerProfile.location == loc,
                Booking.status == "assigned",
                Booking.date == required_date,
                Booking.time_slot == required_time
            ).first()
            if preemptable_booking:
                worker = preemptable_booking.worker
                preemptable_booking.status = "paused"
                preemptable_booking.worker_id = None
                db.commit()
                return worker
    
    return None

def escalate_priorities(db: Session):
    threshold = datetime.utcnow() - timedelta(hours=1)
    stale_complaints = db.query(Complaint).filter(Complaint.status == "pending", Complaint.created_at < threshold).all()
    for c in stale_complaints:
        if c.priority > 1:
            c.priority -= 1
    db.commit()

def process_queues(db: Session):
    escalate_priorities(db)
    
    # Priority Queue for Complaints
    pending_complaints = db.query(Complaint).filter(Complaint.status == "pending").all()
    comp_heap = []
    for c in pending_complaints:
        heapq.heappush(comp_heap, (c.priority, c.created_at.timestamp(), c.id, c))
        
    while comp_heap:
        _, _, _, comp = heapq.heappop(comp_heap)
        
        # Fallback to complaint type if booking doesn't explicitly dictate service category
        skill = comp.booking.service.category if comp.booking else comp.complaint_type.lower()
        loc = comp.booking.location if comp.booking else "Downtown"
        date = comp.booking.date if comp.booking else None
        time_slot = comp.booking.time_slot if comp.booking else None
        is_emergency = (comp.complaint_type.lower() == "emergency")
        
        # If emergency, and no explicit skill, we might just look for 'emergency' or any available
        worker = find_worker(db, skill, loc, is_emergency=is_emergency, required_date=date, required_time=time_slot)
        if worker:
            comp.worker_id = worker.id
            comp.status = "assigned_for_resolution"
            db.commit()
            db.refresh(comp)
            print(f"Assigned worker {worker.id} to task {comp.id}")
            WebhookManager.trigger_worker_assigned("complaint", comp.id, worker.id, comp.customer.email)
            
    # Scheduled Queue for Bookings
    pending_bookings = db.query(Booking).filter(Booking.status.in_(["pending", "paused"])).order_by(Booking.created_at.asc()).all()
    
    for b in pending_bookings:
        worker = find_worker(db, b.service.category, b.location, is_emergency=False, required_date=b.date, required_time=b.time_slot)
        if worker:
            b.worker_id = worker.id
            b.status = "assigned"
            db.commit()
            db.refresh(b)
            print(f"Assigned worker {worker.id} to ticket {b.id}")
            WebhookManager.trigger_worker_assigned("booking", b.id, worker.id, b.customer.email)
