// src/app/api/course/enrollments/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

    // Get all enrollments for the user
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        userId: decoded.userId,
        courseId: {
          in: courseIds,
        },
      },
      select: {
        courseId: true,
      },
    });

    // Create a map of courseId -> isEnrolled
    const enrollmentMap: Record<string, boolean> = {};
    enrollments.forEach((enrollment) => {
      enrollmentMap[enrollment.courseId] = true;
    });

    return NextResponse.json({ enrollments: enrollmentMap });

  } catch (error: unknown) {
    console.error('Check enrollments error:', error);
    return NextResponse.json(
      { error: 'Failed to check enrollments' },
      { status: 500 }
    );
  }
}