from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ContactBase(BaseModel):
    contact_id: str

class ContactCreate(ContactBase):
    pass

class Contact(ContactBase):
    id: str
    user_id: str
    created_at: datetime  # Use datetime, not string

    class Config:
        from_attributes = True
