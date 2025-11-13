// components/dashboard/CommandHeader.tsx
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { 
  FaBell, FaUserCircle, FaSignOutAlt, FaCog,
  FaChartLine, FaMoneyBillWave, FaVideo, FaBookOpen, FaSearch,
  FaHome, FaQuestionCircle, FaUserFriends,
  FaChevronRight, FaStar, FaGraduationCap,
  FaPlus, FaArrowRight, FaClock, FaLock
} from "react-icons/fa";
import { IconType } from "react-icons";
import AvatarGenerator from "@/components/settings/AvatarGenerator";

// Define proper types for command items
interface BaseCommandItem {
  icon: IconType;
  label: string;
  href: string;
  color?: string;
  shortcut?: string;
  subtext?: string;
}

interface CommandCategory {
  category: string;
  items: BaseCommandItem[];
}

interface Notification {
  id: number;
  type: string;
  icon: IconType;
  iconColor: string;
  title: string;
  message: string;
  read: boolean;
  time: string;
}

interface UserGoalsData {
  purpose: string;
  role: string;
  monthlyGoal?: string;
  timeCommitment?: string;
  hasCompletedQuestionnaire: boolean;
  updatedAt?: string;
}

interface UserAvatar {
  id: string;
  avatarIndex: number;
  avatarSeed: string;
  avatarStyle: string;
  isPrimary: boolean;
  isCustomUpload: boolean;
  customImageUrl: string | null;
}

// ✅ Atomic data hook - FIXED: Always call hooks in the same order
function useAtomicNavbarData() {
  const { user, authChecked } = useAuth();
  const [data, setData] = useState<{
    navbarUser: any | null;
    userGoals: any | null;
    primaryAvatar: any | null;
    sessions: any[];
    loading: boolean;
    error: string | null;
  }>({
    navbarUser: null,
    userGoals: null,
    primaryAvatar: null,
    sessions: [],
    loading: true,
    error: null,
  });

  const loadedRef = useRef(false);
  const loadingRef = useRef(false);

  // ✅ FIXED: Always call useEffect hooks in the same order
  useEffect(() => {
    // Don't load until auth is checked
    if (!authChecked) {
      console.log('[Navbar] Waiting for auth check...');
      return;
    }

    // If no user, set loading to false immediately
    if (!user) {
      console.log('[Navbar] No user, skipping atomic load');
      setData({
        navbarUser: null,
        userGoals: null,
        primaryAvatar: null,
        sessions: [],
        loading: false,
        error: null,
      });
      return;
    }

    // Prevent duplicate loads
    if (loadedRef.current || loadingRef.current) {
      console.log('[Navbar] Already loaded or loading, skipping');
      return;
    }

    loadingRef.current = true;

    async function loadAtomic() {
      try {
        console.log('⚡ Loading atomic navbar data...');
        const startTime = Date.now();

        const response = await fetch('/api/atomic/navbar', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch navbar data');
        }

        const atomicData = await response.json();
        const loadTime = Date.now() - startTime;

        console.log(`⚡ Navbar atomic data loaded in ${loadTime}ms`);

        setData({
          navbarUser: atomicData.user,
          userGoals: atomicData.userGoals,
          primaryAvatar: atomicData.primaryAvatar,
          sessions: atomicData.sessions || [],
          loading: false,
          error: null,
        });

        loadedRef.current = true;
        console.log('✅ Navbar ready to render');
      } catch (error) {
        console.error('❌ Navbar atomic load error:', error);
        setData({
          navbarUser: null,
          userGoals: null,
          primaryAvatar: null,
          sessions: [],
          loading: false,
          error: 'Failed to load navbar',
        });
      } finally {
        loadingRef.current = false;
      }
    }

    loadAtomic();
  }, [user, authChecked]);

  // Reset loaded ref when user changes
  useEffect(() => {
    if (user?.id) {
      loadedRef.current = false;
    }
  }, [user?.id]);

  return data;
}

