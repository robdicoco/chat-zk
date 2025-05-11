import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { account_id, identifier } = body;
    
    if (!account_id || !identifier) {
      return NextResponse.json(
        { error: 'account_id and identifier are required' },
        { status: 400 }
      );
    }

    // Forward the request to the backend with query parameters
    const response = await fetch(`${BACKEND_URL}/contact/add_by_identifier?account_id=${encodeURIComponent(account_id)}&identifier=${encodeURIComponent(identifier)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.detail || 'Failed to add contact' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error adding contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 