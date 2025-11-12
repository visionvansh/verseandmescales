// src/app/api/profile/upload-avatar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

// ============================================
// TYPE DEFINITIONS
// ============================================

type CloudinaryUploadResult = UploadApiResponse;

type UpdatedUser = {
  id: string;
  username: string;
  email: string;
  img: string | null;
  name: string | null;
  surname: string | null;
};

type WebSocketClient = {
  readyState: number;
  send: (data: string) => void;
};

type GlobalWithWSS = typeof globalThis & {
  wss?: {
    clients: Set<WebSocketClient>;
  };
};

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'profile-avatars',
          transformation: [
            { width: 500, height: 500, crop: 'fill', gravity: 'face' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else if (result) resolve(result);
          else reject(new Error('Upload failed without error'));
        }
      );

      uploadStream.end(buffer);
    });

    // Update user's avatar in database
    const updatedUser = await prisma.student.update({
      where: { id: user.id },
      data: { img: result.secure_url },
      select: {
        id: true,
        username: true,
        email: true,
        img: true,
        name: true,
        surname: true
      }
    }) as UpdatedUser;

    // Broadcast update via WebSocket
    const globalWithWSS = global as GlobalWithWSS;
    if (globalWithWSS.wss) {
      globalWithWSS.wss.clients.forEach((client: WebSocketClient) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            event: 'profile:updated',
            data: { userId: user.id, avatar: result.secure_url }
          }));
        }
      });
    }

    return NextResponse.json({
      success: true,
      imageUrl: result.secure_url,
      user: updatedUser
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}