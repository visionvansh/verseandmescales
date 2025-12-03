// app/api/atomic/checkout/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import { loadCompleteCheckoutData } from '@/lib/loaders/checkout-loader';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('⚡ Atomic checkout API called for:', id);
    const startTime = Date.now();

    const user = await getAuthUser(request);

    // ✅ If user is not authenticated, return course data only (no payment intents)
    if (!user) {
      console.log('⚡ No authenticated user, returning course data only');
      
      // Fetch basic course data
      const course = await prisma.course.findFirst({
        where: {
          id,
          status: 'PUBLISHED',
          isPublished: true,
        },
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
          price: true,
          salePrice: true,
          user: {
            select: {
              id: true,
              name: true,
              surname: true,
              username: true,
              img: true,
              avatars: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
      });

      if (!course) {
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        );
      }

      const owner = course.user ? {
        id: course.user.id,
        name: course.user.name,
        surname: course.user.surname,
        username: course.user.username,
        fullName: `${course.user.name || ''} ${course.user.surname || ''}`.trim() || course.user.username,
        img: course.user.img,
        avatar: course.user.avatars?.[0] || null,
      } : null;

      return NextResponse.json(
        {
          course: {
            id: course.id,
            title: course.title,
            description: course.description,
            thumbnail: course.thumbnail,
            price: course.price,
            salePrice: course.salePrice,
          },
          owner,
          currentUserAvatars: [],
          paypalOrderId: null,
          stripeClientSecret: null,
          stripePaymentIntentId: null,
          requiresAuth: true, // Signal to frontend that auth is needed
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'no-store, must-revalidate',
          },
        }
      );
    }

    // ✅ User is authenticated - load full checkout data with payment intents
    const atomicData = await loadCompleteCheckoutData(id, user.id);

    const totalTime = Date.now() - startTime;
    console.log(`⚡ Atomic checkout API completed in ${totalTime}ms`);

    return NextResponse.json(
      {
        ...atomicData,
        loadTime: totalTime,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'X-Load-Time': String(totalTime),
        },
      }
    );
  } catch (error) {
    console.error('❌ Atomic checkout API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to load checkout',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: error instanceof Error && error.message.includes('enrolled') ? 400 : 500 }
    );
  }
}