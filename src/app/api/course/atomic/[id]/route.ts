// app/api/course/atomic/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import { loadCompleteCourseDetail } from '@/lib/loaders/course-detail-loader';
import  prisma  from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('⚡ Atomic course detail API called for:', id);
    const startTime = Date.now();

    // ✅ REMOVED: User authentication - everyone gets same data
    const atomicData = await loadCompleteCourseDetail(id);

    // ✅ Fetch current user avatars separately (not cached)
    const user = await getAuthUser(request);
    const currentUserAvatars = user?.id 
      ? await prisma.avatar.findMany({
          where: { userId: user.id },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
          select: {
            id: true,
            avatarIndex: true,
            avatarSeed: true,
            avatarStyle: true,
            isPrimary: true,
            isCustomUpload: true,
            customImageUrl: true,
          },
        })
      : [];

    const totalTime = Date.now() - startTime;
    console.log(`⚡ Atomic course detail API completed in ${totalTime}ms`);

    return NextResponse.json(
      {
        ...atomicData,
        currentUserAvatars, // ✅ Still include avatars
        loadTime: totalTime,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // ✅ Can cache now!
          'X-Load-Time': String(totalTime),
        },
      }
    );
  } catch (error) {
    console.error('❌ Atomic course detail API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to load course',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 404 }
    );
  }
}