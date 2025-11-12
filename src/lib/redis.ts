import { Redis } from '@upstash/redis';

// Get Redis configuration from environment variables
const getRedisConfig = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set');
  }

  return { url, token };
};

// Create the base Upstash Redis client
const upstashRedis = new Redis(getRedisConfig());

// Pipeline interface to match ioredis - with proper result format
interface PipelineCommand {
  get: (key: string) => PipelineCommand;
  set: (key: string, value: string, ex?: string, ttl?: number) => PipelineCommand;
  del: (key: string) => PipelineCommand;
  ttl: (key: string) => PipelineCommand;
  incr: (key: string) => PipelineCommand;
  expire: (key: string, seconds: number) => PipelineCommand;
  exec: () => Promise<Array<[Error | null, any]>>;
}

// Create a compatibility wrapper to match ioredis API
const createRedisWrapper = () => {
  return {
    // GET - returns string or null (compatible with ioredis)
    async get(key: string): Promise<string | null> {
      const value = await upstashRedis.get(key);
      if (value === null || value === undefined) return null;
      if (typeof value === 'string') return value;
      return JSON.stringify(value);
    },

    // SET - accepts both ioredis style (4 args) and Upstash style (2-3 args)
    async set(key: string, value: string, exOrOptions?: string | number, ttl?: number): Promise<string> {
      if (typeof exOrOptions === 'string' && exOrOptions.toLowerCase() === 'ex' && typeof ttl === 'number') {
        // ioredis style: redis.set(key, value, 'EX', seconds)
        await upstashRedis.set(key, value, { ex: ttl });
      } else if (typeof exOrOptions === 'number') {
        // Direct expiration: redis.set(key, value, seconds)
        await upstashRedis.set(key, value, { ex: exOrOptions });
      } else {
        // No expiration
        await upstashRedis.set(key, value);
      }
      return 'OK';
    },

    // INCR
    async incr(key: string): Promise<number> {
      return await upstashRedis.incr(key);
    },

    // EXPIRE
    async expire(key: string, seconds: number): Promise<number> {
      return await upstashRedis.expire(key, seconds);
    },

    // DEL - accepts single key or multiple keys
    async del(...keys: string[]): Promise<number> {
      return await upstashRedis.del(...keys);
    },

    // MGET - get multiple keys
   async mget(...keys: string[]): Promise<(string | null)[]> {
  if (keys.length === 0) return [];
  const results = await upstashRedis.mget(...keys);
  return results.map(result => {
    if (result === null || result === undefined) return null;
    if (typeof result === 'string') return result;
    return JSON.stringify(result);
  });
},
    // KEYS - pattern matching (use with caution in production)
    async keys(pattern: string): Promise<string[]> {
      return await upstashRedis.keys(pattern);
    },

    // SETEX - set with expiration
    async setex(key: string, seconds: number, value: string): Promise<string> {
      await upstashRedis.set(key, value, { ex: seconds });
      return 'OK';
    },

    // TTL - get time to live
    async ttl(key: string): Promise<number> {
      return await upstashRedis.ttl(key);
    },

    // EXISTS - check if key exists
    async exists(...keys: string[]): Promise<number> {
      return await upstashRedis.exists(...keys);
    },

    // PIPELINE - batch commands (returns ioredis-compatible format)
    pipeline(): PipelineCommand {
      const commands: Array<() => Promise<any>> = [];
      
      const pipelineObj: PipelineCommand = {
        get: (key: string) => {
          commands.push(async () => {
            try {
              const value = await upstashRedis.get(key);
              if (value === null || value === undefined) return null;
              if (typeof value === 'string') return value;
              return JSON.stringify(value);
            } catch (error) {
              throw error;
            }
          });
          return pipelineObj;
        },
        
        set: (key: string, value: string, ex?: string, ttl?: number) => {
          commands.push(async () => {
            try {
              if (typeof ex === 'string' && ex.toLowerCase() === 'ex' && typeof ttl === 'number') {
                await upstashRedis.set(key, value, { ex: ttl });
              } else {
                await upstashRedis.set(key, value);
              }
              return 'OK';
            } catch (error) {
              throw error;
            }
          });
          return pipelineObj;
        },
        
        del: (key: string) => {
          commands.push(async () => {
            try {
              return await upstashRedis.del(key);
            } catch (error) {
              throw error;
            }
          });
          return pipelineObj;
        },
        
        ttl: (key: string) => {
          commands.push(async () => {
            try {
              return await upstashRedis.ttl(key);
            } catch (error) {
              throw error;
            }
          });
          return pipelineObj;
        },
        
        incr: (key: string) => {
          commands.push(async () => {
            try {
              return await upstashRedis.incr(key);
            } catch (error) {
              throw error;
            }
          });
          return pipelineObj;
        },
        
        expire: (key: string, seconds: number) => {
          commands.push(async () => {
            try {
              return await upstashRedis.expire(key, seconds);
            } catch (error) {
              throw error;
            }
          });
          return pipelineObj;
        },
        
        exec: async () => {
          // Execute all commands and return in ioredis format: [Error | null, result]
          const results = await Promise.allSettled(commands.map(cmd => cmd()));
          return results.map(result => {
            if (result.status === 'fulfilled') {
              return [null, result.value] as [null, any];
            } else {
              return [result.reason, null] as [Error, null];
            }
          });
        }
      };
      
      return pipelineObj;
    }
  };
};

