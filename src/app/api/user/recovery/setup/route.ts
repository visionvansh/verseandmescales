//Volumes/vision/codes/course/my-app/src/app/api/user/recovery/setup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/utils/auth';
import { redis } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recoveryEmail, recoveryPhone, useRecoveryEmail, useRecoveryPhone } = body;

    // Validate inputs (original logic unchanged)
    if (useRecoveryEmail && !recoveryEmail) {
      return NextResponse.json({ error: 'Recovery email is required' }, { status: 400 });
    }

    if (useRecoveryPhone && !recoveryPhone) {
      return NextResponse.json({ error: 'Recovery phone is required' }, { status: 400 });
    }

    // Update user recovery options (original logic unchanged)
    await prisma.student.update({
      where: { id: user.id },
      data: {
        recoveryEmail: useRecoveryEmail ? recoveryEmail : null,
        recoveryPhone: useRecoveryPhone ? recoveryPhone : null
      }
    });

    // Log security event (original logic unchanged)
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: 'recovery_options_updated',
        severity: 'low',
        description: 'Account recovery options updated',
        ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
        userAgent: request.headers.get('user-agent') || 'Unknown',
      }
    });

    // Create activity log (original logic unchanged)
    await prisma.userActivityLog.create({
      data: {
        userId: user.id,
        action: 'recovery_options_updated',
        description: 'Account recovery options were updated',
        ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
        userAgent: request.headers.get('user-agent') || 'Unknown',
      }
    });

    // Invalidate recovery status cache after successful update (new: ensures fresh next fetch)
    try {
      await redis.del(`recovery:status:${user.id}`);
      console.log(`Invalidated recovery status cache for user: ${user.id}`);
    } catch (redisError) {
      console.warn('Failed to invalidate recovery cache:', redisError);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Recovery options updated successfully' 
    });
  } catch (error) {
    console.error('Recovery options update error:', error);
    return NextResponse.json({ error: 'Failed to update recovery options' }, { status: 500 });
  }
}