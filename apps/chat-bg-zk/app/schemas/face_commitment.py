from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class FaceCommitmentBase(BaseModel):
    commitment: str

class FaceCommitmentCreate(FaceCommitmentBase):
    user_id: int

class FaceCommitmentVerify(FaceCommitmentBase):
    face_descriptor: list[float]  # The face descriptor to verify against

class FaceCommitment(FaceCommitmentBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class FaceVerificationResult(BaseModel):
    is_valid: bool
    similarity_score: Optional[float] = None
    error: Optional[str] = None 