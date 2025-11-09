// components/settings/AppearanceSettings.tsx
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaPalette, FaMoon, FaSun, FaDesktop, FaGlobe, FaDollarSign, FaCheckCircle } from "react-icons/fa";

interface AppearanceSettingsProps {
  user: any;
  onUpdate: (section: string, data: any) => Promise<void>;
  isLoading: boolean;
}

const AppearanceSettings = ({ user, onUpdate, isLoading }: AppearanceSettingsProps) => {
  const [settings, setSettings] = useState({
    theme: 'dark',
    language: 'en',
    currency: 'USD',
  });

  useEffect(() => {
    if (user?.preferences) {
      setSettings(prev => ({
        theme: user.preferences.theme || 'dark',
        language: user.preferences.language || 'en',
        currency: user.preferences.currency || 'USD',
      }));
    }
  }, [user]);

  const handleSelectChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate('preferences', settings);
  };

  const themeOptions = [
    { value: 'dark', label: 'Dark Mode', icon: FaMoon, desc: 'Dark theme for better night viewing' },
    { value: 'light', label: 'Light Mode', icon: FaSun, desc: 'Light theme for daytime use' },
    { value: 'auto', label: 'Auto', icon: FaDesktop, desc: 'Matches your system preference' }
  ];

  const languageOptions = [
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'es', label: 'Español', flag: '🇪🇸' },
    { value: 'fr', label: 'Français', flag: '🇫🇷' },
    { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { value: 'ja', label: '日本語', flag: '🇯🇵' },
    { value: 'zh', label: '中文', flag: '🇨🇳' }
  ];

  const currencyOptions = [
    { value: 'USD', label: 'US Dollar', symbol: '$' },
    { value: 'EUR', label: 'Euro', symbol: '€' },
    { value: 'GBP', label: 'British Pound', symbol: '£' },
    { value: 'JPY', label: 'Japanese Yen', symbol: '¥' },
    { value: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
    { value: 'AUD', label: 'Australian Dollar', symbol: 'A$' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center mb-2">
          <FaPalette className="mr-3 text-yellow-400" />
          Appearance & Localization
        </h2>
        <p className="text-gray-400">
          Customize your visual experience and regional preferences.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Theme Selection */}
        <motion.div 
          className="bg-gray-800/50 p-6 rounded-xl border border-yellow-500/10"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <h3 className="text-lg font-medium text-white mb-6 flex items-center">
            <FaPalette className="mr-2 text-yellow-400" /> Theme Preference
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themeOptions.map((theme) => {
              const Icon = theme.icon;
              return (
                <motion.div
                  key={theme.value}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                    settings.theme === theme.value
                      ? 'bg-yellow-400/10 border-yellow-400/50' 
                      : 'bg-gray-800/30 border-gray-700/30 hover:border-gray-600/50'
                  }`}
                  onClick={() => handleSelectChange('theme', theme.value)}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      settings.theme === theme.value
                        ? 'bg-yellow-400/20 text-yellow-400' 
                        : 'bg-gray-700/50 text-gray-500'
                    }`}>
                      <Icon className="text-2xl" />
                    </div>
                    <div>
                      <h4 className={`font-semibold ${settings.theme === theme.value ? 'text-yellow-400' : 'text-white'}`}>
                        {theme.label}
                      </h4>
                      <p className="text-xs text-gray-500 mt-2">{theme.desc}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      settings.theme === theme.value
                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400' 
                        : 'border-gray-600 text-transparent'
                    }`}>
                      <FaCheckCircle className="text-sm" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Language & Currency */}
        <motion.div 
          className="bg-gray-800/50 p-6 rounded-xl border border-yellow-500/10"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <h3 className="text-lg font-medium text-white mb-6 flex items-center">
            <FaGlobe className="mr-2 text-yellow-400" /> Regional Settings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Language
              </label>
              <div className="space-y-2">
                {languageOptions.map((lang) => (
                  <motion.div
                    key={lang.value}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      settings.language === lang.value
                        ? 'bg-yellow-400/10 border-yellow-400/50 text-yellow-400' 
                        : 'bg-gray-800/30 border-gray-700/30 text-gray-300 hover:border-gray-600/50'
                    }`}
                    onClick={() => handleSelectChange('language', lang.value)}
                    whileHover={{ x: 5 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{lang.flag}</span>
                        <span className="font-medium">{lang.label}</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        settings.language === lang.value
                          ? 'border-yellow-400 bg-yellow-400' 
                          : 'border-gray-600'
                      }`}></div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Currency
              </label>
              <div className="space-y-2">
                {currencyOptions.map((curr) => (
                  <motion.div
                    key={curr.value}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      settings.currency === curr.value
                        ? 'bg-yellow-400/10 border-yellow-400/50 text-yellow-400' 
                        : 'bg-gray-800/30 border-gray-700/30 text-gray-300 hover:border-gray-600/50'
                    }`}
                    onClick={() => handleSelectChange('currency', curr.value)}
                    whileHover={{ x: 5 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold w-8">{curr.symbol}</span>
                        <div>
                          <span className="font-medium">{curr.value}</span>
                          <p className="text-xs text-gray-500">{curr.label}</p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        settings.currency === curr.value
                          ? 'border-yellow-400 bg-yellow-400' 
                          : 'border-gray-600'
                      }`}></div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
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
                Save Appearance Settings
              </>
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

export default AppearanceSettings;