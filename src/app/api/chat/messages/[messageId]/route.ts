// app/api/chat/messages/[messageId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { encryptMessage, decryptMessage } from '@/lib/encryption';

// PATCH - Edit message
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = await params;
    const { content } = await request.json();

    // Verify ownership
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId }
    });

    if (!message || message.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Encrypt new content
    const { encryptedContent, contentHash } = encryptMessage(content);
    const wordCount = content.trim().split(/\s+/).length;
    const characterCount = content.length;

    // Update message
    const updated = await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        encryptedContent,
        contentHash,
        wordCount,
        characterCount,
        isEdited: true,
        editedAt: new Date()
      }
    });

    return NextResponse.json({
      message: {
        ...updated,
        content,
        encryptedContent: undefined,
        contentHash: undefined
      }
    });

  } catch (error) {
    console.error('Edit message error:', error);
    return NextResponse.json(
      { error: 'Failed to edit message' },
      { status: 500 }
    );
  }
}

// DELETE - Delete message
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = await params;

    // Verify ownership
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId }
    });

    if (!message || message.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Soft delete
    await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}