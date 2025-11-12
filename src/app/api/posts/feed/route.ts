// /api/posts/feed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import { getAvatarUrlFromUser } from '@/utils/avatarGenerator';
import prisma from '@/lib/prisma';

// ============================================
// TYPE DEFINITIONS
// ============================================

type UserGoal = {
  purpose: string;
};

type TargetUser = {
  id: string;
  UserGoals: UserGoal[];
  profileSettings: {
    isPublic: boolean;
  } | null;
};

type Following = {
  followingId: string;
};

type PrismaPostUser = {
  id: string;
  username: string;
  name: string | null;
  surname: string | null;
  img: string | null;
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
  UserGoals: UserGoal[];
  _count: {
    followers: number;
    following: number;
  };
};

type PrismaPost = {
  id: string;
  userId: string;
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  mediaDuration: string | null;
  mediaWidth: number | null;
  mediaHeight: number | null;
  mediaThumbnail: string | null;
  privacy: string;
  isPinned: boolean;
  isEdited: boolean;
  editedAt: Date | null;
  createdAt: Date;
  user: PrismaPostUser;
  likes?: any[];
  _count: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
};

type UserType = 'tutor' | 'learner' | 'both';

type FormattedBadge = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

type FormattedUser = {
  id: string;
  username: string;
  name: string;
  avatar: string;
  avatarObject: any;
  type: UserType;
  xp: number;
  badges: FormattedBadge[];
  seekers: number;
  seeking: number;
  coursesMade: number;
  coursesLearning: number;
  dateJoined: string;
  isPrivate: boolean;
};

type FormattedPost = {
  id: string;
  userId: string;
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  mediaDuration: string | null;
  mediaWidth: number | null;
  mediaHeight: number | null;
  mediaThumbnail: string | null;
  privacy: string;
  isPinned: boolean;
  isEdited: boolean;
  editedAt: Date | null;
  timestamp: string;
  user: FormattedUser;
  isLiked: boolean;
  likes: number;
  comments: number;
  shares: number;
  viewsCount: number;
  media?: string;
  videoDuration?: string;
  type: 'video' | 'image' | 'text';
};

// ✅ Define custom WhereClause type instead of using Prisma.PostWhereInput
type PostWhereClause = {
  isDeleted: boolean;
  userId?: string;
  privacy?: string | { in: string[] };
  OR?: Array<{
    userId?: string | { in: string[] };
    privacy?: string | { in: string[] };
    user?: {
      OR: Array<{
        UserGoals: { some: { purpose: string } };
        profileSettings?: { isPublic: boolean };
      }>;
    };
  }>;
  user?: {
    OR: Array<{
      UserGoals: { some: { purpose: string } };
      profileSettings?: { isPublic: boolean };
    }>;
  };
};

// ============================================
// ROUTE HANDLER
// ============================================

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '10');
    const username = searchParams.get('username');

    // ✅ Use custom type instead of Prisma.PostWhereInput
    const whereClause: PostWhereClause = {
      isDeleted: false
    };

    // Filter by username if provided
    if (username) {
      const targetUser: TargetUser | null = await prisma.student.findUnique({
        where: { username: username.toLowerCase() },
        select: { 
          id: true,
          UserGoals: {
            select: { purpose: true },
            take: 1
          },
          profileSettings: {
            select: { isPublic: true }
          }
        }
      }) as TargetUser | null;

      if (!targetUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const userGoal = targetUser.UserGoals[0];
      const isTargetOwn = user?.id === targetUser.id;
      
      let canView = isTargetOwn;
      
      if (!isTargetOwn) {
        if (userGoal?.purpose === 'teach' || userGoal?.purpose === 'both') {
          canView = true;
        } else if (userGoal?.purpose === 'learn') {
          canView = targetUser.profileSettings?.isPublic || false;
        }
      }

      if (!canView) {
        return NextResponse.json(
          { error: 'This profile is private' },
          { status: 403 }
        );
      }

      whereClause.userId = targetUser.id;
      
    } else if (user) {
      const following: Following[] = await prisma.follow.findMany({
        where: {
          followerId: user.id,
          isAccepted: true
        },
        select: { followingId: true }
      }) as Following[];

      const followingIds: string[] = following.map((f: Following) => f.followingId);

      whereClause.OR = [
        { userId: user.id },
        { 
          userId: { in: followingIds }, 
          privacy: { in: ['PUBLIC', 'SEEKERS_ONLY'] } 
        },
        { privacy: 'PUBLIC' }
      ];
    } else {
      whereClause.privacy = 'PUBLIC';
      whereClause.user = {
        OR: [
          { UserGoals: { some: { purpose: 'teach' } } },
          { UserGoals: { some: { purpose: 'both' } } },
          { 
            UserGoals: { some: { purpose: 'learn' } },
            profileSettings: { isPublic: true }
          }
        ]
      };
    }

    // ✅ Cast whereClause to any to avoid type conflicts with Prisma
    const posts = await prisma.post.findMany({
      where: whereClause as any,
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            surname: true,
            img: true,
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
                following: true
              }
            }
          }
        },
        likes: user ? {
          where: { userId: user.id },
          take: 1
        } : undefined,
        _count: {
          select: {
            likes: true,
            comments: { where: { isDeleted: false } },
            shares: true,
            views: true
          }
        }
      }
    });

    const hasMore = posts.length > limit;
    const postsToReturn = hasMore ? posts.slice(0, -1) : posts;

    const formattedPosts: FormattedPost[] = postsToReturn.map((post: any) => {
      const userGoal = post.user.UserGoals[0];
      let userType: UserType = 'learner';
      
      if (userGoal) {
        if (userGoal.purpose === 'teach') userType = 'tutor';
        else if (userGoal.purpose === 'both') userType = 'both';
      }

      const avatarUrl = getAvatarUrlFromUser(post.user, 64) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user.username}`;
      const primaryAvatar = post.user.avatars[0];

      return {
        id: post.id,
        userId: post.userId,
        content: post.content,
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType,
        mediaDuration: post.mediaDuration,
        mediaWidth: post.mediaWidth,
        mediaHeight: post.mediaHeight,
        mediaThumbnail: post.mediaThumbnail,
        privacy: post.privacy,
        isPinned: post.isPinned,
        isEdited: post.isEdited,
        editedAt: post.editedAt,
        timestamp: post.createdAt.toISOString(),
        user: {
          id: post.user.id,
          username: post.user.username,
          name: post.user.name || 'User',
          avatar: avatarUrl,
          avatarObject: primaryAvatar || null,
          type: userType,
          xp: post.user.userXP?.totalXP || 0,
          badges: post.user.badges.map((b: any) => ({
            id: b.id,
            name: b.title,
            icon: b.icon,
            color: b.color
          })),
          seekers: post.user._count.followers,
          seeking: post.user._count.following,
          coursesMade: 0,
          coursesLearning: 0,
          dateJoined: '',
          isPrivate: false
        },
        isLiked: user ? (post.likes?.length ?? 0) > 0 : false,
        likes: post._count.likes,
        comments: post._count.comments,
        shares: post._count.shares,
        viewsCount: post._count.views,
        media: post.mediaUrl || undefined,
        videoDuration: post.mediaDuration || undefined,
        type: post.mediaType === 'video' ? 'video' : post.mediaType === 'image' ? 'image' : 'text'
      };
    });

    return NextResponse.json({
      posts: formattedPosts,
      nextCursor: hasMore ? posts[posts.length - 1].id : null
    });

  } catch (error: unknown) {
    console.error('Get feed error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feed' },
      { status: 500 }
    );
  }
}