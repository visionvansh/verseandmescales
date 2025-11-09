// api/chat/questions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { getAvatarUrlFromUser } from '@/utils/avatarGenerator'; // ✅ ADD THIS IMPORT

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: questionId } = await params;

    const question = await prisma.question.findUnique({
      where: { id: questionId },
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
        },
        answers: {
          where: { parentAnswerId: null },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                img: true,
                // ✅ ADD avatars here too
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
            },
            upvotes: {
              where: { userId: user.id },
              select: { id: true }
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    img: true,
                    // ✅ ADD avatars for replies too
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
                },
                upvotes: {
                  where: { userId: user.id },
                  select: { id: true }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: [
            { isAccepted: 'desc' },
            { isMentorAnswer: 'desc' },
            { upvoteCount: 'desc' },
            { createdAt: 'asc' }
          ]
        },
        upvotes: {
          where: { userId: user.id },
          select: { id: true }
        },
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
    const isOwner = question.userId === user.id;

    if (
      question.visibility === 'PRIVATE' &&
      !isMentor &&
      !isOwner
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // ✅ FIXED: Helper function using getAvatarUrlFromUser
    const transformAnswer = (a: any) => ({
      id: a.id,
      content: a.content,
      isAccepted: a.isAccepted,
      isMentorAnswer: a.isMentorAnswer,
      isThanked: a.isThanked,
      thankedAt: a.thankedAt,
      upvoteCount: a.upvoteCount,
      replyCount: a.replyCount || 0,
      parentAnswerId: a.parentAnswerId,
      userId: a.userId,
      userName: a.user.name || a.user.username,
      userAvatar: getAvatarUrlFromUser(a.user, 64), // ✅ FIXED
      isMentor: a.userId === question.room.course.userId,
      hasUpvoted: a.upvotes.length > 0,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      replies: a.replies?.map(transformAnswer) || []
    });

    // ✅ FIXED: Transform response with getAvatarUrlFromUser
    const transformedQuestion = {
      id: question.id,
      title: question.title,
      description: question.description,
      tags: question.tags,
      videoTimestamp: question.videoTimestamp,
      visibility: question.visibility,
      status: question.status,
      isPinned: question.isPinned,
      upvoteCount: question.upvoteCount,
      viewCount: question.viewCount,
      answerCount: question.answerCount,
      thanksGivenCount: question.thanksGivenCount || 0,
      userId: question.userId,
      userName: question.user.name || question.user.username,
      userAvatar: getAvatarUrlFromUser(question.user, 64), // ✅ FIXED
      lessonId: question.lessonId,
      moduleId: question.moduleId,
      hasUpvoted: question.upvotes.length > 0,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      answers: question.answers.map(transformAnswer)
    };

    return NextResponse.json({ question: transformedQuestion });

  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question' },
      { status: 500 }
    );
  }
}