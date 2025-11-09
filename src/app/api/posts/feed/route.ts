import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import { getAvatarUrlFromUser } from '@/utils/avatarGenerator'; // ✅ Add import at top
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '10');
    const username = searchParams.get('username');

    let whereClause: any = {
      isDeleted: false
    };

    // Filter by username if provided
    if (username) {
      const targetUser = await prisma.student.findUnique({
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
      });

      if (!targetUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // ✅ Check privacy rules
      const userGoal = targetUser.UserGoals[0];
      const isTargetOwn = user?.id === targetUser.id;
      
      // Determine if profile is accessible
      let canView = isTargetOwn;
      
      if (!isTargetOwn) {
        if (userGoal?.purpose === 'teach' || userGoal?.purpose === 'both') {
          // Tutors and Both are always public
          canView = true;
        } else if (userGoal?.purpose === 'learn') {
          // Learners: check their privacy setting
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
      // Show posts from followed users + own posts + public posts
      const following = await prisma.follow.findMany({
        where: {
          followerId: user.id,
          isAccepted: true
        },
        select: { followingId: true }
      });

      const followingIds = following.map(f => f.followingId);

      whereClause.OR = [
        { userId: user.id },
        { userId: { in: followingIds }, privacy: { in: ['PUBLIC', 'SEEKERS_ONLY'] } },
        { privacy: 'PUBLIC' }
      ];
    } else {
      // Anonymous users only see public posts from public profiles
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

    const posts = await prisma.post.findMany({
      where: whereClause,
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
            // ✅ ADD THIS
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

    const formattedPosts = postsToReturn.map(post => {
      const userGoal = post.user.UserGoals[0];
      let userType: 'tutor' | 'learner' | 'both' = 'learner';
      
      if (userGoal) {
        if (userGoal.purpose === 'teach') userType = 'tutor';
        else if (userGoal.purpose === 'both') userType = 'both';
      }

      // ✅ USE HELPER FUNCTION WITH CUSTOM COLORS
      const avatarUrl = getAvatarUrlFromUser(post.user, 64);
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
          avatar: avatarUrl, // ✅ NOW WITH RED/WHITE/BLACK THEME
          avatarObject: primaryAvatar || null,
          type: userType,
          xp: post.user.userXP?.totalXP || 0,
          badges: post.user.badges.map(b => ({
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
        isLiked: user ? post.likes?.length > 0 : false,
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

  } catch (error) {
    console.error('Get feed error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feed' },
      { status: 500 }
    );
  }
}