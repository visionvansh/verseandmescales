//api/auth/signin/passkey
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { verifyPasskeyAuthentication } from '@/utils/passkeys';
import { UAParser } from 'ua-parser-js';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, passkeyResponse } = body;
    
    if (!email || !passkeyResponse) {
      return NextResponse.json(
        { error: 'Email and passkey response are required' },
        { status: 400 }
      );
    }
    
    // Find user
    const user = await prisma.student.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        preferences: true,
        devices: {
          orderBy: { lastUsed: 'desc' },
          take: 1
        }
      }
    });
    
    if (!user || !user.biometricEnabled) {
      return NextResponse.json(
        { error: 'Passkey authentication not available' },
        { status: 400 }
      );
    }
    
    // Verify passkey
    const verification = await verifyPasskeyAuthentication(user.id, passkeyResponse);
    
    if (!verification.verified) {
      return NextResponse.json(
        { error: 'Passkey authentication failed' },
        { status: 401 }
      );
    }
    
    // Update user
    await prisma.student.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        lastActiveAt: new Date(),
        isOnline: true,
        loginAttempts: 0,
        lockedUntil: null
      }
    });
    
    // Parse user agent
    const userAgent = request.headers.get('user-agent') || '';
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    
    // Get client info
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const country = request.headers.get('cf-ipcountry') || request.headers.get('x-vercel-ip-country') || 'Unknown';
    const city = request.headers.get('cf-ipcity') || request.headers.get('x-vercel-ip-city') || 'Unknown';
    const location = [city, country].filter(p => p !== 'Unknown').join(', ') || 'Unknown';
    
    // Create session
    const sessionToken = crypto.randomUUID();
    const refreshToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
    
    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        sessionToken,
        refreshToken,
        deviceId: user.devices[0]?.id,
        ipAddress,
        userAgent,
        location,
        country,
        city,
        sessionType: result.device.type || 'desktop',
        expiresAt
      }
    });
    
    // Log successful login
    await prisma.authLog.create({
      data: {
        userId: user.id,
        email: user.email,
        action: 'passkey_login_success',
        ipAddress,
        userAgent,
        location,
        country,
        city,
        deviceType: result.device.type || 'desktop',
        browser: result.browser.name || 'Unknown',
        success: true,
        details: { 
          sessionId: session.id,
          authMethod: 'passkey'
        }
      }
    });
    
    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        sessionId: session.id,
        email: user.email 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' }
    );
    
    // Create response
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        surname: user.surname,
        img: user.img,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        preferences: user.preferences
      },
      message: 'Passkey authentication successful'
    });
    
    // Set auth cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/'
    });
    
    return response;
  } catch (error) {
    console.error('Passkey sign-in error:', error);
    return NextResponse.json(
      { error: 'Passkey authentication failed' },
      { status: 500 }
    );
  }
}