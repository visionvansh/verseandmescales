// app/api/navbar/atomic/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import { loadCompleteNavbarData } from '@/lib/loaders/navbar-loader';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    console.log('⚡ Atomic Navbar API called');
    const startTime = Date.now();

    // Get authenticated user
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { user: null, userGoals: null, primaryAvatar: null, sessions: [] },
        { 
          status: 200,
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          },
        }
      );
    }

    // ✅ Load ALL navbar data atomically
    const atomicData = await loadCompleteNavbarData(user.id);

    const totalTime = Date.now() - startTime;
    console.log(`⚡ Navbar atomic API completed in ${totalTime}ms`);

    return NextResponse.json(
      {
        ...atomicData,
        loadTime: totalTime,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, s-maxage=300, stale-while-revalidate=600',
          'X-Load-Time': String(totalTime),
        },
      }
    );
  } catch (error) {
    console.error('❌ Navbar atomic API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to load navbar data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}