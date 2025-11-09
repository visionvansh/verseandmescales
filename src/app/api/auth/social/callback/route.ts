import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { getUserTwoFactorMethods } from '@/utils/twoFactorAuth';
import { redis } from '@/lib/redis';
import { UAParser } from 'ua-parser-js';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const socialToken = searchParams.get('social_token');
    const provider = searchParams.get('provider');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/auth/signin?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!socialToken || !provider) {
      return NextResponse.redirect(
        new URL('/auth/signin?error=Invalid+social+login+token', request.url)
      );
    }

    // Get temp OAuth data
    const tempData = await prisma.tempOAuthData.findUnique({
      where: { token: socialToken },
    });

    if (!tempData || tempData.expiresIn < new Date()) {
      await prisma.tempOAuthData.deleteMany({
        where: {
          OR: [
            { token: socialToken },
            { expiresIn: { lt: new Date() } }
          ]
        }
      });

      return NextResponse.redirect(
        new URL('/auth/signin?error=Social+login+session+expired', request.url)
      );
    }

    // Find user by social account
    const socialAccount = await prisma.userSocial.findUnique({
      where: {
        provider_providerUserId: {
          provider: tempData.provider,
          providerUserId: tempData.providerUserId
        }
      },
      include: {
        user: {
          include: {
            devices: {
              orderBy: { lastUsed: 'desc' },
              take: 10
            },
            biometricCredentials: {
              select: { id: true }
            }
          }
        }
      }
    });

    if (!socialAccount) {
      // User doesn't exist - redirect to signup
      return NextResponse.redirect(
        new URL(`/auth/signup?social_token=${socialToken}&provider=${provider}`, request.url)
      );
    }

    const user = socialAccount.user;

    // Extract client info
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';
    const parser = new UAParser(userAgent);
    const parsedUA = parser.getResult();

    // ✅ CRITICAL: Get device fingerprint from cookie FIRST
    const cookieStore = await (await import('next/headers')).cookies();
    let deviceFingerprint = cookieStore.get('device-fingerprint')?.value;
    
    // Only generate if not in cookie
    if (!deviceFingerprint) {
      deviceFingerprint = crypto.createHash('md5')
        .update(`${userAgent}${clientIP}${parsedUA.browser.name || ''}${parsedUA.os.name || ''}`)
        .digest('hex');
    }

    console.log('[Social Callback] Device fingerprint:', {
      fromCookie: !!cookieStore.get('device-fingerprint')?.value,
      fingerprint: deviceFingerprint
    });

    // Find or create device
    let device = await prisma.userDevice.findFirst({
      where: { 
        fingerprint: deviceFingerprint,
        userId: user.id
      }
    });

    const isFirstDevice = user.devices.length === 0;

    if (!device) {
      device = await prisma.userDevice.create({
        data: {
          userId: user.id,
          deviceName: `${parsedUA.browser.name || 'Unknown'} on ${parsedUA.os.name || 'Unknown'}`,
          deviceType: parsedUA.device.type || 'desktop',
          browser: parsedUA.browser.name || 'Unknown',
          browserVersion: parsedUA.browser.version || 'Unknown',
          os: parsedUA.os.name || 'Unknown',
          osVersion: parsedUA.os.version || 'Unknown',
          fingerprint: deviceFingerprint,
          trusted: isFirstDevice,
          isAccountCreationDevice: isFirstDevice,
          usageCount: 1
        }
      });

      if (isFirstDevice) {
        await redis.setex(
          `2fa:device:${user.id}:${deviceFingerprint}`,
          150 * 24 * 60 * 60,
          '1'
        );
      }
    } else {
      await prisma.userDevice.update({
        where: { id: device.id },
        data: {
          lastUsed: new Date(),
          usageCount: { increment: 1 }
        }
      });
    }

    // ✅ ONLY check if device is explicitly trusted
    const deviceTrusted = device.trusted;

    console.log('[Social Callback] Device trust check:', {
      deviceId: device.id,
      trusted: device.trusted,
      isAccountCreationDevice: device.isAccountCreationDevice,
      provider: tempData.provider,
      willBypass2FA: user.twoFactorEnabled && deviceTrusted
    });

    // ✅ ONLY bypass 2FA if device is explicitly trusted
    const shouldBypass2FA = user.twoFactorEnabled && deviceTrusted;

    console.log('[Social Callback] 2FA decision:', {
      twoFactorEnabled: user.twoFactorEnabled,
      deviceTrusted,
      shouldBypass2FA,
      willShow2FA: user.twoFactorEnabled && !shouldBypass2FA
    });

    // ✅ If 2FA enabled AND device NOT trusted
    if (user.twoFactorEnabled && !shouldBypass2FA) {
      console.log('[Social Callback] ⚠️ 2FA required - device not trusted');

      const twoFactorSessionId = crypto.randomUUID();
      
      // Get available 2FA methods
      const allMethods = await getUserTwoFactorMethods(user.id);
      
      const primaryMethod = user.twoFactorMethod || '2fa';
      
      // Separate primary and additional methods
      const primaryMethods = allMethods.filter(m => {
        if (m === 'backup') return true;
        if (primaryMethod === 'app' || primaryMethod === '2fa') {
          return m === '2fa';
        } else if (primaryMethod === 'sms') {
          return m === 'sms';
        } else if (primaryMethod === 'email') {
          return m === 'email';
        }
        return false;
      });
      
      const additionalMethods = allMethods.filter(m => 
        !primaryMethods.includes(m) && 
        (m === 'passkey' || m === 'recovery_email' || m === 'recovery_phone')
      );

      // ✅ Store social token in 2FA session metadata for later use
      await prisma.twoFactorSession.create({
        data: {
          id: twoFactorSessionId,
          userId: user.id,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          ipAddress: clientIP,
          userAgent,
          deviceId: device.id,
          metadata: {
            deviceFingerprint,
            rememberMe: false,
            deviceTrusted: device.trusted,
            primaryMethods,
            additionalMethods,
            primaryMethod,
            failedAttempts: 0,
            socialLogin: true,
            socialProvider: provider,
            socialToken: socialToken,
            tempDataId: tempData.id
          }
        }
      });

      // Cache in Redis
      await redis.setex(
        `2fa:session:${twoFactorSessionId}`,
        600,
        JSON.stringify({
          userId: user.id,
          deviceId: device.id,
          deviceFingerprint,
          trustThisDevice: false,
          primaryMethods,
          additionalMethods,
          primaryMethod,
          failedAttempts: 0,
          socialLogin: true,
          socialProvider: provider,
          socialToken: socialToken,
          tempDataId: tempData.id
        })
      );

      // Log auth attempt
      await prisma.authLog.create({
        data: {
          userId: user.id,
          email: user.email,
          action: 'social_login_2fa_required',
          ipAddress: clientIP,
          userAgent,
          deviceType: parsedUA.device.type || 'unknown',
          browser: parsedUA.browser.name || 'unknown',
          success: true,
          details: { 
            provider,
            deviceId: device.id,
            primaryMethods,
            additionalMethods
          }
        }
      });

      // ✅ DON'T delete temp data yet - wait until after 2FA verification
      console.log('[Social Callback] Redirecting to 2FA, preserving temp data');

      // ✅ Redirect to 2FA verification with proper parameters
      const methodsParam = encodeURIComponent(JSON.stringify(primaryMethods));
      const redirectUrl = new URL('/auth/2fa-verify', request.url);
      redirectUrl.searchParams.set('sessionId', twoFactorSessionId);
      redirectUrl.searchParams.set('methods', methodsParam);
      redirectUrl.searchParams.set('social', 'true');
      redirectUrl.searchParams.set('provider', provider);

      const response = NextResponse.redirect(redirectUrl);
      
      // Set device fingerprint cookie
      response.cookies.set('device-fingerprint', deviceFingerprint, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 150 * 24 * 60 * 60,
        path: '/'
      });

      return response;
    } else {
      console.log('[Social Callback] ✅ Bypassing 2FA - device is trusted');

      // ✅ NO 2FA - Complete login directly
      const sessionToken = crypto.randomUUID();
      const refreshToken = crypto.randomUUID();
      
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const session = await prisma.userSession.create({
        data: {
          userId: user.id,
          sessionToken,
          refreshToken,
          deviceId: device.id,
          ipAddress: clientIP,
          userAgent,
          sessionType: parsedUA.device.type || 'desktop',
          expiresAt
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
        { expiresIn: '24h' }
      );

      // Update user
      await prisma.student.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
          lastActiveAt: new Date(),
          isOnline: true
        }
      });

      // Log successful login
      await prisma.authLog.create({
        data: {
          userId: user.id,
          email: user.email,
          action: 'social_login_success',
          ipAddress: clientIP,
          userAgent,
          deviceType: parsedUA.device.type || 'unknown',
          browser: parsedUA.browser.name || 'unknown',
          success: true,
          details: { 
            provider,
            deviceId: device.id,
            sessionId: session.id
          }
        }
      });

      // ✅ NOW delete temp data since login is complete
      await prisma.tempOAuthData.delete({
        where: { id: tempData.id }
      });

      console.log('[Social Callback] Social login complete, temp data cleaned up');

      // Redirect to dashboard with auth cookie
      const redirectUrl = new URL('/users', request.url);
      const response = NextResponse.redirect(redirectUrl);
      
      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60,
        path: '/'
      });

      response.cookies.set('device-fingerprint', deviceFingerprint, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 150 * 24 * 60 * 60,
        path: '/'
      });

      return response;
    }

  } catch (error) {
    console.error('Social login callback error:', error);
    return NextResponse.redirect(
      new URL('/auth/signin?error=Social+login+failed', request.url)
    );
  }
}