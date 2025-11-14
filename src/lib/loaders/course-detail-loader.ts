// src/lib/loaders/course-detail-loader.ts
import prisma from '@/lib/prisma';
import { getCachedData, courseCacheKeys, COURSE_CACHE_TIMES } from '@/lib/cache/course-cache';

interface AtomicCourseDetailData {
  course: any;
  owner: any;
  currentUserAvatars: any[];
  enrollmentStatus: {
    enrolled: boolean;
    isOwner: boolean;
  };
  timestamp: number;
}

/**
 * ✅ IMPROVED: Load with smart caching
 */
export async function loadCompleteCourseDetail(
  courseId: string,
  userId?: string
): Promise<AtomicCourseDetailData> {
  const startTime = Date.now();
  console.log('⚡ Loading course detail for:', courseId);

  const cacheKey = userId
    ? `${courseCacheKeys.courseDetail(courseId)}:${userId}`
    : courseCacheKeys.courseDetail(courseId);

  try {
    const data = await getCachedData(
      cacheKey,
      () => fetchCourseDetailFromDB(courseId, userId),
      COURSE_CACHE_TIMES.COURSE_DETAIL,
      true // Enable stale-while-revalidate
    );

    const totalTime = Date.now() - startTime;
    const wasCached = data.timestamp < startTime;
    console.log(`⚡ Course detail loaded in ${totalTime}ms (${wasCached ? 'cached' : 'fresh'})`);

    return data;
  } catch (error) {
    console.error('❌ Failed to load course detail:', error);
    throw error;
  }
}

/**
 * ✅ FIXED: Ensure enrollment status check is correct
 */
