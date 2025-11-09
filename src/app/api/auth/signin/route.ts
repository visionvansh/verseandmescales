// app/api/auth/signin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { UAParser } from 'ua-parser-js';
import crypto from 'crypto';
import { getUserTwoFactorMethods } from '@/utils/twoFactorAuth';
import { analyzeBehaviorForRisk } from '@/utils/behaviousAnalysis';
import { redis } from '@/lib/redis';

const RATE_LIMIT_WINDOW = 15 * 60;
const MAX_ATTEMPTS = 5;

const SESSION_DURATION = {
  TRUSTED: 150 * 24 * 60 * 60 * 1000,
  UNTRUSTED: 20 * 24 * 60 * 60 * 1000,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      password, 
      rememberMe = false, 
      deviceFingerprint,
      deviceInfo = {},
      trustThisDevice = false,
      redirectUrl = '/users'
    } = body;

    const clientInfo = extractClientInfo(request);
    const { ipAddress, userAgent, parsedUserAgent, location, country, city, region } = clientInfo;
    
    const loginTime = new Date();
    const dayOfWeek = loginTime.getDay();
    const hourOfDay = loginTime.getHours();

    // Rate limiting
    const rateLimitKey = `rate:signin:${ipAddress}:${email}`;
    const attempts = await redis.incr(rateLimitKey);
    
    if (attempts === 1) {
      await redis.expire(rateLimitKey, RATE_LIMIT_WINDOW);
    }
    
    if (attempts > MAX_ATTEMPTS) {
      const ttl = await redis.ttl(rateLimitKey);
      
      await logAuthAttempt({
        email,
        action: 'login_rate_limited',
        ipAddress,
        userAgent,
        location,
        country,
        city,
        deviceType: parsedUserAgent.device.type || 'unknown',
        browser: parsedUserAgent.browser.name || 'unknown',
        success: false,
        errorCode: 'RATE_LIMITED',
        riskScore: 70,
        flagged: true
      });
      
      return NextResponse.json(
        { error: `Too many login attempts. Try again in ${Math.ceil(ttl / 60)} minutes.` },
        { status: 429 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' }, 
        { status: 400 }
      );
    }

    const user = await prisma.student.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        preferences: true,
        devices: {
          orderBy: { lastUsed: 'desc' },
          take: 10
        },
        sessions: {
          where: { isActive: true },
          orderBy: { lastUsed: 'desc' },
          take: 10
        },
        biometricCredentials: {
          select: { id: true }
        }
      }
    });
    
    if (!user) {
      await logAuthAttempt({
        email,
        action: 'login_failed',
        ipAddress,
        userAgent,
        location,
        country,
        city,
        deviceType: parsedUserAgent.device.type || 'unknown',
        browser: parsedUserAgent.browser.name || 'unknown',
        success: false,
        errorCode: 'USER_NOT_FOUND',
        riskScore: 40
      });
      
      return NextResponse.json(
        { error: 'Invalid email or password' }, 
        { status: 401 }
      );
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const lockTimeLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000 / 60);
      
      return NextResponse.json(
        { error: `Account is locked. Try again in ${lockTimeLeft} minutes.` },
        { status: 423 }
      );
    }

    const isValidPassword = user.password ? await bcrypt.compare(password, user.password) : false;
    
    if (!isValidPassword) {
      const newLoginAttempts = user.loginAttempts + 1;
      const shouldLock = newLoginAttempts >= 5;
      
      await prisma.student.update({
        where: { id: user.id },
        data: {
          loginAttempts: newLoginAttempts,
          lockedUntil: shouldLock ? new Date(Date.now() + 30 * 60 * 1000) : null
        }
      });

      await logAuthAttempt({
        userId: user.id,
        email: user.email,
        action: 'login_failed',
        ipAddress,
        userAgent,
        location,
        country,
        city,
        deviceType: parsedUserAgent.device.type || 'unknown',
        browser: parsedUserAgent.browser.name || 'unknown',
        success: false,
        errorCode: 'INVALID_PASSWORD',
        details: { loginAttempts: newLoginAttempts, accountLocked: shouldLock },
        riskScore: 50 + (newLoginAttempts * 10),
        flagged: shouldLock
      });

      return NextResponse.json(
        { error: 'Invalid email or password' }, 
        { status: 401 }
      );
    }

    await prisma.student.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLogin: loginTime,
        lastActiveAt: loginTime,
        isOnline: true
      }
    });

    await redis.del(rateLimitKey);

    // ✅ Get fingerprint from cookie or body
    const cookieStore = await (await import('next/headers')).cookies();
    let enhancedFingerprint = cookieStore.get('device-fingerprint')?.value || deviceFingerprint || generateBasicFingerprint(clientInfo);
    
    console.log(`[Signin] User: ${user.email}, Fingerprint: ${enhancedFingerprint.substring(0, 16)}...`);
    
    const advancedDeviceData = processDeviceData(deviceInfo, parsedUserAgent);
    
    // ✅ CRITICAL FIX: NEVER auto-trust devices in signin - only find or create
    const device = await findOrCreateDevice(
      user.id,
      enhancedFingerprint,
      advancedDeviceData,
      clientInfo
    );

    console.log(`[Signin] Device found/created: ID=${device.id}, Trusted=${device.trusted}, IsAccountCreation=${device.isAccountCreationDevice}`);

    // ✅ Check Redis cache for trusted device
    const redisTrustedKey = `2fa:device:${user.id}:${enhancedFingerprint}`;
    const isTrustedInRedis = await redis.exists(redisTrustedKey);
    
    // ✅ Device is trusted ONLY if marked in DB OR cached in Redis
    const deviceIsTrusted = device.trusted || isTrustedInRedis > 0;
    
    console.log(`[Signin] Trust status - DB: ${device.trusted}, Redis: ${isTrustedInRedis}, Final: ${deviceIsTrusted}`);

    // Perform behavior analysis
    const behaviorAnalysis = await analyzeBehaviorForRisk(user.id, {
      ipAddress,
      location: city || region || 'Unknown',
      country: country || 'Unknown',
      deviceFingerprint: enhancedFingerprint,
      loginTime
    });

    console.log('[Signin] Behavior analysis:', {
      riskScore: behaviorAnalysis.riskScore,
      allowBypass: behaviorAnalysis.allowTrustedDeviceBypass
    });

    const sessionDuration = deviceIsTrusted 
      ? SESSION_DURATION.TRUSTED 
      : SESSION_DURATION.UNTRUSTED;

    // ✅ Use behavior analysis decision
    const shouldBypass2FA = 
      user.twoFactorEnabled &&
      behaviorAnalysis.allowTrustedDeviceBypass;

    console.log(`[Signin] 2FA decision: ${shouldBypass2FA ? 'BYPASS (trusted device)' : 'REQUIRE'}`);

    if (shouldBypass2FA) {
      console.log('[Signin] ✅ Bypassing 2FA - trusted device with low risk');
      
      const expiresAt = new Date(Date.now() + sessionDuration);
      
      const sessionToken = crypto.randomUUID();
      const refreshToken = crypto.randomUUID();
      
      const session = await prisma.userSession.create({
        data: {
          userId: user.id,
          sessionToken,
          refreshToken,
          deviceId: device.id,
          ipAddress,
          userAgent,
          location,
          country,
          city,
          sessionType: advancedDeviceData.deviceType,
          expiresAt
        }
      });

      await prisma.loginAnalytics.create({
        data: {
          userId: user.id,
          loginTime,
          dayOfWeek: String(dayOfWeek),
          hourOfDay,
          country: country || 'Unknown',
          region: region || 'Unknown',
          city: city || 'Unknown',
          timezone: advancedDeviceData.timezone || 'UTC',
          deviceType: advancedDeviceData.deviceType || 'unknown',
          browser: advancedDeviceData.browser || 'unknown',
          os: advancedDeviceData.os || 'unknown',
          isNewDevice: false,
          isNewLocation: false,
          riskScore: behaviorAnalysis.riskScore,
          authMethod: 'password_trusted_device',
        }
      });

      const token = jwt.sign(
        { 
          userId: user.id, 
          sessionId: session.id,
          email: user.email 
        },
        process.env.JWT_SECRET!,
        { expiresIn: deviceIsTrusted ? '150d' : '20d' }
      );

      await logAuthAttempt({
        userId: user.id,
        email: user.email,
        action: 'login_success_trusted_device',
        ipAddress,
        userAgent,
        location,
        country,
        city,
        deviceType: parsedUserAgent.device.type || 'unknown',
        browser: parsedUserAgent.browser.name || 'unknown',
        success: true,
        details: { 
          deviceId: device.id,
          sessionId: session.id,
          bypassedReason: 'trusted_device_low_risk',
          riskScore: behaviorAnalysis.riskScore
        },
        riskScore: behaviorAnalysis.riskScore
      });

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
        deviceTrusted: true,
        bypassed2FA: true,
        securityScore: 100 - behaviorAnalysis.riskScore,
        redirectUrl
      });

      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: Math.floor(sessionDuration / 1000),
        path: '/'
      });
      
      response.cookies.set('device-fingerprint', enhancedFingerprint, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 150 * 24 * 60 * 60,
        path: '/'
      });

      return response;
    }

    if (user.twoFactorEnabled) {
      console.log('[Signin] 🔐 Requiring 2FA verification');
      
      const twoFactorSessionId = crypto.randomUUID();
      
      const allMethods = await getUserTwoFactorMethods(user.id);

      const primaryMethods = allMethods.filter(m => 
        ['2fa', 'sms', 'email', 'backup'].includes(m)
      );

      const additionalMethods = allMethods.filter(m => 
        ['passkey', 'recovery_email', 'recovery_phone'].includes(m)
      );

      console.log('[Signin] Available 2FA methods:', {
        primary: primaryMethods,
        additional: additionalMethods
      });

      const primaryMethod = user.twoFactorMethod || '2fa';
      
      await prisma.twoFactorSession.create({
        data: {
          id: twoFactorSessionId,
          userId: user.id,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          ipAddress,
          userAgent,
          deviceId: device.id,
          metadata: {
            deviceFingerprint: enhancedFingerprint,
            rememberMe,
            location,
            country,
            city,
            deviceTrusted: deviceIsTrusted,
            riskScore: behaviorAnalysis.riskScore,
            riskFactors: behaviorAnalysis.riskFactors,
            trustThisDevice,
            primaryMethods,
            additionalMethods,
            primaryMethod,
            failedAttempts: 0,
            redirectUrl
          }
        }
      });

      await redis.setex(
        `2fa:session:${twoFactorSessionId}`,
        600,
        JSON.stringify({
          userId: user.id,
          deviceId: device.id,
          deviceFingerprint: enhancedFingerprint,
          trustThisDevice,
          primaryMethods,
          additionalMethods,
          primaryMethod,
          failedAttempts: 0,
          redirectUrl
        })
      );
      
      await logAuthAttempt({
        userId: user.id,
        email: user.email,
        action: 'login_2fa_required',
        ipAddress,
        userAgent,
        location,
        country,
        city,
        deviceType: parsedUserAgent.device.type || 'unknown',
        browser: parsedUserAgent.browser.name || 'unknown',
        success: true,
        details: { 
          deviceId: device.id,
          riskScore: behaviorAnalysis.riskScore,
          riskFactors: behaviorAnalysis.riskFactors,
          primaryMethods,
          additionalMethods,
          deviceTrusted: deviceIsTrusted
        },
        riskScore: behaviorAnalysis.riskScore
      });
      
      const response = NextResponse.json({
        requiresTwoFactor: true,
        twoFactorSessionId,
        twoFactorMethods: primaryMethods,
        primaryMethods,
        additionalMethods,
        primaryMethod,
        hasAdditionalMethods: additionalMethods.length > 0,
        isNewDevice: !deviceIsTrusted,
        deviceTrusted: deviceIsTrusted,
        suspiciousActivity: behaviorAnalysis.riskScore >= 60,
        riskScore: behaviorAnalysis.riskScore,
        riskFactors: behaviorAnalysis.riskFactors,
        hasPasskeys: user.biometricCredentials.length > 0,
        recommendations: behaviorAnalysis.recommendations,
        redirectUrl
      });
      
      response.cookies.set('device-fingerprint', enhancedFingerprint, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 150 * 24 * 60 * 60,
        path: '/'
      });
      
      return response;
    }

    // NO 2FA - DIRECT LOGIN
    console.log('[Signin] No 2FA required - proceeding with direct login');
    
    const expiresAt = new Date(Date.now() + sessionDuration);
    
    const sessionToken = crypto.randomUUID();
    const refreshToken = crypto.randomUUID();
    
    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        sessionToken,
        refreshToken,
        deviceId: device.id,
        ipAddress,
        userAgent,
        location,
        country,
        city,
        sessionType: advancedDeviceData.deviceType,
        expiresAt
      }
    });

    // ✅ ONLY trust device if user explicitly requests it
    if (trustThisDevice && !device.trusted) {
      await prisma.userDevice.update({
        where: { id: device.id },
        data: { trusted: true }
      });

      await redis.setex(
        redisTrustedKey,
        150 * 24 * 60 * 60,
        '1'
      );
      
      console.log('[Signin] Device marked as trusted by user request');
    }

    await prisma.loginAnalytics.create({
      data: {
        userId: user.id,
        loginTime,
        dayOfWeek: String(dayOfWeek),
        hourOfDay,
        country: country || 'Unknown',
        region: region || 'Unknown',
        city: city || 'Unknown',
        timezone: advancedDeviceData.timezone || 'UTC',
        deviceType: advancedDeviceData.deviceType || 'unknown',
        browser: advancedDeviceData.browser || 'unknown',
        os: advancedDeviceData.os || 'unknown',
        isNewDevice: !deviceIsTrusted,
        isNewLocation: behaviorAnalysis.riskFactors.includes('new_location'),
        riskScore: behaviorAnalysis.riskScore,
        authMethod: 'password',
      }
    });

    const token = jwt.sign(
      { 
        userId: user.id, 
        sessionId: session.id,
        email: user.email 
      },
      process.env.JWT_SECRET!,
      { expiresIn: deviceIsTrusted ? '150d' : '20d' }
    );

    await logAuthAttempt({
      userId: user.id,
      email: user.email,
      action: 'login_success',
      ipAddress,
      userAgent,
      location,
      country,
      city,
      deviceType: parsedUserAgent.device.type || 'unknown',
      browser: parsedUserAgent.browser.name || 'unknown',
      success: true,
      details: { 
        deviceId: device.id,
        sessionId: session.id,
      },
      riskScore: behaviorAnalysis.riskScore
    });

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
      deviceTrusted: device.trusted,
      securityScore: 100 - behaviorAnalysis.riskScore,
      redirectUrl
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: Math.floor(sessionDuration / 1000),
      path: '/'
    });
    
    response.cookies.set('device-fingerprint', enhancedFingerprint, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 150 * 24 * 60 * 60,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

// ✅ FIXED: Removed trustByDefault parameter - signin never auto-trusts
async function findOrCreateDevice(
  userId: string, 
  fingerprint: string, 
  deviceData: any, 
  clientInfo: any
) {
  try {
    // ✅ Find device for THIS user with THIS fingerprint
    let device = await prisma.userDevice.findFirst({
      where: { 
        userId,
        fingerprint
      }
    });
    
    if (device) {
      // ✅ Device exists - update usage stats ONLY
      // NEVER modify trust or isAccountCreationDevice
      device = await prisma.userDevice.update({
        where: { id: device.id },
        data: {
          lastUsed: new Date(),
          usageCount: { increment: 1 },
          browser: deviceData.browser,
          browserVersion: deviceData.browserVersion,
          os: deviceData.os,
          osVersion: deviceData.osVersion
        }
      });
      
      console.log(`[findOrCreateDevice] Updated existing device: ${device.id}`);
      return device;
    }
    
    // ✅ New device - create as UNTRUSTED
    device = await prisma.userDevice.create({
      data: {
        userId,
        deviceName: deviceData.deviceName,
        deviceType: deviceData.deviceType,
        browser: deviceData.browser,
        browserVersion: deviceData.browserVersion,
        os: deviceData.os,
        osVersion: deviceData.osVersion,
        fingerprint,
        trusted: false,                    // ✅ Always false in signin
        isAccountCreationDevice: false,    // ✅ Always false in signin
        usageCount: 1
      }
    });
    
    console.log(`[findOrCreateDevice] Created new UNTRUSTED device: ${device.id}`);
    return device;
    
  } catch (error: any) {
    // Handle race condition
    if (error.code === 'P2002') {
      console.log(`[findOrCreateDevice] Race condition, retrying...`);
      
      const existingDevice = await prisma.userDevice.findFirst({
        where: { userId, fingerprint }
      });
      
      if (existingDevice) {
        return existingDevice;
      }
    }
    
    console.error(`[findOrCreateDevice] Error:`, error);
    throw error;
  }
}

// Helper functions remain the same
function extractClientInfo(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(',')[0].trim() : 
                   request.headers.get('x-real-ip') || '127.0.0.1';
  
  const userAgent = request.headers.get('user-agent') || '';
  const parser = new UAParser(userAgent);
  const parsedUserAgent = parser.getResult();
  
  let location = 'Unknown';
  let country = 'Unknown';
  let city = 'Unknown';
  let region = 'Unknown';
  
  const cfCountry = request.headers.get('cf-ipcountry');
  const cfCity = request.headers.get('cf-ipcity');
  const cfRegion = request.headers.get('cf-region');
  const vercelCountry = request.headers.get('x-vercel-ip-country');
  const vercelCity = request.headers.get('x-vercel-ip-city');
  const vercelRegion = request.headers.get('x-vercel-ip-region');
  
  country = cfCountry || vercelCountry || country;
  city = cfCity || vercelCity || city;
  region = cfRegion || vercelRegion || region;
  
  if (city !== 'Unknown' || country !== 'Unknown') {
    location = [city, region, country].filter(part => part !== 'Unknown').join(', ');
  }
  
  return {
    ipAddress,
    userAgent,
    parsedUserAgent,
    location,
    country,
    city,
    region
  };
}

function generateBasicFingerprint(clientInfo: any) {
  return crypto.createHash('md5')
    .update(`${clientInfo.userAgent}${clientInfo.ipAddress}${clientInfo.parsedUserAgent.browser.name || ''}${clientInfo.parsedUserAgent.os.name || ''}`)
    .digest('hex');
}

function processDeviceData(deviceInfo: any, parsedUserAgent: any) {
  return {
    deviceType: deviceInfo.deviceType || parsedUserAgent.device.type || 'desktop',
    deviceName: deviceInfo.deviceName || 
                `${parsedUserAgent.browser.name || 'Unknown'} on ${parsedUserAgent.os.name || 'Unknown'}`,
    browser: parsedUserAgent.browser.name || 'Unknown',
    browserVersion: parsedUserAgent.browser.version || 'Unknown',
    os: parsedUserAgent.os.name || 'Unknown',
    osVersion: parsedUserAgent.os.version || 'Unknown',
    screen: deviceInfo.screen || 'Unknown',
    timezone: deviceInfo.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: deviceInfo.language || 'en',
    platform: parsedUserAgent.engine.name || deviceInfo.platform || 'Unknown',
    isMobile: !!parsedUserAgent.device.type && parsedUserAgent.device.type === 'mobile',
    isTablet: !!parsedUserAgent.device.type && parsedUserAgent.device.type === 'tablet',
    vendor: parsedUserAgent.device.vendor || 'Unknown',
    model: parsedUserAgent.device.model || 'Unknown'
  };
}

async function logAuthAttempt(data: any) {
  try {
    await prisma.authLog.create({
      data: {
        userId: data.userId,
        email: data.email,
        action: data.action,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        location: data.location,
        country: data.country,
        city: data.city,
        deviceType: data.deviceType,
        browser: data.browser,
        success: data.success,
        errorCode: data.errorCode,
        errorMessage: data.errorMessage,
        details: data.details,
        riskScore: data.riskScore,
        flagged: data.flagged || false
      }
    });
  } catch (error) {
    console.error('Failed to log auth attempt:', error);
  }
}