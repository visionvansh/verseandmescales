// utils/behaviousAnalysis.tsx

import prisma from '@/lib/prisma';
import { redis } from '@/lib/redis';

interface BehaviorProfile {
  userId: string;
  commonLocations: string[];
  commonDevices: string[];
  commonTimes: { day: number; hour: number }[];
  avgSessionDuration: number;
  loginFrequency: number;
  suspiciousPatterns: string[];
}

type LoginAnalytics = {
  userId: string;
  country: string | null;
  city: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  dayOfWeek: string;
  hourOfDay: number;
  loginDuration: number | null;
};

type UserSession = {
  userId: string;
  isActive: boolean;
  lastUsed: Date;
  country: string | null;
};

// ============================================================================
// Device Trust Status Helper (FIXED)
// ============================================================================

// ✅ Infer the UserDevice type from Prisma operations
type UserDeviceType = Awaited<ReturnType<typeof prisma.userDevice.findFirst>>;

interface DeviceTrustInfo {
  isTrusted: boolean;
  isAccountCreationDevice: boolean;
  existsInDB: boolean;
  existsInRedis: boolean;
  device?: UserDeviceType;
}

async function getDeviceTrustStatus(
  userId: string,
  deviceFingerprint: string
): Promise<DeviceTrustInfo> {
  // ✅ DATABASE is the ONLY source of truth
  const device = await prisma.userDevice.findFirst({
    where: {
      userId,
      fingerprint: deviceFingerprint
    }
  });

  // Check Redis cache
  const redisTrustedKey = `2fa:device:${userId}:${deviceFingerprint}`;
  const redisValue = await redis.exists(redisTrustedKey);
  const existsInRedis = redisValue > 0;

  // ✅ CRITICAL: Trust status is ONLY from the DB 'trusted' field
  const isTrustedInDB = device?.trusted === true;
  const isAccountCreationDevice = device?.isAccountCreationDevice || false;
  
  // ✅ Detect and fix cache inconsistency
  if (existsInRedis && !isTrustedInDB) {
    console.warn('[BehaviorAnalysis] ⚠️ CACHE INCONSISTENCY: Redis shows trusted but DB shows untrusted', {
      userId,
      fingerprint: deviceFingerprint.substring(0, 16) + '...',
      dbTrusted: isTrustedInDB,
      redisCached: existsInRedis
    });
    
    await redis.del(redisTrustedKey);
    console.log('[BehaviorAnalysis] ✅ Deleted stale Redis cache');
  }
  
  // ✅ If device is trusted in DB but not cached, cache it
  if (isTrustedInDB && !existsInRedis) {
    await redis.setex(redisTrustedKey, 150 * 24 * 60 * 60, '1');
    console.log('[BehaviorAnalysis] ✅ Cached trusted device in Redis');
  }

  return {
    isTrusted: isTrustedInDB,
    isAccountCreationDevice,
    existsInDB: !!device,
    existsInRedis,
    device
  };
}

// ============================================================================
// Advanced Behavior Analysis with Device Trust Integration
// ============================================================================

