from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User as UserModel
from app.schemas.user import UserCreate, User as UserSchema
import uuid

router = APIRouter()

@router.post("/create", response_model=UserSchema)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = UserModel(
        id=str(uuid.uuid4()),
        user_name=user.user_name,
        email=user.email,
        account_id=user.account_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return UserSchema.from_orm(db_user)

@router.get("/{user_name}", response_model=UserSchema)
def get_user(user_name: str, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.user_name == user_name).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserSchema.from_orm(user)

@router.get("/email/{email}", response_model=UserSchema)
def get_user_by_email(email: str, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserSchema.from_orm(user)

@router.get("/account/{account_id}", response_model=UserSchema)
def get_user_by_account_id(account_id: str, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.account_id == account_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserSchema.from_orm(user)