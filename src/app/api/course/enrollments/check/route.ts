// src/app/api/course/enrollments/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import {
  getCachedData,
  courseCacheKeys,
  COURSE_CACHE_TIMES,
} from '@/lib/cache/course-cache';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ✅ Cached enrollment check
async function fetchUserEnrollments(userId: string) {
  console.log('🔄 Fetching enrollments from database for user:', userId);

  const enrollments = await prisma.courseEnrollment.findMany({
    where: {
      userId: userId,
    },
    select: {
      courseId: true,
    },
  });

  const enrollmentMap: Record<string, boolean> = {};
  enrollments.forEach((enrollment) => {
    enrollmentMap[enrollment.courseId] = true;
  });

  console.log('✅ Fetched enrollments from DB');
  return enrollmentMap;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ enrollments: {} }, { status: 200 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { courseIds } = await request.json();

    if (!courseIds || !Array.isArray(courseIds)) {
      return NextResponse.json(
        { error: 'Course IDs array is required' },
        { status: 400 }
      );
    }

    // ✅ Use cache for user's all enrollments, then filter for requested courseIds
    const fullEnrollments = await getCachedData(
      courseCacheKeys.bulkEnrollments(decoded.userId),
      () => fetchUserEnrollments(decoded.userId),
      COURSE_CACHE_TIMES.ENROLLMENT_STATUS,
      true
    );

    // Create response map only for requested courseIds (matching original behavior: only enrolled ones are true/ present)
    const enrollments: Record<string, boolean> = {};
    courseIds.forEach((courseId: string) => {
      if (fullEnrollments[courseId]) {
        enrollments[courseId] = true;
      }
    });

    return NextResponse.json({ enrollments });

  } catch (error: unknown) {
    console.error('Check enrollments error:', error);
    return NextResponse.json(
      { error: 'Failed to check enrollments' },
      { status: 500 }
    );
  }
}