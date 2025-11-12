// app/api/course/learning/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/utils/auth";
import prisma from "@/lib/prisma";

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
    const moduleId = searchParams.get("moduleId");

    if (!moduleId) {
      return NextResponse.json(
        { error: "Module ID required" },
        { status: 400 }
      );
    }

    // Fetch module with lessons and resources
    const module = await prisma.courseModule.findUnique({
      where: {
        id: moduleId,
      },
      include: {
        lessons: {
          include: {
            resources: {
              orderBy: {
                position: "asc",
              },
            },
          },
          orderBy: {
            position: "asc",
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!module) {
      return NextResponse.json(
        { error: "Module not found" },
        { status: 404 }
      );
    }

    // ✅ FETCH ALL LESSON PROGRESS FOR THIS MODULE
    const lessonProgress = await prisma.lessonProgress.findMany({
      where: {
        userId: user.id,
        moduleId: moduleId,
      },
    });

    // Create a map for quick lookup
    const progressMap = new Map(
      lessonProgress.map((p: { lessonId: string; isCompleted: boolean; progressPercent: number; lastPosition: number; watchTime: number | null }) => [p.lessonId, p])
    );

    // Calculate completed lessons count
    const completedLessons = lessonProgress.filter((p: { isCompleted: boolean }) => p.isCompleted).length;
    const totalLessons = module.lessons.length;
    
    // Calculate module progress percentage
    const moduleProgress = totalLessons > 0 
      ? Math.round((completedLessons / totalLessons) * 100) 
      : 0;

    // Calculate total duration - FIX: Add types to reduce parameters
    const totalMinutes = module.lessons.reduce((acc: number, lesson) => {
      const duration = lesson.videoDuration;
      const minutes = parseDuration(duration);
      return acc + minutes;
    }, 0);

    // Calculate total watch time
    const totalWatchTime = lessonProgress.reduce((acc: number, p: { watchTime: number | null }) => acc + (p.watchTime || 0), 0);

    // Transform lessons with progress data
    const transformedLessons = module.lessons.map((lesson, index) => {
      const progress = progressMap.get(lesson.id);
      
      // Find the index of the first incomplete lesson
      const firstIncompleteLessonIndex = module.lessons.findIndex((l, i) => {
        const lProgress = progressMap.get(l.id);
        return !lProgress?.isCompleted;
      });

      // Lock logic: 
      // - First lesson is always unlocked
      // - If no lessons completed, only first is unlocked
      // - Otherwise, lessons up to and including the first incomplete are unlocked
      let isLocked = false;
      if (index > 0) {
        if (completedLessons === 0) {
          isLocked = true; // Lock all except first if none completed
        } else if (firstIncompleteLessonIndex !== -1) {
          isLocked = index > firstIncompleteLessonIndex; // Lock lessons after first incomplete
        }
      }

      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        duration: lesson.videoDuration,
        videoUrl: lesson.videoUrl,
        isCompleted: progress?.isCompleted || false,
        progressPercent: progress?.progressPercent || 0,
        lastPosition: progress?.lastPosition || 0,
        watchTime: progress?.watchTime || 0,
        isLocked: isLocked,
        resources: lesson.resources.map((resource) => ({
          name: resource.title,
          type: resource.fileType,
          size: resource.fileSize,
          url: resource.fileUrl,
        })),
        transcript: lesson.description || "",
      };
    });

    const transformedData = {
      id: module.id,
      title: module.title,
      description: module.description,
      difficulty: module.difficulty,
      totalDuration: formatDuration(totalMinutes),
      progress: moduleProgress,
      completedLessons: completedLessons,
      totalLessons: totalLessons,
      totalWatchTime: Math.round(totalWatchTime / 60), // in minutes
      color: "from-red-600 to-red-700",
      course: {
        id: module.course.id,
        title: module.course.title,
      },
      lessons: transformedLessons,
    };

    return NextResponse.json(transformedData, { status: 200 });
  } catch (error) {
    console.error("Error fetching learning data:", error);
    return NextResponse.json(
      { error: "Failed to fetch learning data" },
      { status: 500 }
    );
  }
}

function parseDuration(duration: string): number {
  if (!duration) return 0;
  const hourMatch = duration.match(/(\d+)h/);
  const minuteMatch = duration.match(/(\d+)m/);
  const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
  const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
  return hours * 60 + minutes;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}