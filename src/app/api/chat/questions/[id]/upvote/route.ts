// app/api/chat/questions/[id]/upvote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: questionId } = await params;

    // Get question to find roomId for WebSocket broadcast
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { roomId: true }
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Check if already upvoted
    const existingUpvote = await prisma.questionUpvote.findUnique({
      where: {
        questionId_userId: {
          questionId,
          userId: user.id
        }
      }
    });

    let upvoted: boolean;
    let newCount: number;

    if (existingUpvote) {
      // Remove upvote
      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.questionUpvote.delete({
          where: { id: existingUpvote.id }
        });
        
        const updated = await tx.question.update({
          where: { id: questionId },
          data: { upvoteCount: { decrement: 1 } },
          select: { upvoteCount: true }
        });
        
        return updated;
      });
      
      upvoted = false;
      newCount = result.upvoteCount;
    } else {
      // Add upvote
      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.questionUpvote.create({
          data: {
            questionId,
            userId: user.id
          }
        });
        
        const updated = await tx.question.update({
          where: { id: questionId },
          data: { upvoteCount: { increment: 1 } },
          select: { upvoteCount: true }
        });
        
        return updated;
      });
      
      upvoted = true;
      newCount = result.upvoteCount;
    }

    // ✅ Return response that WebSocket can use
    return NextResponse.json({
      success: true,
      upvoted,
      questionId,
      userId: user.id,
      roomId: question.roomId,
      question: {
        id: questionId,
        upvoteCount: newCount,
        hasUpvoted: upvoted
      }
    });

  } catch (error) {
    console.error('Error toggling upvote:', error);
    return NextResponse.json(
      { error: 'Failed to toggle upvote' },
      { status: 500 }
    );
  }
}