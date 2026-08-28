from pydantic import BaseModel


# ==========================================
# REGISTER
# ==========================================

class UserCreate(BaseModel):
    name: str
    email: str
    password: str


# ==========================================
# LOGIN
# ==========================================

class UserLogin(BaseModel):
    email: str
    password: str