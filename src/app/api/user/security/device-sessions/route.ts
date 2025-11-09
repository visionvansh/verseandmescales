// api/user/security/device-sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import { CACHE_PREFIX, CACHE_TIMES, cacheWrapper, invalidateUserCache } from '@/lib/enhanced-redis';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/log';
import { rateLimit } from '@/lib/rateLimit';
import { PrismaClient } from '@prisma/client';

// Interface for device session response
interface DeviceSessionResponse {
  devices: Array<{
    id: string;
    deviceName: string;
    browser: string;
    os: string;
    lastUsed: string;
    firstSeen: string;
    ipAddress: string;
    location: string;
    isCurrent: boolean;
    trusted: boolean;
    deviceType: string;
    fingerprint: string | null;
    sessions: Array<{
      id: string;
      lastUsed: string;
      createdAt: string;
      expiresAt: string;
      location: string;
      ipAddress: string;
      sessionType: string;
      isActive: boolean;
    }>;
    sessionCount: number;
  }>;
  currentDeviceId: string | undefined;
  totalDeviceCount: number;
  totalSessionCount: number;
}

// Interfaces for Prisma query results
interface UserDevice {
  id: string;
  deviceName: string | null;
  browser: string | null;
  os: string | null;
  lastUsed: Date | null;
  createdAt: Date;
  fingerprint: string | null;
  trusted: boolean;
  deviceType: string | null;
  sessions: UserSession[];
}

