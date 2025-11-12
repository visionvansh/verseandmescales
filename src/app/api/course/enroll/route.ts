// app/api/course/enroll/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';

/**
 * POST /api/course/enroll
 * Enroll user in a course
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Please login to enroll in courses' },
        { status: 401 }
      );
    }

    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID required' },
        { status: 400 }
      );
    }

    // Find the course by ID only
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if course is published
    if (course.status !== 'PUBLISHED' || !course.isPublished) {
      return NextResponse.json(
        { error: 'This course is not available for enrollment' },
        { status: 403 }
      );
    }

    // Check if user is the course owner
    if (course.userId === user.id) {
      return NextResponse.json(
        { 
          error: 'You are the owner of this course',
          isOwner: true,
        },
        { status: 400 }
      );
    }

    // TODO: Check if already enrolled (when you add enrollment tracking table)
    // For now, we'll just return success

    // TODO: Create enrollment record in a CourseEnrollment table
    // You'll need to add this model to your schema

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully enrolled in course',
        course: {
          id: course.id,
          title: course.title,
          owner: {
            name: course.user.name,
            username: course.user.username,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error enrolling in course:', error);
    return NextResponse.json(
      { error: 'Failed to enroll in course' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/course/enroll?id=xxx
 * Check enrollment status
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ enrolled: false, isOwner: false }, { status: 200 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('id');

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID required' },
        { status: 400 }
      );
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const isOwner = course.userId === user.id;

    // TODO: Check actual enrollment when you add the table
    const enrolled = false;

    return NextResponse.json({
      enrolled,
      isOwner,
    }, { status: 200 });
  } catch (error) {
    console.error('Error checking enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to check enrollment status' },
      { status: 500 }
    );
  }
}