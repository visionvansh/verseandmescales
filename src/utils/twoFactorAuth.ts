// utils/twoFactorAuth.ts
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { redis, CACHE_TIMES, cacheKeys } from '@/lib/redis';
import { sendEmail } from './email';
import { sendSMS } from './sms';

// ============================================================================
// TOTP (Authenticator App) Functions
// ============================================================================

export async function generateTOTPSecret(userId: string) {
  const secret = speakeasy.generateSecret({
    name: `Clipify Elite (${userId})`,
    issuer: 'Clipify Elite',
    length: 32
  });

  const qrCode = await QRCode.toDataURL(secret.otpauth_url!);
  
  const tempSecretId = crypto.randomUUID();
  await prisma.tempTwoFactorSecret.create({
    data: {
      id: tempSecretId,
      userId,
      secret: secret.base32,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    }
  });

  await redis.setex(
    cacheKeys.twoFactorSetup(tempSecretId),
    CACHE_TIMES.TWO_FACTOR_SETUP,
    JSON.stringify({ userId, secret: secret.base32 })
  );

  return {
    secret: secret.base32,
    qrCode,
    tempSecretId
  };
}

export function verifyTOTP(token: string, secret: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2
  });
}

// ============================================================================
// Backup Codes Functions
// ============================================================================

export async function generateBackupCodes(userId: string): Promise<string[]> {
  await prisma.twoFactorBackupCode.deleteMany({
    where: { userId }
  });

  const codes: string[] = [];
  const codeRecords = [];

  for (let i = 0; i < 10; i++) {
    const code = Array.from({ length: 4 }, () => 
      crypto.randomBytes(2).toString('hex').toUpperCase().substring(0, 4)
    ).join('-');
    
    codes.push(code);
    
    const hashedCode = crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');
    
    codeRecords.push({
      userId,
      code: hashedCode,
      used: false
    });
  }

  await prisma.twoFactorBackupCode.createMany({
    data: codeRecords
  });

  await redis.del(cacheKeys.backupCodes(userId));

  return codes;
}

export async function verifyBackupCode(userId: string, code: string): Promise<boolean> {
  // ✅ DON'T normalize - keep original format with dashes
  const inputCode = code.trim().toUpperCase();
  
  // Try exact match first (with dashes)
  const hashedCodeWithDashes = crypto
    .createHash('sha256')
    .update(inputCode)
    .digest('hex');

  let backupCode = await prisma.twoFactorBackupCode.findFirst({
    where: {
      userId,
      code: hashedCodeWithDashes,
      used: false
    }
  });

  // If not found, try without dashes (for backwards compatibility)
  if (!backupCode) {
    const normalizedCode = inputCode.replace(/[\s-]/g, '');
    const hashedCodeWithoutDashes = crypto
      .createHash('sha256')
      .update(normalizedCode)
      .digest('hex');

    backupCode = await prisma.twoFactorBackupCode.findFirst({
      where: {
        userId,
        code: hashedCodeWithoutDashes,
        used: false
      }
    });
  }

  // If still not found, try salted hash format (salt:hash)
  if (!backupCode) {
    const allCodes = await prisma.twoFactorBackupCode.findMany({
      where: {
        userId,
        used: false
      }
    });

    for (const storedCode of allCodes) {
      if (storedCode.code.includes(':')) {
        const [salt, hash] = storedCode.code.split(':');
        const computedHash = crypto
          .createHash('sha256')
          .update(salt + inputCode)
          .digest('hex');
        
        if (computedHash === hash) {
          backupCode = storedCode;
          break;
        }
      }
    }
  }

  if (!backupCode) {
    return false;
  }

  // Mark as used
  await prisma.twoFactorBackupCode.update({
    where: { id: backupCode.id },
    data: {
      used: true,
      usedAt: new Date(),
    }
  });

  await redis.del(cacheKeys.backupCodes(userId));

  // Check remaining codes
  const remainingCodes = await prisma.twoFactorBackupCode.count({
    where: { userId, used: false }
  });

  if (remainingCodes <= 2) {
    const user = await prisma.student.findUnique({
      where: { id: userId },
      select: { email: true, name: true }
    });

    if (user?.email) {
      const htmlContent = `
        <p>Hi ${user.name || 'there'},</p>
        <p>You only have ${remainingCodes} backup codes remaining.</p>
        <p>Please generate new backup codes to ensure you don't lose access to your account.</p>
      `;
      
      await sendEmail({
        to: user.email,
        subject: '⚠️ Low Backup Codes Warning',
        text: `Hi ${user.name || 'there'}, You only have ${remainingCodes} backup codes remaining.`,
        html: htmlContent
      });
    }
  }

  return true;
}

