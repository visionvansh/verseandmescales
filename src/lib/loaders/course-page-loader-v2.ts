// src/lib/loaders/course-page-loader-v2.ts
import prisma from '@/lib/prisma';
import { getCachedData, courseCacheKeys, COURSE_CACHE_TIMES } from '@/lib/cache/course-cache';

interface OptimizedCourseData {
  courses: any[];
  users: Map<string, any>;
  avatars: Map<string, any[]>;
  enrollments: Map<string, boolean>;
  timestamp: number;
}

/**
 * ✅ ULTRA-OPTIMIZED: Single query with minimal data
 */
export async function loadCompleteCoursesData(userId?: string): Promise<OptimizedCourseData> {
  const cacheKey = userId 
    ? `${courseCacheKeys.publicCourses()}:${userId}` 
    : courseCacheKeys.publicCourses();

  return getCachedData(
    cacheKey,
    async () => {
      const startTime = Date.now();
      console.log('⚡ Starting OPTIMIZED course load...');

      // ✅ SINGLE QUERY - Only select what we need
      const coursesData = await prisma.course.findMany({
        where: {
          status: 'PUBLISHED',
          isPublished: true,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          price: true,
          salePrice: true,
          saleEndsAt: true,
          thumbnail: true,
          publishedAt: true,
          userId: true,
          // ✅ Only get essential user data
          user: {
            select: {
              id: true,
              name: true,
              surname: true,
              username: true,
              img: true,
              createdAt: true,
              // ✅ Only primary avatar
              avatars: {
                where: { isPrimary: true },
                take: 1,
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
              // ✅ Get counts directly
              _count: {
                select: {
                  followers: true,
                  courses: true,
                },
              },
              // ✅ Only essential profile data
              profileSettings: {
                select: {
                  isPublic: true,
                  bio: true,
                  country: true,
                },
              },
              UserGoals: {
                select: { purpose: true },
                take: 1,
              },
            },
          },
          // ✅ Pre-calculate stats
          _count: {
            select: {
              enrollments: true,
              ratings: true,
            },
          },
          // ✅ Only get average rating
          ratings: {
            select: { rating: true },
          },
          // ✅ Only get lesson durations for calculation
          modules: {
            select: {
              lessons: {
                select: {
                  videoDuration: true,
                },
              },
            },
          },
          // ✅ User enrollments only if logged in
          ...(userId && {
            enrollments: {
              where: {
                userId,
                status: 'active',
              },
              select: { id: true },
            },
          }),
        },
        orderBy: { publishedAt: 'desc' },
        // ✅ Limit to reasonable amount
        take: 100,
      });

      const queryTime = Date.now() - startTime;
      console.log(`✅ Database query completed in ${queryTime}ms`);

      // ✅ Process data efficiently
      const usersMap = new Map<string, any>();
      const avatarsMap = new Map<string, any[]>();
      const enrollmentsMap = new Map<string, boolean>();

      const processedCourses = coursesData.map((course) => {
        const { user, modules, enrollments, ratings, _count, ...courseData } = course;

        // Cache user data
        if (user && user.username && !usersMap.has(user.username)) {
          const primaryAvatar = user.avatars?.[0] || null;
          const userGoal = user.UserGoals?.[0];
          
          let userType: 'tutor' | 'learner' | 'both' = 'learner';
          if (userGoal?.purpose === 'teach') userType = 'tutor';
          else if (userGoal?.purpose === 'both') userType = 'both';

          const isPrivate = userType === 'learner' ? !user.profileSettings?.isPublic : false;

          usersMap.set(user.username, {
            id: user.id,
            username: user.username,
            name: user.name || 'User',
            surname: user.surname || '',
            img: user.img,
            avatar: user.img,
            primaryAvatar,
            type: userType,
            seekers: user._count.followers,
            coursesMade: user._count.courses,
            bio: user.profileSettings?.bio || '',
            country: user.profileSettings?.country || '',
            isPrivate,
            dateJoined: user.createdAt.toISOString(),
          });

          if (primaryAvatar) {
            avatarsMap.set(user.username, [primaryAvatar]);
          }
        }

        // Calculate duration efficiently
        const totalSeconds = modules.reduce((total, module) => 
          total + module.lessons.reduce((sum, lesson) => 
            sum + parseDuration(lesson.videoDuration || ''), 0
          ), 0
        );

        // Calculate average rating
        const avgRating = ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          : 0;

        const studentsCount = _count.enrollments;
        const isEnrolled = enrollments && enrollments.length > 0;

        if (isEnrolled) {
          enrollmentsMap.set(course.id, true);
        }

        const primaryAvatar = user.avatars?.[0] || null;

        return {
          id: course.id,
          title: courseData.title || 'Untitled Course',
          slug: courseData.slug || course.id,
          description: courseData.description || 'No description',
          owner: {
            id: user.id,
            name: user.name || user.username || 'Anonymous',
            username: user.username,
            avatar: user.img,
            primaryAvatar,
          },
          stats: {
            students: studentsCount,
            rating: avgRating,
            duration: formatDuration(totalSeconds),
          },
          price: courseData.price || '0',
          salePrice: courseData.salePrice,
          thumbnail: courseData.thumbnail,
          saleEndsAt: courseData.saleEndsAt?.toISOString(),
          isPopular: studentsCount > 100,
          isTrending: studentsCount > 50 && 
            courseData.publishedAt &&
            Date.now() - new Date(courseData.publishedAt).getTime() < 30 * 24 * 60 * 60 * 1000,
          isEnrolled: isEnrolled || false,
        };
      });

      const totalTime = Date.now() - startTime;
      console.log(`⚡ OPTIMIZED load completed in ${totalTime}ms`);
      console.log(`📊 Loaded: ${processedCourses.length} courses, ${usersMap.size} users`);

      // ✅ IMPORTANT: Return proper Maps, not serialized arrays
      return {
        courses: processedCourses,
        users: usersMap, // Keep as Map
        avatars: avatarsMap, // Keep as Map
        enrollments: enrollmentsMap, // Keep as Map
        timestamp: Date.now(),
      };
    },
    COURSE_CACHE_TIMES.PUBLIC_COURSES,
    true // Use stale-while-revalidate
  );
}

function parseDuration(duration: string): number {
  if (!duration) return 0;
  const parts = duration.split(':').map(Number);
  if (parts.length === 1) return parts[0] || 0;
  if (parts.length === 2) return parts[0] * 60 + (parts[1] || 0);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0);
  return 0;
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds === 0) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}