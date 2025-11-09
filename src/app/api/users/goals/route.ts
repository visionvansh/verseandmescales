//Volumes/vision/codes/course/my-app/src/app/api/users/goals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const goalsSchema = z.object({
  purpose: z.enum(['learn', 'teach', 'both']),
  monthlyGoal: z.string(),
  timeCommitment: z.enum(['light', 'moderate', 'intensive'])
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = goalsSchema.parse(body);

    // Create or update user goals
    const goals = await prisma.userGoals.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        purpose: validatedData.purpose,
        monthlyGoal: validatedData.monthlyGoal,
        timeCommitment: validatedData.timeCommitment
      },
      update: {
        purpose: validatedData.purpose,
        monthlyGoal: validatedData.monthlyGoal,
        timeCommitment: validatedData.timeCommitment,
        lastUpdated: new Date()
      }
    });

    // ✅ IMPORTANT: Create ProfileSettings based on purpose
    const isPublic = ['teach', 'both'].includes(validatedData.purpose);
    
    await prisma.profileSettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        isPublic: isPublic,
        showEmail: false,
        showPhone: false,
        showLocation: true,
        showWebsite: true,
        showXP: true,
        showBadges: true,
        allowMessages: true,
        allowFollow: true,
        whoCanComment: 'everyone',
        whoCanSeePosts: isPublic ? 'everyone' : 'seekers',
        theme: 'dark',
        primaryColor: '#dc2626'
      },
      update: {
        isPublic: isPublic,
        whoCanSeePosts: isPublic ? 'everyone' : 'seekers'
      }
    });

    // ✅ Initialize UserXP if doesn't exist
    await prisma.userXP.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        totalXP: 0,
        currentLevel: 0,
        contributorTitle: 'Rising Contributor'
      },
      update: {}
    });

    // Broadcast update via WebSocket
    if (typeof window !== 'undefined' && (window as any).ws) {
      (window as any).ws.send(JSON.stringify({
        event: 'goals:update',
        data: { goals }
      }));
    }

    return NextResponse.json({ 
      success: true, 
      goals,
      isPublic 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }

    console.error('Update goals error:', error);
    return NextResponse.json(
      { error: 'Failed to update goals' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const goals = await prisma.userGoals.findUnique({
      where: { userId: user.id }
    });

    return NextResponse.json({ goals });

  } catch (error) {
    console.error('Get goals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}