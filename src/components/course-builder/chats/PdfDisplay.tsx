"use client";

import React from "react";
import { motion } from "framer-motion";
import { FaFilePdf, FaDownload, FaExternalLinkAlt } from "react-icons/fa";

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
  // ✅ Detect iOS devices (including iPad on iOS 13+)
  const isIOS = () => {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  };

  // ✅ Detect if Web Share API is supported
  const canUseWebShare = () => {
    return 'share' in navigator && typeof navigator.share === 'function' && isIOS();
  };

  // ✅ FIXED: iOS-compatible download handler
  const handleDownload = async () => {
    try {
      // Generate download URL with Cloudinary attachment flag
      let finalDownloadUrl = downloadUrl;
      
      if (!finalDownloadUrl && url.includes("cloudinary.com")) {
        // Add fl_attachment flag to force download
        finalDownloadUrl = url.replace(
          "/upload/",
          `/upload/fl_attachment:${encodeURIComponent(fileName)}/`
        );
      } else if (!finalDownloadUrl) {
        finalDownloadUrl = url;
      }

      // ✅ iOS: Use Web Share API with URL (not blob)
      if (canUseWebShare()) {
        try {
          // iOS Safari works better with URL sharing for PDFs
          await navigator.share({
            title: fileName,
            text: "Download PDF",
            url: finalDownloadUrl, // ✅ Share URL directly instead of file blob
          });
          return; // Success!
        } catch (shareError: any) {
          console.log("Share failed:", shareError);
          // If share is cancelled (AbortError), don't show error
          if (shareError.name === "AbortError") {
            return; // User cancelled, that's okay
          }
          // Otherwise, fall through to next method
        }
      }

      // ✅ iOS Fallback: Open PDF in new tab (iOS will show native save/share options)
      if (isIOS()) {
        // iOS Safari will automatically show download/share options
        const newWindow = window.open(finalDownloadUrl, "_blank", "noopener,noreferrer");
        
        if (!newWindow) {
          // Pop-up blocked, try direct navigation
          window.location.href = finalDownloadUrl;
        }
        return;
      }

      // ✅ Desktop/Android: Blob download method
      const response = await fetch(finalDownloadUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 100);

    } catch (error) {
      console.error("Download failed:", error);
      // Final fallback: Open in new tab
      const urlToOpen = downloadUrl || url;
      window.open(urlToOpen, "_blank", "noopener,noreferrer");
    }
  };

  const handleOpenInNewTab = () => {
    window.open(url, "_blank", "noopener,noreferrer");
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

      {/* Action Buttons */}
      <div className="pdf-actions-modern">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleOpenInNewTab}
          className="pdf-action-btn pdf-btn-primary"
        >
          <FaExternalLinkAlt />
          <span>Open</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleDownload}
          className="pdf-action-btn pdf-btn-secondary"
        >
          <FaDownload />
          <span>{isIOS() ? "Share" : "Download"}</span>
        </motion.button>
      </div>

      {/* iOS-specific hint */}
      {isIOS() && (
        <div className="text-xs text-gray-400 text-center mt-2 px-2">
          💡 Tap "Share" to save or share this PDF
        </div>
      )}
    </motion.div>
  );
};