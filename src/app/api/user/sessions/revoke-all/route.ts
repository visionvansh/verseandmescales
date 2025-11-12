// app/api/user/sessions/revoke-all/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/utils/auth';
import { invalidateUserCache } from '@/lib/enhanced-redis';

// Type definitions
interface RequestBody {
  password?: string;
}

interface UserSession {
  id: string;
  userId: string;
  isActive: boolean;
  sessionToken: string;
}

interface UserWithPassword {
  password: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the current session token
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
    const { password } = body;
    
    // Verify password if user has password set
    const fullUser = await prisma.student.findUnique({
      where: { id: user.id },
      select: { password: true }
    }) as UserWithPassword | null;
    
    if (fullUser?.password) {
      if (!password) {
        return NextResponse.json({
          error: 'Password required',
          message: 'Please provide your password to confirm this action'
        }, { status: 400 });
      }
      
      const isPasswordValid = await bcrypt.compare(password, fullUser.password);
      if (!isPasswordValid) {
        return NextResponse.json({
          error: 'Invalid password',
          message: 'The password you provided is incorrect'
        }, { status: 401 });
      }
    }
    
    // Get all active sessions except current one
    const sessionsToRevoke = await prisma.userSession.findMany({
      where: {
        userId: user.id,
        isActive: true,
        sessionToken: {
          not: currentSessionToken
        }
      }
    }) as UserSession[];
    
    if (sessionsToRevoke.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No other active sessions to revoke',
        revokedCount: 0
      });
    }
    
    // Revoke all other sessions
    await prisma.userSession.updateMany({
      where: {
        userId: user.id,
        isActive: true,
        sessionToken: {
          not: currentSessionToken
        }
      },
      data: {
        isActive: false
      }
    });
    
    // Log the action
    await prisma.userActivityLog.create({
      data: {
        userId: user.id,
        action: 'all_sessions_revoked',
        description: 'All other sessions were revoked',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          revokedCount: sessionsToRevoke.length,
          sessionIds: sessionsToRevoke.map((s: UserSession) => s.id)
        }
      }
    });
    
    // Create security event
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: 'all_sessions_revoked',
        severity: 'medium',
        description: `All other sessions were signed out (${sessionsToRevoke.length} sessions)`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        resolved: true,
        resolvedAt: new Date()
      }
    });
    
    // CRITICAL: Clear all cache layers immediately
    const redis = (await import('@/lib/enhanced-redis')).redis;
    const CACHE_PREFIX = (await import('@/lib/enhanced-redis')).CACHE_PREFIX;
    
    console.log('[Revoke All Sessions API] Clearing cache for user:', user.id);
    
    await Promise.all([
      redis.del(`${CACHE_PREFIX.SESSIONS}:list:${user.id}`),
      redis.del(`${CACHE_PREFIX.USER_PROFILE}:${user.id}`),
      redis.del(`user:sessions:${user.id}`),
      redis.del(`sessions:${user.id}`),
    ]);
    
    await invalidateUserCache(user.id);
    
    console.log('[Revoke All Sessions API] Cache cleared successfully');
    
    return NextResponse.json({
      success: true,
      message: 'All other sessions revoked successfully',
      revokedCount: sessionsToRevoke.length,
      timestamp: Date.now()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error revoking all sessions:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to revoke all sessions'
    }, { status: 500 });
  }
}