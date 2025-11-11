// app/api/posts/[postId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { getAvatarUrlFromUser } from '@/utils/avatarGenerator'; // ✅ ADD IMPORT

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
            // ✅ ADD AVATARS RELATION
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
    });

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
      }).catch(() => {}); // Ignore duplicate views

      await prisma.post.update({
        where: { id: postId },
        data: { viewsCount: { increment: 1 } }
      }).catch(() => {});
    }

    // ✅ GENERATE AVATAR URL WITH RED/WHITE/BLACK THEME
    const avatarUrl = getAvatarUrlFromUser(post.user, 64);

    const formattedPost = {
      ...post,
      user: {
        ...post.user,
        img: avatarUrl, // ✅ USE THEMED AVATAR
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { postId } = await params;
    const body = await request.json();

    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.userId !== user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own posts' },
        { status: 403 }
      );
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        content: body.content,
        privacy: body.privacy,
        isEdited: true,
        editedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            img: true,
            // ✅ ADD AVATARS RELATION
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
            }
          }
        }
      }
    });

    // ✅ GENERATE AVATAR URL
    const avatarUrl = getAvatarUrlFromUser(updatedPost.user, 64);

    return NextResponse.json({ 
      post: {
        ...updatedPost,
        user: {
          ...updatedPost.user,
          img: avatarUrl,
          avatar: avatarUrl
        }
      }
    });

  } catch (error) {
    console.error('Update post error:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { postId } = await params;

    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.userId !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own posts' },
        { status: 403 }
      );
    }

    await prisma.post.delete({
      where: { id: postId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}