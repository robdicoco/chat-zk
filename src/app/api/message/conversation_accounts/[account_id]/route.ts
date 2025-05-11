import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(
  request: Request,
  context: { params: Promise<{ account_id: string }> }
) {
  try {
    // Await the params object to ensure it is resolved
    const { params } = context;
    const resolvedParams = await params; // Await the params promise
    const { account_id } = resolvedParams;

    const accountId = account_id; // Get account_id from params

    const { searchParams } = new URL(request.url);
    const third_party_account_id = searchParams.get('third_party_account_id');

    if (!third_party_account_id) {
      return NextResponse.json(
        { error: 'Third party account ID is required' },
        { status: 400 }
      );
    }

    console.log('Making request to backend:', {
      url: `${BACKEND_URL}/message/conversation_accounts/${accountId}`,
      third_party_account_id
    });

    const response = await fetch(
      `${BACKEND_URL}/message/conversation_accounts/${accountId}?third_party_account_id=${third_party_account_id}`,
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

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
} 