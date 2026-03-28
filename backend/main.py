from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.db.database import engine, Base
from app.api.routes import api_router

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="FixNest API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists
if not os.path.exists("uploads"):
    os.makedirs("uploads")

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Welcome to FixNest API"}
