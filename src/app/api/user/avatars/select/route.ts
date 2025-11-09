//Volumes/vision/codes/course/my-app/src/app/api/user/avatars/select/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma  from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { avatarIndex, style } = await request.json();

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
    });

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
      });
    } else {
      // Set as primary and update style
      await prisma.avatar.update({
        where: { id: avatar.id },
        data: { 
          isPrimary: true,
          avatarStyle: style || avatar.avatarStyle || 'avataaars',
        },
      });
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