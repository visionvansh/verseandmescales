// src/app/api/auth/social/microsoft/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { UAParser } from 'ua-parser-js';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { getUserTwoFactorMethods } from '@/utils/twoFactorAuth';
import { analyzeBehaviorForRisk } from '@/utils/behaviousAnalysis';
import { redis } from '@/lib/redis';

const prisma = new PrismaClient();

const MICROSOFT_CONFIG = {
  clientId: process.env.MICROSOFT_CLIENT_ID!,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/social/microsoft`,
  scope: 'openid profile email User.Read',
  authorizeUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  userInfoUrl: 'https://graph.microsoft.com/v1.0/me'
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const oauthError = searchParams.get('error');
  
  // ✅ PARSE STATE TO GET REDIRECT URL AND AUTH FLOW
  let redirectUrl = '/users';
  let authFlow = 'signup';
  
  if (state) {
    try {
      if (state.includes('|redirect:')) {
        const parts = state.split('|redirect:');
        authFlow = parts[0];
        redirectUrl = decodeURIComponent(parts[1]);
        console.log('[Microsoft OAuth] Parsed state:', { authFlow, redirectUrl });
      } else {
        authFlow = state;
      }
    } catch (error) {
      console.error('[Microsoft OAuth] Error parsing state:', error);
    }
  }
  
  if (oauthError) {
    console.error('[Microsoft OAuth] OAuth error from Microsoft:', oauthError);
    const redirectPath = authFlow === 'signin' ? '/auth/signin' : '/auth/signup';
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}${redirectPath}?error=${encodeURIComponent(oauthError)}&redirect=${encodeURIComponent(redirectUrl)}`
    );
  }

  try {
    if (!code) {
      // ✅ ENCODE STATE WITH REDIRECT URL
      const stateParam = redirectUrl !== '/users' 
        ? `${authFlow}|redirect:${encodeURIComponent(redirectUrl)}`
        : authFlow;
      
      const params = new URLSearchParams({
        client_id: MICROSOFT_CONFIG.clientId,
        response_type: 'code',
        redirect_uri: MICROSOFT_CONFIG.redirectUri,
        scope: MICROSOFT_CONFIG.scope,
        state: stateParam,
        response_mode: 'query'
      });
      
      const authUrl = `${MICROSOFT_CONFIG.authorizeUrl}?${params.toString()}`;
      console.log('[Microsoft OAuth] Redirecting to Microsoft with state:', stateParam);
      return NextResponse.redirect(authUrl);
    }

    // Exchange code for tokens
    const tokenResponse = await axios.post(MICROSOFT_CONFIG.tokenUrl, new URLSearchParams({
      client_id: MICROSOFT_CONFIG.clientId,
      client_secret: MICROSOFT_CONFIG.clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: MICROSOFT_CONFIG.redirectUri
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const tokens = tokenResponse.data;
    
    if (!tokens.access_token) {
      throw new Error('No access token received from Microsoft');
    }

    // Get user info from Microsoft Graph
    const userResponse = await axios.get(MICROSOFT_CONFIG.userInfoUrl, {
      headers: { 
        'Authorization': `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    const microsoftUser = userResponse.data;
    const email = (microsoftUser.mail || microsoftUser.userPrincipalName).toLowerCase();
    
    if (!email) {
      throw new Error('Email not provided by Microsoft');
    }

    console.log('[Microsoft OAuth] Microsoft user data received:', {
      email,
      displayName: microsoftUser.displayName
    });

    const metadata = await extractRequestMetadata(request);

    // Get or create device fingerprint from cookie
    const cookieStore = await (await import('next/headers')).cookies();
    let deviceFingerprint = cookieStore.get('device-fingerprint')?.value;
    
    if (!deviceFingerprint) {
      deviceFingerprint = metadata.fingerprint;
    }

    const existingUser = await prisma.student.findUnique({
      where: { email },
      include: {
        socialAccountsEver: true,
        preferences: true,
        devices: {
          where: { fingerprint: deviceFingerprint },
          take: 1
        },
        biometricCredentials: {
          select: { id: true }
        }
      }
    });

    // After checking if user exists, BEFORE creating temp OAuth data:
    if (existingUser) {
      console.log('[Microsoft OAuth] Existing user found:', existingUser.id);
      
      // ✅ FIX: If auth flow is "signup" but user exists, redirect to signin
      if (authFlow === 'signup') {
        console.log('[Microsoft OAuth] User exists but using signup flow - redirecting to signin');
        return NextResponse.redirect(
          `${process.env.NEXTAUTH_URL}/auth/signin?provider=microsoft&redirect=${encodeURIComponent(redirectUrl)}&message=${encodeURIComponent('Account already exists. Please sign in instead.')}`
        );
      }
      
      // Update social account
      await prisma.userSocial.upsert({
        where: {
          provider_providerUserId: {
            provider: 'microsoft',
            providerUserId: String(microsoftUser.id)
          }
        },
        update: {
          providerEmail: email,
          accessToken: await encryptToken(tokens.access_token),
          refreshToken: tokens.refresh_token ? await encryptToken(tokens.refresh_token) : null,
          expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
          profileData: microsoftUser,
          updatedAt: new Date()
        },
        create: {
          userId: existingUser.id,
          provider: 'microsoft',
          providerUserId: String(microsoftUser.id),
          providerUsername: microsoftUser.displayName,
          providerEmail: email,
          accessToken: await encryptToken(tokens.access_token),
          refreshToken: tokens.refresh_token ? await encryptToken(tokens.refresh_token) : null,
          expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
          scope: MICROSOFT_CONFIG.scope,
          profileData: microsoftUser
        }
      });

      // Update user
      await prisma.student.update({
        where: { id: existingUser.id },
        data: {
          lastLogin: new Date(),
          lastActiveAt: new Date(),
          isOnline: true,
          emailVerified: true,
          name: existingUser.name || microsoftUser.givenName,
          surname: existingUser.surname || microsoftUser.surname,
        }
      });

      // Find or create device
      const isFirstDevice = existingUser.devices.length === 0;
      const device = await findOrCreateDevice(
        existingUser.id,
        deviceFingerprint,
        metadata,
        metadata,
        isFirstDevice
      );

      const deviceTrusted = device.trusted;

      console.log('[Microsoft OAuth] Device trust check:', {
        deviceId: device.id,
        trusted: device.trusted,
        isAccountCreationDevice: device.isAccountCreationDevice,
        userId: existingUser.id,
        willBypass2FA: existingUser.twoFactorEnabled && deviceTrusted
      });

      const shouldBypass2FA = existingUser.twoFactorEnabled && deviceTrusted;

      console.log('[Microsoft OAuth] 2FA decision:', {
        twoFactorEnabled: existingUser.twoFactorEnabled,
        deviceTrusted,
        shouldBypass2FA,
        willShow2FA: existingUser.twoFactorEnabled && !shouldBypass2FA
      });

      if (existingUser.twoFactorEnabled && !shouldBypass2FA) {
        console.log('[Microsoft OAuth] ⚠️ 2FA required - device not trusted');
        
        const behaviorAnalysis = await analyzeBehaviorForRisk(existingUser.id, {
          ipAddress: metadata.ipAddress,
          location: metadata.location,
          country: metadata.country,
          deviceFingerprint: deviceFingerprint,
          loginTime: new Date()
        });
        
        const twoFactorSessionId = crypto.randomUUID();
        const allMethods = await getUserTwoFactorMethods(existingUser.id);
        
        const primaryMethod = existingUser.twoFactorMethod || '2fa';
        const primaryMethods = allMethods.filter(m => {
          if (m === 'backup') return true;
          if (primaryMethod === 'app' || primaryMethod === '2fa') return m === '2fa';
          if (primaryMethod === 'sms') return m === 'sms';
          if (primaryMethod === 'email') return m === 'email';
          return false;
        });
        
        const additionalMethods = allMethods.filter(m => 
          !primaryMethods.includes(m) && 
          (m === 'passkey' || m === 'recovery_email' || m === 'recovery_phone')
        );

        // ✅ STORE REDIRECT URL IN 2FA SESSION
        await prisma.twoFactorSession.create({
          data: {
            id: twoFactorSessionId,
            userId: existingUser.id,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
            deviceId: device.id,
            metadata: {
              deviceFingerprint,
              rememberMe: true,
              location: metadata.location,
              country: metadata.country,
              city: metadata.city,
              deviceTrusted: false,
              riskScore: behaviorAnalysis.riskScore,
              riskFactors: behaviorAnalysis.riskFactors,
              trustThisDevice: true,
              primaryMethods,
              additionalMethods,
              primaryMethod,
              failedAttempts: 0,
              provider: 'microsoft',
              redirectUrl // ✅ Store redirect URL
            }
          }
        });

        await redis.setex(
          `2fa:session:${twoFactorSessionId}`,
          600,
          JSON.stringify({
            userId: existingUser.id,
            deviceId: device.id,
            deviceFingerprint,
            trustThisDevice: true,
            primaryMethods,
            additionalMethods,
            primaryMethod,
            failedAttempts: 0,
            provider: 'microsoft',
            redirectUrl // ✅ Store redirect URL
          })
        );

        await logAuthEvent(request, existingUser.id, 'microsoft_oauth_2fa_required', true, { redirectUrl });

        console.log('[Microsoft OAuth] Redirecting to 2FA verification with redirect:', redirectUrl);

        const methodsParam = encodeURIComponent(JSON.stringify(primaryMethods));
        const twoFAUrl = new URL(`${process.env.NEXTAUTH_URL}/auth/2fa-verify`);
        twoFAUrl.searchParams.set('sessionId', twoFactorSessionId);
        twoFAUrl.searchParams.set('methods', methodsParam);
        twoFAUrl.searchParams.set('redirect', redirectUrl); // ✅ Pass redirect URL
        
        const response = NextResponse.redirect(twoFAUrl.toString());
        
        response.cookies.set('device-fingerprint', deviceFingerprint, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 150 * 24 * 60 * 60,
          path: '/'
        });
        
        return response;
      }

      console.log('[Microsoft OAuth] ✅ Bypassing 2FA - device is trusted');

      const session = await createUserSession(existingUser.id, metadata, device.id);

      await logAuthEvent(
        request, 
        existingUser.id, 
        'microsoft_oauth_signin_trusted',
        true,
        { redirectUrl }
      );

      const jwtToken = jwt.sign(
        { userId: existingUser.id, email: existingUser.email, sessionId: session.id },
        process.env.JWT_SECRET!,
        { expiresIn: deviceTrusted ? '150d' : '7d' }
      );

      console.log('[Microsoft OAuth] ✅ Login successful, redirecting to:', redirectUrl);

      // ✅ REDIRECT TO STORED URL
      const response = NextResponse.redirect(`${process.env.NEXTAUTH_URL}${redirectUrl}`);

      response.cookies.set('auth-token', jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: deviceTrusted ? 150 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
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

    // For new users:
    if (!existingUser) {
      console.log('[Microsoft OAuth] New user, creating temp OAuth data');
      
      // ✅ FIX: If auth flow is "signin" but no user exists, show proper error
      if (authFlow === 'signin') {
        console.log('[Microsoft OAuth] No user found for signin flow - redirecting to signup');
        return NextResponse.redirect(
          `${process.env.NEXTAUTH_URL}/auth/signup?email=${encodeURIComponent(email)}&provider=microsoft&redirect=${encodeURIComponent(redirectUrl)}&error=${encodeURIComponent('No account found. Please sign up first.')}`
        );
      }
      
      // New user signing up - store temp data
      const tempToken = crypto.randomBytes(32).toString('hex');
      
      await prisma.tempOAuthData.deleteMany({
        where: { expiresIn: { lt: new Date() } }
      });
      
      // ✅ STORE REDIRECT URL IN TEMP OAUTH DATA
      await prisma.tempOAuthData.create({
        data: {
          token: tempToken,
          provider: 'microsoft',
          providerUserId: String(microsoftUser.id),
          providerData: {
            id: microsoftUser.id,
            mail: microsoftUser.mail,
            userPrincipalName: microsoftUser.userPrincipalName,
            displayName: microsoftUser.displayName,
            givenName: microsoftUser.givenName,
            surname: microsoftUser.surname
          },
          accessToken: await encryptToken(tokens.access_token),
          refreshToken: tokens.refresh_token ? await encryptToken(tokens.refresh_token) : null,
          expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
          scope: MICROSOFT_CONFIG.scope,
          metadata: { redirectUrl }, // ✅ Store redirect URL
          expiresIn: new Date(Date.now() + 30 * 60 * 1000)
        }
      });

      const signupUrl = new URL(`${process.env.NEXTAUTH_URL}/auth/signup`);
      signupUrl.searchParams.set('social_token', tempToken);
      signupUrl.searchParams.set('provider', 'microsoft');
      signupUrl.searchParams.set('redirect', redirectUrl); // ✅ Pass redirect URL
      
      console.log('[Microsoft OAuth] Redirecting to signup with redirect:', redirectUrl);
      
      return NextResponse.redirect(signupUrl.toString());
    }

  } catch (error: any) {
    console.error('[Microsoft OAuth] Error:', error);
    await logAuthEvent(request, null, 'microsoft_oauth_failed', false, String(error));
    const redirectPath = authFlow === 'signin' ? '/auth/signin' : '/auth/signup';
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}${redirectPath}?error=${encodeURIComponent(error.message || 'OAuth failed')}&redirect=${encodeURIComponent(redirectUrl)}`
    );
  }
}

// Helper functions
async function createUserSession(userId: string, metadata: any, deviceId: string) {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const refreshToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const session = await prisma.userSession.create({
    data: {
      userId,
      sessionToken,
      refreshToken,
      deviceId,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      location: metadata.location,
      country: metadata.country,
      city: metadata.city,
      sessionType: 'web',
      expiresAt
    }
  });

  return session;
}

async function logAuthEvent(
  request: NextRequest, 
  userId: string | null, 
  action: string, 
  success: boolean, 
  details?: any
) {
  const metadata = await extractRequestMetadata(request);
  
  try {
    await prisma.authLog.create({
      data: {
        userId,
        action,
        success,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        location: metadata.location,
        country: metadata.country,
        city: metadata.city,
        deviceType: metadata.deviceType,
        browser: metadata.browser,
        errorMessage: success ? undefined : details,
        details: success ? { provider: 'microsoft', ...details } : { error: details }
      }
    });
  } catch (error) {
    console.error('Failed to log auth event:', error);
  }
}

async function extractRequestMetadata(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
  
  const userAgent = request.headers.get('user-agent') || '';
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  
  const cfCountry = request.headers.get('cf-ipcountry');
  const cfCity = request.headers.get('cf-ipcity');
  const vercelCountry = request.headers.get('x-vercel-ip-country');
  const vercelCity = request.headers.get('x-vercel-ip-city');
  
  const country = cfCountry || vercelCountry || 'Unknown';
  const city = cfCity || vercelCity || 'Unknown';
  const location = city !== 'Unknown' && country !== 'Unknown' ? `${city}, ${country}` : 'Unknown';
  
  return {
    ipAddress,
    userAgent,
    location,
    country,
    city,
    deviceType: result.device.type || 'desktop',
    browser: result.browser.name || 'Unknown',
    browserVersion: result.browser.version || 'Unknown',
    os: result.os.name || 'Unknown',
    osVersion: result.os.version || 'Unknown',
    deviceName: `${result.browser.name || 'Unknown'} on ${result.os.name || 'Unknown'}`,
    fingerprint: crypto.createHash('md5')
      .update(`${userAgent}${ipAddress}${result.browser.name || ''}${result.os.name || ''}`)
      .digest('hex'),
    timezone: request.headers.get('x-timezone') || 'UTC'
  };
}

async function findOrCreateDevice(
  userId: string, 
  fingerprint: string, 
  deviceData: any, 
  clientInfo: any,
  trustByDefault: boolean = false
) {
  let device = await prisma.userDevice.findFirst({
    where: { 
      fingerprint,
      userId
    }
  });
  
  if (device) {
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
  } else {
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
        trusted: trustByDefault,
        isAccountCreationDevice: trustByDefault,
        usageCount: 1
      }
    });
    
    if (trustByDefault) {
      await redis.setex(
        `2fa:device:${userId}:${fingerprint}`,
        150 * 24 * 60 * 60,
        '1'
      );
    }
  }
  
  return device;
}

async function encryptToken(token: string): Promise<string> {
  return Buffer.from(token).toString('base64');
}