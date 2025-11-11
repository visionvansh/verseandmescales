// api/chat/questions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// ✅ Define the type WITHOUT the dynamic where clause
type QuestionWithRelations = Prisma.QuestionGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        username: true;
        img: true;
        avatars: {
          orderBy: { createdAt: 'desc' };
          take: 1;
          select: {
            avatarIndex: true;
            avatarSeed: true;
            avatarStyle: true;
            isCustomUpload: true;
            customImageUrl: true;
          };
        };
      };
    };
    upvotes: {
      select: { id: true };
    };
    _count: {
      select: { answers: true };
    };
  };
}>;

// ✅ Define the type for user with avatars
type UserWithAvatars = {
  id: string;
  name: string | null;
  username: string;
  img: string | null;
  avatars: Array<{
    avatarIndex: number | null;
    avatarSeed: string | null;
    avatarStyle: string | null;
    isCustomUpload: boolean;
    customImageUrl: string | null;
  }>;
};

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const lessonId = searchParams.get('lessonId');
    const moduleId = searchParams.get('moduleId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID required' }, { status: 400 });
    }

    const where: Prisma.QuestionWhereInput = { roomId };
    if (lessonId && lessonId !== 'all') where.lessonId = lessonId;
    if (moduleId && moduleId !== 'all') where.moduleId = moduleId;
    if (userId) where.userId = userId;
    if (status && status !== 'all') where.status = status as any;

    const questions = await prisma.question.findMany({
      where,
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
                avatarIndex: true,
                avatarSeed: true,
                avatarStyle: true,
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
        _count: {
          select: { answers: true }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // ✅ Helper to get avatar data with proper typing
    const getAvatarData = (userData: UserWithAvatars) => {
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

    // ✅ Transform questions with avatar data - properly typed
    const transformedQuestions = questions.map((q: QuestionWithRelations) => {
      const avatarData = getAvatarData(q.user);
      
      return {
        id: q.id,
        title: q.title,
        description: q.description,
        tags: q.tags,
        videoTimestamp: q.videoTimestamp,
        visibility: q.visibility,
        status: q.status,
        isPinned: q.isPinned,
        upvoteCount: q.upvoteCount,
        viewCount: q.viewCount,
        answerCount: q._count.answers,
        thanksGivenCount: q.thanksGivenCount || 0,
        userId: q.userId,
        userName: q.user.name || q.user.username,
        ...avatarData,
        lessonId: q.lessonId,
        moduleId: q.moduleId,
        hasUpvoted: q.upvotes.length > 0,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      };
    });

    return NextResponse.json({ questions: transformedQuestions });

  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { roomId, lessonId, moduleId, title, description, tags, videoTimestamp, visibility } = body;

    if (!roomId || !lessonId || !moduleId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const question = await prisma.question.create({
      data: {
        roomId,
        lessonId,
        moduleId,
        title,
        description,
        tags: tags || [],
        videoTimestamp,
        visibility: visibility || 'MENTOR_PUBLIC',
        userId: user.id,
      },
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
                avatarIndex: true,
                avatarSeed: true,
                avatarStyle: true,
                isCustomUpload: true,
                customImageUrl: true,
              }
            }
          }
        }
      }
    });

    // ✅ Get avatar data for response
    const avatarData = (() => {
      const primaryAvatar = question.user.avatars?.[0];
      return {
        userAvatar: question.user.img || `https://api.dicebear.com/7.x/avataaars/svg?seed=${question.user.id}`,
        customImageUrl: primaryAvatar?.isCustomUpload ? primaryAvatar.customImageUrl : null,
        userAvatarObject: primaryAvatar ? {
          avatarIndex: primaryAvatar.avatarIndex,
          avatarSeed: primaryAvatar.avatarSeed,
          avatarStyle: primaryAvatar.avatarStyle,
          isCustomUpload: primaryAvatar.isCustomUpload,
          customImageUrl: primaryAvatar.customImageUrl,
        } : null,
      };
    })();

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
      answerCount: 0,
      thanksGivenCount: 0,
      userId: question.userId,
      userName: question.user.name || question.user.username,
      ...avatarData,
      lessonId: question.lessonId,
      moduleId: question.moduleId,
      hasUpvoted: false,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    };

    return NextResponse.json({ question: transformedQuestion, roomId });

  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}