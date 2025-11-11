import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/utils/auth';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { redis } from '@/lib/redis';

// Get configuration from environment variables with better defaults (unchanged)
const rpID = process.env.WEBAUTHN_RP_ID || (process.env.NODE_ENV === 'production' ? undefined : 'localhost');
const origin = process.env.WEBAUTHN_ORIGIN || 
  (process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3000');

export async function POST(request: NextRequest) {
  // Add detailed logging to help with debugging (unchanged)
  console.log('Biometric verification request received');
  
  // Set up request timeout (unchanged)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
  
  try {
    // Check required configuration (original logic unchanged)
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

    // Authenticate user (original logic unchanged)
    const user = await getAuthUser(request);
    if (!user) {
      console.warn('Unauthorized biometric verification attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Request body keys:', Object.keys(body));
    
    // CRITICAL FIX: Support both formats (attestation and response) (original logic unchanged)
    // This handles the mismatch between frontend sending "attestation" and backend expecting "response"
    const response = body.response || body.attestation;
    const deviceName = body.deviceName;
    
    // Validate request data (original logic unchanged)
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

    // Get stored challenge - with more efficient query (original logic unchanged)
    const storedChallenge = await prisma.webauthnChallenge.findFirst({
      where: {
        userId: user.id,
        expires: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!storedChallenge) {
      console.warn('Challenge expired or not found');
      return NextResponse.json(
        { error: 'Challenge expired or not found. Please try again.' }, 
        { status: 400 }
      );
    }

    console.log(`Found challenge ID: ${storedChallenge.id}, created at: ${storedChallenge.createdAt}`);

    try {
      // Verify the attestation response (original logic unchanged)
      // FIXED: Set requireUserVerification to false to make it optional
      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: storedChallenge.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: false // Make user verification optional
      });

      console.log('Verification result:', {
        verified: verification.verified,
        hasRegistrationInfo: !!verification.registrationInfo,
      });

      if (verification.verified && verification.registrationInfo) {
        // Properly access properties through the credential object (original logic unchanged)
        const { credential } = verification.registrationInfo;
        
        // Initial counter is typically 0 for newly registered credentials
        const initialCounter = 0;
        
        // Convert credential ID and public key to strings for storage
        let credentialIdString = isoBase64URL.fromBuffer(Buffer.from(credential.id));
        let publicKeyString = isoBase64URL.fromBuffer(Buffer.from(credential.publicKey));
        
        console.log('Credential info:', {
          credentialIdLength: credentialIdString.length,
          publicKeyLength: publicKeyString.length,
          initialCounter
        });

        // Check for existing credential with same ID (original logic unchanged)
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

        // Use Prisma transaction to ensure consistency (original logic unchanged)
        const result = await prisma.$transaction(async (tx) => {
          // Save the credential to the database
          const newCredential = await tx.biometricCredential.create({
            data: {
              userId: user.id,
              credentialId: credentialIdString,
              publicKey: publicKeyString,
              counter: initialCounter,
              transports: response.transports ? JSON.stringify(response.transports) : null,
              deviceName: deviceName,
              lastUsed: new Date(),
            }
          });

          // Update user settings to enable biometric auth
          await tx.student.update({
            where: { id: user.id },
            data: { biometricEnabled: true }
          });

          // Log security event
          await tx.securityEvent.create({
            data: {
              userId: user.id,
              eventType: 'biometric_registered',
              severity: 'low',
              description: `Biometric credential registered: ${deviceName}`,
              ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
            }
          });

          // Create activity log
          await tx.userActivityLog.create({
            data: {
              userId: user.id,
              action: 'biometric_enabled',
              description: `Biometric authentication enabled on device: ${deviceName}`,
              ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
              userAgent: request.headers.get('user-agent') || 'Unknown',
            }
          });

          return { newCredential };
        });

        // Invalidate caches after successful verification (new: ensures fresh status/list)
        try {
          await redis.del(`biometric:status:${user.id}`);
          await redis.del(`biometric:list:${user.id}`);
          console.log(`Invalidated biometric caches for user: ${user.id} after verify-registration`);
        } catch (redisError) {
          const typedRedisError = redisError as Error;
          console.warn('Failed to invalidate caches after verify-registration:', typedRedisError);
        }

        // Clear the timeout as request is successful (original logic unchanged)
        clearTimeout(timeoutId);
        
        // Set appropriate cache control headers (original logic unchanged)
        const headers = new Headers();
        headers.append('Cache-Control', 'no-store, must-revalidate');
        headers.append('Pragma', 'no-cache');
        headers.append('Expires', '0');

        return NextResponse.json({ 
          success: true, 
          verified: true,
          credentialId: result.newCredential.id 
        }, { headers });
      }

      console.warn('Verification failed with valid challenge');
      return NextResponse.json(
        { error: 'Verification failed. Please try again.' }, 
        { status: 400 }
      );
    } catch (error: unknown) {
      const typedError = error as Error;
      console.error('WebAuthn verification error:', typedError);
      return NextResponse.json(
        { 
          error: 'Verification failed: ' + (typedError.message || 'Unknown error'),
          details: process.env.NODE_ENV === 'development' ? typedError.stack : undefined
        }, 
        { status: 400 }
      );
    } finally {
      // Clean up the challenge regardless of outcome (original logic unchanged)
      try {
        await prisma.webauthnChallenge.delete({
          where: { id: storedChallenge.id }
        });
        console.log(`Deleted challenge: ${storedChallenge.id}`);
      } catch (cleanupError) {
        console.warn('Failed to clean up challenge:', cleanupError);
      }
      
      // Clear the timeout
      clearTimeout(timeoutId);
    }
  } catch (error: unknown) {
    // Clear the timeout to prevent memory leaks (original logic unchanged)
    clearTimeout(timeoutId);
    
    const typedError = error as Error;
    console.error('Error in biometric registration verification:', typedError);
    
    // Handle abort errors specifically (original logic unchanged)
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