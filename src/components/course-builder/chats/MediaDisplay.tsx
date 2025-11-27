"use client";

import React, { useState } from 'react';
import { FaFilePdf, FaDownload, FaExternalLinkAlt, FaTimes, FaFileAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { DriveDisplay } from './DriveDisplay';

interface MediaDisplayProps {
  url: string;
  type: string;
  fileName?: string;
  thumbnail?: string;
  width?: number;
  height?: number;
}

// ✅ ADD DRIVE LINK DETECTION
function isDriveLink(url: string): boolean {
  const drivePatterns = [
    /drive\.google\.com\/file\/d\//,
    /drive\.google\.com\/open\?id=/,
    /docs\.google\.com\/(document|spreadsheets|presentation|forms)\/d\//,
  ];
  
  return drivePatterns.some(pattern => pattern.test(url));
}

export const MediaDisplay: React.FC<MediaDisplayProps> = ({
  url,
  type,
  fileName,
  thumbnail,
  width,
  height,
}) => {
  const [fullscreen, setFullscreen] = useState(false);

  // ✅ CHECK FOR DRIVE LINK FIRST
  if (isDriveLink(url)) {
    return <DriveDisplay url={url} fileName={fileName} />;
  }

  // Existing media type handling...
  if (type === 'image') {
    return (
      <>
        <div className="media-image-container">
          <img
            src={url}
            alt={fileName || 'Image'}
            className="media-image"
            onClick={() => setFullscreen(true)}
            loading="lazy"
          />
        </div>

        <AnimatePresence>
          {fullscreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="media-fullscreen-overlay"
              onClick={() => setFullscreen(false)}
            >
              <div className="media-fullscreen-container">
                <img
                  src={url}
                  alt={fileName || 'Image'}
                  className="media-fullscreen-image"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={() => setFullscreen(false)}
                  className="media-fullscreen-close"
                >
                  <FaTimes />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  if (type === 'video') {
    return (
      <div className="media-video-container">
        <video
          src={url}
          controls
          className="media-video"
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  if (type === 'application' || type === 'pdf') {
    return (
      <div className="pdf-display-wrapper">
        {/* PDF Header */}
        <div className="pdf-header-modern">
          <div className="pdf-icon-modern">
            <div className="pdf-icon-bg" />
            <FaFilePdf className="pdf-icon-svg" />
          </div>

          <div className="pdf-info-modern">
            <div className="pdf-filename-modern">
              {fileName || 'Document.pdf'}
            </div>
            <div className="pdf-meta-modern">
              <span className="pdf-badge">PDF</span>
              <span className="pdf-size">Document</span>
            </div>
          </div>
        </div>

        {/* Mobile Preview */}
        <div className="pdf-mobile-preview">
          {thumbnail ? (
            <>
              <img
                src={thumbnail}
                alt="PDF Thumbnail"
                className="pdf-thumbnail-img"
              />
              <div className="pdf-thumbnail-overlay">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pdf-view-button"
                >
                  <FaExternalLinkAlt />
                  <span>View PDF</span>
                </a>
              </div>
            </>
          ) : (
            <div className="pdf-thumbnail-fallback">
              <FaFilePdf className="pdf-fallback-icon" />
              <span className="pdf-fallback-text">PDF Document</span>
            </div>
          )}
        </div>

        {/* Desktop iframe */}
        <div className="pdf-preview-modern">
          <iframe
            src={`${url}#toolbar=0`}
            className="pdf-iframe-modern"
            title="PDF Preview"
          />
        </div>

        {/* Actions */}
        <div className="pdf-actions-modern">
          <a
            href={url}
            download={fileName}
            className="pdf-action-btn pdf-btn-primary"
          >
            <FaDownload />
            <span>Download Now</span>
          </a>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="pdf-action-btn pdf-btn-secondary"
          >
            <FaExternalLinkAlt />
            <span>Open</span>
          </a>
        </div>
      </div>
    );
  }

  // Generic file fallback
  return (
    <div className="media-file-card">
      <div className="media-file-icon">
        <FaFileAlt />
      </div>
      <div className="media-file-info">
        <div className="media-file-name">{fileName || 'File'}</div>
        <div className="media-file-size">{type}</div>
      </div>
      <a
        href={url}
        download={fileName}
        className="media-file-download"
      >
        <FaDownload />
      </a>
    </div>
  );
};