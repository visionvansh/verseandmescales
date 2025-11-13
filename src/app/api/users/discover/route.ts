// app/api/users/discover/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { getAvatarUrlFromUser } from '@/utils/avatarGenerator';
import { redis, CACHE_TIMES } from '@/lib/redis';

// Type definitions
type UserGoalPurpose = 'learn' | 'teach' | 'both';
type UserType = 'tutor' | 'learner' | 'both';

interface WhereClause {
  OR?: Array<Record<string, unknown>>;
  UserGoals?: {
    some: {
      purpose: string;
    };
  };
  NOT?: {
    id: string;
  };
}

interface FormattedBadge {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface FormattedUser {
  id: string;
  username: string;
  name: string;
  surname: string | null;
  avatar: string;
  avatarObject: {
    id: string;
    avatarIndex: number;
    avatarSeed: string;
    avatarStyle: string;
    isPrimary: boolean;
    isCustomUpload: boolean;
    customImageUrl: string | null;
  } | null;
  img: string;
  type: UserType;
  xp: number;
  seekers: number;
  seeking: number;
  coursesMade: number;
  coursesLearning: number;
  badges: FormattedBadge[];
  bio: string;
  dateJoined: string;
  isPrivate: boolean;
}

// ✅ Type for the user data returned from Prisma
interface PrismaUserData {
  id: string;
  username: string;
  name: string | null;
  surname: string | null;
  img: string | null;
  createdAt: Date;
  userXP: {
    totalXP: number;
    contributorTitle: string;
  } | null;
  badges: Array<{
    id: string;
    title: string;
    icon: string;
    color: string;
  }>;
  avatars: Array<{
    id: string;
    avatarIndex: number;
    avatarSeed: string;
    avatarStyle: string;
    isPrimary: boolean;
    isCustomUpload: boolean;
    customImageUrl: string | null;
  }>;
  UserGoals: Array<{
    purpose: string;
  }>;
  _count: {
    followers: number;
    following: number;
    courses: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getAuthUser(request);
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');

    // ✅ Create cache key based on query params
    const cacheKey = `discover:users:${search}:${filter}:${limit}`;
    
    // ✅ Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log('✅ Returning cached discover results');
      return NextResponse.json(JSON.parse(cached), {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    console.log('🔄 Fetching discover users from database');

    const whereClause: WhereClause = {};

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

    // ✅ FIXED: Explicitly type the user parameter
    const formattedUsers: FormattedUser[] = users.map((user: PrismaUserData) => {
      const userGoal = user.UserGoals[0];
      let userType: UserType = 'learner';
      
      if (userGoal) {
        const purpose = userGoal.purpose as UserGoalPurpose;
        if (purpose === 'teach') userType = 'tutor';
        else if (purpose === 'both') userType = 'both';
      }

      // Use helper function with red/white/black theme
      const avatarUrl = getAvatarUrlFromUser(user, 64);
      const primaryAvatar = user.avatars[0] || null;

      // Ensure avatar is always a string, never null
      const finalAvatarUrl = avatarUrl || '/default-avatar.png';

      return {
        id: user.id,
        username: user.username,
        name: user.name || 'User',
        surname: user.surname,
        avatar: finalAvatarUrl,
        avatarObject: primaryAvatar,
        img: finalAvatarUrl,
        type: userType,
        xp: user.userXP?.totalXP || 0,
        seekers: user._count.followers,
        seeking: user._count.following,
        coursesMade: user._count.courses,
        coursesLearning: 0,
        badges: user.badges.map((badge) => ({
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

    const response = {
      users: formattedUsers,
      total: formattedUsers.length
    };

    // ✅ Cache the results
    await redis.set(
      cacheKey,
      JSON.stringify(response),
      'EX',
      CACHE_TIMES.MEDIUM
    );

    console.log('✅ Cached discover results');

    return NextResponse.json(response, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });

  } catch (error) {
    console.error('Discover users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}