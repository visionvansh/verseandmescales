// app/api/user/2fa/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import { findUserById, countUnusedBackupCodes } from '@/lib/prisma';

// Define types for Prisma query results
interface UserPreferences {
  twoFactorPreference: string | null;
}

interface FullUser {
  id: string;
  recoveryEmail: string | null;
  recoveryPhone: string | null;
  preferences: UserPreferences | null;
}

interface AuthUser {
  id: string;
  twoFactorEnabled: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch full user with preferences
    const fullUser = await findUserById(user.id) as FullUser | null;

    if (!fullUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get backup codes count
    const backupCodesCount = await countUnusedBackupCodes(user.id);
    
    // Check if recovery options are configured
    const recoveryOptionsConfigured = !!(fullUser.recoveryEmail || fullUser.recoveryPhone);
    
    // Determine primary method
    let primaryMethod: string | null = null;
    let enabled = false;
    
    const typedUser = user as AuthUser;
    
    if (typedUser.twoFactorEnabled) {
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