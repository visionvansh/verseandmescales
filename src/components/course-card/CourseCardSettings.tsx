//Volumes/vision/codes/course/my-app/src/components/course-card/CourseCardSettings.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaImage,
  FaSave,
  FaTimes,
  FaSpinner,
  FaDollarSign,
  FaTag,
} from 'react-icons/fa';
import Image from 'next/image';

interface CourseCardSettingsProps {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface CardSettings {
  title: string;
  description: string;
  thumbnail: string;
  price: string;
  salePrice: string;
}

export default function CourseCardSettings({
  courseId,
  isOpen,
  onClose,
  onSave,
}: CourseCardSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settings, setSettings] = useState<CardSettings>({
    title: '',
    description: '',
    thumbnail: '',
    price: '',
    salePrice: '',
  });

  useEffect(() => {
    if (isOpen && courseId) {
      fetchSettings();
    }
  }, [isOpen, courseId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/course/card-settings?courseId=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setSettings({
          title: data.title || '',
          description: data.description || '',
          thumbnail: data.thumbnail || '',
          price: data.price || '',
          salePrice: data.salePrice || '',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate 16:9 aspect ratio
    const img = document.createElement('img');
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = async () => {
      const aspectRatio = img.width / img.height;
      const isValid16x9 = Math.abs(aspectRatio - 16/9) < 0.1;

      if (!isValid16x9) {
        alert('Please upload an image with 16:9 aspect ratio (e.g., 1920x1080)');
        URL.revokeObjectURL(objectUrl);
        return;
      }

      try {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
        formData.append('folder', 'course-thumbnails');

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSettings(prev => ({ ...prev, thumbnail: data.secure_url }));
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload thumbnail');
      } finally {
        setUploading(false);
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.src = objectUrl;
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/course/card-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          ...settings,
        }),
      });

      if (response.ok) {
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gradient-to-br from-gray-900 to-black border border-red-500/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-xl border-b border-red-500/20 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-black text-white">
            Course Card <span className="text-red-500">Settings</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <FaTimes className="text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Thumbnail Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              <FaImage className="inline mr-2 text-red-500" />
              Course Thumbnail (16:9 ratio)
            </label>
            
            {settings.thumbnail ? (
              <div className="relative aspect-video rounded-xl overflow-hidden border border-red-500/30 group">
                <Image
                  src={settings.thumbnail}
                  alt="Course thumbnail"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <label className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer font-semibold text-sm">
                    Change
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, thumbnail: '' }))}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="block aspect-video rounded-xl border-2 border-dashed border-red-500/30 hover:border-red-500/60 transition-colors cursor-pointer">
                <div className="h-full flex flex-col items-center justify-center gap-3">
                  {uploading ? (
                    <>
                      <FaSpinner className="text-4xl text-red-500 animate-spin" />
                      <p className="text-gray-400 font-semibold">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <FaImage className="text-4xl text-gray-600" />
                      <p className="text-gray-400 font-semibold">Click to upload thumbnail</p>
                      <p className="text-gray-600 text-sm">Recommended: 1920x1080 (16:9)</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
            <p className="text-xs text-gray-500 mt-2">
              If no thumbnail is uploaded, a default icon will be shown
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Course Title
            </label>
            <input
              type="text"
              value={settings.title}
              onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter course title"
              className="w-full bg-gray-900/50 border border-red-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-red-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Short Description
            </label>
            <textarea
              value={settings.description}
              onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description for the course card"
              rows={3}
              className="w-full bg-gray-900/50 border border-red-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-red-500 focus:outline-none resize-none"
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                <FaDollarSign className="inline mr-2 text-red-500" />
                Price
              </label>
              <input
                type="text"
                value={settings.price}
                onChange={(e) => setSettings(prev => ({ ...prev, price: e.target.value }))}
                placeholder="99"
                className="w-full bg-gray-900/50 border border-red-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                <FaTag className="inline mr-2 text-red-500" />
                Sale Price (Optional)
              </label>
              <input
                type="text"
                value={settings.salePrice}
                onChange={(e) => setSettings(prev => ({ ...prev, salePrice: e.target.value }))}
                placeholder="49"
                className="w-full bg-gray-900/50 border border-red-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-xl border-t border-red-500/20 p-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || uploading}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FaSave />
                Save Settings
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}