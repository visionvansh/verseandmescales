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

    // ✅ Fetch ONLY card fields - NO CACHING
    const courses = await prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        salePrice: true,
        saleEndsAt: true,
      },
      orderBy: [{ updatedAt: 'desc' }],
    });

    const now = new Date();
    
    // ✅ Process card data with real-time sale status
    const cardData = courses.map(course => {
      const saleEndsAt = course.saleEndsAt ? new Date(course.saleEndsAt) : null;
      const isSaleActive = course.salePrice && saleEndsAt && saleEndsAt > now;
      
      const basePriceNum = course.price ? parseFloat(course.price) : 0;
      const salePriceNum = course.salePrice ? parseFloat(course.salePrice) : 0;
      
      // Only show sale if price is actually lower
      const showSale = course.salePrice && salePriceNum < basePriceNum;
      
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        price: course.price || '0',
        salePrice: showSale && (!course.saleEndsAt || isSaleActive) ? course.salePrice : null,
        saleEndsAt: showSale && isSaleActive && course.saleEndsAt ? course.saleEndsAt.toISOString() : null,
      };
    });

    const totalTime = Date.now() - startTime;
    console.log(`✅ [CARDS API] Fetched ${cardData.length} course cards in ${totalTime}ms`);

    return NextResponse.json(
      {
        cards: cardData,
        timestamp: Date.now(),
        loadTime: totalTime,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate', // ✅ NO CACHING
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