export async function analyzeBehaviorForRisk(
  userId: string,
  currentContext: {
    ipAddress: string;
    location: string;
    country: string;
    deviceFingerprint: string;
    loginTime: Date;
  }
): Promise<{
  riskScore: number;
  riskFactors: string[];
  recommendations: string[];
  requiresAdditional2FA: boolean;
  allowTrustedDeviceBypass: boolean;
}> {
  const deviceTrustInfo = await getDeviceTrustStatus(userId, currentContext.deviceFingerprint);
  
  console.log(`[BehaviorAnalysis] Device trust info:`, {
    userId,
    fingerprint: currentContext.deviceFingerprint.substring(0, 16) + '...',
    isTrusted: deviceTrustInfo.isTrusted,
    isAccountCreation: deviceTrustInfo.isAccountCreationDevice,
    existsInDB: deviceTrustInfo.existsInDB,
    dbTrustedValue: deviceTrustInfo.device?.trusted
  });

  const profile = await getUserBehaviorProfile(userId);
  
  let riskScore = 0;
  const riskFactors: string[] = [];
  const recommendations: string[] = [];

  if (deviceTrustInfo.isTrusted) {
    console.log('[BehaviorAnalysis] ✅ Device is trusted - reduced risk scoring');
  } else {
    riskScore += 10;
    riskFactors.push('untrusted_device_baseline');
    console.log('[BehaviorAnalysis] ⚠️ Untrusted device - added 10 baseline risk');
  }

  const locationRisk = analyzeLocationRisk(profile, currentContext, deviceTrustInfo);
  riskScore += locationRisk.score;
  riskFactors.push(...locationRisk.factors);

  const deviceRisk = await analyzeDeviceRisk(profile, currentContext, deviceTrustInfo);
  riskScore += deviceRisk.score;
  riskFactors.push(...deviceRisk.factors);

  const timeRisk = analyzeTimeRisk(profile, currentContext, deviceTrustInfo);
  riskScore += timeRisk.score;
  riskFactors.push(...timeRisk.factors);

  const velocityRisk = await checkVelocityAttack(userId, currentContext);
  riskScore += velocityRisk.score;
  riskFactors.push(...velocityRisk.factors);

  const concurrencyRisk = await checkConcurrentSessions(userId, currentContext, deviceTrustInfo);
  riskScore += concurrencyRisk.score;
  riskFactors.push(...concurrencyRisk.factors);

  riskScore = Math.min(100, riskScore);

  const criticalFactors = [
    'velocity_attack',
    'impossible_travel',
    'account_compromise_suspected',
    'multiple_failed_attempts'
  ];
  
  const hasCriticalRiskFactors = riskFactors.some(f => criticalFactors.includes(f));
  
  let allowTrustedDeviceBypass = false;
  
  if (!deviceTrustInfo.isTrusted) {
    allowTrustedDeviceBypass = false;
    console.log('[BehaviorAnalysis] ❌ Device is untrusted - NO bypass allowed');
  } else if (hasCriticalRiskFactors) {
    allowTrustedDeviceBypass = false;
    console.log('[BehaviorAnalysis] ❌ Critical risk factors detected - no bypass allowed');
  } else if (deviceTrustInfo.isTrusted && riskScore < 60) {
    allowTrustedDeviceBypass = true;
    console.log(`[BehaviorAnalysis] ✅ Trusted device bypass allowed (risk: ${riskScore})`);
  } else {
    allowTrustedDeviceBypass = false;
    console.log(`[BehaviorAnalysis] ❌ Risk too high for bypass (risk: ${riskScore})`);
  }

  if (riskScore >= 80) {
    recommendations.push('Force password change');
    recommendations.push('Require additional identity verification');
    recommendations.push('Lock account temporarily');
  } else if (riskScore >= 60) {
    recommendations.push('Require 2FA even for trusted devices');
    recommendations.push('Send security alert email');
  } else if (riskScore >= 40) {
    recommendations.push('Monitor session closely');
    recommendations.push('Require 2FA');
  } else if (!deviceTrustInfo.isTrusted) {
    recommendations.push('Require 2FA for untrusted device');
  }

  console.log(`[BehaviorAnalysis] Final assessment:`, {
    userId,
    riskScore,
    isTrusted: deviceTrustInfo.isTrusted,
    riskFactors,
    allowBypass: allowTrustedDeviceBypass,
    requiresAdditional2FA: riskScore >= 40 || !deviceTrustInfo.isTrusted
  });

  return {
    riskScore,
    riskFactors,
    recommendations,
    requiresAdditional2FA: riskScore >= 40 || !deviceTrustInfo.isTrusted,
    allowTrustedDeviceBypass
  };
}

// ============================================================================
// User Behavior Profile (Cached)
// ============================================================================

// ✅ Define the LoginAnalytics type based on Prisma schema
type PrismaLoginAnalytics = Awaited<ReturnType<typeof prisma.loginAnalytics.findMany>>[number];

