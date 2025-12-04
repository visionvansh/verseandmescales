import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/utils/auth";

// ✅ Initialize chunked upload session
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileName, fileSize, folder } = await req.json();

    // Generate upload signature for Cloudinary
    const timestamp = Math.round(Date.now() / 1000);
    const cloudinary = require("cloudinary").v2;
    
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder: folder || "course-videos",
        resource_type: "video",
      },
      process.env.CLOUDINARY_API_SECRET!
    );

    return NextResponse.json({
      timestamp,
      signature,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder: folder || "course-videos",
    });
  } catch (error: any) {
    console.error("❌ Chunked upload init error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}