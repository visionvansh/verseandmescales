import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Find valid password reset token
    const passwordResets = await prisma.passwordReset.findMany({
      where: {
        used: false,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    let validReset = null;
    for (const reset of passwordResets) {
      const isValid = await bcrypt.compare(token, reset.token);
      if (isValid) {
        validReset = reset;
        break;
      }
    }

    if (!validReset) {
      return NextResponse.json(
        { error: 'Invalid or expired recovery token' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.student.findUnique({
      where: { email: validReset.email },
      select: { id: true, email: true, password: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if new password is same as old
    if (user.password) {
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return NextResponse.json(
          { error: 'New password must be different from current password' },
          { status: 400 }
        );
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.student.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
        loginAttempts: 0,
        lockedUntil: null
      }
    });

    // Mark token as used
    await prisma.passwordReset.update({
      where: { id: validReset.id },
      data: { 
        used: true,
        attempts: validReset.attempts + 1
      }
    });

    // Invalidate all sessions
    await prisma.userSession.updateMany({
      where: { userId: user.id },
      data: { isActive: false }
    });

    // Log password reset
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    await prisma.authLog.create({
      data: {
        userId: user.id,
        email: user.email,
        action: 'password_reset_success',
        ipAddress,
        userAgent: request.headers.get('user-agent') || '',
        success: true
      }
    });

    // Send notification email (optional)
    // await sendPasswordChangedEmail(user.email);

    return NextResponse.json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}