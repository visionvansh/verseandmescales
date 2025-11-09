"use client";
import { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import { motion, AnimatePresence, m, LazyMotion, domAnimation } from "framer-motion";
import { 
  FaKey, FaShieldAlt, FaMobileAlt, FaEnvelope, 
  FaSpinner, FaFingerprint, FaArrowLeft, FaCheckCircle, 
  FaExclamationTriangle, FaLockOpen
} from "react-icons/fa";
import { MdVerified, MdOutlineTimer, MdErrorOutline } from "react-icons/md";
import { toast } from "react-hot-toast";

interface ExtendedNavigator extends Navigator {
  deviceMemory?: number;
  hardwareConcurrency: number;
}

interface TwoFactorVerificationProps {
  sessionId: string;
  availableMethods: string[];
  onVerificationSuccess: (data?: any) => void; // ✅ Add optional data parameter
  onBackToLogin: () => void;
  showTrustDevice?: boolean;
  trustThisDevice?: boolean;
  onTrustDeviceChange?: (checked: boolean) => void;
  currentStep?: number;
  onStepChange?: (step: number) => void;
}

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

const TwoFactorVerification = ({
  sessionId,
  availableMethods = ["2fa"],
  onVerificationSuccess,
  onBackToLogin,
  showTrustDevice = false,
  trustThisDevice = false,
  onTrustDeviceChange,
  currentStep = 1,
  onStepChange
}: TwoFactorVerificationProps) => {
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMethod, setActiveMethod] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [animateShake, setAnimateShake] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showAdditionalMethods, setShowAdditionalMethods] = useState(false);
  const [additionalMethods, setAdditionalMethods] = useState<string[]>([]);
  const [primaryMethods, setPrimaryMethods] = useState<string[]>(availableMethods);
  
  const inputRefs = Array(6).fill(0).map(() => useRef<HTMLInputElement>(null));
  const backupInputRef = useRef<HTMLInputElement>(null);

  const steps = useMemo(() => [
    { title: "Choose Method", description: "Select verification", icon: FaShieldAlt },
    { title: "Verify", description: "Complete verification", icon: FaCheckCircle }
  ], []);

  const isLowEndDevice = useMemo(() => {
    if (typeof window === 'undefined') return false;
    
    const navigator = window.navigator as ExtendedNavigator;
    const lowMemory = 'deviceMemory' in navigator && navigator.deviceMemory !== undefined && navigator.deviceMemory < 4;
    const slowCPU = 'hardwareConcurrency' in navigator && navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency < 4;
    
    return lowMemory || slowCPU;
  }, []);

  useEffect(() => {
    const primary = availableMethods.filter(m => 
      ['2fa', 'backup', 'sms', 'email'].includes(m)
    );
    const additional = availableMethods.filter(m => 
      ['passkey', 'recovery_email', 'recovery_phone'].includes(m)
    );
    
    setPrimaryMethods(primary);
    setAdditionalMethods(additional);
  }, [availableMethods]);
  
  useEffect(() => {
    if (currentStep === 2) {
      if (activeMethod === "backup") {
        backupInputRef.current?.focus();
      } else if (activeMethod !== 'passkey') {
        inputRefs[0].current?.focus();
      }
    }
  }, [currentStep, activeMethod]);
  
  useEffect(() => {
    if (resendCooldown > 0) {
      const interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [resendCooldown]);
  
  const handleCodeChange = useCallback((index: number, value: string) => {
    if (value.length > 1) value = value.charAt(0);
    if (!/^\d*$/.test(value)) return;
    
    const newCode = verificationCode.split('');
    newCode[index] = value;
    setVerificationCode(newCode.join(''));
    
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  }, [verificationCode]);
  
  const handleBackupCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    input = input.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    if (input.length <= 16) {
      let formatted = '';
      for (let i = 0; i < input.length; i += 4) {
        const chunk = input.slice(i, i + 4);
        formatted += chunk;
        if (i + 4 < input.length) formatted += '-';
      }
      setBackupCode(formatted);
    }
  }, []);
  
  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    
    if (e.key === 'Enter') {
      if (activeMethod === 'backup') {
        if (backupCode.trim()) handleVerify();
      } else if (verificationCode.length === 6) {
        handleVerify();
      }
    }
  }, [verificationCode, activeMethod, backupCode]);
  
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (activeMethod === 'backup') {
      const alphanumeric = pastedData.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      
      let formatted = '';
      for (let i = 0; i < Math.min(alphanumeric.length, 16); i += 4) {
        const chunk = alphanumeric.slice(i, i + 4);
        formatted += chunk;
        if (i + 4 < alphanumeric.length && i + 4 < 16) formatted += '-';
      }
      
      setBackupCode(formatted);
      return;
    }
    
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(digits);
    
    if (digits.length < 6) {
      inputRefs[digits.length].current?.focus();
    } else {
      inputRefs[5].current?.focus();
    }
  }, [activeMethod]);
  
  // In TwoFactorVerification.tsx, update requestVerificationCode:

