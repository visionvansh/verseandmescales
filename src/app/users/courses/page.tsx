// app/users/courses/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import {
  FaSearch,
  FaFire,
  FaStar,
  FaUsers,
  FaClock,
  FaBook,
  FaPlay,
  FaUserCircle,
} from "react-icons/fa";
import Image from "next/image";
import UserHoverCard from "@/components/profile/UserHoverCard";
import { User } from "@/components/profile/data/mockProfileData";
import AvatarGenerator from "@/components/settings/AvatarGenerator";
import { useAuth } from "@/contexts/AuthContext";

// ✅ Avatar Interface
interface UserAvatar {
  id: string;
  avatarIndex: number;
  avatarSeed: string;
  avatarStyle: string;
  isPrimary: boolean;
  isCustomUpload: boolean;
  customImageUrl: string | null;
}

// ✅ Extended User Interface with all required properties
interface ExtendedUser extends User {
  img?: string | null;
  image?: string | null;
  avatars?: UserAvatar[];
  primaryAvatar?: UserAvatar | null;
}

// ✅ User cache for instant hover cards
const userCache = new Map<string, { data: ExtendedUser; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CourseCard {
  id: string;
  title: string;
  slug: string;
  description: string;
  owner: {
    name: string;
    avatar: string;
    username?: string;
  };
  stats: {
    students: number;
    rating: number;
    duration: string;
  };
  price: string;
  salePrice?: string;
  saleEndsAt?: string | null;
  thumbnail?: string;
  category?: string;
  isEnrolled?: boolean;
}

// ✅ NEW: Separate hook for card data (NO CACHE)
function useCourseCardData(refreshKey: number) {
  const [cardData, setCardData] = useState<Map<string, {
    title: string;
    description: string;
    price: string;
    salePrice: string | null;
    saleEndsAt: string | null;
  }>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadCardData() {
      try {
        console.log(`🎴 [FRONTEND] Fetching fresh card data (refresh: ${refreshKey})...`);
        const startTime = Date.now();

        const response = await fetch('/api/course/cards', {
          credentials: 'include',
          cache: 'no-store', // ✅ NO CACHE
        });

        if (!response.ok) {
          throw new Error('Failed to fetch card data');
        }

        const data = await response.json();
        const loadTime = Date.now() - startTime;

        console.log(`✅ [FRONTEND] Card data loaded in ${loadTime}ms`);

        if (isMounted) {
          const cardsMap = new Map();
          data.cards.forEach((card: any) => {
            cardsMap.set(card.id, {
              title: card.title || 'Untitled Program',
              description: card.description || '',
              price: card.price || '0',
              salePrice: card.salePrice,
              saleEndsAt: card.saleEndsAt,
            });
          });

          setCardData(cardsMap);
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ [FRONTEND] Card data load error:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCardData();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  return { cardData, loading };
}

// Update the atomic hook to NOT refresh card data
function useAtomicCoursesData(refreshKey: number) {
  const [data, setData] = useState<{
    courses: CourseCard[];
    users: Map<string, ExtendedUser>;
    loading: boolean;
    error: string | null;
  }>({
    courses: [],
    users: new Map(),
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadAtomic() {
      try {
        console.log(`⚡ Loading atomic data (refresh: ${refreshKey})...`);
        const startTime = Date.now();

        const response = await fetch('/api/course/atomic', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch atomic data');
        }

        const atomicData = await response.json();
        const loadTime = Date.now() - startTime;

        console.log(`⚡ Atomic data loaded in ${loadTime}ms`);

        if (isMounted) {
          const usersMap = new Map<string, ExtendedUser>(
            Object.entries(atomicData.users)
          );

          usersMap.forEach((user, username) => {
            const avatars = atomicData.avatars[username] || [];
            const primaryAvatar = avatars.find((a: any) => a.isPrimary) || avatars[0] || null;

            userCache.set(username, {
              data: {
                ...user,
                avatars: avatars,
                primaryAvatar: primaryAvatar,
              },
              timestamp: Date.now(),
            });
          });

          setData({
            courses: atomicData.courses,
            users: usersMap,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('❌ Atomic load error:', error);
        if (isMounted) {
          setData({
            courses: [],
            users: new Map(),
            loading: false,
            error: 'Failed to load courses',
          });
        }
      }
    }

    loadAtomic();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  return data;
}

// ✅ IMPROVED: Professional Countdown Timer - No Background, Positioned Right
const CountdownTimer = ({ endsAt }: { endsAt: string }) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = new Date(endsAt).getTime();
      const difference = endTime - now;

      if (difference <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, expired: true };
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { hours, minutes, seconds, expired: false };
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.expired) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endsAt]);

  if (timeLeft.expired) {
    return null;
  }

  const totalMinutes = timeLeft.hours * 60 + timeLeft.minutes;
  const isUrgent = totalMinutes < 60;
  const isCritical = totalMinutes < 10;

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 px-2.5 py-1 rounded-md"
    >
      <div className="flex items-center gap-1">
        <FaFire
          className={`text-xs ${
            isCritical
              ? "text-red-500 animate-pulse"
              : isUrgent
              ? "text-orange-500"
              : "text-orange-400"
          }`}
        />
        <span
          className={`text-xs font-bold uppercase tracking-wide ${
            isCritical
              ? "text-red-400"
              : isUrgent
              ? "text-orange-400"
              : "text-orange-300"
          }`}
        >
          Sale
        </span>
      </div>
      <span className="text-xs text-gray-400">•</span>
      <span
        className={`text-xs font-semibold tabular-nums ${
          isCritical
            ? "text-red-400 animate-pulse"
            : isUrgent
            ? "text-orange-400"
            : "text-orange-300"
        }`}
      >
        {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
      </span>
    </m.div>
  );
};

// ✅ ProfileAvatar Component
const ProfileAvatar = ({
  customImage,
  avatar,
  userId,
  size = 32,
  className = "",
}: {
  customImage?: string | null;
  avatar?: UserAvatar | null;
  userId: string;
  size?: number;
  className?: string;
}) => {
  if (customImage) {
    return (
      <Image
        src={customImage}
        alt="Profile"
        width={size}
        height={size}
        className={`object-cover ${className}`}
        unoptimized
      />
    );
  }

  if (avatar?.isCustomUpload && avatar.customImageUrl) {
    return (
      <Image
        src={avatar.customImageUrl}
        alt="Profile"
        width={size}
        height={size}
        className={`object-cover ${className}`}
        unoptimized
      />
    );
  }

  if (avatar && avatar.avatarIndex >= 0) {
    return (
      <AvatarGenerator
        userId={userId}
        avatarIndex={avatar.avatarIndex}
        size={size}
        style={avatar.avatarStyle as "avataaars"}
        className={className}
      />
    );
  }

  return (
    <AvatarGenerator
      userId={userId}
      avatarIndex={-1}
      size={size}
      useDefault={true}
      className={className}
    />
  );
};

// ✅ Optimized Skeleton Loader Component
const CoursesPageSkeleton = () => {
  return (
    <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6 sm:py-8 md:py-10 lg:py-12">
      <div className="max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
        {/* Header Skeleton */}
        <div className="mb-8 sm:mb-10 md:mb-12">
          <div className="relative mb-6 sm:mb-8">
            <div className="h-16 sm:h-20 md:h-24 lg:h-28 w-full max-w-2xl bg-gradient-to-r from-gray-900/50 via-gray-800/50 to-gray-900/50 rounded-2xl animate-pulse" />
          </div>
          <div className="max-w-full sm:max-w-2xl md:max-w-3xl mx-auto mb-6 sm:mb-8">
            <div className="relative h-12 sm:h-14 bg-gray-900/50 rounded-lg border border-red-500/20 animate-pulse" />
          </div>
        </div>

        {/* Courses Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="relative">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/20">
                <div
                  className="aspect-video bg-gradient-to-br from-gray-800/60 to-gray-900/60 animate-pulse"
                  style={{ animationDelay: `${i * 80}ms` }}
                />
                <div className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <div className="h-5 sm:h-6 bg-gray-800/40 rounded-lg animate-pulse" />
                    <div className="h-5 sm:h-6 bg-gray-800/40 rounded-lg w-3/4 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 sm:h-4 bg-gray-800/30 rounded animate-pulse" />
                    <div className="h-3 sm:h-4 bg-gray-800/30 rounded w-5/6 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 pb-3 sm:pb-4 border-b border-red-500/10">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-800/40 animate-pulse flex-shrink-0" />
                    <div className="h-3 sm:h-4 bg-gray-800/30 rounded w-20 sm:w-24 animate-pulse" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="h-3 sm:h-4 bg-gray-800/30 rounded w-10 sm:w-12 animate-pulse" />
                    <div className="h-3 sm:h-4 bg-gray-800/30 rounded w-10 sm:w-12 animate-pulse" />
                    <div className="h-3 sm:h-4 bg-gray-800/30 rounded w-10 sm:w-12 animate-pulse" />
                  </div>
                  <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-3 xs:gap-0 pt-2">
                    <div className="h-7 sm:h-8 bg-gray-800/40 rounded-lg w-20 sm:w-24 animate-pulse" />
                    <div className="h-10 sm:h-11 bg-gray-800/40 rounded-lg w-full xs:w-28 sm:w-32 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ✅ Removed categories (no more trending/popular filters)
const categories = [
  { id: "all", label: "All Courses", icon: FaBook },
];

// app/users/courses/page.tsx - Add this hook

function useAutoRefresh(refreshFn: () => void, interval = 30000) {
  useEffect(() => {
    const timer = setInterval(() => {
      console.log('🔄 [AUTO-REFRESH] Refreshing data...');
      refreshFn();
    }, interval);

    return () => clearInterval(timer);
  }, [refreshFn, interval]);
}

export default function CoursesPage() {
  const { user, authChecked } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  // ✅ CHANGED: Fetch both atomic data AND card data separately
  const { courses, users, loading: atomicLoading, error } = useAtomicCoursesData(refreshKey);
  const { cardData, loading: cardLoading } = useCourseCardData(refreshKey);

  // ✅ NEW: Auto-refresh every 30 seconds
  useAutoRefresh(() => {
    setRefreshKey(prev => prev + 1);
  }, 30000);

  const shouldShowSkeleton = (atomicLoading || cardLoading) || !authChecked;

  // ✅ FIXED: Use undefined instead of null
  const coursesWithCardData = courses.map(course => {
    const card = cardData.get(course.id);
    return {
      ...course,
      title: card?.title || 'Untitled Program',
      description: card?.description || '',
      price: card?.price || '0',
      salePrice: card?.salePrice || undefined, // ✅ FIXED
      saleEndsAt: card?.saleEndsAt || undefined, // ✅ FIXED
    };
  });

  // Hover card states
  const [showHoverCard, setShowHoverCard] = useState(false);
  const [hoveredUser, setHoveredUser] = useState<ExtendedUser | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  const handleUserHover = (owner: CourseCard["owner"], e: React.MouseEvent) => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    if (!owner.username) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;

    setHoverPosition({
      x: rect.left + scrollX + rect.width / 2,
      y: rect.top + scrollY,
    });

    const userData = userCache.get(owner.username);

    if (userData) {
      console.log('⚡ Showing instant hover card for:', owner.username);
      setHoveredUser(userData.data);
      setShowHoverCard(true);
    }
  };

  const handleUserLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    const timeout = setTimeout(() => {
      setShowHoverCard(false);
      setHoveredUser(null);
    }, 150);

    setHoverTimeout(timeout);
  };

  const handleHoverCardEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    setShowHoverCard(true);
  };

  // ✅ Simplified filter - only search, no category filtering
  const filteredCourses = coursesWithCardData.filter((course) => {
    return (
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative z-10 mt-20">
        {shouldShowSkeleton ? (
          <CoursesPageSkeleton />
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 text-xl">{error}</p>
          </div>
        ) : (
          <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6 sm:py-8 md:py-10 lg:py-12">
            <div className="max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
              {/* Professional Header */}
              <m.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 sm:mb-10 md:mb-12"
              >
                <div className="relative mb-6 sm:mb-8">
                  <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                  >
                    <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-black tracking-tight">
                      <span className="inline-block text-white">Programs</span>
                      <span className="inline-block text-red-600 ml-3 sm:ml-4 md:ml-6">
                        Hub
                      </span>
                    </h1>

                    <m.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      className="h-1 sm:h-1.5 bg-gradient-to-r from-red-600 to-transparent mt-2 sm:mt-3 rounded-full"
                    />
                  </m.div>
                </div>

                {/* Search Bar */}
                <m.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="max-w-full sm:max-w-2xl md:max-w-3xl mx-auto mb-6 sm:mb-8"
                >
                  <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-base sm:text-lg" />
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-900/80 border border-red-500/30 rounded-lg pl-11 sm:pl-12 pr-4 py-3 sm:py-3.5 text-white placeholder-gray-500 focus:border-red-500 focus:outline-none text-sm sm:text-base transition-colors"
                    />
                  </div>
                </m.div>
              </m.div>

              {filteredCourses.length === 0 ? (
                <m.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 sm:py-16 md:py-20 px-4"
                >
                  <FaBook className="text-gray-600 text-4xl sm:text-5xl md:text-6xl mx-auto mb-4 sm:mb-6" />
                  <h2 className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
                    No Courses Found
                  </h2>
                  <p className="text-gray-400 text-base sm:text-lg mb-6">
                    {searchQuery
                      ? "Try adjusting your search criteria"
                      : "Be the first to create a course!"}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Clear Search
                    </button>
                  )}
                </m.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                  {filteredCourses.map((course, index) => (
                    <CourseCardComponent
                      key={course.id}
                      course={course}
                      index={index}
                      onClick={() => router.push(`/users/courses/${course.id}`)}
                      onUserHover={handleUserHover}
                      onUserLeave={handleUserLeave}
                      userCache={userCache}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div onMouseEnter={handleHoverCardEnter} onMouseLeave={handleUserLeave}>
        {hoveredUser && (
          <UserHoverCard
            user={hoveredUser}
            isVisible={showHoverCard}
            position={hoverPosition}
          />
        )}
      </div>
    </LazyMotion>
  );
}

// ✅ Course Card Component (removed trending/popular badges)
function CourseCardComponent({
  course,
  index,
  onClick,
  onUserHover,
  onUserLeave,
  userCache,
}: {
  course: CourseCard;
  index: number;
  onClick: () => void;
  onUserHover: (owner: CourseCard["owner"], e: React.MouseEvent) => void;
  onUserLeave: () => void;
  userCache: Map<string, { data: ExtendedUser; timestamp: number }>;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  const ownerAvatar = (course.owner as any).primaryAvatar || null;
  const ownerCustomImage = (course.owner as any).avatar || null;

  const getCachedUser = (): ExtendedUser | null => {
    if (!course.owner.username) return null;
    const cached = userCache.get(course.owner.username);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.data;
    }
    return null;
  };

  const cachedUser = getCachedUser();
  const finalCustomImage =
    ownerCustomImage || cachedUser?.img || cachedUser?.image || null;
  const finalAvatar = ownerAvatar || cachedUser?.primaryAvatar || null;
  const finalUserId =
    (course.owner as any).id ||
    cachedUser?.id ||
    course.owner.username ||
    "default";

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (course.isEnrolled) {
      router.push(`/users/courseinside?courseId=${course.id}`);
    } else {
      onClick();
    }
  };

  const getButtonConfig = () => {
    if (course.isEnrolled) {
      return {
        text: "Get in the Program",
        className: "bg-green-600 hover:bg-green-700",
        icon: <FaPlay className="mr-2 text-xs sm:text-sm" />,
      };
    }
    return {
      text: "View Program",
      className: "bg-red-600 hover:bg-red-700",
      icon: null,
    };
  };

  const buttonConfig = getButtonConfig();

  // ✅ FIXED: Check if sale is valid and not expired
  const now = new Date();
  const saleEndsAt = course.saleEndsAt ? new Date(course.saleEndsAt) : null;
  const isSaleActive = course.salePrice && saleEndsAt && saleEndsAt > now;
  const showSalePrice = course.salePrice && (!course.saleEndsAt || isSaleActive);

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group cursor-pointer"
    >
      <div className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/20 rounded-xl overflow-hidden hover:border-red-500/40 transition-all duration-300 hover:-translate-y-1">
        {course.isEnrolled && (
          <div className="absolute top-3 left-3 z-10">
            <m.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-green-600 text-white px-3 py-1 rounded-md text-xs sm:text-sm font-bold flex items-center gap-2"
            >
              <FaPlay className="text-xs" />
              ENROLLED
            </m.div>
          </div>
        )}

        {/* Thumbnail */}
        <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-black overflow-hidden">
          {course.thumbnail && !imageError ? (
            <>
              <Image
                src={course.thumbnail}
                alt={course.title}
                fill
                unoptimized
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                onError={() => setImageError(true)}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority={index < 3}
              />

              <AnimatePresence>
                {isHovered && (
                  <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center"
                  >
                    {course.isEnrolled && (
                      <m.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="bg-green-600 p-4 rounded-full"
                      >
                        <FaPlay className="text-white text-2xl" />
                      </m.div>
                    )}
                  </m.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
              <FaBook className="text-red-400 text-4xl sm:text-5xl md:text-6xl opacity-30 group-hover:opacity-50 transition-opacity" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 bg-black/70 backdrop-blur-sm text-white px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-semibold flex items-center gap-1">
            <FaClock className="text-red-400" />
            {course.stats.duration}
          </div>
        </div>

        <div className="p-4 sm:p-5 md:p-6">
          <h3 className="text-white text-lg sm:text-xl md:text-2xl font-bold mb-2 line-clamp-2 group-hover:text-red-500 transition-colors leading-tight">
            {course.title}
          </h3>
          <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 leading-relaxed">
            {course.description}
          </p>

          {/* Owner Avatar */}
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-red-500/10">
            <div
              className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-red-500/50 flex-shrink-0 overflow-hidden hover:border-red-500 transition-all duration-200 cursor-pointer bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center"
              onMouseEnter={(e) => {
                e.stopPropagation();
                if (course.owner.username) {
                  onUserHover(course.owner, e);
                }
              }}
              onMouseLeave={(e) => {
                e.stopPropagation();
                onUserLeave();
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (course.owner.username) {
                  window.location.href = `/users/profile/${course.owner.username}`;
                }
              }}
            >
              <ProfileAvatar
                customImage={finalCustomImage}
                avatar={finalAvatar}
                userId={finalUserId}
                size={40}
              />
            </div>

            <span
              className="text-gray-300 hover:text-white font-medium text-xs sm:text-sm md:text-base truncate flex-1 transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (course.owner.username) {
                  window.location.href = `/users/profile/${course.owner.username}`;
                }
              }}
            >
              {course.owner.name}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs sm:text-sm mb-3 sm:mb-4 gap-2">
            <div className="flex items-center gap-1 sm:gap-2 text-gray-400">
              <FaUsers className="text-red-400 flex-shrink-0 text-xs sm:text-sm" />
              <span className="truncate font-medium">
                {course.stats.students.toLocaleString()}
                <span className="hidden sm:inline ml-1">Learners</span>
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 text-gray-400">
              <FaStar className="text-yellow-500 flex-shrink-0 text-xs sm:text-sm" />
              {course.stats.rating > 0 ? (
                <span className="font-semibold text-white">
                  {course.stats.rating.toFixed(1)}
                </span>
              ) : (
                <span className="font-semibold text-gray-500 text-xs">
                  No ratings
                </span>
              )}
            </div>
          </div>

          {/* Price/Timer and Button */}
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-3 xs:gap-2">
            {!course.isEnrolled && (
              <div className="flex flex-col gap-2">
                {showSalePrice ? (
                  <>
                    {/* ✅ FIXED: Only show timer if sale has end date */}
                    {course.saleEndsAt && isSaleActive && (
                      <CountdownTimer endsAt={course.saleEndsAt} />
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 line-through text-xs sm:text-sm">
                        ${course.price}
                      </span>
                      <span className="text-red-500 font-bold text-lg sm:text-xl md:text-2xl">
                        ${course.salePrice}
                      </span>
                      {/* ✅ FIXED: Proper discount calculation */}
                      {course.price && course.salePrice && (
                        <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/30">
                          {Math.round(
                            ((parseFloat(course.price) -
                              parseFloat(course.salePrice)) /
                              parseFloat(course.price)) *
                              100
                          )}
                          % OFF
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <span className="text-red-500 font-bold text-lg sm:text-xl md:text-2xl">
                    ${course.price}
                  </span>
                )}
              </div>
            )}

            <button
              onClick={handleButtonClick}
              className={`
                ${buttonConfig.className}
                text-white px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg 
                text-xs sm:text-sm md:text-base font-semibold 
                transition-all duration-300 hover:scale-105 active:scale-95
                flex items-center justify-center
                ${course.isEnrolled ? "w-full xs:w-auto" : ""}
              `}
            >
              {buttonConfig.icon}
              {buttonConfig.text}
            </button>
          </div>
        </div>
      </div>
    </m.div>
  );
}