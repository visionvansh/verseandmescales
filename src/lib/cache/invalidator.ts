// src/lib/cache/invalidator.ts
import { redis } from '@/lib/redis';
import { courseCacheKeys } from '@/lib/cache/course-cache';

export async function invalidateAllCourseCaches(courseId?: string) {
  try {
    console.log('🧹 [INVALIDATOR] Starting full invalidation...');
    
    const patterns = [
      // ✅ CRITICAL: Add anonymous cache patterns
      'courses:public:list:anonymous',
      'courses:detail:*:anonymous',
      'courses:public:list*',
      'courses:detail:*',
      'course:stats:*',
      'enrollments:bulk:*',
    ];

    if (courseId) {
      patterns.push(
        `courses:detail:${courseId}*`,
        `course:stats:${courseId}`,
        courseCacheKeys.courseDetailAnonymous(courseId)
      );
    }

    let deletedCount = 0;
    
    for (const pattern of patterns) {
      try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
          deletedCount += keys.length;
          console.log(`  ✅ Deleted ${keys.length} keys for pattern: ${pattern}`);
        }
      } catch (err) {
        console.error(`Failed to delete pattern ${pattern}:`, err);
      }
    }
    
    console.log(`✅ [INVALIDATOR] Total deleted: ${deletedCount} cache keys`);
    return deletedCount;
  } catch (error) {
    console.error('❌ [INVALIDATOR] Failed:', error);
    return 0;
  }
}

export async function invalidateCourseCacheWithBroadcast(courseId: string) {
  await invalidateAllCourseCaches(courseId);
  
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cache/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'course_update', courseId }),
  }).catch(() => {});
}