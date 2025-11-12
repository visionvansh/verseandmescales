// app/api/course/video/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/utils/auth";
import prisma from "@/lib/prisma";

// Define types
type Resource = {
  title: string;
  fileType: string;
  fileSize: string;
  fileUrl: string;
  position: number;
};

type LessonInModule = {
  id: string;
  title: string;
  position: number;
};

type ModuleData = {
  id: string;
  title: string;
  lessons: LessonInModule[];
  course: {
    id: string;
    title: string;
  };
};

type LessonData = {
  id: string;
  title: string;
  description: string | null;
  videoDuration: string | null;
  videoUrl: string | null;
  resources: Resource[];
  module: ModuleData;
};

type LessonProgress = {
  isCompleted: boolean;
  progressPercent: number;
  lastPosition: number;
  watchTime: number | null;
};

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

    // Fetch lesson with resources and module info
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
          include: {
            lessons: {
              select: {
                id: true,
                title: true,
                position: true,
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
        },
      },
    }) as LessonData | null;

    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }

    // ✅ FETCH USER'S PROGRESS FOR THIS LESSON
    const lessonProgress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: lessonId,
        },
      },
    }) as LessonProgress | null;

    // Find related lessons (next 2 lessons in the module)
    const currentLessonIndex = lesson.module.lessons.findIndex(
      (l: LessonInModule) => l.id === lessonId
    );
    const relatedLessons = lesson.module.lessons
      .slice(currentLessonIndex + 1, currentLessonIndex + 3)
      .map((l: LessonInModule) => ({
        id: l.id,
        title: l.title,
      }));

    const transformedData = {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      duration: lesson.videoDuration,
      videoUrl: lesson.videoUrl,
      isCompleted: lessonProgress?.isCompleted || false,
      progressPercent: lessonProgress?.progressPercent || 0,
      lastPosition: lessonProgress?.lastPosition || 0,
      watchTime: lessonProgress?.watchTime || 0,
      resources: lesson.resources.map((resource: Resource) => ({
        name: resource.title,
        type: resource.fileType,
        size: resource.fileSize,
        url: resource.fileUrl,
      })),
      transcript: lesson.description || "Transcript coming soon...",
      keyTakeaways: [
        `Master ${lesson.title} concepts`,
        "Apply practical techniques in real-world scenarios",
        "Understand the core principles and best practices",
      ],
      relatedLessons: relatedLessons,
      module: {
        id: lesson.module.id,
        title: lesson.module.title,
      },
      course: {
        id: lesson.module.course.id,
        title: lesson.module.course.title,
      },
    };

    return NextResponse.json(transformedData, { status: 200 });
  } catch (error) {
    console.error("Error fetching video data:", error);
    return NextResponse.json(
      { error: "Failed to fetch video data" },
      { status: 500 }
    );
  }
}