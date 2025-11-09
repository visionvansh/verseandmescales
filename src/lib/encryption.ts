// lib/encryption.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.CHAT_ENCRYPTION_KEY!; // 32 bytes (64 hex chars)
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export interface EncryptedData {
  encryptedContent: string;
  contentHash: string;
}

/**
 * Encrypt message content
 */
export function encryptMessage(content: string): EncryptedData {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );

  let encrypted = cipher.update(content, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Combine IV + encrypted content + auth tag
  const combined = Buffer.concat([
    iv,
    Buffer.from(encrypted, 'hex'),
    authTag
  ]).toString('base64');

  // Create hash for integrity
  const contentHash = crypto
    .createHash('sha256')
    .update(content)
    .digest('hex');

  return {
    encryptedContent: combined,
    contentHash
  };
}

/**
 * Decrypt message content
 */
export function decryptMessage(encryptedData: string): string {
  try {
    const combined = Buffer.from(encryptedData, 'base64');

    // Extract IV, encrypted content, and auth tag
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );

    decipher.setAuthTag(authTag);

    // ✅ FIX: Pass Buffer directly instead of undefined
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  } catch (error: any) {
    console.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt message: ' + error.message);
  }
}

/**
 * Verify message integrity
 */
export function verifyMessageIntegrity(content: string, hash: string): boolean {
  const calculatedHash = crypto
    .createHash('sha256')
    .update(content)
    .digest('hex');

  return calculatedHash === hash;
}