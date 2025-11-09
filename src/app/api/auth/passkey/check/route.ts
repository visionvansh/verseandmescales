//api/auth/passkey/check
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { available: false },
        { status: 200 }
      );
    }
    
    const user = await prisma.student.findUnique({
      where: { email: email.toLowerCase() },
      select: { 
        id: true, 
        biometricEnabled: true,
        biometricCredentials: {
          take: 1
        }
      }
    });
    
    const available = !!(user && user.biometricEnabled && user.biometricCredentials.length > 0);
    
    return NextResponse.json({ available });
  } catch (error) {
    console.error('Passkey check error:', error);
    return NextResponse.json(
      { available: false },
      { status: 200 }
    );
  }
}