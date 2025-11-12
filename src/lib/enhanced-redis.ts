import { redis } from './redis';

// Export redis explicitly
export { redis };

// Cache prefix keys for different types of data
export const CACHE_PREFIX = {
  USER_PROFILE: 'user:profile',
  SESSIONS: 'user:sessions',
  ACTIVITY_LOGS: 'user:activity:logs',
  SECURITY_EVENTS: 'user:security:events',
  DEVICES: 'user:devices',
  PASSWORD: 'user:password',
  TWO_FACTOR: 'user:2fa',
  BIOMETRIC: 'user:biometric',
  RECOVERY: 'user:recovery'
};

// Cache expiry times (in seconds)
export const CACHE_TIMES = {
  SHORT: 60 * 5, // 5 minutes
  MEDIUM: 60 * 15, // 15 minutes
  LONG: 60 * 60, // 1 hour
  PASSWORD_STATUS: 60 * 30, // 30 minutes
  TWO_FACTOR_STATUS: 60 * 10, // 10 minutes
  SESSIONS: 60 * 5, // 5 minutes
  ACTIVITY_LOGS: 60 * 10, // 10 minutes
  SECURITY_EVENTS: 60 * 10 // 10 minutes
};

/**
 * Enhanced cache wrapper with stale-while-revalidate pattern support
 * 
 * @param key Cache key
 * @param fetchFn Function to fetch data if not in cache
 * @param ttl Time to live in seconds
 * @param useStaleWhileRevalidate Whether to use stale-while-revalidate pattern
 * @returns Cached data or freshly fetched data
 */
export async function cacheWrapper<T>(
  key: string, 
  fetchFn: () => Promise<T>, 
  ttl: number = CACHE_TIMES.MEDIUM,
  useStaleWhileRevalidate: boolean = false
): Promise<T> {
  try {
    // Try to get from cache first
    const cachedData = await redis.get(key);
    
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      
      // If using stale-while-revalidate and the data exists,
      // asynchronously refresh the cache for next request
      if (useStaleWhileRevalidate) {
        // Check if we have a timestamp and if it's older than half the TTL
        const now = Date.now();
        const timestamp = parsedData._timestamp || 0;
        
        if (now - timestamp > (ttl * 500)) { // Half of TTL in ms
          // Refresh cache in background
          refreshCache<T>(key, fetchFn, ttl).catch(err => 
            console.warn(`Background cache refresh failed for ${key}:`, err)
          );
        }
      }
      
      // Return the cached data (removing our timestamp)
      const { _timestamp, ...data } = parsedData;
      return data as T;
    }
    
    // If not in cache, fetch fresh data
    return await refreshCache<T>(key, fetchFn, ttl);
  } catch (error) {
    console.error(`Cache error for key ${key}:`, error);
    // If there's a cache error, fall back to direct fetch
    return await fetchFn();
  }
}

// Helper to refresh cache
async function refreshCache<T>(key: string, fetchFn: () => Promise<T>, ttl: number): Promise<T> {
  // Fetch fresh data
  const freshData = await fetchFn();
  
  // Store in cache with timestamp
  const dataToCache = {
    ...freshData,
    _timestamp: Date.now() // Add timestamp for stale check
  };
  
  // Store in Redis with TTL
  await redis.set(
    key,
    JSON.stringify(dataToCache),
    'EX',
    ttl
  );
  
  // Return data without our internal timestamp
  const { _timestamp, ...data } = dataToCache;
  return data as T;
}

// Batch cache getter for multiple keys
export async function batchGetCache(keys: string[]): Promise<Record<string, any>> {
  if (!keys.length) return {};
  
  try {
    const results = await redis.mget(...keys);
    const output: Record<string, any> = {};
    
    keys.forEach((key, index) => {
      const value = results[index];
      if (value) {
        try {
          const parsed = JSON.parse(value);
          // Remove internal timestamp
          const { _timestamp, ...data } = parsed;
          output[key] = data;
        } catch (e) {
          output[key] = null;
        }
      } else {
        output[key] = null;
      }
    });
    
    return output;
  } catch (error) {
    console.error('Batch cache get error:', error);
    return {};
  }
}

// Function to invalidate cache for a user
export async function invalidateUserCache(userId: string): Promise<void> {
  try {
    // Get all keys matching user patterns
    const patterns = [
      `${CACHE_PREFIX.USER_PROFILE}:${userId}*`,
      `${CACHE_PREFIX.SESSIONS}:${userId}*`,
      `${CACHE_PREFIX.ACTIVITY_LOGS}:${userId}*`,
      `${CACHE_PREFIX.SECURITY_EVENTS}:${userId}*`,
      `${CACHE_PREFIX.DEVICES}:${userId}*`,
      `${CACHE_PREFIX.PASSWORD}:${userId}*`,
      `${CACHE_PREFIX.TWO_FACTOR}:${userId}*`,
      `${CACHE_PREFIX.BIOMETRIC}:${userId}*`,
      `${CACHE_PREFIX.RECOVERY}:${userId}*`
    ];
    
    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length) {
        await redis.del(...keys); // ✅ Fixed: spread operator added
      }
    }
  } catch (error) {
    console.error(`Error invalidating user cache for ${userId}:`, error);
  }
}