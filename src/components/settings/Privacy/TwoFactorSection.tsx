// Volumes/vision/codes/course/my-app/src/components/settings/Privacy/TwoFactorSection.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaFingerprint,
  FaShieldAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaMobileAlt,
  FaMobile,
  FaEnvelope,
  FaEyeSlash,
  FaKey,
  FaQrcode,
  FaClipboard,
  FaClipboardCheck,
  FaSyncAlt,
  FaFileDownload,
  FaPrint,
  FaPhoneSquare,
  FaPhoneSlash,
  FaCheck,
  FaArrowLeft,
  FaUnlink,
  FaLock,
  FaSpinner,
} from "react-icons/fa";
import axios, { AxiosError } from "axios";
import { debounce } from "lodash";
import BackupCodesView from "./BackupCodesView";

import * as _ from 'lodash';

interface TwoFactorMethod {
  value: string;
  label: string;
  desc: string;
  icon: React.ComponentType<any>;
}

interface TwoFactorSectionProps {
  user: any;
  hasPasswordSet: boolean;
  twoFactorEnabled: boolean;
  setTwoFactorEnabled: (enabled: boolean) => void;
  primaryTwoFactorMethod: string | null;
  setPrimaryTwoFactorMethod: (method: string | null) => void;
  backupCodesEnabled: boolean;
  setBackupCodesEnabled: (enabled: boolean) => void;
  backupCodesCount: number;
  setBackupCodesCount: (count: number) => void;
  recoveryOptionsConfigured: boolean;
  setSuccess: (message: string) => void;
  setError: (message: string) => void;
  fetch2FAStatus: () => Promise<void>;
  fetchTrustedDevices: () => Promise<void>;
  fetchSecurityEvents: () => Promise<void>;
  fetchActivityLogs: () => Promise<void>;
  calculateSecurityScore: (user: any) => void;
  recoveryEmail: string;
  setRecoveryEmail: (email: string) => void;
  useRecoveryEmail: boolean;
  setUseRecoveryEmail: (use: boolean) => void;
  recoveryPhone: string;
  setRecoveryPhone: (phone: string) => void;
  useRecoveryPhone: boolean;
  setUseRecoveryPhone: (use: boolean) => void;
  reloadAllSecurityData: () => Promise<void>;
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
}

interface VerifyTwoFactorRequestData {
  token: string;
  method: string;
  email?: string;
  trustDevice?: boolean;
}

interface DisableTwoFactorRequestData {
  password?: string;
  emailCode?: string;
}

// Remove SMS from twoFactorMethods array
const twoFactorMethods: TwoFactorMethod[] = [
  {
    value: "app",
    label: "Authenticator App",
    desc: "Google Authenticator, Authy, etc.",
    icon: FaMobileAlt,
  },
  // ✅ REMOVED SMS
  {
    value: "email",
    label: "Email Verification",
    desc: "Receive codes via email",
    icon: FaEnvelope,
  },
];

