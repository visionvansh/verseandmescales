import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getAuthUser } from "@/utils/auth";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "course-videos";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("video/")) {
      return NextResponse.json({ error: "Invalid file type. Please upload a video file." }, { status: 400 });
    }

    // Check file size (3GB limit)
    const maxSize = 3 * 1024 * 1024 * 1024; // 3GB in bytes
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 3GB limit" }, { status: 400 });
    }

    console.log(`📤 Starting upload for file: ${file.name}, size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary with chunked upload (supports large files)
    const result: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: folder,
          chunk_size: 6000000, // 6MB chunks for optimal performance
          timeout: 300000, // 5 minutes timeout for large files
          eager_async: true, // Process video asynchronously
          format: "mp4", // Ensure consistent format
        },
        (error, result) => {
          if (error) {
            console.error("❌ Cloudinary upload error:", error);
            reject(error);
          } else {
            console.log("✅ Upload successful:", result?.secure_url);
            resolve(result);
          }
        }
      );

      uploadStream.end(buffer);
    });

    return NextResponse.json(
      {
        secure_url: result.secure_url,
        public_id: result.public_id,
        duration: result.duration,
        bytes: result.bytes,
        format: result.format,
        width: result.width,
        height: result.height,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}

// Configure for large file uploads
export const config = {
  api: {
    bodyParser: false, // Disable default body parser
    responseLimit: false, // No response limit
  },
};

// Set maximum duration for serverless function (if using Vercel)
export const maxDuration = 300; // 5 minutes