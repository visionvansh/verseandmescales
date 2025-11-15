// /Volumes/vision/codes/course/my-app/src/components/signup/SignUpFlow.tsx
"use client";
import { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import {
  motion,
  AnimatePresence,
  m,
  LazyMotion,
  domAnimation,
} from "framer-motion";
import {
  FaGoogle,
  FaMicrosoft,
  FaEnvelope,
  FaLock,
  FaUser,
  FaCheckCircle,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaArrowLeft,
  FaSpinner,
  FaStar,
} from "react-icons/fa";
import { useSearchParams, useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

interface ExtendedNavigator extends Navigator {
  deviceMemory?: number;
  hardwareConcurrency: number;
}

interface FormData {
  email: string;
  password: string;
  username: string;
  name: string;
  surname: string;
  socialProvider?: string;
  socialId?: string;
  socialData?: any;
}

interface UiState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
  showPassword: boolean;
  isVerifying: boolean;
  isResending: boolean;
  verificationSent: boolean;
  countdown: number;
  socialDataLoaded: boolean;
}

interface Step {
  title: string;
  description: string;
  icon: any;
}

const clearAllSignupCache = (preserveSocial: boolean = false) => {
  try {
    const keysToRemove = [];

    if (!preserveSocial) {
      keysToRemove.push(
        "email_verification_sent",
        "signup_current_step",
        "signup_form_data"
      );
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));

    if (!preserveSocial) {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith("social_") || key.startsWith("signup_")) {
          sessionStorage.removeItem(key);
        }
      });
    }

    console.log(
      "[EnhancedSignupFlow] Cache cleared",
      preserveSocial ? "(preserved social)" : "(full)"
    );
  } catch (e) {
    console.error("Error clearing cache:", e);
  }
};

const fadeInVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const slideInVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

const successVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

