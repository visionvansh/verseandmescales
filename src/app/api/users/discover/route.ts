// app/api/users/discover/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { getAvatarUrlFromUser } from '@/utils/avatarGenerator'; // ✅ ADD IMPORT

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getAuthUser(request);
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');

    let whereClause: any = {};

    // Search filter
    if (search) {
      whereClause.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filter by user type
    if (filter !== 'all') {
      whereClause.UserGoals = {
        some: {
          purpose: filter === 'tutors' ? 'teach' : 'learn'
        }
      };
    }

    // Exclude current user
    if (currentUser) {
      whereClause.NOT = { id: currentUser.id };
    }

    const users = await prisma.student.findMany({
      where: whereClause,
      take: limit,
      orderBy: [
        { userXP: { totalXP: 'desc' } },
        { createdAt: 'desc' }
      ],
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
          take: 1,
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
    });

    const formattedUsers = users.map(user => {
      const userGoal = user.UserGoals[0];
      let userType: 'tutor' | 'learner' | 'both' = 'learner';
      
      if (userGoal) {
        if (userGoal.purpose === 'teach') userType = 'tutor';
        else if (userGoal.purpose === 'both') userType = 'both';
      }

      // ✅ USE HELPER FUNCTION WITH RED/WHITE/BLACK THEME
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
          color: badge.color
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
    console.error('Discover users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
