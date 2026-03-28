from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class Apartment(Base):
    __tablename__ = "apartments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    code = Column(String(2), unique=True, index=True)

    blocks = relationship("Block", back_populates="apartment", cascade="all, delete-orphan")
    users = relationship("User", back_populates="apartment", cascade="all, delete-orphan")

class Block(Base):
    __tablename__ = "blocks"
    id = Column(Integer, primary_key=True, index=True)
    apartment_id = Column(Integer, ForeignKey("apartments.id"))
    block_name = Column(String)

    apartment = relationship("Apartment", back_populates="blocks")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    mobile_number = Column(String, unique=True, index=True)
    username = Column(String)
    email = Column(String, unique=True, index=True, nullable=True) # Kept for backward compatibility if needed, but not strictly required
    apartment_id = Column(Integer, ForeignKey("apartments.id"), nullable=True)
    block = Column(String, nullable=True)
    floor_number = Column(Integer, nullable=True)
    flat_number = Column(Integer, nullable=True)
    flat_id = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String)
    role = Column(String, default="customer")  # admin, customer, worker
    user_type = Column(String, default="apartment")  # apartment | independent (future)
    is_active = Column(Boolean, default=True)
    gender = Column(String, nullable=True)
    profile_photo = Column(String, nullable=True)
    
    apartment = relationship("Apartment", back_populates="users")
    bookings = relationship("Booking", back_populates="customer", foreign_keys="Booking.customer_id")
    worker_profile = relationship("WorkerProfile", back_populates="user", uselist=False)
    subscription = relationship("Subscription", back_populates="user", uselist=False)  # used for future independent-house users

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

class Cluster(Base):
    __tablename__ = "clusters"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

class Visitor(Base):
    __tablename__ = "visitors"
    id = Column(Integer, primary_key=True, index=True)
    secure_token = Column(String, unique=True, index=True, nullable=True) # Used for QR and verification
    name = Column(String)
    phone = Column(String)
    flat_id = Column(String)
    resident_id = Column(Integer, ForeignKey("users.id"))
    
    visit_date = Column(DateTime)
    expected_check_in_time = Column(DateTime, nullable=True)
    expected_check_out_time = Column(DateTime, nullable=True)
    
    actual_check_in_time = Column(DateTime, nullable=True)
    actual_check_out_time = Column(DateTime, nullable=True)
    
    status = Column(String, default="Scheduled") # Scheduled, Checked-IN, Checked-OUT, Overstay
    is_used = Column(Boolean, default=False)
    expiry_time = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    resident = relationship("User")

class WorkerProfile(Base):
    __tablename__ = "workers"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    name = Column(String, nullable=True)
    mobile_number = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    skills = Column(String)
    is_available = Column(Boolean, default=True)
    location = Column(String)
    is_emergency_reserved = Column(Boolean, default=False)

    user = relationship("User", back_populates="worker_profile")

class Service(Base):
    __tablename__ = "services"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String)
    description = Column(String)
    price = Column(Integer)
    
class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"))
    service_id = Column(Integer, ForeignKey("services.id"))
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=True)
    date = Column(String)
    time_slot = Column(String)
    location = Column(String)
    status = Column(String, default="pending")
    original_price = Column(Integer, default=0)
    discount_applied = Column(Integer, default=0)
    final_price = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    customer = relationship("User", back_populates="bookings", foreign_keys=[customer_id])
    service = relationship("Service")
    worker = relationship("WorkerProfile")

class Complaint(Base):
    __tablename__ = "complaints"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"))
    booking_id = Column(Integer, ForeignKey("bookings.id"))
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=True)
    complaint_type = Column(String)
    description = Column(String, nullable=True)
    priority = Column(Integer)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("User", foreign_keys=[customer_id])
    booking = relationship("Booking")
    worker = relationship("WorkerProfile")

class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    plan_name = Column(String)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="subscription")

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"))
    date = Column(String)  # YYYY-MM-DD
    status = Column(String, default="present")
    marked_at = Column(DateTime, default=datetime.utcnow)

    worker = relationship("WorkerProfile")

class Announcement(Base):
    __tablename__ = "announcements"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    target_audience = Column(String, default="all")  # customer / worker / all
    priority = Column(String, default="normal")       # normal / urgent
    created_at = Column(DateTime, default=datetime.utcnow)
    expiry_date = Column(DateTime, nullable=True)

class MaintenancePlan(Base):
    __tablename__ = "maintenance_plans"
    id = Column(Integer, primary_key=True, index=True)
    apartment_id = Column(Integer, ForeignKey("apartments.id"), unique=True)
    plan_name = Column(String, default="Basic")          # Basic / Standard / Premium
    maintenance_charge = Column(Integer, default=0)      # monthly charge in ₹
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    apartment = relationship("Apartment")
    services = relationship("MaintenanceService", back_populates="plan", cascade="all, delete-orphan")

