from sqlalchemy import create_engine, Column, String, Text, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
import os

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./chatbg.db")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()  # Single source of Base for all models

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def add_updated_at_column():
    """Add updated_at column to conversations table if it doesn't exist"""
    from sqlalchemy import inspect, text
    
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns('conversations')]
    
    if 'updated_at' not in columns:
        with engine.connect() as conn:
            conn.execute(text("""
                ALTER TABLE conversations 
                ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            """))
            conn.commit()
            print("Added updated_at column to conversations table")