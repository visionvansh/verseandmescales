// /api/posts/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { awardXP } from '@/lib/profile/xp';
import { checkAndAwardBadges } from '@/lib/profile/badges';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ FIXED: Parse JSON instead of FormData
    const body = await request.json();
    const { 
      content, 
      mediaUrl, 
      mediaType, 
      mediaDuration, 
      mediaWidth, 
      mediaHeight,
      mediaThumbnail,
      privacy = 'PUBLIC' 
    } = body;

    // ── Content validation ─────────────────────────────────────
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }
    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'Content too long (max 5000 characters)' },
        { status: 400 }
      );
    }

    // ── Media data (already uploaded to Cloudinary) ───────────
    let mediaData: Record<string, any> = {};

    if (mediaUrl && mediaType) {
      mediaData = {
        mediaUrl,
        mediaType,
        mediaDuration: mediaDuration || null,
        mediaWidth: mediaWidth || null,
        mediaHeight: mediaHeight || null,
        mediaThumbnail: mediaThumbnail || mediaUrl,
      };
    }

    // ── Create the post in DB ─────────────────────────────────
    const post = await prisma.post.create({
      data: {
        userId: user.id,
        content: content.trim(),
        privacy: privacy as any,
        ...mediaData,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            surname: true,
            img: true,
            userXP: { select: { totalXP: true, contributorTitle: true, currentLevel: true } },
            badges: {
              where: { isEarned: true, isDisplayed: true },
              orderBy: { displayOrder: 'asc' },
              take: 3,
              select: { id: true, title: true, description: true, icon: true, color: true, category: true },
            },
            UserGoals: { select: { purpose: true }, take: 1 },
          },
        },
      },
    });

    // ── XP + Badges (fire-and-forget) ───────────────────────
    try {
      const xpResult = await awardXP(user.id, 'POST_CREATE', {
        postId: post.id,
        hasMedia: !!mediaUrl,
      });

      if (xpResult) {
        const newBadges = await checkAndAwardBadges(user.id);
        if (newBadges.length) {
          await prisma.notification.create({
            data: {
              userId: user.id,
              type: 'badge_earned',
              title: 'New Badge Unlocked!',
              message: `Congratulations! You earned ${newBadges.length} new badge${newBadges.length > 1 ? 's' : ''}!`,
              data: {
                badges: newBadges.map((b) => ({
                  id: b.badge.id,
                  title: b.badge.title,
                  icon: b.badge.icon,
                  color: b.badge.color,
                })),
                xpEarned: xpResult.userXP.totalXP,
                action: 'POST_CREATE',
              },
              priority: 'high',
            },
          });
        }
      }
    } catch (xpErr) {
      console.error('XP/Badge error (post still created):', xpErr);
      // Intentionally non-blocking
    }

    // ── Format response ───────────────────────────────────────
    const userGoal = post.user.UserGoals[0];
    let userType: 'tutor' | 'learner' | 'both' = 'learner';
    if (userGoal?.purpose === 'teach') userType = 'tutor';
    else if (userGoal?.purpose === 'both') userType = 'both';

    const formattedPost = {
      id: post.id,
      userId: post.userId,
      content: post.content,
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      mediaDuration: post.mediaDuration,
      mediaWidth: post.mediaWidth,
      mediaHeight: post.mediaHeight,
      mediaThumbnail: post.mediaThumbnail,
      privacy: post.privacy,
      isPinned: post.isPinned ?? false,
      isEdited: post.isEdited ?? false,
      editedAt: post.editedAt?.toISOString() ?? null,
      timestamp: post.createdAt.toISOString(),
      user: {
        id: post.user.id,
        username: post.user.username,
        name: post.user.name || 'User',
        avatar:
          post.user.img ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user.username}`,
        type: userType,
        xp: post.user.userXP?.totalXP ?? 0,
        contributorTitle: post.user.userXP?.contributorTitle ?? 'New Member',
        currentLevel: post.user.userXP?.currentLevel ?? 0,
        badges: post.user.badges.map((b) => ({
          id: b.id,
          name: b.title,
          description: b.description,
          icon: b.icon,
          color: b.color,
          category: b.category,
          rarity:
            b.category === 'SPECIAL'
              ? 'legendary'
              : b.category === 'DUAL_ROLE'
              ? 'epic'
              : b.category === 'TUTOR'
              ? 'rare'
              : 'common',
        })),
      },
      isLiked: false,
      likes: 0,
      comments: 0,
      shares: 0,
      viewsCount: 0,
    };

    return NextResponse.json({ success: true, post: formattedPost });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}