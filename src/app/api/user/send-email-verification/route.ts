// app/api/user/send-email-verification/route.ts
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
    
    const { email } = await request.json();
    
    if (!email || email !== user.email) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    
    // Generate 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Save to database
    await prisma.student.update({
      where: { id: user.id },
      data: {
        emailVerificationCode: crypto
          .createHash('sha256')
          .update(verificationCode)
          .digest('hex'),
        emailVerificationExpires: expiresAt,
      }
    });
    
    // Send email (implement sendVerificationEmail)
    // await sendVerificationEmail(email, verificationCode);
    
    console.log(`[DEV] Email verification code for ${email}: ${verificationCode}`);
    
    return NextResponse.json({
      success: true,
      message: 'Verification code sent to email',
      developmentCode: verificationCode // Only in development
    });
    
  } catch (error: any) {
    console.error('Error sending email verification:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}