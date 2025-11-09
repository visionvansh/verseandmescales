import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';

// GET - Fetch all user preferences
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const [goals, preferences] = await Promise.all([
      prisma.userGoals.findUnique({
        where: { userId: user.id }
      }),
      prisma.userPreferences.findUnique({
        where: { userId: user.id }
      })
    ]);

    return NextResponse.json({
      hasCompletedOnboarding: !!goals,
      goals,
      preferences
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

// POST - Create initial preferences
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

    const preferences = await prisma.userPreferences.upsert({
      where: { userId: user.id },
      update: body,
      create: {
        userId: user.id,
        ...body
      }
    });

    // Broadcast update
    await broadcastPreferencesUpdate(user.id, preferences);

    return NextResponse.json({
      success: true,
      preferences
    });
  } catch (error) {
    console.error('Error saving preferences:', error);
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    );
  }
}

async function broadcastPreferencesUpdate(userId: string, preferences: any) {
  try {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('ws-event', {
        detail: {
          event: 'preferences:updated',
          data: { userId, preferences }
        }
      });
      window.dispatchEvent(event);
    }
  } catch (error) {
    console.error('Failed to broadcast preferences update:', error);
  }
}