# This file contains the routes for the payment API
# It is used to store, update and retrieve payment information
# It is also used to retrieve the latest payment history
# It is also used to retrieve the payment history by year and month
# It is also used to retrieve the payment history by year   

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.payment import Payment as PaymentModel
from app.models.user import User
from app.schemas.payment import PaymentCreate, Payment as PaymentSchema

router = APIRouter()

@router.post("/store", response_model=PaymentSchema)
def store_payment_info(user_name: str, payment: PaymentCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_name == user_name).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_payment = PaymentModel(
        user_id=user.id,
        transaction_id=payment.transaction_id,
        source=payment.source,
        destination=payment.destination,
        currency=payment.currency,
        value=payment.value,
        taxes=payment.taxes,
        status=payment.status,
        transaction_type=payment.transaction_type,
        year=payment.year,
        month=payment.month
    )
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment


@router.post("/update/{payment_id}", response_model=list[PaymentSchema])
def update_payment_info(payment_id: str, status: str, db: Session = Depends(get_db)):
    db_payment = db.query(PaymentModel).filter(PaymentModel.id == payment_id).first()
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
       
    db_payment.status = status
    db.commit()
    db.refresh(db_payment)
    return db_payment


@router.get("/history", response_model=list[PaymentSchema])
def retrieve_payment_history(user_name: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_name == user_name).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    payments = db.query(PaymentModel).filter(PaymentModel.user_id == user.id).all()
    return payments


@router.get("/history/latest", response_model=list[PaymentSchema])
def retrieve_latest_payment_history(user_name: str, quantity: int = 5, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_name == user_name).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    payments = db.query(PaymentModel).filter(PaymentModel.user_id == user.id).order_by(PaymentModel.created_at.desc()).limit(quantity).all()
    return payments


@router.get("/history/{year}/{month}", response_model=list[PaymentSchema])
def retrieve_payment_history_by_year_and_month(year: int, month: int, user_name: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_name == user_name).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    payments = db.query(PaymentModel).filter(
        PaymentModel.user_id == user.id,
        PaymentModel.year == year,
        PaymentModel.month == month
    ).all()
    return payments


@router.get("/history/{year}", response_model=list[PaymentSchema])
def retrieve_payment_history_by_year(year: int, user_name: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_name == user_name).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    payments = db.query(PaymentModel).filter(
        PaymentModel.user_id == user.id,
        PaymentModel.year == year
    ).all()
    return payments
