import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';


const RATE_LIMIT_WINDOW = 15 * 60; // 15 minutes
const MAX_ATTEMPTS = 3;

export async function POST(request: NextRequest) {
  try {
    const { email, method } = await request.json();

    if (!email || !method) {
      return NextResponse.json(
        { error: 'Email and method are required' },
        { status: 400 }
      );
    }

    if (!['email', 'phone'].includes(method)) {
      return NextResponse.json(
        { error: 'Invalid recovery method' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.student.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        phone: true,
        phoneVerified: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Rate limiting check
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const rateLimitKey = `recovery:${ipAddress}:${user.id}`;
    
    // Check rate limit using database
    const recentAttempts = await prisma.authLog.count({
      where: {
        userId: user.id,
        action: 'password_recovery_code_sent',
        createdAt: {
          gte: new Date(Date.now() - RATE_LIMIT_WINDOW * 1000)
        }
      }
    });

    if (recentAttempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Too many recovery attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete old codes
    await prisma.twoFactorVerificationCode.deleteMany({
      where: {
        userId: user.id,
        method: `recovery_${method}`,
        OR: [
          { used: true },
          { expiresAt: { lt: new Date() } }
        ]
      }
    });

    // Create new verification code
    await prisma.twoFactorVerificationCode.create({
      data: {
        userId: user.id,
        code: hashedCode,
        method: `recovery_${method}`,
        expiresAt,
        used: false
      }
    });

    // Send code based on method
    if (method === 'email' && user.emailVerified) {
      await console.log(`Password Recovery Code ${code}`);
      await prisma.authLog.create({
        data: {
          userId: user.id,
          email: user.email,
          action: 'password_recovery_code_sent',
          ipAddress,
          userAgent: request.headers.get('user-agent') || '',
          success: true,
          details: { method: 'email' }
        }
      });

      return NextResponse.json({
        success: true,
        partialEmail: maskEmail(user.email)
      });

    } else if (method === 'phone' && user.phoneVerified && user.phone) {
      await console.log({
        to: user.phone,
        message: `Your password recovery code is: ${code}. Valid for 10 minutes.`
      });

      await prisma.authLog.create({
        data: {
          userId: user.id,
          email: user.email,
          action: 'password_recovery_code_sent',
          ipAddress,
          userAgent: request.headers.get('user-agent') || '',
          success: true,
          details: { method: 'phone' }
        }
      });

      return NextResponse.json({
        success: true,
        partialPhone: maskPhone(user.phone)
      });

    } else {
      return NextResponse.json(
        { error: `${method} is not verified for this account` },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Send recovery code error:', error);
    return NextResponse.json(
      { error: 'Failed to send recovery code' },
      { status: 500 }
    );
  }
}

function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  const maskedName = name.charAt(0) + '*'.repeat(Math.max(name.length - 2, 1)) + name.charAt(name.length - 1);
  return `${maskedName}@${domain}`;
}

function maskPhone(phone: string): string {
  return phone.slice(0, 2) + '*'.repeat(phone.length - 4) + phone.slice(-2);
}