// app/api/course/lesson/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/utils/auth";
import prisma from "@/lib/prisma";

// GET - Fetch a single lesson with resources
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    
    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get("id");

    if (!lessonId) {
      return NextResponse.json(
        { error: "Lesson ID is required" },
        { status: 400 }
      );
    }

    const lesson = await prisma.courseLesson.findUnique({
      where: {
        id: lessonId,
      },
      include: {
        resources: {
          orderBy: {
            position: "asc",
          },
        },
        module: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }

    // Verify user owns this lesson's module
    if (lesson.module.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json(lesson, { status: 200 });
  } catch (error) {
    console.error("Error fetching lesson:", error);
    return NextResponse.json(
      { error: "Failed to fetch lesson" },
      { status: 500 }
    );
  }
}

// PUT - Update lesson position/reorder
export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    
    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { lessons } = body; // Array of { id, position }

    if (!lessons || !Array.isArray(lessons)) {
      return NextResponse.json(
        { error: "Invalid data format" },
        { status: 400 }
      );
    }

    // Update positions in transaction
    await prisma.$transaction(
      lessons.map((lesson) =>
        prisma.courseLesson.update({
          where: {
            id: lesson.id,
          },
          data: {
            position: lesson.position,
          },
        })
      )
    );

    return NextResponse.json(
      { message: "Lesson order updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating lesson order:", error);
    return NextResponse.json(
      { error: "Failed to update lesson order" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific lesson
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    
    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get("id");

    if (!lessonId) {
      return NextResponse.json(
        { error: "Lesson ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership before deleting
    const lesson = await prisma.courseLesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          select: { userId: true },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }

    if (lesson.module.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Delete lesson (cascade will delete resources)
    await prisma.courseLesson.delete({
      where: {
        id: lessonId,
      },
    });

    return NextResponse.json(
      { message: "Lesson deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return NextResponse.json(
      { error: "Failed to delete lesson" },
      { status: 500 }
    );
  }
}