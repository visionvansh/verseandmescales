// components/settings/BasicProfileSettings.tsx
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaCamera, FaUser, FaGlobe, FaPhone, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import Image from "next/image";

interface BasicProfileSettingsProps {
  user: any;
  onUpdate: (section: string, data: any) => Promise<void>;
  isLoading: boolean;
}

const BasicProfileSettings = ({ user, onUpdate, isLoading }: BasicProfileSettingsProps) => {
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    phone: "",
    timezone: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [timezones] = useState([
    "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
    "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow",
    "Asia/Dubai", "Asia/Hong_Kong", "Asia/Tokyo", "Asia/Singapore",
    "Australia/Sydney", "Pacific/Auckland"
  ]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        surname: user.surname || "",
        phone: user.phone || "",
        timezone: user.timezone || "",
      });
      
      if (user.img) {
        setImagePreview(user.img);
      }
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size must be less than 2MB");
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Handle image upload first if there's a new image
      let imageUrl = user?.img;
      
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append('file', imageFile);
        
        const uploadResponse = await fetch('/api/user/upload-image', {
          method: 'POST',
          body: imageFormData
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }
        
        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.imageUrl;
      }
      
      // Update basic profile data
      const updatedData = {
        name: formData.name,
        surname: formData.surname,
        phone: formData.phone,
        timezone: formData.timezone,
        ...(imageUrl && { img: imageUrl })
      };
      
      await onUpdate('basic', updatedData);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center mb-2">
          <FaUser className="mr-3 text-yellow-400" />
          Basic Information
        </h2>
        <p className="text-gray-400">
          Update your profile information and how others see you on the platform.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Image */}
        <motion.div 
          className="bg-gray-800/50 p-6 rounded-xl border border-yellow-500/10"
          // Continuing BasicProfileSettings.tsx...
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <h3 className="text-lg font-medium text-white mb-4 flex items-center">
            <FaCamera className="mr-2 text-yellow-400" /> Profile Picture
          </h3>
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-yellow-500/30 bg-gray-900">
              {(imagePreview || user?.img) ? (
                <Image 
                  src={imagePreview || user?.img || '/default-avatar.png'} 
                  alt="Profile" 
                  fill 
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-yellow-500/70">
                  <FaUser size={48} />
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="block mb-2 text-sm font-medium text-gray-300">
                Upload a new photo
              </label>
              <div className="flex items-center space-x-4">
                <label className="relative inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-400/90 to-yellow-500/90 text-black rounded-lg cursor-pointer hover:from-yellow-400 hover:to-yellow-500 transition-all font-medium text-sm">
                  <FaCamera className="mr-2" /> 
                  Choose File
                  <input 
                    type="file" 
                    className="sr-only" 
                    accept="image/*" 
                    onChange={handleImageChange}
                  />
                </label>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setImageFile(null);
                    }}
                    className="text-red-400 hover:text-red-300 text-sm transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                JPG, PNG or GIF. Max size 2MB.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Personal Information */}
        <motion.div 
          className="bg-gray-800/50 p-6 rounded-xl border border-yellow-500/10"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <h3 className="text-lg font-medium text-white mb-4 flex items-center">
            <FaUser className="mr-2 text-yellow-400" /> Personal Details
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-xl bg-gray-700/40 border border-gray-600/40 text-white py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-400/60 transition-all backdrop-blur-sm"
                style={{ boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.2)" }}
              />
            </div>
            <div>
              <label htmlFor="surname" className="block text-sm font-medium text-gray-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                name="surname"
                id="surname"
                value={formData.surname}
                onChange={handleChange}
                className="w-full rounded-xl bg-gray-700/40 border border-gray-600/40 text-white py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-400/60 transition-all backdrop-blur-sm"
                style={{ boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.2)" }}
              />
            </div>
          </div>
        </motion.div>

        {/* Contact & Location */}
        <motion.div 
          className="bg-gray-800/50 p-6 rounded-xl border border-yellow-500/10"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <h3 className="text-lg font-medium text-white mb-4 flex items-center">
            <FaPhone className="mr-2 text-yellow-400" /> Contact & Location
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                id="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 555-5555"
                className="w-full rounded-xl bg-gray-700/40 border border-gray-600/40 text-white py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-400/60 transition-all backdrop-blur-sm"
                style={{ boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.2)" }}
              />
              {formData.phone && (
                <div className="mt-2 flex items-center">
                  <div className="flex-shrink-0">
                    <span className={`inline-flex h-4 w-4 rounded-full ${user?.phoneVerified ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                  </div>
                  <p className="ml-2 text-xs text-gray-500">
                    {user?.phoneVerified ? 'Verified' : 'Verification required'}
                    {!user?.phoneVerified && formData.phone && (
                      <button type="button" className="ml-2 text-yellow-400 hover:text-yellow-300 text-sm">
                        Verify now
                      </button>
                    )}
                  </p>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-300 mb-2">
                Timezone
              </label>
              <div className="relative">
                <FaGlobe className="absolute left-4 top-1/2 transform -translate-y-1/2 text-yellow-400/70 z-10" />
                <select
                  name="timezone"
                  id="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-gray-700/40 border border-gray-600/40 text-white py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-400/60 transition-all backdrop-blur-sm appearance-none"
                  style={{ boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.2)" }}
                >
                  <option value="">Select timezone</option>
                  {timezones.map(zone => (
                    <option key={zone} value={zone} className="bg-gray-800 text-white">
                      {zone.replace('_', ' ')}
                    </option>
                  ))}
                </select>
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
                Save Changes
              </>
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

export default BasicProfileSettings;
