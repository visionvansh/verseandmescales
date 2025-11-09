// app/api/course/modules/route.ts
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
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID required" },
        { status: 400 }
      );
    }

    // Fetch all modules with lessons
    const modules = await prisma.courseModule.findMany({
      where: {
        courseId: courseId,
      },
      include: {
        lessons: {
          include: {
            resources: true,
          },
          orderBy: {
            position: "asc",
          },
        },
      },
      orderBy: {
        position: "asc",
      },
    });

    // ✅ FETCH ALL LESSON PROGRESS FOR THIS COURSE
    const allLessonProgress = await prisma.lessonProgress.findMany({
      where: {
        userId: user.id,
        courseId: courseId,
      },
    });

    // Create progress map
    const progressMap = new Map(
      allLessonProgress.map((p) => [p.lessonId, p])
    );

    // Transform modules with progress
    const transformedModules = modules.map((module) => {
      // Calculate total duration
      const totalMinutes = module.lessons.reduce((acc, lesson) => {
        const minutes = parseDuration(lesson.videoDuration);
        return acc + minutes;
      }, 0);

      // Calculate module progress
      const moduleLessonIds = module.lessons.map((l) => l.id);
      const moduleProgress = allLessonProgress.filter(
        (p) => moduleLessonIds.includes(p.lessonId)
      );
      const completedCount = moduleProgress.filter((p) => p.isCompleted).length;
      const progressPercent = module.lessons.length > 0
        ? Math.round((completedCount / module.lessons.length) * 100)
        : 0;

      const totalDuration = formatDuration(totalMinutes);
      const videoCount = module.lessons.length;
      const lessonCount = module.lessons.length;

      return {
        id: module.id,
        title: module.title,
        description: module.description,
        difficulty: module.difficulty,
        duration: totalDuration,
        lessonCount: lessonCount,
        videoCount: videoCount,
        totalDuration: totalDuration,
        progress: progressPercent,
        completedLessons: completedCount,
        totalLessons: module.lessons.length,
        learningOutcomes: module.learningOutcomes,
        lessons: module.lessons.map((lesson, index) => {
          const progress = progressMap.get(lesson.id);
          
          // First incomplete lesson index in this module
          const firstIncomplete = module.lessons.findIndex((l) => {
            const lp = progressMap.get(l.id);
            return !lp?.isCompleted;
          });

          let isLocked = false;
          if (index > 0) {
            if (completedCount === 0) {
              isLocked = true;
            } else if (firstIncomplete !== -1) {
              isLocked = index > firstIncomplete;
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
            watchTime: progress?.watchTime || 0,
            isLocked: isLocked,
            resources: lesson.resources.map((resource) => ({
              id: resource.id,
              name: resource.title,
              type: resource.fileType,
              size: resource.fileSize,
              url: resource.fileUrl,
            })),
          };
        }),
      };
    });

    return NextResponse.json(transformedModules, { status: 200 });
  } catch (error) {
    console.error("Error fetching modules:", error);
    return NextResponse.json(
      { error: "Failed to fetch modules" },
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