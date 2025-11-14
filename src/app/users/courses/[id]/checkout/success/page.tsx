// src/app/users/courses/[id]/checkout/success/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, LazyMotion, domAnimation, AnimatePresence } from "framer-motion";
import { 
  FaCheckCircle, 
  FaRocket, 
  FaExclamationTriangle, 
  FaArrowRight,
  FaUserCircle,
  FaCog,
  FaHome,
  FaBook,
  FaSignOutAlt,
} from "react-icons/fa";
import Confetti from "react-confetti";
import AvatarGenerator from "@/components/settings/AvatarGenerator";
import { useAuth } from "@/contexts/AuthContext";

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

// ✅ ProfileAvatar Component
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
      <img
        src={customImage}
        alt="Profile"
        width={size}
        height={size}
        className={`object-cover rounded-full ${className}`}
      />
    );
  }

  if (avatar?.isCustomUpload && avatar.customImageUrl) {
    return (
      <img
        src={avatar.customImageUrl}
        alt="Profile"
        width={size}
        height={size}
        className={`object-cover rounded-full ${className}`}
      />
    );
  }

  if (avatar && typeof avatar.avatarIndex === "number" && avatar.avatarIndex >= 0) {
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

  return <FaUserCircle className={`w-full h-full text-white ${className}`} />;
};

// ✅ Simple Loading Skeleton (like /courses page)
const LoadingSkeleton = () => (
  <LazyMotion features={domAnimation}>
    <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6 sm:py-8 md:py-10 lg:py-12 mt-20">
      <div className="max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
        
        {/* Simple Content Skeleton */}
        <div className="max-w-2xl mx-auto">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/20">
            <div className="p-6 sm:p-8 md:p-10 lg:p-12 space-y-6">
              {/* Icon Skeleton */}
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gray-800/40 rounded-full animate-pulse" />
              
              {/* Text Skeletons */}
              <div className="space-y-3">
                <div className="h-8 sm:h-10 w-64 sm:w-80 bg-gray-800/40 rounded-lg animate-pulse mx-auto" />
                <div className="h-5 w-48 sm:w-64 bg-gray-800/30 rounded mx-auto animate-pulse" />
              </div>

              {/* Button Skeleton */}
              <div className="h-12 sm:h-14 w-full max-w-sm bg-gray-800/40 rounded-xl animate-pulse mx-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </LazyMotion>
);

