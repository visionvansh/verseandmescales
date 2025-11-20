// components/course-builder/chats/MediaDisplay.tsx
"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaDownload, FaExpand, FaFilePdf } from 'react-icons/fa';

interface MediaDisplayProps {
  url: string;
  type: 'image' | 'video' | 'pdf';
  fileName?: string;
  thumbnail?: string;
  width?: number;
  height?: number;
}

export const MediaDisplay: React.FC<MediaDisplayProps> = ({
  url,
  type,
  fileName,
  thumbnail,
  width,
  height,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ✅ EARLY RETURN: If no URL, don't render anything
  if (!url) {
    console.error('❌ MediaDisplay: No URL provided');
    return null;
  }

  // ✅ VALIDATE TYPE
  if (!['image', 'video', 'pdf'].includes(type)) {
    console.error('❌ MediaDisplay: Invalid type:', type);
    return null;
  }

  console.log('✅ MediaDisplay rendering:', { url, type, fileName });

  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (type === 'image') {
    return (
      <>
        <div className="relative group">
          <img
            src={url}
            alt={fileName}
            className="max-w-full max-h-96 rounded-xl cursor-pointer"
            onClick={() => setIsFullscreen(true)}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
            <button
              onClick={() => setIsFullscreen(true)}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
            >
              <FaExpand className="text-white" />
            </button>
            <button
              onClick={handleDownload}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
            >
              <FaDownload className="text-white" />
            </button>
          </div>
        </div>

        {/* Fullscreen Modal */}
        <AnimatePresence>
          {isFullscreen && (
            <div
              className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4"
              onClick={() => setIsFullscreen(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-7xl max-h-[90vh]"
              >
                <img src={url} alt={fileName} className="max-w-full max-h-[90vh] object-contain" />
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="absolute top-4 right-4 p-3 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
                >
                  <FaTimes className="text-white text-xl" />
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </>
    );
  }

  if (type === 'video') {
    return (
      <div className="relative group">
        <video
          src={url}
          controls
          poster={thumbnail}
          className="max-w-full max-h-96 rounded-xl"
        />
        <button
          onClick={handleDownload}
          className="absolute top-4 right-4 p-3 bg-black/50 backdrop-blur-sm rounded-lg hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
        >
          <FaDownload className="text-white" />
        </button>
      </div>
    );
  }

  if (type === 'pdf') {
    return (
      <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-4">
        <FaFilePdf className="text-4xl text-red-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold truncate">{fileName}</p>
          <p className="text-gray-400 text-sm">PDF Document</p>
        </div>
        <div className="flex gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
          >
            View
          </a>
          <button
            onClick={handleDownload}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <FaDownload className="text-white" />
          </button>
        </div>
      </div>
    );
  }

  return null;
};