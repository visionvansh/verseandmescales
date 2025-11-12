// app/api/course/rating/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/utils/auth';

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

    // Check if user is the course owner and get homepage info
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { 
        userId: true,
        homepage: {
          select: { id: true }
        }
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

    // Calculate new average rating
    const allRatings = await prisma.courseRating.findMany({
      where: { courseId },
      select: { rating: true },
    }) as RatingRecord[];

    const averageRating = allRatings.length > 0
      ? allRatings.reduce((sum: number, r: RatingRecord) => sum + r.rating, 0) / allRatings.length
      : 0;

    // ✅ FIX: Only update CourseStats if homepage exists
    if (course.homepage?.id) {
      try {
        await prisma.courseStats.upsert({
          where: { homepageId: course.homepage.id },
          update: {
            courseRating: parseFloat(averageRating.toFixed(1)),
          },
          create: {
            homepageId: course.homepage.id,
            userId: course.userId,
            courseRating: parseFloat(averageRating.toFixed(1)),
          },
        });
      } catch (statsError) {
        console.error('⚠️ Failed to update course stats:', statsError);
        // Don't fail the whole request if stats update fails
      }
    }

    return NextResponse.json({
      success: true,
      rating: courseRating,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalRatings: allRatings.length,
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
// GET - Get User's Rating for a Course
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

    // Get user's existing rating
    const userRating = await prisma.courseRating.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId: user.id,
        },
      },
    }) as CourseRating | null;

    // Get course rating stats
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

    return NextResponse.json({
      userRating: userRating || null,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalRatings: allRatings.length,
      ratingBreakdown,
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

    // Recalculate average
    const allRatings = await prisma.courseRating.findMany({
      where: { courseId },
      select: { rating: true },
    }) as RatingRecord[];

    const averageRating = allRatings.length > 0
      ? allRatings.reduce((sum: number, r: RatingRecord) => sum + r.rating, 0) / allRatings.length
      : 0;

    // Update CourseStats - only if homepage exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { 
        userId: true,
        homepage: {
          select: { id: true }
        }
      },
    }) as Course | null;

    // ✅ FIX: Only update CourseStats if homepage exists
    if (course?.homepage?.id) {
      try {
        await prisma.courseStats.upsert({
          where: { homepageId: course.homepage.id },
          update: {
            courseRating: parseFloat(averageRating.toFixed(1)),
          },
          create: {
            homepageId: course.homepage.id,
            userId: course.userId,
            courseRating: parseFloat(averageRating.toFixed(1)),
          },
        });
      } catch (statsError) {
        console.error('⚠️ Failed to update course stats:', statsError);
        // Don't fail the whole request if stats update fails
      }
    }

    return NextResponse.json({
      success: true,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalRatings: allRatings.length,
    });
  } catch (error) {
    console.error('❌ Error deleting rating:', error);
    return NextResponse.json(
      { error: 'Failed to delete rating' },
      { status: 500 }
    );
  }
}