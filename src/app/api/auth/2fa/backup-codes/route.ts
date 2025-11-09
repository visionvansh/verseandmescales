//api/auth/2fa/backup-codes
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthUser } from '@/utils/auth';
import { generateBackupCodes } from '@/utils/twoFactorAuth';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Get existing backup codes status
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if 2FA is enabled
    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { error: 'Two-factor authentication is not enabled' },
        { status: 400 }
      );
    }
    
    // Count backup codes
    const unusedCodes = await prisma.twoFactorBackupCode.count({
      where: { 
        userId: user.id,
        used: false,
      },
    });
    
    const usedCodes = await prisma.twoFactorBackupCode.count({
      where: {
        userId: user.id,
        used: true,
      },
    });
    
    return NextResponse.json({
      unusedCodes,
      usedCodes,
    });
  } catch (error) {
    console.error('Backup codes status error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching backup codes status' },
      { status: 500 }
    );
  }
}

// Generate new backup codes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;
    
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }
    
    // Authenticate user
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verify password
    const isValidPassword = user.password ? await bcrypt.compare(password, user.password) : false;
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }
    
    // Check if 2FA is enabled
    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { error: 'Two-factor authentication is not enabled' },
        { status: 400 }
      );
    }
    
    // Generate new backup codes
    const backupCodes = await generateBackupCodes(user.id);
    
    // Log the action
    await prisma.userActivityLog.create({
      data: {
        userId: user.id,
        action: '2fa_backup_codes_regenerated',
        description: 'Two-factor authentication backup codes regenerated',
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || '',
      },
    });
    
    return NextResponse.json({
      message: 'Backup codes regenerated successfully',
      backupCodes,
    });
  } catch (error) {
    console.error('Backup codes regeneration error:', error);
    return NextResponse.json(
      { error: 'An error occurred while regenerating backup codes' },
      { status: 500 }
    );
  }
}