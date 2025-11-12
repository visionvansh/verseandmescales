// /Volumes/vision/codes/course/my-app/src/app/api/studio/custom-courses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/utils/auth";
import prisma from "@/lib/prisma";

// Types for Prisma query results
interface PrismaHomepage {
  id: string;
  courseId: string;
  userId: string;
  backgroundType: string;
  backgroundColor: string;
  gradientFrom: string;
  gradientTo: string;
  primaryColor: string;
  secondaryColor: string;
  darkMode: boolean;
  mainTitleLines: number;
  mainTitleLine1: string;
  mainTitleLine2: string;
  mainTitleLine3: string;
  mainTitleHighlighted: string[];
  subheadingLines: number;
  subheadingText: string;
  subheadingHighlighted: string[];
  videoEnabled: boolean;
  videoUrl: string;
  videoTitle: string;
  videoDescription: string;
  videoDuration: string;
  ctaButtonText: string;
  ctaButtonIcon: string;
  statsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PrismaModule {
  id: string;
  courseId: string;
  userId: string;
  title: string;
  description: string;
  difficulty: string;
  learningOutcomes: string[];
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PrismaCourse {
  id: string;
  userId: string;
  title: string;
  slug: string | null;
  description: string | null;
  thumbnail: string | null;
  price: string | null;
  salePrice: string | null;
  saleEndsAt: Date | null;
  homepageType: string;
  customHomepageFile: string | null;
  status: string;
  isPublished: boolean;
  publishedAt: Date | null;
  completionPercentage: number;
  lastEditedSection: string | null;
  submittedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  homepage: PrismaHomepage | null;
  modules: PrismaModule[];
}

// Type for request body
interface CreateCourseBody {
  title: string;
  customHomepageFile: string;
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
    }) as PrismaCourse[];

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
    const { title, customHomepageFile } = body as CreateCourseBody;

    // ✅ Create course WITHOUT homepage first
    const course = await prisma.course.create({
      data: {
        userId: user.id,
        title: title || "Untitled Custom Course",
        status: "DRAFT",
        homepageType: "custom",
        customHomepageFile,
      },
    });

    // ✅ Then create homepage separately
    await prisma.courseHomepage.create({
      data: {
        courseId: course.id,
        userId: user.id,
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
    }) as PrismaCourse | null;

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