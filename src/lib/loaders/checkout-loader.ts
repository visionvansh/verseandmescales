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
 * ✅ IMPROVED: Load with partial caching (payment data never cached)
 */
export async function loadCompleteCheckoutData(
  courseId: string,
  userId: string
): Promise<AtomicCheckoutData> {
  const startTime = Date.now();
  console.log('⚡ Loading checkout data for:', courseId);

  try {
    // ✅ Get course data from cache if available
    const courseDetailKey = courseCacheKeys.courseDetail(courseId);
    let courseDetail;
    
    try {
      courseDetail = await getCachedData(
        courseDetailKey,
        () => fetchCourseForCheckout(courseId),
        COURSE_CACHE_TIMES.COURSE_DETAIL,
        true
      );
    } catch {
      // Fallback to direct fetch if cache fails
      courseDetail = await fetchCourseForCheckout(courseId);
    }

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
 * ✅ Fetch course data for checkout (cacheable)
 */
async function fetchCourseForCheckout(courseId: string) {
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

  const ownerPrimaryAvatar = course.user.avatars?.find((a) => a.isPrimary) || course.user.avatars?.[0] || null;

  return {
    course: {
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail,
      price: course.price,
      salePrice: course.salePrice,
      userId: course.userId,
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
 * ✅ Create payment intent (never cached)
 */
async function createPaymentIntent(courseId: string, userId: string, course: any) {
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

  if (course.userId === userId) {
    throw new Error('You cannot purchase your own course');
  }

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
      sellerId: course.userId,
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

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
  };
}