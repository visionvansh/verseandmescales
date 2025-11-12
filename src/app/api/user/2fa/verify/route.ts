// app/api/user/2fa/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma, { PrismaTx } from '@/lib/prisma';
import { authenticator } from 'otplib';
import { redis } from '@/lib/redis';
import { z } from 'zod';
import crypto from 'crypto';

// Define types for Prisma query results
interface CurrentUser {
  id: string;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
}

interface ExistingDevice {
  id: string;
}

// Verification schema
const verifySchema = z.object({
  token: z.string().length(6).regex(/^\d{6}$/),
  method: z.enum(['app', 'email']),
  email: z.string().email().optional(),
  trustDevice: z.boolean().optional()
});

// Configure authenticator
authenticator.options = {
  digits: 6,
  step: 30,
  window: 1
};

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Apply basic rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const identifier = `${ip}:${user.id}:2fa-verify`;
    const rateLimitKey = `rate-limit:${identifier}`;
    
    const currentAttempts = await redis.get(rateLimitKey);
    if (currentAttempts && parseInt(currentAttempts) >= 5) {
      console.warn(`Rate limit exceeded for 2FA verification: ${identifier}`);
      return NextResponse.json({
        error: 'Too many verification attempts. Please try again in a few minutes.'
      }, { status: 429 });
    }
    
    await redis.incr(rateLimitKey);
    await redis.expire(rateLimitKey, 300);
    
    // Parse and validate request
    let data: z.infer<typeof verifySchema>;
    try {
      const body = await request.json();
      const result = verifySchema.safeParse(body);
      
      if (!result.success) {
        console.warn(`Invalid 2FA verification request: ${JSON.stringify(result.error.format())}`);
        return NextResponse.json(
          { error: 'Validation error', details: result.error.format() },
          { status: 400 }
        );
      }
      
      data = result.data;
    } catch (error) {
      console.error(`Error parsing 2FA verification request: ${error}`);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    const { token, method, trustDevice, email } = data;
    
    try {
      const currentUser = await prisma.student.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          twoFactorEnabled: true,
          twoFactorSecret: true
        }
      }) as CurrentUser | null;
      
      if (!currentUser) {
        console.error(`User not found during 2FA verification: ${user.id}`);
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      if (method === 'app') {
        let secret: string;
        let setupMode = false;
        
        if (!currentUser.twoFactorEnabled) {
          setupMode = true;
          const cacheKey = `2fa:setup:${user.id}`;
          const cachedSecret = await redis.get(cacheKey);
          
          if (!cachedSecret) {
            console.warn(`2FA setup secret not found for user: ${user.id}`);
            return NextResponse.json(
              { error: 'Two-factor setup expired or not found' },
              { status: 400 }
            );
          }
          
          secret = cachedSecret;
        } else {
          const userSecret = currentUser.twoFactorSecret;
          
          if (!userSecret) {
            console.error(`2FA secret missing for enabled user: ${user.id}`);
            return NextResponse.json(
              { error: 'Two-factor authentication is not properly configured' },
              { status: 500 }
            );
          }
          
          secret = userSecret;
        }
        
        const isValid = authenticator.verify({ token, secret });
        
        if (!isValid) {
          console.warn(`Invalid 2FA verification attempt for user ${user.id}`);
          return NextResponse.json(
            { error: 'Invalid verification code' },
            { status: 400 }
          );
        }
        
        if (setupMode) {
          const backupCodes = await prisma.$transaction(async (tx: PrismaTx) => {
            await tx.student.update({
              where: { id: user.id },
              data: {
                twoFactorEnabled: true,
                twoFactorSecret: secret,
                twoFactorMethod: 'app'
              }
            });
            
            await tx.userPreferences.upsert({
              where: { userId: user.id },
              create: {
                userId: user.id,
                twoFactorPreference: 'app'
              },
              update: {
                twoFactorPreference: 'app'
              }
            });
            
            const codes: string[] = [];
            for (let i = 0; i < 10; i++) {
              const buffer = crypto.getRandomValues(new Uint8Array(4));
              const code = Array.from(buffer)
                .map((b: number) => b.toString(16).padStart(2, '0'))
                .join('')
                .toUpperCase()
                .match(/.{1,4}/g)!
                .join('-');
              codes.push(code);
              
              await tx.twoFactorBackupCode.create({
                data: {
                  userId: user.id,
                  code: code,
                  used: false
                }
              });
            }
            
            await tx.userActivityLog.create({
              data: {
                userId: user.id,
                action: '2fa_enabled',
                description: `Two-factor authentication enabled via app`,
                ipAddress: ip
              }
            });
            
            return codes;
          });
          
          await redis.del(`2fa:setup:${user.id}`);
          
          if (trustDevice) {
            await markDeviceAsTrusted(user.id, request);
          }
          
          const { cacheKeys } = await import('@/lib/redis');
          await redis.del(cacheKeys.twoFactorStatus(user.id));
          
          console.info(`2FA setup completed for user: ${user.id}`);
          
          return NextResponse.json({
            success: true,
            backupCodes,
            method: 'app'
          });
        } else {
          const sessionId = crypto.randomUUID();
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);
          
          await prisma.twoFactorSession.create({
            data: {
              id: sessionId,
              userId: user.id,
              expiresAt,
              ipAddress: ip,
              userAgent: request.headers.get('user-agent') || '',
              metadata: {}
            }
          });
          
          if (trustDevice) {
            await markDeviceAsTrusted(user.id, request);
          }
          
          const { cacheKeys } = await import('@/lib/redis');
          await redis.del(cacheKeys.twoFactorStatus(user.id));
          
          await prisma.userActivityLog.create({
            data: {
              userId: user.id,
              action: '2fa_verified',
              description: 'Two-factor authentication verified successfully via app',
              ipAddress: ip
            }
          });
          
          console.info(`2FA verification successful for user: ${user.id}`);
          
          return NextResponse.json({
            success: true,
            sessionId,
            method: 'app'
          });
        }
      } else if (method === 'email') {
        if (!email) {
          return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
        }
        
        const cacheKey = `2fa:email:${user.id}:${email}`;
        const storedCode = await redis.get(cacheKey);
        
        if (!storedCode) {
          console.warn(`Email verification code not found for user: ${user.id}`);
          return NextResponse.json({ 
            error: 'Verification code expired or not found. Please request a new code.'
          }, { status: 400 });
        }
        
        if (token !== storedCode) {
          console.warn(`Invalid email verification code for user: ${user.id}`);
          return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
        }
        
        const setupMode = !currentUser.twoFactorEnabled;
        
        if (setupMode) {
          const secret = authenticator.generateSecret();
          
          const backupCodes = await prisma.$transaction(async (tx: PrismaTx) => {
            await tx.student.update({
              where: { id: user.id },
              data: {
                twoFactorEnabled: true,
                twoFactorSecret: secret,
                twoFactorMethod: 'email',
                email: email,
                emailVerified: true
              }
            });
            
            await tx.userPreferences.upsert({
              where: { userId: user.id },
              create: {
                userId: user.id,
                twoFactorPreference: 'email'
              },
              update: {
                twoFactorPreference: 'email'
              }
            });
            
            const codes: string[] = [];
            for (let i = 0; i < 10; i++) {
              const buffer = crypto.getRandomValues(new Uint8Array(4));
              const code = Array.from(buffer)
                .map((b: number) => b.toString(16).padStart(2, '0'))
                .join('')
                .toUpperCase()
                .match(/.{1,4}/g)!
                .join('-');
              codes.push(code);
              
              await tx.twoFactorBackupCode.create({
                data: {
                  userId: user.id,
                  code: code,
                  used: false
                }
              });
            }
            
            await tx.userActivityLog.create({
              data: {
                userId: user.id,
                action: '2fa_enabled',
                description: `Two-factor authentication enabled via email`,
                ipAddress: ip
              }
            });
            
            return codes;
          });
          
          await redis.del(cacheKey);
          
          if (trustDevice) {
            await markDeviceAsTrusted(user.id, request);
          }
          
          const { cacheKeys } = await import('@/lib/redis');
          await redis.del(cacheKeys.twoFactorStatus(user.id));
          
          console.info(`2FA email setup completed for user: ${user.id}`);
          
          return NextResponse.json({
            success: true,
            backupCodes,
            method: 'email'
          });
        } else {
          const sessionId = crypto.randomUUID();
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);
          
          await prisma.twoFactorSession.create({
            data: {
              id: sessionId,
              userId: user.id,
              expiresAt,
              ipAddress: ip,
              userAgent: request.headers.get('user-agent') || '',
              metadata: {}
            }
          });
          
          if (trustDevice) {
            await markDeviceAsTrusted(user.id, request);
          }
          
          await redis.del(cacheKey);
          
          const { cacheKeys } = await import('@/lib/redis');
          await redis.del(cacheKeys.twoFactorStatus(user.id));
          
          await prisma.userActivityLog.create({
            data: {
              userId: user.id,
              action: '2fa_verified',
              description: 'Two-factor authentication verified successfully via email',
              ipAddress: ip
            }
          });
          
          console.info(`2FA email verification successful for user: ${user.id}`);
          
          return NextResponse.json({
            success: true,
            sessionId,
            method: 'email'
          });
        }
      }
      
      return NextResponse.json(
        { error: 'Invalid method specified' },
        { status: 400 }
      );
    } catch (error) {
      console.error(`Error during 2FA verification: ${error}`);
      return NextResponse.json(
        { error: 'Failed to verify two-factor authentication' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(`Unhandled error in 2FA verification: ${error}`);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function markDeviceAsTrusted(userId: string, request: NextRequest): Promise<void> {
  const deviceId = request.headers.get('device-id') || 
                   request.cookies.get('device-fingerprint')?.value || 
                   'unknown';
  
  try {
    const existingDevice = await prisma.userDevice.findFirst({
      where: {
        userId,
        fingerprint: deviceId
      }
    }) as ExistingDevice | null;
    
    if (existingDevice) {
      await prisma.userDevice.update({
        where: { id: existingDevice.id },
        data: {
          trusted: true,
          lastUsed: new Date(),
          usageCount: { increment: 1 }
        }
      });
    } else {
      const userAgent = request.headers.get('user-agent') || 'Unknown';
      
      let deviceType = 'desktop';
      if (/mobile|android|iphone|ipad|ipod/i.test(userAgent.toLowerCase())) {
        deviceType = 'mobile';
      } else if (/tablet|ipad/i.test(userAgent.toLowerCase())) {
        deviceType = 'tablet';
      }
      
      await prisma.userDevice.create({
        data: {
          userId,
          deviceName: `Trusted Device (${new Date().toLocaleDateString()})`,
          deviceType,
          browser: parseUserAgentForBrowser(userAgent),
          os: parseUserAgentForOS(userAgent),
          fingerprint: deviceId,
          trusted: true,
          firstUsed: new Date(),
          lastUsed: new Date(),
          usageCount: 1
        }
      });
    }
  } catch (error) {
    console.error(`Error marking device as trusted: ${error}`);
  }
}

function parseUserAgentForBrowser(userAgent: string): string {
  if (/chrome/i.test(userAgent)) return 'Chrome';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/safari/i.test(userAgent)) return 'Safari';
  if (/edge/i.test(userAgent)) return 'Edge';
  if (/opera/i.test(userAgent)) return 'Opera';
  return 'Unknown Browser';
}

function parseUserAgentForOS(userAgent: string): string {
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/mac/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  if (/android/i.test(userAgent)) return 'Android';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS';
  return 'Unknown OS';
}