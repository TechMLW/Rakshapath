import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[2]
_SRC_DIR = _REPO_ROOT / "src"
_BACKEND_DIR = _SRC_DIR / "backend"

for _p in (_SRC_DIR, _BACKEND_DIR):
    if str(_p) not in sys.path:
        sys.path.insert(0, str(_p))


from fastapi.security import OAuth2PasswordRequestForm
from admin import router as admin_router
from notifications import router as notifications_router
from routes import router as routes_router
from reports import router as reports_router
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

from database import engine, Base, get_db
from models import User
from schemas import UserCreate, UserLogin
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)

import models


import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Raksha-Path API",
    description="AI-Powered Intelligent Route Optimization & Community Safety Platform",
    version="1.0.0"
)

# Configure CORS
cors_origins_env = os.getenv("CORS_ORIGINS")
if cors_origins_env:
    allow_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
else:
    allow_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# CREATE DATABASE TABLES
# ==========================================

try:
    Base.metadata.create_all(bind=engine)
except Exception:
    pass

app.include_router(reports_router)
app.include_router(routes_router)
app.include_router(notifications_router)
app.include_router(admin_router)

# ==========================================
# HOME
# ==========================================

@app.get("/")
def home():
    return {
        "message": "Raksha-Path Backend is running!"
    }


# ==========================================
# TEST DATABASE
# ==========================================

@app.get("/test-db")
def test_database():

    try:
        with engine.connect():
            return {
                "status": "success",
                "message": "PostgreSQL connected successfully!"
            }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


# ==========================================
# REGISTER USER
# ==========================================

@app.post("/auth/register")
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password),
        role="user"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "user_id": new_user.id
    }


# ==========================================
# LOGIN USER
# ==========================================

@app.post("/auth/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    existing_user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if not existing_user:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
    form_data.password,
    str(existing_user.password_hash)
):

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={
            "sub": str(existing_user.id)
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
# ==========================================
# CURRENT USER
# ==========================================

@app.get("/auth/me")
def get_me(
    current_user: User = Depends(get_current_user)
):

    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role
    }