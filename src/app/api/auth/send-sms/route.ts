// /app/api/auth/send-sms/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import twilio from 'twilio';
import { redis, cacheKeys, CACHE_TIMES } from '@/lib/redis';

const prisma = new PrismaClient();
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

function getClientInfo(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || '';
  return { ipAddress, userAgent };
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    const { ipAddress, userAgent } = getClientInfo(request);

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Check rate limiting from Redis
    const rateLimitKey = `ratelimit:sms:${phone}`;
    const attempts = await redis.get(rateLimitKey);
    
    if (attempts && parseInt(attempts) >= 3) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Check for existing verification and clean up expired ones
    await prisma.phoneVerification.deleteMany({
      where: {
        OR: [
          { phone, expiresAt: { lt: new Date() } }, // Expired
          { phone, verified: true } // Already verified
        ]
      }
    });

    // Store verification in Redis for quick access
    const verificationData = {
      phone,
      code,
      attempts: 0,
      maxAttempts: 3,
      verified: false,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      ipAddress,
      userAgent,
      createdAt: new Date(),
    };
    
    // Create verification record in database
    const verification = await prisma.phoneVerification.create({
      data: {
        phone,
        code,
        attempts: 0,
        maxAttempts: 3,
        verified: false,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        ipAddress,
        userAgent,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Cache verification data in Redis
    await redis.set(
      cacheKeys.phoneVerification(phone),
      JSON.stringify({...verificationData, id: verification.id}),
      'EX',
      CACHE_TIMES.VERIFICATION_CODE
    );
    
    // Track rate limiting
    await redis.incr(rateLimitKey);
    await redis.expire(rateLimitKey, 60 * 60); // 1 hour expiry

    try {
      // Send SMS using Twilio (unchanged)
      await client.messages.create({
        body: `Your Clipify Elite verification code is: ${code}. This code expires in 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: phone
      });

      console.log(`SMS sent to ${phone} with code ${code}`);

      // Log auth event (unchanged)
      await prisma.authLog.create({
        data: {
          email: phone, // Using phone as identifier
          action: 'sms_verification_sent',
          ipAddress,
          userAgent,
          success: true,
          details: { phone },
          createdAt: new Date()
        }
      });

      return NextResponse.json({ 
        success: true,
        message: 'Verification code sent successfully' 
      });

    } catch (twilioError: any) {
      console.error('Twilio SMS error:', twilioError);
      
      // Log failed attempt (unchanged)
      await prisma.authLog.create({
        data: {
          email: phone,
          action: 'sms_verification_failed',
          ipAddress,
          userAgent,
          success: false,
          errorMessage: twilioError.message,
          details: { phone },
          createdAt: new Date()
        }
      });

      // For development, still allow verification even if SMS fails
      if (process.env.NODE_ENV === 'development') {
        console.log(`Development mode: SMS code for ${phone} is ${code}`);
        return NextResponse.json({ 
          success: true,
          message: 'Verification code sent successfully',
          developmentCode: code // Only in development
        });
      }

      return NextResponse.json(
        { error: 'Failed to send SMS. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Send SMS error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}