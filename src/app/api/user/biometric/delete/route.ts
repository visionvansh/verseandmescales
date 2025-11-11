import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/utils/auth';
import { redis } from '@/lib/redis';

export async function POST(request: NextRequest) {
  // Add request timeout handling (unchanged)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
  
  try {
    // Authenticate user (original logic unchanged)
    const user = await getAuthUser(request);
    if (!user) {
      console.warn('Unauthorized biometric deletion attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { credentialId } = body;

    if (!credentialId) {
      console.warn('Missing credential ID in delete request');
      return NextResponse.json(
        { error: 'Invalid request: Credential ID is required' }, 
        { status: 400 }
      );
    }

    // Use Prisma transaction to ensure consistency (original logic unchanged)
    const result = await prisma.$transaction(async (tx) => {
      // Verify the credential belongs to the user
      const credential = await tx.biometricCredential.findFirst({
        where: {
          id: credentialId,
          userId: user.id
        }
      });

      if (!credential) {
        throw new Error('Credential not found or does not belong to you');
      }

      // Record credential info for logging
      const deviceName = credential.deviceName;

      // Delete the credential
      await tx.biometricCredential.delete({
        where: { id: credentialId }
      });

      // Check if this was the last credential
      const remainingCredentialsCount = await tx.biometricCredential.count({
        where: { userId: user.id }
      });

      // If no credentials remain, disable biometric auth
      if (remainingCredentialsCount === 0) {
        await tx.student.update({
          where: { id: user.id },
          data: { biometricEnabled: false }
        });
      }

      // Log security event
      await tx.securityEvent.create({
        data: {
          userId: user.id,
          eventType: 'biometric_removed',
          severity: 'medium',
          description: `Biometric credential removed: ${deviceName}`,
          ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
        }
      });

      // Create activity log
      await tx.userActivityLog.create({
        data: {
          userId: user.id,
          action: 'biometric_disabled',
          description: `Biometric credential removed: ${deviceName}`,
          ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
          userAgent: request.headers.get('user-agent') || 'Unknown',
          metadata: JSON.stringify({
            remainingCredentials: remainingCredentialsCount,
            biometricStillEnabled: remainingCredentialsCount > 0
          })
        }
      });

      return { 
        remainingCredentials: remainingCredentialsCount,
        deviceName 
      };
    });

    // Invalidate caches after successful deletion (new: ensures fresh status/list)
    try {
      await redis.del(`biometric:status:${user.id}`);
      await redis.del(`biometric:list:${user.id}`);
      console.log(`Invalidated biometric caches for user: ${user.id} after delete`);
    } catch (redisError) {
      console.warn('Failed to invalidate caches after delete:', redisError);
    }

    // Clear the timeout as request is successful (original logic unchanged)
    clearTimeout(timeoutId);
    
    // Set appropriate cache control headers (original logic unchanged)
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
    // Clear the timeout to prevent memory leaks (original logic unchanged)
    clearTimeout(timeoutId);
    
    console.error('Error deleting biometric credential:', error);
    
    // Assert error as Error type for property access
    const typedError = error as Error;
    
    // Handle abort errors specifically (original logic unchanged)
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