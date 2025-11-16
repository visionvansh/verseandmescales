// src/lib/cache/course-cache.ts
import { redis, CACHE_TIMES } from '@/lib/redis';

export const COURSE_CACHE_TIMES = {
  PUBLIC_COURSES: 30, // Authenticated users
  PUBLIC_COURSES_ANONYMOUS: 60, // ✅ CHANGED: 60s (was 30s) - longer for stability
  COURSE_DETAIL: 45, // Authenticated users  
  COURSE_DETAIL_ANONYMOUS: 60, // ✅ CHANGED: 60s (was 30s) - longer for stability
  USER_AVATARS: 60 * 30,
  ENROLLMENT_STATUS: 20,
  COURSE_STATS: 25,
  USER_PROFILE: 60 * 20,
};

// ✅ FIX: Separate public and user-specific cache keys
export const courseCacheKeys = {
  // ✅ NEW: Public cache (same for everyone, no userId)
  publicCoursesAnonymous: () => 'courses:public:list:anonymous',
  
  // ✅ CHANGED: User-specific cache (for enrollment status)
  publicCoursesUser: (userId: string) => `courses:public:list:user:${userId}`,
  
  // ✅ NEW: Helper to get correct key
  publicCourses: (userId?: string) => 
    userId 
      ? courseCacheKeys.publicCoursesUser(userId) 
      : courseCacheKeys.publicCoursesAnonymous(),
  
  // Same for course detail
  courseDetailAnonymous: (id: string) => `courses:detail:${id}:anonymous`,
  courseDetailUser: (id: string, userId: string) => `courses:detail:${id}:user:${userId}`,
  courseDetail: (id: string, userId?: string) => 
    userId 
      ? courseCacheKeys.courseDetailUser(id, userId) 
      : courseCacheKeys.courseDetailAnonymous(id),
  
  userAvatars: (userId: string) => `user:avatars:${userId}`,
  enrollmentStatus: (userId: string, courseId: string) => 
    `enrollment:${userId}:${courseId}`,
  courseStats: (courseId: string) => `course:stats:${courseId}`,
  userProfile: (username: string) => `user:profile:${username}`,
  bulkEnrollments: (userId: string) => `enrollments:bulk:${userId}`,
};

// ✅ FIX: Disable stale for anonymous users completely
export async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number,
  useStale: boolean = false
): Promise<T> {
  try {
    const cached = await redis.get(key);
    
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        
        if (parsed && typeof parsed === 'object' && 'data' in parsed && '_timestamp' in parsed) {
          const age = Date.now() - parsed._timestamp;
          const revivedData = reviveCachedData(parsed.data);
          
          // ✅ FIX: Use 90% of TTL for anonymous, 80% for authenticated
          const freshnessThreshold = useStale 
            ? (ttl * 800)  // 80% for authenticated (can use slightly stale)
            : (ttl * 900); // 90% for anonymous (keep very fresh)
          
          if (age < freshnessThreshold) {
            console.log(`✅ Cache HIT: ${key} (${age}ms old, threshold: ${freshnessThreshold}ms, ${useStale ? 'user' : 'anonymous'})`);
            return revivedData;
          }
          
          // ✅ For authenticated users with stale-while-revalidate
          if (useStale && age < ttl * 1000) { // Within actual TTL
            console.log(`⚠️ Cache STALE: ${key} (${age}ms old), refreshing in background...`);
            refreshCache(key, fetchFn, ttl).catch(err => 
              console.error(`Background refresh failed for ${key}:`, err)
            );
            return revivedData; // Return stale data while refreshing
          }
          
          console.log(`❌ Cache EXPIRED: ${key} (${age}ms old, threshold: ${freshnessThreshold}ms, ${useStale ? 'user' : 'anonymous'}), fetching fresh...`);
        }
      } catch (parseError) {
        console.error(`Failed to parse cache for ${key}:`, parseError);
      }
    }
    
    console.log(`🔄 Cache MISS: ${key}, fetching fresh...`);
    return await refreshCache(key, fetchFn, ttl);
  } catch (error) {
    console.error(`Cache error for ${key}:`, error);
    return await fetchFn();
  }
}

