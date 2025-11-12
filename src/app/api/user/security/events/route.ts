// api/user/security/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import { logger } from '@/lib/log';
import { rateLimit } from '@/lib/rateLimit';
import { CACHE_PREFIX, CACHE_TIMES, cacheWrapper } from '@/lib/enhanced-redis';
import prisma from '@/lib/prisma';

// Interface for security event based on Prisma query
interface PrismaSecurityEvent {
  id: string;
  eventType: string;
  severity: string;
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
  resolved: boolean;
  resolvedAt: Date | null;
  createdAt: Date;
}

interface TransformedSecurityEvent {
  id: string;
  eventType: string;
  severity: string;
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
  resolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
}

interface SecurityEventsResponse {
  events: TransformedSecurityEvent[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Apply rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const identifier = `${ip}:${user.id}`;
    const { success, limit: rateLimitCount, remaining, reset } = await rateLimit(identifier, 'security:events');
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests', reset },
        { 
          status: 429, 
          headers: {
            'X-RateLimit-Limit': rateLimitCount.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString()
          }
        }
      );
    }
    
    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100); // Max 100
    const skipCache = url.searchParams.has('_t');
    
    const cacheKey = `${CACHE_PREFIX.SECURITY_EVENTS}:${user.id}:${page}:${pageSize}`;
    
    const fetchEvents = async (): Promise<SecurityEventsResponse> => {
      const skip = (page - 1) * pageSize;
      
      const [events, totalCount] = await Promise.all([
        prisma.securityEvent.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
          select: {
            id: true,
            eventType: true,
            severity: true,
            description: true,
            ipAddress: true,
            userAgent: true,
            resolved: true,
            resolvedAt: true,
            createdAt: true
          }
        }) as Promise<PrismaSecurityEvent[]>,
        prisma.securityEvent.count({
          where: { userId: user.id }
        })
      ]);
      
      const totalPages = Math.ceil(totalCount / pageSize);
      
      return {
        events: events.map((event: PrismaSecurityEvent): TransformedSecurityEvent => ({
          ...event,
          resolvedAt: event.resolvedAt?.toISOString() || null,
          createdAt: event.createdAt.toISOString()
        })),
        pagination: {
          page,
          limit: pageSize,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    };

    if (skipCache) {
      const data = await fetchEvents();
      return NextResponse.json(data);
    }
    
    const response = await cacheWrapper(
      cacheKey,
      fetchEvents,
      CACHE_TIMES.SECURITY_EVENTS,
      true
    );
    
    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error fetching security events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}