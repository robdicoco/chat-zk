import pytest
from datetime import datetime
from app.models.user import User

def test_create_user(test_client):
    user_data = {
        "user_name": "test_user_2",
        "email": "test2@example.com",
        "account_id": "test_account_2"
    }
    response = test_client.post("/user/create", json=user_data)
    assert response.status_code == 200
    user = response.json()
    assert user['user_name'] == user_data['user_name']
    assert user['email'] == user_data['email']
    assert user['account_id'] == user_data['account_id']

def test_get_user(test_client, test_user):
    response = test_client.get(f"/user/{test_user['user_name']}")
    assert response.status_code == 200
    user = response.json()
    assert user['user_name'] == test_user['user_name']
    assert user['email'] == test_user['email']
    assert user['account_id'] == test_user['account_id']
