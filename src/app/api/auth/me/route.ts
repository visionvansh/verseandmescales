// app/api/auth/me/route.ts - Replace with atomic call
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { loadCompleteAtomicData } from '@/lib/loaders/atomic-loader';

export async function GET(request: NextRequest) {
  try {
    console.log('[Auth Me] GET /api/auth/me called');
    
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;
    const deviceFingerprint = cookieStore.get('device-fingerprint')?.value;
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    let tokenPayload;
    try {
      tokenPayload = jwt.verify(authToken, process.env.JWT_SECRET!) as { 
        userId: string
      };
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // ✅ Load atomic data instead of separate queries
    const atomicData = await loadCompleteAtomicData(
      tokenPayload.userId,
      deviceFingerprint
    );

    if (!atomicData.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: atomicData.user,
      deviceTrusted: atomicData.user.deviceTrusted || false,
      suspiciousActivity: false,
      expiresIn: 3600,
    }, { status: 200 });

  } catch (error) {
    console.error('[Auth Me] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}