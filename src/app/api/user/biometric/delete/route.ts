// /Volumes/vision/codes/course/my-app/src/app/api/user/biometric/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma, { PrismaTx } from '@/lib/prisma';
import { getAuthUser } from '@/utils/auth';
import { redis } from '@/lib/redis';

// Type definitions
interface BiometricCredential {
  id: string;
  userId: string;
  deviceName: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  transports: string | null;
  lastUsed: Date;
  createdAt: Date;
}

interface TransactionResult {
  remainingCredentials: number;
  deviceName: string;
}

export async function POST(request: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  try {
    const user = await getAuthUser(request);
    if (!user) {
      console.warn('Unauthorized biometric deletion attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { credentialId } = body as { credentialId: string };

    if (!credentialId) {
      console.warn('Missing credential ID in delete request');
      return NextResponse.json(
        { error: 'Invalid request: Credential ID is required' }, 
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx: PrismaTx): Promise<TransactionResult> => {
      const credential = await tx.biometricCredential.findFirst({
        where: {
          id: credentialId,
          userId: user.id
        }
      }) as BiometricCredential | null;

      if (!credential) {
        throw new Error('Credential not found or does not belong to you');
      }

      const deviceName = credential.deviceName;

      await tx.biometricCredential.delete({
        where: { id: credentialId }
      });

      const remainingCredentialsCount = await tx.biometricCredential.count({
        where: { userId: user.id }
      });

      if (remainingCredentialsCount === 0) {
        await tx.student.update({
          where: { id: user.id },
          data: { biometricEnabled: false }
        });
      }

      await tx.securityEvent.create({
        data: {
          userId: user.id,
          eventType: 'biometric_removed',
          severity: 'medium',
          description: `Biometric credential removed: ${deviceName}`,
          ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
        }
      });

      await tx.userActivityLog.create({
        data: {
          userId: user.id,
          action: 'biometric_disabled',
          description: `Biometric credential removed: ${deviceName}`,
          ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
          userAgent: request.headers.get('user-agent') || 'Unknown',
          metadata: {
            remainingCredentials: remainingCredentialsCount,
            biometricStillEnabled: remainingCredentialsCount > 0
          }
        }
      });

      return { 
        remainingCredentials: remainingCredentialsCount,
        deviceName 
      };
    });

    try {
      await redis.del(`biometric:status:${user.id}`);
      await redis.del(`biometric:list:${user.id}`);
      console.log(`Invalidated biometric caches for user: ${user.id} after delete`);
    } catch (redisError) {
      console.warn('Failed to invalidate caches after delete:', redisError);
    }

    clearTimeout(timeoutId);
    
    const headers = new Headers();
    headers.append('Cache-Control', 'no-store, must-revalidate');
    headers.append('Pragma', 'no-cache');
    headers.append('Expires', '0');

    return NextResponse.json({ 
      success: true,
      remainingCredentials: result.remainingCredentials,
      biometricEnabled: result.remainingCredentials > 0,
      deviceRemoved: result.deviceName
    }, { headers });
    
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    
    console.error('Error deleting biometric credential:', error);
    
    const typedError = error as Error;
    
    if (typedError.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timed out. Please try again.' }, 
        { status: 408 }
      );
    }
    
    if (typedError.message === 'Credential not found or does not belong to you') {
      return NextResponse.json(
        { error: typedError.message }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to delete credential: ' + (typedError.message || 'Unknown error'), 
        details: process.env.NODE_ENV === 'development' ? typedError.stack : undefined 
      }, 
      { status: 500 }
    );
  }
}