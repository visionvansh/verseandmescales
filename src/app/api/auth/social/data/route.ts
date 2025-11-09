///Volumes/vision/codes/course/my-app/src/app/api/auth/social/data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { redis, cacheKeys, CACHE_TIMES } from '@/lib/redis';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  
  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }

  try {
    // Check Redis cache first
    const cachedData = await redis.get(cacheKeys.socialData(token));
    
    if (cachedData) {
      console.log('Cache hit: Using cached social data');
      return NextResponse.json(JSON.parse(cachedData));
    }
    
    console.log('Cache miss: Fetching social data from database');
    
    // Get temporary OAuth data from database
    const socialData = await prisma.tempOAuthData.findUnique({
      where: { token },
    });

    if (!socialData) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 });
    }

    // Check if token has expired
    if (new Date() > socialData.expiresIn) {
      await prisma.tempOAuthData.delete({
        where: { token }
      });
      return NextResponse.json({ error: 'Token expired' }, { status: 410 });
    }

    const responseData = {
      provider: socialData.provider,
      providerData: socialData.providerData,
      // ✅ Include metadata (redirect URL) if available
      metadata: socialData.metadata || {}
    };

    // Cache the response
    await redis.set(
      cacheKeys.socialData(token),
      JSON.stringify(responseData),
      'EX',
      CACHE_TIMES.SOCIAL_DATA
    );

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error fetching social data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}