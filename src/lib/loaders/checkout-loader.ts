// src/lib/loaders/checkout-loader.ts
import prisma from '@/lib/prisma';
import { getCachedData, courseCacheKeys, COURSE_CACHE_TIMES } from '@/lib/cache/course-cache';

interface AtomicCheckoutData {
  course: any;
  owner: any;
  currentUserAvatars: any[];
  clientSecret: string;
  paymentIntentId: string;
  timestamp: number;
}

/**
 * ✅ FIXED: Always fetch fresh course data for checkout (no cache)
 */
export async function loadCompleteCheckoutData(
  courseId: string,
  userId: string
): Promise<AtomicCheckoutData> {
  const startTime = Date.now();
  console.log('⚡ Loading checkout data for:', courseId);

  try {
    // ✅ FIX: Always fetch fresh course data for checkout (bypass cache)
    const courseDetail = await fetchCourseForCheckout(courseId);

    // ✅ Fetch current user's avatars (fresh, as it's user-specific)
    const currentUserAvatars = await prisma.avatar.findMany({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        avatarIndex: true,
        avatarSeed: true,
        avatarStyle: true,
        isPrimary: true,
        isCustomUpload: true,
        customImageUrl: true,
      },
    });

    // ✅ Always fetch fresh payment/enrollment data (never cached)
    const paymentData = await createPaymentIntent(courseId, userId, courseDetail.course);

    const totalTime = Date.now() - startTime;
    console.log(`⚡ Checkout data loaded in ${totalTime}ms`);

    return {
      ...courseDetail,
      currentUserAvatars,
      ...paymentData,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('❌ Failed to load checkout data:', error);
    throw error;
  }
}

/**
 * ✅ FIXED: Always fetch fresh from DB (no cache for checkout)
 */
async function fetchCourseForCheckout(courseId: string) {
  console.log('[Checkout Loader] 🔍 Fetching fresh course data from database...');
  
  const course = await prisma.course.findUnique({
    where: { 
      id: courseId,
      status: 'PUBLISHED',
      isPublished: true,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          surname: true,
          img: true,
          stripeCustomerId: true,
          avatars: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              avatarIndex: true,
              avatarSeed: true,
              avatarStyle: true,
              isPrimary: true,
              isCustomUpload: true,
              customImageUrl: true,
            },
          },
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
    throw new Error('Course not found');
  }

  // ✅ CRITICAL: Ensure userId is ALWAYS present
  if (!course.userId) {
    console.error('[Checkout Loader] ❌ CRITICAL: Course has no userId!', {
      courseId: course.id,
      courseTitle: course.title,
    });
    throw new Error('Invalid course: missing seller information');
  }

  const ownerPrimaryAvatar = course.user.avatars?.find((a) => a.isPrimary) || course.user.avatars?.[0] || null;

  console.log('[Checkout Loader] ✅ Course data fetched with seller:', {
    courseId: course.id,
    sellerId: course.userId,
    sellerEmail: course.user.email,
  });

  return {
    course: {
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail,
      price: course.price,
      salePrice: course.salePrice,
      userId: course.userId, // ✅ ALWAYS present
      stripeAccountId: course.user.earnings?.stripeAccountId,
    },
    owner: {
      id: course.user.id,
      username: course.user.username,
      name: course.user.name,
      surname: course.user.surname,
      fullName: `${course.user.name || ''} ${course.user.surname || ''}`.trim() || course.user.username || 'Anonymous',
      img: course.user.img,
      primaryAvatar: ownerPrimaryAvatar,
      avatars: course.user.avatars || [],
    },
  };
}

/**
 * ✅ FIXED: Simplified - seller ID is guaranteed from fresh fetch
 */
async function createPaymentIntent(courseId: string, userId: string, course: any) {
  // ✅ Seller ID is now guaranteed to exist from fresh fetch
  const sellerId = course.userId;

  if (!sellerId) {
    console.error('[Checkout Loader] ❌ CRITICAL: No seller ID after fresh fetch!');
    throw new Error('Invalid course: seller information missing');
  }

  // Check enrollment
  const existingEnrollment = await prisma.courseEnrollment.findUnique({
    where: {
      courseId_userId: {
        courseId,
        userId,
      },
    },
  });

  if (existingEnrollment) {
    throw new Error('Already enrolled in this course');
  }

  // ✅ VALIDATION: Cannot buy own course
  if (sellerId === userId) {
    throw new Error('You cannot purchase your own course');
  }

  console.log('[Checkout Loader] ✅ Creating payment intent:', {
    courseId,
    buyerId: userId,
    sellerId,
  });

  // Get buyer
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
    throw new Error('User not found');
  }

  // Create/get Stripe customer
  const stripe = require('@/lib/stripe').stripe;
  let stripeCustomerId = buyer.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: buyer.email,
      name: buyer.name || undefined,
      metadata: { userId: buyer.id },
    });

    stripeCustomerId = customer.id;

    await prisma.student.update({
      where: { id: buyer.id },
      data: { stripeCustomerId },
    });
  }

  // Create payment intent
  const price = parseFloat(course.salePrice || course.price || '0');
  
  if (price <= 0) {
    throw new Error('Invalid course price');
  }

  const amountInCents = Math.round(price * 100);
  const { calculatePlatformFee, calculateSellerAmount } = require('@/lib/stripe');
  const platformFee = calculatePlatformFee(amountInCents);
  const sellerAmount = calculateSellerAmount(amountInCents);

  const paymentIntentParams: any = {
    amount: amountInCents,
    currency: 'usd',
    customer: stripeCustomerId,
    metadata: {
      courseId,
      buyerId: userId,
      sellerId: sellerId,
      platformFee: platformFee.toString(),
      sellerAmount: sellerAmount.toString(),
    },
    description: `Purchase: ${course.title}`,
  };

  if (course.stripeAccountId) {
    paymentIntentParams.application_fee_amount = platformFee;
    paymentIntentParams.transfer_data = {
      destination: course.stripeAccountId,
    };
  }

  const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

  // ✅ Create payment record
  await prisma.payment.create({
    data: {
      stripePaymentId: paymentIntent.id,
      amount: price,
      currency: 'USD',
      status: 'pending',
      course: {
        connect: { id: courseId }
      },
      buyer: {
        connect: { id: userId }
      },
      seller: {
        connect: { id: sellerId }
      },
      platformFee: platformFee / 100,
      sellerAmount: sellerAmount / 100,
      customerEmail: buyer.email,
    },
  });

  console.log('✅ Payment intent created successfully:', {
    paymentIntentId: paymentIntent.id,
    courseId,
    buyerId: userId,
    sellerId: sellerId,
    amount: price,
  });

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
  };
}