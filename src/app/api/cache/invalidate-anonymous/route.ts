// src/app/api/cache/invalidate-anonymous/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { courseCacheKeys } from '@/lib/cache/course-cache';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { courseId } = body;

    console.log(`🧹 [API] Invalidating anonymous caches for course: ${courseId || 'all'}`);

    const keys: string[] = [];

    if (courseId) {
      // Specific course
      keys.push(
        courseCacheKeys.courseDetailAnonymous(courseId),
        courseCacheKeys.courseStats(courseId)
      );
    }
    
    // Always invalidate anonymous courses list
    keys.push(courseCacheKeys.publicCoursesAnonymous());

    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`✅ Invalidated ${keys.length} anonymous cache keys`);
    }

    return NextResponse.json({ 
      success: true, 
      invalidated: keys.length,
      message: 'Anonymous caches cleared'
    });
  } catch (error) {
    console.error('❌ Failed to invalidate anonymous caches:', error);
    return NextResponse.json(
      { error: 'Failed to invalidate caches' },
      { status: 500 }
    );
  }
}