const EnhancedSignupFlow = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    username: "",
    name: "",
    surname: "",
    socialProvider: undefined,
    socialId: undefined,
    socialData: undefined,
  });

  const [uiState, setUiState] = useState<UiState>({
    isLoading: false,
    error: null,
    success: null,
    showPassword: false,
    isVerifying: false,
    isResending: false,
    verificationSent: false,
    countdown: 0,
    socialDataLoaded: false,
  });

  const [verificationCode, setVerificationCode] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const socialDataFetchedRef = useRef(false);
  const usernameCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const usernameAvailabilityCache = useRef(
    new Map<string, { available: boolean; timestamp: number }>()
  );
  const cacheCleared = useRef(false);
  const formSubmitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ FIX: Different steps for social vs regular signup
  const steps: Step[] = useMemo(() => {
    if (formData.socialProvider) {
      // Social login: 2 steps only (Account Setup + Profile Details)
      return [
        {
          title: "Account Setup",
          description: "Connect your account",
          icon: FaUser,
        },
        {
          title: "Profile Details",
          description: "Complete your profile",
          icon: FaStar,
        },
        {
          title: "Welcome!",
          description: "You're ready!",
          icon: FaCheckCircle,
        },
      ];
    } else {
      // Regular signup: 3 steps (Account Setup + Email Verification + Profile Details)
      return [
        {
          title: "Account Setup",
          description: "Create your account",
          icon: FaUser,
        },
        {
          title: "Email Verification",
          description: "Verify your email",
          icon: FaEnvelope,
        },
        {
          title: "Profile Details",
          description: "Complete your profile",
          icon: FaStar,
        },
        {
          title: "Welcome!",
          description: "You're ready!",
          icon: FaCheckCircle,
        },
      ];
    }
  }, [formData.socialProvider]);

  const getRedirectUrl = useCallback(() => {
    const redirectParam = searchParams?.get("redirect");
    const storedRedirect = sessionStorage.getItem("post_signup_redirect");
    const redirectUrl = redirectParam || storedRedirect || "/users";

    console.log("[SignUpFlow] Redirect URL:", redirectUrl);
    return redirectUrl;
  }, [searchParams]);

  const isCourseRedirect = useCallback(() => {
    const redirectUrl = getRedirectUrl();
    return redirectUrl.includes("/courses/");
  }, [getRedirectUrl]);

  // ✅ FIX: Only clear cache on initial mount, not when social token changes
  useEffect(() => {
    const hasSocialToken = searchParams?.get("social_token");

    // ✅ FIX: Only clear cache on initial mount, not when social token changes
    if (!cacheCleared.current && !hasSocialToken) {
      clearAllSignupCache(false);
      cacheCleared.current = true;
    }

    // ✅ Store redirect URL from query params
    const redirectUrl = searchParams?.get("redirect");
    if (redirectUrl && !hasSocialToken) {
      sessionStorage.setItem("post_signup_redirect", redirectUrl);
    }

    if (user && !hasSocialToken) {
      console.log("[Signup] User already logged in, redirecting");
      const storedRedirect = sessionStorage.getItem("post_signup_redirect");
      router.push(storedRedirect || "/users");
    }
  }, [user, router, searchParams]);

  // ✅ FIX: Update cleanup to preserve social data during the flow
  useEffect(() => {
    return () => {
      const hasSocialToken = searchParams?.get("social_token");
      // Only clear cache if user is leaving without completing signup
      if (!hasSocialToken && !sessionStorage.getItem("signup_completed")) {
        clearAllSignupCache(false);
      }
      if (formSubmitTimeoutRef.current) {
        clearTimeout(formSubmitTimeoutRef.current);
      }
    };
  }, [searchParams]);

  useEffect(() => {
    const loadSocialData = async () => {
      const socialToken = searchParams?.get("social_token");
      const provider = searchParams?.get("provider");

      if (socialToken && provider && !socialDataFetchedRef.current) {
        try {
          socialDataFetchedRef.current = true;
          setUiState((prev) => ({ ...prev, isLoading: true, error: null }));

          console.log(
            "[EnhancedSignupFlow] Loading social data for:",
            provider
          );

          const response = await fetch(
            `/api/auth/social/data?token=${socialToken}`
          );
          const data = await response.json();

          if (response.ok) {
            console.log("[EnhancedSignupFlow] Social data loaded successfully");
            handleSocialDataSuccess(data, provider);
          } else {
            console.error(
              "[EnhancedSignupFlow] Failed to load social data:",
              data.error
            );
            setUiState((prev) => ({
              ...prev,
              error: data.error || "Failed to load social account data",
              isLoading: false,
            }));
          }
        } catch (error) {
          console.error(
            "[EnhancedSignupFlow] Error loading social data:",
            error
          );
          setUiState((prev) => ({
            ...prev,
            error: "Failed to load social account data",
            isLoading: false,
          }));
        }
      }
    };

    loadSocialData();
  }, [searchParams]);

  const handleSocialDataSuccess = useCallback(
    (data: any, provider: string) => {
      const { providerData, metadata } = data;

      console.log(
        "[EnhancedSignupFlow] Processing social data:",
        provider,
        providerData.email
      );

      // ✅ Store social token in sessionStorage to prevent loss
      const socialToken = searchParams?.get("social_token");
      if (socialToken) {
        sessionStorage.setItem("active_social_token", socialToken);
      }

      // ✅ Store redirect URL from metadata
      if (metadata?.redirectUrl) {
        sessionStorage.setItem("post_signup_redirect", metadata.redirectUrl);
      }

      if (provider === "google") {
        setFormData((prev) => ({
          ...prev,
          email: providerData.email,
          name: providerData.given_name || "",
          surname: providerData.family_name || "",
          socialProvider: "google",
          socialId: providerData.id,
          socialData: providerData,
          username: generateUsernameFromData(providerData, "google"),
        }));
      } else if (provider === "microsoft") {
        const email = providerData.mail || providerData.userPrincipalName;
        setFormData((prev) => ({
          ...prev,
          email: email,
          name: providerData.givenName || "",
          surname: providerData.surname || "",
          socialProvider: "microsoft",
          socialId: providerData.id,
          socialData: providerData,
          username: generateUsernameFromData(providerData, "microsoft", email),
        }));
      }

      setUiState((prev) => ({
        ...prev,
        success: `Successfully connected with ${
          provider.charAt(0).toUpperCase() + provider.slice(1)
        }! Please complete your profile.`,
        socialDataLoaded: true,
        isLoading: false,
      }));

      // ✅ FIX: For social users, go directly to step 2 (which is profile details in social flow)
      console.log(
        "[EnhancedSignupFlow] Moving to step 2 (profile details) for social user"
      );
      setCurrentStep(2); // Step 2 in social flow = Profile Details
    },
    [searchParams]
  );

  const generateUsernameFromData = useCallback(
    (data: any, provider: string, email: string | null = null) => {
      if (provider === "google") {
        const baseUsername =
          data.given_name?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
          data.email
            .split("@")[0]
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
        return baseUsername;
      } else if (provider === "microsoft") {
        const baseUsername =
          data.givenName?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
          email
            ?.split("@")[0]
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
        return baseUsername || "";
      }
      return "";
    },
    []
  );

  const nextStep = useCallback(() => {
    console.log("[EnhancedSignupFlow] Moving to next step from:", currentStep);
    const totalSteps = formData.socialProvider ? 3 : 4;
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  }, [currentStep, formData.socialProvider]);

  const prevStep = useCallback(() => {
    console.log(
      "[EnhancedSignupFlow] Moving to previous step from:",
      currentStep
    );

    // ✅ FIX: For social users on step 2 (profile), go back to step 1 (account setup)
    if (currentStep === 2 && formData.socialProvider) {
      console.log(
        "[EnhancedSignupFlow] Social user going back from profile to account setup"
      );
      setCurrentStep(1);
      return;
    }

    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, [currentStep, formData.socialProvider]);

  useEffect(() => {
    if (uiState.countdown > 0) {
      const timer = setTimeout(
        () =>
          setUiState((prev) => ({ ...prev, countdown: prev.countdown - 1 })),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [uiState.countdown]);

  useEffect(() => {
    if (uiState.error || uiState.success) {
      const timer = setTimeout(() => {
        setUiState((prev) => ({ ...prev, error: null, success: null }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [uiState.error, uiState.success]);

  const handleSocialLogin = useCallback(
    async (provider: "google" | "microsoft") => {
      try {
        console.log(
          "[EnhancedSignupFlow] Initiating social login with:",
          provider
        );
        setUiState((prev) => ({ ...prev, isLoading: true, error: null }));

        const redirectUrl = getRedirectUrl();
        const state =
          redirectUrl !== "/users"
            ? `signup|redirect:${encodeURIComponent(redirectUrl)}`
            : "signup";

        const oauthUrl = `/api/auth/social/${provider}?state=${encodeURIComponent(
          state
        )}`;
        window.location.href = oauthUrl;
      } catch (error) {
        console.error("[EnhancedSignupFlow] Social login error:", error);
        setUiState((prev) => ({
          ...prev,
          error: `Failed to connect with ${provider}. Please try again.`,
          isLoading: false,
        }));
      }
    },
    [getRedirectUrl]
  );

  // ✅ PRODUCTION: Send email verification code (no dev code)
  const sendVerificationCode = useCallback(async () => {
    // ✅ FIX: Skip email verification for social login users
    if (formData.socialProvider) {
      console.log(
        "[EnhancedSignupFlow] Social user - skipping email verification, moving to profile"
      );
      nextStep(); // Go directly to step 3 (profile details)
      return;
    }

    if (!formData.email) {
      setUiState((prev) => ({
        ...prev,
        error: "Please enter a valid email address",
      }));
      return;
    }

    console.log(
      "[EnhancedSignupFlow] Sending verification code to:",
      formData.email
    );
    setUiState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch("/api/auth/send-email-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("[EnhancedSignupFlow] Verification code sent successfully");
        setUiState((prev) => ({
          ...prev,
          success: "Verification code sent to your email!",
          verificationSent: true,
          countdown: 60,
          isLoading: false,
        }));

        nextStep(); // Move to step 2 (verification)
      } else {
        throw new Error(data.error || "Failed to send verification code");
      }
    } catch (err: any) {
      console.error("[EnhancedSignupFlow] Error sending code:", err);
      setUiState((prev) => ({ ...prev, error: err.message, isLoading: false }));
    }
  }, [formData.email, formData.socialProvider, nextStep]);

  // ✅ PRODUCTION: Verify email code
  const verifyCode = useCallback(async () => {
    const code = verificationCode.join("");
    if (!code || code.length !== 6) {
      setUiState((prev) => ({
        ...prev,
        error: "Please enter the complete 6-digit verification code",
      }));
      return;
    }

    console.log("[EnhancedSignupFlow] Verifying code");
    setUiState((prev) => ({ ...prev, isVerifying: true, error: null }));

    try {
      const response = await fetch("/api/auth/verify-email-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          code: code,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(
          "[EnhancedSignupFlow] Email verified successfully, moving to step 3"
        );
        setUiState((prev) => ({
          ...prev,
          success: "Email verified successfully!",
          isVerifying: false,
        }));
        nextStep();
      } else {
        throw new Error(data.error || "Invalid verification code");
      }
    } catch (err: any) {
      console.error("[EnhancedSignupFlow] Verification error:", err);
      setUiState((prev) => ({
        ...prev,
        error: err.message,
        isVerifying: false,
      }));
    }
  }, [verificationCode, formData.email, nextStep]);

  const resendCode = useCallback(async () => {
    console.log("[EnhancedSignupFlow] Resending verification code");
    setUiState((prev) => ({ ...prev, isResending: true }));
    setVerificationCode(["", "", "", "", "", ""]);

    try {
      const response = await fetch("/api/auth/send-email-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (response.ok) {
        setUiState((prev) => ({
          ...prev,
          success: "Verification code resent!",
          countdown: 60,
          isResending: false,
        }));
      } else {
        throw new Error(data.error || "Failed to resend code");
      }
    } catch (err: any) {
      setUiState((prev) => ({
        ...prev,
        error: err.message,
        isResending: false,
      }));
    }
  }, [formData.email]);

  const debouncedCheckUsername = useDebouncedCallback(
    async (username: string) => {
      if (username.length < 3) return;

      const cachedResult = usernameAvailabilityCache.current.get(username);
      if (cachedResult && Date.now() - cachedResult.timestamp < 5 * 60 * 1000) {
        if (!cachedResult.available) {
          setUiState((prev) => ({
            ...prev,
            error: "Username is already taken",
            success: null,
          }));
        } else {
          setUiState((prev) => ({
            ...prev,
            error: null,
            success: "Username is available!",
          }));
        }
        return;
      }

      try {
        const response = await fetch(
          `/api/auth/check-username?username=${username}`
        );
        const data = await response.json();

        usernameAvailabilityCache.current.set(username, {
          available: data.available,
          timestamp: Date.now(),
        });

        if (!data.available) {
          setUiState((prev) => ({
            ...prev,
            error: "Username is already taken",
            success: null,
          }));
        } else {
          setUiState((prev) => ({
            ...prev,
            error: null,
            success: "Username is available!",
          }));
        }
      } catch (err) {
        console.error("Failed to check username:", err);
      }
    },
    500
  );

  const checkUsername = useCallback(
    (username: string) => {
      if (usernameCheckTimerRef.current) {
        clearTimeout(usernameCheckTimerRef.current);
      }

      if (username.length >= 3) {
        debouncedCheckUsername(username);
      }
    },
    [debouncedCheckUsername]
  );
  const handleSignup = useCallback(async () => {
    setUiState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // ✅ CRITICAL: Extract courseId with multiple fallback methods
      let courseId = null;
      let courseMetadata = null;

      // Method 1: Try sessionStorage first
      const storedMetadata = sessionStorage.getItem("signup_course_metadata");
      if (storedMetadata) {
        try {
          const parsed = JSON.parse(storedMetadata);
          courseId = parsed.courseId;
          courseMetadata = parsed;
          console.log(
            "[SignUpFlow] 📦 Found metadata in sessionStorage:",
            parsed
          );
        } catch (e) {
          console.error("[SignUpFlow] Parse error:", e);
        }
      }

      // Method 2: Try localStorage backup
      if (!courseId) {
        const backupMetadata = localStorage.getItem(
          "signup_course_metadata_backup"
        );
        if (backupMetadata) {
          try {
            const parsed = JSON.parse(backupMetadata);
            courseId = parsed.courseId;
            courseMetadata = parsed;
            console.log(
              "[SignUpFlow] 📦 Found metadata in localStorage backup:",
              parsed
            );
          } catch (e) {
            console.error("[SignUpFlow] Parse error from backup:", e);
          }
        }
      }

      // Method 3: Extract from URL
      if (!courseId) {
        const redirectUrl =
          searchParams?.get("redirect") ||
          sessionStorage.getItem("signup_redirect_url") ||
          localStorage.getItem("signup_redirect_url_backup") ||
          "/users";

        const courseMatch = redirectUrl.match(/\/courses\/([a-zA-Z0-9]+)/);
        if (courseMatch) {
          courseId = courseMatch[1];
          console.log("[SignUpFlow] 📦 Extracted courseId from URL:", courseId);
        }
      }

      // Get redirect URL
      let redirectUrl =
        searchParams?.get("redirect") ||
        sessionStorage.getItem("signup_redirect_url") ||
        localStorage.getItem("signup_redirect_url_backup") ||
        "/users";

      let socialToken =
        searchParams?.get("social_token") ||
        sessionStorage.getItem("active_social_token") ||
        null;

      // ✅ Build signup data - ONLY send courseId, let API fetch complete data
      const signupData = {
        ...formData,
        firstName: formData.name,
        lastName: formData.surname,
        socialToken,
        redirectUrl,
        courseMetadata: courseId ? { courseId } : null, // ✅ Minimal data
        metadata: {
          fromCourse: !!courseId,
          redirectUrl: redirectUrl,
        },
      };

      console.log("[SignUpFlow] 📤 SENDING signup request:", {
        email: signupData.email,
        username: signupData.username,
        courseId: courseId,
        hasCourseMetadata: !!courseId,
        redirectUrl: redirectUrl,
      });

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();

      console.log("[SignUpFlow] 📥 RECEIVED response:", {
        success: data.success,
        hasCourseMetadata: !!data.courseMetadata,
        courseTitle: data.courseMetadata?.courseTitle,
        fromCourse: data.fromCourse,
      });

      if (response.ok) {
        // ✅ CRITICAL: Store complete success data with verification
        const successData = {
          fromCourse: data.fromCourse || !!courseId,
          redirectUrl: data.redirectUrl || redirectUrl,
          courseMetadata: data.courseMetadata, // Real data from database
          timestamp: Date.now(),
          source: "api_response",
        };

        console.log("[SignUpFlow] 💾 STORING success data:", successData);

        // Store in multiple places for redundancy
        sessionStorage.setItem(
          "signup_success_data",
          JSON.stringify(successData)
        );
        localStorage.setItem(
          "signup_success_data_backup",
          JSON.stringify(successData)
        );

        // Immediate verification
        const verification = sessionStorage.getItem("signup_success_data");
        console.log("[SignUpFlow] 🔍 Immediate verification:", {
          stored: !!verification,
          data: verification ? JSON.parse(verification) : null,
        });

        // Only cleanup items that are no longer needed
        sessionStorage.removeItem("active_social_token");
        sessionStorage.removeItem("signup_course_metadata"); // Remove old metadata
        localStorage.removeItem("signup_course_metadata_backup"); // Remove old backup
        localStorage.removeItem("signup_redirect_url_backup");

        setUiState((prev) => ({
          ...prev,
          success: "Account created successfully!",
          isLoading: false,
        }));

        // Small delay to ensure storage is written
        setTimeout(() => nextStep(), 150);
      } else {
        throw new Error(data.error || "Failed to create account");
      }
    } catch (err: any) {
      console.error("[SignUpFlow] ❌ Signup error:", err);
      setUiState((prev) => ({ ...prev, error: err.message, isLoading: false }));
    }
  }, [formData, searchParams, nextStep]);

  const handleCodeInput = useCallback(
    (index: number, value: string) => {
      if (value.length > 1) return;

      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);

      if (value && index < 5) {
        const nextInput = document.querySelector(
          `input[data-index="${index + 1}"]`
        ) as HTMLInputElement;
        nextInput?.focus();
      }
    },
    [verificationCode]
  );

  const handleCodeBackspace = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
        const prevInput = document.querySelector(
          `input[data-index="${index - 1}"]`
        ) as HTMLInputElement;
        prevInput?.focus();
      }
    },
    [verificationCode]
  );

  const getPasswordStrength = useCallback((password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  }, []);

  const isLowEndDevice = useMemo(() => {
    if (typeof window === "undefined") return false;

    const navigator = window.navigator as ExtendedNavigator;
    const lowMemory =
      "deviceMemory" in navigator &&
      navigator.deviceMemory !== undefined &&
      navigator.deviceMemory < 4;
    const slowCPU =
      "hardwareConcurrency" in navigator &&
      navigator.hardwareConcurrency !== undefined &&
      navigator.hardwareConcurrency < 4;

    return lowMemory || slowCPU;
  }, []);

const handleDashboardRedirect = useCallback(async () => {
  const successDataStr = sessionStorage.getItem("signup_success_data");
  const successData = successDataStr ? JSON.parse(successDataStr) : null;

  const redirectUrl = successData?.redirectUrl || getRedirectUrl();
  const fromCourse = successData?.fromCourse || redirectUrl.includes("/courses/");
  const courseId = successData?.courseMetadata?.courseId;

  console.log("[EnhancedSignupFlow] Redirecting:", {
    redirectUrl,
    fromCourse,
    courseId,
    successData,
  });

  // ✅ CRITICAL FIX: Force auth refresh and WAIT for completion
  console.log('[SignupFlow] 🔄 Forcing auth state refresh...');
  
  // ✅ NEW: Poll for auth state instead of single check
  let authConfirmed = false;
  let attempts = 0;
  const maxAttempts = 10; // 5 seconds max
  
  while (!authConfirmed && attempts < maxAttempts) {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store',
      });
      
      if (response.ok) {
        const userData = await response.json();
        if (userData.user) {
          console.log('[SignupFlow] ✅ Auth confirmed');
          authConfirmed = true;
          
          // Update AuthContext if available
          if (typeof window !== 'undefined' && (window as any).refreshAuthState) {
            await (window as any).refreshAuthState();
          }
          break;
        }
      }
    } catch (error) {
      console.error('[SignupFlow] Auth check error:', error);
    }
    
    // Wait 500ms before next attempt
    await new Promise(resolve => setTimeout(resolve, 500));
    attempts++;
    console.log(`[SignupFlow] Auth check attempt ${attempts}/${maxAttempts}`);
  }
  
  if (!authConfirmed) {
    console.error('[SignupFlow] ❌ Auth not confirmed after signup');
    // Fallback: redirect anyway, checkout will handle it
  }

  // ✅ Clean up session storage
  sessionStorage.removeItem("post_signup_redirect");
  sessionStorage.removeItem("signup_success_data");
  sessionStorage.removeItem("signup_course_metadata");
  sessionStorage.setItem("signup_completed", "true");
  
  // ✅ Set flag for checkout page
  if (fromCourse) {
    sessionStorage.setItem('force_auth_check_on_return', 'true');
    sessionStorage.setItem('auth_confirmed', 'true'); // ✅ NEW: Signal auth is ready
  }

  // Small additional delay to ensure state propagation
  await new Promise(resolve => setTimeout(resolve, 300));

  // ✅ Redirect
  if (fromCourse && courseId) {
    console.log("[EnhancedSignupFlow] Redirecting to checkout:", courseId);
    window.location.href = `/users/courses/${courseId}/checkout`;
  } else {
    window.location.href = redirectUrl;
  }
}, [getRedirectUrl]);

  return (
    <LazyMotion features={domAnimation}>
      <div className="w-full max-w-full mx-auto relative">
        {/* Red Grid Background */}
        <div className="absolute inset-0 z-0 rounded-2xl sm:rounded-3xl overflow-hidden">
          {!isLowEndDevice && (
            <m.div
              className="absolute inset-0 opacity-15"
              animate={{ opacity: [0.08, 0.22, 0.08] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              style={{
                backgroundImage: `
                  linear-gradient(rgba(239, 68, 68, 0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(239, 68, 68, 0.3) 1px, transparent 1px)
                `,
                backgroundSize: "30px 30px",
              }}
            />
          )}
        </div>

        <m.div
          className="relative z-10 bg-gray-900/50 backdrop-blur-3xl rounded-2xl sm:rounded-3xl border border-gray-700/50 overflow-hidden
                     p-4 sm:p-5 md:p-6 lg:p-6 xl:p-7"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          style={{
            boxShadow:
              "0 25px 80px rgba(0, 0, 0, 0.3), 0 0 40px rgba(239, 68, 68, 0.05)",
          }}
        >
          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-4 sm:mb-5 md:mb-6">
              <m.div
                className="relative bg-gradient-to-br from-red-600/20 to-red-700/20 rounded-xl flex items-center justify-center mx-auto border border-red-500/30 backdrop-blur-sm
                           w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18
                           mb-3 sm:mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.7, type: "spring", stiffness: 200 }}
              >
                <FaUser className="text-red-500 text-xl sm:text-2xl md:text-3xl" />
              </m.div>

              <m.div
                initial={fadeInVariants.hidden}
                animate={fadeInVariants.visible}
                transition={{ delay: 0.3 }}
              >
                <h2
                  className="text-white font-bold mb-1 sm:mb-2 leading-tight
                              text-xl sm:text-2xl md:text-3xl"
                >
                  {steps[currentStep - 1]?.title}
                </h2>
                <p className="text-gray-400 text-sm sm:text-base">
                  {steps[currentStep - 1]?.description}
                </p>
              </m.div>
            </div>

            {/* Progress Bar */}
            <div className="mb-5 sm:mb-6 md:mb-7">
              <div className="relative flex justify-between items-center mb-3 sm:mb-4">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-700/50 -translate-y-1/2 z-0" />

                <m.div
                  className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 z-0 bg-gradient-to-r from-red-500 to-red-600"
                  initial={{ width: "0%" }}
                  animate={{
                    width: formData.socialProvider
                      ? `${((currentStep - 1) / 2) * 100}%` // ✅ 2 steps for social (not counting welcome)
                      : `${((currentStep - 1) / 3) * 100}%`, // ✅ 3 steps for regular
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  style={{
                    boxShadow: isLowEndDevice
                      ? "none"
                      : "0 0 8px rgba(239, 68, 68, 0.4)",
                  }}
                />

                {steps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isCompleted = index < currentStep - 1;
                  const isCurrent = index === currentStep - 1;

                  return (
                    <m.div
                      key={index}
                      className="relative flex flex-col items-center z-10"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.08, duration: 0.3 }}
                    >
                      <m.div
                        className={`relative rounded-full border-2 flex items-center justify-center font-bold
                                   w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10
                                   transition-all duration-300 ${
                                     isCompleted
                                       ? "bg-gradient-to-br from-red-500 to-red-600 border-red-400 text-white"
                                       : isCurrent
                                       ? "bg-gradient-to-br from-red-600/30 to-red-700/30 border-red-500 text-red-400"
                                       : "bg-gray-800/80 border-gray-600/50 text-gray-500"
                                   }`}
                        animate={
                          isCurrent && !isLowEndDevice
                            ? {
                                scale: [1, 1.08, 1],
                              }
                            : {}
                        }
                        transition={
                          isCurrent && !isLowEndDevice
                            ? {
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }
                            : {}
                        }
                      >
                        {isCompleted ? (
                          <FaCheckCircle className="text-sm sm:text-base" />
                        ) : (
                          <StepIcon className="text-xs sm:text-sm" />
                        )}
                      </m.div>

                      <span
                        className={`mt-1.5 font-medium text-center text-[9px] sm:text-[10px] hidden xs:block ${
                          isCompleted || isCurrent
                            ? "text-red-400"
                            : "text-gray-500"
                        }`}
                      >
                        <span className="hidden sm:inline">
                          {step.title.split(" ")[0]}
                        </span>
                        <span className="sm:hidden">
                          {step.title.split(" ")[0].slice(0, 4)}
                        </span>
                      </span>
                    </m.div>
                  );
                })}
              </div>

              <div className="relative w-full bg-gray-800/50 rounded-full overflow-hidden h-1.5 sm:h-2">
                <m.div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-600"
                  initial={{ width: "0%" }}
                  animate={{
                    width: formData.socialProvider
                      ? `${(currentStep / 3) * 100}%` // ✅ Social: 3 total steps including welcome
                      : `${(currentStep / 4) * 100}%`, // ✅ Regular: 4 total steps including welcome
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  style={{
                    willChange: "width",
                    boxShadow: isLowEndDevice
                      ? "none"
                      : "0 0 10px rgba(239, 68, 68, 0.5)",
                  }}
                />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] sm:text-[9px] font-bold text-gray-400">
                  {formData.socialProvider
                    ? Math.round((currentStep / 3) * 100)
                    : Math.round((currentStep / 4) * 100)}
                  %
                </div>
              </div>
            </div>

            {/* Error/Success Messages */}
            <AnimatePresence>
              {(uiState.error || uiState.success) && (
                <m.div
                  className={`rounded-xl border backdrop-blur-sm mb-3 sm:mb-4 p-2.5 sm:p-3 ${
                    uiState.error
                      ? "bg-red-900/30 border-red-500/30 text-red-300"
                      : "bg-green-900/30 border-green-500/30 text-green-300"
                  }`}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  layout
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className={`rounded-full border-2 flex items-center justify-center flex-shrink-0
                                 w-5 h-5 text-xs ${
                                   uiState.error
                                     ? "border-red-400 bg-red-500/20"
                                     : "border-green-400 bg-green-500/20"
                                 }`}
                    >
                      {uiState.error ? "!" : "✓"}
                    </div>
                    <span className="font-medium flex-1 text-xs sm:text-sm line-clamp-2">
                      {uiState.error || uiState.success}
                    </span>
                    <button
                      onClick={() =>
                        setUiState((prev) => ({
                          ...prev,
                          error: null,
                          success: null,
                        }))
                      }
                      className="hover:scale-110 transition-transform flex-shrink-0 text-base sm:text-lg"
                    >
                      ×
                    </button>
                  </div>
                </m.div>
              )}
            </AnimatePresence>

            {/* Steps Content */}
            <div className="relative min-h-[350px] sm:min-h-[380px] md:min-h-[400px]">
              <AnimatePresence mode="wait">
                {/* Step 1: Account Setup (both regular and social) */}
                {currentStep === 1 && (
                  <m.div
                    key="step1"
                    initial={slideInVariants.hidden}
                    animate={slideInVariants.visible}
                    exit={slideInVariants.exit}
                    transition={{ duration: 0.5 }}
                    className="space-y-3 sm:space-y-4"
                  >
                    {formData.socialProvider && (
                      <m.div
                        className="bg-green-900/30 border border-green-500/30 rounded-xl p-2.5 sm:p-3 mb-3 sm:mb-4"
                        initial={fadeInVariants.hidden}
                        animate={fadeInVariants.visible}
                      >
                        <div className="flex items-center space-x-2">
                          <div className="rounded-full bg-green-500/20 border border-green-400 flex items-center justify-center flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7">
                            {formData.socialProvider === "google" && (
                              <FaGoogle className="text-green-400 text-xs" />
                            )}
                            {formData.socialProvider === "microsoft" && (
                              <FaMicrosoft className="text-green-400 text-xs" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-green-300 font-medium text-xs">
                              Connected with{" "}
                              {formData.socialProvider
                                ?.charAt(0)
                                .toUpperCase() +
                                formData.socialProvider?.slice(1)}
                            </p>
                            <p className="text-green-400 truncate text-xs">
                              {formData.email}
                            </p>
                          </div>
                        </div>
                      </m.div>
                    )}

                    {!formData.socialProvider && !uiState.socialDataLoaded && (
                      <>
                        <div className="text-center mb-4 sm:mb-5">
                          <p className="text-gray-300 mb-3 sm:mb-4 text-xs sm:text-sm">
                            <span className="hidden xs:inline">
                              Choose your preferred signup method
                            </span>
                            <span className="xs:hidden">
                              Choose signup method
                            </span>
                          </p>

                          <div className="flex gap-2 sm:gap-3">
                            {[
                              {
                                name: "google",
                                icon: FaGoogle,
                                label: "Google",
                                color:
                                  "bg-gradient-to-br from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 border-red-500/30",
                              },
                              {
                                name: "microsoft",
                                icon: FaMicrosoft,
                                label: "Microsoft",
                                color:
                                  "bg-gradient-to-br from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 border-blue-500/30",
                              },
                            ].map((provider) => (
                              <m.button
                                key={provider.name}
                                onClick={() =>
                                  handleSocialLogin(
                                    provider.name as "google" | "microsoft"
                                  )
                                }
                                disabled={uiState.isLoading}
                                className={`${provider.color} text-white font-semibold rounded-lg border transition-all duration-300 flex flex-col items-center justify-center backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed flex-1
                                           py-2.5 sm:py-3 px-2 sm:px-3 space-y-1 sm:space-y-1.5`}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                {uiState.isLoading ? (
                                  <FaSpinner className="animate-spin text-base sm:text-lg" />
                                ) : (
                                  <provider.icon className="text-base sm:text-lg" />
                                )}
                                <span className="text-[10px] sm:text-xs">
                                  {provider.label}
                                </span>
                              </m.button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center my-4 sm:my-5 space-x-2 sm:space-x-3">
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600/50 to-gray-600/50"></div>
                          <span className="text-gray-400 bg-gray-900/50 rounded-full text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1">
                            <span className="hidden xs:inline">
                              or continue with email
                            </span>
                            <span className="xs:hidden">or email</span>
                          </span>
                          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gray-600/50 to-gray-600/50"></div>
                        </div>
                      </>
                    )}

                    <div className="relative group">
                      <label className="block font-medium text-gray-300 mb-1.5 text-xs sm:text-sm">
                        Email Address
                      </label>
                      <div className="relative">
                        <FaEnvelope className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-red-500/70 group-focus-within:text-red-500 transition-colors z-10 text-xs sm:text-sm" />
                        <input
                          type="email"
                          placeholder="your.email@example.com"
                          value={formData.email}
                          onChange={(e) => {
                            setFormData({ ...formData, email: e.target.value });
                            setUiState((prev) => ({ ...prev, error: null }));
                          }}
                          className="w-full rounded-lg bg-gray-800/40 text-white border border-gray-600/40 focus:border-red-500/60 focus:outline-none placeholder-gray-500 transition-all duration-300 backdrop-blur-sm focus:bg-gray-800/60
                                     p-2.5 sm:p-3 pl-9 sm:pl-11 pr-3 sm:pr-4 text-sm sm:text-base"
                          disabled={!!formData.socialProvider}
                          style={{
                            boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.2)",
                          }}
                        />
                      </div>
                    </div>

                    {!formData.socialProvider && (
                      <div className="relative group">
                        <label className="block font-medium text-gray-300 mb-1.5 text-xs sm:text-sm">
                          Password
                        </label>
                        <div className="relative">
                          <FaLock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-red-500/70 group-focus-within:text-red-500 transition-colors z-10 text-xs sm:text-sm" />
                          <input
                            type={uiState.showPassword ? "text" : "password"}
                            placeholder="Create a strong password"
                            value={formData.password}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                password: e.target.value,
                              });
                              setUiState((prev) => ({ ...prev, error: null }));
                            }}
                            className="w-full rounded-lg bg-gray-800/40 text-white border border-gray-600/40 focus:border-red-500/60 focus:outline-none placeholder-gray-500 transition-all duration-300 backdrop-blur-sm focus:bg-gray-800/60
                                       p-2.5 sm:p-3 pl-9 sm:pl-11 pr-9 sm:pr-11 text-sm sm:text-base"
                            style={{
                              boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.2)",
                            }}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setUiState((prev) => ({
                                ...prev,
                                showPassword: !prev.showPassword,
                              }))
                            }
                            className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-red-500/70 hover:text-red-500 transition-colors z-10 text-sm sm:text-base"
                          >
                            {uiState.showPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>

                        {formData.password && (
                          <m.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-2 space-y-1.5"
                          >
                            <div className="text-gray-400 text-[10px] sm:text-xs">
                              Password strength:
                            </div>
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4].map((level) => {
                                const strength = getPasswordStrength(
                                  formData.password
                                );
                                return (
                                  <div
                                    key={level}
                                    className={`flex-1 rounded-full transition-all duration-300 h-1 sm:h-1.5 ${
                                      strength >= level
                                        ? strength === 1
                                          ? "bg-red-500"
                                          : strength === 2
                                          ? "bg-orange-500"
                                          : strength === 3
                                          ? "bg-yellow-500"
                                          : "bg-green-500"
                                        : "bg-gray-700"
                                    }`}
                                  />
                                );
                              })}
                            </div>
                            <div className="text-gray-400 text-[10px] sm:text-xs">
                              {getPasswordStrength(formData.password) === 1 &&
                                "Weak"}
                              {getPasswordStrength(formData.password) === 2 &&
                                "Fair"}
                              {getPasswordStrength(formData.password) === 3 &&
                                "Good"}
                              {getPasswordStrength(formData.password) === 4 &&
                                "Strong"}
                            </div>
                          </m.div>
                        )}
                      </div>
                    )}

                    <m.button
                      onClick={sendVerificationCode}
                      disabled={
                        !formData.email ||
                        (!formData.socialProvider &&
                          (!formData.password ||
                            formData.password.length < 6)) ||
                        uiState.isLoading
                      }
                      className="w-full bg-gradient-to-r from-red-600/90 to-red-700/90 text-white font-bold rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center backdrop-blur-sm
                                 py-2.5 sm:py-3 space-x-2 text-sm sm:text-base"
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        boxShadow: "0 10px 30px rgba(239, 68, 68, 0.2)",
                      }}
                    >
                      {uiState.isLoading ? (
                        <>
                          <FaSpinner className="animate-spin text-sm" />
                          <span>
                            <span className="hidden xs:inline">Sending...</span>
                            <span className="xs:hidden">Sending...</span>
                          </span>
                        </>
                      ) : (
                        <>
                          <span>
                            <span className="hidden xs:inline">
                              Continue to Email Verification
                            </span>
                            <span className="xs:hidden">Continue</span>
                          </span>
                          <FaArrowRight className="text-xs sm:text-sm" />
                        </>
                      )}
                    </m.button>

                    <m.div
                      className="lg:hidden mt-3 text-center pt-2 border-t border-gray-700/50"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Link
                        href="/auth/login"
                        className="text-gray-400 hover:text-red-400 font-medium transition-all duration-300 inline-block text-xs sm:text-sm"
                      >
                        Already have an account?{" "}
                        <span className="text-red-400 font-bold">
                          Sign in →
                        </span>
                      </Link>
                    </m.div>
                  </m.div>
                )}

                {/* Step 2: Email Verification (ONLY for regular signup) OR Profile Details (for social) */}
                {currentStep === 2 && !formData.socialProvider && (
                  <m.div
                    key="step2-verification"
                    initial={slideInVariants.hidden}
                    animate={slideInVariants.visible}
                    exit={slideInVariants.exit}
                    transition={{ duration: 0.5 }}
                    className="space-y-3 sm:space-y-4"
                  >
                    <div className="mb-4 sm:mb-5">
                      <div className="flex items-center justify-center gap-3 mb-3 sm:mb-4">
                        <m.div
                          className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 rounded-xl flex items-center justify-center border border-blue-500/40
                                     w-12 h-12 sm:w-16 sm:h-16 md:w-18 md:h-18 flex-shrink-0"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring" }}
                        >
                          <FaEnvelope className="text-blue-500 text-base sm:text-xl md:text-2xl" />
                        </m.div>
                        <div className="text-left">
                          <h3 className="text-white font-bold mb-1 text-base sm:text-lg md:text-xl">
                            Verify Your Email
                          </h3>
                        </div>
                      </div>
                      <p className="text-gray-400 text-center px-2 text-xs sm:text-sm">
                        <span className="hidden xs:inline">
                          We've sent a 6-digit verification code to{" "}
                          <span className="text-red-400 font-medium">
                            {formData.email}
                          </span>
                        </span>
                        <span className="xs:hidden">
                          Code sent to your email
                        </span>
                      </p>
                    </div>

                    <m.div
                      initial={fadeInVariants.hidden}
                      animate={fadeInVariants.visible}
                      transition={{ delay: 0.3 }}
                      className="space-y-3 sm:space-y-4"
                    >
                      <p className="text-center text-gray-300 font-medium text-xs sm:text-sm">
                        <span className="hidden xs:inline">
                          Enter 6-Digit Verification Code
                        </span>
                        <span className="xs:hidden">Enter Code</span>
                      </p>
                      <div className="flex justify-center gap-1.5 sm:gap-2">
                        {verificationCode.map((digit, index) => (
                          <input
                            key={index}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            value={digit}
                            data-index={index}
                            onChange={(e) =>
                              handleCodeInput(index, e.target.value)
                            }
                            onKeyDown={(e) => handleCodeBackspace(index, e)}
                            className="rounded-lg bg-gray-800/40 text-white border border-gray-600/40 focus:border-red-500 focus:outline-none text-center font-bold transition-all duration-300 backdrop-blur-sm focus:bg-gray-800/60
                                      w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 text-base sm:text-lg"
                            style={{
                              boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.2)",
                            }}
                          />
                        ))}
                      </div>

                      <div className="text-center">
                        {uiState.countdown > 0 ? (
                          <p className="text-gray-400 text-xs sm:text-sm">
                            <span className="hidden xs:inline">
                              Resend code in{" "}
                            </span>
                            <span className="xs:hidden">Resend in </span>
                            <span className="text-red-400 font-bold">
                              {uiState.countdown}s
                            </span>
                          </p>
                        ) : (
                          <m.button
                            onClick={resendCode}
                            disabled={uiState.isResending}
                            className="text-red-400 hover:text-red-300 font-medium transition-colors disabled:opacity-50 text-xs sm:text-sm"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {uiState.isResending ? (
                              <span className="flex items-center justify-center space-x-2">
                                <FaSpinner className="animate-spin" />
                                <span>Resending...</span>
                              </span>
                            ) : (
                              <>
                                <span className="hidden xs:inline">
                                  Resend Verification Code
                                </span>
                                <span className="xs:hidden">Resend Code</span>
                              </>
                            )}
                          </m.button>
                        )}
                      </div>
                    </m.div>

                    <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 pt-2">
                      <m.button
                        onClick={prevStep}
                        className="flex-1 bg-gray-800/50 text-gray-300 font-semibold rounded-lg hover:bg-gray-700/50 transition-all duration-300 flex items-center justify-center backdrop-blur-sm border border-gray-600/30
                                   py-2.5 sm:py-3 space-x-1.5 text-sm sm:text-base"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FaArrowLeft className="text-xs sm:text-sm" />
                        <span>Back</span>
                      </m.button>

                      {verificationCode.join("").length === 6 && (
                        <m.button
                          onClick={verifyCode}
                          disabled={uiState.isVerifying}
                          className="flex-1 bg-gradient-to-r from-red-600/90 to-red-700/90 text-white font-bold rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center
                                     py-2.5 sm:py-3 space-x-1.5 text-sm sm:text-base"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          style={{
                            boxShadow: "0 10px 30px rgba(239, 68, 68, 0.2)",
                          }}
                        >
                          {uiState.isVerifying ? (
                            <>
                              <FaSpinner className="animate-spin text-sm" />
                              <span>
                                <span className="hidden xs:inline">
                                  Verifying...
                                </span>
                                <span className="xs:hidden">Verify...</span>
                              </span>
                            </>
                          ) : (
                            <>
                              <span>
                                <span className="hidden xs:inline">
                                  Verify Email
                                </span>
                                <span className="xs:hidden">Verify</span>
                              </span>
                              <FaArrowRight className="text-xs sm:text-sm" />
                            </>
                          )}
                        </m.button>
                      )}
                    </div>
                  </m.div>
                )}

                {/* ✅ FIX: Step 2 for social = Profile Details */}
                {currentStep === 2 && formData.socialProvider && (
                  <m.div
                    key="step2-profile"
                    initial={slideInVariants.hidden}
                    animate={slideInVariants.visible}
                    exit={slideInVariants.exit}
                    transition={{ duration: 0.5 }}
                    className="space-y-3 sm:space-y-4"
                  >
                    {/* Show Profile Details form (copy from step 3) */}
                    <div className="text-center mb-4 sm:mb-5">
                      <m.div
                        className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 rounded-xl flex items-center justify-center mx-auto border border-purple-500/40
                                   w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 mb-3 sm:mb-4"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                      >
                        <FaStar className="text-purple-500 text-xl sm:text-2xl" />
                      </m.div>
                      <h3 className="text-white font-bold mb-1.5 sm:mb-2 text-lg sm:text-xl">
                        Complete Your Profile
                      </h3>
                    </div>

                    <m.div
                      initial={fadeInVariants.hidden}
                      animate={fadeInVariants.visible}
                      transition={{ delay: 0.3 }}
                      className="space-y-3 sm:space-y-4"
                    >
                      {/* Username field */}
                      <div className="relative group">
                        <label className="block font-medium text-gray-300 mb-1.5 text-xs sm:text-sm">
                          Username <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <FaUser className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-red-500/70 group-focus-within:text-red-500 transition-colors z-10 text-xs sm:text-sm" />
                          <input
                            type="text"
                            placeholder="johndoe123"
                            value={formData.username}
                            onChange={(e) => {
                              const value = e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9_]/g, "");
                              setFormData({ ...formData, username: value });
                              checkUsername(value);
                            }}
                            className="w-full rounded-lg bg-gray-800/40 text-white border border-gray-600/40 focus:border-red-500/60 focus:outline-none placeholder-gray-500 transition-all duration-300 backdrop-blur-sm focus:bg-gray-800/60
                                       p-2.5 sm:p-3 pl-9 sm:pl-11 pr-3 sm:pr-4 text-sm sm:text-base"
                            style={{
                              boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.2)",
                            }}
                          />
                        </div>
                        <p className="text-gray-500 mt-1 text-[10px] sm:text-xs">
                          <span className="hidden xs:inline">
                            Lowercase letters, numbers, and underscores only
                          </span>
                          <span className="xs:hidden">
                            Letters, numbers, underscores
                          </span>
                        </p>
                      </div>

                      {/* Name fields */}
                      <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
                        <div className="relative group">
                          <label className="block font-medium text-gray-300 mb-1.5 text-xs sm:text-sm">
                            First Name
                          </label>
                          <input
                            type="text"
                            placeholder="John"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            className="w-full rounded-lg bg-gray-800/40 text-white border border-gray-600/40 focus:border-red-500/60 focus:outline-none placeholder-gray-500 transition-all duration-300 backdrop-blur-sm focus:bg-gray-800/60
                                       p-2.5 sm:p-3 text-sm sm:text-base"
                            style={{
                              boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.2)",
                            }}
                          />
                        </div>

                        <div className="relative group">
                          <label className="block font-medium text-gray-300 mb-1.5 text-xs sm:text-sm">
                            Last Name
                          </label>
                          <input
                            type="text"
                            placeholder="Doe"
                            value={formData.surname}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                surname: e.target.value,
                              })
                            }
                            className="w-full rounded-lg bg-gray-800/40 text-white border border-gray-600/40 focus:border-red-500/60 focus:outline-none placeholder-gray-500 transition-all duration-300 backdrop-blur-sm focus:bg-gray-800/60
                                       p-2.5 sm:p-3 text-sm sm:text-base"
                            style={{
                              boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.2)",
                            }}
                          />
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 pt-2">
                        <m.button
                          onClick={prevStep}
                          className="w-full xs:w-auto flex-1 bg-gray-700/50 hover:bg-gray-700/70 text-white font-medium rounded-lg transition-all duration-300 flex items-center justify-center border border-gray-600/50
                                     py-2 sm:py-2.5 space-x-2 text-xs sm:text-sm"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <FaArrowLeft className="text-xs sm:text-sm" />
                          <span>Back</span>
                        </m.button>

                        <m.button
                          onClick={handleSignup}
                          disabled={
                            !formData.username ||
                            formData.username.length < 3 ||
                            uiState.isLoading
                          }
                          className="w-full xs:flex-[2] bg-gradient-to-r from-red-600/90 to-red-700/90 text-white font-bold rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center
                                     py-2.5 sm:py-3 space-x-2 text-sm sm:text-base"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {uiState.isLoading ? (
                            <>
                              <FaSpinner className="animate-spin text-sm" />
                              <span>Creating...</span>
                            </>
                          ) : (
                            <>
                              <span>Create Account</span>
                              <FaArrowRight className="text-xs sm:text-sm" />
                            </>
                          )}
                        </m.button>
                      </div>
                    </m.div>
                  </m.div>
                )}

                {/* Step 3: Profile Details (ONLY for regular signup) */}
                {currentStep === 3 && !formData.socialProvider && (
                  <m.div
                    key="step3"
                    initial={slideInVariants.hidden}
                    animate={slideInVariants.visible}
                    exit={slideInVariants.exit}
                    transition={{ duration: 0.5 }}
                    className="space-y-3 sm:space-y-4"
                  >
                    <div className="text-center mb-4 sm:mb-5">
                      <m.div
                        className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 rounded-xl flex items-center justify-center mx-auto border border-purple-500/40
                                   w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 mb-3 sm:mb-4"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                      >
                        <FaStar className="text-purple-500 text-xl sm:text-2xl" />
                      </m.div>
                      <h3 className="text-white font-bold mb-1.5 sm:mb-2 text-lg sm:text-xl">
                        Complete Your Profile
                      </h3>
                    </div>

                    <m.div
                      initial={fadeInVariants.hidden}
                      animate={fadeInVariants.visible}
                      transition={{ delay: 0.3 }}
                      className="space-y-3 sm:space-y-4"
                    >
                      <div className="relative group">
                        <label className="block font-medium text-gray-300 mb-1.5 text-xs sm:text-sm">
                          Username <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <FaUser className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-red-500/70 group-focus-within:text-red-500 transition-colors z-10 text-xs sm:text-sm" />
                          <input
                            type="text"
                            placeholder="johndoe123"
                            value={formData.username}
                            onChange={(e) => {
                              const value = e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9_]/g, "");
                              setFormData({ ...formData, username: value });
                              checkUsername(value);
                            }}
                            className="w-full rounded-lg bg-gray-800/40 text-white border border-gray-600/40 focus:border-red-500/60 focus:outline-none placeholder-gray-500 transition-all duration-300 backdrop-blur-sm focus:bg-gray-800/60
                                       p-2.5 sm:p-3 pl-9 sm:pl-11 pr-3 sm:pr-4 text-sm sm:text-base"
                            style={{
                              boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.2)",
                            }}
                          />
                        </div>
                        <p className="text-gray-500 mt-1 text-[10px] sm:text-xs">
                          <span className="hidden xs:inline">
                            Lowercase letters, numbers, and underscores only
                          </span>
                          <span className="xs:hidden">
                            Letters, numbers, underscores
                          </span>
                        </p>
                      </div>

                      <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
                        <div className="relative group">
                          <label className="block font-medium text-gray-300 mb-1.5 text-xs sm:text-sm">
                            First Name
                          </label>
                          <input
                            type="text"
                            placeholder="John"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            className="w-full rounded-lg bg-gray-800/40 text-white border border-gray-600/40 focus:border-red-500/60 focus:outline-none placeholder-gray-500 transition-all duration-300 backdrop-blur-sm focus:bg-gray-800/60
                                       p-2.5 sm:p-3 text-sm sm:text-base"
                            style={{
                              boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.2)",
                            }}
                          />
                        </div>

                        <div className="relative group">
                          <label className="block font-medium text-gray-300 mb-1.5 text-xs sm:text-sm">
                            Last Name
                          </label>
                          <input
                            type="text"
                            placeholder="Doe"
                            value={formData.surname}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                surname: e.target.value,
                              })
                            }
                            className="w-full rounded-lg bg-gray-800/40 text-white border border-gray-600/40 focus:border-red-500/60 focus:outline-none placeholder-gray-500 transition-all duration-300 backdrop-blur-sm focus:bg-gray-800/60
                                       p-2.5 sm:p-3 text-sm sm:text-base"
                            style={{
                              boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.2)",
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 pt-2">
                        <m.button
                          onClick={prevStep}
                          className="w-full xs:w-auto flex-1 bg-gray-700/50 hover:bg-gray-700/70 text-white font-medium rounded-lg transition-all duration-300 flex items-center justify-center border border-gray-600/50
                                     py-2 sm:py-2.5 space-x-2 text-xs sm:text-sm"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <FaArrowLeft className="text-xs sm:text-sm" />
                          <span>Back</span>
                        </m.button>

                        <m.button
                          onClick={handleSignup}
                          disabled={
                            !formData.username ||
                            formData.username.length < 3 ||
                            uiState.isLoading
                          }
                          className="w-full xs:flex-[2] bg-gradient-to-r from-red-600/90 to-red-700/90 text-white font-bold rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center
                                     py-2.5 sm:py-3 space-x-2 text-sm sm:text-base"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {uiState.isLoading ? (
                            <>
                              <FaSpinner className="animate-spin text-sm" />
                              <span>
                                <span className="hidden xs:inline">
                                  Creating Account...
                                </span>
                                <span className="xs:hidden">Creating...</span>
                              </span>
                            </>
                          ) : (
                            <>
                              <span>
                                <span className="hidden xs:inline">
                                  Create Account
                                </span>
                                <span className="xs:hidden">Create</span>
                              </span>
                              <FaArrowRight className="text-xs sm:text-sm" />
                            </>
                          )}
                        </m.button>
                      </div>
                    </m.div>
                  </m.div>
                )}

                {/* ✅ Step 3 for social OR Step 4 for regular = Success */}
                {/* ✅ Step 3 for social OR Step 4 for regular = Success */}
{((currentStep === 3 && formData.socialProvider) || (currentStep === 4 && !formData.socialProvider)) && (
  <m.div
    key="step-success"
    initial={successVariants.hidden}
    animate={successVariants.visible}
    exit={successVariants.exit}
    transition={{ duration: 0.7 }}
    className="text-center space-y-4 sm:space-y-5 py-6 sm:py-8"
  >
    <m.div
      className="bg-gradient-to-br from-green-600/20 to-green-700/20 rounded-full flex items-center justify-center mx-auto border-4 border-green-500/40
                 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
    >
      <FaCheckCircle className="text-green-500 text-3xl sm:text-4xl md:text-5xl" />
    </m.div>

    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      {(() => {
        // ✅ Read success data with multiple fallbacks and validation
        let successData = null;
        
        // Try sessionStorage first
        const successDataStr = sessionStorage.getItem("signup_success_data");
        if (successDataStr) {
          try {
            successData = JSON.parse(successDataStr);
            console.log("[Success Screen] 📦 Loaded from sessionStorage:", successData);
          } catch (e) {
            console.error("[Success Screen] ❌ Parse error sessionStorage:", e);
          }
        }
        
        // Fallback to localStorage backup
        if (!successData) {
          const backupDataStr = localStorage.getItem("signup_success_data_backup");
          if (backupDataStr) {
            try {
              successData = JSON.parse(backupDataStr);
              console.log("[Success Screen] 📦 Loaded from localStorage backup:", successData);
            } catch (e) {
              console.error("[Success Screen] ❌ Parse error backup:", e);
            }
          }
        }

        const courseMetadata = successData?.courseMetadata;
        const fromCourse = successData?.fromCourse || false;

        console.log("[Success Screen] 🎯 Final render state:", {
          fromCourse,
          hasCourseMetadata: !!courseMetadata,
          courseTitle: courseMetadata?.courseTitle,
          courseId: courseMetadata?.courseId,
          source: successData?.source,
        });

        // ✅ Show special message for course signup
        if (fromCourse && courseMetadata?.courseTitle) {
          return (
            <>
              <h2 className="text-white font-black mb-2 sm:mb-3 text-2xl sm:text-3xl md:text-4xl">
                🎉 Let's Purchase This Course!
              </h2>
              <p className="text-gray-400 max-w-md mx-auto px-4 text-sm sm:text-base leading-relaxed">
                <span className="hidden xs:inline">
                  Your account is ready. Now let's get you enrolled in{" "}
                  <span className="text-red-400 font-bold text-lg">
                    {courseMetadata.courseTitle}
                  </span>
                </span>
                <span className="xs:inline">
                  Ready to enroll in{" "}
                  <span className="text-red-400 font-bold">
                    {courseMetadata.courseTitle}
                  </span>
                  !
                </span>
              </p>
              {(courseMetadata.courseSalePrice || courseMetadata.coursePrice) && (
                <p className="text-red-400 font-bold text-lg sm:text-xl mt-2">
                  {courseMetadata.courseSalePrice 
                    ? `$${courseMetadata.courseSalePrice}` 
                    : `$${courseMetadata.coursePrice}`}
                </p>
              )}
            </>
          );
        }

        // Default welcome message
        return (
          <>
            <h2 className="text-white font-black mb-2 sm:mb-3 text-2xl sm:text-3xl md:text-4xl">
              Welcome Aboard!
            </h2>
            <p className="text-gray-400 max-w-md mx-auto px-4 text-sm sm:text-base">
              <span className="hidden xs:inline">
                Your account has been created successfully. Let's get you started on your journey with VerseAndMe Scales.
              </span>
              <span className="xs:hidden">Account created! Let's get started.</span>
            </p>
          </>
        );
      })()}
    </m.div>

    <m.div
      className="flex flex-col xs:flex-row gap-2 sm:gap-3 max-w-md mx-auto pt-4 sm:pt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <m.button
        onClick={handleDashboardRedirect}
        className="flex-1 bg-gradient-to-r from-red-600/90 to-red-700/90 text-white font-bold rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center justify-center
                   py-2.5 sm:py-3 space-x-2 text-sm sm:text-base"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {(() => {
          // Re-read success data for button text
          let successData = null;
          const successDataStr = sessionStorage.getItem("signup_success_data");
          
          if (successDataStr) {
            try {
              successData = JSON.parse(successDataStr);
            } catch (e) {
              // Fallback to backup
              const backupStr = localStorage.getItem("signup_success_data_backup");
              if (backupStr) {
                try {
                  successData = JSON.parse(backupStr);
                } catch (e2) {
                  console.error("Parse error:", e2);
                }
              }
            }
          }

          const courseMetadata = successData?.courseMetadata;
          const fromCourse = successData?.fromCourse || false;

          return (
            <>
              <span>
                {fromCourse && courseMetadata ? (
                  <>
                    <span className="hidden xs:inline">
                      Proceed to Checkout
                    </span>
                    <span className="xs:hidden">Checkout</span>
                  </>
                ) : (
                  <>
                    <span className="hidden xs:inline">Go to Dashboard</span>
                    <span className="xs:hidden">Dashboard</span>
                  </>
                )}
              </span>
              <FaArrowRight className="text-xs sm:text-sm" />
            </>
          );
        })()}
      </m.button>
    </m.div>
  </m.div>
)}
              </AnimatePresence>
            </div>
          </div>
        </m.div>
      </div>
    </LazyMotion>
  );
};

export default memo(EnhancedSignupFlow);