// ✅ Locked Command Palette for Non-Logged-In Users
const LockedCommandPalette = ({ onClose }: { onClose: () => void }) => {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200000]"
      />

      <div className="fixed inset-0 z-[200001] flex items-start justify-center pt-[10vh] px-4">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="w-full max-w-2xl rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/98 to-black/98 backdrop-blur-3xl" />
          <div className="absolute inset-0 border border-red-500/30 rounded-xl sm:rounded-2xl" />

          <div className="relative">
            <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-800/50 relative">
              <div className="absolute inset-0 backdrop-blur-md bg-gray-900/50" />
              <FaSearch className="text-gray-400 text-base sm:text-lg flex-shrink-0 relative z-10 opacity-30" />
              <input
                type="text"
                placeholder="Search or jump to..."
                disabled
                className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-gray-500 outline-none relative z-10 opacity-30"
              />
            </div>

            <div className="py-16 sm:py-20 text-center px-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-red-600/20 to-red-800/20 border-2 border-red-500/30 flex items-center justify-center"
              >
                <FaLock className="text-3xl sm:text-4xl text-red-400" />
              </motion.div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Sign in Required</h3>
              <p className="text-sm sm:text-base text-gray-400 mb-6">
                Create an account or sign in to access search and navigation
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/auth/signin"
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:scale-105 transition-transform text-sm sm:text-base"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-6 py-3 bg-gray-800/50 border border-gray-700 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors text-sm sm:text-base"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

