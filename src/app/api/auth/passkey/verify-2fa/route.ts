// app/api/auth/passkey/verify-2fa/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyPasskeyAuthentication } from '@/utils/passkeys';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, response: passkeyResponse } = body;
    
    if (!sessionId || !passkeyResponse) {
      return NextResponse.json(
        { error: 'Session ID and passkey response are required' },
        { status: 400 }
      );
    }
    
    // Get 2FA session
    const session = await prisma.twoFactorSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        revokedAt: true,
        metadata: true,
      }
    });
    
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 400 }
      );
    }
    
    if (session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 400 }
      );
    }
    
    if (session.revokedAt) {
      return NextResponse.json(
        { error: 'Session has been revoked' },
        { status: 400 }
      );
    }
    
    // Check if already verified (stored in metadata)
    const metadata = session.metadata as any;
    if (metadata?.verified === true) {
      return NextResponse.json(
        { error: 'Session already verified' },
        { status: 400 }
      );
    }
    
    // Verify the passkey
    const isValid = await verifyPasskeyAuthentication(session.userId, passkeyResponse);
    
    if (!isValid) {
      // Log failed attempt
      await prisma.userActivityLog.create({
        data: {
          userId: session.userId,
          action: 'passkey_verification_failed',
          description: 'Failed passkey verification during 2FA',
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1',
          userAgent: request.headers.get('user-agent') || '',
        }
      });
      
      return NextResponse.json(
        { error: 'Passkey verification failed' },
        { status: 400 }
      );
    }
    
    // Mark session as verified using metadata
    await prisma.twoFactorSession.update({
      where: { id: sessionId },
      data: { 
        metadata: {
          ...(metadata || {}),
          verified: true,
          verifiedAt: new Date().toISOString(),
          verificationMethod: 'passkey'
        },
        lastUsedAt: new Date()
      }
    });
    
    // Log successful verification
    await prisma.userActivityLog.create({
      data: {
        userId: session.userId,
        action: 'passkey_2fa_verified',
        description: 'Successfully verified 2FA using passkey',
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || '',
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Passkey verified successfully'
    });
    
  } catch (error) {
    console.error('Passkey 2FA verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify passkey' },
      { status: 500 }
    );
  }
}