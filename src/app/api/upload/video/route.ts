import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getAuthUser } from "@/utils/auth";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ NEW: Handle chunked upload initiation
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

    if (!file.type.startsWith("video/")) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const maxSize = 3 * 1024 * 1024 * 1024; // 3GB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 3GB limit" }, { status: 400 });
    }

    console.log(`📤 Starting upload: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ✅ Use chunked upload with larger chunk size
    const result: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: folder,
          chunk_size: 20000000, // 20MB chunks (increased from 6MB)
          timeout: 600000, // 10 minutes timeout
          eager_async: true,
          format: "mp4",
        },
        (error, result) => {
          if (error) {
            console.error("❌ Cloudinary error:", error);
            reject(error);
          } else {
            console.log("✅ Upload complete:", result?.secure_url);
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
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "3gb", // ✅ Set explicit limit
    },
  },
};

export const maxDuration = 300; // 5 minutes