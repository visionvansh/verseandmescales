// app/api/user/2fa/disable/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { redis } from '@/lib/redis';

// Define type for Redis get result
type RedisValue = string | null;

// Define types for Prisma query results
interface UserWithAuth {
  id: string;
  twoFactorEnabled: boolean;
  password: string | null;
  email: string;
  emailVerified: boolean;
}

const disableSchema = z.object({
  password: z.string().optional(),
  emailCode: z.string().optional(),
  requestEmailCode: z.boolean().optional()
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Apply rate limiting for security
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const identifier = `${ip}:${user.id}:2fa-disable`;
    const rateLimitKey = `rate-limit:${identifier}`;
    
    const currentAttempts: RedisValue = await redis.get(rateLimitKey);
    if (currentAttempts && parseInt(currentAttempts) >= 5) {
      return NextResponse.json({
        error: 'Too many attempts. Please try again in a few minutes.'
      }, { status: 429 });
    }
    
    // Increment rate limit counter
    await redis.incr(rateLimitKey);
    await redis.expire(rateLimitKey, 300); // 5 minute window
    
    // Parse request body
    const body = await request.json();
    const result = disableSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Invalid request',
        details: result.error.format()
      }, { status: 400 });
    }
    
    const data = result.data;
    
    // Double-check if 2FA is actually enabled
    const currentUser = await prisma.student.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        twoFactorEnabled: true,
        password: true,
        email: true,
        emailVerified: true
      }
    }) as UserWithAuth | null;
    
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (!currentUser.twoFactorEnabled) {
      return NextResponse.json({ 
        success: true,
        message: 'Two-factor authentication is already disabled',
        alreadyDisabled: true
      });
    }

    // Handle email verification code request
    if (data.requestEmailCode) {
      // Only allow email verification if user has no password set
      if (currentUser.password) {
        return NextResponse.json({ 
          error: 'Password is set. Please use password to disable 2FA instead of email verification.'
        }, { status: 400 });
      }
      
      if (!currentUser.email || !currentUser.emailVerified) {
        return NextResponse.json({ error: 'Email is not verified' }, { status: 400 });
      }
      
      // Generate a verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store in Redis with 10 minute expiry
      await redis.set(`2fa:disable:email:${user.id}`, verificationCode, 'EX', 60 * 10);
      
      // In production, send an actual email here
      console.log(`2FA disable code for ${currentUser.email}: ${verificationCode}`);
      
      return NextResponse.json({
        success: true,
        requiresEmailCode: true
      });
    }
    
    // Identity verification logic
    let identityVerified = false;
    
    if (currentUser.password) {
      // Password verification path
      if (!data.password) {
        return NextResponse.json({ 
          error: 'Password verification required to disable 2FA'
        }, { status: 401 });
      }
      
      const passwordValid = await bcrypt.compare(data.password, currentUser.password);
      if (!passwordValid) {
        return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
      }
      
      identityVerified = true;
    } else {
      // Email verification path
      if (!data.emailCode) {
        return NextResponse.json({ 
          error: 'Email verification code required to disable 2FA'
        }, { status: 401 });
      }
      
      const storedCode: RedisValue = await redis.get(`2fa:disable:email:${user.id}`);
      if (!storedCode || storedCode !== data.emailCode) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 401 });
      }
      
      identityVerified = true;
      await redis.del(`2fa:disable:email:${user.id}`);
    }
    
    // If identity is verified, disable 2FA in a transaction
    if (identityVerified) {
      try {
        // Use a transaction to ensure all operations succeed or fail together
        await prisma.$transaction([
          // Disable 2FA
          prisma.student.update({
            where: { id: user.id },
            data: {
              twoFactorEnabled: false,
              twoFactorSecret: null
            }
          }),
          
          // Delete backup codes
          prisma.twoFactorBackupCode.deleteMany({
            where: { userId: user.id }
          }),
          
          // Log activity
          prisma.userActivityLog.create({
            data: {
              userId: user.id,
              action: '2fa_disabled',
              description: 'Two-factor authentication was disabled',
              ipAddress: ip
            }
          }),
          
          // Add security event
          prisma.securityEvent.create({
            data: {
              userId: user.id,
              eventType: '2fa_disabled',
              severity: 'medium',
              description: 'Two-factor authentication disabled',
              ipAddress: ip,
              resolved: true,
              resolvedAt: new Date()
            }
          })
        ]);
        
        // Clear any lingering 2FA sessions
        await redis.del(`2fa:sessions:${user.id}`);
        
        return NextResponse.json({
          success: true,
          message: 'Two-factor authentication disabled successfully'
        });
      } catch (error) {
        console.error(`Transaction error during 2FA disable:`, error);
        throw error;
      }
    }
    
    return NextResponse.json({ error: 'Identity verification failed' }, { status: 401 });
  } catch (error) {
    console.error(`Error disabling 2FA:`, error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to disable two-factor authentication. Please try again later.'
    }, { status: 500 });
  }
}