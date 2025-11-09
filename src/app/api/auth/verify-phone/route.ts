import { NextRequest, NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';
import { validatePhone } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Phone number and verification code are required' },
        { status: 400 }
      );
    }

    if (!validatePhone(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Verification code must be 6 digits' },
        { status: 400 }
      );
    }

    // Find the verification record
    const verification = await prisma.phoneVerification.findFirst({
      where: {
        phone,
        code,
        verified: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!verification) {
      // Check if there's any verification record for this phone
      const anyVerification = await prisma.phoneVerification.findFirst({
        where: { phone },
        orderBy: { createdAt: 'desc' }
      });

      if (anyVerification) {
        // Increment attempts
        await prisma.phoneVerification.update({
          where: { id: anyVerification.id },
          data: { attempts: { increment: 1 } }
        });

        if (anyVerification.expiresAt < new Date()) {
          return NextResponse.json(
            { error: 'Verification code has expired. Please request a new one.' },
            { status: 410 }
          );
        } else if (anyVerification.attempts >= 2) { // Max 3 attempts (0, 1, 2)
          await prisma.phoneVerification.update({
            where: { id: anyVerification.id },
            data: { expiresAt: new Date() } // Expire the code
          });
          
          return NextResponse.json(
            { error: 'Too many incorrect attempts. Please request a new verification code.' },
            { status: 429 }
          );
        } else {
          return NextResponse.json(
            { error: 'Invalid verification code. Please check and try again.' },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'No verification code found. Please request a new one.' },
          { status: 404 }
        );
      }
    }

    // Check attempts limit
    if (verification.attempts >= 2) {
      await prisma.phoneVerification.update({
        where: { id: verification.id },
        data: { expiresAt: new Date() } // Expire the code
      });

      return NextResponse.json(
        { error: 'Too many incorrect attempts. Please request a new verification code.' },
        { status: 429 }
      );
    }

    // Mark as verified
    await prisma.phoneVerification.update({
      where: { id: verification.id },
      data: {
        verified: true,
        attempts: verification.attempts + 1
      }
    });

    // Update user's phone verification status if user exists
    const user = await prisma.student.findUnique({
      where: { phone },
      select: { id: true }
    });

    if (user) {
      await prisma.student.update({
        where: { id: user.id },
        data: { phoneVerified: true }
      });
    }

    return NextResponse.json({
      message: 'Phone number verified successfully',
      verified: true
    }, { status: 200 });

  } catch (error) {
    console.error('Phone verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}