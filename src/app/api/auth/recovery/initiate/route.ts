import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { getUserTwoFactorMethods } from '@/utils/twoFactorAuth';
import { UAParser } from 'ua-parser-js';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.student.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        phone: true,
        phoneVerified: true,
        recoveryEmail: true,
        recoveryPhone: true,
        twoFactorEnabled: true,
        twoFactorBackupCodes: {
          where: { used: false },
          select: { id: true }
        }
      }
    });

    if (!user) {
      // Don't reveal if email exists for security
      return NextResponse.json(
        { error: 'If this email exists, you will receive recovery instructions' },
        { status: 404 }
      );
    }

    // If 2FA is enabled, create a 2FA session for recovery
    if (user.twoFactorEnabled) {
      const twoFactorSessionId = crypto.randomUUID();
      
      const clientInfo = extractClientInfo(request);
      const { ipAddress, userAgent, location, country, city } = clientInfo;

      // Get available 2FA methods
      const availableMethods = await getUserTwoFactorMethods(user.id);

      // Create 2FA session specifically for recovery
      await prisma.twoFactorSession.create({
        data: {
          id: twoFactorSessionId,
          userId: user.id,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          ipAddress,
          userAgent,
          metadata: {
            isRecovery: true, // Mark this as a recovery session
            email: user.email,
            location,
            country,
            city,
            primaryMethods: availableMethods,
            redirectUrl: '/auth/recovery'
          }
        }
      });

      // Log recovery attempt
      await prisma.authLog.create({
        data: {
          userId: user.id,
          email: user.email,
          action: 'password_recovery_2fa_required',
          ipAddress,
          userAgent,
          location,
          country,
          city,
          deviceType: 'unknown',
          browser: 'unknown',
          success: true,
          details: { requiresTwoFactor: true }
        }
      });

      return NextResponse.json({
        twoFactorEnabled: true,
        twoFactorSessionId,
        twoFactorMethods: availableMethods
      });
    }

    // Build recovery options
    const recoveryOptions = {
      hasBackupCodes: user.twoFactorBackupCodes.length > 0,
      hasVerifiedEmail: user.emailVerified,
      hasVerifiedPhone: user.phoneVerified && !!user.phone,
      partialEmail: user.emailVerified ? maskEmail(user.email) : undefined,
      partialPhone: (user.phoneVerified && user.phone) ? maskPhone(user.phone) : undefined,
      twoFactorEnabled: false
    };

    // Log recovery initiation
    const clientInfo = extractClientInfo(request);
    await prisma.authLog.create({
      data: {
        userId: user.id,
        email: user.email,
        action: 'password_recovery_initiated',
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        location: clientInfo.location,
        country: clientInfo.country,
        city: clientInfo.city,
        deviceType: 'unknown',
        browser: 'unknown',
        success: true
      }
    });

    return NextResponse.json(recoveryOptions);

  } catch (error) {
    console.error('Recovery initiation error:', error);
    return NextResponse.json(
      { error: 'An error occurred during recovery initiation' },
      { status: 500 }
    );
  }
}

function extractClientInfo(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(',')[0].trim() : 
                   request.headers.get('x-real-ip') || '127.0.0.1';
  
  const userAgent = request.headers.get('user-agent') || '';
  
  let location = 'Unknown';
  let country = 'Unknown';
  let city = 'Unknown';
  
  const cfCountry = request.headers.get('cf-ipcountry');
  const cfCity = request.headers.get('cf-ipcity');
  const vercelCountry = request.headers.get('x-vercel-ip-country');
  const vercelCity = request.headers.get('x-vercel-ip-city');
  
  country = cfCountry || vercelCountry || country;
  city = cfCity || vercelCity || city;
  
  if (city !== 'Unknown' || country !== 'Unknown') {
    location = [city, country].filter(part => part !== 'Unknown').join(', ');
  }
  
  return { ipAddress, userAgent, location, country, city };
}

function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  const maskedName = name.charAt(0) + '*'.repeat(Math.max(name.length - 2, 1)) + name.charAt(name.length - 1);
  return `${maskedName}@${domain}`;
}

function maskPhone(phone: string): string {
  return phone.slice(0, 2) + '*'.repeat(phone.length - 4) + phone.slice(-2);
}