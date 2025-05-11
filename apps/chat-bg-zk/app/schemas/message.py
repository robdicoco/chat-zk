# schemas/message.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from uuid import UUID

class MessageBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    reply_to: Optional[str] = None  # UUID of the message being replied to

class MessageCreate(MessageBase):
    conversation_id: str  # UUID of the conversation
    reply_to: Optional[str] = None  # UUID of the message being replied to

class MessageResponse(MessageBase):
    id: str
    sender_id: str
    conversation_id: str
    created_at: datetime
    is_deleted: bool
    
    class Config:
        from_attributes = True  # For SQLAlchemy model compatibility
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ConversationBase(BaseModel):
    user1_id: str
    user2_id: str

class ConversationResponse(ConversationBase):
    id: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class PaginatedMessages(BaseModel):
    messages: List[MessageResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class WebSocketMessage(BaseModel):
    type: str  # "new_message", "delete_message", "typing_indicator"
    data: dict  # Payload varies by type

class TypingIndicator(BaseModel):
    conversation_id: str
    user_id: str
    is_typing: bool