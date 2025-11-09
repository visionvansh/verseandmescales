// app/api/user/sessions/cancel-schedule/route.ts
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
    
    // Parse request body
    const body = await request.json();
    const { sessionId } = body;
    
    if (!sessionId) {
      return NextResponse.json({
        error: 'Missing required field',
        message: 'Session ID is required'
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
    
    // Calculate default expiration based on device trust status
    const defaultExpirationDate = new Date(session.createdAt);
    const expirationDays = session.device?.trusted ? 150 : 28;
    defaultExpirationDate.setDate(defaultExpirationDate.getDate() + expirationDays);
    
    // Update session to default expiration
    await prisma.userSession.update({
      where: {
        id: sessionId
      },
      data: {
        expiresAt: defaultExpirationDate
      }
    });
    
    // Log the action
    await prisma.userActivityLog.create({
      data: {
        userId: user.id,
        action: 'session_schedule_cancelled',
        description: 'Scheduled session removal was cancelled',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          sessionId,
          restoredExpirationDate: defaultExpirationDate
        }
      }
    });
    
    // Create security event
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: 'session_schedule_cancelled',
        severity: 'low',
        description: 'Scheduled session removal was cancelled, reverted to default timing',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        resolved: true,
        resolvedAt: new Date()
      }
    });
    
    // CRITICAL: Clear all cache layers immediately
    const redis = (await import('@/lib/enhanced-redis')).redis;
    const CACHE_PREFIX = (await import('@/lib/enhanced-redis')).CACHE_PREFIX;
    
    console.log('[Cancel Schedule API] Clearing cache for user:', user.id);
    
    await Promise.all([
      redis.del(`${CACHE_PREFIX.SESSIONS}:list:${user.id}`),
      redis.del(`${CACHE_PREFIX.USER_PROFILE}:${user.id}`),
      redis.del(`user:sessions:${user.id}`),
      redis.del(`sessions:${user.id}`),
    ]);
    
    await invalidateUserCache(user.id);
    
    console.log('[Cancel Schedule API] Cache cleared successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Scheduled removal cancelled successfully. Session will now expire at default time.',
      sessionId,
      newExpirationDate: defaultExpirationDate.toISOString(),
      timestamp: Date.now()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error cancelling scheduled removal:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to cancel scheduled removal'
    }, { status: 500 });
  }
}