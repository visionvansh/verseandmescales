//Volumes/vision/codes/course/my-app/src/app/api/course/coursemaker/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/utils/auth";
import prisma, { PrismaTx } from "@/lib/prisma";

// Define types for the data structures
interface LessonResource {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
  fileSize: string;
  position: number;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  videoDuration: string;
  videoSize: string;
  resources: LessonResource[];
}

interface ModuleData {
  id: string;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  learningOutcomes: string[];
  lessons: Lesson[];
}

// Type for incoming module data from request
interface IncomingModuleData {
  id: string;
  title?: string;
  description?: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  learningOutcomes?: string[];
  lessons?: IncomingLessonData[];
}

interface IncomingLessonData {
  id: string;
  title?: string;
  description?: string;
  videoUrl?: string;
  videoDuration?: string;
  videoSize?: string;
  resources?: IncomingResourceData[];
}

interface IncomingResourceData {
  id: string;
  title?: string;
  description?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: string;
}

// Type for Prisma query results
interface PrismaModule {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  learningOutcomes: string[];
  lessons: PrismaLesson[];
}

interface PrismaLesson {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  videoDuration: string | null;
  videoSize: string | null;
  resources: PrismaResource[];
}

interface PrismaResource {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  fileSize: string | null;
}

// GET - Fetch course data (modules, lessons, resources)
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    if (!courseId) {
      return NextResponse.json({ error: "Course ID required" }, { status: 400 });
    }
    // Fetch all modules with lessons and resources for this course
    const modules: PrismaModule[] = await prisma.courseModule.findMany({
      where: {
        courseId: courseId,
        userId: user.id,
      },
      include: {
        lessons: {
          include: {
            resources: {
              orderBy: { position: "asc" },
            },
          },
          orderBy: { position: "asc" },
        },
      },
      orderBy: { position: "asc" },
    });
    // Transform to match frontend interface
    const courseData = {
      id: courseId,
      modules: modules.map((module: PrismaModule) => ({
        id: module.id,
        title: module.title,
        description: module.description || "",
        difficulty: module.difficulty as "Beginner" | "Intermediate" | "Advanced",
        learningOutcomes: module.learningOutcomes,
        lessons: module.lessons.map((lesson: PrismaLesson) => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description || "",
          videoUrl: lesson.videoUrl || "",
          videoDuration: lesson.videoDuration || "",
          videoSize: lesson.videoSize || "",
          resources: lesson.resources.map((resource: PrismaResource) => ({
            id: resource.id,
            title: resource.title,
            description: resource.description || "",
            fileUrl: resource.fileUrl,
            fileType: resource.fileType,
            fileSize: resource.fileSize || "",
          })),
        })),
      })),
    };
    return NextResponse.json(courseData, { status: 200 });
  } catch (error) {
    console.error("Error fetching course data:", error);
    return NextResponse.json({ error: "Failed to fetch course data" }, { status: 500 });
  }
}

