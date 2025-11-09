// src/app/api/checkout/create-payment-intent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { stripe, calculatePlatformFee, calculateSellerAmount } from '@/lib/stripe';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Fetch course with seller info
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            stripeCustomerId: true,
            earnings: {
              select: {
                stripeAccountId: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (!course.isPublished) {
      return NextResponse.json({ error: 'Course is not published' }, { status: 400 });
    }

    // Check existing enrollment
    const existingEnrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json({ error: 'Already enrolled in this course' }, { status: 400 });
    }

    if (course.userId === userId) {
      return NextResponse.json({ error: 'You cannot purchase your own course' }, { status: 400 });
    }

    // Get or create buyer's Stripe customer
    const buyer = await prisma.student.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        stripeCustomerId: true,
      },
    });

    if (!buyer) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let stripeCustomerId = buyer.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: buyer.email,
        name: buyer.name || undefined,
        metadata: {
          userId: buyer.id,
        },
      });

      stripeCustomerId = customer.id;

      await prisma.student.update({
        where: { id: buyer.id },
        data: { stripeCustomerId },
      });
    }

    const price = parseFloat(course.salePrice || course.price || '0');
    
    if (price <= 0) {
      return NextResponse.json({ error: 'Invalid course price' }, { status: 400 });
    }

    const amountInCents = Math.round(price * 100);
    const platformFee = calculatePlatformFee(amountInCents);
    const sellerAmount = calculateSellerAmount(amountInCents);

    // Create payment intent with application fee (if seller has Stripe Connect)
    const paymentIntentParams: any = {
      amount: amountInCents,
      currency: 'usd',
      customer: stripeCustomerId,
      metadata: {
        courseId,
        buyerId: userId,
        sellerId: course.userId,
        platformFee: platformFee.toString(),
        sellerAmount: sellerAmount.toString(),
      },
      description: `Purchase: ${course.title}`,
    };

    // If seller has Stripe Connect, use destination charges
    if (course.user.earnings?.stripeAccountId) {
      paymentIntentParams.application_fee_amount = platformFee;
      paymentIntentParams.transfer_data = {
        destination: course.user.earnings.stripeAccountId,
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    // Create payment record
    await prisma.payment.create({
      data: {
        stripePaymentId: paymentIntent.id,
        amount: price,
        currency: 'USD',
        status: 'pending',
        courseId,
        buyerId: userId,
        sellerId: course.userId,
        platformFee: platformFee / 100,
        sellerAmount: sellerAmount / 100,
        customerEmail: buyer.email,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error: any) {
    console.error('Payment intent creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}