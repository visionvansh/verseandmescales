// src/lib/loaders/navbar-loader.ts
import prisma from '@/lib/prisma';
import { redis } from '@/lib/redis';

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

const NAVBAR_CACHE_KEY = 'atomic:navbar';
const NAVBAR_CACHE_TTL = 300; // 5 minutes

/**
 * ✅ ATOMIC NAVBAR LOADER: Single query for all navbar data
 */
export async function loadCompleteNavbarData(userId: string): Promise<AtomicNavbarData> {
  const startTime = Date.now();
  console.log('⚡ Loading atomic navbar data for:', userId);

  try {
    // Try cache first
    const cacheKey = `${NAVBAR_CACHE_KEY}:${userId}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;
      
      if (age < NAVBAR_CACHE_TTL * 1000) {
        console.log(`✅ Navbar cache hit (${age}ms old)`);
        return parsed;
      }
    }

    // ✅ SINGLE QUERY: Get everything in one go with proper Prisma types
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
        // ✅ Get avatars with proper select
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
        // ✅ Get user goals with proper select
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
        // ✅ Get active sessions with correct fields only
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
            // ✅ REMOVED: deviceName, browser, os - these are in UserDevice
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

    // ✅ Process avatars correctly
    const primaryAvatar = userData.avatars?.find((a: UserAvatar) => a.isPrimary) || 
                          userData.avatars?.[0] || 
                          null;
    
    // ✅ Process user goals correctly
    const userGoal = userData.UserGoals?.[0] || null;

    // ✅ Process sessions with device data
    const processedSessions = userData.sessions.map(session => ({
      id: session.id,
      ipAddress: session.ipAddress,
      location: session.location,
      country: session.country,
      city: session.city,
      lastUsed: session.lastUsed,
      createdAt: session.createdAt,
      // ✅ Add device info from relation
      deviceName: session.device?.deviceName || 'Unknown Device',
      browser: session.device?.browser || 'Unknown Browser',
      os: session.device?.os || 'Unknown OS',
    }));

    const atomicData: AtomicNavbarData = {
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

    // Cache for 5 minutes
    await redis.set(
      cacheKey,
      JSON.stringify(atomicData),
      'EX',
      NAVBAR_CACHE_TTL
    );

    const totalTime = Date.now() - startTime;
    console.log(`⚡ Navbar data loaded in ${totalTime}ms`);

    return atomicData;
  } catch (error) {
    console.error('❌ Navbar atomic loader failed:', error);
    throw error;
  }
}

/**
 * ✅ Helper function to invalidate navbar cache
 */
export async function invalidateNavbarCache(userId: string): Promise<void> {
  try {
    const cacheKey = `${NAVBAR_CACHE_KEY}:${userId}`;
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