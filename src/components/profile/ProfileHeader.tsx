//Volumes/vision/codes/course/my-app/src/components/profile/ProfileHeader.tsx
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserFriends,
  FaEdit,
  FaMapMarkerAlt,
  FaGlobe,
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaGraduationCap,
  FaUserGraduate,
  FaUserTie,
  FaCheckCircle,
  FaShareAlt,
  FaCog,
  FaEllipsisV,
} from "react-icons/fa";
import BadgeDisplay from "./BadgeDisplay";
import { User } from "@/components/profile/data/mockProfileData";
import { useRouter } from "next/navigation";
import RoleChangeModal from "./RoleChangeModal";
import BioEditModal from "./BioEditModal";
import AvatarGenerator from "@/components/settings/AvatarGenerator";

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "JP", name: "Japan" },
  { code: "CN", name: "China" },
  { code: "KR", name: "South Korea" },
  { code: "RU", name: "Russia" },
];

interface ProfileHeaderProps {
  user: User;
  isOwnProfile: boolean;
}

export default function ProfileHeader({
  user,
  isOwnProfile,
}: ProfileHeaderProps) {
  const router = useRouter();
  const [localUser, setLocalUser] = useState<User>(user);
  const [isFollowing, setIsFollowing] = useState(
    localUser.isFollowing || false
  );
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showBioModal, setShowBioModal] = useState(false);
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [roleChangeError, setRoleChangeError] = useState<string | null>(null);

  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  // WebSocket connection for real-time follow updates
  useEffect(() => {
    if (typeof window === "undefined" || !localUser?.id) return;

    const ws = new WebSocket(
      process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001"
    );
    (window as any).profileWs = ws;

    ws.onopen = () => {
      console.log("✅ Profile header WebSocket connected");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.event === "follow:new") {
        if (data.data.targetUserId === localUser.id) {
          setLocalUser((prev: User) => ({
            ...prev,
            seekers: prev.seekers + 1,
          }));
        }
      }

      if (data.event === "follow:removed") {
        if (data.data.targetUserId === localUser.id) {
          setLocalUser((prev: User) => ({
            ...prev,
            seekers: Math.max(0, prev.seekers - 1),
          }));
        }
      }
    };

    return () => {
      ws.close();
      delete (window as any).profileWs;
    };
  }, [localUser?.id]);

  const handleFollow = async () => {
    if (isFollowLoading) return;

    setIsFollowLoading(true);
    const previousState = isFollowing;

    setIsFollowing(!isFollowing);

    try {
      const response = await fetch(`/api/follow/${localUser.id}`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setIsFollowing(data.action === "followed");

      if (typeof window !== "undefined" && (window as any).profileWs) {
        const eventType =
          data.action === "followed" ? "follow:new" : "follow:removed";
        (window as any).profileWs.send(
          JSON.stringify({
            event: eventType,
            data: { targetUserId: localUser.id },
          })
        );
      }
    } catch (error) {
      setIsFollowing(previousState);
      console.error("Failed to toggle follow:", error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/users/profile/${localUser.username}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getUserTypeIcon = () => {
    switch (localUser.type) {
      case "tutor":
        return (
          <FaChalkboardTeacher className="text-[9px] sm:text-[10px] md:text-base lg:text-lg" />
        );
      case "learner":
        return (
          <FaGraduationCap className="text-[9px] sm:text-[10px] md:text-base lg:text-lg" />
        );
      case "both":
        return (
          <FaUserGraduate className="text-[9px] sm:text-[10px] md:text-base lg:text-lg" />
        );
      default:
        return (
          <FaUserTie className="text-[9px] sm:text-[10px] md:text-base lg:text-lg" />
        );
    }
  };

  const getUserTypeColor = () => {
    switch (localUser.type) {
      case "tutor":
        return "from-purple-600 to-purple-800";
      case "learner":
        return "from-blue-600 to-blue-800";
      case "both":
        return "from-red-600 to-red-800";
      default:
        return "from-gray-600 to-gray-800";
    }
  };

  const getUserTypeLabel = () => {
    switch (localUser.type) {
      case "tutor":
        return "Expert Tutor";
      case "learner":
        return "Active Learner";
      case "both":
        return "Tutor & Learner";
      default:
        return "Member";
    }
  };

  const handleRoleChange = async (newRole: "learn" | "teach" | "both") => {
    setIsChangingRole(true);
    setRoleChangeError(null);

    try {
      const response = await fetch("/api/profile/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "change_role",
          newRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change role");
      }

      alert(data.message);
      window.location.reload();
    } catch (error: any) {
      setRoleChangeError(error.message);
    } finally {
      setIsChangingRole(false);
    }
  };

  const handleBioUpdate = async (
    bio: string,
    country?: string,
    location?: string,
    website?: string
  ) => {
    try {
      const response = await fetch("/api/profile/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "update_bio",
          bio,
          country,
          location,
          website,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update bio");
      }

      if (typeof window !== "undefined" && (window as any).profileWs) {
        (window as any).profileWs.send(
          JSON.stringify({
            event: "profile:updated",
            data: { userId: user.id },
          })
        );
      }

      window.location.reload();
    } catch (error) {
      console.error("Failed to update bio:", error);
      alert("Failed to update bio");
    }
  };

  // ✅ FIXED: Helper function to render avatar with proper circular fitting
const renderAvatar = (size: number, className: string = "") => {
  // Priority 1: Custom uploaded image
  if (localUser.avatarObject?.isCustomUpload && localUser.avatarObject?.customImageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <img
          src={localUser.avatarObject.customImageUrl}
          alt={localUser.name}
          className={`w-full h-full rounded-full object-cover ${className}`}
          style={{ objectPosition: "center" }}
        />
      </div>
    );
  }

  // Priority 2: Generated avatar (only if avatarIndex is valid)
  if (localUser.avatarObject && 
      localUser.avatarObject.avatarIndex !== undefined && 
      localUser.avatarObject.avatarIndex >= 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <AvatarGenerator
          userId={localUser.id}
          avatarIndex={localUser.avatarObject.avatarIndex}
          size={size}
          style={localUser.avatarObject.avatarStyle as "avataaars"}
          className={className}
        />
      </div>
    );
  }

  // Priority 3: Default avatar (RED user icon on WHITE background)
  return (
    <div className="w-full h-full flex items-center justify-center">
      <AvatarGenerator
        userId={localUser.id}
        avatarIndex={-1}
        size={size}
        useDefault={true}
        className={className}
      />
    </div>
  );
};

  return (
    <motion.div
      className="relative mb-3 sm:mb-4 md:mb-6 lg:mb-8 xl:mb-10"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Cover Image */}
      {localUser.coverImage && (
        <div className="relative h-16 xs:h-20 sm:h-24 md:h-48 lg:h-56 xl:h-64 2xl:h-72 rounded-t-md xs:rounded-t-lg sm:rounded-t-xl md:rounded-t-2xl lg:rounded-t-3xl overflow-hidden">
          <img
            src={localUser.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black" />

          {isOwnProfile && (
            <motion.button
              className="absolute top-1 right-1 xs:top-1.5 xs:right-1.5 sm:top-2 sm:right-2 md:top-4 md:right-4 px-1.5 py-0.5 xs:px-2 xs:py-1 sm:px-2.5 sm:py-1.5 md:px-4 md:py-2 bg-black/60 border border-white/20 rounded xs:rounded-md sm:rounded-lg md:rounded-xl text-white text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-semibold flex items-center gap-0.5 xs:gap-1 sm:gap-1.5"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaEdit className="text-[8px] xs:text-[9px] sm:text-xs" />
              <span className="hidden xs:inline">Edit</span>
            </motion.button>
          )}
        </div>
      )}

      <div
        className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-md xs:rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl border border-red-500/30"
        style={{ top: localUser.coverImage ? "64px" : "0" }}
      />

      <div
        className="relative p-1.5 xs:p-2 sm:p-3 md:p-5 lg:p-6 xl:p-8"
        style={{ paddingTop: localUser.coverImage ? "6px" : "12px" }}
      >
        {/* ==================== MOBILE LAYOUT (< md) ==================== */}
        <div className="block md:hidden">
          {/* Top-Right Action Buttons - Mobile Only */}
          <div className="absolute top-1.5 xs:top-2 sm:top-3 right-1.5 xs:right-2 sm:right-3 flex items-center gap-1 xs:gap-1.5 z-10">
            {isOwnProfile && (
              <>
                <motion.button
                  onClick={() => setShowBioModal(true)}
                  className="px-1.5 xs:px-2 py-1 xs:py-1.5 rounded xs:rounded-md font-bold text-[9px] xs:text-[10px] sm:text-xs bg-blue-600/90 hover:bg-blue-600 text-white border border-blue-500/30 flex items-center justify-center shadow-lg backdrop-blur-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Edit Bio"
                >
                  <FaEdit className="text-[10px] xs:text-xs" />
                </motion.button>

                <motion.button
                  onClick={() => setShowRoleModal(true)}
                  className="px-1.5 xs:px-2 py-1 xs:py-1.5 rounded xs:rounded-md font-bold text-[9px] xs:text-[10px] sm:text-xs bg-gray-800/90 hover:bg-gray-800 text-gray-300 border border-red-500/30 flex items-center justify-center shadow-lg backdrop-blur-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Settings"
                >
                  <FaCog className="text-[10px] xs:text-xs" />
                </motion.button>
              </>
            )}

            <div className="relative">
              <motion.button
                onClick={() => setShowMenu(!showMenu)}
                className="px-1.5 xs:px-2 py-1 xs:py-1.5 rounded xs:rounded-md font-bold text-[9px] xs:text-[10px] sm:text-xs bg-gray-800/90 hover:bg-gray-800 text-gray-300 border border-red-500/30 flex items-center justify-center shadow-lg backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="More Options"
              >
                <FaEllipsisV className="text-[10px] xs:text-xs" />
              </motion.button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-1 w-32 xs:w-36 bg-black border border-red-500/30 rounded-md xs:rounded-lg shadow-2xl overflow-hidden z-50"
                  >
                    <button
                      onClick={handleShare}
                      className="w-full px-2 xs:px-3 py-1.5 xs:py-2 text-left text-[9px] xs:text-[10px] sm:text-xs text-gray-300 hover:bg-red-600/20 transition-colors flex items-center gap-1.5 xs:gap-2"
                    >
                      <FaShareAlt className="text-red-500 text-[10px] xs:text-xs" />
                      Share Profile
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Avatar + Basic Info */}
          <div
            className="flex gap-2 xs:gap-2.5 sm:gap-3 mb-1.5 xs:mb-2 sm:mb-2.5"
            style={{ marginTop: localUser.coverImage ? "-28px" : "0" }}
          >
            {/* ✅ FIXED: Avatar Circle with rounded-full container */}
            <div className="relative flex-shrink-0">
              <div className="relative w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20">
                {/* XP Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="48%"
                    fill="none"
                    stroke="rgba(239, 68, 68, 0.2)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="48%"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeDasharray={`${(localUser.xp % 1000) / 10} 100`}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dasharray 1s ease" }}
                  />
                </svg>

                {/* ✅ FIXED: Reduced inset from inset-1/inset-1.5 to inset-0.5 for bigger avatar */}
                <div className="absolute inset-0.5 rounded-full overflow-hidden border-2 border-black shadow-2xl bg-black flex items-center justify-center">
                  {renderAvatar(80)}
                </div>

                {/* Top Badge */}
                {localUser.badges[0] && (
                  <motion.div
                    className={`absolute -top-0.5 -right-0.5 w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 rounded xs:rounded-md bg-gradient-to-br ${localUser.badges[0].color} border border-black flex items-center justify-center text-[10px] xs:text-xs sm:text-sm shadow-xl`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    {localUser.badges[0].icon}
                  </motion.div>
                )}

                {/* User Type Badge */}
                <motion.div
                  className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 px-1 py-0.5 rounded-sm bg-gradient-to-r ${getUserTypeColor()} border border-black shadow-xl`}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {getUserTypeIcon()}
                </motion.div>
              </div>
            </div>

            {/* Name + Username + XP */}
            <div className="flex-1 min-w-0">
              {/* Name + Verification */}
              <div className="flex items-center gap-1 mb-0.5 xs:mb-1">
                <h1 className="text-sm xs:text-base sm:text-lg font-black text-white truncate">
                  {localUser.name}
                </h1>
                {localUser.badges.some((b) => b.id === "verified-expert") && (
                  <FaCheckCircle className="text-[10px] xs:text-xs sm:text-sm text-green-500 flex-shrink-0" />
                )}
              </div>

              {/* Username */}
              <p className="text-gray-400 text-[9px] xs:text-[10px] sm:text-xs mb-1 xs:mb-1.5">
                @{localUser.username}
              </p>

              {/* XP + User Type */}
              <div className="flex items-center gap-1.5 xs:gap-2 flex-wrap">
                {/* XP Display */}
                <motion.div
                  className="inline-flex items-baseline gap-0.5 xs:gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <span className="text-base xs:text-lg sm:text-xl font-black text-red-400">
                    {localUser.xp.toLocaleString()}
                  </span>
                  <span className="text-[7px] xs:text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase">
                    XP
                  </span>
                </motion.div>

                {/* User Type Label */}
                <div
                  className={`inline-flex items-center gap-0.5 xs:gap-1 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded xs:rounded-md bg-gradient-to-r ${getUserTypeColor()} border border-white/20 shadow-lg`}
                >
                  {getUserTypeIcon()}
                  <span className="text-[7px] xs:text-[8px] sm:text-[9px] font-bold text-white uppercase tracking-wide whitespace-nowrap">
                    {getUserTypeLabel()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Date Joined - Mobile */}
          <motion.div
            className="flex items-center gap-1 mb-2 xs:mb-2.5 sm:mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <FaCalendarAlt className="text-red-500 text-[8px] xs:text-[9px] sm:text-[10px] flex-shrink-0" />
            <span className="text-gray-400 text-[8px] xs:text-[9px] sm:text-[10px]">
              Joined{" "}
              {new Date(localUser.dateJoined).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </span>
          </motion.div>

          {/* Bio - Mobile */}
          {localUser.bio && (
            <motion.div
              className="mb-2 xs:mb-2.5 sm:mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-gray-300 text-[9px] xs:text-[10px] sm:text-xs leading-relaxed">
                {localUser.bio}
              </p>
            </motion.div>
          )}

          {/* Meta Information - Mobile (Country, Location, Website only) */}
          {(localUser.country || localUser.location || localUser.website) && (
            <div className="mb-2 xs:mb-2.5 sm:mb-3">
              <div className="flex flex-wrap items-center gap-2 xs:gap-2.5 sm:gap-3 text-[8px] xs:text-[9px] sm:text-[10px] text-gray-400">
                {/* Country */}
                {localUser.country && (
                  <div className="flex items-center gap-1">
                    <FaGlobe className="text-red-500 flex-shrink-0" />
                    <span className="truncate max-w-[120px]">
                      {COUNTRIES.find((c) => c.code === localUser.country)
                        ?.name || localUser.country}
                    </span>
                  </div>
                )}

                {/* Location */}
                {localUser.location && (
                  <div className="flex items-center gap-1">
                    <FaMapMarkerAlt className="text-red-500 flex-shrink-0" />
                    <span className="truncate max-w-[120px]">
                      {localUser.location}
                    </span>
                  </div>
                )}

                {/* Website */}
                {localUser.website && (
                  <a
                    href={`https://${localUser.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-red-400 transition-colors"
                  >
                    <FaGlobe className="text-red-500 flex-shrink-0" />
                    <span className="truncate max-w-[120px]">
                      {localUser.website}
                    </span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Follow/Share Buttons */}
          {!isOwnProfile && (
            <div className="flex gap-2 xs:gap-2.5 mb-2 xs:mb-2.5 sm:mb-3">
              <motion.button
                onClick={handleFollow}
                disabled={isFollowLoading}
                className={`flex-1 px-3 xs:px-4 py-1.5 xs:py-2 rounded xs:rounded-md font-bold text-[10px] xs:text-xs sm:text-sm transition-all flex items-center justify-center gap-1 xs:gap-1.5 ${
                  isFollowing
                    ? "bg-gray-800/80 text-gray-300 border border-red-500/30"
                    : "bg-gradient-to-r from-red-600 to-red-700 text-white"
                } ${isFollowLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                whileHover={isFollowLoading ? {} : { scale: 1.02 }}
                whileTap={isFollowLoading ? {} : { scale: 0.98 }}
              >
                {isFollowLoading ? (
                  <motion.div
                    className="w-3 h-3 xs:w-3.5 xs:h-3.5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                ) : (
                  <>
                    {isFollowing && <FaCheckCircle />}
                    <span>{isFollowing ? "Following" : "Follow"}</span>
                  </>
                )}
              </motion.button>

              <motion.button
                onClick={handleShare}
                className="px-3 xs:px-4 py-1.5 xs:py-2 rounded xs:rounded-md font-bold text-[10px] xs:text-xs sm:text-sm bg-gray-800/80 text-gray-300 border border-red-500/30 flex items-center justify-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaShareAlt />
              </motion.button>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-1 xs:gap-1.5 sm:gap-2 mb-1.5 xs:mb-2">
            <MobileStatCard
              icon={FaUserFriends}
              label="Seekers"
              value={localUser.seekers.toLocaleString()}
              color="from-red-600 to-red-700"
              delay={0.1}
            />
            <MobileStatCard
              icon={FaUserFriends}
              label="Seeking"
              value={localUser.seeking.toLocaleString()}
              color="from-red-600 to-red-700"
              delay={0.2}
            />
            <MobileStatCard
              icon={FaChalkboardTeacher}
              label="Courses"
              value={localUser.coursesMade.toString()}
              color="from-purple-600 to-purple-700"
              delay={0.3}
            />
            <MobileStatCard
              icon={FaGraduationCap}
              label="Learning"
              value={localUser.coursesLearning.toString()}
              color="from-blue-600 to-blue-700"
              delay={0.4}
            />
          </div>

          {/* Badges */}
          <div className="scale-90 xs:scale-95 sm:scale-100 origin-top">
            <BadgeDisplay badges={localUser.badges} />
          </div>
        </div>

        {/* ==================== DESKTOP LAYOUT (>= md) ==================== */}
        <div className="hidden md:flex flex-col md:flex-row gap-4 md:gap-6 lg:gap-8">
          {/* Avatar Section */}
          <div
            className="relative flex-shrink-0"
            style={{ marginTop: localUser.coverImage ? "-50px" : "0" }}
          >
            <div className="relative w-32 h-32 lg:w-36 lg:h-36 xl:w-40 xl:h-40">
              {/* XP Ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="48%"
                  fill="none"
                  stroke="rgba(239, 68, 68, 0.2)"
                  strokeWidth="4"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="48%"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="4"
                  strokeDasharray={`${(localUser.xp % 1000) / 10} 100`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dasharray 1s ease" }}
                />
              </svg>

              {/* ✅ FIXED: Reduced inset from inset-3 to inset-1 for bigger avatar */}
              <div className="absolute inset-1 rounded-full overflow-hidden border-4 border-black shadow-2xl bg-black flex items-center justify-center">
                {renderAvatar(160)}
              </div>

              {/* Top Badge */}
              {localUser.badges[0] && (
                <motion.div
                  className={`absolute -top-2 -right-2 w-14 h-14 rounded-xl bg-gradient-to-br ${localUser.badges[0].color} border-3 border-black flex items-center justify-center text-3xl shadow-xl`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  whileHover={{ scale: 1.1 }}
                >
                  {localUser.badges[0].icon}
                </motion.div>
              )}

              {/* User Type Badge on Avatar */}
              <motion.div
                className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${getUserTypeColor()} border-2 border-black shadow-xl`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-1.5">
                  {getUserTypeIcon()}
                </div>
              </motion.div>
            </div>

            {/* XP Display */}
            <motion.div
              className="mt-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="text-4xl font-black text-red-400">
                {localUser.xp.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400 font-bold uppercase tracking-wider mt-1">
                XP Points
              </div>

              {/* Level Progress */}
              <div className="mt-2 px-3">
                <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                  <span>Level {Math.floor(localUser.xp / 1000)}</span>
                  <span>Level {Math.floor(localUser.xp / 1000) + 1}</span>
                </div>
                <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-red-500/20">
                  <motion.div
                    className="h-full bg-gradient-to-r from-red-600 to-red-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(localUser.xp % 1000) / 10}%` }}
                    transition={{ duration: 1, delay: 0.6 }}
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-black text-white truncate">
                    {localUser.name}
                  </h1>
                  {localUser.badges.some((b) => b.id === "verified-expert") && (
                    <FaCheckCircle className="text-xl text-green-500 flex-shrink-0" />
                  )}
                </div>

                <p className="text-gray-400 text-base mb-3">
                  @{localUser.username}
                </p>

                {/* User Type Badge */}
                <div
                  className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-gradient-to-r ${getUserTypeColor()} border border-white/20 shadow-lg`}
                >
                  {getUserTypeIcon()}
                  <span className="text-sm font-bold text-white uppercase tracking-wide">
                    {getUserTypeLabel()}
                  </span>
                </div>

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-400">
                  {localUser.location && (
                    <div className="flex items-center gap-1.5">
                      <FaMapMarkerAlt className="text-red-500 flex-shrink-0" />
                      <span className="truncate">{localUser.location}</span>
                    </div>
                  )}
                  {localUser.website && (
                    <a
                      href={`https://${localUser.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 hover:text-red-400 transition-colors truncate"
                    >
                      <FaGlobe className="text-red-500 flex-shrink-0" />
                      <span className="truncate">{localUser.website}</span>
                    </a>
                  )}
                  <div className="flex items-center gap-1.5">
                    <FaCalendarAlt className="text-red-500 flex-shrink-0" />
                    <span>
                      Joined{" "}
                      {new Date(localUser.dateJoined).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                {!isOwnProfile ? (
                  <>
                    <motion.button
                      onClick={handleFollow}
                      disabled={isFollowLoading}
                      className={`px-6 py-3 rounded-xl font-bold text-base transition-all flex items-center gap-2 ${
                        isFollowing
                          ? "bg-gray-800/80 text-gray-300 border border-red-500/30 hover:bg-gray-800"
                          : "bg-gradient-to-r from-red-600 to-red-700 text-white"
                      } ${
                        isFollowLoading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      whileHover={isFollowLoading ? {} : { scale: 1.05 }}
                      whileTap={isFollowLoading ? {} : { scale: 0.95 }}
                    >
                      {isFollowLoading ? (
                        <>
                          <motion.div
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          />
                          <span>
                            {isFollowing ? "Unfollowing..." : "Following..."}
                          </span>
                        </>
                      ) : (
                        <>
                          {isFollowing ? (
                            <>
                              <FaCheckCircle className="text-sm" />
                              <span>Following</span>
                            </>
                          ) : (
                            "Follow"
                          )}
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      onClick={handleShare}
                      className="px-4 py-3 rounded-xl font-bold text-base bg-gray-800/80 text-gray-300 border border-red-500/30 hover:bg-gray-800 transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaShareAlt />
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.button
                      onClick={() => setShowBioModal(true)}
                      className="px-5 py-3 rounded-xl font-bold text-base bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaEdit className="text-sm" />
                      <span className="hidden lg:inline">Edit Bio</span>
                    </motion.button>

                    <motion.button
                      onClick={() => setShowRoleModal(true)}
                      className="px-4 py-3 rounded-xl font-bold text-base bg-gray-800/80 text-gray-300 border border-red-500/30"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="hidden xl:inline">Change Role</span>
                      <FaCog className="xl:hidden" />
                    </motion.button>
                  </>
                )}

                <div className="relative">
                  <motion.button
                    onClick={() => setShowMenu(!showMenu)}
                    className="px-3 py-3 rounded-xl font-bold text-base bg-gray-800/80 text-gray-300 border border-red-500/30"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaEllipsisV />
                  </motion.button>

                  <AnimatePresence>
                    {showMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-black border border-red-500/30 rounded-xl shadow-2xl overflow-hidden z-50"
                      >
                        <button
                          onClick={handleShare}
                          className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-red-600/20 transition-colors flex items-center gap-3"
                        >
                          <FaShareAlt className="text-red-500" />
                          Share Profile
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Bio */}
            {localUser.bio && (
              <motion.p
                className="text-gray-300 text-base mb-5 line-clamp-2 leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {localUser.bio}
              </motion.p>
            )}

            {/* Country Display */}
            {localUser.country && (
              <motion.div
                className="flex items-center gap-2 mb-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
              >
                <FaGlobe className="text-red-500 text-sm" />
                <span className="text-gray-300 text-sm">
                  {COUNTRIES.find((c) => c.code === localUser.country)?.name ||
                    localUser.country}
                </span>
              </motion.div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              <StatCard
                icon={FaUserFriends}
                label="Seekers"
                value={localUser.seekers.toLocaleString()}
                color="from-red-600 to-red-700"
                delay={0.1}
              />
              <StatCard
                icon={FaUserFriends}
                label="Seeking"
                value={localUser.seeking.toLocaleString()}
                color="from-red-600 to-red-700"
                delay={0.2}
              />
              <StatCard
                icon={FaChalkboardTeacher}
                label="Courses Made"
                value={localUser.coursesMade.toString()}
                color="from-purple-600 to-purple-700"
                delay={0.3}
              />
              <StatCard
                icon={FaGraduationCap}
                label="Learning"
                value={localUser.coursesLearning.toString()}
                color="from-blue-600 to-blue-700"
                delay={0.4}
              />
            </div>

            {/* Badges */}
            <BadgeDisplay badges={localUser.badges} />
          </div>
        </div>
      </div>

      {/* Share Success Message */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-3 xs:bottom-4 sm:bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-green-600 text-white px-3 py-1.5 xs:px-4 xs:py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-md xs:rounded-lg sm:rounded-xl shadow-2xl flex items-center gap-1.5 xs:gap-2 sm:gap-3">
              <FaCheckCircle className="text-xs xs:text-sm sm:text-base" />
              <span className="font-semibold text-[10px] xs:text-xs sm:text-sm md:text-base">
                Profile link copied!
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <RoleChangeModal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setRoleChangeError(null);
        }}
        currentRole={
          localUser.type === "tutor"
            ? "teach"
            : localUser.type === "learner"
            ? "learn"
            : "both"
        }
        onChangeRole={handleRoleChange}
        isLoading={isChangingRole}
        error={roleChangeError}
      />

      <BioEditModal
        isOpen={showBioModal}
        onClose={() => setShowBioModal(false)}
        currentBio={localUser.bio || ""}
        currentCountry={localUser.country || ""}
        currentLocation={localUser.location}
        currentWebsite={localUser.website}
        onSave={handleBioUpdate}
      />
    </motion.div>
  );
}

// Mobile StatCard Component
interface MobileStatCardProps {
  icon: any;
  label: string;
  value: string;
  color: string;
  delay: number;
}

function MobileStatCard({
  icon: Icon,
  label,
  value,
  color,
  delay,
}: MobileStatCardProps) {
  return (
    <motion.div
      className="relative group cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.03 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-black/90 rounded xs:rounded-md border border-red-500/20" />

      <div className="relative p-1.5 xs:p-2">
        <Icon className="text-red-500 text-[10px] xs:text-xs sm:text-sm mb-0.5" />
        <div className="text-xs xs:text-sm sm:text-base font-black text-white leading-none mb-0.5">
          {value}
        </div>
        <div className="text-[7px] xs:text-[8px] sm:text-[9px] text-gray-400 font-semibold uppercase tracking-wide leading-tight">
          {label}
        </div>
      </div>
    </motion.div>
  );
}

// Desktop StatCard Component
interface StatCardProps {
  icon: any;
  label: string;
  value: string;
  color: string;
  delay: number;
}

function StatCard({ icon: Icon, label, value, color, delay }: StatCardProps) {
  return (
    <motion.div
      className="relative group cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.05, y: -5 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-black/90 rounded-lg md:rounded-xl border border-red-500/20" />

      <div className="relative p-2.5 sm:p-3 md:p-4 lg:p-5">
        <Icon className="text-red-500 text-base sm:text-lg md:text-xl lg:text-2xl mb-1 sm:mb-1.5 md:mb-2" />
        <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-white mb-0.5 sm:mb-1">
          {value}
        </div>
        <div className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-gray-400 font-semibold uppercase tracking-wide">
          {label}
        </div>
      </div>
    </motion.div>
  );
}
