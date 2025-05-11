import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_name, contact_name } = body;

    if (!user_name || !contact_name) {
      return NextResponse.json(
        { error: 'User name and contact name are required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${BACKEND_URL}/contact/add?user_name=${user_name}&contact_name=${contact_name}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to add contact');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error adding contact:', error);
    return NextResponse.json(
      { error: 'Failed to add contact' },
      { status: 500 }
    );
  }
} 