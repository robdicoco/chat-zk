// apps/chat-demo/src/app/api/message/send/route.ts
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, conversation_id, sender_id } = body;

    if (!content || !conversation_id || !sender_id) {
      return NextResponse.json(
        { error: 'Content, conversation ID, and sender ID are required' },
        { status: 400 }
      );
    }

    // Construct the URL for the backend
    const backendUrl = `${BACKEND_URL}/message/send`;
    
    console.log('Making request to backend:', {
      url: backendUrl,
      body: { content, conversation_id, sender_id }
    });

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        conversation_id,
        sender_id,
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to send message';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}