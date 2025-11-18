"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import FingerprintJS from '@fingerprintjs/fingerprintjs';

// TypeScript declarations
declare global {
  interface Window {
    gtag?: (
      command: string,
      eventName: string,
      params: Record<string, string>
    ) => void;
  }
}

// Email validation utility
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Professional Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="relative w-full min-h-screen overflow-hidden bg-white flex items-center justify-center">
    <div className="w-full max-w-2xl px-4">
      <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 backdrop-blur-sm border border-gray-300 p-6 sm:p-8 md:p-12 lg:p-16 shadow-2xl rounded-lg">
        
        {/* Logo Skeleton */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full animate-pulse" />
        </div>

        {/* Title Skeleton */}
        <div className="space-y-4 mb-8">
          <div className="h-8 sm:h-12 bg-gray-200 rounded-lg w-3/4 mx-auto animate-pulse" />
          <div className="h-6 sm:h-8 bg-gray-200 rounded-lg w-1/2 mx-auto animate-pulse" />
        </div>

        {/* Divider Skeleton */}
        <div className="h-1 w-32 bg-gray-200 mx-auto mb-6 animate-pulse" />

        {/* Description Skeleton */}
        <div className="space-y-3 mb-8">
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-4/6 mx-auto animate-pulse" />
        </div>

        {/* Input Skeleton */}
        <div className="h-12 sm:h-14 bg-gray-200 rounded-md mb-4 animate-pulse" />

        {/* Button Skeleton */}
        <div className="h-12 sm:h-14 bg-gray-200 rounded-md mb-4 animate-pulse" />

        {/* Footer Text Skeleton */}
        <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto animate-pulse" />
      </div>
    </div>
  </div>
);

const EarlyAccessPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingDevice, setIsCheckingDevice] = useState(true);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [deviceFingerprint, setDeviceFingerprint] = useState<string>("");
  const [registeredEmail, setRegisteredEmail] = useState<string>("");

  // Generate device fingerprint and check if already registered
  useEffect(() => {
    const initFingerprint = async () => {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        const visitorId = result.visitorId;
        
        setDeviceFingerprint(visitorId);

        // Check if this device is already registered
        const response = await fetch(`/api/early-access?fingerprint=${visitorId}`);
        const data = await response.json();

        if (data.exists) {
          setRegisteredEmail(data.subscriber.email);
          setIsSubmitted(true);
        }
      } catch (error) {
        console.error('Error generating fingerprint:', error);
      } finally {
        setIsCheckingDevice(false);
      }
    };

    initFingerprint();
  }, []);

  // Real-time email validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError("");
    setError("");

    // Only validate if user has typed something
    if (value.length > 0) {
      if (!isValidEmail(value)) {
        setEmailError("Please enter a valid email address");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setEmailError("");

    // Client-side validation
    if (!email.trim()) {
      setEmailError("Email address is required");
      return;
    }

    if (!isValidEmail(email.trim())) {
      setEmailError("Please enter a valid email address (e.g., name@example.com)");
      return;
    }

    setIsLoading(true);

    try {
      const userData = {
        email: email.trim().toLowerCase(),
        deviceFingerprint,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        referrer: document.referrer || null,
        landingPage: window.location.href,
        utmSource: new URLSearchParams(window.location.search).get('utm_source'),
        utmMedium: new URLSearchParams(window.location.search).get('utm_medium'),
        utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign'),
        language: navigator.language || (navigator.languages && navigator.languages[0]),
      };

      const response = await fetch('/api/early-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          setEmailError(data.error || 'Invalid email format');
        } else if (data.alreadyExists) {
          setError('This email is already registered for early access.');
        } else if (response.status === 500) {
          setError('Server error. Please try again in a moment.');
        } else {
          setError(data.error || 'Something went wrong. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      setRegisteredEmail(email.trim());
      setIsLoading(false);
      setIsSubmitted(true);
      
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'conversion', {
          event_category: 'early_access',
          event_label: 'signup',
        });
      }

    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Network error. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  // Show skeleton loader while checking device
  if (isCheckingDevice) {
    return <SkeletonLoader />;
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-white">
      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-8 sm:py-12 sm:px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-2xl"
        >
          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="relative"
              >
                {/* Subtle Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 opacity-10 blur-2xl" />

                <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 backdrop-blur-sm border border-gray-300 p-6 sm:p-8 md:p-12 lg:p-16 shadow-2xl rounded-lg">
                  
                  {/* Heading */}
                  <div className="text-center mb-6 sm:mb-8">
                    <h4 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-2 tracking-tight whitespace-nowrap">
                      JOIN THE VERSEANDME FAMILY
                    </h4>
                    <p className="text-sm sm:text-base md:text-lg text-gray-600 font-light tracking-wider">
                      GET ACCESS TO EARLY DROPS
                    </p>
                    <div className="w-24 sm:w-32 h-px mx-auto mt-4 bg-gradient-to-r from-transparent via-gray-400 to-transparent" />
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={handleEmailChange}
                        required
                        disabled={isLoading}
                        placeholder="Enter your email address"
                        className={`w-full px-5 py-3.5 sm:px-6 sm:py-4 bg-white border-2 ${
                          emailError 
                            ? 'border-red-500/50' 
                            : 'border-gray-300 focus:border-gray-500'
                        } text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white transition-all duration-300 text-sm sm:text-base rounded-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                      />
                      {emailError && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute left-0 -bottom-6 text-red-400 text-xs sm:text-sm flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {emailError}
                        </motion.div>
                      )}
                    </div>

                    {/* General Error Message */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-red-400 text-center text-xs sm:text-sm bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2"
                        >
                          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span>{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit Button - Black with Fade Effect */}
                    <motion.button
                      type="submit"
                      disabled={isLoading || !!emailError}
                      whileHover={!isLoading && !emailError ? { scale: 1.01, opacity: 0.9 } : {}}
                      whileTap={!isLoading && !emailError ? { scale: 0.99 } : {}}
                      className="w-full bg-black text-white px-6 py-3.5 sm:py-4 text-base sm:text-lg font-bold tracking-wide relative overflow-hidden transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg shadow-lg hover:opacity-90"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <svg
                            className="animate-spin h-5 w-5 mr-3"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        "Get Early Access"
                      )}
                    </motion.button>
                  </form>

                  {/* Privacy Note */}
                  <p className="text-center text-gray-500 text-xs sm:text-sm mt-6 px-2">
                    <svg
                      className="inline-block w-3 h-3 sm:w-4 sm:h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    We respect your privacy. Unsubscribe anytime.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 opacity-20 blur-2xl" />

                <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 backdrop-blur-sm border border-gray-300 p-6 sm:p-8 md:p-12 lg:p-16 shadow-2xl text-center rounded-lg">
                  
                  {/* Success Icon */}
                  <div className="flex justify-center mb-6 sm:mb-8">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center shadow-lg">
                      <svg
                        className="w-12 h-12 sm:w-14 sm:h-14 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Success Message */}
                  <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-800 mb-4 sm:mb-6">
                    Welcome to VerseAndMe!
                  </h2>

                  <div className="w-32 h-px mx-auto bg-gradient-to-r from-transparent via-gray-400 to-transparent mb-6 sm:mb-8" />

                  <p className="text-gray-600 text-base sm:text-lg md:text-xl mb-6 leading-relaxed px-2">
                    {registeredEmail && (
                      <span className="block text-gray-800 font-semibold mb-3 text-sm sm:text-base break-all">
                        {registeredEmail}
                      </span>
                    )}
                    You&apos;ve successfully joined our{" "}
                    <span className="text-gray-800 font-semibold">
                      early access community
                    </span>
                    !
                  </p>

                  <p className="text-gray-500 text-sm sm:text-base mb-8 px-2 max-w-lg mx-auto">
                    Watch your inbox for exclusive updates, special offers, and inspiration 
                    from our faith-based collection. You&apos;ll be the first to know when we launch!
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default EarlyAccessPage;