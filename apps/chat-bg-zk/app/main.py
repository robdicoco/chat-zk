from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import contact, message, payment, user
from app.database import engine, Base
from .routes import face_commitment

app = FastAPI(
    title="Chat Background ZK API",
    description="API for zero-knowledge face verification in chat background",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
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
app.include_router(face_commitment.router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to Chat Background ZK API",
        "version": "1.0.0",
        "docs_url": "/docs"
    }
