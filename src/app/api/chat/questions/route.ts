// app/api/chat/questions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { getAvatarUrlFromUser } from '@/utils/avatarGenerator';
import { QuestionVisibility } from '@prisma/client';

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

    // Check if user is mentor/course creator
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        course: {
          select: { userId: true }
        }
      }
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const isMentor = room.course.userId === user.id;

    // Build where clause
    const where: any = { roomId };

    // Filter by visibility based on user role
    if (!isMentor) {
      where.OR = [
        { visibility: QuestionVisibility.MENTOR_PUBLIC },
        { visibility: QuestionVisibility.MENTOR_ONLY },
        { userId: user.id } // User's own private questions
      ];
    }

    if (lessonId) where.lessonId = lessonId;
    if (moduleId) where.moduleId = moduleId;
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const questions = await prisma.question.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        tags: true,
        videoTimestamp: true,
        visibility: true,
        status: true,
        isPinned: true,
        upvoteCount: true,
        viewCount: true,
        thanksGivenCount: true, // Assuming this is a field on the Question model
        lessonId: true,
        moduleId: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        upvotes: {
          where: { userId: user.id },
          select: { id: true }
        },
        views: {
          where: { userId: user.id },
          select: { id: true }
        },
        _count: {
          select: {
            answers: true,
            upvotes: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            img: true,
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
            },
            userXP: {
              select: {
                totalXP: true,
                contributorTitle: true
              }
            },
            badges: {
              where: { isEarned: true, isDisplayed: true },
              orderBy: { displayOrder: 'asc' },
              take: 3,
              select: {
                id: true,
                title: true,
                icon: true,
                color: true
              }
            },
            _count: {
              select: {
                followers: true,
                following: true,
                courses: true
              }
            }
          }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { upvoteCount: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Transform response:
    const transformedQuestions = questions.map(q => {
      const avatarUrl = getAvatarUrlFromUser(q.user, 64);
      
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
        userAvatar: avatarUrl,
        lessonId: q.lessonId,
        moduleId: q.moduleId,
        hasUpvoted: q.upvotes.length > 0,
        hasViewed: q.views.length > 0,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
        userMetadata: {
          id: q.user.id,
          name: q.user.name || q.user.username,
          username: q.user.username,
          avatar: avatarUrl,
          avatarObject: q.user.avatars[0] || null,
          xp: q.user.userXP?.totalXP || 0,
          seekers: q.user._count.followers,
          seeking: q.user._count.following,
          coursesMade: q.user._count.courses,
          badges: q.user.badges.map(badge => ({
            id: badge.id,
            name: badge.title,
            icon: badge.icon,
            color: badge.color
          })),
          isOnline: true,
          role: 'student'
        }
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
    const {
      roomId,
      lessonId,
      moduleId,
      title,
      description,
      tags,
      videoTimestamp,
      visibility
    } = body;

    // Validation
    if (!roomId || !lessonId || !moduleId || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify room exists and user has access
    const room = await prisma.chatRoom.findFirst({
      where: {
        id: roomId,
        participants: {
          some: { userId: user.id }
        }
      }
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found or access denied' },
        { status: 404 }
      );
    }

    // Create question
    const question = await prisma.question.create({
      data: {
        roomId,
        userId: user.id,
        lessonId,
        moduleId,
        title: title.trim(),
        description: description?.trim(),
        tags: tags || [],
        videoTimestamp,
        visibility: visibility || QuestionVisibility.MENTOR_PUBLIC
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
              select: {
                id: true,
                avatarIndex: true,
                avatarSeed: true,
                avatarStyle: true,
                isPrimary: true,
                isCustomUpload: true,
                customImageUrl: true,
              }
            },
            userXP: {
              select: {
                totalXP: true,
                contributorTitle: true
              }
            },
            badges: {
              where: { isEarned: true, isDisplayed: true },
              orderBy: { displayOrder: 'asc' },
              take: 3,
              select: {
                id: true,
                title: true,
                icon: true,
                color: true
              }
            },
            _count: {
              select: {
                followers: true,
                following: true,
                courses: true
              }
            }
          }
        }
      }
    });

    // Transform response (updated to match GET structure)
    const avatarUrl = getAvatarUrlFromUser(question.user, 64);
    const transformedQuestion = {
      id: question.id,
      title: question.title,
      description: question.description,
      tags: question.tags,
      videoTimestamp: question.videoTimestamp,
      visibility: question.visibility,
      status: question.status,
      isPinned: question.isPinned,
      upvoteCount: 0,
      viewCount: 0,
      answerCount: 0,
      thanksGivenCount: 0,
      userId: question.userId,
      userName: question.user.name || question.user.username,
      userAvatar: avatarUrl,
      lessonId: question.lessonId,
      moduleId: question.moduleId,
      hasUpvoted: false,
      hasViewed: false,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      userMetadata: {
        id: question.user.id,
        name: question.user.name || question.user.username,
        username: question.user.username,
        avatar: avatarUrl,
        avatarObject: question.user.avatars[0] || null,
        xp: question.user.userXP?.totalXP || 0,
        seekers: question.user._count.followers,
        seeking: question.user._count.following,
        coursesMade: question.user._count.courses,
        badges: question.user.badges.map(badge => ({
          id: badge.id,
          name: badge.title,
          icon: badge.icon,
          color: badge.color
        })),
        isOnline: true,
        role: 'student'
      }
    };

    return NextResponse.json({ question: transformedQuestion });

  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}