"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaFingerprint,
  FaShieldAlt,
  FaKey,
  FaTrash,
  FaEnvelope,
  FaInfoCircle,
  FaExclamationTriangle,
  FaPlus,
  FaSpinner,
  FaCheckCircle,
  FaPaperPlane,
} from "react-icons/fa";
import axios from "axios";
import { startRegistration } from "@simplewebauthn/browser";

// ✅ ENHANCED: Skeletal Loading Component for Biometric Credentials
const BiometricCredentialSkeleton = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="bg-gray-900/30 p-2 sm:p-2.5 md:p-3 lg:p-4 rounded-lg sm:rounded-xl border border-gray-700/50 animate-pulse"
  >
    <div className="flex justify-between items-center">
      <div className="flex-1">
        <div className="flex items-center mb-1 sm:mb-1.5">
          <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 bg-gray-700/70 rounded-full mr-1.5 sm:mr-2"></div>
          <div className="h-2.5 sm:h-3 md:h-3.5 bg-gray-700/70 rounded w-20 sm:w-24 md:w-32"></div>
        </div>
        <div className="h-2 sm:h-2.5 md:h-3 bg-gray-800/70 rounded w-28 sm:w-36 md:w-48"></div>
      </div>
      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-gray-700/70 rounded"></div>
    </div>
  </motion.div>
);

// ✅ ENHANCED: Skeletal Loading Component for Registration Form
const RegistrationFormSkeleton = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="bg-gray-900/30 p-2.5 sm:p-3 md:p-4 lg:p-5 rounded-lg sm:rounded-xl border border-gray-700/50 animate-pulse"
  >
    <div className="h-2.5 sm:h-3 md:h-3.5 bg-gray-700/70 rounded w-24 sm:w-32 md:w-40 mb-2 sm:mb-2.5 md:mb-3"></div>
    
    <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
      <div>
        <div className="h-2 sm:h-2.5 md:h-3 bg-gray-800/70 rounded w-16 sm:w-20 md:w-24 mb-1 sm:mb-1.5 md:mb-2"></div>
        <div className="h-8 sm:h-9 md:h-10 bg-gray-700/70 rounded w-full"></div>
      </div>
      
      <div className="h-8 sm:h-9 md:h-10 bg-gray-700/70 rounded w-full"></div>
    </div>
  </motion.div>
);

// ✅ NEW: Section-level skeleton for entire biometric section
const BiometricSectionSkeleton = () => (
  <div className="bg-gray-900/50 p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl border border-red-500/20 animate-pulse">
    <div className="flex items-center mb-2 sm:mb-2.5 md:mb-3">
      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-gray-700/70 rounded mr-1.5 sm:mr-2"></div>
      <div className="h-3 sm:h-3.5 md:h-4 lg:h-5 bg-gray-700/70 rounded w-32 sm:w-40 md:w-48"></div>
    </div>
    
    <div className="space-y-2.5 sm:space-y-3 md:space-y-4">
      <div className="flex items-center justify-between mb-2.5 sm:mb-3 md:mb-4">
        <div className="flex-1">
          <div className="h-2.5 sm:h-3 md:h-3.5 lg:h-4 bg-gray-700/70 rounded w-40 sm:w-48 md:w-64 mb-1 sm:mb-1.5 md:mb-2"></div>
          <div className="h-2 sm:h-2.5 md:h-3 bg-gray-800/70 rounded w-full"></div>
        </div>
        <div className="w-14 sm:w-16 md:w-20 h-4 sm:h-5 md:h-6 bg-gray-700/70 rounded-full"></div>
      </div>
      
      <BiometricCredentialSkeleton />
      <RegistrationFormSkeleton />
    </div>
  </div>
);

// ✅ NEW: Recovery options skeleton
const RecoveryOptionsSkeleton = () => (
  <div className="bg-gray-900/50 p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl border border-red-500/20 animate-pulse">
    <div className="flex items-center mb-2 sm:mb-2.5 md:mb-3">
      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-gray-700/70 rounded mr-1.5 sm:mr-2"></div>
      <div className="h-3 sm:h-3.5 md:h-4 lg:h-5 bg-gray-700/70 rounded w-32 sm:w-40 md:w-48"></div>
    </div>
    
    <div className="space-y-2.5 sm:space-y-3 md:space-y-4">
      <div className="bg-gray-900/30 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-gray-700/50">
        <div className="h-2.5 sm:h-3 md:h-3.5 bg-gray-700/70 rounded w-24 sm:w-28 md:w-32 mb-2 sm:mb-2.5 md:mb-3"></div>
        <div className="h-8 sm:h-9 md:h-10 bg-gray-700/70 rounded w-full"></div>
      </div>
      
      <div className="h-8 sm:h-9 md:h-10 lg:h-11 bg-gray-700/70 rounded w-full"></div>
    </div>
  </div>
);

