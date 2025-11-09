"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaSpinner, FaExclamationTriangle, FaClock } from 'react-icons/fa';

interface AutoSaveStatusProps {
  isSaving: boolean;
  lastSaved: Date | null;
  saveError: string | null;
  hasUnsavedChanges: boolean;
  className?: string;
}

const AutoSaveStatus: React.FC<AutoSaveStatusProps> = ({
  isSaving,
  lastSaved,
  saveError,
  hasUnsavedChanges,
  className = '',
}) => {
  const getTimeSinceLastSave = () => {
    if (!lastSaved) return null;
    
    const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <AnimatePresence mode="wait">
        {isSaving ? (
          <motion.div
            key="saving"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 text-blue-400 text-sm"
          >
            <FaSpinner className="animate-spin" />
            <span>Saving...</span>
          </motion.div>
        ) : saveError ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 text-red-400 text-sm"
          >
            <FaExclamationTriangle />
            <span>Save failed</span>
          </motion.div>
        ) : hasUnsavedChanges ? (
          <motion.div
            key="unsaved"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 text-yellow-400 text-sm"
          >
            <FaClock />
            <span>Unsaved changes</span>
          </motion.div>
        ) : lastSaved ? (
          <motion.div
            key="saved"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 text-green-400 text-sm"
          >
            <FaCheckCircle />
            <span>Saved {getTimeSinceLastSave()}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default AutoSaveStatus;