interface UserSession {
  id: string;
  lastUsed: Date;
  createdAt: Date;
  expiresAt: Date;
  location: string | null;
  ipAddress: string | null;
  sessionType: string | null;
  isActive: boolean;
  sessionToken?: string; // Optional, used in POST handler
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apply rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const identifier = `${ip}:${user.id}`;
    const { success, limit, remaining, reset } = await rateLimit(identifier, 'devices:list');
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests', reset },
        { 
          status: 429, 
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString()
          }
        }
      );
    }

    // Get current device fingerprint from cookies or headers
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    let currentFingerprint = cookieStore.get('device-fingerprint')?.value;
    
    if (!currentFingerprint) {
      currentFingerprint = request.headers.get('x-device-fingerprint') || undefined;
      logger.warn(`Device fingerprint not found in cookies, using header: ${currentFingerprint || 'none'}`);
    }
    
    if (!currentFingerprint) {
      return NextResponse.json(
        { error: 'Device fingerprint not found', message: 'Could not identify current device' },
        { status: 400 }
      );
    }

    // Check for cache-busting parameter
    const url = new URL(request.url);
    const skipCache = url.searchParams.has('_t');
    
    logger.info(`[Sessions API] ${skipCache ? 'Fetching fresh data (skip cache)' : 'Checking cache'}`);
    
    const cacheKey = `${CACHE_PREFIX.DEVICES}:sessions:${user.id}`;
    
    // Function to fetch device sessions
    const fetchDeviceSessions = async (): Promise<DeviceSessionResponse> => {
      const devices = await prisma.userDevice.findMany({
        where: { userId: user.id },
        include: {
          sessions: {
            where: {
              isActive: true,
              expiresAt: { gt: new Date() }
            },
            orderBy: { lastUsed: 'desc' },
            select: {
              id: true,
              lastUsed: true,
              createdAt: true,
              expiresAt: true,
              location: true,
              ipAddress: true,
              sessionType: true,
              isActive: true
            }
          }
        },
        orderBy: { lastUsed: 'desc' }
      });

      // Create unique device map
      const uniqueDeviceMap = new Map<string, any>();

      devices.forEach((device: UserDevice) => {
        const deviceKey = `${device.browser || 'Unknown'}-${device.os || 'Unknown'}-${device.fingerprint || ''}`;
        
        if (
          !uniqueDeviceMap.has(deviceKey) ||
          new Date(device.lastUsed || device.createdAt) > new Date(uniqueDeviceMap.get(deviceKey).lastUsed)
        ) {
          const isCurrent = device.fingerprint === currentFingerprint;
          
          const deviceSessions = device.sessions.map((session: UserSession) => ({
            id: session.id,
            lastUsed: session.lastUsed.toISOString(),
            createdAt: session.createdAt.toISOString(),
            expiresAt: session.expiresAt.toISOString(),
            location: session.location || 'Unknown location',
            ipAddress: session.ipAddress || 'Unknown',
            sessionType: session.sessionType || 'web',
            isActive: session.isActive
          }));

          const latestSession = device.sessions[0];
          
          uniqueDeviceMap.set(deviceKey, {
            id: device.id,
            deviceName: device.deviceName || `${device.os || 'Unknown OS'} - ${device.browser || 'Unknown Browser'}`,
            browser: device.browser || 'Unknown browser',
            os: device.os || 'Unknown OS',
            lastUsed: device.lastUsed?.toISOString() || device.createdAt.toISOString(),
            firstSeen: device.createdAt.toISOString(),
            ipAddress: latestSession?.ipAddress || 'Unknown',
            location: latestSession?.location || 'Unknown',
            isCurrent,
            trusted: device.trusted,
            deviceType: device.deviceType || 'desktop',
            fingerprint: device.fingerprint,
            sessions: deviceSessions,
            sessionCount: deviceSessions.length
          });
        }
      });

      const uniqueDevices = Array.from(uniqueDeviceMap.values());
      const currentDeviceId = uniqueDevices.find((d: any) => d.isCurrent)?.id;

      return {
        devices: uniqueDevices,
        currentDeviceId,
        totalDeviceCount: uniqueDevices.length,
        totalSessionCount: uniqueDevices.reduce((total: number, device: any) => total + device.sessionCount, 0)
      };
    };

    // Skip cache if requested
    if (skipCache) {
      const data = await fetchDeviceSessions();
      return NextResponse.json(data);
    }

    // Use cache wrapper with stale-while-revalidate
    const response = await cacheWrapper(
      cacheKey,
      fetchDeviceSessions,
      CACHE_TIMES.MEDIUM,
      true
    );

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error fetching device sessions:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to fetch device sessions'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apply rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const identifier = `${ip}:${user.id}`;
    const { success, limit, remaining, reset } = await rateLimit(identifier, 'devices:action');
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests', reset },
        { 
          status: 429, 
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString()
          }
        }
      );
    }

    const body = await request.json();
    const { action, deviceId, data } = body;
    
    if (!deviceId || !action) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'Action and device ID are required' },
        { status: 400 }
      );
    }

    // Check if device exists and belongs to user
    const device = await prisma.userDevice.findFirst({
      where: { id: deviceId, userId: user.id },
      include: { 
        sessions: {
          select: {
            id: true,
            sessionToken: true
          }
        }
      }
    });

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found', message: 'The specified device does not exist or does not belong to you' },
        { status: 404 }
      );
    }

    // Get current session token for validation
    const authHeader = request.headers.get('Authorization');
    let currentSessionToken = authHeader?.split(' ')[1];
    
    if (!currentSessionToken) {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      currentSessionToken = cookieStore.get('auth-token')?.value;
    }

    let result: any;

    // Execute action in transaction
    await prisma.$transaction(async (tx: typeof prisma) => {
      switch (action) {
        case 'trust':
          result = await tx.userDevice.update({
            where: { id: deviceId },
            data: { trusted: true, updatedAt: new Date() }
          });
          
          await tx.userActivityLog.create({
            data: {
              userId: user.id,
              action: 'device_trusted',
              description: `Device ${device.deviceName || 'Unknown'} was trusted`,
              ipAddress: ip,
              userAgent: request.headers.get('user-agent') || 'unknown'
            }
          });
          break;

        case 'untrust':
          result = await tx.userDevice.update({
            where: { id: deviceId },
            data: { trusted: false, updatedAt: new Date() }
          });
          
          await tx.userActivityLog.create({
            data: {
              userId: user.id,
              action: 'device_untrusted',
              description: `Device ${device.deviceName || 'Unknown'} was untrusted`,
              ipAddress: ip,
              userAgent: request.headers.get('user-agent') || 'unknown'
            }
          });
          break;

        case 'rename':
          if (!data?.deviceName) {
            throw new Error('Device name is required');
          }
          if (data.deviceName.length > 50) {
            throw new Error('Device name cannot exceed 50 characters');
          }
          
          result = await tx.userDevice.update({
            where: { id: deviceId },
            data: { deviceName: data.deviceName.trim(), updatedAt: new Date() }
          });
          
          await tx.userActivityLog.create({
            data: {
              userId: user.id,
              action: 'device_renamed',
              description: `Device was renamed to "${data.deviceName.trim()}"`,
              ipAddress: ip,
              userAgent: request.headers.get('user-agent') || 'unknown'
            }
          });
          break;

        case 'revoke_session': {
          if (!data?.sessionId) {
            throw new Error('Session ID is required');
          }
          
          const session = device.sessions.find((s: UserSession) => s.id === data.sessionId);
          if (!session) {
            throw new Error('Session not found');
          }
          
          if (session.sessionToken === currentSessionToken) {
            throw new Error('Cannot revoke current session');
          }
          
          result = await tx.userSession.update({
            where: { id: data.sessionId },
            data: { isActive: false }
          });
          
          await tx.userActivityLog.create({
            data: {
              userId: user.id,
              action: 'session_revoked',
              description: `A session was revoked from device ${device.deviceName || 'Unknown'}`,
              ipAddress: ip,
              userAgent: request.headers.get('user-agent') || 'unknown'
            }
          });
          break;
        }

        case 'revoke_all_sessions': {
          result = await tx.userSession.updateMany({
            where: {
              deviceId: device.id,
              isActive: true,
              sessionToken: { not: currentSessionToken || '' }
            },
            data: { isActive: false }
          });
          
          await tx.userActivityLog.create({
            data: {
              userId: user.id,
              action: 'all_sessions_revoked',
              description: `All sessions were revoked from device ${device.deviceName || 'Unknown'}`,
              ipAddress: ip,
              userAgent: request.headers.get('user-agent') || 'unknown'
            }
          });
          break;
        }

        default:
          throw new Error('Invalid action');
      }

      // Create security event for session actions
      if (action === 'revoke_session' || action === 'revoke_all_sessions') {
        await tx.securityEvent.create({
          data: {
            userId: user.id,
            eventType: action === 'revoke_session' ? 'session_revoked' : 'all_sessions_revoked',
            severity: action === 'revoke_session' ? 'low' : 'medium',
            description: action === 'revoke_session'
              ? 'A session was manually signed out'
              : 'All sessions for a device were signed out',
            ipAddress: ip,
            userAgent: request.headers.get('user-agent') || 'unknown',
            resolved: true,
            resolvedAt: new Date()
          }
        });
      }
    });

    // Invalidate cache
    await invalidateUserCache(user.id);

    return NextResponse.json({
      success: true,
      action,
      deviceId,
      result
    });
  } catch (error: any) {
    logger.error('Error processing device action:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message || 'Failed to process device action' },
      { status: 500 }
    );
  }
}