// src/app/api/chat/rooms/course/[courseId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  console.log('🔥 POST /api/chat/rooms/course/[courseId] - Route HIT!');
  
  try {
    console.log('Request URL:', request.url);
    console.log('Request method:', request.method);
    
    const user = await getAuthUser(request);
    console.log('User authenticated:', user?.id);
    
    if (!user) {
      console.log('❌ No user - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await context.params;
    console.log('CourseId from params:', courseId);

    // ✅ Check if course exists (REMOVED userId check - anyone can join!)
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        userId: true,
        title: true,
        status: true
      }
    });

    console.log('📊 Course lookup result:', {
      found: !!course,
      courseData: course,
      requestedBy: user.id,
      isOwner: course?.userId === user.id
    });

    if (!course) {
      console.log('❌ Course does not exist in database');
      return NextResponse.json({ 
        error: 'Course not found',
        details: 'This course does not exist'
      }, { status: 404 });
    }

    // ✅ Check if course is published (optional - remove if you want to allow drafts)
    if (course.status !== 'PUBLISHED' && course.userId !== user.id) {
      console.log('❌ Course is not published and user is not the owner');
      return NextResponse.json({ 
        error: 'Course not available',
        details: 'This course is not published yet'
      }, { status: 403 });
    }

    console.log('✅ Course found - user can access');

    // ✅ Determine user role (owner = mentor, others = student)
    const userRole = course.userId === user.id ? 'mentor' : 'student';
    console.log(`User role: ${userRole} (isOwner: ${course.userId === user.id})`);

    // ✅ Create/get chat room
    const chatRoom = await prisma.chatRoom.upsert({
      where: { 
        courseId
      },
      update: {
        name: `${course.title} - Discussion`,
        description: `Chat room for ${course.title}`,
        updatedAt: new Date()
      },
      create: {
        courseId,
        name: `${course.title} - Discussion`,
        description: `Chat room for ${course.title}`
      }
    });

    console.log('✅ Chat room created/updated:', chatRoom.id);

    // ✅ Create analytics if they don't exist
    await prisma.chatRoomAnalytics.upsert({
      where: { roomId: chatRoom.id },
      update: {},
      create: { roomId: chatRoom.id }
    });

    // ✅ Create or update participant with dynamic role
    const participant = await prisma.chatParticipant.upsert({
      where: {
        roomId_userId: {
          roomId: chatRoom.id,
          userId: user.id
        }
      },
      create: {
        roomId: chatRoom.id,
        userId: user.id,
        role: userRole,  // ← Dynamic role based on ownership
        isOnline: true
      },
      update: {
        isOnline: true,
        lastSeen: new Date(),
        role: userRole  // ← Update role in case ownership changed
      }
    });

    console.log('✅ Participant created/updated:', {
      participantId: participant.id,
      role: participant.role,
      isOnline: participant.isOnline
    });

    console.log('✅ Success - returning room');
    return NextResponse.json({ 
      room: chatRoom,
      participant: {
        id: participant.id,
        role: participant.role,
        isOnline: participant.isOnline
      }
    });

  } catch (error) {
    console.error('❌ Create/get chat room error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to access chat room', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  console.log('🔥 OPTIONS /api/chat/rooms/course/[courseId] - Route HIT!');
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}