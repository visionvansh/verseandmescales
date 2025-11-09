///contexts/AuthContext
"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import CryptoJS from "crypto-js";

// Updated User interface to match your schema
interface User {
  id: string;
  email: string;
  username?: string;
  name?: string;
  surname?: string;
  img?: string;
  phone?: string;
  timezone?: string;
  discordUsername?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  biometricEnabled?: boolean;
  lastLogin?: string;
  createdAt: string;
  preferences?: any;
  socialAccounts?: any[];
}

interface UserSession {
  id: string;
  deviceId?: string;
  ipAddress: string;
  location: string;
  country: string;
  city: string;
  sessionType: string;
  isActive: boolean;
  lastUsed: string;
  createdAt: string;
  expiresAt: string;
  deviceName?: string;
  browser?: string;
  os?: string;
}

interface AuthResponse {
  user?: User;
  requiresTwoFactor?: boolean;
  twoFactorSessionId?: string;
  twoFactorMethods?: string[];
  deviceTrusted?: boolean;
  suspiciousActivity?: boolean;
  isNewDevice?: boolean;
  isNewLocation?: boolean;
  riskScore?: number;
  riskFactors?: string[];
  recommendations?: string[];
  hasPasskeys?: boolean;
  bypassed2FA?: boolean;
  securityScore?: number;
  expiresIn?: number;
  redirectPath?: string;
}

interface SecurityEvent {
  id: string;
  eventType: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  resolved: boolean;
  createdAt: string;
}

interface TwoFactorBackupCode {
  id: string;
  code: string;
  used: boolean;
  createdAt: string;
}

interface RecoveryOptions {
  hasBackupCodes: boolean;
  hasVerifiedEmail: boolean;
  hasVerifiedPhone: boolean;
  partialEmail?: string;
  partialPhone?: string;
}

interface DeviceInfo {
  platform: string;
  userAgent: string;
  language: string;
  timezone: string;
  screen: string;
  deviceType?: string;
  deviceName?: string;
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;  // ✅ Change from 'loading' to 'isLoading'
  isAuthenticated: boolean;
  authChecked: boolean; // ✅ Add this
  sessions: UserSession[];
  securityEvents: SecurityEvent[];
  deviceFingerprint: string;
  deviceTrusted: boolean;
  suspiciousActivity: boolean;
  recoveryOptions: RecoveryOptions | null;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
    trustThisDevice?: boolean,
    redirectUrl?: string
  ) => Promise<AuthResponse>; // ✅ Add redirectUrl parameter
  logout: (sessionId?: string) => Promise<void>;
  logoutAllSessions: () => Promise<void>;
  refreshToken: () => Promise<void>;
  verifyTwoFactor: (
    code: string,
    sessionId: string,
    method?: string,
    trustThisDevice?: boolean
  ) => Promise<AuthResponse>;
  setupTwoFactor: () => Promise<{
    qrCode: string;
    secret: string;
    tempSecretId: string;
  }>;
  finalizeTwoFactorSetup: (
    code: string,
    tempSecretId: string,
    password: string
  ) => Promise<{ backupCodes: string[] }>;
  disableTwoFactor: (password: string) => Promise<void>;
  regenerateBackupCodes: (
    password: string
  ) => Promise<{ backupCodes: string[] }>;
  getBackupCodesStatus: () => Promise<{
    unusedCodes: number;
    usedCodes: number;
  }>;
  resendTwoFactorCode: (sessionId: string, method: string) => Promise<void>;
  setupPasskey: (deviceName: string) => Promise<void>;
  listPasskeys: () => Promise<any[]>;
  deletePasskey: (passkeyId: string) => Promise<void>;
  listDevices: () => Promise<any[]>;
  trustDevice: (deviceId: string) => Promise<void>;
  untrustDevice: (deviceId: string) => Promise<void>;
  revokeDevice: (deviceId: string) => Promise<void>;
  generateQRLoginCode: () => Promise<string>;
  validateQRLogin: (token: string) => Promise<boolean>;
  initiateRecovery: (email: string) => Promise<RecoveryOptions>;
  sendEmailRecoveryCode: (email: string) => Promise<void>;
  sendPhoneRecoveryCode: (phone: string) => Promise<void>;
  verifyEmailRecoveryCode: (
    email: string,
    code: string
  ) => Promise<{ token: string }>;
  verifyPhoneRecoveryCode: (
    phone: string,
    code: string
  ) => Promise<{ token: string }>;
  resetPasswordWithToken: (token: string, newPassword: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  fetchSessions: () => Promise<void>;
  fetchSecurityEvents: () => Promise<void>;
  resolveSecurityEvent: (eventId: string) => Promise<void>;
  checkAuthStatus: (forceRefresh?: boolean) => Promise<void>; // ✅ Updated to accept optional forceRefresh
  clearAllData: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Define public routes
const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/pricing",
 
];

