import sys
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import SQLALCHEMY_DATABASE_URL
from app.models.all_models import Base, User, Service, WorkerProfile, Booking, Complaint
from app.core.scheduler import process_queues

def seed_simulation(db):
    try:
        db.query(Complaint).delete()
        db.query(Booking).delete()
        db.query(WorkerProfile).delete()
        db.query(Service).delete()
        db.query(User).delete()
        db.commit()
    except Exception as e:
        pass

    # 1 User
    u = User(email="customer@fixnest.com", role="customer")
    db.add(u)
    db.commit()

    # 1 Service
    s = Service(name="Plumbing Fix", category="plumbing", description="Plumbing job", price=100)
    db.add(s)
    db.commit()

    # 1 Worker (Normal)
    w_user = User(email="normal_worker@fixnest.com", role="worker")
    db.add(w_user)
    db.commit()
    w1 = WorkerProfile(user_id=w_user.id, skills="plumbing", location="Downtown", is_available=True, is_emergency_reserved=False)
    db.add(w1)
    db.commit()

    print("Seeded database: 1 Customer, 1 Normal Plumber in Downtown.")
    return u, s, w1

def run_simulation():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    u, s, w1 = seed_simulation(db)

    print("\n--- Step 1: Normal Scheduled Booking Arrives ---")
    b1 = Booking(customer_id=u.id, service_id=s.id, location="Downtown", date="2026-03-20", time_slot="Morning", status="pending")
    db.add(b1)
    db.commit()
    process_queues(db)
    db.refresh(b1)
    print(f"Booking 1 Status: {b1.status}, Assigned Worker ID: {b1.worker_id}")

    print("\n--- Step 2: Emergency Complaint Arrives (Pipeline Burst) ---")
    c1 = Complaint(customer_id=u.id, booking_id=b1.id, complaint_type="emergency", priority=1, status="pending")
    db.add(c1)
    db.commit()
    
    # Process Queues
    process_queues(db)
    
    db.refresh(b1)
    db.refresh(c1)
    print(f"Complaint Status: {c1.status}, Assigned Worker ID: {c1.worker_id}")
    print(f"Booking 1 Status (PREEMPTED): {b1.status}, Assigned Worker ID: {b1.worker_id}")

    print("\n--- Step 3: Shift change - Free Worker comes online ---")
    w2_user = User(email="new_worker@fixnest.com", role="worker")
    db.add(w2_user)
    db.commit()
    w2 = WorkerProfile(user_id=w2_user.id, skills="plumbing", location="Downtown", is_available=True, is_emergency_reserved=False)
    db.add(w2)
    db.commit()

    process_queues(db)
    db.refresh(b1)
    print(f"Booking 1 Status (RESUMED): {b1.status}, Assigned Worker ID: {b1.worker_id} (Worker #{w2.id})")

if __name__ == "__main__":
    run_simulation()
