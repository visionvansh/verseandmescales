// app/api/user/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/utils/auth';
import { CACHE_PREFIX, CACHE_TIMES, cacheWrapper, invalidateUserCache } from '@/lib/enhanced-redis';

// Type definitions
interface DecodedToken {
  sessionId: string;
  userId: string;
  [key: string]: any;
}

interface UserDevice {
  id: string;
  deviceName: string;
  browser: string;
  os: string;
  trusted: boolean;
  isAccountCreationDevice: boolean;
}

interface UserSession {
  id: string;
  userId: string;
  sessionToken: string;
  deviceId: string | null;
  location: string | null;
  ipAddress: string | null;
  lastUsed: Date;
  expiresAt: Date;
  createdAt: Date;
  sessionType: string;
  isActive: boolean;
  device: UserDevice | null;
}

interface FormattedSession {
  id: string;
  deviceId: string | null;
  deviceName: string;
  browser: string;
  os: string;
  location: string;
  ipAddress: string;
  lastUsed: Date;
  expiresAt: Date;
  current: boolean;
  trusted: boolean;
  isAccountCreationDevice: boolean;
  sessionType: string;
  scheduledRevocationDate: string | null;
}

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
    
    // Decode token to get session ID
    let currentSessionId: string | null = null;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
      currentSessionId = decoded.sessionId;
      console.log('[Sessions API] Decoded token - sessionId:', currentSessionId, 'userId:', decoded.userId);
    } catch (error) {
      console.error('[Sessions API] Error decoding token:', error);
    }
    
    // Helper function to format sessions
    const formatSessions = (sessions: UserSession[], currentSessionId: string | null): FormattedSession[] => {
      console.log('[Sessions API] Formatting sessions. Current session ID:', currentSessionId);
      console.log('[Sessions API] Session IDs in database:', sessions.map((s: UserSession) => s.id));
      
      return sessions.map((session: UserSession) => {
        // Compare by session ID instead of token
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
      }) as UserSession[];
      
      const formattedSessions = formatSessions(sessions, currentSessionId);
      const currentSession = formattedSessions.find((s: FormattedSession) => s.current);
      
      console.log('[Sessions API] Found current session:', currentSession?.id);
      
      return NextResponse.json({
        sessions: formattedSessions,
        currentSessionId: currentSession?.id || null,
        timestamp: Date.now()
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
    }
    
    // Use cache wrapper for cached requests
    const cacheKey = `${CACHE_PREFIX.SESSIONS}:list:${user.id}`;
    
    const result = await cacheWrapper(
      cacheKey,
      async () => {
        console.log('[Sessions API] Cache miss, fetching from database');
        
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
        }) as UserSession[];
        
        return sessions;
      },
      CACHE_TIMES.MEDIUM
    );
    
    const formattedSessions = formatSessions(result, currentSessionId);
    const currentSession = formattedSessions.find((s: FormattedSession) => s.current);
    
    console.log('[Sessions API] Returning sessions. Current session:', currentSession?.id);
    
    return NextResponse.json({
      sessions: formattedSessions,
      currentSessionId: currentSession?.id || null,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to fetch sessions'
    }, { status: 500 });
  }
}