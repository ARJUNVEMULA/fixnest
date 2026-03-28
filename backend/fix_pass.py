import sys
from app.db.database import SessionLocal
from app.models.all_models import User
from app.core.security import get_password_hash

db = SessionLocal()
u = db.query(User).filter(User.id == 2).first()
if u:
    print(f"User found: {u.email}")
    u.hashed_password = get_password_hash("password123")
    db.commit()
    print("Password reset successfully to: password123")
else:
    print("User not found")
