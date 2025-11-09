import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/utils/auth';
import { redis } from '@/lib/redis';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Fetch security events and activity logs
    const [securityEvents, activityLogs] = await Promise.all([
      prisma.securityEvent.findMany({
        where: { userId: user.id },
        select: { id: true, eventType: true, severity: true, description: true, createdAt: true },
        take: 10
      }),
      prisma.userActivityLog.findMany({
        where: { userId: user.id },
        select: { id: true, action: true, description: true, createdAt: true },
        take: 10
      })
    ]);
    
    // Cache results
    const pipeline = redis.pipeline();
    pipeline.set(`security:events:${user.id}`, JSON.stringify(securityEvents), 'EX', 3600);
    pipeline.set(`activity:logs:${user.id}`, JSON.stringify(activityLogs), 'EX', 3600);
    await pipeline.exec();
    
    return NextResponse.json({
      success: true,
      message: 'Security data updated',
      securityEvents,
      activityLogs
    });
  } catch (error) {
    logger.error('Error updating security data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}