// utils/twoFactorUtils.ts
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generates a set of backup codes for two-factor authentication
 */
export function generateBackupCodes(count = 10): { plain: string[], hashed: string[] } {
  const plainCodes: string[] = [];
  const hashedCodes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate a random code with high entropy
    const code = `${generateRandomCode(4)}-${generateRandomCode(4)}-${generateRandomCode(4)}-${generateRandomCode(4)}`;
    plainCodes.push(code);
    
    // Use crypto instead of bcrypt for safer cross-platform hashing
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .createHash('sha256')
      .update(salt + code)
      .digest('hex');
    
    hashedCodes.push(`${salt}:${hash}`);
  }
  
  return { plain: plainCodes, hashed: hashedCodes };
}

/**
 * Generates a random alphanumeric string with crypto-secure randomness
 */
function generateRandomCode(length: number): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar-looking chars
  let result = '';
  
  // Use crypto for secure random generation
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    const randomByte = randomBytes[i];
    result += characters.charAt(randomByte % characters.length);
  }
  
  return result;
}

/**
 * Verifies a backup code
 */
export async function verifyBackupCode(userId: string, code: string): Promise<{ valid: boolean; codeId?: string }> {
  try {
    // Find all unused backup codes for the user
    const backupCodes = await prisma.twoFactorBackupCode.findMany({
      where: {
        userId,
        used: false
      },
      select: {
        id: true,
        code: true
      }
    });
    
    // Check each code
    for (const backupCode of backupCodes) {
      if (verifyBackupCodeHash(code, backupCode.code)) {
        return { valid: true, codeId: backupCode.id };
      }
    }
    
    return { valid: false };
  } catch (error) {
    console.error('Error verifying backup code:', error);
    return { valid: false };
  }
}

/**
 * Verifies a backup code hash
 */
function verifyBackupCodeHash(plainCode: string, hashedCode: string): boolean {
  try {
    const [salt, storedHash] = hashedCode.split(':');
    
    if (!salt || !storedHash) {
      // Handle old format where bcrypt was used
      return false;
    }
    
    const hash = crypto
      .createHash('sha256')
      .update(salt + plainCode)
      .digest('hex');
    
    return hash === storedHash;
  } catch (error) {
    console.error('Error verifying backup code hash:', error);
    return false;
  }
}

/**
 * Verifies a TOTP token
 */
export function verifyTOTP(secret: string, token: string): boolean {
  if (!secret || !token) return false;
  
  try {
    // Use a small window to allow for time sync issues but maintain security
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1 // Allow 1 step before/after (±30 seconds)
    });
  } catch (error) {
    console.error('Error verifying TOTP:', error);
    return false;
  }
}

/**
 * Generates a TOTP secret and QR code
 */
export async function generateTOTPSecret(email: string, appName = 'YourApp'): Promise<{
  secret: string;
  base32: string;
  otpauth_url: string;
  qrCodeUrl: string;
}> {
  // Generate a secure secret
  const secret = speakeasy.generateSecret({
    length: 24,
    name: `${appName}:${email}`
  });
  
  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
  
  return {
    secret: secret.ascii!,
    base32: secret.base32!,
    otpauth_url: secret.otpauth_url!,
    qrCodeUrl
  };
}