// ✅ Define public routes that should still check auth but not redirect
const PUBLIC_ROUTES_WITH_AUTH_CHECK = [
  "/users/courses",
];

// ✅ Define specific protected route prefixes (more granular)
const PROTECTED_ROUTE_PREFIXES = [
  "/users/management",
  "/users/dashboard",
  "/users/profile",
  "/users/settings",
  "/users/my-courses",
  "/users/courseinside",
  "/users/analytics",
  "/users/payout",
  "/users/homepage-builder",
  "/users/builder",
  "/admin",
  
];

// ✅ Define public route prefixes (including /users/courses)
const PUBLIC_ROUTE_PREFIXES = [
  "/auth/",
  "/users/courses", // ✅ Make courses public
];

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();

  // ✅ Helper to check if route is public courses
  const isPublicCoursesRoute = useCallback((path: string) => {
    return path === '/users/courses' || path.startsWith('/users/courses/');
  }, []);

  // Add this helper function at the top of the file
  const emitAuthChange = (user: User | null) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth-state-changed', { 
        detail: { user } 
      }));
    }
  };

  // State
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceFingerprint, setDeviceFingerprint] = useState("");
  const [deviceTrusted, setDeviceTrusted] = useState(false);
  const [suspiciousActivity, setSuspiciousActivity] = useState(false);
  const [recoveryOptions, setRecoveryOptions] =
    useState<RecoveryOptions | null>(null);
  // Add these at the top with other state
  const [authChecked, setAuthChecked] = useState(false);
  const authCacheRef = useRef<{
    user: User | null;
    timestamp: number;
    deviceFingerprint: string;
  } | null>(null);

  const AUTH_CACHE_DURATION = 60000; // 1 minute cache

  const refreshTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isRefreshingRef = useRef<boolean>(false);
  const fingerprintGeneratedRef = useRef<boolean>(false);
  const initialCheckDone = useRef<boolean>(false);

  // Helper: Check if route is public
  const isPublicRoute = useCallback((path: string) => {
    // Check exact matches
    if (PUBLIC_ROUTES.includes(path)) return true;

    // Check public prefixes
    if (PUBLIC_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix))) {
      return true;
    }

    return false;
  }, []);

  // Helper: Check if route requires authentication
  const isProtectedRoute = useCallback(
    (path: string) => {
      // ✅ First check if it's a public route (courses should not be protected)
      if (isPublicRoute(path)) {
        return false;
      }

      // Then check if it matches protected prefixes
      return PROTECTED_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix));
    },
    [isPublicRoute]
  );

  // Generate advanced device fingerprint
  const generateDeviceFingerprint = useCallback(async (): Promise<string> => {
    if (fingerprintGeneratedRef.current && deviceFingerprint) {
      return deviceFingerprint;
    }

    try {
      // Canvas fingerprinting
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      let canvasFingerprint = "";

      if (ctx) {
        canvas.width = 200;
        canvas.height = 50;
        ctx.textBaseline = "top";
        ctx.font = "14px Arial";
        ctx.fillStyle = "rgba(255,0,0,0.5)";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        ctx.fillText("Clipify Elite Security 🔐", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText("Device fingerprint", 4, 35);
        canvasFingerprint = canvas.toDataURL();
      }

      // WebGL fingerprinting
      const webglFingerprint = getWebGLFingerprint();

      // Audio fingerprinting
      const audioFingerprint = await getAudioFingerprint();

      // Font detection
      const fontFingerprint = getFontFingerprint();

      // Screen and hardware info
      const screenFingerprint = `${screen.width}x${screen.height}x${screen.colorDepth}`;
      const availScreenFingerprint = `${screen.availWidth}x${screen.availHeight}`;

      // Browser and system info
      const deviceInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages?.join(",") || "",
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack || "unspecified",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        screen: screenFingerprint,
        availScreen: availScreenFingerprint,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
        hardwareConcurrency: navigator.hardwareConcurrency || 0,
        deviceMemory: (navigator as any).deviceMemory || 0,
        maxTouchPoints: navigator.maxTouchPoints || 0,
        canvas: CryptoJS.SHA256(canvasFingerprint).toString().substring(0, 32),
        webgl: webglFingerprint,
        audio: audioFingerprint,
        fonts: fontFingerprint,
        plugins: getPluginFingerprint(),
        connection: getConnectionInfo(),
        localStorage: !!window.localStorage,
        sessionStorage: !!window.sessionStorage,
        indexedDB: !!window.indexedDB,
        webWorker: !!window.Worker,
        webRTC: hasWebRTC(),
        battery: await getBatteryInfo(),
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        touchSupport: getTouchSupport(),
        ad_blocker: await detectAdBlocker(),
      };

      const fingerprint = CryptoJS.SHA256(
        JSON.stringify(deviceInfo)
      ).toString();
      setDeviceFingerprint(fingerprint);
      fingerprintGeneratedRef.current = true;

      console.log(
        "🔒 Device fingerprint generated:",
        fingerprint.substring(0, 16) + "..."
      );
      return fingerprint;
    } catch (error) {
      console.error("Error generating device fingerprint:", error);
      const fallbackFingerprint = CryptoJS.SHA256(
        navigator.userAgent + Date.now().toString()
      ).toString();
      setDeviceFingerprint(fallbackFingerprint);
      return fallbackFingerprint;
    }
  }, [deviceFingerprint]);

  // Fingerprinting helper functions
  const getWebGLFingerprint = (): string => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") ||
        (canvas.getContext(
          "experimental-webgl"
        ) as WebGLRenderingContext | null);
      if (!gl) return "";

      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      const vendor = debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
        : "";
      const renderer = debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : "";

      return vendor + "|" + renderer;
    } catch (e) {
      return "";
    }
  };

  const getAudioFingerprint = async (): Promise<string> => {
    return new Promise((resolve) => {
      try {
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const analyser = audioContext.createAnalyser();
        const gainNode = audioContext.createGain();
        const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

        oscillator.type = "triangle";
        oscillator.frequency.value = 10000;
        gainNode.gain.value = 0.05;

        oscillator.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start(0);

        scriptProcessor.onaudioprocess = (event) => {
          const buffer = event.inputBuffer.getChannelData(0);
          const sum = buffer.reduce((a, b) => a + Math.abs(b), 0);
          oscillator.stop();
          audioContext.close();
          resolve(sum.toString());
        };

        setTimeout(() => resolve("timeout"), 1000);
      } catch (e) {
        resolve("error");
      }
    });
  };

  const getFontFingerprint = (): string => {
    const testFonts = [
      "Arial",
      "Arial Black",
      "Arial Narrow",
      "Calibri",
      "Cambria",
      "Comic Sans MS",
      "Courier",
      "Courier New",
      "Georgia",
      "Helvetica",
      "Impact",
      "Lucida Console",
      "Lucida Sans Unicode",
      "Microsoft Sans Serif",
      "Palatino",
      "Tahoma",
      "Times",
      "Times New Roman",
      "Trebuchet MS",
      "Verdana",
    ];

    const testString = "mmmmmmmmmmlli";
    const testSize = "72px";
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) return "";

    context.textBaseline = "top";
    context.font = `${testSize} monospace`;
    const defaultWidth = context.measureText(testString).width;

    return testFonts
      .filter((font) => {
        context.font = `${testSize} ${font}, monospace`;
        return context.measureText(testString).width !== defaultWidth;
      })
      .join(",");
  };

  const getPluginFingerprint = (): string => {
    return Array.from(navigator.plugins)
      .map((plugin) => plugin.name)
      .join(",");
  };

  const getConnectionInfo = (): string => {
    const conn =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;
    if (!conn) return "";
    return `${conn.effectiveType || ""}-${conn.downlink || ""}-${
      conn.rtt || ""
    }`;
  };

  const hasWebRTC = (): boolean => {
    return !!(
      window.RTCPeerConnection ||
      (window as any).webkitRTCPeerConnection ||
      (window as any).mozRTCPeerConnection
    );
  };

  const getBatteryInfo = async (): Promise<string> => {
    try {
      const battery = await (navigator as any).getBattery?.();
      return battery ? `${battery.level}-${battery.charging}` : "";
    } catch (e) {
      return "";
    }
  };

  const getTouchSupport = (): string => {
    return `${navigator.maxTouchPoints}-${!!window.TouchEvent}-${
      "ontouchstart" in window
    }`;
  };

  const detectAdBlocker = async (): Promise<boolean> => {
    try {
      const testAd = document.createElement("div");
      testAd.innerHTML = "&nbsp;";
      testAd.className = "adsbox";
      testAd.style.position = "absolute";
      testAd.style.left = "-10000px";
      document.body.appendChild(testAd);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const isBlocked = testAd.offsetHeight === 0;
      document.body.removeChild(testAd);
      return isBlocked;
    } catch (e) {
      return false;
    }
  };

  // Get device info helper
  const getDeviceInfo = (): DeviceInfo => {
    let result: any = {};

    try {
      if (typeof window !== "undefined" && (window as any).UAParser) {
        const UAParser = (window as any).UAParser;
        const parser = new UAParser();
        result = parser.getResult();
      }
    } catch (error) {
      console.error("UAParser error:", error);
    }

    return {
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: `${screen.width}x${screen.height}`,
      deviceType: result.device?.type || "desktop",
      deviceName: `${result.browser?.name || "Unknown"} on ${
        result.os?.name || "Unknown"
      }`,
      browser: result.browser?.name || "Unknown",
      browserVersion: result.browser?.version || "Unknown",
      os: result.os?.name || "Unknown",
      osVersion: result.os?.version || "Unknown",
    };
  };

  // Auto-refresh token setup
  const setupTokenRefresh = (expiresIn: number) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    const refreshTime = Math.max((expiresIn - 5 * 60) * 1000, 60000);
    refreshTimeoutRef.current = setTimeout(() => {
      if (!isRefreshingRef.current) {
        refreshToken();
      }
    }, refreshTime);
  };

  // API request helper
  const apiRequest = async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const defaultOptions: RequestInit = {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      },
    };

    let response = await fetch(url, defaultOptions);

    const currentPath = pathname || "/";
    const shouldAttemptRefresh =
      isProtectedRoute(currentPath) &&
      response.status === 401 &&
      !(defaultOptions.headers as Record<string, string>)[
        "X-Skip-Auth-Refresh"
      ] &&
      !isRefreshingRef.current;

    if (shouldAttemptRefresh) {
      try {
        await refreshToken();

        response = await fetch(url, {
          ...defaultOptions,
          headers: {
            ...defaultOptions.headers,
            "X-Skip-Auth-Refresh": "true",
          },
        });
      } catch (refreshError) {
        console.error("Token refresh failed during API request:", refreshError);
      }
    }

    return response;
  };

  // Refresh token
  const refreshToken = async () => {
    if (isRefreshingRef.current) return;

    const currentPath = pathname || "/";
    isRefreshingRef.current = true;

    try {
      console.log("[Auth] Refreshing token...");

      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Skip-Auth-Refresh": "true",
        },
        credentials: "include",
        body: JSON.stringify({
          deviceFingerprint: deviceFingerprint,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("[Auth] Token refresh failed:", data.error);
        throw new Error(data.error || "Token refresh failed");
      }

      // ✅ Update user data after successful refresh
      if (data.user) {
        setUser(data.user);
        setDeviceTrusted(data.deviceTrusted || false);
      }

      if (data.expiresIn) {
        setupTokenRefresh(data.expiresIn);
      }

      console.log("[Auth] ✅ Token refreshed successfully");
    } catch (error) {
      console.error("[Auth] ❌ Token refresh failed:", error);

      // Only logout if on protected route
      if (isProtectedRoute(currentPath)) {
        console.log(
          "[Auth] Logging out due to failed refresh on protected route"
        );
        await logout();
      } else {
        console.log(
          "[Auth] Ignoring refresh failure on public route:",
          currentPath
        );
      }
    } finally {
      isRefreshingRef.current = false;
    }
  };

  // Auth methods
  const login = async (
    email: string,
    password: string,
    rememberMe: boolean = false,
    trustThisDevice: boolean = false,
    redirectUrl: string = "/users"
  ): Promise<AuthResponse> => {
    setIsLoading(true);

    try {
      const fingerprint = await generateDeviceFingerprint();
      const deviceInfo = getDeviceInfo();

      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          rememberMe,
          trustThisDevice,
          deviceFingerprint: fingerprint,
          deviceInfo,
          redirectUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.requiresTwoFactor) {
        return {
          ...data,
          redirectPath: redirectUrl,
          user: data.user || ({ email } as User),
        };
      }

      setUser(data.user);
      
      // ✅ ADD: Emit auth change event
      emitAuthChange(data.user);
      
      setDeviceTrusted(data.deviceTrusted || false);
      setSuspiciousActivity(data.suspiciousActivity || false);

      // Update cache
      authCacheRef.current = {
        user: data.user,
        timestamp: Date.now(),
        deviceFingerprint: fingerprint,
      };

      // Update navbar cache
      sessionStorage.setItem('navbar_user_cache', JSON.stringify({
        user: {
          id: data.user.id,
          email: data.user.email,
          username: data.user.username,
          name: data.user.name,
          img: data.user.img,
        },
        timestamp: Date.now(),
      }));

      if (data.expiresIn) {
        setupTokenRefresh(data.expiresIn);
      }

      fetchSessions();
      fetchSecurityEvents();

      return {
        ...data,
        redirectPath: redirectUrl,
      };
    } catch (error) {
      console.error("❌ Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  const logout = async (sessionId?: string) => {
    try {
      console.log("[Auth] Logging out...");
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Skip-Auth-Refresh": "true",
        },
        credentials: "include",
        body: JSON.stringify({ sessionId }),
      });
    } catch (error) {
      console.error("[Auth] Logout error:", error);
    } finally {
      clearAllData();

      const currentPath = pathname || "/";
      if (currentPath !== "/auth/signin") {
        router.push("/auth/signin");
      }
    }
  };

  const logoutAllSessions = async () => {
    try {
      await apiRequest("/api/auth/logout-all", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout all sessions error:", error);
    } finally {
      clearAllData();
      router.push("/auth/signin");
    }
  };

  // 2FA methods
  const verifyTwoFactor = async (
    code: string,
    sessionId: string,
    method: string = "2fa",
    trustThisDevice: boolean = false
  ): Promise<AuthResponse> => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          code,
          sessionId,
          method,
          trustThisDevice,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid verification code");
      }

      console.log("2FA verification successful:", data);
      setUser(data.user);
      
      // ✅ ADD: Emit auth change event
      emitAuthChange(data.user);
      
      setDeviceTrusted(data.deviceTrusted || trustThisDevice);
      setSuspiciousActivity(data.suspiciousActivity || false);

      if (data.expiresIn) {
        setupTokenRefresh(data.expiresIn);
      }

      fetchSessions();
      fetchSecurityEvents();

      console.log("✅ 2FA verification successful");

      return {
        ...data,
        redirectPath: data.redirectPath || "/users",
      };
    } catch (error) {
      console.error("❌ 2FA verification failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const setupTwoFactor = async () => {
    try {
      const response = await apiRequest("/api/auth/2fa/setup", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to setup 2FA");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to setup 2FA:", error);
      throw error;
    }
  };

  const finalizeTwoFactorSetup = async (
    code: string,
    tempSecretId: string,
    password: string
  ) => {
    try {
      const response = await apiRequest("/api/auth/2fa/setup", {
        method: "PUT",
        body: JSON.stringify({
          code,
          tempSecretId,
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to verify 2FA setup");
      }

      const data = await response.json();

      setUser((prev) => (prev ? { ...prev, twoFactorEnabled: true } : null));

      return data;
    } catch (error) {
      console.error("Failed to finalize 2FA setup:", error);
      throw error;
    }
  };

  const disableTwoFactor = async (password: string) => {
    try {
      const response = await apiRequest("/api/auth/2fa/disable", {
        method: "POST",
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to disable 2FA");
      }

      setUser((prev) => (prev ? { ...prev, twoFactorEnabled: false } : null));
    } catch (error) {
      console.error("Failed to disable 2FA:", error);
      throw error;
    }
  };

  const regenerateBackupCodes = async (password: string) => {
    try {
      const response = await apiRequest("/api/auth/2fa/backup-codes", {
        method: "POST",
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to regenerate backup codes");
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to regenerate backup codes:", error);
      throw error;
    }
  };

  const getBackupCodesStatus = async () => {
    try {
      const response = await apiRequest("/api/auth/2fa/backup-codes");

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch backup codes status");
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch backup codes status:", error);
      throw error;
    }
  };

  const resendTwoFactorCode = async (sessionId: string, method: string) => {
    try {
      const response = await apiRequest("/api/auth/2fa/resend", {
        method: "POST",
        body: JSON.stringify({ sessionId, method }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to resend verification code");
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to resend verification code:", error);
      throw error;
    }
  };

  // Passkey methods
  const setupPasskey = async (deviceName: string) => {
    try {
      const optionsResponse = await apiRequest("/api/auth/passkey/register", {
        method: "GET",
      });

      if (!optionsResponse.ok) {
        throw new Error("Failed to get registration options");
      }

      const options = await optionsResponse.json();
      const startRegistration = (await import("@simplewebauthn/browser"))
        .startRegistration as any;
      const registrationResponse = await startRegistration(options);

      const verifyResponse = await apiRequest("/api/auth/passkey/register", {
        method: "POST",
        body: JSON.stringify({
          response: registrationResponse,
          deviceName,
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error("Failed to register passkey");
      }

      setUser((prev) => (prev ? { ...prev, biometricEnabled: true } : null));
    } catch (error) {
      console.error("Failed to setup passkey:", error);
      throw error;
    }
  };

  const listPasskeys = async () => {
    try {
      const response = await apiRequest("/api/auth/passkey/list");

      if (!response.ok) {
        throw new Error("Failed to list passkeys");
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to list passkeys:", error);
      throw error;
    }
  };

  const deletePasskey = async (passkeyId: string) => {
    try {
      const response = await apiRequest(`/api/auth/passkey/${passkeyId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete passkey");
      }
    } catch (error) {
      console.error("Failed to delete passkey:", error);
      throw error;
    }
  };

  // Device management
  const listDevices = async () => {
    try {
      const response = await apiRequest("/api/auth/devices");

      if (!response.ok) {
        throw new Error("Failed to list devices");
      }

      const data = await response.json();
      return data.devices || [];
    } catch (error) {
      console.error("Failed to list devices:", error);
      throw error;
    }
  };

  const trustDevice = async (deviceId: string) => {
    try {
      const response = await apiRequest("/api/auth/devices", {
        method: "POST",
        body: JSON.stringify({ deviceId }),
      });

      if (!response.ok) {
        throw new Error("Failed to trust device");
      }

      setDeviceTrusted(true);
    } catch (error) {
      console.error("Failed to trust device:", error);
      throw error;
    }
  };

  const untrustDevice = async (deviceId: string) => {
    try {
      const response = await apiRequest(
        `/api/auth/devices?deviceId=${deviceId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to untrust device");
      }

      setDeviceTrusted(false);
    } catch (error) {
      console.error("Failed to untrust device:", error);
      throw error;
    }
  };

  const revokeDevice = async (deviceId: string) => {
    try {
      const response = await apiRequest(
        `/api/auth/devices/${deviceId}/revoke`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to revoke device");
      }

      fetchSessions();
    } catch (error) {
      console.error("Failed to revoke device:", error);
      throw error;
    }
  };

  const generateQRLoginCode = async (): Promise<string> => {
    try {
      const response = await apiRequest("/api/auth/qr-login/generate", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to generate QR login code");
      }

      const data = await response.json();
      return data.qrCode;
    } catch (error) {
      console.error("Failed to generate QR login code:", error);
      throw error;
    }
  };

  const validateQRLogin = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/qr-login/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, deviceFingerprint }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
        setDeviceTrusted(data.deviceTrusted || false);
        setSuspiciousActivity(data.suspiciousActivity || false);

        if (data.expiresIn) {
          setupTokenRefresh(data.expiresIn);
        }

        fetchSessions();
        fetchSecurityEvents();

        return true;
      }

      return false;
    } catch (error) {
      console.error("QR login validation failed:", error);
      return false;
    }
  };

  // Recovery methods
  const initiateRecovery = async (email: string): Promise<RecoveryOptions> => {
    try {
      const response = await fetch("/api/auth/recovery/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed to initiate recovery");
      }

      const data = await response.json();
      setRecoveryOptions(data.options);
      return data.options;
    } catch (error) {
      console.error("Recovery initiation failed:", error);
      throw error;
    }
  };

  const sendEmailRecoveryCode = async (email: string) => {
    try {
      const response = await fetch("/api/auth/recovery/send-email-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send email recovery code");
      }
    } catch (error) {
      console.error("Failed to send email recovery code:", error);
      throw error;
    }
  };

  const sendPhoneRecoveryCode = async (phone: string) => {
    try {
      const response = await fetch("/api/auth/recovery/send-phone-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send phone recovery code");
      }
    } catch (error) {
      console.error("Failed to send phone recovery code:", error);
      throw error;
    }
  };

  const verifyEmailRecoveryCode = async (
    email: string,
    code: string
  ): Promise<{ token: string }> => {
    try {
      const response = await fetch("/api/auth/recovery/verify-email-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Invalid email recovery code");
      }

      return await response.json();
    } catch (error) {
      console.error("Email recovery code verification failed:", error);
      throw error;
    }
  };

  const verifyPhoneRecoveryCode = async (
    phone: string,
    code: string
  ): Promise<{ token: string }> => {
    try {
      const response = await fetch("/api/auth/recovery/verify-phone-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Invalid phone recovery code");
      }

      return await response.json();
    } catch (error) {
      console.error("Phone recovery code verification failed:", error);
      throw error;
    }
  };

  const resetPasswordWithToken = async (token: string, newPassword: string) => {
    try {
      const response = await fetch("/api/auth/recovery/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reset password");
      }
    } catch (error) {
      console.error("Password reset failed:", error);
      throw error;
    }
  };

  // Profile methods
  const updateUser = async (userData: Partial<User>) => {
    try {
      const response = await apiRequest("/api/user/profile", {
        method: "PUT",
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser((prev) => (prev ? { ...prev, ...updatedUser.user } : null));
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error("Failed to update user:", error);
      throw error;
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    try {
      const response = await apiRequest("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Failed to change password:", error);
      throw error;
    }
  };

  // Session and security management
  const fetchSessions = async () => {
    try {
      const response = await apiRequest("/api/auth/sessions");
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    }
  };

  const fetchSecurityEvents = async () => {
    try {
      const response = await apiRequest("/api/auth/security-events");
      if (response.ok) {
        const data = await response.json();
        setSecurityEvents(data.events || []);
      }
    } catch (error) {
      console.error("Failed to fetch security events:", error);
    }
  };

  const resolveSecurityEvent = async (eventId: string) => {
    try {
      const response = await apiRequest(
        `/api/auth/security-events/${eventId}/resolve`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        setSecurityEvents((prev) =>
          prev.map((event) =>
            event.id === eventId ? { ...event, resolved: true } : event
          )
        );
      }
    } catch (error) {
      console.error("Failed to resolve security event:", error);
      throw error;
    }
  };

  // ✅ Update checkAuthStatus to Respect Initial State
  const checkAuthStatus = async (forceRefresh = false) => {
    try {
      const currentPath = pathname || "/";
      
      console.log('[Auth] checkAuthStatus called for path:', currentPath);

      const isPublic = isPublicRoute(currentPath);
      const isPublicCourses = isPublicCoursesRoute(currentPath);
      const shouldCheckAuthOnPublic = PUBLIC_ROUTES_WITH_AUTH_CHECK.some(prefix => 
        currentPath.startsWith(prefix)
      );

      // ✅ For public courses, ONLY update states if not already set
      if (isPublicCourses) {
        console.log("[Auth] Public courses route - ensuring states are set");
        setAuthChecked(true);
        setIsLoading(false);
        // ✅ Continue checking auth in background without blocking
      }

      // ✅ For other public routes
      if (isPublic && !shouldCheckAuthOnPublic && !isPublicCourses && !forceRefresh) {
        console.log("[Auth] Other public route, setting authChecked=true");
        setAuthChecked(true);
        setIsLoading(false);
        setUser(null);
        return;
      }

      // ✅ Check cache
      if (!forceRefresh && authCacheRef.current) {
        const cacheAge = Date.now() - authCacheRef.current.timestamp;
        const fingerprintMatch = authCacheRef.current.deviceFingerprint === deviceFingerprint;
        
        if (cacheAge < AUTH_CACHE_DURATION && fingerprintMatch) {
          console.log('[Auth] Using cached auth state');
          setUser(authCacheRef.current.user);
          setAuthChecked(true);
          setIsLoading(false);
          return;
        }
      }

      // ✅ Check for social auth flow
      const urlParams = new URLSearchParams(window.location.search);
      const hasSocialToken = urlParams.has("social_token");
      const hasProvider = urlParams.has("provider");

      if (
        (currentPath === "/auth/signup" ||
          currentPath === "/auth/2fa-verify") &&
        hasSocialToken &&
        hasProvider &&
        !forceRefresh
      ) {
        console.log("[Auth] Social auth flow in progress, skipping auth check");
        setAuthChecked(true);
        setIsLoading(false);
        return;
      }

      console.log("[Auth] Fetching auth status from API...");

      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
          "X-Skip-Auth-Refresh": "true",
        },
      });

      if (response.ok) {
        const userData = await response.json();

        if (userData.user) {
          console.log('[Auth] ✅ User authenticated:', userData.user.email);
          setUser(userData.user);
          emitAuthChange(userData.user);
          
          setDeviceTrusted(userData.deviceTrusted || false);
          setSuspiciousActivity(userData.suspiciousActivity || false);

          // Update cache
          authCacheRef.current = {
            user: userData.user,
            timestamp: Date.now(),
            deviceFingerprint: deviceFingerprint,
          };

          // Update navbar cache
          sessionStorage.setItem('navbar_user_cache', JSON.stringify({
            user: {
              id: userData.user.id,
              email: userData.user.email,
              username: userData.user.username,
              name: userData.user.name,
              img: userData.user.img,
            },
            timestamp: Date.now(),
          }));

          if (userData.expiresIn) {
            setupTokenRefresh(userData.expiresIn);
          }

          if (
            (currentPath === "/auth/signin" || currentPath === "/auth/signup") &&
            !hasSocialToken &&
            !isPublicCourses
          ) {
            console.log("[Auth] Already authenticated, redirecting to /users");
            router.push("/users");
          }

          fetchSessions();
          fetchSecurityEvents();
        }
      } else if (response.status === 401) {
        console.log('[Auth] Not authenticated');
        setUser(null);
        emitAuthChange(null);
        authCacheRef.current = null;
        sessionStorage.removeItem('navbar_user_cache');

        if (isProtectedRoute(currentPath) && !isPublicCourses) {
          console.log("[Auth] Protected route requires auth, redirecting to signin");
          router.push("/auth/signin?redirect=" + encodeURIComponent(currentPath));
        }
      }
    } catch (error) {
      console.error("[Auth] Check failed:", error);
      setUser(null);
      emitAuthChange(null);
      authCacheRef.current = null;
      sessionStorage.removeItem('navbar_user_cache');
    } finally {
      setIsLoading(false);
      setAuthChecked(true);
      initialCheckDone.current = true;
    }
  };

  const clearAllData = () => {
    setUser(null);
    emitAuthChange(null); // ✅ ADD
    setSessions([]);
    setSecurityEvents([]);
    setDeviceTrusted(false);
    setSuspiciousActivity(false);
    setRecoveryOptions(null);
    authCacheRef.current = null;

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
  };

  // Initialize auth
  useEffect(() => {
    const initAuth = async () => {
      console.log("[Auth] Initializing for route:", pathname);
      await generateDeviceFingerprint();

      const currentPath = pathname || "/";
      const isPublic = isPublicRoute(currentPath);
      const isCourses = isPublicCoursesRoute(currentPath);

      if (isPublic) {
        console.log("[Auth] Public route, setting states immediately");
        setAuthChecked(true);
        setIsLoading(false);
        setUser(null);
        if (isCourses) {
          // Background check for courses
          checkAuthStatus(false).catch(console.error);
        }
      } else {
        console.log("[Auth] Protected route, setting loading state and checking");
        setIsLoading(true);
        setAuthChecked(false);
        await checkAuthStatus(false);
      }
    };

    initAuth();
  }, [pathname]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Debug auth state changes
  useEffect(() => {
    console.log("🔄 Auth state:", {
      isAuthenticated: !!user,
      isLoading,
      hasUser: !!user,
      timestamp: new Date().toISOString(),
    });
  }, [user, isLoading]);

  // Add this effect to force re-render when user changes
  useEffect(() => {
    console.log('[AuthProvider] User state changed:', {
      hasUser: !!user,
      email: user?.email,
      timestamp: Date.now()
    });
    
    // Force component re-render (using a no-op update on an existing state to trigger re-render)
    // Note: Since there's no 'currentStep' state, we're using a no-op on isLoading or similar; context consumers will re-render naturally on user change
  }, [user]);

  // Add this effect near the end of the AuthProvider component:
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).refreshAuthState = async () => {
        console.log('[AuthContext] 🔄 Manual auth state refresh triggered');
        await checkAuthStatus(true);
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).refreshAuthState;
      }
    };
  }, [checkAuthStatus]);

  const isAuthenticated = !!user;

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    authChecked, // ✅ Add this
    sessions,
    securityEvents,
    deviceFingerprint,
    deviceTrusted,
    suspiciousActivity,
    recoveryOptions,
    login,
    logout,
    logoutAllSessions,
    refreshToken,
    verifyTwoFactor,
    setupTwoFactor,
    finalizeTwoFactorSetup,
    disableTwoFactor,
    regenerateBackupCodes,
    getBackupCodesStatus,
    resendTwoFactorCode,
    setupPasskey,
    listPasskeys,
    deletePasskey,
    listDevices,
    trustDevice,
    untrustDevice,
    revokeDevice,
    generateQRLoginCode,
    validateQRLogin,
    initiateRecovery,
    sendEmailRecoveryCode,
    sendPhoneRecoveryCode,
    verifyEmailRecoveryCode,
    verifyPhoneRecoveryCode,
    resetPasswordWithToken,
    updateUser,
    changePassword,
    fetchSessions,
    fetchSecurityEvents,
    resolveSecurityEvent,
    checkAuthStatus,
    clearAllData,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;