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
  FaEnvelope,
  FaSpinner,
  FaArrowRight,
  FaExclamationTriangle,
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
    <div className="container mx-auto px-5 py-4 sm:py-6 md:py-8 lg:py-12 mt-20">
      <div className="max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
        <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
          <div className="h-12 sm:h-16 md:h-20 lg:h-24 w-full max-w-2xl bg-gray-800/40 rounded-xl sm:rounded-2xl animate-pulse mb-4 sm:mb-6" />
        </div>

        <div className="mb-4 sm:mb-6 h-6 sm:h-8 w-24 sm:w-32 bg-gray-800/40 rounded-lg animate-pulse" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
          <div className="hidden lg:block lg:col-span-7 space-y-3 sm:space-y-4 md:space-y-5">
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

// ✅ Email Verification Component
function EmailVerificationFlow({
  courseId,
  onVerified,
  onCancel,
}: {
  courseId: string;
  onVerified: () => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/checkout-verify/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, courseId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      setStep('code');
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/checkout-verify/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, code, courseId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify code');
      }

      console.log('[EmailVerification] ✅ Verification successful, calling onVerified');
      
      sessionStorage.setItem('force_auth_check_on_return', 'true');
      sessionStorage.setItem('just_verified_email', 'true');
      
      onVerified();
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/checkout-verify/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, courseId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend code');
      }

      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
          <FaEnvelope className="text-red-400 text-2xl" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          {step === 'email' ? 'Enter Your Email' : 'Verify Your Email'}
        </h3>
        <p className="text-gray-400 text-sm">
          {step === 'email' 
            ? 'We\'ll create an account for you and send a verification code'
            : `We sent a code to ${email}`
          }
        </p>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {step === 'email' ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading || !email}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                Continue
                <FaArrowRight />
              </>
            )}
          </motion.button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              required
              maxLength={6}
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-widest placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading || code.length !== 6}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <FaCheckCircle />
                Verify & Continue
              </>
            )}
          </motion.button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => setStep('email')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Change email
            </button>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendCooldown > 0 || loading}
              className="text-red-400 hover:text-red-300 transition-colors disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}

      <button
        type="button"
        onClick={onCancel}
        className="w-full text-gray-400 hover:text-white text-sm transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

