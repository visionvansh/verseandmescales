// app/api/auth/devices/trust/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/utils/auth';
import { CACHE_PREFIX, invalidateUserCache, redis } from '@/lib/enhanced-redis';

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
        error: 'Missing required fields',
        message: 'Device ID and trust status are required'
      }, { status: 400 });
    }
    
    // Find the device
    const device = await prisma.userDevice.findFirst({
      where: {
        id: deviceId,
        userId: user.id
      }
    });
    
    if (!device) {
      return NextResponse.json({
        error: 'Device not found',
        message: 'The specified device does not exist'
      }, { status: 404 });
    }
    
    // ✅ PREVENT UNTRUSTING THE LAST TRUSTED DEVICE
    if (!trusted && device.trusted) {
      // Count other trusted devices
      const trustedDevicesCount = await prisma.userDevice.count({
        where: {
          userId: user.id,
          trusted: true,
          id: { not: deviceId }
        }
      });
      
      if (trustedDevicesCount === 0) {
        return NextResponse.json({
          error: 'Cannot untrust device',
          message: 'You must have at least one trusted device. Please trust another device first before untrusting this one.',
          code: 'LAST_TRUSTED_DEVICE'
        }, { status: 400 });
      }
    }
    
    // Update device trust status
    await prisma.userDevice.update({
      where: { id: deviceId },
      data: { trusted }
    });
    
    // ✅ Update all sessions for this device with new expiration
    const expirationDays = trusted ? 150 : 28;
    const newExpirationDate = new Date();
    newExpirationDate.setDate(newExpirationDate.getDate() + expirationDays);
    
    await prisma.userSession.updateMany({
      where: {
        deviceId,
        isActive: true
      },
      data: {
        expiresAt: newExpirationDate
      }
    });
    
    // Log the action
    await prisma.authLog.create({
      data: {
        userId: user.id,
        action: trusted ? 'device_trusted' : 'device_untrusted',
        success: true,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: { 
          deviceId,
          deviceName: device.deviceName,
          newExpiration: newExpirationDate.toISOString()
        }
      }
    });
    
    // ✅ CRITICAL: Clear all cache layers immediately
    console.log('[Device Trust] Clearing cache for user:', user.id);
    
    await Promise.all([
      redis.del(`${CACHE_PREFIX.SESSIONS}:list:${user.id}`),
      redis.del(`${CACHE_PREFIX.DEVICES}:list:${user.id}`),
      redis.del(`${CACHE_PREFIX.USER_PROFILE}:${user.id}`),
      redis.del(`user:sessions:${user.id}`),
      redis.del(`sessions:${user.id}`),
      redis.del(`devices:${user.id}`),
      invalidateUserCache(user.id)
    ]);
    
    console.log('[Device Trust] Cache cleared successfully');
    
    return NextResponse.json({
      success: true,
      message: `Device ${trusted ? 'trusted' : 'untrusted'} successfully`,
      deviceId,
      trusted,
      newSessionExpiration: newExpirationDate.toISOString(),
      timestamp: Date.now()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('Error updating device trust:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to update device trust status'
    }, { status: 500 });
  }
}