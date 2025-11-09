// app/api/user/devices/untrust/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { redis } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId;
    try {
      const tokenPayload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      userId = tokenPayload.userId;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const user = await prisma.student.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const body = await request.json();
    const { deviceId } = body;
    
    if (!deviceId) {
      return NextResponse.json({
        error: 'Device ID required',
        message: 'Please provide a device ID'
      }, { status: 400 });
    }
    
    // ✅ Get device WITH fingerprint
    const device = await prisma.userDevice.findFirst({
      where: {
        id: deviceId,
        userId: user.id
      }
    });
    
    if (!device) {
      return NextResponse.json({
        error: 'Device not found',
        message: 'The specified device does not exist or does not belong to you'
      }, { status: 404 });
    }
    
    // ✅ Check if this is the last trusted device
    if (device.trusted) {
      const trustedDevicesCount = await prisma.userDevice.count({
        where: {
          userId: user.id,
          trusted: true
        }
      });
      
      if (trustedDevicesCount <= 1) {
        return NextResponse.json({
          success: false,
          code: 'LAST_TRUSTED_DEVICE',
          error: 'Cannot untrust device',
          message: 'At least one device must remain trusted.'
        }, { status: 400 });
      }
    }
    
    // ✅ Update the device to untrusted
    await prisma.userDevice.update({
      where: {
        id: deviceId
      },
      data: {
        trusted: false
      }
    });
    
    // ✅ Update all active sessions for this device
    const now = new Date();
    const newExpiryDate = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000); // 20 days
    
    await prisma.userSession.updateMany({
      where: {
        deviceId: deviceId,
        userId: user.id,
        isActive: true
      },
      data: {
        expiresAt: newExpiryDate
      }
    });
    
    // ✅ CRITICAL: Delete Redis cache for this device
    const deviceTrustKey = `2fa:device:${user.id}:${device.fingerprint}`;
    const deleted = await redis.del(deviceTrustKey);
    
    console.log('[Untrust Device API] ✅ Deleted device trust cache:', {
      key: deviceTrustKey,
      deleted: deleted > 0,
      fingerprint: device.fingerprint.substring(0, 16) + '...'
    });
    
    // Log the action
    await prisma.userActivityLog.create({
      data: {
        userId: user.id,
        action: 'device_untrusted',
        description: `Device ${device.deviceName} was marked as untrusted`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          deviceId,
          deviceName: device.deviceName,
          deviceFingerprint: device.fingerprint,
          expiryReduced: true,
          newExpiryDate: newExpiryDate
        }
      }
    });
    
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: 'device_untrusted',
        severity: 'low',
        description: `Device ${device.deviceName} was marked as untrusted`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        resolved: true,
        resolvedAt: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Device untrusted successfully',
      deviceId,
      newExpiryDate: newExpiryDate
    });
  } catch (error) {
    console.error('[Untrust Device API] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to untrust device'
    }, { status: 500 });
  }
}