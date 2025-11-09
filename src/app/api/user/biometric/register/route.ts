import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/utils/auth';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { redis } from '@/lib/redis';

// Define the BiometricCredential interface based on Prisma query
interface BiometricCredential {
  credentialId: string;
  transports: string | null;
}

// Get configuration from environment variables with better defaults (unchanged)
const rpName = process.env.WEBAUTHN_RP_NAME || 'Your App';
// RP ID should be the domain name without protocol (e.g. example.com)
const rpID = process.env.WEBAUTHN_RP_ID || (process.env.NODE_ENV === 'production' ? undefined : 'localhost');
// Origin should be the full URL with protocol (e.g. https://example.com)
const origin = process.env.WEBAUTHN_ORIGIN || 
  (process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3000');

export async function POST(request: NextRequest) {
  // Add request timeout handling (unchanged)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
  
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
      console.warn('Unauthorized biometric registration attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing credentials with more efficient query (original logic unchanged)
    const existingCredentials = await prisma.biometricCredential.findMany({
      where: { userId: user.id },
      select: {
        credentialId: true,
        transports: true
      }
    });

    // Check if user has reached the maximum number of allowed credentials (original logic unchanged)
    const MAX_CREDENTIALS = 10; // Define your limit
    if (existingCredentials.length >= MAX_CREDENTIALS) {
      return NextResponse.json(
        { error: `You can only register up to ${MAX_CREDENTIALS} biometric devices` }, 
        { status: 403 }
      );
    }

    // Convert user ID to Uint8Array for proper typing (original logic unchanged)
    const userIdBuffer = new TextEncoder().encode(user.id);

    // Generate registration options with proper typing (original logic unchanged)
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: userIdBuffer,
      userName: user.username || user.email,
      attestationType: 'none',
      excludeCredentials: existingCredentials.map((cred: BiometricCredential) => ({
        id: cred.credentialId, // Use the Base64URL string directly
        type: 'public-key',
        transports: cred.transports ? JSON.parse(cred.transports) : undefined,
      })),
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Specify platform for biometric
        userVerification: 'preferred',
        requireResidentKey: false,
      },
      timeout: 60000, // 60 seconds timeout
    });

    // Generate a more secure challenge and clean up old challenges (original logic unchanged)
    await prisma.$transaction([
      // Delete expired challenges
      prisma.webauthnChallenge.deleteMany({
        where: {
          OR: [
            { userId: user.id }, // Delete all for this user
            { expires: { lt: new Date() } } // Delete expired for all users
          ]
        }
      }),
      
      // Create new challenge
      prisma.webauthnChallenge.create({
        data: {
          userId: user.id,
          challenge: options.challenge,
          expires: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        }
      })
    ]);

    // Invalidate caches after successful challenge creation (new: for consistency on next status/list fetch)
    try {
      await redis.del(`biometric:status:${user.id}`);
      await redis.del(`biometric:list:${user.id}`);
      console.log(`Invalidated biometric caches for user: ${user.id} after register start`);
    } catch (redisError) {
      console.warn('Failed to invalidate caches after register:', redisError);
    }

    // Clear the timeout as request is successful (original logic unchanged)
    clearTimeout(timeoutId);
    
    // Set appropriate cache control headers (original logic unchanged)
    const headers = new Headers();
    headers.append('Cache-Control', 'no-store, must-revalidate');
    headers.append('Pragma', 'no-cache');
    headers.append('Expires', '0');

    // Return registration options to the client (original logic unchanged)
    return NextResponse.json(options, { headers });

  } catch (error: unknown) {
    // Clear the timeout to prevent memory leaks (original logic unchanged)
    clearTimeout(timeoutId);
    
    const typedError = error as Error;
    console.error('Error in biometric registration:', typedError);
    
    // Handle abort errors specifically (original logic unchanged)
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