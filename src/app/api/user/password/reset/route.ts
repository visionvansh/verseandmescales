import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/log';
import crypto from 'crypto';
import { redis } from '@/lib/redis';

// Define type for cached user data
type CachedUser = {
  id: string;
  email: string;
};

const resetSchema = z.object({
  email: z.string().email("Invalid email address")
});

// Placeholder for email sending (to be implemented based on your email service)
async function sendResetEmail(email: string, resetLink: string) {
  // TODO: Implement email sending logic here (e.g., using nodemailer, AWS SES, etc.)
  console.log(`Sending reset email to ${email} with link: ${resetLink}`);
  // Example: Use nodemailer or your email service provider
  // await nodemailer.sendMail({ to: email, subject: 'Password Reset', text: `Reset link: ${resetLink}` });
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const pipeline = redis.pipeline();
    pipeline.get(`rate-limit:${ip}:password:reset`);
    pipeline.ttl(`rate-limit:${ip}:password:reset`);
    const pipelineResults = await pipeline.exec();
    
    const [attemptsResult, ttlResult] = pipelineResults || [[null, '0'], [null, -2]];
    const attemptsError = attemptsResult[0];
    const ttlError = ttlResult[0];
    if (attemptsError || ttlError) {
      throw new Error('Redis pipeline error');
    }
    
    const currentAttempts = attemptsResult[1] as string | null;
    const ttl = ttlResult[1] as number;
    const attempts = parseInt(currentAttempts || '0');
    const limit = 5;
    
    if (attempts >= limit) {
      return NextResponse.json(
        { error: 'Too many requests', reset: ttl },
        { 
          status: 429, 
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': Math.max(0, limit - attempts - 1).toString(),
            'X-RateLimit-Reset': ttl.toString()
          }
        }
      );
    }
    
    await redis.incr(`rate-limit:${ip}:password:reset`);
    await redis.expire(`rate-limit:${ip}:password:reset`, 60);
    
    let data;
    try {
      const body = await request.json();
      const result = resetSchema.safeParse(body);
      
      if (!result.success) {
        return NextResponse.json(
          { error: 'Validation error', details: result.error.format() },
          { status: 400 }
        );
      }
      
      data = result.data;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    const cacheKey = `user:email:${data.email}`;
    let user: CachedUser | null = null;
    const cached = await redis.get(cacheKey);
    if (cached) {
      user = JSON.parse(cached) as CachedUser;
    } else {
      user = await prisma.student.findUnique({
        where: { email: data.email },
        select: { id: true, email: true }
      });
      if (user) {
        await redis.set(cacheKey, JSON.stringify(user), 'EX', 300); // Cache for 5 minutes
      }
    }
    
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);
      
      await prisma.passwordReset.create({
        data: {
          id: crypto.randomUUID(),
          email: user.email,
          token,
          used: false,
          expiresAt,
          ipAddress: ip,
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      });
      
      await redis.set(`password:reset:${token}`, user.id, 'EX', 60 * 60);
      
      // Send email directly (replace with your email service implementation)
      await sendResetEmail(user.email, `/reset-password?token=${token}`);
      
      await prisma.securityEvent.create({
        data: {
          userId: user.id,
          eventType: 'password_reset_requested',
          severity: 'medium',
          description: 'Password reset was requested',
          ipAddress: ip,
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'If that email address is in our system, we have sent a password reset link'
    });
  } catch (error) {
    logger.error('Error requesting password reset:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}