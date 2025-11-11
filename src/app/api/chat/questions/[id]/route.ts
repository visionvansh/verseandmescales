// api/chat/questions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';

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
            avatars: {
              orderBy: { createdAt: 'desc' },
              take: 1,
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
                avatars: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
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
                    avatars: {
                      orderBy: { createdAt: 'desc' },
                      take: 1,
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
            { isThanked: 'desc' }, // ✅ Thanked answers first
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

    // ✅ Helper to get avatar data from user
    const getAvatarData = (userData: any) => {
      const primaryAvatar = userData.avatars?.[0];
      
      return {
        userAvatar: userData.img || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.id}`,
        customImageUrl: primaryAvatar?.isCustomUpload ? primaryAvatar.customImageUrl : null,
        userAvatarObject: primaryAvatar ? {
          avatarIndex: primaryAvatar.avatarIndex,
          avatarSeed: primaryAvatar.avatarSeed,
          avatarStyle: primaryAvatar.avatarStyle,
          isCustomUpload: primaryAvatar.isCustomUpload,
          customImageUrl: primaryAvatar.customImageUrl,
        } : null,
      };
    };

    // ✅ Transform answer with avatar data
    const transformAnswer = (a: any) => {
      const avatarData = getAvatarData(a.user);
      
      return {
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
        ...avatarData, // ✅ Spread avatar data
        isMentor: a.userId === question.room.course.userId,
        hasUpvoted: a.upvotes.length > 0,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        replies: a.replies?.map(transformAnswer) || []
      };
    };

    // ✅ Transform question with avatar data
    const questionAvatarData = getAvatarData(question.user);
    
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
      ...questionAvatarData, // ✅ Spread avatar data
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