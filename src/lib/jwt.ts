import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export interface JWTPayload {
  userId: string;
  email: string;
  deviceId?: string;
  type?: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export const generateAccessToken = (payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>): string => {
  return jwt.sign(
    { ...payload, type: 'access' },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );
};

export const generateRefreshToken = (payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>): string => {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '30d' }
  );
};

export const verifyAccessToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    if (decoded.type !== 'access') return null;
    return decoded;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JWTPayload;
    if (decoded.type !== 'refresh') return null;
    return decoded;
  } catch (error) {
    return null;
  }
};

export const extractTokenFromRequest = (request: NextRequest): string | null => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.substring(7);
};

export const getUserFromToken = (token: string): JWTPayload | null => {
  return verifyAccessToken(token);
};