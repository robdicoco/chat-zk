from sqlalchemy import Column, String, ForeignKey, DateTime, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy.sql import func
import uuid

class Contact(Base):
    __tablename__ = "contacts"

    # Add the composite unique constraint
    __table_args__ = (
        UniqueConstraint('user_id', 'contact_id', name='_user_contact_uc'),
        Index('idx_user', 'user_id'),
        Index('idx_user_contact', 'contact_id', 'user_id')
    )

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    contact_id = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    initiating_user = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="contacts_initiated"
    )
    
    contact_user = relationship(
        "User",
        foreign_keys=[contact_id],
        back_populates="contacts_received"
    )