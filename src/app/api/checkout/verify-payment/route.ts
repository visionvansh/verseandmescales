// src/app/api/checkout/verify-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { getPayPalOrderDetails, capturePayPalOrder } from '@/lib/paypal';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Starting PayPal payment verification...');
    
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

    // ✅ Get PayPal order ID
    const { paypalOrderId } = await request.json();

    if (!paypalOrderId) {
      console.error('❌ No PayPal order ID provided');
      return NextResponse.json(
        { error: 'PayPal Order ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Retrieving PayPal order:', paypalOrderId);

    // ✅ Get PayPal order details
    const orderDetails = await getPayPalOrderDetails(paypalOrderId);

    if (!orderDetails) {
      console.error('❌ PayPal order not found');
      return NextResponse.json(
        { error: 'Invalid PayPal order' },
        { status: 404 }
      );
    }

    console.log('✅ PayPal order retrieved:', {
      id: orderDetails.id,
      status: orderDetails.status,
      amount: orderDetails.purchase_units[0].amount.value,
    });

    // ✅ Capture payment if approved but not yet captured
    if (orderDetails.status === 'APPROVED') {
      console.log('📦 Capturing PayPal payment...');
      const captureResult = await capturePayPalOrder(paypalOrderId);
      
      if (captureResult.status !== 'COMPLETED') {
        console.warn('⚠️ Payment capture failed:', captureResult.status);
        return NextResponse.json(
          { error: 'Payment capture failed', success: false, status: captureResult.status },
          { status: 400 }
        );
      }
      
      orderDetails.status = captureResult.status;
    }

    // ✅ Verify payment status
    if (orderDetails.status !== 'COMPLETED') {
      console.warn('⚠️ Payment not completed:', orderDetails.status);
      return NextResponse.json(
        { error: 'Payment not completed', success: false, status: orderDetails.status },
        { status: 400 }
      );
    }

    // ✅ Get course ID from metadata
    const customData = JSON.parse(orderDetails.purchase_units[0].custom_id || '{}');
    const courseId = customData.courseId || orderDetails.purchase_units[0].reference_id;

    if (!courseId) {
      console.error('❌ No course ID in order metadata');
      return NextResponse.json(
        { error: 'Invalid course data' },
        { status: 400 }
      );
    }

    console.log('✅ Course ID from metadata:', courseId);

    // ✅ Verify user matches the buyer
    if (customData.buyerId !== userId) {
      console.error('❌ User mismatch:', {
        expected: customData.buyerId,
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

    // ✅ If enrollment doesn't exist, create it
    if (!enrollment) {
      console.warn('⚠️ Enrollment not found, creating now...');
      
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

      // ✅ Verify payment record exists
      const payment = await prisma.payment.findFirst({
        where: {
          stripePaymentId: paypalOrderId,
        },
      });

      if (!payment) {
        console.error('❌ Payment record not found, creating it...');
        
        const amount = parseFloat(orderDetails.purchase_units[0].amount.value);
        const platformFee = parseFloat(customData.platformFee || '0');
        const sellerAmount = parseFloat(customData.sellerAmount || '0');

        await prisma.payment.create({
          data: {
            stripePaymentId: paypalOrderId,
            amount,
            currency: orderDetails.purchase_units[0].amount.currency_code,
            status: 'succeeded',
            courseId,
            buyerId: userId,
            sellerId: customData.sellerId || '',
            platformFee,
            sellerAmount,
            customerEmail: orderDetails.payer?.email_address || '',
            paymentMethod: 'paypal',
          },
        });

        console.log('✅ Payment record created');
      } else {
        // Update existing payment to succeeded
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'succeeded' },
        });
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