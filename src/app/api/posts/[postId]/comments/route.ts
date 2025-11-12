// app/api/posts/[postId]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { getAvatarUrlFromUser } from '@/utils/avatarGenerator';

// Type definitions matching Prisma response
type AvatarData = {
  id: string;
  avatarIndex: number;
  avatarSeed: string;
  avatarStyle: string;
  isPrimary: boolean;
  isCustomUpload: boolean;
  customImageUrl: string | null;
};

type UserXPData = {
  totalXP: number;
  contributorTitle: string;
} | null;

type UserData = {
  id: string;
  username: string;
  name: string | null;
  img: string | null;
  avatars: AvatarData[];
  userXP: UserXPData;
};

// For reactions without nested userXP
type ReactionUserData = {
  id: string;
  username: string;
  name: string | null;
  img: string | null;
  avatars: AvatarData[];
};

type ReactionData = {
  id: string;
  emoji: string;
  userId: string;
  user: ReactionUserData;
};

// For reply reactions (same as reactions)
type ReplyReactionData = {
  id: string;
  emoji: string;
  userId: string;
  user: ReactionUserData;
};

type ReplyCommentData = {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  editedAt: Date | null;
  user: UserData;
  reactions: ReplyReactionData[];
  _count: {
    reactions: number;
    replies: number;
  };
};

type CommentData = {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  editedAt: Date | null;
  user: UserData;
  reactions: ReactionData[];
  replies: ReplyCommentData[];
  _count: {
    reactions: number;
    replies: number;
  };
};

// Type for POST response (reactions is just an array without nested user)
type SimpleReaction = {
  id: string;
  createdAt: Date;
  userId: string;
  emoji: string;
  commentId: string;
};

type SimpleReply = {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  editedAt: Date | null;
  userId: string;
  postId: string;
  parentId: string | null;
  isDeleted: boolean;
};

type PostCommentData = {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  editedAt: Date | null;
  user: UserData;
  reactions: SimpleReaction[];
  replies: SimpleReply[];
  _count: {
    reactions: number;
    replies: number;
  };
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    const { postId } = await params;

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        parentId: null,
        isDeleted: false
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            img: true,
            avatars: {
              where: { isPrimary: true },
              take: 1,
              select: {
                id: true,
                avatarIndex: true,
                avatarSeed: true,
                avatarStyle: true,
                isPrimary: true,
                isCustomUpload: true,
                customImageUrl: true
              }
            },
            userXP: {
              select: {
                totalXP: true,
                contributorTitle: true
              }
            }
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                img: true,
                avatars: {
                  where: { isPrimary: true },
                  take: 1,
                  select: {
                    id: true,
                    avatarIndex: true,
                    avatarSeed: true,
                    avatarStyle: true,
                    isPrimary: true,
                    isCustomUpload: true,
                    customImageUrl: true
                  }
                }
              }
            }
          }
        },
        replies: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                img: true,
                avatars: {
                  where: { isPrimary: true },
                  take: 1,
                  select: {
                    id: true,
                    avatarIndex: true,
                    avatarSeed: true,
                    avatarStyle: true,
                    isPrimary: true,
                    isCustomUpload: true,
                    customImageUrl: true
                  }
                },
                userXP: {
                  select: {
                    totalXP: true,
                    contributorTitle: true
                  }
                }
              }
            },
            reactions: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    name: true,
                    img: true,
                    avatars: {
                      where: { isPrimary: true },
                      take: 1,
                      select: {
                        id: true,
                        avatarIndex: true,
                        avatarSeed: true,
                        avatarStyle: true,
                        isPrimary: true,
                        isCustomUpload: true,
                        customImageUrl: true
                      }
                    }
                  }
                }
              }
            },
            _count: {
              select: {
                reactions: true,
                replies: true
              }
            }
          }
        },
        _count: {
          select: {
            reactions: true,
            replies: true
          }
        }
      }
    }) as unknown as CommentData[];

    const formatComment = (comment: CommentData): any => {
      const avatarUrl = getAvatarUrlFromUser(comment.user, 48);
      
      return {
        ...comment,
        user: {
          ...comment.user,
          img: avatarUrl,
          avatar: avatarUrl
        },
        reactions: comment.reactions.map((reaction: ReactionData) => ({
          ...reaction,
          user: {
            ...reaction.user,
            img: getAvatarUrlFromUser(reaction.user, 32),
            avatar: getAvatarUrlFromUser(reaction.user, 32)
          }
        })),
        replies: comment.replies.map((reply: ReplyCommentData) => {
          const replyAvatarUrl = getAvatarUrlFromUser(reply.user, 48);
          return {
            ...reply,
            user: {
              ...reply.user,
              img: replyAvatarUrl,
              avatar: replyAvatarUrl
            },
            reactions: reply.reactions.map((reaction: ReplyReactionData) => ({
              ...reaction,
              user: {
                ...reaction.user,
                img: getAvatarUrlFromUser(reaction.user, 32),
                avatar: getAvatarUrlFromUser(reaction.user, 32)
              }
            })),
            reactionsCount: reply._count.reactions,
            repliesCount: reply._count.replies
          };
        }),
        reactionsCount: comment._count.reactions,
        repliesCount: comment._count.replies
      };
    };

    const formattedComments = comments.map(formatComment);

    return NextResponse.json({ comments: formattedComments });

  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { postId } = await params;
    const body: { content: string; parentId?: string } = await request.json();
    const { content, parentId } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Comment is too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        userId: user.id,
        parentId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            img: true,
            avatars: {
              where: { isPrimary: true },
              take: 1,
              select: {
                id: true,
                avatarIndex: true,
                avatarSeed: true,
                avatarStyle: true,
                isPrimary: true,
                isCustomUpload: true,
                customImageUrl: true
              }
            },
            userXP: {
              select: {
                totalXP: true,
                contributorTitle: true
              }
            }
          }
        },
        reactions: true,
        replies: true,
        _count: {
          select: {
            reactions: true,
            replies: true
          }
        }
      }
    }) as unknown as PostCommentData;

    await prisma.userXP.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        totalXP: 5,
        xpFromComments: 5,
        currentLevel: 1
      },
      update: {
        totalXP: { increment: 5 },
        xpFromComments: { increment: 5 }
      }
    });

    const avatarUrl = getAvatarUrlFromUser(comment.user, 48);

    const formattedComment = {
      ...comment,
      user: {
        ...comment.user,
        img: avatarUrl,
        avatar: avatarUrl
      },
      reactionsCount: comment._count.reactions,
      repliesCount: comment._count.replies
    };

    return NextResponse.json({ comment: formattedComment });

  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}