const requestVerificationCode = async (method: string, isAdditional: boolean = false) => {
  setIsLoading(true);
  
  try {
    const endpoint = isAdditional 
      ? '/api/auth/2fa/request-additional-code'
      : '/api/auth/2fa/request-code';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        method
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `Failed to send ${method} code`);
    }
    
    const methodName = method === 'email' ? 'email' : 
                      method === 'sms' ? 'SMS' :
                      method === 'recovery_email' ? 'recovery email' :
                      method === 'recovery_phone' ? 'recovery phone' : method;
    
    toast.success(`Verification code sent via ${methodName}`);
    
    // ✅ Show masked contact info
    if (data.partialEmail) {
      toast.success(`Sent to ${data.partialEmail}`, { duration: 5000 });
    }
    if (data.partialPhone) {
      toast.success(`Sent to ${data.partialPhone}`, { duration: 5000 });
    }
    
    setResendCooldown(60);
  } catch (err: any) {
    setError(err.message || `Failed to send ${method} code`);
    toast.error(err.message || `Failed to send ${method} code`);
  } finally {
    setIsLoading(false);
  }
};
  
  const handleMethodSelection = useCallback((method: string, isAdditional: boolean = false) => {
    setActiveMethod(method);
    setError(null);
    setVerificationCode("");
    setBackupCode("");
    
    if (['email', 'sms', 'recovery_email', 'recovery_phone'].includes(method)) {
      requestVerificationCode(method, isAdditional);
    }
    
    if (method === 'passkey') {
      if (onStepChange) onStepChange(2);
      handlePasskeyVerification();
      return;
    }
    
    if (onStepChange) onStepChange(2);
  }, [onStepChange]);
  
  const handlePasskeyVerification = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const optionsResponse = await fetch('/api/auth/passkey/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      if (!optionsResponse.ok) {
        throw new Error('Failed to get passkey options');
      }

      const options = await optionsResponse.json();

      const { startAuthentication } = await import('@simplewebauthn/browser');
      const passkeyResponse = await startAuthentication(options);

      const verifyResponse = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          method: 'passkey',
          passkeyResponse,
          trustThisDevice
        })
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Passkey verification failed');
      }

      setVerificationSuccess(true);
      
      setTimeout(() => {
        toast.success("Passkey verified successfully!");
        onVerificationSuccess();
      }, 1000);
    } catch (error: any) {
      console.error('Passkey verification error:', error);
      setError('Passkey verification failed. Please try another method.');
      toast.error('Passkey verification failed');
      if (onStepChange) onStepChange(1);
      setActiveMethod(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBackToMethodSelection = useCallback(() => {
    if (onStepChange) onStepChange(1);
    setActiveMethod(null);
    setVerificationCode("");
    setBackupCode("");
    setError(null);
  }, [onStepChange]);
  
  const handleVerify = async () => {
    if (!activeMethod) {
      setError("Please select a verification method");
      return;
    }
    
    if (activeMethod === 'backup') {
      if (!backupCode.trim()) {
        setError("Please enter your backup code");
        setAnimateShake(true);
        setTimeout(() => setAnimateShake(false), 500);
        return;
      }
    } else if (verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      setAnimateShake(true);
      setTimeout(() => setAnimateShake(false), 500);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const codeToVerify = activeMethod === 'backup' ? backupCode.trim() : verificationCode;
      
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeToVerify,
          sessionId,
          method: activeMethod,
          trustThisDevice
        })
      });

      if (!response.ok) {
        const data = await response.json();
        
        if (data.failedAttempts !== undefined) {
          setFailedAttempts(data.failedAttempts);
        }
        
        if (data.showAdditionalMethods && data.additionalMethods) {
          setShowAdditionalMethods(true);
          setAdditionalMethods(data.additionalMethods);
          
          toast.error(
            `${data.error}. Additional recovery methods are now available.`,
            { duration: 5000 }
          );
        }
        
        throw new Error(data.error || 'Verification failed');
      }

      // ✅ Get response data
      const data = await response.json();

      setVerificationSuccess(true);

      setTimeout(() => {
        toast.success("Verification successful!");
        onVerificationSuccess(data); // ✅ Pass the response data
      }, 1000);
    } catch (err: any) {
      console.error("Verification failed:", err);
      setError(err.message || "Invalid verification code. Please try again.");
      toast.error(err.message || "Verification failed");
      setAnimateShake(true);
      setTimeout(() => setAnimateShake(false), 500);
      
      if (activeMethod === 'backup') {
        setBackupCode("");
        backupInputRef.current?.focus();
      } else {
        setVerificationCode("");
        inputRefs[0].current?.focus();
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResendCode = async () => {
    if (resendCooldown > 0 || !activeMethod) return;
    
    const isAdditional = additionalMethods.includes(activeMethod);
    await requestVerificationCode(activeMethod, isAdditional);
  };
  
  const getMethodInfo = useCallback((method: string) => {
    switch (method) {
      case "2fa":
        return {
          icon: <FaShieldAlt className="text-red-400" />,
          title: "Authenticator App",
          description: "Enter the 6-digit code from your authenticator app",
          color: "red"
        };
      case "backup":
        return {
          icon: <FaKey className="text-purple-400" />,
          title: "Backup Code",
          description: "Enter one of your backup recovery codes",
          color: "purple"
        };
      case "email":
        return {
          icon: <FaEnvelope className="text-green-400" />,
          title: "Email",
          description: "Enter the 6-digit code sent to your email",
          color: "green"
        };
      case "sms":
        return {
          icon: <FaMobileAlt className="text-blue-400" />,
          title: "SMS",
          description: "Enter the 6-digit code sent to your phone",
          color: "blue"
        };
      case "passkey":
        return {
          icon: <FaFingerprint className="text-indigo-400" />,
          title: "Passkey",
          description: "Use your device's biometric authentication",
          color: "indigo"
        };
      case "recovery_email":
        return {
          icon: <FaEnvelope className="text-orange-400" />,
          title: "Recovery Email",
          description: "Code sent to your recovery email address",
          color: "orange"
        };
      case "recovery_phone":
        return {
          icon: <FaMobileAlt className="text-cyan-400" />,
          title: "Recovery Phone",
          description: "Code sent to your recovery phone number",
          color: "cyan"
        };
      default:
        return {
          icon: <FaShieldAlt className="text-red-400" />,
          title: "Verification",
          description: "Enter the verification code",
          color: "red"
        };
    }
  }, []);
  
  const activeMethodInfo = activeMethod ? getMethodInfo(activeMethod) : null;

  if (verificationSuccess) {
    return (
      <LazyMotion features={domAnimation}>
        <m.div
          className="flex flex-col items-center py-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <m.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6"
          >
            <MdVerified className="text-4xl text-white" />
          </m.div>
          
          <h2 className="text-2xl font-bold text-white mb-3">Verification Successful!</h2>
          <p className="text-gray-400 mb-8 text-center px-4">
            Your identity has been confirmed. Redirecting you to your account...
          </p>
          
          <m.div
            className="w-12 h-1 bg-gray-700 rounded-full overflow-hidden"
            animate={{
              width: [40, 150, 40],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            <m.div
              className="h-full bg-green-400"
              animate={{ x: ["-100%", "200%"] }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
            />
          </m.div>
        </m.div>
      </LazyMotion>
    );
  }

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
                backgroundSize: '30px 30px'
              }}
            />
          )}
          
          {isLowEndDevice && (
            <div 
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(239, 68, 68, 0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(239, 68, 68, 0.3) 1px, transparent 1px)
                `,
                backgroundSize: '30px 30px'
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
          style={{ boxShadow: "0 25px 80px rgba(0, 0, 0, 0.3), 0 0 40px rgba(239, 68, 68, 0.05)" }}
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
                <FaShieldAlt className="text-red-500 text-xl sm:text-2xl md:text-3xl" />
              </m.div>
              
              <m.div
                initial={fadeInVariants.hidden}
                animate={fadeInVariants.visible}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-white font-bold mb-1 sm:mb-2 leading-tight
                              text-xl sm:text-2xl md:text-3xl">
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
                  animate={{ width: `${((currentStep - 1) / 1) * 100}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  style={{
                    boxShadow: isLowEndDevice ? 'none' : '0 0 8px rgba(239, 68, 68, 0.4)'
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
                            ? 'bg-gradient-to-br from-red-500 to-red-600 border-red-400 text-white' 
                            : isCurrent
                            ? 'bg-gradient-to-br from-red-600/30 to-red-700/30 border-red-500 text-red-400'
                            : 'bg-gray-800/80 border-gray-600/50 text-gray-500'
                        }`}
                        animate={isCurrent && !isLowEndDevice ? {
                          scale: [1, 1.08, 1],
                        } : {}}
                        transition={isCurrent && !isLowEndDevice ? {
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        } : {}}
                      >
                        {isCompleted ? (
                          <FaCheckCircle className="text-sm sm:text-base" />
                        ) : (
                          <StepIcon className="text-xs sm:text-sm" />
                        )}
                      </m.div>
                      
                      <span className={`mt-1.5 font-medium text-center text-[9px] sm:text-[10px] hidden xs:block ${
                        isCompleted || isCurrent ? 'text-red-400' : 'text-gray-500'
                      }`}>
                        <span className="hidden sm:inline">{step.title}</span>
                        <span className="sm:hidden">{step.title.split(' ')[0]}</span>
                      </span>
                    </m.div>
                  );
                })}
              </div>
              
              <div className="relative w-full bg-gray-800/50 rounded-full overflow-hidden h-1.5 sm:h-2">
                <m.div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-600"
                  initial={{ width: "0%" }}
                  animate={{ width: `${(currentStep / 2) * 100}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  style={{
                    willChange: 'width',
                    boxShadow: isLowEndDevice ? 'none' : '0 0 10px rgba(239, 68, 68, 0.5)'
                  }}
                />
                
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] sm:text-[9px] font-bold text-gray-400">
                  {Math.round((currentStep / 2) * 100)}%
                </div>
              </div>
            </div>

            {/* Error/Success Messages */}
            <AnimatePresence>
              {(error) && (
                <m.div
                  className="bg-red-900/30 border border-red-500/30 text-red-300 rounded-xl backdrop-blur-sm mb-3 sm:mb-4 p-2.5 sm:p-3"
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  layout
                >
                  <div className="flex items-center space-x-2">
                    <div className="rounded-full border-2 border-red-400 bg-red-500/20 flex items-center justify-center flex-shrink-0 w-5 h-5 text-xs">
                      !
                    </div>
                    <span className="font-medium flex-1 text-xs sm:text-sm line-clamp-2">
                      {error}
                    </span>
                    <button
                      onClick={() => setError(null)}
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
                {/* Step 1: Method Selection */}
                {currentStep === 1 && (
                  <m.div
                    key="step1"
                    initial={slideInVariants.hidden}
                    animate={slideInVariants.visible}
                    exit={slideInVariants.exit}
                    transition={{ duration: 0.5 }}
                    className="space-y-3 sm:space-y-4"
                  >
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-2">Choose a verification method</h3>
                      <p className="text-gray-400 text-sm mb-6">
                        Select one of the methods below to verify your identity
                      </p>
                      
                      {/* Failed Attempts Warning */}
                      {failedAttempts > 0 && (
                        <m.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-xl border mb-6 ${
                            failedAttempts >= 3
                              ? 'bg-red-900/20 border-red-500/30'
                              : 'bg-orange-900/20 border-orange-500/30'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <FaExclamationTriangle className={`text-lg mt-0.5 ${
                              failedAttempts >= 3 ? 'text-red-400' : 'text-orange-400'
                            }`} />
                            <div>
                              <p className={`font-medium ${
                                failedAttempts >= 3 ? 'text-red-200' : 'text-orange-200'
                              }`}>
                                {failedAttempts} failed attempt{failedAttempts > 1 ? 's' : ''}
                              </p>
                              {failedAttempts >= 3 && showAdditionalMethods && (
                                <p className="text-sm text-red-300 mt-1">
                                  Additional recovery methods are now available below
                                </p>
                              )}
                            </div>
                          </div>
                        </m.div>
                      )}
                      
                      {/* Primary Methods */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        {primaryMethods.map(method => {
                          const info = getMethodInfo(method);
                          const MethodIcon = () => info.icon;
                          
                          return (
                            <m.button
                              key={method}
                              onClick={() => handleMethodSelection(method, false)}
                              className={`p-5 rounded-xl flex flex-col items-center justify-center transition-all bg-gray-800/50 border border-gray-700 text-white hover:bg-gray-800 hover:border-${info.color}-500/50`}
                              whileHover={{ scale: 1.03, y: -2 }}
                              whileTap={{ scale: 0.97 }}
                              disabled={isLoading}
                            >
                              <div className={`w-12 h-12 flex items-center justify-center rounded-full mb-3 bg-${info.color}-500/20`}>
                                <MethodIcon />
                              </div>
                              <h4 className="font-medium mb-1 text-sm sm:text-base">{info.title}</h4>
                              <p className="text-xs text-gray-400 text-center">
                                {method === '2fa' && 'Via authenticator app'}
                                {method === 'backup' && 'Via recovery code'}
                                {method === 'email' && 'Via email code'}
                                {method === 'sms' && 'Via text message'}
                              </p>
                            </m.button>
                          );
                        })}
                      </div>
                      
                      {/* Additional Methods */}
                      {showAdditionalMethods && additionalMethods.length > 0 && (
                        <m.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          transition={{ duration: 0.3 }}
                          className="mt-6 pt-6 border-t border-gray-700"
                        >
                          <div className="flex items-center gap-2 mb-4">
                            <FaExclamationTriangle className="text-red-400" />
                            <h3 className="text-lg font-semibold text-white">Additional Recovery Methods</h3>
                          </div>
                          <p className="text-gray-400 text-sm mb-4">
                            These backup methods are available after multiple failed attempts
                          </p>
                          
                          <div className="grid grid-cols-2 gap-4">
                            {additionalMethods.map(method => {
                              const info = getMethodInfo(method);
                              const MethodIcon = () => info.icon;
                              
                              return (
                                <m.button
                                  key={method}
                                  onClick={() => handleMethodSelection(method, true)}
                                  className={`p-5 rounded-xl flex flex-col items-center justify-center transition-all bg-gradient-to-br from-gray-800/70 to-gray-900/70 border-2 border-${info.color}-500/50 text-white hover:bg-gray-800 hover:border-${info.color}-500`}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.1 }}
                                  whileHover={{ scale: 1.05, y: -2 }}
                                  whileTap={{ scale: 0.95 }}
                                  disabled={isLoading}
                                >
                                  <div className={`w-12 h-12 flex items-center justify-center rounded-full mb-3 bg-${info.color}-500/30 border border-${info.color}-500/50`}>
                                    <MethodIcon />
                                  </div>
                                  <h4 className="font-medium mb-1 text-sm sm:text-base">{info.title}</h4>
                                  <p className="text-xs text-gray-400 text-center">
                                    {method === 'passkey' && 'Via biometrics'}
                                    {method === 'recovery_email' && 'Alternative email'}
                                    {method === 'recovery_phone' && 'Alternative phone'}
                                  </p>
                                </m.button>
                              );
                            })}
                          </div>
                        </m.div>
                      )}
                    </div>
                  </m.div>
                )}

                {/* Step 2: Verification */}
                {currentStep === 2 && activeMethod && activeMethod !== 'passkey' && activeMethodInfo && (
                  <m.div
                    key="step2"
                    initial={slideInVariants.hidden}
                    animate={slideInVariants.visible}
                    exit={slideInVariants.exit}
                    transition={{ duration: 0.5 }}
                    className="space-y-3 sm:space-y-4"
                  >
                    <div className="flex items-center mb-6">
                      <button 
                        onClick={handleBackToMethodSelection}
                        className="text-gray-400 hover:text-red-400 transition-colors text-sm flex items-center gap-2"
                        disabled={isLoading}
                      >
                        <FaArrowLeft />
                        <span>Back to methods</span>
                      </button>
                    </div>
                    
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-500/20">
                        {activeMethodInfo.icon}
                      </div>
                      <h2 className="text-xl font-bold mb-2 text-white">{activeMethodInfo.title} Verification</h2>
                      <p className="text-gray-400 text-sm">{activeMethodInfo.description}</p>
                    </div>
                    
                    <m.div className={`${animateShake ? 'animate-shake' : ''}`}>
                      {activeMethod === 'backup' ? (
                        <div className="mb-6">
                          <input
                            ref={backupInputRef}
                            type="text"
                            className="w-full p-4 bg-gray-900/80 text-center text-lg font-mono rounded-lg border-2 border-red-500/30 focus:border-red-400 focus:outline-none transition-all text-white"
                            value={backupCode}
                            onChange={handleBackupCodeChange}
                            placeholder="XXXX-XXXX-XXXX-XXXX"
                            disabled={isLoading}
                            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                            spellCheck="false"
                            autoComplete="off"
                          />
                          <div className="text-xs text-gray-400 mt-2 text-center">
                            Enter the backup code exactly as it was provided to you
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
                          {Array(6).fill(0).map((_, index) => (
                            <m.input
                              key={index}
                              ref={inputRefs[index]}
                              type="text"
                              maxLength={1}
                              className="w-12 h-14 bg-gray-900/80 text-center text-xl font-bold rounded-lg border-2 border-red-500/30 focus:border-red-400 focus:outline-none transition-all text-white"
                              value={verificationCode[index] || ''}
                              onChange={(e) => handleCodeChange(index, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(index, e)}
                              inputMode="numeric"
                              autoComplete={index === 0 ? "one-time-code" : "off"}
                              disabled={isLoading}
                              whileFocus={{ scale: 1.05 }}
                              style={{ caretColor: 'transparent' }}
                            />
                          ))}
                        </div>
                      )}
                    </m.div>
                    
                    {['email', 'sms', 'recovery_email', 'recovery_phone'].includes(activeMethod) && (
                      <div className="flex justify-center items-center space-x-2 mb-6">
                        {resendCooldown > 0 ? (
                          <div className="text-sm text-gray-400 flex items-center gap-2">
                            <MdOutlineTimer />
                            <span>Resend available in {resendCooldown}s</span>
                          </div>
                        ) : (
                          <m.button
                            onClick={handleResendCode}
                            disabled={isLoading}
                            className="text-sm flex items-center gap-2 text-red-400 hover:text-red-300"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <FaMobileAlt />
                            <span>Resend code</span>
                          </m.button>
                        )}
                      </div>
                    )}

                    {showTrustDevice && onTrustDeviceChange && (
                      <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-start gap-3 p-4 mb-6 bg-red-900/10 border border-red-500/20 rounded-xl"
                      >
                        <input
                          type="checkbox"
                          id="trustDeviceVerify"
                          checked={trustThisDevice}
                          onChange={(e) => onTrustDeviceChange(e.target.checked)}
                          className="w-5 h-5 mt-0.5 text-red-400 bg-gray-900 border-2 border-red-400 rounded focus:ring-red-400 focus:ring-2"
                          disabled={isLoading}
                        />
                        <label htmlFor="trustDeviceVerify" className="flex-1 cursor-pointer">
                          <div className="text-sm font-medium text-white flex items-center gap-2">
                            <FaCheckCircle className="text-red-400" />
                            Trust this device for 30 days
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            You won't need to verify on this device again
                          </div>
                        </label>
                      </m.div>
                    )}
                    
                    <m.button
                      onClick={handleVerify}
                      disabled={isLoading || 
                        (activeMethod === 'backup' ? backupCode.length < 10 : verificationCode.length !== 6)}
                      className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isLoading ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <FaLockOpen />
                          <span>Verify & Continue</span>
                        </>
                      )}
                    </m.button>
                  </m.div>
                )}
                
                {/* Passkey Verification */}
                {currentStep === 2 && activeMethod === 'passkey' && (
                  <m.div
                    key="passkey"
                    initial={slideInVariants.hidden}
                    animate={slideInVariants.visible}
                    exit={slideInVariants.exit}
                    className="text-center py-8"
                  >
                    <m.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 10, 0, -10, 0]
                      }}
                      transition={{ 
                        scale: { repeat: Infinity, duration: 2 },
                        rotate: { repeat: Infinity, duration: 3, ease: "easeInOut" }
                      }}
                      className="w-24 h-24 mx-auto mb-6 flex items-center justify-center bg-red-500/20 rounded-full"
                    >
                      <FaFingerprint className="text-5xl text-red-400" />
                    </m.div>
                    <h3 className="text-xl font-bold mb-2 text-white">Authenticating with Passkey</h3>
                    <p className="text-gray-400 mb-6">Please follow the prompts on your device to complete authentication</p>
                    
                    <button
                      onClick={handleBackToMethodSelection}
                      className="text-gray-400 hover:text-red-400 transition-colors flex items-center gap-2 mx-auto"
                    >
                      <FaArrowLeft />
                      <span>Try another method</span>
                    </button>
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

export default memo(TwoFactorVerification);