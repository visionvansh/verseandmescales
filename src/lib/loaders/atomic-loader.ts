// src/lib/loaders/atomic-loader.ts
import prisma from '@/lib/prisma';
import { redis } from '@/lib/redis';

interface AtomicData {
  user: any | null;
  sessions: any[];
  courses: any[];
  users: Map<string, any>;
  avatars: Map<string, any[]>;
  enrollments: Map<string, boolean>;
  timestamp: number;
}

const ATOMIC_CACHE_KEY = 'atomic:complete';
const ATOMIC_TTL = 60; // 1 minute for auth data

/**
 * ✅ SUPER ATOMIC LOADER: Loads user + sessions + courses in ONE query
 */
export async function loadCompleteAtomicData(
  userId?: string,
  deviceFingerprint?: string
): Promise<AtomicData> {
  const startTime = Date.now();
  console.log('⚡ Starting SUPER ATOMIC load...');

  try {
    // Try cache first
    const cacheKey = userId 
      ? `${ATOMIC_CACHE_KEY}:${userId}` 
      : ATOMIC_CACHE_KEY;
    
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;
      
      if (age < ATOMIC_TTL * 1000) {
        console.log(`✅ Returning cached atomic data (${age}ms old)`);
        return {
          ...parsed,
          users: new Map(parsed.users),
          avatars: new Map(parsed.avatars),
          enrollments: new Map(parsed.enrollments),
        };
      }
    }

    // ✅ SINGLE MEGA QUERY - Get EVERYTHING at once
    const [userData, courses, userSessions] = await Promise.all([
      // Query 1: Get current user with ALL related data
      userId ? prisma.student.findUnique({
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
          lastLogin: true,
          createdAt: true,
          isOnline: true,
          preferences: true,
          // ✅ Get user's avatars
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
          // ✅ Get user's devices
          devices: deviceFingerprint ? {
            where: {
              fingerprint: deviceFingerprint
            },
            select: {
              id: true,
              trusted: true,
              deviceName: true,
              lastUsed: true,
              isAccountCreationDevice: true,
            },
            take: 1
          } : undefined,
          socialAccountsEver: {
            select: {
              provider: true,
              providerEmail: true,
              profileData: true
            }
          }
        }
      }) : Promise.resolve(null),

      // Query 2: Get ALL courses with ALL related data
      prisma.course.findMany({
        where: {
          status: 'PUBLISHED',
          isPublished: true,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              surname: true,
              username: true,
              img: true,
              createdAt: true,
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
              userXP: {
                select: {
                  totalXP: true,
                  contributorTitle: true,
                },
              },
              _count: {
                select: {
                  followers: true,
                  following: true,
                  courses: true,
                  posts: true,
                },
              },
              profileSettings: {
                select: {
                  bio: true,
                  country: true,
                  location: true,
                  website: true,
                  isPublic: true,
                },
              },
              UserGoals: {
                select: {
                  purpose: true,
                },
                take: 1,
              },
            },
          },
          modules: {
            include: {
              lessons: {
                select: {
                  id: true,
                  videoDuration: true,
                },
              },
            },
            orderBy: { position: 'asc' },
          },
          enrollments: {
            where: { status: 'active' },
            select: {
              id: true,
              userId: true,
            },
          },
          ratings: {
            select: {
              rating: true,
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
      }),

      // Query 3: Get user's sessions if logged in
      userId ? prisma.userSession.findMany({
        where: {
          userId,
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          device: true
        },
        orderBy: {
          lastUsed: 'desc'
        }
      }) : Promise.resolve([]),
    ]);

    const queryTime = Date.now() - startTime;
    console.log(`✅ Database mega-query completed in ${queryTime}ms`);

    // Process data
    const usersMap = new Map<string, any>();
    const avatarsMap = new Map<string, any[]>();
    const enrollmentsMap = new Map<string, boolean>();

    // Build enrollment map
    if (userId) {
      courses.forEach(course => {
        const isEnrolled = course.enrollments.some(e => e.userId === userId);
        if (isEnrolled) {
          enrollmentsMap.set(course.id, true);
        }
      });
    }

    // Process courses and users (same logic as before)
    const processedCourses = courses.map((course) => {
      const { user, modules, enrollments, ratings, ...courseData } = course;

      if (user && user.username) {
        const primaryAvatar =
          user.avatars?.find((a) => a.isPrimary) || user.avatars?.[0] || null;

        const userGoal = user.UserGoals?.[0];
        let userType: 'tutor' | 'learner' | 'both' = 'learner';
        
        if (userGoal) {
          if (userGoal.purpose === 'teach') userType = 'tutor';
          else if (userGoal.purpose === 'both') userType = 'both';
          else if (userGoal.purpose === 'learn') userType = 'learner';
        }

        let isPrivate = false;
        if (userType === 'tutor' || userType === 'both') {
          isPrivate = false;
        } else if (userType === 'learner') {
          isPrivate = !user.profileSettings?.isPublic;
        }

        usersMap.set(user.username, {
          id: user.id,
          username: user.username,
          name: user.name || 'User',
          surname: user.surname || '',
          img: user.img,
          avatar: user.img || null,
          primaryAvatar: primaryAvatar,
          avatars: user.avatars || [],
          type: userType,
          xp: user.userXP?.totalXP || 0,
          contributorTitle: user.userXP?.contributorTitle || null,
          seekers: user._count?.followers || 0,
          seeking: user._count?.following || 0,
          coursesMade: user._count?.courses || 0,
          postsCount: user._count?.posts || 0,
          coursesLearning: 0,
          badges: [],
          bio: user.profileSettings?.bio || '',
          country: user.profileSettings?.country || '',
          location: user.profileSettings?.location || '',
          website: user.profileSettings?.website || '',
          isPrivate: isPrivate,
          dateJoined: user.createdAt.toISOString(),
        });

        avatarsMap.set(user.username, user.avatars || []);
      }

      // Calculate duration
      let totalSeconds = 0;
      modules.forEach((module) => {
        module.lessons.forEach((lesson) => {
          if (lesson.videoDuration) {
            totalSeconds += parseDuration(lesson.videoDuration);
          }
        });
      });

      const duration = formatDuration(totalSeconds);
      const studentsCount = enrollments.length;
      const avgRating =
        ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          : 0;

      const primaryAvatar =
        user.avatars?.find((a) => a.isPrimary) || user.avatars?.[0] || null;

      return {
        id: course.id,
        title: courseData.title || 'Untitled Course',
        slug: courseData.slug || course.id,
        description: courseData.description || 'No description available',
        owner: {
          id: user.id,
          name: user.name || user.username || 'Anonymous',
          username: user.username,
          avatar: user.img || null,
          avatars: user.avatars || [],
          primaryAvatar: primaryAvatar,
        },
        stats: {
          students: studentsCount,
          rating: avgRating,
          duration: duration,
        },
        price: courseData.price || '0',
        salePrice: courseData.salePrice || undefined,
        thumbnail: courseData.thumbnail || undefined,
        saleEndsAt: courseData.saleEndsAt || undefined,
        isPopular: studentsCount > 100,
        isTrending:
          studentsCount > 50 &&
          courseData.publishedAt &&
          Date.now() - new Date(courseData.publishedAt).getTime() <
            30 * 24 * 60 * 60 * 1000,
        isEnrolled: enrollmentsMap.get(course.id) || false,
      };
    });

    // Format user data
    let formattedUser = null;
    let deviceTrusted = false;
    
    if (userData) {
      const primaryAvatar = userData.avatars?.find(a => a.isPrimary) || userData.avatars?.[0] || null;
      const currentDevice = userData.devices?.[0];
      deviceTrusted = currentDevice?.trusted || false;

      formattedUser = {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        name: userData.name,
        surname: userData.surname,
        img: userData.img,
        emailVerified: userData.emailVerified,
        phoneVerified: userData.phoneVerified,
        twoFactorEnabled: userData.twoFactorEnabled,
        lastLogin: userData.lastLogin,
        createdAt: userData.createdAt,
        isOnline: userData.isOnline,
        preferences: userData.preferences,
        socialAccounts: userData.socialAccountsEver,
        primaryAvatar,
        avatars: userData.avatars || [],
        deviceTrusted,
      };
    }

    // Format sessions
    const formattedSessions = userSessions.map(session => ({
      id: session.id,
      deviceId: session.deviceId,
      deviceName: session.device?.deviceName || 'Unknown device',
      browser: session.device?.browser || 'Unknown browser',
      os: session.device?.os || 'Unknown OS',
      location: session.location || 'Unknown location',
      ipAddress: session.ipAddress || 'Unknown IP',
      lastUsed: session.lastUsed,
      expiresAt: session.expiresAt,
      trusted: session.device?.trusted || false,
      isAccountCreationDevice: session.device?.isAccountCreationDevice || false,
      sessionType: session.sessionType,
    }));

    const atomicData: AtomicData = {
      user: formattedUser,
      sessions: formattedSessions,
      courses: processedCourses,
      users: usersMap,
      avatars: avatarsMap,
      enrollments: enrollmentsMap,
      timestamp: Date.now(),
    };

    // Cache the complete atomic data
    const cacheData = {
      ...atomicData,
      users: Array.from(atomicData.users.entries()),
      avatars: Array.from(atomicData.avatars.entries()),
      enrollments: Array.from(atomicData.enrollments.entries()),
    };

    await redis.set(
      cacheKey,
      JSON.stringify(cacheData),
      'EX',
      ATOMIC_TTL
    );

    const totalTime = Date.now() - startTime;
    console.log(`⚡ SUPER ATOMIC load completed in ${totalTime}ms`);
    console.log(`📊 Loaded: User=${!!formattedUser}, Sessions=${formattedSessions.length}, Courses=${processedCourses.length}, Users=${usersMap.size}`);

    return atomicData;
  } catch (error) {
    console.error('❌ Super atomic loader failed:', error);
    throw error;
  }
}

function parseDuration(duration: string): number {
  if (!duration || duration.trim() === '') return 0;
  const parts = duration.trim().split(':').map(Number);
  if (parts.length === 1) return parts[0] || 0;
  if (parts.length === 2) return parts[0] * 60 + (parts[1] || 0);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0);
  return 0;
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds === 0) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return seconds > 30 ? `${minutes + 1}m` : `${minutes}m`;
  }
  return `${seconds}s`;
}