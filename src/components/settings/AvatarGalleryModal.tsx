//Volumes/vision/codes/course/my-app/src/components/settings/AvatarGalleryModal.tsx
"use client";
import { useState } from 'react';
import { FaTimes, FaCheck, FaUpload, FaUser } from 'react-icons/fa';
import AvatarGenerator from './AvatarGenerator';
import Image from 'next/image';

interface AvatarGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentAvatarIndex?: number | null;
  customImage?: string | null;
  onSelectAvatar: (avatarIndex: number, style: string) => Promise<void>;
  onUploadCustom: (file: File) => Promise<void>;
}

type AvatarStyle = 'avataaars';

const AvatarGalleryModal = ({
  isOpen,
  onClose,
  userId,
  currentAvatarIndex,
  customImage,
  onSelectAvatar,
  onUploadCustom,
}: AvatarGalleryModalProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(currentAvatarIndex || null);
  const [selectedStyle] = useState<AvatarStyle>('avataaars');
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'generated' | 'upload'>('generated');

  const totalAvatars = 100;
  const avatarIndices = Array.from({ length: totalAvatars }, (_, i) => i);

  const handleSelectAvatar = async (index: number) => {
    setSelectedIndex(index);
    await onSelectAvatar(index, selectedStyle);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      await onUploadCustom(file);
      setActiveTab('generated');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border-2 border-red-500/30 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-red-500/20 bg-gradient-to-r from-red-600/10 to-black">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center">
              <FaUser className="mr-2 text-red-500" />
              Choose Your Avatar
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Select from 100+ unique Avataaars in red & white theme
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-red-500/20 bg-gray-800/50">
          <button
            onClick={() => setActiveTab('generated')}
            className={`flex-1 px-6 py-4 font-medium transition-all ${
              activeTab === 'generated'
                ? 'text-white bg-red-600/20 border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/80'
            }`}
          >
            Avataaars Gallery ({totalAvatars})
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 px-6 py-4 font-medium transition-all ${
              activeTab === 'upload'
                ? 'text-white bg-red-600/20 border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/80'
            }`}
          >
            Upload Custom
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-250px)]">
          {activeTab === 'generated' && (
            <>
              {/* Avatar Grid */}
              <div className="p-6">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
                  {/* Custom Upload Preview */}
                  {customImage && (
                    <div
                      className={`relative cursor-pointer group transition-all ${
                        selectedIndex === -1
                          ? 'scale-110'
                          : 'hover:scale-110'
                      }`}
                      onClick={() => handleSelectAvatar(-1)}
                    >
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-red-500/30">
                        <Image
                          src={customImage}
                          alt="Custom"
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      {selectedIndex === -1 && (
                        <div className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 shadow-lg">
                          <FaCheck className="text-red-600 w-3 h-3" />
                        </div>
                      )}
                      <p className="text-xs text-center mt-1 text-gray-400">Custom</p>
                    </div>
                  )}

                  {/* Generated Avatars */}
                  {avatarIndices.map((index) => (
                    <div
                      key={index}
                      className={`relative cursor-pointer group transition-all ${
                        selectedIndex === index
                          ? 'scale-110'
                          : 'hover:scale-110'
                      }`}
                      onClick={() => handleSelectAvatar(index)}
                    >
                      <AvatarGenerator
                        userId={userId}
                        avatarIndex={index}
                        size={80}
                        style={selectedStyle}
                        className="border-2 border-red-500/30 group-hover:border-red-500/60 transition-all"
                      />
                      {selectedIndex === index && (
                        <div className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 shadow-lg">
                          <FaCheck className="text-red-600 w-3 h-3" />
                        </div>
                      )}
                      <p className="text-xs text-center mt-1 text-gray-400">#{index}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'upload' && (
            <div className="flex flex-col items-center justify-center py-12 p-6">
              <label className="cursor-pointer">
                <div className="w-48 h-48 rounded-full border-4 border-dashed border-red-500/50 hover:border-red-500 transition-all flex flex-col items-center justify-center bg-gray-800/50 hover:bg-gray-800 group">
                  <FaUpload className="w-12 h-12 text-red-500 mb-4 group-hover:scale-110 transition-transform" />
                  <p className="text-white font-medium">
                    {isUploading ? 'Uploading...' : 'Upload Custom Avatar'}
                  </p>
                  <p className="text-xs text-gray-400 mt-2 px-4 text-center">
                    JPG, PNG or GIF (Max 5MB)
                  </p>
                </div>
                <input
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>

              {customImage && (
                <div className="mt-8">
                  <p className="text-sm text-gray-400 mb-4 text-center">Current Custom Image:</p>
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-red-500/30">
                    <Image
                      src={customImage}
                      alt="Current custom"
                      width={128}
                      height={128}
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-red-500/20 bg-gray-800/50">
          <p className="text-sm text-gray-400">
            {selectedIndex !== null && selectedIndex >= 0
              ? `Avatar #${selectedIndex} (Avataaars) selected`
              : selectedIndex === -1
              ? 'Custom image selected'
              : 'No avatar selected'}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarGalleryModal;