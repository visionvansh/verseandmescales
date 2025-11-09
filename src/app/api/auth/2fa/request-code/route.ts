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
    
    // Send verification code based on method
    if (method === 'email' && session.user.email) {
      await sendEmailVerificationCode(session.user.id, session.user.email);
      return NextResponse.json({ success: true, method: 'email' });
    }
    
    if (method === 'sms' && session.user.phone) {
      await sendSMSVerificationCode(session.user.id, session.user.phone);
      return NextResponse.json({ success: true, method: 'sms' });
    }
    
    if (method === '2fa') {
      // For authenticator app, no need to send code
      return NextResponse.json({ success: true, method: '2fa' });
    }
    
    return NextResponse.json(
      { error: `Verification method ${method} not supported or user data missing` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error requesting 2FA code:', error);
    return NextResponse.json(
      { error: 'An error occurred while requesting verification code' },
      { status: 500 }
    );
  }
}