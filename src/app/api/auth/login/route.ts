// /app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma, { findUserByEmail, logAuthEvent } from '@/lib/prisma';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { invalidateUserCache } from '@/lib/enhanced-redis';
import { redis, CACHE_PREFIX } from '@/lib/redis';

// Rate limiting storage (in production, use Redis)
const loginAttempts = new Map();

// ✅ Helper function to get location from IP
async function getLocationFromIP(ip: string) {
  try {
    // Use a free IP geolocation API
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,regionName`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success') {
        return {
          country: data.country || 'Unknown',
          city: data.city || 'Unknown',
          region: data.regionName || 'Unknown'
        };
      }
    }
  } catch (error) {
    console.error('Failed to get location from IP:', error);
  }
  
  return {
    country: 'Unknown',
    city: 'Unknown',
    region: 'Unknown'
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe = false, deviceFingerprint, deviceInfo } = body;

    // Get client info
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';
    
    // ✅ Use async location lookup
    const location = await getLocationFromIP(clientIP);

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' }, 
        { status: 400 }
      );
    }

    // Rate limiting check
    const attemptKey = `${clientIP}:${email}`;
    const attempts = loginAttempts.get(attemptKey) || { count: 0, lastAttempt: 0 };
    const now = Date.now();
    
    if (now - attempts.lastAttempt > 15 * 60 * 1000) {
      attempts.count = 0;
    }
    
    if (attempts.count >= 5) {
      const timeLeft = Math.ceil((15 * 60 * 1000 - (now - attempts.lastAttempt)) / 1000 / 60);
      return NextResponse.json(
        { error: `Too many login attempts. Try again in ${timeLeft} minutes.` },
        { status: 429 }
      );
    }

    // ✅ Find user using singleton Prisma helper
    const user = await findUserByEmail(email);
    
    if (!user) {
      loginAttempts.set(attemptKey, { count: attempts.count + 1, lastAttempt: now });
      
      await logAuthEvent({
        email,
        action: 'login_failed',
        ipAddress: clientIP,
        userAgent,
        location: `${location.city}, ${location.country}`,
        success: false,
        errorCode: 'USER_NOT_FOUND',
      });
      
      return NextResponse.json(
        { error: 'Invalid email or password' }, 
        { status: 401 }
      );
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const lockTimeLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000 / 60);
      return NextResponse.json(
        { error: `Account is locked. Try again in ${lockTimeLeft} minutes.` },
        { status: 423 }
      );
    }

    // Verify password
    const isValidPassword = user.password ? await bcrypt.compare(password, user.password) : false;
    
    if (!isValidPassword) {
      loginAttempts.set(attemptKey, { count: attempts.count + 1, lastAttempt: now });
      
      const newLoginAttempts = user.loginAttempts + 1;
      const shouldLock = newLoginAttempts >= 5;
      
      await prisma.student.update({
        where: { id: user.id },
        data: {
          loginAttempts: newLoginAttempts,
          lockedUntil: shouldLock ? new Date(Date.now() + 30 * 60 * 1000) : null
        }
      });

      await logAuthEvent({
        userId: user.id,
        email: user.email,
        action: 'login_failed',
        ipAddress: clientIP,
        userAgent,
        location: `${location.city}, ${location.country}`,
        success: false,
        errorCode: 'INVALID_PASSWORD',
        details: { loginAttempts: newLoginAttempts }
      });

      return NextResponse.json(
        { error: 'Invalid email or password' }, 
        { status: 401 }
      );
    }

    // Reset failed attempts
    loginAttempts.delete(attemptKey);
    await prisma.student.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date()
      }
    });

    // Handle device management
    let device = null;
    if (deviceFingerprint) {
      device = await prisma.userDevice.findUnique({
        where: { 
          userId_fingerprint: {
            userId: user.id,
            fingerprint: deviceFingerprint
          }
        }
      });

      if (!device) {
        device = await prisma.userDevice.create({
          data: {
            userId: user.id,
            fingerprint: deviceFingerprint,
            deviceName: deviceInfo?.platform || 'Unknown Device',
            deviceType: getDeviceType(userAgent),
            browser: getBrowser(userAgent),
            os: deviceInfo?.platform || getOS(userAgent),
            trusted: false,
            lastUsed: new Date()
          }
        });
      } else {
        await prisma.userDevice.update({
          where: { id: device.id },
          data: { 
            lastUsed: new Date(),
            usageCount: { increment: 1 }
          }
        });
      }
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      deviceId: device?.id
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      deviceId: device?.id
    });

    // Create session
    const expiresAt = new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000));
    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        sessionToken: accessToken,
        refreshToken,
        deviceId: device?.id,
        ipAddress: clientIP,
        userAgent,
        location: `${location.city}, ${location.country}`,
        country: location.country,
        city: location.city,
        sessionType: 'web',
        expiresAt
      }
    });

    // Check for suspicious activity
    const recentSessions = await prisma.userSession.findMany({
      where: {
        userId: user.id,
        isActive: true,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      select: { ipAddress: true, location: true }
    });

    const currentLocation = `${location.city}, ${location.country}`;
    const suspiciousLogin = recentSessions.some((s) => 
      s.ipAddress !== null && 
      s.location !== null && 
      s.ipAddress !== clientIP && 
      s.location !== currentLocation
    );

    if (suspiciousLogin) {
      await prisma.securityEvent.create({
        data: {
          userId: user.id,
          eventType: 'suspicious_login',
          severity: 'medium',
          description: `Login from new location: ${currentLocation}`,
          ipAddress: clientIP,
          userAgent,
          location: currentLocation
        }
      });
    }

    // Log successful login
    await logAuthEvent({
      userId: user.id,
      email: user.email,
      action: 'login_success',
      ipAddress: clientIP,
      userAgent,
      location: currentLocation,
      success: true,
      details: {
        deviceId: device?.id,
        sessionId: session.id,
        rememberMe,
        suspiciousActivity: suspiciousLogin,
        socialAccounts: user.socialAccountsEver?.length || 0
      }
    });

    // ✅ Clear cache immediately after login using singleton Redis
    console.log('[Login API] Clearing cache for user:', user.id);

    await Promise.all([
      redis.del(`${CACHE_PREFIX.SESSIONS}:list:${user.id}`),
      redis.del(`${CACHE_PREFIX.DEVICES}:list:${user.id}`),
      redis.del(`${CACHE_PREFIX.USER_PROFILE}:${user.id}`),
      invalidateUserCache(user.id)
    ]);

    console.log('[Login API] Cache cleared successfully');

    // Prepare user data
    const userData = {
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
      preferences: user.preferences,
      socialAccounts: user.socialAccountsEver
    };

    return NextResponse.json({
      user: userData,
      accessToken,
      refreshToken,
      expiresIn: 3600,
      deviceTrusted: device?.trusted || false,
      suspiciousActivity: suspiciousLogin
    }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);

    try {
      const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
      const userAgent = request.headers.get('user-agent') || '';
      
      await logAuthEvent({
        action: 'login_error',
        ipAddress: clientIP,
        userAgent,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
    } catch (logError) {
      console.error('Failed to log login error:', logError);
    }

    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}

// Helper functions
function getDeviceType(userAgent: string): string {
  if (/Mobile|Android|iPhone/i.test(userAgent)) return 'mobile';
  if (/iPad|Tablet/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

function getBrowser(userAgent: string): string {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Other';
}

function getOS(userAgent: string): string {
  if (/Windows/i.test(userAgent)) return 'Windows';
  if (/Macintosh/i.test(userAgent)) return 'macOS';
  if (/Linux/i.test(userAgent)) return 'Linux';
  if (/Android/i.test(userAgent)) return 'Android';
  if (/iOS/i.test(userAgent)) return 'iOS';
  return 'Other';
}