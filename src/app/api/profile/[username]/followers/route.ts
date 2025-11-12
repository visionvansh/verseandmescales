// app/api/profile/[username]/followers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { getAvatarUrlFromUser } from '@/utils/avatarGenerator';

// ============================================
// TYPE DEFINITIONS
// ============================================

type UserGoal = {
  purpose: string;
};

type Avatar = {
  id: string;
  avatarIndex: number;
  avatarSeed: string;
  avatarStyle: string;
  isPrimary: boolean;
  isCustomUpload: boolean;
  customImageUrl: string | null;
};

type Badge = {
  id: string;
  title: string;
  icon: string;
  color: string;
};

type UserXP = {
  totalXP: number;
  contributorTitle: string;
};

type FollowerUser = {
  id: string;
  username: string;
  name: string | null;
  surname: string | null;
  img: string | null;
  createdAt: Date;
  userXP: UserXP | null;
  badges: Badge[];
  avatars: Avatar[];
  UserGoals: UserGoal[];
  _count: {
    followers: number;
    following: number;
    courses: number;
  };
};

type FollowWithUser = {
  follower: FollowerUser;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const currentUser = await getAuthUser(request);
    const { username } = await params;

    const targetUser = await prisma.student.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const followers: FollowWithUser[] = await prisma.follow.findMany({
      where: {
        followingId: targetUser.id,
        isAccepted: true
      },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            name: true,
            surname: true,
            img: true,
            createdAt: true,
            userXP: {
              select: {
                totalXP: true,
                contributorTitle: true
              }
            },
            badges: {
              where: { isEarned: true, isDisplayed: true },
              orderBy: { displayOrder: 'asc' },
              take: 3,
              select: {
                id: true,
                title: true,
                icon: true,
                color: true
              }
            },
            avatars: {
              where: { isPrimary: true },
              take: 1,
              select: {
                id: true,
                avatarIndex: true,
                avatarSeed: true,
                avatarStyle: true,
                isPrimary: true,
                isCustomUpload: true,
                customImageUrl: true
              }
            },
            UserGoals: {
              select: { purpose: true },
              take: 1
            },
            _count: {
              select: {
                followers: true,
                following: true,
                courses: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedUsers = followers.map((follow: FollowWithUser) => {
      const user = follow.follower;
      const userGoal = user.UserGoals[0];
      let userType: 'tutor' | 'learner' | 'both' = 'learner';
      
      if (userGoal) {
        if (userGoal.purpose === 'teach') userType = 'tutor';
        else if (userGoal.purpose === 'both') userType = 'both';
      }

      const avatarUrl = getAvatarUrlFromUser(user, 64);
      const primaryAvatar = user.avatars[0];

      return {
        id: user.id,
        username: user.username,
        name: user.name || 'User',
        surname: user.surname,
        avatar: avatarUrl,
        avatarObject: primaryAvatar || null,
        img: avatarUrl,
        type: userType,
        xp: user.userXP?.totalXP || 0,
        seekers: user._count.followers,
        seeking: user._count.following,
        coursesMade: user._count.courses,
        coursesLearning: 0,
        badges: user.badges.map((badge: Badge) => ({
          id: badge.id,
          name: badge.title,
          icon: badge.icon,
          color: badge.color,
          description: '',
          requirement: '',
          rarity: 'common' as const
        })),
        bio: '',
        dateJoined: user.createdAt.toISOString(),
        isPrivate: false
      };
    });

    return NextResponse.json({
      users: formattedUsers,
      total: formattedUsers.length
    });

  } catch (error) {
    console.error('Get followers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch followers' },
      { status: 500 }
    );
  }
}