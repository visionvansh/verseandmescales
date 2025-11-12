// app/api/user/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';

// Type definitions
interface UserGoals {
  id: string;
  userId: string;
  purpose: string;
  monthlyGoal: string;
  timeCommitment: string;
  completedAt: Date;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface UserPreferences {
  id: string;
  userId: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  twoFactorPreference: string;
  sessionTimeout: number;
  requirePasswordChange: boolean;
  profileVisibility: string;
  showOnlineStatus: boolean;
  allowDirectMessages: boolean;
  theme: string;
  language: string;
  currency: string;
  timezone: string | null;
  emailFrequency: string;
  createdAt: Date;
  updatedAt: Date;
}

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
      }) as Promise<UserGoals | null>,
      prisma.userPreferences.findUnique({
        where: { userId: user.id }
      }) as Promise<UserPreferences | null>
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
    }) as UserPreferences;

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

async function broadcastPreferencesUpdate(userId: string, preferences: UserPreferences): Promise<void> {
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