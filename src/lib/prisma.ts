// lib/prisma.ts
import { PrismaClient, Prisma } from '@prisma/client';

// Types for global augmentation
declare global {
  var prisma: PrismaClient | undefined;
}

// ✅ Export transaction client type
export type PrismaTx = Prisma.TransactionClient;

// Create a singleton Prisma client with proper connection settings
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error', 'warn'],
  });
};

// Create a typed Prisma client that includes the $transaction method
const prismaBase = globalThis.prisma || prismaClientSingleton();

// Create a wrapper that provides typed transactions
const prisma = prismaBase;

// Type-safe transaction wrapper
export const transaction = async <T>(
  fn: (tx: PrismaTx) => Promise<T>
): Promise<T> => {
  return await prismaBase.$transaction(fn);
};

// Keep the connection alive in development
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prismaBase;

// Ensure connections are released on exit
process.on('beforeExit', async () => {
  await prismaBase.$disconnect();
});

export default prisma;

// Helper functions that use the Prisma client
export const findUserByEmail = async (email: string) => {
  return await prisma.student.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      preferences: true,
      socialAccountsEver: true,
      sessions: {
        where: { isActive: true },
        orderBy: { lastUsed: 'desc' }
      }
    }
  });
};

export const findUserById = async (id: string) => {
  return await prisma.student.findUnique({
    where: { id },
    include: {
      preferences: true,
      socialAccountsEver: true,
    }
  });
};

export const findUserByUsername = async (username: string) => {
  return await prisma.student.findUnique({
    where: { username: username.toLowerCase() }
  });
};

// ✅ FIXED: Extract types from Prisma Client methods directly
export const createUser = async (userData: {
  username: string;
  email: string;
  password?: string | null;
  phone?: string | null;
  name?: string | null;
  surname?: string | null;
  img?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  twoFactorEnabled?: boolean;
  [key: string]: any; // Allow additional fields
}) => {
  return await prisma.student.create({
    data: userData,
    include: {
      preferences: true,
      socialAccountsEver: true,
    }
  });
};

// ✅ FIXED: Type for user update data - use inferred type
export const updateUser = async (id: string, userData: Partial<{
  username?: string;
  email?: string;
  password?: string | null;
  phone?: string | null;
  name?: string | null;
  surname?: string | null;
  img?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  twoFactorEnabled?: boolean;
  lastLogin?: Date;
  lastActiveAt?: Date;
  isOnline?: boolean;
  [key: string]: any;
}>) => {
  return await prisma.student.update({
    where: { id },
    data: userData,
    include: {
      preferences: true,
      socialAccountsEver: true,
    }
  });
};

// ✅ FIXED: Type for session creation data
export const createUserSession = async (sessionData: {
  userId: string;
  sessionToken: string;
  refreshToken: string;
  expiresAt: Date;
  deviceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  location?: string | null;
  country?: string | null;
  city?: string | null;
  sessionType?: string;
  isActive?: boolean;
}) => {
  return await prisma.userSession.create({
    data: sessionData
  });
};

export const findActiveSession = async (sessionToken: string) => {
  return await prisma.userSession.findFirst({
    where: {
      sessionToken,
      isActive: true,
      expiresAt: { gt: new Date() }
    },
    include: {
      user: {
        include: {
          preferences: true,
          socialAccountsEver: true,
        }
      }
    }
  });
};

// ✅ FIXED: Type for auth log event data
export const logAuthEvent = async (eventData: {
  action: string;
  ipAddress: string;
  userId?: string | null;
  email?: string | null;
  userAgent?: string | null;
  location?: string | null;
  country?: string | null;
  city?: string | null;
  deviceType?: string | null;
  browser?: string | null;
  success?: boolean;
  errorCode?: string | null;
  errorMessage?: string | null;
  details?: any;
  riskScore?: number | null;
  flagged?: boolean;
}) => {
  return await prisma.authLog.create({
    data: eventData
  });
};

// Additional helper for social accounts
export const findUserBySocialAccount = async (provider: string, providerId: string) => {
  return await prisma.student.findFirst({
    where: {
      socialAccountsEver: {
        some: {
          provider: provider,
          providerUserId: providerId
        }
      }
    },
    include: {
      preferences: true,
      socialAccountsEver: true,
    }
  });
};

// ✅ FIXED: Type for social account creation
export const createSocialAccount = async (
  userId: string, 
  socialData: {
    provider: string;
    providerUserId: string;
    providerUsername?: string | null;
    providerEmail?: string | null;
    accessToken?: string | null;
    refreshToken?: string | null;
    expiresAt?: Date | null;
    scope?: string | null;
    tokenType?: string;
    profileData?: any;
  }
) => {
  return await prisma.userSocial.create({
    data: {
      userId,
      ...socialData
    }
  });
};

// Helper for counting unused 2FA backup codes
export const countUnusedBackupCodes = async (userId: string) => {
  try {
    // Check if the model exists in Prisma client
    if (!('twoFactorBackupCode' in prisma)) {
      console.warn('The twoFactorBackupCode model is not available in Prisma client');
      return 0;
    }
    
    return await prisma.twoFactorBackupCode.count({
      where: {
        userId,
        used: false
      }
    });
  } catch (error) {
    console.error('Error counting backup codes:', error);
    return 0;
  }
};