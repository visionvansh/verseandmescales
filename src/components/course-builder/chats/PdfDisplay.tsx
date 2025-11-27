// components/course-builder/chats/PdfDisplay.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaFilePdf, FaDownload, FaSpinner, FaExternalLinkAlt, FaEye } from "react-icons/fa";
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
  const [opening, setOpening] = useState(false);

  // Enhanced iOS/Safari detection
  const isIOS = () => {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  };

  const isSafari = () => {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('safari') && !ua.includes('chrome') && !ua.includes('android');
  };

  // iOS-specific download handler
  const handleIOSDownload = async (sourceUrl: string): Promise<boolean> => {
    try {
      console.log('📱 iOS download initiated');

      const link = document.createElement('a');
      const proxyUrl = `/api/download-pdf?url=${encodeURIComponent(sourceUrl)}&filename=${encodeURIComponent(fileName)}&ios=true`;
      
      link.href = proxyUrl;
      link.download = fileName;
      link.setAttribute('download', fileName);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
      }, 500);

      toast.success('PDF will open in a new tab. Tap the share button to save it.', {
        duration: 5000,
        icon: '📱',
      });

      return true;
    } catch (error) {
      console.error('iOS download error:', error);
      return false;
    }
  };

  // Safari desktop download handler
  const handleSafariDesktopDownload = async (sourceUrl: string): Promise<boolean> => {
    try {
      const proxyUrl = `/api/download-pdf?url=${encodeURIComponent(sourceUrl)}&filename=${encodeURIComponent(fileName)}`;
      console.log('🖥️ Safari desktop download via proxy');

      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Empty file received');
      }

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 100);

      return true;
    } catch (error) {
      console.error('Safari desktop download error:', error);
      return false;
    }
  };

  // Standard browser download
  const handleStandardDownload = async (sourceUrl: string): Promise<boolean> => {
    try {
      let finalUrl = sourceUrl;
      if (sourceUrl.includes('cloudinary.com') && !sourceUrl.includes('fl_attachment')) {
        const encodedFilename = encodeURIComponent(fileName);
        finalUrl = sourceUrl.replace(
          '/upload/',
          `/upload/fl_attachment:${encodedFilename}/`
        );
      }

      const response = await fetch(finalUrl);

      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 100);

      return true;
    } catch (error) {
      console.warn('Standard download error:', error);
      return false;
    }
  };

  // Main download handler
  const handleDownload = async () => {
    if (downloading) return;

    setDownloading(true);

    try {
      const sourceUrl = downloadUrl || url;
      
      console.log('📥 Download initiated:', {
        isIOS: isIOS(),
        isSafari: isSafari(),
        url: sourceUrl.substring(0, 50) + '...'
      });

      let success = false;

      if (isIOS()) {
        success = await handleIOSDownload(sourceUrl);
      } else if (isSafari()) {
        success = await handleSafariDesktopDownload(sourceUrl);
      } else {
        success = await handleStandardDownload(sourceUrl);
      }

      if (!success) {
        throw new Error('Download method failed');
      }

      toast.success('PDF downloaded successfully!');

    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Open/Preview handler
  const handleOpen = () => {
    if (opening) return;
    
    setOpening(true);
    try {
      window.open(url, "_blank", "noopener,noreferrer");
      toast.success('Opening PDF in new tab...');
    } catch (error) {
      console.error('Open failed:', error);
      toast.error('Failed to open PDF. Please try again.');
    } finally {
      setTimeout(() => setOpening(false), 1000);
    }
  };

  return (
    <div className="pdf-display-wrapper">
      {/* Header */}
      <div className="pdf-header-modern">
        {/* Icon */}
        <div className="pdf-icon-modern">
          <div className="pdf-icon-bg" />
          <span className="pdf-icon-emoji">📄</span>
        </div>

        {/* Info */}
        <div className="pdf-info-modern">
          <div className="pdf-filename-modern" title={fileName}>
            {fileName}
          </div>
          <div className="pdf-meta-modern">
            <span className="pdf-badge">PDF Document</span>
            <span className="pdf-provider">PDF File</span>
          </div>
        </div>

        {/* PDF Logo */}
        <div className="pdf-logo">
          <FaFilePdf className="text-2xl" />
        </div>
      </div>

      {/* Mobile Preview (thumbnail/placeholder) */}
      <div className="pdf-mobile-preview">
        <div className="pdf-thumbnail-fallback">
          <FaFilePdf className="pdf-fallback-icon" />
          <p className="pdf-fallback-text">Tap to view PDF</p>
        </div>
        <div className="pdf-thumbnail-overlay">
          <button
            onClick={handleOpen}
            className="pdf-view-button"
          >
            <FaEye />
            <span>View PDF</span>
          </button>
        </div>
      </div>

      {/* Desktop Preview (iframe) */}
      <div className="pdf-desktop-preview">
        <iframe
          src={url}
          className="pdf-iframe-modern"
          title="PDF Preview"
        />
      </div>

      {/* Actions */}
      <div className="pdf-actions-modern">
        <motion.button
          onClick={handleDownload}
          disabled={downloading}
          className={`pdf-action-btn pdf-btn-primary ${
            downloading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          whileHover={{ scale: downloading ? 1 : 1.02 }}
          whileTap={{ scale: downloading ? 1 : 0.98 }}
        >
          {downloading ? (
            <>
              <FaSpinner className="animate-spin" />
              <span>Downloading...</span>
            </>
          ) : (
            <>
              <FaDownload />
              <span>Download Now</span>
            </>
          )}
        </motion.button>

        <motion.button
          onClick={handleOpen}
          disabled={opening}
          className={`pdf-action-btn pdf-btn-secondary ${
            opening ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          whileHover={{ scale: opening ? 1 : 1.02 }}
          whileTap={{ scale: opening ? 1 : 0.98 }}
        >
          {opening ? (
            <>
              <FaSpinner className="animate-spin" />
              <span>Opening...</span>
            </>
          ) : (
            <>
              <FaExternalLinkAlt />
              <span>Open</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};