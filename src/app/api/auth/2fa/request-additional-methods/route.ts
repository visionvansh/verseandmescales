// app/api/auth/2fa/backup-methods/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAvailable2FAMethods, getVerificationAttempts } from '@/utils/twoFactorAuth';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Verify session exists
    const session = await prisma.twoFactorSession.findUnique({
      where: { id: sessionId },
      select: { userId: true, expiresAt: true }
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 400 }
      );
    }

    // Check attempts
    const { attempts, shouldShowBackupMethods } = await getVerificationAttempts(sessionId);

    if (!shouldShowBackupMethods) {
      return NextResponse.json(
        { 
          available: false,
          message: 'Backup methods not yet available',
          attemptsRemaining: 3 - attempts
        },
        { status: 403 }
      );
    }

    // Get backup methods
    const methods = await getAvailable2FAMethods(session.userId, true);

    return NextResponse.json({
      available: true,
      backupMethods: methods.backup,
      allMethods: methods.all
    });
  } catch (error) {
    console.error('Error fetching backup methods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch backup methods' },
      { status: 500 }
    );
  }
}