// app/api/auth/checkout-verify/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { sendEmail } from '@/utils/email';
import { z } from 'zod';
import crypto from 'crypto';

const requestSchema = z.object({
  email: z.string().email('Invalid email address'),
  courseId: z.string().min(1, 'Course ID is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, courseId } = requestSchema.parse(body);
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Rate limiting
    const rateLimitKey = `checkout-verify:rate:${normalizedEmail}`;
    const attempts = await redis.get(rateLimitKey);
    
    if (attempts && parseInt(attempts) >= 5) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }
    
    await redis.incr(rateLimitKey);
    await redis.expire(rateLimitKey, 300); // 5 minutes
    
    // Check if user already exists
    const existingUser = await prisma.student.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, emailVerified: true },
    });
    
    if (existingUser) {
      // User exists, redirect them to login instead
      return NextResponse.json(
        { 
          error: 'An account with this email already exists. Please log in.',
          redirect: `/auth/login?redirect=/users/courses/${courseId}/checkout`
        },
        { status: 400 }
      );
    }
    
    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    
    // Store code in Redis with 10-minute expiration
    const codeKey = `checkout-verify:code:${normalizedEmail}`;
    await redis.set(codeKey, code, 'EX', 600); // 10 minutes
    
    // Store courseId for later
    const courseKey = `checkout-verify:course:${normalizedEmail}`;
    await redis.set(courseKey, courseId, 'EX', 600);
    
    // Send email
    await sendEmail({
      to: normalizedEmail,
      subject: 'Verify your email to complete your purchase',
      text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border-radius: 16px; border: 1px solid rgba(220, 38, 38, 0.3); overflow: hidden;">
                  <tr>
                    <td style="padding: 40px 30px; text-align: center;">
                      <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 10px 0;">
                        Verify Your Email
                      </h1>
                      <p style="color: #9ca3af; font-size: 14px; margin: 0 0 30px 0;">
                        Enter this code to complete your purchase
                      </p>
                      
                      <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); border-radius: 12px; padding: 20px; margin: 0 0 30px 0;">
                        <span style="color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: monospace;">
                          ${code}
                        </span>
                      </div>
                      
                      <p style="color: #6b7280; font-size: 12px; margin: 0;">
                        This code expires in 10 minutes
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
    
    console.log(`[Checkout Verify] Code sent to ${normalizedEmail}`);
    
    return NextResponse.json({
      success: true,
      message: 'Verification code sent',
    });
    
  } catch (error) {
    console.error('[Checkout Verify Send] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}