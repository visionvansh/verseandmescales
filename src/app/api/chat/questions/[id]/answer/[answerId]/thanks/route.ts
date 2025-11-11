//api/chat/questions/[id]/answer/[answerId]/thanks
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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

    // Get question
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        userId: true,
        thanksGivenCount: true,
        roomId: true
      }
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Only question author can give thanks
    if (question.userId !== user.id) {
      return NextResponse.json(
        { error: 'Only question author can give thanks' },
        { status: 403 }
      );
    }

    // Check if already given 2 thanks
    if (question.thanksGivenCount >= 2) {
      return NextResponse.json(
        { error: 'Maximum 2 thanks badges allowed per question' },
        { status: 400 }
      );
    }

    // Get answer
    const answer = await prisma.questionAnswer.findFirst({
      where: {
        id: answerId,
        questionId: questionId
      },
      select: {
        isThanked: true,
        userId: true
      }
    });

    if (!answer) {
      return NextResponse.json({ error: 'Answer not found' }, { status: 404 });
    }

    // Cannot thank your own answer
    if (answer.userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot thank your own answer' },
        { status: 400 }
      );
    }

    if (answer.isThanked) {
      return NextResponse.json(
        { error: 'Answer already has thanks badge' },
        { status: 400 }
      );
    }

    // Give thanks badge
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update answer
      await tx.questionAnswer.update({
        where: { id: answerId },
        data: {
          isThanked: true,
          thankedAt: new Date()
        }
      });

      // Increment question thanks count
      const updatedQuestion = await tx.question.update({
        where: { id: questionId },
        data: {
          thanksGivenCount: { increment: 1 }
        },
        select: {
          thanksGivenCount: true
        }
      });

      return updatedQuestion;
    });

    return NextResponse.json({
      success: true,
      questionId,
      answerId,
      thanksGivenCount: result.thanksGivenCount,
      roomId: question.roomId
    });

  } catch (error) {
    console.error('Error giving thanks:', error);
    return NextResponse.json(
      { error: 'Failed to give thanks' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; answerId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: questionId, answerId } = await params;

    // Get question
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        userId: true,
        roomId: true
      }
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Only question author can remove thanks
    if (question.userId !== user.id) {
      return NextResponse.json(
        { error: 'Only question author can remove thanks' },
        { status: 403 }
      );
    }

    // Get answer
    const answer = await prisma.questionAnswer.findFirst({
      where: {
        id: answerId,
        questionId: questionId,
        isThanked: true
      }
    });

    if (!answer) {
      return NextResponse.json(
        { error: 'Answer not found or not thanked' },
        { status: 404 }
      );
    }

    // Remove thanks badge
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update answer
      await tx.questionAnswer.update({
        where: { id: answerId },
        data: {
          isThanked: false,
          thankedAt: null
        }
      });

      // Decrement question thanks count
      const updatedQuestion = await tx.question.update({
        where: { id: questionId },
        data: {
          thanksGivenCount: { decrement: 1 }
        },
        select: {
          thanksGivenCount: true
        }
      });

      return updatedQuestion;
    });

    return NextResponse.json({
      success: true,
      questionId,
      answerId,
      thanksGivenCount: result.thanksGivenCount,
      roomId: question.roomId
    });

  } catch (error) {
    console.error('Error removing thanks:', error);
    return NextResponse.json(
      { error: 'Failed to remove thanks' },
      { status: 500 }
    );
  }
}