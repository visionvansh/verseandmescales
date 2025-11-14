// src/lib/loaders/navbar-loader.ts
import prisma from '@/lib/prisma';
import { getCachedData, courseCacheKeys, COURSE_CACHE_TIMES } from '@/lib/cache/course-cache';

interface UserAvatar {
  id: string;
  avatarIndex: number;
  avatarSeed: string;
  avatarStyle: string;
  isPrimary: boolean;
  isCustomUpload: boolean;
  customImageUrl: string | null;
}

interface UserGoal {
  purpose: string;
  monthlyGoal: string | null;
  timeCommitment: string | null;
  completedAt: Date;
  updatedAt: Date;
}

interface UserSessionData {
  id: string;
  ipAddress: string | null;
  location: string | null;
  country: string | null;
  city: string | null;
  deviceName: string;
  browser: string;
  os: string;
  lastUsed: Date;
  createdAt: Date;
}

interface AtomicNavbarData {
  user: any | null;
  userGoals: UserGoal | null;
  primaryAvatar: UserAvatar | null;
  sessions: UserSessionData[];
  timestamp: number;
}

// ✅ NEW: Navbar-specific cache keys
const navbarCacheKeys = {
  userData: (userId: string) => `navbar:user:${userId}`,
  navbarFull: (userId: string) => `navbar:atomic:${userId}`,
};

// ✅ NEW: Navbar-specific cache times
const NAVBAR_CACHE_TIMES = {
  USER_DATA: 60 * 5, // 5 minutes
  FULL_NAVBAR: 60 * 10, // 10 minutes
};

/**
 * ✅ ATOMIC NAVBAR LOADER with smart caching
 */
export async function loadCompleteNavbarData(userId: string): Promise<AtomicNavbarData> {
  const startTime = Date.now();
  console.log('⚡ Loading atomic navbar data for:', userId);

  const cacheKey = navbarCacheKeys.navbarFull(userId);

  try {
    // ✅ Use the same caching strategy as courses
    const data = await getCachedData(
      cacheKey,
      () => fetchNavbarFromDB(userId),
      NAVBAR_CACHE_TIMES.FULL_NAVBAR,
      true // Enable stale-while-revalidate
    );

    const totalTime = Date.now() - startTime;
    const wasCached = data.timestamp < startTime;
    console.log(`⚡ Navbar data loaded in ${totalTime}ms (${wasCached ? 'cached' : 'fresh'})`);

    return data;
  } catch (error) {
    console.error('❌ Failed to load navbar data:', error);
    throw error;
  }
}

/**
 * ✅ Separate DB fetch logic for navbar
 */
async function fetchNavbarFromDB(userId: string): Promise<AtomicNavbarData> {
  // ✅ SINGLE QUERY: Get everything in one go
  const userData = await prisma.student.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      surname: true,
      img: true,
      emailVerified: true,
      phoneVerified: true,
      twoFactorEnabled: true,
      createdAt: true,
      // ✅ Get avatars
      avatars: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          avatarIndex: true,
          avatarSeed: true,
          avatarStyle: true,
          isPrimary: true,
          isCustomUpload: true,
          customImageUrl: true,
        },
      },
      // ✅ Get user goals
      UserGoals: {
        select: {
          purpose: true,
          monthlyGoal: true,
          timeCommitment: true,
          completedAt: true,
          updatedAt: true,
        },
        take: 1,
      },
      // ✅ Get active sessions with device info
      sessions: {
        where: {
          isActive: true,
          expiresAt: {
            gt: new Date(),
          },
        },
        select: {
          id: true,
          ipAddress: true,
          location: true,
          country: true,
          city: true,
          lastUsed: true,
          createdAt: true,
          device: {
            select: {
              deviceName: true,
              browser: true,
              os: true,
            }
          }
        },
        orderBy: { lastUsed: 'desc' },
        take: 5,
      },
    },
  });

  if (!userData) {
    return {
      user: null,
      userGoals: null,
      primaryAvatar: null,
      sessions: [],
      timestamp: Date.now(),
    };
  }

  // ✅ Process avatars
  const primaryAvatar = userData.avatars?.find((a: UserAvatar) => a.isPrimary) || 
                        userData.avatars?.[0] || 
                        null;
  
  // ✅ Process user goals
  const userGoal = userData.UserGoals?.[0] || null;

  // ✅ Process sessions with device data
  const processedSessions: UserSessionData[] = userData.sessions.map(session => ({
    id: session.id,
    ipAddress: session.ipAddress,
    location: session.location,
    country: session.country,
    city: session.city,
    lastUsed: session.lastUsed,
    createdAt: session.createdAt,
    deviceName: session.device?.deviceName || 'Unknown Device',
    browser: session.device?.browser || 'Unknown Browser',
    os: session.device?.os || 'Unknown OS',
  }));

  return {
    user: {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      name: userData.name,
      surname: userData.surname,
      img: userData.img,
      emailVerified: userData.emailVerified,
      phoneVerified: userData.phoneVerified,
      twoFactorEnabled: userData.twoFactorEnabled,
      createdAt: userData.createdAt.toISOString(),
    },
    userGoals: userGoal ? {
      purpose: userGoal.purpose,
      monthlyGoal: userGoal.monthlyGoal,
      timeCommitment: userGoal.timeCommitment,
      completedAt: userGoal.completedAt,
      updatedAt: userGoal.updatedAt,
    } : null,
    primaryAvatar,
    sessions: processedSessions,
    timestamp: Date.now(),
  };
}

/**
 * ✅ Helper function to invalidate navbar cache
 */
export async function invalidateNavbarCache(userId: string): Promise<void> {
  try {
    const cacheKey = navbarCacheKeys.navbarFull(userId);
    const { redis } = await import('@/lib/redis');
    await redis.del(cacheKey);
    console.log('🗑️ Navbar cache invalidated for:', userId);
  } catch (error) {
    console.error('❌ Failed to invalidate navbar cache:', error);
  }
}

/**
 * ✅ Helper function to get user role from goals
 */
export function getUserRole(purpose: string | null): string {
  if (!purpose) return 'Learner';
  if (purpose === 'teach') return 'Tutor';
  if (purpose === 'both') return 'Tutor & Learner';
  return 'Learner';
}

/**
 * ✅ Batch load navbar data for multiple users (for cache warming)
 */
export async function batchLoadNavbarData(userIds: string[]): Promise<Map<string, AtomicNavbarData>> {
  const results = new Map<string, AtomicNavbarData>();
  
  await Promise.allSettled(
    userIds.map(async (userId) => {
      try {
        const data = await loadCompleteNavbarData(userId);
        results.set(userId, data);
      } catch (error) {
        console.error(`Failed to load navbar data for ${userId}:`, error);
      }
    })
  );
  
  return results;
}