// app/api/course/atomic/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import { loadCompleteCoursesData } from '@/lib/loaders/course-page-loader-v2';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    const user = await getAuthUser(request);
    
    const atomicData = await loadCompleteCoursesData(user?.id);
    const totalTime = Date.now() - startTime;

    console.log(`⚡ Atomic API completed in ${totalTime}ms`);

    // ✅ FIX: Safely convert to object - handle both Map and already-object cases
    const usersObject = atomicData.users instanceof Map 
      ? Object.fromEntries(atomicData.users)
      : atomicData.users;

    const avatarsObject = atomicData.avatars instanceof Map
      ? Object.fromEntries(atomicData.avatars)
      : atomicData.avatars;

    const enrollmentsObject = atomicData.enrollments instanceof Map
      ? Object.fromEntries(atomicData.enrollments)
      : atomicData.enrollments;

    return NextResponse.json(
      {
        courses: atomicData.courses,
        users: usersObject,
        avatars: avatarsObject,
        enrollments: enrollmentsObject,
        timestamp: atomicData.timestamp,
        loadTime: totalTime,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'CDN-Cache-Control': 'max-age=600',
          'Vercel-CDN-Cache-Control': 'max-age=600',
          'X-Load-Time': String(totalTime),
        },
      }
    );
  } catch (error) {
    console.error('❌ Atomic API error:', error);
    return NextResponse.json(
      { error: 'Failed to load courses' },
      { status: 500 }
    );
  }
}