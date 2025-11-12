// app/api/user/sessions/revoke/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/utils/auth';
import { invalidateUserCache } from '@/lib/enhanced-redis';

// Type definitions
interface RequestBody {
  sessionId: string;
}

interface UserSession {
  id: string;
  userId: string;
  sessionToken: string;
  isActive: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the token
    let token: string | null = null;
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get('auth-token')?.value || null;
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 401 });
    }
    
    const currentSessionToken = token;
    
    // Parse request body
    const body = await request.json() as RequestBody;
    const { sessionId } = body;
    
    if (!sessionId) {
      return NextResponse.json({
        error: 'Session ID required',
        message: 'Please provide a session ID'
      }, { status: 400 });
    }
    
    // Find the session to revoke
    const session = await prisma.userSession.findFirst({
      where: {
        id: sessionId,
        userId: user.id
      }
    }) as UserSession | null;
    
    if (!session) {
      return NextResponse.json({
        error: 'Session not found',
        message: 'The specified session does not exist or does not belong to you'
      }, { status: 404 });
    }
    
    // Prevent revoking the current session via this endpoint
    if (session.sessionToken === currentSessionToken) {
      return NextResponse.json({
        error: 'Cannot revoke current session',
        message: 'You cannot revoke your current session with this endpoint'
      }, { status: 400 });
    }
    
    // Revoke the session
    await prisma.userSession.update({
      where: {
        id: sessionId
      },
      data: {
        isActive: false
      }
    });
    
    // Log the action
    await prisma.userActivityLog.create({
      data: {
        userId: user.id,
        action: 'session_revoked',
        description: 'A session was revoked',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          sessionId,
          revokedFrom: 'current session'
        }
      }
    });
    
    // Create security event
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: 'session_revoked',
        severity: 'low',
        description: 'A session was manually signed out',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        resolved: true,
        resolvedAt: new Date()
      }
    });
    
    // CRITICAL: Clear all cache layers immediately
    const redis = (await import('@/lib/enhanced-redis')).redis;
    const CACHE_PREFIX = (await import('@/lib/enhanced-redis')).CACHE_PREFIX;
    
    console.log('[Revoke Session API] Clearing cache for user:', user.id);
    
    await Promise.all([
      redis.del(`${CACHE_PREFIX.SESSIONS}:list:${user.id}`),
      redis.del(`${CACHE_PREFIX.USER_PROFILE}:${user.id}`),
      redis.del(`user:sessions:${user.id}`),
      redis.del(`sessions:${user.id}`),
    ]);
    
    await invalidateUserCache(user.id);
    
    console.log('[Revoke Session API] Cache cleared successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Session revoked successfully',
      sessionId,
      timestamp: Date.now()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error revoking session:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to revoke session'
    }, { status: 500 });
  }
}