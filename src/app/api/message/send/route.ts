import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, conversation_id, sender_id, reply_to } = body;
    
    if (!content || !conversation_id || !sender_id) {
      return NextResponse.json(
        { error: 'content, conversation_id, and sender_id are required' },
        { status: 400 }
      );
    }

    // Forward the request to the backend with account_id as query parameter
    const response = await fetch(`${BACKEND_URL}/message/send?account_id=${encodeURIComponent(sender_id)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        conversation_id,
        reply_to
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.detail || 'Failed to send message' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 