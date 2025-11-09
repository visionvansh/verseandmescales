// app/api/chat/questions/[id]/view/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: questionId } = await params;

    // ✅ FIX: Use upsert to avoid unique constraint violation
    const result = await prisma.$transaction(async (tx) => {
      // Upsert the view
      const view = await tx.questionView.upsert({
        where: {
          questionId_userId: {
            questionId,
            userId: user.id
          }
        },
        create: {
          questionId,
          userId: user.id
        },
        update: {
          viewedAt: new Date() // Update timestamp if already exists
        }
      });

      // Only increment if this was a new view (created, not updated)
      const wasNewView = view.viewedAt.getTime() === new Date().getTime();
      
      if (wasNewView) {
        await tx.question.update({
          where: { id: questionId },
          data: { viewCount: { increment: 1 } }
        });
      }

      // Get updated count
      const question = await tx.question.findUnique({
        where: { id: questionId },
        select: { viewCount: true }
      });

      return question;
    });

    return NextResponse.json({
      viewCount: result?.viewCount || 0
    });

  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    );
  }
}