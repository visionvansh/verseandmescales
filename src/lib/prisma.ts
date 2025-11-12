// lib/prisma.ts
import { PrismaClient, Prisma } from '@prisma/client';

// Types for global augmentation
declare global {
  var prisma: PrismaClient | undefined;
}

// Create a singleton Prisma client with proper connection settings
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'info', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ],
  });
};

const prisma = globalThis.prisma || prismaClientSingleton();

// Type-safe event handler registration
type QueryEvent = {
  timestamp: Date;
  query: string;
  params: string;
  duration: number;
  target: string;
};

// Add event listeners for better debugging and monitoring
if (process.env.DEBUG_PRISMA === 'true') {
  prisma.$on('query', (e: QueryEvent) => {
    console.debug(`Query: ${e.query}`);
    console.debug(`Duration: ${e.duration}ms`);
  });
}

// Type for error events from Prisma
type PrismaErrorEvent = {
  timestamp: Date;
  message: string;
  target: string;
};

prisma.$on('error', (e: PrismaErrorEvent) => {
  console.error('Prisma error:', e);
});

// Keep the connection alive in development
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

// Ensure connections are released on exit
process.on('beforeExit', async () => {
  await prisma.$disconnect();
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

// Type for user creation data
type CreateUserData = Prisma.StudentCreateInput;

export const createUser = async (userData: CreateUserData) => {
  return await prisma.student.create({
    data: userData,
    include: {
      preferences: true,
      socialAccountsEver: true,
    }
  });
};

// Type for user update data
type UpdateUserData = Prisma.StudentUpdateInput;

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

// Type for session creation data
type CreateSessionData = Prisma.UserSessionCreateInput;

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

// Type for auth log event data
type CreateAuthLogData = Prisma.AuthLogCreateInput;

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

// Type for social account creation data
type CreateSocialAccountData = Omit<Prisma.UserSocialCreateInput, 'user'> & {
  userId?: string;
};

export const createSocialAccount = async (userId: string, socialData: CreateSocialAccountData) => {
  return await prisma.userSocial.create({
    data: {
      ...socialData,
      user: {
        connect: { id: userId }
      }
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