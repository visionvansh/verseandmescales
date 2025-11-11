// app/api/chat/rooms/[roomId]/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { encryptMessage, decryptMessage } from '@/lib/encryption';
import { getAvatarUrlFromUser } from '@/utils/avatarGenerator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '50');

    const { roomId } = await params;

    // Verify access
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId: user.id
        }
      }
    });

    if (!participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch messages with complete user data
    const messages = await prisma.chatMessage.findMany({
      where: {
        roomId,
        isDeleted: false
      },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            surname: true,
            img: true,
            avatars: {
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                avatarIndex: true,
                avatarSeed: true,
                avatarStyle: true,
                isPrimary: true,
                isCustomUpload: true,
                customImageUrl: true,
              }
            },
            userXP: {
              select: {
                totalXP: true,
                contributorTitle: true
              }
            },
            badges: {
              where: { isEarned: true, isDisplayed: true },
              orderBy: { displayOrder: 'asc' },
              take: 3,
              select: {
                id: true,
                title: true,
                icon: true,
                color: true
              }
            },
            _count: {
              select: {
                followers: true,
                following: true,
                courses: true
              }
            },
            UserGoals: {
              select: { purpose: true },
              take: 1
            }
          }
        },
        reactions: {
          select: {
            id: true,
            emoji: true,
            userId: true,
            createdAt: true
          }
        },
        replyTo: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                img: true,
                avatars: {
                  where: { isPrimary: true },
                  take: 1
                }
              }
            }
          }
        },
        mentions: {
          include: {
            mentionedUser: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      }
    });

    const hasMore = messages.length > limit;
    const messagesData = hasMore ? messages.slice(0, -1) : messages;

    // ✅ FIX: Helper function to group reactions by emoji
    const groupReactionsByEmoji = (reactions: any[]) => {
      const reactionMap = new Map<string, { emoji: string; count: number; users: string[] }>();
      
      reactions.forEach((reaction) => {
        const emoji = reaction.emoji;
        const userId = reaction.userId;
        
        const existing = reactionMap.get(emoji);
        if (existing) {
          if (!existing.users.includes(userId)) {
            existing.users.push(userId);
            existing.count++;
          }
        } else {
          reactionMap.set(emoji, {
            emoji,
            count: 1,
            users: [userId]
          });
        }
      });
      
      return Array.from(reactionMap.values());
    };

    // Decrypt and transform with complete user metadata
    const decryptedMessages = messagesData.map((msg: typeof messages[number]) => {
      const avatarUrl = getAvatarUrlFromUser(msg.user, 64);
      const primaryAvatar = msg.user.avatars?.find((a: any) => a.isPrimary) || msg.user.avatars?.[0] || null;

      // Determine user type from goals
      const userGoal = msg.user.UserGoals[0];
      let userType: 'tutor' | 'learner' | 'both' = 'learner';
      if (userGoal) {
        if (userGoal.purpose === 'teach') userType = 'tutor';
        else if (userGoal.purpose === 'both') userType = 'both';
      }

      // Create complete user metadata object
      const userMetadata = {
        id: msg.user.id,
        username: msg.user.username,
        name: msg.user.name || 'User',
        surname: msg.user.surname,
        avatar: avatarUrl,
        avatarObject: primaryAvatar,
        img: avatarUrl,
        isOnline: true,
        type: userType,
        role: userType === 'tutor' ? 'mentor' : 'student',
        xp: msg.user.userXP?.totalXP || 0,
        seekers: msg.user._count.followers,
        seeking: msg.user._count.following,
        coursesMade: msg.user._count.courses,
        coursesLearning: 0,
        badges: msg.user.badges.map(badge => ({
          id: badge.id,
          name: badge.title,
          icon: badge.icon,
          color: badge.color
        })),
        bio: '',
        isPrivate: false
      };

      // Transform reply user avatar if exists
      let replyToTransformed = msg.replyTo ? {
        ...msg.replyTo,
        // ✅ FIXED: Always return ISO string for consistent parsing
        createdAt: msg.replyTo.createdAt.toISOString(),
        user: {
          ...msg.replyTo.user,
          avatar: getAvatarUrlFromUser(msg.replyTo.user, 48),
          avatarObject: msg.replyTo.user.avatars?.[0] || null
        }
      } : undefined;

      // ✅ FIX: Group reactions before returning
      const groupedReactions = groupReactionsByEmoji(msg.reactions);

      return {
        ...msg,
        content: decryptMessage(msg.encryptedContent),
        encryptedContent: undefined,
        contentHash: undefined,
        // ✅ FIXED: Always return ISO string for consistent parsing
        createdAt: msg.createdAt.toISOString(),
        updatedAt: msg.updatedAt?.toISOString(),
        editedAt: msg.editedAt?.toISOString(),
        user: {
          ...msg.user,
          avatar: avatarUrl,
          avatarObject: primaryAvatar,
        },
        userMetadata: userMetadata,
        userName: msg.user.name || 'User',
        userAvatar: avatarUrl,
        userRole: userType === 'tutor' ? 'mentor' : 'student',
        replyTo: replyToTransformed,
        reactions: groupedReactions, // ✅ Use grouped reactions
        mentions: msg.mentions.map(m => m.mentionedUser.id)
      };
    });

    return NextResponse.json({
      messages: decryptedMessages.reverse(),
      nextCursor: hasMore ? messagesData[messagesData.length - 1].id : null
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId } = await params;
    const body = await request.json();
    const { content, replyToId, messageType = 'text', mediaUrl } = body;

    // Verify access
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId: user.id
        }
      }
    });

    if (!participant || participant.isBanned) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Encrypt message
    const { encryptedContent, contentHash } = encryptMessage(content);

    // Count words and characters
    const wordCount = content.trim().split(/\s+/).length;
    const characterCount = content.length;

    // Create message with complete user data
    const message = await prisma.chatMessage.create({
      data: {
        roomId,
        userId: user.id,
        encryptedContent,
        contentHash,
        messageType,
        replyToId,
        mediaUrl,
        wordCount,
        characterCount
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            surname: true,
            img: true,
            avatars: {
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                avatarIndex: true,
                avatarSeed: true,
                avatarStyle: true,
                isPrimary: true,
                isCustomUpload: true,
                customImageUrl: true,
              }
            },
            userXP: {
              select: {
                totalXP: true,
                contributorTitle: true
              }
            },
            badges: {
              where: { isEarned: true, isDisplayed: true },
              orderBy: { displayOrder: 'asc' },
              take: 3,
              select: {
                id: true,
                title: true,
                icon: true,
                color: true
              }
            },
            _count: {
              select: {
                followers: true,
                following: true,
                courses: true
              }
            },
            UserGoals: {
              select: { purpose: true },
              take: 1
            }
          }
        },
        replyTo: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                img: true,
                avatars: {
                  where: { isPrimary: true },
                  take: 1
                }
              }
            }
          }
        },
        // ✅ FIX: Include reactions in POST response
        reactions: {
          select: {
            id: true,
            emoji: true,
            userId: true,
            createdAt: true
          }
        }
      }
    });

    // Update participant stats
    await prisma.chatParticipant.update({
      where: { id: participant.id },
      data: {
        messagesCount: { increment: 1 },
        lastSeen: new Date()
      }
    });

    // Update room analytics
    await prisma.chatRoomAnalytics.upsert({
      where: { roomId },
      create: {
        roomId,
        totalMessages: 1,
        totalWords: wordCount
      },
      update: {
        totalMessages: { increment: 1 },
        totalWords: { increment: wordCount },
        lastCalculated: new Date()
      }
    });

    // ✅ FIX: Helper function to group reactions
    const groupReactionsByEmoji = (reactions: any[]) => {
      const reactionMap = new Map<string, { emoji: string; count: number; users: string[] }>();
      
      reactions.forEach((reaction) => {
        const emoji = reaction.emoji;
        const userId = reaction.userId;
        
        const existing = reactionMap.get(emoji);
        if (existing) {
          if (!existing.users.includes(userId)) {
            existing.users.push(userId);
            existing.count++;
          }
        } else {
          reactionMap.set(emoji, {
            emoji,
            count: 1,
            users: [userId]
          });
        }
      });
      
      return Array.from(reactionMap.values());
    };

    // Return decrypted message with complete metadata
    const avatarUrl = getAvatarUrlFromUser(message.user, 64);
    const primaryAvatar = message.user.avatars?.find((a: any) => a.isPrimary) || message.user.avatars?.[0] || null;

    const userGoal = message.user.UserGoals[0];
    let userType: 'tutor' | 'learner' | 'both' = 'learner';
    if (userGoal) {
      if (userGoal.purpose === 'teach') userType = 'tutor';
      else if (userGoal.purpose === 'both') userType = 'both';
    }

    const userMetadata = {
      id: message.user.id,
      username: message.user.username,
      name: message.user.name || 'User',
      surname: message.user.surname,
      avatar: avatarUrl,
      avatarObject: primaryAvatar,
      img: avatarUrl,
      isOnline: true,
      type: userType,
      role: userType === 'tutor' ? 'mentor' : 'student',
      xp: message.user.userXP?.totalXP || 0,
      seekers: message.user._count.followers,
      seeking: message.user._count.following,
      coursesMade: message.user._count.courses,
      coursesLearning: 0,
      badges: message.user.badges.map(badge => ({
        id: badge.id,
        name: badge.title,
        icon: badge.icon,
        color: badge.color
      })),
      bio: '',
      isPrivate: false
    };

    // ✅ FIX: Group reactions before returning
    const groupedReactions = groupReactionsByEmoji(message.reactions);

    const responseMessage = {
      ...message,
      content: decryptMessage(message.encryptedContent),
      encryptedContent: undefined,
      contentHash: undefined,
      // ✅ FIXED: Return ISO string
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt?.toISOString(),
      editedAt: message.editedAt?.toISOString(),
      user: {
        ...message.user,
        avatar: avatarUrl,
        avatarObject: primaryAvatar,
      },
      userMetadata: userMetadata,
      userName: message.user.name || 'User',
      userAvatar: avatarUrl,
      userRole: userType === 'tutor' ? 'mentor' : 'student',
      replyTo: message.replyTo ? {
        ...message.replyTo,
        createdAt: message.replyTo.createdAt.toISOString(), // ✅ Add this
        user: {
          ...message.replyTo.user,
          avatar: getAvatarUrlFromUser(message.replyTo.user, 48),
          avatarObject: message.replyTo.user.avatars?.[0] || null
        }
      } : undefined,
      reactions: groupedReactions // ✅ Use grouped reactions
    };

    return NextResponse.json({ message: responseMessage });

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}