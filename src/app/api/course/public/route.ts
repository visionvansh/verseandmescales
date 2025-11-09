//Volumes/vision/codes/course/my-app/src/app/api/course/public/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Parse video duration string to seconds
 */
function parseDurationToSeconds(duration: string): number {
  if (!duration || duration.trim() === '') return 0;
  
  const parts = duration.trim().split(':').map(Number);
  
  if (parts.length === 1) {
    return parts[0] || 0;
  } else if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return (minutes * 60) + (seconds || 0);
  } else if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return (hours * 3600) + (minutes * 60) + (seconds || 0);
  }
  
  return 0;
}

/**
 * Calculate total duration from all course lessons
 */
function calculateCourseDuration(modules: any[]): string {
  if (!modules || modules.length === 0) return '0m';

  let totalSeconds = 0;

  modules.forEach((module) => {
    if (module.lessons && Array.isArray(module.lessons)) {
      module.lessons.forEach((lesson: any) => {
        if (lesson.videoDuration) {
          totalSeconds += parseDurationToSeconds(lesson.videoDuration);
        }
      });
    }
  });

  if (totalSeconds === 0) return '0m';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${hours}h`;
  }
  
  if (minutes > 0) {
    if (seconds > 30) {
      return `${minutes + 1}m`;
    }
    return `${minutes}m`;
  }
  
  return `${seconds}s`;
}

/**
 * GET /api/course/public
 * Fetch all published courses with avatars
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching public courses...');
    
    const courses = await prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
        isPublished: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            img: true,
            avatars: {
              orderBy: { createdAt: 'desc' },
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
          orderBy: {
            position: 'asc',
          },
        },
        enrollments: {
          where: {
            status: 'active',
          },
          select: {
            id: true,
          },
        },
        homepage: {
          include: {
            courseStats: true,
          },
        },
        // ✅ ADD: Fetch actual ratings to calculate average
        ratings: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });

    console.log(`📚 Found ${courses.length} published courses`);

    const transformedCourses = courses.map((course) => {
      const duration = calculateCourseDuration(course.modules);
      const studentsCount = course.enrollments.length;

      // ✅ Calculate average rating from actual CourseRating records
      const actualRatings = course.ratings || [];
      const avgRating = actualRatings.length > 0
        ? actualRatings.reduce((sum, r) => sum + r.rating, 0) / actualRatings.length
        : 0; // Default to 0 if no ratings

      // Get primary avatar from Avatar table
      const primaryAvatar = course.user.avatars?.find(a => a.isPrimary) || course.user.avatars?.[0] || null;

      console.log(`📸 Course: ${course.title}`);
      console.log(`   - Owner: ${course.user.username}`);
      console.log(`   - Has ${course.user.avatars?.length || 0} avatars`);
      console.log(`   - Primary Avatar:`, primaryAvatar ? `Index ${primaryAvatar.avatarIndex}` : 'None');
      console.log(`   - Custom Image: ${course.user.img || 'None'}`);
      console.log(`   - Thumbnail: ${course.thumbnail || 'NO THUMBNAIL'}`);
      console.log(`   - Average Rating: ${avgRating.toFixed(1)} (from ${actualRatings.length} ratings)`); // ✅ ADD LOG

      return {
        id: course.id,
        title: course.title || 'Untitled Course',
        slug: course.slug || course.id,
        description: course.description || 'No description available',
        owner: {
          id: course.user.id,
          name: course.user.name || course.user.username || 'Anonymous',
          username: course.user.username,
          avatar: course.user.img || null,
          avatars: course.user.avatars || [],
          primaryAvatar: primaryAvatar,
        },
        stats: {
          students: studentsCount,
          rating: avgRating, // ✅ FIXED: Use calculated average instead of fallback
          duration: duration,
        },
        price: course.price || '0',
        salePrice: course.salePrice || undefined,
        thumbnail: course.thumbnail || undefined,
        category: undefined,
        saleEndsAt: course.saleEndsAt || undefined,
        isPopular: studentsCount > 100,
        isTrending: studentsCount > 50 && 
          course.publishedAt && 
          (new Date().getTime() - new Date(course.publishedAt).getTime()) < 30 * 24 * 60 * 60 * 1000,
      };
    });

    return NextResponse.json(transformedCourses, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('❌ Error fetching public courses:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch courses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}