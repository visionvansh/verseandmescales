import { Redis } from 'ioredis';

// Get Redis URL from environment variables with fallback
const getRedisUrl = (): string => {
  return process.env.REDIS_URL || 'redis://localhost:6379';
};

// Configuration for Redis client
const getRedisConfig = () => {
  return {
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    retryStrategy(times: number) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  };
};

// Create a global Redis client with connection pooling
const globalForRedis = global as unknown as { redis: Redis };

// Use existing client or create a new one
export const redis = globalForRedis.redis || 
  new Redis(getRedisUrl(), getRedisConfig());

// Keep the client in development
if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

// Add event listeners for better error handling
redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

redis.on('connect', () => {
  console.log('Redis connected successfully');
});

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
  TRUSTED_DEVICES: 'user:trusted-devices:', // ADDED
  PASSWORD: 'user:password:',
  TWO_FACTOR: 'user:2fa:',
  BIOMETRIC: 'user:biometric:',
  RECOVERY: 'user:recovery:',
};