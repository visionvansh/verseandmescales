// src/app/api/webhooks/paypal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getPayPalOrderDetails } from '@/lib/paypal';

export const dynamic = 'force-dynamic';

const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 PayPal webhook received:', body.event_type);

    // Verify webhook signature (optional but recommended)
    // Implementation depends on PayPal's webhook verification

    const eventType = body.event_type;

    // Handle different PayPal events
    switch (eventType) {
      case 'CHECKOUT.ORDER.APPROVED':
        await handleOrderApproved(body);
        break;

      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCaptured(body);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.REFUNDED':
        await handlePaymentFailed(body);
        break;

      default:
        console.log('⚠️ Unhandled PayPal event:', eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ PayPal webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleOrderApproved(event: any) {
  try {
    const orderId = event.resource.id;
    console.log('✅ Order approved:', orderId);

    // Get order details
    const orderDetails = await getPayPalOrderDetails(orderId);
    const customData = JSON.parse(orderDetails.purchase_units[0].custom_id || '{}');

    // Update payment status to approved (waiting for capture)
    await prisma.payment.updateMany({
      where: { stripePaymentId: orderId },
      data: { status: 'approved' },
    });

    console.log('✅ Payment status updated to approved');
  } catch (error) {
    console.error('❌ Error handling order approved:', error);
  }
}

async function handlePaymentCaptured(event: any) {
  try {
    const captureId = event.resource.id;
    const orderId = event.resource.supplementary_data?.related_ids?.order_id;
    
    console.log('✅ Payment captured:', { captureId, orderId });

    if (!orderId) {
      console.error('❌ No order ID in payment capture event');
      return;
    }

    // Get order details
    const orderDetails = await getPayPalOrderDetails(orderId);
    const customData = JSON.parse(orderDetails.purchase_units[0].custom_id || '{}');
    const courseId = customData.courseId;
    const buyerId = customData.buyerId;
    const sellerId = customData.sellerId;

    // Update payment status
    await prisma.payment.updateMany({
      where: { stripePaymentId: orderId },
      data: { status: 'succeeded' },
    });

    // Create enrollment if it doesn't exist
    const existingEnrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId: buyerId,
        },
      },
    });

    if (!existingEnrollment) {
      await prisma.courseEnrollment.create({
        data: {
          courseId,
          userId: buyerId,
          status: 'active',
          progress: 0,
        },
      });

      console.log('✅ Enrollment created via webhook');

      // Invalidate caches
      const { invalidateCourseCache, invalidateUserCache, courseCacheKeys } = await import('@/lib/cache/course-cache');
      const { redis } = await import('@/lib/redis');
      
      await invalidateCourseCache(courseId);
      await invalidateUserCache(buyerId);
      await redis.del(courseCacheKeys.publicCourses());
      await redis.del(`${courseCacheKeys.publicCourses()}:${buyerId}`);
    }

    console.log('✅ Payment capture handled successfully');
  } catch (error) {
    console.error('❌ Error handling payment captured:', error);
  }
}

async function handlePaymentFailed(event: any) {
  try {
    const orderId = event.resource.supplementary_data?.related_ids?.order_id;
    
    if (!orderId) {
      console.error('❌ No order ID in payment failed event');
      return;
    }

    console.log('❌ Payment failed/refunded:', orderId);

    // Update payment status
    await prisma.payment.updateMany({
      where: { stripePaymentId: orderId },
      data: { status: event.event_type.includes('REFUNDED') ? 'refunded' : 'failed' },
    });

    console.log('✅ Payment status updated to failed/refunded');
  } catch (error) {
    console.error('❌ Error handling payment failed:', error);
  }
}