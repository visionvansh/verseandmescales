//Volumes/vision/codes/course/my-app/src/app/api/user/devices/trusted/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

// Define the UserDevice interface based on Prisma query
interface UserDevice {
  id: string;
  deviceName: string | null;
  browser: string | null;
  os: string | null;
  lastUsed: Date | null;
  fingerprint: string | null;
  trusted: boolean;
}

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    let userId;
    try {
      const tokenPayload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      userId = tokenPayload.userId;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Find user
    const user = await prisma.student.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get current device fingerprint
    const currentFingerprint = request.cookies.get('device-fingerprint')?.value;
    
    if (!currentFingerprint) {
      return NextResponse.json({
        error: 'Device fingerprint not found',
        message: 'Could not identify current device'
      }, { status: 400 });
    }
    
    // Get user devices
    const devices = await prisma.userDevice.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        lastUsed: 'desc'
      }
    });
    
    // Transform devices to include whether each is the current device
    const formattedDevices = devices.map((device: UserDevice) => {
      const isCurrent = device.fingerprint === currentFingerprint;
      return {
        id: device.id,
        deviceName: device.deviceName,
        browser: device.browser || 'Unknown browser',
        os: device.os || 'Unknown OS',
        lastUsed: device.lastUsed,
        ipAddress: "***.***.***.**", // Masked for privacy
        isCurrent,
        trusted: device.trusted
      };
    });
    
    // Return devices with current device identified
    return NextResponse.json({
      devices: formattedDevices,
      currentDeviceId: devices.find((d: UserDevice) => d.fingerprint === currentFingerprint)?.id
    });
  } catch (error) {
    console.error('Error fetching trusted devices:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to fetch trusted devices'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    let userId;
    try {
      const tokenPayload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      userId = tokenPayload.userId;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Find user
    const user = await prisma.student.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Parse request body
    const body = await request.json();
    const { deviceId, trusted } = body;
    
    if (!deviceId) {
      return NextResponse.json({
        error: 'Device ID required',
        message: 'Please provide a device ID'
      }, { status: 400 });
    }
    
    if (typeof trusted !== 'boolean') {
      return NextResponse.json({
        error: 'Trust status required',
        message: 'Please provide a trust status (true/false)'
      }, { status: 400 });
    }
    
    // Verify the device belongs to the user
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
    
    // Update device trust status
    await prisma.userDevice.update({
      where: {
        id: deviceId
      },
      data: {
        trusted,
        updatedAt: new Date()
      }
    });
    
    // Log the action
    await prisma.userActivityLog.create({
      data: {
        userId: user.id,
        action: trusted ? 'device_trusted' : 'device_untrusted',
        description: `Device ${device.deviceName} was ${trusted ? 'trusted' : 'untrusted'}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `Device ${trusted ? 'trusted' : 'untrusted'} successfully`,
      deviceId,
      trusted
    });
  } catch (error) {
    console.error('Error updating trusted device status:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to update device trust status'
    }, { status: 500 });
  }
}