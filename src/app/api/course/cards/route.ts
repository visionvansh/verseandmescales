// app/api/course/cards/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/utils/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    console.log('🎴 [CARDS API] Fetching fresh course card data...');
    const startTime = Date.now();

    const user = await getAuthUser(request);
    const userId = user?.id;

    // ✅ Fetch courses
    const courses = await prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
        isPublished: true,
      },
      select: {
        id: true,
        userId: true, // ✅ Include owner ID
        title: true,
        description: true,
        price: true,
        salePrice: true,
        saleEndsAt: true,
      },
      orderBy: [{ updatedAt: 'desc' }],
    });

    // ✅ If user is authenticated, fetch their enrollments in bulk
    let userEnrollments = new Set<string>();
    if (userId) {
      const enrollments = await prisma.courseEnrollment.findMany({
        where: {
          userId: userId,
          status: 'active',
        },
        select: {
          courseId: true,
        },
      });
      userEnrollments = new Set(enrollments.map(e => e.courseId));
    }

    const now = new Date();
    
    // ✅ Process card data with enrollment status
    const cardData = courses.map(course => {
      const saleEndsAt = course.saleEndsAt ? new Date(course.saleEndsAt) : null;
      const isSaleActive = course.salePrice && saleEndsAt && saleEndsAt > now;
      
      const basePriceNum = course.price ? parseFloat(course.price) : 0;
      const salePriceNum = course.salePrice ? parseFloat(course.salePrice) : 0;
      
      const showSale = course.salePrice && salePriceNum < basePriceNum;
      
      // ✅ Calculate enrollment status on frontend's behalf
      const isOwner = userId ? course.userId === userId : false;
      const enrolled = userId ? userEnrollments.has(course.id) : false;

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        price: course.price || '0',
        salePrice: showSale && (!course.saleEndsAt || isSaleActive) ? course.salePrice : null,
        saleEndsAt: showSale && isSaleActive && course.saleEndsAt ? course.saleEndsAt.toISOString() : null,
        // ✅ NEW: Include enrollment status
        enrollmentStatus: userId ? {
          enrolled,
          isOwner,
        } : null,
      };
    });

    const totalTime = Date.now() - startTime;
    console.log(`✅ [CARDS API] Fetched ${cardData.length} cards with enrollment data in ${totalTime}ms`);

    return NextResponse.json(
      {
        cards: cardData,
        timestamp: Date.now(),
        loadTime: totalTime,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Load-Time': String(totalTime),
        },
      }
    );
  } catch (error) {
    console.error('❌ [CARDS API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to load course cards',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}