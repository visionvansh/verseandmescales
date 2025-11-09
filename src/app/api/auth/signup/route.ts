// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UAParser } from 'ua-parser-js';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      username,
      socialToken,
      deviceFingerprint,
      redirectUrl,
      courseMetadata, // This comes from client
      metadata
    } = body;

    console.log('[Signup API] 📥 Received request:', {
      email,
      username,
      hasSocialToken: !!socialToken,
      redirectUrl,
      clientCourseMetadata: courseMetadata,
    });

    // ✅ NEW: Fetch REAL course data from database if courseId provided
    let realCourseMetadata = null;
    const courseId = courseMetadata?.courseId || metadata?.courseMetadata?.courseId;
    
    if (courseId) {
      console.log('[Signup API] 🔍 Fetching course from database:', courseId);
      
      try {
        const course = await prisma.course.findUnique({
          where: { id: courseId },
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            salePrice: true,
            homepage: {
              select: {
                footer: {
                  select: {
                    price: true,
                    salePrice: true,
                  }
                }
              }
            }
          }
        });

        if (course) {
          realCourseMetadata = {
            courseId: course.id,
            courseTitle: course.title,
            courseSlug: course.slug,
            coursePrice: course.homepage?.footer?.price || course.price || '',
            courseSalePrice: course.homepage?.footer?.salePrice || course.salePrice || null,
            fromCourse: true,
            timestamp: Date.now(),
            source: 'database',
          };
          
          console.log('[Signup API] ✅ Real course data fetched:', realCourseMetadata);
        } else {
          console.log('[Signup API] ⚠️ Course not found in database');
        }
      } catch (dbError) {
        console.error('[Signup API] ❌ Database error fetching course:', dbError);
      }
    }

    // Validate required fields
    if (!email || !firstName || !lastName || !username) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let socialData = null;
    
    // If social token provided, get social data
    if (socialToken) {
      socialData = await prisma.tempOAuthData.findUnique({
        where: { token: socialToken }
      });
      
      if (!socialData || new Date() > socialData.expiresIn) {
        return NextResponse.json({ error: 'Invalid or expired social login session' }, { status: 400 });
      }
    } else {
      // For regular signup, verify email was verified
      const emailVerification = await prisma.emailVerification.findFirst({
        where: {
          email: email.toLowerCase(),
          verified: true
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!emailVerification) {
        return NextResponse.json({ 
          error: 'Email verification required. Please verify your email first.' 
        }, { status: 400 });
      }

      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      if (emailVerification.createdAt < thirtyMinutesAgo) {
        return NextResponse.json({ 
          error: 'Email verification expired. Please verify again.' 
        }, { status: 400 });
      }
    }

    // Check if user already exists
    const existingUser = await prisma.student.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Check if username is taken
    const existingUsername = await prisma.student.findUnique({
      where: { username }
    });

    if (existingUsername) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12);
    }

    // Extract metadata for comprehensive tracking
    const requestMetadata = extractRequestMetadata(request, deviceFingerprint);

    // Prepare social account data
    let socialAccountData: any = undefined;
    
    if (socialData && socialData.providerData) {
      const providerData = socialData.providerData as any;
      const providerUsername = 
        providerData?.name || providerData?.displayName || email.split('@')[0];

      socialAccountData = {
        create: [{
          provider: socialData.provider,
          providerUserId: socialData.providerUserId,
          providerUsername: providerUsername,
          providerEmail: email.toLowerCase(),
          accessToken: socialData.accessToken,
          refreshToken: socialData.refreshToken,
          expiresAt: socialData.expiresAt,
          scope: socialData.scope,
          profileData: socialData.providerData
        }]
      };
    }

    // Create user
    const user = await prisma.student.create({
      data: {
        username,
        email: email.toLowerCase(),
        name: firstName,
        surname: lastName,
        password: hashedPassword,
        emailVerified: true,
        phoneVerified: false,
        lastLogin: new Date(),
        lastActiveAt: new Date(),
        isOnline: true,
        signedUpToWebsite: true,
        
        ...(socialAccountData && {
          socialAccountsEver: socialAccountData
        }),
        
        preferences: {
          create: {
            emailNotifications: true,
            pushNotifications: true,
            theme: 'dark',
            language: 'en',
            currency: 'USD',
            timezone: requestMetadata.timezone || 'UTC'
          }
        }
      },
      include: {
        socialAccountsEver: true,
        preferences: true
      }
    });

    // Clean up email verification record
    if (!socialData) {
      await prisma.emailVerification.deleteMany({
        where: { email: email.toLowerCase() }
      });
    }

    // Create initial session with auto-trust
    const session = await createUserSession(user.id, requestMetadata, true);

    // Clean up temporary social data
    if (socialData) {
      await prisma.tempOAuthData.delete({
        where: { token: socialToken }
      });
    }

    // ✅ Use REAL course metadata from database
    const finalCourseMetadata = realCourseMetadata || courseMetadata || metadata?.courseMetadata;

    // Log successful signup
    await prisma.authLog.create({
      data: {
        userId: user.id,
        action: socialData ? `${socialData.provider}_signup_complete` : 'email_signup_complete',
        success: true,
        ipAddress: requestMetadata.ipAddress,
        userAgent: requestMetadata.userAgent,
        location: requestMetadata.location,
        country: requestMetadata.country,
        city: requestMetadata.city,
        deviceType: requestMetadata.deviceType,
        browser: requestMetadata.browser,
        details: { 
          signupMethod: socialData ? 'social' : 'email',
          autoTrustedDevice: true,
          deviceFingerprint: requestMetadata.fingerprint,
          emailVerified: true,
          fromCourse: !!finalCourseMetadata,
          courseMetadata: finalCourseMetadata
        }
      }
    });

    // Generate JWT token for immediate login
    const jwtToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        sessionId: session.id 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '150d' }
    );

    // ✅ BUILD COMPREHENSIVE RESPONSE with REAL data
    const responseData = {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        surname: user.surname,
      },
      fromCourse: !!finalCourseMetadata,
      courseMetadata: finalCourseMetadata, // ✅ Real data from database
      redirectUrl: redirectUrl || '/users',
    };

    console.log('[Signup API] ✅ Response with REAL course data:', {
      fromCourse: responseData.fromCourse,
      courseTitle: responseData.courseMetadata?.courseTitle,
      courseId: responseData.courseMetadata?.courseId,
      source: responseData.courseMetadata?.source,
    });

    const response = NextResponse.json(responseData);

    // Set auth cookies
    response.cookies.set('auth-token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 150 * 24 * 60 * 60,
      path: '/'
    });

    response.cookies.set('session-id', session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 150 * 24 * 60 * 60,
      path: '/'
    });

    response.cookies.set('device-fingerprint', requestMetadata.fingerprint, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 150 * 24 * 60 * 60,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('[Signup API] ❌ Error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}

async function createUserSession(userId: string, metadata: any, isFirstDevice: boolean = false) {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const refreshToken = crypto.randomBytes(32).toString('hex');
  
  const expirationDays = isFirstDevice ? 150 : 20;
  const expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000);

  const device = await prisma.userDevice.upsert({
    where: { 
      userId_fingerprint: {
        userId: userId,
        fingerprint: metadata.fingerprint
      }
    },
    update: {
      deviceName: metadata.deviceName,
      deviceType: metadata.deviceType,
      browser: metadata.browser,
      browserVersion: metadata.browserVersion,
      os: metadata.os,
      osVersion: metadata.osVersion,
      lastUsed: new Date(),
      usageCount: { increment: 1 },
      ...(isFirstDevice && {
        trusted: true,
        isAccountCreationDevice: true
      })
    },
    create: {
      userId,
      deviceName: metadata.deviceName,
      deviceType: metadata.deviceType,
      browser: metadata.browser,
      browserVersion: metadata.browserVersion,
      os: metadata.os,
      osVersion: metadata.osVersion,
      fingerprint: metadata.fingerprint,
      trusted: isFirstDevice,
      isAccountCreationDevice: isFirstDevice,
      usageCount: 1
    }
  });

  const session = await prisma.userSession.create({
    data: {
      userId,
      sessionToken,
      refreshToken,
      deviceId: device.id,
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

function extractRequestMetadata(request: NextRequest, providedFingerprint?: string) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(',')[0].trim() : 
                   request.headers.get('x-real-ip') || 'unknown';
  
  const userAgent = request.headers.get('user-agent') || '';
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  
  const cfCountry = request.headers.get('cf-ipcountry');
  const cfCity = request.headers.get('cf-ipcity');
  const vercelCountry = request.headers.get('x-vercel-ip-country');
  const vercelCity = request.headers.get('x-vercel-ip-city');
  
  const country = cfCountry || vercelCountry || 'Unknown';
  const city = cfCity || vercelCity || 'Unknown';
  const location = city !== 'Unknown' && country !== 'Unknown' 
    ? `${city}, ${country}` 
    : 'Unknown';
  
  const fingerprint = providedFingerprint || crypto.createHash('md5')
    .update(`${userAgent}${result.browser.name || ''}${result.os.name || ''}`)
    .digest('hex');
  
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
    fingerprint,
    timezone: request.headers.get('x-timezone') || 'UTC'
  };
}