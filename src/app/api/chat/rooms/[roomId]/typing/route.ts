// app/api/chat/rooms/[roomId]/typing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId } = await params;
    const { isTyping } = await request.json();

    if (isTyping) {
      await prisma.chatTypingIndicator.upsert({
        where: {
          roomId_userId: {
            roomId,
            userId: user.id
          }
        },
        create: {
          roomId,
          userId: user.id,
          isTyping: true,
          expiresAt: new Date(Date.now() + 5000)
        },
        update: {
          isTyping: true,
          expiresAt: new Date(Date.now() + 5000)
        }
      });
    } else {
      await prisma.chatTypingIndicator.deleteMany({
        where: {
          roomId,
          userId: user.id
        }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Typing indicator error:', error);
    return NextResponse.json(
      { error: 'Failed to update typing status' },
      { status: 500 }
    );
  }
}