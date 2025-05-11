import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    // Extract query parameters from the request URL
    const url = new URL(request.url);
    const userName = url.searchParams.get('user_name');
    const email = url.searchParams.get('email');
    const amount = url.searchParams.get('amount');

    // Validate required query parameters   
    if (!userName) {
      return NextResponse.json(
        { error: 'User name is required as a query parameter' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required as a query parameter' },
        { status: 400 }
      );
    }

    if (!amount) {
      return NextResponse.json(
        { error: 'Amount is required as a query parameter' },
        { status: 400 }
      );
    }

    // Ensure amount is a positive number
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { token, currency } = body;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required as a query parameter' },
        { status: 400 }
      );
    }

    if (!currency) {
      return NextResponse.json(
        { error: 'Currency is required as a query parameter' },
        { status: 400 }
      );
    }



    // Forward the request to the backend
    const backendUrl = `${BACKEND_URL}/contact/send_gift_email?user_name=${encodeURIComponent(userName)}&email=${encodeURIComponent(email)}&amount=${parsedAmount}&token=${token}&currency=${currency}`;
    const backendResponse = await fetch(backendUrl, {
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
        { error: errorDetails?.message || 'Failed to send gift email' },
        { status: backendResponse.status }
      );
    }

    // Parse and return the response from the backend
    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    // Log and handle unexpected errors
    console.error('Unexpected error sending gift email:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while sending gift email' },
      { status: 500 }
    );
  }
}