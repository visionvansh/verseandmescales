// app/dashboard/users/page.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import {
  FaChevronRight,
  FaChevronLeft,
  FaCheckCircle,
  FaBullseye,
  FaClock,
  FaChartLine,
  FaBookOpen,
  FaUsers,
  FaRocket,
  FaGraduationCap,
  FaDollarSign,
  FaFire,
  FaTrophy,
  FaBars,
  FaTimes,
  FaHome,
  FaBook,
  FaCog,
  FaSignOutAlt,
  FaUser,
  FaBolt,
  FaStar,
  FaAward,
  FaMedal,
  FaUserFriends,
  FaLightbulb,
  FaHandshake,
  FaCrown,
  FaLayerGroup,
  FaPalette,
  FaEdit,
  FaEye,
  FaSearch,
  FaPlus,
  FaVideo,
  FaImage,
  FaQuoteRight,
  FaQuestion,
  FaColumns,
  FaSave,
  FaTrash,
  FaCode,
  FaTags,
  FaComment,
  FaPlay,
  FaCircle,
  FaStarHalfAlt,
  FaLock,
  FaUserCircle,
} from "react-icons/fa";

import { useAuth } from "@/contexts/AuthContext";

interface Question {
  id: string;
  title: string;
  subtitle?: string;
  icon: any;
  options: {
    value: string;
    label: string;
    icon: any;
    description?: string;
  }[];
}

// ============================================
// NEW: Enrolled Course Data Interface
// ============================================
interface EnrolledCourseData {
  id: string;
  title: string;
  thumbnail: string;
  progress: number;
  totalModules: number;
  completedModules: number;
  totalLessons: number;
  completedLessons: number;
  rating: number | null;
  userComment: string | null;
  unreadMessages: number;
  newQuestions: number;
  onlineUsers: number;
  lastAccessedAt: string;
  enrolledAt: string;
  averageRating: number;
  totalRatings: number;
}

// ============================================
// NEW: Published Course Data Interface
// ============================================
interface RecentBuyer {
  id: string;
  username: string;
  name: string | null;
  img: string | null;
  purchasedAt: string;
}

interface PublishedCourseData {
  id: string;
  title: string;
  thumbnail: string | null;
  averageRating: number;
  totalPurchases: number;
  totalRevenue: string;
  recentBuyers: RecentBuyer[];
  totalModules: number;
  publishedAt: string | null;
  status: string;
}

