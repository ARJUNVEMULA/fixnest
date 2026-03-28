from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class BlockBase(BaseModel):
    apartment_id: int
    block_name: str

class BlockOut(BlockBase):
    id: int
    class Config:
        from_attributes = True

class ApartmentBase(BaseModel):
    name: str
    code: str

class ApartmentOut(ApartmentBase):
    id: int
    blocks: List[BlockOut] = []
    class Config:
        from_attributes = True

class DepartmentBase(BaseModel):
    name: str

class DepartmentOut(DepartmentBase):
    id: int
    class Config:
        from_attributes = True

class DepartmentCreate(DepartmentBase):
    pass

class ClusterBase(BaseModel):
    name: str

class ClusterOut(ClusterBase):
    id: int
    class Config:
        from_attributes = True

class ClusterCreate(ClusterBase):
    pass

class VisitorBase(BaseModel):
    name: str
    phone: str
    visit_date: datetime
    expected_check_in_time: Optional[datetime] = None
    expected_check_out_time: Optional[datetime] = None
    flat_id: str

class VisitorCreate(VisitorBase):
    pass

class VisitorOut(VisitorBase):
    id: int
    secure_token: Optional[str] = None
    actual_check_in_time: Optional[datetime] = None
    actual_check_out_time: Optional[datetime] = None
    status: str
    is_used: bool
    expiry_time: datetime
    class Config:
        from_attributes = True

class VisitorVerify(BaseModel):
    secure_token: str

class VisitorExtend(BaseModel):
    new_check_out_time: datetime
    reason: Optional[str] = None

class UserBase(BaseModel):
    mobile_number: Optional[str] = None

class OTPVerify(BaseModel):
    mobile_number: str
    otp: str

class OTPSend(BaseModel):
    mobile_number: str

class UserCreate(UserBase):
    mobile_number: str
    username: str
    apartment_id: int
    block: str
    floor_number: int
    flat_number: int
    password: str
    role: str = "customer"
    user_type: str = "apartment"  # apartment | independent (future)

class UserOut(UserBase):
    id: int
    username: Optional[str] = None
    apartment_id: Optional[int] = None
    block: Optional[str] = None
    floor_number: Optional[int] = None
    flat_number: Optional[int] = None
    flat_id: Optional[str] = None
    role: str
    user_type: str = "apartment"  # apartment | independent (future)
    is_active: bool
    # subscription omitted for apartment users; will be added for independent-house users in future
    gender: Optional[str] = None
    profile_photo: Optional[str] = None
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    username: Optional[str] = None
    mobile_number: Optional[str] = None
    gender: Optional[str] = None
    profile_photo: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    identifier: Optional[str] = None

class ServiceBase(BaseModel):
    name: str
    category: str
    description: str
    price: int

class ServiceOut(ServiceBase):
    id: int
    class Config:
        from_attributes = True

class WorkerOut(BaseModel):
    id: int
    user_id: int
    name: Optional[str] = None
    mobile_number: Optional[str] = None
    gender: Optional[str] = None
    skills: str
    location: Optional[str] = None
    is_available: bool
    is_emergency_reserved: bool = False
    class Config:
        from_attributes = True

class WorkerUpdate(BaseModel):
    name: str
    mobile_number: str
    gender: str
    skills: str
    location: str

class BookingBase(BaseModel):
    service_id: int
    date: str
    time_slot: str
    location: str

class BookingOut(BookingBase):
    id: int
    customer_id: int
    worker_id: Optional[int] = None
    status: str
    created_at: datetime
    worker: Optional[WorkerOut] = None
    original_price: int = 0
    discount_applied: int = 0
    final_price: int = 0
    class Config:
        from_attributes = True

class ComplaintBase(BaseModel):
    complaint_type: str
    description: Optional[str] = None

class ComplaintOut(BaseModel):
    id: int
    customer_id: int
    booking_id: Optional[int] = None
    worker_id: Optional[int] = None
    worker: Optional[WorkerOut] = None
    complaint_type: str
    description: Optional[str] = None
    priority: int
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

class SubscriptionBase(BaseModel):
    plan_name: str

class SubscriptionOut(BaseModel):
    id: int
    user_id: int
    plan_name: str
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

class AttendanceBase(BaseModel):
    worker_id: int
    date: str
    status: str

class AttendanceOut(AttendanceBase):
    id: int
    marked_at: datetime
    class Config:
        from_attributes = True

class AdminWorkerOut(BaseModel):
    worker_id: int
    user_id: int
    name: Optional[str] = None
    username: str
    department: str
    contact_info: Optional[str] = None
    
    class Config:
        from_attributes = True

class AdminWorkerCreate(BaseModel):
    name: str
    email: str
    mobile_number: str
    password: str
    gender: str
    skills: str
    location: str

class AdminCustomerOut(BaseModel):
    customer_id: int
    name: Optional[str] = None
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    
    class Config:
        from_attributes = True

class AnnouncementCreate(BaseModel):
    title: str
    message: str
    target_audience: str = "all"   # customer / worker / all
    priority: str = "normal"       # normal / urgent
    expiry_date: Optional[datetime] = None

class AnnouncementOut(BaseModel):
    id: int
    title: str
    message: str
    target_audience: str
    priority: str
    created_at: datetime
    expiry_date: Optional[datetime] = None

    class Config:
        from_attributes = True

# ── Maintenance Plan ──────────────────────────────────────
class MaintenanceServiceCreate(BaseModel):
    service_name: str
    is_enabled: bool = True
    sla_time: Optional[str] = None

