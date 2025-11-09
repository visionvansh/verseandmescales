// app/api/auth/check-reset-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma'; // ✅ Use singleton Prisma client

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json();

    if (!token || !email) {
      return NextResponse.json(
        { valid: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Hash the token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // ✅ Find valid password reset record using singleton Prisma
    const passwordReset = await prisma.passwordReset.findFirst({
      where: {
        token: hashedToken,
        email: email.toLowerCase(),
        expiresAt: {
          gt: new Date()
        },
        used: false
      }
    });

    if (!passwordReset) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired password reset token' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.student.findFirst({
      where: {
        email: email.toLowerCase(),
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired password reset token' },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Check reset token error:', error);
    return NextResponse.json(
      { valid: false, error: 'An error occurred while checking reset token' },
      { status: 500 }
    );
  }
}