class MaintenanceService(Base):
    __tablename__ = "maintenance_services"
    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("maintenance_plans.id"))
    service_name = Column(String)    # plumbing / electrical / cleaning / security / general
    is_enabled = Column(Boolean, default=True)
    sla_time = Column(String, nullable=True)   # e.g. "2 hours", "Next business day"

    plan = relationship("MaintenancePlan", back_populates="services")

class RMSCategory(Base):
    __tablename__ = "rms_categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

    subcategories = relationship("RMSSubcategory", back_populates="category", cascade="all, delete-orphan")

class RMSSubcategory(Base):
    __tablename__ = "rms_subcategories"
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("rms_categories.id"))
    name = Column(String, index=True)
    priority_level = Column(Integer, default=3) # 0-Urgent, 1-High, 2-Medium, 3-Low
    sla_time = Column(String, nullable=True)

    category = relationship("RMSCategory", back_populates="subcategories")

class ApartmentCategoryMapping(Base):
    __tablename__ = "apartment_category_mappings"
    id = Column(Integer, primary_key=True, index=True)
    apartment_id = Column(Integer, ForeignKey("apartments.id"))
    category_id = Column(Integer, ForeignKey("rms_categories.id"))
    is_enabled = Column(Boolean, default=True)

class RMSRequest(Base):
    __tablename__ = "rms_requests"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category_id = Column(Integer, ForeignKey("rms_categories.id"))
    subcategory_id = Column(Integer, ForeignKey("rms_subcategories.id"))
    description = Column(String(500))
    image_url = Column(String, nullable=True)
    priority_level = Column(Integer) # Derived from subcategory
    status = Column(String, default="Requested") # Requested / Assigned / In Progress / Completed
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    category = relationship("RMSCategory")
    subcategory = relationship("RMSSubcategory")
    worker = relationship("WorkerProfile")

class DeliveryRequest(Base):
    __tablename__ = "delivery_requests"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    flat_id = Column(String)
    mode = Column(String)  # verification / parcel
    delivery_agent_name = Column(String)
    mobile_number = Column(String, index=True)
    delivery_app = Column(String) # Amazon, Swiggy, etc.
    item_type = Column(String, nullable=True)
    status = Column(String, default="Requested") # Requested / Verified / Pending Arrival / Received / Collected / Rejected
    expected_time = Column(DateTime)
    received_time = Column(DateTime, nullable=True)
    collected_time = Column(DateTime, nullable=True)
    otp = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

class ExtraServiceCategory(Base):
    __tablename__ = "extra_service_categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    image_url = Column(String)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    subcategories = relationship("ExtraServiceSubCategory", back_populates="category", cascade="all, delete-orphan")

class ExtraServiceSubCategory(Base):
    __tablename__ = "extra_service_subcategories"
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("extra_service_categories.id"))
    group_name = Column(String) # e.g. "Cleaning"
    title = Column(String)      # e.g. "Bathroom Cleaning"
    image_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)

    category = relationship("ExtraServiceCategory", back_populates="subcategories")
    service_types = relationship("ExtraServiceType", back_populates="subcategory", cascade="all, delete-orphan")

class ExtraServiceType(Base):
    __tablename__ = "extra_service_types"
    id = Column(Integer, primary_key=True, index=True)
    subcategory_id = Column(Integer, ForeignKey("extra_service_subcategories.id"))
    name = Column(String)       # e.g. "Discounted pack"
    image_url = Column(String, nullable=True) # or icon
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)

    subcategory = relationship("ExtraServiceSubCategory", back_populates="service_types")
    services = relationship("ExtraService", back_populates="service_type", cascade="all, delete-orphan")

class ExtraService(Base):
    __tablename__ = "extra_services_marketplace"
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("extra_service_categories.id"))
    subcategory_id = Column(Integer, ForeignKey("extra_service_subcategories.id"))
    type_id = Column(Integer, ForeignKey("extra_service_types.id"))
    
    title = Column(String)
    description = Column(String)
    price = Column(Integer)
    duration = Column(String)  # e.g. "45 mins"
    image_url = Column(String, nullable=True)
    rating = Column(String, default="4.8")
    review_count = Column(String, default="0")
    is_bestseller = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)

    category = relationship("ExtraServiceCategory")
    subcategory = relationship("ExtraServiceSubCategory")
    service_type = relationship("ExtraServiceType", back_populates="services")

class ExtraServiceBanner(Base):
    __tablename__ = "extra_service_banners"
    id = Column(Integer, primary_key=True, index=True)
    image_url = Column(String)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

class ExtraServiceStats(Base):
    __tablename__ = "extra_service_stats"
    id = Column(Integer, primary_key=True, index=True)
    rating_value = Column(String, default="4.8")
    total_customers = Column(String, default="12M+")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
