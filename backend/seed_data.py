from app.db.database import SessionLocal, Base, engine
from app.models.all_models import User, Service, WorkerProfile, ExtraServiceCategory, ExtraServiceSubCategory, ExtraServiceType, ExtraService, ExtraServiceBanner, ExtraServiceStats
from app.core.security import get_password_hash

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    admin = db.query(User).filter(User.email == "admin@fixnest.com").first()
    if not admin:
        new_admin = User(email="admin@fixnest.com", hashed_password=get_password_hash("admin123"), role="admin")
        db.add(new_admin)
        db.commit()

    if db.query(Service).count() == 0:
        db.add_all([
            Service(name="Plumbing", category="plumbing", description="Expert plumbing services", price=100),
            Service(name="Electrical Setup", category="electrical", description="Wiring and setup", price=150),
            Service(name="Cleaning", category="cleaning", description="Deep home cleaning", price=80)
        ])
        db.commit()
        
    if db.query(WorkerProfile).count() == 0:
        locations = ["Downtown", "Northside", "Westside"]
        categories = ["plumbing", "electrical", "cleaning", "plumbing"]
        for i, cat in enumerate(categories):
            loc = locations[i % len(locations)]
            wu = User(email=f"worker{i}@fixnest.com", hashed_password=get_password_hash("worker123"), role="worker")
            db.add(wu)
            db.commit()
            db.refresh(wu)
            
            wp = WorkerProfile(user_id=wu.id, skills=cat, location=loc, is_available=True)
            db.add(wp)
            db.commit()

    if db.query(ExtraServiceCategory).count() == 0:
        c1 = ExtraServiceCategory(name="Cleaning & Pest Control", image_url="/uploads/cleaning_icon.png", display_order=0)
        c2 = ExtraServiceCategory(name="AC & Appliance Repair", image_url="/uploads/ac_icon.png", display_order=1)
        db.add_all([c1, c2])
        db.commit()

        # Level 2: Subcategories
        s1 = ExtraServiceSubCategory(category_id=c1.id, group_name="Cleaning", title="Bathroom Cleaning", display_order=0)
        s2 = ExtraServiceSubCategory(category_id=c1.id, group_name="Cleaning", title="Kitchen Cleaning", display_order=1)
        s3 = ExtraServiceSubCategory(category_id=c1.id, group_name="Pest Control", title="Cockroach Control", display_order=2)
        db.add_all([s1, s2, s3])
        db.commit()

        # Level 3: Service Types (Left Panel)
        t1 = ExtraServiceType(subcategory_id=s2.id, name="Chimney Cleaning", display_order=0)
        t2 = ExtraServiceType(subcategory_id=s2.id, name="Appliance Cleaning", display_order=1)
        db.add_all([t1, t2])
        db.commit()

        # Level 4: Actual Services
        db.add_all([
            ExtraService(
                category_id=c1.id, subcategory_id=s2.id, type_id=t1.id,
                title="2 visits: Chimney cleaning",
                description="Book 2 visits chimney cleaning at a discounted price. Schedule your first service now & the remaining anytime within 6 months.",
                price=359, duration="45 mins", rating="4.82", review_count="251K", is_bestseller=True
            ),
            ExtraService(
                category_id=c1.id, subcategory_id=s2.id, type_id=t1.id,
                title="Single visit: Chimney cleaning",
                description="Expert cleaning of your chimney to remove oil and grime.",
                price=399, duration="60 mins", rating="4.75", review_count="120K", is_bestseller=False
            )
        ])
        db.commit()

    if db.query(ExtraServiceBanner).count() == 0:
        db.add_all([
            ExtraServiceBanner(image_url="/uploads/promo_banner.png", display_order=0),
            ExtraServiceBanner(image_url="/uploads/ac_banner.png", display_order=1),
            ExtraServiceBanner(image_url="/uploads/salon_banner.png", display_order=2),
            ExtraServiceBanner(image_url="/uploads/plumbing_banner.png", display_order=3)
        ])
        db.commit()

    if db.query(ExtraServiceStats).count() == 0:
        db.add(ExtraServiceStats(rating_value="4.8", total_customers="12M+"))
        db.commit()
            
    db.close()
    print("Database seeded successfully with workers!")

if __name__ == "__main__":
    seed()
