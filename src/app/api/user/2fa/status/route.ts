// app/api/user/2fa/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import { findUserById, countUnusedBackupCodes } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch full user with preferences
    const fullUser = await findUserById(user.id);

    if (!fullUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get backup codes count
    const backupCodesCount = await countUnusedBackupCodes(user.id);
    
    // Check if recovery options are configured
    const recoveryOptionsConfigured = !! (fullUser.recoveryEmail || fullUser.recoveryPhone);
    
    // Determine primary method
    let primaryMethod = null;
    let enabled = false;
    
    if (user.twoFactorEnabled) {
      enabled = true;
      
      if (fullUser.preferences?.twoFactorPreference) {
        primaryMethod = fullUser.preferences.twoFactorPreference;
      } else {
        // Default to app if not specified
        primaryMethod = 'app';
      }
    }
    
    return NextResponse.json({
      enabled,
      primaryMethod,
      backupCodesCount,
      backupCodesEnabled: backupCodesCount > 0,
      recoveryOptionsConfigured
    });
  } catch (error) {
    console.error('Error fetching 2FA status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}