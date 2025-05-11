# models/user.py
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    user_name = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    account_id = Column(String, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Contact relationships
    contacts_initiated = relationship(
        "Contact",
        foreign_keys="[Contact.user_id]",
        back_populates="initiating_user",
        cascade="all, delete-orphan"
    )

    contacts_received = relationship(
        "Contact",
        foreign_keys="[Contact.contact_id]",
        back_populates="contact_user",
        cascade="all, delete-orphan"
    )
    
    # Payment relationship
    payments = relationship(
        "Payment",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender",
        cascade="all, delete-orphan")