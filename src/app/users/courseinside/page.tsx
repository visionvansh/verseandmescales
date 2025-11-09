// app/users/courseinside/page.tsx
"use client";

import React, { useState, useRef, useMemo, useCallback, useEffect, memo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaRocket,
  FaBolt,
  FaFire,
  FaExclamationTriangle,
  FaChevronLeft,
  FaChevronRight,
  FaGem,
  FaUsers,
  FaSearch,
  FaBook,
  FaTrophy,
  FaChartLine,
} from 'react-icons/fa';

// Import Chat Components
import { ChatInterface } from '@/components/course-builder/ChatsComponents';

// Import Module Components and Types
import {
  Module,
  DifficultyBadge,
  ModuleCardMobile,
  ModuleCardDesktop,
  ModuleCardFull,
} from '@/components/course-builder/ModulesComponents';

// ✅ ADD THIS: Import RatingComponent
import { RatingComponent } from '@/components/course-builder/RatingComponent';

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format duration from seconds to readable format
 * Automatically converts 60+ seconds to minutes and 60+ minutes to hours
 */
const formatDuration = (seconds: string | number | undefined): string => {
  if (!seconds) return "0m";
  
  // Convert to number and round to whole seconds
  let totalSeconds = typeof seconds === 'string' ? parseFloat(seconds) : seconds;
  
  if (isNaN(totalSeconds) || totalSeconds < 0) return "0m";
  
  // Round to whole seconds
  totalSeconds = Math.round(totalSeconds);
  
  // Calculate hours, minutes, and seconds
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  // Format based on largest unit
  if (hours > 0) {
    // Has hours
    if (minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${hours}h`;
    }
  } else if (minutes > 0) {
    // Has minutes but no hours
    if (secs > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${minutes}m`;
    }
  } else {
    // Only seconds
    return `${secs}s`;
  }
};

/**
 * Calculate total duration from all lessons (returns rounded seconds)
 */
const calculateTotalDuration = (lessons: any[]): number => {
  if (!lessons || lessons.length === 0) return 0;
  
  const total = lessons.reduce((sum, lesson) => {
    // Parse duration to number
    const duration = typeof lesson.duration === 'string' 
      ? parseFloat(lesson.duration) 
      : (lesson.duration || 0);
    
    // Add rounded duration to sum
    return sum + (isNaN(duration) ? 0 : Math.round(duration));
  }, 0);
  
  // Round final total
  const roundedTotal = Math.round(total);
  
  console.log('📊 Total duration calculated:', roundedTotal, 'seconds from', lessons.length, 'lessons');
  console.log('   Formatted:', formatDuration(roundedTotal));
  
  return roundedTotal;
};

/**
 * Calculate module progress based on lessons
 */
const calculateModuleProgress = (lessons: any[]): number => {
  if (!lessons || lessons.length === 0) return 0;
  
  const totalProgress = lessons.reduce((sum, lesson) => {
    const lessonProgress = lesson.progressPercent ?? (lesson.isCompleted ? 100 : 0);
    return sum + lessonProgress;
  }, 0);
  
  return Math.round(totalProgress / lessons.length);
};

/**
 * Count completed lessons
 */
const countCompletedLessons = (lessons: any[]): number => {
  if (!lessons || lessons.length === 0) return 0;
  return lessons.filter(lesson => lesson.isCompleted).length;
};

// ============================================
// SKELETON LOADING COMPONENTS
// ============================================

const SkeletonBox = memo(({ className = "" }: { className?: string }) => (
  <div className={`bg-gray-800/50 rounded skeleton-pulse ${className}`} />
));
SkeletonBox.displayName = "SkeletonBox";

