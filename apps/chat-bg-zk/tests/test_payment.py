import pytest
from datetime import datetime
from app.models.payment import Payment
from app.models.user import User

def test_retrieve_payment_history(test_client, test_user, test_payment):
    response = test_client.get(f"/payment/history?user_name={test_user['user_name']}")
    assert response.status_code == 200
    payments = response.json()
    assert len(payments) == 1
    assert payments[0]['transaction_id'] == test_payment['transaction_id']

def test_store_payment_info(test_client, test_user):
    payment_data = {
        "transaction_id": "test_tx_456",
        "source": "test_source_2",
        "destination": "test_destination_2",
        "value": 200.0,
        "taxes": 10.0
    }
    response = test_client.post(f"/payment/store?user_name={test_user['user_name']}", json=payment_data)
    assert response.status_code == 200
    payment = response.json()
    assert payment['user_id'] == test_user['id']
    assert payment['transaction_id'] == payment_data['transaction_id']
    assert payment['value'] == payment_data['value']
