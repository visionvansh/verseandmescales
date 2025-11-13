// src/lib/loaders/course-page-loader.ts
import prisma from '@/lib/prisma';
import { redis } from '@/lib/redis';

interface AtomicCourseData {
  courses: any[];
  users: Map<string, any>;
  avatars: Map<string, any[]>;
  enrollments: Map<string, boolean>;
  timestamp: number;
}

const ATOMIC_CACHE_KEY = 'atomic:courses:complete';
const ATOMIC_CACHE_TTL = 300; // 5 minutes

/**
 * ✅ ATOMIC LOADER: Loads ALL data in a single optimized query
 * Returns everything needed to render the page instantly
 */
export async function loadCompleteCoursesData(userId?: string): Promise<AtomicCourseData> {
  const startTime = Date.now();
  console.log('⚡ Starting ATOMIC data load...');

  try {
    // Try cache first
    const cacheKey = userId ? `${ATOMIC_CACHE_KEY}:${userId}` : ATOMIC_CACHE_KEY;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;
      
      if (age < ATOMIC_CACHE_TTL * 1000) {
        console.log(`✅ Returning cached atomic data (${age}ms old)`);
        return {
          ...parsed,
          users: new Map(parsed.users),
          avatars: new Map(parsed.avatars),
          enrollments: new Map(parsed.enrollments),
        };
      }
    }

    // ✅ SINGLE OPTIMIZED QUERY with all relations
    const [courses, userEnrollments] = await Promise.all([
      // Query 1: Get ALL courses with ALL related data in one go
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
              // ✅ Get avatars directly in the same query
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
              // ✅ Get user stats in same query
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
                },
              },
              // ✅ Get profile settings
              profileSettings: {
                select: {
                  bio: true,
                  country: true,
                  location: true,
                  website: true,
                  isPublic: true,
                },
              },
              // ✅ Get user goals
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
      
      // Query 2: Get user's enrollments if logged in
      userId
        ? prisma.courseEnrollment.findMany({
            where: {
              userId,
              status: 'active',
            },
            select: {
              courseId: true,
            },
          })
        : Promise.resolve([]),
    ]);

    const queryTime = Date.now() - startTime;
    console.log(`✅ Database query completed in ${queryTime}ms`);

    // ✅ Process data into optimized maps
    const usersMap = new Map<string, any>();
    const avatarsMap = new Map<string, any[]>();
    const enrollmentsMap = new Map<string, boolean>();

    // Build enrollment map
    userEnrollments.forEach((e) => {
      enrollmentsMap.set(e.courseId, true);
    });

    // Process courses and extract user data
    const processedCourses = courses.map((course) => {
      const { user, modules, enrollments, ratings, ...courseData } = course;

      // ✅ Store complete user data
      if (user && user.username) {
        const primaryAvatar =
          user.avatars?.find((a) => a.isPrimary) || user.avatars?.[0] || null;

        const userType =
          user.UserGoals?.[0]?.purpose === 'teach'
            ? 'tutor'
            : user.UserGoals?.[0]?.purpose === 'both'
            ? 'both'
            : 'learner';

        usersMap.set(user.username, {
          id: user.id,
          username: user.username,
          name: user.name || 'User',
          surname: user.surname,
          img: user.img,
          avatar: user.img || null,
          primaryAvatar: primaryAvatar,
          type: userType,
          xp: user.userXP?.totalXP || 0,
          seekers: user._count.followers,
          seeking: user._count.following,
          coursesMade: user._count.courses,
          bio: user.profileSettings?.bio || '',
          country: user.profileSettings?.country || '',
          location: user.profileSettings?.location || '',
          website: user.profileSettings?.website || '',
          isPrivate: !user.profileSettings?.isPublic,
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

    const atomicData: AtomicCourseData = {
      courses: processedCourses,
      users: usersMap,
      avatars: avatarsMap,
      enrollments: enrollmentsMap,
      timestamp: Date.now(),
    };

    // ✅ Cache the complete atomic data
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
      ATOMIC_CACHE_TTL
    );

    const totalTime = Date.now() - startTime;
    console.log(`⚡ ATOMIC load completed in ${totalTime}ms`);
    console.log(`📊 Loaded: ${processedCourses.length} courses, ${usersMap.size} users`);

    return atomicData;
  } catch (error) {
    console.error('❌ Atomic loader failed:', error);
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