// ============================================================================
// Email/SMS Verification Functions
// ============================================================================

export async function sendEmailVerificationCode(userId: string, email: string): Promise<void> {
  const code = crypto.randomInt(100000, 999999).toString();
  const hashedCode = await bcrypt.hash(code, 10);
  
  await redis.setex(
    `2fa:email:${userId}`,
    600,
    hashedCode
  );

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Verification Code</h2>
      <p>Your verification code is:</p>
      <h1 style="color: #F59E0B; font-size: 32px; letter-spacing: 5px;">${code}</h1>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
    </div>
  `;

  await console.log({
    to: email,
    subject: 'Your Verification Code',
    text: `Your verification code is: ${code}. This code will expire in 10 minutes.`,
    html: htmlContent
  });
}

export async function sendSMSVerificationCode(userId: string, phone: string): Promise<void> {
  const code = crypto.randomInt(100000, 999999).toString();
  const hashedCode = await bcrypt.hash(code, 10);
  
  await redis.setex(
    `2fa:sms:${userId}`,
    600,
    hashedCode
  );

  await sendSMS({
    to: phone,
    message: `Your Clipify Elite verification code is: ${code}. Valid for 10 minutes.`
  });
}

export async function verifyEmailCode(userId: string, code: string): Promise<boolean> {
  const hashedCode = await redis.get(`2fa:email:${userId}`);
  
  if (!hashedCode) {
    return false;
  }

  const isValid = await bcrypt.compare(code, hashedCode);
  
  if (isValid) {
    await redis.del(`2fa:email:${userId}`);
  }

  return isValid;
}

export async function verifySMSCode(userId: string, code: string): Promise<boolean> {
  const hashedCode = await redis.get(`2fa:sms:${userId}`);
  
  if (!hashedCode) {
    return false;
  }

  const isValid = await bcrypt.compare(code, hashedCode);
  
  if (isValid) {
    await redis.del(`2fa:sms:${userId}`);
  }

  return isValid;
}

// ============================================================================
// User 2FA Methods - Separated into Primary and Additional
// ============================================================================

export async function getUserTwoFactorMethods(userId: string): Promise<string[]> {
  const cached = await redis.get(cacheKeys.twoFactorStatus(userId));
  if (cached) {
    const data = JSON.parse(cached);
    return data.methods;
  }

  const user = await prisma.student.findUnique({
    where: { id: userId },
    select: {
      twoFactorEnabled: true,
      twoFactorSecret: true,
      twoFactorMethod: true,
      email: true,
      emailVerified: true,
      phone: true,
      phoneVerified: true,
      recoveryEmail: true,
      recoveryPhone: true,
      biometricEnabled: true,
      twoFactorBackupCodes: {
        where: { used: false },
        take: 1
      },
      biometricCredentials: {
        take: 1
      }
    }
  });

  if (!user || !user.twoFactorEnabled) {
    return [];
  }

  const methods: string[] = [];

  // ✅ PRIMARY METHOD
  const primaryMethod = user.twoFactorMethod || '2fa';

  if (primaryMethod === '2fa' || primaryMethod === 'app') {
    if (user.twoFactorSecret) {
      methods.push('2fa');
    }
  } else if (primaryMethod === 'sms') {
    if (user.phone && user.phoneVerified) {
      methods.push('sms');
    }
  } else if (primaryMethod === 'email') {
    if (user.email && user.emailVerified) {
      methods.push('email');
    }
  }

  // ✅ ALWAYS include backup codes if available
  if (user.twoFactorBackupCodes.length > 0) {
    methods.push('backup');
  }

  // ✅ ADDITIONAL/RECOVERY METHODS - **ONLY IF VERIFIED**
  
  // 1. Passkey/Biometric
  if (user.biometricEnabled && user.biometricCredentials.length > 0) {
    methods.push('passkey');
  }

  // 2. Recovery email - **CHECK IF IT'S VERIFIED**
  if (user.recoveryEmail && user.recoveryEmail !== user.email) {
    // ✅ Check RecoveryOption table for verification status
    const recoveryEmailOption = await prisma.recoveryOption.findFirst({
      where: {
        userId,
        type: 'email',
        value: user.recoveryEmail,
        isVerified: true // ✅ CRITICAL: Only verified recovery emails
      }
    });

    if (recoveryEmailOption) {
      methods.push('recovery_email');
    }
  }

  // 3. Recovery phone - **CHECK IF IT'S VERIFIED**
  if (user.recoveryPhone && user.recoveryPhone !== user.phone) {
    // ✅ Check RecoveryOption table for verification status
    const recoveryPhoneOption = await prisma.recoveryOption.findFirst({
      where: {
        userId,
        type: 'phone',
        value: user.recoveryPhone,
        isVerified: true // ✅ CRITICAL: Only verified recovery phones
      }
    });

    if (recoveryPhoneOption) {
      methods.push('recovery_phone');
    }
  }

  // Cache the result
  await redis.setex(
    cacheKeys.twoFactorStatus(userId),
    CACHE_TIMES.TWO_FACTOR_STATUS,
    JSON.stringify({ 
      methods, 
      enabled: user.twoFactorEnabled,
      primaryMethod: primaryMethod 
    })
  );

  return methods;
}

// ============================================================================
// Unified Verification
// ============================================================================

export async function verify2FAByType(
  userId: string,
  code: string,
  method: '2fa' | 'backup' | 'email' | 'sms' | 'recovery_email' | 'recovery_phone' | 'passkey'
): Promise<boolean> {
  switch (method) {
    case '2fa': {
      const user = await prisma.student.findUnique({
        where: { id: userId },
        select: { twoFactorSecret: true }
      });

      if (!user?.twoFactorSecret) {
        return false;
      }

      return verifyTOTP(code, user.twoFactorSecret);
    }

    case 'backup': {
      return await verifyBackupCode(userId, code);
    }

    case 'email': {
      return await verifyEmailCode(userId, code);
    }

    case 'sms': {
      return await verifySMSCode(userId, code);
    }

    case 'recovery_email': {
      return await verifyRecoveryCode(userId, code, 'recovery_email');
    }

    case 'recovery_phone': {
      return await verifyRecoveryCode(userId, code, 'recovery_phone');
    }

    case 'passkey': {
      // Passkeys use a different flow via WebAuthn - handled in separate route
      return false;
    }

    default:
      return false;
  }
}

// ============================================================================
// Device Trust Management
// ============================================================================

export async function isDeviceTrusted(userId: string, deviceFingerprint: string): Promise<boolean> {
  const cacheKey = cacheKeys.trustedDevice(userId, deviceFingerprint);
  const cached = await redis.get(cacheKey);
  
  if (cached !== null) {
    return cached === '1';
  }

  const device = await prisma.userDevice.findFirst({
    where: {
      userId,
      fingerprint: deviceFingerprint,
      trusted: true
    }
  });

  const isTrusted = !!device;
  await redis.setex(cacheKey, CACHE_TIMES.TRUSTED_DEVICE, isTrusted ? '1' : '0');

  return isTrusted;
}

export async function trustDevice(userId: string, deviceId: string): Promise<void> {
  const device = await prisma.userDevice.update({
    where: { id: deviceId },
    data: { trusted: true }
  });

  await redis.setex(
    cacheKeys.trustedDevice(userId, device.fingerprint),
    CACHE_TIMES.TRUSTED_DEVICE,
    '1'
  );

  await prisma.userActivityLog.create({
    data: {
      userId,
      action: 'device_trusted',
      description: `Device ${device.deviceName} marked as trusted`,
      metadata: { deviceId, fingerprint: device.fingerprint }
    }
  });
}

export async function revokeDeviceTrust(userId: string, deviceId: string): Promise<void> {
  const device = await prisma.userDevice.update({
    where: { id: deviceId },
    data: { trusted: false }
  });

  await redis.del(cacheKeys.trustedDevice(userId, device.fingerprint));

  await prisma.userSession.updateMany({
    where: { deviceId, isActive: true },
    data: { isActive: false }
  });

  await prisma.userActivityLog.create({
    data: {
      userId,
      action: 'device_trust_revoked',
      description: `Trust revoked for device ${device.deviceName}`,
      metadata: { deviceId, fingerprint: device.fingerprint }
    }
  });
}

export async function verifyRecoveryCode(
  userId: string,
  code: string,
  method: 'recovery_email' | 'recovery_phone'
): Promise<boolean> {
  // Find the most recent unused code for this method
  const verificationCode = await prisma.twoFactorVerificationCode.findFirst({
    where: {
      userId,
      method,
      used: false,
      expiresAt: {
        gt: new Date()
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (!verificationCode) {
    return false;
  }

  const isValid = await bcrypt.compare(code, verificationCode.code);

  if (isValid) {
    // Mark as used
    await prisma.twoFactorVerificationCode.update({
      where: { id: verificationCode.id },
      data: { 
        used: true,
      }
    });

    // Clean up old codes
    await prisma.twoFactorVerificationCode.deleteMany({
      where: {
        userId,
        OR: [
          { used: true },
          { expiresAt: { lt: new Date() } }
        ]
      }
    });
  }

  return isValid;
}