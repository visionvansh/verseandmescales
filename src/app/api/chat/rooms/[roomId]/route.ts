// app/api/chat/rooms/[roomId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ AWAIT params
    const { roomId } = await params;

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

    // Get room details
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        course: {
          select: {
            id: true,
            title: true
          }
        },
        analytics: true,
        _count: {
          select: {
            messages: true,
            participants: true
          }
        }
      }
    });

    return NextResponse.json({ room });
  } catch (error) {
    console.error('Get room error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room' },
      { status: 500 }
    );
  }
}