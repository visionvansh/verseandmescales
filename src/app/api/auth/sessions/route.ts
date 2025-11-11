// app/api/auth/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/utils/auth';
import { CACHE_PREFIX, CACHE_TIMES, cacheWrapper, invalidateUserCache, redis } from '@/lib/enhanced-redis';

// ✅ FIXED: Define the type to match Prisma schema exactly
type SessionWithDevice = {
  id: string;
  userId: string;
  sessionToken: string;
  deviceId: string | null; // ✅ CHANGED: Allow null
  ipAddress: string | null;
  location: string | null;
  lastUsed: Date;
  expiresAt: Date;
  createdAt: Date;
  sessionType: string;
  device: {
    deviceName: string;
    browser: string | null;
    os: string | null;
    trusted: boolean;
    isAccountCreationDevice: boolean;
    scheduledRevocationDate: Date | null; // ✅ ADDED: Missing field
  } | null;
};

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // ✅ Check for cache-busting parameters
    const url = new URL(request.url);
    const skipCache = url.searchParams.has('_t') || url.searchParams.get('refresh') === 'true';
    
    // Get the token (same logic as getAuthUser)
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
    
    // ✅ Function to fetch and format sessions
    const fetchSessions = async () => {
      console.log('[Sessions API] Fetching fresh data from database for user:', user.id);
      
      // Get active sessions for the user
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
      
      console.log(`[Sessions API] Found ${sessions.length} active sessions`);
      
      // Transform sessions with additional info
      const formattedSessions = sessions.map((session: SessionWithDevice) => {
        const isCurrent = session.sessionToken === currentSessionToken;
        
        return {
          id: session.id,
          deviceId: session.deviceId, // ✅ Now correctly nullable
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
          // Check for manually scheduled revocation
          scheduledRevocationDate: (() => {
            const standardExpiration = new Date(session.createdAt);
            standardExpiration.setDate(standardExpiration.getDate() + (session.device?.trusted ? 150 : 28));
            
            const timeDiff = Math.abs(session.expiresAt.getTime() - standardExpiration.getTime());
            const daysDiff = timeDiff / (1000 * 3600 * 24);
            
            if (daysDiff > 1 && session.expiresAt < standardExpiration) {
              return session.expiresAt.toISOString();
            }
            return null;
          })()
        };
      });
      
      return {
        sessions: formattedSessions,
        count: formattedSessions.length,
        timestamp: Date.now()
      };
    };
    
    // ✅ If skipCache or refresh requested, bypass cache and get fresh data
    if (skipCache) {
      console.log('[Sessions API] Cache bypass requested, fetching fresh data');
      const data = await fetchSessions();
      
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Cache': 'BYPASS'
        }
      });
    }
    
    // ✅ Define cache key
    const cacheKey = `${CACHE_PREFIX.SESSIONS}:list:${user.id}`;
    
    // ✅ Use cache wrapper with SHORT TTL for near real-time updates
    const response = await cacheWrapper(
      cacheKey,
      fetchSessions,
      10,
      true
    );
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, max-age=10, must-revalidate',
        'X-Cache': 'HIT'
      }
    });
    
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to fetch sessions'
    }, { status: 500 });
  }
}

// ✅ The POST method for modifying sessions should invalidate cache
export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    let userId: string;
    try {
      const tokenPayload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      userId = tokenPayload.userId;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { action, sessionId } = body;

    // Handle the session action...
    
    // ✅ Invalidate ALL cache layers immediately
    console.log('[Sessions POST] Invalidating cache for user:', userId);
    
    await Promise.all([
      redis.del(`${CACHE_PREFIX.SESSIONS}:list:${userId}`),
      redis.del(`${CACHE_PREFIX.DEVICES}:list:${userId}`),
      redis.del(`${CACHE_PREFIX.USER_PROFILE}:${userId}`),
      invalidateUserCache(userId)
    ]);
    
    console.log('[Sessions POST] Cache invalidated successfully');
    
    return NextResponse.json({
      success: true,
      action,
      sessionId,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error processing session action:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to process session action' },
      { status: 500 }
    );
  }
}