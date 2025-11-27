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

  // ✅ Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(2)} KB`;
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

      // ✅ iOS Native Share (Best UX)
      if (canUseWebShare()) {
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          const file = new File([blob], fileName, { type: "application/pdf" });

          await navigator.share({
            title: fileName,
            text: "Download PDF",
            files: [file],
          });
          return;
        } catch (shareError: any) {
          // If share is cancelled or fails, fall through to next method
          if (shareError.name !== "AbortError") {
            console.log("Share failed, trying alternative method:", shareError);
          }
        }
      }

      // ✅ iOS Fallback: Direct link with download attribute
      if (isIOS()) {
        const link = document.createElement("a");
        link.href = finalDownloadUrl;
        link.download = fileName;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        
        // iOS requires link to be in DOM
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
        }, 100);
      } else {
        // ✅ Desktop/Android: Blob method
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up blob URL
        window.URL.revokeObjectURL(blobUrl);
      }
    } catch (error) {
      console.error("Download failed:", error);
      // Final fallback: Open in new tab
      window.open(url, "_blank", "noopener,noreferrer");
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
          <span>{isIOS() ? "Save" : "Download"}</span>
        </motion.button>
      </div>

      {/* iOS-specific hint */}
      {isIOS() && (
        <div className="text-xs text-gray-400 text-center mt-2 px-2">
          💡 Tap "Save" to download or share this PDF
        </div>
      )}
    </motion.div>
  );
};