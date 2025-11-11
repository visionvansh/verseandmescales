// app/api/chat/rooms/[roomId]/participants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { getAvatarUrlFromUser } from '@/utils/avatarGenerator'; // ✅ ADD THIS

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> } // ✅ CHANGED TO Promise
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId } = await params; // ✅ AWAIT params

    // Verify access
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId: user.id
        }
      }
    });

    if (!participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // ✅ GET PARTICIPANTS WITH AVATARS
    const participants = await prisma.chatParticipant.findMany({
      where: { roomId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            img: true,
            isOnline: true,
            lastActiveAt: true,
            // ✅ INCLUDE AVATARS
            avatars: {
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                avatarIndex: true,
                avatarSeed: true,
                avatarStyle: true,
                isPrimary: true,
                isCustomUpload: true,
                customImageUrl: true,
              }
            },
            // ✅ INCLUDE USER METADATA FOR HOVER CARD
            userXP: {
              select: {
                totalXP: true,
                contributorTitle: true
              }
            },
            badges: {
              where: { isEarned: true, isDisplayed: true },
              orderBy: { displayOrder: 'asc' },
              take: 3,
              select: {
                id: true,
                title: true,
                icon: true,
                color: true
              }
            },
            _count: {
              select: {
                followers: true,
                following: true,
                courses: true
              }
            }
          }
        }
      },
      orderBy: [
        { isOnline: 'desc' },
        { lastSeen: 'desc' }
      ]
    });

    // ✅ TRANSFORM PARTICIPANTS WITH AVATAR URLs
    const transformedParticipants = participants.map((p: typeof participants[number]) => {
      const avatarUrl = getAvatarUrlFromUser(p.user, 64);
      const primaryAvatar = p.user.avatars?.find((a: any) => a.isPrimary) || p.user.avatars?.[0] || null;

      return {
        ...p,
        user: {
          ...p.user,
          avatar: avatarUrl,
          avatarObject: primaryAvatar,
          // ✅ ADD HOVER CARD DATA
          xp: p.user.userXP?.totalXP || 0,
          seekers: p.user._count.followers,
          seeking: p.user._count.following,
          coursesMade: p.user._count.courses,
          badges: p.user.badges.map((badge: any) => ({
            id: badge.id,
            name: badge.title,
            icon: badge.icon,
            color: badge.color
          }))
        }
      };
    });

    return NextResponse.json({ participants: transformedParticipants });
  } catch (error) {
    console.error('Get participants error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 }
    );
  }
}