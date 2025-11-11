//Volumes/vision/codes/course/my-app/src/app/api/studio/verify-password/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    // ✅ Simple password check from .env
    const correctPassword = process.env.STUDIO_ACCESS_PASSWORD;

    if (!correctPassword) {
      return NextResponse.json(
        { error: "Studio password not configured" },
        { status: 500 }
      );
    }

    if (password === correctPassword) {
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
  } catch (error) {
    console.error("Password verification error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}