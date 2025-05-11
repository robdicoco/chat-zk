from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    user_name: str
    email: EmailStr
    account_id: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: str
    created_at: datetime  # Use datetime, not string

    class Config:
        from_attributes = True  # For ORM mode