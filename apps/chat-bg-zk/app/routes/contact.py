from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.contact import Contact
from app.models.user import User as UserModel
from app.schemas.contact import ContactCreate, Contact as ContactSchema
from app.schemas.user import User as UserSchema
from app.tools.mailer import Mailer


router = APIRouter()
mailer = Mailer()

@router.get("/listbyusername", response_model=list[UserSchema])
def list_contacts(user_name: str, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.user_name == user_name).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    contacts = db.query(UserModel).join(Contact, Contact.contact_id == UserModel.id).filter(Contact.user_id == user.id).all()
    return contacts


@router.get("/list", response_model=list[UserSchema])
def list_contacts(account_id: str, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.account_id == account_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    contacts = db.query(UserModel).join(Contact, Contact.contact_id == UserModel.id).filter(Contact.user_id == user.id).all()
    return contacts


@router.post("/add", response_model=ContactSchema)
def add_contact(user_name: str, contact_name: str, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.user_name == user_name).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    contact_user = db.query(UserModel).filter(UserModel.user_name == contact_name).first()
    if not contact_user:
        raise HTTPException(status_code=404, detail="Contact user not found")
    
    # contact_user = db.query(UserModel).filter(UserModel.id == contact.contact_id).first()
    # if not contact_user:
    #     raise HTTPException(status_code=404, detail="Contact user not found")
    
    db_contact = Contact(user_id=user.id, contact_id=contact_user.id)
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact


@router.post("/add_by_identifier", response_model=ContactSchema)
def add_contact_by_identifier(account_id: str, identifier: str, db: Session = Depends(get_db)):
    # Get current user
    user = db.query(UserModel).filter(UserModel.account_id == account_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Find contact user by email, username or account_id
    contact_user = (
        db.query(UserModel).filter(
            (UserModel.email == identifier) |
            (UserModel.user_name == identifier) |
            (UserModel.account_id == identifier)
        ).first()
    )
    
    if not contact_user:
        raise HTTPException(status_code=404, detail="Contact not found")

    # Check if contact already exists
    existing_contact = db.query(Contact).filter(
        Contact.user_id == user.id,
        Contact.contact_id == contact_user.id
    ).first()
    
    if existing_contact:
        raise HTTPException(status_code=400, detail="Contact already exists")

    # Create new contact
    db_contact = Contact(user_id=user.id, contact_id=contact_user.id)
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    
    return db_contact


@router.delete("/remove/{contact_id}")
def remove_contact(user_name: str, contact_id: str, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.user_name == user_name).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    contact = db.query(Contact).filter(Contact.user_id == user.id, Contact.contact_id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    db.delete(contact)
    db.commit()
    return {"message": "Contact removed successfully"}

@router.post("/invite")
def invite_user(user_name: str, email: str, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.user_name == user_name).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    subject = f"Invitation to ChatPay GO from {user_name}"
    body = f"""
    Hello!
    
    {user_name} has invited you to join ChatPay GO, a secure messaging platform.
    
    To accept the invitation, please create an account at ChatPay GO Demo platform (https://chatpaygo.758206.xyz/).

    If you want to learn more about ChatPay GO, please visit the website (https://chatpaygo.com/).

    
    Best regards,
    ChatPay GO Team
    """
    
    html_body = f"""
    <html>
        <body>
            <h2>Hello!</h2>
            <p>{user_name} has invited you to join ChatPay GO, a secure messaging platform.</p>
            <p>To accept the invitation, please create an account at <a href="https://chatpaygo.758206.xyz/">ChatPay GO Demo</a> platform.</p>
            <p>If you want to learn more about ChatPay GO, please visit the website (https://chatpaygo.com/).</p>
            <p>Best regards,<br>ChatPay GO Team</p>
        </body>
    </html>
    """
    
    if mailer.send_email(email, subject, body, html_body):
        return {"message": "Invitation email sent successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send invitation email")

@router.post("/send_gift_email")
def send_gift_email(
    user_name: str,
    email: str,
    amount: float,
    currency: str = "USD",
    token: str = "my_token",
    db: Session = Depends(get_db)
):
    user = db.query(UserModel).filter(UserModel.user_name == user_name).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    subject = f"Gift from {user_name} on ChatPay GO"
    body = f"""
    Hello!
    
    {user_name} has sent you a gift of {amount} {currency} on ChatPay GO.
    
    To claim your gift, please create an account at ChatPay GO Demo platform (https://chatpaygo.758206.xyz/) using this email address ({email}) and enter the token: {token}.

    If you want to learn more about ChatPay GO, please visit the website (https://chatpaygo.com/).
    
    Best regards,
    ChatPay GO Team
    """
    
    html_body = f"""
    <html>
        <body>
            <h2>Hello!</h2>
            <p>{user_name} has sent you a gift of {amount} {currency} on ChatPay GO.</p>
            <p>To claim your gift, please create an account at <a href="https://chatpaygo.758206.xyz/">ChatPay GO Demo</a> platform using this email address ({email}) and enter the token: {token}.</p>
            <p>If you want to learn more about ChatPay GO, please visit the website (https://chatpaygo.com/).</p>
            <p>Best regards,<br>ChatPay GO Team</p>
        </body>
    </html>
    """
    
    if mailer.send_email(email, subject, body, html_body):
        return {"message": "Gift email sent successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send gift email")
    

@router.get("/added_by_others", response_model=list[UserSchema])
def list_added_by_others(account_id: str, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.account_id == account_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # find IDs of users I already added
    added_ids_subq = db.query(Contact.contact_id).filter(Contact.user_id == user.id).subquery()
    # find users who added me but whom I have not added back
    contacts = (
        db.query(UserModel)
            .join(Contact, Contact.user_id == UserModel.id)
            .filter(Contact.contact_id == user.id)
            .filter(~UserModel.id.in_(added_ids_subq))
            .all()
    )
    return contacts
