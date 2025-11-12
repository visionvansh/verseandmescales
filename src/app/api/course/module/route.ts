// app/api/course/module/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/utils/auth";
import prisma, { PrismaTx } from "@/lib/prisma";

// GET - Fetch a single module with all lessons and resources
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
    const moduleId = searchParams.get("id");

    if (!moduleId) {
      return NextResponse.json(
        { error: "Module ID is required" },
        { status: 400 }
      );
    }

    const module = await prisma.courseModule.findUnique({
      where: {
        id: moduleId,
        userId: user.id,
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
      },
    });

    if (!module) {
      return NextResponse.json(
        { error: "Module not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(module, { status: 200 });
  } catch (error) {
    console.error("Error fetching module:", error);
    return NextResponse.json(
      { error: "Failed to fetch module" },
      { status: 500 }
    );
  }
}

// PUT - Update module position/reorder
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
    const { modules } = body; // Array of { id, position }

    if (!modules || !Array.isArray(modules)) {
      return NextResponse.json(
        { error: "Invalid data format" },
        { status: 400 }
      );
    }

    // Update positions in transaction
    await prisma.$transaction(
      modules.map((module: { id: string; position: number }) =>
        prisma.courseModule.update({
          where: {
            id: module.id,
            userId: user.id,
          },
          data: {
            position: module.position,
          },
        })
      )
    );

    return NextResponse.json(
      { message: "Module order updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating module order:", error);
    return NextResponse.json(
      { error: "Failed to update module order" },
      { status: 500 }
    );
  }
}