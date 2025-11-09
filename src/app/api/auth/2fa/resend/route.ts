// app/api/auth/2fa/resend/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendEmailVerificationCode, sendSMSVerificationCode } from '@/utils/twoFactorAuth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, method } = body;
    
    if (!sessionId || !method) {
      return NextResponse.json(
        { error: 'Session ID and method are required' },
        { status: 400 }
      );
    }
    
    // Get the 2FA session
    const session = await prisma.twoFactorSession.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            emailVerified: true,
            phoneVerified: true,
          },
        },
      },
    });
    
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 400 }
      );
    }
    
    // Check if session is expired
    if (session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 400 }
      );
    }
    
    // Resend the code based on the requested method
    if (method === 'email') {
      if (!session.user.email || !session.user.emailVerified) {
        return NextResponse.json(
          { error: 'Email not available or not verified' },
          { status: 400 }
        );
      }
      
      await sendEmailVerificationCode(session.userId, session.user.email);
    } else if (method === 'sms') {
      if (!session.user.phone || !session.user.phoneVerified) {
        return NextResponse.json(
          { error: 'Phone number not available or not verified' },
          { status: 400 }
        );
      }
      
      await sendSMSVerificationCode(session.userId, session.user.phone);
    } else {
      return NextResponse.json(
        { error: 'Invalid verification method' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      message: `Verification code sent via ${method}`,
    });
  } catch (error) {
    console.error('2FA code resend error:', error);
    return NextResponse.json(
      { error: 'An error occurred while resending the verification code' },
      { status: 500 }
    );
  }
}