//api/user/settings
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { redis, CACHE_TIMES, CACHE_PREFIX } from '@/lib/redis';
import { rateLimit } from '@/lib/rateLimit';
import { z } from 'zod';

// Validation schemas
const basicUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  surname: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  timezone: z.string().optional(),
  img: z.string().url().optional(),
  phoneVerified: z.boolean().optional()
});

const profileUpdateSchema = z.object({
  bio: z.string().max(500).optional(),
  country: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  website: z.string().url().optional().or(z.literal('')),
  isPublic: z.boolean().optional(),
  showEmail: z.boolean().optional(),
  showPhone: z.boolean().optional(),
  showLocation: z.boolean().optional(),
  showWebsite: z.boolean().optional(),
  showXP: z.boolean().optional(),
  showBadges: z.boolean().optional(),
  allowMessages: z.boolean().optional(),
  allowFollow: z.boolean().optional(),
  whoCanComment: z.enum(['everyone', 'followers', 'none']).optional(),
  whoCanSeePosts: z.enum(['everyone', 'followers', 'none']).optional(),
  coverImage: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional()
});

const emailUpdateSchema = z.object({
  email: z.string().email()
});

const phoneUpdateSchema = z.object({
  phone: z.string().min(10).max(15)
});

const preferencesUpdateSchema = z.object({
  profileVisibility: z.enum(['public', 'private', 'friends']).optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  showOnlineStatus: z.boolean().optional(),
  allowDirectMessages: z.boolean().optional(),
  emailFrequency: z.enum(['instant', 'daily', 'weekly']).optional(),
  sessionTimeout: z.number().min(5).max(10080).optional(),
  twoFactorPreference: z.string().optional(),
  currency: z.string().optional()
});

const privacyUpdateSchema = z.object({
  profileVisibility: z.enum(['public', 'private', 'friends']).optional(),
  showEmail: z.boolean().optional(),
  showPhone: z.boolean().optional(),
  showLastSeen: z.boolean().optional(),
  showActivityStatus: z.boolean().optional(),
  dataProcessingConsent: z.boolean().optional(),
  marketingConsent: z.boolean().optional(),
  contentFiltering: z.enum(['none', 'moderate', 'strict']).optional(),
  dataRetentionPeriod: z.number().min(1).max(3650).optional(),
  allowDirectMessages: z.boolean().optional(),
  allowFollowRequests: z.boolean().optional(),
  thirdPartySharing: z.boolean().optional(),
  showMatureContent: z.boolean().optional()
});

async function invalidateUserCaches(userId: string) {
  const cacheKeys = [
    `${CACHE_PREFIX.USER_PROFILE}${userId}`,
    `profile:${userId}`,
    `user:settings:${userId}`
  ];
  
  await Promise.all(cacheKeys.map(key => redis.del(key)));
  console.log('🗑️ Invalidated caches for user:', userId);
}

