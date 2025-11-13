// app/api/atomic/complete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import { loadCompleteAtomicData } from '@/lib/loaders/atomic-loader';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    console.log('⚡ Super Atomic API called');
    const startTime = Date.now();

    // Get user and device fingerprint
    const user = await getAuthUser(request);
    const userId = user?.id;
    
    const cookieStore = await cookies();
    const deviceFingerprint = cookieStore.get('device-fingerprint')?.value;

    // ✅ Load EVERYTHING atomically
    const atomicData = await loadCompleteAtomicData(userId, deviceFingerprint);

    const totalTime = Date.now() - startTime;
    console.log(`⚡ Super Atomic API completed in ${totalTime}ms`);

    // Convert Maps to objects for JSON response
    return NextResponse.json(
      {
        user: atomicData.user,
        sessions: atomicData.sessions,
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
          'Cache-Control': 'private, max-age=60, must-revalidate',
          'X-Load-Time': String(totalTime),
        },
      }
    );
  } catch (error) {
    console.error('❌ Super Atomic API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to load data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}