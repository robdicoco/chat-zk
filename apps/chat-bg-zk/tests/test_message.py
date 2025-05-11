import pytest
from datetime import datetime
from app.models.message import Message
from app.models.user import User

def test_send_message(test_client, test_user, test_contact):
    message_data = {
        "contact_id": test_contact['contact_id'],
        "content": "Test message"
    }
    response = test_client.post(f"/message/send?user_name={test_user['user_name']}", json=message_data)
    assert response.status_code == 200
    message = response.json()
    assert message['user_id'] == test_user['id']
    assert message['content'] == message_data['content']

def test_remove_message(test_client, test_user, test_message):
    response = test_client.delete(f"/message/remove/{test_message['id']}?user_name={test_user['user_name']}")
    assert response.status_code == 200
    assert response.json()['message'] == "Message removed successfully"

def test_remove_message_all(test_client, test_message):
    response = test_client.delete(f"/message/remove_all/{test_message['id']}")
    assert response.status_code == 200
    assert response.json()['message'] == "Message removed from all users"
