// src/lib/cache/course-cache.ts
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

// ✅ Wrapper to preserve data structure
interface CachedData<T> {
  data: T;
  _timestamp: number;
}

// ✅ NEW: Helper to revive Date objects from JSON
function reviveDates<T>(data: T): T {
  if (data === null || data === undefined) return data;
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => reviveDates(item)) as T;
  }
  
  // Handle objects
  if (typeof data === 'object') {
    const revivedObj: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Check if the key suggests it's a date field
      const isDateField = 
        key.endsWith('At') || 
        key.endsWith('Date') || 
        key === 'createdAt' || 
        key === 'updatedAt' ||
        key === 'lastActiveAt' ||
        key === 'earnedAt' ||
        key === 'dateJoined';
      
      if (isDateField && typeof value === 'string') {
        // Try to parse as date
        const dateValue = new Date(value);
        revivedObj[key] = isNaN(dateValue.getTime()) ? value : dateValue;
      } else if (value !== null && typeof value === 'object') {
        // Recursively revive nested objects
        revivedObj[key] = reviveDates(value);
      } else {
        revivedObj[key] = value;
      }
    }
    
    return revivedObj as T;
  }
  
  return data;
}

// ✅ FIXED: Multi-layer cache with Date revival
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
      try {
        const parsed: CachedData<T> = JSON.parse(cached);
        
        // ✅ Validate parsed data structure
        if (parsed && typeof parsed === 'object' && 'data' in parsed && '_timestamp' in parsed) {
          const age = Date.now() - parsed._timestamp;
          
          // ✅ NEW: Revive Date objects
          const revivedData = reviveDates(parsed.data);
          
          // If data is fresh, return immediately
          if (age < ttl * 500) {
            console.log(`✅ Returning fresh cached data for ${key}`);
            return revivedData;
          }
          
          // If using stale-while-revalidate, return stale data and refresh in background
          if (useStale && age < ttl * 2000) {
            console.log(`⚠️ Returning stale cached data for ${key}, refreshing in background`);
            
            // Refresh in background (don't await)
            refreshCache(key, fetchFn, ttl).catch(err => 
              console.error(`Background refresh failed for ${key}:`, err)
            );
            
            return revivedData;
          }
          
          console.log(`⏰ Cached data for ${key} is too old (${age}ms), fetching fresh`);
        } else {
          console.warn(`⚠️ Invalid cache structure for ${key}, fetching fresh`);
        }
      } catch (parseError) {
        console.error(`Failed to parse cached data for ${key}:`, parseError);
        // Continue to fetch fresh data
      }
    } else {
      console.log(`🔍 No cached data found for ${key}`);
    }
    
    // Layer 2: Fetch fresh data
    return await refreshCache(key, fetchFn, ttl);
  } catch (error) {
    console.error(`Cache error for ${key}:`, error);
    // ✅ Always fetch fresh data on cache error
    try {
      console.log(`🔄 Fetching fresh data after cache error for ${key}`);
      return await fetchFn();
    } catch (fetchError) {
      console.error(`Fetch function failed for ${key}:`, fetchError);
      throw fetchError;
    }
  }
}

// ✅ Refresh cache helper with proper data structure
async function refreshCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number
): Promise<T> {
  try {
    console.log(`🔄 Refreshing cache for ${key}`);
    const freshData = await fetchFn();
    
    // ✅ Validate data before caching
    if (freshData === null || freshData === undefined) {
      console.warn(`⚠️ Refusing to cache null/undefined data for ${key}`);
      return freshData;
    }
    
    // ✅ Wrap data properly to preserve structure
    const dataToCache: CachedData<T> = {
      data: freshData,
      _timestamp: Date.now(),
    };
    
    console.log(`💾 Caching data for ${key} (TTL: ${ttl}s)`);
    
    // Cache the wrapped data
    await redis.set(key, JSON.stringify(dataToCache), 'EX', ttl);
    
    return freshData;
  } catch (error) {
    console.error(`Failed to refresh cache for ${key}:`, error);
    throw error;
  }
}

// ✅ Batch cache operations with Date revival
export async function getBatchCached<T>(
  keys: string[],
  fetchMap: Map<string, () => Promise<T>>,
  ttl: number
): Promise<Map<string, T>> {
  const results = new Map<string, T>();
  
  if (keys.length === 0) return results;
  
  try {
    // Get all from cache
    const cached = await redis.mget(...keys);
    const missingKeys: string[] = [];
    
    keys.forEach((key, index) => {
      const value = cached[index];
      if (value) {
        try {
          const parsed: CachedData<T> = JSON.parse(value);
          if (parsed && 'data' in parsed) {
            // ✅ NEW: Revive Date objects
            const revivedData = reviveDates(parsed.data);
            results.set(key, revivedData);
          } else {
            missingKeys.push(key);
          }
        } catch (e) {
          console.error(`Failed to parse cached value for ${key}:`, e);
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
          
          try {
            const data = await fetchFn();
            const dataToCache: CachedData<T> = {
              data: data,
              _timestamp: Date.now(),
            };
            
            pipeline.set(key, JSON.stringify(dataToCache), 'EX', ttl);
            results.set(key, data);
          } catch (error) {
            console.error(`Failed to fetch data for ${key}:`, error);
          }
        })
      );
      
      await pipeline.exec();
    }
  } catch (error) {
    console.error('Batch cache operation failed:', error);
  }
  
  return results;
}

// ✅ Invalidate course cache
export async function invalidateCourseCache(courseId?: string) {
  try {
    const keys: string[] = [courseCacheKeys.publicCourses()];
    
    if (courseId) {
      keys.push(courseCacheKeys.courseDetail(courseId));
      keys.push(courseCacheKeys.courseStats(courseId));
    }
    
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`✅ Invalidated cache for ${keys.length} keys`);
    }
  } catch (error) {
    console.error('Failed to invalidate course cache:', error);
  }
}

// ✅ Invalidate user cache
export async function invalidateUserCache(userId: string, username?: string) {
  try {
    const keys: string[] = [
      courseCacheKeys.userAvatars(userId),
      courseCacheKeys.bulkEnrollments(userId),
    ];
    
    if (username) {
      keys.push(courseCacheKeys.userProfile(username));
    }
    
    await redis.del(...keys);
    console.log(`✅ Invalidated user cache for ${keys.length} keys`);
  } catch (error) {
    console.error('Failed to invalidate user cache:', error);
  }
}