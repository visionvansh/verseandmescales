//Volumes/vision/codes/course/my-app/src/app/users/courses/[id]/checkout/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaLock,
  FaCheckCircle,
  FaChevronLeft,
  FaCreditCard,
  FaShieldAlt,
  FaShoppingCart,
} from "react-icons/fa";
import Image from "next/image";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import AvatarGenerator from "@/components/settings/AvatarGenerator";
import { useAuth } from "@/contexts/AuthContext";
import StripeCheckoutForm from "@/components/checkout/StripeCheckoutForm";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface UserAvatar {
  id: string;
  avatarIndex: number;
  avatarSeed: string;
  avatarStyle: string;
  isPrimary: boolean;
  isCustomUpload: boolean;
  customImageUrl: string | null;
}

const ProfileAvatar = ({
  customImage,
  avatar,
  userId,
  size = 48,
  className = "",
}: {
  customImage?: string | null;
  avatar?: UserAvatar | null;
  userId: string;
  size?: number;
  className?: string;
}) => {
  if (customImage) {
    return (
      <Image
        src={customImage}
        alt="Profile"
        width={size}
        height={size}
        className={`object-cover rounded-full ${className}`}
        unoptimized
      />
    );
  }

  if (avatar?.isCustomUpload && avatar.customImageUrl) {
    return (
      <Image
        src={avatar.customImageUrl}
        alt="Profile"
        width={size}
        height={size}
        className={`object-cover rounded-full ${className}`}
        unoptimized
      />
    );
  }

  if (
    avatar &&
    typeof avatar.avatarIndex === "number" &&
    avatar.avatarIndex >= 0
  ) {
    return (
      <AvatarGenerator
        userId={userId}
        avatarIndex={avatar.avatarIndex}
        size={size}
        style={(avatar.avatarStyle || "avataaars") as "avataaars"}
        className={`rounded-full ${className}`}
      />
    );
  }

  return (
    <AvatarGenerator
      userId={userId}
      avatarIndex={-1}
      size={size}
      useDefault={true}
      className={`rounded-full ${className}`}
    />
  );
};

