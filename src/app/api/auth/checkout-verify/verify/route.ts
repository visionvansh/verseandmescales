// app/api/auth/checkout-verify/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { z } from 'zod';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const requestSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'Code must be 6 digits'),
  courseId: z.string().min(1, 'Course ID is required'),
});

const JWT_SECRET = process.env.JWT_SECRET!;

function generateUsername(email: string): string {
  const prefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
  const randomSuffix = crypto.randomInt(1000, 9999);
  return `${prefix}${randomSuffix}`.toLowerCase().slice(0, 20);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, courseId } = requestSchema.parse(body);
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Get stored code
    const codeKey = `checkout-verify:code:${normalizedEmail}`;
    const storedCode = await redis.get(codeKey);
    
    if (!storedCode) {
      return NextResponse.json(
        { error: 'Verification code expired. Please request a new one.' },
        { status: 400 }
      );
    }
    
    if (storedCode !== code) {
      const attemptKey = `checkout-verify:attempts:${normalizedEmail}`;
      const attempts = await redis.incr(attemptKey);
      await redis.expire(attemptKey, 300);
      
      if (attempts >= 5) {
        await redis.del(codeKey);
        return NextResponse.json(
          { error: 'Too many failed attempts. Please request a new code.' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }
    
    // Code is valid - delete it
    await redis.del(codeKey);
    await redis.del(`checkout-verify:attempts:${normalizedEmail}`);
    
    // Check if user already exists
    let user = await prisma.student.findUnique({
      where: { email: normalizedEmail },
    });
    
    if (!user) {
      // Create new user account
      const username = generateUsername(normalizedEmail);
      
      user = await prisma.student.create({
        data: {
          email: normalizedEmail,
          username,
          emailVerified: true,
          signedUpToWebsite: true,
          lastLogin: new Date(),
        },
      });
      
      // Create all default settings
      await Promise.all([
        prisma.profileSettings.create({
          data: { userId: user.id, isPublic: true },
        }),
        prisma.userPreferences.create({
          data: { userId: user.id },
        }),
        prisma.notificationSettings.create({
          data: { userId: user.id },
        }),
        prisma.privacySettings.create({
          data: { userId: user.id },
        }),
      ]);
      
      console.log(`[Checkout Verify] ✅ New account created for ${normalizedEmail}`);
    }
    
    // ✅ Create session with device fingerprint
    const deviceFingerprint = crypto.randomUUID();
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000); // 20 days
    
    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        sessionToken,
        refreshToken: crypto.randomUUID(),
        expiresAt,
        isActive: true,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        sessionType: 'web',
      },
    });
    
    // ✅ Generate JWT with session ID
    const authToken = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        sessionId: session.id,
      },
      JWT_SECRET,
      { expiresIn: '20d' }
    );
    
    // Update last login
    await prisma.student.update({
      where: { id: user.id },
      data: { 
        lastLogin: new Date(),
        lastActiveAt: new Date(),
        isOnline: true,
      },
    });
    
    // ✅ Create response with ALL necessary cookies
    const response = NextResponse.json({
      success: true,
      message: 'Account verified successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        emailVerified: user.emailVerified,
      },
    });
    
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 20 * 24 * 60 * 60, // 20 days
    };
    
    // ✅ CRITICAL: Set all auth cookies
    response.cookies.set('auth-token', authToken, cookieOptions);
    response.cookies.set('session-token', session.sessionToken, cookieOptions);
    response.cookies.set('device-fingerprint', deviceFingerprint, cookieOptions);
    
    console.log('[Checkout Verify] ✅ Cookies set:', {
      authToken: authToken.substring(0, 20) + '...',
      sessionId: session.id,
      deviceFingerprint,
    });
    
    return response;
    
  } catch (error) {
    console.error('[Checkout Verify] ❌ Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}