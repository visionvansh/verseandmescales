//Volumes/vision/codes/course/my-app/src/app/api/course/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/utils/auth";
import prisma from "@/lib/prisma";

// GET - Fetch all courses for user
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // DRAFT, PUBLISHED, ARCHIVED
    const courseId = searchParams.get("id");

    // Get single course
    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId, userId: user.id },
        include: {
          homepage: {
            include: {
              customSections: { orderBy: { position: 'asc' } },
              proofSection: { include: { images: { orderBy: { position: 'asc' } } } },
              testimonials: { include: { testimonials: { orderBy: { position: 'asc' } } } },
              faqSection: { include: { faqs: { orderBy: { position: 'asc' } } } },
              footer: true,
              sectionBadges: true,
              courseStats: true,
            }
          },
          modules: {
            include: {
              lessons: {
                include: {
                  resources: { orderBy: { position: 'asc' } }
                },
                orderBy: { position: 'asc' }
              }
            },
            orderBy: { position: 'asc' }
          }
        }
      });

      if (!course) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
      }

      return NextResponse.json(course, { status: 200 });
    }

    // Get all courses
    const whereClause: any = { userId: user.id };
    if (status) whereClause.status = status;

    const courses = await prisma.course.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        price: true,
        salePrice: true,
        status: true,
        isPublished: true,
        publishedAt: true,
        submittedAt: true,
        completionPercentage: true,
        lastEditedSection: true,
        homepageType: true,
        customHomepageFile: true,
        createdAt: true,
        updatedAt: true,
        homepage: {
          select: {
            mainTitleLine1: true,
            videoUrl: true,
            courseStats: {
              select: {
                activeStudents: true,
                courseRating: true,
              }
            }
          }
        },
        modules: {
          select: { id: true },
        },
        _count: {
          select: {
            modules: true,
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(courses, { status: 200 });

  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

// POST - Create new course
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title } = body;

    const course = await prisma.course.create({
      data: {
        userId: user.id,
        title: title || "Untitled Course",
        status: "DRAFT",
        homepage: {
          create: {
            userId: user.id,
            backgroundType: 'black',
            backgroundColor: '#000000',
            mainTitleLine1: '',
            subheadingText: '',
            videoUrl: '',
            faqSection: {
              create: {
                title: 'GOT QUESTIONS?',
                titleWords: [
                  { text: 'GOT', shade: 'red-gradient-1' },
                  { text: 'QUESTIONS?', shade: 'red-gradient-1' }
                ]
              }
            },
            courseStats: {
              create: {
                userId: user.id,
                activeStudents: 0,
                courseRating: 0.0,
                monthlyIncome: '\$0',
                avgGrowth: '0'
              }
            }
          }
        }
      },
      include: {
        homepage: true,
        modules: true,
      }
    });

    return NextResponse.json(course, { status: 201 });

  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}

// PATCH - Update course status/metadata
export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { courseId, status, title, description, lastEditedSection, completionPercentage } = body;

    if (!courseId) {
      return NextResponse.json({ error: "Course ID required" }, { status: 400 });
    }

    const updateData: any = { updatedAt: new Date() };
    
    if (status) {
      updateData.status = status;
      if (status === "PUBLISHED") {
        updateData.isPublished = true;
        updateData.publishedAt = new Date();
      } else if (status === "DRAFT") {
        updateData.isPublished = false;
      }
    }
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (lastEditedSection) updateData.lastEditedSection = lastEditedSection;
    if (completionPercentage !== undefined) updateData.completionPercentage = completionPercentage;

    const course = await prisma.course.update({
      where: { id: courseId, userId: user.id },
      data: updateData,
      include: {
        homepage: true,
        modules: true,
      }
    });

    return NextResponse.json(course, { status: 200 });

  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

// DELETE - Delete course
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("id");

    if (!courseId) {
      return NextResponse.json({ error: "Course ID required" }, { status: 400 });
    }

    await prisma.course.delete({
      where: { id: courseId, userId: user.id }
    });

    return NextResponse.json({ message: "Course deleted successfully" }, { status: 200 });

  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}