const CheckoutSkeleton = () => {
  return (
    <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-4 sm:py-6 md:py-8 lg:py-12 mt-20">
      <div className="max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
        <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
          <div className="h-12 sm:h-16 md:h-20 lg:h-24 w-full max-w-2xl bg-gray-800/40 rounded-xl sm:rounded-2xl animate-pulse mb-4 sm:mb-6" />
        </div>

        <div className="mb-4 sm:mb-6 h-6 sm:h-8 w-24 sm:w-32 bg-gray-800/40 rounded-lg animate-pulse" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
          <div className="lg:col-span-7 space-y-3 sm:space-y-4 md:space-y-5">
            <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/20">
              <div className="p-3 sm:p-4 md:p-5 lg:p-6 space-y-3 sm:space-y-4">
                <div className="aspect-video rounded-lg bg-gray-800/40 animate-pulse" />
                <div className="h-5 sm:h-6 w-3/4 bg-gray-800/40 rounded-lg animate-pulse" />
                <div className="h-3 sm:h-4 w-full bg-gray-800/40 rounded animate-pulse" />
                <div className="flex items-center gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-red-500/20">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gray-800/40 flex-shrink-0 animate-pulse" />
                  <div className="h-3 sm:h-4 w-20 sm:w-24 bg-gray-800/40 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-6">
              <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/20">
                <div className="p-3 sm:p-4 md:p-5 lg:p-6 space-y-3 sm:space-y-4">
                  <div className="h-6 sm:h-8 w-32 sm:w-40 bg-gray-800/40 rounded-lg animate-pulse" />
                  <div className="space-y-2 sm:space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-10 sm:h-12 bg-gray-800/40 rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                  <div className="h-24 sm:h-32 bg-gray-800/40 rounded-xl animate-pulse" />
                  <div className="h-10 sm:h-12 bg-gray-800/40 rounded-xl animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// PayPal Buttons Component
function PayPalCheckoutButtons({
  paypalOrderId,
  courseData,
  price,
}: {
  paypalOrderId: string;
  courseData: any;
  price: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3 sm:space-y-4">
      <PayPalButtons
        createOrder={() => Promise.resolve(paypalOrderId)}
        onApprove={async (data) => {
          try {
            router.push(`/users/courses/${courseData.id}/checkout/success?token=${data.orderID}&method=paypal`);
          } catch (err: any) {
            console.error('Payment approval error:', err);
            setError('Payment processing failed. Please contact support.');
          }
        }}
        onError={(err) => {
          console.error('PayPal error:', err);
          setError('Payment failed. Please try again.');
        }}
        onCancel={() => {
          setError('Payment was cancelled. You can try again.');
        }}
        style={{
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal',
          height: 48,
        }}
        fundingSource="paypal"
      />

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-900/30 rounded-lg border border-red-500/30 p-2.5 sm:p-3 md:p-4 flex items-start gap-2"
          >
            <p className="text-red-300 text-xs sm:text-sm font-medium">
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function useAtomicCheckoutData(courseId: string) {
  const [data, setData] = useState<{
    courseData: any;
    owner: any;
    currentUserAvatars: any[];
    paypalOrderId: string | null;
    stripeClientSecret: string | null;
    stripePaymentIntentId: string | null;
    loading: boolean;
    error: string | null;
  }>({
    courseData: null,
    owner: null,
    currentUserAvatars: [],
    paypalOrderId: null,
    stripeClientSecret: null,
    stripePaymentIntentId: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadAtomic() {
      try {
        console.log('⚡ Loading atomic checkout data...');
        const startTime = Date.now();

        const response = await fetch(`/api/atomic/checkout/${courseId}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || errorData.error || 'Failed to load checkout');
        }

        const atomicData = await response.json();
        const loadTime = Date.now() - startTime;

        console.log(`⚡ Atomic checkout data loaded in ${loadTime}ms`);

        if (isMounted) {
          setData({
            courseData: {
              id: atomicData.course.id,
              title: atomicData.course.title,
              description: atomicData.course.description,
              thumbnail: atomicData.course.thumbnail,
              price: atomicData.course.price,
              salePrice: atomicData.course.salePrice,
              user: atomicData.owner,
            },
            owner: atomicData.owner,
            currentUserAvatars: atomicData.currentUserAvatars || [],
            paypalOrderId: atomicData.paypalOrderId,
            stripeClientSecret: atomicData.stripeClientSecret,
            stripePaymentIntentId: atomicData.stripePaymentIntentId,
            loading: false,
            error: null,
          });

          console.log('✅ Atomic checkout data set, page ready to render');
        }
      } catch (error) {
        console.error('❌ Atomic checkout load error:', error);
        if (isMounted) {
          setData({
            courseData: null,
            owner: null,
            currentUserAvatars: [],
            paypalOrderId: null,
            stripeClientSecret: null,
            stripePaymentIntentId: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load checkout',
          });
        }
      }
    }

    if (courseId) {
      loadAtomic();
    }

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  return data;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  
  const { user, checkAuthStatus } = useAuth();

  const { 
    courseData, 
    currentUserAvatars, 
    paypalOrderId, 
    stripeClientSecret,
    stripePaymentIntentId,
    loading, 
    error 
  } = useAtomicCheckoutData(courseId);

  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const handleReturnFromSignup = async () => {
      const shouldForceCheck = sessionStorage.getItem('force_auth_check_on_return');
      const authConfirmed = sessionStorage.getItem('auth_confirmed');
      
      if (authConfirmed === 'true') {
        console.log('[Checkout] ✅ Auth already confirmed, no need to check');
        sessionStorage.removeItem('auth_confirmed');
        setAuthChecked(true);
        return;
      }
      
      if (shouldForceCheck) {
        console.log('[Checkout] 🔄 Forcing auth check after signup');
        sessionStorage.removeItem('force_auth_check_on_return');
        await new Promise(resolve => setTimeout(resolve, 500));
        await checkAuthStatus(true);
        setAuthChecked(true);
      } else {
        await checkAuthStatus();
        setAuthChecked(true);
      }
    };

    handleReturnFromSignup();
  }, [checkAuthStatus]);

  useEffect(() => {
    const handleAuthCheck = async () => {
      const authConfirmed = sessionStorage.getItem('auth_confirmed');
      const forceCheck = sessionStorage.getItem('force_auth_check_on_return');
      
      if (authConfirmed === 'true') {
        console.log('[Checkout] ✅ Auth confirmed from signup, skipping redirect');
        sessionStorage.removeItem('auth_confirmed');
        sessionStorage.removeItem('force_auth_check_on_return');
        return;
      }
      
      if (forceCheck === 'true') {
        console.log('[Checkout] 🔄 Force checking auth from signup');
        sessionStorage.removeItem('force_auth_check_on_return');
        await new Promise(resolve => setTimeout(resolve, 500));
        await checkAuthStatus(true);
        return;
      }
      
      if (authChecked && !user) {
        try {
          const response = await fetch('/api/auth/me', {
            credentials: 'include',
            cache: 'no-store',
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.user) {
              console.log('[Checkout] ✅ Found user on double-check');
              await checkAuthStatus(true);
              return;
            }
          }
        } catch (error) {
          console.error('[Checkout] Double-check error:', error);
        }
        
        console.log('[Checkout] ❌ Not authenticated after all checks, redirecting to login');
        router.push(`/auth/login?redirect=${encodeURIComponent(`/users/courses/${courseId}/checkout`)}`);
      }
    };

    handleAuthCheck();
  }, [authChecked, user, router, courseId, checkAuthStatus]);

  if (!authChecked || loading) {
    return <CheckoutSkeleton />;
  }

  if (error || !courseData || (!paypalOrderId && !stripeClientSecret)) {
    return (
      <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-6 md:py-8 lg:py-10 mt-20">
        <div className="max-w-2xl mx-auto">
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-red-500/30 bg-gradient-to-br from-gray-900/90 to-black/95 backdrop-blur-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent" />

            <div className="relative p-4 sm:p-6 md:p-8 lg:p-10 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6">
                <FaShieldAlt className="text-red-400 text-xl sm:text-2xl md:text-3xl" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3 md:mb-4">
                Error Loading Checkout
              </h1>
              <p className="text-gray-400 mb-4 sm:mb-6 md:mb-8 text-xs sm:text-sm md:text-base">
                {error || "Failed to load checkout"}
              </p>
              <button
                onClick={() => router.back()}
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl hover:scale-105 transition-transform font-bold text-xs sm:text-sm md:text-base inline-flex items-center gap-2"
              >
                <FaChevronLeft />
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const price = courseData.salePrice
    ? parseFloat(courseData.salePrice)
    : parseFloat(courseData.price || "0");

  const originalPrice = courseData.price ? parseFloat(courseData.price) : null;
  const isOnSale =
    courseData.salePrice &&
    originalPrice &&
    parseFloat(courseData.salePrice) < originalPrice;

  return (
    <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-4 sm:py-6 md:py-8 lg:py-12 mt-20">
      <div className="max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
        {/* Header */}
        <motion.div
          className="mb-6 sm:mb-8 md:mb-10 lg:mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">
              <span className="inline-block text-white">COMPLETE YOUR</span>
              <span className="inline-block text-red-600 ml-2 sm:ml-3 md:ml-4 lg:ml-6">
                PURCHASE
              </span>
            </h1>

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="h-0.5 sm:h-1 md:h-1.5 bg-gradient-to-r from-red-600 to-transparent mt-1.5 sm:mt-2 md:mt-3 rounded-full"
            />
          </motion.div>
        </motion.div>

        {/* Back Button */}
        <motion.button
          onClick={() => router.back()}
          className="mb-4 sm:mb-6 flex items-center gap-1.5 sm:gap-2 text-gray-400 hover:text-white transition-colors text-xs sm:text-sm md:text-base"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -5 }}
        >
          <FaChevronLeft className="text-xs sm:text-sm" />
          <span className="font-medium">Back to Course</span>
        </motion.button>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
          {/* Course Details */}
          <motion.div
            className="lg:col-span-7 space-y-3 sm:space-y-4 md:space-y-5"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative overflow-hidden rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl border border-red-500/30 bg-gradient-to-br from-gray-900/90 to-black/95 backdrop-blur-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent" />

              <div className="relative p-3 sm:p-4 md:p-5 lg:p-6">
                <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 mb-3 sm:mb-3.5 md:mb-4">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                    <FaShoppingCart className="text-red-400 text-xs sm:text-sm md:text-base" />
                  </div>
                  <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white">
                    Course Details
                  </h2>
                </div>

                {courseData.thumbnail && (
                  <div className="relative aspect-video rounded-md sm:rounded-lg overflow-hidden mb-3 sm:mb-3.5 md:mb-4 border border-red-500/20">
                    <Image
                      src={courseData.thumbnail}
                      alt={courseData.title}
                      fill
                      className="object-cover"
                      unoptimized
                      priority
                    />
                  </div>
                )}

                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white mb-1.5 sm:mb-2">
                  {courseData.title}
                </h3>

                {courseData.description && (
                  <p className="text-gray-400 text-[11px] xs:text-xs sm:text-sm mb-3 sm:mb-3.5 md:mb-4 line-clamp-3">
                    {courseData.description}
                  </p>
                )}

                {courseData.user && (
                  <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 pt-3 sm:pt-3.5 md:pt-4 border-t border-red-500/20">
                    <div
                      className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border-2 border-red-500/50 flex-shrink-0 overflow-hidden cursor-pointer hover:border-red-500 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (courseData.user.username) {
                          router.push(
                            `/users/profile/${courseData.user.username}`
                          );
                        }
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-600 to-red-800">
                        <ProfileAvatar
                          customImage={courseData.user.img}
                          avatar={courseData.user.avatar}
                          userId={courseData.user.id}
                          size={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-white font-medium text-xs sm:text-sm md:text-base truncate cursor-pointer hover:text-red-400 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (courseData.user.username) {
                            router.push(
                              `/users/profile/${courseData.user.username}`
                            );
                          }
                        }}
                      >
                        {courseData.user.name || courseData.user.username}
                      </p>
                      <p className="text-gray-400 text-[10px] xs:text-xs sm:text-sm">
                        Course Instructor
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Payment Section */}
          <motion.div
            className="lg:col-span-5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="lg:sticky lg:top-6">
              <div className="relative rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl border border-red-500/30 bg-gradient-to-br from-gray-900/90 to-black/95 backdrop-blur-2xl overflow-hidden lg:overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent pointer-events-none" />

                <div className="relative p-3 sm:p-4 md:p-5 lg:p-6">
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white mb-3 sm:mb-4 md:mb-5 lg:mb-6">
                    Order Summary
                  </h3>

                  {/* Price Details */}
                  <div className="space-y-2 sm:space-y-2.5 md:space-y-3 lg:space-y-4 mb-4 sm:mb-5 md:mb-6">
                    <div className="flex justify-between text-gray-300 text-xs sm:text-sm md:text-base">
                      <span>Course Price</span>
                      <span
                        className={
                          isOnSale
                            ? "line-through text-gray-500"
                            : "font-bold text-white"
                        }
                      >
                        ${originalPrice?.toFixed(2) || price.toFixed(2)}
                      </span>
                    </div>

                    {isOnSale && (
                      <>
                        <div className="flex justify-between text-xs sm:text-sm md:text-base">
                          <span className="text-green-400 font-medium">
                            Sale Discount
                          </span>
                          <span className="text-green-400 font-bold">
                            -${(originalPrice! - price).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-white text-xs sm:text-sm md:text-base">
                          <span className="font-bold">
                            Sale Price
                          </span>
                          <span className="text-base sm:text-lg md:text-xl font-black text-green-400">
                            ${price.toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="pt-2 sm:pt-2.5 md:pt-3 lg:pt-4 border-t border-red-500/20">
                      <div className="flex justify-between text-lg sm:text-xl md:text-2xl font-black">
                        <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                          Total
                        </span>
                        <span className="text-white">${price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stripe Payment Form - Direct Display */}
                  {stripeClientSecret && (
                    <div className="mb-4 sm:mb-5 md:mb-6 stripe-checkout-wrapper">
                      <Elements 
                        stripe={stripePromise}
                        options={{
                          clientSecret: stripeClientSecret,
                          appearance: {
                            theme: 'night',
                            variables: {
                              colorPrimary: '#dc2626',
                              colorBackground: '#1a1a1a',
                              colorText: '#ffffff',
                              colorDanger: '#ef4444',
                              fontFamily: 'system-ui, sans-serif',
                              borderRadius: '12px',
                              spacingUnit: '4px',
                              fontSizeBase: '14px',
                            },
                          },
                        }}
                      >
                        <StripeCheckoutForm 
                          courseId={courseId}
                          price={price}
                          courseTitle={courseData.title}
                          paymentIntentId={stripePaymentIntentId!}
                        />
                      </Elements>
                    </div>
                  )}

                  {/* PayPal Alternative */}
                  {paypalOrderId && (
                    <div className="mb-4 sm:mb-5 md:mb-6">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-xs sm:text-sm">
                          <span className="px-2 sm:px-3 bg-gradient-to-r from-gray-900 via-black to-gray-900 text-gray-400">
                            Or pay with
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 sm:mt-5">
                        <PayPalScriptProvider
                          options={{
                            clientId: PAYPAL_CLIENT_ID,
                            currency: "USD",
                            intent: "capture",
                            components: "buttons,funding-eligibility",
                            vault: false,
                            dataPageType: "checkout",
                            disableFunding: "credit,card,paylater",
                            enableFunding: "paypal",
                            locale: "en_US",
                            commit: true,
                          }}
                        >
                          <PayPalCheckoutButtons
                            paypalOrderId={paypalOrderId}
                            courseData={courseData}
                            price={price}
                          />
                        </PayPalScriptProvider>
                      </div>
                    </div>
                  )}

                  {/* Security & Trust Badges */}
                  <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-gray-400 text-[10px] xs:text-xs sm:text-sm">
                      <FaLock className="text-green-400 flex-shrink-0 text-xs sm:text-sm" />
                      <span>256-bit SSL Secure Encryption</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-3 text-center text-[9px] xs:text-[10px] sm:text-xs text-gray-500">
                      <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                        <FaCheckCircle className="text-green-400 text-xs sm:text-sm md:text-base" />
                        <span className="leading-tight">30-Day Guarantee</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                        <FaCheckCircle className="text-green-400 text-xs sm:text-sm md:text-base" />
                        <span className="leading-tight">Instant Access</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                        <FaCheckCircle className="text-green-400 text-xs sm:text-sm md:text-base" />
                        <span className="leading-tight">Secure Payment</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Mobile-specific CSS fixes */}
        <style jsx global>{`
          @media (max-width: 1023px) {
            /* Remove overflow-hidden on mobile for payment section */
            .stripe-checkout-wrapper,
            .stripe-checkout-wrapper > *,
            .stripe-checkout-wrapper form,
            .stripe-checkout-wrapper form > * {
              overflow: visible !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}