import os
import sys
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, get_db
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

# Add the project root to PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Create a new database for testing
TEST_DATABASE_URL = "sqlite:///./test_chatbg.db"

test_engine = create_engine(
    TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=test_engine
)

# Create all tables
Base.metadata.create_all(bind=test_engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture()
def test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture()
def test_client():
    return TestClient(app)

@pytest.fixture()
def test_user(test_db, test_client):
    user_data = {
        "user_name": "test_user",
        "email": "test@example.com",
        "account_id": "test_account"
    }
    response = test_client.post("/user/create", json=user_data)
    assert response.status_code == 200
    return response.json()

@pytest.fixture()
def test_contact(test_db, test_client, test_user):
    contact_data = {
        "contact_id": 2
    }
    response = test_client.post(f"/contact/add?user_name={test_user['user_name']}", json=contact_data)
    assert response.status_code == 200
    return response.json()

@pytest.fixture()
def test_message(test_db, test_client, test_user, test_contact):
    message_data = {
        "contact_id": test_contact['contact_id'],
        "content": "Test message"
    }
    response = test_client.post(f"/message/send?user_name={test_user['user_name']}", json=message_data)
    assert response.status_code == 200
    return response.json()

@pytest.fixture()
def test_payment(test_db, test_client, test_user):
    payment_data = {
        "transaction_id": "test_tx_123",
        "source": "test_source",
        "destination": "test_destination",
        "value": 100.0,
        "taxes": 5.0
    }
    response = test_client.post(f"/payment/store?user_name={test_user['user_name']}", json=payment_data)
    assert response.status_code == 200
    return response.json()
