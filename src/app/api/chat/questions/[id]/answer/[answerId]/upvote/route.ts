import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; answerId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: questionId, answerId } = await params;

    // Get question to find roomId
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { roomId: true }
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Check if answer exists
    const answer = await prisma.questionAnswer.findFirst({
      where: {
        id: answerId,
        questionId: questionId
      }
    });

    if (!answer) {
      return NextResponse.json({ error: 'Answer not found' }, { status: 404 });
    }

    // Check if already upvoted
    const existingUpvote = await prisma.answerUpvote.findUnique({
      where: {
        answerId_userId: {
          answerId,
          userId: user.id
        }
      }
    });

    let upvoted: boolean;
    let newCount: number;

    if (existingUpvote) {
      // Remove upvote
      const result = await prisma.$transaction(async (tx) => {
        await tx.answerUpvote.delete({
          where: { id: existingUpvote.id }
        });
        
        const updated = await tx.questionAnswer.update({
          where: { id: answerId },
          data: { upvoteCount: { decrement: 1 } },
          select: { upvoteCount: true }
        });
        
        return updated;
      });
      
      upvoted = false;
      newCount = result.upvoteCount;
    } else {
      // Add upvote
      const result = await prisma.$transaction(async (tx) => {
        await tx.answerUpvote.create({
          data: {
            answerId,
            userId: user.id
          }
        });
        
        const updated = await tx.questionAnswer.update({
          where: { id: answerId },
          data: { upvoteCount: { increment: 1 } },
          select: { upvoteCount: true }
        });
        
        return updated;
      });
      
      upvoted = true;
      newCount = result.upvoteCount;
    }

    // ✅ Return with all necessary data for WebSocket broadcast
    return NextResponse.json({
      success: true,
      upvoted,
      questionId,
      answerId,
      userId: user.id,
      roomId: question.roomId,
      answer: {
        id: answerId,
        upvoteCount: newCount,
        hasUpvoted: upvoted
      }
    });

  } catch (error) {
    console.error('Error toggling answer upvote:', error);
    return NextResponse.json(
      { error: 'Failed to toggle upvote' },
      { status: 500 }
    );
  }
}