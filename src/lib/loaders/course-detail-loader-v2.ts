// src/lib/loaders/course-detail-loader-v2.ts
import prisma from '@/lib/prisma';
import { getCachedData, courseCacheKeys, COURSE_CACHE_TIMES } from '@/lib/cache/course-cache';

export async function loadCompleteCourseDetail(
  courseId: string,
  userId?: string
): Promise<any> {
  const cacheKey = userId
    ? `${courseCacheKeys.courseDetail(courseId)}:${userId}`
    : courseCacheKeys.courseDetail(courseId);

  return getCachedData(
    cacheKey,
    async () => {
      const startTime = Date.now();
      console.log('⚡ Starting OPTIMIZED course detail load');

      // ✅ SINGLE QUERY - Only essential data
      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
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
          homepageType: true,
          customHomepageFile: true,
          userId: true,
          publishedAt: true,
          updatedAt: true,
          // User data
          user: {
            select: {
              id: true,
              name: true,
              surname: true,
              username: true,
              img: true,
              createdAt: true,
              avatars: {
                where: { isPrimary: true },
                take: 1,
              },
              userXP: { select: { totalXP: true, contributorTitle: true } },
              _count: { select: { followers: true, courses: true } },
              profileSettings: { select: { bio: true, country: true, isPublic: true } },
              UserGoals: { select: { purpose: true }, take: 1 },
            },
          },
          // Homepage data (if exists)
          homepage: {
            select: {
              backgroundType: true,
              backgroundColor: true,
              gradientFrom: true,
              gradientTo: true,
              primaryColor: true,
              darkMode: true,
              mainTitleLine1: true,
              mainTitleLine2: true,
              mainTitleLine3: true,
              mainTitleHighlighted: true,
              subheadingText: true,
              subheadingHighlighted: true,
              videoEnabled: true,
              videoUrl: true,
              videoTitle: true,
              videoDescription: true,
              videoDuration: true,
              videoThumbnail: true,
              ctaButtonText: true,
              ctaButtonIcon: true,
              statsEnabled: true,
              courseStats: true,
              customSections: {
                orderBy: { position: 'asc' },
              },
            },
          },
          // Module count only
          _count: {
            select: {
              modules: true,
              enrollments: true,
            },
          },
          // Enrollment check
          ...(userId && {
            enrollments: {
              where: { userId, status: 'active' },
              select: { id: true },
            },
          }),
        },
      });

      if (!course) {
        throw new Error('Course not found');
      }

      // Get current user avatars separately (parallel)
      const currentUserAvatars = userId
        ? await prisma.avatar.findMany({
            where: { userId },
            orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
            take: 5,
          })
        : [];

      const queryTime = Date.now() - startTime;
      console.log(`✅ Course detail loaded in ${queryTime}ms`);

      // Process owner
      const owner = processOwnerData(course.user);

      // Transform course data
      const transformedCourse = {
        courseId: course.id,
        courseTitle: course.title,
        courseDescription: course.description,
        owner,
        homepageType: course.homepageType || 'builder',
        customHomepageFile: course.customHomepageFile,
        price: course.price || '0',
        salePrice: course.salePrice,
        saleEndsAt: course.saleEndsAt?.toISOString(),
        thumbnail: course.thumbnail,
        totalModules: course._count.modules,
        publishedAt: course.publishedAt,
        updatedAt: course.updatedAt,
        ...(course.homepage && transformHomepageData(course.homepage)),
        courseStats: {
          activeStudents: course._count.enrollments,
          courseRating: 0,
          monthlyIncome: '\$0',
          avgGrowth: '0',
        },
      };

      return {
        course: transformedCourse,
        owner,
        currentUserAvatars,
        enrollmentStatus: {
          enrolled: course.enrollments && course.enrollments.length > 0,
          isOwner: course.userId === userId,
        },
        timestamp: Date.now(),
      };
    },
    COURSE_CACHE_TIMES.COURSE_DETAIL,
    true
  );
}

function processOwnerData(user: any) {
  if (!user) return null;

  const primaryAvatar = user.avatars?.[0] || null;
  const userGoal = user.UserGoals?.[0];
  
  let userType: 'tutor' | 'learner' | 'both' = 'learner';
  if (userGoal?.purpose === 'teach') userType = 'tutor';
  else if (userGoal?.purpose === 'both') userType = 'both';

  const isPrivate = userType === 'learner' ? !user.profileSettings?.isPublic : false;

  return {
    id: user.id,
    username: user.username,
    name: user.name || 'User',
    surname: user.surname || '',
    fullName: `${user.name || ''} ${user.surname || ''}`.trim() || user.username,
    img: user.img,
    primaryAvatar,
    avatars: user.avatars || [],
    type: userType,
    xp: user.userXP?.totalXP || 0,
    contributorTitle: user.userXP?.contributorTitle,
    seekers: user._count.followers,
    coursesMade: user._count.courses,
    bio: user.profileSettings?.bio || '',
    country: user.profileSettings?.country || '',
    isPrivate,
    dateJoined: user.createdAt.toISOString(),
  };
}

function transformHomepageData(homepage: any) {
  return {
    backgroundType: homepage.backgroundType || 'black',
    backgroundColor: homepage.backgroundColor || '#000000',
    gradientFrom: homepage.gradientFrom || '#dc2626',
    gradientTo: homepage.gradientTo || '#000000',
    primaryColor: homepage.primaryColor || '#dc2626',
    darkMode: homepage.darkMode !== false,
    mainTitle: {
      line1: homepage.mainTitleLine1 || '',
      line2: homepage.mainTitleLine2 || '',
      line3: homepage.mainTitleLine3 || '',
      highlightedWords: homepage.mainTitleHighlighted || [],
    },
    subheading: {
      text: homepage.subheadingText || '',
      highlightedWords: homepage.subheadingHighlighted || [],
    },
    videoEnabled: homepage.videoEnabled !== false,
    videoUrl: homepage.videoUrl || '',
    videoTitle: homepage.videoTitle || '',
    videoDescription: homepage.videoDescription || '',
    videoDuration: homepage.videoDuration || '',
    videoThumbnail: homepage.videoThumbnail,
    ctaButtonText: homepage.ctaButtonText || 'START YOUR JOURNEY',
    ctaButtonIcon: homepage.ctaButtonIcon || 'FaRocket',
    statsEnabled: homepage.statsEnabled !== false,
    customSections: (homepage.customSections || []).map((section: any) => ({
      id: section.sectionId,
      order: section.position,
      title: section.title || '',
      subtitle: section.description || '',
      cards: parseFeatures(section.features),
      layout: section.layout || 'text-image',
    })),
  };
}

function parseFeatures(features: any): any[] {
  try {
    return typeof features === 'string' ? JSON.parse(features) : features || [];
  } catch {
    return [];
  }
}