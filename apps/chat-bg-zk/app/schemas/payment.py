from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PaymentBase(BaseModel):
    transaction_id: str
    source: str
    destination: str
    currency: Optional[str] = None
    value: float
    taxes: float = 0.0
    status: Optional[str] = None
    transaction_type: Optional[str] = None
    year: Optional[int] = None
    month: Optional[int] = None

class PaymentCreate(PaymentBase):
    pass

class Payment(PaymentBase):
    user_id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
