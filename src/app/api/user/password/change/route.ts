// app/api/user/password/change/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/utils/auth';
import { z } from 'zod';
import { logger } from '@/lib/log';
import bcrypt from 'bcryptjs';
import { redis } from '@/lib/redis';

const SALT_ROUNDS = 12;

// Type definitions
interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

type PipelineResult = [Error | null, string | number | null];

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
    .refine(
      (password: string) => !/(123|abc|password|admin|qwerty|welcome)/i.test(password),
      "Password contains common patterns. Please choose a stronger password"
    )
    .refine(
      (password: string) => !(/(.)\1{2,}/).test(password),
      "Password contains repeated characters. Please choose a stronger password"
    )
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const identifier = `${ip}:${user.id}`;
    const pipeline = redis.pipeline();
    pipeline.get(`rate-limit:${identifier}:password:change`);
    pipeline.ttl(`rate-limit:${identifier}:password:change`);
    const pipelineResults = await pipeline.exec() as PipelineResult[] | null;
    
    const [attemptsResult, ttlResult] = pipelineResults || [[null, '0'], [null, -2]] as PipelineResult[];
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
        { error: 'Too many requests. Please try again later.', reset: ttl },
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
    
    await redis.incr(`rate-limit:${identifier}:password:change`);
    await redis.expire(`rate-limit:${identifier}:password:change`, 60);
    
    let data: ChangePasswordData;
    try {
      const body = await request.json();
      const result = changePasswordSchema.safeParse(body);
      
      if (!result.success) {
        return NextResponse.json(
          { 
            error: 'Validation error', 
            details: result.error.format(),
            message: result.error.issues[0]?.message || 'Invalid password format' 
          },
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
    
    if (!user.password) {
      return NextResponse.json(
        { error: 'User does not have a password set' },
        { status: 400 }
      );
    }
    
    const passwordValid = await bcrypt.compare(data.currentPassword, user.password);
    
    if (!passwordValid) {
      await prisma.student.update({
        where: { id: user.id },
        data: { loginAttempts: { increment: 1 } }
      });
      
      await prisma.securityEvent.create({
        data: {
          userId: user.id,
          eventType: 'password_change_failed',
          severity: 'medium',
          description: 'Failed attempt to change password (incorrect current password)',
          ipAddress: ip,
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      });
      
      const invalidatePipeline = redis.pipeline();
      invalidatePipeline.del(`security:${user.id}`);
      await invalidatePipeline.exec();
      
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }
    
    const isSamePassword = await bcrypt.compare(data.newPassword, user.password);
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      );
    }
    
    const hashedPassword = await bcrypt.hash(data.newPassword, SALT_ROUNDS);
    
    await prisma.student.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
        loginAttempts: 0
      }
    });
    
    // Preemptively cache password status
    const cacheKey = `password:status:${user.id}`;
    await redis.set(cacheKey, JSON.stringify({ hasPassword: true }), 'EX', 3600);
    
    // Batch cache invalidation
    const invalidatePipeline = redis.pipeline();
    invalidatePipeline.del(`security:${user.id}`);
    invalidatePipeline.del(`password:${user.id}`);
    await invalidatePipeline.exec();
    
    await prisma.userActivityLog.create({
      data: {
        userId: user.id,
        action: 'password_changed',
        description: 'Password was changed',
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });
    
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: 'password_changed',
        severity: 'low',
        description: 'Password successfully changed',
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        resolved: true,
        resolvedAt: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}