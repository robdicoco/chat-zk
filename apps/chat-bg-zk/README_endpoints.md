# ChatBG API Endpoints Documentation

This document provides detailed information about all available API endpoints in the ChatBG application.

## User Management Endpoints

### Create User
**Endpoint:** `POST /user/create`

**Request Body:**
```json
{
    "user_name": "string",
    "email": "string",
    "account_id": "string"
}
```

**Response:**
```json
{
    "id": "integer",
    "user_name": "string",
    "email": "string",
    "account_id": "string",
    "created_at": "datetime"
}
```

### Get User
**Endpoint:** `GET /user/{user_name}`

**Response:**
```json
{
    "id": "integer",
    "user_name": "string",
    "email": "string",
    "account_id": "string",
    "created_at": "datetime"
}
```

## Contact Management Endpoints

### List Contacts
**Endpoint:** `GET /contact/list?user_name={user_name}`

**Response:**
```json
[
    {
        "id": "integer",
        "user_name": "string",
        "email": "string",
        "account_id": "string",
        "created_at": "datetime"
    }
]
```

### Add Contact
**Endpoint:** `POST /contact/add?user_name={user_name}`

**Request Body:**
```json
{
    "contact_id": "integer"
}
```

**Response:**
```json
{
    "id": "integer",
    "user_id": "integer",
    "contact_id": "integer"
}
```

### Remove Contact
**Endpoint:** `DELETE /contact/remove/{contact_id}?user_name={user_name}`

**Response:**
```json
{
    "message": "Contact removed successfully"
}
```

### Invite User
**Endpoint:** `POST /contact/invite?user_name={user_name}&email={email}`

**Response:**
```json
{
    "message": "Invite sent to {email}"
}
```

### Send Gift Email
**Endpoint:** `POST /contact/send_gift_email?user_name={user_name}&email={email}&amount={float}&currency={string}`

**Response:**
```json
{
    "message": "Gift email sent to {email} for {amount} {currency}"
}
```

## Message Management Endpoints

### Send Message
**Endpoint:** `POST /message/send?user_name={user_name}`

**Request Body:**
```json
{
    "contact_id": "integer",
    "content": "string"
}
```

**Response:**
```json
{
    "id": "integer",
    "user_id": "integer",
    "contact_id": "integer",
    "content": "string",
    "created_at": "datetime"
}
```

### Remove Message
**Endpoint:** `DELETE /message/remove/{message_id}?user_name={user_name}`

**Response:**
```json
{
    "message": "Message removed successfully"
}
```

### Remove Message from All Users
**Endpoint:** `DELETE /message/remove_all/{message_id}`

**Response:**
```json
{
    "message": "Message removed from all users"
}
```

## Payment Management Endpoints

### Retrieve Payment History
**Endpoint:** `GET /payment/history?user_name={user_name}`

**Response:**
```json
[
    {
        "id": "integer",
        "user_id": "integer",
        "transaction_id": "string",
        "source": "string",
        "destination": "string",
        "value": "float",
        "taxes": "float",
        "created_at": "datetime"
    }
]
```

### Store Payment Info
**Endpoint:** `POST /payment/store?user_name={user_name}`

**Request Body:**
```json
{
    "transaction_id": "string",
    "source": "string",
    "destination": "string",
    "value": "float",
    "taxes": "float"
}
```

**Response:**
```json
{
    "id": "integer",
    "user_id": "integer",
    "transaction_id": "string",
    "source": "string",
    "destination": "string",
    "value": "float",
    "taxes": "float",
    "created_at": "datetime"
}
```

## Error Responses

All endpoints may return the following error responses:

- **404 Not Found**
  - User not found
  - Contact not found
  - Message not found
  - Payment not found

- **422 Unprocessable Entity**
  - Invalid request body format
  - Missing required fields

## Notes

1. All endpoints require a valid user_name parameter where applicable
2. All datetime fields are in ISO format
3. All monetary values are in float format
4. All endpoints are protected by authentication middleware
5. The API uses SQLite as the database backend
