from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import contact, message, payment, user
from app.database import engine, Base

app = FastAPI(title="ChatBG API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Include routers
app.include_router(contact.router, prefix="/contact", tags=["Contact Management"])
app.include_router(message.router, prefix="/message", tags=["Message Management"])
app.include_router(payment.router, prefix="/payment", tags=["Payment Management"])
app.include_router(user.router, prefix="/user", tags=["User Management"])
