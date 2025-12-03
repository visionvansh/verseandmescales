import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { UAParser } from 'ua-parser-js';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code required' },
        { status: 400 }
      );
    }

    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    // Verify code
    const verification = await prisma.emailVerification.findFirst({
      where: {
        email: email.toLowerCase(),
        token: hashedCode,
        expiresAt: { gt: new Date() },
        verified: false,
      },
    });

    if (!verification) {
      return NextResponse.json(
        { error: 'Invalid or expired code' },
        { status: 400 }
      );
    }

    // Mark as verified
    await prisma.emailVerification.update({
      where: { id: verification.id },
      data: { verified: true },
    });

    // Create or update user (NO PASSWORD)
    let user = await prisma.student.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') + 
                      crypto.randomInt(1000, 9999);

      user = await prisma.student.create({
        data: {
          email: email.toLowerCase(),
          username,
          emailVerified: true,
          password: null, // ✅ NO PASSWORD - user will set it later
          preferences: {
            create: {
              emailNotifications: true,
              theme: 'dark',
              language: 'en'
            }
          }
        },
      });

      console.log('✅ New user created (no password):', user.id);
    } else {
      // Update existing user
      user = await prisma.student.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    }

    // Generate session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const refreshToken = crypto.randomBytes(32).toString('hex');
    
    // Get request metadata
    const metadata = extractRequestMetadata(request);
    
    // Create device
    const device = await prisma.userDevice.upsert({
      where: { 
        userId_fingerprint: {
          userId: user.id,
          fingerprint: metadata.fingerprint
        }
      },
      update: {
        lastUsed: new Date(),
        usageCount: { increment: 1 }
      },
      create: {
        userId: user.id,
        deviceName: metadata.deviceName,
        deviceType: metadata.deviceType,
        browser: metadata.browser,
        os: metadata.os,
        fingerprint: metadata.fingerprint,
        trusted: true, // Trust first device
      }
    });

    // Create session
    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        sessionToken,
        refreshToken,
        deviceId: device.id,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        location: metadata.location,
        country: metadata.country,
        city: metadata.city,
        sessionType: 'web',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    // Generate JWT
    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email, sessionId: session.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Log activity
    await prisma.authLog.create({
      data: {
        userId: user.id,
        action: 'checkout_account_created',
        success: true,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        location: metadata.location,
        country: metadata.country,
        city: metadata.city,
        deviceType: metadata.deviceType,
        browser: metadata.browser,
      }
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        emailVerified: true,
      },
    });

    // Set cookies
    response.cookies.set('auth-token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    });

    response.cookies.set('session-id', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('❌ Verify code error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}

function extractRequestMetadata(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  
  const userAgent = request.headers.get('user-agent') || '';
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  
  const country = request.headers.get('cf-ipcountry') || 'Unknown';
  const city = request.headers.get('cf-ipcity') || 'Unknown';
  const location = `${city}, ${country}`;
  
  const fingerprint = crypto.createHash('md5')
    .update(`${userAgent}${result.browser.name}${result.os.name}`)
    .digest('hex');
  
  return {
    ipAddress,
    userAgent,
    location,
    country,
    city,
    deviceType: result.device.type || 'desktop',
    browser: result.browser.name || 'Unknown',
    os: result.os.name || 'Unknown',
    deviceName: `${result.browser.name} on ${result.os.name}`,
    fingerprint
  };
}