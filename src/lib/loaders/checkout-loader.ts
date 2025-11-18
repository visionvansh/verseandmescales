// src/lib/loaders/checkout-loader.ts
import prisma from '@/lib/prisma';
import { createPayPalOrder, calculatePlatformFee, calculateSellerAmount } from '@/lib/paypal';

interface AtomicCheckoutData {
  course: any;
  owner: any;
  currentUserAvatars: any[];
  paypalOrderId: string;
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

    const paymentData = await createPayPalOrderForCourse(courseId, userId, courseDetail.course);

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

  console.log('[Checkout Loader] ✅ Creating PayPal order:', {
    courseId,
    buyerId: userId,
    sellerId,
  });

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

  // Create payment record
  await prisma.payment.create({
    data: {
      stripePaymentId: orderId, // Reusing this field for PayPal order ID
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

  console.log('✅ PayPal order created successfully:', {
    orderId,
    courseId,
    buyerId: userId,
    sellerId: sellerId,
    amount: price,
  });

  return {
    paypalOrderId: orderId,
  };
}