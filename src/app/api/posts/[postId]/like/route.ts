//Volumes/vision/codes/course/my-app/src/app/api/posts/[postId]/like/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';

export async function POST(
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

    // Await params
    const { postId } = await params;

    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: user.id
        }
      }
    });

    let isLiked: boolean;
    let likesCount: number;

    if (existingLike) {
      // Unlike
      await prisma.$transaction([
        prisma.postLike.delete({
          where: { id: existingLike.id }
        }),
        prisma.post.update({
          where: { id: postId },
          data: { likesCount: { decrement: 1 } }
        })
      ]);
      isLiked = false;
    } else {
      // Like
      await prisma.$transaction([
        prisma.postLike.create({
          data: {
            postId,
            userId: user.id
          }
        }),
        prisma.post.update({
          where: { id: postId },
          data: { likesCount: { increment: 1 } }
        })
      ]);
      isLiked = true;

      // Award XP to post author
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { userId: true }
      });

      if (post && post.userId !== user.id) {
        await prisma.userXP.upsert({
          where: { userId: post.userId },
          update: {
            totalXP: { increment: 2 },
            xpFromEngagement: { increment: 2 }
          },
          create: {
            userId: post.userId,
            totalXP: 2,
            xpFromEngagement: 2
          }
        });
      }
    }

    const updatedPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { likesCount: true }
    });

    likesCount = updatedPost?.likesCount || 0;

    return NextResponse.json({
      success: true,
      isLiked,
      likesCount
    });

  } catch (error) {
    console.error('Toggle like error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}