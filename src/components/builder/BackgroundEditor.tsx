//components/builder/BackgroundEditor 
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FaPalette, FaEye, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';

interface BackgroundEditorProps {
  backgroundType: string;
  backgroundColor: string;
  gradientFrom: string;
  gradientTo: string;
  onChange: (data: {
    backgroundType: string;
    backgroundColor: string;
    gradientFrom: string;
    gradientTo: string;
  }) => void;
}

const BackgroundEditor: React.FC<BackgroundEditorProps> = ({
  backgroundType,
  backgroundColor,
  gradientFrom,
  gradientTo,
  onChange,
}) => {
  const backgroundTypes = [
    { 
      id: 'black', 
      label: 'Simple Black', 
      preview: 'bg-black', 
      description: 'Clean solid black',
      detail: 'Perfect for minimal designs'
    },
    { 
      id: 'spotlights', 
      label: 'Red Spotlights', 
      preview: 'bg-gradient-to-br from-red-900/30 via-black to-red-900/20', 
      description: 'Dynamic red accents',
      detail: 'Spotlights + gradients + grid'
    },
  ];

  const currentBg = backgroundTypes.find(t => t.id === backgroundType);

  return (
    <div className="space-y-4 lg:space-y-5">
      {/* Header */}
      <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg lg:text-xl font-black text-white mb-1 truncate">
            Background Settings
          </h2>
          <p className="text-gray-400 text-[10px] lg:text-xs">
            Customize homepage background style
          </p>
        </div>
      </div>

      {/* Background Type Selector */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 lg:p-4">
        <div className="flex items-center justify-between mb-3 lg:mb-4">
          <h3 className="text-sm lg:text-base font-bold text-white flex items-center gap-2">
            <FaPalette className="text-red-400 text-xs" />
            Background Style
          </h3>
          <span className="text-[10px] text-gray-500">
            {backgroundTypes.length} styles
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
          {backgroundTypes.map((type, index) => {
            const isActive = backgroundType === type.id;
            
            return (
              <motion.button
                key={type.id}
                onClick={() =>
                  onChange({
                    backgroundType: type.id,
                    backgroundColor,
                    gradientFrom,
                    gradientTo,
                  })
                }
                className={`relative overflow-hidden rounded-lg lg:rounded-xl border-2 transition-all ${
                  isActive
                    ? 'border-red-500 bg-red-900/20'
                    : 'border-gray-700 bg-gray-800 hover:border-red-500/50 hover:bg-gray-700'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Preview Box */}
                <div className={`h-24 xs:h-28 sm:h-32 lg:h-36 ${type.preview} relative`}>
                  {type.id === 'spotlights' && (
                    <>
                      <div className="absolute top-2 left-2 w-16 h-16 xs:w-20 xs:h-20 bg-red-500/40 rounded-full blur-2xl" />
                      <div className="absolute bottom-2 right-2 w-12 h-12 xs:w-16 xs:h-16 bg-red-500/30 rounded-full blur-xl" />
                      <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-transparent to-black/50" />
                      <div 
                        className="absolute inset-0 opacity-20"
                        style={{
                          backgroundImage: `
                            linear-gradient(rgba(239, 68, 68, 0.3) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(239, 68, 68, 0.3) 1px, transparent 1px)
                          `,
                          backgroundSize: '24px 24px'
                        }}
                      />
                    </>
                  )}
                  
                  {/* Active Badge */}
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"
                    >
                      <FaCheckCircle className="text-[10px]" />
                      <span className="hidden xs:inline">Active</span>
                    </motion.div>
                  )}
                </div>

                {/* Content */}
                <div className={`p-3 lg:p-4 text-left ${isActive ? 'bg-red-900/10' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold text-sm lg:text-base mb-1 truncate ${
                        isActive ? 'text-red-400' : 'text-white'
                      }`}>
                        {type.label}
                      </h4>
                      <p className="text-gray-400 text-[10px] lg:text-xs mb-1">
                        {type.description}
                      </p>
                      <p className="text-gray-500 text-[9px] lg:text-[10px]">
                        {type.detail}
                      </p>
                    </div>
                  </div>

                  {/* Active Indicator */}
                  {isActive && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      className="h-1 bg-gradient-to-r from-red-500 to-red-600 rounded-full mt-2"
                    />
                  )}
                </div>

                {/* Hover Overlay */}
                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-to-t from-red-600/0 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
      
    </div>
  );
};

export default BackgroundEditor;