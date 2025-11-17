// app/api/auth/ws-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    console.log('[WS Token] Request received');
    
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;
    
    if (!authToken) {
      console.error('[WS Token] No auth token in cookies');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('[WS Token] Token found, length:', authToken.length);

    // Verify the token is valid
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error('[WS Token] JWT_SECRET not configured');
        return NextResponse.json(
          { error: 'Server configuration error' },
          { status: 500 }
        );
      }
      
      const decoded = jwt.verify(authToken, jwtSecret) as any;
      console.log('[WS Token] Token verified for user:', decoded.userId);
      
    } catch (error: any) {
      console.error('[WS Token] Token verification failed:', error.message);
      return NextResponse.json(
        { 
          error: 'Invalid token',
          details: error.message 
        },
        { status: 401 }
      );
    }

    console.log('[WS Token] Returning valid token');

    // Return the token
    return NextResponse.json({
      token: authToken,
      expiresIn: 3600
    }, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      }
    });
    
  } catch (error) {
    console.error('[WS Token] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}