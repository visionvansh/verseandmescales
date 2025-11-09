//Volumes/vision/codes/course/my-app/src/app/api/user/devices/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthUser } from '@/utils/auth';
import { z } from 'zod';
import { logger } from '@/lib/log';
import { rateLimit } from '@/lib/rateLimit';
import { redis } from '@/lib/redis';

const prisma = new PrismaClient();

// Validate request
// Extend the schema to support more fields
const updateDeviceSchema = z.object({
  deviceId: z.string().min(1, "Device ID is required"),
  deviceName: z.string().min(1, "Device name is required").max(50, "Device name cannot exceed 50 characters"),
  notes: z.string().max(200, "Notes cannot exceed 200 characters").optional(),
  color: z.string().max(20).optional() // Allow users to set custom colors for devices
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Apply rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const identifier = `${ip}:${user.id}`;
    const { success, limit, remaining, reset } = await rateLimit(identifier, 'devices:update');
    
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
    
    // Validate request
    let data;
    try {
      const body = await request.json();
      const result = updateDeviceSchema.safeParse(body);
      
      if (!result.success) {
        return NextResponse.json(
          { error: 'Validation error', details: result.error.format() },
          { status: 400 }
        );
      }
      
      data = result.data;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    // Find the device
    const device = await prisma.userDevice.findFirst({
      where: {
        id: data.deviceId,
        userId: user.id
      }
    });
    
    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }
    
    // Update device name
    const updatedDevice = await prisma.userDevice.update({
      where: { id: device.id },
      data: {
        deviceName: data.deviceName.trim(),
        updatedAt: new Date()
      }
    });
    
    // Invalidate cache
    await redis.del(`user:devices:${user.id}`);
    
    // Log activity
    await prisma.userActivityLog.create({
      data: {
        userId: user.id,
        action: 'device_renamed',
        description: `Device renamed to "${data.deviceName.trim()}"`,
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: { deviceId: device.id, oldName: device.deviceName }
      }
    });
    
    return NextResponse.json({
      success: true,
      device: {
        id: updatedDevice.id,
        deviceName: updatedDevice.deviceName
      }
    });
  } catch (error) {
    logger.error('Error updating device:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}