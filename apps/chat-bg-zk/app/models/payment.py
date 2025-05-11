from sqlalchemy import Column, String, ForeignKey, DateTime, Float, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid
from datetime import datetime
class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    year = Column(Integer, default=datetime.now().year)
    month = Column(Integer, default=datetime.now().month)
    user_id = Column(String, ForeignKey("users.id"))
    transaction_id = Column(String, index=True)
    transaction_type = Column(String, default="transfer")
    source = Column(String)
    destination = Column(String)
    currency = Column(String, default="USDC")
    value = Column(Float)
    taxes = Column(Float, default=0.0)
    status = Column(String, default="completed")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    user = relationship(
        "User",
        back_populates="payments"
    )