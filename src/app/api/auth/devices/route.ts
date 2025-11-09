//api/auth/devices
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import { revokeDeviceTrust } from '@/utils/twoFactorAuth';
import prisma from '@/lib/prisma';
import { redis } from '@/lib/redis';

// Get all user devices
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const devices = await prisma.userDevice.findMany({
      where: { userId: user.id },
      orderBy: { lastUsed: 'desc' },
      select: {
        id: true,
        deviceName: true,
        deviceType: true,
        browser: true,
        browserVersion: true,
        os: true,
        osVersion: true,
        trusted: true,
        firstUsed: true,
        lastUsed: true,
        usageCount: true,
        sessions: {
          where: { isActive: true },
          select: {
            id: true,
            lastUsed: true,
            ipAddress: true,
            location: true,
          }
        }
      }
    });
    
    return NextResponse.json({ devices });
  } catch (error) {
    console.error('Error fetching devices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch devices' },
      { status: 500 }
    );
  }
}

// Trust a device
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { deviceId } = body;
    
    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }
    
    // Verify device belongs to user
    const device = await prisma.userDevice.findFirst({
      where: {
        id: deviceId,
        userId: user.id
      }
    });
    
    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }
    
    // Trust the device
    await prisma.userDevice.update({
      where: { id: deviceId },
      data: { trusted: true }
    });
    
    // Cache in Redis
    await redis.setex(
      `2fa:device:${user.id}:${device.fingerprint}`,
      30 * 24 * 60 * 60, // 30 days
      '1'
    );
    
    return NextResponse.json({
      message: 'Device trusted successfully',
      success: true
    });
  } catch (error) {
    console.error('Error trusting device:', error);
    return NextResponse.json(
      { error: 'Failed to trust device' },
      { status: 500 }
    );
  }
}

// Revoke device trust
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    
    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }
    
    // Verify device belongs to user
    const device = await prisma.userDevice.findFirst({
      where: {
        id: deviceId,
        userId: user.id
      }
    });
    
    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }
    
    await revokeDeviceTrust(user.id, deviceId);
    
    return NextResponse.json({
      message: 'Device trust revoked successfully',
      success: true
    });
  } catch (error) {
    console.error('Error revoking device trust:', error);
    return NextResponse.json(
      { error: 'Failed to revoke device trust' },
      { status: 500 }
    );
  }
}