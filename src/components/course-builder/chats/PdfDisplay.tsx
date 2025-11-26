"use client";

import React from "react";
import { motion } from "framer-motion";
import { FaFilePdf, FaDownload, FaExternalLinkAlt } from "react-icons/fa";

interface PdfDisplayProps {
  url: string;
  fileName?: string;
  fileSize?: number;
  thumbnail?: string;
}

export const PdfDisplay: React.FC<PdfDisplayProps> = ({
  url,
  fileName = "Document.pdf",
  fileSize,
}) => {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(2)} KB`;
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(url, "_blank");
    }
  };

  const handleOpenInNewTab = () => {
    window.open(url, "_blank");
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
            <span className="pdf-size">{formatFileSize(fileSize)}</span>
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
          <span>Download</span>
        </motion.button>
      </div>
    </motion.div>
  );
};