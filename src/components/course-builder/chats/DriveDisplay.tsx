"use client";

import React, { useMemo } from "react";
import {
  FaGoogleDrive,
  FaDownload,
  FaExternalLinkAlt,
  FaFileAlt,
  FaEye,
} from "react-icons/fa";
import { motion } from "framer-motion";

interface DriveDisplayProps {
  url: string;
  fileName?: string;
}

export const DriveDisplay: React.FC<DriveDisplayProps> = ({
  url,
  fileName,
}) => {
  // Extract Drive file ID and type
  const driveInfo = useMemo(() => {
    const patterns = [
      {
        regex: /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
        type: "file",
        fileIdIndex: 1,
      },
      {
        regex: /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
        type: "file",
        fileIdIndex: 1,
      },
      {
        regex:
          /docs\.google\.com\/(document|spreadsheets|presentation|forms)\/d\/([a-zA-Z0-9_-]+)/,
        type: null,
        fileIdIndex: 2,
        typeIndex: 1,
      },
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern.regex);
      if (match) {
        return {
          fileId: match[pattern.fileIdIndex],
          type: pattern.typeIndex ? match[pattern.typeIndex] : pattern.type,
          isValid: true,
        };
      }
    }

    return { fileId: null, type: null, isValid: false };
  }, [url]);

  const getFileTypeInfo = (type: string) => {
    const types: Record<string, { icon: string; label: string }> = {
      document: { icon: "📄", label: "Google Doc" },
      spreadsheets: { icon: "📊", label: "Google Sheet" },
      presentation: { icon: "📽️", label: "Google Slides" },
      forms: { icon: "📋", label: "Google Form" },
      file: { icon: "📁", label: "Google Drive File" },
    };

    return types[type] || types.file;
  };

  const typeInfo = getFileTypeInfo(driveInfo.type || "file");

  const handleDownload = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handlePreview = () => {
    if (driveInfo.fileId && driveInfo.type === "file") {
      const previewUrl = `https://drive.google.com/file/d/${driveInfo.fileId}/preview`;
      window.open(previewUrl, "_blank", "noopener,noreferrer");
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  if (!driveInfo.isValid) {
    return null;
  }

  return (
    <div className="drive-display-wrapper">
      {/* Header */}
      <div className="drive-header-modern">
        {/* Icon */}
        <div className="drive-icon-modern">
          <div className="drive-icon-bg" />
          <span className="drive-icon-emoji">{typeInfo.icon}</span>
        </div>

        {/* Info */}
        <div className="drive-info-modern">
          <div className="drive-filename-modern">
            {fileName || "Google Drive File"}
          </div>
          <div className="drive-meta-modern">
            <span className="drive-badge">{typeInfo.label}</span>
            <span className="drive-provider">Google Drive</span>
          </div>
        </div>

        {/* Google Drive Logo */}
        <div className="drive-logo">
          <FaGoogleDrive className="text-2xl" />
        </div>
      </div>

      {/* Mobile Preview */}
      <div className="drive-mobile-preview">
        <div className="drive-preview-placeholder">
          <FaGoogleDrive className="drive-placeholder-icon" />
          <p className="drive-placeholder-text">Tap to view file</p>
        </div>
        <div className="drive-preview-overlay">
          <button onClick={handlePreview} className="drive-preview-button">
            <FaEye />
            <span>View File</span>
          </button>
        </div>
      </div>

      {/* Desktop Embed Preview */}
      <div className="drive-desktop-preview">
        {driveInfo.fileId && driveInfo.type === "file" ? (
          <iframe
            src={`https://drive.google.com/file/d/${driveInfo.fileId}/preview`}
            className="drive-iframe-modern"
            allow="autoplay"
            title="Google Drive Preview"
          />
        ) : (
          <div className="drive-preview-placeholder-desktop">
            <FaGoogleDrive className="drive-placeholder-icon-desktop" />
            <p className="drive-placeholder-text-desktop">
              {typeInfo.label} - Click to open
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="drive-actions-modern">
        <motion.button
          onClick={handleDownload}
          className="drive-action-btn drive-btn-primary"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FaDownload />
          <span>Download Now</span>
        </motion.button>

        <motion.button
          onClick={handlePreview}
          className="drive-action-btn drive-btn-secondary"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FaExternalLinkAlt />
          <span>Open</span>
        </motion.button>
      </div>
    </div>
  );
};