// ✅ Locked Profile Dropdown for Non-Logged-In Users
const LockedProfileDropdown = ({ onClose }: { onClose: () => void }) => {
  return (
    <>
      <div 
        className="fixed inset-0 z-[100000]" 
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className="absolute right-0 mt-2 w-72 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl z-[100001]"
        style={{ top: 'calc(100% + 0.5rem)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/98 to-black/98 backdrop-blur-2xl" />
        <div className="absolute inset-0 border border-red-500/20 rounded-xl sm:rounded-2xl" />
        
        <div className="relative">
          <div className="p-3 sm:p-4 border-b border-gray-800 relative">
            <div className="absolute inset-0 backdrop-blur-sm bg-gray-900/30" />
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 opacity-30 relative z-10">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-700 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-3 bg-gray-700 rounded w-24 mb-2" />
                <div className="h-2 bg-gray-700 rounded w-32" />
              </div>
            </div>
          </div>

          <div className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-600/20 to-red-800/20 border-2 border-red-500/30 flex items-center justify-center">
              <FaLock className="text-xl text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Sign in to Continue</h3>
            <p className="text-sm text-gray-400 mb-4">
              Access your profile, courses, and more
            </p>
            <Link
              href="/auth/signin"
              className="block w-full px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:scale-105 transition-transform text-sm"
            >
              Sign In Now
            </Link>
          </div>

          <div className="p-2 relative">
            <div className="absolute inset-0 backdrop-blur-sm bg-gray-900/30" />
            <div className="relative z-10 opacity-20 space-y-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-9 bg-gray-800 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

// ✅ Optimized Navbar Skeleton Component
const NavbarSkeleton = () => {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-[99999]"
      style={{ isolation: 'isolate' }}
    >
      <div className="max-w-[1800px] mx-auto">
        <div className="relative rounded-xl sm:rounded-2xl overflow-visible">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 backdrop-blur-2xl rounded-xl sm:rounded-2xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent rounded-xl sm:rounded-2xl" />
          <div className="absolute inset-0 border border-red-500/20 rounded-xl sm:rounded-2xl" />
          <div className="absolute inset-0 shadow-2xl shadow-red-500/5 rounded-xl sm:rounded-2xl" />

          <div className="relative px-3 sm:px-4 md:px-6 py-2 sm:py-3">
            <div className="hidden md:grid md:grid-cols-[auto_1fr_auto] items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-800/40 rounded-xl animate-pulse" 
                       style={{ animationDelay: '0ms' }} />
                  <div className="hidden lg:block w-24 h-4 bg-gray-800/40 rounded animate-pulse"
                       style={{ animationDelay: '100ms' }} />
                </div>
              </div>

              <div className="flex justify-center">
                <div className="w-full max-w-lg h-11 bg-gray-800/40 rounded-xl animate-pulse"
                     style={{ animationDelay: '200ms' }} />
              </div>

              <div className="flex items-center gap-2">
                <div className="w-20 h-9 bg-gray-800/40 rounded-xl animate-pulse"
                     style={{ animationDelay: '300ms' }} />
                <div className="w-10 h-10 bg-gray-800/40 rounded-xl animate-pulse"
                     style={{ animationDelay: '400ms' }} />
                <div className="w-32 h-10 bg-gray-800/40 rounded-xl animate-pulse"
                     style={{ animationDelay: '500ms' }} />
              </div>
            </div>

            <div className="flex md:hidden items-center justify-between gap-2">
              <div className="w-7 h-7 bg-gray-800/40 rounded-lg animate-pulse"
                   style={{ animationDelay: '0ms' }} />
              <div className="flex-1 max-w-[200px] sm:max-w-xs mx-auto h-9 bg-gray-800/40 rounded-lg animate-pulse"
                   style={{ animationDelay: '100ms' }} />
              <div className="w-7 h-7 bg-gray-800/40 rounded-lg animate-pulse"
                   style={{ animationDelay: '200ms' }} />
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

// ✅ Profile Avatar Component
const ProfileAvatar = ({ 
  customImage, 
  avatar, 
  userId, 
  size = 32,
  className = ""
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
        className={`object-cover rounded-full ${className}`}
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
        className={`object-cover rounded-full ${className}`}
      />
    );
  }

  if (avatar && avatar.avatarIndex >= 0) {
    return (
      <AvatarGenerator
        userId={userId}
        avatarIndex={avatar.avatarIndex}
        size={size}
        style={avatar.avatarStyle as 'avataaars'}
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

const CommandHeader = () => {
  const { user, logout, isLoading: authLoading, authChecked } = useAuth();
  const pathname = usePathname();
  
  // ✅ ALWAYS call hooks in the same order - no conditional hooks
  const { navbarUser, userGoals, primaryAvatar, sessions, loading: navbarLoading } = useAtomicNavbarData();
  
  // ✅ ALL useState hooks MUST be called before any conditional returns
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // ✅ ALL useCallback hooks
  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [logout]);

  const userRole = useCallback(() => {
    if (!userGoals?.purpose) return 'Learner';
    if (userGoals.purpose === 'teach') return 'Tutor';
    if (userGoals.purpose === 'both') return 'Tutor & Learner';
    return 'Learner';
  }, [userGoals]);

  const getRoleBadgeColor = useCallback((role: string) => {
    if (role.includes('Tutor') && role.includes('Learner')) {
      return 'bg-gradient-to-r from-purple-500 to-blue-500';
    } else if (role.includes('Tutor')) {
      return 'bg-gradient-to-r from-red-500 to-orange-500';
    } else {
      return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    }
  }, []);

  // ✅ ALL useEffect hooks MUST be called in the same order every render
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleRefresh = async () => {
      console.log('🔄 Navbar refresh triggered');
      window.location.reload();
    };

    window.addEventListener('navbar-refresh', handleRefresh);
    return () => window.removeEventListener('navbar-refresh', handleRefresh);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen(true);
      }
      if (e.key === 'Escape') {
        setIsCommandOpen(false);
        setIsProfileOpen(false);
        setIsNotificationsOpen(false);
        setSearchQuery("");
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setIsProfileOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    if (isProfileOpen || isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isProfileOpen, isNotificationsOpen]);

  useEffect(() => {
    if (user?.id) {
      const mockNotifications: Notification[] = [
        { 
          id: 1, 
          type: 'payment',
          icon: FaMoneyBillWave,
          iconColor: 'text-green-400',
          title: 'Payment received',
          message: '\$127.50 from 3 sales', 
          read: false, 
          time: '5m ago'
        },
        { 
          id: 2, 
          type: 'student',
          icon: FaUserFriends,
          iconColor: 'text-blue-400',
          title: 'New enrollments',
          message: '8 students enrolled', 
          read: false, 
          time: '1h ago'
        },
        { 
          id: 3, 
          type: 'review',
          icon: FaStar,
          iconColor: 'text-yellow-400',
          title: '5-star review',
          message: 'Sarah M. loved your course!', 
          read: true, 
          time: '3h ago'
        }
      ];
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
    }
  }, [user?.id]);

  useEffect(() => {
    const handleAuthChange = async (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      
      const { user: newUser } = event.detail;
      console.log('[Navbar] 🔥 Auth state changed:', newUser?.email);
    };

    window.addEventListener('auth-state-changed', handleAuthChange);
    
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthChange);
    };
  }, []);

  // ✅ Determine loading state (after all hooks)
  const isLoading = authLoading || navbarLoading || !authChecked;
  const displayUser = user || navbarUser;
  const isPublicCoursesRoute = pathname === '/users/courses' || pathname?.startsWith('/users/courses/');
  const showLockedState = !displayUser && !isPublicCoursesRoute;

  // ✅ NOW we can do conditional rendering (after all hooks are called)
  if (!isMounted) {
    return <NavbarSkeleton />;
  }

  if (isLoading) {
    console.log('[Navbar] Loading state, showing skeleton');
    return <NavbarSkeleton />;
  }

  console.log('[Navbar] Render:', {
    hasUser: !!user,
    hasNavbarUser: !!navbarUser,
    hasDisplayUser: !!displayUser,
    userRole: userRole(),
    isLoading,
  });

  // Command Palette Items
  const commandItems: CommandCategory[] = [
    {
      category: 'Quick Actions',
      items: [
        { icon: FaPlus, label: 'Create new course', shortcut: 'C', href: '/users/management', color: 'text-red-400' },
        { icon: FaVideo, label: 'Explore Courses', shortcut: 'E', href: '/users/courses', color: 'text-blue-400' },
        { icon: FaChartLine, label: 'Your Profile', shortcut: 'P', href: '/users/profile', color: 'text-purple-400' },
        { icon: FaMoneyBillWave, label: 'Check earnings', shortcut: 'E', href: '/users/payout', color: 'text-green-400' },
      ]
    },
    {
      category: 'Navigation',
      items: [
        { icon: FaBookOpen, label: 'My Courses', href: '/users/my-courses', color: 'text-green-400' },
        { icon: FaUserFriends, label: 'Students', href: '/users/students', color: 'text-cyan-400' },
        { icon: FaGraduationCap, label: 'Learning', href: '/users/learning', color: 'text-purple-400' },
        { icon: FaCog, label: 'Settings', href: '/users/settings', color: 'text-gray-400' },
      ]
    },
    {
      category: 'Recent',
      items: [
        { icon: FaClock, label: 'Advanced Marketing Course', subtext: 'Edited 2 hours ago', href: '/users/my-courses', color: 'text-yellow-400' },
        { icon: FaClock, label: 'Loading... Messages', subtext: '5 unread', href: '/users/messages', color: 'text-blue-400' },
        { icon: FaClock, label: 'Revenue Report', subtext: 'Viewed yesterday', href: '/users/analytics', color: 'text-green-400' },
      ]
    }
  ];

  const filteredCommands = commandItems.map(category => ({
    ...category,
    items: category.items.filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-[99999]"
        style={{ isolation: 'isolate' }}
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
                
                {/* Left: Logo */}
                <div className="flex items-center gap-4">
                  <Link href={displayUser ? "/users/dashboard" : "/"} className="flex items-center gap-2 group">
                    <motion.div 
                      className="relative w-8 h-8 flex items-center justify-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-800 rounded-xl shadow-lg shadow-red-500/30" />
                      <div className="absolute inset-0 border border-red-500/30 rounded-xl" />
                      <div className="relative z-10 text-white font-bold text-xs">VS</div>
                    </motion.div>
                    <span className="hidden lg:block text-sm font-semibold text-white group-hover:text-red-400 transition-colors">
                      Verseandme
                    </span>
                  </Link>
                </div>

                {/* Center: Command Bar */}
                <div className="flex justify-center">
                  <motion.button
                    onClick={() => setIsCommandOpen(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full max-w-lg relative rounded-xl overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 to-black/70 backdrop-blur-sm" />
                    <div className="absolute inset-0 border border-red-500/20 group-hover:border-red-500/40 rounded-xl transition-all" />
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-br from-red-600/0 to-transparent group-hover:from-red-600/5"
                      whileHover={{ opacity: 1 }}
                    />
                    
                    <div className="relative flex items-center gap-3 px-4 py-2.5">
                      <FaSearch className="text-gray-500 text-sm" />
                      <span className="flex-1 text-left text-sm text-gray-500">
                        Search or jump to...
                      </span>
                      {/* ✅ FIXED: Always render kbd to prevent hydration mismatch */}
                      {displayUser ? (
                        <kbd className="px-2 py-1 bg-gray-800/50 border border-gray-700/50 rounded text-xs text-gray-400 font-mono">
                          ⌘K
                        </kbd>
                      ) : !isPublicCoursesRoute ? (
                        <FaLock className="text-gray-600 text-xs" />
                      ) : null}
                    </div>
                  </motion.button>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                  
                  {displayUser ? (
                    <>
                      {/* Quick Create */}
                      <Link href="/users/create-course">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="relative px-4 py-2 rounded-xl overflow-hidden group flex items-center gap-2"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700" />
                          <div className="absolute inset-0 border border-red-500/30 rounded-xl" />
                          <motion.div 
                            className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all"
                          />
                          <FaPlus className="text-xs text-white relative z-10" />
                          <span className="text-sm font-medium text-white relative z-10">Create</span>
                        </motion.button>
                      </Link>

                      {/* Notifications */}
                      <div className="relative dropdown-container">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setIsNotificationsOpen(!isNotificationsOpen);
                            setIsProfileOpen(false);
                          }}
                          className="relative p-2.5 rounded-xl text-gray-400 hover:text-white transition-colors"
                        >
                          <div className="absolute inset-0 bg-gray-900/30 hover:bg-gray-900/50 backdrop-blur-sm rounded-xl transition-all" />
                          <div className="absolute inset-0 border border-gray-700/30 hover:border-gray-600/50 rounded-xl transition-all" />
                          <FaBell className="w-4 h-4 relative z-10" />
                          {unreadCount > 0 && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-gray-900 z-20"
                            >
                              {unreadCount}
                            </motion.span>
                          )}
                        </motion.button>

                        {/* Notifications Panel */}
                        <AnimatePresence>
                          {isNotificationsOpen && (
                            <>
                              <div 
                                className="fixed inset-0 z-[100000]" 
                                onClick={() => setIsNotificationsOpen(false)}
                              />
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-2 w-96 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl z-[100001]"
                                style={{ top: 'calc(100% + 0.5rem)' }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/98 to-black/98 backdrop-blur-2xl" />
                                <div className="absolute inset-0 border border-red-500/20 rounded-xl sm:rounded-2xl" />
                                
                                <div className="relative">
                                  <div className="p-3 sm:p-4 border-b border-gray-800">
                                    <div className="flex items-center justify-between">
                                      <h3 className="text-xs sm:text-sm font-semibold text-white">Notifications</h3>
                                      <button className="text-[10px] sm:text-xs text-red-400 hover:text-red-300 font-medium">
                                        Mark all read
                                      </button>
                                    </div>
                                  </div>
                                  <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
                                    {notifications.map((notification, index) => (
                                      <motion.div
                                        key={notification.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="p-3 sm:p-4 border-b border-gray-800 hover:bg-red-600/5 transition-all cursor-pointer"
                                      >
                                        <div className="flex gap-2 sm:gap-3">
                                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center ${notification.iconColor} bg-gray-900/50 border border-gray-800 flex-shrink-0`}>
                                            <notification.icon className="text-xs sm:text-sm" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                              <h4 className="text-xs sm:text-sm font-medium text-white">{notification.title}</h4>
                                              {!notification.read && (
                                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full flex-shrink-0 mt-1.5" />
                                              )}
                                            </div>
                                            <p className="text-xs sm:text-sm text-gray-400 mb-1">{notification.message}</p>
                                            <span className="text-[10px] sm:text-xs text-gray-500">{notification.time}</span>
                                          </div>
                                        </div>
                                      </motion.div>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Profile with Avatar */}
                      <div className="relative dropdown-container">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setIsProfileOpen(!isProfileOpen);
                            setIsNotificationsOpen(false);
                          }}
                          className="relative flex items-center gap-2 px-3 py-2 rounded-xl overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gray-900/30 hover:bg-gray-900/50 rounded-xl transition-all" />
                          <div className="absolute inset-0 border border-gray-700/30 hover:border-gray-600/50 rounded-xl transition-all" />
                          
                          <div className="relative w-8 h-8 rounded-full border-2 border-red-500/50 overflow-hidden bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                            <ProfileAvatar
                              customImage={displayUser?.img}
                              avatar={primaryAvatar}
                              userId={displayUser?.id || 'default'}
                              size={32}
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full" />
                          </div>
                          
                          <div className="text-left pr-2">
                            <div className="text-xs font-medium text-white leading-tight truncate max-w-[120px]">
                              {displayUser?.username}
                            </div>
                            <div className="flex items-center gap-1">
                              <div className={`w-1.5 h-1.5 rounded-full ${getRoleBadgeColor(userRole())}`} />
                              <div className="text-[10px] text-gray-500 leading-tight">
                                {userRole()}
                              </div>
                            </div>
                          </div>
                        </motion.button>

                        {/* Profile Dropdown - continues... */}
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
                                className="absolute right-0 mt-2 w-72 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl z-[100001]"
                                style={{ top: 'calc(100% + 0.5rem)' }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/98 to-black/98 backdrop-blur-2xl" />
                                <div className="absolute inset-0 border border-red-500/20 rounded-xl sm:rounded-2xl" />
                                
                                <div className="relative">
                                  <div className="p-3 sm:p-4 border-b border-gray-800">
                                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-red-500/50 overflow-hidden bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center flex-shrink-0">
                                        <ProfileAvatar
                                          customImage={displayUser?.img}
                                          avatar={primaryAvatar}
                                          userId={displayUser?.id || 'default'}
                                          size={48}
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                                          {displayUser?.name || displayUser?.username}
                                        </h3>
                                        <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                                          {displayUser?.email}
                                        </p>
                                        <div className="flex items-center gap-1 mt-1">
                                          <div className={`w-1.5 h-1.5 rounded-full ${getRoleBadgeColor(userRole())}`} />
                                          <span className="text-[10px] text-gray-500">
                                            {userRole()}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <Link
                                      href="/users/profile"
                                      onClick={() => setIsProfileOpen(false)}
                                      className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 hover:border-red-500/30 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-medium text-white transition-all"
                                    >
                                      View Profile
                                      <FaArrowRight className="text-[10px] sm:text-xs" />
                                    </Link>
                                  </div>

                                  <div className="p-2">
                                    {[
                                      { icon: FaChartLine, label: 'Analytics', href: '/users/analytics' },
                                      { icon: FaMoneyBillWave, label: 'Earnings', href: '/users/payout' },
                                      { icon: FaBookOpen, label: 'My Courses', href: '/users/my-courses' },
                                      { icon: FaCog, label: 'Settings', href: '/users/settings' },
                                      { icon: FaQuestionCircle, label: 'Help', href: '/help' },
                                    ].map((item) => (
                                      <Link
                                        key={item.label}
                                        href={item.href}
                                        onClick={() => setIsProfileOpen(false)}
                                        className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg sm:rounded-xl hover:bg-gray-800/50 transition-all group"
                                      >
                                        <item.icon className="text-xs sm:text-sm text-gray-400 group-hover:text-red-400 transition-colors" />
                                        <span className="text-xs sm:text-sm text-white">{item.label}</span>
                                      </Link>
                                    ))}
                                  </div>

                                  <div className="p-2 border-t border-gray-800">
                                    <button
                                      onClick={() => {
                                        setIsProfileOpen(false);
                                        handleLogout();
                                      }}
                                      className="flex items-center gap-2 sm:gap-3 w-full px-2 sm:px-3 py-2 rounded-lg sm:rounded-xl hover:bg-red-600/10 transition-all group"
                                    >
                                      <FaSignOutAlt className="text-xs sm:text-sm text-gray-400 group-hover:text-red-400 transition-colors" />
                                      <span className="text-xs sm:text-sm text-white">Sign out</span>
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Guest Profile Icon */}
                      <div className="relative dropdown-container">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setIsProfileOpen(!isProfileOpen)}
                          className="relative p-2.5 rounded-xl text-gray-400 hover:text-white transition-colors"
                        >
                          <div className="absolute inset-0 bg-gray-900/30 hover:bg-gray-900/50 backdrop-blur-sm rounded-xl transition-all" />
                          <div className="absolute inset-0 border border-gray-700/30 hover:border-gray-600/50 rounded-xl transition-all" />
                          <FaUserCircle className="w-5 h-5 relative z-10" />
                        </motion.button>

                        <AnimatePresence>
                          {isProfileOpen && !isPublicCoursesRoute && (
                            <LockedProfileDropdown onClose={() => setIsProfileOpen(false)} />
                          )}
                        </AnimatePresence>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="flex md:hidden items-center justify-between gap-2">
                <Link href={displayUser ? "/users/dashboard" : "/"} className="flex items-center gap-2">
                  <div className="relative w-7 h-7 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-800 rounded-lg shadow-lg shadow-red-500/30" />
                    <div className="relative z-10 text-white font-bold text-[10px]">VS</div>
                  </div>
                </Link>

                <motion.button
                  onClick={() => setIsCommandOpen(true)}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 max-w-[200px] sm:max-w-xs mx-auto relative rounded-lg overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 to-black/70 backdrop-blur-sm" />
                  <div className="absolute inset-0 border border-red-500/20 rounded-lg" />
                  
                  <div className="relative flex items-center gap-2 px-3 py-2">
                    <FaSearch className="text-gray-500 text-xs flex-shrink-0" />
                    <span className="flex-1 text-left text-xs text-gray-500 truncate">
                      Search...
                    </span>
                    {!displayUser && !isPublicCoursesRoute && <FaLock className="text-gray-600 text-[10px]" />}
                  </div>
                </motion.button>

                <div className="relative dropdown-container">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setIsProfileOpen(!isProfileOpen);
                      setIsNotificationsOpen(false);
                    }}
                    className="relative p-0.5 rounded-lg overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm rounded-lg" />
                    {displayUser ? (
                      <div className="relative w-7 h-7 rounded-full border-2 border-red-500/50 overflow-hidden bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                        <ProfileAvatar
                          customImage={displayUser?.img}
                          avatar={primaryAvatar}
                          userId={displayUser?.id || 'default'}
                          size={28}
                        />
                      </div>
                    ) : (
                      <FaUserCircle className="w-7 h-7 text-gray-400" />
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      displayUser ? (
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
                            style={{ top: '60px' }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/98 to-black/98 backdrop-blur-2xl" />
                            <div className="absolute inset-0 border border-red-500/20 rounded-xl" />
                            
                            <div className="relative">
                              <div className="p-3 border-b border-gray-800">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-10 h-10 rounded-full border-2 border-red-500/50 overflow-hidden bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center flex-shrink-0">
                                    <ProfileAvatar
                                      customImage={displayUser?.img}
                                      avatar={primaryAvatar}
                                      userId={displayUser?.id || 'default'}
                                      size={40}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-xs font-bold text-white truncate">
                                      {displayUser?.name || displayUser?.username}
                                    </h3>
                                    <p className="text-[10px] text-gray-400 truncate">
                                      {displayUser?.email}
                                    </p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <div className={`w-1.5 h-1.5 rounded-full ${getRoleBadgeColor(userRole())}`} />
                                      <span className="text-[9px] text-gray-500">
                                        {userRole()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <Link
                                  href="/users/profile"
                                  onClick={() => setIsProfileOpen(false)}
                                  className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-red-600/10 border border-red-500/20 rounded-lg text-[10px] font-medium text-white"
                                >
                                  View Profile
                                  <FaArrowRight className="text-[10px]" />
                                </Link>
                              </div>

                              <div className="p-2">
                                {[
                                  { icon: FaHome, label: 'Home', href: '/users/dashboard' },
                                  { icon: FaBookOpen, label: 'My Courses', href: '/users/my-courses' },
                                  { icon: FaChartLine, label: 'Analytics', href: '/users/analytics' },
                                  { icon: FaMoneyBillWave, label: 'Earnings', href: '/users/payout' },
                                  { icon: FaBell, label: 'Notifications', href: '#', badge: unreadCount },
                                  { icon: FaCog, label: 'Settings', href: '/users/settings' },
                                ].map((item) => (
                                  <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={() => setIsProfileOpen(false)}
                                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-gray-800/50 transition-all group"
                                  >
                                    <div className="flex items-center gap-2">
                                      <item.icon className="text-xs text-gray-400 group-hover:text-red-400 transition-colors" />
                                      <span className="text-xs text-white">{item.label}</span>
                                    </div>
                                    {item.badge && item.badge > 0 && (
                                      <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">
                                        {item.badge}
                                      </span>
                                    )}
                                  </Link>
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
                                  <span className="text-xs text-white">Sign out</span>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        </>
                      ) : (
                        !isPublicCoursesRoute && (
                          <>
                            <div 
                              className="fixed inset-0 z-[100000]" 
                              onClick={() => setIsProfileOpen(false)}
                            />
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="fixed right-2 left-2 mt-2 mx-auto w-[calc(100vw-1rem)] max-w-xs rounded-xl overflow-hidden shadow-2xl z-[100001]"
                              style={{ top: '60px' }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-gray-900/98 to-black/98 backdrop-blur-2xl" />
                              <div className="absolute inset-0 border border-red-500/20 rounded-xl" />
                              
                              <div className="relative p-6 text-center">
                                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-600/20 to-red-800/20 border-2 border-red-500/30 flex items-center justify-center">
                                  <FaLock className="text-2xl text-red-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Welcome to Verseandme</h3>
                                <p className="text-sm text-gray-400 mb-4">
                                  Sign in to access your profile and courses
                                </p>
                                <Link
                                  href="/auth/signin"
                                  className="block w-full px-4 py-2.5 mb-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:scale-105 transition-transform text-sm"
                                >
                                  Sign In
                                </Link>
                                <Link
                                  href="/auth/signup"
                                  className="block w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors text-sm"
                                >
                                  Create Account
                                </Link>
                              </div>
                            </motion.div>
                          </>
                        )
                      )
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Command Palette */}
      <AnimatePresence>
        {isCommandOpen && (
          (displayUser || isPublicCoursesRoute) ? (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCommandOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200000]"
              />

              <div className="fixed inset-0 z-[200001] flex items-start justify-center pt-[10vh] px-4">
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="w-full max-w-2xl rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900/98 to-black/98 backdrop-blur-3xl" />
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent" />
                  <div className="absolute inset-0 border border-red-500/30 rounded-xl sm:rounded-2xl" />

                  <div className="relative">
                    <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-800/50">
                      <FaSearch className="text-gray-400 text-base sm:text-lg flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="Type a command or search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-gray-500 outline-none"
                      />
                      <kbd className="hidden sm:block px-2 py-1 bg-gray-800/50 border border-gray-700/50 rounded text-xs text-gray-400 font-mono">
                        ESC
                      </kbd>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                      {filteredCommands.length > 0 ? (
                        filteredCommands.map((category) => (
                          <div key={category.category} className="py-2 sm:py-3">
                            <div className="px-4 sm:px-6 py-1.5 sm:py-2">
                              <h3 className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {category.category}
                              </h3>
                            </div>
                            <div>
                              {category.items.map((item, index) => (
                                <Link
                                  key={index}
                                  href={item.href}
                                  onClick={() => {
                                    setIsCommandOpen(false);
                                    setSearchQuery("");
                                  }}
                                  className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-2.5 sm:py-3 hover:bg-gradient-to-r hover:from-red-600/10 hover:to-transparent transition-all group"
                                >
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gray-900/50 border border-gray-800 flex items-center justify-center group-hover:border-red-500/30 transition-all flex-shrink-0">
                                    <item.icon className={`text-sm sm:text-lg ${item.color || 'text-gray-400'} group-hover:scale-110 transition-transform`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs sm:text-sm font-medium text-white group-hover:text-red-400 transition-colors truncate">
                                      {item.label}
                                    </div>
                                    {item.subtext && (
                                      <div className="text-[10px] sm:text-xs text-gray-500 truncate">{item.subtext}</div>
                                    )}
                                  </div>
                                  {item.shortcut && (
                                    <kbd className="hidden sm:block px-2 py-1 bg-gray-800/50 border border-gray-700/50 rounded text-xs text-gray-400 font-mono flex-shrink-0">
                                      {item.shortcut}
                                    </kbd>
                                  )}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-12 sm:py-16 text-center">
                          <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🔍</div>
                          <p className="text-xs sm:text-sm text-gray-400">No results found</p>
                        </div>
                      )}
                    </div>

                    <div className="px-4 sm:px-6 py-2 sm:py-3 border-t border-gray-800/50 flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-500">
                        <div className="hidden sm:flex items-center gap-1">
                          <kbd className="px-1.5 py-0.5 bg-gray-800/50 border border-gray-700/50 rounded text-[10px] font-mono">↑↓</kbd>
                          <span>Navigate</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <kbd className="px-1.5 py-0.5 bg-gray-800/50 border border-gray-700/50 rounded text-[10px] font-mono">↵</kbd>
                          <span>Select</span>
                        </div>
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500">
                        Verseandme
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          ) : (
            <LockedCommandPalette onClose={() => setIsCommandOpen(false)} />
          )
        )}
      </AnimatePresence>
    </>
  );
};

export default CommandHeader;