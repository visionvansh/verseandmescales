import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/utils/auth";
import prisma from "@/lib/prisma";

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
        homepageType: "custom", // ✅ Only for custom courses
      },
    });

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
    const { courseId, title, description, thumbnail, price, salePrice, saleEndsAt } = body;

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

    return NextResponse.json({ course }, { status: 200 });
  } catch (error) {
    console.error("Error updating card settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}