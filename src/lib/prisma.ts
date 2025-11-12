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
    // Use stdout logging instead of events to avoid type issues
  });
};

// Create a typed Prisma client that includes the $transaction method
const prismaBase = globalThis.prisma || prismaClientSingleton();

// Create a wrapper that provides typed transactions
const prisma = prismaBase;

// Type-safe transaction wrapper - FIXED VERSION
export const transaction = async <T>(
  fn: (tx: PrismaTx) => Promise<T>
): Promise<T> => {
  return await prismaBase.$transaction(fn);
};

// Debug logging (optional - uncomment if needed)
// if (process.env.DEBUG_PRISMA === 'true') {
//   console.log('Prisma client initialized with debug mode');
// }

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

// ✅ FIXED: Use the correct Prisma type accessor
// The type should match your actual Prisma model name
type CreateUserData = Parameters<typeof prisma.student.create>[0]['data'];

export const createUser = async (userData: CreateUserData) => {
  return await prisma.student.create({
    data: userData,
    include: {
      preferences: true,
      socialAccountsEver: true,
    }
  });
};

// ✅ FIXED: Type for user update data
type UpdateUserData = Parameters<typeof prisma.student.update>[0]['data'];

export const updateUser = async (id: string, userData: UpdateUserData) => {
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
type CreateSessionData = Parameters<typeof prisma.userSession.create>[0]['data'];

export const createUserSession = async (sessionData: CreateSessionData) => {
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
type CreateAuthLogData = Parameters<typeof prisma.authLog.create>[0]['data'];

export const logAuthEvent = async (eventData: CreateAuthLogData) => {
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

// ✅ FIXED: Type for social account creation - using unchecked input
export const createSocialAccount = async (
  userId: string, 
  socialData: Omit<Parameters<typeof prisma.userSocial.create>[0]['data'], 'userId' | 'user'>
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