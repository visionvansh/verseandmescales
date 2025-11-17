// app/api/auth/ws-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify the token is valid
    try {
      jwt.verify(authToken, process.env.JWT_SECRET!);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Return the token (server can read HttpOnly cookies)
    return NextResponse.json({
      token: authToken,
      expiresIn: 3600
    }, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      }
    });
    
  } catch (error) {
    console.error('[WS Token] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}