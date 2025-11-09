// app/(protected)/users/settings/security/page.tsx
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { 
  FaShieldAlt, FaLock, FaEye, FaEyeSlash, FaFingerprint, 
  FaMobile, FaDesktop, FaGlobe, FaSignOutAlt, FaCheckCircle, 
  FaExclamationTriangle, FaHistory, FaEnvelope
} from "react-icons/fa";

export default function SecuritySettings() {
  const { user, refreshUser, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("password");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);

  // Load user security data
  useEffect(() => {
    if (user) {
      setTwoFactorEnabled(user.twoFactorEnabled || false);
      fetchSessions();
      fetchSecurityEvents();
    }
  }, [user]);

  useEffect(() => {
    // Check password strength when new password changes
    if (passwordData.newPassword) {
      const strength = calculatePasswordStrength(passwordData.newPassword);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [passwordData.newPassword]);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      // Mock data - in a real app, fetch from API
      const mockSessions = [
        {
          id: "current-session",
          deviceName: "Current Device",
          browser: "Chrome",
          os: "Windows",
          location: "New York, USA",
          ipAddress: "192.168.1.1",
          lastUsed: new Date().toISOString(),
          current: true
        },
        {
          id: "old-session-1",
          deviceName: "iPhone 13",
          browser: "Safari",
          os: "iOS 15",
          location: "Los Angeles, USA",
          ipAddress: "192.168.1.2",
          lastUsed: new Date(Date.now() - 86400000).toISOString(),
          current: false
        }
      ];
      setSessions(mockSessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSecurityEvents = async () => {
    try {
      // Mock data - in a real app, fetch from API
      const mockEvents = [
        {
          id: "event-1",
          eventType: "login_success",
          severity: "low",
          description: "Successful login from New York, USA",
          ipAddress: "192.168.1.1",
          createdAt: new Date().toISOString()
        },
        {
          id: "event-2",
          eventType: "password_changed",
          severity: "low",
          description: "Password successfully changed",
          ipAddress: "192.168.1.1",
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: "event-3",
          eventType: "suspicious_login_attempt",
          severity: "high",
          description: "Failed login attempt from unknown location",
          ipAddress: "203.0.113.1",
          createdAt: new Date(Date.now() - 172800000).toISOString()
        }
      ];
      setSecurityEvents(mockEvents);
    } catch (error) {
      console.error("Error fetching security events:", error);
    }
  };

  const calculatePasswordStrength = (password: string): number => {
    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Complexity checks
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    // Variety check
    const uniqueChars = new Set(password).size;
    if (uniqueChars > 6) score += 1;
    
    // Normalize to 0-4 scale
    return Math.min(4, Math.floor(score / 2));
  };

  const getPasswordStrengthLabel = (strength: number): string => {
    switch (strength) {
      case 0: return "Very Weak";
      case 1: return "Weak";
      case 2: return "Fair";
      case 3: return "Good";
      case 4: return "Strong";
      default: return "Unknown";
    }
  };

  const getPasswordStrengthColor = (strength: number): string => {
    switch (strength) {
      case 0: return "bg-red-600";
      case 1: return "bg-red-500";
      case 2: return "bg-yellow-500";
      case 3: return "bg-green-500";
      case 4: return "bg-green-400";
      default: return "bg-gray-500";
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    
    if (passwordStrength < 2) {
      setError("Please choose a stronger password");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Mock API call - in real app, call your API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess("Password changed successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      
      // Add to security events
      const newEvent = {
        id: `event-${Date.now()}`,
        eventType: "password_changed",
        severity: "low",
        description: "Password successfully changed",
        ipAddress: "192.168.1.1",
        createdAt: new Date().toISOString()
      };
      
      setSecurityEvents(prev => [newEvent, ...prev]);
      
    } catch (error: any) {
      setError(error.message || "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableTwoFactor = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Mock API call - in real app, call your API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock QR code URL - in real app, get from API
      setQrCodeUrl("https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/Clipify:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Clipify");
      setShowQrCode(true);
      
    } catch (error: any) {
      setError(error.message || "Failed to setup two-factor authentication");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyTwoFactor = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit verification code");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Mock API call - in real app, call your API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setTwoFactorEnabled(true);
      setShowQrCode(false);
      setSuccess("Two-factor authentication enabled successfully");
      
      // Refresh user data
      refreshUser();
      
      // Add to security events
      const newEvent = {
        id: `event-${Date.now()}`,
        eventType: "2fa_enabled",
        severity: "low",
        description: "Two-factor authentication enabled",
        ipAddress: "192.168.1.1",
        createdAt: new Date().toISOString()
      };
      
      setSecurityEvents(prev => [newEvent, ...prev]);
      
    } catch (error: any) {
      setError(error.message || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!confirm("Are you sure you want to disable two-factor authentication? This will make your account less secure.")) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Mock API call - in real app, call your API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setTwoFactorEnabled(false);
      setSuccess("Two-factor authentication disabled");
      
      // Refresh user data
      refreshUser();
      
      // Add to security events
      const newEvent = {
        id: `event-${Date.now()}`,
        eventType: "2fa_disabled",
        severity: "medium",
        description: "Two-factor authentication disabled",
        ipAddress: "192.168.1.1",
        createdAt: new Date().toISOString()
      };
      
      setSecurityEvents(prev => [newEvent, ...prev]);
      
    } catch (error: any) {
      setError(error.message || "Failed to disable two-factor authentication");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to sign out from this device?")) {
      return;
    }
    
    try {
      // Mock API call - in real app, call your API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      setSuccess("Session revoked successfully");
      
      // Add to security events
      const newEvent = {
        id: `event-${Date.now()}`,
        eventType: "session_revoked",
        severity: "low",
        description: "Device session was revoked",
        ipAddress: "192.168.1.1",
        createdAt: new Date().toISOString()
      };
      
      setSecurityEvents(prev => [newEvent, ...prev]);
      
    } catch (error: any) {
      setError(error.message || "Failed to revoke session");
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm("Are you sure you want to sign out from all other devices? You will remain signed in on this device.")) {
      return;
    }
    
    try {
      // Mock API call - in real app, call your API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSessions(prev => prev.filter(session => session.current));
      setSuccess("All other sessions revoked successfully");
      
      // Add to security events
      const newEvent = {
        id: `event-${Date.now()}`,
        eventType: "all_sessions_revoked",
        severity: "medium",
        description: "All other device sessions were revoked",
        ipAddress: "192.168.1.1",
        createdAt: new Date().toISOString()
      };
      
      setSecurityEvents(prev => [newEvent, ...prev]);
      
    } catch (error: any) {
      setError(error.message || "Failed to revoke sessions");
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Security Settings</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage your account security, passwords, and active sessions.
          </p>
        </div>

        {/* Success/Error Messages */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-green-900/50 border border-green-500/30 rounded-lg text-green-400 flex items-center"
            >
              <FaCheckCircle className="mr-2 flex-shrink-0" />
              <div>{success}</div>
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-900/50 border border-red-500/30 rounded-lg text-red-400 flex items-center"
            >
              <FaExclamationTriangle className="mr-2 flex-shrink-0" />
              <div>{error}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security Stats Card */}
        <div className="bg-gray-800/50 p-6 rounded-xl border border-yellow-500/10 mb-8">
          <h2 className="text-lg font-medium text-white mb-4 flex items-center">
            <FaShieldAlt className="mr-2 text-yellow-400" /> Security Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-700">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${user?.emailVerified ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} mb-3`}>
                <FaEnvelope className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-medium text-white">Email Verification</h3>
              <p className={`mt-1 ${user?.emailVerified ? 'text-green-400' : 'text-red-400'}`}>
                {user?.emailVerified ? 'Verified' : 'Not Verified'}
              </p>
            </div>
            <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-700">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${twoFactorEnabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} mb-3`}>
                <FaFingerprint className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-medium text-white">Two-Factor Auth</h3>
              <p className={`mt-1 ${twoFactorEnabled ? 'text-green-400' : 'text-red-400'}`}>
                {twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-700">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${sessions.length > 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'} mb-3`}>
                <FaDesktop className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-medium text-white">Active Sessions</h3>
              <p className="mt-1 text-yellow-400">
                {sessions.length} device{sessions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Tabbed Security Settings */}
        <div className="bg-gray-800/50 rounded-xl border border-yellow-500/10 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-700">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("password")}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === "password"
                    ? "text-yellow-400 border-b-2 border-yellow-400"
                    : "text-gray-400 hover:text-gray-300"
                } transition-colors`}
              >
                <div className="flex items-center">
                  <FaLock className={`mr-2 ${activeTab === "password" ? "text-yellow-400" : "text-gray-500"}`} />
                  Password
                </div>
              </button>
              <button
                onClick={() => setActiveTab("2fa")}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === "2fa"
                    ? "text-yellow-400 border-b-2 border-yellow-400"
                    : "text-gray-400 hover:text-gray-300"
                } transition-colors`}
              >
                <div className="flex items-center">
                  <FaFingerprint className={`mr-2 ${activeTab === "2fa" ? "text-yellow-400" : "text-gray-500"}`} />
                  Two-Factor Authentication
                </div>
              </button>
              <button
                onClick={() => setActiveTab("sessions")}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === "sessions"
                    ? "text-yellow-400 border-b-2 border-yellow-400"
                    : "text-gray-400 hover:text-gray-300"
                } transition-colors`}
              >
                <div className="flex items-center">
                  <FaDesktop className={`mr-2 ${activeTab === "sessions" ? "text-yellow-400" : "text-gray-500"}`} />
                  Sessions
                </div>
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === "activity"
                    ? "text-yellow-400 border-b-2 border-yellow-400"
                    : "text-gray-400 hover:text-gray-300"
                } transition-colors`}
              >
                <div className="flex items-center">
                  <FaHistory className={`mr-2 ${activeTab === "activity" ? "text-yellow-400" : "text-gray-500"}`} />
                  Activity Log
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Password Tab */}
            {activeTab === "password" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg font-medium text-white mb-4">Change Password</h3>
                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300">
                      Current Password
                    </label>
                    <div className="relative mt-1">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        name="currentPassword"
                        id="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                        className="block w-full rounded-md bg-gray-700 border border-gray-600 text-white shadow-sm py-2 px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300">
                      New Password
                    </label>
                    <div className="relative mt-1">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        id="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                        className="block w-full rounded-md bg-gray-700 border border-gray-600 text-white shadow-sm py-2 px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                      </button>
                    </div>

                    {/* Password Strength Meter */}
                    {passwordData.newPassword && (
                      <div className="mt-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-400">Password Strength:</span>
                          <span className={`text-xs font-semibold ${
                            passwordStrength <= 1 ? 'text-red-400' :
                            passwordStrength === 2 ? 'text-yellow-400' :
                            'text-green-400'
                          }`}>
                            {getPasswordStrengthLabel(passwordStrength)}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getPasswordStrengthColor(passwordStrength)}`}
                            style={{ width: `${(passwordStrength / 4) * 100}%` }}
                          />
                        </div>
                        <ul className="mt-2 text-xs text-gray-400 space-y-1">
                          <li className={`${passwordData.newPassword.length >= 8 ? 'text-green-400' : 'text-gray-400'}`}>
                            ✓ At least 8 characters
                          </li>
                          <li className={`${/[A-Z]/.test(passwordData.newPassword) ? 'text-green-400' : 'text-gray-400'}`}>
                            ✓ At least one uppercase letter
                          </li>
                          <li className={`${/[0-9]/.test(passwordData.newPassword) ? 'text-green-400' : 'text-gray-400'}`}>
                            ✓ At least one number
                          </li>
                          <li className={`${/[^A-Za-z0-9]/.test(passwordData.newPassword) ? 'text-green-400' : 'text-gray-400'}`}>
                            ✓ At least one special character
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                      Confirm New Password
                    </label>
                    <div className="relative mt-1">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        id="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        className="block w-full rounded-md bg-gray-700 border border-gray-600 text-white shadow-sm py-2 px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                      </button>
                    </div>
                    {passwordData.newPassword && passwordData.confirmPassword && 
                      passwordData.newPassword !== passwordData.confirmPassword && (
                        <p className="mt-1 text-sm text-red-400">Passwords do not match</p>
                      )}
                  </div>
                  <div>
                    <button
                      type="submit"
                      disabled={isLoading || passwordData.newPassword !== passwordData.confirmPassword || passwordStrength < 2}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-yellow-500 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Changing Password...
                        </>
                      ) : "Change Password"}
                    </button>
                  </div>
                </form>

                <div className="mt-8 p-4 bg-gray-900/60 rounded-lg border border-gray-700">
                  <h4 className="text-sm font-medium text-white mb-2">Password Tips</h4>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• Use a unique password for each of your important accounts</li>
                    <li>• Use a password manager to generate and store strong passwords</li>
                    <li>• Never share your password with anyone</li>
                    <li>• Enable two-factor authentication for additional security</li>
                  </ul>
                </div>
              </motion.div>
            )}

            {/* Two-Factor Authentication Tab */}
            {activeTab === "2fa" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg font-medium text-white mb-4">Two-Factor Authentication</h3>
                <p className="text-gray-400 mb-6">
                  Two-factor authentication adds an extra layer of security to your account by requiring an additional verification code when you sign in.
                </p>

                {!twoFactorEnabled && !showQrCode && (
                  <div className="bg-gray-900/60 p-6 rounded-lg border border-gray-700 mb-6">
                    <h4 className="text-white font-medium mb-2 flex items-center">
                      <FaFingerprint className="mr-2 text-yellow-400" /> Enable Two-Factor Authentication
                    </h4>
                    <p className="text-gray-400 mb-4">
                      Protect your account with an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator.
                    </p>
                    <button
                      onClick={handleEnableTwoFactor}
                      disabled={isLoading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-yellow-500 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Setting Up...
                        </>
                      ) : "Enable Two-Factor Authentication"}
                    </button>
                  </div>
                )}

                {showQrCode && (
                  <div className="bg-gray-900/60 p-6 rounded-lg border border-gray-700 mb-6">
                    <h4 className="text-white font-medium mb-2">Set Up Two-Factor Authentication</h4>
                    <p className="text-gray-400 mb-4">
                      Scan this QR code with your authenticator app to set up two-factor authentication.
                    </p>
                    <div className="flex flex-col md:flex-row md:space-x-6">
                      <div className="flex-shrink-0 mb-4 md:mb-0">
                        <div className="bg-white p-4 rounded-lg inline-block">
                          <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="mb-4">
                          <p className="text-sm text-gray-400 mb-2">
                            If you can't scan the QR code, enter this code manually in your authenticator app:
                          </p>
                          <div className="bg-gray-800 p-3 rounded-md font-mono text-sm text-yellow-400 select-all">
                            JBSWY3DPEHPK3PXP
                          </div>
                        </div>
                        <div className="mb-4">
                          <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-300 mb-2">
                            Enter the 6-digit code from your authenticator app:
                          </label>
                          <div className="flex">
                            <input
                              type="text"
                              id="verificationCode"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="000000"
                              className="flex-1 rounded-md bg-gray-700 border border-gray-600 text-white shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                              maxLength={6}
                            />
                            <button
                              onClick={handleVerifyTwoFactor}
                              disabled={verificationCode.length !== 6 || isLoading}
                              className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-yellow-500 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isLoading ? "Verifying..." : "Verify"}
                            </button>
                          </div>
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => setShowQrCode(false)}
                            className="text-gray-400 hover:text-gray-300 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {twoFactorEnabled && (
                  <div className="bg-green-900/20 border border-green-500/30 p-6 rounded-lg mb-6">
                    <div className="flex items-center text-green-400 mb-2">
                      <FaCheckCircle className="mr-2" />
                      <span className="font-semibold">Two-factor authentication is enabled</span>
                    </div>
                    <p className="text-gray-300 mb-4">
                      Your account is protected with two-factor authentication. You'll need to enter a verification code each time you sign in.
                    </p>
                    <button
                      onClick={handleDisableTwoFactor}
                      disabled={isLoading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Disabling..." : "Disable Two-Factor Authentication"}
                    </button>
                  </div>
                )}

                <div className="bg-gray-900/60 p-6 rounded-lg border border-gray-700">
                  <h4 className="text-white font-medium mb-2">Recovery Options</h4>
                  <p className="text-gray-400 mb-4">
                    If you lose access to your authenticator app, you can use recovery codes to sign in.
                  </p>
                  <button
                    type="button"
                    disabled={!twoFactorEnabled}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    View Recovery Codes
                  </button>
                </div>
              </motion.div>
            )}

            {/* Sessions Tab */}
            {activeTab === "sessions" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-white">Active Sessions</h3>
                  {sessions.filter(s => !s.current).length > 0 && (
                    <button
                      onClick={handleRevokeAllSessions}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-red-400 hover:text-red-300 focus:outline-none"
                    >
                      <FaSignOutAlt className="mr-1" /> Sign out all other devices
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div 
                      key={session.id} 
                      className={`p-4 rounded-lg border ${
                        session.current ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-gray-900/60 border-gray-700'
                      }`}
                    >
                      <div className="flex justify-between">
                        <div>
                          <div className="flex items-center">
                            <FaDesktop className={`mr-2 ${session.current ? 'text-yellow-400' : 'text-gray-400'}`} />
                            <span className="font-medium text-white">
                              {session.deviceName}
                              {session.current && (
                                <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                                  Current Device
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-gray-400">
                            {session.browser} on {session.os} • {session.location}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            Last active: {new Date(session.lastUsed).toLocaleString()}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            IP: {session.ipAddress}
                          </div>
                        </div>
                        {!session.current && (
                          <button
                            onClick={() => handleRevokeSession(session.id)}
                            className="text-red-400 hover:text-red-300 focus:outline-none"
                          >
                            Sign Out
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Activity Log Tab */}
            {activeTab === "activity" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg font-medium text-white mb-4">Security Activity Log</h3>
                <div className="overflow-hidden border border-gray-700 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-900/60">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Event
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          IP Address
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Date & Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800/40 divide-y divide-gray-700">
                      {securityEvents.map((event) => (
                        <tr key={event.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`flex-shrink-0 mr-2 ${
                                event.severity === 'high' ? 'text-red-400' : 
                                event.severity === 'medium' ? 'text-yellow-400' : 
                                'text-green-400'
                              }`}>
                                {event.severity === 'high' ? (
                                  <FaExclamationTriangle className="h-5 w-5" />
                                ) : event.severity === 'medium' ? (
                                  <FaExclamationTriangle className="h-5 w-5" />
                                ) : (
                                  <FaCheckCircle className="h-5 w-5" />
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-white">
                                  {event.description}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {event.eventType.replace(/_/g, ' ')}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-300">{event.ipAddress}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {new Date(event.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}