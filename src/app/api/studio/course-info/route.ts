// /Volumes/vision/codes/course/my-app/src/app/api/studio/course-info/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/utils/auth";
import prisma from "@/lib/prisma";

// Type for Prisma query result
interface CourseInfo {
  customHomepageFile: string | null;
  title: string;
  thumbnail: string | null;
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
        customHomepageFile: true,
        title: true,
        thumbnail: true,
      },
    }) as CourseInfo | null;

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(course, { status: 200 });
  } catch (error) {
    console.error("Error fetching course info:", error);
    return NextResponse.json({ error: "Failed to fetch course info" }, { status: 500 });
  }
}