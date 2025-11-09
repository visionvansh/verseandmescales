// app/api/user/sessions/schedule-revoke/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/utils/auth';
import { invalidateUserCache } from '@/lib/enhanced-redis';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    let token = null;
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get('auth-token')?.value;
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 401 });
    }
    
    const currentSessionToken = token;
    
    const body = await request.json();
    const { sessionId, scheduledDate } = body;
    
    if (!sessionId || !scheduledDate) {
      return NextResponse.json({
        error: 'Missing required fields',
        message: 'Session ID and scheduled date are required'
      }, { status: 400 });
    }
    
    // Validate the scheduled date (20 days max for untrusted devices)
    const scheduledRemovalDate = new Date(scheduledDate);
    const now = new Date();
    const maxDate = new Date();
    maxDate.setDate(now.getDate() + 20); // Changed from 28 to 20
    
    if (scheduledRemovalDate < now) {
      return NextResponse.json({
        error: 'Invalid date',
        message: 'Scheduled date cannot be in the past'
      }, { status: 400 });
    }
    
    if (scheduledRemovalDate > maxDate) {
      return NextResponse.json({
        error: 'Invalid date',
        message: 'Scheduled date cannot be more than 20 days from now'
      }, { status: 400 });
    }
    
    // Find the session
    const session = await prisma.userSession.findFirst({
      where: {
        id: sessionId,
        userId: user.id
      },
      include: {
        device: true
      }
    });
    
    if (!session) {
      return NextResponse.json({
        error: 'Session not found',
        message: 'The specified session does not exist or does not belong to you'
      }, { status: 404 });
    }
    
    // RULE: Cannot schedule removal for trusted device sessions
    if (session.device?.trusted) {
      return NextResponse.json({
        error: 'Cannot schedule removal for trusted device',
        message: 'Sessions on trusted devices cannot be scheduled for removal. Untrust the device first if needed.'
      }, { status: 400 });
    }
    
    // Prevent scheduling removal for current session
    if (session.sessionToken === currentSessionToken) {
      return NextResponse.json({
        error: 'Cannot schedule removal for current session',
        message: 'You cannot schedule removal for your current session'
      }, { status: 400 });
    }
    
    const originalExpiration = session.expiresAt;
    
    // Update session with scheduled removal date
    await prisma.userSession.update({
      where: {
        id: sessionId
      },
      data: {
        expiresAt: scheduledRemovalDate
      }
    });
    
    // Log the action
    await prisma.userActivityLog.create({
      data: {
        userId: user.id,
        action: 'session_removal_scheduled',
        description: 'Session removal was scheduled',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          sessionId,
          scheduledFor: scheduledRemovalDate.toISOString(),
          originalExpiration: originalExpiration.toISOString(),
          deviceTrusted: session.device?.trusted || false,
          createdAt: session.createdAt.toISOString()
        }
      }
    });
    
    // Create security event
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: 'session_removal_scheduled',
        severity: 'low',
        description: `Session removal scheduled for ${scheduledRemovalDate.toISOString()}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        resolved: false
      }
    });
    
    // Clear cache
    const redis = (await import('@/lib/enhanced-redis')).redis;
    const CACHE_PREFIX = (await import('@/lib/enhanced-redis')).CACHE_PREFIX;
    
    await Promise.all([
      redis.del(`${CACHE_PREFIX.SESSIONS}:list:${user.id}`),
      redis.del(`${CACHE_PREFIX.USER_PROFILE}:${user.id}`),
      redis.del(`user:sessions:${user.id}`),
      redis.del(`sessions:${user.id}`),
    ]);
    
    await invalidateUserCache(user.id);
    
    return NextResponse.json({
      success: true,
      message: 'Session removal scheduled successfully',
      sessionId,
      scheduledRemovalDate: scheduledRemovalDate.toISOString(),
      timestamp: Date.now()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error scheduling session removal:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to schedule session removal'
    }, { status: 500 });
  }
}