import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';

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
    });

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

    const body = await request.json();
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

    let goals;

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
      });
    } else {
      // Create new goals
      goals = await prisma.userGoals.create({
        data: {
          userId: user.id,
          purpose,
          monthlyGoal,
          timeCommitment,
        }
      });
    }

    // Broadcast update via WebSocket (we'll implement this)
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

    const body = await request.json();
    const updates: any = {};

    // Only update provided fields
    if (body.purpose) updates.purpose = body.purpose;
    if (body.monthlyGoal) updates.monthlyGoal = body.monthlyGoal;
    if (body.timeCommitment) updates.timeCommitment = body.timeCommitment;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.lastUpdated = new Date();

    const goals = await prisma.userGoals.update({
      where: { userId: user.id },
      data: updates
    });

    // Broadcast update via WebSocket
    await broadcastGoalsUpdate(user.id, goals);

    return NextResponse.json({
      success: true,
      goals
    });
  } catch (error) {
    console.error('Error updating goals:', error);
    return NextResponse.json(
      { error: 'Failed to update goals' },
      { status: 500 }
    );
  }
}

// Helper function to broadcast WebSocket updates
async function broadcastGoalsUpdate(userId: string, goals: any) {
  try {
    // Emit custom event that WebSocket will pick up
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('ws-event', {
        detail: {
          event: 'goals:updated',
          data: {
            userId,
            goals: {
              purpose: goals.purpose,
              monthlyGoal: goals.monthlyGoal,
              timeCommitment: goals.timeCommitment,
              lastUpdated: goals.lastUpdated,
            }
          }
        }
      });
      window.dispatchEvent(event);
    }
  } catch (error) {
    console.error('Failed to broadcast goals update:', error);
  }
}