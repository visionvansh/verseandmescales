import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
    }

    // Find or create chat room for course
    let room = await prisma.chatRoom.findUnique({
      where: { courseId },
      select: { id: true }
    });

    if (!room) {
      // Create room if it doesn't exist
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { title: true }
      });

      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }

      room = await prisma.chatRoom.create({
        data: {
          courseId,
          name: `${course.title} - Chat Room`,
          isActive: true,
          allowStudentChat: true,
        },
        select: { id: true }
      });
    }

    return NextResponse.json({ roomId: room.id });
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json({ error: 'Failed to fetch room' }, { status: 500 });
  }
}