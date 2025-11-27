// components/course-builder/chats/PdfDisplay.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaFilePdf, FaDownload, FaSpinner } from "react-icons/fa";
import { toast } from "react-hot-toast";

interface PdfDisplayProps {
  url: string;
  downloadUrl?: string;
  fileName?: string;
  thumbnail?: string;
}

export const PdfDisplay: React.FC<PdfDisplayProps> = ({
  url,
  downloadUrl,
  fileName = "Document.pdf",
}) => {
  const [downloading, setDownloading] = useState(false);

  // ✅ Detect iOS devices
  const isIOS = () => {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  };

  // ✅ Secure download handler - works on ALL devices
  const handleDownload = async () => {
    if (downloading) return;

    setDownloading(true);
    
    try {
      // Use proxy API to hide Cloudinary URL and force download
      const downloadApiUrl = `/api/download-pdf?url=${encodeURIComponent(
        downloadUrl || url
      )}&filename=${encodeURIComponent(fileName)}`;

      if (isIOS()) {
        // ✅ iOS-specific handling
        const response = await fetch(downloadApiUrl);
        
        if (!response.ok) {
          throw new Error('Download failed');
        }

        const blob = await response.blob();
        
        // Create object URL
        const blobUrl = URL.createObjectURL(blob);
        
        // Create and trigger download
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        link.style.display = 'none';
        
        // iOS requires the link to be in the DOM
        document.body.appendChild(link);
        
        // Trigger click
        link.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);
        
        toast.success('PDF downloaded successfully!');
      } else {
        // ✅ Desktop/Android - direct download
        const link = document.createElement('a');
        link.href = downloadApiUrl;
        link.download = fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
        }, 100);
        
        toast.success('PDF downloaded successfully!');
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="pdf-display-wrapper"
    >
      {/* PDF Header */}
      <div className="pdf-header-modern">
        <div className="pdf-icon-modern">
          <div className="pdf-icon-bg" />
          <FaFilePdf className="pdf-icon-svg" />
        </div>

        <div className="pdf-info-modern">
          <div className="pdf-filename-modern" title={fileName}>
            {fileName}
          </div>
          <div className="pdf-meta-modern">
            <span className="pdf-badge">PDF</span>
          </div>
        </div>
      </div>

      {/* Download Button - ONLY OPTION */}
      <div className="pdf-actions-modern">
        <motion.button
          whileHover={{ scale: downloading ? 1 : 1.02 }}
          whileTap={{ scale: downloading ? 1 : 0.98 }}
          onClick={handleDownload}
          disabled={downloading}
          className={`pdf-action-btn pdf-btn-primary w-full ${
            downloading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {downloading ? (
            <>
              <FaSpinner className="animate-spin" />
              <span>Downloading...</span>
            </>
          ) : (
            <>
              <FaDownload />
              <span>Download PDF</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Helper text */}
      <div className="text-xs text-gray-400 text-center mt-2 px-2">
        {isIOS() 
          ? '💡 Tap to download - file will be saved to your Downloads'
          : '📥 Click to download PDF to your device'
        }
      </div>
    </motion.div>
  );
};