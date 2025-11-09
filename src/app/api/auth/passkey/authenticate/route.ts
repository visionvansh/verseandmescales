// app/api/auth/passkey/authenticate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generatePasskeyAuthenticationOptions } from '@/utils/passkeys';
import prisma from '@/lib/prisma';

// Generate authentication options
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, sessionId } = body;
    
    let userId: string | undefined;
    
    // Support both direct email login and 2FA session flow
    if (sessionId) {
      // 2FA flow - get user from session
      const session = await prisma.twoFactorSession.findUnique({
        where: { id: sessionId },
        select: { userId: true }
      });
      
      if (!session) {
        return NextResponse.json(
          { error: 'Invalid session' },
          { status: 400 }
        );
      }
      
      userId = session.userId;
    } else if (email) {
      // Direct login flow - get user from email
      const user = await prisma.student.findUnique({
        where: { email: email.toLowerCase() },
        select: { id: true }
      });
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 400 }
        );
      }
      
      userId = user.id;
    } else {
      return NextResponse.json(
        { error: 'Email or sessionId is required' },
        { status: 400 }
      );
    }
    
    // Check if user has passkey enabled
    const user = await prisma.student.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        biometricEnabled: true,
        biometricCredentials: {
          select: { id: true }
        }
      }
    });
    
    if (!user || !user.biometricEnabled || user.biometricCredentials.length === 0) {
      return NextResponse.json(
        { error: 'Passkey not available for this account' },
        { status: 400 }
      );
    }
    
    // Generate WebAuthn options
    const options = await generatePasskeyAuthenticationOptions(user.id);
    
    return NextResponse.json(options);
  } catch (error) {
    console.error('Passkey authentication options error:', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication options' },
      { status: 500 }
    );
  }
}