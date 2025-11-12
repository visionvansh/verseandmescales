// app/api/user/2fa/setup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { redis } from '@/lib/redis';
import { z } from 'zod';

// Configure authenticator
authenticator.options = {
  digits: 6,
  step: 30,
  window: 1
};

// Validate the request body
const setupSchema = z.object({
  method: z.enum(['app', 'email'])
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse and validate request
    let data: z.infer<typeof setupSchema>;
    try {
      const body = await request.json();
      const result = setupSchema.safeParse(body);
      
      if (!result.success) {
        return NextResponse.json(
          { error: 'Validation error', details: result.error.format() },
          { status: 400 }
        );
      }
      
      data = result.data;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    const { method } = data;
    
    // If user already has 2FA enabled, reject
    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: 'Two-factor authentication is already enabled' },
        { status: 400 }
      );
    }
    
    if (method === 'app') {
      // Generate secret
      const secret = authenticator.generateSecret();
      
      // Generate QR code
      const otpAuthUrl = authenticator.keyuri(
        user.email || user.username,
        'YourAppName',
        secret
      );
      
      const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);
      
      // Store secret temporarily in Redis
      const cacheKey = `2fa:setup:${user.id}`;
      await redis.set(cacheKey, secret, 'EX', 600); // 10 minutes expiry
      
      return NextResponse.json({
        success: true,
        qrCodeUrl,
        secret
      });
    } else if (method === 'email') {
      // For email, we'd send verification
      // This is a simplified example
      return NextResponse.json({
        success: true,
        message: 'Email verification required'
      });
    }
    
    // Shouldn't get here due to schema validation
    return NextResponse.json(
      { error: 'Invalid method specified' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}