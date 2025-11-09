//Volumes/vision/codes/course/my-app/src/app/api/user/recovery/verify-code/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/utils/auth';
import { redis } from '@/lib/redis';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, value, code } = body;

    // Validate input
    if (!type || !value || !code) {
      return NextResponse.json({ 
        error: 'Type, value, and code are required' 
      }, { status: 400 });
    }

    // Get recovery option
    const recoveryOption = await prisma.recoveryOption.findUnique({
      where: {
        userId_type_value: {
          userId: user.id,
          type,
          value
        }
      }
    });

    if (!recoveryOption) {
      return NextResponse.json({ 
        error: 'Recovery option not found' 
      }, { status: 404 });
    }

    // Check if locked
    if (recoveryOption.lockedUntil && recoveryOption.lockedUntil > new Date()) {
      const remainingTime = Math.ceil((recoveryOption.lockedUntil.getTime() - Date.now()) / 1000 / 60);
      return NextResponse.json({ 
        error: `Too many failed attempts. Try again in ${remainingTime} minutes.` 
      }, { status: 429 });
    }

    // Check if code expired
    if (!recoveryOption.codeExpiresAt || recoveryOption.codeExpiresAt < new Date()) {
      return NextResponse.json({ 
        error: 'Verification code has expired. Please request a new one.' 
      }, { status: 400 });
    }

    // Hash the provided code
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    // Verify code
    if (recoveryOption.verificationCode !== hashedCode) {
      // Increment attempts
      const newAttempts = recoveryOption.verificationAttempts + 1;
      const updateData: any = {
        verificationAttempts: newAttempts
      };

      // Lock after max attempts
      if (newAttempts >= recoveryOption.maxAttempts) {
        updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }

      await prisma.recoveryOption.update({
        where: { id: recoveryOption.id },
        data: updateData
      });

      const remainingAttempts = recoveryOption.maxAttempts - newAttempts;
      
      if (remainingAttempts <= 0) {
        return NextResponse.json({ 
          error: 'Too many failed attempts. Account locked for 15 minutes.' 
        }, { status: 429 });
      }

      return NextResponse.json({ 
        error: `Invalid code. ${remainingAttempts} attempts remaining.` 
      }, { status: 400 });
    }

    // Code is correct - mark as verified
    await prisma.recoveryOption.update({
      where: { id: recoveryOption.id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verificationCode: null,
        codeExpiresAt: null,
        verificationAttempts: 0,
        lockedUntil: null
      }
    });

    // Update user's recovery fields
    if (type === 'email') {
      await prisma.student.update({
        where: { id: user.id },
        data: { recoveryEmail: value }
      });
    } else if (type === 'phone') {
      await prisma.student.update({
        where: { id: user.id },
        data: { recoveryPhone: value }
      });
    }

    // Log the activity
    await prisma.userActivityLog.create({
      data: {
        userId: user.id,
        action: 'recovery_verified',
        description: `Recovery ${type} verified: ${value}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
        userAgent: request.headers.get('user-agent') || 'Unknown',
      }
    });

    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: 'recovery_method_added',
        severity: 'low',
        description: `Recovery ${type} verified and added`,
        ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
        userAgent: request.headers.get('user-agent') || 'Unknown',
      }
    });

    // Invalidate cache
    try {
      await redis.del(`recovery:status:${user.id}`);
    } catch (redisError) {
      console.warn('Failed to invalidate cache:', redisError);
    }

    return NextResponse.json({ 
      success: true,
      message: `Recovery ${type} verified successfully!`
    });

  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json({ 
      error: 'Failed to verify code' 
    }, { status: 500 });
  }
}