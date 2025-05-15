from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..database import Base

class FaceCommitment(Base):
    __tablename__ = "face_commitments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    commitment = Column(String, nullable=False, unique=True)  # Poseidon hash of face descriptor
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<FaceCommitment(id={self.id}, user_id={self.user_id}, commitment={self.commitment})>" 