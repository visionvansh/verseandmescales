// app/api/auth/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/utils/auth';
import { CACHE_PREFIX, CACHE_TIMES, cacheWrapper, invalidateUserCache, redis } from '@/lib/enhanced-redis';
import { loadCompleteAtomicData } from '@/lib/loaders/atomic-loader'; // Assuming this is the import path for loadCompleteAtomicData

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

    // ✅ Use atomic data instead of separate query
    const atomicData = await loadCompleteAtomicData(user.id);

    return NextResponse.json({
      sessions: atomicData.sessions,
      count: atomicData.sessions.length,
      timestamp: atomicData.timestamp
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60, must-revalidate',
      }
    });
    
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({
      error: 'Internal server error',
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