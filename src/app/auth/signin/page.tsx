//Volumes/vision/codes/course/my-app/src/app/auth/signin/page.tsx
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, LazyMotion, domAnimation } from "framer-motion";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowRight, FaUser } from "react-icons/fa";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import SocialLogin from '@/components/login/SocialLogin';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

const CACHE_KEYS = {
  EMAIL: 'signin_email',
  REMEMBER_ME: 'signin_remember_me',
};

interface UiState {
  isSubmitting: boolean;
  showPassword: boolean;
  error: string | null;
  success: string | null;
}

export default function SignInPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });

  const [uiState, setUiState] = useState<UiState>({
    isSubmitting: false,
    showPassword: false,
    error: null,
    success: null,
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const formSubmitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { login } = useAuth();

  useEffect(() => {
    const emailParam = searchParams?.get('email');
    
    if (emailParam) {
      setFormData(prev => ({ ...prev, email: decodeURIComponent(emailParam) }));
    } else {
      try {
        const cachedEmail = localStorage.getItem(CACHE_KEYS.EMAIL);
        const cachedRememberMe = localStorage.getItem(CACHE_KEYS.REMEMBER_ME) === 'true';
        
        if (cachedEmail) {
          setFormData(prev => ({ 
            ...prev, 
            email: cachedEmail,
            rememberMe: cachedRememberMe
          }));
        }
      } catch (e) {
        console.error('Error restoring cached data', e);
      }
    }
  }, [searchParams]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (uiState.isSubmitting) return;
    
    if (formSubmitTimeoutRef.current) {
      clearTimeout(formSubmitTimeoutRef.current);
    }
    
    setUiState(prev => ({ 
      ...prev, 
      isSubmitting: true, 
      error: null, 
      success: null 
    }));
    
    try {
      console.log('[SignIn] Attempting login...');
      
      const redirectUrl = searchParams?.get('redirect') || '/users';
      
      const response = await login(
        formData.email, 
        formData.password, 
        formData.rememberMe,
        false,
        redirectUrl
      );
      
      console.log('[SignIn] Login response:', response);
      
      if (response.requiresTwoFactor) {
        console.log('[SignIn] 2FA required, redirecting...');
        
        if (formData.rememberMe) {
          try {
            localStorage.setItem(CACHE_KEYS.EMAIL, formData.email);
            localStorage.setItem(CACHE_KEYS.REMEMBER_ME, 'true');
          } catch (e) {
            console.error('Error caching signin data', e);
          }
        }
        
        router.push(`/auth/2fa-verify?sessionId=${response.twoFactorSessionId}&redirect=${encodeURIComponent(redirectUrl)}`);
        return;
      }
      
      if (formData.rememberMe) {
        try {
          localStorage.setItem(CACHE_KEYS.EMAIL, formData.email);
          localStorage.setItem(CACHE_KEYS.REMEMBER_ME, 'true');
        } catch (e) {
          console.error('Error caching signin data', e);
        }
      } else {
        try {
          localStorage.removeItem(CACHE_KEYS.EMAIL);
          localStorage.removeItem(CACHE_KEYS.REMEMBER_ME);
        } catch (e) {
          console.error('Error removing cached data', e);
        }
      }
      
      setUiState(prev => ({ 
        ...prev, 
        success: "Login successful!",
        isSubmitting: false
      }));
      
      toast.success("Welcome back!");
      
      const finalRedirect = response.redirectPath || redirectUrl;
      
      console.log('[SignIn] Redirecting to:', finalRedirect);
      
      formSubmitTimeoutRef.current = setTimeout(() => {
        router.push(finalRedirect);
      }, 500);
      
    } catch (err: any) {
      console.error('[SignIn] Login error:', err);
      setUiState(prev => ({ 
        ...prev, 
        error: err.message || 'An error occurred during login', 
        isSubmitting: false 
      }));
      toast.error(err.message || 'Login failed');
    }
  }, [formData, router, searchParams, uiState.isSubmitting, login]);

  const handleSocialLogin = useCallback(async (provider: string) => {
    setUiState(prev => ({ ...prev, isSubmitting: true, error: null }));
    
    try {
      const state = crypto.randomUUID();
      sessionStorage.setItem('oauth_state', state);
      
      const redirectUrl = new URL(`/api/auth/social/${provider}`, window.location.origin);
      redirectUrl.searchParams.set('state', 'signin');
      redirectUrl.searchParams.set('csrf', state);
      
      window.location.href = redirectUrl.toString();
    } catch (err: any) {
      setUiState(prev => ({ 
        ...prev, 
        error: err.message || `${provider} login failed. Please try again.`,
        isSubmitting: false
      }));
      toast.error(`${provider} login failed`);
    }
  }, []);

  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <LazyMotion features={domAnimation}>
      {/* Main Content - Centered with optimized mobile spacing */}
      <div className="relative z-20 min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-3 sm:px-6 md:px-8 lg:px-4 xl:px-6 2xl:px-8 py-3 sm:py-6 md:py-8 lg:py-4 xl:py-5 2xl:py-6">
          <div className="flex items-center justify-center max-w-[1800px] mx-auto">
            
            {/* Signin Form - Centered with mobile optimizations */}
            <motion.div
              className="w-full flex items-center justify-center"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="w-full max-w-full sm:max-w-2xl md:max-w-2xl lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-950/60 to-black/80 rounded-xl sm:rounded-2xl md:rounded-3xl border border-red-500/30 backdrop-blur-2xl" />
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-xl sm:rounded-2xl md:rounded-3xl" />
                  
                  <div className="relative p-3 xs:p-4 sm:p-6 md:p-8 lg:p-6 xl:p-8 2xl:p-10">
                    {/* Header section - Compact on mobile */}
                    <motion.div
                      className="text-center mb-3 sm:mb-5 md:mb-6 lg:mb-8"
                      initial={fadeInVariants.hidden}
                      animate={fadeInVariants.visible}
                    >
                      <motion.div
                        className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-red-400/20 to-red-600/20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-4 md:mb-6 border border-red-400/30 backdrop-blur-sm"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.7, type: "spring", stiffness: 200 }}
                      >
                        <FaUser className="text-xl sm:text-2xl md:text-3xl text-red-400" />
                      </motion.div>
                      
                      <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 md:mb-3">
                        Welcome Back
                      </h2>
                      <p className="text-gray-400 text-xs sm:text-sm md:text-base lg:text-lg">
                        Sign in to access your dashboard
                      </p>
                    </motion.div>

                    {/* Error/Success messages - Compact on mobile */}
                    <AnimatePresence>
                      {uiState.error && (
                        <motion.div
                          className="mb-3 sm:mb-4 md:mb-6 p-2 sm:p-3 md:p-4 bg-red-900/30 border border-red-500/30 rounded-lg sm:rounded-xl md:rounded-2xl text-red-300"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                        >
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full border-2 border-red-400 bg-red-500/20 flex items-center justify-center text-xs sm:text-sm shrink-0">
                              !
                            </div>
                            <span className="text-xs sm:text-sm md:text-base font-medium">{uiState.error}</span>
                          </div>
                        </motion.div>
                      )}
                      
                      {uiState.success && (
                        <motion.div
                          className="mb-3 sm:mb-4 md:mb-6 p-2 sm:p-3 md:p-4 bg-green-900/30 border border-green-500/30 rounded-lg sm:rounded-xl md:rounded-2xl text-green-300"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                        >
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full border-2 border-green-400 bg-green-500/20 flex items-center justify-center text-xs sm:text-sm shrink-0">
                              ✓
                            </div>
                            <span className="text-xs sm:text-sm md:text-base font-medium">{uiState.success}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Social Login - Compact on mobile */}
                    <div className="mb-3 sm:mb-5 md:mb-8">
                      <SocialLogin
                        onSocialLogin={handleSocialLogin}
                        setError={(error: string | null) => setUiState(prev => ({ ...prev, error }))}
                      />
                    </div>

                    {/* Form - Compact spacing on mobile */}
                    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-6">
                      {/* Email Field */}
                      <div className="relative group">
                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Email Address</label>
                        <div className="relative">
                          <FaEnvelope className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-red-400/70 group-focus-within:text-red-400 transition-colors z-10 text-xs sm:text-sm" />
                          <input
                            type="email"
                          
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full p-2.5 sm:p-3 md:p-4 pl-9 sm:pl-11 md:pl-12 pr-3 sm:pr-4 rounded-lg sm:rounded-xl text-sm sm:text-base bg-gray-800/40 text-white border border-gray-600/40 focus:border-red-400/60 focus:outline-none placeholder-gray-500 transition-all duration-300 backdrop-blur-sm focus:bg-gray-800/60"
                            style={{ boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.2)" }}
                            required
                            autoComplete="email"
                            disabled={uiState.isSubmitting}
                          />
                        </div>
                      </div>

                      {/* Password Field */}
                      <div className="relative group">
                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Password</label>
                        <div className="relative">
                          <FaLock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-red-400/70 group-focus-within:text-red-400 transition-colors z-10 text-xs sm:text-sm" />
                          <input
                            type={uiState.showPassword ? "text" : "password"}
                        
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full p-2.5 sm:p-3 md:p-4 pl-9 sm:pl-11 md:pl-12 pr-9 sm:pr-11 md:pr-12 rounded-lg sm:rounded-xl text-sm sm:text-base bg-gray-800/40 text-white border border-gray-600/40 focus:border-red-400/60 focus:outline-none placeholder-gray-500 transition-all duration-300 backdrop-blur-sm focus:bg-gray-800/60"
                            style={{ boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.2)" }}
                            required
                            autoComplete="current-password"
                            disabled={uiState.isSubmitting}
                          />
                          <button
                            type="button"
                            onClick={() => setUiState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                            className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-red-400/70 hover:text-red-400 transition-colors z-10 text-xs sm:text-sm"
                            disabled={uiState.isSubmitting}
                          >
                            {uiState.showPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>

                      {/* Remember Me & Forgot Password */}
                      <div className="flex items-center justify-between text-xs sm:text-sm md:text-base">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.rememberMe}
                            onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                            className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 bg-gray-900 border-2 border-red-400 rounded focus:ring-red-400 focus:ring-2"
                            disabled={uiState.isSubmitting}
                          />
                          <span className="text-gray-300 font-medium">Remember me</span>
                        </label>
                        
                        <Link
                          href="/auth/recovery"
                          className="text-red-400 hover:text-red-300 font-semibold transition-colors whitespace-nowrap"
                        >
                          Forgot password?
                        </Link>
                      </div>

                      {/* Submit Button */}
                      <motion.button
                        type="submit"
                        disabled={uiState.isSubmitting}
                        className="w-full bg-gradient-to-r from-red-400/90 to-red-500/90 text-white font-bold py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl text-sm sm:text-base hover:from-red-400 hover:to-red-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 sm:space-x-3"
                        whileHover={{ scale: uiState.isSubmitting ? 1 : 1.02 }}
                        whileTap={{ scale: uiState.isSubmitting ? 1 : 0.98 }}
                        style={{ boxShadow: "0 10px 30px rgba(239, 68, 68, 0.2)" }}
                      >
                        <span>{uiState.isSubmitting ? 'Signing In...' : 'Sign In'}</span>
                        <FaArrowRight className="text-xs sm:text-sm" />
                      </motion.button>
                    </form>

                    {/* Sign Up Link */}
                    <div className="mt-4 sm:mt-6 md:mt-8 text-center">
                      <p className="text-gray-400 text-xs sm:text-sm md:text-base">
                        Don't have an account?{" "}
                        <Link
                          href="/auth/signup"
                          className="text-red-400 hover:text-red-300 font-bold transition-colors"
                        >
                          Sign up for free
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </LazyMotion>
  );
}