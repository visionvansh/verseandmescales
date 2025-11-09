// src/app/api/badges/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import { checkAndAwardBadges } from '@/lib/profile/badges';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const newBadges = await checkAndAwardBadges(user.id);

    return NextResponse.json({
      success: true,
      newBadges: newBadges.filter(b => b.isNew)
    });

  } catch (error) {
    console.error('Badge check error:', error);
    return NextResponse.json(
      { error: 'Failed to check badges' },
      { status: 500 }
    );
  }
}