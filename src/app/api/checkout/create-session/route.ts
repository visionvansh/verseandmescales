// src/app/api/checkout/create-session/route.ts
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            stripeCustomerId: true,
          },
        },
        homepage: {
          select: {
            mainTitleLine1: true,
            mainTitleLine2: true,
            videoUrl: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    if (!course.isPublished) {
      return NextResponse.json(
        { error: 'Course is not published' },
        { status: 400 }
      );
    }

    const existingEnrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    if (course.userId === userId) {
      return NextResponse.json(
        { error: 'You cannot purchase your own course' },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
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
      return NextResponse.json(
        { error: 'Invalid course price' },
        { status: 400 }
      );
    }

    const amountInCents = Math.round(price * 100);
    const platformFee = calculatePlatformFee(amountInCents);
    const sellerAmount = calculateSellerAmount(amountInCents);

    // ✅ FIXED: Correct success URL with courseId
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: course.title,
              description: course.description || undefined,
              images: course.thumbnail ? [course.thumbnail] : undefined,
              metadata: {
                courseId: course.id,
                sellerId: course.userId,
              },
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // ✅ FIXED: Include courseId in success URL
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/users/courses/${courseId}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/users/courses/${courseId}`,
      metadata: {
        courseId,
        buyerId: userId,
        sellerId: course.userId,
        platformFee: platformFee.toString(),
        sellerAmount: sellerAmount.toString(),
      },
      payment_intent_data: {
        metadata: {
          courseId,
          buyerId: userId,
          sellerId: course.userId,
        },
      },
    });

    await prisma.payment.create({
      data: {
        stripeSessionId: session.id,
        stripePaymentId: session.payment_intent as string || `pending_${Date.now()}`,
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
      sessionId: session.id,
      url: session.url,
    });

  } catch (error: any) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}