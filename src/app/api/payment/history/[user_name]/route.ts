import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(request: Request) {
  try {
    // Extract query parameters from the request URL
    const url = new URL(request.url);
    const userName = url.searchParams.get('user_name');

    // Validate required query parameter
    if (!userName) {
      return NextResponse.json(
        { error: 'User name is required as a query parameter' },
        { status: 400 }
      );
    }

    // Forward the request to the backend
    const backendUrl = `${BACKEND_URL}/payment/history?user_name=${encodeURIComponent(userName)}`;
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Handle non-OK responses from the backend
    if (!backendResponse.ok) {
      const errorDetails = await backendResponse.json(); // Extract error details if available
      console.error('Backend error:', errorDetails);
      return NextResponse.json(
        { error: errorDetails?.message || 'Failed to fetch payment history' },
        { status: backendResponse.status }
      );
    }

    // Parse and return the response from the backend
    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    // Log and handle unexpected errors
    console.error('Unexpected error fetching payment history:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching payment history' },
      { status: 500 }
    );
  }
}