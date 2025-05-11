import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(
  request: Request,
  { params }: { params: { user_name: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const current_user_name = searchParams.get('current_user_name');

    if (!current_user_name) {
      return NextResponse.json(
        { error: 'Current user name is required' },
        { status: 400 }
      );
    }

    console.log('Making request to backend:', {
      url: `${BACKEND_URL}/message/conversation/${params.user_name}`,
      current_user_name
    });

    const response = await fetch(
      `${BACKEND_URL}/message/conversation/${params.user_name}?current_user_name=${current_user_name}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      let errorMessage = 'Failed to fetch conversation';
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

    let data;
    try {
      data = await response.json();
      // console.log('Backend response:', data);
    } catch (e) {
      console.error('Error parsing response:', e);
      return NextResponse.json(
        { error: 'Invalid response from server' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      messages: data.messages || [],
      conversation_id: data.id
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
} 