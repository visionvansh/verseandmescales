// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Webhook signature verification failed:', errorMessage);
      return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
    }

    console.log(`✅ Webhook received: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object as Stripe.Charge);
        break;

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      case 'payout.paid':
        await handlePayoutPaid(event.data.object as Stripe.Payout);
        break;

      case 'payout.failed':
        await handlePayoutFailed(event.data.object as Stripe.Payout);
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Type definitions for Prisma transaction
type PrismaTx = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { courseId, buyerId, sellerId, platformFee, sellerAmount } = paymentIntent.metadata;

  try {
    await prisma.$transaction(async (tx: PrismaTx) => {
      // Update payment status
      await tx.payment.updateMany({
        where: { stripePaymentId: paymentIntent.id },
        data: { status: 'succeeded' },
      });

      // Create enrollment
      await tx.courseEnrollment.upsert({
        where: {
          courseId_userId: {
            courseId,
            userId: buyerId,
          },
        },
        create: {
          courseId,
          userId: buyerId,
          status: 'active',
          progress: 0,
        },
        update: {
          status: 'active',
          lastAccessedAt: new Date(),
        },
      });

      // Update seller earnings
      const sellerAmountDecimal = parseFloat(sellerAmount) / 100;

      await tx.earnings.upsert({
        where: { userId: sellerId },
        create: {
          userId: sellerId,
          totalEarned: sellerAmountDecimal,
          availableBalance: sellerAmountDecimal,
          pendingBalance: 0,
          withdrawnAmount: 0,
        },
        update: {
          totalEarned: { increment: sellerAmountDecimal },
          availableBalance: { increment: sellerAmountDecimal },
        },
      });
    });

    console.log('✅ Payment processed successfully');
  } catch (error: unknown) {
    console.error('❌ Error processing payment:', error);
    throw error;
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    await prisma.payment.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: { status: 'failed' },
    });
    console.log('⚠️ Payment failed:', paymentIntent.id);
  } catch (error: unknown) {
    console.error('❌ Error handling payment failure:', error);
  }
}

async function handleRefund(charge: Stripe.Charge) {
  try {
    const payment = await prisma.payment.findFirst({
      where: { stripePaymentId: charge.payment_intent as string },
    });

    if (!payment) {
      console.warn('⚠️ Payment not found for refund');
      return;
    }

    await prisma.$transaction(async (tx: PrismaTx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'refunded',
          refundedAt: new Date(),
        },
      });

      await tx.courseEnrollment.updateMany({
        where: {
          courseId: payment.courseId,
          userId: payment.buyerId,
        },
        data: { status: 'cancelled' },
      });

      await tx.earnings.update({
        where: { userId: payment.sellerId },
        data: {
          availableBalance: { decrement: payment.sellerAmount },
          totalEarned: { decrement: payment.sellerAmount },
        },
      });
    });

    console.log('✅ Refund processed:', charge.id);
  } catch (error: unknown) {
    console.error('❌ Error handling refund:', error);
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  try {
    const userId = account.metadata?.userId;
    if (!userId) return;

    const status = account.charges_enabled && account.payouts_enabled ? 'active' : 'pending';

    await prisma.earnings.updateMany({
      where: { stripeAccountId: account.id },
      data: { stripeAccountStatus: status },
    });

    console.log(`✅ Account updated: ${account.id} - Status: ${status}`);
  } catch (error: unknown) {
    console.error('❌ Error updating account:', error);
  }
}

async function handlePayoutPaid(payout: Stripe.Payout) {
  try {
    await prisma.withdrawal.updateMany({
      where: { stripePayoutId: payout.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    console.log('✅ Payout completed:', payout.id);
  } catch (error: unknown) {
    console.error('❌ Error handling payout:', error);
  }
}

async function handlePayoutFailed(payout: Stripe.Payout) {
  try {
    const withdrawal = await prisma.withdrawal.findFirst({
      where: { stripePayoutId: payout.id },
      include: { earnings: true },
    });

    if (!withdrawal) return;

    await prisma.$transaction(async (tx: PrismaTx) => {
      // Mark withdrawal as failed
      await tx.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status: 'failed',
          failureReason: payout.failure_message || 'Payout failed',
        },
      });

      // Refund balance to user
      await tx.earnings.update({
        where: { id: withdrawal.earningsId },
        data: {
          availableBalance: { increment: withdrawal.amount },
          withdrawnAmount: { decrement: withdrawal.amount },
        },
      });
    });

    console.log('⚠️ Payout failed:', payout.id);
  } catch (error: unknown) {
    console.error('❌ Error handling payout failure:', error);
  }
}