interface BiometricCredential {
  id: string;
  deviceName: string;
  createdAt: string;
  lastUsed: string;
}

interface SecurityOptionsSectionProps {
  hasPasswordSet: boolean;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  biometricCredentials: BiometricCredential[];
  fetchBiometricStatus: (options?: { skipCache?: boolean }) => Promise<void>;
  setSuccess: (message: string | null) => void;
  setError: (message: string | null) => void;
  setSecurityEvents: React.Dispatch<React.SetStateAction<any[]>>;
  setActivityLogs: React.Dispatch<React.SetStateAction<any[]>>;
  recoveryEmail: string;
  setRecoveryEmail: React.Dispatch<React.SetStateAction<string>>;
  useRecoveryEmail: boolean;
  setUseRecoveryEmail: React.Dispatch<React.SetStateAction<boolean>>;
  calculateSecurityScore: (userData: any) => void;
  user: any;
  reloadAllSecurityData: () => Promise<void>;
}

const SecurityOptionsSection: React.FC<SecurityOptionsSectionProps> = ({
  hasPasswordSet,
  biometricAvailable,
  biometricEnabled,
  biometricCredentials,
  fetchBiometricStatus,
  setSuccess,
  setError,
  setSecurityEvents,
  setActivityLogs,
  recoveryEmail,
  setRecoveryEmail,
  useRecoveryEmail,
  setUseRecoveryEmail,
  calculateSecurityScore,
  user,
  reloadAllSecurityData,
}) => {
  const [biometricDeviceName, setBiometricDeviceName] = useState("");
  const [isRegisteringBiometric, setIsRegisteringBiometric] = useState(false);
  const [isDeletingCredential, setIsDeletingCredential] = useState(false);
  const [credentialToDelete, setCredentialToDelete] = useState<string | null>(null);
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [registrationStage, setRegistrationStage] = useState<string | null>(null);
  const [isSavingRecovery, setIsSavingRecovery] = useState(false);
  
  // ✅ ENHANCED: Loading states for different operations
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshingCredentials, setIsRefreshingCredentials] = useState(false);
  const [localCredentials, setLocalCredentials] = useState<BiometricCredential[]>([]);
  
  // ✅ NEW: Prevent duplicate fetches
  const fetchInProgress = useRef(false);
  const initialFetchDone = useRef(false);
  
  // ✅ NEW: Local toggle states to prevent premature UI changes
  const [localUseRecoveryEmail, setLocalUseRecoveryEmail] = useState(false);
  
  // ✅ NEW: Track if we're in verification flow
  const [isInVerificationFlow, setIsInVerificationFlow] = useState(false);
  
  // ✅ NEW: Verification states
  const [verificationStep, setVerificationStep] = useState<{
    type: 'email' | null;
    value: string;
    codeSent: boolean;
    code: string;
    verified: boolean;
  }>({
    type: null,
    value: '',
    codeSent: false,
    code: '',
    verified: false
  });
  
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [codeExpiry, setCodeExpiry] = useState<number | null>(null);
  
  // ✅ NEW: Sync local toggle states with props (only when not in verification flow)
  useEffect(() => {
    if (!isInVerificationFlow) {
      setLocalUseRecoveryEmail(useRecoveryEmail);
    }
  }, [useRecoveryEmail, isInVerificationFlow]);

  // ✅ IMPROVED: refreshBiometricCredentials with better state management
  const refreshBiometricCredentials = useCallback(async (options = { skipCache: false, showLoader: true }) => {
    if (fetchInProgress.current) {
      console.log('[SecurityOptions] Fetch already in progress, skipping');
      return;
    }
    
    fetchInProgress.current = true;
    
    try {
      if (options.showLoader) {
        setIsRefreshingCredentials(true);
      }
      
      console.log('[SecurityOptions] Fetching biometric status, skipCache:', options.skipCache);
      
      await fetchBiometricStatus({ skipCache: options.skipCache });
      
      console.log('[SecurityOptions] Biometric status fetched successfully');
    } catch (error) {
      console.error("[SecurityOptions] Error refreshing biometric credentials:", error);
    } finally {
      if (options.showLoader) {
        setIsRefreshingCredentials(false);
      }
      fetchInProgress.current = false;
    }
  }, [fetchBiometricStatus]);

  // ✅ IMPROVED: Initial load with better control
  useEffect(() => {
    const loadInitialData = async () => {
      if (!hasPasswordSet || !biometricAvailable || initialFetchDone.current) {
        setIsInitialLoading(false);
        return;
      }
      
      console.log('[SecurityOptions] Starting initial load');
      setIsInitialLoading(true);
      
      try {
        await refreshBiometricCredentials({ skipCache: false, showLoader: false });
        initialFetchDone.current = true;
      } finally {
        setIsInitialLoading(false);
      }
    };
    
    loadInitialData();
  }, [hasPasswordSet, biometricAvailable, refreshBiometricCredentials]);

  // ✅ NEW: Sync local credentials with props
  useEffect(() => {
    if (biometricCredentials && JSON.stringify(biometricCredentials) !== JSON.stringify(localCredentials)) {
      console.log('[SecurityOptions] Updating local credentials:', biometricCredentials.length);
      setLocalCredentials(biometricCredentials);
    }
  }, [biometricCredentials]);

  // ✅ FIXED: Send verification code with proper validation
  const handleSendVerificationCode = async (value: string) => {
    // ✅ Validate HERE when user clicks "Send Code"
    if (!value || !value.includes('@')) {
      setVerificationError('Please enter a valid email address');
      setError('Please enter a valid email address');
      return;
    }

    try {
      setIsSendingCode(true);
      setVerificationError(null);
      setIsInVerificationFlow(true);
      
      const response = await axios.post('/api/user/recovery/send-verification', {
        type: 'email',
        value
      });

      if (response.data.success) {
        setVerificationStep({
          type: 'email',
          value,
          codeSent: true,
          code: '',
          verified: false
        });
        
        setCodeExpiry(response.data.expiresIn);
        setSuccess(`Verification code sent to your email`);
        
        const interval = setInterval(() => {
          setCodeExpiry(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(interval);
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      setVerificationError(
        error.response?.data?.error || 'Failed to send verification code'
      );
      setError(error.response?.data?.error || 'Failed to send verification code');
      
      // Reset on error
      setIsInVerificationFlow(false);
      setVerificationStep({
        type: null,
        value: '',
        codeSent: false,
        code: '',
        verified: false
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  // ✅ UPDATED: Verify code
  const handleVerifyCode = async () => {
    if (!verificationStep.value || !verificationStep.code) {
      setVerificationError('Please enter the verification code');
      return;
    }

    try {
      setIsVerifyingCode(true);
      setVerificationError(null);

      const response = await axios.post('/api/user/recovery/verify-code', {
        type: 'email',
        value: verificationStep.value,
        code: verificationStep.code
      });

      if (response.data.success) {
        setVerificationStep(prev => ({
          ...prev,
          verified: true
        }));
        
        setSuccess(`Recovery email verified successfully!`);
        
        // ✅ NOW update the actual state
        setUseRecoveryEmail(true);
        setLocalUseRecoveryEmail(true);
        
        // Reload security data with cache bypass
        if (reloadAllSecurityData) {
          await reloadAllSecurityData();
        }
        
        // Reset verification flow
        setTimeout(() => {
          setIsInVerificationFlow(false);
          setVerificationStep({
            type: null,
            value: '',
            codeSent: false,
            code: '',
            verified: false
          });
          setCodeExpiry(null);
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error verifying code:', error);
      setVerificationError(
        error.response?.data?.error || 'Invalid verification code'
      );
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // ✅ UPDATED: Handle cancel verification
  const handleCancelVerification = () => {
    // Reset all verification states
    setVerificationStep({
      type: null,
      value: '',
      codeSent: false,
      code: '',
      verified: false
    });
    setVerificationError(null);
    setCodeExpiry(null);
    setIsInVerificationFlow(false);
    
    // ✅ Reset local toggle to match actual state
    setLocalUseRecoveryEmail(useRecoveryEmail);
  };

  // ✅ FIXED: Handle recovery option toggle
  const handleRecoveryToggle = async () => {
    // Prevent toggling during verification
    if (isInVerificationFlow) {
      return;
    }

    if (localUseRecoveryEmail) {
      // Turning off
      if (confirm('Are you sure you want to disable recovery email?')) {
        setIsSavingRecovery(true);
        try {
          await axios.post('/api/user/recovery/setup', {
            useRecoveryEmail: false,
            recoveryEmail: '',
          });
          
          setUseRecoveryEmail(false);
          setLocalUseRecoveryEmail(false);
          setRecoveryEmail('');
          setSuccess('Recovery email disabled');
          
          await reloadAllSecurityData();
        } catch (error: any) {
          setError(error.response?.data?.error || 'Failed to disable recovery email');
        } finally {
          setIsSavingRecovery(false);
        }
      }
    } else {
      // ✅ FIXED: Just start the flow, don't validate yet
      setIsInVerificationFlow(true);
      setVerificationStep({
        type: 'email',
        value: recoveryEmail,
        codeSent: false,
        code: '',
        verified: false
      });
    }
  };

  // ✅ IMPROVED: Main biometric registration function with instant UI update
  const handleEnableBiometric = async (deviceNameParam: string) => {
    const deviceName = deviceNameParam || biometricDeviceName;

    if (!biometricAvailable) {
      setError("Your device doesn't support biometric authentication.");
      return;
    }

    if (!deviceName.trim()) {
      setError("Please provide a name for this device.");
      return;
    }

    setIsRegisteringBiometric(true);
    setError(null);
    setSuccess(null);
    setRegistrationStage("preparing");

    try {
      setRegistrationStage("generating");
      const timestamp = Date.now();
      const registrationOptionsResponse = await fetch(
        `/api/user/biometric/register?_t=${timestamp}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
          },
          credentials: "same-origin",
        }
      );

      const registrationOptions = await registrationOptionsResponse.json();

      if (registrationOptions.error) {
        setError(registrationOptions.error);
        return;
      }

      setRegistrationStage("waiting_for_user");
      const attestation = await startRegistration(registrationOptions);

      setRegistrationStage("verifying");
      const verificationResponse = await fetch(
        `/api/user/biometric/verify-registration?_t=${timestamp}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
          },
          body: JSON.stringify({
            attestation: attestation,
            deviceName: deviceName,
          }),
          credentials: "same-origin",
        }
      );

      const verificationResult = await verificationResponse.json();

      if (verificationResult.success) {
        setSuccess("Biometric authentication enabled successfully");
        setBiometricDeviceName("");
        setNewDeviceName("");
        
        if (showAddDeviceModal) {
          setShowAddDeviceModal(false);
        }

        // ✅ OPTIMISTIC UPDATE: Add new credential to local state immediately
        const newCredential: BiometricCredential = {
          id: `temp-${Date.now()}`,
          deviceName: deviceName,
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
        };
        
        setLocalCredentials(prev => [...prev, newCredential]);

        const newEvent = {
          id: `event-${Date.now()}`,
          eventType: "biometric_added",
          severity: "medium",
          description: `Biometric credential "${deviceName}" was added`,
          ipAddress: "Current session",
          createdAt: new Date().toISOString(),
        };
        setSecurityEvents((prev) => [newEvent, ...prev]);

        const newActivity = {
          id: `activity-${Date.now()}`,
          action: "biometric_enabled",
          description: `Biometric credential "${deviceName}" was registered`,
          ipAddress: "Current session",
          createdAt: new Date().toISOString(),
        };
        setActivityLogs((prev) => [newActivity, ...prev]);

        setTimeout(async () => {
          console.log('[SecurityOptions] Refreshing after biometric registration');
          
          await refreshBiometricCredentials({ skipCache: true, showLoader: false });
          
          calculateSecurityScore({
            ...user,
            biometricEnabled: true
          });
          
          if (reloadAllSecurityData) {
            await reloadAllSecurityData();
          }
        }, 500);
      } else {
        setError(
          "Failed to register biometric credential: " +
            (verificationResult.error || "Unknown error")
        );
      }
    } catch (error: any) {
      console.error("Error enabling biometric:", error);

      if (error.name === "NotAllowedError") {
        setError(
          "You cancelled the biometric registration or the request timed out."
        );
      } else if (error.name === "SecurityError") {
        setError(
          "The operation is not secure. Make sure you're using HTTPS."
        );
      } else if (error.name === "InvalidStateError") {
        setError("The credential already exists or is invalid.");
      } else if (error.name === "AbortError") {
        setError("The operation was aborted. Please try again.");
      } else if (error.name === "NotSupportedError") {
        setError(
          "This type of credential is not supported by your browser."
        );
      } else {
        setError(
          `Failed to enable biometric authentication: ${
            error.message || "Unknown error"
          }`
        );
      }
    } finally {
      setIsRegisteringBiometric(false);
      setRegistrationStage(null);
    }
  };

  // ✅ IMPROVED: Delete credential with optimistic update
  const handleDeleteBiometricCredential = async (credentialId: string) => {
    if (!confirm("Are you sure you want to remove this biometric credential?")) {
      return;
    }

    setCredentialToDelete(credentialId);
    setIsDeletingCredential(true);
    setError(null);
    setSuccess(null);

    const credential = localCredentials.find(c => c.id === credentialId);
    const credentialName = credential?.deviceName || "Unknown device";

    try {
      // ✅ OPTIMISTIC UPDATE
      setLocalCredentials(prev => prev.filter(c => c.id !== credentialId));

      const timestamp = Date.now();
      const response = await axios.post(`/api/user/biometric/delete?_t=${timestamp}`, {
        credentialId,
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (response.data.success) {
        setSuccess("Biometric credential removed successfully");
        
        const newEvent = {
          id: `event-${Date.now()}`,
          eventType: "biometric_removed",
          severity: "medium",
          description: `Biometric credential "${credentialName}" was removed`,
          ipAddress: "Current session",
          createdAt: new Date().toISOString(),
        };
        setSecurityEvents((prev) => [newEvent, ...prev]);

        const newActivity = {
          id: `activity-${Date.now()}`,
          action: "biometric_disabled",
          description: `Biometric credential "${credentialName}" was removed`,
          ipAddress: "Current session",
          createdAt: new Date().toISOString(),
        };
        setActivityLogs((prev) => [newActivity, ...prev]);

        setTimeout(async () => {
          console.log('[SecurityOptions] Refreshing after biometric deletion');
          
          await refreshBiometricCredentials({ skipCache: true, showLoader: false });
          
          const remainingCredentials = localCredentials.filter(c => c.id !== credentialId);
          calculateSecurityScore({
            ...user,
            biometricEnabled: remainingCredentials.length > 0
          });
          
          if (reloadAllSecurityData) {
            await reloadAllSecurityData();
          }
        }, 300);
      }
    } catch (error: any) {
      console.error("Error deleting biometric credential:", error);
      
      // ✅ ROLLBACK
      if (credential) {
        setLocalCredentials(prev => [...prev, credential].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
      
      setError(
        error.response?.data?.error || "Failed to remove biometric credential"
      );
    } finally {
      setCredentialToDelete(null);
      setIsDeletingCredential(false);
    }
  };

  const handleAddDevice = (deviceName: string) => {
    setShowAddDeviceModal(false);
    setTimeout(() => {
      handleEnableBiometric(deviceName);
    }, 100);
  };

  // ✅ Show full section skeleton on initial load
  if (isInitialLoading) {
    return (
      <motion.div
        key="security_options_loading"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6"
      >
        <BiometricSectionSkeleton />
        <RecoveryOptionsSkeleton />
      </motion.div>
    );
  }

  return (
    <motion.div
      key="security_options"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h4 className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium text-white mb-3 sm:mb-4 md:mb-5">
        Additional Security Options
      </h4>

      <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
        {/* Biometric Authentication */}
        {hasPasswordSet && (
          <div className="bg-gray-900/50 p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl border border-red-500/20">
            <h5 className="text-white font-medium mb-2 sm:mb-2.5 md:mb-3 flex items-center text-sm sm:text-base md:text-lg lg:text-xl">
              <FaFingerprint className="mr-1.5 sm:mr-2 text-red-500 text-sm sm:text-base md:text-lg lg:text-xl" /> 
              Biometric Authentication
            </h5>

            {!biometricAvailable ? (
              <div className="bg-yellow-900/30 border border-yellow-500/30 p-2.5 sm:p-3 md:p-4 lg:p-5 rounded-lg sm:rounded-xl mb-2.5 sm:mb-3 md:mb-4">
                <div className="flex items-start">
                  <FaExclamationTriangle className="text-yellow-400 mt-0.5 mr-1.5 sm:mr-2 md:mr-2.5 lg:mr-3 flex-shrink-0 text-xs sm:text-sm md:text-base" />
                  <p className="text-xs sm:text-sm md:text-base text-yellow-300">
                    Your device or browser doesn't support biometric
                    authentication. Please use a device with fingerprint/face
                    recognition capabilities or a security key.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2.5 sm:mb-3 md:mb-4">
                  <div className="flex-1 min-w-0">
                    <h6 className="text-white text-xs sm:text-sm md:text-base lg:text-lg">
                      Use Fingerprint, Face ID or Security Key
                    </h6>
                    <p className="text-gray-400 text-[10px] xs:text-xs sm:text-sm mt-0.5 sm:mt-1">
                      Sign in faster and more securely with biometric
                      authentication using your device's fingerprint scanner,
                      facial recognition, or security key.
                    </p>
                  </div>

                  <div className="ml-2 sm:ml-3">
                    <div
                      className={`px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded-full text-[10px] xs:text-xs sm:text-sm ${
                        localCredentials.length > 0
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-700/40 text-gray-400"
                      }`}
                    >
                      {localCredentials.length > 0 ? "Enabled" : "Not Set Up"}
                    </div>
                  </div>
                </div>

                {/* Biometric credentials list with loading states */}
                <div className="space-y-2 sm:space-y-2.5 md:space-y-3 mb-2.5 sm:mb-3 md:mb-4">
                  {localCredentials.length > 0 && (
                    <h6 className="text-xs sm:text-sm md:text-base font-medium text-gray-300">
                      Registered Devices ({localCredentials.length})
                    </h6>
                  )}
                  
                  <AnimatePresence mode="wait">
                    {isRefreshingCredentials ? (
                      <motion.div
                        key="credentials-loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <BiometricCredentialSkeleton />
                        {localCredentials.length > 1 && <BiometricCredentialSkeleton />}
                      </motion.div>
                    ) : localCredentials.length > 0 ? (
                      <motion.div
                        key="credentials-list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-2 sm:space-y-2.5 md:space-y-3"
                      >
                        {localCredentials.map((credential) => (
                          <motion.div
                            key={credential.id}
                            className="bg-gray-900/30 p-2 sm:p-2.5 md:p-3 lg:p-4 rounded-lg sm:rounded-xl border border-gray-700/50 flex justify-between items-center"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, height: 0 }}
                            transition={{ duration: 0.2 }}
                            layout
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center">
                                <FaFingerprint className="text-red-500 mr-1 sm:mr-1.5 md:mr-2 flex-shrink-0 text-xs sm:text-sm md:text-base" />
                                <span className="text-white font-medium text-xs sm:text-sm md:text-base truncate">
                                  {credential.deviceName}
                                </span>
                              </div>
                              <p className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm text-gray-400 mt-0.5 sm:mt-1">
                                Added: {new Date(credential.createdAt).toLocaleDateString()}
                                {" • "}
                                Last used: {new Date(credential.lastUsed).toLocaleDateString()}
                              </p>
                            </div>
                            <motion.button
                              type="button"
                              onClick={() =>
                                handleDeleteBiometricCredential(credential.id)
                              }
                              disabled={isDeletingCredential}
                              className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-2 sm:ml-3 p-1 sm:p-1.5 md:p-2"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {isDeletingCredential &&
                              credentialToDelete === credential.id ? (
                                <FaSpinner className="animate-spin text-xs sm:text-sm md:text-base" />
                              ) : (
                                <FaTrash className="text-xs sm:text-sm md:text-base" />
                              )}
                            </motion.button>
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>

                {/* Register new biometric */}
                <AnimatePresence mode="wait">
                  {isRefreshingCredentials && localCredentials.length === 0 ? (
                    <RegistrationFormSkeleton key="registration-loading" />
                  ) : localCredentials.length === 0 ? (
                    <motion.div
                      key="registration-form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-gray-900/30 p-2.5 sm:p-3 md:p-4 lg:p-5 rounded-lg sm:rounded-xl border border-gray-700/50"
                    >
                      <h6 className="text-xs sm:text-sm md:text-base font-medium text-gray-300 mb-2 sm:mb-2.5 md:mb-3">
                        Register New Device
                      </h6>

                      <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
                        <div>
                          <label className="block text-[10px] xs:text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-1.5 md:mb-2">
                            Device Name
                          </label>
                          <input
                            type="text"
                            value={biometricDeviceName}
                            onChange={(e) => setBiometricDeviceName(e.target.value)}
                            placeholder="e.g., My iPhone, Work Laptop"
                            className="w-full rounded-lg sm:rounded-xl border-gray-600/40 bg-gray-700/40 text-white py-1.5 sm:py-2 md:py-2.5 px-2 sm:px-2.5 md:px-3 lg:px-4 text-xs sm:text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400/60 transition-all backdrop-blur-sm"
                            disabled={isRegisteringBiometric}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && biometricDeviceName.trim() && !isRegisteringBiometric) {
                                handleEnableBiometric(biometricDeviceName);
                              }
                            }}
                          />
                        </div>

                        <motion.button
                          type="button"
                          onClick={() => handleEnableBiometric(biometricDeviceName)}
                          disabled={isRegisteringBiometric || !biometricDeviceName.trim()}
                          className="w-full bg-red-600 hover:bg-red-500 text-white font-medium py-1.5 sm:py-2 md:py-2.5 lg:py-3 px-2.5 sm:px-3 md:px-4 rounded-lg sm:rounded-xl transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm md:text-base"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {isRegisteringBiometric ? (
                            <>
                              <FaSpinner className="animate-spin mr-1 sm:mr-1.5 md:mr-2 lg:mr-3 text-xs sm:text-sm md:text-base" />
                              <span>
                                {registrationStage === "waiting_for_user"
                                  ? "Follow device prompt..."
                                  : registrationStage === "generating"
                                  ? "Generating..."
                                  : registrationStage === "verifying"
                                  ? "Verifying..."
                                  : "Processing..."}
                              </span>
                            </>
                          ) : (
                            <>
                              <FaFingerprint className="mr-1 sm:mr-1.5 md:mr-2 text-xs sm:text-sm md:text-base" />
                              Register This Device
                            </>
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : localCredentials.length < 10 ? (
                    <motion.button
                      key="add-device-button"
                      type="button"
                      onClick={() => {
                        setNewDeviceName("");
                        setShowAddDeviceModal(true);
                      }}
                      className="text-red-400 hover:text-red-300 text-xs sm:text-sm md:text-base flex items-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FaPlus className="mr-1 sm:mr-1.5 text-[10px] xs:text-xs sm:text-sm" /> Add another device
                    </motion.button>
                  ) : (
                    <p className="text-gray-400 text-xs sm:text-sm md:text-base italic">
                      Maximum number of devices registered (10)
                    </p>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        )}

        {/* ✅ UPDATED: Recovery Options - Email Only */}
        <div className="bg-gray-900/50 p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl border border-red-500/20">
          <h5 className="text-white font-medium mb-2 sm:mb-2.5 md:mb-3 flex items-center text-sm sm:text-base md:text-lg lg:text-xl">
            <FaKey className="mr-1.5 sm:mr-2 text-red-500 text-sm sm:text-base md:text-lg lg:text-xl" /> 
            Account Recovery Options
          </h5>

          <div className="space-y-2.5 sm:space-y-3 md:space-y-4">
            {/* Recovery Email */}
            <div className="bg-gray-900/30 p-2.5 sm:p-3 md:p-4 lg:p-5 rounded-lg sm:rounded-xl border border-gray-700/50">
              <div className="flex items-center justify-between mb-2 sm:mb-2.5 md:mb-3">
                <div className="flex items-center flex-1 min-w-0">
                  <FaEnvelope className="text-red-500 mr-1 sm:mr-1.5 md:mr-2 flex-shrink-0 text-xs sm:text-sm md:text-base" />
                  <h6 className="text-white text-xs sm:text-sm md:text-base truncate">Recovery Email</h6>
                  {localUseRecoveryEmail && !isInVerificationFlow && (
                    <FaCheckCircle className="text-green-400 ml-2 text-xs sm:text-sm" />
                  )}
                  {isInVerificationFlow && verificationStep.type === 'email' && (
                    <FaSpinner className="text-yellow-400 ml-2 text-xs sm:text-sm animate-spin" />
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-2 sm:ml-3">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={localUseRecoveryEmail}
                    onChange={handleRecoveryToggle}
                    disabled={isSavingRecovery || isSendingCode || isVerifyingCode || isInVerificationFlow}
                  />
                  <div className="w-8 sm:w-9 md:w-11 h-4 sm:h-5 md:h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 sm:after:h-4 md:after:h-5 after:w-3 sm:after:w-4 md:after:w-5 after:transition-all peer-checked:bg-red-500 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                </label>
              </div>

              <AnimatePresence>
                {(localUseRecoveryEmail || verificationStep.type === 'email') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 sm:mt-2.5 md:mt-3 space-y-2 sm:space-y-2.5"
                  >
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2 sm:pl-2.5 md:pl-3 flex items-center pointer-events-none">
                        <FaEnvelope className="text-gray-500 text-xs sm:text-sm" />
                      </div>
                      <input
                        type="email"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="recovery@email.com"
                        disabled={verificationStep.codeSent || localUseRecoveryEmail}
                        className="w-full rounded-lg sm:rounded-xl border-gray-600/40 bg-gray-700/40 text-white py-1.5 sm:py-2 md:py-2.5 lg:py-3 px-2.5 sm:px-3 md:px-4 pl-7 sm:pl-8 md:pl-10 text-xs sm:text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400/60 transition-all backdrop-blur-sm disabled:opacity-50"
                      />
                    </div>

                    {!localUseRecoveryEmail && !verificationStep.codeSent && (
                      <motion.button
                        type="button"
                        onClick={() => handleSendVerificationCode(recoveryEmail)}
                        disabled={!recoveryEmail.trim() || isSendingCode}
                        className="w-full bg-red-600 hover:bg-red-500 text-white font-medium py-1.5 sm:py-2 md:py-2.5 px-2.5 sm:px-3 md:px-4 rounded-lg sm:rounded-xl transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm md:text-base"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isSendingCode ? (
                          <>
                            <FaSpinner className="animate-spin mr-1 sm:mr-1.5 md:mr-2 text-xs sm:text-sm md:text-base" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <FaPaperPlane className="mr-1 sm:mr-1.5 md:mr-2 text-xs sm:text-sm md:text-base" />
                            Send Verification Code
                          </>
                        )}
                      </motion.button>
                    )}

                    {verificationStep.type === 'email' && verificationStep.codeSent && !verificationStep.verified && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2 sm:space-y-2.5"
                      >
                        <div>
                          <label className="block text-[10px] xs:text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-1.5">
                            Enter Verification Code
                          </label>
                          <input
                            type="text"
                            value={verificationStep.code}
                            onChange={(e) => setVerificationStep(prev => ({ ...prev, code: e.target.value }))}
                            placeholder="000000"
                            maxLength={6}
                            className="w-full rounded-lg sm:rounded-xl border-gray-600/40 bg-gray-700/40 text-white py-1.5 sm:py-2 md:py-2.5 px-2.5 sm:px-3 md:px-4 text-center text-lg sm:text-xl md:text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400/60 transition-all backdrop-blur-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && verificationStep.code.length === 6) {
                                handleVerifyCode();
                              }
                            }}
                          />
                          {codeExpiry && (
                            <p className="text-[10px] xs:text-xs text-gray-400 mt-1 text-center">
                              Code expires in {Math.floor(codeExpiry / 60)}:{(codeExpiry % 60).toString().padStart(2, '0')}
                            </p>
                          )}
                        </div>

                        {verificationError && (
                          <div className="bg-red-900/30 border border-red-500/30 p-2 sm:p-2.5 rounded-lg">
                            <p className="text-xs sm:text-sm text-red-400">{verificationError}</p>
                          </div>
                        )}

                        <div className="flex gap-2 sm:gap-2.5">
                          <motion.button
                            type="button"
                            onClick={handleCancelVerification}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-1.5 sm:py-2 md:py-2.5 px-2.5 sm:px-3 md:px-4 rounded-lg sm:rounded-xl transition-colors text-xs sm:text-sm md:text-base"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Cancel
                          </motion.button>
                          <motion.button
                            type="button"
                            onClick={handleVerifyCode}
                            disabled={verificationStep.code.length !== 6 || isVerifyingCode}
                            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-medium py-1.5 sm:py-2 md:py-2.5 px-2.5 sm:px-3 md:px-4 rounded-lg sm:rounded-xl transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm md:text-base"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {isVerifyingCode ? (
                              <>
                                <FaSpinner className="animate-spin mr-1 sm:mr-1.5 text-xs sm:text-sm" />
                                <span>Verifying...</span>
                              </>
                            ) : (
                              <>
                                <FaCheckCircle className="mr-1 sm:mr-1.5 text-xs sm:text-sm" />
                                Verify
                              </>
                            )}
                          </motion.button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSendVerificationCode(recoveryEmail)}
                          disabled={isSendingCode || (codeExpiry !== null && codeExpiry > 540)}
                          className="w-full text-xs sm:text-sm text-gray-400 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Didn't receive code? Resend
                        </button>
                      </motion.div>
                    )}

                    <p className="text-gray-400 text-[10px] xs:text-xs sm:text-sm mt-1 sm:mt-1.5 md:mt-2">
                      This email will be used to recover your account if you lose access.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="bg-gray-900/40 p-2 sm:p-2.5 md:p-3 lg:p-4 rounded-lg sm:rounded-xl border border-red-500/30">
              <div className="flex items-start">
                <FaInfoCircle className="text-red-400 mt-0.5 mr-1.5 sm:mr-2 md:mr-2.5 flex-shrink-0 text-xs sm:text-sm md:text-base" />
                <div>
                  <p className="text-xs sm:text-sm md:text-base text-gray-300">
                    <span className="font-medium text-red-400">
                      Recovery email must be verified.
                    </span>{" "}
                    You'll receive a verification code to confirm your email address.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Device Modal */}
      <AnimatePresence>
        {showAddDeviceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 sm:p-4"
            onClick={() =>
              !isRegisteringBiometric && setShowAddDeviceModal(false)
            }
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-800 rounded-xl border border-red-500/30 p-3 sm:p-4 md:p-5 lg:p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-medium text-white mb-2.5 sm:mb-3 md:mb-4 flex items-center">
                <FaFingerprint className="mr-1.5 sm:mr-2 text-red-500 text-sm sm:text-base md:text-lg" /> 
                Add Biometric Device
              </h3>

              <div className="mb-2.5 sm:mb-3 md:mb-4">
                <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-300 mb-1 sm:mb-1.5 md:mb-2">
                  Device Name
                </label>
                <input
                  type="text"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  placeholder="e.g., My iPhone, Work Laptop"
                  className="w-full rounded-lg sm:rounded-xl border-gray-600/40 bg-gray-700/40 text-white py-1.5 sm:py-2 md:py-2.5 lg:py-3 px-2.5 sm:px-3 md:px-4 text-xs sm:text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400/60 transition-all backdrop-blur-sm"
                  autoFocus
                  disabled={isRegisteringBiometric}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      newDeviceName.trim() &&
                      !isRegisteringBiometric
                    ) {
                      handleAddDevice(newDeviceName.trim());
                    } else if (
                      e.key === "Escape" &&
                      !isRegisteringBiometric
                    ) {
                      setShowAddDeviceModal(false);
                    }
                  }}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 md:gap-3">
                <motion.button
                  type="button"
                  onClick={() => setShowAddDeviceModal(false)}
                  disabled={isRegisteringBiometric}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-1.5 sm:py-2 md:py-2.5 lg:py-3 px-2.5 sm:px-3 md:px-4 rounded-lg sm:rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm md:text-base"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => {
                    if (newDeviceName.trim()) {
                      handleAddDevice(newDeviceName.trim());
                    }
                  }}
                  disabled={!newDeviceName.trim() || isRegisteringBiometric}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium py-1.5 sm:py-2 md:py-2.5 lg:py-3 px-2.5 sm:px-3 md:px-4 rounded-lg sm:rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xs sm:text-sm md:text-base"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isRegisteringBiometric ? (
                    <>
                      <FaSpinner className="animate-spin mr-1 sm:mr-1.5 md:mr-2 text-xs sm:text-sm md:text-base" />
                      <span>
                        {registrationStage === "waiting_for_user"
                          ? "Waiting..."
                          : registrationStage === "generating"
                          ? "Generating..."
                          : registrationStage === "verifying"
                          ? "Verifying..."
                          : "Processing..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <FaFingerprint className="mr-1 sm:mr-1.5 md:mr-2 text-xs sm:text-sm md:text-base" />
                      Register Device
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SecurityOptionsSection;