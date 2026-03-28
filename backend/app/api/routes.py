from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Query
import shutil
import os
import uuid
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import timedelta
from typing import List

from app.db.database import get_db
from app.models.all_models import User, Service, WorkerProfile, Booking, Complaint, Subscription, Apartment, Block, Department, Cluster, Visitor, DeliveryRequest, ExtraServiceCategory, ExtraServiceSubCategory, ExtraServiceType, ExtraService, ExtraServiceBanner, ExtraServiceStats, RMSCategory, RMSSubcategory, Attendance, Announcement, MaintenancePlan, MaintenanceService, ApartmentCategoryMapping, RMSRequest
from app.schemas.all_schemas import (
    UserCreate, UserOut, Token, ServiceOut, WorkerOut, WorkerUpdate, BookingOut, BookingBase, 
    ServiceBase, ComplaintOut, ComplaintBase, SubscriptionBase, SubscriptionOut, AttendanceBase, 
    AttendanceOut, AdminWorkerOut, AdminWorkerCreate, AdminCustomerOut, ApartmentBase, 
    ApartmentOut, BlockBase, BlockOut, OTPVerify, OTPSend, DepartmentOut, DepartmentCreate, 
    ClusterOut, ClusterCreate, VisitorCreate, VisitorOut, VisitorVerify, VisitorExtend,
    DeliveryRequestCreate, DeliveryRequestOut, DeliveryAction, DeliveryOTPVerify,
    ExtraServiceCategoryOut, ExtraServiceCategoryCreate, ExtraServiceSubCategoryOut, ExtraServiceSubCategoryCreate, ExtraServiceTypeOut, ExtraServiceTypeCreate, ExtraServiceOut, ExtraServiceCreate, ExtraServiceBannerBase, ExtraServiceBannerOut, ExtraServiceStatsOut, ExtraServiceStatsBase,
    RMSCategoryOut, RMSCategoryCreate, RMSSubcategoryOut, RMSSubcategoryCreate, RMSCategoryMappingUpdate, RMSRequestOut, RMSRequestCreate,
    AnnouncementCreate, AnnouncementOut, ApartmentMaintenanceOut, MaintenancePlanCreate, MaintenancePlanUpdate
)

OTP_STORE = {}
import heapq
from datetime import datetime
from app.core.security import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.api.dependencies import get_current_user

api_router = APIRouter()

# --- Auth ---
@api_router.post("/auth/send-otp")
def send_otp(data: OTPSend):
    # Simulate sending OTP
    otp = "123456" # Fixed OTP for demonstration/testing
    OTP_STORE[data.mobile_number] = otp
    return {"message": "OTP sent successfully"}

@api_router.post("/auth/verify-otp")
def verify_otp(data: OTPVerify):
    stored_otp = OTP_STORE.get(data.mobile_number)
    if not stored_otp or stored_otp != data.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    # Mark as verified
    OTP_STORE[data.mobile_number] = "verified"
    return {"message": "OTP verified successfully"}

