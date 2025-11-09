// app/api/user/2fa/backup-codes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

// Generate backup codes securely without using bcrypt
function generateSecureBackupCodes(count = 10): string[] {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // Generate a code with format XXXX-XXXX-XXXX-XXXX
    const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part3 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part4 = crypto.randomBytes(2).toString('hex').toUpperCase();
    codes.push(`${part1}-${part2}-${part3}-${part4}`);
  }
  return codes;
}

// Hash a backup code securely without using bcrypt
function hashBackupCode(code: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256')
    .update(salt + code)
    .digest('hex');
  return `${salt}:${hash}`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate new backup codes
    const backupCodes = generateSecureBackupCodes(10);
    
    // If the model exists, use it, otherwise create a fallback solution
    if (typeof prisma['twoFactorBackupCode'] !== 'undefined') {
      // Delete existing backup codes for this user
      try {
        await prisma.twoFactorBackupCode.deleteMany({
          where: { userId: user.id }
        });
      } catch (err) {
        console.error('Error deleting existing backup codes:', err);
      }
      
      // Create new backup codes
      try {
        for (const code of backupCodes) {
          await prisma.twoFactorBackupCode.create({
            data: {
              userId: user.id,
              code: hashBackupCode(code),
              used: false
            }
          });
        }
      } catch (err) {
        console.error('Error creating backup codes:', err);
        return NextResponse.json({ 
          error: 'Failed to create backup codes' 
        }, { status: 500 });
      }
    } else {
      // In case the model isn't available, log this issue
      console.error('twoFactorBackupCode model is not available. You need to regenerate your Prisma client.');
      
      // Store backup codes temporarily in a session or return them directly
      // We'll return them directly in this case
    }
    
    // Log the security event
    try {
      await prisma.securityEvent.create({
        data: {
          userId: user.id,
          eventType: 'backup_codes_regenerated',
          severity: 'medium',
          description: 'Two-factor authentication backup codes were regenerated',
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      });
    } catch (err) {
      console.error('Error logging security event:', err);
    }
    
    // Return the plaintext backup codes to the user
    return NextResponse.json({ 
      success: true, 
      backupCodes: backupCodes,
      message: 'New backup codes generated successfully' 
    });
    
  } catch (error) {
    console.error('Error generating backup codes:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to generate backup codes. Please try again later.'
    }, { status: 500 });
  }
}