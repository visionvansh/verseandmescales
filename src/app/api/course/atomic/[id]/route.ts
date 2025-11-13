// app/api/course/atomic/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import { loadCompleteCourseDetail } from '@/lib/loaders/course-detail-loader-v2';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const startTime = Date.now();
    
    const user = await getAuthUser(request);
    const atomicData = await loadCompleteCourseDetail(id, user?.id);
    
    const totalTime = Date.now() - startTime;
    console.log(`⚡ Course detail API completed in ${totalTime}ms`);

    return NextResponse.json(
      { ...atomicData, loadTime: totalTime },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'CDN-Cache-Control': 'max-age=600',
          'X-Load-Time': String(totalTime),
        },
      }
    );
  } catch (error) {
    console.error('❌ Course detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to load course' },
      { status: 404 }
    );
  }
}