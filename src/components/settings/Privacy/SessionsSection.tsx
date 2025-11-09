//Volumes/vision/codes/course/my-app/src/components/settings/Privacy/SessionsSection.tsx
"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaDesktop,
  FaSignOutAlt,
  FaExclamationTriangle,
  FaMobile,
  FaShieldAlt,
  FaRegCalendarAlt,
  FaTimes,
  FaSpinner,
} from "react-icons/fa";
import axios, { AxiosError } from "axios";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltipno";
import { useRouter } from 'next/navigation';

interface Session {
  id: string;
  deviceId: string;
  deviceName: string;
  browser: string;
  os: string;
  location: string;
  ipAddress: string;
  lastUsed: string;
  expiresAt: string;
  current: boolean;
  trusted: boolean;
  isAccountCreationDevice: boolean;
  sessionType: string;
  scheduledRevocationDate?: string | null;
}

interface SessionsSectionProps {
  sessions: Session[];
  hasPasswordSet: boolean;
  setSuccess: (message: string) => void;
  setError: (message: string) => void;
  fetchTrustedDevices: (options?: { skipCache?: boolean }) => Promise<void>;
  fetchSessions: (options?: { skipCache?: boolean }) => Promise<void>;
  isLoading?: boolean;
  reloadAllSecurityData: () => Promise<void>;
}

interface ApiErrorResponse {
  error?: string;
  message?: string;
  details?: string;
}

