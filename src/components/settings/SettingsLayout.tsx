"use client";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { FaUser, FaLock, FaCheckCircle, FaExclamationTriangle, FaBars, FaChevronLeft } from "react-icons/fa";
import React from "react";

interface SettingsLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
  success?: string | null;
  error?: string | null;
  onClearMessages?: () => void;
  isLoading?: boolean;
  onNavigateToTab?: (section: string) => void;
}

// ✅ SIMPLIFIED Skeleton Loader Component (like /courses page)
const SettingsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 md:gap-7 lg:gap-8">
      {/* Sidebar Skeleton - Desktop Only */}
      <div className="hidden lg:block lg:col-span-3">
        <div className="relative bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 p-6">
          {/* Title skeleton */}
          <div className="mb-6">
            <div className="h-7 w-48 bg-gray-800/40 rounded-lg animate-pulse" />
          </div>
          
          {/* Menu items skeleton */}
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 bg-gray-800/40 rounded-xl animate-pulse"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="lg:col-span-9">
        <div className="relative bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 p-8">
          {/* Section title */}
          <div className="h-8 w-64 bg-gray-800/40 rounded-lg animate-pulse mb-6" />
          
          {/* Content cards */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 bg-gray-800/40 rounded-xl animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
          
          {/* Bottom action buttons */}
          <div className="flex flex-col xs:flex-row justify-end gap-4 mt-8 pt-6 border-t border-red-500/20">
            <div className="h-11 w-full xs:w-32 bg-gray-800/40 rounded-lg animate-pulse" />
            <div className="h-11 w-full xs:w-40 bg-gray-800/40 rounded-lg animate-pulse" />
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
  onNavigateToTab
}: SettingsLayoutProps) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileContent, setShowMobileContent] = useState(false);
  const previousWidthRef = useRef<number>(0);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const settingSections = [
    { id: 'basic', title: 'Basic Info', icon: FaUser },
    { id: 'privacy', title: 'Privacy', icon: FaLock },
  ];

  const handleNavigateToTab = (sectionId: string) => {
    if (onNavigateToTab) {
      onNavigateToTab(sectionId);
    }
    onSectionChange(sectionId);
    
    if (showMobileMenu) {
      setShowMobileMenu(false);
      setShowMobileContent(true);
    }
  };

  const handleSectionChange = (sectionId: string) => {
    onSectionChange(sectionId);
    setShowMobileMenu(false);
    setShowMobileContent(true);
  };

  const handleBackToMenu = () => {
    setShowMobileContent(false);
    setShowMobileMenu(true);
  };

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

  // ✅ Show simplified skeleton while loading
  if (isLoading) {
    return (
      <LazyMotion features={domAnimation}>
        <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6 sm:py-8 md:py-10 lg:py-12 mt-20">
          <div className="max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
            {/* Header Skeleton */}
            <div className="text-center mb-8 sm:mb-12">
              <div className="inline-block mt-6 md:mt-8 mb-4">
                <div className="h-14 md:h-16 w-80 md:w-96 bg-gray-800/40 rounded-2xl animate-pulse mx-auto" />
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
          <div className="hidden lg:grid lg:grid-cols-12 gap-8">
            
            {/* Settings Navigation - Desktop */}
            <m.div
              className="lg:col-span-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="sticky top-6 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                  <FaUser className="mr-3 text-red-500" />
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
                        className={`w-full p-4 rounded-xl text-left transition-all duration-300 border relative overflow-hidden ${
                          isActive
                            ? 'bg-red-600/20 border-red-500/50 text-red-400'
                            : 'bg-gray-900/40 border-red-500/20 text-gray-300 hover:bg-gray-800/50 hover:border-red-500/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 relative z-10">
                          <Icon className={`text-xl ${isActive ? 'text-red-500' : 'text-gray-500'}`} />
                          <div className="flex-1">
                            <div className={`font-semibold text-base ${isActive ? 'text-red-400' : 'text-white'}`}>
                              {section.title}
                            </div>
                          </div>
                        </div>
                        
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-r" />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </m.div>

            {/* Settings Content - Desktop */}
            <m.div
              className="lg:col-span-9"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 p-8">
                {/* Success/Error Messages */}
                <AnimatePresence>
                  {(error || success) && (
                    <m.div
                      className={`mb-4 p-3 rounded-lg border ${
                        error 
                          ? 'bg-red-900/30 border-red-500/30 text-red-300' 
                          : 'bg-green-900/30 border-green-500/30 text-green-300'
                      }`}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          error ? 'border-red-400' : 'border-green-400'
                        }`}>
                          {error ? <FaExclamationTriangle className="text-xs" /> : <FaCheckCircle className="text-xs" />}
                        </div>
                        <span className="font-medium text-sm flex-1">{error || success}</span>
                        {onClearMessages && (
                          <button
                            onClick={onClearMessages}
                            className="text-lg hover:scale-110 transition-transform"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
                
                {/* Dynamic Content */}
                <AnimatePresence mode="wait">
                  <m.div
                    key={activeSection}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
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
                  className="bg-gradient-to-br from-gray-900/90 to-black/95 rounded-lg border border-red-500/30 p-4"
                >
                  <h2 className="text-lg font-bold text-white mb-3 flex items-center">
                    <FaBars className="mr-2 text-red-500 text-sm" />
                    Settings Menu
                  </h2>
                  
                  <nav className="space-y-2">
                    {settingSections.map((section) => {
                      const Icon = section.icon;
                      const isActive = activeSection === section.id;
                      
                      return (
                        <button
                          key={section.id}
                          onClick={() => handleSectionChange(section.id)}
                          className={`w-full p-3 rounded-lg text-left transition-all border flex items-center justify-between ${
                            isActive
                              ? 'bg-red-600/20 border-red-500/50 text-red-400'
                              : 'bg-gray-900/40 border-red-500/20 text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className={`text-lg ${isActive ? 'text-red-500' : 'text-gray-500'}`} />
                            <span className={`font-semibold text-sm ${isActive ? 'text-red-400' : 'text-white'}`}>
                              {section.title}
                            </span>
                          </div>
                          <FaChevronLeft className="text-base" style={{ transform: 'rotate(180deg)' }} />
                        </button>
                      );
                    })}
                  </nav>
                </m.div>
              )}

              {/* Mobile Content View */}
              {showMobileContent && (
                <m.div
                  key="mobile-content"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-gradient-to-br from-gray-900/90 to-black/95 rounded-lg border border-red-500/30 p-4"
                >
                  <button
                    onClick={handleBackToMenu}
                    className="flex items-center gap-1.5 text-red-400 hover:text-red-300 mb-3 p-1.5 rounded-lg hover:bg-red-600/10"
                  >
                    <FaChevronLeft className="text-sm" />
                    <span className="font-medium text-sm">Back to Menu</span>
                  </button>

                  <AnimatePresence>
                    {(error || success) && (
                      <m.div
                        className={`mb-3 p-2.5 rounded-lg border ${
                          error 
                            ? 'bg-red-900/30 border-red-500/30 text-red-300' 
                            : 'bg-green-900/30 border-green-500/30 text-green-300'
                        }`}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            error ? 'border-red-400' : 'border-green-400'
                          }`}>
                            {error ? <FaExclamationTriangle className="text-xs" /> : <FaCheckCircle className="text-xs" />}
                          </div>
                          <span className="font-medium text-xs flex-1">{error || success}</span>
                          {onClearMessages && (
                            <button onClick={onClearMessages} className="text-lg">×</button>
                          )}
                        </div>
                      </m.div>
                    )}
                  </AnimatePresence>
                  
                  <AnimatePresence mode="wait">
                    <m.div
                      key={activeSection}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
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