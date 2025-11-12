// app/api/posts/[postId]/likes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { getAvatarUrlFromUser } from '@/utils/avatarGenerator';

type LikeUserData = {
  id: string;
  username: string;
  name: string | null;
  img: string | null;
  avatars: Array<{
    id: string;
    avatarIndex: number;
    avatarSeed: string;
    avatarStyle: string;
    isPrimary: boolean;
    isCustomUpload: boolean;
    customImageUrl: string | null;
  }>;
  userXP: {
    totalXP: number;
    contributorTitle: string;
  } | null;
};

type LikeData = {
  id: string;
  createdAt: Date;
  user: LikeUserData;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    const likes = await prisma.postLike.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            img: true,
            avatars: {
              where: { isPrimary: true },
              take: 1,
              select: {
                id: true,
                avatarIndex: true,
                avatarSeed: true,
                avatarStyle: true,
                isPrimary: true,
                isCustomUpload: true,
                customImageUrl: true
              }
            },
            userXP: {
              select: {
                totalXP: true,
                contributorTitle: true
              }
            }
          }
        }
      }
    }) as LikeData[];

    const users = likes.map((like: LikeData) => {
      const avatarUrl = getAvatarUrlFromUser(like.user, 48);
      return {
        ...like.user,
        img: avatarUrl,
        avatar: avatarUrl
      };
    });

    return NextResponse.json({ users });

  } catch (error) {
    console.error('Get likes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch likes' },
      { status: 500 }
    );
  }
}