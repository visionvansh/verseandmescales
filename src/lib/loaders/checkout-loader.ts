import prisma from '@/lib/prisma';
import { createPayPalOrder, calculatePlatformFee, calculateSellerAmount } from '@/lib/paypal';
import { stripe } from '@/lib/stripe';

interface AtomicCheckoutData {
  course: any;
  owner: any;
  currentUserAvatars: any[];
  paypalOrderId: string;
  stripeClientSecret: string;
  stripePaymentIntentId: string;
  timestamp: number;
}

export async function loadCompleteCheckoutData(
  courseId: string,
  userId: string
): Promise<AtomicCheckoutData> {
  const startTime = Date.now();
  console.log('⚡ Loading checkout data for:', courseId);

  try {
    const courseDetail = await fetchCourseForCheckout(courseId);
    
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

    // Create both PayPal and Stripe payment intents
    const [paypalData, stripeData] = await Promise.all([
      createPayPalOrderForCourse(courseId, userId, courseDetail.course),
      createStripePaymentIntent(courseId, userId, courseDetail.course),
    ]);

    const totalTime = Date.now() - startTime;
    console.log(`⚡ Checkout data loaded in ${totalTime}ms`);

    return {
      ...courseDetail,
      currentUserAvatars,
      ...paypalData,
      ...stripeData,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('❌ Failed to load checkout data:', error);
    throw error;
  }
}

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
        },
      },
    },
  });

  if (!course) {
    throw new Error('Course not found');
  }

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
      userId: course.userId,
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

async function createPayPalOrderForCourse(courseId: string, userId: string, course: any) {
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

  if (sellerId === userId) {
    throw new Error('You cannot purchase your own course');
  }

  const buyer = await prisma.student.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  if (!buyer) {
    throw new Error('User not found');
  }

  const price = parseFloat(course.salePrice || course.price || '0');
  
  if (price <= 0) {
    throw new Error('Invalid course price');
  }

  const amountInCents = Math.round(price * 100);
  const platformFee = calculatePlatformFee(amountInCents);
  const sellerAmount = calculateSellerAmount(amountInCents);

  // Create PayPal order
  const { orderId } = await createPayPalOrder({
    amount: price,
    currency: 'USD',
    courseId,
    buyerId: userId,
    sellerId: sellerId,
    description: `Purchase: ${course.title}`,
  });

  console.log('✅ PayPal order created successfully:', orderId);

  return {
    paypalOrderId: orderId,
  };
}

async function createStripePaymentIntent(courseId: string, userId: string, course: any) {
  const sellerId = course.userId;

  if (!sellerId) {
    throw new Error('Invalid course: seller information missing');
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
    throw new Error('User not found');
  }

  const price = parseFloat(course.salePrice || course.price || '0');
  
  if (price <= 0) {
    throw new Error('Invalid course price');
  }

  const amountInCents = Math.round(price * 100);
  const platformFee = calculatePlatformFee(amountInCents);
  const sellerAmount = calculateSellerAmount(amountInCents);

  // Create or retrieve Stripe customer
  let customerId = buyer.stripeCustomerId;
  
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: buyer.email,
      name: buyer.name || undefined,
      metadata: {
        userId: buyer.id,
      },
    });
    
    customerId = customer.id;
    
    await prisma.student.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    });
  }

  // ✅ UPDATED: Create Payment Intent with ALL payment methods
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: 'usd',
    customer: customerId,
    
    // ✅ Option 1: Automatic payment methods (RECOMMENDED)
    automatic_payment_methods: {
      enabled: true,
      // Remove or change allow_redirects to allow more payment methods
      // allow_redirects: 'always', // Allows all methods including redirects
    },

    // ✅ Option 2: Explicit payment method types (if you want more control)
    // Comment out automatic_payment_methods above and use this instead:
    // payment_method_types: [
    //   'card',
    //   'cashapp',
    //   'link',
    //   'affirm',
    //   'us_bank_account',
    // ],

    metadata: {
      courseId,
      buyerId: userId,
      sellerId,
      courseTitle: course.title,
      platformFee: (platformFee / 100).toString(),
      sellerAmount: (sellerAmount / 100).toString(),
    },
    description: `Purchase: ${course.title}`,
    receipt_email: buyer.email,
    
    // ✅ Optional: Add statement descriptor for better UX
    statement_descriptor: 'Course Purchase',
    statement_descriptor_suffix: course.title.substring(0, 22), // Max 22 chars
  });

  // Create payment record
  await prisma.payment.create({
    data: {
      stripePaymentId: paymentIntent.id,
      amount: price,
      currency: 'USD',
      status: 'pending',
      paymentMethod: 'stripe',
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

  console.log('✅ Stripe payment intent created with payment methods:', {
    id: paymentIntent.id,
    available_methods: paymentIntent.payment_method_types,
  });

  return {
    stripeClientSecret: paymentIntent.client_secret!,
    stripePaymentIntentId: paymentIntent.id,
  };
}