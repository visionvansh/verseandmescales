// app/api/chat/upload-media/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getAuthUser } from '@/utils/auth'; // Fixed path – matches your file location
import prisma from '@/lib/prisma';

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Allowed file types & size limits
const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov'],
  pdf: ['application/pdf'],
} as const;

const MAX_FILE_SIZE = {
  image: 10 * 1024 * 1024,  // 10 MB
  video: 100 * 1024 * 1024, // 100 MB
  pdf: 100 * 1024 * 1024,   // 100 MB

} as const;

type FileCategory = keyof typeof ALLOWED_TYPES;

export async function POST(request: NextRequest) {
  try {
    // Authentication – using your auth.ts logic
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized – please log in' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const roomId = formData.get('roomId') as string;

    if (!file || !roomId) {
      return NextResponse.json(
        { error: 'Both file and roomId are required' },
        { status: 400 }
      );
    }

    // Determine file category
    let fileCategory: FileCategory;
    if (ALLOWED_TYPES.image.includes(file.type as any)) {
      fileCategory = 'image';
    } else if (ALLOWED_TYPES.video.includes(file.type as any)) {
      fileCategory = 'video';
    } else if (ALLOWED_TYPES.pdf.includes(file.type as any)) {
      fileCategory = 'pdf';
    } else {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: images (jpeg, png, gif, webp), videos ( Mp4, webm, mov), and PDFs.' },
        { status: 400 }
      );
    }

    // Size validation
    if (file.size > MAX_FILE_SIZE[fileCategory]) {
      return NextResponse.json(
        {
          error: `File too large. Max size for ${fileCategory}: ${
            MAX_FILE_SIZE[fileCategory] / (1024 * 1024)
          } MB`,
        },
        { status: 400 }
      );
    }

    // Convert to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `chat/${roomId}`,
          resource_type: fileCategory === 'pdf' ? 'raw' : (fileCategory as 'image' | 'video'),
          upload_preset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
          transformation:
            fileCategory === 'image'
              ? [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto:best' }]
              : undefined,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!);
        }
      );

      uploadStream.end(buffer);
    });

    // Generate video thumbnail if needed
    const thumbnailUrl =
      fileCategory === 'video' && result.public_id
        ? cloudinary.url(result.public_id, {
            resource_type: 'video',
            format: 'jpg',
            quality: 'auto',
            width: 400,
            crop: 'scale',
          })
        : undefined;

    // Response data
    const mediaData = {
      url: result.secure_url,
      publicId: result.public_id,
      type: fileCategory,
      fileName: file.name,
      fileSize: file.size,
      width: result.width ?? null,
      height: result.height ?? null,
      duration: result.duration ?? null,
      thumbnail: thumbnailUrl,
    };

    return NextResponse.json({ success: true, media: mediaData }, { status: 200 });
  } catch (error: any) {
    console.error('Media upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload media' },
      { status: 500 }
    );
  }
}