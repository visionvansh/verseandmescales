// src/app/api/checkout/verify-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Starting payment verification...');
    
    // ✅ Get authenticated user
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      console.error('❌ No auth token found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;
    console.log('✅ User authenticated:', userId);

    // ✅ FIXED: Get paymentIntentId instead of sessionId
    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      console.error('❌ No payment intent ID provided');
      return NextResponse.json(
        { error: 'Payment Intent ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Retrieving payment intent:', paymentIntentId);

    // ✅ FIXED: Retrieve Payment Intent instead of Session
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      console.error('❌ Payment intent not found');
      return NextResponse.json(
        { error: 'Invalid payment intent' },
        { status: 404 }
      );
    }

    console.log('✅ Payment intent retrieved:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
    });

    // ✅ Verify payment status
    if (paymentIntent.status !== 'succeeded') {
      console.warn('⚠️ Payment not succeeded:', paymentIntent.status);
      return NextResponse.json(
        { error: 'Payment not completed', success: false, status: paymentIntent.status },
        { status: 400 }
      );
    }

    // ✅ Get course ID from metadata
    const courseId = paymentIntent.metadata?.courseId;

    if (!courseId) {
      console.error('❌ No course ID in payment metadata');
      return NextResponse.json(
        { error: 'Invalid course data' },
        { status: 400 }
      );
    }

    console.log('✅ Course ID from metadata:', courseId);

    // ✅ Verify user matches the buyer
    if (paymentIntent.metadata?.buyerId !== userId) {
      console.error('❌ User mismatch:', {
        expected: paymentIntent.metadata?.buyerId,
        actual: userId,
      });
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    console.log('✅ User matches buyer');

    // ✅ Check if enrollment already exists
    let enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            description: true,
          },
        },
      },
    });

    // ✅ If enrollment doesn't exist, create it (webhook safety net)
    if (!enrollment) {
      console.warn('⚠️ Enrollment not found, creating now (webhook may have failed)');
      
      enrollment = await prisma.courseEnrollment.create({
        data: {
          courseId,
          userId,
          status: 'active',
          progress: 0,
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              description: true,
            },
          },
        },
      });

      console.log('✅ Enrollment created:', enrollment.id);

      // ✅ Also verify payment record exists
      const payment = await prisma.payment.findFirst({
        where: {
          stripePaymentId: paymentIntentId,
        },
      });

      if (!payment) {
        console.error('❌ Payment record not found, creating it...');
        
        // Create payment record if webhook failed
        const amount = paymentIntent.amount / 100;
        const platformFee = parseFloat(paymentIntent.metadata?.platformFee || '0') / 100;
        const sellerAmount = parseFloat(paymentIntent.metadata?.sellerAmount || '0') / 100;

        await prisma.payment.create({
          data: {
            stripePaymentId: paymentIntentId,
            amount,
            currency: paymentIntent.currency.toUpperCase(),
            status: 'succeeded',
            courseId,
            buyerId: userId,
            sellerId: paymentIntent.metadata?.sellerId || '',
            platformFee,
            sellerAmount,
            customerEmail: paymentIntent.receipt_email || '',
          },
        });

        console.log('✅ Payment record created');
      }
    } else {
      console.log('✅ Enrollment already exists:', enrollment.id);
    }

    // ✅ Update last accessed time
    await prisma.courseEnrollment.update({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
      data: {
        lastAccessedAt: new Date(),
      },
    });

    console.log('✅ Verification complete, returning success');

    return NextResponse.json({
      success: true,
      course: enrollment.course,
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        progress: enrollment.progress,
        enrolledAt: enrollment.enrolledAt,
      },
    });

  } catch (error: any) {
    console.error('❌ Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment', success: false },
      { status: 500 }
    );
  }
}