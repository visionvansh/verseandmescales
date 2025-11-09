// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('[Auth Me] GET /api/auth/me called');
    
    // Get token from cookie
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;
    const sessionToken = cookieStore.get('session-id')?.value;
    const storedFingerprint = cookieStore.get('device-fingerprint')?.value;
    
    console.log('[Auth Me] Cookies present:', {
      authToken: !!authToken,
      sessionToken: !!sessionToken,
      deviceFingerprint: !!storedFingerprint
    });
    
    // Also try to get token from Authorization header as fallback
    const authHeader = request.headers.get('Authorization');
    const headerToken = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;
    
    const accessToken = authToken || headerToken;
    
    if (!accessToken) {
      console.log('[Auth Me] No token found in cookies or headers');
      
      // If we have a session token but no auth token, try to refresh
      if (sessionToken) {
        console.log('[Auth Me] Session token exists, attempting refresh');
        return NextResponse.json(
          { 
            error: 'Token expired',
            needsRefresh: true,
            sessionToken 
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    // Verify token
    let tokenPayload;
    try {
      tokenPayload = jwt.verify(accessToken, process.env.JWT_SECRET!) as { 
        userId: string, 
        sessionId?: string,
        email?: string,
        exp?: number
      };
      console.log('[Auth Me] Token verified for user:', {
        userId: tokenPayload.userId,
        email: tokenPayload.email,
        sessionId: tokenPayload.sessionId
      });
      
      // Check if token is about to expire (less than 5 minutes left)
      const expiresInSeconds = tokenPayload.exp ? tokenPayload.exp - Math.floor(Date.now() / 1000) : 0;
      if (expiresInSeconds < 300 && expiresInSeconds > 0) {
        console.log('[Auth Me] Token will expire soon:', expiresInSeconds, 'seconds');
      }
      
    } catch (error: any) {
      console.error('[Auth Me] Token verification failed:', error.message);
      
      // If token is expired but we have a session token, trigger refresh
      if (error.name === 'TokenExpiredError' && sessionToken) {
        console.log('[Auth Me] Token expired, needs refresh');
        return NextResponse.json(
          { 
            error: 'Token expired',
            needsRefresh: true,
            sessionToken 
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Verify session is still active
    if (tokenPayload.sessionId) {
      const session = await prisma.userSession.findFirst({
        where: {
          id: tokenPayload.sessionId,
          userId: tokenPayload.userId,
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      if (!session) {
        console.log('[Auth Me] Session not found or expired:', tokenPayload.sessionId);
        return NextResponse.json(
          { error: 'Session expired or invalid' },
          { status: 401 }
        );
      }

      // Update session last used (don't await)
      prisma.userSession.update({
        where: { id: session.id },
        data: { lastUsed: new Date() }
      }).catch((err: unknown) => console.error('[Auth Me] Error updating session:', err));
    }

    // ✅ DEBUGGING: Log query parameters
    console.log('[Auth Me] Query parameters:', {
      userId: tokenPayload.userId,
      sessionId: tokenPayload.sessionId,
      storedFingerprint: storedFingerprint,
      queryMethod: tokenPayload.sessionId ? 'sessionId' : storedFingerprint ? 'fingerprint' : 'none'
    });

    // ✅ FIXED: More reliable device lookup with priority-based matching
    const user = await prisma.student.findUnique({
      where: { id: tokenPayload.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        surname: true,
        img: true,
        emailVerified: true,
        phoneVerified: true,
        twoFactorEnabled: true,
        lastLogin: true,
        createdAt: true,
        isOnline: true,
        preferences: true,
        socialAccountsEver: {
          select: {
            provider: true,
            providerEmail: true,
            profileData: true
          }
        },
        devices: {
          // ✅ PRIORITY 1: Find by sessionId (most reliable)
          where: tokenPayload.sessionId ? {
            sessions: {
              some: {
                id: tokenPayload.sessionId,
                isActive: true
              }
            }
          } : storedFingerprint ? {
            // ✅ PRIORITY 2: Find by fingerprint (fallback)
            fingerprint: storedFingerprint
          } : {
            // ✅ PRIORITY 3: Skip if neither available
            id: 'none'
          },
          select: {
            id: true,
            trusted: true,
            deviceName: true,
            lastUsed: true,
            isAccountCreationDevice: true,
            fingerprint: true
          },
          take: 1 // ✅ We only need the current device
        }
      }
    });
    
    if (!user) {
      console.log('[Auth Me] User not found:', tokenPayload.userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // ✅ Check if device exists and if it's trusted
    const currentDevice = user.devices[0];
    const deviceTrusted = currentDevice?.trusted || false;

    // ✅ IMPROVED LOGGING
    console.log('[Auth Me] User found:', {
      userId: user.id,
      email: user.email,
      deviceFound: !!currentDevice,
      deviceId: currentDevice?.id,
      deviceTrusted: deviceTrusted,
      isAccountCreationDevice: currentDevice?.isAccountCreationDevice,
      storedFingerprint: storedFingerprint,
      deviceFingerprint: currentDevice?.fingerprint,
      matchMethod: tokenPayload.sessionId ? 'sessionId' : 'fingerprint'
    });

    // Update last active time (don't await to improve response time)
    prisma.student.update({
      where: { id: user.id },
      data: { 
        lastActiveAt: new Date(),
        isOnline: true
      }
    }).catch((error: unknown) => {
      console.error('[Auth Me] Error updating lastActiveAt:', error);
    });

    // Check if there's any security events for this user
    const suspiciousActivity = await prisma.securityEvent.findFirst({
      where: {
        userId: user.id,
        resolved: false,
        severity: { in: ['high', 'critical'] },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      }
    });

    // Prepare user data (exclude sensitive fields)
    const userData = {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      surname: user.surname,
      img: user.img,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      isOnline: user.isOnline,
      preferences: user.preferences,
      socialAccounts: user.socialAccountsEver
    };

    const expiresIn = tokenPayload.exp 
      ? tokenPayload.exp - Math.floor(Date.now() / 1000) 
      : 3600; // Default to 1 hour

    console.log('[Auth Me] Success, returning user data');

    return NextResponse.json({
      user: userData,
      deviceTrusted: deviceTrusted, // ✅ Use the computed variable
      suspiciousActivity: !!suspiciousActivity,
      expiresIn,
      sessionId: tokenPayload.sessionId
    }, { status: 200 });

  } catch (error) {
    console.error('[Auth Me] Internal server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}