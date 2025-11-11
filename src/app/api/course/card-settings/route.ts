//Volumes/vision/codes/course/my-app/src/app/api/course/card-settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/course/card-settings?courseId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId, userId: user.id },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        price: true,
        salePrice: true,
        saleEndsAt: true, // ✅ Include sale end time
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // ✅ Auto-expire sale if time is up
    if (course.saleEndsAt && new Date(course.saleEndsAt) < new Date()) {
      await prisma.course.update({
        where: { id: courseId },
        data: {
          salePrice: null,
          saleEndsAt: null,
        },
      });
      
      course.salePrice = null;
      course.saleEndsAt = null;
    }

    return NextResponse.json(course, { status: 200 });
  } catch (error) {
    console.error('Error fetching card settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

/**
 * PATCH /api/course/card-settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { courseId, title, description, thumbnail, price, salePrice, saleEndsAt } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId, userId: user.id },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail || null;
    if (price !== undefined) updateData.price = price;
    
    // ✅ Handle sale price and expiry together
    if (salePrice !== undefined) {
      updateData.salePrice = salePrice || null;
      updateData.saleEndsAt = salePrice ? (saleEndsAt || null) : null;
    }

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: updateData,
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        price: true,
        salePrice: true,
        saleEndsAt: true, // ✅ Return sale end time
      },
    });

    return NextResponse.json({
      success: true,
      course: updatedCourse,
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating card settings:', error);
    return NextResponse.json({ 
      error: 'Failed to update settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}