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
    // Connection pool settings via connection string in .env
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
  prisma.$on('query' as never, (e: QueryEvent) => {
    console.debug(`Query: ${e.query}`);
    console.debug(`Duration: ${e.duration}ms`);
  });
}

prisma.$on('error' as never, (e: Error) => {
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

export const createUser = async (userData: any) => {
  return await prisma.student.create({
    data: userData,
    include: {
      preferences: true,
      socialAccountsEver: true,
    }
  });
};

export const updateUser = async (id: string, userData: any) => {
  return await prisma.student.update({
    where: { id },
    data: userData,
    include: {
      preferences: true,
      socialAccountsEver: true,
    }
  });
};

export const createUserSession = async (sessionData: any) => {
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

export const logAuthEvent = async (eventData: any) => {
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

export const createSocialAccount = async (userId: string, socialData: any) => {
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
    if (typeof prisma.twoFactorBackupCode === 'undefined') {
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