//Volumes/vision/codes/course/my-app/src/components/settings/Privacy/PasswordSection.tsx
"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  FaLock,
  FaEye,
  FaEyeSlash,
  FaInfoCircle,
  FaKey,
  FaCheck,
  FaTimesCircle,
  FaSpinner,
} from "react-icons/fa";
import axios from "axios";
import debounce from "lodash/debounce";

const secureAxios = axios.create({
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  }
});

interface PasswordSectionProps {
  user: any;
  hasPasswordSet: boolean;
  setHasPasswordSet: (value: boolean) => void;
  isCheckingPasswordStatus: boolean;
  setSuccess: (message: string | null) => void;
  setError: (message: string | null) => void;
  fetchSecurityEvents: (options?: any) => Promise<void>;
  fetchActivityLogs: (options?: any) => Promise<void>;
  calculateSecurityScore: (userData: any) => void;
}

const PasswordSection: React.FC<PasswordSectionProps> = ({
  user,
  hasPasswordSet,
  setHasPasswordSet,
  isCheckingPasswordStatus,
  setSuccess,
  setError,
  fetchSecurityEvents,
  fetchActivityLogs,
  calculateSecurityScore,
}) => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isSettingInitialPassword, setIsSettingInitialPassword] = useState(false);
  const [hasSocialLogin, setHasSocialLogin] = useState(false);
  const [passwordUpdateLoading, setPasswordUpdateLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const cacheRef = useRef(new Map());

  useEffect(() => {
    if (user) {
      const hasSocialAccounts = user.socialAccountsEver?.length > 0;
      setHasSocialLogin(hasSocialAccounts);
    }
  }, [user]);

  // Non-debounced version for immediate calculation
  const calculatePasswordStrength = useCallback((password: string) => {
    if (!password) return 0;

    let score = 0;

    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    const uniqueChars = new Set(password).size;
    const uniqueRatio = uniqueChars / password.length;

    if (/^[a-zA-Z]+$/.test(password)) score -= 1;
    if (/^[0-9]+$/.test(password)) score -= 2;
    if (/(.)\1{2,}/.test(password)) score -= 1;
    if (/(?:abc|123|qwerty|password|admin)/i.test(password)) score -= 2;
    if (uniqueRatio > 0.7) score += 1;

    return Math.max(0, Math.min(4, Math.floor(score / 2)));
  }, []);

  // Debounced version for UI updates only
  const debouncedSetPasswordStrength = useCallback(
    debounce((password: string) => {
      const strength = calculatePasswordStrength(password);
      setPasswordStrength(strength);
    }, 300),
    [calculatePasswordStrength]
  );

  useEffect(() => {
    if (passwordData.newPassword) {
      debouncedSetPasswordStrength(passwordData.newPassword);
    } else {
      setPasswordStrength(0);
    }
  }, [passwordData.newPassword, debouncedSetPasswordStrength]);

  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  const getPasswordStrengthLabel = useMemo(() => {
    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    return (strength: number) => labels[strength] || "Unknown";
  }, []);

  const getPasswordStrengthColor = useMemo(() => {
    const colors = [
      "bg-red-600",
      "bg-red-500",
      "bg-yellow-500",
      "bg-green-500",
      "bg-green-400",
    ];
    return (strength: number) => colors[strength] || "bg-gray-500";
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (abortController) {
      abortController.abort();
    }

    const controller = new AbortController();
    setAbortController(controller);
    setPasswordUpdateLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Calculate strength in real-time (non-debounced) for validation
      const currentStrength = calculatePasswordStrength(passwordData.newPassword);

      if (isSettingInitialPassword) {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          setError("New passwords do not match");
          setPasswordUpdateLoading(false);
          return;
        }

        if (currentStrength < 2) {
          setError("Please choose a stronger password (at least Fair strength required)");
          setPasswordUpdateLoading(false);
          return;
        }

        const cacheKey = `password:set:${user.id}`;
        let response;
        if (cacheRef.current.has(cacheKey)) {
          response = cacheRef.current.get(cacheKey);
        } else {
          response = await secureAxios.post("/api/user/password/set", {
            password: passwordData.newPassword,
          }, {
            signal: controller.signal,
            headers: {
              'X-Request-ID': `password-set-${Date.now()}`
            }
          });
          cacheRef.current.set(cacheKey, response);
          setTimeout(() => cacheRef.current.delete(cacheKey), 60 * 1000);
        }

        setSuccess(response.data.message || "Password set successfully");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setHasPasswordSet(true);
        setIsSettingInitialPassword(false);

        const updateResponse = await secureAxios.post("/api/user/password/security", {}, {
          signal: controller.signal,
          headers: {
            'X-Request-ID': `security-update-${Date.now()}`
          }
        });

        setSuccess(updateResponse.data.message || "Security data updated");
        calculateSecurityScore({ ...user, password: true });
      } else {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          setError("New passwords do not match");
          setPasswordUpdateLoading(false);
          return;
        }

        if (currentStrength < 2) {
          setError("Please choose a stronger password (at least Fair strength required)");
          setPasswordUpdateLoading(false);
          return;
        }

        if (!passwordData.currentPassword) {
          setError("Current password is required");
          setPasswordUpdateLoading(false);
          return;
        }

        const cacheKey = `password:change:${user.id}`;
        let response;
        if (cacheRef.current.has(cacheKey)) {
          response = cacheRef.current.get(cacheKey);
        } else {
          response = await secureAxios.post("/api/user/password/change", {
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          }, {
            signal: controller.signal,
            headers: {
              'X-Request-ID': `password-change-${Date.now()}`
            }
          });
          cacheRef.current.set(cacheKey, response);
          setTimeout(() => cacheRef.current.delete(cacheKey), 60 * 1000);
        }

        setSuccess("Password changed successfully");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        const updateResponse = await secureAxios.post("/api/user/password/security", {}, {
          signal: controller.signal,
          headers: {
            'X-Request-ID': `security-update-${Date.now()}`
          }
        });

        setSuccess(updateResponse.data.message || "Security data updated");
        calculateSecurityScore({ ...user, password: true });
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        console.log('Request was cancelled');
        return;
      }

      console.error("Password update error:", error);

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        setError("Request timed out. Please try again.");
      } else if (error.response) {
        if (error.response.status === 401) {
          setError("Current password is incorrect");
        } else if (error.response.status === 429) {
          setError("Too many attempts. Please try again later");
        } else {
          setError(error.response?.data?.message || error.response?.data?.error || "Failed to update password");
        }

        if (error.response.status === 400 && 
            error.response?.data?.message?.includes("already has a password")) {
          setHasPasswordSet(true);
          setIsSettingInitialPassword(false);
        }
      } else {
        setError("Network error. Please check your connection and try again.");
      }
    } finally {
      setPasswordUpdateLoading(false);
      setAbortController(null);
    }
  };

  // Calculate strength in real-time for form validation
  const currentPasswordStrength = useMemo(() => {
    return calculatePasswordStrength(passwordData.newPassword);
  }, [passwordData.newPassword, calculatePasswordStrength]);

  const formIsValid = useMemo(() => {
    if (passwordUpdateLoading) return false;
    
    if (passwordData.newPassword !== passwordData.confirmPassword) return false;
    
    // Use real-time calculated strength instead of debounced state
    if (currentPasswordStrength < 2) return false;
    
    if (hasPasswordSet && !isSettingInitialPassword && !passwordData.currentPassword) return false;
    
    return true;
  }, [
    passwordUpdateLoading, 
    passwordData.newPassword, 
    passwordData.confirmPassword,
    passwordData.currentPassword,
    currentPasswordStrength,
    hasPasswordSet, 
    isSettingInitialPassword
  ]);

  return (
    <motion.div
      key="password"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h4 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4">
        {isCheckingPasswordStatus ? (
          <div className="flex items-center">
            <FaSpinner className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 text-red-400" />
            <span className="text-sm sm:text-base">Checking password status...</span>
          </div>
        ) : hasPasswordSet ? (
          "Change Password"
        ) : (
          "Set Account Password"
        )}
      </h4>
      
      {!isCheckingPasswordStatus && (
        <>
          {!hasPasswordSet && !isSettingInitialPassword && (
            <div className="bg-blue-900/30 border border-blue-500/30 text-blue-300 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6">
              <div className="flex items-start">
                <FaInfoCircle className="mt-1 mr-2 sm:mr-3 flex-shrink-0 text-sm sm:text-base" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm sm:text-base">
                    You logged in via a social account
                  </p>
                  <p className="text-xs sm:text-sm mt-1">
                    Setting a password will allow you to log in directly with your email and password in addition to social login.
                  </p>
                  <ul className="text-xs sm:text-sm mt-2 space-y-1 list-disc list-inside ml-2">
                    <li>Adds an extra layer of security to your account</li>
                    <li>Required for certain security features like 2FA</li>
                    <li>Allows account recovery if you lose access to your social account</li>
                  </ul>
                </div>
              </div>
              <motion.button
                type="button"
                onClick={() => setIsSettingInitialPassword(true)}
                className="mt-3 sm:mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 sm:py-2.5 px-4 rounded-lg transition-colors text-sm sm:text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaKey className="inline-block mr-2" /> Set Password
              </motion.button>
            </div>
          )}
        </>
      )}

      {(hasPasswordSet || isSettingInitialPassword) && (
        <div className="space-y-4 sm:space-y-6">
          {hasPasswordSet && !isSettingInitialPassword && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full rounded-xl bg-gray-800/50 border border-gray-700/40 text-white py-2.5 sm:py-3 px-3 sm:px-4 pr-10 sm:pr-12 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/60 transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-gray-300"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <FaEyeSlash className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <FaEye className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
              {isSettingInitialPassword ? "New Password" : "New Password"}
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="w-full rounded-xl bg-gray-800/50 border border-gray-700/40 text-white py-2.5 sm:py-3 px-3 sm:px-4 pr-10 sm:pr-12 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/60 transition-all"
                autoComplete="new-password"
              />
              <button
                type="button"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-gray-300"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <FaEyeSlash className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <FaEye className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
            </div>

            {passwordData.newPassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-2 sm:mt-3 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    Password Strength:
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      passwordStrength <= 1
                        ? "text-red-400"
                        : passwordStrength === 2
                          ? "text-yellow-400"
                          : "text-green-400"
                    }`}
                  >
                    {getPasswordStrengthLabel(passwordStrength)}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getPasswordStrengthColor(passwordStrength)} transition-all duration-300`}
                    style={{
                      width: `${(passwordStrength / 4) * 100}%`,
                    }}
                  />
                </div>

                <div className="text-xs text-gray-400 mt-2">
                  <p className="mb-1">Password should contain:</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    <li className={`flex items-center ${/[A-Z]/.test(passwordData.newPassword) ? "text-green-400" : ""}`}>
                      {/[A-Z]/.test(passwordData.newPassword) ? (
                        <FaCheck className="mr-1 text-xs" />
                      ) : (
                        <FaTimesCircle className="mr-1 text-xs" />
                      )}
                      Uppercase letters
                    </li>
                    <li className={`flex items-center ${/[a-z]/.test(passwordData.newPassword) ? "text-green-400" : ""}`}>
                      {/[a-z]/.test(passwordData.newPassword) ? (
                        <FaCheck className="mr-1 text-xs" />
                      ) : (
                        <FaTimesCircle className="mr-1 text-xs" />
                      )}
                      Lowercase letters
                    </li>
                    <li className={`flex items-center ${/[0-9]/.test(passwordData.newPassword) ? "text-green-400" : ""}`}>
                      {/[0-9]/.test(passwordData.newPassword) ? (
                        <FaCheck className="mr-1 text-xs" />
                      ) : (
                        <FaTimesCircle className="mr-1 text-xs" />
                      )}
                      Numbers
                    </li>
                    <li className={`flex items-center ${/[^A-Za-z0-9]/.test(passwordData.newPassword) ? "text-green-400" : ""}`}>
                      {/[^A-Za-z0-9]/.test(passwordData.newPassword) ? (
                        <FaCheck className="mr-1 text-xs" />
                      ) : (
                        <FaTimesCircle className="mr-1 text-xs" />
                      )}
                      Special characters
                    </li>
                    <li className={`flex items-center ${passwordData.newPassword.length >= 8 ? "text-green-400" : ""}`}>
                      {passwordData.newPassword.length >= 8 ? (
                        <FaCheck className="mr-1 text-xs" />
                      ) : (
                        <FaTimesCircle className="mr-1 text-xs" />
                      )}
                      At least 8 characters
                    </li>
                    <li className={`flex items-center ${passwordData.newPassword.length >= 12 ? "text-green-400" : ""}`}>
                      {passwordData.newPassword.length >= 12 ? (
                        <FaCheck className="mr-1 text-xs" />
                      ) : (
                        <FaTimesCircle className="mr-1 text-xs" />
                      )}
                      12+ (recommended)
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
              Confirm {isSettingInitialPassword ? "Password" : "New Password"}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className={`w-full rounded-xl bg-gray-800/50 border ${
                  passwordData.confirmPassword &&
                  passwordData.newPassword !== passwordData.confirmPassword
                    ? "border-red-500/50 focus:ring-red-500/50 focus:border-red-500/60"
                    : "border-gray-700/40 focus:ring-red-500/50 focus:border-red-500/60"
                } text-white py-2.5 sm:py-3 px-3 sm:px-4 pr-10 sm:pr-12 text-sm sm:text-base focus:outline-none focus:ring-2 transition-all`}
                autoComplete="new-password"
              />
              <button
                type="button"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-gray-300"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <FaEyeSlash className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <FaEye className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
            </div>

            {passwordData.confirmPassword &&
              passwordData.newPassword !== passwordData.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs sm:text-sm mt-2 flex items-center"
                >
                  <FaTimesCircle className="mr-1" />
                  Passwords do not match
                </motion.p>
              )}
          </div>

          <motion.button
            type="button"
            onClick={handlePasswordUpdate}
            disabled={!formIsValid}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-2.5 sm:py-3 rounded-xl hover:from-red-400 hover:to-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
            whileHover={{ scale: formIsValid ? 1.02 : 1 }}
            whileTap={{ scale: formIsValid ? 0.98 : 1 }}
            style={{
              boxShadow: formIsValid ? "0 10px 30px rgba(239, 68, 68, 0.3)" : "none",
            }}
          >
            {passwordUpdateLoading ? (
              <>
                <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" />
                <span>
                  {isSettingInitialPassword
                    ? "Setting Password..."
                    : "Changing Password..."}
                </span>
              </>
            ) : (
              <>
                <FaKey className="mr-2" />
                <span>
                  {isSettingInitialPassword ? "Set Password" : "Change Password"}
                </span>
              </>
            )}
          </motion.button>

          {isSettingInitialPassword && (
            <button
              type="button"
              onClick={() => {
                setIsSettingInitialPassword(false);
                setPasswordData({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                });
              }}
              className="w-full text-gray-400 hover:text-gray-300 text-xs sm:text-sm mt-2 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default PasswordSection;

