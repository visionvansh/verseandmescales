import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';

const ALLOWED_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '😡', '🎉', '🔥', '👏', '💯'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { commentId } = await params;
    const { emoji } = await request.json();

    if (!emoji || !ALLOWED_EMOJIS.includes(emoji)) {
      return NextResponse.json(
        { error: 'Invalid emoji' },
        { status: 400 }
      );
    }

    // Get comment first
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { postId: true }
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    const existingReaction = await prisma.commentReaction.findUnique({
      where: {
        commentId_userId_emoji: {
          commentId,
          userId: user.id,
          emoji
        }
      }
    });

    let action: 'added' | 'removed';

    if (existingReaction) {
      await prisma.$transaction([
        prisma.commentReaction.delete({
          where: { id: existingReaction.id }
        }),
        prisma.comment.update({
          where: { id: commentId },
          data: { reactionsCount: { decrement: 1 } }
        })
      ]);
      action = 'removed';
    } else {
      await prisma.$transaction([
        prisma.commentReaction.create({
          data: {
            commentId,
            userId: user.id,
            emoji
          }
        }),
        prisma.comment.update({
          where: { id: commentId },
          data: { reactionsCount: { increment: 1 } }
        })
      ]);
      action = 'added';
    }

    // ✅ FIXED: Get all reactions with proper user data
    const allReactions = await prisma.commentReaction.findMany({
      where: { commentId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            img: true
          }
        }
      }
    });

    // ✅ FIXED: Send reactions array in proper format for frontend
    const reactions = allReactions.map(reaction => ({
      id: reaction.id,
      emoji: reaction.emoji,
      userId: reaction.userId,
      user: reaction.user
    }));

    // Broadcast immediately
    if (typeof global !== 'undefined' && (global as any).wss) {
      const message = JSON.stringify({
        event: 'comment:reaction',
        data: {
          commentId,
          postId: comment.postId,
          userId: user.id,
          emoji,
          action,
          reactions // ✅ Send full reactions array
        }
      });
      
      (global as any).wss.clients.forEach((client: any) => {
        if (client.readyState === 1) {
          client.send(message);
        }
      });
    }

    return NextResponse.json({
      success: true,
      action,
      reactions,
      reactionsCount: allReactions.length
    });

  } catch (error) {
    console.error('Toggle reaction error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle reaction' },
      { status: 500 }
    );
  }
}