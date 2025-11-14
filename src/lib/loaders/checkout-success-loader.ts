// src/lib/loaders/checkout-success-loader.ts
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

interface AtomicSuccessData {
  course: any;
  enrollment: any;
  timestamp: number;
}

/**
 * ✅ ATOMIC LOADER: Verifies payment and loads success data
 */
export async function loadCheckoutSuccessData(
  paymentIntentId: string,
  userId: string
): Promise<AtomicSuccessData> {
  const startTime = Date.now();
  console.log('⚡ Starting ATOMIC success load for:', paymentIntentId);

  try {
    // ✅ Retrieve Payment Intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      throw new Error('Invalid payment intent');
    }

    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Payment not completed: ${paymentIntent.status}`);
    }

    const courseId = paymentIntent.metadata?.courseId;

    if (!courseId) {
      throw new Error('Invalid course data');
    }

    if (paymentIntent.metadata?.buyerId !== userId) {
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

      // Verify payment record
      const payment = await prisma.payment.findFirst({
        where: { stripePaymentId: paymentIntentId },
      });

      if (!payment) {
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