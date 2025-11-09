// app/api/chat/messages/[messageId]/reactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = await params;
    const { emoji } = await request.json();

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Toggle reaction
    const existing = await prisma.chatReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: user.id,
          emoji
        }
      }
    });

    if (existing) {
      await prisma.chatReaction.delete({
        where: { id: existing.id }
      });
    } else {
      await prisma.chatReaction.create({
        data: {
          messageId,
          userId: user.id,
          emoji
        }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Toggle reaction error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle reaction' },
      { status: 500 }
    );
  }
}