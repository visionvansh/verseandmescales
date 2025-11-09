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
  FaInfoCircle,
  FaClock,
  FaCertificate,
  FaUsers,
  FaExclamationTriangle,
  FaUserCircle,
  FaCog,
  FaHome,
  FaBook,
  FaChartLine,
  FaMoneyBillWave,
  FaSignOutAlt,
} from "react-icons/fa";
import Image from "next/image";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import AvatarGenerator from "@/components/settings/AvatarGenerator";
import { useAuth } from "@/contexts/AuthContext";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

// ✅ Avatar Interface
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
  // Priority 1: Custom uploaded image
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

  // Priority 2: Custom avatar upload
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

  // Priority 3: Generated avatar (only if avatarIndex >= 0)
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

  // Priority 4: Default avatar (RED user icon on WHITE background)
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

// ✅ Simple Checkout Skeleton (like /courses page)
const CheckoutSkeleton = () => {
  return (
    <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6 sm:py-8 md:py-10 lg:py-12 mt-20">
      <div className="max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
        {/* Header Skeleton */}
        <div className="mb-8 sm:mb-10 md:mb-12">
          <div className="relative mb-6 sm:mb-8">
            <div className="h-16 sm:h-20 md:h-24 lg:h-28 w-full max-w-2xl bg-gray-800/40 rounded-2xl animate-pulse" />
          </div>
        </div>

        <div className="mb-6 h-8 w-32 bg-gray-800/40 rounded-lg animate-pulse" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 md:gap-7 lg:gap-8">
          {/* Left Column Skeleton */}
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

          {/* Right Column Skeleton */}
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

function CheckoutForm({
  courseData,
  clientSecret,
  price,
}: {
  courseData: any;
  clientSecret: string;
  price: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError("Stripe has not loaded yet. Please try again.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/users/courses/${courseData.id}/checkout/success`,
        },
      });

      if (submitError) {
        setError(submitError.message || "Payment failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 sm:space-y-5 md:space-y-6"
    >
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

          <PaymentElement
            options={{
              layout: "tabs",
            }}
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
            <FaExclamationTriangle className="text-red-400 text-base sm:text-lg mt-0.5 flex-shrink-0" />
            <p className="text-red-300 text-xs sm:text-sm font-medium">
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base lg:text-lg transition-all hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2 sm:gap-3"
      >
        {processing ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <FaLock className="text-sm sm:text-base lg:text-lg" />
            <span>Pay ${price.toFixed(2)}</span>
          </>
        )}
      </button>

      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 text-gray-400 text-xs sm:text-sm">
          <FaLock className="text-green-400 flex-shrink-0" />
          <span>Secure 256-bit SSL encryption</span>
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
    </form>
  );
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  
  const { user, logout, checkAuthStatus } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseData, setCourseData] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  
  const [authChecked, setAuthChecked] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [primaryAvatar, setPrimaryAvatar] = useState<UserAvatar | null>(null);
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(true);

  // ✅ FIRST: Check auth on mount
  useEffect(() => {
    const initAuth = async () => {
      console.log("[Checkout] 🔄 Checking auth on mount");
      
      const fromSignup = sessionStorage.getItem('just_signed_up');
      const shouldForceCheck = sessionStorage.getItem('force_auth_check_on_return');
      
      if (fromSignup || shouldForceCheck) {
        console.log("[Checkout] 🎯 Detected return from signup, forcing auth check");
        sessionStorage.removeItem('just_signed_up');
        sessionStorage.removeItem('force_auth_check_on_return');
        await checkAuthStatus(true);
      } else {
        await checkAuthStatus();
      }
      
      setAuthChecked(true);
    };

    if (!authChecked) {
      initAuth();
    }
  }, [checkAuthStatus, authChecked]);

  // ✅ SECOND: Fetch user avatars
  const fetchUserAvatars = useCallback(async () => {
    if (!user?.id) {
      setIsLoadingAvatar(false);
      return;
    }

    try {
      const response = await fetch("/api/user/avatars", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.avatars && data.avatars.length > 0) {
          const primary = data.avatars.find((a: UserAvatar) => a.isPrimary);
          setPrimaryAvatar(primary || data.avatars[0]);
          console.log("[Checkout] ✅ Avatar loaded");
        }
      }
    } catch (error) {
      console.error("[Checkout] ❌ Error fetching avatars:", error);
    } finally {
      setIsLoadingAvatar(false);
    }
  }, [user?.id]);

  // ✅ THIRD: Load avatars when user changes
  useEffect(() => {
    if (user?.id && authChecked) {
      fetchUserAvatars();
    } else {
      setIsLoadingAvatar(false);
    }
  }, [user?.id, authChecked, fetchUserAvatars]);

  // ✅ Avatar update listener
  useEffect(() => {
    const handleAvatarUpdate = () => {
      console.log("[Checkout] 🔄 Avatar updated, refreshing...");
      fetchUserAvatars();
    };

    window.addEventListener("avatar-updated", handleAvatarUpdate);
    return () => window.removeEventListener("avatar-updated", handleAvatarUpdate);
  }, [fetchUserAvatars]);

  // ✅ FOURTH: Initialize checkout after auth is checked
  useEffect(() => {
    if (authChecked && courseId) {
      console.log("[Checkout] 📦 Auth checked, initializing checkout");
      initializeCheckout();
    }
  }, [authChecked, courseId]);

  // ✅ Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".dropdown-container")) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isProfileOpen]);

  const initializeCheckout = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("[Checkout] 🔍 Fetching course:", courseId);

      const courseResponse = await fetch(`/api/course/public/${courseId}`, {
        credentials: "include",
      });

      if (!courseResponse.ok) {
        throw new Error("Failed to load course details");
      }

      const course = await courseResponse.json();
      console.log("[Checkout] ✅ Course data received");

      const coursePrice = course.footerSalePrice || course.footerPrice;

      if (!coursePrice || parseFloat(coursePrice) <= 0) {
        throw new Error("This course does not have a valid price set");
      }

      const ownerData = {
        id: course.owner.id,
        name: course.owner.fullName || course.owner.name || course.owner.username,
        username: course.owner.username,
        img: course.owner.img || null,
        avatar: course.owner.primaryAvatar || null,
        avatars: course.owner.avatars || [],
      };

      setCourseData({
        id: course.courseId,
        title: course.courseTitle,
        description: course.courseDescription,
        thumbnail: course.videoThumbnail,
        price: course.footerPrice,
        salePrice: course.footerSalePrice,
        user: ownerData,
      });

      console.log("[Checkout] 🔐 Creating payment intent");
      const paymentResponse = await fetch("/api/checkout/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseId }),
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.error || "Failed to initialize payment");
      }

      const { clientSecret: secret } = await paymentResponse.json();
      console.log("[Checkout] ✅ Payment intent created");

      if (!secret) {
        throw new Error("No payment client secret received");
      }

      setClientSecret(secret);
    } catch (err: any) {
      console.error("[Checkout] ❌ Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // ✅ Show simple loading skeleton
  if (loading || !authChecked) {
    return <CheckoutSkeleton />;
  }

  if (error || !courseData) {
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

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 mt-20">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Initializing payment...</p>
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

                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: "night",
                        variables: {
                          colorPrimary: "#dc2626",
                          colorBackground: "#1f2937",
                          colorText: "#ffffff",
                          colorDanger: "#ef4444",
                          fontFamily: "system-ui, -apple-system, sans-serif",
                          borderRadius: "8px",
                          spacingUnit: "4px",
                        },
                        rules: {
                          ".Input": {
                            backgroundColor: "#111827",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                            padding: "12px",
                            fontSize: "14px",
                          },
                          ".Input:focus": {
                            border: "1px solid rgba(239, 68, 68, 0.5)",
                            boxShadow: "0 0 0 2px rgba(239, 68, 68, 0.1)",
                          },
                          ".Label": {
                            color: "#9ca3af",
                            fontSize: "13px",
                            fontWeight: "500",
                            marginBottom: "8px",
                          },
                          ".Tab": {
                            backgroundColor: "#111827",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                            padding: "12px",
                          },
                          ".Tab:hover": {
                            backgroundColor: "#1f2937",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                          },
                          ".Tab--selected": {
                            backgroundColor: "#1f2937",
                            border: "1px solid #dc2626",
                            boxShadow: "0 0 0 2px rgba(220, 38, 38, 0.1)",
                          },
                        },
                      },
                    }}
                  >
                    <CheckoutForm
                      courseData={courseData}
                      clientSecret={clientSecret}
                      price={price}
                    />
                  </Elements>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}