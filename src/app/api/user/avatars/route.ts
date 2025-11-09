// app/api/user/avatars/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const userId = searchParams.get('userId');
    
    let targetUserId: string | null = null;

    // If username provided, fetch for that user (public access)
    if (username) {
      const user = await prisma.student.findUnique({
        where: { username: username.toLowerCase() },
        select: { id: true }
      });
      
      if (!user) {
        console.log('❌ User not found for username:', username);
        return NextResponse.json({ avatars: [] }, { status: 200 }); // Return empty array instead of error
      }
      
      targetUserId = user.id;
    } 
    // If userId provided, use it directly
    else if (userId) {
      targetUserId = userId;
    }
    // Otherwise, fetch for authenticated user
    else {
      const user = await getAuthUser(request);
      
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      targetUserId = user.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ avatars: [] }, { status: 200 });
    }

    const avatars = await prisma.avatar.findMany({
      where: { userId: targetUserId },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' }
      ],
    });

    console.log(`✅ Found ${avatars.length} avatars for user:`, targetUserId);
    return NextResponse.json({ avatars });
  } catch (error) {
    console.error('Failed to fetch avatars:', error);
    return NextResponse.json({ avatars: [] }, { status: 200 }); // Return empty array to prevent errors
  }
}