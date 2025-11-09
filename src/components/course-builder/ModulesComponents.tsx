// components/ModulesComponents.tsx
"use client";

import React, { memo, useMemo, useCallback } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import {
  FaRocket,
  FaVideo,
  FaClock,
  FaFire,
  FaPlay,
  FaChevronDown,
  FaChevronRight,
  FaStar,
  FaBolt,
  FaDownload,
  FaCheckCircle,
  FaLock,
  FaBookmark,
  FaRegBookmark,
  FaGraduationCap,
  FaCertificate,
  FaChartLine,
  FaLightbulb,
} from 'react-icons/fa';

// ============================================
// MODULE TYPES
// ============================================

interface ResourceFile {
  id: string;
  name: string;
  type: string;
  size: string;
  url: string;
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  moduleId: string;
  moduleTitle: string;
  questionCount: number;
  isCompleted?: boolean;
  isLocked?: boolean;
  resources?: ResourceFile[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  lessonCount: number;
  videoCount: number;
  totalDuration: string;
  skills: string[];
  prerequisites: string[];
  lessons: Lesson[];
  isLocked: boolean;
  progress: number;
  isFeatured?: boolean;
  certificate?: boolean;
  color: string;
  learningOutcomes?: string[];
}

// ============================================
// SKELETON COMPONENTS
// ============================================

// Base Skeleton with optimized animation
const Skeleton = memo(({ className = "", animate = true }: { className?: string; animate?: boolean }) => (
  <div 
    className={`bg-gray-800/50 rounded ${animate ? 'skeleton-pulse' : ''} ${className}`}
    style={{ minHeight: '1rem' }}
  />
));
Skeleton.displayName = 'Skeleton';

// Skeleton for Mobile Module Card
const ModuleCardMobileSkeleton = memo(() => (
  <div className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border-2 border-gray-800/40 rounded-2xl p-5 h-full backdrop-blur-xl">
    {/* Image skeleton */}
    <div className="w-full aspect-video bg-gray-800/50 rounded-xl mb-4 skeleton-pulse" />
    
    {/* Title skeleton */}
    <Skeleton className="h-6 w-3/4 mb-3" />
    
    {/* Badge skeleton */}
    <Skeleton className="h-6 w-20 rounded-full mb-3" />
    
    {/* Description skeleton */}
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-5/6 mb-4" />
    
    {/* Stats grid skeleton */}
    <div className="grid grid-cols-2 gap-2 mb-4">
      <Skeleton className="h-16 rounded-lg" />
      <Skeleton className="h-16 rounded-lg" />
    </div>
    
    {/* Button skeleton */}
    <Skeleton className="h-10 w-full rounded-lg" />
  </div>
));
ModuleCardMobileSkeleton.displayName = 'ModuleCardMobileSkeleton';

// Skeleton for Desktop Module Card
const ModuleCardDesktopSkeleton = memo(() => (
  <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 rounded-2xl border border-gray-800/30 overflow-hidden backdrop-blur-xl">
    {/* Image Section */}
    <div className="h-48 bg-gray-800/50 skeleton-pulse" />
    
    {/* Content */}
    <div className="p-5">
      {/* Title */}
      <Skeleton className="h-6 w-3/4 mb-3" />
      
      {/* Badge */}
      <Skeleton className="h-6 w-24 rounded-full mb-3" />
      
      {/* Description */}
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-4/5 mb-4" />
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
      
      {/* Button */}
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  </div>
));
ModuleCardDesktopSkeleton.displayName = 'ModuleCardDesktopSkeleton';

// Skeleton for Full Module Card
const ModuleCardFullSkeleton = memo(() => (
  <div className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border border-gray-800/30 rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-xl p-5 sm:p-6">
    {/* Header */}
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <Skeleton className="h-8 w-4/5 mb-3" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-3" />
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4">
      <Skeleton className="h-20 rounded-lg" />
      <Skeleton className="h-20 rounded-lg" />
      <Skeleton className="h-20 rounded-lg" />
      <Skeleton className="h-20 rounded-lg" />
    </div>

    {/* Skills */}
    <div className="mb-4">
      <Skeleton className="h-3 w-20 mb-2" />
      <div className="flex flex-wrap gap-1.5">
        <Skeleton className="h-6 w-16 rounded-md" />
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="h-6 w-18 rounded-md" />
        <Skeleton className="h-6 w-24 rounded-md" />
      </div>
    </div>

    {/* Progress Bar */}
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-8" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>

    {/* Buttons */}
    <Skeleton className="h-12 w-full rounded-lg mb-4" />
    <Skeleton className="h-12 w-full rounded-lg" />
  </div>
));
ModuleCardFullSkeleton.displayName = 'ModuleCardFullSkeleton';

// Tab Navigation Skeleton
const TabNavigationSkeleton = memo(() => (
  <div className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border border-gray-800/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-xl">
    <div className="grid grid-cols-3 gap-2">
      <Skeleton className="h-16 sm:h-20 rounded-lg" />
      <Skeleton className="h-16 sm:h-20 rounded-lg" />
      <Skeleton className="h-16 sm:h-20 rounded-lg" />
    </div>
  </div>
));
TabNavigationSkeleton.displayName = 'TabNavigationSkeleton';

// Filters Skeleton
const FiltersSkeleton = memo(() => (
  <div className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-gray-800/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
      {/* Search skeleton */}
      <Skeleton className="flex-1 h-12 rounded-lg" />
      
      {/* Filter buttons skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-12 w-24 rounded-lg" />
        <Skeleton className="h-12 w-28 rounded-lg" />
        <Skeleton className="h-12 w-32 rounded-lg" />
        <Skeleton className="h-12 w-28 rounded-lg" />
      </div>
    </div>
  </div>
));
FiltersSkeleton.displayName = 'FiltersSkeleton';

// Main Loading Skeleton Component
export const LoadingSkeleton = memo(() => (
  <div className="relative w-full min-h-screen bg-black overflow-x-hidden">
    {/* Background */}
    <div className="absolute inset-0 z-0">
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/30 via-black to-red-900/20" />
    </div>

    {/* Content */}
    <div className="relative z-10">
      {/* Tab Navigation Skeleton */}
      <section className="relative w-full py-8 sm:py-10">
        <div className="w-full max-w-[85%] sm:max-w-[80%] md:max-w-[75%] lg:max-w-[65%] xl:max-w-3xl mx-auto px-2 sm:px-3 md:px-4">
          <TabNavigationSkeleton />
        </div>
      </section>

      {/* Featured Modules Skeleton */}
      <section className="relative w-full py-6 sm:py-8 md:py-10">
        <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="mb-6">
            {/* Header skeleton */}
            <div className="mb-4">
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>

            {/* Mobile: Horizontal Scroll Skeleton */}
            <div className="md:hidden">
              <div className="flex gap-3 sm:gap-4 overflow-hidden">
                <div className="min-w-[85vw]">
                  <ModuleCardMobileSkeleton />
                </div>
                <div className="min-w-[85vw]">
                  <ModuleCardMobileSkeleton />
                </div>
              </div>
            </div>

            {/* Desktop: Grid Skeleton */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              <ModuleCardDesktopSkeleton />
              <ModuleCardDesktopSkeleton />
              <ModuleCardDesktopSkeleton />
            </div>
          </div>
        </div>
      </section>

      {/* Filters & All Modules Skeleton */}
      <section className="relative w-full py-6 sm:py-8 md:py-10">
        <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          {/* Filters Skeleton */}
          <div className="mb-6 sm:mb-8">
            <FiltersSkeleton />
          </div>

          {/* All Modules Header */}
          <Skeleton className="h-8 w-48 mb-4 sm:mb-6" />

          {/* All Modules Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
            <ModuleCardFullSkeleton />
            <ModuleCardFullSkeleton />
            <ModuleCardFullSkeleton />
            <ModuleCardFullSkeleton />
          </div>
        </div>
      </section>
    </div>
  </div>
));
LoadingSkeleton.displayName = 'LoadingSkeleton';

// ============================================
// MODULE COMPONENTS
// ============================================

// Optimized Difficulty Badge - Memoized
export const DifficultyBadge = memo(({ level }: { level: string }) => {
  const colors = useMemo(() => ({
    Beginner: "from-green-500/20 to-green-600/20 border-green-500/40 text-green-400",
    Intermediate: "from-yellow-500/20 to-yellow-600/20 border-yellow-500/40 text-yellow-400",
    Advanced: "from-red-500/20 to-red-600/20 border-red-500/40 text-red-400"
  }), []);

  return (
    <span className={`px-2 xs:px-2.5 sm:px-3 py-0.5 xs:py-1 rounded-full text-[9px] xs:text-[10px] sm:text-xs font-semibold bg-gradient-to-r border ${colors[level as keyof typeof colors]}`}>
      {level}
    </span>
  );
});
DifficultyBadge.displayName = 'DifficultyBadge';

// Optimized Mobile Module Card - Memoized
export const ModuleCardMobile = memo(({ 
  module, 
  bookmarked, 
  onToggleBookmark, 
  onExpand, 
  isExpanded,
  onStartModule
}: { 
  module: Module; 
  bookmarked: boolean; 
  onToggleBookmark: (id: string) => void;
  onExpand: (id: string) => void;
  isExpanded: boolean;
  onStartModule: (id: string) => void;
}) => {
  const shouldReduceMotion = useReducedMotion();
  const completedLessons = useMemo(() => module.lessons.filter(l => l.isCompleted).length, [module.lessons]);

  const handleBookmarkClick = useCallback(() => {
    onToggleBookmark(module.id);
  }, [module.id, onToggleBookmark]);

  const handleExpandClick = useCallback(() => {
    onExpand(module.id);
  }, [module.id, onExpand]);

  return (
    <div className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border-2 border-red-500/40 rounded-2xl p-5 h-full backdrop-blur-xl overflow-hidden">
      {/* Simplified glow effect - only on hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl opacity-0 hover:opacity-20 blur-xl transition-opacity duration-500" style={{ willChange: 'opacity' }} />
      
      {/* Featured Badge - No animation on low-end */}
      {module.isFeatured && (
        <div className="absolute top-3 right-3 z-20">
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center space-x-1">
            <FaStar className="text-[8px]" />
            <span>FEATURED</span>
          </div>
        </div>
      )}

      {/* Icon & Progress */}
      <div className="relative mb-4">
        <div className="w-full aspect-video bg-gradient-to-br from-red-900/30 via-gray-900/30 to-black/50 rounded-xl flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-transparent" />
          <FaRocket className="text-5xl text-red-500/50 relative z-10" />
          
          {/* Static progress bar */}
          {module.progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-900/80">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500"
                style={{ width: `${module.progress}%`, willChange: 'width' }}
              />
            </div>
          )}
        </div>

        {/* Bookmark */}
        <button
          onClick={handleBookmarkClick}
          className="absolute top-2 left-2 z-10 p-2 rounded-lg bg-black/50 backdrop-blur-sm border border-red-500/30 hover:bg-red-600/20 transition-colors"
          aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
        >
          {bookmarked ? (
            <FaBookmark className="text-red-500 text-sm" />
          ) : (
            <FaRegBookmark className="text-gray-400 text-sm" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
              {module.title}
            </h3>
            <DifficultyBadge level={module.difficulty} />
          </div>
        </div>

        <p className="text-gray-400 text-xs mb-4 line-clamp-2">
          {module.description}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="flex items-center space-x-1.5 bg-gray-900/50 rounded-lg p-2 border border-red-500/10">
            <FaClock className="text-red-500 text-xs flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] text-gray-500">Duration</p>
              <p className="text-xs font-semibold text-white truncate">{module.duration}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1.5 bg-gray-900/50 rounded-lg p-2 border border-red-500/10">
            <FaVideo className="text-red-500 text-xs flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] text-gray-500">Videos</p>
              <p className="text-xs font-semibold text-white truncate">{module.videoCount}</p>
            </div>
          </div>
        </div>

        {/* Action Button - Simplified animation */}
        <button
          onClick={() => onStartModule(module.id)}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center justify-center space-x-2 active:scale-98"
          style={{ willChange: 'transform' }}
        >
          {module.progress > 0 ? (
            <>
              <FaPlay className="text-xs" />
              <span>Continue</span>
            </>
          ) : (
            <>
              <FaRocket className="text-xs" />
              <span>Start</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
});
ModuleCardMobile.displayName = 'ModuleCardMobile';

// Optimized Desktop Module Card - Memoized
export const ModuleCardDesktop = memo(({ 
  module, 
  bookmarked, 
  onToggleBookmark, 
  onExpand, 
  isExpanded,
  onStartModule
}: { 
  module: Module; 
  bookmarked: boolean; 
  onToggleBookmark: (id: string) => void;
  onExpand: (id: string) => void;
  isExpanded: boolean;
  onStartModule: (id: string) => void;
}) => {
  const shouldReduceMotion = useReducedMotion();

  const handleBookmarkClick = useCallback(() => {
    onToggleBookmark(module.id);
  }, [module.id, onToggleBookmark]);

  const handleExpandClick = useCallback(() => {
    onExpand(module.id);
  }, [module.id, onExpand]);

  // Simplified animation variants
  const cardVariants = shouldReduceMotion ? {} : {
    hover: { y: -5 }
  };

  return (
    <motion.div
      className="relative group"
      initial={false}
      whileHover={cardVariants.hover}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" style={{ willChange: 'opacity' }} />
      
      <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 rounded-2xl border border-red-500/30 overflow-hidden backdrop-blur-xl">
        {module.isFeatured && (
          <div className="absolute top-3 right-3 z-20">
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
              <FaStar className="text-[10px]" />
              <span>FEATURED</span>
            </div>
          </div>
        )}

        {/* Image Section */}
        <div className="relative h-48 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/50 via-gray-900/50 to-black/90" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-red-600/20 via-gray-800/20 to-red-900/20 flex items-center justify-center">
              <FaRocket className="text-6xl text-red-500/30" />
            </div>
          </div>
          
          {module.progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-900/80">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500"
                style={{ width: `${module.progress}%`, willChange: 'width' }}
              />
            </div>
          )}

          <button
            onClick={handleBookmarkClick}
            className="absolute top-3 left-3 z-10 p-2 rounded-lg bg-black/50 backdrop-blur-sm border border-red-500/30 hover:bg-red-600/20 transition-colors"
            aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            {bookmarked ? (
              <FaBookmark className="text-red-500 text-sm" />
            ) : (
              <FaRegBookmark className="text-gray-400 text-sm" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                {module.title}
              </h3>
              <DifficultyBadge level={module.difficulty} />
            </div>
          </div>

          <p className="text-gray-400 text-sm mb-4 line-clamp-2">
            {module.description}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center space-x-2 bg-gray-900/50 rounded-lg p-2.5 border border-red-500/10">
              <FaClock className="text-red-500 text-sm flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-gray-500">Duration</p>
                <p className="text-xs font-semibold text-white truncate">{module.duration}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 bg-gray-900/50 rounded-lg p-2.5 border border-red-500/10">
              <FaVideo className="text-red-500 text-sm flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-gray-500">Videos</p>
                <p className="text-xs font-semibold text-white truncate">{module.videoCount}</p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => onStartModule(module.id)}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center justify-center space-x-2 hover:scale-102 active:scale-98"
            style={{ willChange: 'transform' }}
          >
            {module.progress > 0 ? (
              <>
                <FaPlay />
                <span>Continue</span>
              </>
            ) : (
              <>
                <FaRocket />
                <span>Start</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
});
ModuleCardDesktop.displayName = 'ModuleCardDesktop';

// Optimized Full Module Card - Memoized
export const ModuleCardFull = memo(({ 
  module, 
  bookmarked, 
  onToggleBookmark, 
  onExpand, 
  isExpanded,
  onStartModule
}: { 
  module: Module; 
  bookmarked: boolean; 
  onToggleBookmark: (id: string) => void;
  onExpand: (id: string) => void;
  isExpanded: boolean;
  onStartModule: (id: string) => void;
}) => {
  const shouldReduceMotion = useReducedMotion();
  const completedLessons = useMemo(() => module.lessons.filter(l => l.isCompleted).length, [module.lessons]);

  const handleBookmarkClick = useCallback(() => {
    onToggleBookmark(module.id);
  }, [module.id, onToggleBookmark]);

  const handleExpandClick = useCallback(() => {
    onExpand(module.id);
  }, [module.id, onExpand]);

  return (
    <motion.div
      className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-xl"
      initial={false}
      whileHover={{ y: -5, borderColor: "rgba(239, 68, 68, 0.6)" }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent opacity-0 hover:opacity-100 transition-opacity" style={{ willChange: 'opacity' }} />
      
      <div className="relative z-10 p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {module.isFeatured && (
                <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                  <FaStar className="text-[8px]" />
                  FEATURED
                </span>
              )}
              <DifficultyBadge level={module.difficulty} />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
              {module.title}
            </h3>
            <p className="text-gray-400 text-sm mb-3">{module.description}</p>
          </div>
          
          <button
            onClick={handleBookmarkClick}
            className="flex-shrink-0 p-2 rounded-lg bg-gray-900/50 hover:bg-red-600/20 border border-red-500/20 transition-colors ml-3"
            aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            {bookmarked ? (
              <FaBookmark className="text-red-500 text-base" />
            ) : (
              <FaRegBookmark className="text-gray-400 text-base" />
            )}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4">
          <div className="bg-gray-900/50 border border-red-500/10 rounded-lg p-2 sm:p-3">
            <FaClock className="text-red-500 text-base mb-1" />
            <p className="text-xs text-gray-500">Duration</p>
            <p className="text-sm font-bold text-white">{module.duration}</p>
          </div>
          <div className="bg-gray-900/50 border border-red-500/10 rounded-lg p-2 sm:p-3">
            <FaVideo className="text-red-500 text-base mb-1" />
            <p className="text-xs text-gray-500">Videos</p>
            <p className="text-sm font-bold text-white">{module.videoCount}</p>
          </div>
          <div className="bg-gray-900/50 border border-red-500/10 rounded-lg p-2 sm:p-3">
            <FaGraduationCap className="text-red-500 text-base mb-1" />
            <p className="text-xs text-gray-500">Lessons</p>
            <p className="text-sm font-bold text-white">{module.lessonCount}</p>
          </div>
          <div className="bg-gray-900/50 border border-red-500/10 rounded-lg p-2 sm:p-3">
            <FaChartLine className="text-red-500 text-base mb-1" />
            <p className="text-xs text-gray-500">Progress</p>
            <p className="text-sm font-bold text-white">{module.progress}%</p>
          </div>
        </div>

        {/* Skills */}
        <div className="mb-4">
          <p className="text-[10px] text-gray-500 mb-2 font-medium">YOU'LL LEARN</p>
          <div className="flex flex-wrap gap-1.5">
            {module.skills.slice(0, 4).map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-red-600/10 border border-red-500/20 rounded-md text-[10px] text-red-400 font-medium"
              >
                {skill}
              </span>
            ))}
            {module.skills.length > 4 && (
              <span className="px-2 py-1 bg-red-600/10 border border-red-500/20 rounded-md text-[10px] text-red-400 font-medium">
                +{module.skills.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">{completedLessons} of {module.lessonCount} completed</span>
            <span className="text-xs font-bold text-red-400">{module.progress}%</span>
          </div>
          <div className="relative h-2 bg-gray-800/50 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-700"
              style={{ width: `${module.progress}%`, willChange: 'width' }}
            />
          </div>
        </div>

        {/* Expand Button */}
        <button
          onClick={handleExpandClick}
          className="w-full bg-gray-900/50 border border-red-500/30 py-3 rounded-lg text-white font-bold hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2 text-sm mb-4"
        >
          <span>{isExpanded ? 'Hide' : 'View'} {module.lessonCount} Lessons</span>
          <FaChevronDown className={`transition-transform text-xs ${isExpanded ? 'rotate-180' : ''}`} style={{ willChange: 'transform' }} />
        </button>

        {/* Expanded Lessons */}
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div
              key={`lessons-${module.id}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-red-500/20 pt-4"
            >
              <div className="space-y-2">
                {module.lessons.map((lesson, idx) => (
                  <div
                    key={lesson.id}
                    className={`relative group ${lesson.isLocked ? 'opacity-50' : ''}`}
                  >
                    <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      lesson.isLocked 
                        ? 'bg-gray-900/30 cursor-not-allowed' 
                        : lesson.isCompleted
                        ? 'bg-green-900/20 border border-green-500/20 hover:bg-green-900/30'
                        : 'bg-gray-900/50 border border-red-500/20 hover:bg-red-900/30 cursor-pointer'
                    }`}>
                      {/* Status Icon */}
                      <div className="flex-shrink-0">
                        {lesson.isLocked ? (
                          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                            <FaLock className="text-gray-600 text-xs" />
                          </div>
                        ) : lesson.isCompleted ? (
                          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                            <FaCheckCircle className="text-white text-xs" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ willChange: 'transform' }}>
                            <FaPlay className="text-white text-xs ml-0.5" />
                          </div>
                        )}
                      </div>

                      {/* Lesson Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-semibold mb-1 ${
                          lesson.isLocked ? 'text-gray-600' : 'text-white'
                        }`}>
                          {lesson.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FaClock className="text-[10px]" />
                            {lesson.duration}
                          </span>
                          {lesson.resources && lesson.resources.length > 0 && (
                            <span className="flex items-center gap-1">
                              <FaDownload className="text-[10px]" />
                              {lesson.resources.length} Resources
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action */}
                      {!lesson.isLocked && (
                        <div className="flex-shrink-0">
                          <FaChevronRight className="text-gray-600 group-hover:text-red-400 transition-colors text-xs" />
                        </div>
                      )}
                    </div>

                    {/* Resources Dropdown */}
                    {!lesson.isLocked && lesson.resources && lesson.resources.length > 0 && (
                      <div className="hidden group-hover:block absolute top-full left-0 right-0 mt-1 z-20">
                        <div className="bg-gray-900 border border-red-500/30 rounded-lg p-3 shadow-xl backdrop-blur-xl">
                          <p className="text-xs text-gray-400 mb-2 font-medium">Available Resources:</p>
                          <div className="space-y-1">
                            {lesson.resources.map((resource: ResourceFile, rIdx: number) => (
                              <div
                                key={rIdx}
                                className="flex items-center gap-2 text-xs text-gray-300 hover:text-red-400 transition-colors py-1"
                              >
                                <FaDownload className="text-[10px] text-red-500" />
                                <span>{resource.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Prerequisites */}
              {module.prerequisites.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-900/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-xs text-yellow-400 font-medium mb-2 flex items-center gap-1.5">
                    <FaLightbulb className="text-[10px]" />
                    Prerequisites
                  </p>
                  <div className="space-y-1">
                    {module.prerequisites.map((prereq, idx) => (
                      <p key={idx} className="text-xs text-gray-400">• {prereq}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Certificate Badge */}
              {module.certificate && (
                <div className="mt-4 p-3 bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-500/30 rounded-lg flex items-center gap-3">
                  <FaCertificate className="text-red-400 text-2xl flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-white">Certificate of Completion</p>
                    <p className="text-xs text-gray-400">Earn a certificate upon finishing this module</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onStartModule(module.id)}
            className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 hover:scale-102 active:scale-98 ${
              module.progress > 0
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800'
                : 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800'
            }`}
            style={{ willChange: 'transform' }}
          >
            {module.progress > 0 ? (
              <>
                <FaPlay className="text-xs" />
                Continue Learning
              </>
            ) : (
              <>
                <FaRocket className="text-xs" />
                Start Module
              </>
            )}
          </button>

          {module.progress > 0 && (
            <button
              className="px-4 py-3 bg-gray-900/50 border border-red-500/30 rounded-lg text-white hover:bg-red-900/30 transition-colors hover:scale-102 active:scale-98"
              title="Reset Progress"
              style={{ willChange: 'transform' }}
            >
              <FaBolt className="text-sm" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});
ModuleCardFull.displayName = 'ModuleCardFull';