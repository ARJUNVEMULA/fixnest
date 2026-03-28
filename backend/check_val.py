import sys
from app.db.database import SessionLocal
from app.models.all_models import Booking
from app.schemas.all_schemas import BookingOut

db = SessionLocal()
bookings = db.query(Booking).all()
print("Total bookings:", len(bookings))
for b in bookings:
    try:
        out = BookingOut.from_orm(b)
        print("Booking", b.id, "OK")
    except Exception as e:
        print("Booking", b.id, "Error:", str(e))
