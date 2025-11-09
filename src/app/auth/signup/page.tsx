"use client";
import { useState, useEffect, useRef } from "react";
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m,
} from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  GoogleReCaptchaProvider,
  GoogleReCaptcha,
} from "react-google-recaptcha-v3";
import EnhancedSignupFlow from "@/components/signup/SignUpFlow";

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface FormState {
  passwordStrength: number;
  showPassword: boolean;
  showConfirmPassword: boolean;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  recaptchaToken: string | null;
  socialProvider: string | null;
  socialData: any;
  animationPhase: number;
}

const clearSignupCache = (preserveSocialToken: boolean = false) => {
  try {
    const keysToRemove = [
      "signup_form_data",
      "signup_current_step",
      "phone_verification_sent",
    ];

    if (!preserveSocialToken) {
      keysToRemove.push("signup_social_provider");
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));

    if (!preserveSocialToken) {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith("social_data_") || key.startsWith("social_token_")) {
          sessionStorage.removeItem(key);
        }
      });
    }

    console.log(
      "[Signup] Cache cleared",
      preserveSocialToken ? "(preserved social data)" : "(full clear)"
    );
  } catch (e) {
    console.error("Error clearing signup cache:", e);
  }
};

export default function SignupPage() {
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const [formState, setFormState] = useState<FormState>({
    passwordStrength: 0,
    showPassword: false,
    showConfirmPassword: false,
    isLoading: false,
    error: null,
    success: null,
    recaptchaToken: null,
    socialProvider: null,
    socialData: null,
    animationPhase: 5,
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const socialDataFetchedRef = useRef(false);
  const formSubmitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cacheCleared = useRef(false);

  // ✅ CRITICAL: Preserve course metadata on mount
  useEffect(() => {
    const preserveCourseMetadata = () => {
      const urlParams = new URLSearchParams(window.location.search);
      
      const courseId = urlParams.get("course");
      const courseTitle = urlParams.get("courseTitle");
      const price = urlParams.get("price");
      const salePrice = urlParams.get("salePrice");
      const redirectUrl = urlParams.get("redirect");

      console.log("[Signup Page] 🔍 Initial URL metadata check:", {
        courseId,
        courseTitle,
        hasRedirect: !!redirectUrl,
      });

      // If we have course info in URL, preserve it
      if (courseId && courseTitle) {
        const courseMetadata = {
          courseId,
          courseTitle,
          coursePrice: price || "",
          courseSalePrice: salePrice || null,
          fromCourse: true,
          timestamp: Date.now(),
          source: "url_params",
        };

        // Store in multiple places for redundancy
        sessionStorage.setItem("signup_course_metadata", JSON.stringify(courseMetadata));
        localStorage.setItem("signup_course_metadata_backup", JSON.stringify(courseMetadata));
        
        console.log("[Signup Page] 💾 Preserved course metadata:", courseMetadata);
      }

      // Always preserve redirect URL
      if (redirectUrl) {
        sessionStorage.setItem("signup_redirect_url", redirectUrl);
        localStorage.setItem("signup_redirect_url_backup", redirectUrl);
      }
    };

    preserveCourseMetadata();
  }, []);

  useEffect(() => {
    const hasSocialToken = searchParams?.get("social_token");

    if (!cacheCleared.current) {
      clearSignupCache(!!hasSocialToken);
      cacheCleared.current = true;
    }

    if (user && !hasSocialToken) {
      console.log("[Signup] User already logged in, redirecting");
      const storedRedirect = sessionStorage.getItem("signup_redirect_url");
      router.push(storedRedirect || "/users");
    }
  }, [user, router, searchParams]);

  return (
    <LazyMotion features={domAnimation}>
      <GoogleReCaptchaProvider
        reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
      >
        {/* Main Content */}
        <div className="relative z-20 min-h-screen flex items-center">
          <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-4 xl:px-6 2xl:px-8 py-4 xs:py-5 sm:py-6 md:py-8 lg:py-3 xl:py-4 2xl:py-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xs:gap-8 sm:gap-10 md:gap-12 lg:gap-6 xl:gap-8 2xl:gap-10 items-center max-w-[1800px] mx-auto">
              {/* Signup Form */}
              <m.div
                className="order-2 lg:order-1 lg:col-span-8 flex items-center justify-center w-full
                           2xl:-ml-12 2xl:justify-start 2xl:pl-8"
                initial={{ opacity: 0, x: -60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <div className="hidden">
                  <GoogleReCaptcha
                    onVerify={(token) =>
                      setFormState((prev) => ({
                        ...prev,
                        recaptchaToken: token,
                      }))
                    }
                  />
                </div>

                <div className="w-full max-w-full sm:max-w-2xl md:max-w-2xl lg:max-w-xl xl:max-w-2xl 2xl:max-w-[52rem]">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-950/60 to-black/80 rounded-2xl sm:rounded-3xl border border-red-500/30 backdrop-blur-2xl" />
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-2xl sm:rounded-3xl" />

                    <div className="relative p-3 xs:p-4 sm:p-5 md:p-6 lg:p-4 xl:p-5 2xl:p-6">
                      <EnhancedSignupFlow />
                    </div>
                  </div>
                </div>
              </m.div>

              {/* Brand Section */}
              <m.div
                className="hidden lg:flex lg:col-span-4 order-2 flex-col items-center justify-center text-center 
                           lg:mr-8 xl:mr-12 2xl:mr-20"
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                {/* Visual separator line */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-3/4 bg-gradient-to-b from-transparent via-red-500/40 to-transparent hidden lg:block"></div>

                {/* VerseAndMe Scales Text */}
                <m.div
                  className="relative z-[40] mb-6 sm:mb-8 md:mb-10 lg:mb-10"
                  initial={{ opacity: 0, y: -30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 1 }}
                >
                  <h1
                    className="font-black text-white mb-1 sm:mb-2 leading-none
                                 text-3xl lg:text-5xl xl:text-6xl 2xl:text-7xl"
                  >
                    VERSEANDME
                  </h1>
                  <h2
                    className="font-black bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent leading-none
                                 text-3xl lg:text-5xl xl:text-6xl 2xl:text-7xl"
                  >
                    SCALES
                  </h2>
                  <div className="h-1.5 sm:h-2 lg:h-2.5 xl:h-3 bg-gradient-to-r from-transparent via-red-500 to-transparent mt-3 sm:mt-4 md:mt-5 lg:mt-5 xl:mt-6 rounded-full opacity-70" />
                </m.div>

                {/* Sign In Link */}
                <m.div
                  className="mt-2 xs:mt-3 sm:mt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.7, duration: 0.5 }}
                >
                  <m.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href="/auth/signin"
                      className="text-gray-400 hover:text-red-400 font-medium transition-all duration-300 inline-block
                                 text-sm md:text-base lg:text-base xl:text-lg"
                    >
                      Already have an account?{" "}
                      <span className="text-red-400 font-bold">
                        Sign in →
                      </span>
                    </Link>
                  </m.div>
                </m.div>
              </m.div>
            </div>
          </div>
        </div>
      </GoogleReCaptchaProvider>
    </LazyMotion>
  );
}