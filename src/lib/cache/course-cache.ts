// src/lib/cache/course-cache.ts
import { redis, CACHE_TIMES } from '@/lib/redis';

export const COURSE_CACHE_TIMES = {
  PUBLIC_COURSES: 30, // ✅ REDUCED: 30 seconds (was 5 minutes)
  COURSE_DETAIL: 45, // ✅ REDUCED: 45 seconds (was 10 minutes)
  USER_AVATARS: 60 * 30, // Keep as is
  ENROLLMENT_STATUS: 20, // ✅ REDUCED: 20 seconds (was 2 minutes)
  COURSE_STATS: 25, // ✅ REDUCED: 25 seconds (was 3 minutes)
  USER_PROFILE: 60 * 20, // Keep as is
};

// ✅ FIX: Add userId to cache keys where needed
export const courseCacheKeys = {
  // ✅ CHANGED: Now includes userId for personalized data
  publicCourses: (userId?: string) => 
    userId ? `courses:public:list:user:${userId}` : 'courses:public:list',
  
  // ✅ CHANGED: Now includes userId for enrollment status
  courseDetail: (id: string, userId?: string) => 
    userId ? `courses:detail:${id}:user:${userId}` : `courses:detail:${id}`,
  
  userAvatars: (userId: string) => `user:avatars:${userId}`,
  enrollmentStatus: (userId: string, courseId: string) => 
    `enrollment:${userId}:${courseId}`,
  courseStats: (courseId: string) => `course:stats:${courseId}`,
  userProfile: (username: string) => `user:profile:${username}`,
  bulkEnrollments: (userId: string) => `enrollments:bulk:${userId}`,
};

// ✅ FIX: Disable stale-while-revalidate for user-specific data
export async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number,
  useStale: boolean = false // ✅ CHANGED: Default to false
): Promise<T> {
  try {
    const cached = await redis.get(key);
    
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        
        if (parsed && typeof parsed === 'object' && 'data' in parsed && '_timestamp' in parsed) {
          const age = Date.now() - parsed._timestamp;
          const revivedData = reviveCachedData(parsed.data);
          
          // ✅ FIX: Only return if truly fresh (within 50% of TTL)
          if (age < ttl * 500) {
            console.log(`✅ Cache HIT: ${key} (${age}ms old)`);
            return revivedData;
          }
          
          // ✅ FIX: If stale, ONLY use if explicitly enabled AND within 2x TTL
          if (useStale && age < ttl * 2000) {
            console.log(`⚠️ Cache STALE: ${key}, refreshing...`);
            
            // Refresh in background but return stale
            refreshCache(key, fetchFn, ttl).catch(err => 
              console.error(`Background refresh failed for ${key}:`, err)
            );
            
            return revivedData;
          }
          
          console.log(`❌ Cache EXPIRED: ${key} (${age}ms old)`);
        }
      } catch (parseError) {
        console.error(`Failed to parse cache for ${key}:`, parseError);
      }
    }
    
    // Fetch fresh
    console.log(`🔄 Cache MISS: ${key}, fetching fresh...`);
    return await refreshCache(key, fetchFn, ttl);
  } catch (error) {
    console.error(`Cache error for ${key}:`, error);
    return await fetchFn();
  }
}

// ✅ NEW: Invalidate ALL related caches (comprehensive)
export async function invalidateCourseCaches(courseId: string, userId?: string) {
  try {
    console.log(`🧹 Invalidating caches for course ${courseId}...`);
    
    const keys: string[] = [
      // Global course data
      courseCacheKeys.publicCourses(),
      courseCacheKeys.courseDetail(courseId),
      courseCacheKeys.courseStats(courseId),
    ];
    
    // ✅ If user provided, invalidate user-specific caches
    if (userId) {
      keys.push(
        courseCacheKeys.publicCourses(userId),
        courseCacheKeys.courseDetail(courseId, userId),
        courseCacheKeys.enrollmentStatus(userId, courseId),
        courseCacheKeys.bulkEnrollments(userId)
      );
    }
    
    // ✅ Delete all keys
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`✅ Invalidated ${keys.length} cache keys`);
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