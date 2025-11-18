//settings/page.tsx 
"use client";
import { useState, useEffect } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import SettingsLayout from '@/components/settings/SettingsLayout';
import EnhancedBasicProfileSettings from '@/components/settings/EnhancedBasicProfileSettings';
import PrivacySettings from '@/components/settings/PrivacySettings';
import ActivitySettings from '@/components/settings/ActivitySettings';
import { motion } from 'framer-motion';
import { FaLock, FaUserShield } from 'react-icons/fa';
import Link from 'next/link';

// ✅ SIMPLIFIED Skeleton Component (like /courses page)
const SettingsSkeleton = ({ type = 'basic' }: { type?: string }) => {
  const renderBasicSkeleton = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Profile Header Skeleton */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-xl bg-gray-900/40 border border-red-500/20">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gray-800/40 animate-pulse" />
        <div className="flex-1 space-y-3 w-full">
          <div className="h-6 sm:h-7 w-40 sm:w-48 bg-gray-800/40 rounded-lg animate-pulse" />
          <div className="h-3 sm:h-4 w-52 sm:w-64 bg-gray-800/30 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-7 sm:h-8 w-20 sm:w-24 bg-gray-800/30 rounded-lg animate-pulse" />
            <div className="h-7 sm:h-8 w-20 sm:w-24 bg-gray-800/30 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>

      {/* Form Fields */}
      {[1, 2, 3].map((section, idx) => (
        <div key={section} className="space-y-3 sm:space-y-4">
          <div className="h-4 sm:h-5 w-32 sm:w-40 bg-gray-800/40 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {[1, 2].map((field) => (
              <div key={field} className="p-4 sm:p-5 rounded-xl bg-gray-900/30 border border-red-500/10">
                <div className="space-y-3">
                  <div className="h-3 sm:h-4 w-24 sm:w-28 bg-gray-800/40 rounded animate-pulse" />
                  <div className="h-10 sm:h-11 w-full bg-gray-800/50 rounded-lg animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Action Buttons */}
      <div className="flex flex-col xs:flex-row justify-end gap-3 xs:gap-4 pt-6 border-t border-red-500/20">
        <div className="h-10 sm:h-11 w-full xs:w-32 bg-gray-800/50 rounded-xl animate-pulse" />
        <div className="h-10 sm:h-11 w-full xs:w-40 bg-gray-800/50 rounded-xl animate-pulse" />
      </div>
    </div>
  );

  const renderCardsSkeleton = () => (
    <div className="space-y-3 sm:space-y-4">
      {[1, 2, 3, 4].map((card, idx) => (
        <div key={card} className="p-4 sm:p-6 rounded-xl bg-gray-900/40 border border-red-500/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-800/50 rounded-xl animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 sm:h-5 w-40 sm:w-48 bg-gray-800/50 rounded-lg animate-pulse" />
                <div className="h-3 sm:h-4 w-52 sm:w-64 bg-gray-800/30 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-6 sm:h-7 w-12 sm:w-14 bg-gray-800/40 rounded-full animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderListSkeleton = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <div className="h-6 sm:h-7 w-48 sm:w-56 bg-gray-800/50 rounded-lg animate-pulse" />
        <div className="h-3 sm:h-4 w-80 sm:w-96 bg-gray-800/30 rounded animate-pulse" />
      </div>

      <div className="space-y-2 sm:space-y-3">
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="p-4 sm:p-5 rounded-xl bg-gray-900/30 border border-red-500/10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-4 flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-800/50 rounded-lg animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 sm:h-4 w-3/4 bg-gray-800/40 rounded animate-pulse" />
                  <div className="h-2.5 sm:h-3 w-1/2 bg-gray-800/30 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-8 sm:h-9 w-20 sm:w-24 bg-gray-800/50 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  switch (type) {
    case 'basic':
      return renderBasicSkeleton();
    case 'notifications':
    case 'privacy':
      return renderCardsSkeleton();
    case 'activity':
      return renderListSkeleton();
    default:
      return renderBasicSkeleton();
  }
};

// ✅ NEW: Locked Settings Page Component
const LockedSettingsPage = () => {
  return (
    <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6 sm:py-8 md:py-10 lg:py-12 mt-20">
      <div className="max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-black text-white mt-4 sm:mt-6 md:mt-8 leading-tight">
            <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
              VERSEANDME SCALES
            </span>{" "}
            <span className="block sm:inline">SETTINGS</span>
          </h1>
        </motion.div>

        {/* Locked Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-2xl" />
          
          <div className="relative p-8 sm:p-12 md:p-16 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 sm:mb-8 rounded-full bg-gradient-to-br from-red-600/20 to-red-800/20 border-2 border-red-500/30 flex items-center justify-center"
            >
              <FaLock className="text-4xl sm:text-5xl text-red-400" />
            </motion.div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Sign In Required
            </h2>
            <p className="text-base sm:text-lg text-gray-400 mb-8 max-w-md mx-auto">
              You need to be signed in to access your settings and customize your account
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <Link
                href="/auth/signin"
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:scale-105 transition-transform text-base"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="w-full sm:w-auto px-8 py-3 bg-gray-800/50 border border-gray-700 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors text-base"
              >
                Create Account
              </Link>
            </div>

            <div className="mt-8 pt-8 border-t border-red-500/20">
              <Link
                href="/"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

interface SessionData {
  sessions?: any[];
  devices?: any[];
  [key: string]: any;
}

export default function SettingsPage() {
  const { user, authChecked, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userSettings, setUserSettings] = useState<any>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  // ✅ ADDED: Check if user should be blocked
  const shouldBlock = !user && authChecked && !authLoading;

  // Load user settings and profile data on mount
  useEffect(() => {
    if (shouldBlock) {
      setIsInitialLoading(false);
      return;
    }

    if (user && authChecked) {
      loadInitialData();
    }
  }, [user, authChecked, shouldBlock]);

  const loadInitialData = async () => {
    setIsInitialLoading(true);
    
    const timestamp = Date.now();
    
    await Promise.all([
      loadUserSettings(timestamp),
      loadUserProfile(timestamp)
    ]);
    
    setTimeout(() => {
      setIsInitialLoading(false);
    }, 300);
  };

  const loadUserSettings = async (cacheBuster?: number) => {
    try {
      const url = cacheBuster 
        ? `/api/user/settings?t=${cacheBuster}` 
        : '/api/user/settings';
        
      const response = await fetch(url, {
        cache: 'no-store',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load settings');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setUserSettings(data.data);
      } else {
        throw new Error('Invalid data structure received from API');
      }
      
    } catch (err: any) {
      console.error("Settings load error:", err);
      setError('Failed to load user settings: ' + err.message);
    }
  };

  const loadUserProfile = async (cacheBuster?: number) => {
    try {
      const url = cacheBuster 
        ? `/api/user/profile?t=${cacheBuster}` 
        : '/api/user/profile';
        
      const response = await fetch(url, {
        cache: 'no-store',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load profile data');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setSessionData(data.data);
      }
    } catch (err: any) {
      console.error("Profile load error:", err);
    }
  };

  const handleSettingsUpdate = async (section: string, data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section,
          data
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update settings');
      }

      setSuccess(result.message || 'Settings updated successfully');
      
      await loadUserSettings();
      await loadUserProfile();
      
    } catch (err: any) {
      console.error("Settings update error:", err);
      setError(err.message || 'Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        clearMessages();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // ✅ ADDED: Show locked page if not authenticated
  if (shouldBlock) {
    return <LockedSettingsPage />;
  }

  // Show skeleton while checking auth or loading
  if (authLoading || isInitialLoading) {
    return (
      <SettingsLayout
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        success={success}
        error={error}
        onClearMessages={clearMessages}
        isLoading={true}
      >
        <SettingsSkeleton type={activeSection} />
      </SettingsLayout>
    );
  }

  const renderActiveSection = () => {
    const combinedUserData = {
      ...((userSettings || user) || {}),
      ...(sessionData ? { 
        sessions: sessionData.sessions || [],
        devices: sessionData.devices || []
      } : {})
    };
    
    const props = {
      user: combinedUserData,
      onUpdate: handleSettingsUpdate,
      isLoading,
      onNavigateToTab: setActiveSection,
    };

    switch (activeSection) {
      case 'basic':
        return <EnhancedBasicProfileSettings {...props} />;
      case 'privacy':
        return <PrivacySettings {...props} />;
      case 'activity':
        return <ActivitySettings {...props} />;
      default:
        return <EnhancedBasicProfileSettings {...props} />;
    }
  };

  return (
    <SettingsLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      success={success}
      error={error}
      onClearMessages={clearMessages}
      isLoading={false}
    >
      {renderActiveSection()}
    </SettingsLayout>
  );
}