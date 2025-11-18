// src/app/users/courses/[id]/checkout/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaLock,
  FaCheckCircle,
  FaChevronLeft,
  FaCreditCard,
  FaShieldAlt,
  FaShoppingCart,
  FaUserCircle,
} from "react-icons/fa";
import Image from "next/image";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import AvatarGenerator from "@/components/settings/AvatarGenerator";
import { useAuth } from "@/contexts/AuthContext";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;

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
    <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6 sm:py-8 md:py-10 lg:py-12 mt-20">
      <div className="max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
        <div className="mb-8 sm:mb-10 md:mb-12">
          <div className="relative mb-6 sm:mb-8">
            <div className="h-16 sm:h-20 md:h-24 lg:h-28 w-full max-w-2xl bg-gray-800/40 rounded-2xl animate-pulse" />
          </div>
        </div>

        <div className="mb-6 h-8 w-32 bg-gray-800/40 rounded-lg animate-pulse" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 md:gap-7 lg:gap-8">
          <div className="lg:col-span-7 space-y-4 sm:space-y-5 md:space-y-6">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/20">
              <div className="p-4 sm:p-5 md:p-6 space-y-4">
                <div className="aspect-video rounded-lg bg-gray-800/40 animate-pulse" />
                <div className="h-6 w-3/4 bg-gray-800/40 rounded-lg animate-pulse" />
                <div className="h-4 w-full bg-gray-800/40 rounded animate-pulse" />
                <div className="flex items-center gap-3 pt-4 border-t border-red-500/20">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-800/40 flex-shrink-0 animate-pulse" />
                  <div className="h-4 w-24 bg-gray-800/40 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-6">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/20">
                <div className="p-4 sm:p-5 md:p-6 space-y-4">
                  <div className="h-8 w-40 bg-gray-800/40 rounded-lg animate-pulse" />
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-12 bg-gray-800/40 rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                  <div className="h-32 bg-gray-800/40 rounded-xl animate-pulse" />
                  <div className="h-12 bg-gray-800/40 rounded-xl animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-gray-900/40 rounded-xl border border-red-500/20 backdrop-blur-sm" />
        <div className="relative p-4 sm:p-5 md:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
              <FaCreditCard className="text-red-400 text-sm sm:text-base" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Payment Details
            </h3>
          </div>

          {/* ✅ REMOVE fundingSource prop - let PayPal show all methods */}
          <PayPalButtons
            createOrder={() => Promise.resolve(paypalOrderId)}
            onApprove={async (data) => {
              try {
                router.push(`/users/courses/${courseData.id}/checkout/success?token=${data.orderID}`);
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
              color: 'gold', // ✅ Changed from 'black' to 'gold' for better visibility
              shape: 'rect',
              label: 'paypal',
              height: 55,
            }}
            // ✅ REMOVED: fundingSource={undefined}
            // This allows ALL payment methods to show
          />
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-900/30 rounded-lg border border-red-500/30 p-3 sm:p-4 flex items-start gap-2 sm:gap-3"
          >
            <p className="text-red-300 text-xs sm:text-sm font-medium">
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 text-gray-400 text-xs sm:text-sm">
          <FaLock className="text-green-400 flex-shrink-0" />
          <span>Secure PayPal encryption</span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center text-[10px] sm:text-xs text-gray-500">
          <div className="flex flex-col items-center gap-1">
            <FaCheckCircle className="text-green-400 text-sm sm:text-base" />
            <span>30-Day Guarantee</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <FaCheckCircle className="text-green-400 text-sm sm:text-base" />
            <span>Instant Access</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <FaCheckCircle className="text-green-400 text-sm sm:text-base" />
            <span>Secure Payment</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function useAtomicCheckoutData(courseId: string) {
  const [data, setData] = useState<{
    courseData: any;
    owner: any;
    currentUserAvatars: any[];
    paypalOrderId: string | null;
    loading: boolean;
    error: string | null;
  }>({
    courseData: null,
    owner: null,
    currentUserAvatars: [],
    paypalOrderId: null,
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
  
  const { user, logout, checkAuthStatus } = useAuth();

  const { courseData, owner, currentUserAvatars, paypalOrderId, loading, error } =
    useAtomicCheckoutData(courseId);

  const [authChecked, setAuthChecked] = useState(false);

  const primaryAvatar = currentUserAvatars?.find((a) => a.isPrimary) || currentUserAvatars?.[0] || null;

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

  if (error || !courseData || !paypalOrderId) {
    return (
      <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 md:py-10 mt-20">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-xl sm:rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-xl sm:rounded-2xl" />

            <div className="relative p-6 sm:p-8 md:p-10 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <FaShieldAlt className="text-red-400 text-2xl sm:text-3xl" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
                Error Loading Checkout
              </h1>
              <p className="text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base">
                {error || "Failed to load checkout"}
              </p>
              <button
                onClick={() => router.back()}
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl hover:scale-105 transition-transform font-bold text-sm sm:text-base inline-flex items-center gap-2"
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
   <PayPalScriptProvider
  options={{
    clientId: PAYPAL_CLIENT_ID,
    currency: "USD",
    intent: "capture",
    components: "buttons,funding-eligibility", // ✅ ADD funding-eligibility
    vault: false, // ✅ ADD this
  }}
>
      <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6 sm:py-8 md:py-10 lg:py-12 mt-20">
        <div className="max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
          <motion.div
            className="mb-8 sm:mb-10 md:mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative mb-6 sm:mb-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-black tracking-tight">
                  <span className="inline-block text-white">COMPLETE YOUR</span>
                  <span className="inline-block text-red-600 ml-3 sm:ml-4 md:ml-6">
                    PURCHASE
                  </span>
                </h1>

                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="h-1 sm:h-1.5 bg-gradient-to-r from-red-600 to-transparent mt-2 sm:mt-3 rounded-full"
                />
              </motion.div>
            </div>
          </motion.div>

          <motion.button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: -5 }}
          >
            <FaChevronLeft />
            <span className="font-medium">Back to Course</span>
          </motion.button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 md:gap-7 lg:gap-8">
            <motion.div
              className="lg:col-span-7 space-y-4 sm:space-y-5 md:space-y-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-xl sm:rounded-2xl md:rounded-3xl border border-red-500/30 backdrop-blur-2xl" />
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-xl sm:rounded-2xl md:rounded-3xl" />

                <div className="relative p-4 sm:p-5 md:p-6">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                      <FaShoppingCart className="text-red-400 text-sm sm:text-base" />
                    </div>
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-white">
                      Course Details
                    </h2>
                  </div>

                  {courseData.thumbnail && (
                    <div className="relative aspect-video rounded-lg overflow-hidden mb-4 border border-red-500/20">
                      <Image
                        src={courseData.thumbnail}
                        alt={courseData.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2">
                    {courseData.title}
                  </h3>

                  {courseData.description && (
                    <p className="text-gray-400 text-xs sm:text-sm mb-4 line-clamp-3">
                      {courseData.description}
                    </p>
                  )}

                  {courseData.user && (
                    <div className="flex items-center gap-3 pt-4 border-t border-red-500/20">
                      <div
                        className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-red-500/50 flex-shrink-0 overflow-hidden cursor-pointer hover:border-red-500 transition-all"
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
                          className="text-white font-medium text-sm sm:text-base truncate cursor-pointer hover:text-red-400 transition-colors"
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
                        <p className="text-gray-400 text-xs sm:text-sm">
                          Course Instructor
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              className="lg:col-span-5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="sticky top-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-xl sm:rounded-2xl md:rounded-3xl border border-red-500/30 backdrop-blur-2xl" />
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-xl sm:rounded-2xl md:rounded-3xl" />

                  <div className="relative p-4 sm:p-5 md:p-6">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 sm:mb-6">
                      Order Summary
                    </h3>

                    <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                      <div className="flex justify-between text-gray-300 text-sm sm:text-base">
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
                          <div className="flex justify-between">
                            <span className="text-green-400 font-medium text-sm sm:text-base">
                              Sale Discount
                            </span>
                            <span className="text-green-400 font-bold text-sm sm:text-base">
                              -${(originalPrice! - price).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-white">
                            <span className="font-bold text-sm sm:text-base">
                              Sale Price
                            </span>
                            <span className="text-lg sm:text-xl font-black text-green-400">
                              ${price.toFixed(2)}
                            </span>
                          </div>
                        </>
                      )}

                      <div className="pt-3 sm:pt-4 border-t border-red-500/20">
                        <div className="flex justify-between text-xl sm:text-2xl font-black">
                          <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                            Total
                          </span>
                          <span className="text-white">${price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <PayPalCheckoutButtons
                      paypalOrderId={paypalOrderId}
                      courseData={courseData}
                      price={price}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}