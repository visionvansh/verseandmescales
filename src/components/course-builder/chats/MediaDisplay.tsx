// components/course-builder/chats/MediaDisplay.tsx
"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaDownload, FaExpand, FaFile } from 'react-icons/fa';
import { PdfDisplay } from './PdfDisplay';

interface MediaDisplayProps {
  url: string;
  type: 'image' | 'video' | 'pdf' | string;
  fileName?: string;
  fileSize?: number;
  thumbnail?: string;
  width?: number;
  height?: number;
}

export const MediaDisplay: React.FC<MediaDisplayProps> = ({
  url,
  type,
  fileName,
  fileSize,
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

  console.log('✅ MediaDisplay rendering:', { url, type, fileName, fileSize });

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
      window.open(url, '_blank');
    }
  };

  // ✅ IMAGE DISPLAY
  if (type === 'image' || type.startsWith('image/')) {
    return (
      <>
        <div className="media-image-container group">
          <img
            src={url}
            alt={fileName || 'Image'}
            className="media-image"
            onClick={() => setIsFullscreen(true)}
            loading="lazy"
          />
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFullscreen(true)}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
            >
              <FaExpand className="text-white" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDownload}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
            >
              <FaDownload className="text-white" />
            </motion.button>
          </div>
        </div>

        {/* Fullscreen Modal */}
        <AnimatePresence>
          {isFullscreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="media-fullscreen-overlay"
              onClick={() => setIsFullscreen(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="media-fullscreen-container"
              >
                <img 
                  src={url} 
                  alt={fileName || 'Image'} 
                  className="media-fullscreen-image" 
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsFullscreen(false)}
                  className="media-fullscreen-close"
                >
                  <FaTimes className="text-xl" />
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // ✅ VIDEO DISPLAY
  if (type === 'video' || type.startsWith('video/')) {
    return (
      <div className="media-video-container group relative">
        <video
          src={url}
          controls
          poster={thumbnail}
          className="media-video"
          preload="metadata"
        >
          Your browser does not support video playback.
        </video>
        
        {/* Download Button Overlay */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleDownload}
          className="absolute top-4 right-4 p-3 bg-black/50 backdrop-blur-sm rounded-lg hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
        >
          <FaDownload className="text-white" />
        </motion.button>
      </div>
    );
  }

  // ✅ PDF DISPLAY - USE NEW COMPONENT
  if (type === 'pdf' || type === 'application/pdf') {
    return (
      <PdfDisplay
        url={url}
        fileName={fileName}
        fileSize={fileSize}
        thumbnail={thumbnail}
      />
    );
  }

  // ✅ GENERIC FILE DISPLAY (for other file types)
  return (
    <div className="media-file-card">
      <div className="media-file-icon">
        <FaFile />
      </div>
      <div className="media-file-info">
        <div className="media-file-name">{fileName || 'File'}</div>
        {fileSize && (
          <div className="media-file-size">
            {(fileSize / 1024).toFixed(2)} KB
          </div>
        )}
      </div>
      <a
        href={url}
        download={fileName}
        className="media-file-download"
        target="_blank"
        rel="noopener noreferrer"
      >
        <FaDownload />
      </a>
    </div>
  );
};