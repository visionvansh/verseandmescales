// /Volumes/vision/codes/course/my-app/src/app/api/user/biometric/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/utils/auth';
import { redis } from '@/lib/redis';

interface BiometricCredential {
  id: string;
  deviceName: string | null;
  lastUsed: Date;
}

interface LatestCredential {
  id: string;
  deviceName: string | null;
  lastUsed: Date;
}

interface BiometricStatusResponse {
  enabled: boolean;
  credentialsCount: number;
  userSettingEnabled: boolean;
  latestCredentials: LatestCredential[];
}

// Extended user type to include biometricEnabled
interface UserWithBiometric {
  id: string;
  biometricEnabled?: boolean | null;
}

export async function GET(request: NextRequest) {
  console.log('Biometric status request received');
  
  try {
    const user = await getAuthUser(request);
    if (!user) {
      console.warn('Unauthorized biometric status request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cacheKey = `biometric:status:${user.id}`;
    const ttl = 300;

    let cachedData: string | null = null;
    try {
      cachedData = await redis.get(cacheKey);
      if (cachedData) {
        console.log(`Cache hit for biometric status: ${user.id}`);
        const data = JSON.parse(cachedData) as BiometricStatusResponse;
        const headers = new Headers({ 'Cache-Control': `private, max-age=${ttl}` });
        return NextResponse.json(data, { headers });
      }
    } catch (redisError) {
      console.warn('Redis cache error (falling back to DB):', redisError);
    }

    console.log(`Getting biometric status for user: ${user.id}`);

    // Fetch user with biometricEnabled field
    const fullUser = await prisma.student.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        biometricEnabled: true,
      }
    }) as UserWithBiometric | null;

    if (!fullUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const credentials = await prisma.biometricCredential.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        deviceName: true,
        lastUsed: true,
      }
    }) as BiometricCredential[];

    const isEnabled = credentials.length > 0;

    // Update biometricEnabled flag if needed
    if (isEnabled && !fullUser.biometricEnabled) {
      try {
        await prisma.student.update({
          where: { id: user.id },
          data: { biometricEnabled: true }
        });
        console.log(`Updated user biometricEnabled flag for: ${user.id}`);
      } catch (updateError) {
        console.error('Error updating user biometricEnabled flag:', updateError);
      }
    }
      
    console.log(`User biometric status:`, {
      enabled: isEnabled,
      credentialsCount: credentials.length,
      userSettingEnabled: fullUser.biometricEnabled ?? false
    });

    const responseData: BiometricStatusResponse = {
      enabled: isEnabled,
      credentialsCount: credentials.length,
      userSettingEnabled: fullUser.biometricEnabled ?? false,
      latestCredentials: credentials
        .map((cred: BiometricCredential): LatestCredential => ({
          id: cred.id,
          deviceName: cred.deviceName,
          lastUsed: cred.lastUsed
        }))
        .sort((a: LatestCredential, b: LatestCredential) => {
          const timeA = a.lastUsed ? a.lastUsed.getTime() : 0;
          const timeB = b.lastUsed ? b.lastUsed.getTime() : 0;
          return timeB - timeA;
        })
        .slice(0, 3)
    };

    try {
      await redis.set(cacheKey, JSON.stringify(responseData), 'EX', ttl);
      console.log(`Cached biometric status for user: ${user.id}`);
    } catch (redisError) {
      console.warn('Failed to cache biometric status:', redisError);
    }

    const headers = new Headers({ 'Cache-Control': `private, max-age=${ttl}` });
    return NextResponse.json(responseData, { headers });
  } catch (error: unknown) {
    const typedError = error as Error;
    console.error('Error getting biometric status:', typedError);
    return NextResponse.json(
      { error: 'Failed to get biometric status', details: typedError.message }, 
      { status: 500 }
    );
  }
}