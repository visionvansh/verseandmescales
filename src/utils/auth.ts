import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma'; // Import singleton Prisma client

interface TokenPayload {
  userId: string;
  sessionId?: string;
  exp?: number;
  iat?: number;
}

/**
 * Gets the authenticated user from either auth header or cookie
 * Extended for campaign platform with admin checks
 */
export async function getAuthUser(request: NextRequest) {
  try {
    let token = null;
    
    // Try to get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    
    // If no token in header, try to get from cookie
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get('auth-token')?.value;
    }
    
    if (!token) {
      return null;
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    
    // Check token expiration explicitly
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      console.warn(`Token expired for user ${decoded.userId}`);
      return null;
    }
    
    // Find user with essential info, including admin status
    const user = await prisma.student.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        name: true,
        surname: true,
        img: true,
        emailVerified: true,
        phoneVerified: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        lastLogin: true,
        loginAttempts: true,
        lockedUntil: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      console.warn(`User not found: ${decoded.userId}`);
      return null;
    }
    
    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      console.warn(`Account locked for user ${user.id} until ${user.lockedUntil}`);
      return null;
    }

    // Check if user is an admin
    const isAdmin = await prisma.admin.findUnique({
      where: { id: user.id }
    });

    // Add isAdmin flag to user object
    return {
      ...user,
      isAdmin: !!isAdmin
    };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.error(`JWT verification error: ${error.message}`);
    } else {
      console.error('Auth verification error:', error);
    }
    return null;
  }
}