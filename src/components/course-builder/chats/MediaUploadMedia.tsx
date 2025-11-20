// components/course-builder/chats/MediaUploadModal.tsx
"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaImage, FaVideo, FaFilePdf, FaCloudUploadAlt, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (mediaData: MediaData) => void;
  roomId: string;
}

export interface MediaData {
  url: string;
  publicId: string;
  type: 'image' | 'video' | 'pdf';
  fileName: string;
  fileSize: number;
  width?: number;
  height?: number;
  duration?: number;
  thumbnail?: string;
}

export const MediaUploadModal: React.FC<MediaUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadComplete,
  roomId,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    const validTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'application/pdf'
    ];

    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Only images, videos, and PDFs are allowed.');
      return;
    }

    // Validate file size
    const maxSize = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    setSelectedFile(file);

    // Generate preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      const videoUrl = URL.createObjectURL(file);
      setPreview(videoUrl);
    } else {
      setPreview(null); // PDF
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('roomId', roomId);

      const response = await fetch('/api/chat/upload-media', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      
      toast.success('Upload successful! 🎉');
      onUploadComplete(data.media);
      handleClose();

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setUploadProgress(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FaCloudUploadAlt className="text-red-500" />
              Upload Media
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors p-2"
              disabled={uploading}
            >
              <FaTimes />
            </button>
          </div>

          {/* Upload Area */}
          {!selectedFile ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragActive
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-gray-700 hover:border-red-500/50'
              }`}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-4">
                  <FaImage className="text-4xl text-gray-500" />
                  <FaVideo className="text-4xl text-gray-500" />
                  <FaFilePdf className="text-4xl text-gray-500" />
                </div>
                <p className="text-gray-400 text-lg">
                  Drag & drop or click to upload
                </p>
                <p className="text-gray-500 text-sm">
                  Supports: Images, Videos, PDFs (max 100MB)
                </p>
                <label className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl cursor-pointer transition-colors">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,video/*,application/pdf"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />
                  Choose File
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="bg-gray-800 rounded-xl p-4">
                {preview && selectedFile.type.startsWith('image/') && (
                  <img src={preview} alt="Preview" className="w-full h-64 object-contain rounded-lg" />
                )}
                {preview && selectedFile.type.startsWith('video/') && (
                  <video src={preview} controls className="w-full h-64 rounded-lg" />
                )}
                {selectedFile.type === 'application/pdf' && (
                  <div className="flex items-center justify-center h-64">
                    <FaFilePdf className="text-6xl text-red-500" />
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-white font-semibold truncate">{selectedFile.name}</p>
                <p className="text-gray-400 text-sm">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-center text-gray-400 text-sm">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
                  disabled={uploading}
                >
                  Change File
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FaCloudUploadAlt />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};