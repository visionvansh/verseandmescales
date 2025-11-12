// /Volumes/vision/codes/course/my-app/src/app/api/user/avatars/select/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';

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

// Request body type
interface SelectAvatarRequestBody {
  avatarIndex: number;
  style?: string;
}

// Response types
interface SuccessResponse {
  success: true;
  avatar: PrismaAvatar;
}

interface ErrorResponse {
  error: string;
}

type SelectAvatarResponse = SuccessResponse | ErrorResponse;

export async function POST(request: NextRequest): Promise<NextResponse<SelectAvatarResponse>> {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SelectAvatarRequestBody = await request.json();
    const { avatarIndex, style } = body;

    // Unset all primary avatars
    await prisma.avatar.updateMany({
      where: { userId: user.id, isPrimary: true },
      data: { isPrimary: false },
    });

    // Check if avatar exists
    let avatar = await prisma.avatar.findUnique({
      where: {
        userId_avatarIndex: {
          userId: user.id,
          avatarIndex: avatarIndex,
        },
      },
    }) as PrismaAvatar | null;

    if (!avatar) {
      // Create new avatar
      avatar = await prisma.avatar.create({
        data: {
          userId: user.id,
          avatarIndex: avatarIndex,
          avatarSeed: `${user.id}-${avatarIndex}`,
          avatarStyle: style || 'avataaars',
          isPrimary: true,
          name: `Avatar #${avatarIndex}`,
        },
      }) as PrismaAvatar;
    } else {
      // Set as primary and update style
      avatar = await prisma.avatar.update({
        where: { id: avatar.id },
        data: { 
          isPrimary: true,
          avatarStyle: style || avatar.avatarStyle || 'avataaars',
        },
      }) as PrismaAvatar;
    }

    // Update user's img field if using generated avatar
    if (avatarIndex >= 0) {
      await prisma.student.update({
        where: { id: user.id },
        data: { img: null }, // Clear custom image
      });
    }

    return NextResponse.json({ success: true, avatar });
  } catch (error) {
    console.error('Failed to select avatar:', error);
    return NextResponse.json({ error: 'Failed to select avatar' }, { status: 500 });
  }
}