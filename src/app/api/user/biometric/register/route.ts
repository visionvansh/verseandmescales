// /Volumes/vision/codes/course/my-app/src/app/api/user/biometric/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/utils/auth';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { redis } from '@/lib/redis';
import type { AuthenticatorTransportFuture } from '@simplewebauthn/types';

interface BiometricCredential {
  credentialId: string;
  transports: string | null;
}

interface ExcludeCredential {
  id: string;
  type: 'public-key';
  transports?: AuthenticatorTransportFuture[];
}

const rpName = process.env.WEBAUTHN_RP_NAME || 'Your App';
const rpID = process.env.WEBAUTHN_RP_ID || (process.env.NODE_ENV === 'production' ? undefined : 'localhost');
const origin = process.env.WEBAUTHN_ORIGIN || 
  (process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3000');

export async function POST(request: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  
  try {
    if (!rpID) {
      console.error('Missing WEBAUTHN_RP_ID environment variable in production');
      return NextResponse.json(
        { error: 'Server configuration error: Missing relying party ID' }, 
        { status: 500 }
      );
    }

    if (!origin) {
      console.error('Missing WEBAUTHN_ORIGIN environment variable in production');
      return NextResponse.json(
        { error: 'Server configuration error: Missing origin' }, 
        { status: 500 }
      );
    }

    const user = await getAuthUser(request);
    if (!user) {
      console.warn('Unauthorized biometric registration attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingCredentials = await prisma.biometricCredential.findMany({
      where: { userId: user.id },
      select: {
        credentialId: true,
        transports: true
      }
    }) as BiometricCredential[];

    const MAX_CREDENTIALS = 10;
    if (existingCredentials.length >= MAX_CREDENTIALS) {
      return NextResponse.json(
        { error: `You can only register up to ${MAX_CREDENTIALS} biometric devices` }, 
        { status: 403 }
      );
    }

    const userIdBuffer = new TextEncoder().encode(user.id);

    const excludeCredentials: ExcludeCredential[] = existingCredentials.map((cred: BiometricCredential) => {
      let transports: AuthenticatorTransportFuture[] | undefined;
      if (cred.transports) {
        try {
          transports = JSON.parse(cred.transports) as AuthenticatorTransportFuture[];
        } catch {
          transports = undefined;
        }
      }
      
      return {
        id: cred.credentialId,
        type: 'public-key' as const,
        transports,
      };
    });

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: userIdBuffer,
      userName: user.username || user.email,
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred',
        requireResidentKey: false,
      },
      timeout: 60000,
    });

    await prisma.$transaction([
      prisma.webauthnChallenge.deleteMany({
        where: {
          OR: [
            { userId: user.id },
            { expires: { lt: new Date() } }
          ]
        }
      }),
      
      prisma.webauthnChallenge.create({
        data: {
          userId: user.id,
          challenge: options.challenge,
          expires: new Date(Date.now() + 10 * 60 * 1000)
        }
      })
    ]);

    try {
      await redis.del(`biometric:status:${user.id}`);
      await redis.del(`biometric:list:${user.id}`);
      console.log(`Invalidated biometric caches for user: ${user.id} after register start`);
    } catch (redisError) {
      console.warn('Failed to invalidate caches after register:', redisError);
    }

    clearTimeout(timeoutId);
    
    const headers = new Headers();
    headers.append('Cache-Control', 'no-store, must-revalidate');
    headers.append('Pragma', 'no-cache');
    headers.append('Expires', '0');

    return NextResponse.json(options, { headers });

  } catch (error: unknown) {
    clearTimeout(timeoutId);
    
    const typedError = error as Error;
    console.error('Error in biometric registration:', typedError);
    
    if (typedError.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timed out. Please try again.' }, 
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to start registration: ' + (typedError.message || 'Unknown error'), 
        details: process.env.NODE_ENV === 'development' ? typedError.stack : undefined 
      }, 
      { status: 500 }
    );
  }
}