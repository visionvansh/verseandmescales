"use client";

import React, { useState, useEffect, useCallback, memo, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaExclamationTriangle,
  FaArrowLeft,
  FaChartLine,
  FaBookOpen,
  FaClock,
  FaTrophy,
  FaRocket,
  FaVideo,
  FaPlay,
  FaChevronDown,
  FaChevronRight,
  FaCheckCircle,
  FaLock,
  FaDownload,
  FaGraduationCap,
  FaCertificate,
  FaListUl,
  FaExpand,
  FaSync,
  FaFire,
  FaStar,
} from "react-icons/fa";

// Types
interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string | number;
  videoUrl: string;
  isCompleted: boolean;
  progressPercent?: number;
  lastPosition?: number;
  watchTime?: number;
  isLocked: boolean;
  resources?: Resource[];
  transcript?: string;
}

interface Resource {
  name: string;
  type: string;
  size: string;
  url: string;
}

interface Module {
  id: string;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  totalDuration: string | number;
  lessons: Lesson[];
  progress: number;
  completedLessons?: number;
  totalLessons?: number;
  totalWatchTime?: number;
  color: string;
  course?: {
    id: string;
    title: string;
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format duration from seconds to readable format
 * @param seconds - Duration in seconds (can be string or number)
 * @returns Formatted duration string (e.g., "5m 30s" or "1h 5m")
 */
const formatDuration = (seconds: string | number | undefined): string => {
  if (!seconds) return "0m";

  // Convert to number if string
  const totalSeconds =
    typeof seconds === "string" ? parseFloat(seconds) : seconds;

  // Handle invalid numbers
  if (isNaN(totalSeconds) || totalSeconds < 0) return "0m";

  // Round to nearest second
  const roundedSeconds = Math.round(totalSeconds);

  const hours = Math.floor(roundedSeconds / 3600);
  const minutes = Math.floor((roundedSeconds % 3600) / 60);
  const secs = roundedSeconds % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  } else if (minutes > 0) {
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
  } else {
    return `${secs}s`;
  }
};

/**
 * Calculate total duration from all lessons
 * @param lessons - Array of lessons
 * @returns Total duration in seconds
 */
const calculateTotalDuration = (lessons: Lesson[]): number => {
  return lessons.reduce((total, lesson) => {
    const duration =
      typeof lesson.duration === "string"
        ? parseFloat(lesson.duration)
        : lesson.duration;
    return total + (isNaN(duration) ? 0 : duration);
  }, 0);
};

/**
 * Format watch time
 * @param seconds - Watch time in seconds
 * @returns Formatted watch time string
 */
const formatWatchTime = (seconds: number | undefined): string => {
  if (!seconds || seconds <= 0) return "0m 0s";

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${mins}m ${secs}s`;
};

// ============================================
// OPTIMIZED SKELETON COMPONENTS
// ============================================

const SkeletonBox = memo(({ className = "" }: { className?: string }) => (
  <div className={`bg-gray-800/50 rounded skeleton-pulse ${className}`} />
));
SkeletonBox.displayName = "SkeletonBox";

const ModuleHeaderSkeleton = memo(() => (
  <div className="mb-8 sm:mb-10 md:mb-12">
    {/* Back Button Skeleton */}
    <SkeletonBox className="w-32 h-6 mb-6 sm:mb-8 rounded" />

    {/* Title Skeleton */}
    <div className="relative mb-6 sm:mb-8">
      <SkeletonBox className="h-16 sm:h-20 md:h-24 lg:h-28 w-full max-w-2xl rounded-2xl mb-2 sm:mb-3" />
      <SkeletonBox className="h-1 sm:h-1.5 w-full max-w-2xl rounded-full" />
    </div>

    {/* Description Skeleton */}
    <div className="space-y-2 mb-6 sm:mb-8 max-w-4xl">
      <SkeletonBox className="w-full h-5 sm:h-6" />
      <SkeletonBox className="w-11/12 h-5 sm:h-6" />
      <SkeletonBox className="w-4/5 h-5 sm:h-6" />
    </div>

    {/* Stats Dashboard Skeleton */}
    <div className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-gray-700/30 rounded-xl sm:rounded-2xl p-5 sm:p-7">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="text-center sm:text-left">
            <SkeletonBox className="w-24 h-4 mb-3 mx-auto sm:mx-0" />
            <SkeletonBox className="w-20 h-8 mx-auto sm:mx-0" />
          </div>
        ))}
      </div>
      <SkeletonBox className="w-full h-3 sm:h-4 rounded-full" />
    </div>
  </div>
));
ModuleHeaderSkeleton.displayName = "ModuleHeaderSkeleton";

const LessonSkeletonList = memo(() => (
  <div className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-gray-700/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 skeleton-pulse">
    <div className="flex items-start gap-4">
      <SkeletonBox className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full" />
      <div className="flex-1 min-w-0">
        <SkeletonBox className="w-3/4 h-6 sm:h-7 mb-3" />
        <div className="space-y-2 mb-4">
          <SkeletonBox className="w-full h-4" />
          <SkeletonBox className="w-5/6 h-4" />
        </div>
        <div className="flex gap-4 mb-4">
          <SkeletonBox className="w-16 h-4" />
          <SkeletonBox className="w-20 h-4" />
          <SkeletonBox className="w-24 h-4" />
        </div>
        <div className="flex gap-3">
          <SkeletonBox className="w-32 h-10 sm:h-12 rounded-lg" />
          <SkeletonBox className="w-24 h-10 sm:h-12 rounded-lg" />
        </div>
      </div>
    </div>
  </div>
));
LessonSkeletonList.displayName = "LessonSkeletonList";

const LessonSkeletonGrid = memo(() => (
  <div className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-gray-700/30 rounded-xl sm:rounded-2xl overflow-hidden skeleton-pulse">
    <SkeletonBox className="w-full aspect-video" />
    <div className="p-4 sm:p-5">
      <SkeletonBox className="w-4/5 h-6 mb-3" />
      <div className="space-y-2 mb-4">
        <SkeletonBox className="w-full h-4" />
        <SkeletonBox className="w-3/4 h-4" />
      </div>
      <SkeletonBox className="w-full h-10 rounded-lg" />
    </div>
  </div>
));
LessonSkeletonGrid.displayName = "LessonSkeletonGrid";

const LoadingSkeletonView = memo(
  ({ viewMode }: { viewMode: "list" | "grid" }) => (
    <div className="min-h-screen mt-20">
      <div className="relative z-10">
        <section className="relative w-full pt-8 sm:pt-12 md:pt-16 pb-8 sm:pb-12 md:pb-16">
          <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 pb-6 sm:pb-8 md:pb-10 lg:pb-12">
            <div className="max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
              <ModuleHeaderSkeleton />

              <div className="flex items-center justify-between mb-6">
                <SkeletonBox className="w-48 h-8" />
                <div className="flex gap-2">
                  <SkeletonBox className="w-10 h-10 rounded-lg" />
                  <SkeletonBox className="w-10 h-10 rounded-lg" />
                </div>
              </div>

              {viewMode === "list" ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <LessonSkeletonList key={i} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <LessonSkeletonGrid key={i} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
      <style jsx global>{`
        .skeleton-pulse {
          animation: skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes skeleton-pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .skeleton-pulse {
            animation: none;
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  )
);
LoadingSkeletonView.displayName = "LoadingSkeletonView";

// ============================================
// MAIN COMPONENTS
// ============================================

const StatItem = memo(
  ({
    icon: Icon,
    label,
    value,
    isGradient = false,
    isText = false,
  }: {
    icon: React.ElementType;
    label: string;
    value: string;
    isGradient?: boolean;
    isText?: boolean;
  }) => (
    <div className="text-center sm:text-left group">
      <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-1.5">
        <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
          <Icon className="text-red-500 text-xs" />
        </div>
        <span className="text-[11px] sm:text-xs text-gray-400 font-semibold">
          {label}
        </span>
      </div>
      <p
        className={`font-black ${
          isGradient
            ? "text-xl sm:text-2xl bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent"
            : isText
            ? "text-sm sm:text-base text-white"
            : "text-xl sm:text-2xl text-white"
        }`}
      >
        {value}
      </p>
    </div>
  )
);
StatItem.displayName = "StatItem";

// **NEW: Compact Mobile Stat Item**
const StatItemMobile = memo(
  ({
    icon: Icon,
    label,
    value,
  }: {
    icon: React.ElementType;
    label: string;
    value: string;
  }) => (
    <div className="flex items-center gap-1 min-w-0 px-1">
      <div className="w-5 h-5 rounded bg-red-500/10 flex items-center justify-center flex-shrink-0">
        <Icon className="text-red-500 text-[10px]" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[9px] text-gray-400 font-semibold leading-tight whitespace-nowrap truncate">
          {label}
        </span>
        <span className="text-[11px] font-black text-white leading-tight whitespace-nowrap truncate">
          {value}
        </span>
      </div>
    </div>
  )
);
StatItemMobile.displayName = "StatItemMobile";

const ViewModeButton = memo(
  ({
    isActive,
    onClick,
    icon: Icon,
  }: {
    isActive: boolean;
    onClick: () => void;
    icon: React.ElementType;
  }) => (
    <button
      onClick={onClick}
      className={`p-2.5 sm:p-3 rounded-lg transition-all ${
        isActive
          ? "bg-gradient-to-r from-red-600 to-red-700 text-white"
          : "bg-gray-900/50 border border-red-500/30 text-gray-400 hover:text-white hover:border-red-500/50"
      }`}
    >
      <Icon className="text-sm sm:text-base" />
    </button>
  )
);
ViewModeButton.displayName = "ViewModeButton";

const LessonCardList = memo(
  ({
    lesson,
    index,
    totalLessons,
    isExpanded,
    onToggleExpand,
    onLessonClick,
  }: {
    lesson: Lesson;
    index: number;
    totalLessons: number;
    isExpanded: boolean;
    onToggleExpand: (id: string) => void;
    onLessonClick: (lesson: Lesson) => void;
  }) => {
    const formattedDuration = formatDuration(lesson.duration);
    const formattedWatchTime = formatWatchTime(lesson.watchTime);

    return (
      <div
        className={`relative bg-gradient-to-br from-gray-900/90 to-black/95 border rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-xl animate-slideIn ${
          lesson.isLocked
            ? "border-gray-700/30 opacity-60"
            : lesson.isCompleted
            ? "border-green-500/30"
            : "border-red-500/30 hover:border-red-500/60"
        } transition-all duration-300`}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <div
              className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-black text-lg sm:text-xl ${
                lesson.isLocked
                  ? "bg-gray-800 text-gray-600"
                  : lesson.isCompleted
                  ? "bg-gradient-to-br from-green-600 to-green-700 text-white"
                  : "bg-gradient-to-br from-red-600 to-red-700 text-white"
              }`}
            >
              {lesson.isLocked ? (
                <FaLock className="text-base sm:text-lg" />
              ) : lesson.isCompleted ? (
                <FaCheckCircle className="text-base sm:text-lg" />
              ) : (
                String(index + 1).padStart(2, "0")
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <h3
                    className={`text-lg sm:text-xl font-bold mb-2 ${
                      lesson.isLocked ? "text-gray-600" : "text-white"
                    }`}
                  >
                    {lesson.title}
                  </h3>
                  <p
                    className={`text-sm ${
                      lesson.isLocked ? "text-gray-700" : "text-gray-400"
                    } line-clamp-2`}
                  >
                    {lesson.description}
                  </p>
                </div>

                {lesson.isCompleted && (
                  <div className="flex-shrink-0">
                    <span className="px-3 py-1 bg-green-500/20 border border-green-500/40 rounded-full text-xs font-semibold text-green-400 whitespace-nowrap flex items-center gap-1.5">
                      <FaCheckCircle className="text-[10px]" />
                      Completed
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500">
                  <FaClock className="flex-shrink-0" />
                  <span>{formattedDuration}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500">
                  <FaVideo className="flex-shrink-0" />
                  <span>HD Video</span>
                </div>
                {lesson.resources && lesson.resources.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500">
                    <FaDownload className="flex-shrink-0" />
                    <span>{lesson.resources.length} Resources</span>
                  </div>
                )}
                {lesson.watchTime !== undefined && lesson.watchTime > 0 && (
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md">
                    <FaClock className="flex-shrink-0" />
                    <span>Watched: {formattedWatchTime}</span>
                  </div>
                )}
                {lesson.progressPercent !== undefined &&
                  lesson.progressPercent > 0 &&
                  !lesson.isCompleted && (
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-md">
                      <FaChartLine className="flex-shrink-0" />
                      <span>
                        {Math.round(lesson.progressPercent)}% complete
                      </span>
                    </div>
                  )}
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3">
                <button
                  onClick={() => !lesson.isLocked && onLessonClick(lesson)}
                  disabled={lesson.isLocked}
                  className={`flex-1 sm:flex-initial py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    lesson.isLocked
                      ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                      : lesson.isCompleted
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                  } ${
                    !lesson.isLocked && "hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                >
                  <FaPlay className="text-xs" />
                  <span>
                    {lesson.isCompleted
                      ? "Watch Again"
                      : lesson.isLocked
                      ? "Locked"
                      : lesson.progressPercent && lesson.progressPercent > 0
                      ? "Continue"
                      : "Start Lesson"}
                  </span>
                </button>

                {!lesson.isLocked && (
                  <button
                    onClick={() => onToggleExpand(lesson.id)}
                    className="py-2.5 sm:py-3 px-4 bg-gray-900/50 border border-red-500/30 rounded-lg text-white hover:bg-red-900/30 hover:border-red-500/50 transition-all flex items-center gap-2 text-sm font-semibold hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="hidden sm:inline">Details</span>
                    <FaChevronDown
                      className={`text-xs transition-transform duration-300 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                )}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && !lesson.isLocked && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-6 pt-6 border-t border-red-500/20"
              >
                {lesson.resources && lesson.resources.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <FaDownload className="text-red-500" />
                      Downloadable Resources
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {lesson.resources.map((resource, idx) => (
                        <a
                          key={idx}
                          href={resource.url}
                          className="flex items-center gap-3 p-3 bg-gray-900/50 border border-red-500/20 rounded-lg hover:bg-red-900/30 hover:border-red-500/40 transition-all group"
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                            <FaDownload className="text-white text-sm" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors truncate">
                              {resource.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {resource.type} • {resource.size}
                            </p>
                          </div>
                          <FaChevronRight className="text-gray-600 group-hover:text-red-400 transition-colors flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {lesson.transcript && (
                  <div>
                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <FaBookOpen className="text-red-500" />
                      Transcript Preview
                    </h4>
                    <div className="p-4 bg-gray-900/50 border border-red-500/20 rounded-lg">
                      <p className="text-sm text-gray-400 line-clamp-3">
                        {lesson.transcript}
                      </p>
                      <button className="mt-2 text-xs text-red-400 hover:text-red-300 font-semibold transition-colors">
                        Read Full Transcript →
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {lesson.isLocked && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <FaLock className="text-4xl text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-semibold">
                Complete previous lessons to unlock
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
);
LessonCardList.displayName = "LessonCardList";

const LessonCardGrid = memo(
  ({
    lesson,
    index,
    totalLessons,
    onLessonClick,
  }: {
    lesson: Lesson;
    index: number;
    totalLessons: number;
    onLessonClick: (lesson: Lesson) => void;
  }) => {
    const formattedDuration = formatDuration(lesson.duration);
    const formattedWatchTime = formatWatchTime(lesson.watchTime);

    return (
      <div
        className={`relative bg-gradient-to-br from-gray-900/90 to-black/95 border rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-xl h-full animate-slideIn ${
          lesson.isLocked
            ? "border-gray-700/30 opacity-60"
            : lesson.isCompleted
            ? "border-green-500/30"
            : "border-red-500/30 hover:border-red-500/60"
        } transition-all duration-300 group ${
          !lesson.isLocked && "hover:-translate-y-1"
        }`}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="relative aspect-video bg-gradient-to-br from-red-900/30 via-gray-900/30 to-black/50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            {lesson.isLocked ? (
              <FaLock className="text-5xl text-gray-700" />
            ) : (
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform ${
                  lesson.isCompleted
                    ? "bg-green-600"
                    : "bg-gradient-to-br from-red-600 to-red-700"
                } ${!lesson.isLocked && "group-hover:scale-110"}`}
              >
                {lesson.isCompleted ? (
                  <FaCheckCircle className="text-2xl text-white" />
                ) : (
                  <FaPlay className="text-2xl text-white ml-1" />
                )}
              </div>
            )}
          </div>

          <div className="absolute top-3 left-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${
                lesson.isLocked
                  ? "bg-gray-800 text-gray-600"
                  : lesson.isCompleted
                  ? "bg-green-600 text-white"
                  : "bg-gradient-to-br from-red-600 to-red-700 text-white"
              }`}
            >
              {String(index + 1).padStart(2, "0")}
            </div>
          </div>

          <div className="absolute bottom-3 right-3">
            <div className="px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-lg">
              <span className="text-xs font-semibold text-white flex items-center gap-1">
                <FaClock className="text-[10px]" />
                {formattedDuration}
              </span>
            </div>
          </div>

          {lesson.isCompleted && (
            <div className="absolute top-3 right-3">
              <div className="px-2.5 py-1 bg-green-500/90 backdrop-blur-sm rounded-lg">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  <FaCheckCircle className="text-[10px]" />
                  Done
                </span>
              </div>
            </div>
          )}

          {!lesson.isCompleted &&
            lesson.progressPercent !== undefined &&
            lesson.progressPercent > 0 && (
              <div className="absolute top-3 right-3">
                <div className="px-2.5 py-1 bg-yellow-500/90 backdrop-blur-sm rounded-lg">
                  <span className="text-xs font-bold text-white">
                    {Math.round(lesson.progressPercent)}%
                  </span>
                </div>
              </div>
            )}
        </div>

        <div className="p-4 sm:p-5">
          <h3
            className={`text-base sm:text-lg font-bold mb-2 line-clamp-2 ${
              lesson.isLocked ? "text-gray-600" : "text-white"
            }`}
          >
            {lesson.title}
          </h3>

          <p
            className={`text-xs sm:text-sm mb-4 line-clamp-2 ${
              lesson.isLocked ? "text-gray-700" : "text-gray-400"
            }`}
          >
            {lesson.description}
          </p>

          {lesson.resources &&
            lesson.resources.length > 0 &&
            !lesson.isLocked && (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FaDownload />
                  <span>{lesson.resources.length} downloadable resources</span>
                </div>
              </div>
            )}

          {!lesson.isLocked &&
            lesson.watchTime !== undefined &&
            lesson.watchTime > 0 && (
              <div className="mb-4">
                <div className="items-center gap-2 text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md inline-flex">
                  <FaClock />
                  <span>Watched: {formattedWatchTime}</span>
                </div>
              </div>
            )}

          <button
            onClick={() => !lesson.isLocked && onLessonClick(lesson)}
            disabled={lesson.isLocked}
            className={`w-full py-2.5 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              lesson.isLocked
                ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                : lesson.isCompleted
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
            } ${!lesson.isLocked && "hover:scale-[1.02] active:scale-[0.98]"}`}
          >
            <FaPlay className="text-xs" />
            <span>
              {lesson.isCompleted
                ? "Watch Again"
                : lesson.isLocked
                ? "Locked"
                : lesson.progressPercent && lesson.progressPercent > 0
                ? "Continue"
                : "Start"}
            </span>
          </button>
        </div>

        {lesson.isLocked && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="text-center">
              <FaLock className="text-3xl text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-xs font-semibold">
                Complete previous lessons
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
);
LessonCardGrid.displayName = "LessonCardGrid";

export default function LearningPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleId = searchParams.get("moduleId");

  const [moduleData, setModuleData] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchModuleData = useCallback(
    async (showRefreshIndicator = false) => {
      if (!moduleId) {
        setError("No module ID provided");
        setLoading(false);
        return;
      }

      try {
        if (showRefreshIndicator) {
          setIsRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const response = await fetch(
          `/api/course/learning?moduleId=${moduleId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch module data");
        }

        const data = await response.json();

        console.log("📚 Module data fetched:", {
          moduleId: data.id,
          moduleTitle: data.title,
          progress: data.progress,
          completedLessons: data.completedLessons,
          totalLessons: data.totalLessons,
          totalWatchTime: data.totalWatchTime,
          lessonsWithProgress: data.lessons.filter(
            (l: Lesson) => l.watchTime && l.watchTime > 0
          ).length,
          lessons: data.lessons.map((l: Lesson) => ({
            id: l.id,
            title: l.title,
            duration: l.duration,
            watchTime: l.watchTime,
            progressPercent: l.progressPercent,
            lastPosition: l.lastPosition,
            isCompleted: l.isCompleted,
          })),
        });

        setModuleData(data);
      } catch (err) {
        console.error("❌ Error fetching module:", err);
        setError("Failed to load module data");
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [moduleId]
  );

  const checkEnrollmentAccess = useCallback(async (courseId: string) => {
    try {
      const response = await fetch(`/api/course/check-enrollment?courseId=${courseId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        router.push(`/users/courses/${courseId}`);
        return false;
      }

      const data = await response.json();

      if (!data.enrolled && !data.isOwner) {
        router.push(`/users/courses/${courseId}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Enrollment check failed:', error);
      router.push('/users/courses');
      return false;
    }
  }, [router]);

  const fetchModuleDataUpdated = useCallback(
    async (showRefreshIndicator = false) => {
      if (!moduleId) {
        setError("No module ID provided");
        setLoading(false);
        return;
      }

      try {
        if (showRefreshIndicator) {
          setIsRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const response = await fetch(
          `/api/course/learning?moduleId=${moduleId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch module data");
        }

        const data = await response.json();

        console.log("📚 Module data fetched:", {
          moduleId: data.id,
          moduleTitle: data.title,
          courseId: data.course?.id, // ✅ Added
          progress: data.progress,
          completedLessons: data.completedLessons,
          totalLessons: data.totalLessons,
          totalWatchTime: data.totalWatchTime,
          lessonsWithProgress: data.lessons.filter(
            (l: Lesson) => l.watchTime && l.watchTime > 0
          ).length,
        });

        // ✅ NEW: Check enrollment after getting module data
        if (data.course?.id) {
          const hasAccess = await checkEnrollmentAccess(data.course.id);
          if (!hasAccess) {
            return; // Stop processing if no access
          }
        }

        setModuleData(data);
      } catch (err) {
        console.error("❌ Error fetching module:", err);
        setError("Failed to load module data");
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [moduleId, checkEnrollmentAccess] // ✅ Add to dependencies
  );

  useEffect(() => {
    fetchModuleDataUpdated(false);
  }, [fetchModuleDataUpdated]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && moduleId) {
        console.log("👀 Page visible - refreshing data...");
        fetchModuleDataUpdated(true);
      }
    };

    const handleFocus = () => {
      if (moduleId) {
        console.log("🔍 Window focused - refreshing data...");
        fetchModuleDataUpdated(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [moduleId, fetchModuleDataUpdated]);

  const handleManualRefresh = useCallback(() => {
    console.log("🔄 Manual refresh triggered");
    fetchModuleDataUpdated(true);
  }, [fetchModuleDataUpdated]);

  const handleLessonClick = useCallback(
    (lesson: Lesson) => {
      if (!lesson.isLocked) {
        console.log("▶️ Starting lesson:", lesson.title);
        router.push(`/users/videoplayer?lessonId=${lesson.id}`);
      }
    },
    [router]
  );

  const toggleLessonExpand = useCallback((lessonId: string) => {
    setExpandedLesson((prev) => (prev === lessonId ? null : lessonId));
  }, []);

  // Calculate actual combined progress from all videos
  const actualProgress = useMemo(() => {
    if (!moduleData?.lessons?.length) return 0;

    const totalProgress = moduleData.lessons.reduce((sum, lesson) => {
      const lessonProgress =
        lesson.progressPercent ?? (lesson.isCompleted ? 100 : 0);
      return sum + lessonProgress;
    }, 0);

    const averageProgress = totalProgress / moduleData.lessons.length;
    return Math.round(averageProgress);
  }, [moduleData]);

  // Calculate total watch time from all videos
  const totalWatchTime = useMemo(() => {
    if (!moduleData?.lessons?.length) return 0;

    return moduleData.lessons.reduce((sum, lesson) => {
      return sum + (lesson.watchTime || 0);
    }, 0);
  }, [moduleData]);

  // Calculate total duration from all lessons
  const totalDuration = useMemo(() => {
    if (!moduleData?.lessons?.length) return "0m";

    const totalSeconds = calculateTotalDuration(moduleData.lessons);
    return formatDuration(totalSeconds);
  }, [moduleData]);

  // Count lessons with any progress
  const lessonsInProgress = useMemo(() => {
    if (!moduleData?.lessons?.length) return 0;

    return moduleData.lessons.filter(
      (lesson) =>
        (lesson.watchTime && lesson.watchTime > 0) ||
        lesson.progressPercent ||
        lesson.isCompleted
    ).length;
  }, [moduleData]);

  // Count lessons not started
  const lessonsNotStarted = useMemo(() => {
    if (!moduleData?.lessons?.length) return 0;

    return moduleData.lessons.filter(
      (lesson) =>
        !lesson.isCompleted &&
        (!lesson.watchTime || lesson.watchTime === 0) &&
        !lesson.progressPercent
    ).length;
  }, [moduleData]);

  if (loading && !isRefreshing) {
    return <LoadingSkeletonView viewMode={viewMode} />;
  }

  if (error || !moduleData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 mt-20">
        <div className="text-center max-w-md">
          <FaExclamationTriangle className="text-red-500 text-6xl mx-auto mb-6" />
          <h1 className="text-white text-3xl font-black mb-4">
            {error || "Module Not Found"}
          </h1>
          <button
            onClick={() => router.back()}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-xl font-bold hover:scale-105 transition-transform inline-flex items-center gap-3"
          >
            <FaArrowLeft />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const completedLessons =
    moduleData.completedLessons ||
    moduleData.lessons.filter((l) => l.isCompleted).length;
  const totalLessons = moduleData.totalLessons || moduleData.lessons.length;

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden mt-20">
      <div className="relative z-10">
        {/* ✨ HERO HEADER SECTION */}
        <section className="relative w-full pt-8 sm:pt-12 md:pt-16 pb-8 sm:pb-12 md:pb-16">
          <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 pb-6 sm:pb-8 md:pb-10 lg:pb-12">
            <div className="max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
              {/* Back Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => {
                  if (moduleData?.course?.id) {
                    router.push(
                      `/users/courseinside?courseId=${moduleData.course.id}`
                    );
                  } else {
                    router.back();
                  }
                }}
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 sm:mb-8 hover:translate-x-[-5px] transition-all group"
              >
                <FaArrowLeft className="text-sm sm:text-base group-hover:animate-pulse" />
                <span className="text-sm sm:text-base font-semibold">
                  Back to {moduleData?.course?.title || "Modules"}
                </span>
              </motion.button>

              {/* Professional Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 sm:mb-10 md:mb-12"
              >
                {/* Main Heading with Badge */}
                <div className="relative mb-6 sm:mb-8">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                  >
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                        <span className="inline-block text-white">
                          {moduleData.title}
                        </span>
                      </h1>
                      <span
                        className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                          moduleData.difficulty === "Beginner"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : moduleData.difficulty === "Intermediate"
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {moduleData.difficulty}
                      </span>
                    </div>

                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      className="h-1 sm:h-1.5 bg-gradient-to-r from-red-600 to-transparent mt-2 sm:mt-3 rounded-full max-w-2xl"
                    />
                  </motion.div>
                </div>

                {/* ✨ STATS DASHBOARD - MOBILE OPTIMIZED */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="bg-gradient-to-br from-gray-900/90 via-red-900/10 to-black/95 border border-red-500/30 rounded-xl sm:rounded-2xl backdrop-blur-xl overflow-hidden"
                >
                  {/* MOBILE VERSION - Compact Single Line */}
                  <div className="sm:hidden">
                    <div className="flex items-center justify-between gap-1 px-2 py-2.5">
                      <StatItemMobile
                        icon={FaRocket}
                        label="Progress"
                        value={`${actualProgress}%`}
                      />
                      <div className="w-px h-6 bg-red-500/20 flex-shrink-0" />
                      <StatItemMobile
                        icon={FaCheckCircle}
                        label="Done"
                        value={`${completedLessons}/${totalLessons}`}
                      />
                      <div className="w-px h-6 bg-red-500/20 flex-shrink-0" />
                      <StatItemMobile
                        icon={FaClock}
                        label="Duration"
                        value={totalDuration}
                      />
                      <div className="w-px h-6 bg-red-500/20 flex-shrink-0" />
                      <StatItemMobile
                        icon={FaFire}
                        label="Watched"
                        value={formatWatchTime(totalWatchTime)}
                      />
                    </div>

                    {/* Compact Mobile Progress Bar */}
                    <div className="px-2 pb-2.5">
                      <div className="relative w-full h-2 bg-gray-800/50 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${actualProgress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 via-red-500 to-red-600 rounded-full"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* PC VERSION - Compact Layout */}
                  <div className="hidden sm:block p-3 sm:p-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
                      <StatItem
                        icon={FaRocket}
                        label="Progress"
                        value={`${actualProgress}%`}
                        isGradient
                      />
                      <StatItem
                        icon={FaCheckCircle}
                        label="Completed"
                        value={`${completedLessons}/${totalLessons}`}
                      />
                      <StatItem
                        icon={FaClock}
                        label="Duration"
                        value={totalDuration}
                        isText
                      />
                      <StatItem
                        icon={FaFire}
                        label="Watch Time"
                        value={formatWatchTime(totalWatchTime)}
                      />
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-gray-400 font-semibold">
                          Course Completion
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-black">
                            {actualProgress}%
                          </span>
                          {lessonsInProgress > completedLessons && (
                            <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                              {lessonsInProgress - completedLessons} in progress
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="relative w-full h-2.5 sm:h-3 bg-gray-800/50 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${actualProgress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 via-red-500 to-red-600 rounded-full"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                        </motion.div>
                      </div>

                      {/* Detailed breakdown */}
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                        <span className="flex items-center gap-1">
                          <FaCheckCircle className="text-green-500" />
                          {completedLessons} completed
                        </span>
                        <span className="flex items-center gap-1">
                          <FaChartLine className="text-yellow-500" />
                          {lessonsInProgress - completedLessons} in progress
                        </span>
                        <span className="flex items-center gap-1">
                          <FaLock className="text-gray-600" />
                          {lessonsNotStarted} not started
                        </span>
                      </div>
                    </div>

                    {/* Achievement Badge */}
                    {actualProgress >= 100 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-5 p-4 bg-gradient-to-r from-green-900/30 to-green-800/30 border border-green-500/40 rounded-xl flex items-center gap-3"
                      >
                        <FaTrophy className="text-yellow-400 text-2xl" />
                        <div>
                          <p className="text-green-400 font-bold text-sm">
                            Module Completed! 🎉
                          </p>
                          <p className="text-gray-400 text-xs">
                            You've mastered this module
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </motion.div>

              {/* ✨ SECTION HEADER WITH CONTROLS */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6"
              >
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-red-600 to-red-700 rounded-full" />
                  <div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white flex items-center gap-2">
                      COURSE LESSONS
                    </h2>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ✨ LESSONS SECTION */}
        <section className="relative w-full pb-12 sm:pb-16 md:pb-20">
          <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
            <div className="max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
              {viewMode === "list" ? (
                <div className="space-y-4">
                  {moduleData.lessons.map((lesson, index) => (
                    <LessonCardList
                      key={lesson.id}
                      lesson={lesson}
                      index={index}
                      totalLessons={totalLessons}
                      isExpanded={expandedLesson === lesson.id}
                      onToggleExpand={toggleLessonExpand}
                      onLessonClick={handleLessonClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                  {moduleData.lessons.map((lesson, index) => (
                    <LessonCardGrid
                      key={lesson.id}
                      lesson={lesson}
                      index={index}
                      totalLessons={totalLessons}
                      onLessonClick={handleLessonClick}
                    />
                  ))}
                </div>
              )}

              {/* ✨ CERTIFICATE SECTION */}
              {actualProgress >= 100 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-12 bg-gradient-to-br from-yellow-900/20 via-gray-900/90 to-black/95 border border-yellow-500/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 backdrop-blur-xl"
                >
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-600 to-yellow-700 flex items-center justify-center">
                      <FaCertificate className="text-white text-3xl" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-2xl sm:text-3xl font-black text-white mb-2 flex items-center justify-center sm:justify-start gap-2">
                        <FaStar className="text-yellow-400" />
                        Certificate Available!
                      </h3>
                      <p className="text-gray-300 text-sm sm:text-base">
                        Congratulations! You've completed this module. Download
                        your certificate to showcase your achievement.
                      </p>
                    </div>
                    <button className="flex-shrink-0 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 flex items-center gap-2">
                      <FaDownload />
                      Download
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Enhanced Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }

          .animate-fadeIn,
          .animate-slideIn,
          .animate-shimmer {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}