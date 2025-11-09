// src/app/api/course/check-enrollment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', enrolled: false },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID required', enrolled: false },
        { status: 400 }
      );
    }

    // ✅ Check enrollment
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
    });

    // ✅ Check if user is course owner
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { userId: true },
    });

    const isOwner = course?.userId === userId;

    return NextResponse.json({
      enrolled: !!enrollment && enrollment.status === 'active',
      isOwner,
      status: enrollment?.status || null,
    });

  } catch (error: any) {
    console.error('Enrollment check error:', error);
    return NextResponse.json(
      { error: 'Failed to check enrollment', enrolled: false },
      { status: 500 }
    );
  }
}