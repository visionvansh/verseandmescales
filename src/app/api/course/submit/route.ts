// app/api/course/submit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/utils/auth";
import prisma from "@/lib/prisma";

// Type definitions
type Resource = {
  id: string;
};

type Lesson = {
  id: string;
  title: string | null;
  resources: Resource[];
};

type Module = {
  id: string;
  title: string | null;
  lessons: Lesson[];
};

type CustomSection = {
  position: number;
};

type TestimonialItem = {
  id: string;
};

type Testimonials = {
  testimonials: TestimonialItem[];
};

type FaqItem = {
  id: string;
};

type FaqSection = {
  faqs: FaqItem[];
};

type Homepage = {
  mainTitleLine1: string | null;
  subheadingText: string | null;
  videoUrl: string | null;
  customSections: CustomSection[];
  testimonials: Testimonials | null;
  faqSection: FaqSection | null;
};

type CourseWithRelations = {
  id: string;
  title: string;
  userId: string;
  homepage: Homepage | null;
  modules: Module[];
};

/**
 * POST /api/course/submit
 * Submit both homepage and course content for review
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await req.json();

    if (!courseId) {
      return NextResponse.json({ error: "Course ID required" }, { status: 400 });
    }

    // Fetch complete course data with all relations
    const course = await prisma.course.findUnique({
      where: { id: courseId, userId: user.id },
      include: {
        homepage: {
          include: {
            customSections: { orderBy: { position: 'asc' } },
            proofSection: { include: { images: true } },
            testimonials: { include: { testimonials: true } },
            faqSection: { include: { faqs: true } },
            footer: true,
            sectionBadges: true,
            courseStats: true,
          }
        },
        modules: {
          include: {
            lessons: {
              include: {
                resources: true
              }
            }
          },
          orderBy: { position: 'asc' }
        }
      }
    }) as CourseWithRelations | null;

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Validate course has minimum required content
    const validation = validateCourseForSubmission(course);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Course incomplete", issues: validation.issues },
        { status: 400 }
      );
    }

    // Prepare changes summary
    const changesSummary = {
      homepage: {
        title: course.homepage?.mainTitleLine1 || "Not set",
        sectionsCount: (course.homepage?.customSections?.length || 0),
        hasVideo: !!course.homepage?.videoUrl,
        hasTestimonials: course.homepage?.testimonials?.testimonials?.length || 0,
        hasFAQ: course.homepage?.faqSection?.faqs?.length || 0,
      },
      modules: {
        count: course.modules.length,
        totalLessons: course.modules.reduce((sum: number, m: Module) => sum + m.lessons.length, 0),
        totalResources: course.modules.reduce((sum: number, m: Module) => 
          sum + m.lessons.reduce((lSum: number, l: Lesson) => lSum + l.resources.length, 0), 0
        ),
      },
      submittedAt: new Date().toISOString(),
    };

    // Update course status to PENDING
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: "PENDING",
        submittedAt: new Date(),
        pendingChanges: changesSummary,
        updatedAt: new Date(),
      },
      include: {
        homepage: true,
        modules: {
          include: {
            lessons: {
              include: { resources: true }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Course submitted for review",
      course: updatedCourse,
      summary: changesSummary,
    }, { status: 200 });

  } catch (error) {
    console.error("Error submitting course:", error);
    return NextResponse.json(
      { error: "Failed to submit course" },
      { status: 500 }
    );
  }
}

/**
 * Validate course has minimum required content
 */
function validateCourseForSubmission(course: CourseWithRelations) {
  const issues: string[] = [];

  // Homepage validation
  if (!course.homepage) {
    issues.push("Homepage not configured");
  } else {
    if (!course.homepage.mainTitleLine1?.trim()) {
      issues.push("Main title is required");
    }
    if (!course.homepage.subheadingText?.trim()) {
      issues.push("Subheading is required");
    }
  }

  // Modules validation
  if (!course.modules || course.modules.length === 0) {
    issues.push("At least one module is required");
  } else {
    course.modules.forEach((module: Module, idx: number) => {
      if (!module.title?.trim()) {
        issues.push(`Module ${idx + 1}: Title is required`);
      }
      if (!module.lessons || module.lessons.length === 0) {
        issues.push(`Module ${idx + 1}: At least one lesson is required`);
      }
    });
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}