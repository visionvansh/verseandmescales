// app/api/profile/[username]/following/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { getAvatarUrlFromUser } from '@/utils/avatarGenerator'; // ✅ Import helper

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> } // ✅ Changed to Promise
) {
  try {
    const currentUser = await getAuthUser(request);
    
    // ✅ Await params first, then destructure
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

    const following = await prisma.follow.findMany({
      where: {
        followerId: targetUser.id,
        isAccepted: true
      },
      include: {
        following: {
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

    const formattedUsers = following.map(follow => {
      const user = follow.following;
      const userGoal = user.UserGoals[0];
      let userType: 'tutor' | 'learner' | 'both' = 'learner';
      
      if (userGoal) {
        if (userGoal.purpose === 'teach') userType = 'tutor';
        else if (userGoal.purpose === 'both') userType = 'both';
      }

      // ✅ USE HELPER FUNCTION WITH CUSTOM COLORS
      const avatarUrl = getAvatarUrlFromUser(user, 64);
      const primaryAvatar = user.avatars[0];

      return {
        id: user.id,
        username: user.username,
        name: user.name || 'User',
        surname: user.surname,
        avatar: avatarUrl, // ✅ NOW WITH RED/WHITE/BLACK THEME
        avatarObject: primaryAvatar || null,
        img: avatarUrl,
        type: userType,
        xp: user.userXP?.totalXP || 0,
        seekers: user._count.followers,
        seeking: user._count.following,
        coursesMade: user._count.courses,
        coursesLearning: 0,
        badges: user.badges.map(badge => ({
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
    console.error('Get following error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch following' },
      { status: 500 }
    );
  }
}