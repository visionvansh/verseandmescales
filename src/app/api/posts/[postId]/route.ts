// app/api/posts/[postId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { getAvatarUrlFromUser } from '@/utils/avatarGenerator';

type BadgeData = {
  id: string;
  badgeType: string;
  category: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  isEarned: boolean;
  isDisplayed: boolean;
  displayOrder: number;
};

type PostUserData = {
  id: string;
  username: string;
  name: string | null;
  img: string | null;
  avatars: Array<{
    id: string;
    avatarIndex: number;
    avatarSeed: string;
    avatarStyle: string;
    isPrimary: boolean;
    isCustomUpload: boolean;
    customImageUrl: string | null;
  }>;
  userXP: {
    totalXP: number;
    contributorTitle: string;
    currentLevel: number;
  } | null;
  badges: BadgeData[];
};

type PostData = {
  id: string;
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  privacy: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  editedAt: Date | null;
  user: PostUserData;
  likes: Array<{ id: string; userId: string }>;
  _count: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    const { postId } = await params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            img: true,
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
            userXP: true,
            badges: {
              where: { isEarned: true, isDisplayed: true },
              orderBy: { displayOrder: 'asc' },
              take: 5
            }
          }
        },
        likes: {
          where: user ? { userId: user.id } : undefined,
          take: 1
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
            views: true
          }
        }
      }
    }) as PostData | null;

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check privacy
    if (post.privacy !== 'PUBLIC') {
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      if (post.privacy === 'PRIVATE' && post.userId !== user.id) {
        return NextResponse.json(
          { error: 'This post is private' },
          { status: 403 }
        );
      }

      if (post.privacy === 'SEEKERS_ONLY') {
        const isFollower = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: user.id,
              followingId: post.userId
            },
            isAccepted: true
          }
        });

        if (!isFollower && post.userId !== user.id) {
          return NextResponse.json(
            { error: 'This post is only visible to seekers' },
            { status: 403 }
          );
        }
      }
    }

    // Track view
    if (user && post.userId !== user.id) {
      await prisma.postView.create({
        data: {
          postId: post.id,
          userId: user.id
        }
      }).catch(() => {});

      await prisma.post.update({
        where: { id: postId },
        data: { viewsCount: { increment: 1 } }
      }).catch(() => {});
    }

    const avatarUrl = getAvatarUrlFromUser(post.user, 64);

    const formattedPost = {
      ...post,
      user: {
        ...post.user,
        img: avatarUrl,
        avatar: avatarUrl,
        avatarObject: post.user.avatars[0] || null
      },
      isLiked: post.likes.length > 0,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      sharesCount: post._count.shares,
      viewsCount: post._count.views
    };

    return NextResponse.json({ post: formattedPost });

  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}