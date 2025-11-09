import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UAParser } from 'ua-parser-js';

const prisma = new PrismaClient();

// Define type for UserSession based on Prisma schema
type UserSession = {
  id: string;
  userId: string;
  deviceId: string;
  sessionToken: string;
  refreshToken: string;
  isActive: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  location: string | null;
  country: string | null;
  city: string | null;
  expiresAt: Date;
  lastUsed: Date;
};

export async function POST(request: NextRequest) {
  try {
    const { provider, userData, deviceFingerprint, recaptchaToken } = await request.json();

    if (!provider || !userData) {
      return NextResponse.json(
        { message: 'Provider and user data are required' },
        { status: 400 }
      );
    }

    // Find social account by provider and ID
    const socialAccount = await prisma.userSocial.findUnique({
      where: {
        provider_providerUserId: {
          provider,
          providerUserId: userData.id
        }
      },
      include: {
        user: {
          include: {
            preferences: true
          }
        }
      }
    });

    // If social account not found
    if (!socialAccount) {
      return NextResponse.json(
        { message: `No account found linked to this ${provider} account. Please sign up first.` },
        { status: 404 }
      );
    }

    const user = socialAccount.user;

    // Extract request metadata
    const metadata = extractRequestMetadata(request);

    // Update user login info
    await prisma.student.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        lastActiveAt: new Date(),
        isOnline: true
      }
    });

    // Create or update device info
    const device = await prisma.userDevice.upsert({
      where: { fingerprint: deviceFingerprint },
      update: {
        lastUsed: new Date(),
        usageCount: { increment: 1 }
      },
      create: {
        userId: user.id,
        fingerprint: deviceFingerprint,
        deviceName: `${metadata.browser} on ${metadata.os}`,
        deviceType: metadata.deviceType,
        browser: metadata.browser,
        browserVersion: metadata.browserVersion,
        os: metadata.os,
        osVersion: metadata.osVersion,
        trusted: false
      }
    });

    // Security assessment
    const securityAssessment = await assessLoginSecurity(user, device, metadata);

    // === 2FA CHECK === (New section)
    // Check if two-factor auth is required
    if (user.twoFactorEnabled) {
      // Generate a temporary session for 2FA verification
      const twoFactorSessionId = crypto.randomUUID();
      
      // Determine preferred 2FA method
      let preferredMethod = 'app';
      if (user.preferences?.twoFactorPreference) {
        preferredMethod = user.preferences.twoFactorPreference;
      }
      
      // If email is preferred, send verification code
      if (preferredMethod === 'email') {
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        await prisma.phoneVerification.create({
          data: {
            phone: user.email, // Reusing phone verification table for email codes
            code: verificationCode,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent
          }
        });
        
        // In production, send the email here
        console.log(`Would send email to ${user.email} with code ${verificationCode}`);
      }
      
      // If SMS is preferred and phone is verified, send verification code
      if (preferredMethod === 'sms' && user.phone && user.phoneVerified) {
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        await prisma.phoneVerification.create({
          data: {
            phone: user.phone,
            code: verificationCode,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent
          }
        });
        
        // In production, send the SMS here
        console.log(`Would send SMS to ${user.phone} with code ${verificationCode}`);
      }
      
      // Store this session for verification
      await prisma.twoFactorSession.create({
        data: {
          id: twoFactorSessionId,
          userId: user.id,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          metadata: {
            deviceFingerprint,
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
            rememberMe: true, // Default to remember me for social logins
            deviceId: device.id,
            securityAssessment,
            provider
          }
        }
      });
      
      // Log 2FA requirement
      await prisma.authLog.create({
        data: {
          userId: user.id,
          email: user.email,
          action: `${provider}_login_2fa_required`,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          location: metadata.location,
          country: metadata.country,
          city: metadata.city,
          success: true,
          details: { 
            deviceId: device.id,
            newDevice: securityAssessment.isNewDevice,
            locationChange: securityAssessment.isLocationChange,
            provider
          }
        }
      });
      
      return NextResponse.json({
        requiresTwoFactor: true,
        twoFactorSessionId,
        preferredMethod,
        isNewDevice: securityAssessment.isNewDevice,
        isNewLocation: securityAssessment.isLocationChange,
        suspiciousActivity: securityAssessment.isSuspicious
      });
    }

    // Create a new session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const refreshToken = crypto.randomBytes(32).toString('hex');
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days for social login
    
    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        deviceId: device.id,
        sessionToken,
        refreshToken,
        isActive: true,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        location: metadata.location,
        country: metadata.country,
        city: metadata.city,
        expiresAt,
        lastUsed: new Date()
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        sessionId: session.id 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Log successful social login
    await prisma.authLog.create({
      data: {
        userId: user.id,
        email: user.email,
        action: `${provider}_login_success`,
        success: true,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        location: metadata.location,
        country: metadata.country,
        city: metadata.city,
        deviceType: metadata.deviceType,
        browser: metadata.browser,
        details: { provider, deviceFingerprint }
      }
    });

    // Set HTTP-only cookies for authentication (new - instead of just returning token)
    const response = NextResponse.json({
      message: 'Social login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        surname: user.surname
      },
      deviceTrusted: device.trusted,
      suspiciousActivity: securityAssessment.isSuspicious,
      expiresIn: Math.floor((expiresAt.getTime() - Date.now()) / 1000)
    });
    
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });
    
    return response;

  } catch (error) {
    console.error('Social login error:', error);
    return NextResponse.json(
      { message: 'An error occurred during social login' },
      { status: 500 }
    );
  }
}

