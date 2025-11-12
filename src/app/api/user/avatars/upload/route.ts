// /Volumes/vision/codes/course/my-app/src/app/api/user/avatars/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Type for Cloudinary upload response
interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  [key: string]: unknown;
}

// Type for Prisma Avatar
interface PrismaAvatar {
  id: string;
  userId: string;
  avatarIndex: number;
  avatarSeed: string;
  avatarStyle: string;
  name: string | null;
  isPrimary: boolean;
  isCustomUpload: boolean;
  customImageUrl: string | null;
  styleConfig: any;
  createdAt: Date;
  updatedAt: Date;
}

// Response types
interface SuccessResponse {
  success: true;
  avatar: PrismaAvatar;
  imageUrl: string;
}

interface ErrorResponse {
  error: string;
}

type UploadAvatarResponse = SuccessResponse | ErrorResponse;

export async function POST(request: NextRequest): Promise<NextResponse<UploadAvatarResponse>> {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload to Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    const uploadResponse = await cloudinary.uploader.upload(dataURI, {
      folder: 'avatars',
      upload_preset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    }) as CloudinaryUploadResponse;

    // Unset all primary avatars
    await prisma.avatar.updateMany({
      where: { userId: user.id, isPrimary: true },
      data: { isPrimary: false },
    });

    // Create or update custom avatar
    const avatar = await prisma.avatar.upsert({
      where: {
        userId_avatarIndex: {
          userId: user.id,
          avatarIndex: -1, // -1 indicates custom upload
        },
      },
      create: {
        userId: user.id,
        avatarIndex: -1,
        avatarSeed: `${user.id}-custom`,
        avatarStyle: 'custom',
        isPrimary: true,
        isCustomUpload: true,
        customImageUrl: uploadResponse.secure_url,
        name: 'Custom Avatar',
      },
      update: {
        isPrimary: true,
        customImageUrl: uploadResponse.secure_url,
      },
    }) as PrismaAvatar;

    // Update user's img field
    await prisma.student.update({
      where: { id: user.id },
      data: { img: uploadResponse.secure_url },
    });

    return NextResponse.json({
      success: true,
      avatar,
      imageUrl: uploadResponse.secure_url,
    });
  } catch (error) {
    console.error('Failed to upload avatar:', error);
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}