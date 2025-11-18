// src/lib/loaders/checkout-success-loader.ts
import prisma from '@/lib/prisma';
import { getPayPalOrderDetails, capturePayPalOrder } from '@/lib/paypal';

interface AtomicSuccessData {
  course: any;
  enrollment: any;
  timestamp: number;
}

/**
 * ✅ ATOMIC LOADER: Verifies PayPal payment and loads success data
 */
export async function loadCheckoutSuccessData(
  paypalOrderId: string,
  userId: string
): Promise<AtomicSuccessData> {
  const startTime = Date.now();
  console.log('⚡ Starting ATOMIC success load for PayPal order:', paypalOrderId);

  try {
    // ✅ Get PayPal order details
    const orderDetails = await getPayPalOrderDetails(paypalOrderId);

    if (!orderDetails) {
      throw new Error('Invalid PayPal order');
    }

    // ✅ Check if order is approved but not yet captured
    if (orderDetails.status === 'APPROVED') {
      console.log('📦 Capturing PayPal payment...');
      const captureResult = await capturePayPalOrder(paypalOrderId);
      
      if (captureResult.status !== 'COMPLETED') {
        throw new Error(`Payment capture failed: ${captureResult.status}`);
      }
      
      // Update order details with captured status
      orderDetails.status = captureResult.status;
    }

    if (orderDetails.status !== 'COMPLETED') {
      throw new Error(`Payment not completed: ${orderDetails.status}`);
    }

    // ✅ Extract metadata from custom_id
    const customData = JSON.parse(orderDetails.purchase_units[0].custom_id || '{}');
    const courseId = customData.courseId || orderDetails.purchase_units[0].reference_id;

    if (!courseId) {
      throw new Error('Invalid course data');
    }

    if (customData.buyerId !== userId) {
      throw new Error('Unauthorized access');
    }

    // ✅ Check/create enrollment
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

      // ✅ Update payment record to succeeded
      const payment = await prisma.payment.findFirst({
        where: { stripePaymentId: paypalOrderId }, // Using this field for PayPal order ID
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'succeeded' },
        });
      } else {
        // Create payment record if it doesn't exist
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
      }
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

    // ✅ Invalidate ALL related caches
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