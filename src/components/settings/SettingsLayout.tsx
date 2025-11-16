"use client";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { FaUser, FaLock, FaLink, FaBolt, FaCheckCircle, FaExclamationTriangle, FaBars, FaChevronLeft } from "react-icons/fa";
import React from "react";

interface SettingsLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
  success?: string | null;
  error?: string | null;
  onClearMessages?: () => void;
  isLoading?: boolean;
  onNavigateToTab?: (section: string) => void; // NEW: Add this prop
}

// Optimized Skeleton Loader Component
const SettingsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 md:gap-7 lg:gap-8">
      {/* Sidebar Skeleton - Desktop Only */}
      <div className="hidden lg:block lg:col-span-3">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-xl sm:rounded-2xl md:rounded-3xl border border-red-500/30 backdrop-blur-2xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-xl sm:rounded-2xl md:rounded-3xl" />
          
          <div className="relative p-4 sm:p-5 md:p-6">
            {/* Title skeleton */}
            <div className="mb-4 sm:mb-5 md:mb-6">
              <div className="h-6 sm:h-7 w-40 sm:w-44 md:w-48 bg-gray-800/40 rounded-lg animate-pulse" />
            </div>
            
            {/* Menu items skeleton */}
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-16 sm:h-20 bg-gray-800/40 rounded-lg sm:rounded-xl animate-pulse"
                  style={{ animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="lg:col-span-9">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-xl sm:rounded-2xl md:rounded-3xl border border-red-500/30 backdrop-blur-2xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-xl sm:rounded-2xl md:rounded-3xl" />
          
          <div className="relative p-5 sm:p-6 md:p-7 lg:p-8 space-y-4 sm:space-y-5 md:space-y-6">
            {/* Section title */}
            <div className="h-7 sm:h-8 w-52 sm:w-56 md:w-64 bg-gray-800/40 rounded-lg animate-pulse" />
            
            {/* Section description */}
            <div className="h-4 sm:h-5 w-80 sm:w-88 md:w-96 bg-gray-800/40 rounded-lg animate-pulse" />
            
            {/* Content cards */}
            <div className="space-y-3 sm:space-y-4 mt-6 sm:mt-7 md:mt-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-40 sm:h-48 bg-gray-800/40 rounded-xl sm:rounded-2xl animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
            
            {/* Form elements skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-6 sm:mt-7 md:mt-8">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-800/40 rounded-lg sm:rounded-xl animate-pulse"
                  style={{ animationDelay: `${(i + 3) * 100}ms` }}
                />
              ))}
            </div>
            
            {/* Bottom action buttons */}
            <div className="flex flex-col xs:flex-row justify-end space-y-3 xs:space-y-0 xs:space-x-4 mt-6 sm:mt-7 md:mt-8 pt-4 sm:pt-5 md:pt-6 border-t border-red-500/20">
              <div className="h-10 sm:h-11 w-full xs:w-32 bg-gray-800/40 rounded-lg animate-pulse" />
              <div className="h-10 sm:h-11 w-full xs:w-40 bg-gray-800/40 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsLayout = ({ 
  children, 
  activeSection, 
  onSectionChange, 
  success, 
  error, 
  onClearMessages,
  isLoading = false,
  onNavigateToTab // NEW: Add this parameter
}: SettingsLayoutProps) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileContent, setShowMobileContent] = useState(false);
  const previousWidthRef = useRef<number>(0);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const settingSections = [
    { id: 'basic', title: 'Basic Info', icon: FaUser, },
    { id: 'privacy', title: 'Privacy', icon: FaLock, },
    
  ];

  // NEW: Create a wrapper function that handles navigation from child components
  const handleNavigateToTab = (sectionId: string) => {
    // Call the parent's onNavigateToTab if provided
    if (onNavigateToTab) {
      onNavigateToTab(sectionId);
    }
    // Also call onSectionChange to update the UI
    onSectionChange(sectionId);
    
    // Close mobile menu if open
    if (showMobileMenu) {
      setShowMobileMenu(false);
      setShowMobileContent(true);
    }
  };

  // Handle section change for mobile
  const handleSectionChange = (sectionId: string) => {
    onSectionChange(sectionId);
    setShowMobileMenu(false);
    setShowMobileContent(true);
  };

  // Handle back to menu on mobile
  const handleBackToMenu = () => {
    setShowMobileContent(false);
    setShowMobileMenu(true);
  };

  // Debounced resize handler
  useEffect(() => {
    const checkMobile = () => {
      const currentWidth = window.innerWidth;
      const previousWidth = previousWidthRef.current;
      
      if (previousWidth === 0) {
        if (currentWidth < 1024) {
          setShowMobileMenu(true);
          setShowMobileContent(false);
        } else {
          setShowMobileMenu(false);
          setShowMobileContent(false);
        }
      } else if (
        (previousWidth >= 1024 && currentWidth < 1024) ||
        (previousWidth < 1024 && currentWidth >= 1024)
      ) {
        if (currentWidth < 1024) {
          setShowMobileMenu(true);
          setShowMobileContent(false);
        } else {
          setShowMobileMenu(false);
          setShowMobileContent(false);
        }
      }
      
      previousWidthRef.current = currentWidth;
    };
    
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      
      resizeTimeoutRef.current = setTimeout(() => {
        checkMobile();
      }, 150);
    };
    
    checkMobile();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  // Show skeleton while loading
  if (isLoading) {
    return (
      <LazyMotion features={domAnimation}>
        <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6 sm:py-8 md:py-10 lg:py-12 mt-20">
          <div className="max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
            {/* Header Skeleton */}
            <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12">
              <div className="inline-block mt-4 sm:mt-6 md:mt-8 mb-3 sm:mb-4">
                <div className="h-12 sm:h-14 md:h-16 w-72 sm:w-80 md:w-96 bg-gray-800/40 rounded-xl sm:rounded-2xl animate-pulse mx-auto" />
              </div>
              <div className="inline-block">
                <div className="h-4 sm:h-5 md:h-6 w-80 sm:w-96 md:w-[500px] bg-gray-800/40 rounded-lg sm:rounded-xl animate-pulse mx-auto" />
              </div>
            </div>
            
            <SettingsSkeleton />
          </div>
        </div>
      </LazyMotion>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6 sm:py-8 md:py-10 lg:py-12 mt-20">
        <div className="max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
          
          {/* Header */}
          <m.div
            className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-black text-white mt-4 sm:mt-6 md:mt-8 leading-tight">
              <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
                VERSEANDME SCALES
              </span>{" "}
              <span className="block sm:inline">SETTINGS</span>
            </h1>
          </m.div>

          {/* Desktop Layout */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-5 sm:gap-6 md:gap-7 lg:gap-8">
            
            {/* Settings Navigation - Desktop */}
            <m.div
              className="lg:col-span-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="sticky top-6">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-xl sm:rounded-2xl md:rounded-3xl border border-red-500/30 backdrop-blur-2xl" />
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-xl sm:rounded-2xl md:rounded-3xl" />
                
                <div className="relative p-4 sm:p-5 md:p-6">
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-5 md:mb-6 flex items-center">
                    <FaUser className="mr-2 sm:mr-3 text-red-500 text-base sm:text-lg" />
                    Settings Menu
                  </h2>
                  
                  <nav className="space-y-2">
                    {settingSections.map((section) => {
                      const Icon = section.icon;
                      const isActive = activeSection === section.id;
                      
                      return (
                        <button
                          key={section.id}
                          onClick={() => handleNavigateToTab(section.id)}
                          className={`w-full p-3 sm:p-4 rounded-lg sm:rounded-xl text-left transition-all duration-300 border backdrop-blur-sm relative overflow-hidden ${
                            isActive
                              ? 'bg-red-600/20 border-red-500/50 text-red-400'
                              : 'bg-gray-900/40 border-red-500/20 text-gray-300 hover:bg-gray-800/50 hover:border-red-500/40'
                          }`}
                        >
                          <div className="flex items-center space-x-2 sm:space-x-3 relative z-10">
                            <Icon className={`text-lg sm:text-xl flex-shrink-0 ${isActive ? 'text-red-500' : 'text-gray-500'}`} />
                            <div className="flex-1 min-w-0">
                              <div className={`font-semibold text-sm sm:text-base truncate ${isActive ? 'text-red-400' : 'text-white'}`}>
                                {section.title}
                              </div>
                          
                            </div>
                          </div>
                          
                          {isActive && (
                            <>
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-r" />
                              <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-transparent" />
                            </>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>
            </m.div>

            {/* Settings Content - Desktop */}
            <m.div
              className="lg:col-span-9"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-xl sm:rounded-2xl md:rounded-3xl border border-red-500/30 backdrop-blur-2xl mb-10" />
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-xl sm:rounded-2xl md:rounded-3xl mb-10" />
                
                <div className="relative z-10 p-5 sm:p-6 md:p-7 lg:p-8">
                  {/* Success/Error Messages */}
                  <AnimatePresence>
                    {(error || success) && (
                      <m.div
                        className={`mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-lg border backdrop-blur-sm ${
                          error 
                            ? 'bg-red-900/30 border-red-500/30 text-red-300' 
                            : 'bg-green-900/30 border-green-500/30 text-green-300'
                        }`}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center text-xs flex-shrink-0 ${
                              error ? 'border-red-400 bg-red-500/20' : 'border-green-400 bg-green-500/20'
                            }`}
                          >
                            {error ? <FaExclamationTriangle /> : <FaCheckCircle />}
                          </div>
                          <span className="font-medium flex-1 text-xs sm:text-sm">{error || success}</span>
                          {onClearMessages && (
                            <button
                              onClick={onClearMessages}
                              className="text-lg hover:scale-110 transition-transform flex-shrink-0"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </m.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Dynamic Content - Pass navigation handler via React.cloneElement */}
                  <AnimatePresence mode="wait">
                    <m.div
                      key={activeSection}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* NEW: Clone children and pass onNavigateToTab prop */}
                      {typeof children === 'object' && children ? (
                        React.isValidElement(children) ? (
                          React.cloneElement(children, { onNavigateToTab: handleNavigateToTab } as any)
                        ) : (
                          children
                        )
                      ) : (
                        children
                      )}
                    </m.div>
                  </AnimatePresence>
                </div>
              </div>
            </m.div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden">
            <AnimatePresence mode="wait">
              {/* Mobile Menu View */}
              {showMobileMenu && !showMobileContent && (
                <m.div
                  key="mobile-menu"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-lg border border-red-500/30 backdrop-blur-2xl" />
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-lg" />
                    
                    <div className="relative p-3 sm:p-4">
                      <h2 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center">
                        <FaBars className="mr-2 text-red-500 text-sm" />
                        Settings Menu
                      </h2>
                      
                      <nav className="space-y-1.5 sm:space-y-2">
                        {settingSections.map((section) => {
                          const Icon = section.icon;
                          const isActive = activeSection === section.id;
                          
                          return (
                            <button
                              key={section.id}
                              onClick={() => handleSectionChange(section.id)}
                              className={`w-full p-2.5 sm:p-3 rounded-lg text-left transition-all duration-300 border backdrop-blur-sm relative overflow-hidden flex items-center ${
                                isActive
                                  ? 'bg-red-600/20 border-red-500/50 text-red-400'
                                  : 'bg-gray-900/40 border-red-500/20 text-gray-300 hover:bg-gray-800/50 hover:border-red-500/40'
                              }`}
                            >
                              <div className="flex items-center space-x-2 sm:space-x-2.5 relative z-10 flex-1 min-w-0 pr-3">
                                <Icon className={`text-base sm:text-lg flex-shrink-0 ${isActive ? 'text-red-500' : 'text-gray-500'}`} />
                                <div className="flex-1 min-w-0">
                                  <div className={`font-semibold text-sm sm:text-base truncate ${isActive ? 'text-red-400' : 'text-white'}`}>
                                    {section.title}
                                  </div>
                             
                                </div>
                              </div>
                              <FaChevronLeft className={`text-base flex-shrink-0 ${isActive ? 'text-red-500' : 'text-gray-500'}`} style={{ transform: 'rotate(180deg)' }} />
                              
                              {isActive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-transparent" />
                              )}
                            </button>
                          );
                        })}
                      </nav>
                    </div>
                  </div>
                </m.div>
              )}

              {/* Mobile Content View */}
              {showMobileContent && (
                <m.div
                  key="mobile-content"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-lg border border-red-500/30 backdrop-blur-2xl" />
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-lg" />
                    
                    <div className="relative z-10 p-3 sm:p-4">
                      {/* Back Button */}
                      <button
                        onClick={handleBackToMenu}
                        className="flex items-center space-x-1.5 text-red-400 hover:text-red-300 transition-colors mb-3 p-1.5 rounded-lg hover:bg-red-600/10"
                      >
                        <FaChevronLeft className="text-sm" />
                        <span className="font-medium text-xs sm:text-sm">Back to Menu</span>
                      </button>

                      {/* Success/Error Messages */}
                      <AnimatePresence>
                        {(error || success) && (
                          <m.div
                            className={`mb-3 p-2.5 rounded-lg border backdrop-blur-sm ${
                              error 
                                ? 'bg-red-900/30 border-red-500/30 text-red-300' 
                                : 'bg-green-900/30 border-green-500/30 text-green-300'
                            }`}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs flex-shrink-0 ${
                                  error ? 'border-red-400 bg-red-500/20' : 'border-green-400 bg-green-500/20'
                                }`}
                              >
                                {error ? <FaExclamationTriangle /> : <FaCheckCircle />}
                              </div>
                              <span className="font-medium flex-1 text-xs">{error || success}</span>
                              {onClearMessages && (
                                <button
                                  onClick={onClearMessages}
                                  className="text-lg hover:scale-110 transition-transform flex-shrink-0"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </m.div>
                        )}
                      </AnimatePresence>
                      
                      {/* Dynamic Content - Pass navigation handler via React.cloneElement */}
                      <AnimatePresence mode="wait">
                        <m.div
                          key={activeSection}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          {/* NEW: Clone children and pass onNavigateToTab prop */}
                          {typeof children === 'object' && children ? (
                            React.isValidElement(children) ? (
                              React.cloneElement(children, { onNavigateToTab: handleNavigateToTab } as any)
                            ) : (
                              children
                            )
                          ) : (
                            children
                          )}
                        </m.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </LazyMotion>
  );
};

export default SettingsLayout;