async function fetchCourseDetailFromDB(
  courseId: string,
  userId?: string
): Promise<AtomicCourseDetailData> {
  const [course, currentUserAvatars, enrollmentRecord] = await Promise.all([
    // Query 1: Get course with ALL related data
    prisma.course.findFirst({
      where: {
        id: courseId,
        status: 'PUBLISHED',
        isPublished: true,
      },
      include: {
        user: {
          select: {
            id: true, // ✅ CRITICAL: Select user ID
            name: true,
            surname: true,
            username: true,
            img: true,
            createdAt: true,
            // ✅ Get owner's avatars
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
            // ✅ Get owner's stats
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
        // ✅ Get homepage data
        homepage: {
          include: {
            customSections: {
              orderBy: { position: 'asc' },
            },
            proofSection: {
              include: {
                images: {
                  orderBy: { position: 'asc' },
                },
              },
            },
            testimonials: {
              include: {
                testimonials: {
                  orderBy: { position: 'asc' },
                },
              },
            },
            faqSection: {
              include: {
                faqs: {
                  orderBy: { position: 'asc' },
                },
              },
            },
            footer: true,
            sectionBadges: true,
            courseStats: true,
          },
        },
        // ✅ Get modules with lessons
        modules: {
          orderBy: { position: 'asc' },
          include: {
            lessons: {
              orderBy: { position: 'asc' },
              select: {
                id: true,
                title: true,
                description: true,
                videoDuration: true,
                position: true,
              },
            },
          },
        },
        // ✅ Get enrollments
        enrollments: {
          where: {
            status: 'active',
          },
          select: {
            id: true,
            userId: true,
            enrolledAt: true,
          },
        },
        // ✅ Get payments
        payments: {
          where: {
            status: 'succeeded',
          },
          select: {
            id: true,
            amount: true,
            createdAt: true,
          },
        },
      },
    }),

    // Query 2: Get current user's avatars if logged in
    userId
      ? prisma.avatar.findMany({
          where: { userId },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
          select: {
            id: true,
            avatarIndex: true,
            avatarSeed: true,
            avatarStyle: true,
            isPrimary: true,
            isCustomUpload: true,
            customImageUrl: true,
          },
        })
      : Promise.resolve([]),

    // Query 3: Check enrollment if logged in
    userId && courseId
      ? prisma.courseEnrollment.findFirst({
          where: {
            courseId: courseId,
            userId: userId,
            status: 'active',
          },
        })
      : Promise.resolve(null),
  ]);

  if (!course) {
    throw new Error('Course not found or not published');
  }

  // ✅ FIX: CRITICAL - Proper owner check
  const isOwner = Boolean(userId && course.userId === userId);
  const enrolled = Boolean(enrollmentRecord) || isOwner;
  
  console.log('[Course Detail Loader] Enrollment Check:', {
    courseUserId: course.userId,
    currentUserId: userId,
    isOwner,
    hasEnrollmentRecord: Boolean(enrollmentRecord),
    finalEnrolled: enrolled,
  });

  const ownerData = processOwnerData(course.user);
  const transformedCourse = transformCourseData(course, ownerData);

  return {
    course: transformedCourse,
    owner: ownerData,
    currentUserAvatars: currentUserAvatars || [],
    enrollmentStatus: {
      enrolled,
      isOwner,
    },
    timestamp: Date.now(),
  };
}

/**
 * ✅ Process owner data with correct privacy logic
 */
function processOwnerData(user: any) {
  if (!user) return null;

  const primaryAvatar =
    user.avatars?.find((a: any) => a.isPrimary) || user.avatars?.[0] || null;

  // Determine user type
  const userGoal = user.UserGoals?.[0];
  let userType: 'tutor' | 'learner' | 'both' = 'learner';

  if (userGoal) {
    if (userGoal.purpose === 'teach') userType = 'tutor';
    else if (userGoal.purpose === 'both') userType = 'both';
    else if (userGoal.purpose === 'learn') userType = 'learner';
  }

  // Apply privacy logic
  let isPrivate = false;
  if (userType === 'tutor' || userType === 'both') {
    isPrivate = false;
  } else if (userType === 'learner') {
    isPrivate = !user.profileSettings?.isPublic;
  }

  // ✅ FIX: Ensure ID is always returned
  return {
    id: user.id, // ✅ CRITICAL: Include user ID
    username: user.username,
    name: user.name || 'User',
    surname: user.surname || '',
    fullName: `${user.name || ''} ${user.surname || ''}`.trim() || user.username || 'Anonymous',
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
    bio: user.profileSettings?.bio || '',
    country: user.profileSettings?.country || '',
    location: user.profileSettings?.location || '',
    website: user.profileSettings?.website || '',
    isPrivate: isPrivate,
    dateJoined: user.createdAt.toISOString(),
  };
}

// ✅ Transform course data (keep your existing transformation logic)
function transformCourseData(course: any, ownerData: any) {
  const homepage = course.homepage;

  // Calculate real-time stats
  const activeStudents = course.enrollments?.length || 0;
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthlyEnrollments = course.enrollments?.filter(
    (e: any) => new Date(e.enrolledAt) >= firstDayOfMonth
  ) || [];

  // ✅ FIX: Proper sale price handling
  const basePriceNum = course.price ? parseFloat(course.price) : 0;
  const salePriceNum = course.salePrice ? parseFloat(course.salePrice) : null;
  
  // Check if sale is valid and not expired
  let effectiveSalePrice: string | null = null;
  let effectiveSaleEndsAt: string | null = null;

  if (salePriceNum !== null && salePriceNum < basePriceNum) {
    // If there's NO end date, sale is always active
    if (!course.saleEndsAt) {
      effectiveSalePrice = course.salePrice;
      effectiveSaleEndsAt = null;
    } 
    // If there IS an end date, check if it's still valid
    else {
      const saleEndDate = new Date(course.saleEndsAt);
      if (saleEndDate > now) {
        effectiveSalePrice = course.salePrice;
        effectiveSaleEndsAt = course.saleEndsAt.toISOString();
      }
    }
  }

  const coursePrice = effectiveSalePrice
    ? parseFloat(effectiveSalePrice)
    : basePriceNum;

  const monthlyIncome = monthlyEnrollments.length * coursePrice;
  const totalRevenue = activeStudents * coursePrice;
  const avgSales = activeStudents > 0 ? Math.round(totalRevenue / activeStudents) : 0;
  const courseRating = homepage?.courseStats?.courseRating || 0;

  return {
    courseId: course.id,
    courseTitle: course.title,
    courseSlug: course.slug,
    courseDescription: course.description,
    owner: ownerData,
    homepageType: course.homepageType || 'builder',
    customHomepageFile: course.customHomepageFile || null,
    
    // ✅ FIX: Always include these fields
    price: course.price || '0',
    salePrice: effectiveSalePrice,
    saleEndsAt: effectiveSaleEndsAt,
    
    thumbnail: course.thumbnail,

    // Include homepage data if exists
    ...(homepage && {
      backgroundType: homepage.backgroundType || 'black',
      backgroundColor: homepage.backgroundColor || '#000000',
      gradientFrom: homepage.gradientFrom || '#dc2626',
      gradientTo: homepage.gradientTo || '#000000',
      primaryColor: homepage.primaryColor || '#dc2626',
      secondaryColor: homepage.secondaryColor || '#000000',
      darkMode: homepage.darkMode !== false,

      mainTitle: {
        line1: homepage.mainTitleLine1 || '',
        line2: homepage.mainTitleLine2 || '',
        line3: homepage.mainTitleLine3 || '',
        highlightedWords: homepage.mainTitleHighlighted || [],
        line1Words: homepage.mainTitleLine1Words || null,
        line2Words: homepage.mainTitleLine2Words || null,
        line3Words: homepage.mainTitleLine3Words || null,
      },
      mainTitleLines: homepage.mainTitleLines || 1,

      subheading: {
        text: homepage.subheadingText || '',
        highlightedWords: homepage.subheadingHighlighted || [],
        highlightedSentences: homepage.subheadingSentences || [],
        words: homepage.subheadingWords || null,
      },
      subheadingLines: homepage.subheadingLines || 1,

      videoEnabled: homepage.videoEnabled !== false,
      videoUrl: homepage.videoUrl || '',
      videoTitle: homepage.videoTitle || '',
      videoDescription: homepage.videoDescription || '',
      videoDuration: homepage.videoDuration || '',
      videoThumbnail: homepage.videoThumbnail || null,

      ctaButtonText: homepage.ctaButtonText || 'START YOUR JOURNEY',
      ctaButtonIcon: homepage.ctaButtonIcon || 'FaRocket',

      statsEnabled: homepage.statsEnabled !== false,

      customSections: (homepage.customSections || []).map((section: any) => {
        let cards = [];
        try {
          cards =
            typeof section.features === 'string'
              ? JSON.parse(section.features)
              : section.features || [];
        } catch (e) {
          console.error('Error parsing section features:', e);
          cards = [];
        }

        return {
          id: section.sectionId,
          order: section.position,
          title: section.title || '',
          titleWords: section.titleWords || null,
          subtitle: section.description || '',
          descriptionWords: section.descriptionWords || null,
          cards: cards,
          layout: section.layout || 'text-image',
          imageUrl: section.imageUrl || null,
          imagePosition: section.imagePosition || 'right',
          imageRounded: section.imageRounded || false,
          imageBorder: section.imageBorder || false,
          buttonText: section.buttonText || null,
          buttonIcon: section.buttonIcon || null,
          buttonLink: section.buttonLink || null,
          backgroundColor: section.backgroundColor || 'transparent',
          paddingTop: section.paddingTop || 'normal',
          paddingBottom: section.paddingBottom || 'normal',
        };
      }),

      proofSectionEnabled: homepage.proofSection?.enabled || false,
      proofSectionTitle:
        homepage.proofSection?.title || 'REAL PROOF FROM REAL STUDENTS',
      proofSectionTitleWords: homepage.proofSection?.titleWords || [],
      proofImages: (homepage.proofSection?.images || []).map((img: any) => ({
        id: img.id,
        order: img.position,
        imageUrl: img.imageUrl,
        title: img.caption || '',
        description: img.altText || '',
        category: img.category || null,
        showCategory: img.showCategory !== false,
      })),

      testimonialsEnabled: homepage.testimonials?.enabled || false,
      testimonialsTitle:
        homepage.testimonials?.title || 'HEAR IT FROM OUR STUDENTS',
      testimonialsTitleWords: homepage.testimonials?.titleWords || [],
      testimonials: (homepage.testimonials?.testimonials || []).map((t: any) => ({
        id: t.id,
        order: t.position,
        name: t.name,
        role: t.role || 'Student',
        company: t.company || null,
        avatar:
          t.avatarUrl ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=dc2626&color=fff`,
        thumbnail: t.avatarUrl || null,
        rating: t.rating || 5,
        text: t.content,
        content: t.content,
        highlight: t.content,
        featured: t.featured || false,
        instagramHandle: t.instagramHandle || null,
        linkedinUrl: t.linkedinUrl || null,
        twitterHandle: t.twitterHandle || null,
        customFields: [],
        videoFile: null,
        videoLength: null,
      })),

      faqEnabled: homepage.faqSection?.enabled || false,
      faqTitle: homepage.faqSection?.title || 'GOT QUESTIONS?',
      faqTitleWords: homepage.faqSection?.titleWords || [],
      faqs: (homepage.faqSection?.faqs || []).map((faq: any) => ({
        id: faq.id,
        order: faq.position,
        question: faq.question,
        answer: faq.answer,
        category: faq.category || null,
      })),

      footerTitle: homepage.footer?.title || 'READY TO START?',
      footerTitleWords: homepage.footer?.titleWords || [],
      footerDescription:
        homepage.footer?.description || 'Join thousands of successful students',
      footerDescriptionWords: homepage.footer?.descriptionWords || [],
      footerIcons: homepage.footer?.icons || [],

      sectionBadges: (homepage.sectionBadges || []).map((badge: any) => ({
        sectionId: badge.sectionId,
        type: badge.sectionType,
        enabled: badge.enabled,
        text: badge.text,
        emoji: badge.emoji,
      })),
    }),

    // ✅ FIX: Include footer pricing (these were missing!)
    footerPrice: course.price || '0',
    footerSalePrice: effectiveSalePrice,
    footerSaleEndsAt: effectiveSaleEndsAt,
    footerCurrency: 'USD',

    courseStats: {
      activeStudents,
      courseRating,
      monthlyIncome: `$${Math.round(monthlyIncome)}`,
      avgGrowth: avgSales.toString(),
      totalEnrollments: activeStudents,
      completionRate: homepage?.courseStats?.completionRate || 0,
      averageProgress: homepage?.courseStats?.averageProgress || 0,
    },

    modules: (course.modules || []).map((module: any) => ({
      id: module.id,
      title: module.title,
      description: module.description,
      difficulty: module.difficulty,
      position: module.position,
      lessonCount: module.lessons?.length || 0,
      totalDuration: calculateTotalDuration(module.lessons),
    })),

    totalModules: course.modules?.length || 0,
    totalLessons:
      course.modules?.reduce(
        (acc: number, m: any) => acc + (m.lessons?.length || 0),
        0
      ) || 0,

    publishedAt: course.publishedAt,
    updatedAt: course.updatedAt,
  };
}

function calculateTotalDuration(lessons: any[] = []) {
  if (!lessons || lessons.length === 0) return '0 min';

  let totalMinutes = 0;
  lessons.forEach((lesson: any) => {
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

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}