// Extract client info remains the same
function extractRequestMetadata(request: NextRequest) {
  // Same implementation as before
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(',')[0].trim() : 
                  request.headers.get('x-real-ip') || 'unknown';
  
  const userAgent = request.headers.get('user-agent') || '';
  
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  
  const browser = result.browser.name || 'Unknown';
  const browserVersion = result.browser.version || 'Unknown';
  const os = result.os.name || 'Unknown';
  const osVersion = result.os.version || 'Unknown';
  const deviceType = result.device.type || 'desktop';
  
  const country = request.headers.get('cf-ipcountry') || 
                 request.headers.get('x-vercel-ip-country') || 
                 'Unknown';
  
  const city = request.headers.get('cf-ipcity') || 
              request.headers.get('x-vercel-ip-city') || 
              'Unknown';
  
  const location = city !== 'Unknown' && country !== 'Unknown' 
    ? `${city}, ${country}` 
    : 'Unknown';
  
  return {
    ipAddress,
    userAgent,
    browser,
    browserVersion,
    os,
    osVersion,
    deviceType,
    country,
    city,
    location
  };
}

// Add security assessment function
async function assessLoginSecurity(user: any, device: any, clientInfo: any) {
  // Initialize security assessment
  const assessment = {
    isNewDevice: false,
    isLocationChange: false,
    isUnusualTime: false,
    isSuspicious: false,
    riskScore: 0,
    riskFactors: [] as string[],
    eventType: '',
    severity: 'low',
    description: ''
  };
  
  // Check if this is a new device
  if (device.usageCount <= 1) {
    assessment.isNewDevice = true;
    assessment.riskScore += 20;
    assessment.riskFactors.push('new_device');
  }
  
  // Get recent sessions
  const recentSessions = await prisma.userSession.findMany({
    where: { 
      userId: user.id,
      isActive: true
    },
    orderBy: { lastUsed: 'desc' },
    take: 5
  });
  
  if (recentSessions.length > 0) {
    // Check if there's a recent session from a different location
    const hasLocationChange = recentSessions.some((s: UserSession) => 
      s.country && s.country !== 'Unknown' && 
      clientInfo.country !== 'Unknown' && 
      s.country !== clientInfo.country
    );
    
    if (hasLocationChange) {
      assessment.isLocationChange = true;
      assessment.riskScore += 30;
      assessment.riskFactors.push('location_change');
    }
    
    // Check for simultaneous sessions from different locations
    const activeSessions = recentSessions.filter((s: UserSession) => 
      new Date(s.lastUsed) > new Date(Date.now() - 30 * 60 * 1000) // Active in last 30 minutes
    );
    
    if (activeSessions.length > 0) {
      const hasMultipleLocations = new Set(activeSessions.map((s: UserSession) => s.country)).size > 1;
      
      if (hasMultipleLocations) {
        assessment.riskScore += 40;
        assessment.riskFactors.push('multiple_locations');
      }
    }
  }
  
  // Determine suspicion level
  if (assessment.riskScore >= 50) {
    assessment.isSuspicious = true;
    assessment.severity = 'medium';
    assessment.eventType = 'social_login_suspicious';
    assessment.description = `Suspicious social login: ${assessment.riskFactors.join(', ')}`;
    
    // Log security event
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: assessment.eventType,
        severity: assessment.severity,
        description: assessment.description,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        location: clientInfo.location,
        resolved: false
      }
    });
  }
  
  return assessment;
}