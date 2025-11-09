// /app/api/auth/check-username/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // ✅ Use singleton Prisma client
import { redis, cacheKeys, CACHE_TIMES } from '@/lib/redis'; // ✅ Use singleton Redis

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const normalizedUsername = username.toLowerCase();

    // Basic validation
    if (normalizedUsername.length < 3) {
      return NextResponse.json({
        available: false,
        error: 'Username must be at least 3 characters long'
      });
    }

    if (normalizedUsername.length > 30) {
      return NextResponse.json({
        available: false,
        error: 'Username must be less than 30 characters'
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(normalizedUsername)) {
      return NextResponse.json({
        available: false,
        error: 'Username can only contain letters, numbers, and underscores'
      });
    }

    // ✅ Check Redis cache first
    const cachedResult = await redis.get(cacheKeys.usernameCheck(normalizedUsername));
    
    if (cachedResult) {
      console.log('[Check Username] Cache hit from Redis');
      return NextResponse.json(JSON.parse(cachedResult));
    }
    
    console.log('[Check Username] Cache miss - checking database');

    // Check if username exists in database using singleton Prisma
    const existingStudent = await prisma.student.findUnique({
      where: { username: normalizedUsername }
    });

    const result = {
      available: !existingStudent,
      username: normalizedUsername
    };

    // ✅ Cache the result in Redis
    await redis.set(
      cacheKeys.usernameCheck(normalizedUsername),
      JSON.stringify(result),
      'EX',
      CACHE_TIMES.USERNAME_CHECK
    );

    return NextResponse.json(result);

  } catch (error) {
    console.error('Check username error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}