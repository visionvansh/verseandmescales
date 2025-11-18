// app/api/user/enrolled-courses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all user's enrollments with course data
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        userId: user.id,
        status: 'active',
      },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: true,
              },
              orderBy: {
                position: 'asc',
              },
            },
            ratings: {
              where: {
                userId: user.id,
              },
            },
            // ✅ NEW: Get all ratings for average calculation
            _count: {
              select: {
                ratings: true,
              },
            },
            chatRoom: {
              include: {
                participants: {
                  where: {
                    isOnline: true,
                  },
                },
                messages: {
                  where: {
                    createdAt: {
                      gt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                  },
                },
                questions: {
                  where: {
                    createdAt: {
                      gt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        lastAccessedAt: 'desc',
      },
    });

    // Get lesson progress for all enrolled courses
    const lessonProgress = await prisma.lessonProgress.findMany({
      where: {
        userId: user.id,
        courseId: {
          in: enrollments.map(e => e.courseId),
        },
      },
    });

    // Transform data
    const transformedCourses = enrollments.map(enrollment => {
      const course = enrollment.course;
      const totalModules = course.modules.length;
      const totalLessons = course.modules.reduce(
        (sum, module) => sum + module.lessons.length,
        0
      );

      const completedLessons = lessonProgress.filter(
        lp => lp.courseId === course.id && lp.isCompleted
      ).length;

      const modulesWithProgress = course.modules.map(module => {
        const moduleLessons = lessonProgress.filter(
          lp => lp.moduleId === module.id
        );
        const completedInModule = moduleLessons.filter(lp => lp.isCompleted).length;
        return {
          moduleId: module.id,
          completed: completedInModule === module.lessons.length,
        };
      });

      const completedModules = modulesWithProgress.filter(m => m.completed).length;
      const progress = totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

      const userRating = course.ratings[0];

      const lastAccess = new Date(enrollment.lastAccessedAt);
      const unreadMessages = course.chatRoom?.messages.filter(
        msg => new Date(msg.createdAt) > lastAccess
      ).length || 0;

      const newQuestions = course.chatRoom?.questions.filter(
        q => new Date(q.createdAt) > lastAccess
      ).length || 0;

      const onlineUsers = course.chatRoom?.participants.length || 0;

      // ✅ NEW: Add average rating and total ratings
      return {
        id: course.id,
        title: course.title,
        thumbnail: course.thumbnail,
        progress,
        totalModules,
        completedModules,
        totalLessons,
        completedLessons,
        rating: userRating?.rating || null,
        userComment: userRating?.review || null,
        unreadMessages,
        newQuestions,
        onlineUsers,
        lastAccessedAt: enrollment.lastAccessedAt.toISOString(),
        enrolledAt: enrollment.enrolledAt.toISOString(),
        averageRating: course.averageRating || 0, // ✅ ADDED
        totalRatings: course._count.ratings || 0,  // ✅ ADDED
      };
    });

    return NextResponse.json({
      courses: transformedCourses,
      totalEnrollments: enrollments.length,
    });
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrolled courses' },
      { status: 500 }
    );
  }
}