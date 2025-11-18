// app/api/user/dashboard-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all data in parallel for atomic loading
    const [enrolledData, createdData, userGoals] = await Promise.all([
      // Enrolled courses data
      prisma.courseEnrollment.findMany({
        where: {
          userId: user.id,
          status: 'active',
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              averageRating: true,
              user: {
                select: {
                  name: true,
                  img: true,
                },
              },
              modules: {
                select: {
                  id: true,
                  lessons: {
                    select: {
                      id: true,
                      videoDuration: true,
                    },
                  },
                },
              },
              enrollments: {
                where: {
                  status: 'active',
                },
                select: {
                  user: {
                    select: {
                      isOnline: true,
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
      }),

      // Created courses data
      prisma.course.findMany({
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
      }),

      // User goals
      prisma.userGoals.findUnique({
        where: {
          userId: user.id,
        },
      }),
    ]);

    // Process enrolled courses
    const enrolledCourses = await Promise.all(
      enrolledData.map(async (enrollment) => {
        const course = enrollment.course;
        
        const totalLessons = course.modules.reduce(
          (sum, module) => sum + module.lessons.length,
          0
        );

        const lessonProgress = await prisma.lessonProgress.findMany({
          where: {
            userId: user.id,
            courseId: course.id,
          },
        });

        const completedLessons = lessonProgress.filter(lp => lp.isCompleted).length;
        const overallProgress = totalLessons > 0 
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

        const totalWatchTime = lessonProgress.reduce(
          (sum, lp) => sum + (lp.watchTime || 0),
          0
        );

        const videosLeft = totalLessons - completedLessons;

        const totalDuration = course.modules.reduce((sum, module) => {
          return sum + module.lessons.reduce((lessonSum, lesson) => {
            const duration = parseFloat(lesson.videoDuration || '0');
            return lessonSum + (isNaN(duration) ? 0 : duration);
          }, 0);
        }, 0);

        const onlineStudents = course.enrollments.filter(
          e => e.user.isOnline
        ).length;

        return {
          id: course.id,
          title: course.title,
          thumbnail: course.thumbnail,
          instructor: {
            name: course.user.name || 'Unknown',
            avatar: course.user.img,
          },
          progress: {
            overall: overallProgress,
            completed: completedLessons,
            total: totalLessons,
            videosLeft,
            watchTime: totalWatchTime,
          },
          stats: {
            rating: course.averageRating || 0,
            enrolled: course.enrollments.length,
            online: onlineStudents,
            duration: Math.round(totalDuration),
          },
          lastAccessedAt: enrollment.lastAccessedAt.toISOString(),
        };
      })
    );

    // Process created courses
    const createdCourses = await Promise.all(
      createdData.map(async (course) => {
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

        const notStarted = studentStats.filter(s => s.status === 'not_started').length;
        const inProgress = studentStats.filter(s => s.status === 'in_progress').length;
        const completed = studentStats.filter(s => s.status === 'completed').length;
        const online = studentStats.filter(s => s.isOnline).length;

        const averageRating = course.ratings.length > 0
          ? course.ratings.reduce((sum, r) => sum + r.rating, 0) / course.ratings.length
          : 0;

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
      data: {
        enrolledCourses,
        createdCourses,
        userGoals: {
          hasCompletedOnboarding: !!userGoals,
          purpose: userGoals?.purpose,
          monthlyGoal: userGoals?.monthlyGoal,
          timeCommitment: userGoals?.timeCommitment,
        },
        summary: {
          totalEnrolled: enrolledCourses.length,
          totalCreated: createdCourses.length,
          totalStudents: createdCourses.reduce((sum, c) => sum + c.stats.totalStudents, 0),
          totalEarnings: createdCourses.reduce((sum, c) => sum + parseFloat(c.stats.earnings), 0).toFixed(2),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}