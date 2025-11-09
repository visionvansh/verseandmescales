import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// GET - Fetch user notifications
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const unreadOnly = url.searchParams.get('unread') === 'true';

    const where: any = { userId: user.id };
    if (unreadOnly) {
      where.read = false;
    }

    const [notifications, unreadCount, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          priority: true,
          read: true,
          readAt: true,
          data: true,
          createdAt: true,
        }
      }),
      prisma.notification.count({
        where: { userId: user.id, read: false }
      }),
      prisma.notification.count({
        where: { userId: user.id }
      })
    ]);

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + notifications.length < total
      }
    });

  } catch (error: any) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PATCH - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, markAll } = body;

    if (markAll) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          read: false
        },
        data: {
          read: true,
          readAt: new Date()
        }
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: user.id
        },
        data: {
          read: true,
          readAt: new Date()
        }
      });
    }

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, read: false }
    });

    return NextResponse.json({
      success: true,
      unreadCount,
      message: 'Notifications marked as read'
    });

  } catch (error: any) {
    console.error('Mark notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}