// ============================================
// ✅ IMPROVED: RATING STARS COMPONENT
// ============================================
const RatingStars = ({ 
  rating, 
  size = "md",
  showNumber = true,
  totalRatings,
  interactive = false,
  onRate
}: { 
  rating: number;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
  totalRatings?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}) => {
  const [hoveredStar, setHoveredStar] = useState(0);

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  const displayRating = interactive ? (hoveredStar || rating) : rating;
  const fullStars = Math.floor(displayRating);
  const hasHalfStar = displayRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1.5">
      <div className={`flex items-center gap-0.5 ${sizeClasses[size]}`}>
        {/* Full Stars */}
        {[...Array(fullStars)].map((_, i) => (
          <motion.button
            key={`full-${i}`}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate?.(i + 1)}
            onMouseEnter={() => interactive && setHoveredStar(i + 1)}
            onMouseLeave={() => interactive && setHoveredStar(0)}
            className={`${interactive ? 'cursor-pointer hover:scale-125' : ''} transition-transform`}
            whileHover={interactive ? { scale: 1.25 } : {}}
            whileTap={interactive ? { scale: 0.9 } : {}}
          >
            <FaStar className="text-yellow-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
          </motion.button>
        ))}
        
        {/* Half Star */}
        {hasHalfStar && !interactive && <FaStarHalfAlt className="text-yellow-500" />}
        
        {/* Empty Stars */}
        {[...Array(emptyStars)].map((_, i) => (
          <motion.button
            key={`empty-${i}`}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate?.(fullStars + (hasHalfStar ? 1 : 0) + i + 1)}
            onMouseEnter={() => interactive && setHoveredStar(fullStars + (hasHalfStar ? 1 : 0) + i + 1)}
            onMouseLeave={() => interactive && setHoveredStar(0)}
            className={`${interactive ? 'cursor-pointer hover:scale-125' : ''} transition-transform`}
            whileHover={interactive ? { scale: 1.25 } : {}}
            whileTap={interactive ? { scale: 0.9 } : {}}
          >
            <FaStar className="text-gray-600" />
          </motion.button>
        ))}
      </div>
      
      {showNumber && (
        <div className="flex items-center gap-1">
          <span className={`font-bold text-white ${sizeClasses[size]}`}>
            {rating.toFixed(1)}
          </span>
          {totalRatings !== undefined && totalRatings > 0 && (
            <span className={`text-gray-400 ${sizeClasses[size]}`}>
              ({totalRatings})
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// ✅ NEW: UNAUTHENTICATED USER MESSAGE
// ============================================
const UnauthenticatedMessage = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative rounded-2xl sm:rounded-3xl overflow-hidden"
        >
          {/* Background with gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 to-black/98 backdrop-blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent" />
          <div className="absolute inset-0 border border-red-500/30 rounded-2xl sm:rounded-3xl" />

          <div className="relative p-8 sm:p-10 text-center">
            {/* Lock Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-600/20 to-red-800/20 border-2 border-red-500/30 flex items-center justify-center"
            >
              <FaLock className="text-4xl sm:text-5xl text-red-400" />
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent mb-3"
            >
              Sign In Required
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-400 text-sm sm:text-base mb-8 leading-relaxed"
            >
              Create an account or sign in to access your personalized dashboard, courses, and learning journey.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-3"
            >
              <Link
                href="/auth/signin"
                className="block w-full px-6 py-3.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold hover:scale-105 transition-transform shadow-lg shadow-red-500/30"
              >
                Sign In to Continue
              </Link>
              
              <Link
                href="/auth/signup"
                className="block w-full px-6 py-3.5 bg-gray-800/50 border border-gray-700 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
              >
                Create New Account
              </Link>

              <Link
                href="/"
                className="block text-sm text-gray-500 hover:text-red-400 transition-colors pt-2"
              >
                ← Back to Home
              </Link>
            </motion.div>

            {/* Features Preview */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 pt-8 border-t border-gray-800"
            >
              <p className="text-xs text-gray-500 mb-4">What you'll get access to:</p>
              <div className="grid grid-cols-2 gap-3 text-left">
                {[
                  { icon: FaBookOpen, label: 'Browse Courses' },
                  { icon: FaChartLine, label: 'Track Progress' },
                  { icon: FaTrophy, label: 'Earn Badges' },
                  { icon: FaUserFriends, label: 'Join Community' },
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    className="flex items-center gap-2 p-2 rounded-lg bg-gray-900/30 border border-gray-800"
                  >
                    <feature.icon className="text-red-400 text-sm flex-shrink-0" />
                    <span className="text-xs text-gray-400">{feature.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// ============================================
// ✅ COMPLETELY REDESIGNED: CAROUSEL WITH VISIBLE BLUR CARDS
// ============================================
const EnrolledCoursesArea = ({ courses }: { courses: EnrolledCourseData[] }) => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedCourseForRating, setSelectedCourseForRating] = useState<string | null>(null);

  const currentCourse = courses[currentIndex];
  const hasMultipleCourses = courses.length > 1;

  // Swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && hasMultipleCourses) {
      handleNext();
    }
    if (isRightSwipe && hasMultipleCourses) {
      handlePrev();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % courses.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + courses.length) % courses.length);
  };

  const getPrevIndex = () => (currentIndex - 1 + courses.length) % courses.length;
  const getNextIndex = () => (currentIndex + 1) % courses.length;

  return (
    <div className="relative min-h-screen py-6 sm:py-8 md:py-10">
      <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
          
          {/* Header - REDUCED MARGIN */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-4 sm:mb-6 md:mb-8"
          >
            <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-black text-white leading-tight mt-20 lg:mt-0">
              <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
                YOUR LEARNING
              </span>{" "}
              <span className="block sm:inline">JOURNEY</span>
            </h1>
          </motion.div>

          {/* Sliding Cards with LESS BLUR & VISIBLE on ALL DEVICES */}
          <div className="relative mb-8 sm:mb-10 md:mb-12">
            {/* Desktop Navigation Buttons */}
            {hasMultipleCourses && (
              <div className="hidden md:block">
                <button
                  onClick={handlePrev}
                  className="absolute -left-6 lg:-left-8 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 backdrop-blur-2xl p-3 sm:p-4 rounded-full transition-all duration-300 hover:scale-110 hover:border-red-500/50 group shadow-xl"
                >
                  <FaChevronLeft className="text-white text-lg sm:text-xl group-hover:text-red-400 transition-colors" />
                </button>

                <button
                  onClick={handleNext}
                  className="absolute -right-6 lg:-right-8 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 backdrop-blur-2xl p-3 sm:p-4 rounded-full transition-all duration-300 hover:scale-110 hover:border-red-500/50 group shadow-xl"
                >
                  <FaChevronRight className="text-white text-lg sm:text-xl group-hover:text-red-400 transition-colors" />
                </button>
              </div>
            )}

            {/* Carousel with VISIBLE Blur Cards on ALL Devices */}
            <div 
              className="relative overflow-visible"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {hasMultipleCourses ? (
                // Multiple courses: Show blur effect on BOTH mobile and desktop
                <div className="relative flex items-center justify-center">
                  {/* Previous Card (Less Blur - Visible on ALL screens) */}
                  <div className="absolute left-0 w-[75%] sm:w-[70%] md:w-[65%] lg:w-[60%] opacity-60 sm:opacity-70 blur-[2px] scale-[0.85] sm:scale-90 transform -translate-x-[55%] sm:-translate-x-[60%] z-0 pointer-events-none">
                    <CourseCarouselCard course={courses[getPrevIndex()]} isBlurred />
                  </div>

                  {/* Current Card (Main Focus) */}
                  <div className="relative z-10 w-full">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CourseCarouselCard 
                          course={currentCourse} 
                          onRateClick={(courseId) => {
                            setSelectedCourseForRating(courseId);
                            setShowRatingModal(true);
                          }}
                          router={router}
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Next Card (Less Blur - Visible on ALL screens) */}
                  <div className="absolute right-0 w-[75%] sm:w-[70%] md:w-[65%] lg:w-[60%] opacity-60 sm:opacity-70 blur-[2px] scale-[0.85] sm:scale-90 transform translate-x-[55%] sm:translate-x-[60%] z-0 pointer-events-none">
                    <CourseCarouselCard course={courses[getNextIndex()]} isBlurred />
                  </div>
                </div>
              ) : (
                // Single course: No blur effect
                <CourseCarouselCard 
                  course={currentCourse} 
                  onRateClick={(courseId) => {
                    setSelectedCourseForRating(courseId);
                    setShowRatingModal(true);
                  }}
                  router={router}
                />
              )}
            </div>

            {/* Progress Indicators */}
            {hasMultipleCourses && (
              <div className="flex justify-center gap-2 mt-6">
                {courses.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className="relative group"
                  >
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === currentIndex
                          ? 'w-12 bg-gradient-to-r from-red-600 to-red-500'
                          : 'w-2 bg-gray-600 group-hover:bg-gray-500'
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRatingModal && selectedCourseForRating && (
          <RatingModal
            courseId={selectedCourseForRating}
            onClose={() => {
              setShowRatingModal(false);
              setSelectedCourseForRating(null);
            }}
            onSuccess={() => {
              // Refresh course data
              window.location.reload();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// ✅ NEW: PUBLISHED COURSES CAROUSEL
// ============================================
const PublishedCoursesArea = ({ courses }: { courses: PublishedCourseData[] }) => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const currentCourse = courses[currentIndex];
  const hasMultipleCourses = courses.length > 1;

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && hasMultipleCourses) {
      handleNext();
    }
    if (isRightSwipe && hasMultipleCourses) {
      handlePrev();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % courses.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + courses.length) % courses.length);
  };

  const getPrevIndex = () => (currentIndex - 1 + courses.length) % courses.length;
  const getNextIndex = () => (currentIndex + 1) % courses.length;

  return (
    <div className="relative min-h-screen py-6 sm:py-8 md:py-10">
      <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
          
          {/* Header */}
        <motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  className="text-center mb-4 sm:mb-6 md:mb-8"
>
  <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-black text-white leading-tight mt-20 lg:mt-0">
              <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
                YOUR PUBLISHING
              </span>{" "}
              <span className="block sm:inline">JOURNEY</span>
            </h1>
          </motion.div>

          {/* Sliding Cards */}
          <div className="relative mb-8 sm:mb-10 md:mb-12">
            {/* Desktop Navigation Buttons */}
            {hasMultipleCourses && (
              <div className="hidden md:block">
                <button
                  onClick={handlePrev}
                  className="absolute -left-6 lg:-left-8 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 backdrop-blur-2xl p-3 sm:p-4 rounded-full transition-all duration-300 hover:scale-110 hover:border-red-500/50 group shadow-xl"
                >
                  <FaChevronLeft className="text-white text-lg sm:text-xl group-hover:text-red-400 transition-colors" />
                </button>

                <button
                  onClick={handleNext}
                  className="absolute -right-6 lg:-right-8 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 backdrop-blur-2xl p-3 sm:p-4 rounded-full transition-all duration-300 hover:scale-110 hover:border-red-500/50 group shadow-xl"
                >
                  <FaChevronRight className="text-white text-lg sm:text-xl group-hover:text-red-400 transition-colors" />
                </button>
              </div>
            )}

            {/* Carousel */}
            <div 
              className="relative overflow-visible"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {hasMultipleCourses ? (
                <div className="relative flex items-center justify-center">
                  {/* Previous Card */}
                  <div className="absolute left-0 w-[75%] sm:w-[70%] md:w-[65%] lg:w-[60%] opacity-60 sm:opacity-70 blur-[2px] scale-[0.85] sm:scale-90 transform -translate-x-[55%] sm:-translate-x-[60%] z-0 pointer-events-none">
                    <PublishedCourseCard course={courses[getPrevIndex()]} isBlurred />
                  </div>

                  {/* Current Card */}
                  <div className="relative z-10 w-full">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                      >
                        <PublishedCourseCard course={currentCourse} router={router} />
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Next Card */}
                  <div className="absolute right-0 w-[75%] sm:w-[70%] md:w-[65%] lg:w-[60%] opacity-60 sm:opacity-70 blur-[2px] scale-[0.85] sm:scale-90 transform translate-x-[55%] sm:translate-x-[60%] z-0 pointer-events-none">
                    <PublishedCourseCard course={courses[getNextIndex()]} isBlurred />
                  </div>
                </div>
              ) : (
                <PublishedCourseCard course={currentCourse} router={router} />
              )}
            </div>

            {/* Progress Indicators */}
            {hasMultipleCourses && (
              <div className="flex justify-center gap-2 mt-6">
                {courses.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className="relative group"
                  >
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === currentIndex
                          ? 'w-12 bg-gradient-to-r from-red-600 to-red-500'
                          : 'w-2 bg-gray-600 group-hover:bg-gray-500'
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ✅ PUBLISHED COURSE CARD WITH HOMEPAGE BUILDER BUTTON
// ============================================
const PublishedCourseCard = ({ 
  course, 
  isBlurred = false,
  router
}: { 
  course: PublishedCourseData; 
  isBlurred?: boolean;
  router?: any;
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className={`relative w-full ${isBlurred ? 'pointer-events-none select-none' : ''}`}>
      <div className="relative bg-gradient-to-br from-gray-900/90 to-black/95 rounded-xl sm:rounded-2xl lg:rounded-3xl border border-red-500/30 backdrop-blur-2xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-xl sm:rounded-2xl lg:rounded-3xl" />
        
        <div className="relative grid grid-cols-1 lg:grid-cols-[45%_55%] gap-0">
          
          {/* LEFT: Thumbnail + Stats */}
          <div className="relative">
            {/* Thumbnail */}
            <div className="relative w-full aspect-video overflow-hidden group">
              {course.thumbnail && !imageError ? (
                <Image
                  src={course.thumbnail}
                  alt={course.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={() => setImageError(true)}
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  priority
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
                  <FaBook className="text-red-400 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl opacity-30" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              
              {/* Status Badge */}
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 lg:top-4 lg:right-4 z-10">
                <div className="bg-green-600/80 backdrop-blur-sm px-2.5 py-1.5 sm:px-3 sm:py-2 lg:px-4 lg:py-2 rounded-full border border-green-500/30">
                  <span className="text-white font-bold text-sm sm:text-base lg:text-lg">Published</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="p-2 sm:p-3 lg:p-4 bg-black/20 border-t border-red-500/10">
              <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-1.5 sm:gap-2 lg:gap-3">
                <StatCardCompact
                  icon={FaStar}
                  label="Rating"
                  value={course.averageRating > 0 ? course.averageRating.toFixed(1) : 'No ratings'}
                  color="from-yellow-600 to-yellow-700"
                />
                
                <StatCardCompact
                  icon={FaUsers}
                  label="Purchases"
                  value={course.totalPurchases.toString()}
                  color="from-blue-600 to-blue-700"
                />
                
                <StatCardCompact
                  icon={FaDollarSign}
                  label="Revenue"
                  value={`$${course.totalRevenue}`}
                  color="from-green-600 to-green-700"
                />
                
                <StatCardCompact
                  icon={FaBook}
                  label="Modules"
                  value={course.totalModules.toString()}
                  color="from-purple-600 to-purple-700"
                />
              </div>
            </div>
          </div>

          {/* RIGHT: Content Section */}
          <div className="p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 space-y-3 sm:space-y-4 lg:space-y-6">
            {/* Title */}
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black text-white line-clamp-2 mb-2 sm:mb-2.5 lg:mb-3">
                {course.title}
              </h2>
              
              {/* Course Rating */}
              <div className="flex items-center gap-2 sm:gap-3">
                {course.averageRating > 0 ? (
                  <RatingStars 
                    rating={course.averageRating} 
                    size="sm"
                    showNumber={true}
                  />
                ) : (
                  <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500 text-xs sm:text-sm">
                    <FaStar className="text-gray-600" />
                    <span>No ratings yet</span>
                  </div>
                )}
              </div>

              {/* Published Date */}
              {course.publishedAt && (
                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-400 mt-1.5 sm:mt-2">
                  <FaClock className="text-red-400 text-xs sm:text-sm" />
                  <span>Published: {new Date(course.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              )}
            </div>

            {/* Revenue & Purchases Bar */}
            <div className="bg-black/30 rounded-lg sm:rounded-xl p-2.5 sm:p-3 lg:p-4 border border-red-500/20">
              <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                <div className="text-center">
                  <p className="text-gray-400 text-[9px] sm:text-[10px] lg:text-xs mb-0.5 sm:mb-1">Total Revenue</p>
                  <p className="text-base sm:text-lg lg:text-xl font-black text-green-400">
                    ${course.totalRevenue}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-[9px] sm:text-[10px] lg:text-xs mb-0.5 sm:mb-1">Total Purchases</p>
                  <p className="text-base sm:text-lg lg:text-xl font-black text-white">
                    {course.totalPurchases}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Buyers Section */}
            {course.recentBuyers.length > 0 && (
              <div className="bg-black/30 rounded-lg sm:rounded-xl p-2.5 sm:p-3 lg:p-4 border border-red-500/20">
                <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm font-semibold mb-2 sm:mb-3">
                  Recent Buyers ({course.totalPurchases} total)
                </p>
                
                {/* Scrollable buyer list */}
                <div className={`space-y-2 ${course.recentBuyers.length > 5 ? 'max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-red-600 scrollbar-track-gray-800' : ''}`}>
                  {course.recentBuyers.map((buyer) => (
                    <div key={buyer.id} className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg bg-gray-900/40 hover:bg-gray-900/60 transition-colors">
                      <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gradient-to-br from-red-600 to-red-800 flex-shrink-0">
                        {buyer.img ? (
                          <Image
                            src={buyer.img}
                            alt={buyer.username}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <FaUserCircle className="w-full h-full text-white p-1" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs sm:text-sm font-semibold truncate">
                          {buyer.name || buyer.username}
                        </p>
                        <p className="text-gray-500 text-[10px] sm:text-xs truncate">
                          {new Date(buyer.purchasedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ✅ UPDATED: Action Buttons - NOW WITH 4 BUTTONS INCLUDING HOMEPAGE BUILDER & MODULES */}
            {!isBlurred && (
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-2 lg:gap-4 pt-1 sm:pt-2">
               

                {/* ✅ NEW: Modules Button */}
                <button
                  onClick={() => router?.push(`/users/courseinside?courseId=${course.id}`)}
                  className="relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg sm:rounded-xl" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative px-2 py-2 sm:px-3 sm:py-2.5 lg:px-4 lg:py-3 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 lg:gap-2">
                    <FaBook className="text-white text-xs sm:text-sm lg:text-base" />
                    <span className="text-white font-bold text-[10px] sm:text-xs lg:text-sm whitespace-nowrap">
                      Inside Course
                    </span>
                  </div>
                </button>

                {/* Manage Course Button */}
         
                
                {/* View Page Button */}
                <button
                  onClick={() => router?.push(`/users/courses/${course.id}`)}
                  className="relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-lg sm:rounded-xl border border-red-500/30 backdrop-blur-2xl" />
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative px-2 py-2 sm:px-3 sm:py-2.5 lg:px-4 lg:py-3 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 lg:gap-2">
                    <FaEye className="text-red-400 text-xs sm:text-sm lg:text-base group-hover:text-red-300 transition-colors" />
                    <span className="text-white font-bold text-[10px] sm:text-xs lg:text-sm whitespace-nowrap">
                      View
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ✅ MOBILE RESPONSIVE CARD - REMOVED mt-20
// ============================================
const CourseCarouselCard = ({ 
  course, 
  isBlurred = false,
  onRateClick,
  router
}: { 
  course: EnrolledCourseData; 
  isBlurred?: boolean;
  onRateClick?: (courseId: string) => void;
  router?: any;
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className={`relative w-full ${isBlurred ? 'pointer-events-none select-none' : ''}`}>
      {/* Card Container - Mobile Optimized */}
      <div className="relative bg-gradient-to-br from-gray-900/90 to-black/95 rounded-xl sm:rounded-2xl lg:rounded-3xl border border-red-500/30 backdrop-blur-2xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-xl sm:rounded-2xl lg:rounded-3xl" />
        
        {/* Stack on Mobile, Two Columns on Desktop */}
        <div className="relative grid grid-cols-1 lg:grid-cols-[45%_55%] gap-0">
          
          {/* LEFT: Thumbnail + Stats Section */}
          <div className="relative">
            {/* Thumbnail - FIXED TO 16:9 */}
            <div className="relative w-full aspect-video overflow-hidden group">
              {course.thumbnail && !imageError ? (
                <Image
                  src={course.thumbnail}
                  alt={course.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={() => setImageError(true)}
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  priority
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
                  <FaBook className="text-red-400 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl opacity-30" />
                </div>
              )}
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              
              {/* Progress Badge - Mobile Optimized */}
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 lg:top-4 lg:right-4 z-10">
                <div className="bg-black/80 backdrop-blur-sm px-2.5 py-1.5 sm:px-3 sm:py-2 lg:px-4 lg:py-2 rounded-full border border-red-500/30">
                  <span className="text-red-400 font-bold text-sm sm:text-base lg:text-lg">{course.progress}%</span>
                </div>
              </div>

              {/* Play Overlay - Desktop Only */}
              {!isBlurred && (
                <div className="absolute inset-0 hidden lg:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                  <div className="bg-red-600 p-6 rounded-full shadow-2xl">
                    <FaPlay className="text-white text-3xl ml-1" />
                  </div>
                </div>
              )}
            </div>

            {/* Stats Grid - Mobile Optimized (2 cols on mobile, 4 on desktop) */}
            <div className="p-2 sm:p-3 lg:p-4 bg-black/20 border-t border-red-500/10">
              <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-1.5 sm:gap-2 lg:gap-3">
                <StatCardCompact
                  icon={FaStar}
                  label="Your Rating"
                  value={course.rating ? `${course.rating}.0` : 'Not rated'}
                  color="from-yellow-600 to-yellow-700"
                />
                
                <StatCardCompact
                  icon={FaComment}
                  label="Messages"
                  value={course.unreadMessages.toString()}
                  color="from-purple-600 to-purple-700"
                  badge={course.unreadMessages}
                />
                
                <StatCardCompact
                  icon={FaQuestion}
                  label="Questions"
                  value={course.newQuestions.toString()}
                  color="from-orange-600 to-orange-700"
                  badge={course.newQuestions}
                />
                
                <StatCardCompact
                  icon={FaUsers}
                  label="Online"
                  value={course.onlineUsers.toString()}
                  color="from-green-600 to-green-700"
                  showPulse
                />
              </div>
            </div>
          </div>

          {/* RIGHT: Content Section - Mobile Optimized Padding */}
          <div className="p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 space-y-3 sm:space-y-4 lg:space-y-6">
            {/* Title & Rating - Mobile Optimized */}
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black text-white line-clamp-2 mb-2 sm:mb-2.5 lg:mb-3">
                {course.title}
              </h2>
              
              {/* Course Rating & Quick Rate - Mobile Optimized */}
              <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-3">
                <div>
                  {course.averageRating > 0 ? (
                    <RatingStars 
                      rating={course.averageRating} 
                      size="sm"
                      showNumber={true}
                      totalRatings={course.totalRatings}
                    />
                  ) : (
                    <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500 text-xs sm:text-sm">
                      <FaStar className="text-gray-600" />
                      <span>No ratings yet</span>
                    </div>
                  )}
                </div>

                {/* Quick Rate Button - Mobile Optimized */}
                {!isBlurred && (
                  <button
                    onClick={() => onRateClick?.(course.id)}
                    className="group flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 hover:border-yellow-500/50 rounded-md sm:rounded-lg transition-all"
                  >
                    <FaStar className="text-yellow-500 text-xs sm:text-sm group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] sm:text-xs font-bold text-yellow-400">
                      {course.rating ? 'Update' : 'Rate'}
                    </span>
                  </button>
                )}
              </div>

              {/* Last Accessed - Mobile Optimized */}
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-400 mt-1.5 sm:mt-2">
                <FaClock className="text-red-400 text-xs sm:text-sm" />
                <span>Last: {new Date(course.lastAccessedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>

            {/* Progress Bar - Mobile Optimized */}
            <div className="bg-black/30 rounded-lg sm:rounded-xl p-2.5 sm:p-3 lg:p-4 border border-red-500/20">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-gray-400 text-[10px] sm:text-xs lg:text-sm font-semibold">Progress</span>
                <span className="text-white font-bold text-sm sm:text-base lg:text-lg">{course.progress}%</span>
              </div>
              
              <div className="relative h-2 sm:h-2.5 lg:h-3 bg-gray-800/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${course.progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 to-red-500 rounded-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4 mt-2 sm:mt-2.5 lg:mt-3">
                <div className="text-center">
                  <p className="text-gray-400 text-[9px] sm:text-[10px] lg:text-xs mb-0.5 sm:mb-1">Modules</p>
                  <p className="text-base sm:text-lg lg:text-xl font-black text-white">
                    {course.completedModules}/{course.totalModules}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-[9px] sm:text-[10px] lg:text-xs mb-0.5 sm:mb-1">Lessons</p>
                  <p className="text-base sm:text-lg lg:text-xl font-black text-white">
                    {course.completedLessons}/{course.totalLessons}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons - Mobile Optimized */}
            {!isBlurred && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 pt-1 sm:pt-2">
                <button
                  onClick={() => router?.push(`/users/courseinside?courseId=${course.id}`)}
                  className="relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 rounded-lg sm:rounded-xl" />
                  <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-800 rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative px-3 py-2 sm:px-4 sm:py-2.5 lg:px-6 lg:py-3.5 flex items-center justify-center gap-1.5 sm:gap-2 lg:gap-3">
                    <FaPlay className="text-white text-xs sm:text-sm lg:text-base" />
                    <span className="text-white font-bold text-xs sm:text-sm lg:text-base">Continue Learning</span>
                  </div>
                </button>
                
                <button
                  onClick={() => router?.push(`/users/courses/${course.id}`)}
                  className="relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-lg sm:rounded-xl border border-red-500/30 backdrop-blur-2xl" />
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative px-3 py-2 sm:px-4 sm:py-2.5 lg:px-6 lg:py-3.5 flex items-center justify-center gap-1.5 sm:gap-2 lg:gap-3">
                    <FaEye className="text-red-400 text-xs sm:text-sm lg:text-base group-hover:text-red-300 transition-colors" />
                    <span className="text-white font-bold text-xs sm:text-sm lg:text-base">View Details</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ✅ MOBILE OPTIMIZED COMPACT STAT CARD
// ============================================
const StatCardCompact = ({ 
  icon: Icon, 
  label, 
  value, 
  color, 
  badge, 
  showPulse = false
}: any) => (
  <div className="relative bg-black/30 rounded-md sm:rounded-lg p-1.5 sm:p-2 lg:p-3 border border-red-500/20">
    <div className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-md sm:rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-1 sm:mb-1.5 lg:mb-2 relative`}>
      <Icon className="text-white text-[10px] sm:text-xs lg:text-sm" />
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-red-600 text-white text-[8px] sm:text-[9px] w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full flex items-center justify-center font-bold">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      {showPulse && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full animate-pulse" />
      )}
    </div>
    <p className="text-gray-400 text-[8px] sm:text-[9px] lg:text-[10px] font-semibold mb-0.5 truncate">{label}</p>
    <p className="text-white text-[10px] sm:text-xs lg:text-sm font-bold truncate">{value}</p>
  </div>
);

// ============================================
// ✅ RATING MODAL COMPONENT
// ============================================
const RatingModal = ({ 
  courseId, 
  onClose, 
  onSuccess 
}: { 
  courseId: string; 
  onClose: () => void; 
  onSuccess: () => void;
}) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/course/rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseId,
          rating,
          review: review.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit rating');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingLabels = {
    1: { text: 'Poor', emoji: '😞', color: 'text-red-400' },
    2: { text: 'Fair', emoji: '😐', color: 'text-orange-400' },
    3: { text: 'Good', emoji: '🙂', color: 'text-yellow-400' },
    4: { text: 'Very Good', emoji: '😊', color: 'text-lime-400' },
    5: { text: 'Excellent', emoji: '🤩', color: 'text-green-400' },
  };

  const currentLabel = ratingLabels[rating as keyof typeof ratingLabels];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-gray-900/95 to-black/98 border border-red-500/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-lg w-full backdrop-blur-xl shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl sm:text-3xl font-black text-white">
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              RATE
            </span>{' '}
            COURSE
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <FaTimes className="text-gray-400 hover:text-white text-xl" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Star Rating */}
        <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/30 mb-4">
          <label className="block text-gray-300 text-sm font-bold mb-4 uppercase tracking-wide">
            Your Rating *
          </label>
          <div className="flex flex-col items-center gap-4">
            <RatingStars 
              rating={rating}
              size="lg"
              showNumber={false}
              interactive
              onRate={setRating}
            />
            {currentLabel && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2"
              >
                <span className="text-3xl">{currentLabel.emoji}</span>
                <span className={`text-xl font-bold ${currentLabel.color}`}>
                  {currentLabel.text}
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Review Input */}
        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-bold mb-3 uppercase tracking-wide">
            Write a Review (Optional)
          </label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Share your experience with this course..."
            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent transition-all resize-none"
            rows={4}
            maxLength={500}
          />
          <p className="text-gray-500 text-xs mt-2">
            {review.length}/500 characters
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 bg-gray-800/50 hover:bg-gray-700/50 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <FaStar className="text-yellow-400" />
                <span>Submit Rating</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================
// ✅ UNIVERSAL SKELETON LOADER COMPONENT
// ============================================
const UsersSkeleton = () => {
  return (
    <div className="relative mt-12 xs:mt-16 sm:mt-20">
      {/* Main Content Skeleton - Enhanced Responsive */}
      <div className="relative min-h-[calc(100vh-64px)] xs:min-h-[calc(100vh-72px)] sm:min-h-[calc(100vh-80px)] flex items-center justify-center px-3 xs:px-4 sm:px-6 md:px-8 py-6 xs:py-8 sm:py-10 md:py-12">
        <div className="w-full max-w-sm xs:max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
          {/* Title Skeleton */}
          <div className="text-center mb-6 xs:mb-7 sm:mb-8 md:mb-10 space-y-2 xs:space-y-2.5 sm:space-y-3">
            <div className="h-8 xs:h-9 sm:h-10 md:h-11 lg:h-12 bg-gray-800/40 rounded-lg animate-pulse w-48 xs:w-56 sm:w-64 md:w-72 lg:w-80 mx-auto" />
            <div className="h-3 xs:h-3.5 sm:h-4 md:h-4.5 bg-gray-800/40 rounded animate-pulse w-36 xs:w-40 sm:w-48 md:w-56 mx-auto" style={{ animationDelay: "100ms" }} />
          </div>

          {/* Progress Card Skeleton */}
          <div className="relative mb-6 xs:mb-7 sm:mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-xl sm:rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
            <div className="relative p-4 xs:p-5 sm:p-6 space-y-2.5 xs:space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-3 xs:h-3.5 sm:h-4 w-20 xs:w-22 sm:w-24 md:w-28 bg-gray-800/40 rounded animate-pulse" />
                <div className="h-3 xs:h-3.5 sm:h-4 w-24 xs:w-26 sm:w-28 md:w-32 bg-gray-800/40 rounded animate-pulse" style={{ animationDelay: "80ms" }} />
              </div>
              <div className="h-1.5 xs:h-2 sm:h-2 bg-gray-800/50 rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-gray-700/40 rounded-full animate-pulse" />
              </div>
            </div>
          </div>

          {/* Question Card Skeleton */}
          <div className="relative mb-5 xs:mb-6 sm:mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-xl sm:rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
            <div className="relative p-5 xs:p-6 sm:p-7 md:p-8 space-y-5 xs:space-y-6">
              {/* Question Header */}
              <div className="flex items-start gap-3 xs:gap-3.5 sm:gap-4">
                <div className="w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 md:w-13 md:h-13 rounded-lg sm:rounded-xl bg-gray-800/40 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2 xs:space-y-2.5 sm:space-y-3">
                  <div className="h-5 xs:h-5.5 sm:h-6 md:h-6.5 bg-gray-800/40 rounded-lg animate-pulse w-full sm:w-3/4" style={{ animationDelay: "100ms" }} />
                  <div className="h-3 xs:h-3.5 sm:h-4 bg-gray-800/40 rounded animate-pulse w-3/4 sm:w-1/2" style={{ animationDelay: "150ms" }} />
                </div>
              </div>

              {/* Options Skeleton */}
              <div className="space-y-2.5 xs:space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-3.5 xs:p-4 sm:p-5 rounded-lg sm:rounded-xl bg-gray-900/40 border border-red-500/20 animate-pulse"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex items-center gap-3 xs:gap-3.5 sm:gap-4">
                      <div className="w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 rounded-md sm:rounded-lg bg-gray-800/40 flex-shrink-0" />
                      <div className="flex-1 space-y-1.5 xs:space-y-2">
                        <div className="h-4 xs:h-4.5 sm:h-5 bg-gray-800/40 rounded w-full sm:w-3/4" />
                        <div className="h-2.5 xs:h-3 sm:h-3 bg-gray-800/40 rounded w-3/4 sm:w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Buttons Skeleton */}
          <div className="flex items-center justify-between gap-3 xs:gap-4">
            <div className="h-10 xs:h-11 sm:h-12 md:h-13 w-24 xs:w-26 sm:w-28 md:w-32 bg-gray-800/40 rounded-lg sm:rounded-xl animate-pulse" />
            <div className="h-10 xs:h-11 sm:h-12 md:h-13 flex-1 max-w-[200px] xs:max-w-[240px] sm:max-w-xs md:max-w-sm bg-gray-800/40 rounded-lg sm:rounded-xl animate-pulse" style={{ animationDelay: "100ms" }} />
          </div>

          {/* Skip Link Skeleton */}
          <div className="text-center mt-5 xs:mt-6">
            <div className="h-3 xs:h-3.5 sm:h-4 w-28 xs:w-30 sm:w-32 bg-gray-800/40 rounded animate-pulse mx-auto" style={{ animationDelay: "150ms" }} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Personalizing Animation Component - Enhanced Responsive
const PersonalizingAnimation = ({ onComplete }: { onComplete: () => void }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
    >
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(220, 38, 38, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 50%, rgba(220, 38, 38, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 80%, rgba(220, 38, 38, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 20%, rgba(220, 38, 38, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 50%, rgba(220, 38, 38, 0.3) 0%, transparent 50%)",
            ],
          }}
          transition={{
            duration: 3,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative z-10 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-6 xs:mb-7 sm:mb-8"
        >
          <div className="w-20 h-20 xs:w-22 xs:h-22 sm:w-24 sm:h-24 md:w-26 md:h-26 lg:w-28 lg:h-28 mx-auto rounded-xl sm:rounded-2xl bg-gradient-to-br from-red-600/20 to-red-700/20 border border-red-500/30 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <FaRocket className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl text-red-500" />
            </motion.div>
          </div>
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent mb-3 xs:mb-4 px-4"
        >
          Personalizing Your Experience
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-gray-400 text-base xs:text-lg sm:text-xl mb-6 xs:mb-7 sm:mb-8 px-4"
        >
          Setting up your personalized dashboard...
        </motion.p>

        <div className="flex items-center justify-center gap-1.5 xs:gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3 sm:h-3 bg-red-500 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Platform Preview Component - Enhanced Responsive with CENTERED TABS
const PlatformPreview = ({ answers }: { answers: Record<string, string> }) => {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState(0);

  const sections = [
    {
      id: "courses",
      title: "Explore Courses",
      description: "Browse and enroll in amazing courses",
      route: "/users/courses",
    },
    {
      id: "management",
      title: "Manage Your Courses",
      description: "Create, track and manage all your courses. Unique links for course builder and homepage builder will be generated here.",
      route: "/users/courses-management",
    },
  ];

  const handleExplore = () => {
    router.push(sections[activeSection].route);
  };

  const handleSkip = () => {
    if (answers.purpose === "learn") {
      router.push("/users/courses");
    } else if (answers.purpose === "teach") {
      router.push("/users/courses-management");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] xs:min-h-[calc(100vh-72px)] sm:min-h-[calc(100vh-80px)] py-3 xs:py-4 sm:py-6 md:py-8 lg:py-10 px-3 xs:px-4 sm:px-6 md:px-8 mt-12 xs:mt-16 sm:mt-20">
      <div className="container mx-auto max-w-7xl">
        {/* Header - Enhanced Responsive */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-3 xs:mb-4 sm:mb-6 md:mb-8"
        >
          <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent mb-2 xs:mb-2.5 sm:mb-3 px-4">
            Welcome to Your Platform
          </h1>

          {/* Section Tabs - FULLY CENTERED ON ALL SCREENS */}
          <div className="flex items-center justify-center mb-4 xs:mb-5 sm:mb-6 md:mb-8 px-2">
            <div className="inline-flex flex-wrap justify-center gap-2 xs:gap-2.5 sm:gap-3 max-w-full">
              {sections.map((section, index) => (
                <motion.button
                  key={section.id}
                  onClick={() => setActiveSection(index)}
                  className={`px-3 xs:px-4 sm:px-5 md:px-6 lg:px-7 py-2 xs:py-2.5 sm:py-3 md:py-3.5 rounded-md sm:rounded-lg md:rounded-xl font-medium text-xs xs:text-sm sm:text-base md:text-lg transition-all whitespace-nowrap ${
                    activeSection === index
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                      : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {section.title}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Preview Content - Enhanced Responsive */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            {/* Preview Card */}
            <div className="relative rounded-lg xs:rounded-xl sm:rounded-2xl overflow-hidden border border-red-500/30 bg-black/50 backdrop-blur-xl">
              {/* Clickable Overlay - Enhanced Responsive */}
              <motion.div
                className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-[5] cursor-pointer group"
                whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
                onClick={handleExplore}
              >
                <div className="absolute inset-0 flex items-center justify-center px-4">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gradient-to-r from-red-600 to-red-700 px-4 xs:px-5 sm:px-6 md:px-8 lg:px-10 py-2 xs:py-2.5 sm:py-3 md:py-4 rounded-md xs:rounded-lg sm:rounded-xl font-bold text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl flex items-center gap-2 xs:gap-2.5 sm:gap-3 shadow-2xl group-hover:scale-110 transition-transform"
                  >
                    <FaRocket className="text-sm xs:text-base sm:text-lg md:text-xl flex-shrink-0" />
                    <span className="whitespace-nowrap">Click and Start Learning</span>
                    <FaChevronRight className="text-sm xs:text-base sm:text-lg md:text-xl flex-shrink-0" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Actual UI Preview */}
              <div className="relative pointer-events-none">
                {activeSection === 0 && <CoursesPreview />}
                {activeSection === 1 && <ManagementPreview />}
              </div>
            </div>

            {/* Description - Enhanced Responsive */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-3 xs:mt-4 sm:mt-6 text-center px-3 xs:px-4 sm:px-6"
            >
              <p className="text-gray-300 text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl font-medium mb-2">
                {sections[activeSection].description}
              </p>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons - Enhanced Responsive */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-2 xs:gap-3 sm:gap-4 md:gap-5 mt-4 xs:mt-5 sm:mt-6 md:mt-8 flex-wrap px-2"
        >
          <motion.button
            onClick={() => setActiveSection((prev) => (prev > 0 ? prev - 1 : sections.length - 1))}
            className="bg-gray-800/50 border border-red-500/30 px-3 xs:px-4 sm:px-5 md:px-6 lg:px-7 py-2 xs:py-2.5 sm:py-3 md:py-3 rounded-md xs:rounded-lg sm:rounded-xl font-medium text-xs xs:text-sm sm:text-base md:text-lg text-gray-300 hover:bg-gray-700/50 transition-colors flex items-center gap-1 xs:gap-1.5 sm:gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaChevronLeft className="text-xs xs:text-sm sm:text-base md:text-lg" />
            <span className="hidden xs:inline">Previous</span>
            <span className="xs:hidden">Prev</span>
          </motion.button>

          <motion.button
            onClick={handleExplore}
            className="bg-gradient-to-r from-red-600 to-red-700 px-4 xs:px-5 sm:px-6 md:px-8 lg:px-10 py-2 xs:py-2.5 sm:py-3 md:py-3 rounded-md xs:rounded-lg sm:rounded-xl font-bold text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl flex items-center gap-2 xs:gap-2.5 sm:gap-3 hover:scale-105 transition-transform shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaRocket className="text-xs xs:text-sm sm:text-base md:text-lg flex-shrink-0" />
            <span className="whitespace-nowrap">
              {activeSection === 0 
                ? "Browse Courses" 
                : "Go to Management"}
            </span>
          </motion.button>

          <motion.button
            onClick={() => setActiveSection((prev) => (prev < sections.length - 1 ? prev + 1 : 0))}
            className="bg-gray-800/50 border border-red-500/30 px-3 xs:px-4 sm:px-5 md:px-6 lg:px-7 py-2 xs:py-2.5 sm:py-3 md:py-3 rounded-md xs:rounded-lg sm:rounded-xl font-medium text-xs xs:text-sm sm:text-base md:text-lg text-gray-300 hover:bg-gray-700/50 transition-colors flex items-center gap-1 xs:gap-1.5 sm:gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>Next</span>
            <FaChevronRight className="text-xs xs:text-sm sm:text-base md:text-lg" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

// Courses Preview - Enhanced Responsive with CENTERED HEADER
const CoursesPreview = () => {
  return (
    <div className="bg-black min-h-[350px] xs:min-h-[400px] sm:min-h-[450px] md:min-h-[500px] max-h-[400px] xs:max-h-[450px] sm:max-h-[500px] md:max-h-[600px] overflow-y-auto p-2.5 xs:p-3 sm:p-4 md:p-6 lg:p-8 scrollbar-hide">
      {/* Header - FULLY CENTERED - Enhanced Responsive */}
      <div className="text-center mb-3 xs:mb-4 sm:mb-6 md:mb-8 flex flex-col items-center justify-center">
        <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent mb-1.5 xs:mb-2 sm:mb-3 px-4">
          EXPLORE COURSES
        </h1>
        <p className="text-gray-400 text-[10px] xs:text-xs sm:text-sm md:text-base mb-2.5 xs:mb-3 sm:mb-4 md:mb-6 px-4">
          Learn from the best creators
        </p>

        {/* Search Bar - Enhanced Responsive - CENTERED */}
        <div className="w-full max-w-xl xs:max-w-2xl mx-auto relative px-2">
          <FaSearch className="absolute left-4 xs:left-5 sm:left-6 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] xs:text-xs sm:text-sm md:text-base" />
          <div className="bg-gray-900/50 border border-red-500/30 rounded-md xs:rounded-lg sm:rounded-xl h-8 xs:h-9 sm:h-10 md:h-12 lg:h-14 pl-8 xs:pl-9 sm:pl-10 md:pl-12 lg:pl-14" />
        </div>
      </div>

      {/* Course Cards - Enhanced Responsive Grid - CENTERED */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2.5 xs:gap-3 sm:gap-4 md:gap-5 lg:gap-6 justify-items-center">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-gradient-to-br from-gray-900/90 to-black/95 rounded-md xs:rounded-lg sm:rounded-xl border border-red-500/30 overflow-hidden w-full max-w-sm">
            {/* Thumbnail */}
            <div className="bg-gradient-to-br from-gray-800 to-black h-24 xs:h-28 sm:h-32 md:h-36 lg:h-40 xl:h-44 relative">
              <div className="absolute top-1.5 xs:top-2 sm:top-3 right-1.5 xs:right-2 sm:right-3 bg-red-600 text-white px-1 xs:px-1.5 sm:px-2 py-0.5 xs:py-0.5 sm:py-1 rounded-full text-[8px] xs:text-[10px] sm:text-xs md:text-sm font-bold flex items-center gap-0.5 xs:gap-0.5 sm:gap-1">
                <FaFire className="text-[8px] xs:text-[10px] sm:text-xs" />
                <span className="hidden xs:inline">HOT</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-2 xs:p-2.5 sm:p-3 md:p-4 lg:p-5">
              <div className="h-3 xs:h-3.5 sm:h-4 md:h-5 bg-gradient-to-r from-red-400/20 to-transparent rounded w-3/4 mb-1 xs:mb-1.5 sm:mb-2" />
              <div className="h-2 xs:h-2.5 sm:h-3 md:h-3 bg-gray-700/30 rounded w-full mb-0.5 xs:mb-0.5 sm:mb-1" />
              <div className="h-2 xs:h-2.5 sm:h-3 md:h-3 bg-gray-700/30 rounded w-2/3 mb-2 xs:mb-2.5 sm:mb-3 md:mb-4" />

              {/* Stats */}
              <div className="flex items-center justify-between text-[8px] xs:text-[10px] sm:text-xs md:text-sm mb-2 xs:mb-2.5 sm:mb-3 md:mb-4 pb-1.5 xs:pb-2 sm:pb-3 border-b border-red-500/20">
                <div className="flex items-center gap-0.5 xs:gap-1 text-gray-400">
                  <FaUsers className="text-red-400 text-[8px] xs:text-[10px] sm:text-xs" />
                  <span>1.2k</span>
                </div>
                <div className="flex items-center gap-0.5 xs:gap-1 text-gray-400">
                  <FaStar className="text-red-400 text-[8px] xs:text-[10px] sm:text-xs" />
                  <span>4.8</span>
                </div>
                <div className="flex items-center gap-0.5 xs:gap-1 text-gray-400">
                  <FaClock className="text-red-400 text-[8px] xs:text-[10px] sm:text-xs" />
                  <span>8h</span>
                </div>
              </div>

              {/* Price & Button */}
              <div className="flex items-center justify-between">
                <div className="text-red-400 font-black text-sm xs:text-base sm:text-lg md:text-xl">\$49</div>
                <div className="bg-gradient-to-r from-red-600/30 to-red-700/30 rounded xs:rounded-md sm:rounded-lg px-1.5 xs:px-2 sm:px-3 md:px-4 py-1 xs:py-1.5 sm:py-2 border border-red-500/30 text-[8px] xs:text-[10px] sm:text-xs md:text-sm font-bold whitespace-nowrap">
                  <span className="hidden sm:inline">View Course</span>
                  <span className="sm:hidden">View</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Management Preview - Enhanced Responsive with CENTERED HEADER
const ManagementPreview = () => {
  return (
    <div className="bg-black min-h-[350px] xs:min-h-[400px] sm:min-h-[450px] md:min-h-[500px] max-h-[400px] xs:max-h-[450px] sm:max-h-[500px] md:max-h-[600px] overflow-y-auto p-2.5 xs:p-3 sm:p-4 md:p-6 lg:p-8 scrollbar-hide">
      {/* Header - FULLY CENTERED - Enhanced Responsive */}
      <div className="bg-gradient-to-br from-gray-900/90 to-black/95 rounded-md xs:rounded-lg sm:rounded-xl border border-red-500/30 p-2.5 xs:p-3 sm:p-4 md:p-5 lg:p-6 mb-3 xs:mb-4 sm:mb-6">
        <div className="flex flex-col items-center justify-center text-center gap-2 xs:gap-2.5 sm:gap-3 mb-2.5 xs:mb-3 sm:mb-4">
          <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3">
            <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-md xs:rounded-lg sm:rounded-xl bg-gradient-to-br from-red-600/20 to-red-700/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
              <FaBook className="text-red-500 text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl" />
            </div>
            <div>
              <h2 className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-black bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                My Courses
              </h2>
              <p className="text-gray-400 text-[8px] xs:text-[10px] sm:text-xs md:text-sm">Manage and publish</p>
            </div>
          </div>
          <div className="px-2 py-1 xs:px-2.5 xs:py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 rounded xs:rounded-md sm:rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-[8px] xs:text-[10px] sm:text-xs md:text-sm text-white font-bold flex items-center gap-1 xs:gap-1.5 sm:gap-2 whitespace-nowrap">
            <FaPlus className="text-[8px] xs:text-[10px] sm:text-xs flex-shrink-0" />
            <span className="hidden sm:inline">Create New Course</span>
            <span className="sm:hidden">Create</span>
          </div>
        </div>

        {/* Filter Tabs - Enhanced Responsive with CENTERED Layout */}
        <div className="flex flex-wrap items-center justify-center gap-1 xs:gap-1.5 sm:gap-2">
          {["ALL", "DRAFT", "PENDING", "PUBLISHED"].map((status, i) => (
            <div
              key={status}
              className={`px-1.5 xs:px-2 sm:px-3 md:px-4 py-1 xs:py-1.5 sm:py-2 rounded xs:rounded-md sm:rounded-lg text-[8px] xs:text-[10px] sm:text-xs md:text-sm font-medium whitespace-nowrap ${
                i === 0
                  ? "bg-red-600 text-white"
                  : "bg-gray-800/50 text-gray-400"
              }`}
            >
              {status}
            </div>
          ))}
        </div>
      </div>

      {/* Info Banner - Enhanced Responsive - CENTERED */}
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/30 rounded-md xs:rounded-lg sm:rounded-xl p-2.5 xs:p-3 sm:p-4 md:p-5 mb-3 xs:mb-4 sm:mb-6 mx-auto max-w-4xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center text-center sm:text-left gap-1.5 xs:gap-2 sm:gap-3">
          <FaLightbulb className="text-blue-400 text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl flex-shrink-0 mx-auto sm:mx-0" />
          <div>
            <h3 className="text-blue-400 font-bold text-[10px] xs:text-xs sm:text-sm md:text-base mb-0.5 xs:mb-1">Unique Builder Links</h3>
            <p className="text-gray-400 text-[8px] xs:text-[10px] sm:text-xs md:text-sm leading-relaxed">
              Each course gets unique URLs for Course Builder and Homepage Builder. Click any course to access these tools!
            </p>
          </div>
        </div>
      </div>

      {/* Course Cards - Enhanced Responsive Grid - CENTERED */}
      <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2.5 xs:gap-3 sm:gap-4 md:gap-5 lg:gap-6 justify-items-center">
        {[
          { status: "PUBLISHED", color: "green", complete: 100 },
          { status: "PENDING", color: "blue", complete: 85 },
          { status: "DRAFT", color: "yellow", complete: 45 },
        ].map((course, i) => (
          <div key={i} className="bg-gradient-to-br from-gray-900/90 to-black/95 rounded-md xs:rounded-lg sm:rounded-xl border border-red-500/30 p-2.5 xs:p-3 sm:p-4 md:p-5 w-full max-w-sm">
            {/* Status Badge */}
            <div className="flex items-center justify-between mb-1.5 xs:mb-2 sm:mb-3">
              <span className={`px-1.5 xs:px-2 sm:px-3 py-0.5 xs:py-0.5 sm:py-1 rounded-full text-[8px] xs:text-[10px] sm:text-xs md:text-sm font-bold ${
                course.color === 'green' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                course.color === 'blue' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              }`}>
                {course.status}
              </span>
              <span className="text-[8px] xs:text-[10px] sm:text-xs md:text-sm text-gray-400">{course.complete}%</span>
            </div>

            {/* Title */}
            <div className="h-3 xs:h-3.5 sm:h-4 md:h-5 bg-gradient-to-r from-red-400/20 to-transparent rounded w-3/4 mb-2 xs:mb-2.5 sm:mb-3 md:mb-4" />

            {/* Stats */}
            <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 md:gap-4 text-[8px] xs:text-[10px] sm:text-xs md:text-sm text-gray-400 mb-2 xs:mb-2.5 sm:mb-3 md:mb-4">
              <div className="flex items-center gap-0.5 xs:gap-1">
                <FaBook className="text-red-500 text-[8px] xs:text-[10px] sm:text-xs" />
                <span className="hidden xs:inline">5 Mod</span>
                <span className="xs:hidden">5M</span>
              </div>
              <div className="flex items-center gap-0.5 xs:gap-1">
                <FaUsers className="text-red-500 text-[8px] xs:text-[10px] sm:text-xs" />
                <span>234</span>
              </div>
              <div className="flex items-center gap-0.5 xs:gap-1">
                <FaStar className="text-red-500 text-[8px] xs:text-[10px] sm:text-xs" />
                <span>4.9</span>
              </div>
            </div>

            {/* Builder Links Section */}
            <div className="bg-black/40 rounded xs:rounded-md sm:rounded-lg p-1.5 xs:p-2 sm:p-3 mb-2 xs:mb-2.5 sm:mb-3 md:mb-4 border border-red-500/20">
              <p className="text-[8px] xs:text-[10px] sm:text-xs md:text-sm text-gray-500 mb-1 xs:mb-1.5 sm:mb-2 flex items-center gap-0.5 xs:gap-1">
                <FaLayerGroup className="text-red-400 text-[8px] xs:text-[10px] sm:text-xs flex-shrink-0" />
                <span className="hidden xs:inline">Access Builders</span>
                <span className="xs:hidden">Builders</span>
              </p>
              <div className="space-y-1 xs:space-y-1.5 sm:space-y-2">
                <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 text-[8px] xs:text-[9px] sm:text-xs">
                  <div className="w-1 h-1 xs:w-1.5 xs:h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full flex-shrink-0" />
                  <span className="text-blue-400 font-mono truncate">
                    /course/{i + 1}/builder
                  </span>
                </div>
                <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 text-[8px] xs:text-[9px] sm:text-xs">
                  <div className="w-1 h-1 xs:w-1.5 xs:h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full flex-shrink-0" />
                  <span className="text-purple-400 font-mono truncate">
                    /course/{i + 1}/homepage
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
              <div className="flex-1 bg-red-600/20 border border-red-500/30 px-1.5 xs:px-2 sm:px-3 py-1 xs:py-1.5 sm:py-2 rounded xs:rounded-md sm:rounded-lg text-[8px] xs:text-[10px] sm:text-xs md:text-sm font-medium text-red-400 text-center flex items-center justify-center gap-0.5 xs:gap-1">
                <FaEdit className="text-[8px] xs:text-[10px] sm:text-xs flex-shrink-0" />
                <span className="hidden sm:inline">Edit</span>
              </div>
              {course.status !== "PUBLISHED" && (
                <div className="flex-1 bg-green-600/20 border border-green-500/30 px-1.5 xs:px-2 sm:px-3 py-1 xs:py-1.5 sm:py-2 rounded xs:rounded-md sm:rounded-lg text-[8px] xs:text-[10px] sm:text-xs md:text-sm font-medium text-green-400 text-center">
                  <span className="hidden sm:inline">Publish</span>
                  <span className="sm:hidden">Pub</span>
                </div>
              )}
              <div className="bg-gray-800/50 border border-red-500/30 px-1.5 xs:px-2 sm:px-3 py-1 xs:py-1.5 sm:py-2 rounded xs:rounded-md sm:rounded-lg text-[8px] xs:text-[10px] sm:text-xs md:text-sm text-gray-400 flex items-center justify-center">
                <FaTrash className="text-[8px] xs:text-[10px] sm:text-xs" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Info - CENTERED */}
      <div className="mt-3 xs:mt-4 sm:mt-6 text-center">
        <p className="text-gray-500 text-[8px] xs:text-[10px] sm:text-xs md:text-sm leading-relaxed px-2">
          Click "Create New Course" to generate unique builder links
        </p>
      </div>
    </div>
  );
};

// ============================================
// ✅ MAIN USERS COMPONENT WITH UNIVERSAL LOADING
// ============================================
const Users = () => {
  const { user, isLoading: authLoading, authChecked } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPersonalizing, setShowPersonalizing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Enrolled courses state
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourseData[]>([]);
  const [hasEnrollments, setHasEnrollments] = useState(false);

  // Published courses state
  const [publishedCourses, setPublishedCourses] = useState<PublishedCourseData[]>([]);
  const [hasPublishedCourses, setHasPublishedCourses] = useState(false);

  useEffect(() => {
    async function checkOnboardingAndEnrollments() {
      if (!authChecked) {
        return;
      }

      if (!user) {
        setIsLoadingData(false);
        return;
      }

      try {
        // Check onboarding status
        const goalsResponse = await fetch('/api/user/goals', {
          credentials: 'include',
        });
        
        if (!goalsResponse.ok) {
          throw new Error('Failed to fetch goals');
        }
        
        const goalsData = await goalsResponse.json();
        
        if (goalsData.completed && goalsData.goals) {
          setHasCompletedOnboarding(true);
          setAnswers({
            purpose: goalsData.goals.purpose,
            monthlyGoal: goalsData.goals.monthlyGoal,
            timeCommitment: goalsData.goals.timeCommitment,
          });
          setShowPreview(true);
        } else {
          setHasCompletedOnboarding(false);
        }

        // Check for course enrollments
        const enrollmentsResponse = await fetch('/api/user/enrolled-courses', {
          credentials: 'include',
        });
        
        if (enrollmentsResponse.ok) {
          const enrollmentsData = await enrollmentsResponse.json();
          
          if (enrollmentsData.courses && enrollmentsData.courses.length > 0) {
            setEnrolledCourses(enrollmentsData.courses);
            setHasEnrollments(true);
          }
        }

        // ✅ NEW: Check for published courses
        const publishedResponse = await fetch('/api/user/published-courses', {
          credentials: 'include',
        });
        
        if (publishedResponse.ok) {
          const publishedData = await publishedResponse.json();
          
          if (publishedData.courses && publishedData.courses.length > 0) {
            setPublishedCourses(publishedData.courses);
            setHasPublishedCourses(true);
          }
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
        setHasCompletedOnboarding(false);
      } finally {
        setIsLoadingData(false);
      }
    }

    checkOnboardingAndEnrollments();
  }, [user, authChecked]);

  const questions: Question[] = useMemo(() => {
    const purpose = answers.purpose;
    let monthlyGoalOptions: Question["options"] = [];

    if (purpose === "learn") {
      monthlyGoalOptions = [
        { value: "learning_streak", label: "Stay on a 7-day learning streak", icon: FaBolt, description: "Build consistency and momentum" },
        { value: "consistent_learner_badge", label: 'Earn a "Consistent Learner" badge', icon: FaAward, description: "Get recognized for your dedication" },
        { value: "new_skill_journey", label: "Start a new skill journey", icon: FaLightbulb, description: "Explore something new" },
        { value: "connect_learners", label: "Connect with other learners in my category", icon: FaUserFriends, description: "Join a community of learners" },
      ];
    } else if (purpose === "teach") {
      monthlyGoalOptions = [
        { value: "launch_first_course", label: "Launch my first course", icon: FaRocket, description: "Start your teaching journey" },
        { value: "reach_100_learners", label: "Reach 100+ learners", icon: FaUsers, description: "Grow your student base" },
        { value: "first_payout", label: "Earn my first payout", icon: FaDollarSign, description: "Start monetizing your knowledge" },
        { value: "rising_mentor_badge", label: 'Gain my "Rising Mentor" badge', icon: FaMedal, description: "Get recognized as an educator" },
      ];
    } else if (purpose === "both") {
      monthlyGoalOptions = [
        { value: "create_while_learning", label: "Create my next course while finishing another", icon: FaFire, description: "Master the learning-teaching cycle" },
        { value: "learner_mentor_pipeline", label: "Build a learner-to-mentor pipeline", icon: FaHandshake, description: "Transform learners into teachers" },
        { value: "reach_100_seakers", label: "Reach 100 Seakers", icon: FaUsers, description: "Expand your community reach" },
        { value: "top_hybrid_creator", label: 'Become a "Top Hybrid Creator" this month', icon: FaCrown, description: "Excel in both learning and teaching" },
      ];
    }

    return [
      {
        id: "purpose",
        title: "What brings you here today?",
        subtitle: "Help us personalize your experience",
        icon: FaBullseye,
        options: [
          { value: "learn", label: "Learn new skills", icon: FaGraduationCap, description: "Expand your knowledge" },
          { value: "teach", label: "Teach and earn", icon: FaDollarSign, description: "Share expertise and monetize" },
          { value: "both", label: "Do both", icon: FaFire, description: "Learn and teach simultaneously" },
        ],
      },
      {
        id: "monthlyGoal",
        title: "What's your main goal this month?",
        subtitle: "Choose the objective that matters most to you right now",
        icon: FaStar,
        options: monthlyGoalOptions,
      },
      {
        id: "timeCommitment",
        title: "How much time do you plan to spend here weekly?",
        subtitle: "We'll help you stay consistent with your commitment",
        icon: FaClock,
        options: [
          { value: "light", label: "Less than 2 hours", icon: FaClock, description: "Light, flexible learning" },
          { value: "moderate", label: "2-5 hours", icon: FaClock, description: "Balanced progress" },
          { value: "intensive", label: "5+ hours", icon: FaFire, description: "Intensive growth mode" },
        ],
      },
    ];
  }, [answers.purpose]);

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;
  const isLastStep = currentStep === questions.length - 1;
  const canProceed = answers[currentQuestion?.id];

  const handleOptionSelect = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    if (canProceed && !isLastStep) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/user/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(answers),
      });

      if (!response.ok) {
        throw new Error('Failed to save goals');
      }

      const data = await response.json();
      console.log('Goals saved:', data);

      setShowPersonalizing(true);
    } catch (error) {
      console.error("Error saving goals:", error);
      alert('Failed to save your goals. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePersonalizingComplete = () => {
    setShowPersonalizing(false);
    setShowPreview(true);
  };

  // ✅ UNIVERSAL SKELETON LOADING
  // Show skeleton while auth is being checked OR while user data is being loaded
  if (!authChecked || authLoading || isLoadingData) {
    return (
      <LazyMotion features={domAnimation}>
        <UsersSkeleton />
      </LazyMotion>
    );
  }

  // ✅ Show unauthenticated message if user is not logged in
  if (!user) {
    return (
      <LazyMotion features={domAnimation}>
        <div className="relative mt-12 xs:mt-16 sm:mt-20">
          <UnauthenticatedMessage />
        </div>
      </LazyMotion>
    );
  }

  // ✅ Show both enrolled AND published courses
  if ((hasEnrollments && enrolledCourses.length > 0) || (hasPublishedCourses && publishedCourses.length > 0)) {
    return (
      <LazyMotion features={domAnimation}>
        <div className="relative mt-5 sm:mt-12 xs:mt-16 md:mt-20">
          {/* Show Enrolled Courses if user has any */}
          {hasEnrollments && enrolledCourses.length > 0 && (
            <EnrolledCoursesArea courses={enrolledCourses} />
          )}
          
          {/* Show Published Courses if user has any */}
          {hasPublishedCourses && publishedCourses.length > 0 && (
            <PublishedCoursesArea courses={publishedCourses} />
          )}
        </div>
      </LazyMotion>
    );
  }

  if (!currentQuestion && !showPersonalizing && !showPreview) return null;

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative mt-12 xs:mt-16 sm:mt-20">
        {/* Personalizing Animation */}
        <AnimatePresence>
          {showPersonalizing && <PersonalizingAnimation onComplete={handlePersonalizingComplete} />}
        </AnimatePresence>

        {/* Platform Preview */}
        <AnimatePresence>
          {showPreview && <PlatformPreview answers={answers} />}
        </AnimatePresence>

        {/* Main Content - Questionnaire - Enhanced Responsive */}
        {!showPersonalizing && !showPreview && (
          <div className="relative min-h-[calc(100vh-64px)] xs:min-h-[calc(100vh-72px)] sm:min-h-[calc(100vh-80px)] flex items-center justify-center px-3 xs:px-4 sm:px-6 md:px-8 py-6 xs:py-8 sm:py-10 md:py-12">
            <div className="w-full max-w-sm xs:max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
              {/* Title - Enhanced Responsive */}
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6 xs:mb-7 sm:mb-8 md:mb-10">
                <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent mb-2 xs:mb-2.5 sm:mb-3 px-4">
                  Set Your Goals
                </h1>
                <p className="text-gray-400 text-xs xs:text-sm sm:text-base md:text-lg px-4">Let's personalize your learning journey</p>
              </motion.div>

              {/* Progress Card - Enhanced Responsive */}
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative mb-6 xs:mb-7 sm:mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-xl sm:rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
                <div className="relative p-4 xs:p-5 sm:p-6 md:p-7">
                  <div className="flex items-center justify-between mb-2.5 xs:mb-3">
                    <span className="text-xs xs:text-sm sm:text-base md:text-lg font-bold text-red-400">Step {currentStep + 1} of {questions.length}</span>
                    <span className="text-xs xs:text-sm sm:text-base md:text-lg font-bold text-gray-400">{Math.round(progress)}% Complete</span>
                  </div>
                  <div className="h-1.5 xs:h-2 sm:h-2 bg-gray-800/50 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-red-600 to-red-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
                  </div>
                </div>
              </motion.div>

              {/* Question Card - Enhanced Responsive */}
              <AnimatePresence mode="wait">
                <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="relative mb-5 xs:mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-xl sm:rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-xl sm:rounded-2xl" />
                  <div className="relative p-5 xs:p-6 sm:p-7 md:p-8 lg:p-10">
                    {/* Question Header - Enhanced Responsive */}
                    <div className="flex items-start gap-3 xs:gap-3.5 sm:gap-4 mb-5 xs:mb-6">
                      <div className="flex-shrink-0 w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 md:w-13 md:h-13 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-red-600/20 to-red-700/20 border border-red-500/30 flex items-center justify-center">
                        {currentQuestion.icon && <currentQuestion.icon className="text-lg xs:text-xl sm:text-2xl md:text-3xl text-red-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 xs:mb-1.5">{currentQuestion.title}</h3>
                        {currentQuestion.subtitle && (
                          <p className="text-gray-400 text-sm xs:text-base sm:text-lg">{currentQuestion.subtitle}</p>
                        )}
                      </div>
                    </div>

                    {/* Options - Enhanced Responsive */}
                    <div className="space-y-2.5 xs:space-y-3">
                      {currentQuestion.options.map((option, index) => {
                        const OptionIcon = option.icon;
                        const isSelected = answers[currentQuestion.id] === option.value;

                        return (
                          <motion.button
                            key={option.value}
                            onClick={() => handleOptionSelect(option.value)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full p-3.5 xs:p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl transition-all duration-300 border backdrop-blur-sm relative overflow-hidden group ${
                              isSelected ? "bg-red-600/20 border-red-500/50" : "bg-gray-900/40 border-red-500/20 hover:bg-gray-800/50 hover:border-red-500/40"
                            }`}
                          >
                            <div className="flex items-center gap-3 xs:gap-3.5 sm:gap-4 relative z-10">
                              <div className={`flex-shrink-0 w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 md:w-13 md:h-13 rounded-md sm:rounded-lg flex items-center justify-center transition-all ${isSelected ? "bg-red-600/30 border-2 border-red-500" : "bg-gray-800/50 border-2 border-gray-700/50 group-hover:border-red-500/30"}`}>
                                <OptionIcon className={`text-lg xs:text-xl sm:text-2xl md:text-3xl ${isSelected ? "text-red-400" : "text-gray-400"}`} />
                              </div>
                              <div className="flex-1 text-left">
                                <div className={`font-bold text-sm xs:text-base sm:text-lg md:text-xl mb-0.5 xs:mb-1 ${isSelected ? "text-red-400" : "text-white"}`}>{option.label}</div>
                                {option.description && <div className="text-[10px] xs:text-xs sm:text-sm md:text-base text-gray-400">{option.description}</div>}
                              </div>
                              {isSelected && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex-shrink-0">
                                  <FaCheckCircle className="text-xl xs:text-2xl sm:text-3xl text-red-500" />
                                </motion.div>
                              )}
                            </div>
                            {isSelected && <motion.div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-transparent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} />}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation Buttons - Enhanced Responsive */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-3 xs:gap-4">
                <motion.button
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className={`px-4 xs:px-5 sm:px-6 md:px-7 py-2.5 xs:py-3 sm:py-3 rounded-lg sm:rounded-xl font-bold text-xs xs:text-sm sm:text-base md:text-lg transition-all flex items-center gap-1.5 xs:gap-2 ${currentStep === 0 ? "bg-gray-800/30 text-gray-600 cursor-not-allowed" : "bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 text-white hover:border-red-500/50"}`}
                  whileHover={currentStep > 0 ? { scale: 1.05 } : {}}
                  whileTap={currentStep > 0 ? { scale: 0.95 } : {}}
                >
                  <FaChevronLeft className="text-xs xs:text-sm sm:text-base" />
                  <span className="hidden xs:inline">Back</span>
                </motion.button>

                {!isLastStep ? (
                  <motion.button
                    onClick={handleNext}
                    disabled={!canProceed}
                    className={`flex-1 max-w-[200px] xs:max-w-[240px] sm:max-w-xs md:max-w-sm px-4 xs:px-5 sm:px-6 md:px-7 py-2.5 xs:py-3 sm:py-3 rounded-lg sm:rounded-xl font-bold text-xs xs:text-sm sm:text-base md:text-lg transition-all flex items-center justify-center gap-1.5 xs:gap-2 ${canProceed ? "bg-gradient-to-r from-red-600 to-red-700 text-white hover:scale-105" : "bg-gray-800/30 text-gray-600 cursor-not-allowed"}`}
                    whileHover={canProceed ? { scale: 1.05 } : {}}
                    whileTap={canProceed ? { scale: 0.95 } : {}}
                  >
                    <span>Next</span>
                    <FaChevronRight className="text-xs xs:text-sm sm:text-base" />
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={handleSubmit}
                    disabled={!canProceed || isSubmitting}
                    className={`flex-1 max-w-[200px] xs:max-w-[240px] sm:max-w-xs md:max-w-sm px-4 xs:px-5 sm:px-6 md:px-7 py-2.5 xs:py-3 sm:py-3 rounded-lg sm:rounded-xl font-bold text-xs xs:text-sm sm:text-base md:text-lg transition-all flex items-center justify-center gap-1.5 xs:gap-2 ${canProceed && !isSubmitting ? "bg-gradient-to-r from-green-600 to-green-700 text-white hover:scale-105" : "bg-gray-800/30 text-gray-600 cursor-not-allowed"}`}
                    whileHover={canProceed && !isSubmitting ? { scale: 1.05 } : {}}
                    whileTap={canProceed && !isSubmitting ? { scale: 0.95 } : {}}
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ 
                            rotate: 360,
                            scale: [1, 1.2, 1]
                          }}
                          transition={{ 
                            rotate: { duration: 1, repeat: Infinity, ease: "linear" },
                            scale: { duration: 0.5, repeat: Infinity }
                          }}
                        >
                          <FaRocket className="text-red-400 text-xs xs:text-sm sm:text-base" />
                        </motion.div>
                        <span className="hidden xs:inline">Saving...</span>
                        <span className="xs:hidden">Save...</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden xs:inline">Complete Setup</span>
                        <span className="xs:hidden">Complete</span>
                        <FaCheckCircle className="text-xs xs:text-sm sm:text-base" />
                      </>
                    )}
                  </motion.button>
                )}
              </motion.div>

              {/* Skip Link - Enhanced Responsive */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center mt-5 xs:mt-6">
                <button onClick={() => setShowPreview(true)} className="text-xs xs:text-sm sm:text-base text-gray-500 hover:text-red-400 transition-colors">
                  Skip for now →
                </button>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </LazyMotion>
  );
};

export default Users;