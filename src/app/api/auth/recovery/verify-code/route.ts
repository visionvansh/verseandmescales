import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const MAX_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    const { email, code, method } = await request.json();

    if (!email || !code || !method) {
      return NextResponse.json(
        { error: 'Email, code, and method are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.student.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Check for too many failed attempts
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const recentFailedAttempts = await prisma.authLog.count({
      where: {
        userId: user.id,
        action: 'password_recovery_code_verification_failed',
        createdAt: {
          gte: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
        }
      }
    });

    if (recentFailedAttempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please request a new code.' },
        { status: 429 }
      );
    }

    // Find verification code
    const verificationCode = await prisma.twoFactorVerificationCode.findFirst({
      where: {
        userId: user.id,
        method: `recovery_${method}`,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!verificationCode) {
      await prisma.authLog.create({
        data: {
          userId: user.id,
          email: user.email,
          action: 'password_recovery_code_verification_failed',
          ipAddress,
          userAgent: request.headers.get('user-agent') || '',
          success: false,
          errorCode: 'CODE_NOT_FOUND'
        }
      });

      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // Verify code
    const isValid = await bcrypt.compare(code.trim(), verificationCode.code);

    if (!isValid) {
      await prisma.authLog.create({
        data: {
          userId: user.id,
          email: user.email,
          action: 'password_recovery_code_verification_failed',
          ipAddress,
          userAgent: request.headers.get('user-agent') || '',
          success: false,
          errorCode: 'INVALID_CODE'
        }
      });

      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Mark code as used
    await prisma.twoFactorVerificationCode.update({
      where: { id: verificationCode.id },
      data: { used: true }
    });

    // Generate recovery token
    const recoveryToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(recoveryToken, 10);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Store recovery token
    await prisma.passwordReset.create({
      data: {
        email: user.email,
        token: tokenHash,
        expiresAt,
        ipAddress,
        userAgent: request.headers.get('user-agent') || ''
      }
    });

    // Log success
    await prisma.authLog.create({
      data: {
        userId: user.id,
        email: user.email,
        action: 'password_recovery_code_verified',
        ipAddress,
        userAgent: request.headers.get('user-agent') || '',
        success: true
      }
    });

    return NextResponse.json({
      success: true,
      token: recoveryToken
    });

  } catch (error) {
    console.error('Verify recovery code error:', error);
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}