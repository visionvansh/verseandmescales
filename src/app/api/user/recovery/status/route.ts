//Volumes/vision/codes/course/my-app/src/app/api/user/recovery/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/utils/auth';
import { redis } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Cache key for this user's recovery status
    const cacheKey = `recovery:status:${user.id}`;
    const ttl = 600; // 10 minutes (recovery options change infrequently)

    // Try to get from Redis cache
    let cachedData;
    try {
      cachedData = await redis.get(cacheKey);
      if (cachedData) {
        console.log(`Cache hit for recovery status: ${user.id}`);
        const data = JSON.parse(cachedData);
        // Add cache headers
        const headers = new Headers({ 'Cache-Control': `private, max-age=${ttl}` });
        return NextResponse.json(data, { headers });
      }
    } catch (redisError) {
      console.warn('Redis cache error (falling back to DB):', redisError);
      // Continue to DB fetch
    }

    const userData = await prisma.student.findUnique({
      where: { id: user.id },
      select: {
        recoveryEmail: true,
        recoveryPhone: true
      }
    });

    const responseData = {
      recoveryEmail: userData?.recoveryEmail || null,
      recoveryPhone: userData?.recoveryPhone || null,
      hasRecoveryEmail: !!userData?.recoveryEmail,
      hasRecoveryPhone: !!userData?.recoveryPhone
    };

    // Cache the response in Redis
    try {
      await redis.set(cacheKey, JSON.stringify(responseData), 'EX', ttl);
      console.log(`Cached recovery status for user: ${user.id}`);
    } catch (redisError) {
      console.warn('Failed to cache recovery status:', redisError);
    }

    // Add cache headers
    const headers = new Headers({ 'Cache-Control': `private, max-age=${ttl}` });
    return NextResponse.json(responseData, { headers });
  } catch (error) {
    console.error('Recovery options status error:', error);
    return NextResponse.json({ error: 'Failed to get recovery options status' }, { status: 500 });
  }
}