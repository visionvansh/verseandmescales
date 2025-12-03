
import prisma from '@/lib/prisma';
import { getPayPalOrderDetails, capturePayPalOrder } from '@/lib/paypal';
import { stripe } from '@/lib/stripe';

interface AtomicSuccessData {
  course: any;
  enrollment: any;
  timestamp: number;
}

export async function loadCheckoutSuccessData(
  paymentId: string,
  userId: string,
  paymentMethod: 'stripe' | 'paypal'
): Promise<AtomicSuccessData> {
  const startTime = Date.now();
  console.log(`⚡ Starting ATOMIC success load for ${paymentMethod}:`, paymentId);

  try {
    let courseId: string;
    let sellerId: string;
    let amount: number;

    if (paymentMethod === 'paypal') {
      // Handle PayPal verification
      const orderDetails = await getPayPalOrderDetails(paymentId);

      if (!orderDetails) {
        throw new Error('Invalid PayPal order');
      }

      if (orderDetails.status === 'APPROVED') {
        console.log('📦 Capturing PayPal payment...');
        const captureResult = await capturePayPalOrder(paymentId);
        
        if (captureResult.status !== 'COMPLETED') {
          throw new Error(`Payment capture failed: ${captureResult.status}`);
        }
        
        orderDetails.status = captureResult.status;
      }

      if (orderDetails.status !== 'COMPLETED') {
        throw new Error(`Payment not completed: ${orderDetails.status}`);
      }

      const customData = JSON.parse(orderDetails.purchase_units[0].custom_id || '{}');
      courseId = customData.courseId || orderDetails.purchase_units[0].reference_id;
      sellerId = customData.sellerId;
      amount = parseFloat(orderDetails.purchase_units[0].amount.value);

      if (customData.buyerId !== userId) {
        throw new Error('Unauthorized access');
      }

      // Update payment record
      await prisma.payment.updateMany({
        where: { stripePaymentId: paymentId },
        data: { status: 'succeeded' },
      });
    } else {
      // Handle Stripe verification
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);

      if (paymentIntent.status !== 'succeeded') {
        throw new Error(`Payment not succeeded: ${paymentIntent.status}`);
      }

      courseId = paymentIntent.metadata.courseId;
      sellerId = paymentIntent.metadata.sellerId;
      amount = paymentIntent.amount / 100;

      if (paymentIntent.metadata.buyerId !== userId) {
        throw new Error('Unauthorized access');
      }

      // Update payment record
      await prisma.payment.updateMany({
        where: { stripePaymentId: paymentId },
        data: { status: 'succeeded' },
      });
    }

    if (!courseId) {
      throw new Error('Invalid course data');
    }

    // Check/create enrollment
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

    if (!enrollment) {
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
    }

    // Update last accessed
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

    // Invalidate caches
    const { invalidateCourseCache, invalidateUserCache, courseCacheKeys } = await import('@/lib/cache/course-cache');
    const { redis } = await import('@/lib/redis');
    
    console.log('🧹 Invalidating caches after enrollment...');
    
    await invalidateCourseCache(courseId);
    await invalidateUserCache(userId);
    await redis.del(courseCacheKeys.publicCourses());
    await redis.del(`${courseCacheKeys.publicCourses()}:${userId}`);
    
    console.log('✅ Caches invalidated successfully');

    const totalTime = Date.now() - startTime;
    console.log(`⚡ ATOMIC success load completed in ${totalTime}ms`);

    return {
      course: enrollment.course,
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        progress: enrollment.progress,
        enrolledAt: enrollment.enrolledAt,
      },
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('❌ Atomic success loader failed:', error);
    throw error;
  }
}