const CourseHeaderSkeleton = memo(() => (
  <div className="mb-6 sm:mb-8 md:mb-10">
    {/* Title Skeleton */}
    <div className="relative mb-4 sm:mb-6 md:mb-8">
      <SkeletonBox className="h-10 sm:h-12 md:h-16 w-full max-w-md rounded-2xl mb-2 sm:mb-3" />
      <SkeletonBox className="h-0.5 sm:h-1 w-full max-w-md rounded-full" />
    </div>

    {/* Tab Navigation Skeleton */}
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 md:p-3">
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {[1, 2, 3].map((i) => (
          <SkeletonBox key={i} className="h-14 sm:h-16 md:h-20 rounded-lg sm:rounded-xl" />
        ))}
      </div>
    </div>
  </div>
));
CourseHeaderSkeleton.displayName = "CourseHeaderSkeleton";

const FeaturedModuleSkeleton = memo(() => (
  <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 skeleton-pulse">
    <div className="flex items-start gap-4 mb-4">
      <SkeletonBox className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <SkeletonBox className="w-3/4 h-6 sm:h-7 mb-2" />
        <SkeletonBox className="w-20 h-5 rounded-full" />
      </div>
    </div>
    
    <div className="space-y-2 mb-4">
      <SkeletonBox className="w-full h-4" />
      <SkeletonBox className="w-5/6 h-4" />
    </div>

    <div className="grid grid-cols-3 gap-3 mb-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="text-center">
          <SkeletonBox className="w-16 h-4 mb-2 mx-auto" />
          <SkeletonBox className="w-12 h-6 mx-auto" />
        </div>
      ))}
    </div>

    <SkeletonBox className="w-full h-12 rounded-lg" />
  </div>
));
FeaturedModuleSkeleton.displayName = "FeaturedModuleSkeleton";

const ModuleCardSkeleton = memo(() => (
  <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 skeleton-pulse">
    <div className="flex items-start gap-4 mb-4">
      <SkeletonBox className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <SkeletonBox className="w-3/4 h-6 sm:h-7 mb-2" />
        <SkeletonBox className="w-24 h-5 rounded-full" />
      </div>
    </div>
    
    <div className="space-y-2 mb-4">
      <SkeletonBox className="w-full h-4" />
      <SkeletonBox className="w-5/6 h-4" />
      <SkeletonBox className="w-4/5 h-4" />
    </div>

    <div className="flex gap-3 mb-4">
      <SkeletonBox className="w-20 h-4" />
      <SkeletonBox className="w-24 h-4" />
      <SkeletonBox className="w-20 h-4" />
    </div>

    <SkeletonBox className="w-full h-2 rounded-full mb-2" />
    
    <div className="flex gap-3">
      <SkeletonBox className="flex-1 h-12 rounded-lg" />
      <SkeletonBox className="w-12 h-12 rounded-lg" />
    </div>
  </div>
));
ModuleCardSkeleton.displayName = "ModuleCardSkeleton";

