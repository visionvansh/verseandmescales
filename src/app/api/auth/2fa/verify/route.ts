// src/app/api/auth/2fa/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { verify2FAByType } from '@/utils/twoFactorAuth';
import { verifyPasskeyAuthentication } from '@/utils/passkeys';
import { redis } from '@/lib/redis';
import { UAParser } from 'ua-parser-js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs'; // ✅ Import at top

const MAX_FAILED_ATTEMPTS = 3;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      code, 
      sessionId, 
      method = '2fa',
      passkeyResponse,
      trustThisDevice = false
    } = body;
    
    console.log('[2FA Verify] Request received:', {
      sessionId,
      method,
      trustThisDevice,
      hasCode: !!code,
      codeValue: code, // ✅ Add for debugging
      hasPasskeyResponse: !!passkeyResponse
    });
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get 2FA session
    let sessionData = await redis.get(`2fa:session:${sessionId}`);
    let cachedSession = sessionData ? JSON.parse(sessionData) : null;

    const session = await prisma.twoFactorSession.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            surname: true,
            img: true,
            phone: true,
            recoveryEmail: true,
            recoveryPhone: true,
            emailVerified: true,
            phoneVerified: true,
            twoFactorEnabled: true,
            lastLogin: true,
            createdAt: true,
          },
        },
      },
    });
    
    if (!session) {
      console.error('[2FA Verify] Session not found:', sessionId);
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 400 }
      );
    }
    
    console.log('[2FA Verify] Session found:', {
      sessionId: session.id,
      userId: session.userId,
      expiresAt: session.expiresAt
    });
    
    // Check if session is expired
    if (session.expiresAt < new Date()) {
      console.log('[2FA Verify] Session expired:', sessionId);
      await prisma.twoFactorSession.delete({ where: { id: sessionId } });
      await redis.del(`2fa:session:${sessionId}`);
      
      return NextResponse.json(
        { error: 'Session expired. Please try logging in again.' },
        { status: 400 }
      );
    }
    
    const metadata = session.metadata as any || {};
    let failedAttempts = metadata.failedAttempts || 0;
    const primaryMethods = metadata.primaryMethods || ['2fa', 'backup'];
    const additionalMethods = metadata.additionalMethods || [];
    const deviceFingerprint = metadata.deviceFingerprint;
    const rememberMe = metadata.rememberMe || false;
    const deviceId = metadata.deviceId || session.deviceId;
    const redirectUrl = metadata.redirectUrl || '/users';
    
    console.log('[2FA Verify] Session metadata:', {
      deviceFingerprint: deviceFingerprint?.substring(0, 8) + '...',
      deviceId,
      rememberMe,
      deviceTrusted: metadata.deviceTrusted,
      trustThisDevice,
      redirectUrl,
      failedAttempts,
      method
    });
    
    // ============================================================
    // ✅ FIXED: Verify based on method
    // ============================================================
    let isValid = false;
    let verificationError = '';

    try {
      if (method === 'passkey' && passkeyResponse) {
        console.log('[2FA Verify] Verifying passkey...');
        const verification = await verifyPasskeyAuthentication(
          session.userId,
          passkeyResponse
        );
        isValid = verification.verified;
        if (!isValid) verificationError = 'Passkey verification failed';
        
      } else if (method === 'recovery_email' && code) {
        console.log('[2FA Verify] Verifying recovery email code...');
        
        // ✅ FIX: Check DATABASE not Redis
        const verificationCode = await prisma.twoFactorVerificationCode.findFirst({
          where: {
            userId: session.userId,
            method: 'recovery_email',
            used: false,
            expiresAt: {
              gt: new Date()
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        console.log('[2FA Verify] Found verification code:', !!verificationCode);

        if (verificationCode) {
          // Compare the plain code with hashed code
          isValid = await bcrypt.compare(code.trim(), verificationCode.code);
          
          console.log('[2FA Verify] Code comparison:', { 
            inputCode: code, 
            isValid,
            storedCodeId: verificationCode.id 
          });

          if (isValid) {
            // Mark as used
            await prisma.twoFactorVerificationCode.update({
              where: { id: verificationCode.id },
              data: { used: true }
            });

            // Clean up old codes
            await prisma.twoFactorVerificationCode.deleteMany({
              where: {
                userId: session.userId,
                method: 'recovery_email',
                OR: [
                  { used: true },
                  { expiresAt: { lt: new Date() } }
                ]
              }
            });
            
            console.log('[2FA Verify] Recovery email code verified successfully');
          }
        }
        
        if (!isValid) verificationError = 'Invalid recovery email code';
        
      } else if (method === 'recovery_phone' && code) {
        console.log('[2FA Verify] Verifying recovery phone code...');
        
        // ✅ FIX: Check DATABASE not Redis
        const verificationCode = await prisma.twoFactorVerificationCode.findFirst({
          where: {
            userId: session.userId,
            method: 'recovery_phone',
            used: false,
            expiresAt: {
              gt: new Date()
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        console.log('[2FA Verify] Found verification code:', !!verificationCode);

        if (verificationCode) {
          // Compare the plain code with hashed code
          isValid = await bcrypt.compare(code.trim(), verificationCode.code);
          
          console.log('[2FA Verify] Code comparison:', { 
            inputCode: code, 
            isValid,
            storedCodeId: verificationCode.id 
          });

          if (isValid) {
            // Mark as used
            await prisma.twoFactorVerificationCode.update({
              where: { id: verificationCode.id },
              data: { used: true }
            });

            // Clean up old codes
            await prisma.twoFactorVerificationCode.deleteMany({
              where: {
                userId: session.userId,
                method: 'recovery_phone',
                OR: [
                  { used: true },
                  { expiresAt: { lt: new Date() } }
                ]
              }
            });
            
            console.log('[2FA Verify] Recovery phone code verified successfully');
          }
        }
        
        if (!isValid) verificationError = 'Invalid recovery phone code';
        
      } else if (code) {
        console.log('[2FA Verify] Verifying standard 2FA code...');
        isValid = await verify2FAByType(session.userId, code, method as any);
        if (!isValid) verificationError = `Invalid ${method} code`;
      } else {
        return NextResponse.json(
          { error: 'Verification code or passkey response required' },
          { status: 400 }
        );
      }
      
      console.log('[2FA Verify] Verification result:', { isValid, method });
      
    } catch (error: any) {
      console.error('[2FA Verify] Verification error:', error);
      verificationError = error.message || 'Verification failed';
      isValid = false;
    }
    
    // If verification failed
    if (!isValid) {
      failedAttempts++;
      console.log('[2FA Verify] Verification failed, attempts:', failedAttempts);
      
      metadata.failedAttempts = failedAttempts;
      
      await prisma.twoFactorSession.update({
        where: { id: sessionId },
        data: { metadata }
      });
      
      if (cachedSession) {
        cachedSession.failedAttempts = failedAttempts;
        await redis.setex(
          `2fa:session:${sessionId}`,
          600,
          JSON.stringify(cachedSession)
        );
      }
      
      const shouldShowAdditional = failedAttempts >= MAX_FAILED_ATTEMPTS && additionalMethods.length > 0;
      
      return NextResponse.json(
        { 
          error: verificationError || 'Invalid verification code',
          failedAttempts,
          showAdditionalMethods: shouldShowAdditional,
          additionalMethods: shouldShowAdditional ? additionalMethods : [],
          attemptsRemaining: Math.max(0, MAX_FAILED_ATTEMPTS - failedAttempts)
        },
        { status: 400 }
      );
    }
    
    console.log('[2FA Verify] ✅ Verification successful, creating session...');
    
    // ============================================================
    // ✅ CHECK IF THIS IS A RECOVERY SESSION
    // ============================================================
    const isRecoverySession = metadata.isRecovery === true;

    if (isRecoverySession) {
      console.log('[2FA Verify] Recovery session detected, generating recovery token...');
      
      // Generate recovery token
      const recoveryToken = crypto.randomUUID();
      const tokenHash = await bcrypt.hash(recoveryToken, 10);
      const tokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      // Store recovery token in database
      await prisma.passwordReset.create({
        data: {
          email: session.user.email,
          token: tokenHash,
          expiresAt: tokenExpiresAt,
          ipAddress: session.ipAddress || request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1',
          userAgent: session.userAgent || request.headers.get('user-agent') || ''
        }
      });

      // Log recovery 2FA success
      await prisma.authLog.create({
        data: {
          userId: session.userId,
          email: session.user.email,
          action: 'password_recovery_2fa_verified',
          ipAddress: session.ipAddress || request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1',
          userAgent: session.userAgent || request.headers.get('user-agent') || '',
          location: metadata.location || 'Unknown',
          country: metadata.country || 'Unknown',
          city: metadata.city || 'Unknown',
          deviceType: 'unknown',
          browser: 'unknown',
          success: true,
          details: { 
            method,
            recoveryToken: true
          },
        },
      });

      // Delete the 2FA session
      await prisma.twoFactorSession.delete({
        where: { id: sessionId },
      });
      await redis.del(`2fa:session:${sessionId}`);

      console.log('[2FA Verify] Recovery token generated successfully');

      // Return recovery token instead of auth token (early return)
      return NextResponse.json({
        message: 'Two-factor authentication successful',
        isRecovery: true,
        recoveryToken,
        email: session.user.email
      });
    }
    
    // ============================================================
    // CONTINUE WITH NORMAL LOGIN FLOW (only if NOT recovery)
    // ============================================================
    
    // Update user
    await prisma.student.update({
      where: { id: session.userId },
      data: {
        lastLogin: new Date(),
        lastActiveAt: new Date(),
        isOnline: true,
      },
    });
    
    // Set the verified method as primary
    if (method !== 'backup' && method !== 'recovery_email' && method !== 'recovery_phone') {
      await prisma.student.update({
        where: { id: session.userId },
        data: { twoFactorMethod: method }
      });
      
      await redis.del(`2fa:status:${session.userId}`);
    }
    
    // Trust device if requested
    if ((trustThisDevice || metadata.trustThisDevice) && deviceId && deviceFingerprint) {
      console.log('[2FA Verify] Trusting device:', deviceId);
      
      await prisma.userDevice.update({
        where: { id: deviceId },
        data: { trusted: true }
      });

      await redis.setex(
        `2fa:device:${session.userId}:${deviceFingerprint}`,
        150 * 24 * 60 * 60,
        '1'
      );
    }
    
    const expiresAt = new Date(
      Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)
    );
    
    const sessionToken = crypto.randomUUID();
    const refreshToken = crypto.randomUUID();
    
    const userAgent = request.headers.get('user-agent') || '';
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    
    const newSession = await prisma.userSession.create({
      data: {
        userId: session.userId,
        sessionToken,
        refreshToken,
        deviceId,
        ipAddress: session.ipAddress || request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1',
        userAgent,
        location: metadata.location || 'Unknown',
        country: metadata.country || 'Unknown',
        city: metadata.city || 'Unknown',
        sessionType: result.device.type || 'desktop',
        expiresAt,
        isActive: true
      },
    });
    
    console.log('[2FA Verify] Session created successfully:', {
      sessionId: newSession.id,
      userId: session.userId,
      deviceId,
      expiresAt: newSession.expiresAt,
      isActive: newSession.isActive
    });
    
    const token = jwt.sign(
      { 
        userId: session.userId, 
        sessionId: newSession.id,
        email: session.user.email,
      },
      process.env.JWT_SECRET!,
      { expiresIn: rememberMe ? '30d' : '1d' }
    );
    
    console.log('[2FA Verify] JWT generated for session:', newSession.id);
    
    // Delete the 2FA session
    await prisma.twoFactorSession.delete({
      where: { id: sessionId },
    });
    
    await redis.del(`2fa:session:${sessionId}`);
    
    console.log('[2FA Verify] 2FA session deleted:', sessionId);
    
    // Log successful verification
    await prisma.authLog.create({
      data: {
        userId: session.userId,
        email: session.user.email,
        action: '2fa_verification_success',
        ipAddress: session.ipAddress || request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1',
        userAgent,
        location: metadata.location || 'Unknown',
        country: metadata.country || 'Unknown',
        city: metadata.city || 'Unknown',
        deviceType: result.device.type || 'desktop',
        browser: result.browser.name || 'Unknown',
        success: true,
        details: { 
          method,
          deviceId,
          sessionId: newSession.id,
          deviceTrusted: metadata.deviceTrusted || trustThisDevice || false,
          failedAttempts: failedAttempts,
          redirectUrl
        },
      },
    });
    
    const response = NextResponse.json({
      message: 'Two-factor authentication successful',
      user: session.user,
      deviceTrusted: metadata.deviceTrusted || trustThisDevice || false,
      redirectUrl
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
      path: '/',
    });

    if (deviceFingerprint) {
      response.cookies.set('device-fingerprint', deviceFingerprint, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 150 * 24 * 60 * 60,
        path: '/',
      });
    }

    return response;
    
  } catch (error) {
    console.error('[2FA Verify] Fatal error:', error);
    return NextResponse.json(
      { error: 'An error occurred during 2FA verification' },
      { status: 500 }
    );
  }
}