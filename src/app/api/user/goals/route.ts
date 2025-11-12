//Volumes/vision/codes/course/my-app/src/app/api/user/goals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';

// Type definitions
interface UserGoals {
  id: string;
  purpose: string;
  monthlyGoal: string;
  timeCommitment: string;
  completedAt: Date;
  lastUpdated: Date;
}

interface GoalsRequestBody {
  purpose: string;
  monthlyGoal: string;
  timeCommitment: string;
}

// Broadcast function (placeholder - implement WebSocket logic)
async function broadcastGoalsUpdate(userId: string, goals: UserGoals): Promise<void> {
  // TODO: Implement WebSocket broadcast
  console.log('Broadcasting goals update for user:', userId);
}

// GET - Fetch user goals
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
      where: { userId: user.id },
      select: {
        id: true,
        purpose: true,
        monthlyGoal: true,
        timeCommitment: true,
        completedAt: true,
        lastUpdated: true,
      }
    }) as UserGoals | null;

    if (!goals) {
      return NextResponse.json(
        { completed: false, goals: null },
        { status: 200 }
      );
    }

    return NextResponse.json({
      completed: true,
      goals
    });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

// POST - Create user goals
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: GoalsRequestBody = await request.json();
    const { purpose, monthlyGoal, timeCommitment } = body;

    // Validate required fields
    if (!purpose || !monthlyGoal || !timeCommitment) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if goals already exist
    const existingGoals = await prisma.userGoals.findUnique({
      where: { userId: user.id }
    });

    let goals: UserGoals;

    if (existingGoals) {
      // Update existing goals
      goals = await prisma.userGoals.update({
        where: { userId: user.id },
        data: {
          purpose,
          monthlyGoal,
          timeCommitment,
          lastUpdated: new Date(),
        }
      }) as UserGoals;
    } else {
      // Create new goals
      goals = await prisma.userGoals.create({
        data: {
          userId: user.id,
          purpose,
          monthlyGoal,
          timeCommitment,
        }
      }) as UserGoals;
    }

    // Broadcast update via WebSocket
    await broadcastGoalsUpdate(user.id, goals);

    return NextResponse.json({
      success: true,
      goals,
      message: existingGoals ? 'Goals updated' : 'Goals created'
    });
  } catch (error) {
    console.error('Error saving goals:', error);
    return NextResponse.json(
      { error: 'Failed to save goals' },
      { status: 500 }
    );
  }
}

// PATCH - Update specific goal fields
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: Partial<GoalsRequestBody> = await request.json();

    // Check if goals exist
    const existingGoals = await prisma.userGoals.findUnique({
      where: { userId: user.id }
    });

    if (!existingGoals) {
      return NextResponse.json(
        { error: 'Goals not found. Please create goals first.' },
        { status: 404 }
      );
    }

    // Update only provided fields
    const goals = await prisma.userGoals.update({
      where: { userId: user.id },
      data: {
        ...body,
        lastUpdated: new Date(),
      }
    }) as UserGoals;

    // Broadcast update
    await broadcastGoalsUpdate(user.id, goals);

    return NextResponse.json({
      success: true,
      goals,
      message: 'Goals updated successfully'
    });
  } catch (error) {
    console.error('Error updating goals:', error);
    return NextResponse.json(
      { error: 'Failed to update goals' },
      { status: 500 }
    );
  }
}