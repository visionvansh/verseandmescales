// src/lib/loaders/course-page-loader.ts
import prisma from '@/lib/prisma';
import { getCachedData, courseCacheKeys, COURSE_CACHE_TIMES } from '@/lib/cache/course-cache';

export async function loadCompleteCoursesData(
  userId?: string
): Promise<any> {
  const startTime = Date.now();
  console.log('⚡ Loading courses data for:', userId ? `user ${userId}` : 'anonymous');

  const cacheKey = courseCacheKeys.publicCourses(userId);

  try {
    const useStale = Boolean(userId);
    
    // ✅ FIX: Use shorter TTL for anonymous users
    const cacheTTL = userId 
      ? COURSE_CACHE_TIMES.PUBLIC_COURSES 
      : COURSE_CACHE_TIMES.PUBLIC_COURSES_ANONYMOUS;
    
    const data = await getCachedData(
      cacheKey,
      () => fetchCoursesFromDB(userId),
      cacheTTL, // ✅ Dynamic TTL based on auth status
      useStale
    );

    const totalTime = Date.now() - startTime;
    console.log(`⚡ Courses loaded in ${totalTime}ms (${userId ? 'user' : 'anonymous'})`);

    return data;
  } catch (error) {
    console.error('❌ Failed to load courses:', error);
    throw error;
  }
}

// Keep fetchCoursesFromDB as is - it already has correct sale price logic
async function fetchCoursesFromDB(userId?: string): Promise<any> {
  console.log('📊 Fetching fresh courses from database...');
  
  const [courses, enrollments] = await Promise.all([
    prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        thumbnail: true,
        price: true,
        salePrice: true,
        saleEndsAt: true,
        category: true,
        averageRating: true,
        userId: true,
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
        // ✅ FIX: Get REAL-TIME enrollment count
        enrollments: {
          where: {
            status: 'active',
          },
          select: {
            id: true,
            userId: true,
          },
        },
        modules: {
          orderBy: { position: 'asc' },
          include: {
            lessons: {
              orderBy: { position: 'asc' },
              select: {
                id: true,
                title: true,
                videoDuration: true,
              },
            },
          },
        },
        _count: {
          select: {
            ratings: true,
          },
        },
      },
      orderBy: [
        { updatedAt: 'desc' },
      ],
    }),

    // ✅ Get current user's enrollments if logged in
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

  const enrollmentIds = new Set(enrollments.map(e => e.courseId));
  const usersMap = new Map();
  const avatarsMap = new Map();

  courses.forEach((course) => {
    const user = course.user;
    if (user && user.username) {
      const primaryAvatar = user.avatars?.find((a) => a.isPrimary) || user.avatars?.[0] || null;
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
        fullName: `${user.name || ''} ${user.surname || ''}`.trim() || user.username || 'Anonymous',
        img: user.img,
        avatar: user.img || null,
        primaryAvatar: primaryAvatar,
        type: userType,
        xp: user.userXP?.totalXP || 0,
        contributorTitle: user.userXP?.contributorTitle || null,
        seekers: user._count?.followers || 0,
        seeking: user._count?.following || 0,
        coursesMade: user._count?.courses || 0,
        postsCount: user._count?.posts || 0,
        bio: user.profileSettings?.bio || '',
        country: user.profileSettings?.country || '',
        location: user.profileSettings?.location || '',
        website: user.profileSettings?.website || '',
        isPrivate: isPrivate,
        dateJoined: user.createdAt.toISOString(),
      });

      avatarsMap.set(user.username, user.avatars || []);
    }
  });

  const now = new Date();
  
  const transformedCourses = courses.map((course) => {
    const totalDuration = calculateTotalDuration(course.modules || []);
    
    // ✅ FIX: Use REAL enrollment count from query
    const activeStudents = course.enrollments?.length || 0;

    // ✅ FIX: Proper sale price handling
    let effectiveSalePrice: string | null = null;
    let effectiveSaleEndsAt: string | null = null;

    if (course.salePrice) {
      const basePriceNum = course.price ? parseFloat(course.price) : 0;
      const salePriceNum = parseFloat(course.salePrice);
      
      if (salePriceNum < basePriceNum) {
        if (!course.saleEndsAt) {
          // No end date = sale is always active
          effectiveSalePrice = course.salePrice;
          effectiveSaleEndsAt = null;
        } else {
          const saleEndDate = new Date(course.saleEndsAt);
          if (saleEndDate > now) {
            // Sale still active
            effectiveSalePrice = course.salePrice;
            effectiveSaleEndsAt = course.saleEndsAt.toISOString();
          }
        }
      }
    }

    // ✅ FIX: Use actual rating from database
    const rating = course.averageRating || 0;

    // ✅ FIX: Proper ownership check
    const isOwner = userId ? course.userId === userId : false;
    const hasEnrollmentRecord = enrollmentIds.has(course.id);
    
    // ✅ CRITICAL: Owner should NOT see "enrolled"
    const isEnrolled = isOwner ? false : hasEnrollmentRecord;

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      thumbnail: course.thumbnail,
      price: course.price || '0',
      salePrice: effectiveSalePrice,
      saleEndsAt: effectiveSaleEndsAt,
      category: course.category,
      owner: {
        id: course.user.id,
        name: course.user.name || course.user.username || 'Anonymous',
        username: course.user.username,
        avatar: course.user.img,
        primaryAvatar: course.user.avatars?.find((a) => a.isPrimary) || course.user.avatars?.[0] || null,
      },
      stats: {
        students: activeStudents, // ✅ Real-time count
        rating: rating, // ✅ Real-time rating
        duration: totalDuration,
      },
      isOwner: isOwner,
      isEnrolled: isEnrolled, // ✅ Correct enrollment status
    };
  });

  const enrollmentsMap = new Map();
  if (userId) {
    enrollmentsMap.set(userId, enrollmentIds);
  }

  console.log(`✅ Fetched ${transformedCourses.length} courses (${enrollments.length} enrollments for user)`);

  return {
    courses: transformedCourses,
    users: usersMap,
    avatars: avatarsMap,
    enrollments: enrollmentsMap,
    timestamp: Date.now(),
  };
}

function calculateTotalDuration(modules: any[]) {
  let totalMinutes = 0;

  modules.forEach((module) => {
    module.lessons?.forEach((lesson: any) => {
      if (lesson.videoDuration) {
        const match = lesson.videoDuration.match(/(\d+)\s*(min|hour|hr)/i);
        if (match) {
          const value = parseInt(match[1]);
          const unit = match[2].toLowerCase();
          if (unit.includes('hour') || unit.includes('hr')) {
            totalMinutes += value * 60;
          } else {
            totalMinutes += value;
          }
        }
      }
    });
  });

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}