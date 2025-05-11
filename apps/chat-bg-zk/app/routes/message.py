# routes/message.py
from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, Body
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.message import Message, Conversation
from app.models.user import User
from app.schemas.message import MessageCreate, MessageResponse, ConversationResponse
from typing import List
import math
from sqlalchemy.sql import func

router = APIRouter()

@router.post("/send", response_model=MessageResponse)
async def send_message(
    account_id: str = Query(..., description="Account ID of the sender"),
    message: MessageCreate = Body(...),
    db: Session = Depends(get_db)
):
    # Get the conversation
    conversation = db.query(Conversation).filter(
        Conversation.id == message.conversation_id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Get the sender
    sender = db.query(User).filter(User.account_id == account_id).first()
    if not sender:
        raise HTTPException(status_code=404, detail="Sender not found")
    
    # Verify sender is part of the conversation
    if sender.id not in [conversation.user1_id, conversation.user2_id]:
        raise HTTPException(status_code=403, detail="Sender is not part of this conversation")
    
    # Create the message
    db_message = Message(
        conversation_id=message.conversation_id,
        sender_id=sender.id,  # Use the user's ID, not account_id
        content=message.content,
        reply_to=message.reply_to
    )
    
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    return MessageResponse(
        id=str(db_message.id),
        conversation_id=str(db_message.conversation_id),
        sender_id=db_message.sender_id,
        content=db_message.content,
        created_at=db_message.created_at,
        reply_to=db_message.reply_to,
        is_deleted=db_message.is_deleted
    )

@router.get("/conversation/{conversation_id}", response_model=dict)
async def get_messages(
    conversation_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    offset = (page - 1) * page_size
    
    messages = db.query(Message).options(
        joinedload(Message.sender),
        joinedload(Message.conversation)
    ).filter(
        Message.conversation_id == conversation_id,
        Message.is_deleted == False
    ).order_by(Message.created_at.desc()).offset(offset).limit(page_size).all()
    
    total_messages = db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.is_deleted == False
    ).count()
    
    return {
        "messages": [MessageResponse(
            id=msg.id,
            conversation_id=msg.conversation_id,
            sender_id=msg.sender_id,
            content=msg.content,
            created_at=msg.created_at,
            reply_to=msg.reply_to
        ) for msg in messages],
        "total": total_messages,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total_messages / page_size)
    }

@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    user_name: str,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.user_name == user_name).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    conversations = db.query(Conversation).filter(
        (Conversation.user1_id == user.id) |
        (Conversation.user2_id == user.id)
    ).options(joinedload(Conversation.messages)).order_by(Conversation.updated_at.desc()).all()
    
    return conversations

@router.get("/conversation_accounts/{account_id}", response_model=ConversationResponse)
async def get_or_create_conversation(
    account_id: str,
    third_party_account_id: str,
    db: Session = Depends(get_db)
):
    # Get both users
    current_user = db.query(User).filter(User.account_id == account_id).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="Current user not found")
    
    other_user = db.query(User).filter(User.account_id == third_party_account_id).first()
    if not other_user:
        raise HTTPException(status_code=404, detail="Contact user not found")
    
    # Try to find existing conversation
    conversation = db.query(Conversation).filter(
        ((Conversation.user1_id == current_user.id) & (Conversation.user2_id == other_user.id)) |
        ((Conversation.user1_id == other_user.id) & (Conversation.user2_id == current_user.id))
    ).options(joinedload(Conversation.messages)).first()
    
    # If no conversation exists, create a new one
    if not conversation:
        conversation = Conversation(
            user1_id=current_user.id,
            user2_id=other_user.id,
            updated_at=func.now()  # Set updated_at to current time
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        # Load messages after refresh
        conversation = db.query(Conversation).options(joinedload(Conversation.messages)).filter(Conversation.id == conversation.id).first()
    
    # Ensure updated_at is set
    if not conversation.updated_at:
        conversation.updated_at = func.now()
        db.commit()
        db.refresh(conversation)
    
    # Convert to response model
    return ConversationResponse(
        id=conversation.id,
        user1_id=conversation.user1_id,
        user2_id=conversation.user2_id,
        messages=[MessageResponse(
            id=msg.id,
            conversation_id=msg.conversation_id,
            sender_id=msg.sender_id,
            content=msg.content,
            created_at=msg.created_at,
            reply_to=msg.reply_to,
            is_deleted=msg.is_deleted
        ) for msg in conversation.messages],
        updated_at=conversation.updated_at,
        created_at=conversation.created_at
    )

@router.post("/message", response_model=MessageResponse)
async def create_message(
    message: MessageCreate,
    db: Session = Depends(get_db)
):
    # Get sender and receiver
    sender = db.query(User).filter(User.user_name == message.sender_id).first()
    if not sender:
        raise HTTPException(status_code=404, detail="Sender not found")
    
    receiver = db.query(User).filter(User.user_name == message.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    
    # Get or create conversation
    conversation = db.query(Conversation).filter(
        ((Conversation.user1_id == sender.id) & (Conversation.user2_id == receiver.id)) |
        ((Conversation.user1_id == receiver.id) & (Conversation.user2_id == sender.id))
    ).first()
    
    if not conversation:
        conversation = Conversation(
            user1_id=sender.id,
            user2_id=receiver.id
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    
    # Create message
    db_message = Message(
        conversation_id=conversation.id,
        sender_id=sender.id,
        content=message.content
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    return db_message

@router.websocket("/ws/{user_name}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_name: str,
    db: Session = Depends(get_db)
):
    await websocket.accept()
    user = db.query(User).filter(User.user_name == user_name).first()
    
    if not user:
        await websocket.close(code=1008)
        return

    try:
        while True:
            data = await websocket.receive_json()
            
            if data['type'] == 'new_message':
                # Validate and process message
                msg_data = data['data']
                receiver = db.query(User).filter(User.id == msg_data['receiver_id']).first()
                
                if not receiver:
                    await websocket.send_json({
                        "type": "error",
                        "data": {"message": "Recipient not found"}
                    })
                    continue
                    
                # Create and broadcast message
                # ... implementation ...
                
            elif data['type'] == 'typing_indicator':
                # Broadcast typing status
                await broadcast_typing_status(
                    data['data']['conversation_id'],
                    user.id,
                    data['data']['is_typing']
                )
            
    except WebSocketDisconnect:
        # Handle cleanup
        pass