class MaintenanceServiceOut(BaseModel):
    id: int
    service_name: str
    is_enabled: bool
    sla_time: Optional[str] = None
    class Config:
        from_attributes = True

class MaintenancePlanCreate(BaseModel):
    apartment_id: int
    plan_name: str = "Basic"
    maintenance_charge: int = 0
    services: Optional[List[MaintenanceServiceCreate]] = []

class MaintenancePlanUpdate(BaseModel):
    plan_name: Optional[str] = None
    maintenance_charge: Optional[int] = None
    services: Optional[List[MaintenanceServiceCreate]] = None

class MaintenancePlanOut(BaseModel):
    id: int
    apartment_id: int
    plan_name: str
    maintenance_charge: int
    services: List[MaintenanceServiceOut] = []
    class Config:
        from_attributes = True

class ApartmentMaintenanceOut(BaseModel):
    apartment_id: int
    apartment_name: str
    total_residents: int
    plan: Optional[MaintenancePlanOut] = None
    class Config:
        from_attributes = True

# ── RMS (Request Management System) ─────────────────────────
class RMSSubcategoryBase(BaseModel):
    name: str
    priority_level: int = 3
    sla_time: Optional[str] = None

class RMSSubcategoryCreate(RMSSubcategoryBase):
    category_id: int

class RMSSubcategoryOut(RMSSubcategoryBase):
    id: int
    category_id: int
    class Config:
        from_attributes = True

class RMSCategoryBase(BaseModel):
    name: str

class RMSCategoryCreate(RMSCategoryBase):
    pass

class RMSCategoryOut(RMSCategoryBase):
    id: int
    subcategories: List[RMSSubcategoryOut] = []
    class Config:
        from_attributes = True

class RMSCategoryMappingUpdate(BaseModel):
    category_id: int
    is_enabled: bool

class RMSRequestCreate(BaseModel):
    category_id: int
    subcategory_id: int
    description: str
    contact_number: Optional[str] = None
    image_url: Optional[str] = None

class RMSRequestOut(BaseModel):
    id: int
    user_id: int
    category: RMSCategoryBase
    subcategory: RMSSubcategoryBase
    description: str
    image_url: Optional[str] = None
    priority_level: int
    status: str
    worker_id: Optional[int] = None
    worker_name: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# ── Delivery & Parcel Management ─────────────────────────────
class DeliveryRequestCreate(BaseModel):
    mode: str # verification / parcel
    delivery_agent_name: str
    mobile_number: str
    delivery_app: str
    item_type: Optional[str] = None
    expected_time: datetime
    notes: Optional[str] = None

class DeliveryRequestOut(BaseModel):
    id: int
    user_id: int
    flat_id: str
    mode: str
    delivery_agent_name: str
    mobile_number: str
    delivery_app: str
    item_type: Optional[str] = None
    status: str
    expected_time: datetime
    received_time: Optional[datetime] = None
    collected_time: Optional[datetime] = None
    otp: Optional[str] = None
    image_url: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class DeliveryAction(BaseModel):
    delivery_id: int
    action: str # verify / receive / reject
    image_url: Optional[str] = None

class DeliveryOTPVerify(BaseModel):
    delivery_id: int
    otp: str
# ── Extra Services ──────────────────────────────────────────
class ExtraServiceCategoryBase(BaseModel):
    name: str
    image_url: str
    display_order: int = 0
    is_active: bool = True

class ExtraServiceCategoryCreate(ExtraServiceCategoryBase):
    pass

class ExtraServiceSubCategoryBase(BaseModel):
    category_id: int
    group_name: str
    title: str
    image_url: Optional[str] = None
    is_active: bool = True
    display_order: int = 0

class ExtraServiceSubCategoryCreate(ExtraServiceSubCategoryBase):
    pass

class ExtraServiceTypeBase(BaseModel):
    subcategory_id: int
    name: str
    image_url: Optional[str] = None
    is_active: bool = True
    display_order: int = 0

class ExtraServiceTypeCreate(ExtraServiceTypeBase):
    pass

class ExtraServiceBase(BaseModel):
    category_id: int
    subcategory_id: int
    type_id: int
    title: str
    description: str
    price: int
    duration: str
    image_url: Optional[str] = None
    rating: str = "4.8"
    review_count: str = "0"
    is_bestseller: bool = False
    is_active: bool = True
    display_order: int = 0

class ExtraServiceCreate(ExtraServiceBase):
    pass

class ExtraServiceOut(ExtraServiceBase):
    id: int
    class Config:
        from_attributes = True

class ExtraServiceTypeOut(ExtraServiceTypeBase):
    id: int
    services: List[ExtraServiceOut] = []
    class Config:
        from_attributes = True

class ExtraServiceSubCategoryOut(ExtraServiceSubCategoryBase):
    id: int
    service_types: List[ExtraServiceTypeOut] = []
    class Config:
        from_attributes = True

class ExtraServiceCategoryOut(ExtraServiceCategoryBase):
    id: int
    created_at: datetime
    subcategories: List[ExtraServiceSubCategoryOut] = []
    class Config:
        from_attributes = True

class ExtraServiceBannerBase(BaseModel):
    image_url: str
    display_order: int = 0
    is_active: bool = True

class ExtraServiceBannerOut(ExtraServiceBannerBase):
    id: int
    class Config:
        from_attributes = True

class ExtraServiceStatsBase(BaseModel):
    rating_value: str
    total_customers: str

class ExtraServiceStatsOut(ExtraServiceStatsBase):
    id: int
    updated_at: datetime
    class Config:
        from_attributes = True