async function getUserBehaviorProfile(userId: string): Promise<BehaviorProfile> {
  const cacheKey = `behavior:profile:${userId}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }

  const analytics = await prisma.loginAnalytics.findMany({
    where: { userId },
    orderBy: { loginTime: 'desc' },
    take: 100
  });

  const locationCounts = new Map<string, number>();
  const deviceCounts = new Map<string, number>();
  const timeCounts = new Map<string, number>();

  // ✅ FIXED: Explicitly type the 'log' parameter
  analytics.forEach((log: PrismaLoginAnalytics) => {
    const locKey = `${log.country}:${log.city}`;
    locationCounts.set(locKey, (locationCounts.get(locKey) || 0) + 1);

    const devKey = `${log.deviceType}:${log.browser}:${log.os}`;
    deviceCounts.set(devKey, (deviceCounts.get(devKey) || 0) + 1);

    const dayOfWeek = parseInt(log.dayOfWeek, 10);
    const timeKey = `${dayOfWeek}:${log.hourOfDay}`;
    timeCounts.set(timeKey, (timeCounts.get(timeKey) || 0) + 1);
  });

  const commonLocations = Array.from(locationCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([loc]) => loc);

  const commonDevices = Array.from(deviceCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([dev]) => dev);

  const commonTimes = Array.from(timeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([time]) => {
      const [day, hour] = time.split(':').map(Number);
      return { day, hour };
    });

  // ✅ FIXED: Explicitly type both parameters in reduce
  const totalDuration = analytics.reduce((sum: number, log: PrismaLoginAnalytics) => sum + (log.loginDuration || 0), 0);
  const avgSessionDuration = analytics.length > 0 ? totalDuration / analytics.length : 0;

  const profile: BehaviorProfile = {
    userId,
    commonLocations,
    commonDevices,
    commonTimes,
    avgSessionDuration,
    loginFrequency: analytics.length,
    suspiciousPatterns: []
  };

  await redis.setex(cacheKey, 3600, JSON.stringify(profile));

  return profile;
}

// ============================================================================
// Location Risk Analysis
// ============================================================================

function analyzeLocationRisk(
  profile: BehaviorProfile,
  context: {
    ipAddress: string;
    location: string;
    country: string;
    deviceFingerprint: string;
    loginTime: Date;
  },
  deviceTrust: DeviceTrustInfo
) {
  const locKey = `${context.country}:${context.location}`;
  let score = 0;
  const factors: string[] = [];

  if (!profile.commonLocations.includes(locKey)) {
    // ✅ Apply trust-based risk modifiers (ONLY if device is actually trusted)
    if (deviceTrust.isTrusted) {
      score += 12;
      factors.push('new_location_trusted_device');
    } else {
      score += 30;
      factors.push('new_location_untrusted_device');
    }

    const knownCountries = profile.commonLocations.map(loc => loc.split(':')[0]);
    if (!knownCountries.includes(context.country)) {
      if (deviceTrust.isTrusted) {
        score += 10;
        factors.push('new_country_trusted_device');
      } else {
        score += 20;
        factors.push('new_country_untrusted_device');
      }
    }
  }

  console.log(`[LocationRisk] Score: ${score}, Factors: ${factors.join(', ')}`);
  return { score, factors };
}

// ============================================================================
// Device Risk Analysis
// ============================================================================

async function analyzeDeviceRisk(
  profile: BehaviorProfile,
  context: {
    ipAddress: string;
    location: string;
    country: string;
    deviceFingerprint: string;
    loginTime: Date;
  },
  deviceTrust: DeviceTrustInfo
) {
  let score = 0;
  const factors: string[] = [];

  if (!deviceTrust.existsInDB) {
    score += 25;
    factors.push('new_device');
  } else if (!deviceTrust.isTrusted) {
    // ✅ Untrusted device = risk
    score += 15;
    factors.push('untrusted_device');
  }

  console.log(`[DeviceRisk] Score: ${score}, Factors: ${factors.join(', ')}`);
  return { score, factors };
}

// ============================================================================
// Time Pattern Risk Analysis
// ============================================================================

function analyzeTimeRisk(
  profile: BehaviorProfile,
  context: {
    ipAddress: string;
    location: string;
    country: string;
    deviceFingerprint: string;
    loginTime: Date;
  },
  deviceTrust: DeviceTrustInfo
) {
  const loginTime = context.loginTime;
  const day = loginTime.getDay();
  const hour = loginTime.getHours();

  let score = 0;
  const factors: string[] = [];

  const isCommonTime = profile.commonTimes.some(
    t => t.day === day && Math.abs(t.hour - hour) <= 2
  );

  if (!isCommonTime) {
    if (deviceTrust.isTrusted) {
      score += 7;
      factors.push('unusual_time_trusted_device');
    } else {
      score += 15;
      factors.push('unusual_time_untrusted_device');
    }
  }

  if (hour >= 1 && hour <= 5) {
    if (deviceTrust.isTrusted) {
      score += 5;
    } else {
      score += 10;
      factors.push('late_night_login_untrusted');
    }
  }

  console.log(`[TimeRisk] Score: ${score}, Factors: ${factors.join(', ')}`);
  return { score, factors };
}

// ============================================================================
// Velocity Attack Detection
// ============================================================================

async function checkVelocityAttack(
  userId: string,
  context: {
    ipAddress: string;
    location: string;
    country: string;
    deviceFingerprint: string;
    loginTime: Date;
  }
) {
  let score = 0;
  const factors: string[] = [];

  const recentAttempts = await prisma.authLog.count({
    where: {
      userId,
      createdAt: {
        gte: new Date(Date.now() - 5 * 60 * 1000)
      }
    }
  });

  if (recentAttempts > 5) {
    score += 40;
    factors.push('velocity_attack');
    console.log(`[VelocityCheck] ⚠️ CRITICAL: ${recentAttempts} attempts in 5 minutes`);
  } else if (recentAttempts > 3) {
    score += 20;
    factors.push('rapid_login_attempts');
    console.log(`[VelocityCheck] ⚠️ Rapid attempts: ${recentAttempts} in 5 minutes`);
  }

  return { score, factors };
}

// ============================================================================
// Concurrent Session Detection
// ============================================================================

async function checkConcurrentSessions(
  userId: string,
  context: {
    ipAddress: string;
    location: string;
    country: string;
    deviceFingerprint: string;
    loginTime: Date;
  },
  deviceTrust: DeviceTrustInfo
) {
  let score = 0;
  const factors: string[] = [];

  const recentSessions = await prisma.userSession.findMany({
    where: {
      userId,
      isActive: true,
      lastUsed: {
        gte: new Date(Date.now() - 30 * 60 * 1000)
      }
    }
  });

  const countries = new Set(
    recentSessions
      .map((s) => s.country)
      .filter((c): c is string => c !== null && c !== 'Unknown')
  );
  
  if (countries.size > 1) {
    if (deviceTrust.isTrusted) {
      score += 30;
      factors.push('impossible_travel_trusted_device');
      console.log('[ConcurrentSessions] ⚠️ Impossible travel on trusted device');
    } else {
      score += 50;
      factors.push('impossible_travel_untrusted_device');
      console.log('[ConcurrentSessions] ⚠️ CRITICAL: Impossible travel on untrusted device');
    }
  }

  return { score, factors };
}