//Volumes/vision/codes/course/my-app/src/app/api/studio/custom-courses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/utils/auth";
import prisma from "@/lib/prisma";

// ✅ Simple password check helper
function isStudioAuthorized(req: NextRequest): boolean {
  // Check if client has authorized session
  // This is basic - you can enhance it
  return true; // Simplified for this implementation
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const courses = await prisma.course.findMany({
      where: {
        userId: user.id,
        homepageType: "custom",
      },
      include: {
        homepage: true,
        modules: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(courses, { status: 200 });
  } catch (error) {
    console.error("Error fetching custom courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, customHomepageFile } = body;

    // ✅ Create course WITHOUT homepage first
    const course = await prisma.course.create({
      data: {
        userId: user.id,
        title: title || "Untitled Custom Course",
        status: "DRAFT",
        homepageType: "custom",
        customHomepageFile,
        // Remove the homepage nested create
      },
    });

    // ✅ Then create homepage separately
    await prisma.courseHomepage.create({
      data: {
        courseId: course.id,
        userId: user.id,
        // Add any default homepage values you need
        backgroundType: "black",
        mainTitleLine1: title || "Untitled Custom Course",
        subheadingText: "Custom course homepage",
        ctaButtonText: "START YOUR JOURNEY",
      },
    });

    // ✅ Fetch complete course with homepage
    const completeCourse = await prisma.course.findUnique({
      where: { id: course.id },
      include: {
        homepage: true,
        modules: true,
      },
    });

    return NextResponse.json(completeCourse, { status: 201 });
  } catch (error) {
    console.error("Error creating custom course:", error);
    return NextResponse.json(
      { 
        error: "Failed to create course",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}