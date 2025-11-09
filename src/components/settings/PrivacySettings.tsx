"use client";
import {
  useState,
  useEffect,
  useCallback,
  useRef,
  Suspense,
  lazy,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaLock,
  FaEye,
  FaUserShield,
  FaCheckCircle,
  FaShieldAlt,
  FaFingerprint,
  FaDesktop,
  FaSignOutAlt,
  FaExclamationTriangle,
  FaHistory,
  FaExclamation,
} from "react-icons/fa";
import axios from "axios";

// Lazy load components
const PasswordSection = lazy(() => import("./Privacy/PasswordSection"));
const TwoFactorSection = lazy(() => import("./Privacy/TwoFactorSection"));
const SecurityOptionsSection = lazy(
  () => import("./Privacy/SecurityOptionsSection")
);
const SessionsSection = lazy(() => import("./Privacy/SessionsSection"));
const ActivityLogSection = lazy(() => import("./Privacy/ActivityLogSection"));

// Skeleton loading component
const SectionSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 bg-gray-700/50 rounded-lg w-3/4"></div>
    <div className="h-4 bg-gray-700/50 rounded w-full"></div>
    <div className="h-4 bg-gray-700/50 rounded w-5/6"></div>
    <div className="space-y-3 mt-6">
      <div className="h-12 bg-gray-700/50 rounded-lg"></div>
      <div className="h-12 bg-gray-700/50 rounded-lg"></div>
      <div className="h-12 bg-gray-700/50 rounded-lg"></div>
    </div>
    <div className="flex space-x-4 mt-6">
      <div className="h-10 bg-gray-700/50 rounded-lg w-32"></div>
      <div className="h-10 bg-gray-700/50 rounded-lg w-32"></div>
    </div>
  </div>
);

const PageSkeleton = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="w-full mb-8"
  >
    <div className="mb-6 sm:mb-8 animate-pulse">
      <div className="h-8 bg-gray-700/50 rounded-lg w-64 mb-2"></div>
      <div className="h-4 bg-gray-700/50 rounded w-full sm:w-96"></div>
    </div>

    <div className="bg-gray-900/50 rounded-xl border border-red-500/20 overflow-hidden">
      <div className="border-b border-gray-700/50">
        <nav className="flex -mb-px overflow-x-auto hide-scrollbar">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="py-3 sm:py-4 px-4 sm:px-6 animate-pulse">
              <div className="h-5 bg-gray-700/50 rounded w-20 sm:w-24"></div>
            </div>
          ))}
        </nav>
      </div>
      <div className="p-4 sm:p-5 md:p-6">
        <SectionSkeleton />
      </div>
    </div>
  </motion.div>
);

interface PrivacySettingsProps {
  user: any;
  onUpdate: (section: string, data: any) => Promise<void>;
  isLoading?: boolean;
}

