//Volumes/vision/codes/course/my-app/src/app/users/courses/[id]/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import LivePreview from "@/components/builder/LivePreview";
import AvatarGenerator from "@/components/settings/AvatarGenerator";
import UserHoverCard from "@/components/profile/UserHoverCard";
import { User } from "@/components/profile/data/mockProfileData";
import {
  FaSpinner,
  FaExclamationTriangle,
  FaRocket,
  FaUser,
  FaCheckCircle,
  FaPlay,
  FaBook,
  FaArrowLeft,
  FaUserCircle,
  FaSignOutAlt,
  FaCog,
  FaChartLine,
  FaMoneyBillWave,
  FaHome,
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import { getCustomHomepage } from "@/components/custom-homepages";
import dynamic from "next/dynamic";

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

// ✅ Extended User Interface
interface ExtendedUser extends User {
  img?: string | null;
  image?: string | null;
  avatars?: UserAvatar[];
  primaryAvatar?: UserAvatar | null;
}

// ✅ User cache for instant hover cards
const userCache = new Map<string, { data: ExtendedUser; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ✅ Profile Avatar Component
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
  // Priority 1: Custom uploaded image
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

  // Priority 2: Custom avatar upload
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

  // Priority 3: Generated avatar (only if avatarIndex >= 0)
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

  // Priority 4: Default avatar (RED user icon on WHITE background)
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

// ... (keep existing skeleton components)
const NavbarSkeleton = () => {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-[99999]"
      style={{ isolation: "isolate" }}
    >
      <div className="max-w-[1800px] mx-auto">
        <div className="relative rounded-xl sm:rounded-2xl overflow-visible">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 backdrop-blur-2xl rounded-xl sm:rounded-2xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent rounded-xl sm:rounded-2xl" />
          <div className="absolute inset-0 border border-red-500/20 rounded-xl sm:rounded-2xl" />
          <div className="absolute inset-0 shadow-2xl shadow-red-500/5 rounded-xl sm:rounded-2xl" />

          <div className="relative px-3 sm:px-4 md:px-6 py-2 sm:py-3">
            <div className="hidden md:grid md:grid-cols-[auto_1fr_auto] items-center gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 bg-gray-800/40 rounded-full animate-pulse"
                  style={{ animationDelay: "0ms" }}
                />
                <div className="space-y-2">
                  <div
                    className="w-32 h-3 bg-gray-800/40 rounded animate-pulse"
                    style={{ animationDelay: "100ms" }}
                  />
                  <div
                    className="w-24 h-2 bg-gray-800/40 rounded animate-pulse"
                    style={{ animationDelay: "200ms" }}
                  />
                </div>
              </div>
              <div className="flex justify-center">
                <div
                  className="w-28 h-9 bg-gray-800/40 rounded-xl animate-pulse"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-24 h-9 bg-gray-800/40 rounded-xl animate-pulse"
                  style={{ animationDelay: "400ms" }}
                />
                <div
                  className="w-32 h-10 bg-gray-800/40 rounded-xl animate-pulse"
                  style={{ animationDelay: "500ms" }}
                />
              </div>
            </div>
            <div className="flex md:hidden items-center justify-between gap-2">
              <div className="flex-1 space-y-1.5">
                <div
                  className="w-32 h-3 bg-gray-800/40 rounded animate-pulse"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-20 h-2 bg-gray-800/40 rounded animate-pulse"
                  style={{ animationDelay: "100ms" }}
                />
              </div>
              <div
                className="w-7 h-7 bg-gray-800/40 rounded-lg animate-pulse"
                style={{ animationDelay: "200ms" }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

const CoursePageSkeleton = () => {
  return (
    <div className="relative min-h-screen bg-black">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-black to-red-950/10" />
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `
              linear-gradient(rgba(239, 68, 68, 0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(239, 68, 68, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>
      <NavbarSkeleton />
      <div className="relative z-10 pt-24 pb-12">
        <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div
                className="w-40 h-10 bg-gray-800/40 rounded-full animate-pulse"
                style={{ animationDelay: "0ms" }}
              />
            </div>
            <div className="space-y-3">
              <div
                className="w-3/4 h-12 bg-gray-800/40 rounded-lg animate-pulse mx-auto"
                style={{ animationDelay: "100ms" }}
              />
              <div
                className="w-2/3 h-12 bg-gray-800/40 rounded-lg animate-pulse mx-auto"
                style={{ animationDelay: "200ms" }}
              />
            </div>
            <div className="space-y-2 max-w-4xl mx-auto">
              <div
                className="w-full h-4 bg-gray-800/40 rounded animate-pulse"
                style={{ animationDelay: "300ms" }}
              />
              <div
                className="w-5/6 h-4 bg-gray-800/40 rounded animate-pulse mx-auto"
                style={{ animationDelay: "400ms" }}
              />
            </div>
            <div className="max-w-5xl mx-auto">
              <div
                className="relative aspect-video bg-gray-800/40 rounded-2xl animate-pulse"
                style={{ animationDelay: "500ms" }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="w-20 h-20 bg-gray-700/40 rounded-full animate-pulse"
                    style={{ animationDelay: "600ms" }}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <div
                className="w-64 h-16 bg-gray-800/40 rounded-xl animate-pulse"
                style={{ animationDelay: "700ms" }}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto pt-6">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-gray-800/40 rounded-xl p-6 animate-pulse"
                  style={{ animationDelay: `${800 + i * 100}ms` }}
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 bg-gray-700/40 rounded-lg mx-auto" />
                    <div className="w-16 h-6 bg-gray-700/40 rounded mx-auto" />
                    <div className="w-20 h-3 bg-gray-700/40 rounded mx-auto" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="relative z-10 py-12 space-y-12">
        {[1, 2].map((section) => (
          <div
            key={section}
            className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8"
          >
            <div className="text-center mb-8">
              <div
                className="w-64 h-10 bg-gray-800/40 rounded-lg animate-pulse mx-auto"
                style={{ animationDelay: `${section * 100}ms` }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((card) => (
                <div
                  key={card}
                  className="bg-gray-800/40 rounded-xl p-6 animate-pulse"
                  style={{ animationDelay: `${section * 100 + card * 100}ms` }}
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-gray-700/40 rounded-xl" />
                    <div className="w-3/4 h-5 bg-gray-700/40 rounded" />
                    <div className="space-y-2">
                      <div className="w-full h-3 bg-gray-700/40 rounded" />
                      <div className="w-5/6 h-3 bg-gray-700/40 rounded" />
                      <div className="w-4/5 h-3 bg-gray-700/40 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// app/users/courses/[id]/page.tsx

// ✅ NEW: Hook to fetch ONLY card data (price, sale, title, description)
function useCourseCardData(courseId: string, refreshKey: number) {
  const [cardData, setCardData] = useState<{
    title: string;
    description: string;
    price: string;
    salePrice: string | null;
    saleEndsAt: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadCardData() {
      try {
        console.log(`🎴 [Course Detail] Fetching fresh card data (refresh: ${refreshKey})...`);
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

        console.log(`✅ [Course Detail] Card data loaded in ${loadTime}ms`);

        if (isMounted) {
          // Find the card for this specific course
          const card = data.cards.find((c: any) => c.id === courseId);
          
          if (card) {
            setCardData({
              title: card.title || 'Untitled Course',
              description: card.description || '',
              price: card.price || '0',
              salePrice: card.salePrice,
              saleEndsAt: card.saleEndsAt,
            });
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ [Course Detail] Card data load error:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (courseId) {
      loadCardData();
    }

    return () => {
      isMounted = false;
    };
  }, [courseId, refreshKey]);

  return { cardData, loading };
}

// ✅ NEW: Fetch enrollment status from cards API
function useEnrollmentStatus(courseId: string, user: any, refreshKey: number) {
  const [enrollmentStatus, setEnrollmentStatus] = useState<{
    enrolled: boolean;
    isOwner: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadEnrollment() {
      if (!user) {
        // Not logged in
        if (isMounted) {
          setEnrollmentStatus(null);
          setLoading(false);
        }
        return;
      }

      try {
        console.log(`🔐 [Enrollment Check] Fetching for course ${courseId}...`);
        const startTime = Date.now();

        const response = await fetch('/api/course/cards', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch enrollment status');
        }

        const data = await response.json();
        const loadTime = Date.now() - startTime;

        console.log(`✅ [Enrollment Check] Loaded in ${loadTime}ms`);

        if (isMounted) {
          const card = data.cards.find((c: any) => c.id === courseId);
          
          if (card && card.enrollmentStatus) {
            setEnrollmentStatus(card.enrollmentStatus);
            console.log('✅ [Enrollment Status]:', card.enrollmentStatus);
          } else {
            setEnrollmentStatus({ enrolled: false, isOwner: false });
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ [Enrollment Check] Error:', error);
        if (isMounted) {
          setEnrollmentStatus({ enrolled: false, isOwner: false });
          setLoading(false);
        }
      }
    }

    loadEnrollment();

    return () => {
      isMounted = false;
    };
  }, [courseId, user, refreshKey]);

  return { enrollmentStatus, loading };
}

// ✅ UPDATE: Modified atomic hook - NO enrollment status
function useAtomicCourseData(id: string, refreshKey: number) {
  const [data, setData] = useState<{
    courseData: any;
    owner: any;
    currentUserAvatars: any[];
    loading: boolean;
    error: string | null;
  }>({
    courseData: null,
    owner: null,
    currentUserAvatars: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadAtomic() {
      try {
        console.log(`⚡ Loading atomic course data (refresh: ${refreshKey})...`);
        const startTime = Date.now();

        const response = await fetch(`/api/course/atomic/${id}`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Course not found or not published');
          }
          throw new Error('Failed to fetch course data');
        }

        const atomicData = await response.json();
        const loadTime = Date.now() - startTime;

        console.log(`⚡ Atomic course data loaded in ${loadTime}ms`);

        if (isMounted) {
          if (atomicData.owner && atomicData.owner.username) {
            userCache.set(atomicData.owner.username, {
              data: atomicData.owner,
              timestamp: Date.now(),
            });
          }

          setData({
            courseData: atomicData.course,
            owner: atomicData.owner,
            currentUserAvatars: atomicData.currentUserAvatars || [],
            loading: false,
            error: null,
          });

          console.log('✅ Atomic course data set, page ready to render');
        }
      } catch (error) {
        console.error('❌ Atomic load error:', error);
        if (isMounted) {
          setData({
            courseData: null,
            owner: null,
            currentUserAvatars: [],
            loading: false,
            error:
              error instanceof Error ? error.message : 'Failed to load course',
          });
        }
      }
    }

    loadAtomic();

    return () => {
      isMounted = false;
    };
  }, [id, refreshKey]);

  return data;
}

function useAutoRefresh(refreshFn: () => void, interval = 30000) {
  useEffect(() => {
    const timer = setInterval(() => {
      console.log('🔄 [AUTO-REFRESH] Refreshing data...');
      refreshFn();
    }, interval);

    return () => clearInterval(timer);
  }, [refreshFn, interval]);
}

export default function PublicCoursePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, logout, checkAuthStatus } = useAuth();
  
  // ✅ ALL STATE HOOKS FIRST
  const [refreshKey, setRefreshKey] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [showOwnerHoverCard, setShowOwnerHoverCard] = useState(false);
  const [hoveredOwner, setHoveredOwner] = useState<ExtendedUser | null>(null);
  const [ownerHoverPosition, setOwnerHoverPosition] = useState({ x: 0, y: 0 });
  const [ownerHoverTimeout, setOwnerHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  // ✅ ALL CUSTOM HOOKS
  // ✅ Fetch course data (cached, no enrollment)
  const { courseData, owner, currentUserAvatars, loading: atomicLoading, error } =
    useAtomicCourseData(id, refreshKey);
  
  // ✅ Fetch card data with pricing
  const { cardData, loading: cardLoading } = useCourseCardData(id, refreshKey);
  
  // ✅ Fetch enrollment status separately (NO CACHE)
  const { enrollmentStatus, loading: enrollmentLoading } = useEnrollmentStatus(id, user, refreshKey);

  // ✅ ALL EFFECTS
  useAutoRefresh(() => {
    setRefreshKey(prev => prev + 1);
  }, 30000);

  useEffect(() => {
    const initAuth = async () => {
      console.log("[Course Page] Checking auth on mount");
      await checkAuthStatus(true);
    };

    if (id) {
      initAuth();
    }
  }, [checkAuthStatus, id]);

  useEffect(() => {
    const handleReturnFromSignup = async () => {
      const shouldForceCheck = sessionStorage.getItem('force_auth_check_on_return');
      
      if (shouldForceCheck) {
        console.log('[Course Page] 🔄 Forcing auth check after signup');
        sessionStorage.removeItem('force_auth_check_on_return');
        await checkAuthStatus(true);
      }
    };

    handleReturnFromSignup();
  }, [checkAuthStatus]);

  useEffect(() => {
    return () => {
      if (ownerHoverTimeout) {
        clearTimeout(ownerHoverTimeout);
      }
    };
  }, [ownerHoverTimeout]);

  useEffect(() => {
    if (courseData && owner && user) {
      console.log('[Course Detail] Debug:', {
        currentUserId: user.id,
        ownerId: owner.id,
        isOwner: enrollmentStatus?.isOwner,
        enrolled: enrollmentStatus?.enrolled,
      });
    }
  }, [courseData, owner, user, enrollmentStatus]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".dropdown-container")) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isProfileOpen]);

  // ✅ ALL MEMOIZED VALUES
  const mergedCourseData = useMemo(() => {
    if (!courseData) return null;
    if (!cardData) return courseData;

    return {
      ...courseData,
      courseTitle: cardData.title || courseData.courseTitle,
      courseDescription: cardData.description || courseData.courseDescription,
      price: cardData.price || courseData.price || '0',
      salePrice: cardData.salePrice || undefined,
      saleEndsAt: cardData.saleEndsAt || undefined,
      footerPrice: cardData.price || courseData.footerPrice || '0',
      footerSalePrice: cardData.salePrice || undefined,
      footerSaleEndsAt: cardData.saleEndsAt || undefined,
    };
  }, [courseData, cardData]);

  const primaryAvatar = useMemo(() => 
    currentUserAvatars?.find((a) => a.isPrimary) || currentUserAvatars?.[0] || null,
    [currentUserAvatars]
  );

  const ownerPrimaryAvatar = useMemo(() => 
    owner?.primaryAvatar || null,
    [owner]
  );

  // ✅ UPDATE: Loading check
  const shouldShowSkeleton = useMemo(() => 
    atomicLoading || cardLoading || (user && enrollmentLoading),
    [atomicLoading, cardLoading, user, enrollmentLoading]
  );

  // ✅ ALL EVENT HANDLERS (regular functions, not hooks)
  const handleOwnerHover = (e: React.MouseEvent) => {
    if (ownerHoverTimeout) {
      clearTimeout(ownerHoverTimeout);
    }

    if (!owner?.username) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;

    setOwnerHoverPosition({
      x: rect.left + scrollX + rect.width / 2,
      y: rect.top + scrollY,
    });

    const ownerData = userCache.get(owner.username);

    if (ownerData) {
      console.log('⚡ Showing instant owner hover card');
      setHoveredOwner(ownerData.data);
      setShowOwnerHoverCard(true);
    }
  };

  const handleOwnerLeave = () => {
    if (ownerHoverTimeout) {
      clearTimeout(ownerHoverTimeout);
    }

    const timeout = setTimeout(() => {
      setShowOwnerHoverCard(false);
      setHoveredOwner(null);
    }, 150);

    setOwnerHoverTimeout(timeout);
  };

  const handleOwnerHoverCardEnter = () => {
    if (ownerHoverTimeout) {
      clearTimeout(ownerHoverTimeout);
    }
    setShowOwnerHoverCard(true);
  };

  const handleOwnerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (owner?.username) {
      router.push(`/users/profile/${owner.username}`);
    }
  };

  const handleEnroll = async () => {
    try {
      setEnrolling(true);

      if (!user) {
        const courseUrl = `/users/courses/${id}`;

        const minimalMetadata = {
          courseId: id,
          fromCourse: true,
          timestamp: Date.now()
        };

        console.log('[Course Page] 📦 Storing minimal metadata:', minimalMetadata);

        sessionStorage.setItem('signup_course_metadata', JSON.stringify(minimalMetadata));
        sessionStorage.setItem('signup_redirect_url', courseUrl);
        sessionStorage.setItem('force_auth_check_on_return', 'true');
        
        localStorage.setItem('temp_signup_course_metadata', JSON.stringify(minimalMetadata));
        localStorage.setItem('temp_signup_redirect', courseUrl);
        
        const signupUrl = new URL('/auth/signup', window.location.origin);
        signupUrl.searchParams.set('redirect', courseUrl);
        signupUrl.searchParams.set('course', id);
        
        console.log('[Course Page] 🚀 Navigating to:', signupUrl.toString());
        
        router.push(signupUrl.toString());
        return;
      }

      router.push(`/users/courses/${id}/checkout`);
    } catch (err) {
      console.error("[Course Page] ❌ Error:", err);
      alert("Failed to proceed");
    } finally {
      setEnrolling(false);
    }
  };

  const handleStartLearning = () => {
    router.push(`/users/courseinside?courseId=${id}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const renderHomepage = () => {
    if (!mergedCourseData) return null;

    if (mergedCourseData.homepageType === "custom" && mergedCourseData.customHomepageFile) {
      const CustomHomepage = getCustomHomepage(mergedCourseData.customHomepageFile);
      
      if (CustomHomepage) {
        return (
          <CustomHomepage
            courseData={mergedCourseData}
            enrollmentStatus={enrollmentStatus}
            onEnroll={handleEnroll}
            onStartLearning={handleStartLearning}
            enrolling={enrolling}
          />
        );
      }
    }

    return (
      <LivePreview
        data={mergedCourseData}
        enrollmentStatus={enrollmentStatus}
        onEnroll={handleEnroll}
        onStartLearning={handleStartLearning}
        enrolling={enrolling}
      />
    );
  };

  // ✅ NOW CONDITIONAL RENDERING (after ALL hooks)
  console.log("[Course Page] Render state:", {
    hasUser: !!user,
    userEmail: user?.email,
    enrollmentStatus,
  });

  if (shouldShowSkeleton) {
    return <CoursePageSkeleton />;
  }

  if (error || !mergedCourseData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <FaExclamationTriangle className="text-red-500 text-6xl mx-auto mb-6" />
          <h1 className="text-white text-3xl font-black mb-4">
            {error || "Course Not Found"}
          </h1>
          <p className="text-gray-400 mb-8">
            {error === "Course not found or not published"
              ? "This course does not exist or has not been published yet."
              : "There was an error loading this course. Please try again later."}
          </p>
          <button
            onClick={() => router.push("/users/courses")}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-xl font-bold hover:scale-105 transition-transform inline-flex items-center gap-3"
          >
            <FaArrowLeft />
            Browse All Courses
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Navbar */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-[99999]"
        style={{ isolation: "isolate" }}
      >
        <div className="max-w-[1800px] mx-auto">
          <div className="relative rounded-xl sm:rounded-2xl overflow-visible">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 backdrop-blur-2xl rounded-xl sm:rounded-2xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent rounded-xl sm:rounded-2xl" />
            <div className="absolute inset-0 border border-red-500/20 rounded-xl sm:rounded-2xl" />
            <div className="absolute inset-0 shadow-2xl shadow-red-500/5 rounded-xl sm:rounded-2xl" />

            <div className="relative px-3 sm:px-4 md:px-6 py-2 sm:py-3">
              {/* Desktop Layout */}
              <div className="hidden md:grid md:grid-cols-[auto_1fr_auto] items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-red-500/50 overflow-hidden bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center flex-shrink-0 cursor-pointer hover:border-red-500 hover:ring-2 hover:ring-red-500/30 transition-all duration-200"
                      onMouseEnter={handleOwnerHover}
                      onMouseLeave={handleOwnerLeave}
                      onClick={handleOwnerClick}
                    >
                      <ProfileAvatar
                        customImage={owner?.img}
                        avatar={ownerPrimaryAvatar}
                        userId={owner?.id || 'default'}
                        size={32}
                      />
                    </div>
                    <div>
                      <h2 className="text-white font-bold text-sm leading-tight">
                        {mergedCourseData?.courseTitle}
                      </h2>
                      <p
                        className="text-gray-400 text-xs flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors"
                        onMouseEnter={handleOwnerHover}
                        onMouseLeave={handleOwnerLeave}
                        onClick={handleOwnerClick}
                      >
                        <FaUser className="text-red-400 text-[10px]" />
                        by {owner?.fullName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Center: Status Badge */}
                <div className="flex justify-center">
                  {enrollmentStatus?.isOwner && (
                    <div className="inline-flex items-center gap-2 bg-blue-900/20 border border-blue-500/30 px-4 py-2 rounded-xl backdrop-blur-sm">
                      <FaCheckCircle className="text-blue-400" />
                      <span className="text-white text-sm font-bold">
                        Your Course
                      </span>
                    </div>
                  )}
                  {enrollmentStatus?.enrolled && !enrollmentStatus?.isOwner && (
                    <div className="inline-flex items-center gap-2 bg-green-900/20 border border-green-500/30 px-4 py-2 rounded-xl backdrop-blur-sm">
                      <FaCheckCircle className="text-green-400" />
                      <span className="text-white text-sm font-bold">
                        Enrolled
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: Actions + Profile */}
                <div className="flex items-center gap-2">
                  {enrollmentStatus?.isOwner ? (
                    <>
                      <motion.button
                        onClick={() =>
                          router.push(
                            `/users/homepage-builder?courseId=${mergedCourseData?.courseId}`
                          )
                        }
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative px-4 py-2 rounded-xl overflow-hidden group flex items-center gap-2"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700" />
                        <div className="absolute inset-0 border border-blue-500/30 rounded-xl" />
                        <FaCog className="text-xs text-white relative z-10" />
                        <span className="text-sm font-medium text-white relative z-10">
                          Edit
                        </span>
                      </motion.button>
                      <motion.button
                        onClick={() =>
                          router.push(`/users/courseinside?courseId=${id}`)
                        }
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative px-4 py-2 rounded-xl overflow-hidden group flex items-center gap-2"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700" />
                        <div className="absolute inset-0 border border-blue-500/30 rounded-xl" />
                        <FaBook className="text-xs text-white relative z-10" />
                        <span className="text-sm font-medium text-white relative z-10">
                          Modules
                        </span>
                      </motion.button>
                    </>
                  ) : enrollmentStatus?.enrolled ? (
                    <motion.button
                      onClick={handleStartLearning}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative px-6 py-2.5 rounded-xl overflow-hidden group flex items-center gap-2"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 shadow-[0_0_40px_rgba(34,197,94,0.4)]" />
                      <div className="absolute inset-0 border border-green-500/30 rounded-xl" />
                      <FaPlay className="text-sm text-white relative z-10" />
                      <span className="text-sm font-bold text-white relative z-10">
                        Start Learning
                      </span>
                    </motion.button>
                  ) : user ? (
                    <motion.button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      whileHover={{ scale: enrolling ? 1 : 1.05 }}
                      whileTap={{ scale: enrolling ? 1 : 0.95 }}
                      className="relative px-6 py-2.5 rounded-xl overflow-hidden group flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 shadow-[0_0_40px_rgba(239,68,68,0.4)]" />
                      <div className="absolute inset-0 border border-red-500/30 rounded-xl" />
                      {enrolling ? (
                        <>
                          <FaSpinner className="text-sm text-white relative z-10 animate-spin" />
                          <span className="text-sm font-bold text-white relative z-10">
                            Enrolling...
                          </span>
                        </>
                      ) : (
                        <>
                          <FaRocket className="text-sm text-white relative z-10" />
                          <span className="text-sm font-bold text-white relative z-10">
                            Enroll Now
                          </span>
                        </>
                      )}
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={() =>
                        router.push(
                          `/auth/signup?redirect=${encodeURIComponent(
                            `/users/courses/${id}`
                          )}`
                        )
                      }
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative px-6 py-2.5 rounded-xl overflow-hidden group flex items-center gap-2"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 shadow-[0_0_40px_rgba(239,68,68,0.4)]" />
                      <div className="absolute inset-0 border border-red-500/30 rounded-xl" />
                      <FaUser className="text-sm text-white relative z-10" />
                      <span className="text-sm font-bold text-white relative z-10">
                        Sign Up to Enroll
                      </span>
                    </motion.button>
                  )}

                  {user && (
                    <div className="relative dropdown-container">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setIsProfileOpen(!isProfileOpen);
                        }}
                        className="relative flex items-center gap-2 px-3 py-2 rounded-xl overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gray-900/30 hover:bg-gray-900/50 rounded-xl transition-all" />
                        <div className="absolute inset-0 border border-gray-700/30 hover:border-gray-600/50 rounded-xl transition-all" />

                        <div className="relative w-8 h-8 rounded-full border-2 border-red-500/50 overflow-hidden bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                          <ProfileAvatar
                            customImage={user?.img}
                            avatar={primaryAvatar}
                            userId={user?.id || "default"}
                            size={32}
                          />
                        </div>

                        <div className="text-left pr-2">
                          <div className="text-xs font-medium text-white leading-tight truncate max-w-[120px]">
                            {user?.username}
                          </div>
                        </div>
                      </motion.button>

                      {/* Profile Dropdown */}
                      <AnimatePresence>
                        {isProfileOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-[100000]"
                              onClick={() => setIsProfileOpen(false)}
                            />
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute right-0 mt-2 w-72 rounded-xl overflow-hidden shadow-2xl z-[100001]"
                              style={{ top: "calc(100% + 0.5rem)" }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-gray-900/98 to-black/98 backdrop-blur-2xl" />
                              <div className="absolute inset-0 border border-red-500/20 rounded-xl" />

                              <div className="relative">
                                <div className="p-4 border-b border-gray-800">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 rounded-full border-2 border-red-500/50 overflow-hidden bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center flex-shrink-0">
                                      <ProfileAvatar
                                        customImage={user?.img}
                                        avatar={primaryAvatar}
                                        userId={user?.id || "default"}
                                        size={48}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-sm font-bold text-white truncate">
                                        {user?.name || user?.username}
                                      </h3>
                                      <p className="text-xs text-gray-400 truncate">
                                        {user?.email}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-2">
                                  {[
                                    {
                                      icon: FaHome,
                                      label: "Dashboard",
                                      href: "/users/dashboard",
                                    },
                                    {
                                      icon: FaBook,
                                      label: "My Courses",
                                      href: "/users/my-courses",
                                    },
                                    {
                                      icon: FaChartLine,
                                      label: "Analytics",
                                      href: "/users/analytics",
                                    },
                                    {
                                      icon: FaMoneyBillWave,
                                      label: "Earnings",
                                      href: "/users/payout",
                                    },
                                    {
                                      icon: FaCog,
                                      label: "Settings",
                                      href: "/users/settings",
                                    },
                                  ].map((item) => (
                                    <button
                                      key={item.label}
                                      onClick={() => {
                                        setIsProfileOpen(false);
                                        router.push(item.href);
                                      }}
                                      className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-gray-800/50 transition-all group"
                                    >
                                      <item.icon className="text-sm text-gray-400 group-hover:text-red-400 transition-colors" />
                                      <span className="text-sm text-white">
                                        {item.label}
                                      </span>
                                    </button>
                                  ))}
                                </div>

                                <div className="p-2 border-t border-gray-800">
                                  <button
                                    onClick={() => {
                                      setIsProfileOpen(false);
                                      handleLogout();
                                    }}
                                    className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-red-600/10 transition-all group"
                                  >
                                    <FaSignOutAlt className="text-sm text-gray-400 group-hover:text-red-400 transition-colors" />
                                    <span className="text-sm text-white">
                                      Sign out
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Layout - keep existing code */}
              <div className="flex md:hidden items-center justify-between gap-2">
                {/* ✅ Course Title + Owner Avatar - HOVERABLE & CLICKABLE */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className="w-7 h-7 rounded-full border-2 border-red-500/50 overflow-hidden bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center flex-shrink-0 cursor-pointer hover:border-red-500 transition-all"
                    onMouseEnter={handleOwnerHover}
                    onMouseLeave={handleOwnerLeave}
                    onClick={handleOwnerClick}
                  >
                    <ProfileAvatar
                      customImage={owner?.img}
                      avatar={ownerPrimaryAvatar}
                      userId={owner?.id || 'default'}
                      size={28}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-white font-bold text-xs leading-tight truncate">
                      {mergedCourseData?.courseTitle}
                    </h2>
                    {/* ✅ Owner Name - CLICKABLE on mobile */}
                    <p
                      className="text-gray-400 text-[10px] truncate cursor-pointer hover:text-white transition-colors"
                      onClick={handleOwnerClick}
                    >
                      by {owner?.fullName}
                    </p>
                  </div>
                </div>

                {user ? (
                  <div className="relative dropdown-container">
                    {/* ... existing profile button ... */}
                    <button
                      onClick={() => {
                        setIsProfileOpen(!isProfileOpen);
                      }}
                      className="relative p-0.5 rounded-lg overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm rounded-lg" />
                      <div className="relative w-7 h-7 rounded-full border-2 border-red-500/50 overflow-hidden bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                        <ProfileAvatar
                          customImage={user?.img}
                          avatar={primaryAvatar}
                          userId={user?.id || "default"}
                          size={28}
                        />
                      </div>
                    </button>

                    <AnimatePresence>
                      {isProfileOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-[100000]"
                            onClick={() => setIsProfileOpen(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="fixed right-2 mt-2 w-[calc(100vw-1rem)] max-w-xs rounded-xl overflow-hidden shadow-2xl z-[100001]"
                            style={{ top: "calc(100% + 0.5rem)" }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/98 to-black/98 backdrop-blur-2xl" />
                            <div className="absolute inset-0 border border-red-500/20 rounded-xl" />

                            <div className="relative">
                              <div className="p-3 border-b border-gray-800">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-10 h-10 rounded-full border-2 border-red-500/50 overflow-hidden bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center flex-shrink-0">
                                    <ProfileAvatar
                                      customImage={user?.img}
                                      avatar={primaryAvatar}
                                      userId={user?.id || "default"}
                                      size={40}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-xs font-bold text-white truncate">
                                      {user?.name || user?.username}
                                    </h3>
                                    <p className="text-[10px] text-gray-400 truncate">
                                      {user?.email}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="p-2">
                                {[
                                  {
                                    icon: FaHome,
                                    label: "Dashboard",
                                    href: "/users/dashboard",
                                  },
                                  {
                                    icon: FaBook,
                                    label: "My Courses",
                                    href: "/users/my-courses",
                                  },
                                  {
                                    icon: FaCog,
                                    label: "Settings",
                                    href: "/users/settings",
                                  },
                                ].map((item) => (
                                  <button
                                    key={item.label}
                                    onClick={() => {
                                      setIsProfileOpen(false);
                                      router.push(item.href);
                                    }}
                                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-gray-800/50 transition-all group"
                                  >
                                    <item.icon className="text-xs text-gray-400 group-hover:text-red-400 transition-colors" />
                                    <span className="text-xs text-white">
                                      {item.label}
                                    </span>
                                  </button>
                                ))}
                              </div>

                              <div className="p-2 border-t border-gray-800">
                                <button
                                  onClick={() => {
                                    setIsProfileOpen(false);
                                    handleLogout();
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-red-600/10 transition-all group"
                                >
                                  <FaSignOutAlt className="text-xs text-gray-400 group-hover:text-red-400 transition-colors" />
                                  <span className="text-xs text-white">
                                    Sign out
                                  </span>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <motion.button
                    onClick={() =>
                      router.push(
                        `/auth/signup?redirect=${encodeURIComponent(
                          `/users/courses/${id}`
                        )}`
                      )
                    }
                    whileTap={{ scale: 0.95 }}
                    className="relative px-3 py-1.5 rounded-lg overflow-hidden flex items-center gap-1.5"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700" />
                    <FaUser className="text-xs text-white relative z-10" />
                    <span className="text-xs font-bold text-white relative z-10">
                      Sign Up
                    </span>
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Dynamic Homepage Rendering */}
      {renderHomepage()}
      
      {/* Floating Action Buttons - keep existing */}
      {!user && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={handleEnroll}
          disabled={enrolling}
          className="fixed bottom-8 right-8 md:hidden bg-gradient-to-r from-red-600 to-red-700 shadow-[0_0_40px_rgba(239,68,68,0.8)] text-white p-6 rounded-full font-black hover:scale-110 transition-transform disabled:opacity-50 z-40"
        >
          {enrolling ? (
            <FaSpinner className="text-2xl animate-spin" />
          ) : (
            <FaRocket className="text-2xl" />
          )}
        </motion.button>
      )}

      {user && enrollmentStatus?.enrolled && !enrollmentStatus?.isOwner && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={handleStartLearning}
          className="fixed bottom-8 right-8 md:hidden bg-gradient-to-r from-green-600 to-green-700 shadow-[0_0_40px_rgba(34,197,94,0.8)] text-white p-6 rounded-full font-black hover:scale-110 transition-transform z-40"
        >
          <FaPlay className="text-2xl" />
        </motion.button>
      )}

      {/* Hover Card Portal */}
      <div onMouseEnter={handleOwnerHoverCardEnter} onMouseLeave={handleOwnerLeave}>
        {hoveredOwner && (
          <UserHoverCard
            user={hoveredOwner}
            isVisible={showOwnerHoverCard}
            position={ownerHoverPosition}
          />
        )}
      </div>
    </div>
  );
}