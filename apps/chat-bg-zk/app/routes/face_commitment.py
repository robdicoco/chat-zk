from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.face_commitment import (
    FaceCommitmentCreate,
    FaceCommitment,
    FaceCommitmentVerify,
    FaceVerificationResult
)
from ..tools import face_commitment as face_commitment_tools

router = APIRouter(
    prefix="/face",
    tags=["face"],
    responses={404: {"description": "Not found"}},
)

@router.post("/enroll", response_model=FaceCommitment)
async def enroll_face(
    commitment: FaceCommitmentCreate,
    db: Session = Depends(get_db)
):
    """Enroll a user's face commitment."""
    try:
        # Check if user already has a commitment
        existing = face_commitment_tools.get_face_commitment(db, commitment.user_id)
        if existing:
            # Update existing commitment
            return face_commitment_tools.update_face_commitment(
                db,
                commitment.user_id,
                commitment.commitment
            )
        
        # Create new commitment
        return face_commitment_tools.create_face_commitment(db, commitment)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/verify", response_model=FaceVerificationResult)
async def verify_face(
    verification: FaceCommitmentVerify,
    db: Session = Depends(get_db)
):
    """Verify a face descriptor against a stored commitment."""
    try:
        result = face_commitment_tools.verify_face_commitment(
            db,
            verification.user_id,
            verification.face_descriptor
        )
        
        if not result.is_valid:
            raise HTTPException(
                status_code=401,
                detail=result.error or "Face verification failed"
            )
            
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{user_id}")
async def delete_face_commitment(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Delete a user's face commitment."""
    try:
        success = face_commitment_tools.delete_face_commitment(db, user_id)
        if not success:
            raise HTTPException(
                status_code=404,
                detail="No face commitment found for user"
            )
        return {"message": "Face commitment deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 