const PrivacySettings = ({
  user,
  onUpdate,
  isLoading,
}: PrivacySettingsProps) => {
  // State declarations
  const [settings, setSettings] = useState({
    showEmail: false,
    showPhone: false,
    showLastSeen: true,
    showActivityStatus: true,
    dataProcessingConsent: true,
    marketingConsent: false,
    contentFiltering: "moderate",
    dataRetentionPeriod: 365,
  });

  const [activeSecurityTab, setActiveSecurityTab] = useState("password");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [securityAnalysis, setSecurityAnalysis] = useState<{
    score: number;
    recommendations: string[];
  }>({
    score: 0,
    recommendations: [],
  });

  const [sessions, setSessions] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [hasPasswordSet, setHasPasswordSet] = useState(() => !!user?.password);
  const [isCheckingPasswordStatus, setIsCheckingPasswordStatus] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [primaryTwoFactorMethod, setPrimaryTwoFactorMethod] = useState<string | null>(null);
  const [backupCodesEnabled, setBackupCodesEnabled] = useState(false);
  const [backupCodesCount, setBackupCodesCount] = useState(0);
  const [trustedDevices, setTrustedDevices] = useState<any[]>([]);
  const [isFetchingDevices, setIsFetchingDevices] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricCredentials, setBiometricCredentials] = useState<any[]>([]);
  const [recoveryOptionsConfigured, setRecoveryOptionsConfigured] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [useRecoveryEmail, setUseRecoveryEmail] = useState(false);
  const [recoveryPhone, setRecoveryPhone] = useState("");
  const [useRecoveryPhone, setUseRecoveryPhone] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isPasswordStatusLoaded, setIsPasswordStatusLoaded] = useState(false);
  const [initialLoadStarted, setInitialLoadStarted] = useState(false);
  
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);
  const [isActivityLoading, setIsActivityLoading] = useState(false);
  const [isTwoFactorLoading, setIsTwoFactorLoading] = useState(false);
  const [isSecurityOptionsLoading, setIsSecurityOptionsLoading] = useState(false);

  const requestsInProgress = useRef({
    passwordStatus: false,
    twoFactorStatus: false,
    sessions: false,
    securityEvents: false,
    activityLogs: false,
    trustedDevices: false,
    biometricStatus: false,
    recoveryOptions: false,
  });

  const apiCache = useRef<Record<string, any>>({
    passwordStatus: null,
    twoFactorStatus: null,
    sessions: null,
    securityEvents: null,
    activityLogs: null,
    trustedDevices: null,
    biometricStatus: null,
    recoveryOptions: null,
  });

  const debounce = <T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    return new Promise((resolve, reject) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, wait);
    });
  };
};

  const invalidateCache = useCallback((cacheKeys: string[]) => {
    cacheKeys.forEach((key) => {
      if (key in apiCache.current) {
        apiCache.current[key] = null;
      }
    });
  }, []);

  const fetchSessions = useCallback(async (options?: { skipCache?: boolean }) => {
    if (requestsInProgress.current.sessions) {
      console.log('[fetchSessions] Request already in progress, BLOCKING');
      return;
    }

    if (options?.skipCache) {
      apiCache.current.sessions = null;
    }

    if (!options?.skipCache && apiCache.current.sessions) {
      console.log('[fetchSessions] Using cached data');
      setSessions(apiCache.current.sessions);
      return;
    }

    requestsInProgress.current.sessions = true;
    setIsSessionsLoading(true);
    console.log('[fetchSessions] Starting fetch...');

    try {
      const params = new URLSearchParams();
      params.append("_t", Date.now().toString());
      
      const url = `/api/user/sessions?${params.toString()}`;
      const response = await axios.get(url, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.data.sessions) {
        apiCache.current.sessions = response.data.sessions;
        setSessions(response.data.sessions);
        console.log('[fetchSessions] Fetch completed successfully, sessions:', response.data.sessions.length);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error("[fetchSessions] Error:", error);
      setSessions([]);
    } finally {
      requestsInProgress.current.sessions = false;
      setIsSessionsLoading(false);
      console.log('[fetchSessions] Request completed, flag cleared');
    }
  }, []);

  const checkPasswordStatus = useCallback(async () => {
    if (requestsInProgress.current.passwordStatus) return;
    if (user?.password !== undefined && isPasswordStatusLoaded) {
      setHasPasswordSet(!!user.password);
      return;
    }
    if (apiCache.current.passwordStatus) {
      setHasPasswordSet(apiCache.current.passwordStatus.hasPassword);
      setIsPasswordStatusLoaded(true);
      return;
    }

    requestsInProgress.current.passwordStatus = true;
    setIsCheckingPasswordStatus(true);

    try {
      const response = await axios.get("/api/user/password/status", {
        timeout: 5000,
      });
      apiCache.current.passwordStatus = response.data;
      if (response.data.hasPassword !== hasPasswordSet) {
        setHasPasswordSet(response.data.hasPassword);
      }
    } catch (error) {
      console.error("Error checking password status:", error);
      setHasPasswordSet(false);
    } finally {
      setIsCheckingPasswordStatus(false);
      setIsPasswordStatusLoaded(true);
      requestsInProgress.current.passwordStatus = false;
    }
  }, [user, hasPasswordSet, isPasswordStatusLoaded]);

  const fetch2FAStatus = useCallback(async () => {
    if (requestsInProgress.current.twoFactorStatus) return Promise.resolve();
    if (apiCache.current.twoFactorStatus) {
      const data = apiCache.current.twoFactorStatus;
      setTwoFactorEnabled(data.enabled);
      if (data.primaryMethod) setPrimaryTwoFactorMethod(data.primaryMethod);
      setBackupCodesCount(data.backupCodesCount || 0);
      setBackupCodesEnabled(data.backupCodesEnabled || false);
      setRecoveryOptionsConfigured(data.recoveryOptionsConfigured || false);
      if (data.recoveryEmail) {
        setRecoveryEmail(data.recoveryEmail);
        setUseRecoveryEmail(true);
      }
      if (data.recoveryPhone) {
        setRecoveryPhone(data.recoveryPhone);
        setUseRecoveryPhone(true);
      }
      return Promise.resolve();
    }

    requestsInProgress.current.twoFactorStatus = true;
    setIsTwoFactorLoading(true);

    try {
      const response = await axios.get("/api/user/2fa/status");
      apiCache.current.twoFactorStatus = response.data;
      setTwoFactorEnabled(response.data.enabled);
      if (response.data.primaryMethod) {
        setPrimaryTwoFactorMethod(response.data.primaryMethod);
      }
      setBackupCodesCount(response.data.backupCodesCount || 0);
      setBackupCodesEnabled(response.data.backupCodesEnabled || false);
      setRecoveryOptionsConfigured(
        response.data.recoveryOptionsConfigured || false
      );
      if (response.data.recoveryEmail) {
        setRecoveryEmail(response.data.recoveryEmail);
        setUseRecoveryEmail(true);
      }
      if (response.data.recoveryPhone) {
        setRecoveryPhone(response.data.recoveryPhone);
        setUseRecoveryPhone(true);
      }
      return Promise.resolve();
    } catch (error) {
      console.error("Error fetching 2FA status:", error);
      return Promise.reject(error);
    } finally {
      requestsInProgress.current.twoFactorStatus = false;
      setIsTwoFactorLoading(false);
    }
  }, []);

  const fetchTrustedDevices = useCallback(async (options?: { skipCache?: boolean }) => {
    if (requestsInProgress.current.trustedDevices) return Promise.resolve();
    if (apiCache.current.trustedDevices && !options?.skipCache) {
      setTrustedDevices(apiCache.current.trustedDevices);
      return Promise.resolve();
    }
    if (options?.skipCache) {
      apiCache.current.trustedDevices = null;
    }

    requestsInProgress.current.trustedDevices = true;
    setIsFetchingDevices(true);

    try {
      const response = await axios.get("/api/user/security/device-sessions", {
        params: { _t: Date.now() },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      apiCache.current.trustedDevices = response.data.devices || [];
      if (response.data.devices) {
        setTrustedDevices(response.data.devices);
      } else {
        setTrustedDevices([]);
      }
      return Promise.resolve();
    } catch (error: any) {
      console.error("Error fetching trusted devices:", error);
      setError(
        `Failed to fetch trusted devices: ${error.response?.data?.error || error.message}`
      );
      setTrustedDevices([]);
      return Promise.reject(error);
    } finally {
      setIsFetchingDevices(false);
      requestsInProgress.current.trustedDevices = false;
    }
  }, []);

  const fetchBiometricStatus = useCallback(
    debounce(async (options = { skipCache: false }) => {
      if (requestsInProgress.current.biometricStatus) return;
      if (options.skipCache) {
        apiCache.current.biometricStatus = null;
      }
      if (!options.skipCache && apiCache.current.biometricStatus) {
        const data = apiCache.current.biometricStatus;
        setBiometricEnabled(data.enabled);
        setBiometricCredentials(data.credentials || []);
        return;
      }

      requestsInProgress.current.biometricStatus = true;

      try {
        const timestamp = Date.now();
        const response = await fetch(`/api/user/biometric/status?_t=${timestamp}`, {
          credentials: "same-origin",
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        const data = await response.json();

        const credentialsResponse = await fetch(`/api/user/biometric/list?_t=${timestamp}`, {
          credentials: "same-origin",
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        const credentialsData = await credentialsResponse.json();

        apiCache.current.biometricStatus = {
          enabled: credentialsData.credentials?.length > 0,
          credentials: credentialsData.credentials || [],
        };

        const credentials = credentialsData.credentials || [];
        setBiometricCredentials(credentials);
        setBiometricEnabled(credentials.length > 0);
      } catch (error) {
        console.error("Error fetching biometric status:", error);
      } finally {
        requestsInProgress.current.biometricStatus = false;
      }
    }, 300),
    []
  );

  const checkBiometricAvailability = useCallback(
    debounce(async () => {
      try {
        const available =
          window &&
          typeof window !== "undefined" &&
          "PublicKeyCredential" in window &&
          typeof window.PublicKeyCredential !== "undefined";

        setBiometricAvailable(available);

        if (available) {
          try {
            const platformAuthenticatorAvailable =
              await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            setBiometricAvailable(platformAuthenticatorAvailable);
          } catch (e) {
            console.warn("Could not determine platform authenticator availability", e);
            setBiometricAvailable(false);
          }

          if (user?.id) {
            await fetchBiometricStatus();
          }
        }
      } catch (error) {
        console.error("Error checking biometric availability:", error);
        setBiometricAvailable(false);
      }
    }, 300),
    [fetchBiometricStatus, user]
  );

  const fetchActivityLogs = useCallback(async () => {
    if (requestsInProgress.current.activityLogs) return Promise.resolve();
    if (apiCache.current.activityLogs) {
      setActivityLogs(apiCache.current.activityLogs);
      return Promise.resolve();
    }

    requestsInProgress.current.activityLogs = true;
    setIsActivityLoading(true);

    try {
      const response = await axios.get("/api/user/activity/logs");
      if (response.data.logs) {
        apiCache.current.activityLogs = response.data.logs;
        setActivityLogs(response.data.logs);
      } else {
        setActivityLogs([]);
      }
      return Promise.resolve();
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      setActivityLogs([]);
      return Promise.reject(error);
    } finally {
      requestsInProgress.current.activityLogs = false;
      setIsActivityLoading(false);
    }
  }, []);

  const fetchSecurityEvents = useCallback(async () => {
    if (requestsInProgress.current.securityEvents) return Promise.resolve();
    if (apiCache.current.securityEvents) {
      setSecurityEvents(apiCache.current.securityEvents);
      return Promise.resolve();
    }

    requestsInProgress.current.securityEvents = true;
    setIsActivityLoading(true);

    try {
      const response = await axios.get("/api/user/security/events");
      if (response.data.events) {
        apiCache.current.securityEvents = response.data.events;
        setSecurityEvents(response.data.events);
      } else {
        setSecurityEvents([]);
      }
      return Promise.resolve();
    } catch (error) {
      console.error("Error fetching security events:", error);
      setSecurityEvents([]);
      return Promise.reject(error);
    } finally {
      requestsInProgress.current.securityEvents = false;
      setIsActivityLoading(false);
    }
  }, []);

  const debouncedFetchRecoveryOptions = useCallback(
    debounce(async () => {
      if (requestsInProgress.current.recoveryOptions) return;
      if (apiCache.current.recoveryOptions) {
        const data = apiCache.current.recoveryOptions;
        if (data.recoveryEmail) {
          setRecoveryEmail(data.recoveryEmail);
          setUseRecoveryEmail(true);
        }
        if (data.recoveryPhone) {
          setRecoveryPhone(data.recoveryPhone);
          setUseRecoveryPhone(true);
        }
        setRecoveryOptionsConfigured(
          data.hasRecoveryEmail || data.hasRecoveryPhone
        );
        return;
      }

      requestsInProgress.current.recoveryOptions = true;

      try {
        const response = await axios.get("/api/user/recovery/status");
        apiCache.current.recoveryOptions = response.data;
        if (response.data.recoveryEmail) {
          setRecoveryEmail(response.data.recoveryEmail);
          setUseRecoveryEmail(true);
        }
        if (response.data.recoveryPhone) {
          setRecoveryPhone(response.data.recoveryPhone);
          setUseRecoveryPhone(true);
        }
        setRecoveryOptionsConfigured(
          response.data.hasRecoveryEmail || response.data.hasRecoveryPhone
        );
      } catch (error) {
        console.error("Error fetching recovery options:", error);
      } finally {
        requestsInProgress.current.recoveryOptions = false;
      }
    }, 300),
    []
  );

  const calculateSecurityScore = useCallback(
    (userData: any) => {
      let score = 0;
      const recommendations: string[] = [];

      if (userData.password) {
        score += 20;
      } else {
        recommendations.push("Set a strong password for your account");
      }

      if (userData.twoFactorEnabled) {
        score += 30;
      } else {
        recommendations.push("Enable two-factor authentication for additional security");
      }

      if (userData.recoveryEmail || userData.recoveryPhone) {
        score += 15;
        setRecoveryOptionsConfigured(true);
        setRecoveryEmail(userData.recoveryEmail || "");
        setRecoveryPhone(userData.recoveryPhone || "");
        setUseRecoveryEmail(!!userData.recoveryEmail);
        setUseRecoveryPhone(!!userData.recoveryPhone);
      } else {
        recommendations.push("Configure recovery options in case you lose access to your account");
      }

      if (trustedDevices.length > 0) {
        const lastReviewedDevice = new Date(
          Math.max(...trustedDevices.map((d) => new Date(d.lastUsed).getTime()))
        );

        if (new Date().getTime() - lastReviewedDevice.getTime() < 30 * 24 * 60 * 60 * 1000) {
          score += 15;
        } else {
          recommendations.push("Review your trusted devices regularly");
        }
      } else {
        recommendations.push("No trusted devices configured. Consider adding your current device");
      }

      if (sessions.length === 1) {
        score += 20;
      } else if (sessions.length > 3) {
        recommendations.push("You have multiple active sessions. Consider signing out from unused devices");
      }

      setSecurityAnalysis({
        score: Math.min(score, 100),
        recommendations,
      });
    },
    [sessions.length, trustedDevices]
  );

  const reloadAllSecurityData = useCallback(async () => {
    console.log("🔄 Reloading ALL security data after changes...");

    invalidateCache([
      "twoFactorStatus",
      "securityEvents",
      "activityLogs",
      "trustedDevices",
      "biometricStatus",
      "recoveryOptions",
      "sessions"
    ]);

    try {
      await fetchSessions({ skipCache: true });
      
      await Promise.all([
        fetch2FAStatus(),
        fetchSecurityEvents(),
        fetchActivityLogs(),
        fetchTrustedDevices({ skipCache: true }),
        fetchBiometricStatus({ skipCache: true }),
        debouncedFetchRecoveryOptions(),
      ]);

      console.log("✅ All security data reloaded successfully");
    } catch (error) {
      console.error("❌ Error reloading security data:", error);
    }
  }, [
    invalidateCache,
    fetch2FAStatus,
    fetchSecurityEvents,
    fetchActivityLogs,
    fetchTrustedDevices,
    fetchBiometricStatus,
    debouncedFetchRecoveryOptions,
    fetchSessions,
  ]);

  useEffect(() => {
    const loadDataForActiveTab = async () => {
      if (!isPasswordStatusLoaded && !requestsInProgress.current.passwordStatus) {
        await checkPasswordStatus();
      }

      switch (activeSecurityTab) {
        case "password":
          break;
        case "2fa":
          if (!requestsInProgress.current.twoFactorStatus) {
            fetch2FAStatus();
          }
          break;
        case "security_options":
          if (!requestsInProgress.current.biometricStatus) {
            checkBiometricAvailability();
          }
          if (!requestsInProgress.current.recoveryOptions) {
            debouncedFetchRecoveryOptions();
          }
          break;
        case "sessions":
          if (!requestsInProgress.current.sessions) {
            fetchSessions({ skipCache: true });
          }
          break;
        case "activity":
          if (!requestsInProgress.current.activityLogs) {
            fetchActivityLogs();
          }
          if (!requestsInProgress.current.securityEvents) {
            fetchSecurityEvents();
          }
          break;
      }
    };

    if (user && isDataLoaded) {
      loadDataForActiveTab();
    }
  }, [
    user,
    isDataLoaded,
    activeSecurityTab,
    isPasswordStatusLoaded,
    checkPasswordStatus,
    fetch2FAStatus,
    fetchActivityLogs,
    fetchSecurityEvents,
    checkBiometricAvailability,
    debouncedFetchRecoveryOptions,
    fetchSessions,
  ]);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!initialLoadStarted && user) {
        setInitialLoadStarted(true);
        setIsDataLoaded(false);

        try {
          await checkPasswordStatus();
          const twoFactorPromise = fetch2FAStatus();
          await new Promise((resolve) => setTimeout(resolve, 100));
          setIsDataLoaded(true);
          calculateSecurityScore({
            ...user,
            twoFactorEnabled: twoFactorEnabled,
            recoveryEmail: recoveryEmail,
            recoveryPhone: recoveryPhone,
          });
          await twoFactorPromise;
        } catch (error) {
          console.error("Error loading initial privacy settings data:", error);
          setTimeout(() => setIsDataLoaded(true), 2000);
        }
      }
    };

    loadInitialData();
  }, [
    user,
    initialLoadStarted,
    checkPasswordStatus,
    fetch2FAStatus,
    calculateSecurityScore,
    twoFactorEnabled,
    recoveryEmail,
    recoveryPhone,
  ]);

  useEffect(() => {
    return () => {
      apiCache.current = {
        passwordStatus: null,
        twoFactorStatus: null,
        sessions: null,
        securityEvents: null,
        activityLogs: null,
        trustedDevices: null,
        biometricStatus: null,
        recoveryOptions: null,
      };

      requestsInProgress.current = {
        passwordStatus: false,
        twoFactorStatus: false,
        sessions: false,
        securityEvents: false,
        activityLogs: false,
        trustedDevices: false,
        biometricStatus: false,
        recoveryOptions: false,
      };
    };
  }, []);

  if (!isDataLoaded) {
    return <PageSkeleton />;
  }

  const handleToggleChange = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  const handleSelectChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate("privacy", settings);
  };

  return (
    <div className="w-full mb-8">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white flex items-center mb-2">
          <FaLock className="mr-2 sm:mr-3 text-red-500 text-lg sm:text-xl" />
          Privacy & Security
        </h2>
      </div>

      {/* Error/Success Messages */}
      <AnimatePresence>
        {(error || success) && (
          <motion.div
            className={`mb-6 p-3 sm:p-4 rounded-xl border backdrop-blur-sm ${
              error
                ? "bg-red-900/30 border-red-500/30 text-red-300"
                : "bg-green-900/30 border-green-500/30 text-green-300"
            }`}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            layout
          >
            <div className="flex items-center space-x-3">
              <motion.div
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center text-xs sm:text-sm ${
                  error
                    ? "border-red-400 bg-red-500/20"
                    : "border-green-400 bg-green-500/20"
                }`}
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                {error ? <FaExclamationTriangle /> : <FaCheckCircle />}
              </motion.div>
              <span className="font-medium flex-1 text-sm sm:text-base">{error || success}</span>
              <button
                onClick={() => {
                  setError(null);
                  setSuccess(null);
                }}
                className="text-lg sm:text-xl hover:scale-110 transition-transform"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        <div className="bg-gray-900/50 rounded-xl border border-red-500/20 overflow-hidden">
          {/* Tabs Navigation */}
          <div className="border-b border-gray-700/50">
            <nav className="flex -mb-px overflow-x-auto hide-scrollbar">
              {[
                { id: "password", label: "Password", icon: FaLock },
                { id: "2fa", label: "Two-Factor", icon: FaFingerprint },
                { id: "security_options", label: "Security", icon: FaShieldAlt },
                { id: "sessions", label: "Sessions", icon: FaDesktop },
                { id: "activity", label: "Activity", icon: FaHistory },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveSecurityTab(tab.id)}
                    className={`py-3 sm:py-4 px-4 sm:px-6 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                      activeSecurityTab === tab.id
                        ? "text-red-400 border-b-2 border-red-400"
                        : "text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon
                        className={`mr-1.5 sm:mr-2 text-sm sm:text-base ${activeSecurityTab === tab.id ? "text-red-400" : "text-gray-500"}`}
                      />
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-5 md:p-6">
            <AnimatePresence mode="wait">
              {activeSecurityTab === "password" && (
                <Suspense fallback={<SectionSkeleton />}>
                  <PasswordSection
                    user={user}
                    hasPasswordSet={hasPasswordSet}
                    setHasPasswordSet={setHasPasswordSet}
                    isCheckingPasswordStatus={isCheckingPasswordStatus}
                    setSuccess={setSuccess}
                    setError={setError}
                    fetchSecurityEvents={fetchSecurityEvents}
                    fetchActivityLogs={fetchActivityLogs}
                    calculateSecurityScore={calculateSecurityScore}
                  />
                </Suspense>
              )}

              {activeSecurityTab === "2fa" && (
                <Suspense fallback={<SectionSkeleton />}>
                  <TwoFactorSection
                    user={user}
                    hasPasswordSet={hasPasswordSet}
                    twoFactorEnabled={twoFactorEnabled}
                    setTwoFactorEnabled={setTwoFactorEnabled}
                    primaryTwoFactorMethod={primaryTwoFactorMethod}
                    setPrimaryTwoFactorMethod={setPrimaryTwoFactorMethod}
                    backupCodesEnabled={backupCodesEnabled}
                    setBackupCodesEnabled={setBackupCodesEnabled}
                    backupCodesCount={backupCodesCount}
                    setBackupCodesCount={setBackupCodesCount}
                    recoveryOptionsConfigured={recoveryOptionsConfigured}
                    setSuccess={setSuccess}
                    setError={setError}
                    fetch2FAStatus={fetch2FAStatus}
                    fetchTrustedDevices={fetchTrustedDevices}
                    fetchSecurityEvents={fetchSecurityEvents}
                    fetchActivityLogs={fetchActivityLogs}
                    calculateSecurityScore={calculateSecurityScore}
                    recoveryEmail={recoveryEmail}
                    setRecoveryEmail={setRecoveryEmail}
                    useRecoveryEmail={useRecoveryEmail}
                    setUseRecoveryEmail={setUseRecoveryEmail}
                    recoveryPhone={recoveryPhone}
                    setRecoveryPhone={setRecoveryPhone}
                    useRecoveryPhone={useRecoveryPhone}
                    setUseRecoveryPhone={setUseRecoveryPhone}
                    reloadAllSecurityData={reloadAllSecurityData}
                  />
                </Suspense>
              )}

              {activeSecurityTab === "security_options" && (
                <Suspense fallback={<SectionSkeleton />}>
                  <SecurityOptionsSection
                    hasPasswordSet={hasPasswordSet}
                    biometricAvailable={biometricAvailable}
                    biometricEnabled={biometricEnabled}
                    biometricCredentials={biometricCredentials}
                    fetchBiometricStatus={fetchBiometricStatus}
                    setSuccess={setSuccess}
                    setError={setError}
                    setSecurityEvents={setSecurityEvents}
                    setActivityLogs={setActivityLogs}
                    recoveryEmail={recoveryEmail}
                    setRecoveryEmail={setRecoveryEmail}
                    useRecoveryEmail={useRecoveryEmail}
                    setUseRecoveryEmail={setUseRecoveryEmail}
                    calculateSecurityScore={calculateSecurityScore}
                    user={user}
                    reloadAllSecurityData={reloadAllSecurityData}
                  />
                </Suspense>
              )}

              {activeSecurityTab === "sessions" && (
                <Suspense fallback={<SectionSkeleton />}>
                  <SessionsSection
                    sessions={sessions}
                    hasPasswordSet={hasPasswordSet}
                    setSuccess={setSuccess}
                    setError={setError}
                    fetchTrustedDevices={fetchTrustedDevices}
                    fetchSessions={fetchSessions}
                    isLoading={isSessionsLoading}
                    reloadAllSecurityData={reloadAllSecurityData}
                  />
                </Suspense>
              )}

              {activeSecurityTab === "activity" && (
                <Suspense fallback={<SectionSkeleton />}>
                  <ActivityLogSection
                    securityEvents={securityEvents}
                    activityLogs={activityLogs}
                    isLoading={isActivityLoading}
                  />
                </Suspense>
              )}
            </AnimatePresence>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PrivacySettings;