@api_router.post("/auth/register-customer", response_model=UserOut)
def register_customer(user: UserCreate, db: Session = Depends(get_db)):
    if OTP_STORE.get(user.mobile_number) != "verified":
        raise HTTPException(status_code=400, detail="OTP not verified")
        
    db_user = db.query(User).filter(User.mobile_number == user.mobile_number).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Mobile number already registered")
        
    apartment = db.query(Apartment).filter(Apartment.id == user.apartment_id).first()
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")
        
    # Generate unique flat_id
    apt_code = apartment.code
    block = user.block
    floor = f"{user.floor_number:02d}"
    flat_no = str(user.flat_number)
    flat_id = f"{apt_code}{block}{floor}{flat_no}"
    
    # Check if flat_id is unique
    existing_flat = db.query(User).filter(User.flat_id == flat_id).first()
    if existing_flat:
        raise HTTPException(status_code=400, detail="Flat is already registered")
        
    hashed_password = get_password_hash(user.password)
    new_user = User(
        mobile_number=user.mobile_number,
        username=user.username,
        apartment_id=user.apartment_id,
        block=user.block,
        floor_number=user.floor_number,
        flat_number=user.flat_number,
        flat_id=flat_id,
        hashed_password=hashed_password,
        role="customer",
        user_type=getattr(user, 'user_type', 'apartment')  # Phase 1: always apartment
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Clear verified OTP
    OTP_STORE.pop(user.mobile_number, None)
    
    return new_user

@api_router.post("/auth/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.flat_id == form_data.username) | 
        (User.mobile_number == form_data.username) |
        (User.email == form_data.username)
    ).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect credentials")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    identifier = user.flat_id if user.flat_id else (user.mobile_number if user.mobile_number else user.email)
    
    access_token = create_access_token(
        data={"sub": identifier, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
    
@api_router.get("/auth/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

from app.schemas.all_schemas import UserUpdate
@api_router.put("/auth/me", response_model=UserOut)
def update_user_me(user_info: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if user_info.username:
        current_user.username = user_info.username
    if user_info.mobile_number:
        current_user.mobile_number = user_info.mobile_number
    if user_info.gender:
        current_user.gender = user_info.gender
    if user_info.profile_photo:
        current_user.profile_photo = user_info.profile_photo
    db.commit()
    db.refresh(current_user)
    return current_user

# --- Apartments ---
@api_router.post("/apartments", response_model=ApartmentOut)
def create_apartment(apt: ApartmentBase, db: Session = Depends(get_db)):
    if len(apt.code) != 2 or not apt.code.isupper():
        raise HTTPException(status_code=400, detail="Code must be exactly 2 uppercase letters")
    existing = db.query(Apartment).filter((Apartment.code == apt.code) | (Apartment.name == apt.name)).first()
    if existing:
         raise HTTPException(status_code=400, detail="Apartment name or code already exists")
    new_apt = Apartment(name=apt.name, code=apt.code)
    db.add(new_apt)
    db.commit()
    db.refresh(new_apt)
    return new_apt

@api_router.post("/apartments/{apartment_id}/blocks", response_model=BlockOut)
def add_block_to_apartment(apartment_id: int, block: BlockBase, db: Session = Depends(get_db)):
    apt = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Apartment not found")
    new_block = Block(apartment_id=apartment_id, block_name=block.block_name)
    db.add(new_block)
    db.commit()
    db.refresh(new_block)
    return new_block

@api_router.get("/apartments", response_model=List[ApartmentOut])
def get_apartments(db: Session = Depends(get_db)):
    return db.query(Apartment).all()

@api_router.get("/apartments/{apartment_id}/blocks", response_model=List[BlockOut])
def get_apartment_blocks(apartment_id: int, db: Session = Depends(get_db)):
    return db.query(Block).filter(Block.apartment_id == apartment_id).all()

@api_router.delete("/apartments/{apartment_id}")
def delete_apartment(apartment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    apt = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Apartment not found")
    db.delete(apt)
    db.commit()
    return {"message": "Apartment deleted successfully"}

@api_router.delete("/blocks/{block_id}")
def delete_block(block_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    block = db.query(Block).filter(Block.id == block_id).first()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    db.delete(block)
    db.commit()
    return {"message": "Block deleted successfully"}

@api_router.post("/admin/departments", response_model=DepartmentOut)
def create_department(dept: DepartmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    new_dept = Department(name=dept.name)
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)
    return new_dept

@api_router.get("/admin/departments", response_model=List[DepartmentOut])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()

@api_router.delete("/admin/departments/{dept_id}")
def delete_department(dept_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(dept)
    db.commit()
    return {"message": "Department deleted successfully"}

@api_router.post("/admin/clusters", response_model=ClusterOut)
def create_cluster(cluster: ClusterCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    new_cluster = Cluster(name=cluster.name)
    db.add(new_cluster)
    db.commit()
    db.refresh(new_cluster)
    return new_cluster

@api_router.get("/admin/clusters", response_model=List[ClusterOut])
def get_clusters(db: Session = Depends(get_db)):
    return db.query(Cluster).all()

@api_router.delete("/admin/clusters/{cluster_id}")
def delete_cluster(cluster_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    cluster = db.query(Cluster).filter(Cluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    db.delete(cluster)
    db.commit()
    return {"message": "Cluster deleted successfully"}

# --- Visitors ---
from datetime import timedelta

# --- Visitors (Advanced VMS) ---
@api_router.post("/visitors", response_model=VisitorOut)
def create_visitor(visitor: VisitorCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    token = str(uuid.uuid4())
    # Default expiry is visit_date + 24h or expected_check_out + 2h
    expiry = visitor.expected_check_out_time + timedelta(hours=2) if visitor.expected_check_out_time else datetime.utcnow() + timedelta(hours=24)
    
    new_v = Visitor(
        name=visitor.name,
        phone=visitor.phone,
        flat_id=visitor.flat_id,
        resident_id=current_user.id,
        secure_token=token,
        visit_date=visitor.visit_date,
        expected_check_in_time=visitor.expected_check_in_time,
        expected_check_out_time=visitor.expected_check_out_time,
        status="Scheduled",
        expiry_time=expiry
    )
    db.add(new_v)
    db.commit()
    db.refresh(new_v)
    return new_v

@api_router.get("/visitors/my", response_model=List[VisitorOut])
def get_my_visitors(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Visitor).filter(Visitor.resident_id == current_user.id).order_by(Visitor.id.desc()).all()

@api_router.post("/visitors/extend/{visitor_id}")
def extend_visitor_stay(visitor_id: int, data: VisitorExtend, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    v = db.query(Visitor).filter(Visitor.id == visitor_id, Visitor.resident_id == current_user.id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Visitor pass not found")
    
    v.expected_check_out_time = data.new_check_out_time
    v.expiry_time = data.new_check_out_time + timedelta(hours=2)
    # If it was overstay, move back to Checked-IN status if new time is in future
    if v.status == "Overstay" and data.new_check_out_time > datetime.utcnow():
        v.status = "Checked-IN"
        
    db.commit()
    return {"message": "Stay extended successfully", "new_checkout": v.expected_check_out_time}

@api_router.post("/visitors/verify")
def verify_visitor(v_verify: VisitorVerify, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "worker"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    visitor = db.query(Visitor).filter(Visitor.secure_token == v_verify.secure_token).first()
    if not visitor:
        raise HTTPException(status_code=404, detail="Invalid Security Token")
    
    # Check if already checked out
    if visitor.status == "Checked-OUT":
        return {"status": "rejected", "message": "This visitor has already exited the premises", "name": visitor.name}

    # If already Checked-IN or Overstay, this scan means EXIT
    if visitor.status in ["Checked-IN", "Overstay"]:
        visitor.status = "Checked-OUT"
        visitor.actual_check_out_time = datetime.utcnow()
        visitor.is_used = True
        db.commit()
        return {"status": "approved", "action": "checkout", "message": "Check-out successful", "name": visitor.name}
    
    # If Scheduled, this scan means ENTRY
    if visitor.status == "Scheduled":
        if visitor.expiry_time < datetime.utcnow():
             return {"status": "rejected", "message": "Entry window has expired", "name": visitor.name}
        
        visitor.status = "Checked-IN"
        visitor.actual_check_in_time = datetime.utcnow()
        db.commit()
        return {"status": "approved", "action": "checkin", "message": "Check-in successful", "name": visitor.name, "flat": visitor.flat_id}

    return {"status": "rejected", "message": "Invalid status flow", "name": visitor.name}

@api_router.get("/admin/visitors/stats")
def get_visitor_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    visitors_today = db.query(Visitor).filter(Visitor.visit_date >= today_start).all()
    
    # Summary
    summary = {
        "total_today": len(visitors_today),
        "active_now": len([v for v in visitors_today if v.status == "Checked-IN"]),
        "overstays": len([v for v in visitors_today if v.status == "Overstay"]),
        "exited": len([v for v in visitors_today if v.status == "Checked-OUT"])
    }
    
    # Top Flats
    top_flats = db.query(Visitor.flat_id, func.count(Visitor.id)).group_by(Visitor.flat_id).order_by(func.count(Visitor.id).desc()).limit(10).all()
    
    # Status Dist
    status_dist = {}
    for v in visitors_today:
        status_dist[v.status] = status_dist.get(v.status, 0) + 1
        
    # Hourly Distribution (Arrivals today)
    hourly = [0] * 24
    for v in visitors_today:
        if v.actual_check_in_time:
            hour = v.actual_check_in_time.hour
            hourly[hour] += 1
            
    # Avg Stay
    stay_durations = []
    for v in visitors_today:
        if v.actual_check_in_time and v.actual_check_out_time:
            diff = (v.actual_check_out_time - v.actual_check_in_time).total_seconds() / 60
            stay_durations.append(diff)
            
    avg_stay = sum(stay_durations) / len(stay_durations) if stay_durations else 0

    return {
        "summary": summary,
        "top_flats": [{"flat": f[0], "count": f[1]} for f in top_flats],
        "status_distribution": status_dist,
        "hourly_distribution": hourly,
        "efficiency": {
            "avg_stay_minutes": float("{:.1f}".format(avg_stay)),
            "peak_hour": hourly.index(max(hourly)) if any(hourly) else None
        }
    }

@api_router.get("/admin/visitors/all", response_model=List[VisitorOut])
def get_all_visitors(
    flat_id: str = Query(None), 
    status: str = Query(None), 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    query = db.query(Visitor)
    if flat_id:
        query = query.filter(Visitor.flat_id.contains(flat_id))
    if status:
        query = query.filter(Visitor.status == status)
    return query.order_by(Visitor.visit_date.desc()).all()

@api_router.get("/admin/visitors/active", response_model=List[VisitorOut])
def get_active_visitors(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "worker"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(Visitor).filter(Visitor.status.in_(["Checked-IN", "Overstay"])).all()

# --- Delivery & Parcel Management ---
import random

@api_router.post("/deliveries", response_model=DeliveryRequestOut)
def create_delivery_request(data: DeliveryRequestCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_del = DeliveryRequest(
        user_id=current_user.id,
        flat_id=current_user.flat_id,
        mode=data.mode,
        delivery_agent_name=data.delivery_agent_name,
        mobile_number=data.mobile_number,
        delivery_app=data.delivery_app,
        item_type=data.item_type,
        expected_time=data.expected_time,
        notes=data.notes,
        status="Requested"
    )
    db.add(new_del)
    db.commit()
    db.refresh(new_del)
    return new_del

@api_router.get("/deliveries/my", response_model=List[DeliveryRequestOut])
def get_my_deliveries(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(DeliveryRequest).filter(DeliveryRequest.user_id == current_user.id).order_by(DeliveryRequest.created_at.desc()).all()

@api_router.get("/deliveries/active", response_model=List[DeliveryRequestOut])
def get_active_deliveries(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Security/Worker/Admin
    if current_user.role not in ["admin", "worker"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    # Show everything not collected or rejected
    return db.query(DeliveryRequest).filter(DeliveryRequest.status.notin_(["Collected", "Rejected"])).order_by(DeliveryRequest.created_at.desc()).all()

@api_router.post("/deliveries/action")
def delivery_action(data: DeliveryAction, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "worker"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    delivery = db.query(DeliveryRequest).filter(DeliveryRequest.id == data.delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery request not found")

    if data.action == "verify":
        # Verification mode: Resident is present, just allowing entry
        delivery.status = "Verified"
    elif data.action == "receive":
        # Parcel mode: Security holding parcel
        delivery.status = "Received"
        delivery.received_time = datetime.utcnow()
        delivery.otp = f"{random.randint(100000, 999999)}"
    elif data.action == "reject":
        delivery.status = "Rejected"
    
    if data.image_url:
        delivery.image_url = data.image_url
        
    db.commit()
    return {"message": f"Delivery {data.action} successful", "status": delivery.status}

@api_router.post("/deliveries/verify-otp")
def verify_delivery_otp(data: DeliveryOTPVerify, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "worker"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    delivery = db.query(DeliveryRequest).filter(DeliveryRequest.id == data.delivery_id).first()
    if not delivery or not delivery.otp:
        raise HTTPException(status_code=404, detail="Delivery/OTP not found")
    
    if delivery.otp != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    delivery.status = "Collected"
    delivery.collected_time = datetime.utcnow()
    db.commit()
    return {"message": "Parcel collected successfully"}

@api_router.get("/admin/deliveries/stats")
def get_delivery_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    total = db.query(DeliveryRequest).count()
    pending_parcels = db.query(DeliveryRequest).filter(DeliveryRequest.status == "Received").count()
    collected = db.query(DeliveryRequest).filter(DeliveryRequest.status == "Collected").count()
    rejected = db.query(DeliveryRequest).filter(DeliveryRequest.status == "Rejected").count()
    
    # Recent activity
    recent = db.query(DeliveryRequest).order_by(DeliveryRequest.created_at.desc()).limit(10).all()
    
    recent_activity = []
    for r in recent:
        recent_activity.append({
            "id": r.id,
            "delivery_agent_name": r.delivery_agent_name,
            "delivery_app": r.delivery_app,
            "flat_id": r.flat_id,
            "apartment_id": r.user.apartment_id,
            "apartment_name": r.user.apartment.name if r.user.apartment else "Unknown",
            "mode": r.mode,
            "status": r.status,
            "created_at": r.created_at
        })
    
    return {
        "total": total,
        "pending_parcels": pending_parcels,
        "collected": collected,
        "rejected": rejected,
        "recent_activity": recent_activity
    }

# --- Services ---
@api_router.get("/services/{service_id}/availability")
def get_service_availability(service_id: int, date: str, location: str, db: Session = Depends(get_db)):
    ALL_SLOTS = ["Morning (8AM - 12PM)", "Afternoon (12PM - 4PM)", "Evening (4PM - 8PM)"]
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        return {"date": date, "available_slots": []}

    available_slots = []
    for slot in ALL_SLOTS:
        booked_workers_subquery = db.query(Booking.worker_id).filter(
            Booking.date == date,
            Booking.time_slot == slot,
            Booking.status != "cancelled",
            Booking.worker_id.isnot(None)
        )
        worker = db.query(WorkerProfile).filter(
            WorkerProfile.skills == service.category,
            WorkerProfile.location == location,
            WorkerProfile.is_available == True,
            WorkerProfile.id.notin_(booked_workers_subquery)
        ).first()

        if worker:
            available_slots.append(slot)

    return {"date": date, "available_slots": available_slots}

@api_router.get("/services", response_model=List[ServiceOut])
def get_services(db: Session = Depends(get_db)):
    return db.query(Service).all()

@api_router.post("/services", response_model=ServiceOut)
def create_service(service: ServiceBase, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not an admin")
    new_service = Service(**service.dict())
    db.add(new_service)
    db.commit()
    db.refresh(new_service)
    return new_service

from app.models.all_models import Attendance

# --- Workers ---
@api_router.get("/workers", response_model=List[WorkerOut])
def get_workers(db: Session = Depends(get_db)):
    return db.query(WorkerProfile).all()

@api_router.get("/workers/me", response_model=WorkerOut)
def get_my_worker_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    worker = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker profile not found")
    return worker

@api_router.put("/workers/me", response_model=WorkerOut)
def update_worker_profile(profile_data: WorkerUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "worker":
        raise HTTPException(status_code=403, detail="Not a worker")
    worker = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    if not worker:
        worker = WorkerProfile(user_id=current_user.id)
        db.add(worker)
        
    worker.name = profile_data.name
    worker.mobile_number = profile_data.mobile_number
    worker.gender = profile_data.gender
    worker.skills = profile_data.skills
    worker.location = profile_data.location
    db.commit()
    db.refresh(worker)
    return worker

# --- Bookings ---
@api_router.get("/bookings", response_model=List[BookingOut])
def get_bookings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        return db.query(Booking).all()
    elif current_user.role == "worker":
        worker = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
        if worker:
            return db.query(Booking).filter(Booking.worker_id == worker.id).all()
        return []
    else:
        return db.query(Booking).filter(Booking.customer_id == current_user.id).all()

@api_router.delete("/bookings/{booking_id}")
def delete_booking(booking_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only absolute administrators can execute destructive db actions.")
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking inherently absent")
    
    # Cascade cleanup manually to safeguard constraints structurally
    from app.models.all_models import Complaint
    db.query(Complaint).filter(Complaint.booking_id == booking_id).delete()
    
    db.delete(booking)
    db.commit()
    return {"message": "Ticket brutally scrubbed from explicit queuing logic!"}

@api_router.post("/bookings", response_model=BookingOut)
def create_booking(booking: BookingBase, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    service = db.query(Service).filter(Service.id == booking.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    SUBSCRIPTION_PLANS = {
        "basic": {
            "price": 999,
            "included_services": ["cleaning"],
            "discount_percent": 10,
            "priority_level": 3
        },
        "standard": {
            "price": 1999,
            "included_services": ["cleaning", "plumbing"],
            "discount_percent": 20,
            "priority_level": 2
        },
        "premium": {
            "price": 2999,
            "included_services": ["cleaning", "plumbing", "electrical"],
            "discount_percent": 30,
            "priority_level": 1
        }
    }
    
    original_price = service.price
    discount = 0
    final_price = original_price
    
    user_sub = db.query(Subscription).filter(Subscription.user_id == current_user.id, Subscription.status == "active").first()
    if user_sub:
        plan_meta = SUBSCRIPTION_PLANS.get(user_sub.plan_name.lower(), {})
        included = plan_meta.get("included_services", [])
        if isinstance(included, list) and service.category in included:
            discount = 100
        else:
            disc = plan_meta.get("discount_percent", 0)
            discount = int(disc) if isinstance(disc, int) else 0
            
    final_price = original_price - int(original_price * (discount / 100.0))

    new_booking = Booking(
        customer_id=current_user.id,
        service_id=booking.service_id,
        location=booking.location,
        date=booking.date,
        time_slot=booking.time_slot,
        status="pending",
        original_price=original_price,
        discount_applied=discount,
        final_price=final_price
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    
    try:
        from app.core.webhooks import WebhookManager
        WebhookManager.trigger_booking_created(new_booking.id, current_user.email)
    except Exception as e:
        print("WebhookManager skipped:", str(e))
    
    print("Triggering Celery task (process_queues_task) for booking delay")
    from app.tasks.celery_tasks import process_queues_task
    process_queues_task.delay()
    db.refresh(new_booking)
    return new_booking

# --- Complaints ---
COMPLAINT_PRIORITY_MAP = {
    "emergency": 1,
    "safety": 2,
    "quality": 3,
    "billing": 4,
    "normal": 5
}

@api_router.post("/complaints", response_model=dict)
def create_complaint(complaint: ComplaintBase, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    print("API HIT - complaints endpoint")
    priority = COMPLAINT_PRIORITY_MAP.get(complaint.complaint_type.lower(), 5)
    
    new_complaint = Complaint(
        customer_id=current_user.id,
        complaint_type=complaint.complaint_type.lower(),
        description=complaint.description,
        priority=priority
    )
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    
    print("Initiating automatic routing logic locally...")
    try:
        from app.core.scheduler import process_queues
        process_queues(db)
    except Exception as e:
        print("Routing pipeline failed inline execution:", str(e))
        
    print("Triggering Celery background task for deep escalation checks...")
    try:
        from app.tasks.celery_tasks import auto_escalate_complaints
        auto_escalate_complaints.delay()
    except Exception as e:
        pass
    
    return {"message": "Complaint created successfully"}

@api_router.get("/complaints", response_model=List[ComplaintOut])
def get_complaints(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        return db.query(Complaint).all()
    elif current_user.role == "worker":
        worker = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
        if worker:
            return db.query(Complaint).filter(Complaint.worker_id == worker.id).all()
        return []
    else:
        return db.query(Complaint).filter(Complaint.customer_id == current_user.id).all()

@api_router.delete("/complaints/{complaint_id}")
def delete_complaint(complaint_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    db.delete(complaint)
    db.commit()
    return {"message": "Complaint deleted globally"}

@api_router.post("/scheduler/process", response_model=dict)
def trigger_scheduler(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manually trigger scheduler")
    
    print("Admin Triggered Scheduler Pipeline")
    from app.tasks.celery_tasks import process_queues_task, auto_escalate_complaints, send_service_reminders
    process_queues_task.delay()
    auto_escalate_complaints.delay()
    send_service_reminders.delay()
    
    return {"message": "All Scheduler and Escalate tasks dumped to Redis Pipeline securely."}

@api_router.get("/admin/attendance", response_model=List[AttendanceOut])
def get_attendance(date: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(Attendance).filter(Attendance.date == date).all()

@api_router.post("/admin/attendance", response_model=AttendanceOut)
def mark_attendance(data: AttendanceBase, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    if data.date != today_str:
        raise HTTPException(status_code=400, detail="Cannot modify attendance records for past dates")

    existing = db.query(Attendance).filter(Attendance.worker_id == data.worker_id, Attendance.date == data.date).first()
    if existing:
        existing.status = data.status
        existing.marked_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
        
    new_record = Attendance(
        worker_id=data.worker_id,
        date=data.date,
        status=data.status
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record

# --- Subscriptions (FUTURE: independent-house users only) ---
@api_router.post("/subscriptions/subscribe", response_model=SubscriptionOut)
def subscribe(sub: SubscriptionBase, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Phase 1: subscriptions are reserved for independent-house users
    if getattr(current_user, 'user_type', 'apartment') == 'apartment':
        raise HTTPException(status_code=403, detail="Subscriptions are not available for apartment users. Use your apartment maintenance plan instead.")
    existing = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
    if existing:
        existing.plan_name = sub.plan_name.lower()
        existing.status = "active"
        db.commit()
        db.refresh(existing)
        return existing
        
    new_sub = Subscription(user_id=current_user.id, plan_name=sub.plan_name.lower(), status="active")
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return new_sub

@api_router.post("/subscriptions/cancel", response_model=dict)
def cancel_subscription(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if getattr(current_user, 'user_type', 'apartment') == 'apartment':
        raise HTTPException(status_code=403, detail="Subscriptions are not available for apartment users.")
    existing = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
    if not existing or existing.status != "active":
        raise HTTPException(status_code=400, detail="No active subscription found")
    existing.status = "cancelled"
    db.commit()
    return {"message": "Subscription cancelled successfully"}

# --- Admin Worker Management ---
from openpyxl import Workbook
from fastapi.responses import StreamingResponse
import io

@api_router.post("/admin/workers", response_model=dict)
def create_admin_worker(worker_data: AdminWorkerCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Check if user exists
    existing_user = db.query(User).filter(User.email == worker_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User email already exists")
        
    from app.core.security import get_password_hash
    # Create User
    new_user = User(
        email=worker_data.email,
        mobile_number=worker_data.mobile_number,
        role="worker",
        hashed_password=get_password_hash(worker_data.password),
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create WorkerProfile
    new_worker = WorkerProfile(
        user_id=new_user.id,
        name=worker_data.name,
        mobile_number=worker_data.mobile_number,
        gender=worker_data.gender,
        skills=worker_data.skills,
        location=worker_data.location,
        is_available=True
    )
    db.add(new_worker)
    db.commit()
    
    return {"message": f"Worker {worker_data.name} created successfully"}

@api_router.get("/admin/workers", response_model=List[AdminWorkerOut])
def get_admin_workers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    workers = db.query(WorkerProfile).all()
    results = []
    for w in workers:
        user_rec = db.query(User).filter(User.id == w.user_id).first()
        results.append(AdminWorkerOut(
            worker_id=w.id,
            user_id=w.user_id,
            name=w.name,
            username=(user_rec.email or getattr(user_rec, 'flat_id', None) or getattr(user_rec, 'mobile_number', None) or "Unknown") if user_rec else "Unknown",
            department=w.skills or "unassigned",
            contact_info=w.mobile_number
        ))
    return results

@api_router.post("/admin/workers/{worker_id}/reset-password")
def reset_worker_password(worker_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    worker = db.query(WorkerProfile).filter(WorkerProfile.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    user_rec = db.query(User).filter(User.id == worker.user_id).first()
    if not user_rec:
        raise HTTPException(status_code=404, detail="User not found")
    
    from app.core.security import get_password_hash
    user_rec.hashed_password = get_password_hash("worker123")
    db.commit()
    return {"message": "Password natively reset to standard template 'worker123'"}

@api_router.get("/admin/workers/export")
def export_workers_excel(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    workers = db.query(WorkerProfile).all()
    wb = Workbook()
    ws = wb.active
    ws.title = "Workers Data"
    
    headers = ["Worker ID", "Name", "Username", "Department", "Contact Info"]
    ws.append(headers)
    
    for w in workers:
        user_rec = db.query(User).filter(User.id == w.user_id).first()
        ws.append([
            w.id,
            w.name or "",
            user_rec.email if user_rec else "",
            w.skills.upper() if w.skills else "UNASSIGNED",
            w.mobile_number or ""
        ])
        
    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    
    hdrs = {
        'Content-Disposition': 'attachment; filename="fixnest_workers_data.xlsx"'
    }
    return StreamingResponse(iter([stream.getvalue()]), headers=hdrs, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

# --- Admin Customer Management ---
@api_router.get("/admin/customers", response_model=List[AdminCustomerOut])
def get_admin_customers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    customers = db.query(User).filter(User.role == "customer").all()
    results = []
    for c in customers:
        latest = db.query(Booking).filter(Booking.customer_id == c.id).order_by(Booking.created_at.desc()).first()
        loc = latest.location if latest else "Unknown"
        results.append(AdminCustomerOut(
            customer_id=c.id,
            name=getattr(c, 'username', None),
            email=c.email or getattr(c, 'flat_id', None) or "N/A",
            phone=getattr(c, 'mobile_number', None),
            location=loc
        ))
    return results

@api_router.post("/admin/customers/{customer_id}/reset-password")
def reset_customer_password(customer_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    cust = db.query(User).filter(User.id == customer_id, User.role == "customer").first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
    from app.core.security import get_password_hash
    cust.hashed_password = get_password_hash("customer123")
    db.commit()
    return {"message": "Password natively reset to standard template 'customer123'"}

@api_router.get("/admin/customers/export")
def export_customers_excel(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    customers = db.query(User).filter(User.role == "customer").all()
    wb = Workbook()
    ws = wb.active
    ws.title = "Customers Data"
    
    headers = ["Customer ID", "Name", "Email", "Phone", "Location", "Password Status"]
    ws.append(headers)
    
    for c in customers:
        latest = db.query(Booking).filter(Booking.customer_id == c.id).order_by(Booking.created_at.desc()).first()
        loc = latest.location if latest else "Unknown"
        ws.append([
            c.id,
            getattr(c, 'username', 'N/A') or 'N/A',
            c.email or getattr(c, 'flat_id', 'N/A') or 'N/A',
            getattr(c, 'mobile_number', 'N/A') or 'N/A',
            loc,
            "Secured"
        ])
        
    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    
    hdrs = {
        'Content-Disposition': 'attachment; filename="fixnest_customers_data.xlsx"'
    }
    return StreamingResponse(iter([stream.getvalue()]), headers=hdrs, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

# ─────────────────────────────────────────────
# --- Announcements ---
# ─────────────────────────────────────────────
from app.models.all_models import Announcement
from app.schemas.all_schemas import AnnouncementCreate, AnnouncementOut
from sqlalchemy import or_

@api_router.post("/admin/announcements", response_model=AnnouncementOut)
def create_announcement(
    data: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create announcements")

    valid_audiences = {"customer", "worker", "all"}
    if data.target_audience not in valid_audiences:
        raise HTTPException(status_code=400, detail="target_audience must be 'customer', 'worker', or 'all'")

    valid_priorities = {"normal", "urgent"}
    if data.priority not in valid_priorities:
        raise HTTPException(status_code=400, detail="priority must be 'normal' or 'urgent'")

    ann = Announcement(
        title=data.title,
        message=data.message,
        target_audience=data.target_audience,
        priority=data.priority,
        expiry_date=data.expiry_date
    )
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return ann


@api_router.get("/announcements", response_model=List[AnnouncementOut])
def get_announcements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.utcnow()
    role = current_user.role

    # Determine which target_audiences to include
    if role == "customer":
        audiences = ["customer", "all"]
    elif role == "worker":
        audiences = ["worker", "all"]
    else:  # admin sees everything
        audiences = ["customer", "worker", "all"]

    announcements = (
        db.query(Announcement)
        .filter(Announcement.target_audience.in_(audiences))
        .filter(
            or_(Announcement.expiry_date == None, Announcement.expiry_date > now)
        )
        .order_by(Announcement.created_at.desc())
        .all()
    )
    return announcements


@api_router.get("/admin/announcements", response_model=List[AnnouncementOut])
def get_all_announcements_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(Announcement).order_by(Announcement.created_at.desc()).all()


@api_router.delete("/admin/announcements/{announcement_id}")
def delete_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    ann = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
    db.delete(ann)
    db.commit()
    return {"message": "Announcement deleted"}


# ─────────────────────────────────────────────
# --- Apartment Maintenance Plans ---
# ─────────────────────────────────────────────
from app.models.all_models import (
    MaintenancePlan, MaintenanceService, 
    RMSCategory, RMSSubcategory, ApartmentCategoryMapping, RMSRequest
)
from app.schemas.all_schemas import (
    MaintenancePlanCreate, MaintenancePlanUpdate, MaintenancePlanOut,
    MaintenanceServiceCreate, MaintenanceServiceOut, ApartmentMaintenanceOut,
    RMSCategoryCreate, RMSCategoryOut, RMSSubcategoryCreate, RMSSubcategoryOut,
    RMSCategoryMappingUpdate, RMSRequestCreate, RMSRequestOut
)

DEFAULT_SERVICES = [
    {"service_name": "plumbing",   "is_enabled": True,  "sla_time": "4 hours"},
    {"service_name": "electrical", "is_enabled": True,  "sla_time": "4 hours"},
    {"service_name": "cleaning",   "is_enabled": True,  "sla_time": "Next day"},
    {"service_name": "security",   "is_enabled": False, "sla_time": None},
    {"service_name": "general",    "is_enabled": True,  "sla_time": "24 hours"},
]

@api_router.get("/admin/maintenance", response_model=List[ApartmentMaintenanceOut])
def list_apartments_with_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    apartments = db.query(Apartment).all()
    result = []
    for apt in apartments:
        total = db.query(User).filter(User.apartment_id == apt.id, User.role == "customer").count()
        plan = db.query(MaintenancePlan).filter(MaintenancePlan.apartment_id == apt.id).first()
        result.append(ApartmentMaintenanceOut(
            apartment_id=apt.id,
            apartment_name=apt.name,
            total_residents=total,
            plan=plan
        ))
    return result


@api_router.post("/admin/maintenance-plan", response_model=MaintenancePlanOut)
def create_or_update_plan(
    data: MaintenancePlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    apt = db.query(Apartment).filter(Apartment.id == data.apartment_id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Apartment not found")

    plan = db.query(MaintenancePlan).filter(MaintenancePlan.apartment_id == data.apartment_id).first()
    if plan:
        plan.plan_name = data.plan_name
        plan.maintenance_charge = data.maintenance_charge
    else:
        plan = MaintenancePlan(
            apartment_id=data.apartment_id,
            plan_name=data.plan_name,
            maintenance_charge=data.maintenance_charge
        )
        db.add(plan)
        db.flush()

        # Seed default services for new plans
        seed_services = data.services if data.services else [MaintenanceServiceCreate(**s) for s in DEFAULT_SERVICES]
        for svc in seed_services:
            db.add(MaintenanceService(plan_id=plan.id, **svc.dict()))

    db.commit()
    db.refresh(plan)
    return plan


@api_router.put("/admin/maintenance-plan/{plan_id}", response_model=MaintenancePlanOut)
def update_plan(
    plan_id: int,
    data: MaintenancePlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    plan = db.query(MaintenancePlan).filter(MaintenancePlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    if data.plan_name is not None:
        plan.plan_name = data.plan_name
    if data.maintenance_charge is not None:
        plan.maintenance_charge = data.maintenance_charge

    if data.services is not None:
        # Replace all services
        db.query(MaintenanceService).filter(MaintenanceService.plan_id == plan.id).delete()
        for svc in data.services:
            db.add(MaintenanceService(plan_id=plan.id, **svc.dict()))

    db.commit()
    db.refresh(plan)
    return plan


@api_router.post("/admin/maintenance-plan/{plan_id}/services", response_model=MaintenanceServiceOut)
def add_service(
    plan_id: int,
    data: MaintenanceServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    plan = db.query(MaintenancePlan).filter(MaintenancePlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Optional: check for duplicate service names
    existing = db.query(MaintenanceService).filter(
        MaintenanceService.plan_id == plan_id,
        MaintenanceService.service_name == data.service_name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Service '{data.service_name}' already exists in this plan")

    new_svc = MaintenanceService(plan_id=plan_id, **data.dict())
    db.add(new_svc)
    db.commit()
    db.refresh(new_svc)
    return new_svc


@api_router.patch("/admin/maintenance-plan/{plan_id}/services/{service_id}", response_model=MaintenanceServiceOut)
def patch_service(
    plan_id: int,
    service_id: int,
    data: MaintenanceServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    svc = db.query(MaintenanceService).filter(
        MaintenanceService.id == service_id,
        MaintenanceService.plan_id == plan_id
    ).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    
    svc.service_name = data.service_name
    svc.is_enabled = data.is_enabled
    svc.sla_time = data.sla_time
    
    db.commit()
    db.refresh(svc)
    return svc


@api_router.delete("/admin/maintenance-plan/{plan_id}/services/{service_id}")
def delete_service(
    plan_id: int,
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    svc = db.query(MaintenanceService).filter(
        MaintenanceService.id == service_id,
        MaintenanceService.plan_id == plan_id
    ).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    
    db.delete(svc)
    db.commit()
    return {"message": "Service deleted successfully"}


@api_router.get("/customer/maintenance", response_model=MaintenancePlanOut)
def get_my_maintenance_plan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.apartment_id:
        raise HTTPException(status_code=404, detail="No apartment linked to your account")
    plan = db.query(MaintenancePlan).filter(
        MaintenancePlan.apartment_id == current_user.apartment_id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="No maintenance plan configured for your apartment yet")
    return plan


# ─────────────────────────────────────────────
# --- RMS Management (Admin) ---
# ─────────────────────────────────────────────

@api_router.get("/admin/rms/categories", response_model=List[RMSCategoryOut])
def admin_get_rms_cats(db: Session = Depends(get_db)):
    return db.query(RMSCategory).all()

@api_router.post("/admin/rms/categories", response_model=RMSCategoryOut)
def admin_create_rms_cat(data: RMSCategoryCreate, db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    if u.role != "admin": raise HTTPException(status_code=403)
    cat = RMSCategory(name=data.name)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@api_router.patch("/admin/rms/categories/{id}", response_model=RMSCategoryOut)
def admin_patch_rms_cat(id: int, data: RMSCategoryCreate, db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    if u.role != "admin": raise HTTPException(status_code=403)
    cat = db.query(RMSCategory).filter(RMSCategory.id == id).first()
    if not cat: raise HTTPException(status_code=404)
    cat.name = data.name
    db.commit()
    return cat

@api_router.delete("/admin/rms/categories/{id}")
def admin_delete_rms_cat(id: int, db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    if u.role != "admin": raise HTTPException(status_code=403)
    cat = db.query(RMSCategory).filter(RMSCategory.id == id).first()
    if not cat: raise HTTPException(status_code=404)
    db.delete(cat)
    db.commit()
    return {"message": "Category deleted"}

@api_router.post("/admin/rms/subcategories", response_model=RMSSubcategoryOut)
def admin_create_rms_sub(data: RMSSubcategoryCreate, db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    if u.role != "admin": raise HTTPException(status_code=403)
    sub = RMSSubcategory(**data.dict())
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub

@api_router.patch("/admin/rms/subcategories/{id}", response_model=RMSSubcategoryOut)
def admin_patch_rms_sub(id: int, data: RMSSubcategoryCreate, db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    if u.role != "admin": raise HTTPException(status_code=403)
    sub = db.query(RMSSubcategory).filter(RMSSubcategory.id == id).first()
    if not sub: raise HTTPException(status_code=404)
    for k, v in data.dict().items(): setattr(sub, k, v)
    db.commit()
    return sub

@api_router.delete("/admin/rms/subcategories/{id}")
def admin_delete_rms_sub(id: int, db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    if u.role != "admin": raise HTTPException(status_code=403)
    sub = db.query(RMSSubcategory).filter(RMSSubcategory.id == id).first()
    if not sub: raise HTTPException(status_code=404)
    db.delete(sub)
    db.commit()
    return {"message": "Subcategory deleted"}

@api_router.get("/admin/rms/apartments/{apt_id}/mappings")
def admin_get_apt_rms_mappings(apt_id: int, db: Session = Depends(get_db)):
    mappings = db.query(ApartmentCategoryMapping).filter(ApartmentCategoryMapping.apartment_id == apt_id).all()
    return {m.category_id: m.is_enabled for m in mappings}

@api_router.patch("/admin/rms/apartments/{apt_id}/mappings")
def admin_update_apt_rms_mapping(apt_id: int, data: RMSCategoryMappingUpdate, db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    if u.role != "admin": raise HTTPException(status_code=403)
    mapping = db.query(ApartmentCategoryMapping).filter(
        ApartmentCategoryMapping.apartment_id == apt_id,
        ApartmentCategoryMapping.category_id == data.category_id
    ).first()
    if mapping:
        mapping.is_enabled = data.is_enabled
    else:
        mapping = ApartmentCategoryMapping(apartment_id=apt_id, category_id=data.category_id, is_enabled=data.is_enabled)
        db.add(mapping)
    db.commit()
    return {"message": "Mapping updated"}

@api_router.delete("/admin/customers/{customer_id}")
def admin_delete_customer(customer_id: int, db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    if u.role != "admin": raise HTTPException(status_code=403)
    user = db.query(User).filter(User.id == customer_id, User.role == "customer").first()
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Safely handle references
    # 1. Delete visitors belonging to this resident
    db.query(Visitor).filter(Visitor.resident_id == customer_id).delete()
    
    # 2. De-link or delete RMS requests? Usually better to archive or delete if it's a 'permanent remove'
    db.query(RMSRequest).filter(RMSRequest.user_id == customer_id).delete()
    
    # 3. Handle Delivery Requests
    db.query(DeliveryRequest).filter(DeliveryRequest.user_id == customer_id).delete()
    
    # 4. Handle Bookings/Complaints
    db.query(Booking).filter(Booking.customer_id == customer_id).delete()
    db.query(Complaint).filter(Complaint.customer_id == customer_id).delete()
    
    # 5. Handle subscriptions
    db.query(Subscription).filter(Subscription.user_id == customer_id).delete()
    
    db.delete(user)
    db.commit()
    return {"message": f"Resident {user.email} purged from database"}

@api_router.delete("/admin/workers/{worker_id}")
def admin_delete_worker(worker_id: int, db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    if u.role != "admin": raise HTTPException(status_code=403)
    
    # In the workers dashboard, worker_id being passed is usually WorkerProfile.id
    wp = db.query(WorkerProfile).filter(WorkerProfile.id == worker_id).first()
    if wp:
        user_id = wp.user_id
        user = db.query(User).filter(User.id == user_id, User.role == "worker").first()
    else:
        # Fallback to User ID if it was passed instead
        user = db.query(User).filter(User.id == worker_id, User.role == "worker").first()
        if not user:
            raise HTTPException(status_code=404, detail="Worker not found")
        wp = db.query(WorkerProfile).filter(WorkerProfile.user_id == user.id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Worker record inherently absent")
    
    try:
        if wp:
            # Unbind tasks and bookings
            db.query(RMSRequest).filter(RMSRequest.worker_id == wp.id).update({"worker_id": None, "status": "Requested"})
            db.query(Booking).filter(Booking.worker_id == wp.id).update({"worker_id": None, "status": "pending"})
            db.query(Complaint).filter(Complaint.worker_id == wp.id).update({"worker_id": None})
            
            # Delete attendance
            db.query(Attendance).filter(Attendance.worker_id == wp.id).delete()
            
            # Finally delete profile
            db.delete(wp)
            db.flush()

        # 2. Cleanup User-level links
        db.query(Visitor).filter(Visitor.resident_id == user.id).delete()
        db.query(RMSRequest).filter(RMSRequest.user_id == user.id).delete()
        db.query(Booking).filter(Booking.customer_id == user.id).delete()
        db.query(Complaint).filter(Complaint.customer_id == user.id).delete()
        db.query(DeliveryRequest).filter(DeliveryRequest.user_id == user.id).delete()
        db.query(Subscription).filter(Subscription.user_id == user.id).delete()

        # 3. Purge User
        db.delete(user)
        db.commit()
        return {"message": f"Worker {user.email} removed from system"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database error: {str(e)}")

@api_router.get("/admin/rms/requests", response_model=List[RMSRequestOut])
def admin_get_all_requests(db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    if u.role != "admin": raise HTTPException(status_code=403)
    results = db.query(RMSRequest).order_by(RMSRequest.created_at.desc()).all()
    # Add worker names
    for r in results:
        if r.worker_id:
            w = db.query(WorkerProfile).filter(WorkerProfile.id == r.worker_id).first()
            r.worker_name = w.name if w else "Assigned"
    return results

# ─────────────────────────────────────────────
# --- RMS (Customer) ---
# ─────────────────────────────────────────────

@api_router.get("/rms/categories", response_model=List[RMSCategoryOut])
def get_user_rms_categories(db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    if not u.apartment_id: raise HTTPException(status_code=404, detail="No apartment linked")
    
    # Get enabled category IDs for this apartment
    enabled_ids = db.query(ApartmentCategoryMapping.category_id).filter(
        ApartmentCategoryMapping.apartment_id == u.apartment_id,
        ApartmentCategoryMapping.is_enabled == True
    ).all()
    enabled_ids = [id_tuple[0] for id_tuple in enabled_ids]
    
    # Fetch these categories
    return db.query(RMSCategory).filter(RMSCategory.id.in_(enabled_ids)).all()

@api_router.post("/rms/requests", response_model=RMSRequestOut)
def raise_rms_request(data: RMSRequestCreate, db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    # 1. Check if category is enabled for this apartment
    mapping = db.query(ApartmentCategoryMapping).filter(
        ApartmentCategoryMapping.apartment_id == u.apartment_id,
        ApartmentCategoryMapping.category_id == data.category_id,
        ApartmentCategoryMapping.is_enabled == True
    ).first()
    if not mapping:
        # If no mapping exists, we might want to check if it's new. 
        # But per logic, only mapped items are shown to user.
        raise HTTPException(status_code=403, detail="Category not available for your apartment")
    
    # 2. Get subcategory to fetch priority
    sub = db.query(RMSSubcategory).filter(RMSSubcategory.id == data.subcategory_id).first()
    if not sub: raise HTTPException(status_code=404, detail="Subcategory not found")
    
    # 3. Create request
    new_req = RMSRequest(
        user_id = u.id,
        category_id = data.category_id,
        subcategory_id = data.subcategory_id,
        description = data.description,
        image_url = data.image_url,
        priority_level = sub.priority_level,
        status = "Requested"
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    return new_req

@api_router.get("/rms/requests", response_model=List[RMSRequestOut])
def get_my_rms_requests(db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    results = db.query(RMSRequest).filter(RMSRequest.user_id == u.id).order_by(RMSRequest.created_at.desc()).all()
    # Add worker names
    for r in results:
        if r.worker_id:
            w = db.query(WorkerProfile).filter(WorkerProfile.id == r.worker_id).first()
            r.worker_name = w.name if w else "Assigned"
    return results
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Create unique filename
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join("uploads", filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"url": f"/uploads/{filename}"}

# ─────────────────────────────────────────────
# --- Extra Services APIs ---

@api_router.get("/categories", response_model=List[ExtraServiceCategoryOut])
def get_service_categories(db: Session = Depends(get_db)):
    return db.query(ExtraServiceCategory).filter(ExtraServiceCategory.is_active == True).order_by(ExtraServiceCategory.display_order).all()

@api_router.get("/categories/{cat_id}", response_model=ExtraServiceCategoryOut)
def get_service_category(cat_id: int, db: Session = Depends(get_db)):
    cat = db.query(ExtraServiceCategory).filter(ExtraServiceCategory.id == cat_id).first()
    if not cat: raise HTTPException(status_code=404)
    return cat

@api_router.get("/subcategories/{sub_id}", response_model=ExtraServiceSubCategoryOut)
def get_service_subcategory(sub_id: int, db: Session = Depends(get_db)):
    sub = db.query(ExtraServiceSubCategory).filter(ExtraServiceSubCategory.id == sub_id).first()
    if not sub: raise HTTPException(status_code=404)
    return sub

@api_router.get("/banners", response_model=List[ExtraServiceBannerOut])
def get_service_banners(db: Session = Depends(get_db)):
    return db.query(ExtraServiceBanner).filter(ExtraServiceBanner.is_active == True).order_by(ExtraServiceBanner.display_order).all()

@api_router.get("/stats", response_model=ExtraServiceStatsOut)
def get_service_stats(db: Session = Depends(get_db)):
    stats = db.query(ExtraServiceStats).first()
    if not stats:
        stats = ExtraServiceStats(rating_value="4.8", total_customers="12M+")
        db.add(stats)
        db.commit()
    return stats

# --- Extra Services Admin ---

@api_router.post("/admin/categories", response_model=ExtraServiceCategoryOut)
def admin_create_category(cat: ExtraServiceCategoryCreate, db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    print(f"DEBUG: Admin Create Category Hit by {u.email}. Payload: {cat.dict()}")
    if u.role != "admin": raise HTTPException(status_code=403)
    try:
        new_cat = ExtraServiceCategory(**cat.dict())
        db.add(new_cat)
        db.commit()
        db.refresh(new_cat)
        return new_cat
    except Exception as e:
        print(f"ERROR creating category: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/admin/categories/{id}", response_model=ExtraServiceCategoryOut)
def admin_update_category(id: int, cat_data: ExtraServiceCategoryCreate, db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    if u.role != "admin": raise HTTPException(status_code=403)
    cat = db.query(ExtraServiceCategory).filter(ExtraServiceCategory.id == id).first()
    if not cat: raise HTTPException(status_code=404)
    for k, v in cat_data.dict().items(): setattr(cat, k, v)
    db.commit()
    return cat

@api_router.delete("/admin/categories/{id}")
def admin_delete_category(id: int, db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    if u.role != "admin": raise HTTPException(status_code=403)
    cat = db.query(ExtraServiceCategory).filter(ExtraServiceCategory.id == id).first()
    if not cat: raise HTTPException(status_code=404)
    db.delete(cat)
    db.commit()
    return {"message": "Deleted"}

@api_router.post("/admin/subcategories", response_model=ExtraServiceSubCategoryOut)
def admin_create_subcategory(sub: ExtraServiceSubCategoryCreate, db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    if u.role != "admin": raise HTTPException(status_code=403)
    new_sub = ExtraServiceSubCategory(**sub.dict())
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return new_sub

@api_router.put("/admin/subcategories/{id}", response_model=ExtraServiceSubCategoryOut)
def admin_update_subcategory(id: int, sub_data: ExtraServiceSubCategoryCreate, db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    if u.role != "admin": raise HTTPException(status_code=403)
    sub = db.query(ExtraServiceSubCategory).filter(ExtraServiceSubCategory.id == id).first()
    if not sub: raise HTTPException(status_code=404)
    for k, v in sub_data.dict().items(): setattr(sub, k, v)
    db.commit()
    return sub

@api_router.delete("/admin/subcategories/{id}")
def admin_delete_subcategory(id: int, db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    if u.role != "admin": raise HTTPException(status_code=403)
    sub = db.query(ExtraServiceSubCategory).filter(ExtraServiceSubCategory.id == id).first()
    if not sub: raise HTTPException(status_code=404)
    db.delete(sub)
    db.commit()
    return {"message": "Deleted"}

@api_router.post("/admin/service-types", response_model=ExtraServiceTypeOut)
def admin_create_service_type(stype: ExtraServiceTypeCreate, db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    if u.role != "admin": raise HTTPException(status_code=403)
    new_type = ExtraServiceType(**stype.dict())
    db.add(new_type)
    db.commit()
    db.refresh(new_type)
    return new_type

@api_router.put("/admin/service-types/{id}", response_model=ExtraServiceTypeOut)
def admin_update_service_type(id: int, type_data: ExtraServiceTypeCreate, db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    if u.role != "admin": raise HTTPException(status_code=403)
    stype = db.query(ExtraServiceType).filter(ExtraServiceType.id == id).first()
    if not stype: raise HTTPException(status_code=404)
    for k, v in type_data.dict().items(): setattr(stype, k, v)
    db.commit()
    return stype

@api_router.delete("/admin/service-types/{id}")
def admin_delete_service_type(id: int, db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    if u.role != "admin": raise HTTPException(status_code=403)
    stype = db.query(ExtraServiceType).filter(ExtraServiceType.id == id).first()
    if not stype: raise HTTPException(status_code=404)
    db.delete(stype)
    db.commit()
    return {"message": "Deleted"}

@api_router.post("/admin/extra-services", response_model=ExtraServiceOut)
def admin_create_extra_service(svc: ExtraServiceCreate, db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    if u.role != "admin": raise HTTPException(status_code=403)
    new_svc = ExtraService(**svc.dict())
    db.add(new_svc)
    db.commit()
    db.refresh(new_svc)
    return new_svc

@api_router.put("/admin/extra-services/{id}", response_model=ExtraServiceOut)
def admin_update_extra_service(id: int, svc_data: ExtraServiceCreate, db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    if u.role != "admin": raise HTTPException(status_code=403)
    svc = db.query(ExtraService).filter(ExtraService.id == id).first()
    if not svc: raise HTTPException(status_code=404)
    for k, v in svc_data.dict().items(): setattr(svc, k, v)
    db.commit()
    return svc

@api_router.delete("/admin/extra-services/{id}")
def admin_delete_extra_service(id: int, db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    if u.role != "admin": raise HTTPException(status_code=403)
    svc = db.query(ExtraService).filter(ExtraService.id == id).first()
    if not svc: raise HTTPException(status_code=404)
    db.delete(svc)
    db.commit()
    return {"message": "Deleted"}

@api_router.put("/admin/stats", response_model=ExtraServiceStatsOut)
def admin_update_stats(stats_data: ExtraServiceStatsBase, db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    if u.role != "admin": raise HTTPException(status_code=403)
    stats = db.query(ExtraServiceStats).first()
    if not stats: 
        stats = ExtraServiceStats()
        db.add(stats)
    stats.rating_value = stats_data.rating_value
    stats.total_customers = stats_data.total_customers
    db.commit()
    return stats

@api_router.post("/admin/banners", response_model=ExtraServiceBannerOut)
def admin_create_banner(banner: ExtraServiceBannerBase, db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    if u.role != "admin": raise HTTPException(status_code=403)
    new_banner = ExtraServiceBanner(**banner.dict())
    db.add(new_banner)
    db.commit()
    return new_banner

@api_router.delete("/admin/banners/{id}")
def admin_delete_banner(id: int, db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    if u.role != "admin": raise HTTPException(status_code=403)
    banner = db.query(ExtraServiceBanner).filter(ExtraServiceBanner.id == id).first()
    if not banner: raise HTTPException(status_code=404)
    db.delete(banner)
    db.commit()
    return {"message": "Deleted"}