const TwoFactorSection: React.FC<TwoFactorSectionProps> = ({
  user,
  hasPasswordSet,
  twoFactorEnabled,
  setTwoFactorEnabled,
  primaryTwoFactorMethod,
  setPrimaryTwoFactorMethod,
  backupCodesEnabled,
  setBackupCodesEnabled,
  backupCodesCount,
  setBackupCodesCount,
  recoveryOptionsConfigured,
  setSuccess,
  setError,
  fetch2FAStatus,
  fetchTrustedDevices,
  fetchSecurityEvents,
  fetchActivityLogs,
  calculateSecurityScore,
  recoveryEmail,
  setRecoveryEmail,
  useRecoveryEmail,
  setUseRecoveryEmail,
  recoveryPhone,
  setRecoveryPhone,
  useRecoveryPhone,
  setUseRecoveryPhone,
  reloadAllSecurityData,
}) => {
  const [setupTwoFactorMethod, setSetupTwoFactorMethod] = useState<string>("app");
  const [setupStage, setSetupStage] = useState<string>("initial");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [twoFactorSecret, setTwoFactorSecret] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [twoFactorPassword, setTwoFactorPassword] = useState<string>("");
  const [emailVerificationCode, setEmailVerificationCode] = useState<string>("");
  const [awaitingEmailCode, setAwaitingEmailCode] = useState<boolean>(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [disableLoading, setDisableLoading] = useState<boolean>(false);
  const [isGeneratingCodes, setIsGeneratingCodes] = useState<boolean>(false);
  const [emailVerifyLoading, setEmailVerifyLoading] = useState<boolean>(false);
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [emailForVerification, setEmailForVerification] = useState<string>(user?.email || "");
  
  type InputRef = React.RefObject<HTMLInputElement>;
  const [verificationCodeRefs] = useState<InputRef[]>(
    Array(6).fill(0).map(() => useRef<HTMLInputElement>(null) as InputRef)
  );
  const [trustCurrentDevice, setTrustCurrentDevice] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  useEffect(() => {
    if (primaryTwoFactorMethod) {
      setSetupTwoFactorMethod(primaryTwoFactorMethod);
    }
  }, [primaryTwoFactorMethod]);

  const handleStartTwoFactorSetup = async () => {
    setError("");
    setSuccess("");

    setQrCodeUrl("");
    setTwoFactorSecret("");
    setVerificationCode("");
    setEmailVerificationCode("");
    setAwaitingEmailCode(false);
    setEmailSent(false);

    if (setupTwoFactorMethod === "app") {
      try {
        const response = await axios.post("/api/user/2fa/setup", {
          method: setupTwoFactorMethod,
        });
        
        if (response.data && response.data.qrCodeUrl) {
          setQrCodeUrl(response.data.qrCodeUrl);
        }
        
        if (response.data && response.data.secret) {
          setTwoFactorSecret(response.data.secret);
        }
        
        setSetupStage("qrcode");
      } catch (error) {
        const apiError = error as ApiError;
        setError(
          apiError.response?.data?.error ||
            "Failed to setup two-factor authentication"
        );
      }
    } else if (setupTwoFactorMethod === "email") {
      if (!emailForVerification) {
        setError("Please enter your email address");
        return;
      }
      setSetupStage("verify");
    }
  };

  const handleVerificationCodeChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value.replace(/\D/g, "");

    if (value.length <= 1) {
      const newVerificationCode = verificationCode.split("");
      newVerificationCode[index] = value;
      setVerificationCode(newVerificationCode.join(""));

      if (value.length === 1 && index < 5) {
        const nextRef = verificationCodeRefs[index + 1];
        if (nextRef && nextRef.current) {
          nextRef.current.focus();
        }
      }
    }
  };

  const handleVerificationCodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (index > 0 && !verificationCode[index]) {
        const prevRef = verificationCodeRefs[index - 1];
        if (prevRef && prevRef.current) {
          prevRef.current.focus();
        }
      }
    }

    if (e.key === "ArrowLeft" && index > 0) {
      const prevRef = verificationCodeRefs[index - 1];
      if (prevRef && prevRef.current) {
        prevRef.current.focus();
      }
    } else if (e.key === "ArrowRight" && index < 5) {
      const nextRef = verificationCodeRefs[index + 1];
      if (nextRef && nextRef.current) {
        nextRef.current.focus();
      }
    }
  };

  const handleVerificationCodePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, "");

    if (pastedData) {
      const digits = pastedData.slice(0, 6).split("");

      const newCode = [...verificationCode.split("")];
      digits.forEach((digit, i) => {
        if (i < 6) newCode[i] = digit;
      });

      setVerificationCode(newCode.join(""));

      const lastFilledIndex = Math.min(5, digits.length - 1);
      if (lastFilledIndex < 5 && digits.length < 6) {
        const nextRef = verificationCodeRefs[lastFilledIndex + 1];
        if (nextRef && nextRef.current) {
          nextRef.current.focus();
        }
      } else {
        const lastRef = verificationCodeRefs[5];
        if (lastRef && lastRef.current) {
          lastRef.current.focus();
        }
      }
    }
  };

  const handleSendEmailCode = async () => {
    if (!emailForVerification) {
      setError("Please enter your email address");
      return;
    }

    setEmailVerifyLoading(true);
    setError("");

    try {
      const response = await axios.post("/api/user/2fa/send-email", {
        email: emailForVerification,
      });

      if (response.data.success) {
        setEmailSent(true);
        setSuccess("Verification code sent to your email");
      } else {
        throw new Error(response.data.error || "Failed to send email");
      }
    } catch (error) {
      const apiError = error as ApiError;
      setError(
        apiError.response?.data?.error ||
          apiError.message ||
          "Failed to send verification code"
      );
    } finally {
      setEmailVerifyLoading(false);
    }
  };

  const handleVerifyTwoFactor = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit verification code");
      return;
    }

    setError("");
    setSuccess("");

    try {
      setIsVerifying(true);

      const requestData: VerifyTwoFactorRequestData = {
        token: verificationCode,
        method: setupTwoFactorMethod
      };

      if (setupTwoFactorMethod === "email") {
        requestData.email = emailForVerification;
      }

      requestData.trustDevice = trustCurrentDevice;

      const response = await axios.post("/api/user/2fa/verify", requestData);

      setTwoFactorEnabled(true);
      setPrimaryTwoFactorMethod(setupTwoFactorMethod);

      if (response.data.backupCodes && response.data.backupCodes.length > 0) {
        setBackupCodes(response.data.backupCodes);
        setBackupCodesCount(response.data.backupCodes.length);
        setBackupCodesEnabled(true);
        setSetupStage("success");
      } else {
        try {
          const backupResponse = await axios.post("/api/user/2fa/backup-codes");

          if (
            backupResponse.data.backupCodes &&
            backupResponse.data.backupCodes.length > 0
          ) {
            setBackupCodes(backupResponse.data.backupCodes);
            setBackupCodesCount(backupResponse.data.backupCodes.length);
            setBackupCodesEnabled(true);
            setSetupStage("success");
          } else {
            setSuccess("Two-factor authentication enabled successfully.");
            setSetupStage("initial");
          }
        } catch (backupError) {
          console.error("Error fetching backup codes:", backupError);
          setSuccess(
            "Two-factor authentication enabled successfully, but backup codes could not be generated."
          );
          setSetupStage("initial");
        }
      }

      if (trustCurrentDevice) {
        setTimeout(() => {
          fetchTrustedDevices();
        }, 1000);
      }

      await reloadAllSecurityData();

    } catch (error) {
      const apiError = error as ApiError;
      console.error("2FA verification error:", apiError);
      setError(apiError.response?.data?.error || "Invalid verification code");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManageRecoveryOptions = () => {
    setSetupStage("recovery_options");
  };

  const handleBackupCodesConfirmation = async () => {
    try {
      await fetch2FAStatus();
      setBackupCodes([]);
      setSetupStage("initial");
      setSuccess("Two-factor authentication is now fully enabled.");
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Error completing 2FA setup:", apiError);
      setError("Failed to complete 2FA setup. Please try again.");
    }
  };

  const handleGenerateNewBackupCodes = async () => {
    if (
      !confirm(
        "Generating new backup codes will invalidate your existing ones. Are you sure you want to continue?"
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");
    setIsGeneratingCodes(true);

    try {
      const requestData: { password?: string } = {};
      if (twoFactorPassword) {
        requestData.password = twoFactorPassword;
      }

      const response = await axios.post(
        "/api/user/2fa/backup-codes",
        requestData
      );

      if (response.data.backupCodes) {
        setBackupCodes(response.data.backupCodes);
        setBackupCodesCount(response.data.backupCodes.length);
        setBackupCodesEnabled(true);
        setSetupStage("success");
        setSuccess("New backup codes generated successfully");

        await fetchActivityLogs();
      } else {
        throw new Error("No backup codes returned from server");
      }
    } catch (error) {
      const apiError = error as ApiError;
      setError(
        apiError.response?.data?.error || "Failed to generate new backup codes"
      );
    } finally {
      setIsGeneratingCodes(false);
    }
  };

  const handleRequestEmailCode = async () => {
    setError("");
    setDisableLoading(true);

    try {
      if (hasPasswordSet) {
        setError("Please use your password to disable 2FA");
        return;
      }

      const response = await axios.post("/api/user/2fa/disable", {
        requestEmailCode: true,
      });

      if (response.data.requiresEmailCode) {
        setAwaitingEmailCode(true);
        setSuccess(
          "Verification code sent to your email. Please check your inbox."
        );
      }
    } catch (error) {
      const apiError = error as ApiError;
      setError(
        apiError.response?.data?.error || "Failed to send verification email"
      );
    } finally {
      setDisableLoading(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (
      !confirm(
        "Are you sure you want to disable two-factor authentication? This will make your account less secure."
      )
    ) {
      return;
    }

    setError("");
    setDisableLoading(true);

    try {
      const requestData: DisableTwoFactorRequestData = {};

      if (hasPasswordSet) {
        if (!twoFactorPassword) {
          setError("Password is required to disable 2FA");
          setDisableLoading(false);
          return;
        }
        requestData.password = twoFactorPassword;
      } else {
        if (!emailVerificationCode) {
          setError("Email verification code is required to disable 2FA");
          setDisableLoading(false);
          return;
        }
        requestData.emailCode = emailVerificationCode;
      }

      await axios.post("/api/user/2fa/disable", requestData);

      setTwoFactorEnabled(false);
      setPrimaryTwoFactorMethod(null);
      setTwoFactorPassword("");
      setEmailVerificationCode("");
      setAwaitingEmailCode(false);
      setBackupCodesEnabled(false);
      setBackupCodesCount(0);
      setSuccess("Two-factor authentication disabled successfully");

      setSetupStage("initial");

      await reloadAllSecurityData();

    } catch (error) {
      const apiError = error as ApiError;
      setError(
        apiError.response?.data?.error ||
          "Failed to disable two-factor authentication"
      );
    } finally {
      setDisableLoading(false);
    }
  };

  const handleSaveRecoveryOptions = async () => {
    try {
      setError("");
      setSuccess("");

      if (useRecoveryEmail && !recoveryEmail.trim()) {
        setError("Please enter a valid recovery email");
        return;
      }

      if (useRecoveryPhone && !recoveryPhone.trim()) {
        setError("Please enter a valid recovery phone number");
        return;
      }

      const response = await axios.post("/api/user/recovery/setup", {
        recoveryEmail: recoveryEmail.trim(),
        recoveryPhone: recoveryPhone.trim(),
        useRecoveryEmail,
        useRecoveryPhone,
      });

      if (response.data.success) {
        setSuccess("Recovery options saved successfully");

        calculateSecurityScore({
          ...user,
          recoveryEmail: useRecoveryEmail ? recoveryEmail : null,
          recoveryPhone: useRecoveryPhone ? recoveryPhone : null,
        });

        setSetupStage("initial");
      }
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Error saving recovery options:", apiError);
      setError(
        "Failed to save recovery options: " +
          (apiError.response?.data?.error || apiError.message)
      );
    }
  };

  const renderTwoFactorContent = () => {
    if (setupStage === "success" && backupCodes.length > 0) {
      return (
        <BackupCodesView
          backupCodes={backupCodes}
          copiedIndex={copiedIndex}
          setCopiedIndex={setCopiedIndex}
          onBackupCodesConfirmation={handleBackupCodesConfirmation}
        />
      );
    }

    if (setupStage === "recovery_options") {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 sm:space-y-5 md:space-y-6"
        >
          {/* Back Button and Title */}
          <div className="flex items-center mb-4 sm:mb-5 md:mb-6">
            <button
              type="button"
              onClick={() => setSetupStage("initial")}
              className="mr-2 sm:mr-3 md:mr-4 bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 p-2 sm:p-2.5 md:p-3 rounded-full transition-colors"
            >
              <FaArrowLeft className="text-sm sm:text-base md:text-lg" />
            </button>
            <h5 className="text-white font-medium text-sm sm:text-base md:text-lg lg:text-xl flex items-center">
              <FaKey className="mr-2 sm:mr-2.5 md:mr-3 text-red-400 text-sm sm:text-base md:text-lg lg:text-xl" />
              Recovery Options
            </h5>
          </div>

          {/* Info Alert */}
          <div className="bg-red-900/20 border border-red-500/20 p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl">
            <p className="text-red-300 text-xs sm:text-sm md:text-base flex items-start">
              <FaExclamationTriangle className="mr-2 sm:mr-2.5 md:mr-3 mt-0.5 flex-shrink-0 text-xs sm:text-sm md:text-base" />
              Recovery options help you regain access if you lose your device.
            </p>
          </div>

          {/* Recovery Email */}
          <div className="bg-gray-800/30 p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl border border-gray-700/30">
            <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-5">
              <div className="flex items-center flex-1 min-w-0">
                <FaEnvelope className="text-blue-400 mr-2 sm:mr-2.5 md:mr-3 flex-shrink-0 text-sm sm:text-base md:text-lg" />
                <h6 className="text-white font-medium text-xs sm:text-sm md:text-base lg:text-lg truncate">Recovery Email</h6>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-2 sm:ml-3">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={useRecoveryEmail}
                  onChange={() => setUseRecoveryEmail(!useRecoveryEmail)}
                />
                <div className="w-10 sm:w-11 md:w-12 h-5 sm:h-6 md:h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 sm:after:h-5 md:after:h-6 after:w-4 sm:after:w-5 md:after:w-6 after:transition-all peer-checked:bg-blue-400"></div>
              </label>
            </div>

            {useRecoveryEmail && (
              <div className="mt-3 sm:mt-4 md:mt-5">
                <input
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="recovery@email.com"
                  className="w-full rounded-lg sm:rounded-xl border-gray-600/40 bg-gray-700/40 text-white py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 text-xs sm:text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <p className="text-gray-400 text-xs sm:text-sm mt-2 sm:mt-2.5 md:mt-3">
                  Used to recover your account if you lose access
                </p>
              </div>
            )}
          </div>

          {/* Recovery Phone */}
          <div className="bg-gray-800/30 p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl border border-gray-700/30">
            <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-5">
              <div className="flex items-center flex-1 min-w-0">
                <FaMobile className="text-green-400 mr-2 sm:mr-2.5 md:mr-3 flex-shrink-0 text-sm sm:text-base md:text-lg" />
                <h6 className="text-white font-medium text-xs sm:text-sm md:text-base lg:text-lg truncate">Recovery Phone</h6>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-2 sm:ml-3">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={useRecoveryPhone}
                  onChange={() => setUseRecoveryPhone(!useRecoveryPhone)}
                />
                <div className="w-10 sm:w-11 md:w-12 h-5 sm:h-6 md:h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 sm:after:h-5 md:after:h-6 after:w-4 sm:after:w-5 md:after:w-6 after:transition-all peer-checked:bg-green-400"></div>
              </label>
            </div>

            {useRecoveryPhone && (
              <div className="mt-3 sm:mt-4 md:mt-5">
                <input
                  type="tel"
                  value={recoveryPhone}
                  onChange={(e) => setRecoveryPhone(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full rounded-lg sm:rounded-xl border-gray-600/40 bg-gray-700/40 text-white py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 text-xs sm:text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-green-500/50"
                />
                <p className="text-gray-400 text-xs sm:text-sm mt-2 sm:mt-2.5 md:mt-3">
                  Receives verification codes for account recovery
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 pt-3 sm:pt-4 md:pt-5">
            <motion.button
              type="button"
              onClick={() => setSetupStage("initial")}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 sm:py-2.5 md:py-3 lg:py-3.5 rounded-xl sm:rounded-xl md:rounded-2xl transition-colors text-xs sm:text-sm md:text-base"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>

            <motion.button
              type="button"
              onClick={handleSaveRecoveryOptions}
              disabled={
                !(useRecoveryEmail && recoveryEmail) &&
                !(useRecoveryPhone && recoveryPhone)
              }
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-2 sm:py-2.5 md:py-3 lg:py-3.5 rounded-xl sm:rounded-xl md:rounded-2xl hover:from-red-400 hover:to-red-500 transition-all disabled:opacity-50 text-xs sm:text-sm md:text-base"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ boxShadow: "0 10px 30px rgba(239, 68, 68, 0.3)" }}
            >
              Save Options
            </motion.button>
          </div>
        </motion.div>
      );
    }

    if (!twoFactorEnabled && setupStage === "qrcode" && setupTwoFactorMethod === "app") {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 sm:space-y-5 md:space-y-6"
        >
          {/* Back Button and Title */}
          <div className="flex items-center mb-4 sm:mb-5 md:mb-6">
            <button
              type="button"
              onClick={() => setSetupStage("initial")}
              className="mr-2 sm:mr-3 md:mr-4 bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 p-2 sm:p-2.5 md:p-3 rounded-full transition-colors"
            >
              <FaArrowLeft className="text-sm sm:text-base md:text-lg" />
            </button>
            <h5 className="text-white font-medium text-sm sm:text-base md:text-lg lg:text-xl flex items-center">
              <FaQrcode className="mr-2 sm:mr-2.5 md:mr-3 text-red-400 text-sm sm:text-base md:text-lg" />
              Scan QR Code
            </h5>
          </div>

          {/* QR Code and Instructions */}
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl">
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-36 h-36 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56"
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2 sm:space-y-3 md:space-y-4 text-gray-300 text-xs sm:text-sm md:text-base">
              <div className="flex items-start">
                <span className="bg-red-500/20 text-red-400 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0 text-xs sm:text-sm">1</span>
                <span>Download an authenticator app (Google Authenticator, Authy, etc.)</span>
              </div>
              <div className="flex items-start">
                <span className="bg-red-500/20 text-red-400 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0 text-xs sm:text-sm">2</span>
                <span>Scan this QR code with your app</span>
              </div>
              <div className="flex items-start">
                <span className="bg-red-500/20 text-red-400 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0 text-xs sm:text-sm">3</span>
                <span>Enter the 6-digit code below</span>
              </div>
            </div>

            {/* Manual Entry */}
            <div className="bg-gray-800/50 p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl border border-gray-700/30">
              <p className="text-xs sm:text-sm md:text-base text-gray-400 mb-2 sm:mb-3 md:mb-4">Can't scan? Enter manually:</p>
              <div className="flex items-center gap-2 sm:gap-3">
                <code className="bg-gray-900 text-red-400 p-2 sm:p-2.5 md:p-3 rounded font-mono text-xs sm:text-sm md:text-base flex-1 overflow-x-auto break-all">
                  {twoFactorSecret}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(twoFactorSecret);
                    setSuccess("Secret copied to clipboard");
                  }}
                  className="text-gray-400 hover:text-white p-2 sm:p-2.5 md:p-3"
                >
                  <FaClipboard className="text-sm sm:text-base md:text-lg" />
                </button>
              </div>
            </div>
          </div>

          {/* Verification Code Input */}
          <div className="space-y-3 sm:space-y-4 md:space-y-5">
            <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-300">
              Enter 6-digit code:
            </label>

            <div className="grid grid-cols-6 gap-1 sm:gap-2 md:gap-3">
              {Array(6)
                .fill(null)
                .map((_, index) => (
                  <input
                    key={index}
                    type="text"
                    ref={verificationCodeRefs[index]}
                    value={verificationCode[index] || ""}
                    onChange={(e) => handleVerificationCodeChange(e, index)}
                    onKeyDown={(e) => handleVerificationCodeKeyDown(e, index)}
                    onPaste={index === 0 ? handleVerificationCodePaste : undefined}
                    maxLength={1}
                    className="w-full rounded-lg sm:rounded-xl bg-gray-700/40 border border-gray-600/40 text-white py-2 sm:py-3 md:py-4 text-center text-base sm:text-lg md:text-xl lg:text-2xl font-mono focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                  />
                ))}
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
            <motion.button
              type="button"
              onClick={() => setSetupStage("initial")}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 sm:py-2.5 md:py-3 lg:py-3.5 rounded-xl sm:rounded-xl md:rounded-2xl transition-colors text-xs sm:text-sm md:text-base"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FaArrowLeft className="inline mr-1.5 sm:mr-2 md:mr-2.5 text-xs sm:text-sm md:text-base" /> Back
            </motion.button>

            <motion.button
              type="button"
              onClick={handleVerifyTwoFactor}
              disabled={verificationCode.length !== 6 || isVerifying}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-2 sm:py-2.5 md:py-3 lg:py-3.5 rounded-xl sm:rounded-xl md:rounded-2xl hover:from-red-400 hover:to-red-500 transition-all disabled:opacity-50 text-xs sm:text-sm md:text-base flex items-center justify-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ boxShadow: "0 10px 30px rgba(239, 68, 68, 0.3)" }}
            >
              {isVerifying ? (
                <>
                  <FaSpinner className="animate-spin mr-1.5 sm:mr-2 md:mr-2.5 text-xs sm:text-sm md:text-base" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </motion.button>
          </div>
        </motion.div>
      );
    }

    if (!twoFactorEnabled && setupStage === "verify" && setupTwoFactorMethod === "email") {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 sm:space-y-5 md:space-y-6"
        >
          {/* Back Button and Title */}
          <div className="flex items-center mb-4 sm:mb-5 md:mb-6">
            <button
              type="button"
              onClick={() => setSetupStage("initial")}
              className="mr-2 sm:mr-3 md:mr-4 bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 p-2 sm:p-2.5 md:p-3 rounded-full transition-colors"
            >
              <FaArrowLeft className="text-sm sm:text-base md:text-lg" />
            </button>
            <h5 className="text-white font-medium text-sm sm:text-base md:text-lg lg:text-xl flex items-center">
              <>
                <FaEnvelope className="mr-2 sm:mr-2.5 md:mr-3 text-red-400 text-sm sm:text-base md:text-lg" />
                Email Verification
              </>
            </h5>
          </div>

          {/* Contact Info Display */}
          <div className="bg-gray-800/50 p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl border border-gray-700/30">
            <div className="flex items-start">
              <div className={`p-2 sm:p-2.5 md:p-3 rounded-full bg-green-500/20 mr-3 sm:mr-3.5 md:mr-4 flex-shrink-0`}>
                <FaEnvelope className="text-green-400 text-sm sm:text-base md:text-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <h6 className="text-white font-medium text-xs sm:text-sm md:text-base lg:text-lg">
                  Email Address
                </h6>
                <p className="text-gray-400 text-xs sm:text-sm md:text-base mt-1 break-all">
                  {emailForVerification}
                </p>
              </div>
            </div>
          </div>

          {/* Send Code Button (if not sent yet) */}
          {!emailSent && (
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5">
              <p className="text-green-300 text-xs sm:text-sm md:text-base flex items-start mb-3 sm:mb-4 md:mb-5">
                <FaInfoCircle className="mr-2 sm:mr-2.5 md:mr-3 mt-0.5 flex-shrink-0 text-xs sm:text-sm md:text-base" />
                We'll send a verification code to your email address.
              </p>
              <motion.button
                type="button"
                onClick={handleSendEmailCode}
                disabled={emailVerifyLoading || !emailForVerification}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-medium py-2 sm:py-2.5 md:py-3 lg:py-3.5 rounded-lg sm:rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center text-xs sm:text-sm md:text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {emailVerifyLoading ? (
                  <>
                    <FaSpinner className="animate-spin mr-1.5 sm:mr-2 md:mr-2.5 text-xs sm:text-sm md:text-base" />
                    Sending...
                  </>
                ) : (
                  "Send Code"
                )}
              </motion.button>
            </div>
          )}

          {/* Code Input (after sent) */}
          {emailSent && (
            <div className="space-y-3 sm:space-y-4 md:space-y-5">
              {/* Success Message */}
              <div className="p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl bg-green-900/20 border-green-500/30 border">
                <p className="text-xs sm:text-sm md:text-base flex items-start text-green-300">
                  <FaCheckCircle className="mr-2 sm:mr-2.5 md:mr-3 mt-0.5 flex-shrink-0 text-xs sm:text-sm md:text-base" />
                  Code sent! Enter it below.
                </p>
              </div>

              {/* Code Input */}
              <div>
                <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-300 mb-2 sm:mb-3">
                  Enter verification code:
                </label>

                <div className="grid grid-cols-6 gap-1 sm:gap-2 md:gap-3">
                  {Array(6)
                    .fill(null)
                    .map((_, index) => (
                      <input
                        key={index}
                        type="text"
                        ref={verificationCodeRefs[index]}
                        value={verificationCode[index] || ""}
                        onChange={(e) => handleVerificationCodeChange(e, index)}
                        onKeyDown={(e) => handleVerificationCodeKeyDown(e, index)}
                        onPaste={index === 0 ? handleVerificationCodePaste : undefined}
                        maxLength={1}
                        className="w-full rounded-lg sm:rounded-xl bg-gray-700/40 border border-gray-600/40 text-white py-2 sm:py-3 md:py-4 text-center text-base sm:text-lg md:text-xl lg:text-2xl font-mono focus:outline-none focus:ring-2 focus:ring-red-500/50"
                        inputMode="numeric"
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                      />
                    ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
                <motion.button
                  type="button"
                  onClick={() => setSetupStage("initial")}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 sm:py-2.5 md:py-3 lg:py-3.5 rounded-xl sm:rounded-xl md:rounded-2xl transition-colors text-xs sm:text-sm md:text-base"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FaArrowLeft className="inline mr-1.5 sm:mr-2 md:mr-2.5 text-xs sm:text-sm md:text-base" /> Back
                </motion.button>

                <motion.button
                  type="button"
                  onClick={handleVerifyTwoFactor}
                  disabled={verificationCode.length !== 6 || isVerifying}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-2 sm:py-2.5 md:py-3 lg:py-3.5 rounded-xl sm:rounded-xl md:rounded-2xl hover:from-red-400 hover:to-red-500 transition-all disabled:opacity-50 text-xs sm:text-sm md:text-base flex items-center justify-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ boxShadow: "0 10px 30px rgba(239, 68, 68, 0.3)" }}
                >
                  {isVerifying ? (
                    <>
                      <FaSpinner className="animate-spin mr-1.5 sm:mr-2 md:mr-2.5 text-xs sm:text-sm md:text-base" />
                      Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </motion.button>
              </div>

              {/* Resend/Timer */}
              <div className="flex justify-between items-center text-xs sm:text-sm md:text-base">
                <button
                  type="button"
                  onClick={handleSendEmailCode}
                  className="text-green-400 hover:text-green-300"
                  disabled={emailVerifyLoading}
                >
                  Resend code
                </button>
                <p className="text-gray-400">Code valid for 10 min</p>
              </div>
            </div>
          )}
        </motion.div>
      );
    }

    if (twoFactorEnabled && setupStage === "initial") {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 sm:space-y-5 md:space-y-6"
        >
          {/* Status Header */}
          <div className="bg-green-900/20 border border-green-500/30 p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl sm:rounded-xl md:rounded-2xl">
            <div className="flex items-center text-green-400 mb-3 sm:mb-4 md:mb-5 lg:mb-6">
              <FaCheckCircle className="mr-2 sm:mr-2.5 md:mr-3 text-sm sm:text-base md:text-lg" />
              <span className="font-semibold text-xs sm:text-sm md:text-base lg:text-lg">2FA Enabled</span>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5 mb-4 sm:mb-5 md:mb-6">
              <div className="bg-gray-800/30 p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl">
                <h6 className="text-white font-medium mb-1 sm:mb-2 flex items-center text-xs sm:text-sm md:text-base">
                  <FaMobileAlt className="mr-2 sm:mr-2.5 text-red-400 text-xs sm:text-sm md:text-base" />
                  Method
                </h6>
                <p className="text-xs sm:text-sm md:text-base text-gray-300">
                  {primaryTwoFactorMethod && twoFactorMethods.find(m => m.value === primaryTwoFactorMethod)?.label || "Authenticator App"}
                </p>
              </div>

              <div className="bg-gray-800/30 p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl">
                <h6 className="text-white font-medium mb-1 sm:mb-2 flex items-center text-xs sm:text-sm md:text-base">
                  <FaKey className="mr-2 sm:mr-2.5 text-red-400 text-xs sm:text-sm md:text-base" />
                  Backup Codes
                </h6>
                <p className="text-xs sm:text-sm md:text-base text-gray-300">
                  {backupCodesCount} remaining
                </p>
                <motion.button
                  type="button"
                  onClick={handleGenerateNewBackupCodes}
                  disabled={isGeneratingCodes}
                  className="mt-2 text-red-400 hover:text-red-300 text-xs sm:text-sm md:text-base flex items-center"
                  whileHover={{ scale: 1.05 }}
                >
                  {isGeneratingCodes ? (
                    <>
                      <FaSpinner className="animate-spin mr-1 sm:mr-1.5 md:mr-2 text-xs sm:text-sm md:text-base" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FaSyncAlt className="mr-1 sm:mr-1.5 md:mr-2 text-xs sm:text-sm md:text-base" />
                      Generate New
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            {/* Disable Section */}
            <div className="border-t border-gray-700/30 pt-4 sm:pt-5 md:pt-6">
              <h6 className="text-white font-medium text-xs sm:text-sm md:text-base lg:text-lg mb-2 sm:mb-3">Disable 2FA</h6>
              <p className="text-xs sm:text-sm md:text-base text-gray-400 mb-3 sm:mb-4">
                {hasPasswordSet 
                  ? "Enter your password to disable." 
                  : "Verify using your email to disable."}
              </p>

              {hasPasswordSet ? (
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  <input
                    type="password"
                    value={twoFactorPassword}
                    onChange={(e) => setTwoFactorPassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full rounded-lg sm:rounded-xl bg-gray-700/40 border border-gray-600/40 text-white py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 text-xs sm:text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    autoComplete="current-password"
                  />

                  <motion.button
                    type="button"
                    onClick={handleDisableTwoFactor}
                    disabled={!twoFactorPassword || disableLoading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 sm:py-2.5 md:py-3 lg:py-3.5 rounded-lg sm:rounded-xl transition-colors disabled:opacity-50 text-xs sm:text-sm md:text-base flex items-center justify-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {disableLoading ? (
                      <>
                        <FaSpinner className="animate-spin mr-1.5 sm:mr-2 md:mr-2.5 text-xs sm:text-sm md:text-base" />
                        Disabling...
                      </>
                    ) : (
                      <>
                        <FaUnlink className="mr-1.5 sm:mr-2 md:mr-2.5 text-xs sm:text-sm md:text-base" />
                        Disable 2FA
                      </>
                    )}
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4 md:space-y-5">
                  {!awaitingEmailCode ? (
                    <motion.button
                      type="button"
                      onClick={handleRequestEmailCode}
                      disabled={disableLoading}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 sm:py-2.5 md:py-3 lg:py-3.5 rounded-lg sm:rounded-xl transition-colors disabled:opacity-50 text-xs sm:text-sm md:text-base flex items-center justify-center"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {disableLoading ? (
                        <>
                          <FaSpinner className="animate-spin mr-1.5 sm:mr-2 md:mr-2.5 text-xs sm:text-sm md:text-base" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <FaEnvelope className="mr-1.5 sm:mr-2 md:mr-2.5 text-xs sm:text-sm md:text-base" />
                          Send Email Code
                        </>
                      )}
                    </motion.button>
                  ) : (
                    <div className="space-y-2 sm:space-y-3 md:space-y-4">
                      <div className="bg-blue-900/30 border border-blue-500/30 text-blue-300 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl">
                        <p className="text-xs sm:text-sm md:text-base">
                          <FaEnvelope className="inline mr-1.5 sm:mr-2 md:mr-2.5 text-xs sm:text-sm md:text-base" />
                          Code sent to your email
                        </p>
                      </div>

                      <input
                        type="text"
                        value={emailVerificationCode}
                        onChange={(e) =>
                          setEmailVerificationCode(
                            e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase()
                          )
                        }
                        placeholder="Enter 6-digit code"
                        className="w-full rounded-lg sm:rounded-xl bg-gray-700/40 border border-gray-600/40 text-white py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 text-xs sm:text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-center font-mono"
                        maxLength={6}
                      />

                      <motion.button
                        type="button"
                        onClick={handleDisableTwoFactor}
                        disabled={!emailVerificationCode || disableLoading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 sm:py-2.5 md:py-3 lg:py-3.5 rounded-lg sm:rounded-xl transition-colors disabled:opacity-50 text-xs sm:text-sm md:text-base flex items-center justify-center"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {disableLoading ? (
                          <>
                            <FaSpinner className="animate-spin mr-1.5 sm:mr-2 md:mr-2.5 text-xs sm:text-sm md:text-base" />
                            Disabling...
                          </>
                        ) : (
                          <>
                            <FaUnlink className="mr-1.5 sm:mr-2 md:mr-2.5 text-xs sm:text-sm md:text-base" />
                            Disable 2FA
                          </>
                        )}
                      </motion.button>

                      <div className="flex justify-between text-xs sm:text-sm md:text-base">
                        <button
                          type="button"
                          onClick={handleRequestEmailCode}
                          disabled={disableLoading}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Resend
                        </button>
                        <button
                          type="button"
                          onClick={() => setAwaitingEmailCode(false)}
                          className="text-gray-400 hover:text-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      );
    }

    // Default: Initial setup screen
    return (
      <div className="space-y-4 sm:space-y-5 md:space-y-6">
        {/* Method Selection */}
        <div className="bg-gray-800/30 p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl sm:rounded-xl md:rounded-2xl border border-gray-700/30">
          <h5 className="text-white font-medium mb-3 sm:mb-4 md:mb-5 flex items-center text-xs sm:text-sm md:text-base lg:text-lg">
            <FaShieldAlt className="mr-2 sm:mr-2.5 md:mr-3 text-red-400 text-xs sm:text-sm md:text-base lg:text-lg" />
            Choose Method
          </h5>

          <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-300 mb-2 sm:mb-3 md:mb-4">
            Select Your 2FA Method
          </label>
          
          {/* Change from grid-cols-3 to grid-cols-2 */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
            {twoFactorMethods.map((method) => {
              const Icon = method.icon;
              return (
                <motion.div
                  key={method.value}
                  className={`p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border-2 cursor-pointer transition-all ${
                    setupTwoFactorMethod === method.value
                      ? "bg-red-400/10 border-red-400/50"
                      : "bg-gray-800/30 border-gray-700/30 hover:border-gray-600/50"
                  }`}
                  onClick={() => setSetupTwoFactorMethod(method.value)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex flex-col items-center text-center">
                    <Icon
                      className={`mb-1 sm:mb-2 text-base sm:text-lg md:text-xl lg:text-2xl ${setupTwoFactorMethod === method.value ? "text-red-400" : "text-gray-400"}`}
                    />
                    <h5
                      className={`font-medium text-[10px] xs:text-xs sm:text-sm md:text-base leading-tight ${setupTwoFactorMethod === method.value ? "text-red-400" : "text-white"}`}
                    >
                      {method.label.replace(' Verification', '')}
                    </h5>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Email Input */}
          {setupTwoFactorMethod === "email" && (
            <div className="mt-3 sm:mt-4 md:mt-5">
              <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-300 mb-2 sm:mb-3">
                Email Address
              </label>
              <input
                type="email"
                value={emailForVerification}
                onChange={(e) => setEmailForVerification(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-lg sm:rounded-xl border-gray-600/40 bg-gray-700/40 text-white py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 text-xs sm:text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>
          )}

          {/* Info Alert */}
          <div className="mt-3 sm:mt-4 md:mt-5 bg-gray-900/40 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-red-500/30">
            <div className="flex items-start">
              <FaInfoCircle className="text-red-400 mt-0.5 mr-2 sm:mr-2.5 md:mr-3 flex-shrink-0 text-xs sm:text-sm md:text-base" />
              <p className="text-xs sm:text-sm md:text-base text-gray-300">
                Backup codes will be generated automatically. Store them safely.
              </p>
            </div>
          </div>

          {/* Password Warning */}
          {!hasPasswordSet && (
            <div className="mt-3 sm:mt-4 md:mt-5 bg-red-900/20 border border-red-500/30 text-red-300 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl">
              <div className="flex items-start">
                <FaExclamationTriangle className="mt-0.5 mr-2 sm:mr-2.5 md:mr-3 flex-shrink-0 text-xs sm:text-sm md:text-base" />
                <div>
                  <p className="font-medium text-xs sm:text-sm md:text-base">Password Required</p>
                  <p className="text-xs sm:text-sm md:text-base mt-1">Set a password before enabling 2FA.</p>
                </div>
              </div>
            </div>
          )}

          {/* Setup Button */}
          <motion.button
            type="button"
            onClick={handleStartTwoFactorSetup}
            disabled={
              !hasPasswordSet ||
              (setupTwoFactorMethod === "email" && !emailForVerification)
            }
            className="w-full mt-4 sm:mt-5 md:mt-6 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-2 sm:py-2.5 md:py-3 lg:py-3.5 rounded-xl sm:rounded-xl md:rounded-2xl hover:from-red-400 hover:to-red-500 transition-all disabled:opacity-50 text-xs sm:text-sm md:text-base"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ boxShadow: "0 10px 30px rgba(239, 68, 68, 0.3)" }}
          >
            Set Up 2FA
          </motion.button>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      key="2fa"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-5">
        <h4 className="text-sm sm:text-base md:text-lg lg:text-xl font-medium text-white">
          Two-Factor Authentication
        </h4>
      </div>

      {renderTwoFactorContent()}
    </motion.div>
  );
};

export default TwoFactorSection;