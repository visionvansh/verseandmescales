import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import { redis } from '@/lib/redis';
import { rateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/log';

export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest, user: any) => Promise<NextResponse>
) {
  try {
    const user = await getAuthUser(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Apply rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const identifier = `${ip}:${user.id}`;
    
    const { success, limit, remaining, reset } = await rateLimit(identifier);
    
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
    
    return await handler(req, user);
  } catch (error: any) {
    logger.error('API error:', { error: error.message, stack: error.stack });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function validateRequest(
  req: NextRequest, 
  schema: any
) {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    
    if (!result.success) {
      return { 
        success: false, 
        error: NextResponse.json(
          { error: 'Validation error', details: result.error.format() },
          { status: 400 }
        )
      };
    }
    
    return { success: true, data: result.data };
  } catch (error) {
    return { 
      success: false, 
      error: NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    };
  }
}

export function withCaching(key: string, ttl: number) {
  return async function(handler: () => Promise<any>) {
    // Try to get from cache first
    const cached = await redis.get(key);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    // If not in cache, execute handler
    const result = await handler();
    
    // Store in cache
    await redis.set(key, JSON.stringify(result), 'EX', ttl);
    
    return result;
  };
}