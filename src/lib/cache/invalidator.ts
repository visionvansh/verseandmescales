// src/lib/cache/invalidator.ts
import { redis } from '@/lib/redis';
import { courseCacheKeys } from '@/lib/cache/course-cache';

export async function invalidateAllCourseCaches(courseId?: string) {
  try {
    console.log('🧹 [INVALIDATOR] Starting full invalidation...');
    
    const patterns = [
      'courses:public:list*',
      'courses:detail:*',
      'course:stats:*',
      'enrollments:bulk:*',
    ];

    // If specific course, add targeted keys
    if (courseId) {
      patterns.push(`courses:detail:${courseId}*`);
      patterns.push(`course:stats:${courseId}`);
    }

    let deletedCount = 0;
    
    for (const pattern of patterns) {
      try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
          deletedCount += keys.length;
        }
      } catch (err) {
        console.error(`Failed to delete pattern ${pattern}:`, err);
      }
    }
    
    console.log(`✅ [INVALIDATOR] Deleted ${deletedCount} cache keys`);
    return deletedCount;
  } catch (error) {
    console.error('❌ [INVALIDATOR] Failed:', error);
    return 0;
  }
}

export async function invalidateCourseCacheWithBroadcast(courseId: string) {
  await invalidateAllCourseCaches(courseId);
  
  // Trigger WebSocket broadcast
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cache/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'course_update', courseId }),
  }).catch(() => {});
}