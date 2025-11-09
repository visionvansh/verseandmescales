"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, LazyMotion, domAnimation } from "framer-motion";
import { FaEnvelope, FaLock, FaArrowRight, FaShieldAlt, FaMobileAlt, FaKey, FaCheckCircle } from "react-icons/fa";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from 'react-hot-toast';

type RecoveryStep = 'email' | 'method' | 'code' | 'password' | 'success';

interface RecoveryOptions {
  hasBackupCodes: boolean;
  hasVerifiedEmail: boolean;
  hasVerifiedPhone: boolean;
  partialEmail?: string;
  partialPhone?: string;
  twoFactorEnabled: boolean;
  twoFactorSessionId?: string;
}

export default function RecoveryPage() {
  const [step, setStep] = useState<RecoveryStep>('email');
  const [email, setEmail] = useState('');
  const [emailFromUrl, setEmailFromUrl] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'email' | 'phone'>('email');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryOptions, setRecoveryOptions] = useState<RecoveryOptions | null>(null);
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams?.get('token');
    const emailParam = searchParams?.get('email');
    const verifiedParam = searchParams?.get('verified');

    if (tokenParam && emailParam) {
      console.log('[Recovery] Token and email from 2FA, skipping to password step');
      setRecoveryToken(tokenParam);
      setEmail(decodeURIComponent(emailParam));
      setEmailFromUrl(decodeURIComponent(emailParam));
      setStep('password');
      toast.success('Identity verified! Set your new password.');
    } else if (verifiedParam === 'true') {
      console.log('[Recovery] Verified but no token, redirecting to start');
      toast('Please start the recovery process again');
      setStep('email');
    }
  }, [searchParams]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToUse = emailFromUrl || email;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/recovery/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse.toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate recovery');
      }

      setRecoveryOptions(data);

      if (data.twoFactorEnabled && data.twoFactorSessionId) {
        toast.success('Please verify your identity with 2FA');
        router.push(`/auth/2fa-verify?sessionId=${data.twoFactorSessionId}&recovery=true`);
        return;
      }

      setStep('method');
      toast.success('Account found! Choose a recovery method.');

    } catch (err: any) {
      setError(err.message || 'Failed to initiate recovery');
      toast.error(err.message || 'Failed to initiate recovery');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMethodSelect = async (method: 'email' | 'phone') => {
    setSelectedMethod(method);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/recovery/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.toLowerCase(),
          method 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      setStep('code');
      setResendCooldown(60);
      
      const destination = method === 'email' ? data.partialEmail : data.partialPhone;
      toast.success(`Verification code sent to ${destination}`);

    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
      toast.error(err.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/recovery/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase(),
          code: verificationCode,
          method: selectedMethod
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid verification code');
      }

      setRecoveryToken(data.token);
      setStep('password');
      toast.success('Code verified! Set your new password.');

    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
      toast.error(err.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/recovery/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: recoveryToken,
          newPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setStep('success');
      toast.success('Password reset successful!');

      setTimeout(() => {
        router.push('/auth/signin');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    await handleMethodSelect(selectedMethod);
  };

  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <LazyMotion features={domAnimation}>
      {/* Main Content */}
      <div className="relative z-20 min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-3 sm:px-6 md:px-8 lg:px-4 xl:px-6 2xl:px-8 py-3 sm:py-6 md:py-8 lg:py-4 xl:py-5 2xl:py-6">
          <div className="flex items-center justify-center max-w-[1800px] mx-auto">
            
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
                    {/* Header */}
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
                        <FaKey className="text-xl sm:text-2xl md:text-3xl text-red-400" />
                      </motion.div>
                      
                      <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 md:mb-3">
                        {step === 'email' && 'Reset Password'}
                        {step === 'method' && 'Choose Recovery Method'}
                        {step === 'code' && 'Verify Identity'}
                        {step === 'password' && 'Create New Password'}
                        {step === 'success' && 'Success!'}
                      </h2>
                      <p className="text-gray-400 text-xs sm:text-sm md:text-base lg:text-lg">
                        {step === 'email' && 'Enter your email to begin recovery'}
                        {step === 'method' && 'Select how you want to receive your code'}
                        {step === 'code' && 'Enter the verification code we sent'}
                        {step === 'password' && 'Choose a strong password'}
                        {step === 'success' && 'Your password has been reset'}
                      </p>
                    </motion.div>

                    {/* Error Message */}
                    <AnimatePresence>
                      {error && (
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
                            <span className="text-xs sm:text-sm md:text-base font-medium">{error}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Step Content */}
                    <AnimatePresence mode="wait">
                      {/* Step 1: Email */}
                      {step === 'email' && (
                        <motion.form
                          key="email-step"
                          onSubmit={handleEmailSubmit}
                          className="space-y-3 sm:space-y-4 md:space-y-6"
                          initial={fadeInVariants.hidden}
                          animate={fadeInVariants.visible}
                          exit={{ opacity: 0, x: -50 }}
                        >
                          <div className="relative group">
                            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Email Address</label>
                            <div className="relative">
                              <FaEnvelope className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-red-400/70 group-focus-within:text-red-400 transition-colors z-10 text-xs sm:text-sm" />
                              <input
                                type="email"
                                placeholder="your.email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-2.5 sm:p-3 md:p-4 pl-9 sm:pl-11 md:pl-12 pr-3 sm:pr-4 rounded-lg sm:rounded-xl text-sm sm:text-base bg-gray-800/40 text-white border border-gray-600/40 focus:border-red-400/60 focus:outline-none placeholder-gray-500 transition-all duration-300 backdrop-blur-sm focus:bg-gray-800/60"
                                style={{ boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.2)" }}
                                required
                                autoComplete="email"
                                disabled={isLoading}
                              />
                            </div>
                          </div>

                          <motion.button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-red-400/90 to-red-500/90 text-white font-bold py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl text-sm sm:text-base hover:from-red-400 hover:to-red-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 sm:space-x-3"
                            whileHover={{ scale: isLoading ? 1 : 1.02 }}
                            whileTap={{ scale: isLoading ? 1 : 0.98 }}
                            style={{ boxShadow: "0 10px 30px rgba(239, 68, 68, 0.2)" }}
                          >
                            <span>{isLoading ? 'Checking...' : 'Continue'}</span>
                            <FaArrowRight className="text-xs sm:text-sm" />
                          </motion.button>
                        </motion.form>
                      )}

                      {/* Step 2: Method Selection */}
                      {step === 'method' && recoveryOptions && (
                        <motion.div
                          key="method-step"
                          className="space-y-4"
                          initial={fadeInVariants.hidden}
                          animate={fadeInVariants.visible}
                          exit={{ opacity: 0, x: -50 }}
                        >
                          <p className="text-gray-400 text-sm text-center mb-6">
                            Choose how you want to receive your verification code
                          </p>

                          <div className="grid gap-4">
                            {recoveryOptions.hasVerifiedEmail && (
                              <motion.button
                                onClick={() => handleMethodSelect('email')}
                                disabled={isLoading}
                                className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-800 hover:border-red-500/50 transition-all group"
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
                                    <FaEnvelope className="text-red-400 text-xl" />
                                  </div>
                                  <div className="flex-1 text-left">
                                    <h3 className="font-semibold text-white mb-1">Email Verification</h3>
                                    <p className="text-sm text-gray-400">
                                      Send code to {recoveryOptions.partialEmail}
                                    </p>
                                  </div>
                                  <FaArrowRight className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </motion.button>
                            )}

                            {recoveryOptions.hasVerifiedPhone && (
                              <motion.button
                                onClick={() => handleMethodSelect('phone')}
                                disabled={isLoading}
                                className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-800 hover:border-red-500/50 transition-all group"
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                                    <FaMobileAlt className="text-blue-400 text-xl" />
                                  </div>
                                  <div className="flex-1 text-left">
                                    <h3 className="font-semibold text-white mb-1">SMS Verification</h3>
                                    <p className="text-sm text-gray-400">
                                      Send code to {recoveryOptions.partialPhone}
                                    </p>
                                  </div>
                                  <FaArrowRight className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* Step 3: Code Verification */}
                      {step === 'code' && (
                        <motion.form
                          key="code-step"
                          onSubmit={handleCodeVerify}
                          className="space-y-6"
                          initial={fadeInVariants.hidden}
                          animate={fadeInVariants.visible}
                          exit={{ opacity: 0, x: -50 }}
                        >
                          <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                              {selectedMethod === 'email' ? (
                                <FaEnvelope className="text-red-400 text-2xl" />
                              ) : (
                                <FaMobileAlt className="text-blue-400 text-2xl" />
                              )}
                            </div>
                            <p className="text-gray-400 text-sm">
                              We sent a verification code to{' '}
                              {selectedMethod === 'email' ? recoveryOptions?.partialEmail : recoveryOptions?.partialPhone}
                            </p>
                          </div>

                          <div className="relative group">
                            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Verification Code</label>
                            <input
                              type="text"
                              placeholder="Enter 6-digit code"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              className="w-full p-4 text-center text-2xl font-bold tracking-widest rounded-xl bg-gray-800/40 text-white border border-gray-600/40 focus:border-red-400/60 focus:outline-none placeholder-gray-500 transition-all duration-300 backdrop-blur-sm focus:bg-gray-800/60"
                              maxLength={6}
                              required
                              disabled={isLoading}
                            />
                          </div>

                          {resendCooldown > 0 ? (
                            <p className="text-center text-sm text-gray-400">
                              Resend code in {resendCooldown}s
                            </p>
                          ) : (
                            <button
                              type="button"
                              onClick={handleResendCode}
                              className="w-full text-center text-sm text-red-400 hover:text-red-300 transition-colors"
                            >
                              Didn't receive the code? Resend
                            </button>
                          )}

                          <motion.button
                            type="submit"
                            disabled={isLoading || verificationCode.length !== 6}
                            className="w-full bg-gradient-to-r from-red-400/90 to-red-500/90 text-white font-bold py-4 rounded-xl hover:from-red-400 hover:to-red-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
                            whileHover={{ scale: isLoading ? 1 : 1.02 }}
                            whileTap={{ scale: isLoading ? 1 : 0.98 }}
                          >
                            <span>{isLoading ? 'Verifying...' : 'Verify Code'}</span>
                            <FaShieldAlt />
                          </motion.button>
                        </motion.form>
                      )}

                      {/* Step 4: New Password */}
                      {step === 'password' && (
                        <motion.form
                          key="password-step"
                          onSubmit={handlePasswordReset}
                          className="space-y-4"
                          initial={fadeInVariants.hidden}
                          animate={fadeInVariants.visible}
                          exit={{ opacity: 0, x: -50 }}
                        >
                          <div className="relative group">
                            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">New Password</label>
                            <div className="relative">
                              <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-red-400/70 group-focus-within:text-red-400 transition-colors z-10" />
                              <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full p-4 pl-12 pr-12 rounded-xl bg-gray-800/40 text-white border border-gray-600/40 focus:border-red-400/60 focus:outline-none placeholder-gray-500 transition-all duration-300 backdrop-blur-sm focus:bg-gray-800/60"
                                required
                                minLength={8}
                                disabled={isLoading}
                              />
                            </div>
                          </div>

                          <div className="relative group">
                            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                            <div className="relative">
                              <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-red-400/70 group-focus-within:text-red-400 transition-colors z-10" />
                              <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-4 pl-12 pr-12 rounded-xl bg-gray-800/40 text-white border border-gray-600/40 focus:border-red-400/60 focus:outline-none placeholder-gray-500 transition-all duration-300 backdrop-blur-sm focus:bg-gray-800/60"
                                required
                                minLength={8}
                                disabled={isLoading}
                              />
                            </div>
                          </div>

                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={showPassword}
                              onChange={(e) => setShowPassword(e.target.checked)}
                              className="w-4 h-4 text-red-400 bg-gray-900 border-2 border-red-400 rounded focus:ring-red-400 focus:ring-2"
                            />
                            <span className="text-gray-300 text-sm">Show passwords</span>
                          </label>

                          <motion.button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-red-400/90 to-red-500/90 text-white font-bold py-4 rounded-xl hover:from-red-400 hover:to-red-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
                            whileHover={{ scale: isLoading ? 1 : 1.02 }}
                            whileTap={{ scale: isLoading ? 1 : 0.98 }}
                          >
                            <span>{isLoading ? 'Resetting...' : 'Reset Password'}</span>
                            <FaCheckCircle />
                          </motion.button>
                        </motion.form>
                      )}

                      {/* Step 5: Success */}
                      {step === 'success' && (
                        <motion.div
                          key="success-step"
                          className="text-center py-8"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                        >
                          <motion.div
                            className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 10 }}
                          >
                            <FaCheckCircle className="text-4xl text-white" />
                          </motion.div>
                          
                          <h3 className="text-2xl font-bold text-white mb-3">Password Reset Successful!</h3>
                          <p className="text-gray-400 mb-8">
                            Your password has been reset successfully. Redirecting to login...
                          </p>
                          
                          <motion.div
                            className="w-12 h-1 bg-gray-700 rounded-full overflow-hidden mx-auto"
                            animate={{
                              width: [40, 150, 40],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                            }}
                          >
                            <motion.div
                              className="h-full bg-green-400"
                              animate={{ x: ["-100%", "200%"] }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                              }}
                            />
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Back to Login */}
                    {step !== 'success' && (
                      <div className="mt-6 text-center">
                        <Link
                          href="/auth/signin"
                          className="text-red-400 hover:text-red-300 font-semibold transition-colors text-sm"
                        >
                          ← Back to Login
                        </Link>
                      </div>
                    )}
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