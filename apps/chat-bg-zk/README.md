# ChatBG API

A FastAPI-based backend service for the ChatBG application, providing contact management, messaging, and payment functionalities.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Endpoints

### User Management
- POST `/user/create` - Create a new user
- GET `/user/{user_name}` - Get user information

### Contact Management
- GET `/contact/list` - List contacts for a user
- POST `/contact/add` - Add a contact
- DELETE `/contact/remove/{contact_id}` - Remove a contact
- POST `/contact/invite` - Send an invite email
- POST `/contact/send_gift_email` - Send a gift email

### Message Management
- POST `/message/send` - Send a message
- DELETE `/message/remove/{message_id}` - Remove a message
- DELETE `/message/remove_all/{message_id}` - Remove a message from all users

### Payment Management
- GET `/payment/history` - Retrieve payment history
- POST `/payment/store` - Store payment information

## Database

The application uses SQLite3 as its database. The database file will be created at `./chatbg.db`.

## Project Structure

```
app/
├── main.py          # FastAPI application entry point
├── database.py      # Database models and configuration
├── routes/          # API route handlers
│   ├── user.py
│   ├── contact.py
│   ├── message.py
│   └── payment.py
├── schemas/         # Pydantic models for request/response validation
│   ├── user.py
│   ├── contact.py
│   ├── message.py
│   └── payment.py
└── models/         # SQLAlchemy models
```
