import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { sendCheckoutVerificationEmail } from '@/utils/email';

export async function POST(request: NextRequest) {
  try {
    const { email, courseId } = await request.json();

    if (!email || !courseId) {
      return NextResponse.json(
        { error: 'Email and course ID required' },
        { status: 400 }
      );
    }

    // Check if user exists with password
    const existingUser = await prisma.student.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, password: true }
    });

    if (existingUser && existingUser.password) {
      return NextResponse.json(
        { error: 'Account exists. Please log in instead.' },
        { status: 400 }
      );
    }

    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    // Store code (expires in 10 minutes)
    await prisma.emailVerification.upsert({
      where: { email: email.toLowerCase() },
      create: {
        email: email.toLowerCase(),
        token: hashedCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
      update: {
        token: hashedCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        verified: false,
      },
    });

    // Send email with new function
    await sendCheckoutVerificationEmail(email, code);

    console.log('✅ Checkout verification code sent to:', email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Send code error:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}