export default function CheckoutSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout, checkAuthStatus } = useAuth();
  
  const paymentIntentId = searchParams.get('payment_intent');
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseData, setCourseData] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  
  const [authChecked, setAuthChecked] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [primaryAvatar, setPrimaryAvatar] = useState<UserAvatar | null>(null);
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(true);

  // ✅ FIRST: Check auth on mount
  useEffect(() => {
    const initAuth = async () => {
      console.log("[Success] 🔄 Checking auth on mount");
      await checkAuthStatus(true);
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
          console.log("[Success] ✅ Avatar loaded");
        }
      }
    } catch (error) {
      console.error("[Success] ❌ Error fetching avatars:", error);
    } finally {
      setIsLoadingAvatar(false);
    }
  }, [user?.id]);

  // ✅ THIRD: Load avatars when user is ready
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
      console.log("[Success] 🔄 Avatar updated, refreshing...");
      fetchUserAvatars();
    };

    window.addEventListener("avatar-updated", handleAvatarUpdate);
    return () => window.removeEventListener("avatar-updated", handleAvatarUpdate);
  }, [fetchUserAvatars]);

  // Handle window resize for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ✅ FOURTH: Verify payment after auth is checked
  useEffect(() => {
    if (authChecked && paymentIntentId) {
      verifyPaymentAndEnrollment();
    } else if (authChecked && !paymentIntentId) {
      setError('Invalid payment session');
      setLoading(false);
    }
  }, [authChecked, paymentIntentId]);

  // ✅ Close dropdown on outside click
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

  const verifyPaymentAndEnrollment = async () => {
    try {
      setLoading(true);
      
      console.log('[Success] 🔍 Verifying payment intent:', paymentIntentId);
      
      const response = await fetch('/api/atomic/checkout/success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ paymentIntentId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.details || data.error || 'Payment verification failed');
      }

      const data = await response.json();
      
      if (data.success) {
        setVerified(true);
        setCourseData(data.course);
        setShowConfetti(true);
        console.log('[Success] ✅ Payment verified');
        
        setTimeout(() => setShowConfetti(false), 5000);
      } else {
        throw new Error('Payment not verified');
      }
      
    } catch (err: any) {
      console.error('[Success] ❌ Verification error:', err);
      setError(err.message || 'Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    if (courseData?.id) {
      console.log('[Success] 🚀 Redirecting to courseinside:', courseData.id);
      router.push(`/users/courseinside?courseId=${courseData.id}`);
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
    return <LoadingSkeleton />;
  }

  // Error State
  if (error) {
    return (
      <LazyMotion features={domAnimation}>
        <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6 sm:py-8 md:py-10 lg:py-12 mt-20">
          <div className="max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
            
            {/* Error Header */}
            <motion.div
              className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-black text-white mt-4 sm:mt-6 md:mt-8 leading-tight">
                <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
                  PAYMENT
                </span>{" "}
                <span className="block sm:inline">VERIFICATION</span>
              </h1>
            </motion.div>

            {/* Error Content */}
            <div className="max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-xl sm:rounded-2xl md:rounded-3xl border border-red-500/30 backdrop-blur-2xl" />
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-xl sm:rounded-2xl md:rounded-3xl" />
                
                <div className="relative p-6 sm:p-8 md:p-10 lg:p-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="mb-6 sm:mb-8"
                  >
                    <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-red-600/20 to-red-800/20 border-2 border-red-500/30 flex items-center justify-center">
                      <FaExclamationTriangle className="text-3xl sm:text-4xl md:text-5xl text-red-400" />
                    </div>
                  </motion.div>

                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 sm:mb-4">
                    Verification Failed
                  </h2>
                  <p className="text-sm sm:text-base md:text-lg text-gray-300 mb-6 sm:mb-8 max-w-md mx-auto">
                    {error}
                  </p>

                  <div className="space-y-3 sm:space-y-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push('/users/my-courses')}
                      className="w-full max-w-xs mx-auto px-6 py-3 sm:py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base hover:shadow-lg hover:shadow-red-500/30 transition-all flex items-center justify-center gap-2 sm:gap-3"
                    >
                      Go to My Courses
                      <FaArrowRight className="text-sm sm:text-base" />
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => window.location.reload()}
                      className="w-full max-w-xs mx-auto px-6 py-3 bg-gray-800/50 border border-gray-700 text-white rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:bg-gray-800 transition-all block"
                    >
                      Retry Verification
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </LazyMotion>
    );
  }

  // Success State
  return (
    <LazyMotion features={domAnimation}>
      <div className="relative">
        {showConfetti && windowSize.width > 0 && (
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={500}
            gravity={0.3}
          />
        )}

        <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6 sm:py-8 md:py-10 lg:py-12 mt-20">
          <div className="max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
            <div className="max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-xl sm:rounded-2xl md:rounded-3xl border border-green-500/30 backdrop-blur-2xl" />
                <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-transparent rounded-xl sm:rounded-2xl md:rounded-3xl" />
                
                <div className="relative p-6 sm:p-8 md:p-10 lg:p-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="text-center mb-6 sm:mb-8"
                  >
                    <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-green-600/20 to-green-800/20 border-2 border-green-500/30 flex items-center justify-center">
                      <FaCheckCircle className="text-3xl sm:text-4xl md:text-5xl text-green-400" />
                    </div>
                  </motion.div>

                  <div className="text-center mb-6 sm:mb-8 md:mb-10">
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 sm:mb-4"
                    >
                      Purchase Successful! 🎉
                    </motion.h2>
                    
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-sm sm:text-base md:text-lg text-gray-300 mb-2"
                    >
                      Let's explore
                    </motion.p>
                    
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-lg sm:text-xl md:text-2xl font-bold text-white px-4"
                    >
                      {courseData?.title || 'Your New Course'}
                    </motion.p>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-center"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleGetStarted}
                      className="w-full max-w-sm mx-auto px-6 sm:px-8 py-3 sm:py-4 md:py-5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg md:text-xl hover:shadow-xl hover:shadow-red-500/30 transition-all flex items-center justify-center gap-3 sm:gap-4"
                    >
                      <FaRocket className="text-lg sm:text-xl md:text-2xl" />
                      Let's Explore
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </LazyMotion>
  );
}