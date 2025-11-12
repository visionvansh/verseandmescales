// app/api/user/goal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';

// Type definitions
type UserGoalPurpose = 'learn' | 'teach' | 'both';

interface UserGoalsData {
  purpose: UserGoalPurpose;
  monthlyGoal: string | null;
  timeCommitment: string | null;
  completedAt: Date;
  updatedAt: Date;
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

    // Fetch user goals
    const userGoals = await prisma.userGoals.findUnique({
      where: { userId: user.id },
      select: {
        purpose: true,
        monthlyGoal: true,
        timeCommitment: true,
        completedAt: true,
        updatedAt: true,
      }
    }) as UserGoalsData | null;

    // Return role based on purpose
    let role = 'Learner';
    if (userGoals?.purpose === 'teach') {
      role = 'Tutor';
    } else if (userGoals?.purpose === 'both') {
      role = 'Tutor & Learner';
    } else if (userGoals?.purpose === 'learn') {
      role = 'Learner';
    }

    return NextResponse.json({
      success: true,
      data: {
        purpose: userGoals?.purpose || 'learn',
        role: role,
        monthlyGoal: userGoals?.monthlyGoal,
        timeCommitment: userGoals?.timeCommitment,
        hasCompletedQuestionnaire: !!userGoals,
        updatedAt: userGoals?.updatedAt,
      }
    });

  } catch (error) {
    console.error('Error fetching user goals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}