// ✅ FIX: Comprehensive cache invalidation
export async function invalidateCourseCaches(courseId: string, userId?: string) {
  try {
    console.log(`🧹 Invalidating caches for course ${courseId}...`);
    
    const keys: string[] = [
      // ✅ CRITICAL: Invalidate anonymous cache first
      courseCacheKeys.publicCoursesAnonymous(),
      courseCacheKeys.courseDetailAnonymous(courseId),
      courseCacheKeys.courseStats(courseId),
    ];
    
    // If user provided, also invalidate user-specific caches
    if (userId) {
      keys.push(
        courseCacheKeys.publicCoursesUser(userId),
        courseCacheKeys.courseDetailUser(courseId, userId),
        courseCacheKeys.enrollmentStatus(userId, courseId),
        courseCacheKeys.bulkEnrollments(userId)
      );
    } else {
      // ✅ NEW: If no userId, invalidate ALL user-specific caches for this course
      const pattern = `courses:detail:${courseId}:user:*`;
      const userKeys = await redis.keys(pattern);
      keys.push(...userKeys);
      
      // Also invalidate all user list caches
      const userListKeys = await redis.keys('courses:public:list:user:*');
      keys.push(...userListKeys);
    }
    
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`✅ Invalidated ${keys.length} cache keys (including anonymous)`);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to invalidate course caches:', error);
    return false;
  }
}

// ✅ NEW: Invalidate user-specific caches
export async function invalidateUserCaches(userId: string) {
  try {
    console.log(`🧹 Invalidating caches for user ${userId}...`);
    
    const keys: string[] = [
      courseCacheKeys.userAvatars(userId),
      courseCacheKeys.bulkEnrollments(userId),
      courseCacheKeys.publicCourses(userId),
    ];
    
    // ✅ Also invalidate course detail caches for enrolled courses
    const enrollments = await redis.get(courseCacheKeys.bulkEnrollments(userId));
    if (enrollments) {
      try {
        const enrolledCourseIds: string[] = JSON.parse(enrollments).data || [];
        enrolledCourseIds.forEach(courseId => {
          keys.push(courseCacheKeys.courseDetail(courseId, userId));
        });
      } catch (e) {}
    }
    
    await redis.del(...keys);
    console.log(`✅ Invalidated ${keys.length} user cache keys`);
    
    return true;
  } catch (error) {
    console.error('Failed to invalidate user caches:', error);
    return false;
  }
}

// ✅ Keep existing helper functions
function reviveCachedData<T>(data: T): T {
  if (data === null || data === undefined) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => reviveCachedData(item)) as T;
  }
  
  if (typeof data === 'object') {
    const revivedObj: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (key === 'users' || key === 'avatars' || key === 'enrollments') {
        if (Array.isArray(value) && value.length > 0 && Array.isArray(value[0])) {
          revivedObj[key] = new Map(value as any);
          continue;
        }
      }
      
      const isDateField = 
        key.endsWith('At') || 
        key.endsWith('Date') || 
        key === 'createdAt' || 
        key === 'updatedAt';
      
      if (isDateField && typeof value === 'string') {
        const dateValue = new Date(value);
        revivedObj[key] = isNaN(dateValue.getTime()) ? value : dateValue;
      } else if (value !== null && typeof value === 'object') {
        revivedObj[key] = reviveCachedData(value);
      } else {
        revivedObj[key] = value;
      }
    }
    
    return revivedObj as T;
  }
  
  return data;
}

async function refreshCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number
): Promise<T> {
  try {
    const freshData = await fetchFn();
    
    if (freshData === null || freshData === undefined) {
      console.warn(`⚠️ Refusing to cache null/undefined for ${key}`);
      return freshData;
    }
    
    const serializableData = serializeMapsForCache(freshData);
    
    const dataToCache = {
      data: serializableData,
      _timestamp: Date.now(),
    };
    
    await redis.set(key, JSON.stringify(dataToCache), 'EX', ttl);
    console.log(`💾 Cached: ${key} (TTL: ${ttl}s)`);
    
    return freshData;
  } catch (error) {
    console.error(`Failed to refresh cache for ${key}:`, error);
    throw error;
  }
}

function serializeMapsForCache(data: any): any {
  if (data === null || data === undefined) return data;
  if (data instanceof Map) return Array.from(data.entries());
  if (Array.isArray(data)) return data.map(item => serializeMapsForCache(item));
  if (typeof data === 'object') {
    const serialized: any = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeMapsForCache(value);
    }
    return serialized;
  }
  return data;
}

// ✅ Keep other functions...
export async function invalidateCourseCache(courseId?: string) {
  if (courseId) {
    return await invalidateCourseCaches(courseId);
  }
  return false;
}

export async function invalidateUserCache(userId: string, username?: string) {
  return await invalidateUserCaches(userId);
}