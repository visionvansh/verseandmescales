//settings/page.tsx 
"use client";
import { useState, useEffect } from "react";
import { useAuth } from '@/contexts/AuthContext';
import SettingsLayout from '@/components/settings/SettingsLayout';
import EnhancedBasicProfileSettings from '@/components/settings/EnhancedBasicProfileSettings';
import PrivacySettings from '@/components/settings/PrivacySettings';
import ActivitySettings from '@/components/settings/ActivitySettings';
import { motion } from 'framer-motion';

// Advanced Shimmer Effect Component
const ShimmerEffect = () => (
  <motion.div
    className="absolute inset-0 -translate-x-full"
    animate={{
      translateX: ['100%', '-100%']
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: "linear"
    }}
    style={{
      background: 'linear-gradient(90deg, transparent 0%, rgba(239, 68, 68, 0.15) 50%, transparent 100%)'
    }}
  />
);

// Skeleton Components for Different Settings Sections
const SettingsSkeleton = ({ type = 'basic' }: { type?: string }) => {
  const renderBasicSkeleton = () => (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* Profile Header Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-5 md:gap-6 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-gray-900/40 border border-red-500/20 overflow-hidden relative"
      >
        <ShimmerEffect />
        
        {/* Avatar */}
        <div className="relative">
          <div className="w-20 h-20 sm:w-22 sm:h-22 md:w-24 md:h-24 rounded-xl sm:rounded-2xl bg-gradient-to-br from-red-900/50 via-gray-800/50 to-red-900/50 overflow-hidden">
            <ShimmerEffect />
          </div>
        </div>
        
        {/* Info */}
        <div className="flex-1 space-y-2 sm:space-y-3 w-full">
          <div className="relative h-6 sm:h-7 w-40 sm:w-48 bg-gradient-to-r from-red-900/50 via-gray-800/50 to-red-900/50 rounded-lg overflow-hidden">
            <ShimmerEffect />
          </div>
          <div className="relative h-3 sm:h-4 w-52 sm:w-64 bg-gradient-to-r from-red-900/30 via-gray-800/30 to-red-900/30 rounded overflow-hidden">
            <ShimmerEffect />
          </div>
          <div className="flex flex-wrap gap-2">
            {[1, 2].map((i) => (
              <div key={i} className="relative h-7 sm:h-8 w-20 sm:w-24 bg-gradient-to-r from-red-900/30 via-red-800/30 to-red-900/30 rounded-lg overflow-hidden">
                <ShimmerEffect />
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Form Fields */}
      {[1, 2, 3, 4].map((section, idx) => (
        <motion.div
          key={section}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="space-y-3 sm:space-y-4"
        >
          <div className="relative h-4 sm:h-5 w-32 sm:w-40 bg-gradient-to-r from-red-900/40 via-gray-800/40 to-red-900/40 rounded overflow-hidden">
            <ShimmerEffect />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {[1, 2].map((field) => (
              <div key={field} className="relative p-4 sm:p-5 rounded-lg sm:rounded-xl bg-gray-900/30 border border-red-500/10 overflow-hidden">
                <ShimmerEffect />
                <div className="relative z-10 space-y-2 sm:space-y-3">
                  <div className="relative h-3 sm:h-4 w-24 sm:w-28 bg-gradient-to-r from-red-900/40 via-gray-800/40 to-red-900/40 rounded overflow-hidden">
                    <ShimmerEffect />
                  </div>
                  <div className="relative h-10 sm:h-11 w-full bg-gradient-to-r from-gray-800/50 via-gray-900/50 to-gray-800/50 rounded-lg overflow-hidden">
                    <ShimmerEffect />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col xs:flex-row justify-end space-y-3 xs:space-y-0 xs:space-x-4 pt-4 sm:pt-6 border-t border-red-500/20"
      >
        <div className="relative h-10 sm:h-11 w-full xs:w-32 bg-gradient-to-r from-gray-800/50 via-gray-900/50 to-gray-800/50 rounded-lg sm:rounded-xl overflow-hidden">
          <ShimmerEffect />
        </div>
        <div className="relative h-10 sm:h-11 w-full xs:w-40 bg-gradient-to-r from-red-900/40 via-red-800/40 to-red-900/40 rounded-lg sm:rounded-xl overflow-hidden">
          <ShimmerEffect />
        </div>
      </motion.div>
    </div>
  );

  const renderCardsSkeleton = () => (
    <div className="space-y-3 sm:space-y-4">
      {[1, 2, 3, 4].map((card, idx) => (
        <motion.div
          key={card}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="relative p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-gray-900/40 border border-red-500/20 overflow-hidden"
        >
          <ShimmerEffect />
          
          <div className="relative z-10 space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-900/50 via-gray-800/50 to-red-900/50 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0">
                  <ShimmerEffect />
                </div>
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="relative h-4 sm:h-5 w-40 sm:w-48 bg-gradient-to-r from-red-900/50 via-gray-800/50 to-red-900/50 rounded-lg overflow-hidden">
                    <ShimmerEffect />
                  </div>
                  <div className="relative h-3 sm:h-4 w-52 sm:w-64 bg-gradient-to-r from-red-900/30 via-gray-800/30 to-red-900/30 rounded overflow-hidden">
                    <ShimmerEffect />
                  </div>
                </div>
              </div>
              <div className="relative h-6 sm:h-7 w-12 sm:w-14 bg-gradient-to-r from-red-900/40 via-red-800/40 to-red-900/40 rounded-full overflow-hidden flex-shrink-0">
                <ShimmerEffect />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderListSkeleton = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="relative h-6 sm:h-7 w-48 sm:w-56 bg-gradient-to-r from-red-900/50 via-gray-800/50 to-red-900/50 rounded-lg overflow-hidden">
          <ShimmerEffect />
        </div>
        <div className="relative h-3 sm:h-4 w-80 sm:w-96 bg-gradient-to-r from-red-900/30 via-gray-800/30 to-red-900/30 rounded overflow-hidden">
          <ShimmerEffect />
        </div>
      </motion.div>

      {/* List Items */}
      <div className="space-y-2 sm:space-y-3">
        {[1, 2, 3, 4, 5].map((item, idx) => (
          <motion.div
            key={item}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="relative p-4 sm:p-5 rounded-lg sm:rounded-xl bg-gray-900/30 border border-red-500/10 overflow-hidden"
          >
            <ShimmerEffect />
            
            <div className="relative z-10 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-900/50 via-gray-800/50 to-red-900/50 rounded-lg overflow-hidden flex-shrink-0">
                  <ShimmerEffect />
                </div>
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="relative h-3 sm:h-4 w-3/4 bg-gradient-to-r from-red-900/40 via-gray-800/40 to-red-900/40 rounded overflow-hidden">
                    <ShimmerEffect />
                  </div>
                  <div className="relative h-2.5 sm:h-3 w-1/2 bg-gradient-to-r from-red-900/30 via-gray-800/30 to-red-900/30 rounded overflow-hidden">
                    <ShimmerEffect />
                  </div>
                </div>
              </div>
              <div className="relative h-8 sm:h-9 w-20 sm:w-24 bg-gradient-to-r from-gray-800/50 via-gray-900/50 to-gray-800/50 rounded-lg overflow-hidden flex-shrink-0">
                <ShimmerEffect />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderGridSkeleton = () => (
    <div className="space-y-4 sm:space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="relative h-6 sm:h-7 w-40 sm:w-48 bg-gradient-to-r from-red-900/50 via-gray-800/50 to-red-900/50 rounded-lg overflow-hidden">
          <ShimmerEffect />
        </div>
        <div className="relative h-3 sm:h-4 w-64 sm:w-80 bg-gradient-to-r from-red-900/30 via-gray-800/30 to-red-900/30 rounded overflow-hidden">
          <ShimmerEffect />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5, 6].map((card, idx) => (
          <motion.div
            key={card}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.08 }}
            className="relative p-5 sm:p-6 rounded-xl sm:rounded-2xl bg-gray-900/40 border border-red-500/20 overflow-hidden"
          >
            <ShimmerEffect />
            
            <div className="relative z-10 space-y-3 sm:space-y-4">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-red-900/50 via-gray-800/50 to-red-900/50 rounded-xl sm:rounded-2xl overflow-hidden mx-auto">
                <ShimmerEffect />
              </div>
              <div className="space-y-2 text-center">
                <div className="relative h-4 sm:h-5 w-28 sm:w-32 bg-gradient-to-r from-red-900/40 via-gray-800/40 to-red-900/40 rounded overflow-hidden mx-auto">
                  <ShimmerEffect />
                </div>
                <div className="relative h-2.5 sm:h-3 w-20 sm:w-24 bg-gradient-to-r from-red-900/30 via-gray-800/30 to-red-900/30 rounded overflow-hidden mx-auto">
                  <ShimmerEffect />
                </div>
              </div>
              <div className="relative h-8 sm:h-9 w-full bg-gradient-to-r from-red-900/30 via-red-800/30 to-red-900/30 rounded-lg overflow-hidden">
                <ShimmerEffect />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // Return appropriate skeleton based on type
  switch (type) {
    case 'basic':
      return renderBasicSkeleton();
    case 'notifications':
      return renderCardsSkeleton();
    case 'privacy':
      return renderCardsSkeleton();
    case 'appearance':
      return renderGridSkeleton();
    case 'connected':
      return renderGridSkeleton();
    case 'activity':
      return renderListSkeleton();
    default:
      return renderBasicSkeleton();
  }
};

// Define type for session data
interface SessionData {
  sessions?: any[];
  devices?: any[];
  [key: string]: any;
}

export default function SettingsPage() {
  const { user: authUser } = useAuth();
  const [activeSection, setActiveSection] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userSettings, setUserSettings] = useState<any>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  // Load user settings and profile data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsInitialLoading(true);
    
    // Add cache-busting parameter
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
      console.log("Settings API response:", data);
      
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
      console.log("Profile API response:", data);
      
      if (data.success && data.data) {
        setSessionData(data.data);
      }
    } catch (err: any) {
      console.error("Profile load error:", err);
    }
  };

  // Handle settings updates
  const handleSettingsUpdate = async (section: string, data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      console.log("Updating settings:", section, data);

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
      console.log("Update result:", result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update settings');
      }

      setSuccess(result.message || 'Settings updated successfully');
      
      // Reload data to get latest updates
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

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        clearMessages();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const renderActiveSection = () => {
    if (isInitialLoading) {
      return <SettingsSkeleton type={activeSection} />;
    }

    const combinedUserData = {
      ...((userSettings || authUser) || {}),
      ...(sessionData ? { 
        sessions: sessionData.sessions || [],
        devices: sessionData.devices || []
      } : {})
    };
    
    const props = {
      user: combinedUserData,
      onUpdate: handleSettingsUpdate,
      isLoading,
      onNavigateToTab: setActiveSection, // NEW: Pass navigation handler
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
      isLoading={isInitialLoading}
    >
      {renderActiveSection()}
    </SettingsLayout>
  );
}