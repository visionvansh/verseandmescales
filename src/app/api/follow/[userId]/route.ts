// /api/follow/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { awardXP } from '@/lib/profile/xp';
import { checkAndAwardBadges } from '@/lib/profile/badges';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = await getAuthUser(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId: targetUserId } = await params;

    // Can't follow yourself
    if (currentUser.id === targetUserId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await prisma.student.findUnique({
      where: { id: targetUserId },
      select: { 
        id: true,
        username: true,
        name: true,
        img: true
      }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: targetUserId
        }
      }
    });

    let action: 'followed' | 'unfollowed';

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: { id: existingFollow.id }
      });
      action = 'unfollowed';
      
      // No XP deduction for unfollowing
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId: currentUser.id,
          followingId: targetUserId,
          isAccepted: true
        }
      });
      action = 'followed';
      
      // ✅ Award XP to the person being followed
      try {
        await awardXP(targetUserId, 'FOLLOWER_GAINED', {
          followerId: currentUser.id,
          followerUsername: currentUser.username
        });
        
        // ✅ Check and award badges for target user
        const newBadges = await checkAndAwardBadges(targetUserId);
        
        // ✅ Send notification if badges were awarded
        if (newBadges.length > 0) {
          await prisma.notification.create({
            data: {
              userId: targetUserId,
              actorId: currentUser.id,
              type: 'badge_earned',
              title: '🎉 New Badge Earned!',
              message: `You earned ${newBadges.length} new badge${newBadges.length > 1 ? 's' : ''}!`,
              data: {
                badges: newBadges.map(b => ({
                  id: b.badge.id,
                  title: b.badge.title,
                  icon: b.badge.icon
                }))
              }
            }
          });
        }
      } catch (xpError) {
        console.error('Failed to award XP for follow:', xpError);
        // Don't fail the follow action if XP fails
      }
    }

    return NextResponse.json({
      success: true,
      action,
      targetUser: {
        id: targetUser.id,
        username: targetUser.username,
        name: targetUser.name,
        img: targetUser.img
      }
    });

  } catch (error) {
    console.error('Toggle follow error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle follow' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = await getAuthUser(request);
    const { userId } = await params;

    if (!currentUser) {
      return NextResponse.json({ isFollowing: false });
    }

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: userId
        }
      }
    });

    return NextResponse.json({ isFollowing: !!follow });

  } catch (error) {
    console.error('Check follow status error:', error);
    return NextResponse.json(
      { error: 'Failed to check follow status' },
      { status: 500 }
    );
  }
}