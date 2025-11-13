// src/lib/course-cache.ts
import { redis, CACHE_TIMES } from '@/lib/redis';

// ✅ Course-specific cache times
export const COURSE_CACHE_TIMES = {
  PUBLIC_COURSES: 60 * 10, // 10 minutes
  COURSE_DETAIL: 60 * 15, // 15 minutes
  USER_AVATARS: 60 * 30, // 30 minutes
  ENROLLMENT_STATUS: 60 * 5, // 5 minutes
  COURSE_STATS: 60 * 5, // 5 minutes
  USER_PROFILE: 60 * 20, // 20 minutes
};

// ✅ Cache key generators
export const courseCacheKeys = {
  publicCourses: () => 'courses:public:list',
  courseDetail: (id: string) => `courses:detail:${id}`,
  userAvatars: (userId: string) => `user:avatars:${userId}`,
  enrollmentStatus: (userId: string, courseId: string) => 
    `enrollment:${userId}:${courseId}`,
  courseStats: (courseId: string) => `course:stats:${courseId}`,
  userProfile: (username: string) => `user:profile:${username}`,
  bulkEnrollments: (userId: string) => `enrollments:bulk:${userId}`,
};

// ✅ Multi-layer cache with stale-while-revalidate
export async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number,
  useStale: boolean = true
): Promise<T> {
  try {
    // Layer 1: Try cache first
    const cached = await redis.get(key);
    
    if (cached) {
      const parsed = JSON.parse(cached);
      const timestamp = parsed._timestamp || 0;
      const age = Date.now() - timestamp;
      
      // If data is fresh, return immediately
      if (age < ttl * 500) {
        const { _timestamp, ...data } = parsed;
        return data as T;
      }
      
      // If using stale-while-revalidate, return stale data and refresh in background
      if (useStale && age < ttl * 2000) {
        const { _timestamp, ...data } = parsed;
        
        // Refresh in background (don't await)
        refreshCache(key, fetchFn, ttl).catch(err => 
          console.error(`Background refresh failed for ${key}:`, err)
        );
        
        return data as T;
      }
    }
    
    // Layer 2: Fetch fresh data
    return await refreshCache(key, fetchFn, ttl);
  } catch (error) {
    console.error(`Cache error for ${key}:`, error);
    return await fetchFn();
  }
}

// ✅ Refresh cache helper
async function refreshCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number
): Promise<T> {
  const freshData = await fetchFn();
  
  const dataToCache = {
    ...freshData,
    _timestamp: Date.now(),
  };
  
  await redis.set(key, JSON.stringify(dataToCache), 'EX', ttl);
  
  const { _timestamp, ...data } = dataToCache;
  return data as T;
}

// ✅ Batch cache operations
export async function getBatchCached<T>(
  keys: string[],
  fetchMap: Map<string, () => Promise<T>>,
  ttl: number
): Promise<Map<string, T>> {
  const results = new Map<string, T>();
  
  if (keys.length === 0) return results;
  
  // Get all from cache
  const cached = await redis.mget(...keys);
  const missingKeys: string[] = [];
  
  keys.forEach((key, index) => {
    const value = cached[index];
    if (value) {
      try {
        const parsed = JSON.parse(value);
        const { _timestamp, ...data } = parsed;
        results.set(key, data as T);
      } catch (e) {
        missingKeys.push(key);
      }
    } else {
      missingKeys.push(key);
    }
  });
  
  // Fetch missing data in parallel
  if (missingKeys.length > 0) {
    const pipeline = redis.pipeline();
    
    await Promise.all(
      missingKeys.map(async (key) => {
        const fetchFn = fetchMap.get(key);
        if (!fetchFn) return;
        
        const data = await fetchFn();
        const dataToCache = {
          ...data,
          _timestamp: Date.now(),
        };
        
        pipeline.set(key, JSON.stringify(dataToCache), 'EX', ttl);
        const { _timestamp, ...cleanData } = dataToCache;
        results.set(key, cleanData as T);
      })
    );
    
    await pipeline.exec();
  }
  
  return results;
}

// ✅ Invalidate course cache
export async function invalidateCourseCache(courseId?: string) {
  const keys: string[] = [courseCacheKeys.publicCourses()];
  
  if (courseId) {
    keys.push(courseCacheKeys.courseDetail(courseId));
    keys.push(courseCacheKeys.courseStats(courseId));
  }
  
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// ✅ Invalidate user cache
export async function invalidateUserCache(userId: string, username?: string) {
  const keys: string[] = [
    courseCacheKeys.userAvatars(userId),
    courseCacheKeys.bulkEnrollments(userId),
  ];
  
  if (username) {
    keys.push(courseCacheKeys.userProfile(username));
  }
  
  await redis.del(...keys);
}