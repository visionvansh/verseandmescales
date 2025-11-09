//api/auth/2fa/setup
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthUser } from '@/utils/auth';
import { generateTOTPSecret, generateBackupCodes } from '@/utils/twoFactorAuth';

import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Generate TOTP secret
    const { secret, qrCode, tempSecretId } = await generateTOTPSecret(user.id);
    
    return NextResponse.json({
      message: 'Two-factor authentication setup initiated',
      secret,
      qrCode,
      tempSecretId,
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: 'An error occurred during 2FA setup' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, tempSecretId, password } = body;
    
    if (!code || !tempSecretId || !password) {
      return NextResponse.json(
        { error: 'Verification code, temporary secret ID, and password are required' },
        { status: 400 }
      );
    }
    
    // Authenticate user
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verify password
    const isValidPassword = user.password ? await bcrypt.compare(password, user.password) : false;
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }
    
    // Get temporary secret
    const tempSecret = await prisma.tempTwoFactorSecret.findUnique({
      where: { id: tempSecretId },
    });
    
    if (!tempSecret || tempSecret.userId !== user.id || tempSecret.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invalid or expired setup session' },
        { status: 400 }
      );
    }
    
    // Verify the code with the temporary secret
    const { verifyTOTP } = await import('@/utils/twoFactorAuth');
    const isValid = verifyTOTP(code, tempSecret.secret);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }
    
    // Generate backup codes
    const backupCodes = await generateBackupCodes(user.id);
    
    // Enable 2FA for the user
    await prisma.student.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: tempSecret.secret,
      },
    });
    
    // Delete the temporary secret
    await prisma.tempTwoFactorSecret.delete({
      where: { id: tempSecretId },
    });
    
    // Log the action
    await prisma.userActivityLog.create({
      data: {
        userId: user.id,
        action: '2fa_enabled',
        description: 'Two-factor authentication enabled',
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || '',
      },
    });
    
    return NextResponse.json({
      message: 'Two-factor authentication enabled successfully',
      backupCodes,
    });
  } catch (error) {
    console.error('2FA setup verification error:', error);
    return NextResponse.json(
      { error: 'An error occurred during 2FA setup verification' },
      { status: 500 }
    );
  }
}