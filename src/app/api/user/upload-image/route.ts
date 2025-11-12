// app/api/user/upload-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { redis, CACHE_PREFIX } from '@/lib/redis';
import { rateLimit } from '@/lib/rateLimit';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const VALID_TYPES: string[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Type for updated user result
type UpdatedUserResult = {
  id: string;
  img: string | null;
  name: string | null;
  surname: string | null;
  email: string;
};

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { success, limit, remaining, reset } = await rateLimit(`${ip}:${user.id}`, 'upload:image');
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests', reset },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString()
          }
        }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ 
        error: 'No file provided' 
      }, { status: 400 });
    }

    // Validate file type
    if (!VALID_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload JPG, PNG, GIF, or WebP' 
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'File size exceeds 5MB limit' 
      }, { status: 400 });
    }

    // Get file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${uuidv4()}.${ext}`;
    
    // Ensure directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'profiles');
    await mkdir(uploadDir, { recursive: true });
    
    // Write file
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);
    
    const imageUrl = `/uploads/profiles/${fileName}`;

    // Update user profile
    const updatedUser = await prisma.student.update({
      where: { id: user.id },
      data: { img: imageUrl },
      select: {
        id: true,
        img: true,
        name: true,
        surname: true,
        email: true
      }
    }) as UpdatedUserResult;

    // Invalidate user cache
    const cacheKey = `${CACHE_PREFIX.USER_PROFILE}${user.id}`;
    await redis.del(cacheKey);

    // Log activity
    await prisma.userActivityLog.create({
      data: {
        userId: user.id,
        action: 'profile_image_updated',
        description: 'Profile image was updated',
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: { imageUrl }
      }
    });

    return NextResponse.json({ 
      success: true, 
      imageUrl,
      user: updatedUser
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload image' 
    }, { status: 500 });
  }
}