const CourseInsideLoadingSkeleton = memo(() => (
  <div className="relative w-full min-h-screen overflow-x-hidden mt-20">
    <div className="relative z-10">
      {/* Header Section */}
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4 sm:py-6 md:py-8 lg:py-10">
        <div className="max-w-full sm:max-w-[95%] md:max-w-[92%] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
          <CourseHeaderSkeleton />
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="max-w-full sm:max-w-[95%] md:max-w-[92%] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
          
          {/* Featured Modules Section */}
          <section className="relative w-full py-4 sm:py-6 md:py-8 lg:py-10">
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-5">
                <SkeletonBox className="h-8 sm:h-10 md:h-12 w-48 sm:w-64" />
                <div className="hidden md:flex gap-2">
                  <SkeletonBox className="w-10 h-10 md:w-12 md:h-12 rounded-xl" />
                  <SkeletonBox className="w-10 h-10 md:w-12 md:h-12 rounded-xl" />
                </div>
              </div>

              {/* Mobile: Horizontal Scroll Skeleton */}
              <div className="md:hidden">
                <div className="flex gap-3 sm:gap-4 overflow-hidden">
                  {[1, 2].map((i) => (
                    <div key={i} className="min-w-[90vw] xs:min-w-[85vw] sm:min-w-[75vw]">
                      <FeaturedModuleSkeleton />
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop: Grid Skeleton */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
                {[1, 2, 3].map((i) => (
                  <FeaturedModuleSkeleton key={i} />
                ))}
              </div>
            </div>
          </section>

          {/* All Modules Section */}
          <section className="relative w-full py-4 sm:py-6 md:py-8 lg:py-10">
            <SkeletonBox className="h-8 sm:h-10 md:h-12 w-48 sm:w-64 mb-4 sm:mb-5 md:mb-6" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-7 xl:gap-8">
              {[1, 2, 3, 4].map((i) => (
                <ModuleCardSkeleton key={i} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>

    <style jsx global>{`
      .skeleton-pulse {
        animation: skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      @keyframes skeleton-pulse {
        0%, 100% {
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
));
CourseInsideLoadingSkeleton.displayName = "CourseInsideLoadingSkeleton";

// ============================================
// MAIN COMPONENT
// ============================================

const categories = [
  { id: 'all', label: 'All', icon: FaBook },
  { id: 'trending', label: 'Trending', icon: FaFire },
  { id: 'popular', label: 'Popular', icon: FaTrophy },
  { id: 'new', label: 'New', icon: FaChartLine },
];

export default function CourseInsidePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');

  const [activeTab, setActiveTab] = useState<"courses" | "chat" | "support">("courses");
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarkedModules, setBookmarkedModules] = useState<Set<string>>(new Set());

  // Refs for horizontal scrolling
  const featuredScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (courseId) {
      checkEnrollmentAccess();
      fetchModules();
    }
  }, [courseId]);

  const checkEnrollmentAccess = async () => {
    try {
      const response = await fetch(`/api/course/check-enrollment?courseId=${courseId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        router.push(`/users/courses/${courseId}`);
        return;
      }

      const data = await response.json();

      if (!data.enrolled && !data.isOwner) {
        router.push(`/users/courses/${courseId}`);
      }
    } catch (error) {
      console.error('Enrollment check failed:', error);
      router.push(`/users/courses/${courseId}`);
    }
  };

  const fetchModules = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/course/modules?courseId=${courseId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch modules');
      }

      const data = await response.json();
      
      console.log('📦 Raw modules data:', data);
      
      // Transform modules with proper duration handling
      const transformedModules = await Promise.all(
        data.map(async (module: any, index: number) => {
          console.log(`🔍 Processing module: ${module.title}`);
          
          // Process lessons with rounded durations
          let lessonsWithProgress = (module.lessons || []).map((lesson: any) => {
            // Parse and round duration to whole seconds
            const rawDuration = typeof lesson.duration === 'string' 
              ? parseFloat(lesson.duration) 
              : (lesson.duration || 0);
            
            const roundedDuration = Math.round(isNaN(rawDuration) ? 0 : rawDuration);
            
            return {
              ...lesson,
              duration: roundedDuration, // Store as rounded number
              isCompleted: false,
              progressPercent: 0,
              watchTime: 0,
            };
          });
          
          console.log('📝 Processed lessons:', lessonsWithProgress.map((l: any) => ({
            title: l.title,
            duration: l.duration,
            formatted: formatDuration(l.duration)
          })));
          
          try {
            // Try to fetch detailed progress from the learning API
            const progressResponse = await fetch(`/api/course/learning?moduleId=${module.id}`);
            if (progressResponse.ok) {
              const progressData = await progressResponse.json();
              console.log('✅ Got progress data for module:', module.title);
              
              // Merge progress data with lessons
              if (progressData.lessons && progressData.lessons.length > 0) {
                lessonsWithProgress = progressData.lessons.map((progressLesson: any) => {
                  // Find original lesson to get duration
                  const originalLesson = (module.lessons || []).find((l: any) => l.id === progressLesson.id);
                  const rawDuration = originalLesson?.duration || progressLesson.duration || 0;
                  
                  // Parse and round duration
                  const duration = typeof rawDuration === 'string' 
                    ? parseFloat(rawDuration) 
                    : rawDuration;
                  
                  const roundedDuration = Math.round(isNaN(duration) ? 0 : duration);
                  
                  return {
                    ...progressLesson,
                    duration: roundedDuration, // Store as rounded number
                  };
                });
              }
            }
          } catch (err) {
            console.warn(`⚠️ Could not fetch progress for module ${module.id}:`, err);
          }

          // Calculate module stats
          const progress = calculateModuleProgress(lessonsWithProgress);
          const completedLessons = countCompletedLessons(lessonsWithProgress);
          const totalLessons = lessonsWithProgress.length;
          
          // Calculate total duration in SECONDS (already rounded)
          const totalDurationSeconds = calculateTotalDuration(lessonsWithProgress);
          
          // Format for display
          const totalDurationFormatted = formatDuration(totalDurationSeconds);
          
          console.log('📊 Module stats:', {
            title: module.title,
            totalLessons,
            completedLessons,
            progress: `${progress}%`,
            totalDurationSeconds,
            totalDurationFormatted,
            lessons: lessonsWithProgress.map((l: any) => ({
              title: l.title,
              durationSeconds: l.duration,
              formatted: formatDuration(l.duration)
            }))
          });

          // Calculate total watch time
          const totalWatchTime = lessonsWithProgress.reduce((sum: number, lesson: any) => {
            return sum + (lesson.watchTime || 0);
          }, 0);

          return {
            ...module,
            progress,
            completedLessons,
            totalLessons,
            duration: totalDurationFormatted,
            totalDuration: totalDurationFormatted,
            durationSeconds: totalDurationSeconds,
            totalWatchTime,
            isLocked: false,
            isFeatured: index === 0,
            certificate: true,
            color: "from-red-600 to-red-700",
            skills: module.learningOutcomes || module.skills || [],
            prerequisites: module.prerequisites || [],
            lessons: lessonsWithProgress.map((lesson: any) => ({
              ...lesson,
              durationFormatted: formatDuration(lesson.duration)
            }))
          };
        })
      );
      
      console.log('✅ Final transformed modules:', transformedModules.map(m => ({
        id: m.id,
        title: m.title,
        progress: m.progress,
        completedLessons: m.completedLessons,
        totalLessons: m.totalLessons,
        duration: m.duration,
        totalDuration: m.totalDuration,
        durationSeconds: m.durationSeconds,
        lessonsCount: m.lessons?.length,
      })));
      
      setModules(transformedModules);
    } catch (err) {
      console.error('❌ Error fetching modules:', err);
      setError('Failed to load course modules');
    } finally {
      setLoading(false);
    }
  };

  const chatModules = useMemo(() => {
    return modules.map((module) => ({
      id: module.id,
      title: module.title,
      lessons: (module.lessons || []).map((lesson: any) => ({
        id: lesson.id,
        title: lesson.title,
        duration: lesson.durationFormatted || formatDuration(lesson.duration),
        moduleId: module.id,
        moduleTitle: module.title,
        videoUrl: lesson.videoUrl || lesson.video || '',
        questionCount: lesson.questionCount || 0,
      })),
      isExpanded: false,
    }));
  }, [modules]);

  const scrollContainer = useCallback((ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref?.current) {
      const scrollAmount = ref.current.clientWidth * 0.8;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  }, []);

  const toggleBookmark = useCallback((moduleId: string) => {
    setBookmarkedModules(prev => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(moduleId)) {
        newBookmarks.delete(moduleId);
      } else {
        newBookmarks.add(moduleId);
      }
      return newBookmarks;
    });
  }, []);

  const handleExpand = useCallback((moduleId: string) => {
    setExpandedModule(prevExpanded => prevExpanded === moduleId ? null : moduleId);
  }, []);

  const handleStartModule = useCallback((moduleId: string) => {
    router.push(`/users/learning?moduleId=${moduleId}`);
  }, [router]);

  const filteredModules = useMemo(() => {
    return modules.filter(module => {
      const matchesSearch = module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           module.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = filterDifficulty === "all" || module.difficulty === filterDifficulty;
      return matchesSearch && matchesDifficulty;
    });
  }, [modules, searchQuery, filterDifficulty]);

  const featuredModules = useMemo(() => modules.filter(m => m.isFeatured), [modules]);

  // Show skeleton while loading
  if (loading) {
    return <CourseInsideLoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="relative w-full min-h-screen overflow-x-hidden mt-20">
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6">
          <div className="text-center w-full max-w-sm sm:max-w-md mx-auto px-4">
            <div className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 backdrop-blur-xl">
              <FaExclamationTriangle className="text-red-500 text-5xl sm:text-6xl md:text-7xl mx-auto mb-4 sm:mb-6" />
              <h1 className="text-white text-xl sm:text-2xl md:text-3xl font-black mb-3 sm:mb-4">{error}</h1>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8">
                We couldn't load the course modules. Please try again.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => router.back()}
                  className="flex-1 bg-gray-900/50 border border-red-500/30 text-white px-5 sm:px-6 py-3 sm:py-3.5 rounded-lg sm:rounded-xl text-sm sm:text-base font-bold hover:bg-gray-800/50 transition-all active:scale-95 touch-manipulation"
                >
                  Go Back
                </button>
                <button
                  onClick={fetchModules}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-5 sm:px-6 py-3 sm:py-3.5 rounded-lg sm:rounded-xl text-sm sm:text-base font-bold hover:scale-105 active:scale-95 transition-all touch-manipulation"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden mt-20">
      <div className="relative z-10">
        {/* Header Section */}
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4 sm:py-6 md:py-8 lg:py-10">
          <div className="max-w-full sm:max-w-[95%] md:max-w-[92%] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
            
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 sm:mb-8 md:mb-10"
            >
              {/* Main Heading */}
              <div className="relative mb-4 sm:mb-6 md:mb-8">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative"
                >
                  <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                    <span className="inline-block text-white">
                      Course
                    </span>
                    <span className="inline-block text-red-600 ml-2 sm:ml-3 md:ml-4">
                      Learning
                    </span>
                  </h1>

                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="h-0.5 sm:h-1 bg-gradient-to-r from-red-600 to-transparent mt-2 sm:mt-2.5 md:mt-3 rounded-full"
                  />
                </motion.div>
              </div>

              {/* Tab Navigation */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-4 sm:mb-6 md:mb-8"
              >
                <div className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 md:p-3 backdrop-blur-xl">
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {[
                      { id: "courses" as const, label: "Courses", icon: FaRocket },
                      { id: "chat" as const, label: "Chat", icon: FaUsers },
                      { id: "support" as const, label: "Support", icon: FaBolt, badge: "Soon" }
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          disabled={tab.badge === "Soon"}
                          className={`relative py-3 sm:py-4 md:py-5 lg:py-6 px-3 sm:px-4 md:px-5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm md:text-base transition-all duration-300 touch-manipulation active:scale-95 ${
                            isActive
                              ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/20"
                              : tab.badge === "Soon"
                              ? "bg-gray-900/50 text-gray-600 cursor-not-allowed"
                              : "bg-gray-900/50 text-gray-400 hover:bg-gray-800/50 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                            <Icon className={`text-base sm:text-lg md:text-xl flex-shrink-0 ${isActive ? "text-white" : "text-current"}`} />
                            <span className="truncate">{tab.label}</span>
                            {tab.badge && (
                              <span className="px-1.5 sm:px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-[9px] sm:text-[10px] rounded-full font-bold whitespace-nowrap">
                                {tab.badge}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Chat Tab Content */}
        {activeTab === "chat" && (
          <section className="relative w-full py-4 sm:py-6 md:py-8">
            <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
              <div className="max-w-full sm:max-w-[95%] md:max-w-[92%] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
                {courseId && chatModules.length > 0 ? (
                  <ChatInterface 
                    courseId={courseId}
                    modules={chatModules}
                  />
                ) : loading ? (
                  <div className="flex items-center justify-center py-12 sm:py-16">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 sm:h-14 sm:w-14 border-b-2 border-red-500 mx-auto mb-4"></div>
                      <p className="text-gray-400 text-sm sm:text-base">Loading chat...</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 sm:py-16">
                    <div className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 backdrop-blur-xl max-w-md mx-auto">
                      <FaExclamationTriangle className="text-red-500 text-5xl sm:text-6xl mx-auto mb-4" />
                      <p className="text-white font-bold text-lg sm:text-xl mb-2">No Course Data</p>
                      <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                        Please select a course or try refreshing the page.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Courses Tab Content */}
        {activeTab === "courses" && (
          <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="max-w-full sm:max-w-[95%] md:max-w-[92%] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
              
              {/* Featured Modules */}
              {featuredModules.length > 0 && (
                <section className="relative w-full py-4 sm:py-6 md:py-8 lg:py-10">
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-5">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white truncate">
                          <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">FEATURED</span> MODULES
                        </h2>
                        <p className="text-gray-400 text-xs sm:text-sm md:text-base mt-1 truncate">
                          Start with these high-impact courses
                        </p>
                      </div>
                      
                      {/* Desktop Navigation */}
                      <div className="hidden md:flex gap-2 ml-4 flex-shrink-0">
                        <button
                          onClick={() => scrollContainer(featuredScrollRef, 'left')}
                          className="bg-gray-900/50 border border-red-500/30 p-2.5 md:p-3 rounded-xl text-white hover:bg-red-900/30 transition-all touch-manipulation active:scale-95"
                          aria-label="Scroll Left"
                        >
                          <FaChevronLeft className="text-sm md:text-base" />
                        </button>
                        <button
                          onClick={() => scrollContainer(featuredScrollRef, 'right')}
                          className="bg-gray-900/50 border border-red-500/30 p-2.5 md:p-3 rounded-xl text-white hover:bg-red-900/30 transition-all touch-manipulation active:scale-95"
                          aria-label="Scroll right"
                        >
                          <FaChevronRight className="text-sm md:text-base" />
                        </button>
                      </div>
                    </div>

                    {/* Mobile: Horizontal Scroll */}
                    <div className="md:hidden relative">
                      <div 
                        ref={featuredScrollRef}
                        className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
                        style={{ 
                          scrollbarWidth: 'none', 
                          msOverflowStyle: 'none',
                          WebkitOverflowScrolling: 'touch'
                        }}
                      >
                        {featuredModules.map((module, index) => (
                          <div
                            key={module.id}
                            className="min-w-[90vw] xs:min-w-[85vw] sm:min-w-[75vw] snap-center first:ml-0 last:mr-0"
                          >
                            <ModuleCardMobile 
                              module={module} 
                              bookmarked={bookmarkedModules.has(module.id)} 
                              onToggleBookmark={toggleBookmark} 
                              onExpand={handleExpand} 
                              isExpanded={expandedModule === module.id}
                              onStartModule={handleStartModule}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Mobile Scroll Indicators */}
                      <div className="flex justify-center gap-2 sm:gap-3 mt-4">
                        <button
                          onClick={() => scrollContainer(featuredScrollRef, 'left')}
                          className="bg-gray-900/50 border border-red-500/30 p-3 sm:p-3.5 rounded-full text-white hover:bg-red-900/30 transition-all touch-manipulation active:scale-90"
                          aria-label="Scroll left"
                        >
                          <FaChevronLeft className="text-sm" />
                        </button>
                        <button
                          onClick={() => scrollContainer(featuredScrollRef, 'right')}
                          className="bg-gray-900/50 border border-red-500/30 p-3 sm:p-3.5 rounded-full text-white hover:bg-red-900/30 transition-all touch-manipulation active:scale-90"
                          aria-label="Scroll right"
                        >
                          <FaChevronRight className="text-sm" />
                        </button>
                      </div>
                    </div>

                    {/* Desktop: Grid */}
                    <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
                      {featuredModules.map((module, index) => (
                        <ModuleCardDesktop 
                          key={module.id} 
                          module={module} 
                          bookmarked={bookmarkedModules.has(module.id)} 
                          onToggleBookmark={toggleBookmark} 
                          onExpand={handleExpand} 
                          isExpanded={expandedModule === module.id}
                          onStartModule={handleStartModule}
                        />
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* All Modules Grid */}
              <section className="relative w-full py-4 sm:py-6 md:py-8 lg:py-10">
                <div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white mb-4 sm:mb-5 md:mb-6">
                    ALL <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">MODULES</span>
                  </h2>

                  {filteredModules.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-7 xl:gap-8">
                      {filteredModules.map((module, idx) => (
                        <ModuleCardFull 
                          key={module.id} 
                          module={module} 
                          bookmarked={bookmarkedModules.has(module.id)} 
                          onToggleBookmark={toggleBookmark} 
                          onExpand={handleExpand} 
                          isExpanded={expandedModule === module.id}
                          onStartModule={handleStartModule}
                        />
                      ))}
                    </div>
                  ) : (
                    <motion.div
                      className="text-center py-12 sm:py-16 md:py-20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <FaFire className="text-5xl sm:text-6xl md:text-7xl text-gray-700 mx-auto mb-4 sm:mb-5" />
                      <p className="text-gray-500 text-sm sm:text-base md:text-lg">
                        No modules found matching your criteria
                      </p>
                    </motion.div>
                  )}
                </div>
              </section>

              {/* ============================================ */}
              {/* ✅ RATINGS & REVIEWS SECTION */}
              {/* Only show after user has made progress or completed some content */}
              {/* ============================================ */}
              {courseId && (
                <section className="relative w-full py-8 sm:py-12 md:py-16">
                  <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    {/* Section Header */}
                    <div className="text-center mb-8 sm:mb-12">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                      >
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">
                          <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
                            RATE THIS
                          </span>{' '}
                          <span className="text-white">COURSE</span>
                        </h2>
                        <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
                          Share your experience and help other students make informed decisions
                        </p>
                      </motion.div>
                    </div>

                    {/* Rating Component */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      <RatingComponent 
                        courseId={courseId}
                        onRatingSubmitted={() => {
                          console.log('Rating submitted successfully!');
                        }}
                      />
                    </motion.div>
                  </div>
                </section>
              )}

            </div>
          </div>
        )}

        {/* Support Tab (Coming Soon) */}
        {activeTab === "support" && (
          <section className="relative w-full py-8 sm:py-12 md:py-16 lg:py-20">
            <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
              <div className="max-w-full sm:max-w-[95%] md:max-w-[92%] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
                <motion.div
                  className="text-center py-12 sm:py-16 md:py-20 lg:py-24"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-xl sm:rounded-2xl md:rounded-3xl p-8 sm:p-10 md:p-12 lg:p-16 backdrop-blur-xl max-w-3xl mx-auto">
                    <FaGem className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-red-500 mx-auto mb-4 sm:mb-5 md:mb-6" />
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 sm:mb-4 md:mb-5">
                      Coming Soon
                    </h2>
                    <p className="text-gray-400 text-sm sm:text-base md:text-lg lg:text-xl mb-6 sm:mb-7 md:mb-8 leading-relaxed px-4">
                      Get personalized 1-on-1 support from our expert team to accelerate your growth.
                    </p>
                    <div className="inline-flex items-center space-x-2 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-red-600/20 border border-red-500/30 rounded-full">
                      <FaBolt className="text-red-500 text-base sm:text-lg md:text-xl" />
                      <span className="text-red-400 font-semibold text-xs sm:text-sm md:text-base">
                        Launching Soon
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}