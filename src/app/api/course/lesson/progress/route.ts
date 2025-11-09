// app/api/course/lesson/progress/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/utils/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    
    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      lessonId,
      moduleId,
      courseId,
      watchTime,
      progressPercent,
      lastPosition,
      isCompleted,
    } = body;

    if (!lessonId || !moduleId || !courseId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Upsert lesson progress
    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: lessonId,
        },
      },
      update: {
        watchTime: watchTime || 0,
        progressPercent: progressPercent || 0,
        lastPosition: lastPosition || 0,
        isCompleted: isCompleted || false,
        completedAt: isCompleted ? new Date() : undefined,
        lastWatchedAt: new Date(),
      },
      create: {
        userId: user.id,
        lessonId: lessonId,
        moduleId: moduleId,
        courseId: courseId,
        watchTime: watchTime || 0,
        progressPercent: progressPercent || 0,
        lastPosition: lastPosition || 0,
        isCompleted: isCompleted || false,
        completedAt: isCompleted ? new Date() : undefined,
        lastWatchedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        progress: progress,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving lesson progress:", error);
    return NextResponse.json(
      { error: "Failed to save progress" },
      { status: 500 }
    );
  }
}

// GET - Fetch progress for a specific lesson
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
    const lessonId = searchParams.get("lessonId");

    if (!lessonId) {
      return NextResponse.json(
        { error: "Lesson ID required" },
        { status: 400 }
      );
    }

    const progress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: lessonId,
        },
      },
    });

    return NextResponse.json(progress || null, { status: 200 });
  } catch (error) {
    console.error("Error fetching lesson progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}