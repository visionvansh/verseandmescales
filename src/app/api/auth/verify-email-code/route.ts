import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ 
        error: 'Email and verification code are required' 
      }, { status: 400 });
    }

    const emailLower = email.toLowerCase();
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    // Find verification record
    const verification = await prisma.emailVerification.findFirst({
      where: {
        email: emailLower,
        token: hashedCode,
        verified: false
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!verification) {
      return NextResponse.json({ 
        error: 'Invalid verification code' 
      }, { status: 400 });
    }

    // Check if expired
    if (new Date() > verification.expiresAt) {
      await prisma.emailVerification.delete({
        where: { id: verification.id }
      });
      return NextResponse.json({ 
        error: 'Verification code has expired' 
      }, { status: 400 });
    }

    // Mark as verified
    await prisma.emailVerification.update({
      where: { id: verification.id },
      data: { 
        verified: true,
        clickCount: { increment: 1 }
      }
    });

    return NextResponse.json({ 
      message: 'Email verified successfully',
      verified: true
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({ 
      error: 'Failed to verify email' 
    }, { status: 500 });
  }
}