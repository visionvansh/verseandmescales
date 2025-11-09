// app/api/auth/2fa/request-additional-code/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { redis } from '@/lib/redis';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendEmail } from '@/utils/email';
import { sendSMS } from '@/utils/sms';

const MAX_FAILED_ATTEMPTS = 3;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, method } = body;

    console.log('[2FA Request Additional] Request:', { sessionId, method });

    if (!sessionId || !method) {
      return NextResponse.json(
        { error: 'Session ID and method are required' },
        { status: 400 }
      );
    }

    // Get 2FA session
    const session = await prisma.twoFactorSession.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            recoveryEmail: true,
            recoveryPhone: true,
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 400 }
      );
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await prisma.twoFactorSession.delete({ where: { id: sessionId } });
      await redis.del(`2fa:session:${sessionId}`);
      
      return NextResponse.json(
        { error: 'Session expired. Please try logging in again.' },
        { status: 400 }
      );
    }

    const metadata = session.metadata as any || {};
    const failedAttempts = metadata.failedAttempts || 0;

    // ✅ CRITICAL: Only allow additional methods after failed attempts
    if (failedAttempts < MAX_FAILED_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Additional methods not yet available' },
        { status: 403 }
      );
    }

    // ✅ Verify the method is actually available for this user
    const additionalMethods = metadata.additionalMethods || [];
    if (!additionalMethods.includes(method)) {
      return NextResponse.json(
        { error: 'This recovery method is not available for your account' },
        { status: 403 }
      );
    }

    // Generate verification code
    const code = crypto.randomInt(100000, 999999).toString();
    const hashedCode = await bcrypt.hash(code, 10);

    // Store in database with expiration
    await prisma.twoFactorVerificationCode.create({
      data: {
        userId: session.userId,
        code: hashedCode,
        method,
        used: false,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      }
    });

    let recipient = '';
    let partialDisplay = '';

    // Send code based on method
    if (method === 'recovery_email') {
      const recoveryEmail = session.user.recoveryEmail;
      
      if (!recoveryEmail) {
        return NextResponse.json(
          { error: 'No recovery email configured' },
          { status: 400 }
        );
      }

      recipient = recoveryEmail;
      partialDisplay = maskEmail(recoveryEmail);

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>🔐 Recovery Verification Code</h2>
          <p>Hi ${session.user.name || 'there'},</p>
          <p>You requested a recovery verification code. Your code is:</p>
          <h1 style="color: #dc2626; font-size: 36px; letter-spacing: 8px; text-align: center;">${code}</h1>
          <p style="color: #666;">This code will expire in <strong>10 minutes</strong>.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this code, please secure your account immediately.</p>
        </div>
      `;

      await sendEmail({
        to: recoveryEmail,
        subject: '🔐 Your Recovery Verification Code',
        text: `Your recovery verification code is: ${code}. Valid for 10 minutes.`,
        html: htmlContent
      });

      console.log('[2FA Request Additional] Recovery email sent to:', partialDisplay);

    } else if (method === 'recovery_phone') {
      const recoveryPhone = session.user.recoveryPhone;
      
      if (!recoveryPhone) {
        return NextResponse.json(
          { error: 'No recovery phone configured' },
          { status: 400 }
        );
      }

      recipient = recoveryPhone;
      partialDisplay = maskPhone(recoveryPhone);

      await sendSMS({
        to: recoveryPhone,
        message: `Your Clipify Elite recovery code is: ${code}. Valid for 10 minutes.`
      });

      console.log('[2FA Request Additional] Recovery SMS sent to:', partialDisplay);

    } else {
      return NextResponse.json(
        { error: 'Invalid recovery method' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: `Recovery code sent to ${partialDisplay}`,
      partialEmail: method === 'recovery_email' ? partialDisplay : undefined,
      partialPhone: method === 'recovery_phone' ? partialDisplay : undefined,
      expiresIn: 600 // seconds
    });

  } catch (error) {
    console.error('[2FA Request Additional] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send recovery code' },
      { status: 500 }
    );
  }
}

// Helper functions
function maskEmail(email: string): string {
  const [username, domain] = email.split('@');
  const maskedUsername = username.length > 2 
    ? username[0] + '*'.repeat(username.length - 2) + username[username.length - 1]
    : username[0] + '*';
  return `${maskedUsername}@${domain}`;
}

function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length > 4) {
    return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
  }
  return '*'.repeat(cleaned.length);
}