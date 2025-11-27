// app/api/chat/save-media-metadata/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized – please log in' },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Validate required fields
    if (!data.roomId || !data.url || !data.type) {
      return NextResponse.json(
        { error: 'Missing required fields: roomId, url, type' },
        { status: 400 }
      );
    }

    // Optional: Save to database for tracking/analytics
    // You can create a MediaUpload model if needed
    /*
    await prisma.mediaUpload.create({
      data: {
        roomId: data.roomId,
        userId: user.id,
        url: data.url,
        publicId: data.publicId,
        type: data.type,
        fileName: data.fileName,
        fileSize: data.fileSize,
        width: data.width,
        height: data.height,
        duration: data.duration,
        thumbnail: data.thumbnail,
      },
    });
    */

    console.log('✅ Media metadata saved:', {
      user: user.username,
      roomId: data.roomId,
      type: data.type,
      fileName: data.fileName,
    });

    return NextResponse.json({ success: true, media: data }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Metadata save error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save metadata' },
      { status: 500 }
    );
  }
}