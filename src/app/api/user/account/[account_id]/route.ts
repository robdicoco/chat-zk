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

    if (!account_id) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Fetch user data from the backend
    const response = await fetch(`${BACKEND_URL}/user/account/${account_id}`);

    // Handle non-OK responses
    if (!response.ok) {
      const errorDetails = await response.json();
      console.error('Backend error:', errorDetails);
      return NextResponse.json(
        { error: errorDetails?.message || 'Failed to fetch user' },
        { status: response.status }
      );
    }

    // Parse and return the user data
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error fetching user:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching user' },
      { status: 500 }
    );
  }
}