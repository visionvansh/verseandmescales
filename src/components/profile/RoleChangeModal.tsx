// components/profile/RoleChangeModal.tsx (NEW FILE)
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaGraduationCap, FaChalkboardTeacher, FaUserGraduate, FaExclamationTriangle } from "react-icons/fa";

interface RoleChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: 'learn' | 'teach' | 'both';
  onChangeRole: (newRole: 'learn' | 'teach' | 'both') => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export default function RoleChangeModal({
  isOpen,
  onClose,
  currentRole,
  onChangeRole,
  isLoading,
  error
}: RoleChangeModalProps) {
  
  const roles = [
    {
      value: 'learn' as const,
      label: 'Learner',
      icon: FaGraduationCap,
      description: 'Focus on learning from courses',
      color: 'from-blue-600 to-blue-800'
    },
    {
      value: 'teach' as const,
      label: 'Tutor',
      icon: FaChalkboardTeacher,
      description: 'Create and teach courses',
      color: 'from-purple-600 to-purple-800'
    },
    {
      value: 'both' as const,
      label: 'Tutor & Learner',
      icon: FaUserGraduate,
      description: 'Teach and learn simultaneously',
      color: 'from-red-600 to-red-800'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black rounded-3xl border border-red-500/30" />

              <div className="relative p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-white">
                    Change Role
                  </h2>
                  <motion.button
                    onClick={onClose}
                    className="p-2 rounded-xl bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-800"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FaTimes className="text-xl" />
                  </motion.button>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-xl flex items-start gap-3"
                  >
                    <FaExclamationTriangle className="text-red-500 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  </motion.div>
                )}

                {/* Role Options */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const isCurrentRole = currentRole === role.value;
                    
                    return (
                      <motion.button
                        key={role.value}
                        onClick={() => !isCurrentRole && !isLoading && onChangeRole(role.value)}
                        disabled={isCurrentRole || isLoading}
                        className={`relative p-5 rounded-xl border-2 transition-all ${
                          isCurrentRole
                            ? 'border-green-500 bg-green-600/20 cursor-default'
                            : 'border-red-500/20 bg-gray-900/50 hover:border-red-500/40'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        whileHover={isCurrentRole || isLoading ? {} : { scale: 1.02 }}
                        whileTap={isCurrentRole || isLoading ? {} : { scale: 0.98 }}
                      >
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${role.color} mx-auto mb-3 flex items-center justify-center`}>
                          <Icon className="text-2xl text-white" />
                        </div>
                        
                        <h3 className="text-white font-bold mb-2">{role.label}</h3>
                        <p className="text-gray-400 text-xs">{role.description}</p>
                        
                        {isCurrentRole && (
                          <div className="absolute top-3 right-3 bg-green-500 rounded-full p-1">
                            <FaGraduationCap className="text-white text-xs" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
                  <p className="text-blue-300 text-sm">
                    <strong>Note:</strong> Role changes may be restricted based on your current activity (courses created or joined).
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}