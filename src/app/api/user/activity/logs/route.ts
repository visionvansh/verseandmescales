import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import { logger } from '@/lib/log';
import { rateLimit } from '@/lib/rateLimit';
import { CACHE_PREFIX, CACHE_TIMES, cacheWrapper } from '@/lib/enhanced-redis';
import prisma from '@/lib/prisma';

// Define the UserActivityLog interface based on Prisma schema
interface UserActivityLog {
  id: string;
  userId: string;
  action: string;
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: any;
  createdAt: Date;
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
    const { success, limit: rateLimitCount, remaining, reset } = await rateLimit(identifier, 'activity:logs');
    
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
    const pageSize = parseInt(url.searchParams.get('limit') || '20');
    const action = url.searchParams.get('action') || undefined;
    const startDate = url.searchParams.get('startDate') 
      ? new Date(url.searchParams.get('startDate')!)
      : undefined;
    const endDate = url.searchParams.get('endDate')
      ? new Date(url.searchParams.get('endDate')!)
      : undefined;
    
    // Only cache default queries (no filters)
    const useCache = !action && !startDate && !endDate && page === 1 && pageSize === 20;
    const cacheKey = useCache ? `${CACHE_PREFIX.ACTIVITY_LOGS}:${user.id}:default` : null;
    
    // Process the request with caching if applicable
    if (cacheKey) {
      const response = await cacheWrapper(
        cacheKey,
        async () => fetchActivityLogs(user.id, page, pageSize, action, startDate, endDate),
        CACHE_TIMES.ACTIVITY_LOGS,
        true // Use stale-while-revalidate
      );
      
      return NextResponse.json(response);
    } else {
      // Fetch without caching for filtered requests
      const response = await fetchActivityLogs(user.id, page, pageSize, action, startDate, endDate);
      return NextResponse.json(response);
    }
  } catch (error) {
    logger.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Extract the database query to a separate function
async function fetchActivityLogs(
  userId: string, 
  page: number, 
  pageSize: number, 
  action?: string, 
  startDate?: Date, 
  endDate?: Date
) {
  try {
    // Calculate pagination
    const skip = (page - 1) * pageSize;
    
    // Get activity logs from database
    const [logs, totalCount] = await Promise.all([
      prisma.userActivityLog.findMany({
        where: {
          userId,
          ...(action ? { action } : {}),
          ...(startDate || endDate ? {
            createdAt: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {})
            }
          } : {})
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: pageSize
      }),
      prisma.userActivityLog.count({
        where: {
          userId,
          ...(action ? { action } : {}),
          ...(startDate || endDate ? {
            createdAt: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {})
            }
          } : {})
        }
      })
    ]);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return {
      logs: logs.map((log: UserActivityLog) => ({
        id: log.id,
        action: log.action,
        description: log.description,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        metadata: log.metadata,
        createdAt: log.createdAt.toISOString()
      })),
      pagination: {
        page,
        limit: pageSize,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    };
  } catch (error) {
    logger.error('Error in fetchActivityLogs:', error);
    throw error;
  }
}