// POST - Save course data (modules, lessons, resources)
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;
    const body = await req.json();
    const { courseId, modules }: { courseId: string; modules: IncomingModuleData[] } = body;
    if (!courseId) {
      return NextResponse.json({ error: "Course ID required" }, { status: 400 });
    }
    if (!modules || !Array.isArray(modules)) {
      return NextResponse.json({ error: "Invalid course data format" }, { status: 400 });
    }
    // ✅ Increase transaction timeout to 30 seconds
    await prisma.$transaction(async (tx: PrismaTx) => {
      // Update course last edited section
      await tx.course.update({
        where: { id: courseId, userId },
        data: {
          lastEditedSection: "modules",
          updatedAt: new Date(),
        },
      });
      // Get existing module IDs
      const existingModules: { id: string }[] = await tx.courseModule.findMany({
        where: { courseId, userId },
        select: { id: true },
      });
      const existingModuleIds: string[] = existingModules.map((m: { id: string }) => m.id);
      const incomingModuleIds: string[] = modules
        .filter((m: IncomingModuleData) => !m.id.startsWith("module-"))
        .map((m: IncomingModuleData) => m.id);
      // Delete modules that are no longer present
      const modulesToDelete = existingModuleIds.filter((id) => !incomingModuleIds.includes(id));
      if (modulesToDelete.length > 0) {
        await tx.courseModule.deleteMany({
          where: {
            id: { in: modulesToDelete },
            userId,
            courseId,
          },
        });
      }
      // Process each module
      for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
        const moduleData: IncomingModuleData = modules[moduleIndex];
        const isNewModule = moduleData.id.startsWith("module-");
        let moduleId: string;
        if (isNewModule) {
          // Create new module
          const newModule = await tx.courseModule.create({
            data: {
              courseId,
              userId,
              title: moduleData.title || "New Module",
              description: moduleData.description || "",
              difficulty: moduleData.difficulty || "Beginner",
              learningOutcomes: moduleData.learningOutcomes || [],
              position: moduleIndex,
            },
          });
          moduleId = newModule.id;
        } else {
          // Update existing module
          await tx.courseModule.update({
            where: { id: moduleData.id, userId },
            data: {
              title: moduleData.title,
              description: moduleData.description,
              difficulty: moduleData.difficulty,
              learningOutcomes: moduleData.learningOutcomes,
              position: moduleIndex,
            },
          });
          moduleId = moduleData.id;
        }
        // Handle lessons
        const lessons: IncomingLessonData[] = moduleData.lessons || [];
        // Get existing lesson IDs for this module
        const existingLessons: { id: string }[] = await tx.courseLesson.findMany({
          where: { moduleId },
          select: { id: true },
        });
        const existingLessonIds: string[] = existingLessons.map((l: { id: string }) => l.id);
        const incomingLessonIds: string[] = lessons
          .filter((l: IncomingLessonData) => !l.id.startsWith("lesson-"))
          .map((l: IncomingLessonData) => l.id);
        // Delete lessons that are no longer present
        const lessonsToDelete = existingLessonIds.filter((id) => !incomingLessonIds.includes(id));
        if (lessonsToDelete.length > 0) {
          await tx.courseLesson.deleteMany({
            where: {
              id: { in: lessonsToDelete },
              moduleId,
            },
          });
        }
        // Process each lesson
        for (let lessonIndex = 0; lessonIndex < lessons.length; lessonIndex++) {
          const lessonData: IncomingLessonData = lessons[lessonIndex];
          const isNewLesson = lessonData.id.startsWith("lesson-");
          let lessonId: string;
          if (isNewLesson) {
            // Create new lesson
            const newLesson = await tx.courseLesson.create({
              data: {
                moduleId,
                title: lessonData.title || "New Lesson",
                description: lessonData.description || "",
                videoUrl: lessonData.videoUrl || "",
                videoDuration: lessonData.videoDuration || "",
                videoSize: lessonData.videoSize || "",
                position: lessonIndex,
              },
            });
            lessonId = newLesson.id;
          } else {
            // Update existing lesson
            await tx.courseLesson.update({
              where: { id: lessonData.id },
              data: {
                title: lessonData.title,
                description: lessonData.description,
                videoUrl: lessonData.videoUrl,
                videoDuration: lessonData.videoDuration,
                videoSize: lessonData.videoSize,
                position: lessonIndex,
              },
            });
            lessonId = lessonData.id;
          }
          // Handle resources
          const resources: IncomingResourceData[] = lessonData.resources || [];
          // Get existing resource IDs for this lesson
          const existingResources: { id: string }[] = await tx.courseLessonResource.findMany({
            where: { lessonId },
            select: { id: true },
          });
          const existingResourceIds: string[] = existingResources.map((r: { id: string }) => r.id);
          const incomingResourceIds: string[] = resources
            .filter((r: IncomingResourceData) => !r.id.startsWith("resource-"))
            .map((r: IncomingResourceData) => r.id);
          // Delete resources that are no longer present
          const resourcesToDelete = existingResourceIds.filter((id) => !incomingResourceIds.includes(id));
          if (resourcesToDelete.length > 0) {
            await tx.courseLessonResource.deleteMany({
              where: {
                id: { in: resourcesToDelete },
                lessonId,
              },
            });
          }
          // Process each resource
          for (let resourceIndex = 0; resourceIndex < resources.length; resourceIndex++) {
            const resourceData: IncomingResourceData = resources[resourceIndex];
            const isNewResource = resourceData.id.startsWith("resource-");
            if (isNewResource) {
              // Create new resource
              await tx.courseLessonResource.create({
                data: {
                  lessonId,
                  title: resourceData.title || "New Resource",
                  description: resourceData.description || "",
                  fileUrl: resourceData.fileUrl || "",
                  fileType: resourceData.fileType || "PDF",
                  fileSize: resourceData.fileSize || "",
                  position: resourceIndex,
                },
              });
            } else {
              // Update existing resource
              await tx.courseLessonResource.update({
                where: { id: resourceData.id },
                data: {
                  title: resourceData.title,
                  description: resourceData.description,
                  fileUrl: resourceData.fileUrl,
                  fileType: resourceData.fileType,
                  fileSize: resourceData.fileSize,
                  position: resourceIndex,
                },
              });
            }
          }
        }
      }
    }, {
      maxWait: 30000, // 30 seconds max wait time
      timeout: 30000, // 30 seconds timeout
    });
    return NextResponse.json({ message: "Course saved successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error saving course data:", error);
    return NextResponse.json({ error: "Failed to save course data" }, { status: 500 });
  }
}

// DELETE - Delete a specific module
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;
    const { searchParams } = new URL(req.url);
    const moduleId = searchParams.get("moduleId");
    const courseId = searchParams.get("courseId");
    if (!moduleId) {
      return NextResponse.json({ error: "Module ID is required" }, { status: 400 });
    }
    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }
    // Delete module (cascade will delete lessons and resources)
    await prisma.courseModule.delete({
      where: {
        id: moduleId,
        userId,
        courseId,
      },
    });
    return NextResponse.json({ message: "Module deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting module:", error);
    return NextResponse.json({ error: "Failed to delete module" }, { status: 500 });
  }
}