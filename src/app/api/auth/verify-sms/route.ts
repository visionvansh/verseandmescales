import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getClientInfo(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || '';
  return { ipAddress, userAgent };
}

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();
    const { ipAddress, userAgent } = getClientInfo(request);

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Phone number and verification code are required' },
        { status: 400 }
      );
    }

    // Find verification record
    const verification = await prisma.phoneVerification.findFirst({
      where: {
        phone,
        verified: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!verification) {
      await prisma.authLog.create({
        data: {
          email: phone,
          action: 'sms_verification_failed',
          ipAddress,
          userAgent,
          success: false,
          errorMessage: 'No valid verification found',
          details: { phone, reason: 'no_verification_found' },
          createdAt: new Date()
        }
      });

      return NextResponse.json(
        { error: 'No verification code found or code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if max attempts reached
    if (verification.attempts >= verification.maxAttempts) {
      await prisma.authLog.create({
        data: {
          email: phone,
          action: 'sms_verification_failed',
          ipAddress,
          userAgent,
          success: false,
          errorMessage: 'Max attempts reached',
          details: { phone, reason: 'max_attempts' },
          createdAt: new Date()
        }
      });

      return NextResponse.json(
        { error: 'Maximum verification attempts reached. Please request a new code.' },
        { status: 400 }
      );
    }

    // Increment attempts
    await prisma.phoneVerification.update({
      where: { id: verification.id },
      data: { 
        attempts: verification.attempts + 1,
        updatedAt: new Date()
      }
    });

    // Check if code is correct
    if (verification.code !== code) {
      await prisma.authLog.create({
        data: {
          email: phone,
          action: 'sms_verification_failed',
          ipAddress,
          userAgent,
          success: false,
          errorMessage: 'Invalid verification code',
          details: { 
            phone, 
            reason: 'invalid_code',
            attemptsRemaining: verification.maxAttempts - verification.attempts - 1
          },
          createdAt: new Date()
        }
      });

      return NextResponse.json(
        { 
          error: 'Invalid verification code',
          attemptsRemaining: verification.maxAttempts - verification.attempts - 1
        },
        { status: 400 }
      );
    }

    // Code is valid - mark as verified
    await prisma.$transaction(async (tx) => {
      // Mark verification as completed
      await tx.phoneVerification.update({
        where: { id: verification.id },
        data: { 
          verified: true,
          updatedAt: new Date()
        }
      });

      // Update student's phone verification status if student exists
      const student = await tx.student.findFirst({
        where: { phone }
      });

      if (student) {
        await tx.student.update({
          where: { id: student.id },
          data: { 
            phoneVerified: true,
            updatedAt: new Date()
          }
        });
      }

      // Log successful verification
      await tx.authLog.create({
        data: {
          userId: student?.id,
          email: phone,
          action: 'sms_verification_success',
          ipAddress,
          userAgent,
          success: true,
          details: { phone },
          createdAt: new Date()
        }
      });
    });

    return NextResponse.json({ 
      success: true,
      message: 'Phone number verified successfully' 
    });

  } catch (error) {
    console.error('Verify SMS error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}