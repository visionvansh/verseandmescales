// app/api/user/2fa/send-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import { redis } from '@/lib/redis';
import { z } from 'zod';
import { sendEmail } from '@/utils/email';
import disposableDomains from 'disposable-email-domains';

// Validate the request body
const sendEmailSchema = z.object({
  email: z.string().email()
});

// Check for disposable/temp emails
const isDisposableEmail = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return true;
  
  if (disposableDomains.includes(domain)) return true;
  
  const suspiciousPatterns = [
    /temp/i, /trash/i, /disposable/i, /throwaway/i,
    /guerrilla/i, /fake/i, /spam/i, /burner/i,
    /10minute/i, /mailinator/i, /maildrop/i
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(domain));
};

// ✅ PRODUCTION: VerseAndMe Scales Dark Themed 2FA Email Template
const get2FAEmailTemplate = (code: string) => {
  return {
    text: `VERSEANDME SCALES - Two-Factor Authentication

Your 2FA verification code is: ${code}

This code expires in 10 minutes.

If you didn't request this, secure your account immediately.

Best regards,
The VerseAndMe Scales Team`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>VerseAndMe Scales - Two-Factor Authentication</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #000000;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); border-radius: 16px; border: 1px solid #dc2626; box-shadow: 0 10px 40px rgba(220, 38, 38, 0.2);">
                  
                  <!-- Header with Brand -->
                  <tr>
                    <td style="padding: 50px 40px 30px; text-align: center; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); border-radius: 16px 16px 0 0; border-bottom: 3px solid #ef4444;">
                      <h1 style="color: #ffffff; margin: 0 0 5px 0; font-size: 32px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">
                        VERSEANDME
                      </h1>
                      <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; opacity: 0.95;">
                        SCALES
                      </h2>
                      <div style="height: 3px; background: linear-gradient(90deg, transparent, #ffffff, transparent); margin: 20px auto 0; max-width: 200px; border-radius: 2px; opacity: 0.7;"></div>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 50px 40px;">
                      <h3 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 20px; text-align: center;">
                        Two-Factor Authentication
                      </h3>
                      
                      <p style="color: #d1d5db; font-size: 16px; line-height: 1.6; margin: 0 0 30px; text-align: center;">
                        Use the verification code below to complete your action:
                      </p>
                      
                      <!-- Verification Code Box -->
                      <div style="background: linear-gradient(135deg, #1f1f1f 0%, #0f0f0f 100%); border: 2px solid #dc2626; border-radius: 12px; padding: 40px 30px; text-align: center; margin: 30px 0; box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(220, 38, 38, 0.1);">
                        <p style="color: #9ca3af; font-size: 13px; margin: 0 0 15px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">
                          YOUR 2FA VERIFICATION CODE
                        </p>
                        <div style="background: #000000; border: 2px dashed #dc2626; border-radius: 8px; padding: 20px; margin: 0 auto; max-width: 280px;">
                          <p style="color: #ef4444; font-size: 42px; font-weight: 900; margin: 0; letter-spacing: 12px; font-family: 'Courier New', monospace; text-shadow: 0 0 20px rgba(239, 68, 68, 0.3);">
                            ${code}
                          </p>
                        </div>
                      </div>
                      
                      <!-- Expiry Warning -->
                      <div style="background: rgba(220, 38, 38, 0.1); border-left: 4px solid #dc2626; border-radius: 8px; padding: 20px; margin: 30px 0;">
                        <p style="color: #fca5a5; font-size: 14px; line-height: 1.6; margin: 0; display: flex; align-items: center;">
                          <span style="font-size: 20px; margin-right: 10px;">⏰</span>
                          <span>This code expires in <strong>10 minutes</strong>.</span>
                        </p>
                      </div>
                      
                      <!-- Security Alert -->
                      <div style="background: rgba(239, 68, 68, 0.15); border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin: 30px 0;">
                        <p style="color: #fca5a5; font-size: 14px; line-height: 1.6; margin: 0;">
                          <strong style="color: #ef4444; font-size: 16px;">🔐 Security Alert:</strong><br><br>
                          If you didn't request this code, change your password and contact support immediately.
                        </p>
                      </div>
                      
                      <!-- CTA Section -->
                      <div style="text-align: center; margin: 40px 0 0;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0;">
                          Need help? Contact support anytime.
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; text-align: center; background-color: #0a0a0a; border-radius: 0 0 16px 16px; border-top: 1px solid #1f2937;">
                      <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px; line-height: 1.5;">
                        © ${new Date().getFullYear()} <strong style="color: #9ca3af;">VerseAndMe Scales</strong>. All rights reserved.
                      </p>
                      <p style="color: #4b5563; font-size: 11px; margin: 0; line-height: 1.4;">
                        This is an automated message. Please do not reply.
                      </p>
                      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #1f2937;">
                        <p style="color: #4b5563; font-size: 11px; margin: 0;">
                          <a href="#" style="color: #dc2626; text-decoration: none; margin: 0 8px;">Terms</a> •
                          <a href="#" style="color: #dc2626; text-decoration: none; margin: 0 8px;">Privacy</a> •
                          <a href="#" style="color: #dc2626; text-decoration: none; margin: 0 8px;">Support</a>
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
                
                <!-- Outer Footer -->
                <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                  <tr>
                    <td style="text-align: center; padding: 0 20px;">
                      <p style="color: #4b5563; font-size: 11px; line-height: 1.6; margin: 0;">
                        You received this email because 2FA verification was requested for your account.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `
  };
};

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
      const result = sendEmailSchema.safeParse(body);
      
      if (!result.success) {
        return NextResponse.json(
          { error: 'Invalid email address', details: result.error.format() },
          { status: 400 }
        );
      }
      
      data = result.data;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    const { email } = data;
    const emailLower = email.toLowerCase();
    
    // Check for disposable/temp email
    if (isDisposableEmail(emailLower)) {
      return NextResponse.json({ 
        error: 'Temporary or disposable email addresses are not allowed. Please use a permanent email address.' 
      }, { status: 400 });
    }
    
    // Generate a random 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the code in Redis with a 10-minute expiry
    const cacheKey = `2fa:email:${user.id}:${emailLower}`;
    await redis.set(cacheKey, verificationCode, 'EX', 600); // 10 minutes
    
    // ✅ PRODUCTION: Send email with VerseAndMe Scales branding
    const emailTemplate = get2FAEmailTemplate(verificationCode);
    
    try {
      await sendEmail({
        to: emailLower,
        subject: 'VerseAndMe Scales - Two-Factor Authentication Code',
        text: emailTemplate.text,
        html: emailTemplate.html
      });

      console.log('[2FA Email Sent] ✅ Verification code sent to:', emailLower);

      // ✅ PRODUCTION: No development code in response
      return NextResponse.json({
        success: true,
        message: 'Verification code sent successfully',
        expiresIn: 600 // 10 minutes in seconds
      });

    } catch (emailError) {
      console.error('❌ 2FA Email sending failed:', emailError);
      
      // Delete the Redis key since email failed
      await redis.del(cacheKey);
      
      return NextResponse.json({ 
        error: 'Failed to send verification email. Please try again.' 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Error sending 2FA email verification:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}