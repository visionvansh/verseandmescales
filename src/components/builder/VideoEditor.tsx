// components/builder/VideoEditor.tsx
'use client';

import React, { useState, useRef } from 'react';
import { FaVideo, FaPlay, FaEye, FaClock, FaCheckCircle, FaUpload, FaSpinner, FaFileVideo, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoEditorProps {
  enabled: boolean;
  url: string;
  title: string;
  description: string;
  duration: string;
  thumbnail?: string;
  onChange: (data: {
    enabled: boolean;
    url: string;
    title: string;
    description: string;
    duration: string;
    thumbnail?: string;
  }) => void;
  showPreview?: boolean;
}

const VideoEditor: React.FC<VideoEditorProps> = ({
  enabled,
  url,
  title,
  description,
  duration,
  thumbnail,
  onChange,
  showPreview = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = (field: string, value: any) => {
    const newData = {
      enabled: true, // Always enabled
      url,
      title,
      description,
      duration,
      thumbnail,
      [field]: value,
    };
    console.log('Updating video field:', field, value, newData); // Debug log
    onChange(newData);
  };

  // Format seconds to MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Extract video thumbnail and metadata
  const extractVideoData = (file: File): Promise<{ duration: string; thumbnail: string }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      
      let hasResolved = false;
      
      const timeout = setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          URL.revokeObjectURL(video.src);
          reject(new Error('Metadata extraction timeout'));
        }
      }, 15000);

      video.onloadedmetadata = () => {
        if (!hasResolved) {
          console.log('Video metadata loaded, duration:', video.duration); // Debug
          // Seek to 2 seconds or 10% of video for better thumbnail
          const seekTime = Math.min(2, video.duration * 0.1);
          video.currentTime = seekTime;
        }
      };

      video.onseeked = () => {
        if (!hasResolved) {
          hasResolved = true;
          clearTimeout(timeout);
          
          try {
            // Create canvas to capture thumbnail
            const canvas = document.createElement('canvas');
            canvas.width = 1280;
            canvas.height = 720;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
              const durationFormatted = formatDuration(video.duration);
              
              console.log('Extracted duration:', durationFormatted); // Debug
              console.log('Generated thumbnail'); // Debug
              
              URL.revokeObjectURL(video.src);
              resolve({ duration: durationFormatted, thumbnail: thumbnailDataUrl });
            } else {
              throw new Error('Could not create canvas context');
            }
          } catch (error) {
            URL.revokeObjectURL(video.src);
            reject(error);
          }
        }
      };

      video.onerror = (e) => {
        if (!hasResolved) {
          hasResolved = true;
          clearTimeout(timeout);
          URL.revokeObjectURL(video.src);
          reject(new Error('Failed to load video'));
        }
      };

      try {
        video.src = URL.createObjectURL(file);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  };

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file');
      return;
    }

    // Validate file size (500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Video file is too large. Maximum size is 500MB');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      console.log('Starting video processing...'); // Debug

      // Extract metadata and thumbnail FIRST
      let extractedDuration = '';
      let extractedThumbnail = '';
      
      try {
        const videoData = await extractVideoData(file);
        extractedDuration = videoData.duration;
        extractedThumbnail = videoData.thumbnail;
        console.log('Video data extracted:', videoData); // Debug
        
        // Update immediately
        onChange({
          enabled: true,
          url,
          title,
          description,
          duration: extractedDuration,
          thumbnail: extractedThumbnail,
        });
      } catch (metadataError) {
        console.warn('Could not extract video metadata:', metadataError);
      }

      // Upload to Cloudinary
      const uploadedUrl = await uploadToCloudinary(file, (progress) => {
        setUploadProgress(progress);
      });

      console.log('Video uploaded:', uploadedUrl); // Debug

      // Auto-fill title from filename if empty
      let autoTitle = title;
      if (!title) {
        const fileName = file.name.replace(/\.[^/.]+$/, '');
        autoTitle = fileName
          .replace(/[_-]/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());
      }

      // Update all fields together
      onChange({
        enabled: true,
        url: uploadedUrl,
        title: autoTitle,
        description,
        duration: extractedDuration,
        thumbnail: extractedThumbnail,
      });

      console.log('Upload complete!'); // Debug

    } catch (error) {
      console.error('Error uploading video:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to upload video: ${errorMessage}
Please check your configuration and try again.`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Upload video directly to Cloudinary
  const uploadToCloudinary = async (
    file: File,
    onProgress: (progress: number) => void
  ): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error('Configuration missing. Please add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to your .env.local file.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('resource_type', 'video');
    formData.append('folder', 'course-videos');

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.secure_url) {
              resolve(response.secure_url);
            } else {
              reject(new Error('No URL returned from upload'));
            }
          } catch (error) {
            reject(new Error('Failed to parse upload response'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.error?.message || `Upload failed with status: ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload. Please check your internet connection.'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload was cancelled'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timed out. Please try again.'));
      });

      xhr.timeout = 600000;
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`);
      xhr.send(formData);
    });
  };

  const clearVideo = () => {
    onChange({
      enabled: true,
      url: '',
      title: '',
      description: '',
      duration: '',
      thumbnail: '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Header */}
      <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg lg:text-xl font-black text-white mb-1 truncate">
            Video Section Editor
          </h2>
          <p className="text-gray-400 text-[10px] lg:text-xs">
            Upload a course overview or promotional video
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3 lg:space-y-4"
      >
        {/* Upload Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-2 lg:p-3">
          <h3 className="text-sm lg:text-base font-bold text-white mb-2 lg:mb-3 flex items-center gap-1.5">
            <FaUpload className="text-red-400 text-xs" />
            Upload Video
          </h3>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/mov,video/avi,video/webm,video/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />

          {isUploading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border-2 border-red-500/30 rounded-lg p-3 lg:p-4 text-center"
            >
              <FaSpinner className="animate-spin text-red-500 text-xl lg:text-2xl mx-auto mb-2 lg:mb-3" />
              <p className="text-white font-bold text-xs lg:text-sm mb-2">Uploading...</p>
              <div className="w-full bg-gray-700 rounded-full h-1.5 lg:h-2 mb-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full transition-all duration-300"
                />
              </div>
              <p className="text-gray-400 text-[10px] lg:text-xs font-bold">{Math.round(uploadProgress)}%</p>
              <p className="text-gray-500 text-[9px] lg:text-[10px] mt-2">
                {uploadProgress < 30 && "Starting upload..."}
                {uploadProgress >= 30 && uploadProgress < 70 && "Uploading your video..."}
                {uploadProgress >= 70 && uploadProgress < 100 && "Almost done..."}
                {uploadProgress === 100 && "Processing..."}
              </p>
            </motion.div>
          ) : url ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border-2 border-green-500/30 bg-green-900/10 rounded-lg p-2 lg:p-3"
            >
              <div className="flex items-start gap-2">
                {thumbnail && (
                  <div className="w-24 h-16 lg:w-32 lg:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-black border border-green-500/30">
                    <img src={thumbnail} alt="Video thumbnail" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-bold text-xs lg:text-sm mb-1">✅ Video Ready!</h4>
                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    <div className="flex items-center gap-1 text-green-400 text-[9px] lg:text-[10px]">
                      <FaCheckCircle className="text-[8px]" />
                      <span>Video uploaded</span>
                    </div>
                    {duration && (
                      <div className="flex items-center gap-1 text-gray-400 text-[9px] lg:text-[10px]">
                        <FaClock className="text-[8px]" />
                        <span>{duration}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 lg:px-3 py-1.5 lg:py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold text-[10px] lg:text-xs transition-colors"
                    >
                      Replace Video
                    </button>
                    <button
                      onClick={clearVideo}
                      className="px-2 lg:px-3 py-1.5 lg:py-2 bg-red-600/20 border border-red-500/30 hover:bg-red-600 rounded-lg font-bold text-[10px] lg:text-xs transition-colors flex items-center gap-1"
                    >
                      <FaTimes className="text-[9px]" /> Clear
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div 
              className="border-2 border-dashed border-red-500/30 hover:border-red-500/60 rounded-lg p-3 lg:p-4 text-center transition-colors cursor-pointer group"
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-red-600/30 transition-colors">
                <FaFileVideo className="text-red-400 text-base lg:text-xl" />
              </div>
              <p className="text-white font-bold text-xs lg:text-sm mb-1">
                Click to upload video
              </p>
              <p className="text-gray-400 text-[10px] lg:text-xs mb-2 lg:mb-3">
                MP4, MOV, AVI, WebM • Max 500MB • Auto-optimized
              </p>
              <button
                type="button"
                className="px-3 lg:px-4 py-1.5 lg:py-2 bg-gradient-to-r from-red-600 to-red-700 hover:opacity-90 text-white font-bold rounded-lg transition-opacity text-[10px] lg:text-xs inline-flex items-center gap-1.5"
              >
                <FaUpload className="text-[9px]" />
                Choose Video File
              </button>
            </div>
          )}
        </div>

        {/* Video Details */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-2 lg:p-3">
          <h3 className="text-sm lg:text-base font-bold text-white mb-2 lg:mb-3 flex items-center gap-1.5">
            <FaVideo className="text-red-400 text-xs" />
            Video Information
          </h3>

          <div className="space-y-2 lg:space-y-3">
            <div>
              <label className="block text-[10px] lg:text-xs font-bold text-gray-300 mb-1">
                Video Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full px-2 lg:px-3 py-2 lg:py-2.5 bg-gray-800 border-2 border-red-500/30 rounded-lg text-white font-bold text-xs lg:text-sm focus:outline-none focus:border-red-500 transition-colors"
                placeholder="e.g., Course Introduction - What You'll Learn"
                disabled={isUploading}
              />
            </div>

            <div>
              <label className="block text-[10px] lg:text-xs font-bold text-gray-300 mb-1">
                Video Description
              </label>
              <textarea
                value={description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
                className="w-full px-2 lg:px-3 py-2 lg:py-2.5 bg-gray-800 border-2 border-red-500/30 rounded-lg text-white text-xs lg:text-sm leading-relaxed focus:outline-none focus:border-red-500 transition-colors resize-none"
                placeholder="Describe what students will see in this video..."
                disabled={isUploading}
              />
            </div>

            <div>
              <label className="block text-[10px] lg:text-xs font-bold text-gray-300 mb-1">
                Video Duration
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={duration}
                  className="w-full px-2 lg:px-3 py-2 lg:py-2.5 bg-gray-800 border-2 border-green-500/30 rounded-lg text-white text-xs lg:text-sm focus:outline-none transition-colors"
                  placeholder="Auto-detected (e.g., 5:32)"
                  disabled
                  readOnly
                />
                {duration && (
                  <FaCheckCircle className="absolute right-2 lg:right-3 top-1/2 -translate-y-1/2 text-green-400 text-sm" />
                )}
              </div>
              <p className="mt-1 text-[9px] lg:text-[10px] text-gray-400">
                ⚡ Automatically extracted from video
              </p>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        {showPreview && url && (
          <div className="mt-3 lg:mt-4 p-2 lg:p-3 bg-black border-4 border-red-500/60 rounded-lg shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] lg:text-xs font-bold text-gray-400 flex items-center gap-1">
                <FaEye className="text-red-400 text-xs" /> LIVE PREVIEW
              </h3>
            </div>

            <div className="bg-gradient-to-br from-gray-900/90 to-black/95 border-2 border-red-500/40 rounded-lg overflow-hidden backdrop-blur-xl">
              {/* Video Container - Always 16:9 */}
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <video
                  key={url} // Force reload when URL changes
                  src={url}
                  poster={thumbnail}
                  controls
                  className="absolute top-0 left-0 w-full h-full object-contain bg-black"
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>

                {/* Video Info Overlay */}
                {(title || description) && (
                  <div className="absolute bottom-1.5 lg:bottom-2 left-1.5 lg:left-2 right-1.5 lg:right-2 pointer-events-none">
                    <div className="bg-black/80 backdrop-blur-md rounded-md p-1.5 lg:p-2 border border-red-500/30">
                      {title && (
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <FaVideo className="text-red-400 text-xs flex-shrink-0" />
                          <span className="text-white font-bold text-[10px] lg:text-xs truncate">{title}</span>
                        </div>
                      )}
                      {description && (
                        <p className="text-gray-300 text-[9px] lg:text-[10px] line-clamp-2">{description}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Duration Badge */}
                {duration && (
                  <div className="absolute top-1.5 lg:top-2 right-1.5 lg:right-2 pointer-events-none">
                    <div className="bg-black/80 backdrop-blur-md px-1.5 lg:px-2 py-1 rounded-full border border-red-500/30">
                      <span className="text-white font-bold text-[9px] lg:text-[10px] flex items-center gap-1">
                        <FaClock className="text-red-400" />
                        {duration}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats Bar */}
              <div className="bg-gradient-to-r from-gray-900/95 to-black/95 border-t border-red-500/20 px-2 lg:px-3 py-2">
                <div className="flex items-center justify-between text-[9px] lg:text-[10px] flex-wrap gap-1.5">
                  <div className="flex items-center gap-1 text-gray-400">
                    <FaCheckCircle className="text-red-400 text-[10px]" />
                    <span className="hidden xs:inline">15,000+ Students</span>
                    <span className="xs:hidden">15K+ Students</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                    <FaCheckCircle className="text-red-400 text-[10px]" />
                    <span>4.9/5 Rating</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                    <FaCheckCircle className="text-red-400 text-[10px]" />
                    <span className="hidden sm:inline">Proven Results</span>
                    <span className="sm:hidden">Results</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VideoEditor;