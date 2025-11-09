// app/api/user/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/utils/auth';
import { CACHE_PREFIX, CACHE_TIMES, cacheWrapper, invalidateUserCache } from '@/lib/enhanced-redis';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check for cache-busting parameter
    const url = new URL(request.url);
    const skipCache = url.searchParams.has('skipCache') || url.searchParams.has('_t');
    
    // Get the token and decode it to get session ID
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
    
    // ✅ Decode token to get session ID instead of comparing tokens
    let currentSessionId: string | null = null;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      currentSessionId = decoded.sessionId;
      console.log('[Sessions API] Decoded token - sessionId:', currentSessionId, 'userId:', decoded.userId);
    } catch (error) {
      console.error('[Sessions API] Error decoding token:', error);
    }
    
    // Helper function to format sessions
    const formatSessions = (sessions: any[], currentSessionId: string | null) => {
      console.log('[Sessions API] Formatting sessions. Current session ID:', currentSessionId);
      console.log('[Sessions API] Session IDs in database:', sessions.map(s => s.id));
      
      return sessions.map(session => {
        // ✅ Compare by session ID instead of token
        const isCurrent = currentSessionId ? session.id === currentSessionId : false;
        
        console.log(`[Sessions API] Session ${session.id}: isCurrent=${isCurrent}, trusted=${session.device?.trusted}`);
        
        // Better scheduled revocation detection
        const standardExpiration = new Date(session.createdAt);
        const expirationDays = session.device?.trusted ? 150 : 28;
        standardExpiration.setDate(standardExpiration.getDate() + expirationDays);
        
        const timeDiff = Math.abs(session.expiresAt.getTime() - standardExpiration.getTime());
        const hoursDiff = timeDiff / (1000 * 3600);
        const isScheduled = hoursDiff > 12 && session.expiresAt < standardExpiration;
        
        return {
          id: session.id,
          deviceId: session.deviceId,
          deviceName: session.device?.deviceName || 'Unknown device',
          browser: session.device?.browser || 'Unknown browser',
          os: session.device?.os || 'Unknown OS',
          location: session.location || 'Unknown location',
          ipAddress: session.ipAddress || 'Unknown IP',
          lastUsed: session.lastUsed,
          expiresAt: session.expiresAt,
          current: isCurrent,
          trusted: session.device?.trusted || false,
          isAccountCreationDevice: session.device?.isAccountCreationDevice || false,
          sessionType: session.sessionType,
          scheduledRevocationDate: isScheduled ? session.expiresAt.toISOString() : null
        };
      });
    };
    
    // ALWAYS fetch fresh data if skipCache is true
    if (skipCache) {
      console.log('[Sessions API] Fetching fresh data (skip cache)');
      
      const sessions = await prisma.userSession.findMany({
        where: {
          userId: user.id,
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          device: true
        },
        orderBy: {
          lastUsed: 'desc'
        }
      });
      
      const formattedSessions = formatSessions(sessions, currentSessionId);
      const currentSession = formattedSessions.find(s => s.current);
      
      console.log('[Sessions API] Current device info:', {
        deviceId: currentSession?.deviceId,
        trusted: currentSession?.trusted,
        isAccountCreationDevice: currentSession?.isAccountCreationDevice,
        found: !!currentSession
      });
      
      // Set cache headers to prevent browser caching
      return NextResponse.json(
        {
          sessions: formattedSessions,
          count: formattedSessions.length,
          currentDevice: currentSession || null,
          timestamp: Date.now()
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Content-Type-Options': 'nosniff'
          }
        }
      );
    }
    
    // Define cache key
    const cacheKey = `${CACHE_PREFIX.SESSIONS}:list:${user.id}`;
    
    // Use cache wrapper for normal requests
    const response = await cacheWrapper(
      cacheKey,
      async () => {
        const sessions = await prisma.userSession.findMany({
          where: {
            userId: user.id,
            isActive: true,
            expiresAt: {
              gt: new Date()
            }
          },
          include: {
            device: true
          },
          orderBy: {
            lastUsed: 'desc'
          }
        });
        
        const formattedSessions = formatSessions(sessions, currentSessionId);
        const currentSession = formattedSessions.find(s => s.current);
        
        return {
          sessions: formattedSessions,
          count: formattedSessions.length,
          currentDevice: currentSession || null,
          cached: true
        };
      },
      CACHE_TIMES.SESSIONS,
      false
    );
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to fetch sessions'
    }, { status: 500 });
  }
}

// The POST method for modifying sessions should invalidate cache
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId: string;
    try {
      const tokenPayload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      userId = tokenPayload.userId;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = await request.json();
    const { action, sessionId } = body;

    // Handle the session action...
    
    await invalidateUserCache(userId);
    
    return NextResponse.json({
      success: true,
      action,
      sessionId
    });
  } catch (error) {
    console.error('Error processing session action:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to process session action' },
      { status: 500 }
    );
  }
}