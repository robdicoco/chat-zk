# ChatPay API Endpoints

## Message Endpoints

### Send Message
```bash
curl -X POST "http://localhost:8000/message/send?account_id={account_id}" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "string",
    "content": "string",
    "reply_to": "string (optional)"
  }'
```

### Get Conversation Messages
```bash
curl -X GET "http://localhost:8000/message/conversation/{conversation_id}?page=1&page_size=10"
```

### List Conversations
```bash
curl -X GET "http://localhost:8000/message/conversations?user_name={user_name}"
```

### Get or Create Conversation
```bash
curl -X GET "http://localhost:8000/message/conversation_accounts/{account_id}?third_party_account_id={third_party_account_id}"
```

### Create Message
```bash
curl -X POST "http://localhost:8000/message/message" \
  -H "Content-Type: application/json" \
  -d '{
    "sender_id": "string",
    "receiver_id": "string",
    "content": "string"
  }'
```

### WebSocket Connection
```bash
ws://localhost:8000/message/ws/{user_name}
```

## Contact Endpoints

### List Contacts
```bash
curl -X GET "http://localhost:8000/contact/list?account_id={account_id}"
```

### Add Contact
```bash
curl -X POST "http://localhost:8000/contact/add" \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "string",
    "contact_username": "string"
  }'
```

### Remove Contact
```bash
curl -X DELETE "http://localhost:8000/contact/remove/{contact_id}"
```

### Invite User
```bash
curl -X POST "http://localhost:8000/contact/invite?user_name={user_name}&email={email}"
```

### Send Gift Email
```bash
curl -X POST "http://localhost:8000/contact/send_gift_email" \
  -H "Content-Type: application/json" \
  -d '{
    "user_name": "string",
    "email": "string",
    "amount": 0.0,
    "currency": "USD"
  }'
```

## User Endpoints

### Create User
```bash
curl -X POST "http://localhost:8000/user/create" \
  -H "Content-Type: application/json" \
  -d '{
    "user_name": "string",
    "email": "string",
    "account_id": "string"
  }'
```

### Get User by Username
```bash
curl -X GET "http://localhost:8000/user/{user_name}"
```

### Get User by Email
```bash
curl -X GET "http://localhost:8000/user/email/{email}"
```

### Get User by Account ID
```bash
curl -X GET "http://localhost:8000/user/account/{account_id}"
```

## Notes
- Replace `{account_id}`, `{user_name}`, `{email}`, etc. with actual values
- All endpoints require proper authentication
- WebSocket endpoint for real-time messaging: `ws://localhost:8000/message/ws/{user_name}`
- Error responses will include a `detail` field with the error message
