// app/api/user/recovery/setup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Updated to use singleton from /lib/prisma.ts
import { getAuthUser } from '@/utils/auth'; // Uses the updated auth.ts

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recoveryEmail, recoveryPhone, useRecoveryEmail, useRecoveryPhone } = body;

    // Validate inputs
    if (useRecoveryEmail && !recoveryEmail) {
      return NextResponse.json({ error: 'Recovery email is required' }, { status: 400 });
    }

    if (useRecoveryPhone && !recoveryPhone) {
      return NextResponse.json({ error: 'Recovery phone is required' }, { status: 400 });
    }

    // Update user recovery options
    await prisma.student.update({
      where: { id: user.id },
      data: {
        recoveryEmail: useRecoveryEmail ? recoveryEmail : null,
        recoveryPhone: useRecoveryPhone ? recoveryPhone : null
      }
    });

    // Log security event
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

    // Create activity log
    await prisma.userActivityLog.create({
      data: {
        userId: user.id,
        action: 'recovery_options_updated',
        description: 'Account recovery options were updated',
        ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
        userAgent: request.headers.get('user-agent') || 'Unknown',
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Recovery options updated successfully' 
    });
  } catch (error) {
    console.error('Recovery options update error:', error);
    return NextResponse.json({ error: 'Failed to update recovery options' }, { status: 500 });
  }
}