import pytest
from datetime import datetime
from app.models.contact import Contact
from app.models.user import User

def test_list_contacts(test_client, test_user, test_contact):
    response = test_client.get(f"/contact/list?user_name={test_user['user_name']}")
    assert response.status_code == 200
    contacts = response.json()
    assert len(contacts) == 1
    assert contacts[0]['user_name'] == test_user['user_name']

def test_add_contact(test_client, test_user):
    contact_data = {
        "contact_id": 2
    }
    response = test_client.post(f"/contact/add?user_name={test_user['user_name']}", json=contact_data)
    assert response.status_code == 200
    contact = response.json()
    assert contact['user_id'] == test_user['id']
    assert contact['contact_id'] == contact_data['contact_id']

def test_remove_contact(test_client, test_user, test_contact):
    response = test_client.delete(f"/contact/remove/{test_contact['contact_id']}?user_name={test_user['user_name']}")
    assert response.status_code == 200
    assert response.json()['message'] == "Contact removed successfully"

def test_invite_user(test_client, test_user):
    response = test_client.post(f"/contact/invite?user_name={test_user['user_name']}&email=test@example.com")
    assert response.status_code == 200
    assert response.json()['message'] == "Invite sent to test@example.com"

def test_send_gift_email(test_client, test_user):
    response = test_client.post(
        f"/contact/send_gift_email?user_name={test_user['user_name']}&email=test@example.com&amount=100.0&currency=USD"
    )
    assert response.status_code == 200
    assert response.json()['message'] == "Gift email sent to test@example.com for 100.0 USD"
