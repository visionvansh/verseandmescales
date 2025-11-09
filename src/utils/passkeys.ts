import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/types';
import prisma from '@/lib/prisma';
import { redis, CACHE_TIMES, cacheKeys } from '@/lib/redis';

// Define interface for credential type used in map functions
interface BiometricCredential {
  credentialId: string;
  transports: string | null;
}

const rpName = 'Clipify Elite';
const rpID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ============================================================================
// Passkey Registration
// ============================================================================

export async function generatePasskeyRegistrationOptions(userId: string) {
  const user = await prisma.student.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get existing credentials
  const existingCredentials = await prisma.biometricCredential.findMany({
    where: { userId },
    select: { credentialId: true, transports: true }
  });

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: Buffer.from(user.id),
    userName: user.email,
    userDisplayName: user.username || user.email,
    attestationType: 'none',
    excludeCredentials: existingCredentials.map((cred: BiometricCredential) => ({
      id: cred.credentialId,
      type: 'public-key' as const,
      transports: cred.transports?.split(',') as any[] || undefined,
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
      authenticatorAttachment: 'platform',
    },
  });

  // Store challenge in Redis
  await redis.setex(
    `passkey:challenge:${userId}`,
    300, // 5 minutes
    options.challenge
  );

  return options;
}

export async function verifyPasskeyRegistration(
  userId: string,
  response: RegistrationResponseJSON,
  deviceName: string
) {
  const challenge = await redis.get(`passkey:challenge:${userId}`);

  if (!challenge) {
    throw new Error('Challenge not found or expired');
  }

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error('Passkey verification failed');
  }

  // In @simplewebauthn/server v9+, the structure changed
  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

  // Store credential - credential object now contains id, publicKey, counter
  await prisma.biometricCredential.create({
    data: {
      userId,
      credentialId: typeof credential.id === 'string' 
        ? credential.id 
        : Buffer.from(credential.id).toString('base64'),
      publicKey: typeof credential.publicKey === 'string'
        ? credential.publicKey
        : Buffer.from(credential.publicKey).toString('base64'),
      counter: credential.counter,
      deviceName,
      transports: response.response.transports?.join(',') || null,
    },
  });

  // Enable biometric for user
  await prisma.student.update({
    where: { id: userId },
    data: { biometricEnabled: true },
  });

  // Clear challenge
  await redis.del(`passkey:challenge:${userId}`);

  // Invalidate cache
  await redis.del(cacheKeys.biometricStatus(userId));

  return verification;
}

// ============================================================================
// Passkey Authentication
// ============================================================================

export async function generatePasskeyAuthenticationOptions(userId: string) {
  const credentials = await prisma.biometricCredential.findMany({
    where: { userId },
    select: { credentialId: true, transports: true }
  });

  if (credentials.length === 0) {
    throw new Error('No passkeys registered');
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: credentials.map((cred: BiometricCredential) => ({
      id: cred.credentialId,
      type: 'public-key' as const,
      transports: cred.transports?.split(',') as any[] || undefined,
    })),
    userVerification: 'preferred',
  });

  // Store challenge
  await redis.setex(
    `passkey:auth:${userId}`,
    300, // 5 minutes
    options.challenge
  );

  return options;
}

export async function verifyPasskeyAuthentication(
  userId: string,
  response: AuthenticationResponseJSON
) {
  const challenge = await redis.get(`passkey:auth:${userId}`);

  if (!challenge) {
    throw new Error('Challenge not found or expired');
  }

  const credentialId = response.id;

  const credential = await prisma.biometricCredential.findFirst({
    where: {
      userId,
      credentialId,
    },
  });

  if (!credential) {
    throw new Error('Credential not found');
  }

  // Prepare credential for verification - convert to Uint8Array
  const credentialPublicKey = credential.publicKey.startsWith('-----')
    ? credential.publicKey
    : Buffer.from(credential.publicKey, 'base64');

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: credential.credentialId,
      publicKey: new Uint8Array(credentialPublicKey instanceof Buffer ? credentialPublicKey : Buffer.from(credentialPublicKey)),
      counter: credential.counter,
    },
  });

  if (!verification.verified) {
    throw new Error('Passkey authentication failed');
  }

  // Update counter
  await prisma.biometricCredential.update({
    where: { id: credential.id },
    data: {
      counter: verification.authenticationInfo.newCounter,
      lastUsed: new Date(),
    },
  });

  // Clear challenge
  await redis.del(`passkey:auth:${userId}`);

  return verification;
}

export async function getUserPasskeys(userId: string) {
  // Check cache
  const cacheKey = cacheKeys.biometricCredentials(userId);
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const passkeys = await prisma.biometricCredential.findMany({
    where: { userId },
    select: {
      id: true,
      deviceName: true,
      createdAt: true,
      lastUsed: true,
    },
    orderBy: { lastUsed: 'desc' },
  });

  // Cache for 5 minutes
  await redis.setex(cacheKey, CACHE_TIMES.BIOMETRIC_CREDENTIALS, JSON.stringify(passkeys));

  return passkeys;
}

export async function deletePasskey(userId: string, passkeyId: string) {
  await prisma.biometricCredential.delete({
    where: {
      id: passkeyId,
      userId, // Ensure user owns this passkey
    },
  });

  // Check if user has any more passkeys
  const remainingPasskeys = await prisma.biometricCredential.count({
    where: { userId },
  });

  // If no passkeys left, disable biometric
  if (remainingPasskeys === 0) {
    await prisma.student.update({
      where: { id: userId },
      data: { biometricEnabled: false },
    });
  }

  // Invalidate cache
  await redis.del(cacheKeys.biometricCredentials(userId));
  await redis.del(cacheKeys.biometricStatus(userId));
}