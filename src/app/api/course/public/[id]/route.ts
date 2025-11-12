import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Define types
type Lesson = {
  id: string;
  title: string;
  description: string | null;
  videoDuration: string | null;
  position: number;
};

type Module = {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  position: number;
  lessons: Lesson[];
};

type Enrollment = {
  id: string;
  userId: string;
  enrolledAt: Date;
};

type Payment = {
  id: string;
  amount: number;
  createdAt: Date;
};

type CourseData = {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  thumbnail: string | null;
  price: string | null;
  salePrice: string | null;
  saleEndsAt: Date | null;
  homepageType: string | null;
  customHomepageFile: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    surname: string | null;
    username: string | null;
    img: string | null;
    avatars: Array<{
      id: string;
      isPrimary: boolean;
      avatarIndex: number;
      createdAt: Date;
    }>;
  };
  homepage: any;
  modules: Module[];
  enrollments: Enrollment[];
  payments: Payment[];
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log('🔍 Fetching course with id:', id);

    if (!id) {
      return NextResponse.json(
        { error: 'Course ID required' },
        { status: 400 }
      );
    }

    // Find published course by ID (all scalar fields like saleEndsAt are included by default)
    const course = await prisma.course.findFirst({
      where: {
        id: id,
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
            avatars: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
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
        // ✅ ADD: Include enrollments and payments for real-time stats
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
    }) as CourseData | null;

    console.log('📊 Course found:', course ? 'YES' : 'NO');
    console.log('📊 Has homepage:', course?.homepage ? 'YES' : 'NO');
    // ✅ NEW: Log sale/timer data for debugging
    console.log('💰 Sale/Timer Data from DB:', {
      price: course?.price,
      salePrice: course?.salePrice,
      saleEndsAt: course?.saleEndsAt ? course.saleEndsAt.toISOString() : null,
      hasActiveSale: !!(course?.salePrice && course?.saleEndsAt && new Date() < new Date(course.saleEndsAt))
    });

    if (!course) {
      console.log('❌ Course not found with id:', id);
      return NextResponse.json(
        { error: 'Course not found or not published' },
        { status: 404 }
      );
    }

    if (!course.homepage) {
      console.log('❌ Course has no homepage:', course.id);
      return NextResponse.json(
        { error: 'Course homepage not configured' },
        { status: 404 }
      );
    }

    // ✅ Calculate real-time stats
    const realTimeStats = calculateRealTimeStats(course);

    // Transform the data
    const transformedData = transformPublicCourseData(course, realTimeStats);

    console.log('✅ Returning course data for:', course.title);

    return NextResponse.json({
      ...transformedData,
      // ✅ NEW: Add homepage type info
      homepageType: course.homepageType || "builder",
      customHomepageFile: course.customHomepageFile || null,
    }, { status: 200 });
  } catch (error) {
    console.error('❌ Error fetching public course:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch course data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ✅ NEW: Calculate real-time stats
// ✅ SIMPLIFIED: Calculate monthly revenue from enrollments × price
function calculateRealTimeStats(course: CourseData) {
  // 1. Active Students/Buyers (total enrollments)
  const activeStudents = course.enrollments?.length || 0;

  // 2. Get current month's enrollments
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const monthlyEnrollments = course.enrollments?.filter((e: Enrollment) => 
    new Date(e.enrolledAt) >= firstDayOfMonth
  ) || [];

  // 3. Calculate Monthly Income (enrollments × price)
  const coursePrice = course.salePrice 
    ? parseFloat(course.salePrice) 
    : course.price 
    ? parseFloat(course.price) 
    : 0;

  const monthlyIncome = monthlyEnrollments.length * coursePrice;

  // 4. Calculate Average Sales (total revenue ÷ total enrollments)
  const totalRevenue = activeStudents * coursePrice;
  const avgSales = activeStudents > 0 
    ? Math.round(totalRevenue / activeStudents) 
    : 0;

  // 5. Get Course Rating from database (or default)
  const courseRating = course.homepage?.courseStats?.courseRating || 0;

  console.log('💰 Monthly Stats (Calculated from Enrollments):', {
    monthlyEnrollmentsCount: monthlyEnrollments.length,
    coursePrice,
    monthlyIncome,
    avgSales,
    activeStudents,
    totalRevenue
  });

  return {
    activeStudents,
    avgSales,
    monthlyIncome: `$${Math.round(monthlyIncome)}`,
    courseRating: courseRating || 0,
  };
}

// ✅ UPDATED: Transform function with real-time stats + saleEndsAt
function transformPublicCourseData(course: CourseData, realTimeStats: any) {
  const homepage = course.homepage;
  
  // Get primary avatar
  const primaryAvatar = course.user.avatars?.find((a) => a.isPrimary) || 
                        course.user.avatars?.[0] || 
                        null;

  // ✅ CRITICAL FIX: Get pricing from Course model directly (works for both builder and custom)
  const coursePrice = course.price || '0';
  const courseSalePrice = course.salePrice || null;
  // ✅ NEW: Include saleEndsAt from Course model (this was missing!)
  const saleEndsAt = course.saleEndsAt ? course.saleEndsAt.toISOString() : null;

  // ✅ NEW: Log transformed sale data
  console.log('🔄 Transformed Sale Data:', {
    price: coursePrice,
    salePrice: courseSalePrice,
    saleEndsAt,
    hasActiveSale: !!(courseSalePrice && saleEndsAt && new Date() < new Date(saleEndsAt))
  });

  return {
    // Course Info
    courseId: course.id,
    courseTitle: course.title,
    courseSlug: course.slug,
    courseDescription: course.description,
    
    owner: {
      id: course.user.id,
      name: course.user.name,
      surname: course.user.surname,
      username: course.user.username,
      img: course.user.img,
      avatar: course.user.img || `https://ui-avatars.com/api/?name=${encodeURIComponent(course.user.name || course.user.username || 'User')}&background=dc2626&color=fff`,
      fullName: `${course.user.name || ''} ${course.user.surname || ''}`.trim() || course.user.username || 'Anonymous',
      avatars: course.user.avatars || [],
      primaryAvatar: primaryAvatar,
    },
    
    // ✅ Only include homepage data if it exists (for builder courses)
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
          cards = typeof section.features === 'string' 
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
      proofSectionTitle: homepage.proofSection?.title || 'REAL PROOF FROM REAL STUDENTS',
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
      testimonialsTitle: homepage.testimonials?.title || 'HEAR IT FROM OUR STUDENTS',
      testimonialsTitleWords: homepage.testimonials?.titleWords || [],
      testimonials: (homepage.testimonials?.testimonials || []).map((t: any) => ({
        id: t.id,
        order: t.position,
        name: t.name,
        role: t.role || 'Student',
        company: t.company || null,
        avatar: t.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=dc2626&color=fff`,
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
      footerDescription: homepage.footer?.description || 'Join thousands of successful students',
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
    
    // ✅ CRITICAL: Always use Course model pricing (works for BOTH builder and custom courses)
    footerPrice: coursePrice,
    footerSalePrice: courseSalePrice,
    footerCurrency: 'USD',
    
    // Also add these for backward compatibility
    price: coursePrice,
    salePrice: courseSalePrice,
    // ✅ NEW: Include saleEndsAt (this fixes the timer not fetching in HomepageV2)
    saleEndsAt: saleEndsAt,
    thumbnail: course.thumbnail,
    
    courseStats: {
      activeStudents: realTimeStats.activeStudents,
      courseRating: realTimeStats.courseRating,
      monthlyIncome: realTimeStats.monthlyIncome,
      avgGrowth: realTimeStats.avgSales.toString(),
      totalEnrollments: realTimeStats.activeStudents,
      completionRate: homepage?.courseStats?.completionRate || 0,
      averageProgress: homepage?.courseStats?.averageProgress || 0,
    },
    
    modules: (course.modules || []).map((module: Module) => ({
      id: module.id,
      title: module.title,
      description: module.description,
      difficulty: module.difficulty,
      position: module.position,
      lessonCount: module.lessons?.length || 0,
      totalDuration: calculateTotalDuration(module.lessons),
    })),
    
    totalModules: course.modules?.length || 0,
    totalLessons: course.modules?.reduce((acc: number, m: Module) => acc + (m.lessons?.length || 0), 0) || 0,
    
    publishedAt: course.publishedAt,
    updatedAt: course.updatedAt,
  };
}

function calculateTotalDuration(lessons: Lesson[] = []) {
  if (!lessons || lessons.length === 0) return '0 min';
  
  let totalMinutes = 0;
  lessons.forEach((lesson: Lesson) => {
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