// Skeleton loading component for sessions
const SessionSkeleton = () => (
  <div className="animate-pulse space-y-2.5 sm:space-y-3 md:space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl border border-red-500/20 bg-gray-900/50">
        <div className="flex flex-col space-y-2.5 sm:space-y-3">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 sm:h-5 sm:w-5 bg-gray-700/50 rounded"></div>
            <div className="h-4 sm:h-5 bg-gray-700/50 rounded flex-1"></div>
          </div>
          <div className="space-y-1.5 sm:space-y-2 pl-6">
            <div className="h-3 sm:h-3.5 bg-gray-700/50 rounded w-full"></div>
            <div className="h-3 sm:h-3.5 bg-gray-700/50 rounded w-4/5"></div>
            <div className="h-3 sm:h-3.5 bg-gray-700/50 rounded w-3/4"></div>
            <div className="h-3 sm:h-3.5 bg-gray-700/50 rounded w-2/3"></div>
          </div>
          <div className="flex flex-col space-y-2 pt-2 border-t border-gray-700/30">
            <div className="h-8 sm:h-9 bg-gray-700/50 rounded"></div>
            <div className="h-8 sm:h-9 bg-gray-700/50 rounded"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Loading spinner component
const LoadingSpinner = ({ className = "" }: { className?: string }) => (
  <svg
    className={`animate-spin h-4 w-4 sm:h-5 sm:w-5 ${className}`}
    fill="none"
    viewBox="0 0 24 24"
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
);

const SessionsSection = ({
  sessions,
  hasPasswordSet,
  setSuccess,
  setError,
  fetchTrustedDevices,
  fetchSessions,
  isLoading,
  reloadAllSecurityData,
}: SessionsSectionProps) => {
  // State management
  const [isRevokingDevice, setIsRevokingDevice] = useState(false);
  const [deviceToRevoke, setDeviceToRevoke] = useState<string | null>(null);
  const [revokeAllConfirm, setRevokeAllConfirm] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showTrustConfirmation, setShowTrustConfirmation] = useState(false);
  const [deviceToTrust, setDeviceToTrust] = useState<Session | null>(null);
  const [showScheduleRemoval, setShowScheduleRemoval] = useState(false);
  const [deviceToSchedule, setDeviceToSchedule] = useState<Session | null>(null);
  const [scheduledRemovalDate, setScheduledRemovalDate] = useState("");
  const [isUpdatingTrust, setIsUpdatingTrust] = useState(false);
  const [isSchedulingRemoval, setIsSchedulingRemoval] = useState(false);
  const [isCancellingSchedule, setIsCancellingSchedule] = useState(false);
  const [sessionToCancelSchedule, setSessionToCancelSchedule] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [trustedDevices, setTrustedDevices] = useState<any[]>([]);
  
  const [currentDeviceTrusted, setCurrentDeviceTrusted] = useState<boolean>(false);
  const [isCheckingDeviceStatus, setIsCheckingDeviceStatus] = useState(true);
  
  const router = useRouter();

  // Refs to prevent duplicate requests
  const operationInProgress = useRef(false);
  const lastOperationTime = useRef(0);
  const isFetchingRef = useRef(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Utility function to handle API errors
  const handleApiError = useCallback((error: unknown, defaultMessage: string): string => {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      
      if (axiosError.response?.status === 401) {
        router.push('/login');
        return "Session expired. Please log in again.";
      }
      
      if (axiosError.response?.status === 403) {
        return "You don't have permission to perform this action. Only trusted devices can perform this operation.";
      }
      
      if (axiosError.response?.status === 404) {
        return "Session not found. It may have already been removed.";
      }
      
      if (axiosError.response?.status === 429) {
        return "Too many requests. Please wait a moment and try again.";
      }
      
      return axiosError.response?.data?.error 
        || axiosError.response?.data?.message 
        || axiosError.message 
        || defaultMessage;
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return defaultMessage;
  }, [router]);

  // Debounce helper to prevent rapid clicks
  const canPerformOperation = useCallback(() => {
    const now = Date.now();
    if (now - lastOperationTime.current < 1000) {
      return false;
    }
    lastOperationTime.current = now;
    return true;
  }, []);

  // Comprehensive data reload with retry logic
  const reloadSessionData = useCallback(async (retryCount = 0): Promise<void> => {
    const maxRetries = 3;
    const retryDelay = 1000;

    if (isFetchingRef.current) {
      console.log("[SessionsSection] Fetch already in progress, skipping");
      return;
    }

    try {
      isFetchingRef.current = true;
      console.log(`[SessionsSection] Reloading session data (attempt ${retryCount + 1}/${maxRetries + 1})`);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await reloadAllSecurityData();
      
      setLastUpdate(Date.now());
      console.log("[SessionsSection] Session data reloaded successfully");
    } catch (error) {
      console.error("[SessionsSection] Error reloading session data:", error);
      
      if (retryCount < maxRetries) {
        console.log(`[SessionsSection] Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return reloadSessionData(retryCount + 1);
      }
      
      throw error;
    } finally {
      isFetchingRef.current = false;
    }
  }, [reloadAllSecurityData]);

  // Check current device trust status
  useEffect(() => {
    const checkCurrentDeviceStatus = async () => {
      setIsCheckingDeviceStatus(true);
      try {
        const currentSession = sessions.find(s => s.current);
        if (currentSession) {
          setCurrentDeviceTrusted(currentSession.trusted);
          console.log('[SessionsSection] Current device trusted:', currentSession.trusted);
        } else {
          setCurrentDeviceTrusted(false);
          console.log('[SessionsSection] No current session found, assuming untrusted');
        }
      } catch (error) {
        console.error('[SessionsSection] Error checking device status:', error);
        setCurrentDeviceTrusted(false);
      } finally {
        setIsCheckingDeviceStatus(false);
      }
    };

    if (sessions.length > 0) {
      checkCurrentDeviceStatus();
    }
  }, [sessions]);

  // Only fetch on mount
  useEffect(() => {
    let mounted = true;

    const initialFetch = async () => {
      if (isFetchingRef.current) return;
      
      try {
        isFetchingRef.current = true;
        await fetchSessions({ skipCache: true });
        if (mounted) {
          setLastUpdate(Date.now());
        }
      } catch (err) {
        console.error('Error fetching sessions:', err);
        if (mounted) {
          setError('Failed to load sessions');
        }
      } finally {
        isFetchingRef.current = false;
      }
    };

    initialFetch();

    return () => {
      mounted = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  // Fetch trusted devices
  useEffect(() => {
    const getTrustedDevices = async () => {
      try {
        const response = await axios.get('/api/user/security/device-sessions');
        if (response.data.devices) {
          setTrustedDevices(response.data.devices);
        }
      } catch (err) {
        console.error('Error fetching trusted devices:', err);
      }
    };

    getTrustedDevices();
  }, []);

  // Handle session revocation
  const handleRevokeSession = useCallback(async (sessionId: string) => {
    if (!canPerformOperation()) {
      return;
    }

    if (operationInProgress.current) {
      setError("Another operation is in progress. Please wait.");
      return;
    }

    if (!confirm("Are you sure you want to sign out from this session? This action cannot be undone.")) {
      return;
    }

    operationInProgress.current = true;
    setIsRevokingDevice(true);
    setDeviceToRevoke(sessionId);

    try {
      console.log(`[SessionsSection] Revoking session: ${sessionId}`);
      
      const response = await axios.post("/api/user/sessions/revoke", {
        sessionId,
      }, {
        timeout: 10000,
      });

      if (response.data.success) {
        setSuccess("Session revoked successfully");
        
        await reloadSessionData();
      } else {
        throw new Error(response.data.error || "Failed to revoke session");
      }
    } catch (error) {
      const errorMessage = handleApiError(error, "Failed to revoke session");
      setError(errorMessage);
      console.error("[SessionsSection] Revoke session error:", error);
    } finally {
      setIsRevokingDevice(false);
      setDeviceToRevoke(null);
      operationInProgress.current = false;
    }
  }, [canPerformOperation, handleApiError, setError, setSuccess, reloadSessionData]);

  // Handle revoking all sessions
  const handleRevokeAllSessions = useCallback(() => {
    if (!currentDeviceTrusted) {
      setError("Only trusted devices can sign out other sessions. Please use a trusted device.");
      return;
    }
    
    if (!canPerformOperation()) {
      return;
    }
    setRevokeAllConfirm(true);
  }, [canPerformOperation, currentDeviceTrusted, setError]);

  const confirmRevokeAllSessions = useCallback(async () => {
    if (hasPasswordSet && !confirmPassword.trim()) {
      setError("Please enter your password to confirm this action");
      return;
    }

    if (operationInProgress.current) {
      setError("Another operation is in progress. Please wait.");
      return;
    }

    operationInProgress.current = true;
    setIsRevokingAll(true);

    try {
      console.log("[SessionsSection] Revoking all sessions");
      
      const requestData: { password?: string } = {};
      if (hasPasswordSet) {
        requestData.password = confirmPassword;
      }

      const response = await axios.post(
        "/api/user/sessions/revoke-all",
        requestData,
        {
          timeout: 15000,
        }
      );

      if (response.data.success) {
        setSuccess(`Successfully signed out from ${response.data.revokedCount || 'all other'} session(s)`);
        setRevokeAllConfirm(false);
        setConfirmPassword("");
        
        await reloadSessionData();
      } else {
        throw new Error(response.data.error || "Failed to revoke sessions");
      }
    } catch (error) {
      let errorMessage = handleApiError(error, "Failed to revoke sessions");
      
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        errorMessage = "Incorrect password. Please try again.";
      }
      
      setError(errorMessage);
      console.error("[SessionsSection] Revoke all sessions error:", error);
    } finally {
      setIsRevokingAll(false);
      operationInProgress.current = false;
    }
  }, [
    hasPasswordSet,
    confirmPassword,
    handleApiError,
    setError,
    setSuccess,
    reloadSessionData,
  ]);

  const cancelRevokeAll = useCallback(() => {
    setRevokeAllConfirm(false);
    setConfirmPassword("");
  }, []);

  // Handle device trust update
  const handleUpdateDeviceTrust = useCallback(async (session: Session, trusted: boolean) => {
    if (!currentDeviceTrusted) {
      setError("Only trusted devices can change device trust settings.");
      return;
    }
    
    if (!canPerformOperation()) {
      return;
    }

    if (!trusted && session.isAccountCreationDevice) {
      const otherTrustedDevices = trustedDevices.filter(
        d => d.trusted && d.id !== session.deviceId
      ).length;
      
      if (otherTrustedDevices === 0) {
        setError("Cannot untrust the account creation device when no other trusted devices exist. Please trust another device first.");
        return;
      }
    }
    
    if (trusted) {
      setDeviceToTrust(session);
      setShowTrustConfirmation(true);
      return;
    }
    
    await updateDeviceTrustStatus(session, false);
  }, [canPerformOperation, trustedDevices, setError, currentDeviceTrusted]);

  const updateDeviceTrustStatus = useCallback(async (session: Session, trusted: boolean) => {
    if (!session.deviceId) {
      setError("Device information is missing. Cannot update trust status.");
      return;
    }

    if (operationInProgress.current) {
      setError("Another operation is in progress. Please wait.");
      return;
    }
    
    operationInProgress.current = true;
    setIsUpdatingTrust(true);
    
    try {
      console.log(`[SessionsSection] Updating device trust: ${session.deviceId} to ${trusted}`);
      
      const response = await axios.post("/api/user/devices/trust", {
        deviceId: session.deviceId,
        trusted,
      }, {
        timeout: 10000,
      });
      
      if (response.data.success) {
        setSuccess(`Device ${trusted ? 'marked as trusted' : 'unmarked as trusted'} successfully`);
        setShowTrustConfirmation(false);
        setDeviceToTrust(null);
        
        await reloadSessionData();
      } else {
        if (response.data.code === 'LAST_TRUSTED_DEVICE') {
          setError(response.data.message);
          return;
        }
        throw new Error(response.data.error || "Failed to update device trust status");
      }
    } catch (error) {
      const errorMessage = handleApiError(error, "Failed to update device trust status");
      setError(errorMessage);
      console.error("[SessionsSection] Update trust status error:", error);
    } finally {
      setIsUpdatingTrust(false);
      operationInProgress.current = false;
    }
  }, [handleApiError, setError, setSuccess, reloadSessionData]);

  const cancelTrustConfirmation = useCallback(() => {
    setShowTrustConfirmation(false);
    setDeviceToTrust(null);
  }, []);

  // Handle scheduling session removal
  const handleScheduleRemoval = useCallback((session: Session) => {
    if (!currentDeviceTrusted) {
      setError("Only trusted devices can schedule session removals.");
      return;
    }
    
    if (!canPerformOperation()) {
      return;
    }

    if (session.trusted) {
      setError("Cannot schedule removal for trusted devices. You must first untrust the device.");
      return;
    }

    setDeviceToSchedule(session);
    setShowScheduleRemoval(true);
    
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 20);
    setScheduledRemovalDate(defaultDate.toISOString().split('T')[0]);
  }, [canPerformOperation, setError, currentDeviceTrusted]);

  const confirmScheduleRemoval = useCallback(async () => {
    if (!scheduledRemovalDate) {
      setError("Please select a valid date");
      return;
    }
    
    const selectedDate = new Date(scheduledRemovalDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 20);
    maxDate.setHours(23, 59, 59, 999);
    
    if (selectedDate < now) {
      setError("Scheduled date cannot be in the past");
      return;
    }
    
    if (selectedDate > maxDate) {
      setError("Scheduled date cannot be more than 20 days from now");
      return;
    }

    if (operationInProgress.current) {
      setError("Another operation is in progress. Please wait.");
      return;
    }
    
    operationInProgress.current = true;
    setIsSchedulingRemoval(true);
    
    try {
      console.log(`[SessionsSection] Scheduling removal for session: ${deviceToSchedule?.id} on ${scheduledRemovalDate}`);
      
      const response = await axios.post("/api/user/sessions/schedule-revoke", {
        sessionId: deviceToSchedule?.id,
        scheduledDate: scheduledRemovalDate,
      }, {
        timeout: 10000,
      });
      
      if (response.data.success) {
        const formattedDate = new Date(scheduledRemovalDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        setSuccess(`Session removal scheduled for ${formattedDate}`);
        setShowScheduleRemoval(false);
        setDeviceToSchedule(null);
        setScheduledRemovalDate("");
        
        await reloadSessionData();
      } else {
        throw new Error(response.data.error || "Failed to schedule session removal");
      }
    } catch (error) {
      const errorMessage = handleApiError(error, "Failed to schedule session removal");
      setError(errorMessage);
      console.error("[SessionsSection] Schedule removal error:", error);
    } finally {
      setIsSchedulingRemoval(false);
      operationInProgress.current = false;
    }
  }, [
    scheduledRemovalDate,
    deviceToSchedule,
    handleApiError,
    setError,
    setSuccess,
    reloadSessionData,
  ]);

  const cancelScheduleRemoval = useCallback(() => {
    setShowScheduleRemoval(false);
    setDeviceToSchedule(null);
    setScheduledRemovalDate("");
  }, []);

  // Handle cancelling scheduled removal
  const handleCancelScheduledRemoval = useCallback(async (sessionId: string) => {
    if (!currentDeviceTrusted) {
      setError("Only trusted devices can cancel scheduled removals.");
      return;
    }
    
    if (!canPerformOperation()) {
      return;
    }

    if (!confirm("Are you sure you want to cancel the scheduled removal? The session will revert to its default expiration time.")) {
      return;
    }

    if (operationInProgress.current) {
      setError("Another operation is in progress. Please wait.");
      return;
    }

    operationInProgress.current = true;
    setIsCancellingSchedule(true);
    setSessionToCancelSchedule(sessionId);

    try {
      console.log(`[SessionsSection] Cancelling scheduled removal for session: ${sessionId}`);
      
      const response = await axios.post("/api/user/sessions/cancel-schedule", {
        sessionId,
      }, {
        timeout: 10000,
      });

      if (response.data.success) {
        setSuccess("Scheduled removal cancelled. Session reverted to default expiration.");
        
        await reloadSessionData();
      } else {
        throw new Error(response.data.error || "Failed to cancel scheduled removal");
      }
    } catch (error) {
      const errorMessage = handleApiError(error, "Failed to cancel scheduled removal");
      setError(errorMessage);
      console.error("[SessionsSection] Cancel schedule error:", error);
    } finally {
      setIsCancellingSchedule(false);
      setSessionToCancelSchedule(null);
      operationInProgress.current = false;
    }
  }, [canPerformOperation, handleApiError, setError, setSuccess, reloadSessionData, currentDeviceTrusted]);

  // Show skeleton loading if data is being loaded
  if (isLoading && sessions.length === 0) {
    return (
      <motion.div
        key="sessions-loading"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-4 sm:mb-5 md:mb-6">
          <h4 className="text-lg sm:text-xl md:text-2xl font-medium text-white mb-1.5 sm:mb-2">
            Active Sessions
          </h4>
        </div>
        <SessionSkeleton />
      </motion.div>
    );
  }

  return (
    <motion.div
      key="sessions"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-4 sm:mb-5 md:mb-6">
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-lg sm:text-xl md:text-2xl font-medium text-white mb-1">
              Active Sessions
            </h4>
            <p className="text-xs sm:text-sm text-gray-500">
              Last updated: {new Date(lastUpdate).toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3">
          {!isCheckingDeviceStatus && (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm">
              <span className="text-gray-400">Current device:</span>
              {currentDeviceTrusted ? (
                <span className="inline-flex items-center gap-1 text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                  <FaShieldAlt className="text-[10px]" />
                  <span className="font-medium">Trusted</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                  <FaExclamationTriangle className="text-[10px]" />
                  <span className="font-medium">Untrusted</span>
                </span>
              )}
            </div>
          )}
          
          {currentDeviceTrusted && sessions.filter((s) => !s.current).length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    type="button"
                    onClick={handleRevokeAllSessions}
                    disabled={isRevokingAll || operationInProgress.current}
                    className="text-red-400 hover:text-red-300 text-xs sm:text-sm font-medium transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaSignOutAlt className="mr-1.5 text-xs" />
                    <span className="hidden xs:inline">Sign out all other devices</span>
                    <span className="xs:hidden">Sign out all</span>
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    This will end all sessions except for your current one
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Trust device confirmation dialog */}
        {showTrustConfirmation && deviceToTrust && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-900/30 border border-red-500/30 p-3.5 sm:p-4 md:p-5 rounded-lg sm:rounded-xl mb-3 sm:mb-4 md:mb-5"
          >
            <div className="flex items-start gap-2.5 mb-3">
              <FaExclamationTriangle className="text-red-400 mt-0.5 flex-shrink-0 text-base sm:text-lg" />
              <div className="flex-1 min-w-0">
                <h5 className="text-white font-semibold mb-1.5 text-sm sm:text-base">
                  Trust Device Warning
                </h5>
                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                  Only mark devices as trusted if they are your personal devices and are kept secure.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <motion.button
                type="button"
                onClick={() => updateDeviceTrustStatus(deviceToTrust, true)}
                disabled={isUpdatingTrust}
                className="w-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-medium py-2.5 sm:py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base min-h-[44px] sm:min-h-[40px]"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {isUpdatingTrust ? (
                  <>
                    <LoadingSpinner className="text-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaShieldAlt className="mr-2" />
                    Confirm Trust Device
                  </>
                )}
              </motion.button>

              <motion.button
                type="button"
                onClick={cancelTrustConfirmation}
                disabled={isUpdatingTrust}
                className="w-full bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-white font-medium py-2.5 sm:py-2 px-4 rounded-lg transition-colors disabled:opacity-50 text-sm sm:text-base min-h-[44px] sm:min-h-[40px]"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Schedule Session Removal Dialog */}
        {showScheduleRemoval && deviceToSchedule && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-900/30 border border-red-500/30 p-3.5 sm:p-4 md:p-5 rounded-lg sm:rounded-xl mb-3 sm:mb-4 md:mb-5"
          >
            <div className="flex items-start gap-2.5 mb-3">
              <FaRegCalendarAlt className="text-red-400 mt-0.5 flex-shrink-0 text-base sm:text-lg" />
              <div className="flex-1 min-w-0">
                <h5 className="text-white font-semibold mb-1.5 text-sm sm:text-base">
                  Schedule Session Removal
                </h5>
                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                  Select a date when this session should be automatically revoked (maximum 20 days from today).
                </p>
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                Removal date
              </label>
              <input
                type="date"
                value={scheduledRemovalDate}
                onChange={(e) => setScheduledRemovalDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                max={(() => {
                  const maxDate = new Date();
                  maxDate.setDate(maxDate.getDate() + 20);
                  return maxDate.toISOString().split('T')[0];
                })()}
                disabled={isSchedulingRemoval}
                className="w-full rounded-lg bg-gray-700/40 border border-red-600/40 text-white py-2.5 px-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400/60 transition-all backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-[40px]"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <motion.button
                type="button"
                onClick={confirmScheduleRemoval}
                disabled={isSchedulingRemoval || !scheduledRemovalDate}
                className="w-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-medium py-2.5 sm:py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base min-h-[44px] sm:min-h-[40px]"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {isSchedulingRemoval ? (
                  <>
                    <LoadingSpinner className="text-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaRegCalendarAlt className="mr-2" />
                    Schedule Removal
                  </>
                )}
              </motion.button>

              <motion.button
                type="button"
                onClick={cancelScheduleRemoval}
                disabled={isSchedulingRemoval}
                className="w-full bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-white font-medium py-2.5 sm:py-2 px-4 rounded-lg transition-colors disabled:opacity-50 text-sm sm:text-base min-h-[44px] sm:min-h-[40px]"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Confirmation dialog for revoking all sessions */}
        {revokeAllConfirm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-900/30 border border-red-500/30 p-3.5 sm:p-4 md:p-5 rounded-lg sm:rounded-xl mb-3 sm:mb-4 md:mb-5"
          >
            <div className="flex items-start gap-2.5 mb-3">
              <FaExclamationTriangle className="text-red-400 mt-0.5 flex-shrink-0 text-base sm:text-lg" />
              <div className="flex-1 min-w-0">
                <h5 className="text-white font-semibold mb-1.5 text-sm sm:text-base">
                  Confirm Sign Out from All Devices
                </h5>
                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                  This will immediately sign you out from all other devices. You will remain signed in on this device.
                </p>
              </div>
            </div>

            {hasPasswordSet && (
              <div className="mb-3">
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && confirmPassword.trim()) {
                      confirmRevokeAllSessions();
                    }
                  }}
                  placeholder="Your password"
                  disabled={isRevokingAll}
                  className="w-full rounded-lg bg-gray-700/40 border border-red-600/40 text-white py-2.5 px-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400/60 transition-all backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-[40px]"
                  autoComplete="current-password"
                  autoFocus
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <motion.button
                type="button"
                onClick={confirmRevokeAllSessions}
                disabled={(hasPasswordSet && !confirmPassword.trim()) || isRevokingAll}
                className="w-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-medium py-2.5 sm:py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base min-h-[44px] sm:min-h-[40px]"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {isRevokingAll ? (
                  <>
                    <LoadingSpinner className="text-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaSignOutAlt className="mr-2" />
                    Confirm Sign Out All
                  </>
                )}
              </motion.button>

              <motion.button
                type="button"
                onClick={cancelRevokeAll}
                disabled={isRevokingAll}
                className="w-full bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-white font-medium py-2.5 sm:py-2 px-4 rounded-lg transition-colors disabled:opacity-50 text-sm sm:text-base min-h-[44px] sm:min-h-[40px]"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2.5 sm:space-y-3 md:space-y-4">
        <AnimatePresence mode="popLayout">
          {sessions.map((session) => (
            <motion.div
              key={session.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`p-3.5 sm:p-4 md:p-5 rounded-lg sm:rounded-xl border transition-all ${
                session.current
                  ? "bg-red-500/10 border-red-500/30 shadow-lg shadow-red-500/5"
                  : session.trusted
                  ? "bg-green-900/30 border-green-500/30 shadow-lg shadow-green-500/5"
                  : "bg-gray-900/50 border-red-500/20"
              }`}
              whileHover={{ scale: 1.005 }}
            >
              {/* Device Header */}
              <div className="flex items-start gap-2.5 mb-3">
                {session.os?.toLowerCase().includes("ios") ||
                session.os?.toLowerCase().includes("android") ? (
                  <FaMobile
                    className={`mt-0.5 flex-shrink-0 text-lg sm:text-xl ${
                      session.current
                        ? "text-red-400"
                        : session.trusted
                        ? "text-green-400"
                        : "text-gray-400"
                    }`}
                  />
                ) : (
                  <FaDesktop
                    className={`mt-0.5 flex-shrink-0 text-lg sm:text-xl ${
                      session.current
                        ? "text-red-400"
                        : session.trusted
                        ? "text-green-400"
                        : "text-gray-400"
                    }`}
                  />
                )}
                
                <div className="flex-1 min-w-0">
                  <h5 className="font-semibold text-white text-sm sm:text-base mb-1.5 break-words">
                    {session.deviceName}
                  </h5>
                  
                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {session.current && (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></span>
                        Current Device
                      </span>
                    )}
                    {session.isAccountCreationDevice && (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">
                        <FaShieldAlt className="text-[9px] sm:text-[10px]" />
                        Account Creation
                      </span>
                    )}
                    {session.trusted && !session.isAccountCreationDevice && (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">
                        <FaShieldAlt className="text-[9px] sm:text-[10px]" />
                        Trusted
                      </span>
                    )}
                    {session.scheduledRevocationDate && (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-medium">
                        <FaRegCalendarAlt className="text-[9px] sm:text-[10px]" />
                        {new Date(session.scheduledRevocationDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Device Details */}
              <div className="space-y-1.5 text-[11px] sm:text-xs text-gray-400 mb-3 pl-8 sm:pl-9">
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 flex-shrink-0">•</span>
                  <span className="break-all">{session.browser} on {session.os}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 flex-shrink-0">•</span>
                  <span className="break-words">{session.location}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 flex-shrink-0">•</span>
                  <span>IP: <span className="font-mono">{session.ipAddress}</span></span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 flex-shrink-0">•</span>
                  <span>
                    Last active: {new Date(session.lastUsed).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 flex-shrink-0">•</span>
                  <span>
                    Expires: {new Date(session.expiresAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-3 border-t border-gray-700/30">
                {/* Sign Out Button */}
                {(session.current || currentDeviceTrusted) && !session.current && (
                  <motion.button
                    type="button"
                    onClick={() => handleRevokeSession(session.id)}
                    disabled={
                      (isRevokingDevice && deviceToRevoke === session.id) ||
                      operationInProgress.current
                    }
                    className="w-full bg-red-600/10 hover:bg-red-600/20 active:bg-red-600/30 border border-red-500/30 text-red-400 hover:text-red-300 transition-colors font-medium text-xs sm:text-sm py-2.5 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] sm:min-h-[40px]"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {isRevokingDevice && deviceToRevoke === session.id ? (
                      <>
                        <LoadingSpinner className="text-red-400" />
                        <span>Signing out...</span>
                      </>
                    ) : (
                      <>
                        <FaSignOutAlt />
                        <span>Sign Out from This Device</span>
                      </>
                    )}
                  </motion.button>
                )}

                {/* Trust/Untrust and Schedule Buttons Row */}
                {currentDeviceTrusted && !session.current && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* Trust/Untrust Button */}
                    <motion.button
                      type="button"
                      onClick={() => handleUpdateDeviceTrust(session, !session.trusted)}
                      disabled={
                        (isUpdatingTrust && deviceToTrust?.id === session.id) ||
                        operationInProgress.current
                      }
                      className={`flex-1 transition-colors font-medium text-xs sm:text-sm py-2.5 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] sm:min-h-[40px] ${
                        session.trusted
                          ? "bg-yellow-600/10 hover:bg-yellow-600/20 active:bg-yellow-600/30 border border-yellow-500/30 text-yellow-400 hover:text-yellow-300"
                          : "bg-green-600/10 hover:bg-green-600/20 active:bg-green-600/30 border border-green-500/30 text-green-400 hover:text-green-300"
                      }`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      {isUpdatingTrust && deviceToTrust?.id === session.id ? (
                        <>
                          <LoadingSpinner className={session.trusted ? 'text-yellow-400' : 'text-green-400'} />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          {session.trusted ? (
                            <>
                              <FaTimes />
                              <span>Untrust Device</span>
                            </>
                          ) : (
                            <>
                              <FaShieldAlt />
                              <span>Trust Device</span>
                            </>
                          )}
                        </>
                      )}
                    </motion.button>

                    {/* Schedule/Cancel Schedule Button */}
                    {session.scheduledRevocationDate ? (
                      <motion.button
                        type="button"
                        onClick={() => handleCancelScheduledRemoval(session.id)}
                        disabled={
                          (isCancellingSchedule && sessionToCancelSchedule === session.id) ||
                          operationInProgress.current
                        }
                        className="flex-1 bg-orange-600/10 hover:bg-orange-600/20 active:bg-orange-600/30 border border-orange-500/30 text-orange-400 hover:text-orange-300 transition-colors font-medium text-xs sm:text-sm py-2.5 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] sm:min-h-[40px]"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        {isCancellingSchedule && sessionToCancelSchedule === session.id ? (
                          <>
                            <LoadingSpinner className="text-orange-400" />
                            <span>Cancelling...</span>
                          </>
                        ) : (
                          <>
                            <FaTimes />
                            <span>Cancel Schedule</span>
                          </>
                        )}
                      </motion.button>
                    ) : !session.trusted && (
                      <motion.button
                        type="button"
                        onClick={() => handleScheduleRemoval(session)}
                        disabled={operationInProgress.current}
                        className="flex-1 bg-blue-600/10 hover:bg-blue-600/20 active:bg-blue-600/30 border border-blue-500/30 text-blue-400 hover:text-blue-300 transition-colors font-medium text-xs sm:text-sm py-2.5 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] sm:min-h-[40px]"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <FaRegCalendarAlt />
                        <span>Schedule Removal</span>
                      </motion.button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {sessions.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 sm:py-16"
        >
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
            <FaDesktop className="text-gray-600 text-2xl sm:text-3xl" />
          </div>
          <p className="text-gray-400 text-base sm:text-lg font-medium mb-1.5">No active sessions found</p>
          <p className="text-gray-500 text-xs sm:text-sm max-w-sm mx-auto px-4">
            Sessions will appear here when you're logged in on different devices
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SessionsSection;