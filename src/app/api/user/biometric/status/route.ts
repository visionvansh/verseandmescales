import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/utils/auth';
import { redis } from '@/lib/redis'; // Assuming this is available as in 2FA routes

// Define the BiometricCredential interface based on Prisma query
interface BiometricCredential {
  id: string;
  deviceName: string | null;
  lastUsed: Date | null;
}

export async function GET(request: NextRequest) {
  console.log('Biometric status request received');
  
  try {
    // Authenticate user
    const user = await getAuthUser(request) as unknown as { 
      id: string; 
      createdAt: Date; 
      username: string; 
      email: string; 
      phone: string; 
      name: string; 
      surname: string; 
      img: string; 
      password: string; 
      emailVerified: boolean; 
      phoneVerified: boolean; 
      twoFactorEnabled: boolean; 
      biometricEnabled?: boolean; // Add biometricEnabled as optional
      [key: string]: any; // Allow other properties
    };
    if (!user) {
      console.warn('Unauthorized biometric status request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Cache key for this user's biometric status
    const cacheKey = `biometric:status:${user.id}`;
    const ttl = 300; // 5 minutes

    // Try to get from Redis cache
    let cachedData;
    try {
      cachedData = await redis.get(cacheKey);
      if (cachedData) {
        console.log(`Cache hit for biometric status: ${user.id}`);
        const data = JSON.parse(cachedData);
        // Add cache headers
        const headers = new Headers({ 'Cache-Control': `private, max-age=${ttl}` });
        return NextResponse.json(data, { headers });
      }
    } catch (redisError) {
      console.warn('Redis cache error (falling back to DB):', redisError);
      // Continue to DB fetch
    }

    console.log(`Getting biometric status for user: ${user.id}`);

    // Count credentials and get details (original logic)
    const credentials = await prisma.biometricCredential.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        deviceName: true,
        lastUsed: true,
      }
    });

    const isEnabled = credentials.length > 0; // If credentials exist, consider it enabled

    // Then update user setting if needed (original logic)
    if (isEnabled && !(user.biometricEnabled ?? false)) {
      try {
        // Update the user setting in the database
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
      userSettingEnabled: user.biometricEnabled ?? false // Fallback to false if undefined
    });

    // Prepare response (original logic)
    const responseData = {
      enabled: isEnabled,
      credentialsCount: credentials.length,
      userSettingEnabled: user.biometricEnabled ?? false,
      // Include basic credential info for UI
      latestCredentials: credentials.map((cred: BiometricCredential) => ({
        id: cred.id,
        deviceName: cred.deviceName,
        lastUsed: cred.lastUsed
      })).sort((a: { id: string; deviceName: string | null; lastUsed: Date | null }, b: { id: string; deviceName: string | null; lastUsed: Date | null }) => {
        const timeA = a.lastUsed ? a.lastUsed.getTime() : 0;
        const timeB = b.lastUsed ? b.lastUsed.getTime() : 0;
        return timeB - timeA;
      }).slice(0, 3)
    };

    // Cache the response in Redis
    try {
      await redis.set(cacheKey, JSON.stringify(responseData), 'EX', ttl);
      console.log(`Cached biometric status for user: ${user.id}`);
    } catch (redisError) {
      console.warn('Failed to cache biometric status:', redisError);
    }

    // Add cache headers
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