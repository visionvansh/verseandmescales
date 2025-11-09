// app/api/user/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import  prisma  from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { email, code } = await request.json();
    
    if (!email || !code) {
      return NextResponse.json({ error: 'Missing email or code' }, { status: 400 });
    }
    
    // Get current user data
    const currentUser = await prisma.student.findUnique({
      where: { id: user.id }
    });
    
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if code is expired
    if (!currentUser.emailVerificationExpires || new Date() > currentUser.emailVerificationExpires) {
      return NextResponse.json({ error: 'Verification code expired' }, { status: 400 });
    }
    
    // Verify code
    const hashedInputCode = crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');
    
    if (hashedInputCode !== currentUser.emailVerificationCode) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }
    
    // Mark email as verified
    await prisma.student.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpires: null,
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Email verified successfully'
    });
    
  } catch (error: any) {
    console.error('Error verifying email:', error);
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}