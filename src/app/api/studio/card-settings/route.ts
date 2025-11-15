// src/app/api/studio/card-settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/utils/auth";
import prisma from "@/lib/prisma";
import { invalidateAllCourseCaches } from '@/lib/cache/invalidator'; // ✅ Remove invalidateCourseCaches

// Type for Prisma course query result
interface CourseCardSettings {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  price: string | null;
  salePrice: string | null;
  saleEndsAt: Date | null;
}

// Type for request body
interface CardSettingsBody {
  courseId: string;
  title: string;
  description: string;
  thumbnail: string;
  price: string;
  salePrice: string;
  saleEndsAt: string | null;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json({ error: "Course ID required" }, { status: 400 });
    }

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        userId: user.id,
        homepageType: "custom",
      },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        price: true,
        salePrice: true,
        saleEndsAt: true,
      },
    }) as CourseCardSettings | null;

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({
      title: course.title,
      description: course.description || "",
      thumbnail: course.thumbnail || "",
      price: course.price || "",
      salePrice: course.salePrice || "",
      saleEndsAt: course.saleEndsAt,
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching card settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { courseId, title, description, thumbnail, price, salePrice, saleEndsAt } = body as CardSettingsBody;

    if (!courseId) {
      return NextResponse.json({ error: "Course ID required" }, { status: 400 });
    }

    const course = await prisma.course.update({
      where: {
        id: courseId,
        userId: user.id,
        homepageType: "custom",
      },
      data: {
        title,
        description,
        thumbnail,
        price,
        salePrice,
        saleEndsAt: saleEndsAt ? new Date(saleEndsAt) : null,
        updatedAt: new Date(),
      },
    });

    // ✅ CRITICAL: Invalidate ALL caches (anonymous included) - ONE CALL IS ENOUGH
    console.log('🧹 Invalidating all caches after studio card settings update...');
    await invalidateAllCourseCaches(courseId);

    return NextResponse.json({ course }, { status: 200 });
  } catch (error) {
    console.error("Error updating card settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}