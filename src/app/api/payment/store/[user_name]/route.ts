// apps/chat-demo/src/app/api/payment/store/[user_name]/route.ts
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(
  request: Request,
  context: { params: Promise<{ user_name: string }> }
) {
  try {
    // Await the params object to ensure it is resolved
    const { params } = context;
    const resolvedParams = await params; // Await the params promise
    const { user_name } = resolvedParams;

    const userName = user_name;

    if (!userName) {
      return NextResponse.json(
        { error: 'User name is required in the URL path' },
        { status: 400 }
      );
    }

    // Parse the incoming JSON body
    const body = await request.json();

    // Validate required fields in the body
    const requiredFields = [
      'transaction_id',
      'source',
      'destination',
      'currency',
      'value',
      'taxes',
      'status',
      'transaction_type',
    ];

    for (const field of requiredFields) {
      if (!(field in body)) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Forward the request to the backend
    const backendResponse = await fetch(`${BACKEND_URL}/payment/store?user_name=${encodeURIComponent(userName)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Handle non-OK responses from the backend
    if (!backendResponse.ok) {
      const errorDetails = await backendResponse.json(); // Extract error details if available
      console.error('Backend error:', errorDetails);
      return NextResponse.json(
        { error: errorDetails?.message || 'Failed to process payment' },
        { status: backendResponse.status }
      );
    }

    // Parse and return the response from the backend
    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    // Log and handle unexpected errors
    console.error('Unexpected error processing payment:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing payment' },
      { status: 500 }
    );
  }
}