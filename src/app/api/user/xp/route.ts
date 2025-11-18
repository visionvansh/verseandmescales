//Volumes/vision/codes/course/my-app/src/app/api/user/xp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user XP data
    const userXP = await prisma.userXP.findUnique({
      where: {
        userId: user.id,
      },
      select: {
        totalXP: true,
        currentLevel: true,
        xpFromPosts: true,
        xpFromComments: true,
        xpFromCourses: true,
        xpFromEngagement: true,
      },
    });

    if (!userXP) {
      return NextResponse.json({
        totalXP: 0,
        currentLevel: 0,
        xpFromPosts: 0,
        xpFromComments: 0,
        xpFromCourses: 0,
        xpFromEngagement: 0,
      });
    }

    return NextResponse.json(userXP);
  } catch (error) {
    console.error('Error fetching user XP:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user XP' },
      { status: 500 }
    );
  }
}