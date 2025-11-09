//api/user/profile
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { redis, CACHE_TIMES, CACHE_PREFIX } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const cacheKey = `${CACHE_PREFIX.USER_PROFILE}${user.id}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      console.log(`[CACHE HIT] Profile data for user: ${user.id}`);
      return NextResponse.json({
        success: true,
        data: JSON.parse(cached),
        cached: true
      });
    }

    console.log(`[CACHE MISS] Fetching profile data from DB for user: ${user.id}`);

    const userData = await prisma.student.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        email: true,
        emailVerified: true,
        phone: true,
        phoneVerified: true,
        name: true,
        surname: true,
        img: true,
        timezone: true,
        twoFactorEnabled: true,
        lastLogin: true,
        lastActiveAt: true,
        isOnline: true,
        createdAt: true,
        updatedAt: true,
        // ✅ Profile Settings - INCLUDES BIO
        profileSettings: {
          select: {
            id: true,
            bio: true,
            country: true,
            location: true,
            website: true,
            isPublic: true,
            showEmail: true,
            showPhone: true,
            showLocation: true,
            showWebsite: true,
            showXP: true,
            showBadges: true,
            allowMessages: true,
            allowFollow: true,
            whoCanComment: true,
            whoCanSeePosts: true,
            coverImage: true,
            primaryColor: true,
            theme: true,
            createdAt: true,
            updatedAt: true
          }
        },
        // ✅ User Goals - INCLUDES PURPOSE (ROLE)
        UserGoals: {
          select: {
            id: true,
            purpose: true, // ✅ This contains 'learn', 'teach', or 'both'
            monthlyGoal: true,
            timeCommitment: true,
            completedAt: true,
            updatedAt: true
          },
          orderBy: {
            updatedAt: 'desc'
          },
          take: 1 // Get the most recent goal
        },
        preferences: {
          select: {
            id: true,
            theme: true,
            language: true,
            timezone: true,
            emailNotifications: true,
            pushNotifications: true,
            smsNotifications: true,
            marketingEmails: true,
            showOnlineStatus: true,
            allowDirectMessages: true,
            profileVisibility: true,
            emailFrequency: true,
            sessionTimeout: true,
            twoFactorPreference: true,
            currency: true,
            createdAt: true,
            updatedAt: true
          }
        },
        privacySettings: {
          select: {
            id: true,
            profileVisibility: true,
            showEmail: true,
            showPhone: true,
            showLastSeen: true,
            allowDirectMessages: true,
            allowFollowRequests: true,
            showActivityStatus: true,
            dataProcessingConsent: true,
            marketingConsent: true,
            thirdPartySharing: true,
            showMatureContent: true,
            contentFiltering: true,
            dataRetentionPeriod: true,
            createdAt: true,
            updatedAt: true
          }
        },
        socialAccountsEver: {
          select: {
            id: true,
            provider: true,
            providerUsername: true,
            providerEmail: true,
            createdAt: true
          },
          take: 1,
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // ✅ LOG DATA FOR DEBUGGING
    console.log(`✅ User data loaded:`, {
      id: userData.id,
      username: userData.username,
      bio: userData.profileSettings?.bio,
      country: userData.profileSettings?.country,
      location: userData.profileSettings?.location,
      website: userData.profileSettings?.website,
      userGoals: userData.UserGoals?.[0]?.purpose,
      isPublic: userData.profileSettings?.isPublic
    });

    // Fetch active sessions and devices
    const [sessions, devices] = await Promise.all([
      prisma.userSession.findMany({
        where: {
          userId: user.id,
          isActive: true,
          expiresAt: { gt: new Date() }
        },
        select: {
          id: true,
          sessionToken: true,
          ipAddress: true,
          userAgent: true,
          lastUsed: true,
          createdAt: true,
          expiresAt: true,
        },
        orderBy: {
          lastUsed: 'desc'
        },
        take: 15
      }),
      
      (async () => {
        try {
          return await prisma.userDevice.findMany({
            where: {
              userId: user.id,
            },
            select: {
              id: true,
              deviceType: true,
              deviceName: true,
              lastUsed: true,
              createdAt: true,
            },
            orderBy: {
              lastUsed: 'desc'
            },
            take: 10
          });
        } catch (error) {
          console.warn('UserDevice query failed:', error);
          return [];
        }
      })()
    ]);

    // Parse user agent for browser/OS info
    const parseUserAgent = (userAgent: string | null) => {
      if (!userAgent) {
        return {
          browser: 'Unknown Browser',
          os: 'Unknown OS',
          deviceType: 'desktop'
        };
      }

      let browser = 'Unknown Browser';
      let os = 'Unknown OS';
      let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';

      if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Safari')) browser = 'Safari';
      else if (userAgent.includes('Edge')) browser = 'Edge';
      else if (userAgent.includes('Opera')) browser = 'Opera';

      if (userAgent.includes('Windows')) os = 'Windows';
      else if (userAgent.includes('Mac OS X')) os = 'macOS';
      else if (userAgent.includes('Linux')) os = 'Linux';
      else if (userAgent.includes('Android')) os = 'Android';
      else if (userAgent.includes('iOS')) os = 'iOS';

      if (userAgent.includes('Mobile')) deviceType = 'mobile';
      else if (userAgent.includes('Tablet')) deviceType = 'tablet';

      return { browser, os, deviceType };
    };

    // Format sessions with parsed user agent
    const formattedSessions = sessions.map((session: any) => {
      const { browser, os, deviceType } = parseUserAgent(session.userAgent);
      
      return {
        id: session.id,
        device: {
          deviceName: `${browser} on ${os}`,
          deviceType,
          browser,
          os
        },
        location: 'Unknown',
        city: 'Unknown',
        region: null,
        country: 'Unknown',
        ipAddress: session.ipAddress,
        isTrusted: false,
        lastUsed: session.lastUsed.toISOString(),
        createdAt: session.createdAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
        userAgent: session.userAgent
      };
    });

    // Format devices
    const formattedDevices = devices.map((device: any) => ({
      id: device.id,
      deviceName: device.deviceName || 'Unknown Device',
      deviceType: device.deviceType || 'desktop',
      lastUsed: device.lastUsed?.toISOString() || device.createdAt.toISOString(),
      createdAt: device.createdAt.toISOString()
    }));

    // Calculate account age
    const accountAgeDays = Math.floor(
      (Date.now() - userData.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    const responseData = {
      ...userData,
      sessions: formattedSessions,
      devices: formattedDevices,
      stats: {
        totalActiveSessions: sessions.length,
        totalDevices: devices.length,
        accountAgeDays,
        lastLoginAt: userData.lastLogin?.toISOString() || null,
        lastActiveAt: userData.lastActiveAt?.toISOString() || null
      },
      security: {
        twoFactorEnabled: userData.twoFactorEnabled,
        emailVerified: userData.emailVerified,
        phoneVerified: userData.phoneVerified
      }
    };

    await redis.setex(
      cacheKey,
      CACHE_TIMES.USER_PROFILE,
      JSON.stringify(responseData)
    );

    console.log(`[CACHE SET] Profile data cached for user: ${user.id}`);

    return NextResponse.json({ 
      success: true, 
      data: responseData,
      cached: false
    });
  } catch (error: unknown) {
    console.error('[ERROR] Profile fetch error:', error);
    
    return NextResponse.json({ 
      error: 'Failed to fetch user profile',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}