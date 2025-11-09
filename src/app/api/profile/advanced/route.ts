// src/app/api/profile/advanced/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { redis, CACHE_PREFIX } from '@/lib/redis'; // ✅ ADD THIS IMPORT

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'update_bio':
        return await updateBio(user.id, body);
      
      case 'update_avatar':
        return await updateAvatar(user.id, body);
      
      case 'change_role':
        return await changeRole(user.id, body);
      
      case 'toggle_visibility':
        return await toggleVisibility(user.id, body);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Advanced profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

// ✅ UPDATED: Clear cache after bio update
async function updateBio(userId: string, body: any) {
  const { bio, country, location, website } = body;

  await prisma.profileSettings.upsert({
    where: { userId },
    update: {
      bio: bio || '',
      country: country || '',
      location: location || '',
      website: website || ''
    },
    create: {
      userId,
      bio: bio || '',
      country: country || '',
      location: location || '',
      website: website || ''
    }
  });

  // ✅ Invalidate cache
  await invalidateUserCache(userId);

  return NextResponse.json({
    success: true,
    message: 'Profile updated successfully'
  });
}

// ✅ UPDATED: Clear cache after avatar update
async function updateAvatar(userId: string, body: any) {
  const { avatarUrl } = body;

  await prisma.student.update({
    where: { id: userId },
    data: {
      img: avatarUrl
    }
  });

  // ✅ Invalidate cache
  await invalidateUserCache(userId);

  return NextResponse.json({
    success: true,
    message: 'Avatar updated successfully',
    avatarUrl
  });
}

// ✅ UPDATED: Clear cache after role change
async function changeRole(userId: string, body: any) {
  const { newRole } = body;

  const user = await prisma.student.findUnique({
    where: { id: userId },
    include: {
      UserGoals: true,
      courses: {
        where: { isPublished: true }
      },
      lessonProgress: {
        distinct: ['courseId']
      },
      profileSettings: true
    }
  });

  if (!user || !user.UserGoals || user.UserGoals.length === 0) {
    return NextResponse.json(
      { error: 'User goals not found' },
      { status: 404 }
    );
  }

  const currentGoal = user.UserGoals[0];
  const currentRole = currentGoal.purpose;
  const hasMadeCourses = user.courses.length > 0;
  const hasJoinedCourses = user.lessonProgress.length > 0;
  const isPrivate = !user.profileSettings?.isPublic;

  // Validation Logic
  if (currentRole === 'both' && newRole === 'learn') {
    if (hasMadeCourses) {
      return NextResponse.json(
        { error: 'Cannot change to learner role. You have created courses.' },
        { status: 400 }
      );
    }
  }

  if (currentRole === 'both' && newRole === 'teach') {
    if (hasJoinedCourses) {
      return NextResponse.json(
        { error: 'Cannot change to tutor-only role. You have joined courses.' },
        { status: 400 }
      );
    }
  }

  if (currentRole === 'teach' && newRole === 'learn') {
    if (hasMadeCourses) {
      return NextResponse.json(
        { error: 'Cannot change to learner role. You have created courses.' },
        { status: 400 }
      );
    }
  }

  if (currentRole === 'learn' && newRole === 'teach') {
    if (hasJoinedCourses) {
      return NextResponse.json(
        { error: 'Cannot change to tutor role. You have joined courses.' },
        { status: 400 }
      );
    }
    if (isPrivate) {
      return NextResponse.json(
        { error: 'Cannot change to tutor role with private profile. Please make your profile public first.' },
        { status: 400 }
      );
    }
  }

  if (currentRole === 'learn' && newRole === 'both') {
    if (isPrivate) {
      return NextResponse.json(
        { error: 'Cannot change to tutor & learner role with private profile. Please make your profile public first.' },
        { status: 400 }
      );
    }
  }

  await prisma.userGoals.update({
    where: { userId },
    data: {
      purpose: newRole,
      lastUpdated: new Date()
    }
  });

  if (newRole === 'teach' || newRole === 'both') {
    await prisma.profileSettings.upsert({
      where: { userId },
      update: { isPublic: true },
      create: {
        userId,
        isPublic: true
      }
    });
  }

  // ✅ Invalidate cache IMMEDIATELY after role change
  await invalidateUserCache(userId);

  return NextResponse.json({
    success: true,
    message: 'Role updated successfully',
    newRole,
    profileMadePublic: newRole === 'teach' || newRole === 'both'
  });
}

// ✅ UPDATED: Clear cache after visibility toggle
async function toggleVisibility(userId: string, body: any) {
  const { isPublic } = body;

  const user = await prisma.student.findUnique({
    where: { id: userId },
    include: {
      UserGoals: true
    }
  });

  if (!user || !user.UserGoals || user.UserGoals.length === 0) {
    return NextResponse.json(
      { error: 'User goals not found' },
      { status: 404 }
    );
  }

  const currentRole = user.UserGoals[0].purpose;

  if (!isPublic && (currentRole === 'teach' || currentRole === 'both')) {
    return NextResponse.json(
      { 
        error: 'Tutors and Tutor & Learners cannot make their profile private',
        locked: true
      },
      { status: 400 }
    );
  }

  await prisma.profileSettings.upsert({
    where: { userId },
    update: { isPublic },
    create: {
      userId,
      isPublic
    }
  });

  // ✅ Invalidate cache
  await invalidateUserCache(userId);

  return NextResponse.json({
    success: true,
    message: `Profile is now ${isPublic ? 'public' : 'private'}`,
    isPublic
  });
}

// ✅ NEW: Helper function to invalidate all user caches
async function invalidateUserCache(userId: string) {
  try {
    const cacheKey = `${CACHE_PREFIX.USER_PROFILE}${userId}`;
    await redis.del(cacheKey);
    console.log(`✅ Cache invalidated for user: ${userId}`);
  } catch (error) {
    console.error('Failed to invalidate user cache:', error);
  }
}