// app/api/user/devices/trust/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/utils/auth';

// Type definitions
interface SessionWithDevice {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  device: {
    trusted: boolean;
  } | null;
}

interface DeviceWithSessions {
  id: string;
  deviceName: string;
  fingerprint: string;
  trusted: boolean;
  isAccountCreationDevice: boolean;
  sessions: {
    id: string;
    createdAt: Date;
    expiresAt: Date;
    isActive: boolean;
  }[];
}

interface JwtPayload {
  sessionId: string;
  userId: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { deviceId, trusted } = body;
    
    if (!deviceId || typeof trusted !== 'boolean') {
      return NextResponse.json({
        error: 'Invalid request',
        message: 'Device ID and trust status are required'
      }, { status: 400 });
    }
    
    // Get device WITH fingerprint
    const device = await prisma.userDevice.findFirst({
      where: {
        id: deviceId,
        userId: user.id
      },
      include: {
        sessions: {
          where: {
            isActive: true
          }
        }
      }
    }) as DeviceWithSessions | null;
    
    if (!device) {
      return NextResponse.json({
        error: 'Device not found',
        message: 'The specified device does not exist or does not belong to you'
      }, { status: 404 });
    }
    
    // ✅ SIMPLIFIED VALIDATION: Must have at least one trusted device
    if (!trusted && device.trusted) {
      const totalTrustedCount = await prisma.userDevice.count({
        where: {
          userId: user.id,
          trusted: true
        }
      });
      
      console.log('[Trust Device API] Untrust validation:', {
        deviceId,
        currentlyTrusted: device.trusted,
        totalTrustedDevices: totalTrustedCount,
        isAccountCreation: device.isAccountCreationDevice
      });
      
      if (totalTrustedCount <= 1) {
        return NextResponse.json({
          success: false,
          code: 'LAST_TRUSTED_DEVICE',
          error: 'Cannot untrust device',
          message: 'You must have at least one trusted device. Please trust another device before untrusting this one.'
        }, { status: 400 });
      }
    }
    
    // ✅ Check if current user is on a trusted device (for trusting operations)
    if (trusted && !device.trusted) {
      let token: string | null = null;
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
      if (!token) {
        const cookieStore = await (await import('next/headers')).cookies();
        token = cookieStore.get('auth-token')?.value || null;
      }
      
      if (token) {
        const decoded = jwt.decode(token) as JwtPayload | null;
        if (decoded) {
          const currentSession = await prisma.userSession.findUnique({
            where: { id: decoded.sessionId },
            include: { device: true }
          }) as SessionWithDevice | null;
          
          const hasTrustedDevices = await prisma.userDevice.count({
            where: {
              userId: user.id,
              trusted: true
            }
          }) > 0;
          
          if (hasTrustedDevices && !currentSession?.device?.trusted) {
            return NextResponse.json({
              error: 'Permission denied',
              message: 'Only trusted devices can mark other devices as trusted'
            }, { status: 403 });
          }
        }
      }
    }
    
    // Update device trust status
    await prisma.userDevice.update({
      where: {
        id: deviceId
      },
      data: {
        trusted
      }
    });
    
    // Update session expirations
    if (device.sessions.length > 0) {
      const newExpirationDays = trusted ? 150 : 20;
      
      for (const session of device.sessions) {
        const standardExpiration = new Date(session.createdAt);
        standardExpiration.setDate(standardExpiration.getDate() + (device.trusted ? 150 : 20));
        
        const timeDiff = Math.abs(session.expiresAt.getTime() - standardExpiration.getTime());
        const hoursDiff = timeDiff / (1000 * 3600);
        
        const hasScheduledRemoval = hoursDiff > 12 && session.expiresAt < standardExpiration;
        
        if (!hasScheduledRemoval) {
          const newExpiration = new Date(session.createdAt);
          newExpiration.setDate(newExpiration.getDate() + newExpirationDays);
          
          await prisma.userSession.update({
            where: {
              id: session.id
            },
            data: {
              expiresAt: newExpiration
            }
          });
        }
      }
    }
    
    // Log activity
    await prisma.userActivityLog.create({
      data: {
        userId: user.id,
        action: trusted ? 'device_trusted' : 'device_untrusted',
        description: `Device was ${trusted ? 'marked as trusted' : 'unmarked as trusted'}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          deviceId,
          deviceName: device.deviceName,
          deviceFingerprint: device.fingerprint,
          previousTrustStatus: device.trusted,
          newTrustStatus: trusted,
          affectedSessionsCount: device.sessions.length,
          isAccountCreationDevice: device.isAccountCreationDevice
        }
      }
    });
    
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: trusted ? 'device_trusted' : 'device_untrusted',
        severity: trusted ? 'medium' : 'low',
        description: `Device "${device.deviceName}" was ${trusted ? 'marked as trusted' : 'unmarked as trusted'}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        resolved: true,
        resolvedAt: new Date()
      }
    });
    
    // Clear cache
    const redis = (await import('@/lib/redis')).redis;
    const CACHE_PREFIX = (await import('@/lib/redis')).CACHE_PREFIX;
    
    console.log('[Trust Device API] Cache operation for device:', {
      userId: user.id,
      deviceId,
      fingerprint: device.fingerprint?.substring(0, 16) + '...',
      trusted
    });
    
    const deviceTrustKey = `2fa:device:${user.id}:${device.fingerprint}`;
    
    if (trusted) {
      await redis.setex(
        deviceTrustKey,
        150 * 24 * 60 * 60,
        '1'
      );
      console.log('[Trust Device API] ✅ Set trusted device cache:', deviceTrustKey);
    } else {
      const deleted = await redis.del(deviceTrustKey);
      console.log('[Trust Device API] ✅ Deleted untrusted device cache:', {
        key: deviceTrustKey,
        deleted: deleted > 0
      });
    }
    
    await Promise.all([
      redis.del(`${CACHE_PREFIX.DEVICES}:trusted:${user.id}`),
      redis.del(`${CACHE_PREFIX.DEVICES}:list:${user.id}`),
      redis.del(`${CACHE_PREFIX.SESSIONS}:list:${user.id}`),
      redis.del(`${CACHE_PREFIX.USER_PROFILE}:${user.id}`),
      redis.del(`user:sessions:${user.id}`),
      redis.del(`sessions:${user.id}`),
      redis.del(`trusted_devices:${user.id}`),
      redis.del(`behavior:${user.id}`),
      redis.del(`behavior:profile:${user.id}`),
      redis.del(`behavior:${user.id}:${device.fingerprint}`),
    ]);
    
    const { invalidateUserCache } = await import('@/lib/enhanced-redis');
    await invalidateUserCache(user.id);
    
    console.log('[Trust Device API] ✅ All caches cleared successfully');
    
    return NextResponse.json({
      success: true,
      message: `Device ${trusted ? 'marked as trusted' : 'unmarked as trusted'} successfully`,
      deviceId,
      trusted,
      affectedSessions: device.sessions.length,
      timestamp: Date.now()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error('[Trust Device API] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to update device trust status'
    }, { status: 500 });
  }
}