// components/settings/ActivitySettings.tsx
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaBolt, FaEye, FaClock, FaChartLine, FaUserFriends, FaGlobe, FaCheckCircle } from "react-icons/fa";

interface ActivitySettingsProps {
  user: any;
  onUpdate: (section: string, data: any) => Promise<void>;
  isLoading: boolean;
}

// Define an interface with all possible settings keys
interface ActivitySettingsState {
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  showActivityStatus: boolean;
  trackPageViews: boolean;
  shareAnalytics: boolean;
  publicProfile: boolean;
  showRecentActivity: boolean;
  activityVisibility: string;
  sessionTimeout: number;
  autoLogout: boolean;
  [key: string]: boolean | string | number; // Add index signature
}

const ActivitySettings = ({ user, onUpdate, isLoading }: ActivitySettingsProps) => {
  const [settings, setSettings] = useState<ActivitySettingsState>({
    showOnlineStatus: true,
    showLastSeen: true,
    showActivityStatus: true,
    trackPageViews: true,
    shareAnalytics: false,
    publicProfile: true,
    showRecentActivity: true,
    activityVisibility: 'friends',
    sessionTimeout: 1440, // minutes
    autoLogout: true,
  });

  const [activityStats, setActivityStats] = useState({
    totalSessions: 0,
    averageSessionTime: 0,
    lastActive: null,
    devicesCount: 0
  });

  useEffect(() => {
    if (user?.preferences) {
      setSettings(prev => ({
        ...prev,
        showOnlineStatus: user.preferences.showOnlineStatus ?? true,
        showLastSeen: user.preferences.showLastSeen ?? true,
        showActivityStatus: user.preferences.showActivityStatus ?? true,
        sessionTimeout: user.preferences.sessionTimeout ?? 1440,
        // Add other preferences from user data
      }));
    }

    // Load activity stats
    loadActivityStats();
  }, [user]);

  const loadActivityStats = async () => {
    try {
      const response = await fetch('/api/user/activity-stats');
      if (response.ok) {
        const stats = await response.json();
        setActivityStats(stats.data);
      }
    } catch (error) {
      console.error('Failed to load activity stats:', error);
    }
  };

  const handleToggleChange = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectChange = (key: string, value: string | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate('preferences', settings);
  };

  const visibilityOptions = [
    { value: 'public', label: 'Public', desc: 'Everyone can see your activity' },
    { value: 'friends', label: 'Friends Only', desc: 'Only your connections can see' },
    { value: 'private', label: 'Private', desc: 'Only you can see your activity' }
  ];

  const sessionTimeoutOptions = [
    { value: 60, label: '1 Hour' },
    { value: 480, label: '8 Hours' },
    { value: 1440, label: '24 Hours' },
    { value: 10080, label: '1 Week' },
    { value: 43200, label: '1 Month' },
    { value: 0, label: 'Never' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center mb-2">
          <FaBolt className="mr-3 text-yellow-400" />
          Activity & Presence
        </h2>
        <p className="text-gray-400">
          Control your activity visibility and session preferences.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Activity Visibility */}
        <motion.div 
          className="bg-gray-800/50 p-6 rounded-xl border border-yellow-500/10"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <h3 className="text-lg font-medium text-white mb-6 flex items-center">
            <FaEye className="mr-2 text-yellow-400" /> Visibility Settings
          </h3>
          <div className="space-y-4">
            {[
              { key: 'showOnlineStatus', title: 'Show Online Status', desc: 'Let others see when you\'re online' },
              { key: 'showLastSeen', title: 'Show Last Seen', desc: 'Display your last activity timestamp' },
              { key: 'showActivityStatus', title: 'Show Activity Status', desc: 'Share what you\'re currently doing' },
              { key: 'showRecentActivity', title: 'Show Recent Activity', desc: 'Display your recent actions and achievements' }
            ].map((item) => (
              <motion.div
                key={item.key}
                className="flex items-center justify-between p-4 rounded-lg bg-gray-800/30 border border-gray-700/30 hover:bg-gray-800/50 transition-all"
                whileHover={{ x: 5 }}
              >
                <div className="flex-1">
                  <h4 className="text-white font-medium">{item.title}</h4>
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings[item.key] as boolean}
                    onChange={() => handleToggleChange(item.key)}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                </label>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Activity Visibility Level */}
        <motion.div 
          className="bg-gray-800/50 p-6 rounded-xl border border-yellow-500/10"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <h3 className="text-lg font-medium text-white mb-6 flex items-center">
            <FaUserFriends className="mr-2 text-yellow-400" /> Activity Visibility Level
          </h3>
          <div className="space-y-3">
            {visibilityOptions.map((option) => (
              <motion.div
                key={option.value}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                  settings.activityVisibility === option.value
                    ? 'bg-yellow-400/10 border-yellow-400/50' 
                    : 'bg-gray-800/30 border-gray-700/30 hover:border-gray-600/50'
                }`}
                onClick={() => handleSelectChange('activityVisibility', option.value)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className={`font-semibold ${
                      settings.activityVisibility === option.value ? 'text-yellow-400' : 'text-white'
                    }`}>
                      {option.label}
                    </h4>
                    <p className="text-gray-500 text-sm mt-1">{option.desc}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    settings.activityVisibility === option.value
                      ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400' 
                      : 'border-gray-600 text-transparent'
                  }`}>
                    <FaCheckCircle className="text-sm" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Session Management */}
        <motion.div 
          className="bg-gray-800/50 p-6 rounded-xl border border-yellow-500/10"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <h3 className="text-lg font-medium text-white mb-6 flex items-center">
            <FaClock className="mr-2 text-yellow-400" /> Session Management
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Auto-logout After Inactivity
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {sessionTimeoutOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelectChange('sessionTimeout', option.value)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      settings.sessionTimeout === option.value
                        ? 'bg-yellow-400/10 border-yellow-400/50 text-yellow-400' 
                        : 'bg-gray-800/30 border-gray-700/30 text-gray-300 hover:border-gray-600/50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
              <div>
                <h4 className="text-white font-medium">Auto-logout Enabled</h4>
                <p className="text-gray-500 text-sm">Automatically sign out after the specified time</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.autoLogout}
                  onChange={() => handleToggleChange('autoLogout')}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
              </label>
            </div>
          </div>
        </motion.div>

        {/* Activity Analytics */}
        <motion.div 
          className="bg-gray-800/50 p-6 rounded-xl border border-yellow-500/10"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <h3 className="text-lg font-medium text-white mb-6 flex items-center">
            <FaChartLine className="mr-2 text-yellow-400" /> Activity Analytics
          </h3>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700/30">
              <div className="text-2xl font-bold text-yellow-400">{activityStats.totalSessions}</div>
              <div className="text-sm text-gray-400">Total Sessions</div>
            </div>
            <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700/30">
              <div className="text-2xl font-bold text-green-400">{Math.round(activityStats.averageSessionTime / 60)}m</div>
              <div className="text-sm text-gray-400">Avg Session Time</div>
            </div>
            <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700/30">
              <div className="text-2xl font-bold text-blue-400">{activityStats.devicesCount}</div>
              <div className="text-sm text-gray-400">Active Devices</div>
            </div>
            <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700/30">
              <div className="text-2xl font-bold text-purple-400">
                {activityStats.lastActive ? new Date(activityStats.lastActive).toLocaleDateString() : 'Today'}
              </div>
              <div className="text-sm text-gray-400">Last Active</div>
            </div>
          </div>

          {/* Analytics Settings */}
          <div className="space-y-4">
            {[
              { key: 'trackPageViews', title: 'Track Page Views', desc: 'Allow tracking of your page navigation for analytics' },
              { key: 'shareAnalytics', title: 'Share Anonymous Analytics', desc: 'Help improve the platform by sharing usage data' }
            ].map((item) => (
              <motion.div
                key={item.key}
                className="flex items-center justify-between p-4 rounded-lg bg-gray-800/30 border border-gray-700/30 hover:bg-gray-800/50 transition-all"
                whileHover={{ x: 5 }}
              >
                <div className="flex-1">
                  <h4 className="text-white font-medium">{item.title}</h4>
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings[item.key] as boolean}
                    onChange={() => handleToggleChange(item.key)}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                </label>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Save Button */}
        <div className="flex justify-end">
          <motion.button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-8 py-4 border border-transparent text-base font-bold rounded-xl text-black bg-gradient-to-r from-yellow-400/90 to-yellow-500/90 hover:from-yellow-400 hover:to-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
           // Continuing ActivitySettings.tsx Save Button...
            style={{ boxShadow: "0 10px 30px rgba(255, 215, 0, 0.3)" }}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <FaCheckCircle className="mr-2" />
                Save Activity Settings
              </>
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

export default ActivitySettings;