// Create a global Redis client
const globalForRedis = global as unknown as { redis: ReturnType<typeof createRedisWrapper> };

// Use existing client or create a new one
export const redis = globalForRedis.redis || createRedisWrapper();

// Keep the client in development
if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

// Cache expiry times (in seconds)
export const CACHE_TIMES = {
  SOCIAL_DATA: 60 * 30, // 30 minutes
  USERNAME_CHECK: 60 * 5, // 5 minutes
  VERIFICATION_CODE: 60 * 10, // 10 minutes
  USER_SESSION: 60 * 60 * 24 * 7, // 7 days
  TEMP_DATA: 60 * 30, // 30 minutes
  TWO_FACTOR_STATUS: 60 * 5, // 5 minutes
  TWO_FACTOR_SETUP: 60 * 10, // 10 minutes
  TRUSTED_DEVICE: 60 * 60 * 24 * 30, // 30 days
  BIOMETRIC_STATUS: 60 * 5, // 5 minutes
  BIOMETRIC_CREDENTIALS: 60 * 5, // 5 minutes
  RECOVERY_STATUS: 60 * 10, // 10 minutes
  DEVICES: 60 * 10, // 10 minutes
  USER_PROFILE: 60 * 15, // 15 minutes
  SESSIONS: 60 * 5, // 5 minutes
  PASSWORD_STATUS: 60 * 5, // 5 minutes
  SHORT: 60 * 5, // 5 minutes
  MEDIUM: 60 * 15, // 15 minutes
  LONG: 60 * 60, // 1 hour
  ACTIVITY_LOGS: 60 * 10, // 10 minutes
  SECURITY_EVENTS: 60 * 10, // 10 minutes
};

// Cache keys helper functions for the entire application
export const cacheKeys = {
  socialData: (token: string) => `social:data:${token}`,
  usernameCheck: (username: string) => `username:check:${username}`,
  phoneVerification: (phone: string) => `phone:verification:${phone}`,
  userSession: (sessionId: string) => `user:session:${sessionId}`,
  userProfile: (userId: string) => `user:profile:${userId}`,
  twoFactorStatus: (userId: string) => `2fa:status:${userId}`,
  twoFactorSetup: (userId: string) => `2fa:setup:${userId}`,
  twoFactorSession: (sessionId: string) => `2fa:session:${sessionId}`,
  trustedDevice: (userId: string, deviceId: string) => `2fa:device:${userId}:${deviceId}`,
  backupCodes: (userId: string) => `2fa:backup-codes:${userId}`,
  rateLimit: (key: string) => `rate-limit:${key}`,
  biometricStatus: (userId: string) => `biometric:status:${userId}`,
  biometricCredentials: (userId: string) => `biometric:credentials:${userId}`,
  recoveryStatus: (userId: string) => `recovery:status:${userId}`,
  behaviorProfile: (userId: string) => `behavior:profile:${userId}`,
  securityScore: (userId: string) => `security:score:${userId}`,
  passkeyChallenge: (userId: string) => `passkey:challenge:${userId}`,
  passkeyAuth: (userId: string) => `passkey:auth:${userId}`,
};

export const CACHE_PREFIX = {
  USER_PROFILE: 'user:profile:',
  SESSIONS: 'user:sessions:',
  ACTIVITY_LOGS: 'user:activity:',
  SECURITY_EVENTS: 'user:security:',
  DEVICES: 'user:devices:',
  TRUSTED_DEVICES: 'user:trusted-devices:',
  PASSWORD: 'user:password:',
  TWO_FACTOR: 'user:2fa:',
  BIOMETRIC: 'user:biometric:',
  RECOVERY: 'user:recovery:',
};