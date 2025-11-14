// app/api/course/rating/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/utils/auth';
import { invalidateCourseCache } from '@/lib/cache/course-cache';
import { redis } from '@/lib/redis';

// Type definitions
type CourseEnrollment = {
  courseId: string;
  userId: string;
};

type Course = {
  userId: string;
  homepage: {
    id: string;
  } | null;
};

type CourseRating = {
  id: string;
  courseId: string;
  userId: string;
  rating: number;
  review: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    surname: string | null;
    username: string | null;
    img: string | null;
  };
};

type RatingRecord = {
  rating: number;
};

// ✅ Cache keys for ratings
const ratingCacheKeys = {
  courseRatings: (courseId: string) => `course:ratings:${courseId}`,
  userRating: (courseId: string, userId: string) => `course:rating:${courseId}:${userId}`,
  ratingStats: (courseId: string) => `course:rating:stats:${courseId}`,
};

// ✅ Helper: Calculate rating stats
async function calculateRatingStats(courseId: string) {
  const allRatings = await prisma.courseRating.findMany({
    where: { courseId },
    select: { rating: true },
  }) as RatingRecord[];

  const averageRating = allRatings.length > 0
    ? allRatings.reduce((sum: number, r: RatingRecord) => sum + r.rating, 0) / allRatings.length
    : 0;

  const ratingBreakdown = {
    5: allRatings.filter((r: RatingRecord) => r.rating === 5).length,
    4: allRatings.filter((r: RatingRecord) => r.rating === 4).length,
    3: allRatings.filter((r: RatingRecord) => r.rating === 3).length,
    2: allRatings.filter((r: RatingRecord) => r.rating === 2).length,
    1: allRatings.filter((r: RatingRecord) => r.rating === 1).length,
  };

  return {
    averageRating: parseFloat(averageRating.toFixed(1)),
    totalRatings: allRatings.length,
    ratingBreakdown,
  };
}

// ✅ Helper: Update course average rating
async function updateCourseRating(courseId: string, averageRating: number) {
  try {
    // Update Course table
    await prisma.course.update({
      where: { id: courseId },
      data: { averageRating },
    });

    // Update CourseStats if homepage exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { 
        userId: true,
        homepage: { select: { id: true } }
      },
    });

    if (course?.homepage?.id) {
      await prisma.courseStats.upsert({
        where: { homepageId: course.homepage.id },
        update: { courseRating: averageRating },
        create: {
          homepageId: course.homepage.id,
          userId: course.userId,
          courseRating: averageRating,
        },
      });
    }

    console.log(`✅ Updated course ${courseId} rating to ${averageRating}`);
  } catch (error) {
    console.error('⚠️ Failed to update course rating:', error);
  }
}

// ✅ Helper: Invalidate all rating caches
async function invalidateRatingCaches(courseId: string, userId?: string) {
  try {
    const keys = [
      ratingCacheKeys.courseRatings(courseId),
      ratingCacheKeys.ratingStats(courseId),
    ];
    
    if (userId) {
      keys.push(ratingCacheKeys.userRating(courseId, userId));
    }
    
    await redis.del(...keys);
    
    // ✅ Invalidate course cache to update cards immediately
    await invalidateCourseCache(courseId);
    
    console.log(`✅ Invalidated ${keys.length} rating cache keys`);
  } catch (error) {
    console.error('⚠️ Failed to invalidate rating caches:', error);
  }
}

