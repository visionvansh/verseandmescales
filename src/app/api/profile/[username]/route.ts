// app/api/profile/[username]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { checkAndAwardBadges } from '@/lib/profile/badges';
import { getAvatarUrlFromUser } from '@/utils/avatarGenerator'; // ✅ ADD IMPORT

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const currentUser = await getAuthUser(request);
    const { username } = await params;

    if (currentUser) {
      await checkAndAwardBadges(currentUser.id);
    }

    // Get user profile
    const user = await prisma.student.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        username: true,
        name: true,
        surname: true,
        img: true,
        createdAt: true,
        lastActiveAt: true,
        isOnline: true,
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
        profileSettings: {
          select: {
            isPublic: true,
            coverImage: true,
            showEmail: true,
            showPhone: true,
            showLocation: true,
            showWebsite: true,
            showXP: true,
            showBadges: true,
            bio: true,
            country: true,
            location: true,
            website: true
          }
        },
        userXP: {
          select: {
            totalXP: true,
            currentLevel: true,
            contributorTitle: true,
            xpFromPosts: true,
            xpFromComments: true,
            xpFromCourses: true
          }
        },
        badges: {
          where: { 
            isEarned: true,
            isDisplayed: true 
          },
          select: {
            id: true,
            badgeType: true,
            category: true,
            title: true,
            description: true,
            icon: true,
            color: true,
            requirement: true,
            displayOrder: true,
            earnedAt: true
          },
          orderBy: { displayOrder: 'asc' },
          take: 10
        },
        UserGoals: {
          select: {
            purpose: true
          },
          take: 1
        },
        _count: {
          select: {
            followers: true,
            following: true,
            courses: { where: { isPublished: true } },
            posts: { where: { isDeleted: false } }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isOwnProfile = currentUser?.id === user.id;

    let isFollowing = false;
    if (currentUser && !isOwnProfile) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: user.id
          }
        }
      });
      isFollowing = !!follow;
    }

    const userGoal = user.UserGoals[0];
    let userType: 'tutor' | 'learner' | 'both' = 'learner';
    
    if (userGoal) {
      if (userGoal.purpose === 'teach') userType = 'tutor';
      else if (userGoal.purpose === 'both') userType = 'both';
      else if (userGoal.purpose === 'learn') userType = 'learner';
    }

    let isPrivate = false;
    
    if (!isOwnProfile) {
      if (userType === 'tutor' || userType === 'both') {
        isPrivate = false;
      } else if (userType === 'learner') {
        isPrivate = !user.profileSettings?.isPublic;
      }
    }

    const coursesLearning = await prisma.lessonProgress.groupBy({
      by: ['courseId'],
      where: { userId: user.id }
    });

    // ✅ USE HELPER FUNCTION WITH RED/WHITE/BLACK THEME
    const avatarUrl = getAvatarUrlFromUser(user, 64);
    const primaryAvatar = user.avatars[0];

    const profile = {
      id: user.id,
      username: user.username,
      name: user.name || 'User',
      surname: user.surname,
      avatar: avatarUrl, // ✅ NOW WITH RED/WHITE/BLACK THEME
      avatarObject: primaryAvatar || null,
      type: userType,
      xp: user.userXP?.totalXP || 0,
      dateJoined: user.createdAt.toISOString(),
      
      seekers: user._count.followers,
      seeking: user._count.following,
      
      coursesMade: user._count.courses,
      postsCount: user._count.posts,
      coursesLearning: coursesLearning.length,
      
      badges: user.badges.map(badge => ({
        id: badge.id,
        name: badge.title,
        description: badge.description,
        icon: badge.icon,
        color: badge.color,
        requirement: badge.requirement,
        earnedAt: badge.earnedAt,
        rarity: badge.category === 'SPECIAL' ? 'legendary' : 
                badge.category === 'DUAL_ROLE' ? 'epic' : 
                badge.category === 'TUTOR' ? 'rare' : 'common'
      })),
      
      bio: user.profileSettings?.bio || '',
      country: user.profileSettings?.country || '',
      location: user.profileSettings?.location || '',
      website: user.profileSettings?.website || '',
      
      isPrivate,
      coverImage: user.profileSettings?.coverImage || undefined,
      isFollowing,
      isOwnProfile,
      userXP: user.userXP,
      profileSettings: user.profileSettings,
      isOnline: user.isOnline,
      lastActiveAt: user.lastActiveAt
    };

    return NextResponse.json({ profile });

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}