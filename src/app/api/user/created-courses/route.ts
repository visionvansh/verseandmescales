// app/api/user/created-courses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const courses = await prisma.course.findMany({
      where: {
        userId: user.id,
      },
      include: {
        enrollments: {
          where: {
            status: 'active',
          },
          include: {
            user: {
              select: {
                isOnline: true,
              },
            },
          },
        },
        modules: {
          include: {
            lessons: {
              select: {
                id: true,
              },
            },
          },
        },
        ratings: {
          select: {
            rating: true,
          },
        },
        payments: {
          where: {
            status: 'succeeded',
          },
          select: {
            sellerAmount: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        // Calculate student statistics
        const totalLessons = course.modules.reduce(
          (sum, module) => sum + module.lessons.length,
          0
        );

        const studentStats = await Promise.all(
          course.enrollments.map(async (enrollment) => {
            const progress = await prisma.lessonProgress.count({
              where: {
                userId: enrollment.userId,
                courseId: course.id,
                isCompleted: true,
              },
            });

            const progressPercent = totalLessons > 0 
              ? (progress / totalLessons) * 100 
              : 0;

            return {
              userId: enrollment.userId,
              isOnline: enrollment.user.isOnline,
              progress: progressPercent,
              status: progressPercent === 0 
                ? 'not_started' 
                : progressPercent === 100 
                  ? 'completed' 
                  : 'in_progress',
            };
          })
        );

        // Count by status
        const notStarted = studentStats.filter(s => s.status === 'not_started').length;
        const inProgress = studentStats.filter(s => s.status === 'in_progress').length;
        const completed = studentStats.filter(s => s.status === 'completed').length;
        const online = studentStats.filter(s => s.isOnline).length;

        // Calculate average rating
        const averageRating = course.ratings.length > 0
          ? course.ratings.reduce((sum, r) => sum + r.rating, 0) / course.ratings.length
          : 0;

        // Calculate total earnings
        const totalEarnings = course.payments.reduce(
          (sum, payment) => sum + Number(payment.sellerAmount),
          0
        );

        return {
          id: course.id,
          title: course.title,
          thumbnail: course.thumbnail,
          status: course.status,
          stats: {
            totalStudents: course.enrollments.length,
            online,
            completed,
            inProgress,
            notStarted,
            rating: Math.round(averageRating * 10) / 10,
            totalRatings: course.ratings.length,
            earnings: totalEarnings.toFixed(2),
          },
          metadata: {
            totalModules: course.modules.length,
            totalLessons,
            publishedAt: course.publishedAt,
            lastUpdated: course.updatedAt,
          },
        };
      })
    );

    return NextResponse.json({ 
      success: true,
      courses: coursesWithStats 
    });
  } catch (error) {
    console.error('Error fetching created courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch created courses' },
      { status: 500 }
    );
  }
}