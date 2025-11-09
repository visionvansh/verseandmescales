// api/chat/questions/[id]/answer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { getAvatarUrlFromUser } from '@/utils/avatarGenerator'; // ✅ ADD THIS IMPORT

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
    const { content, parentAnswerId } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Answer content required' },
        { status: 400 }
      );
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        room: {
          include: {
            course: {
              select: { userId: true }
            }
          }
        }
      }
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const isMentor = question.room.course.userId === user.id;

    if (
      question.visibility === 'MENTOR_ONLY' ||
      question.visibility === 'PRIVATE'
    ) {
      if (!isMentor) {
        return NextResponse.json(
          { error: 'Only mentor can answer this question' },
          { status: 403 }
        );
      }
    }

    if (parentAnswerId) {
      const parentAnswer = await prisma.questionAnswer.findFirst({
        where: {
          id: parentAnswerId,
          questionId: questionId
        }
      });

      if (!parentAnswer) {
        return NextResponse.json(
          { error: 'Parent answer not found' },
          { status: 404 }
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const newAnswer = await tx.questionAnswer.create({
        data: {
          questionId,
          userId: user.id,
          parentAnswerId,
          content: content.trim(),
          isMentorAnswer: isMentor
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              img: true,
              // ✅ ADD avatars to fetch custom avatar config
              avatars: {
                orderBy: { createdAt: 'desc' },
                select: {
                  id: true,
                  avatarIndex: true,
                  avatarSeed: true,
                  avatarStyle: true,
                  isPrimary: true,
                  isCustomUpload: true,
                  customImageUrl: true,
                }
              }
            }
          }
        }
      });

      if (parentAnswerId) {
        await tx.questionAnswer.update({
          where: { id: parentAnswerId },
          data: { replyCount: { increment: 1 } }
        });
      }

      const updatedQuestion = await tx.question.update({
        where: { id: questionId },
        data: {
          answerCount: { increment: 1 },
          status: 'answered'
        },
        select: {
          answerCount: true,
          status: true
        }
      });

      return { answer: newAnswer, question: updatedQuestion };
    });

    // ✅ FIXED: Transform response with getAvatarUrlFromUser
    const transformedAnswer = {
      id: result.answer.id,
      content: result.answer.content,
      isAccepted: result.answer.isAccepted,
      isMentorAnswer: result.answer.isMentorAnswer,
      upvoteCount: 0,
      replyCount: 0,
      parentAnswerId: result.answer.parentAnswerId,
      userId: result.answer.userId,
      userName: result.answer.user.name || result.answer.user.username,
      userAvatar: getAvatarUrlFromUser(result.answer.user, 64), // ✅ FIXED
      isMentor: isMentor,
      hasUpvoted: false,
      createdAt: result.answer.createdAt,
      updatedAt: result.answer.updatedAt
    };

    return NextResponse.json({
      success: true,
      answer: transformedAnswer,
      questionId,
      answerCount: result.question.answerCount,
      status: result.question.status,
      roomId: question.roomId
    });

  } catch (error) {
    console.error('Error creating answer:', error);
    return NextResponse.json(
      { error: 'Failed to create answer' },
      { status: 500 }
    );
  }
}