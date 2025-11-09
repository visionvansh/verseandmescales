"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { FaShieldAlt, FaArrowLeft } from "react-icons/fa";
import { MdSecurity } from "react-icons/md";
import { useAuth } from "@/contexts/AuthContext";
import TwoFactorVerification from "@/components/2fa/TwoFactorVerification";
import { toast } from "react-hot-toast";

export default function VerifyTwoFactorPage() {
  const [sessionId, setSessionId] = useState("");
  const [availableMethods, setAvailableMethods] = useState<string[]>(["2fa"]);
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps] = useState(2);
  const [trustDevice, setTrustDevice] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    const sessionIdParam = searchParams?.get('sessionId');
    const methodsParam = searchParams?.get('methods');
    const recoveryParam = searchParams?.get('recovery');
    
    if (sessionIdParam) {
      setSessionId(sessionIdParam);
    } else {
      router.push('/auth/signin');
    }
    
    if (recoveryParam === 'true') {
      setIsRecoveryMode(true);
    }
    
    try {
      let methods = ['2fa'];
      if (methodsParam) {
        const parsedMethods = JSON.parse(decodeURIComponent(methodsParam));
        if (Array.isArray(parsedMethods) && parsedMethods.length > 0) {
          methods = parsedMethods;
        }
      }
      
      if (!methods.includes('backup')) {
        methods.push('backup');
      }
      
      setAvailableMethods(methods);
    } catch (error) {
      console.error("Failed to parse methods:", error);
      setAvailableMethods(['2fa', 'backup']);
    }
  }, [searchParams, router]);
  
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/users');
    }
  }, [isAuthenticated, router]);
  
  const handleVerificationSuccess = async (responseData?: any) => {
    toast.success("Verification successful!");
    
    if (isRecoveryMode && responseData?.isRecovery && responseData?.recoveryToken) {
      console.log('[2FA Verify] Recovery mode - redirecting with token');
      router.push(`/auth/recovery?token=${responseData.recoveryToken}&email=${encodeURIComponent(responseData.email)}`);
    } else if (isRecoveryMode) {
      router.push('/auth/recovery?verified=true');
    } else {
      router.push('/users');
    }
  };
  
  const handleBackToLogin = () => {
    router.push('/auth/signin');
  };
  
  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };
  
  return (
    <LazyMotion features={domAnimation}>
      {/* Main Content */}
      <div className="relative z-20 min-h-screen flex items-center">
        <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-4 xl:px-6 2xl:px-8 py-4 xs:py-5 sm:py-6 md:py-8 lg:py-3 xl:py-4 2xl:py-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xs:gap-8 sm:gap-10 md:gap-12 lg:gap-6 xl:gap-8 2xl:gap-10 items-center max-w-[1800px] mx-auto">
            
            {/* 2FA Verification Form */}
            <m.div
              className="order-2 lg:order-1 lg:col-span-8 flex items-center justify-center w-full
                         2xl:-ml-12 2xl:justify-start 2xl:pl-8"
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="w-full max-w-full sm:max-w-2xl md:max-w-2xl lg:max-w-xl xl:max-w-2xl 2xl:max-w-[52rem]">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-950/60 to-black/80 rounded-2xl sm:rounded-3xl border border-red-500/30 backdrop-blur-2xl" />
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-2xl sm:rounded-3xl" />
                  
                  <div className="relative p-3 xs:p-4 sm:p-5 md:p-6 lg:p-4 xl:p-5 2xl:p-6">
                    {sessionId ? (
                      <TwoFactorVerification 
                        sessionId={sessionId}
                        availableMethods={availableMethods}
                        onVerificationSuccess={handleVerificationSuccess}
                        onBackToLogin={handleBackToLogin}
                        currentStep={currentStep}
                        onStepChange={handleStepChange}
                        showTrustDevice={true}
                        trustThisDevice={trustDevice}
                        onTrustDeviceChange={setTrustDevice}
                      />
                    ) : (
                      <div className="text-center text-gray-400 py-8">
                        <MdSecurity className="text-5xl text-red-400 mx-auto mb-4" />
                        <p className="mb-4">Invalid verification session. Please try signing in again.</p>
                        <m.button
                          onClick={handleBackToLogin}
                          className="bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-6 rounded-xl font-bold"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Back to Login
                        </m.button>
                      </div>
                    )}
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
              
              {/* Security Badge */}
              <m.div
                className="relative z-[40] mb-6 sm:mb-8 md:mb-10 lg:mb-10" 
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 1 }}
              >
                <div className="bg-gradient-to-br from-red-600/20 to-red-700/20 rounded-full flex items-center justify-center mx-auto border border-red-500/40 backdrop-blur-sm
                               w-24 h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32 mb-6">
                  <FaShieldAlt className="text-red-500 text-4xl lg:text-5xl xl:text-6xl" />
                </div>
                
                <h1 className="font-black text-white mb-1 sm:mb-2 leading-none
                               text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl">
                  SECURE
                </h1>
                <h2 className="font-black bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent leading-none
                               text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl">
                  VERIFICATION
                </h2>
                <div className="h-1.5 sm:h-2 lg:h-2.5 xl:h-3 bg-gradient-to-r from-transparent via-red-500 to-transparent mt-3 sm:mt-4 md:mt-5 lg:mt-5 xl:mt-6 rounded-full opacity-70" />
              </m.div>

              {/* Security Message */}
              <m.div
                className="mt-2 xs:mt-3 sm:mt-4 max-w-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
              >
                <p className="text-gray-400 text-sm md:text-base lg:text-base xl:text-lg mb-4">
                  Protecting your account with an extra layer of security
                </p>
                <m.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <button
                    onClick={handleBackToLogin}
                    className="text-gray-400 hover:text-red-400 font-medium transition-all duration-300 inline-flex items-center gap-2
                               text-sm md:text-base lg:text-base xl:text-lg"
                  >
                    <FaArrowLeft />
                    <span>Return to login</span>
                  </button>
                </m.div>
              </m.div>
            </m.div>
          </div>
        </div>
      </div>

      {/* Mobile Back Button */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        <m.button
          onClick={handleBackToLogin}
          className="bg-gray-900/90 backdrop-blur-sm border border-red-500/30 text-gray-300 hover:text-red-400 font-medium rounded-xl px-6 py-3 flex items-center gap-2 transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaArrowLeft className="text-sm" />
          <span className="text-sm">Back to login</span>
        </m.button>
      </div>
    </LazyMotion>
  );
}