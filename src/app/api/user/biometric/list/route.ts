import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/utils/auth';
import { redis } from '@/lib/redis';

// Define the BiometricCredential interface based on Prisma query
interface BiometricCredential {
  id: string;
  deviceName: string | null;
  createdAt: Date | null;
  lastUsed: Date | null;
  transports: string | null;
}

export async function GET(request: NextRequest) {
  console.log('Biometric credentials list request received');
  
  try {
    // Authenticate user
    const user = await getAuthUser(request);
    if (!user) {
      console.warn('Unauthorized biometric list request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Cache key for this user's biometric list
    const cacheKey = `biometric:list:${user.id}`;
    const ttl = 300; // 5 minutes

    // Try to get from Redis cache
    let cachedData;
    try {
      cachedData = await redis.get(cacheKey);
      if (cachedData) {
        console.log(`Cache hit for biometric list: ${user.id}`);
        const data = JSON.parse(cachedData);
        // Add cache headers
        const headers = new Headers({ 'Cache-Control': `private, max-age=${ttl}` });
        return NextResponse.json(data, { headers });
      }
    } catch (redisError) {
      console.warn('Redis cache error (falling back to DB):', redisError);
      // Continue to DB fetch
    }

    console.log(`Listing biometric credentials for user: ${user.id}`);

    // Get credentials with more information (original logic)
    const credentials = await prisma.biometricCredential.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        deviceName: true,
        createdAt: true,
        lastUsed: true,
        transports: true,
        // Don't include sensitive data like publicKey
      },
      orderBy: {
        lastUsed: 'desc' // Show most recently used first
      }
    });

    console.log(`Found ${credentials.length} credentials`);

    // Process transport options (original logic)
    const processedCredentials = credentials.map((cred: BiometricCredential) => {
      let transportOptions = [];
      try {
        if (cred.transports) {
          transportOptions = JSON.parse(cred.transports);
        }
      } catch (e) {
        console.warn(`Failed to parse transports for credential ${cred.id}:`, e);
      }
      
      return {
        ...cred,
        transportOptions,
        lastUsedAgo: getTimeAgo(cred.lastUsed),
        createdAgo: getTimeAgo(cred.createdAt)
      };
    });

    const responseData = { 
      credentials: processedCredentials,
      totalCount: credentials.length
    };

    // Cache the response in Redis
    try {
      await redis.set(cacheKey, JSON.stringify(responseData), 'EX', ttl);
      console.log(`Cached biometric list for user: ${user.id}`);
    } catch (redisError) {
      console.warn('Failed to cache biometric list:', redisError);
    }

    // Add cache headers
    const headers = new Headers({ 'Cache-Control': `private, max-age=${ttl}` });
    return NextResponse.json(responseData, { headers });
  } catch (error: unknown) {
    const typedError = error as Error;
    console.error('Error listing biometric credentials:', typedError);
    return NextResponse.json(
      { error: 'Failed to list credentials', details: typedError.message }, 
      { status: 500 }
    );
  }
}

// Helper function to get human-readable time (unchanged)
function getTimeAgo(date: Date | null): string {
  if (!date) return 'never';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) {
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  } else if (diffHour > 0) {
    return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  } else if (diffMin > 0) {
    return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  } else {
    return 'just now';
  }
}