// GET user settings
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { success, limit, remaining, reset } = await rateLimit(`${ip}:${user.id}`, 'settings:get');
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests', reset },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString()
          }
        }
      );
    }

    // Check cache
    const cacheKey = `${CACHE_PREFIX.USER_PROFILE}${user.id}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return NextResponse.json({
        success: true,
        data: JSON.parse(cached)
      });
    }

    // Fetch from database
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
        preferences: true,
        privacySettings: true,
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
        UserGoals: {
          select: {
            id: true,
            purpose: true,
            monthlyGoal: true,
            timeCommitment: true,
            completedAt: true,
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

    // Cache the result
    await redis.setex(
      cacheKey,
      CACHE_TIMES.USER_PROFILE,
      JSON.stringify(userData)
    );

    return NextResponse.json({ 
      success: true, 
      data: userData 
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch user settings' 
    }, { status: 500 });
  }
}

// POST user settings (for compatibility)
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { section, data } = body;

    if (!section || !data) {
      return NextResponse.json({ 
        error: 'Missing section or data' 
      }, { status: 400 });
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { success, limit, remaining, reset } = await rateLimit(`${ip}:${user.id}`, 'settings:update');
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests', reset },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString()
          }
        }
      );
    }

    let result;

    if (section === 'basic') {
      const validated = basicUpdateSchema.parse(data);
      
      result = await prisma.student.update({
        where: { id: user.id },
        data: validated,
        select: {
          id: true,
          name: true,
          surname: true,
          phone: true,
          timezone: true,
          img: true,
          emailVerified: true,
          phoneVerified: true
        }
      });
    } 
    else if (section === 'profile') {
      const validated = profileUpdateSchema.parse(data);
      
      // Check if user role allows private profile
      if (validated.isPublic === false) {
        const userGoals = await prisma.userGoals.findFirst({
          where: { userId: user.id },
          select: { purpose: true }
        });
        
        const role = userGoals?.purpose || 'learner';
        
        // Tutors and Both cannot have private profiles
        if (role === 'tutor' || role === 'both') {
          return NextResponse.json({
            error: 'Tutors and users offering services must have public profiles',
            code: 'ROLE_REQUIRES_PUBLIC_PROFILE'
          }, { status: 400 });
        }
      }
      
      result = await prisma.profileSettings.upsert({
        where: { userId: user.id },
        update: validated,
        create: {
          userId: user.id,
          ...validated
        }
      });
    } else {
      return NextResponse.json({ 
        error: 'Invalid section' 
      }, { status: 400 });
    }

    // Invalidate all related caches
    await invalidateUserCaches(user.id);

    // Log activity
    await prisma.userActivityLog.create({
      data: {
        userId: user.id,
        action: `settings_updated_${section}`,
        description: `Updated ${section} settings`,
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: { section, updates: data }
      }
    });

    return NextResponse.json({
      success: true,
      message: `${section.charAt(0).toUpperCase() + section.slice(1)} settings updated successfully`,
      data: result
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.issues
      }, { status: 400 });
    }
    
    console.error('Settings update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update settings' 
    }, { status: 500 });
  }
}

// PATCH user settings
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { success, limit, remaining, reset } = await rateLimit(`${ip}:${user.id}`, 'settings:update');
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests', reset },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString()
          }
        }
      );
    }

    const { section, data } = await request.json();

    if (!section || !data) {
      return NextResponse.json({ 
        error: 'Missing section or data' 
      }, { status: 400 });
    }

    let result;

    switch (section) {
      case 'basic': {
        const validated = basicUpdateSchema.parse(data);
        
        result = await prisma.student.update({
          where: { id: user.id },
          data: validated,
          select: {
            id: true,
            name: true,
            surname: true,
            phone: true,
            timezone: true,
            img: true,
            emailVerified: true,
            phoneVerified: true
          }
        });
        break;
      }

      case 'profile': {
        const validated = profileUpdateSchema.parse(data);
        
        // Check if user role allows private profile
        if (validated.isPublic === false) {
          const userGoals = await prisma.userGoals.findFirst({
            where: { userId: user.id },
            select: { purpose: true }
          });
          
          const role = userGoals?.purpose || 'learner';
          
          // Tutors and Both cannot have private profiles
          if (role === 'tutor' || role === 'both') {
            return NextResponse.json({
              error: 'Tutors and users offering services must have public profiles',
              code: 'ROLE_REQUIRES_PUBLIC_PROFILE'
            }, { status: 400 });
          }
        }
        
        result = await prisma.profileSettings.upsert({
          where: { userId: user.id },
          update: validated,
          create: {
            userId: user.id,
            ...validated
          }
        });
        break;
      }
        
      case 'email': {
        const validated = emailUpdateSchema.parse(data);
        
        // Check if email is already in use
        const existingUser = await prisma.student.findFirst({
          where: {
            email: validated.email,
            id: { not: user.id }
          }
        });
        
        if (existingUser) {
          return NextResponse.json({ 
            error: 'Email is already in use' 
          }, { status: 400 });
        }
        
        result = await prisma.student.update({
          where: { id: user.id },
          data: {
            email: validated.email,
            emailVerified: false
          },
          select: {
            id: true,
            email: true,
            emailVerified: true
          }
        });
        break;
      }

      case 'phone': {
        const validated = phoneUpdateSchema.parse(data);
        
        // Check if phone is already in use
        const existingUserWithPhone = await prisma.student.findFirst({
          where: {
            phone: validated.phone,
            id: { not: user.id }
          }
        });
        
        if (existingUserWithPhone) {
          return NextResponse.json({ 
            error: 'Phone number is already in use' 
          }, { status: 400 });
        }
        
        result = await prisma.student.update({
          where: { id: user.id },
          data: {
            phone: validated.phone,
            phoneVerified: false
          },
          select: {
            id: true,
            phone: true,
            phoneVerified: true
          }
        });
        break;
      }

      case 'preferences': {
        const validated = preferencesUpdateSchema.parse(data);
        
        result = await prisma.userPreferences.upsert({
          where: { userId: user.id },
          update: validated,
          create: {
            userId: user.id,
            ...validated
          }
        });
        break;
      }

      case 'privacy': {
        const validated = privacyUpdateSchema.parse(data);
        
        result = await prisma.privacySettings.upsert({
          where: { userId: user.id },
          update: validated,
          create: {
            userId: user.id,
            ...validated
          }
        });
        break;
      }

      default:
        return NextResponse.json({ 
          error: 'Invalid section' 
        }, { status: 400 });
    }

    // Invalidate all related caches
    await invalidateUserCaches(user.id);

    // Log activity
    await prisma.userActivityLog.create({
      data: {
        userId: user.id,
        action: `settings_updated_${section}`,
        description: `Updated ${section} settings`,
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: { section, updates: data }
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Settings updated successfully',
      data: result
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.issues
      }, { status: 400 });
    }
    
    console.error('Settings update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update settings' 
    }, { status: 500 });
  }
}