// ✅ NEW: Fake Payment Interface Component with instant prompt
function FakePaymentInterface({ 
  onTryPayment,
  showVerificationPrompt 
}: { 
  onTryPayment: () => void;
  showVerificationPrompt: boolean;
}) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.preventDefault();
  e.currentTarget.blur();
  onTryPayment();
};

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onTryPayment();
  };

  return (
    <div className="space-y-4 relative">
      {/* Verification Alert - Shows on interaction */}
      <AnimatePresence>
        {showVerificationPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute -top-24 left-0 right-0 z-50 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl p-4 shadow-2xl border-2 border-yellow-400/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="text-white text-2xl animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">
                  Complete email verification above to unlock payment!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onTryPayment(); }}>
        {/* Card Number */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Card Number
          </label>
          <div className="relative">
            <input
              type="text"
              value={cardNumber}
              onFocus={handleFocus}
              onClick={handleClick}
              placeholder="1234 5678 9012 3456"
              readOnly
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 cursor-pointer"
            />
            <FaCreditCard className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl pointer-events-none" />
          </div>
        </div>

        {/* Expiry & CVC */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Expiry Date
            </label>
            <input
              type="text"
              value={expiry}
              onFocus={handleFocus}
              onClick={handleClick}
              placeholder="MM/YY"
              readOnly
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              CVC
            </label>
            <input
              type="text"
              value={cvc}
              onFocus={handleFocus}
              onClick={handleClick}
              placeholder="123"
              readOnly
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 cursor-pointer"
            />
          </div>
        </div>

        {/* Cardholder Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Cardholder Name
          </label>
          <input
            type="text"
            value={name}
            onFocus={handleFocus}
            onClick={handleClick}
            placeholder="John Doe"
            readOnly
            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 cursor-pointer"
          />
        </div>

        {/* Pay Button */}
        <motion.button
          type="button"
          onClick={handleClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/20"
        >
          <FaLock />
          Pay Now
        </motion.button>
      </form>
    </div>
  );
}

// ✅ NEW: Fake PayPal Button with instant prompt
function FakePayPalButton({ 
  onTryPayment,
  showVerificationPrompt 
}: { 
  onTryPayment: () => void;
  showVerificationPrompt: boolean;
}) {
  return (
    <div className="relative">
      <AnimatePresence>
        {showVerificationPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute -top-24 left-0 right-0 z-50 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl p-4 shadow-2xl border-2 border-yellow-400/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="text-white text-2xl animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">
                  Complete email verification above to unlock payment!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={onTryPayment}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-[#FFC439] hover:bg-[#FFB700] text-[#003087] font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .76-.653h8.027c2.916 0 4.97 1.065 5.457 3.473.164.816.138 1.495-.078 2.022-.26.643-.738 1.125-1.424 1.438-.48.218-1.037.365-1.66.44-.622.074-1.297.111-2.013.111H9.83a.913.913 0 0 0-.9.758l-.675 4.291-.025.151c-.004.023-.004.048-.004.074a.374.374 0 0 0 .369.34h2.586l.375 2.38a.913.913 0 0 1-.9 1.102H7.076z"/>
        </svg>
        Pay with PayPal
      </motion.button>
    </div>
  );
}

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

// Hook to fetch checkout data
function useCheckoutData(courseId: string, user: any, triggerRefresh: number) {
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

  const fetchData = useCallback(async () => {
    try {
      console.log('[Checkout Data] 🔄 Fetching...', {
        hasUser: !!user,
        userId: user?.id,
        triggerRefresh,
      });

      setData(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/atomic/checkout/${courseId}`, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load checkout');
      }

      const atomicData = await response.json();

      console.log('[Checkout Data] ✅ Data loaded:', {
        hasCourse: !!atomicData.course,
        hasPaypal: !!atomicData.paypalOrderId,
        hasStripe: !!atomicData.stripeClientSecret,
      });

      setData({
        courseData: atomicData.course,
        owner: atomicData.owner,
        currentUserAvatars: atomicData.currentUserAvatars || [],
        paypalOrderId: atomicData.paypalOrderId || null,
        stripeClientSecret: atomicData.stripeClientSecret || null,
        stripePaymentIntentId: atomicData.stripePaymentIntentId || null,
        loading: false,
        error: null,
      });

    } catch (error) {
      console.error('[Checkout Data] ❌ Error:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load checkout',
      }));
    }
  }, [courseId, user, triggerRefresh]);

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId, user, triggerRefresh, fetchData]);

  return { ...data, refetch: fetchData };
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  
  const { user, checkAuthStatus, isLoading: authLoading, authChecked } = useAuth();
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);

  const { 
    courseData, 
    owner,
    currentUserAvatars, 
    paypalOrderId, 
    stripeClientSecret,
    stripePaymentIntentId,
    loading, 
    error,
    refetch 
  } = useCheckoutData(courseId, user, refreshTrigger);

  // Handle email verification completion
  const handleEmailVerified = useCallback(async () => {
    console.log('[Checkout] ✅ Email verified callback triggered');
    setIsVerifying(true);
    
    try {
      setShowEmailVerification(false);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('[Checkout] 🔄 Forcing auth check...');
      await checkAuthStatus(true);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('[Checkout] 🔄 Triggering checkout data refetch...');
      setRefreshTrigger(prev => prev + 1);
      
    } catch (error) {
      console.error('[Checkout] ❌ Error during verification flow:', error);
    } finally {
      setIsVerifying(false);
    }
  }, [checkAuthStatus]);

  // ✅ NEW: Handle fake payment attempt
  const handleFakePaymentAttempt = () => {
    setShowVerificationPrompt(true);
    
    // Scroll to email verification section
    const emailSection = document.getElementById('email-verification-section');
    if (emailSection) {
      emailSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Auto-hide the prompt after 4 seconds
    setTimeout(() => {
      setShowVerificationPrompt(false);
    }, 4000);
  };

  if (!authChecked || loading || authLoading || isVerifying) {
    return <CheckoutSkeleton />;
  }

  if (error && !courseData) {
    return (
      <div className="container mx-auto px-5 py-4 sm:py-6 md:py-8 lg:py-10 mt-20">
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

  const price = courseData?.salePrice
    ? parseFloat(courseData.salePrice)
    : parseFloat(courseData?.price || "0");

  const originalPrice = courseData?.price ? parseFloat(courseData.price) : null;
  const isOnSale =
    courseData?.salePrice &&
    originalPrice &&
    parseFloat(courseData.salePrice) < originalPrice;

  const needsEmailVerification = !user;
  const hasPaymentIntents = !!(stripeClientSecret && paypalOrderId);
  const showPaymentForm = user && hasPaymentIntents;

  console.log('[Checkout] Render state:', {
    hasUser: !!user,
    needsEmailVerification,
    showPaymentForm,
    hasStripe: !!stripeClientSecret,
    hasPaypal: !!paypalOrderId,
    showEmailVerification,
  });

  return (
    <div className="container mx-auto px-5 py-4 sm:py-6 md:py-8 lg:py-12 mt-20">
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
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mt-3">
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
          {/* Course Details - Left Side - HIDDEN ON MOBILE */}
          <motion.div
            className="hidden lg:block lg:col-span-7 space-y-3 sm:space-y-4 md:space-y-5"
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

                {courseData?.thumbnail && (
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
                  {courseData?.title}
                </h3>

                {courseData?.description && (
                  <p className="text-gray-400 text-[11px] xs:text-xs sm:text-sm mb-3 sm:mb-3.5 md:mb-4 line-clamp-3">
                    {courseData.description}
                  </p>
                )}

                {owner && (
                  <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 pt-3 sm:pt-3.5 md:pt-4 border-t border-red-500/20">
                    <div
                      className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border-2 border-red-500/50 flex-shrink-0 overflow-hidden cursor-pointer hover:border-red-500 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (owner.username) {
                          router.push(`/users/profile/${owner.username}`);
                        }
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-600 to-red-800">
                        <ProfileAvatar
                          customImage={owner.img}
                          avatar={owner.primaryAvatar}
                          userId={owner.id}
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
                          if (owner.username) {
                            router.push(`/users/profile/${owner.username}`);
                          }
                        }}
                      >
                        {owner.fullName}
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

          {/* Payment Section - Right Side - FULL WIDTH ON MOBILE */}
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

                  {/* ✅ UPDATED: Email Entry Section for Unauthenticated Users */}
                  {needsEmailVerification && (
                    <div id="email-verification-section" className="mb-4 sm:mb-5 md:mb-6 scroll-mt-24">
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-4">
                        <p className="text-blue-300 text-sm font-medium text-center">
                          Please verify your email before proceeding with payment
                        </p>
                      </div>
                      
                      <EmailVerificationFlow
                        courseId={courseId}
                        onVerified={handleEmailVerified}
                        onCancel={() => setShowEmailVerification(false)}
                      />
                    </div>
                  )}

                  {/* ✅ UPDATED: Payment Interface Section */}
                  <div className={needsEmailVerification ? 'mb-4 sm:mb-5 md:mb-6' : ''}>
                    {showPaymentForm ? (
                      // Real payment forms for authenticated users
                      <>
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
                              courseTitle={courseData?.title || ''}
                              paymentIntentId={stripePaymentIntentId!}
                            />
                          </Elements>
                        </div>

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
                      </>
                    ) : (
                      // Fake payment interface for unauthenticated users
                      <>
                        <div className="mb-4">
                          <FakePaymentInterface 
                            onTryPayment={handleFakePaymentAttempt}
                            showVerificationPrompt={showVerificationPrompt}
                          />
                        </div>

                        <div className="mb-4">
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
                        </div>

                        <div className="mb-4">
                          <FakePayPalButton 
                            onTryPayment={handleFakePaymentAttempt}
                            showVerificationPrompt={showVerificationPrompt}
                          />
                        </div>
                      </>
                    )}
                  </div>

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