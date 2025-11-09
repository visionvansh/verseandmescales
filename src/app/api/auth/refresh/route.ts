// app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('[Auth Refresh] POST /api/auth/refresh called');
    
    const cookieStore = await cookies();
    
    // ✅ FIX: Get auth-token (JWT) instead of session-id
    const authToken = cookieStore.get('auth-token')?.value;
    const deviceFingerprint = cookieStore.get('device-fingerprint')?.value;
    
    console.log('[Auth Refresh] Tokens present:', {
      authToken: !!authToken,
      deviceFingerprint: !!deviceFingerprint
    });

    if (!authToken) {
      console.log('[Auth Refresh] No auth token found');
      return NextResponse.json(
        { error: 'No auth token provided' },
        { status: 401 }
      );
    }

    // ✅ Decode JWT to get sessionId
    let decoded: any;
    try {
      decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as {
        userId: string;
        sessionId: string;
        email: string;
      };
    } catch (error: any) {
      console.log('[Auth Refresh] JWT verification failed:', error.message);
      
      // If token is expired, we can still decode it to get sessionId
      if (error.name === 'TokenExpiredError') {
        decoded = jwt.decode(authToken) as any;
      } else {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
    }

    if (!decoded?.sessionId) {
      console.log('[Auth Refresh] No sessionId in token');
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      );
    }

    // ✅ Find session by ID from JWT (not by sessionToken)
    const session = await prisma.userSession.findFirst({
      where: {
        id: decoded.sessionId, // Use session ID from JWT
        userId: decoded.userId,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            surname: true,
            img: true,
            emailVerified: true,
            phoneVerified: true,
            twoFactorEnabled: true
          }
        },
        device: true
      }
    });

    if (!session) {
      console.log('[Auth Refresh] Session not found or expired for sessionId:', decoded.sessionId);
      return NextResponse.json(
        { error: 'Session expired or invalid' },
        { status: 401 }
      );
    }

    console.log('[Auth Refresh] Session found for user:', session.user.email);

    // ✅ Generate new JWT token with SAME sessionId
    const newToken = jwt.sign(
      { 
        userId: session.user.id,
        email: session.user.email,
        sessionId: session.id // Keep same session reference
      },
      process.env.JWT_SECRET!,
      { expiresIn: session.device?.trusted ? '150d' : '20d' }
    );

    // Update session last used
    await prisma.userSession.update({
      where: { id: session.id },
      data: { lastUsed: new Date() }
    }).catch(err => console.error('[Auth Refresh] Failed to update session:', err));

    // Update user last active
    await prisma.student.update({
      where: { id: session.user.id },
      data: {
        lastActiveAt: new Date(),
        isOnline: true
      }
    }).catch(err => console.error('[Auth Refresh] Failed to update user:', err));

    console.log('[Auth Refresh] ✅ Token refreshed successfully');

    const response = NextResponse.json({
      message: 'Token refreshed successfully',
      user: session.user,
      deviceTrusted: session.device?.trusted || false,
      expiresIn: session.device?.trusted ? 150 * 24 * 60 * 60 : 20 * 24 * 60 * 60
    });

    // ✅ Set new auth token
    response.cookies.set('auth-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: session.device?.trusted ? 150 * 24 * 60 * 60 : 20 * 24 * 60 * 60,
      path: '/'
    });

    // ✅ Ensure device fingerprint persists
    if (deviceFingerprint) {
      response.cookies.set('device-fingerprint', deviceFingerprint, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 150 * 24 * 60 * 60,
        path: '/'
      });
    }

    return response;

  } catch (error) {
    console.error('[Auth Refresh] ❌ Error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}