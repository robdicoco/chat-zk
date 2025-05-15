from sqlalchemy.orm import Session
from ..models.face_commitment import FaceCommitment
from ..schemas.face_commitment import FaceCommitmentCreate, FaceVerificationResult
from typing import Optional
import numpy as np
from scipy.spatial.distance import cosine
# import numpy as np
# from ..tools.zk_utils import verify_poseidon_hash

def create_face_commitment(db: Session, commitment: FaceCommitmentCreate) -> FaceCommitment:
    """Create a new face commitment for a user."""
    db_commitment = FaceCommitment(
        user_id=commitment.user_id,
        commitment=commitment.commitment,
        face_descriptor=commitment.face_descriptor
    )
    db.add(db_commitment)
    db.commit()
    db.refresh(db_commitment)
    return db_commitment

def get_face_commitment(db: Session, user_id: int) -> Optional[FaceCommitment]:
    """Get the face commitment for a user."""
    return db.query(FaceCommitment).filter(FaceCommitment.user_id == user_id).first()

def update_face_commitment(db: Session, user_id: int, commitment: str, face_descriptor: list[float]) -> Optional[FaceCommitment]:
    """Update the face commitment for a user."""
    db_commitment = get_face_commitment(db, user_id)
    if db_commitment:
        db_commitment.commitment = commitment
        db_commitment.face_descriptor = face_descriptor
        db.commit()
        db.refresh(db_commitment)
    return db_commitment

def delete_face_commitment(db: Session, user_id: int) -> bool:
    """Delete the face commitment for a user."""
    db_commitment = get_face_commitment(db, user_id)
    if db_commitment:
        db.delete(db_commitment)
        db.commit()
        return True
    return False

def verify_face_commitment(
    db: Session,
    user_id: int,
    face_descriptor: list[float],
    threshold: float = 0.6
) -> FaceVerificationResult:
    """
    Verify a face descriptor against a stored commitment.
    
    Args:
        db: Database session
        user_id: User ID to verify against
        face_descriptor: Face descriptor to verify
        threshold: Similarity threshold (0-1)
    
    Returns:
        FaceVerificationResult with verification status
    """
    try:
        # Get stored commitment
        stored_commitment = get_face_commitment(db, user_id)
        if not stored_commitment:
            return FaceVerificationResult(
                is_valid=False,
                error="No face commitment found for user"
            )

        # Convert descriptors to numpy arrays for comparison
        stored_descriptor = np.array(stored_commitment.face_descriptor)
        input_descriptor = np.array(face_descriptor)

        # Calculate cosine similarity
        similarity = 1 - cosine(stored_descriptor, input_descriptor)
        
        # Determine if verification passed based on threshold
        is_valid = similarity >= threshold

        return FaceVerificationResult(
            is_valid=is_valid,
            similarity_score=float(similarity),
            error=None if is_valid else "Face verification failed - similarity below threshold"
        )

    except Exception as e:
        return FaceVerificationResult(
            is_valid=False,
            error=str(e)
        )

# def verify_face_commitment(
#     db: Session,
#     user_id: int,
#     face_descriptor: list[float],
#     threshold: float = 0.6
# ) -> FaceVerificationResult:
#     """
#     Verify a face descriptor against a stored commitment.
    
#     Args:
#         db: Database session
#         user_id: User ID to verify against
#         face_descriptor: Face descriptor to verify
#         threshold: Similarity threshold (0-1)
    
#     Returns:
#         FaceVerificationResult with verification status
#     """
#     try:
#         # Get stored commitment
#         stored_commitment = get_face_commitment(db, user_id)
#         if not stored_commitment:
#             return FaceVerificationResult(
#                 is_valid=False,
#                 error="No face commitment found for user"
#             )

#         # Verify the commitment using ZK proof
#         is_valid = verify_poseidon_hash(face_descriptor, stored_commitment.commitment)
        
#         if not is_valid:
#             return FaceVerificationResult(
#                 is_valid=False,
#                 error="Face verification failed"
#             )

#         # Calculate similarity score (optional, for logging/monitoring)
#         # In a real implementation, this would be done with ZK proofs
#         similarity_score = 1.0 if is_valid else 0.0

#         return FaceVerificationResult(
#             is_valid=True,
#             similarity_score=similarity_score
#         )

#     except Exception as e:
#         return FaceVerificationResult(
#             is_valid=False,
#             error=str(e)
#         ) 