import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err: any) {
      console.error('⚠️ Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    console.log('✅ Stripe webhook received:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'customer.created':
        console.log('Customer created:', event.data.object.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ Webhook handler error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('💰 Payment succeeded:', paymentIntent.id);

  try {
    const { courseId, buyerId, sellerId } = paymentIntent.metadata;

    if (!courseId || !buyerId || !sellerId) {
      console.error('Missing metadata in payment intent');
      return;
    }

    // Update payment record
    await prisma.payment.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: { 
        status: 'succeeded',
        updatedAt: new Date(),
      },
    });

    // Check if enrollment already exists
    const existingEnrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId: buyerId,
        },
      },
    });

    if (!existingEnrollment) {
      // Create enrollment
      await prisma.courseEnrollment.create({
        data: {
          courseId,
          userId: buyerId,
          status: 'active',
          progress: 0,
        },
      });

      console.log('✅ Enrollment created for user:', buyerId);
    }

    // Update seller earnings
    const amount = paymentIntent.amount / 100;
    const platformFee = parseFloat(paymentIntent.metadata.platformFee || '0');
    const sellerAmount = parseFloat(paymentIntent.metadata.sellerAmount || '0');

    await prisma.earnings.upsert({
      where: { userId: sellerId },
      create: {
        userId: sellerId,
        totalEarned: sellerAmount,
        availableBalance: sellerAmount,
        pendingBalance: 0,
        withdrawnAmount: 0,
      },
      update: {
        totalEarned: { increment: sellerAmount },
        availableBalance: { increment: sellerAmount },
      },
    });

    console.log('✅ Seller earnings updated:', sellerAmount);

    // Invalidate caches
    const { invalidateCourseCache, invalidateUserCache } = await import('@/lib/cache/course-cache');
    await invalidateCourseCache(courseId);
    await invalidateUserCache(buyerId);

  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('❌ Payment failed:', paymentIntent.id);

  try {
    await prisma.payment.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: { 
        status: 'failed',
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  console.log('🚫 Payment canceled:', paymentIntent.id);

  try {
    await prisma.payment.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: { 
        status: 'canceled',
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('💸 Charge refunded:', charge.id);

  try {
    const paymentIntentId = charge.payment_intent as string;

    if (!paymentIntentId) {
      console.error('No payment intent ID in refunded charge');
      return;
    }

    // Update payment status
    const payment = await prisma.payment.findFirst({
      where: { stripePaymentId: paymentIntentId },
    });

    if (!payment) {
      console.error('Payment not found for refund');
      return;
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { 
        status: 'refunded',
        refundedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Remove enrollment
    await prisma.courseEnrollment.deleteMany({
      where: {
        courseId: payment.courseId,
        userId: payment.buyerId,
      },
    });

    // Update seller earnings
    const sellerAmount = parseFloat(payment.sellerAmount.toString());

    await prisma.earnings.update({
      where: { userId: payment.sellerId },
      data: {
        totalEarned: { decrement: sellerAmount },
        availableBalance: { decrement: sellerAmount },
      },
    });

    console.log('✅ Refund processed successfully');

  } catch (error) {
    console.error('Error handling refund:', error);
  }
}