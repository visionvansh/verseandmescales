// /Volumes/vision/codes/course/my-app/src/app/api/studio/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.STUDIO_JWT_SECRET || "your-secret-key-change-this";

// Type for Prisma query result
interface CustomCoursesAccessRecord {
  id: string;
  accessKey: string;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body as { password: string };

    // ✅ Check password against database
    const accessRecord = await prisma.customCoursesAccess.findFirst() as CustomCoursesAccessRecord | null;

    if (!accessRecord) {
      // ✅ First time setup - create with provided password
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.customCoursesAccess.create({
        data: { accessKey: hashedPassword },
      });

      const token = jwt.sign({ authorized: true }, JWT_SECRET, { expiresIn: "24h" });

      return NextResponse.json({ token }, { status: 200 });
    }

    // ✅ Verify password
    const isValid = await bcrypt.compare(password, accessRecord.accessKey);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Update last used
    await prisma.customCoursesAccess.update({
      where: { id: accessRecord.id },
      data: { lastUsedAt: new Date() },
    });

    const token = jwt.sign({ authorized: true }, JWT_SECRET, { expiresIn: "24h" });

    return NextResponse.json({ token }, { status: 200 });
  } catch (error) {
    console.error("Studio auth error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}