// app/api/user/2fa/send-sms/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import { redis } from '@/lib/redis';
import { z } from 'zod';

// Validate the request body
const sendSmsSchema = z.object({
  phoneNumber: z.string().min(5) // Simple validation, you might want something more robust
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse and validate request
    let data;
    try {
      const body = await request.json();
      const result = sendSmsSchema.safeParse(body);
      
      if (!result.success) {
        return NextResponse.json(
          { error: 'Invalid phone number', details: result.error.format() },
          { status: 400 }
        );
      }
      
      data = result.data;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    const { phoneNumber } = data;
    
    // Generate a random 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the code in Redis with a 10-minute expiry
    const cacheKey = `2fa:sms:${user.id}:${phoneNumber}`;
    await redis.set(cacheKey, verificationCode, 'EX', 600); // 10 minutes
    
    // In a real application, you would send an SMS here
    // For development, we'll log the code to the console
    console.log(`SMS verification code for ${phoneNumber}: ${verificationCode}`);
    
    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully'
    });
  } catch (error) {
    console.error('Error sending SMS verification:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}