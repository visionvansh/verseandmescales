// app/api/course/atomic/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import { loadCompleteCoursesData } from '@/lib/loaders/course-page-loader';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    console.log('⚡ Atomic API called');
    const startTime = Date.now();

    // Get user if authenticated
    const user = await getAuthUser(request);
    const userId = user?.id;

    // ✅ Load ALL data atomically
    const atomicData = await loadCompleteCoursesData(userId);

    const totalTime = Date.now() - startTime;
    console.log(`⚡ Atomic API completed in ${totalTime}ms`);

    // Convert Maps to objects for JSON response
    return NextResponse.json(
      {
        courses: atomicData.courses,
        users: Object.fromEntries(atomicData.users),
        avatars: Object.fromEntries(atomicData.avatars),
        enrollments: Object.fromEntries(atomicData.enrollments),
        timestamp: atomicData.timestamp,
        loadTime: totalTime,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, must-revalidate', // ✅ CHANGED: Force fresh
          'X-Load-Time': String(totalTime),
        },
      }
    );
  } catch (error) {
    console.error('❌ Atomic API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to load courses',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}