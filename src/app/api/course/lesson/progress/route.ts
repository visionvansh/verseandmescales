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

    // ✅ First, check if there's existing progress
    const existingProgress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: lessonId,
        },
      },
    });

    // ✅ CRITICAL: Once completed, NEVER revert to incomplete
    const wasAlreadyCompleted = existingProgress?.isCompleted || false;
    const shouldMarkCompleted = wasAlreadyCompleted || isCompleted || false;

    // ✅ For completed lessons: keep progressPercent at 100, but still track position
    const finalProgressPercent = wasAlreadyCompleted 
      ? 100 
      : (progressPercent || 0);

    // ✅ Keep the higher watch time (cumulative tracking)
    const finalWatchTime = Math.max(existingProgress?.watchTime || 0, watchTime || 0);

    // Upsert lesson progress
    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: lessonId,
        },
      },
      update: {
        watchTime: finalWatchTime,
        progressPercent: finalProgressPercent,
        lastPosition: lastPosition || 0, // ✅ Always update position for resume functionality
        isCompleted: shouldMarkCompleted, // ✅ Never goes from true to false
        completedAt: shouldMarkCompleted && !existingProgress?.completedAt 
          ? new Date() 
          : existingProgress?.completedAt, // ✅ Keep original completion date
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
        completedAt: isCompleted ? new Date() : null,
        lastWatchedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        progress: progress,
        wasAlreadyCompleted, // ✅ Let frontend know if it was already complete
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