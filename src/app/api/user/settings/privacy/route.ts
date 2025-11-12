// app/api/user/privacy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { redis, CACHE_TIMES } from '@/lib/redis';
import { rateLimit } from '@/lib/rateLimit';
import { z } from 'zod';

const privacySettingsSchema = z.object({
  profileVisibility: z.enum(['public', 'private', 'friends']).optional(),
  showEmail: z.boolean().optional(),
  showPhone: z.boolean().optional(),
  showLastSeen: z.boolean().optional(),
  allowDirectMessages: z.boolean().optional(),
  allowFollowRequests: z.boolean().optional(),
  showActivityStatus: z.boolean().optional(),
  dataProcessingConsent: z.boolean().optional(),
  marketingConsent: z.boolean().optional(),
  thirdPartySharing: z.boolean().optional(),
  showMatureContent: z.boolean().optional(),
  contentFiltering: z.enum(['none', 'moderate', 'strict']).optional(),
  dataRetentionPeriod: z.number().min(1).max(3650).optional(),
});

// Type for privacy settings result
type PrivacySettingsResult = {
  id: string;
  userId: string;
  profileVisibility: string;
  showEmail: boolean;
  showPhone: boolean;
  showLastSeen: boolean;
  allowDirectMessages: boolean;
  allowFollowRequests: boolean;
  showActivityStatus: boolean;
  dataProcessingConsent: boolean;
  marketingConsent: boolean;
  thirdPartySharing: boolean;
  showMatureContent: boolean;
  contentFiltering: string;
  dataRetentionPeriod: number;
  createdAt: Date;
  updatedAt: Date;
};

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
    const { success, limit, remaining, reset } = await rateLimit(`${ip}:${user.id}`, 'privacy:get');
    
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

    const cacheKey = `user:privacy:${user.id}`;
    
    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: JSON.parse(cached)
      });
    }
    
    // Get from database
    let privacySettings = await prisma.privacySettings.findUnique({
      where: { userId: user.id }
    }) as PrivacySettingsResult | null;
    
    // Create default settings if not found
    if (!privacySettings) {
      privacySettings = await prisma.privacySettings.create({
        data: {
          userId: user.id,
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false,
          showLastSeen: true,
          allowDirectMessages: true,
          allowFollowRequests: true,
          showActivityStatus: true,
          dataProcessingConsent: true,
          marketingConsent: false,
          thirdPartySharing: false,
          showMatureContent: false,
          contentFiltering: 'moderate',
          dataRetentionPeriod: 365
        }
      }) as PrivacySettingsResult;
    }
    
    // Cache the settings
    await redis.setex(
      cacheKey,
      CACHE_TIMES.USER_PROFILE,
      JSON.stringify(privacySettings)
    );
    
    return NextResponse.json({
      success: true,
      data: privacySettings
    });
  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const { success, limit, remaining, reset } = await rateLimit(`${ip}:${user.id}`, 'privacy:update');
    
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
    
    // Parse and validate
    const body = await request.json() as Record<string, unknown>;
    const result = privacySettingsSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.format() },
        { status: 400 }
      );
    }
    
    // Update settings
    const updatedSettings = await prisma.privacySettings.upsert({
      where: { userId: user.id },
      update: {
        ...result.data,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        ...result.data
      }
    }) as PrivacySettingsResult;
    
    // Invalidate cache
    await redis.del(`user:privacy:${user.id}`);
    
    // Log activity
    await prisma.userActivityLog.create({
      data: {
        userId: user.id,
        action: 'privacy_settings_updated',
        description: 'Privacy settings were updated',
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: { updates: result.data }
      }
    });
    
    return NextResponse.json({ 
      success: true,
      data: updatedSettings 
    });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}