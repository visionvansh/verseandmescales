//Volumes/vision/codes/course/my-app/src/app/api/comments/[commentId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const { commentId } = params;
    const user = await getAuthUser(request);

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            img: true,
            userXP: {
              select: {
                totalXP: true,
                contributorTitle: true
              }
            }
          }
        },
        parent: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                username: true,
                name: true
              }
            }
          }
        },
        replies: {
          where: { isDeleted: false },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                img: true
              }
            },
            reactions: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    img: true
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
          },
          orderBy: { createdAt: 'asc' }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                img: true
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
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check if user has reacted
    const userReactions = user ? comment.reactions.filter(r => r.userId === user.id) : [];

    return NextResponse.json({
      comment: {
        ...comment,
        userReactions: userReactions.map(r => r.emoji)
      }
    });

  } catch (error) {
    console.error('Get comment error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comment' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { commentId } = params;
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (comment.userId !== user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own comments' },
        { status: 403 }
      );
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content,
        isEdited: true,
        editedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            img: true
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                img: true
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
    });

    // Broadcast update via WebSocket
    if (typeof global !== 'undefined' && (global as any).wss) {
      const message = JSON.stringify({
        event: 'comment:edited',
        data: {
          commentId,
          postId: comment.postId,
          content,
          editedAt: updatedComment.editedAt
        }
      });
      
      (global as any).wss.clients.forEach((client: any) => {
        if (client.readyState === 1) {
          client.send(message);
        }
      });
    }

    return NextResponse.json({ comment: updatedComment });

  } catch (error) {
    console.error('Update comment error:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { commentId } = params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        _count: {
          select: {
            replies: true
          }
        }
      }
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (comment.userId !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own comments' },
        { status: 403 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Mark as deleted
      await tx.comment.update({
        where: { id: commentId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          content: '[Comment deleted]'
        }
      });

      // Update post comment count
      await tx.post.update({
        where: { id: comment.postId },
        data: { commentsCount: { decrement: 1 } }
      });

      // Update parent reply count if it's a reply
      if (comment.parentId) {
        await tx.comment.update({
          where: { id: comment.parentId },
          data: { repliesCount: { decrement: 1 } }
        });
      }
    });

    // Broadcast deletion via WebSocket
    if (typeof global !== 'undefined' && (global as any).wss) {
      const message = JSON.stringify({
        event: 'comment:deleted',
        data: {
          commentId,
          postId: comment.postId
        }
      });
      
      (global as any).wss.clients.forEach((client: any) => {
        if (client.readyState === 1) {
          client.send(message);
        }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}