import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userName = searchParams.get('user_name');
    const email = searchParams.get('email');

    if (!userName || !email) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Call the backend API
    const response = await fetch(`http://localhost:8000/contact/invite?user_name=${encodeURIComponent(userName)}&email=${encodeURIComponent(email)}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to send invite' },
        { status: response.status }
      );
    }

    return NextResponse.json({ message: 'Invite sent successfully' });
  } catch (error) {
    console.error('Error sending invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 