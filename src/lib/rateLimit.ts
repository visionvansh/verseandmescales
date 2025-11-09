// lib/rate-limit.ts
import { redis } from './redis';

const RATE_LIMIT_WINDOW = 60; // 1 minute
const DEFAULT_LIMIT = 60; // 60 requests per minute

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

const LIMITS: Record<string, number> = {
  'password:change': 5, // 5 password change attempts per minute
  '2fa:verify': 10,     // 10 2FA verify attempts per minute
  'login': 10,          // 10 login attempts per minute
  'default': DEFAULT_LIMIT
};

export async function rateLimit(
  identifier: string,
  action: string = 'default'
): Promise<RateLimitResult> {
  const limit = LIMITS[action] || LIMITS.default;
  const key = `ratelimit:${action}:${identifier}`;
  
  // Check if key exists
  const current = await redis.get(key);
  
  if (!current) {
    // First request, set to 1 and expire after window
    await redis.set(key, '1', 'EX', RATE_LIMIT_WINDOW);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.floor(Date.now() / 1000) + RATE_LIMIT_WINDOW
    };
  }
  
  // Increment the counter
  const count = await redis.incr(key);
  
  // Get TTL
  const ttl = await redis.ttl(key);
  
  if (count > limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.floor(Date.now() / 1000) + ttl
    };
  }
  
  return {
    success: true,
    limit,
    remaining: limit - count,
    reset: Math.floor(Date.now() / 1000) + ttl
  };
}