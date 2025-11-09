// components/profile/BioEditModal.tsx - UPDATE
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaSave, FaGlobe } from "react-icons/fa";

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'KR', name: 'South Korea' },
  { code: 'RU', name: 'Russia' },
];

interface BioEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBio: string;
  currentCountry?: string;
  currentLocation?: string;
  currentWebsite?: string;
  onSave: (bio: string, country?: string, location?: string, website?: string) => Promise<void>;
}

export default function BioEditModal({
  isOpen,
  onClose,
  currentBio,
  currentCountry = '',
  currentLocation = '',
  currentWebsite = '',
  onSave
}: BioEditModalProps) {
  const [bio, setBio] = useState(currentBio);
  const [country, setCountry] = useState(currentCountry);
  const [location, setLocation] = useState(currentLocation);
  const [website, setWebsite] = useState(currentWebsite);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(bio, country, location, website);
      onClose();
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black rounded-3xl border border-red-500/30" />

              <div className="relative p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-white">
                    Edit Profile Info
                  </h2>
                  <motion.button
                    onClick={onClose}
                    className="p-2 rounded-xl bg-gray-800/50 text-gray-400 hover:text-white"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FaTimes className="text-xl" />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bio / Description
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      maxLength={500}
                      placeholder="Tell others about yourself..."
                      className="w-full rounded-xl bg-gray-800/50 border border-gray-700/40 text-white py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                    />
                    <div className="flex justify-end mt-1">
                      <span className={`text-xs ${bio.length > 450 ? 'text-red-400' : 'text-gray-500'}`}>
                        {bio.length}/500
                      </span>
                    </div>
                  </div>

                  {/* ✅ ADD Country Select */}
                  <div>
                    <label className=" text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <FaGlobe className="text-red-500" />
                      Country
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full rounded-xl bg-gray-800/50 border border-gray-700/40 text-white py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    >
                      <option value="">Select country</option>
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      City / Location
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., San Francisco, CA"
                      className="w-full rounded-xl bg-gray-800/50 border border-gray-700/40 text-white py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="w-full rounded-xl bg-gray-800/50 border border-gray-700/40 text-white py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <motion.button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
                    whileHover={isSaving ? {} : { scale: 1.05 }}
                    whileTap={isSaving ? {} : { scale: 0.95 }}
                  >
                    {isSaving ? (
                      <>
                        <motion.div
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave />
                        Save Changes
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}