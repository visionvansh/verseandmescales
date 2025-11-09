import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api-middleware';
import { redis } from '@/lib/redis';

export async function GET(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    const cacheKey = `password:status:${user.id}`;
    
    try {
      // Check cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        const result = JSON.parse(cached);
        // Trigger background refresh if TTL is low
        const ttl = await redis.ttl(cacheKey);
        if (ttl < 300) { // Less than 5 minutes
          setTimeout(async () => {
            const freshResult = { hasPassword: !!user.password };
            await redis.set(cacheKey, JSON.stringify(freshResult), 'EX', 3600);
          }, 0);
        }
        return NextResponse.json(result);
      }
      
      // Cache miss: query database
      const result = { hasPassword: !!user.password };
      await redis.set(cacheKey, JSON.stringify(result), 'EX', 3600); // 1 hour TTL
      return NextResponse.json(result);
    } catch (error) {
      console.error("Error fetching password status:", error);
      return NextResponse.json({ hasPassword: !!user.password });
    }
  });
}