// ============================================
// POST - Submit or Update Course Rating
// ============================================
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { courseId, rating, review } = body;

    // Validation
    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId: user.id,
        },
      },
    }) as CourseEnrollment | null;

    if (!enrollment) {
      return NextResponse.json(
        { error: 'You must be enrolled in this course to rate it' },
        { status: 403 }
      );
    }

    // Check if user is the course owner
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { 
        userId: true,
        homepage: { select: { id: true } }
      },
    }) as Course | null;

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    if (course.userId === user.id) {
      return NextResponse.json(
        { error: 'You cannot rate your own course' },
        { status: 403 }
      );
    }

    // Upsert rating (create or update)
    const courseRating = await prisma.courseRating.upsert({
      where: {
        courseId_userId: {
          courseId,
          userId: user.id,
        },
      },
      update: {
        rating,
        review: review || null,
        updatedAt: new Date(),
      },
      create: {
        courseId,
        userId: user.id,
        rating,
        review: review || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            username: true,
            img: true,
          },
        },
      },
    }) as CourseRating;

    // ✅ Calculate new stats
    const stats = await calculateRatingStats(courseId);

    // ✅ Update course rating in DB
    await updateCourseRating(courseId, stats.averageRating);

    // ✅ Invalidate all rating caches (this will update /courses cards immediately)
    await invalidateRatingCaches(courseId, user.id);

    console.log(`✅ Rating submitted for course ${courseId} by user ${user.id}`);

    return NextResponse.json({
      success: true,
      rating: courseRating,
      averageRating: stats.averageRating,
      totalRatings: stats.totalRatings,
    });
  } catch (error) {
    console.error('❌ Error submitting rating:', error);
    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: 500 }
    );
  }
}

// ============================================
// GET - Get User's Rating for a Course (with caching)
// ============================================
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // ✅ Try cache first
    const statsCacheKey = ratingCacheKeys.ratingStats(courseId);
    const userRatingCacheKey = ratingCacheKeys.userRating(courseId, user.id);

    try {
      const [cachedStats, cachedUserRating] = await Promise.all([
        redis.get(statsCacheKey),
        redis.get(userRatingCacheKey),
      ]);

      if (cachedStats && cachedUserRating !== null) {
        console.log(`✅ Returning cached rating data for course ${courseId}`);
        
        const stats = JSON.parse(cachedStats);
        const userRating = cachedUserRating === 'null' ? null : JSON.parse(cachedUserRating);

        return NextResponse.json({
          userRating,
          ...stats,
        });
      }
    } catch (cacheError) {
      console.error('⚠️ Cache read error:', cacheError);
    }

    // ✅ Fetch from DB if not cached
    const [userRating, stats] = await Promise.all([
      prisma.courseRating.findUnique({
        where: {
          courseId_userId: {
            courseId,
            userId: user.id,
          },
        },
      }) as Promise<CourseRating | null>,
      calculateRatingStats(courseId),
    ]);

    // ✅ Cache the results (5 minutes)
    try {
      await Promise.all([
        redis.set(statsCacheKey, JSON.stringify(stats), 'EX', 300),
        redis.set(userRatingCacheKey, JSON.stringify(userRating), 'EX', 300),
      ]);
    } catch (cacheError) {
      console.error('⚠️ Cache write error:', cacheError);
    }

    return NextResponse.json({
      userRating: userRating || null,
      ...stats,
    });
  } catch (error) {
    console.error('❌ Error fetching rating:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rating' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Delete User's Rating
// ============================================
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Delete rating
    await prisma.courseRating.delete({
      where: {
        courseId_userId: {
          courseId,
          userId: user.id,
        },
      },
    });

    // ✅ Recalculate stats
    const stats = await calculateRatingStats(courseId);

    // ✅ Update course rating
    await updateCourseRating(courseId, stats.averageRating);

    // ✅ Invalidate caches (updates /courses cards immediately)
    await invalidateRatingCaches(courseId, user.id);

    console.log(`✅ Rating deleted for course ${courseId} by user ${user.id}`);

    return NextResponse.json({
      success: true,
      averageRating: stats.averageRating,
      totalRatings: stats.totalRatings,
    });
  } catch (error) {
    console.error('❌ Error deleting rating:', error);
    return NextResponse.json(
      { error: 'Failed to delete rating' },
      { status: 500 }
    );
  }
}