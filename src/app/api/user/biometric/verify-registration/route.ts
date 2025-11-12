// /Volumes/vision/codes/course/my-app/src/app/api/user/biometric/verify-registration/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma, { PrismaTx } from '@/lib/prisma';
import { getAuthUser } from '@/utils/auth';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { redis } from '@/lib/redis';
import type { 
  RegistrationResponseJSON,
  AuthenticatorTransportFuture 
} from '@simplewebauthn/types';

interface RequestBody {
  response?: RegistrationResponseJSON;
  attestation?: RegistrationResponseJSON;
  deviceName: string;
}

interface WebauthnChallenge {
  id: string;
  userId: string;
  challenge: string;
  expires: Date;
  createdAt: Date;
}

interface TransactionResult {
  credentialId: string;
  success: boolean;
  deviceName: string;
}

const rpID = process.env.WEBAUTHN_RP_ID || (process.env.NODE_ENV === 'production' ? undefined : 'localhost');
const origin = process.env.WEBAUTHN_ORIGIN || 
  (process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3000');

export async function POST(request: NextRequest) {
  console.log('Biometric verification request received');
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
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
      console.warn('Unauthorized biometric verification attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as RequestBody;
    console.log('Request body keys:', Object.keys(body));
    
    const response = body.response || body.attestation;
    const deviceName = body.deviceName;
    
    if (!response) {
      console.error('Missing response data in verification request');
      return NextResponse.json(
        { error: 'Invalid request: Missing attestation/response data' }, 
        { status: 400 }
      );
    }

    if (!deviceName) {
      console.warn('Missing device name in verification request');
      return NextResponse.json(
        { error: 'Invalid request: Device name is required' }, 
        { status: 400 }
      );
    }

    console.log(`Processing verification for user: ${user.id}, device: ${deviceName}`);

    const storedChallenge = await prisma.webauthnChallenge.findFirst({
      where: {
        userId: user.id,
        expires: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    }) as WebauthnChallenge | null;

    if (!storedChallenge) {
      console.warn('Challenge expired or not found');
      return NextResponse.json(
        { error: 'Challenge expired or not found. Please try again.' }, 
        { status: 400 }
      );
    }

    console.log(`Found challenge ID: ${storedChallenge.id}, created at: ${storedChallenge.createdAt}`);

    try {
      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: storedChallenge.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: false
      });

      console.log('Verification result:', {
        verified: verification.verified,
        hasRegistrationInfo: !!verification.registrationInfo,
      });

      if (verification.verified && verification.registrationInfo) {
        const { credential } = verification.registrationInfo;
        
        const initialCounter = 0;
        
        const credentialIdString = isoBase64URL.fromBuffer(Buffer.from(credential.id));
        const publicKeyString = isoBase64URL.fromBuffer(Buffer.from(credential.publicKey));
        
        console.log('Credential info:', {
          credentialIdLength: credentialIdString.length,
          publicKeyLength: publicKeyString.length,
          initialCounter
        });

        const existingCredential = await prisma.biometricCredential.findUnique({
          where: { credentialId: credentialIdString }
        });

        if (existingCredential) {
          console.warn(`Credential ID already exists: ${credentialIdString.substring(0, 10)}...`);
          return NextResponse.json(
            { error: 'This biometric credential is already registered' }, 
            { status: 409 }
          );
        }

        const result = await prisma.$transaction(async (tx: PrismaTx): Promise<TransactionResult> => {
          const newCredential = await tx.biometricCredential.create({
            data: {
              userId: user.id,
              credentialId: credentialIdString,
              publicKey: publicKeyString,
              counter: initialCounter,
              transports: response.response?.transports ? JSON.stringify(response.response.transports) : null,
              deviceName: deviceName.trim(),
            }
          });

          await tx.student.update({
            where: { id: user.id },
            data: { biometricEnabled: true }
          });

          await tx.webauthnChallenge.delete({
            where: { id: storedChallenge.id }
          });

          await tx.securityEvent.create({
            data: {
              userId: user.id,
              eventType: 'biometric_registered',
              severity: 'low',
              description: `New biometric credential registered: ${deviceName}`,
              ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
            }
          });

          await tx.userActivityLog.create({
            data: {
              userId: user.id,
              action: 'biometric_enabled',
              description: `Biometric authentication enabled for device: ${deviceName}`,
              ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
              userAgent: request.headers.get('user-agent') || 'Unknown',
              metadata: {
                deviceName,
                credentialId: credentialIdString.substring(0, 20)
              }
            }
          });

          return {
            credentialId: newCredential.id,
            success: true,
            deviceName
          };
        });

        try {
          await redis.del(`biometric:status:${user.id}`);
          await redis.del(`biometric:list:${user.id}`);
          console.log(`Invalidated biometric caches for user: ${user.id} after verify`);
        } catch (redisError) {
          console.warn('Failed to invalidate caches after verify:', redisError);
        }

        clearTimeout(timeoutId);
        
        const headers = new Headers();
        headers.append('Cache-Control', 'no-store, must-revalidate');
        headers.append('Pragma', 'no-cache');
        headers.append('Expires', '0');

        return NextResponse.json({
          verified: true,
          credentialId: result.credentialId,
          deviceName: result.deviceName,
          message: 'Biometric authentication successfully registered'
        }, { headers });
      } else {
        console.warn('Verification failed:', { verified: verification.verified });
        return NextResponse.json(
          { error: 'Verification failed. Please try again.' }, 
          { status: 400 }
        );
      }
    } catch (verificationError: unknown) {
      const typedError = verificationError as Error;
      console.error('Verification error:', typedError);
      return NextResponse.json(
        { 
          error: 'Verification failed: ' + (typedError.message || 'Unknown error'),
          details: process.env.NODE_ENV === 'development' ? typedError.stack : undefined
        }, 
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    
    const typedError = error as Error;
    console.error('Error in biometric verification:', typedError);
    
    if (typedError.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timed out. Please try again.' }, 
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to verify registration: ' + (typedError.message || 'Unknown error'), 
        details: process.env.NODE_ENV === 'development' ? typedError.stack : undefined 
      }, 
      { status: 500 }
    );
  }
}