// components/ChatSubComponents.tsx
"use client";

import React, {
  useState,
  useRef,
  useEffect,
  memo,
  useMemo,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from 'js-cookie';
import {
  FaClock,
  FaPlay,
  FaCheckCircle,
  FaChevronRight,
  FaChevronDown,
  FaStar,
  FaDownload,
  FaLock,
  FaArrowUp,
  FaComment,
  FaPaperPlane,
  FaSmile,
  FaReply,
  FaEllipsisV,
  FaSearch,
  FaTimes,
  FaLink,
  FaGlobe,
  FaUserShield,
  FaEye,
  FaCheck,
  FaRegClock,
  FaRegCommentDots,
  FaPlus,
  FaPaperclip,
  FaVideo,
  FaUsers,
  FaThumbsUp,
  FaArrowRight,
  FaArrowLeft,
  FaLightbulb,
  FaPause,
  FaMicrophone,
  FaImage,
  FaCircle,
  FaTag,
  FaHashtag,
  FaEdit,
  FaTrash,
  FaFlag,
  FaShare,
  FaBookmark,
  FaThumbsDown,
  FaHeart,
  FaFire,
  FaCheckDouble,
  FaPhoneAlt,
  FaUserFriends,
  FaQuestionCircle,
  FaComments,
  FaBook,
  FaListAlt,
  FaChartLine,
  FaPen,
  FaExclamationTriangle,
  FaMapMarkerAlt,
} from "react-icons/fa";
import {
  User,
  UserAnalytics,
  LearnerBadge,
  MentorBadge,
  LiveMessage,
  Question,
  Message,
  Lesson,
  ModuleGroup,
  TypingUser,
  MOCK_CURRENT_USER,
  MOCK_USER_ANALYTICS,
  QuestionData,
  AnswerData,
} from "./types";
import { QuestionAPI } from "@/lib/api/questions";
import toast from "react-hot-toast";

// ============================================
// EMOJI PICKER COMPONENT
// ============================================

export const EmojiPicker = memo(
  ({ onSelect }: { onSelect: (emoji: string) => void }) => {
    const emojis = [
      "😀",
      "😂",
      "❤️",
      "🔥",
      "👍",
      "👏",
      "🎉",
      "💡",
      "🤔",
      "👀",
      "🙏",
      "💪",
      "✅",
      "❌",
      "⭐",
      "🎯",
      "🚀",
      "💯",
      "🌟",
      "😍",
      "🤗",
      "😎",
      "🥳",
      "🤩",
    ];

    return (
      <div className="absolute bottom-full right-0 mb-2 bg-gray-900 border border-gray-800 rounded-xl p-3 shadow-2xl z-50">
        <div className="grid grid-cols-8 gap-2">
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSelect(emoji)}
              className="text-2xl hover:scale-110 transition-transform p-1"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    );
  }
);
EmojiPicker.displayName = "EmojiPicker";

// ============================================
// TYPING INDICATOR
// ============================================

export const TypingIndicator = memo(({ users }: { users: TypingUser[] }) => {
  if (users.length === 0) return null;

  const names = users.map((u) => u.name).join(", ");
  const text =
    users.length === 1 ? `${names} is typing` : `${names} are typing`;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400">
      <span>{text}</span>
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <div
          className="w-2 h-2 bg-red-500 rounded-full animate-pulse"
          style={{ animationDelay: "0.2s" }}
        />
        <div
          className="w-2 h-2 bg-red-500 rounded-full animate-pulse"
          style={{ animationDelay: "0.4s" }}
        />
      </div>
    </div>
  );
});
TypingIndicator.displayName = "TypingIndicator";

// ============================================
// ANIMATED BADGE COMPONENT
// ============================================

export const AnimatedBadge = memo(
  ({
    badge,
    size = "md",
    showProgress = false,
  }: {
    badge: LearnerBadge;
    size?: "sm" | "md" | "lg";
    showProgress?: boolean;
  }) => {
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const badgeRef = useRef<HTMLDivElement>(null);

    const sizes = {
      sm: { container: "w-8 h-8", icon: "text-lg", ring: "w-10 h-10" },
      md: { container: "w-12 h-12", icon: "text-2xl", ring: "w-14 h-14" },
      lg: { container: "w-16 h-16", icon: "text-4xl", ring: "w-20 h-20" },
    };

    const updateTooltipPosition = () => {
      if (badgeRef.current) {
        const rect = badgeRef.current.getBoundingClientRect();
        setTooltipPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 8,
        });
      }
    };

    return (
      <div
        ref={badgeRef}
        className="relative group"
        onMouseEnter={updateTooltipPosition}
      >
        {/* Badge container */}
        <div
          className={`relative ${
            sizes[size].container
          } rounded-full bg-gradient-to-br ${badge.color} ${
            badge.earned ? "shadow-lg" : "opacity-50 grayscale"
          } flex items-center justify-center border-2 ${
            badge.earned ? "border-white/30" : "border-gray-700"
          } transition-all group-hover:scale-110`}
        >
          <span className={sizes[size].icon}>{badge.icon}</span>

          {!badge.earned && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
              <FaLock className="text-white text-xs" />
            </div>
          )}

          {badge.earned && size !== "sm" && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-[10px] font-black text-black border-2 border-white">
              ✓
            </div>
          )}
        </div>

        {/* Progress ring */}
        {showProgress && !badge.earned && badge.progress !== undefined && (
          <svg
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${sizes[size].ring} -rotate-90`}
          >
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-800"
            />
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="100"
              strokeDashoffset={100 - badge.progress}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="gradient">
                <stop offset="0%" stopColor="rgb(220, 38, 38)" />
                <stop offset="100%" stopColor="rgb(185, 28, 28)" />
              </linearGradient>
            </defs>
          </svg>
        )}

        {/* Fixed Position Tooltip */}
        <div
          className="fixed opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[9999]"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 shadow-2xl backdrop-blur-sm whitespace-nowrap">
            <div className="text-white font-bold text-sm mb-1">
              {badge.name}
            </div>
            <div className="text-gray-400 text-xs mb-1">
              {badge.description}
            </div>
            {!badge.earned && (
              <>
                <div className="text-gray-500 text-xs mb-1">
                  {badge.requirement}
                </div>
                {badge.progress !== undefined && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${badge.color} rounded-full`}
                        style={{ width: `${badge.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">
                      {Math.round(badge.progress)}%
                    </span>
                  </div>
                )}
              </>
            )}
            {badge.earned && badge.earnedDate && (
              <div className="text-green-400 text-xs">
                Earned {badge.earnedDate.toLocaleDateString()}
              </div>
            )}
            {/* Arrow pointing down */}
            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          </div>
        </div>
      </div>
    );
  }
);
AnimatedBadge.displayName = "AnimatedBadge";

// ============================================
// MENTOR BADGE COMPONENT
// ============================================

export const MentorBadgeDisplay = memo(
  ({
    badge,
    size = "md",
    showLabel = true,
  }: {
    badge: MentorBadge;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
  }) => {
    const sizes = {
      sm: {
        container: "w-6 h-6",
        icon: "text-sm",
        label: "text-[8px]",
        ring: "w-8 h-8",
      },
      md: {
        container: "w-10 h-10",
        icon: "text-xl",
        label: "text-[10px]",
        ring: "w-12 h-12",
      },
      lg: {
        container: "w-16 h-16",
        icon: "text-3xl",
        label: "text-xs",
        ring: "w-20 h-20",
      },
    };

    return (
      <div className="relative group">
        {/* Gold Trim Badge Container */}
        <div
          className={`relative ${sizes[size].container} rounded-full bg-gradient-to-br ${badge.color} shadow-lg flex items-center justify-center border-2 border-yellow-300/50 transition-all group-hover:scale-110 group-hover:border-yellow-200`}
        >
          {/* Inner glow */}
          <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-white/30 to-transparent" />

          {/* Icon */}
          <span className={`${sizes[size].icon} relative z-10`}>
            {badge.icon}
          </span>

          {/* Verified Checkmark */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
            <FaUserShield className="text-white text-[8px]" />
          </div>
        </div>

        {/* Label */}
        {showLabel && size !== "sm" && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <div
              className={`px-2 py-0.5 bg-gradient-to-r ${badge.color} rounded-full ${sizes[size].label} font-black text-white shadow-lg border border-yellow-300/30`}
            >
              {badge.name.toUpperCase()}
            </div>
          </div>
        )}

        {/* Tooltip */}
        <div
          className="fixed opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[9999]"
          style={{
            transform: "translate(-50%, calc(-100% - 8px))",
          }}
        >
          <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-yellow-500/50 rounded-lg px-4 py-3 shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{badge.icon}</span>
              <div>
                <div className="text-white font-black text-sm">
                  {badge.name}
                </div>
                <div
                  className={`text-xs font-bold bg-gradient-to-r ${badge.color} bg-clip-text text-transparent`}
                >
                  {badge.tier.toUpperCase()} TIER
                </div>
              </div>
            </div>
            <div className="text-gray-300 text-xs">{badge.description}</div>
            <div className="mt-2 pt-2 border-t border-yellow-500/30">
              <div className="text-yellow-400 text-[10px] font-bold">
                ✓ VERIFIED EXPERT
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
MentorBadgeDisplay.displayName = "MentorBadgeDisplay";

// ============================================
// LIVE MESSAGE BUBBLE
// ============================================

// ============================================
// LIVE MESSAGE BUBBLE - IMPROVED VERSION
// ============================================

// ============================================
// LIVE MESSAGE BUBBLE - FIXED Z-INDEX & OVERFLOW
// ============================================

// ============================================
// LIVE MESSAGE BUBBLE - FULLY OPTIMIZED
// ============================================

// Add these imports at the top of ChatSubComponents.tsx
import ChatUserHoverCard from '@/components/course-builder/chats/ChatUserHoverCard';
import { useUserHover } from '@/hooks/useUserHover';

// Replace the LiveMessageBubble component (around line 350):

export const LiveMessageBubble = memo(
  ({
    message,
    currentUserId,
    onReply,
    onReaction,
    onEdit,
    onDelete,
    onMention,
    onUserClick,
    reduceMotion = false,
  }: {
    message: LiveMessage;
    currentUserId: string;
    onReply: (message: LiveMessage) => void;
    onReaction: (messageId: string, emoji: string) => void;
    onEdit: (messageId: string) => void;
    onDelete: (messageId: string) => void;
    onMention: (userId: string) => void;
    onUserClick?: (userId: string) => void;
    reduceMotion?: boolean;
  }) => {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const isCurrentUser = message.userId === currentUserId;
    const isMentor = message.userRole === "mentor";

    // ✅ ADD: Hover card functionality
    const {
      showHoverCard,
      hoveredUser,
      hoverPosition,
      handleUserHover,
      handleUserLeave,
      keepHoverCardOpen
    } = useUserHover();

    // ✅ ADD: Transform message user to User type
    const messageUser: User = useMemo(() => {
      const userName = message.userName || message.userId || 'Unknown User';
      const username = userName.toLowerCase().replace(/\s+/g, '') || message.userId || 'unknown';
      
      return {
        id: message.userId || '',
        name: userName,
        username: username,
        avatar: message.userAvatar || '/default-avatar.png',
        avatarObject: message.userMetadata?.avatarObject || null,
        isOnline: true,
        role: message.userRole || 'student',
        xp: message.userMetadata?.xp || 0,
        seekers: message.userMetadata?.seekers || 0,
        seeking: message.userMetadata?.seeking || 0,
        coursesMade: message.userMetadata?.coursesMade || 0,
        coursesLearning: message.userMetadata?.coursesLearning || 0,
        badges: message.userMetadata?.badges || [],
        bio: message.userMetadata?.bio || '',
        isPrivate: message.userMetadata?.isPrivate || false,
        coverImage: message.userMetadata?.coverImage
      };
    }, [message]);

    // Memoized timestamp formatting
    const formattedTime = useMemo(() => {
      try {
        if (!message.timestamp) return "Just now";
        
        const dateObj = message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp);
        if (isNaN(dateObj.getTime())) return "Just now";

        const now = new Date();
        const diff = now.getTime() - dateObj.getTime();
        
        if (diff < 0) return "Just now";

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 10) return "Just now";
        if (seconds < 60) return `${seconds}s ago`;
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;

        return dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          ...(dateObj.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
        });
      } catch (error) {
        return "Just now";
      }
    }, [message.timestamp]);

    // Memoized avatar
    const userAvatar = useMemo(() => {
      if (message.userAvatar && message.userAvatar.includes('http')) {
        return message.userAvatar;
      }
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.userId}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
    }, [message.userAvatar, message.userId]);

    const handleMouseEnter = useCallback(() => setShowActions(true), []);
    const handleMouseLeave = useCallback(() => {
      setShowActions(false);
      setShowEmojiPicker(false);
    }, []);

    const handleEmojiToggle = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      setShowEmojiPicker(prev => !prev);
    }, []);

    const handleReplyClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      onReply(message);
    }, [onReply, message]);

    const handleEditClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      onEdit(message.id);
    }, [onEdit, message.id]);

    const handleDeleteClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(message.id);
    }, [onDelete, message.id]);

    if (message.isDeleted) {
      return (
        <div className="flex items-center gap-2 px-4 py-2 text-gray-500 text-sm italic">
          <FaTrash className="text-xs" />
          This message was deleted
        </div>
      );
    }

    return (
      <>
        <div
          className={`message-bubble-wrapper group flex gap-3 px-4 py-3 hover:bg-gray-900/30 transition-colors relative ${
            isCurrentUser ? "flex-row-reverse" : ""
          }`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ overflow: 'visible' }}
        >
          {!isCurrentUser && (
            <div className="flex-shrink-0">
              <div className="relative">
                {/* ✅ ADD: Hover handlers to avatar */}
                <button
                  onClick={() => onUserClick?.(message.userId)}
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    handleUserHover(messageUser, e);
                  }}
                  onMouseLeave={handleUserLeave}
                  className="relative group/avatar"
                >
                  <img
                    src={userAvatar}
                    alt={message.userName}
                    className="w-10 h-10 rounded-full border-2 border-gray-800 group-hover/avatar:border-red-500/50 transition-colors cursor-pointer"
                  />
                  {isMentor && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center border-2 border-gray-950">
                      <FaUserShield className="text-black text-[10px]" />
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}

          <div
            className={`flex-1 max-w-2xl ${
              isCurrentUser ? "flex flex-col items-end" : ""
            }`}
          >
            {/* Header */}
            {!isCurrentUser && (
              <div className="flex items-center gap-2 mb-1.5">
                {/* ✅ ADD: Hover handlers to name */}
                <button
                  onClick={() => onUserClick?.(message.userId)}
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    handleUserHover(messageUser, e);
                  }}
                  onMouseLeave={handleUserLeave}
                  className="text-sm font-bold text-white hover:text-red-400 transition-colors"
                >
                  {message.userName || 'Unknown User'}
                </button>

                {isMentor &&
                  (() => {
                    const userAnalytics = MOCK_USER_ANALYTICS.find(
                      (a) => a.userId === message.userId
                    );
                    return userAnalytics?.mentorBadge ? (
                      <MentorBadgeDisplay
                        badge={userAnalytics.mentorBadge}
                        size="sm"
                        showLabel={false}
                      />
                    ) : null;
                  })()}

                {!isMentor &&
                  (() => {
                    const userAnalytics = MOCK_USER_ANALYTICS.find(
                      (a) => a.userId === message.userId
                    );
                    return userAnalytics?.currentBadge ? (
                      <AnimatedBadge
                        badge={userAnalytics.currentBadge}
                        size="sm"
                      />
                    ) : null;
                  })()}

                {isMentor && (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black text-[9px] font-bold rounded-full uppercase shadow-lg">
                    MENTOR
                  </span>
                )}

                <span className="text-xs text-gray-500 ml-auto">
                  {formattedTime}
                </span>
              </div>
            )}

            {/* Reply preview */}
            {message.replyTo && (
              <div className="mb-2 ml-4 pl-3 border-l-2 border-red-500/30">
                <div className="text-gray-500 text-xs mb-1">
                  Replying to{" "}
                  <span className="text-red-400">{message.replyTo.userName}</span>
                </div>
                <div className="text-gray-400 text-sm line-clamp-1">
                  {message.replyTo.content}
                </div>
              </div>
            )}

            {/* Message bubble */}
            <div className="relative">
              <div
                className={`relative ${
                  isCurrentUser
                    ? "bg-gradient-to-r from-red-600 to-red-700"
                    : isMentor
                    ? "bg-gradient-to-r from-yellow-600/10 via-yellow-500/20 to-yellow-600/10 border-2 border-yellow-500/40"
                    : "bg-gray-900/80 border border-gray-800"
                } rounded-2xl px-4 py-3 shadow-lg transition-all ${
                  showActions ? "shadow-xl" : ""
                }`}
              >
                {message.isVoiceMessage ? (
                  <div className="flex items-center gap-3">
                    <button className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                      <FaPlay className="text-white text-sm ml-0.5" />
                    </button>
                    <div className="flex-1">
                      <div className="h-8 flex items-center gap-1">
                        {[...Array(20)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-white/40 rounded-full"
                            style={{
                              height: `${Math.random() * 100 + 20}%`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 font-mono">
                      {message.voiceDuration || "0:00"}
                    </span>
                  </div>
                ) : (
                  <p
                    className={`text-sm leading-relaxed break-words whitespace-pre-wrap ${
                      isMentor && !isCurrentUser
                        ? "text-white font-medium"
                        : "text-white"
                    }`}
                  >
                    {message.content}
                  </p>
                )}

                {message.edited && (
                  <span className="text-xs text-gray-400 block mt-1">(edited)</span>
                )}
              </div>

              {/* Action buttons */}
              <AnimatePresence>
                {showActions && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute"
                    style={{
                      top: '100%',
                      marginTop: '0.5rem',
                      [isCurrentUser ? 'left' : 'right']: 0,
                      zIndex: 9999,
                      pointerEvents: 'auto',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1 bg-gray-950 backdrop-blur-sm rounded-lg p-1.5 shadow-2xl border-2 border-gray-800">
                      <button
                        onClick={handleEmojiToggle}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors group/btn"
                        title="React"
                      >
                        <FaSmile className="text-gray-400 group-hover/btn:text-yellow-400 text-sm transition-colors" />
                      </button>
                      <button
                        onClick={handleReplyClick}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors group/btn"
                        title="Reply"
                      >
                        <FaReply className="text-gray-400 group-hover/btn:text-blue-400 text-sm transition-colors" />
                      </button>
                      {isCurrentUser && (
                        <>
                          <div className="w-px h-4 bg-gray-800" />
                          <button
                            onClick={handleEditClick}
                            className="p-2 hover:bg-gray-800 rounded-lg transition-colors group/btn"
                            title="Edit"
                          >
                            <FaEdit className="text-gray-400 group-hover/btn:text-green-400 text-sm transition-colors" />
                          </button>
                          <button
                            onClick={handleDeleteClick}
                            className="p-2 hover:bg-red-900/50 rounded-lg transition-colors group/btn"
                            title="Delete"
                          >
                            <FaTrash className="text-gray-400 group-hover/btn:text-red-400 text-sm transition-colors" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                      <div 
                        className="absolute bottom-full mb-2"
                        style={{
                          [isCurrentUser ? 'left' : 'right']: 0,
                          zIndex: 10000,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <EmojiPicker
                          onSelect={(emoji) => {
                            onReaction(message.id, emoji);
                            setShowEmojiPicker(false);
                          }}
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Reactions */}
            {message.reactions.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {message.reactions.map((reaction, idx) => {
                  const hasUserReacted = reaction.users && 
                                        Array.isArray(reaction.users) && 
                                        reaction.users.includes(currentUserId);
                  const userCount = reaction.users && Array.isArray(reaction.users) 
                                   ? reaction.users.length 
                                   : reaction.count || 0;
                  
                  return (
                    <motion.button
                      key={idx}
                      onClick={() => onReaction(message.id, reaction.emoji)}
                      className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all text-sm font-medium ${
                        hasUserReacted
                          ? "bg-red-600/30 border-2 border-red-500/50 shadow-lg shadow-red-500/20"
                          : "bg-gray-900/50 border border-gray-800 hover:bg-gray-800/70 hover:border-red-500/30"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-base">{reaction.emoji}</span>
                      <span className={hasUserReacted ? "text-white" : "text-gray-400"}>
                        {userCount}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Timestamp for current user messages */}
            {isCurrentUser && (
              <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                <span>{formattedTime}</span>
                {message.readBy && message.readBy.length > 0 && (
                  <>
                    <span>•</span>
                    <FaCheckDouble className="text-blue-400" />
                    <span>Seen by {message.readBy.length}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {isCurrentUser && (
            <div className="flex-shrink-0">
              <img
                src={userAvatar}
                alt={message.userName}
                className="w-10 h-10 rounded-full border-2 border-red-500/50 shadow-lg"
              />
            </div>
          )}
        </div>

        {/* ✅ ADD: Hover Card with proper portal-like positioning */}
        {showHoverCard && hoveredUser && (
          <div 
            className="fixed inset-0 pointer-events-none"
            style={{ zIndex: 10000 }}
            onMouseEnter={keepHoverCardOpen}
            onMouseLeave={handleUserLeave}
          >
            <div className="pointer-events-auto">
              <ChatUserHoverCard
                user={hoveredUser}
                isVisible={showHoverCard}
                position={hoverPosition}
              />
            </div>
          </div>
        )}
      </>
    );
  },
  // Memoization comparison
  (prevProps, nextProps) => {
    const prev = prevProps.message;
    const next = nextProps.message;

    return (
      prev.id === next.id &&
      prev.content === next.content &&
      prev.edited === next.edited &&
      prev.isDeleted === next.isDeleted &&
      prev.reactions.length === next.reactions.length &&
      prev.reactions.every((r, i) => {
        const nextR = next.reactions[i];
        return r.emoji === nextR?.emoji && 
               r.count === nextR?.count &&
               r.users?.length === nextR?.users?.length;
      }) &&
      prevProps.currentUserId === nextProps.currentUserId
    );
  }
);
LiveMessageBubble.displayName = "LiveMessageBubble";

// ============================================
// MESSAGE BUBBLE FOR QUESTIONS
// ============================================

export const MessageBubble = memo(
  ({
    message,
    onReply,
    onReaction,
    isReply = false,
    currentUserId,
  }: {
    message: Message;
    onReply: (messageId: string) => void;
    onReaction: (messageId: string, emoji: string) => void;
    isReply?: boolean;
    currentUserId: string;
  }) => {
    const [showReactions, setShowReactions] = useState(false);
    const isCurrentUser = message.userId === currentUserId;
    const isMentor = message.isMentorAnswer;

    const commonEmojis = ["👍", "❤️", "🎉", "🔥", "✅", "🤔"];

    return (
      <div
        className={`flex gap-3 ${isReply ? "ml-12 mt-2" : ""} ${
          isCurrentUser ? "flex-row-reverse" : ""
        }`}
      >
        {!isCurrentUser && (
          <div className="flex-shrink-0">
            <img
              src={message.userAvatar}
              alt={message.userName}
              className="w-8 h-8 rounded-full border-2 border-red-500/30"
            />
          </div>
        )}

        <div
          className={`flex-1 max-w-2xl ${
            isCurrentUser ? "flex justify-end" : ""
          }`}
        >
          <div>
            {!isCurrentUser && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-white">
                  {message.userName}
                </span>
                {isMentor && (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black text-[10px] font-bold rounded-full flex items-center gap-1">
                    <FaUserShield className="text-[8px]" />
                    MENTOR
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}

            <div
              className={`relative group ${
                isCurrentUser
                  ? "bg-gradient-to-r from-red-600 to-red-700"
                  : isMentor
                  ? "bg-gradient-to-r from-yellow-600/20 to-yellow-700/20 border border-yellow-500/30"
                  : "bg-gray-900/80 border border-gray-800"
              } rounded-2xl px-4 py-3 ${
                message.isAnswer ? "ring-2 ring-green-500/30" : ""
              }`}
            >
              {message.isAnswer && (
                <div className="absolute -top-2 -right-2">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 p-1 rounded-full">
                    <FaCheck className="text-white text-xs" />
                  </div>
                </div>
              )}

              <p className="text-white text-sm leading-relaxed break-words">
                {message.content}
              </p>

              <div
                className={`absolute top-1 ${
                  isCurrentUser ? "left-1" : "right-1"
                } opacity-0 group-hover:opacity-100 transition-opacity`}
              >
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowReactions(!showReactions)}
                    className="p-1.5 bg-gray-800/90 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <FaSmile className="text-gray-400 text-xs" />
                  </button>
                  {!isReply && (
                    <button
                      onClick={() => onReply(message.id)}
                      className="p-1.5 bg-gray-800/90 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <FaReply className="text-gray-400 text-xs" />
                    </button>
                  )}
                </div>

                {showReactions && (
                  <div
                    className="absolute top-full mt-2 bg-gray-900 border border-gray-800 rounded-xl p-2 shadow-xl flex gap-2 z-50"
                    onMouseLeave={() => setShowReactions(false)}
                  >
                    {commonEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          onReaction(message.id, emoji);
                          setShowReactions(false);
                        }}
                        className="text-xl hover:scale-110 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

           {message.reactions.length > 0 && (
  <div className="flex gap-1.5 mt-2 flex-wrap">
    {message.reactions.map((reaction, idx) => (
      <motion.button
        key={idx}
        onClick={() => onReaction(message.id, reaction.emoji)}
        className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all text-sm font-medium ${
          (reaction.users && reaction.users.includes(currentUserId))  // ✅ FIX: Add null check
            ? "bg-red-600/30 border-2 border-red-500/50 shadow-lg shadow-red-500/20"
            : "bg-gray-900/50 border border-gray-800 hover:bg-gray-800/70 hover:border-red-500/30"
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-base">{reaction.emoji}</span>
        <span className={(reaction.users && reaction.users.includes(currentUserId)) ? "text-white" : "text-gray-400"}>
          {reaction.count}
        </span>
      </motion.button>
    ))}
  </div>
)}

            {message.replies && message.replies.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.replies.map((reply) => (
                  <MessageBubble
                    key={reply.id}
                    message={reply}
                    onReply={onReply}
                    onReaction={onReaction}
                    isReply={true}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {isCurrentUser && (
          <div className="flex-shrink-0">
            <img
              src={message.userAvatar}
              alt={message.userName}
              className="w-8 h-8 rounded-full border-2 border-red-500/30"
            />
          </div>
        )}
      </div>
    );
  }
);
MessageBubble.displayName = "MessageBubble";

// ============================================
// IMPROVED QUESTION CARD WITH UPIT
// ============================================

export const QuestionCard = memo(
  ({
    question,
    onClick,
    onUpvote,
    compact = false,
  }: {
    question: QuestionData;
    onClick: () => void;
    onUpvote: (questionId: string) => void;
    compact?: boolean;
  }) => {
    const [isUpvoting, setIsUpvoting] = useState(false);

    const handleUpvote = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isUpvoting) return;

      setIsUpvoting(true);
      try {
        await onUpvote(question.id);
      } finally {
        setIsUpvoting(false);
      }
    };

    const statusColors = {
      open: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
      answered: "text-green-400 border-green-500/30 bg-green-500/10",
      closed: "text-gray-400 border-gray-500/30 bg-gray-500/10",
    };

    const visibilityIcons = {
      MENTOR_ONLY: <FaUserShield className="text-yellow-500 text-xs" />,
      MENTOR_PUBLIC: <FaUsers className="text-blue-500 text-xs" />,
      PRIVATE: <FaLock className="text-gray-500 text-xs" />,
    };

    if (compact) {
      return (
        <button
          onClick={onClick}
          className="w-full text-left bg-gray-900/50 hover:bg-gray-800/50 border border-gray-800 hover:border-red-500/30 rounded-xl p-3 transition-all group"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-red-400 transition-colors">
                  {question.title}
                </h4>
                {question.isPinned && (
                  <FaStar className="text-yellow-500 text-xs flex-shrink-0" />
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <FaThumbsUp className="text-[10px]" />
                  {question.upvoteCount}
                </span>
                <span>•</span>
                <span>{question.answerCount} answers</span>
                
                {/* ✅ NEW: Show thanks count */}
                {question.thanksGivenCount > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-yellow-500">
                      <span className="text-sm">🙏</span>
                      {question.thanksGivenCount}/2 thanked
                    </span>
                  </>
                )}
                
                {question.videoTimestamp && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <FaClock className="text-[10px]" />
                      {question.videoTimestamp}
                    </span>
                  </>
                )}
                <span className="ml-auto">
                  {visibilityIcons[question.visibility]}
                </span>
              </div>
            </div>
          </div>
        </button>
      );
    }

    return (
      <button
        onClick={onClick}
        className="w-full text-left bg-gradient-to-br from-gray-900/80 to-black/90 border border-gray-800 hover:border-red-500/30 rounded-xl p-4 sm:p-5 transition-all group hover:-translate-y-0.5 question-card"
      >
        <div className="flex items-start gap-3 sm:gap-4">
          {/* UpIt Button */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <motion.button
              onClick={handleUpvote}
              disabled={isUpvoting}
              className={`p-2 sm:p-2.5 rounded-lg transition-all ${
                question.hasUpvoted
                  ? "bg-red-600 text-white shadow-lg shadow-red-500/30"
                  : "bg-gray-900/50 border border-gray-800 text-gray-400 hover:bg-red-600/20 hover:border-red-500/30 hover:text-red-400"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaArrowUp className="text-base sm:text-lg" />
            </motion.button>
            <span
              className={`text-xs sm:text-sm font-bold ${
                question.hasUpvoted ? "text-red-400" : "text-gray-400"
              }`}
            >
              {question.upvoteCount}
            </span>
          </div>

          {/* Avatar */}
          <img
            src={question.userAvatar}
            alt={question.userName}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-red-500/30 flex-shrink-0"
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-sm font-semibold text-white">
                {question.userName}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(question.createdAt).toLocaleDateString()}
              </span>
              {question.isPinned && (
                <div className="ml-auto">
                  <FaStar className="text-yellow-500 text-sm" />
                </div>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white mb-2 group-hover:text-red-400 transition-colors">
              {question.title}
            </h3>

            {question.description && (
              <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                {question.description}
              </p>
            )}

            <div className="flex items-center gap-3 text-xs flex-wrap">
              <span
                className={`px-2 py-1 rounded-full border ${
                  statusColors[question.status]
                }`}
              >
                {question.status}
              </span>

              <span className="text-gray-500 flex items-center gap-1">
                <FaRegCommentDots />
                {question.answerCount}
              </span>

              <span className="text-gray-500 flex items-center gap-1">
                <FaEye />
                {question.viewCount}
              </span>

              {question.videoTimestamp && (
                <span className="text-gray-500 flex items-center gap-1">
                  <FaClock />
                  {question.videoTimestamp}
                </span>
              )}

              <span className="ml-auto flex items-center gap-1 text-gray-500">
                {visibilityIcons[question.visibility]}
                <span className="text-[10px]">
                  {question.visibility.replace("_", " ")}
                </span>
              </span>
            </div>

            {question.tags.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {question.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-red-600/10 border border-red-500/20 rounded text-[10px] text-red-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </button>
    );
  }
);
QuestionCard.displayName = "QuestionCard";

// ============================================
// IMPROVED NEW QUESTION MODAL
// ============================================

// ============================================
// NEW QUESTION MODAL - RESTORED PREVIOUS UI
// ============================================

export const NewQuestionModal = memo(
  ({
    isOpen,
    onClose,
    modules,
    roomId,
    onQuestionCreated,
  }: {
    isOpen: boolean;
    onClose: () => void;
    modules: ModuleGroup[];
    roomId: string;
    onQuestionCreated: (question: any) => void;
  }) => {
    const [step, setStep] = useState(1);
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [videoTimestamp, setVideoTimestamp] = useState("");
    const [visibility, setVisibility] = useState<
      "PRIVATE" | "MENTOR_ONLY" | "MENTOR_PUBLIC"
    >("MENTOR_PUBLIC");
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset form when modal closes
    useEffect(() => {
      if (!isOpen) {
        setStep(1);
        setSelectedLesson(null);
        setTitle("");
        setDescription("");
        setVideoTimestamp("");
        setVisibility("MENTOR_PUBLIC");
        setTags([]);
        setTagInput("");
        setError(null);
      }
    }, [isOpen]);

    const handleSubmit = async () => {
      if (!selectedLesson || !title.trim() || !description.trim()) {
        setError("Please fill in all required fields");
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const questionData = {
          roomId,
          lessonId: selectedLesson.id,
          moduleId: selectedLesson.moduleId, // ✅ ADD THIS - was missing!
          title: title.trim(),
          description: description.trim(),
          videoTimestamp: videoTimestamp || undefined,
          visibility,
          tags,
        };

        console.log("📝 Creating question with data:", questionData); // Debug log

        const response = await QuestionAPI.createQuestion(questionData);

        onQuestionCreated(response.question);
        onClose();

        toast.success("Question posted successfully!"); // If you have toast
      } catch (err: any) {
        console.error("Failed to create question:", err);
        setError(err.message || "Failed to create question");
      } finally {
        setIsSubmitting(false);
      }
    };

    const addTag = () => {
      const trimmedTag = tagInput.trim().toLowerCase();
      if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
        setTags([...tags, trimmedTag]);
        setTagInput("");
      }
    };

    const removeTag = (tagToRemove: string) => {
      setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-4xl bg-gradient-to-br from-gray-900 to-black border border-red-500/30 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 p-6 flex items-center justify-between z-10 flex-shrink-0">
            <div>
              <h2 className="text-2xl font-black text-white">Ask a Question</h2>
              <p className="text-red-100 text-sm mt-1">Step {step} of 4</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <FaTimes className="text-white text-xl" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-xl flex items-start gap-3">
              <FaExclamationTriangle className="text-red-500 text-xl flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-400 font-semibold mb-1">Error</p>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300"
              >
                <FaTimes />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* STEP 1: Select Lesson */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Select a Lesson
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Choose the lesson your question is about
                  </p>
                </div>

                {modules.length === 0 ? (
                  <div className="p-8 bg-gray-900/50 border border-gray-800 rounded-xl text-center">
                    <FaBook className="text-4xl text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No lessons available</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {modules.map((module) => (
                      <div key={module.id} className="space-y-2">
                        <div className="text-sm font-bold text-red-400 px-3 py-2 bg-red-900/20 rounded-lg flex items-center gap-2">
                          <FaBook className="text-red-500" />
                          {module.title}
                        </div>

                        {module.lessons && module.lessons.length > 0 ? (
                          module.lessons.map((lesson) => (
                            <button
                              key={lesson.id}
                              onClick={() => setSelectedLesson(lesson)}
                              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                selectedLesson?.id === lesson.id
                                  ? "bg-red-600/20 border-red-500"
                                  : "bg-gray-900/50 border-gray-800 hover:border-red-500/30"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="text-white font-semibold mb-1">
                                    {lesson.title}
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-gray-400">
                                    {lesson.duration && (
                                      <span className="flex items-center gap-1">
                                        <FaClock />
                                        {lesson.duration}
                                      </span>
                                    )}
                                    {lesson.questionCount !== undefined && (
                                      <>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                          <FaRegCommentDots />
                                          {lesson.questionCount} questions
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {selectedLesson?.id === lesson.id && (
                                  <FaCheckCircle className="text-red-500 text-xl ml-3" />
                                )}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 bg-gray-900/30 border border-gray-800 rounded-xl text-center">
                            <p className="text-gray-500 text-sm">
                              No lessons in this module
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => {
                    if (selectedLesson) {
                      setStep(2);
                      setError(null);
                    } else {
                      setError("Please select a lesson");
                    }
                  }}
                  disabled={!selectedLesson}
                  className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-700 disabled:to-gray-800 text-white font-bold rounded-xl transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Continue
                  <FaArrowRight />
                </button>
              </div>
            )}

            {/* STEP 2: Select Video Timestamp (Optional) */}
            {step === 2 && selectedLesson && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Select Video Timestamp (Optional)
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Mark the exact moment in the video where your question
                    occurs
                  </p>
                </div>

                {selectedLesson.videoUrl ? (
                  <VideoTimestampSelector
                    videoUrl={selectedLesson.videoUrl}
                    selectedTimestamp={videoTimestamp}
                    onTimestampSelect={setVideoTimestamp}
                  />
                ) : (
                  <div className="p-8 bg-gray-900/50 border border-gray-800 rounded-xl text-center">
                    <FaVideo className="text-4xl text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 mb-2">
                      No video available for this lesson
                    </p>
                    <p className="text-gray-500 text-sm">
                      You can skip this step
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setStep(1);
                      setError(null);
                    }}
                    className="px-6 py-3 bg-gray-900/50 border border-gray-800 text-white font-bold rounded-xl hover:bg-gray-800/50 transition-all flex items-center gap-2"
                  >
                    <FaArrowLeft />
                    Back
                  </button>
                  <button
                    onClick={() => {
                      setStep(3);
                      setError(null);
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    Continue
                    <FaArrowRight />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Write Question */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Write Your Question
                  </h3>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Question Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., How do I handle async operations in React?"
                    maxLength={200}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {title.length}/200 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide more context about your question... What have you tried? What specific issue are you facing?"
                    rows={8}
                    maxLength={2000}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition-colors resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {description.length}/2000 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Tags (Optional - Max 5)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="Add a tag (e.g., react, hooks)"
                      maxLength={20}
                      disabled={tags.length >= 5}
                      className="flex-1 px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition-colors disabled:opacity-50"
                    />
                    <button
                      onClick={addTag}
                      disabled={!tagInput.trim() || tags.length >= 5}
                      className="px-4 py-2 bg-red-600/20 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>

                  {tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-red-600/20 border border-red-500/30 rounded-full text-sm text-red-400 flex items-center gap-2"
                        >
                          #{tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="hover:text-red-300"
                          >
                            <FaTimes className="text-xs" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setStep(2);
                      setError(null);
                    }}
                    className="px-6 py-3 bg-gray-900/50 border border-gray-800 text-white font-bold rounded-xl hover:bg-gray-800/50 transition-all flex items-center gap-2"
                  >
                    <FaArrowLeft />
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (!title.trim()) {
                        setError("Please enter a question title");
                        return;
                      }
                      if (!description.trim()) {
                        setError("Please enter a description");
                        return;
                      }
                      setStep(4);
                      setError(null);
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    Continue
                    <FaArrowRight />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Choose Visibility */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Who Can Answer?
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Choose who can see and respond to your question
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setVisibility("MENTOR_ONLY")}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      visibility === "MENTOR_ONLY"
                        ? "bg-red-600/20 border-red-500"
                        : "bg-gray-900/50 border-gray-800 hover:border-red-500/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-3 rounded-xl ${
                          visibility === "MENTOR_ONLY"
                            ? "bg-red-500"
                            : "bg-gray-800"
                        }`}
                      >
                        <FaUserShield className="text-white text-xl" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-bold mb-1">
                          Mentor Only
                        </h4>
                        <p className="text-sm text-gray-400">
                          Only the mentor can see and answer this question
                        </p>
                      </div>
                      {visibility === "MENTOR_ONLY" && (
                        <FaCheckCircle className="text-red-500 text-xl" />
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => setVisibility("MENTOR_PUBLIC")}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      visibility === "MENTOR_PUBLIC"
                        ? "bg-red-600/20 border-red-500"
                        : "bg-gray-900/50 border-gray-800 hover:border-red-500/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-3 rounded-xl ${
                          visibility === "MENTOR_PUBLIC"
                            ? "bg-red-500"
                            : "bg-gray-800"
                        }`}
                      >
                        <FaUsers className="text-white text-xl" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-bold mb-1">
                          Mentor + Public
                        </h4>
                        <p className="text-sm text-gray-400">
                          Mentor answers, but everyone can see the question and
                          answer
                        </p>
                      </div>
                      {visibility === "MENTOR_PUBLIC" && (
                        <FaCheckCircle className="text-red-500 text-xl" />
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => setVisibility("PRIVATE")}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      visibility === "PRIVATE"
                        ? "bg-red-600/20 border-red-500"
                        : "bg-gray-900/50 border-gray-800 hover:border-red-500/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-3 rounded-xl ${
                          visibility === "PRIVATE"
                            ? "bg-red-500"
                            : "bg-gray-800"
                        }`}
                      >
                        <FaLock className="text-white text-xl" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-bold mb-1">
                          Private (Coming Soon)
                        </h4>
                        <p className="text-sm text-gray-400">
                          Only you and the mentor can see this question
                        </p>
                      </div>
                      {visibility === "PRIVATE" && (
                        <FaCheckCircle className="text-red-500 text-xl" />
                      )}
                    </div>
                  </button>
                </div>

                {/* Review Summary */}
                <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
                  <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                    <FaCheckCircle className="text-green-500" />
                    Review Your Question
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 w-24 flex-shrink-0">
                        Lesson:
                      </span>
                      <span className="text-white font-semibold">
                        {selectedLesson?.title}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 w-24 flex-shrink-0">
                        Title:
                      </span>
                      <span className="text-white">{title}</span>
                    </div>
                    {videoTimestamp && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 w-24 flex-shrink-0">
                          Timestamp:
                        </span>
                        <span className="text-red-400 font-mono">
                          {videoTimestamp}
                        </span>
                      </div>
                    )}
                    {tags.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 w-24 flex-shrink-0">
                          Tags:
                        </span>
                        <div className="flex gap-1 flex-wrap">
                          {tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-red-600/20 text-red-400 rounded text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setStep(3);
                      setError(null);
                    }}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gray-900/50 border border-gray-800 text-white font-bold rounded-xl hover:bg-gray-800/50 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <FaArrowLeft />
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-700 disabled:to-gray-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <FaCheck />
                        Post Question
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }
);
NewQuestionModal.displayName = "NewQuestionModal";

// ============================================
// QUESTION THREAD MODAL
// ============================================

export const QuestionThreadModal = memo(
  ({
    questionId,
    isOpen,
    onClose,
    onUpvote,
    onAnswer,
  }: {
    questionId: string;
    isOpen: boolean;
    onClose: () => void;
    onUpvote: (questionId: string) => void;
    onAnswer: (questionId: string, content: string, parentAnswerId?: string) => void;
  }) => {
    const [question, setQuestion] = useState<QuestionData | null>(null);
    const [answers, setAnswers] = useState<AnswerData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [answerContent, setAnswerContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<AnswerData | null>(null);  // ✅ NEW
    const [currentUserId, setCurrentUserId] = useState<string>(''); // ✅ NEW

    // Add this useEffect to fetch current user ID
 useEffect(() => {
  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentUserId(data.user.id);  // ✅ FIXED - correct path
        console.log('✅ Current user ID set:', data.user.id);
      } else {
        console.error('Failed to fetch current user');
        setCurrentUserId('');
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      setCurrentUserId('');
    }
  };

  if (isOpen) {
    fetchCurrentUser();
  }
}, [isOpen]);

    // ✅ NEW: Real-time answer updates
    useEffect(() => {
      if (!isOpen || !questionId) return;

      const handleNewAnswer = (event: CustomEvent) => {
        const { questionId: answeredQuestionId, answer } = event.detail;
        
        if (answeredQuestionId === questionId) {
          console.log('📨 New answer received:', answer);
          
          if (answer.parentAnswerId) {
            // Nested reply
            setAnswers(prev => {
              const updateReplies = (answers: AnswerData[]): AnswerData[] => {
                return answers.map(a => {
                  if (a.id === answer.parentAnswerId) {
                    return {
                      ...a,
                      replyCount: (a.replyCount || 0) + 1,
                      replies: [...(a.replies || []), answer]
                    };
                  }
                  if (a.replies && a.replies.length > 0) {
                    return {
                      ...a,
                      replies: updateReplies(a.replies)
                    };
                  }
                  return a;
                });
              };
              return updateReplies(prev);
            });
          } else {
            // Top-level answer - ✅ Add to start for immediate visibility
            setAnswers(prev => [answer, ...prev]);
          }
          
          // Update question answer count
          setQuestion(prev => prev ? {
            ...prev,
            answerCount: (prev.answerCount || 0) + 1
          } : null);
        }
      };

      // ✅ NEW: Handle thanks badge updates in real-time
      const handleAnswerThanked = (event: CustomEvent) => {
        const { questionId: thankedQuestionId, answerId, isThanked, thanksGivenCount } = event.detail;
        
        if (thankedQuestionId === questionId) {
          console.log('🙏 Thanks badge updated:', answerId, isThanked);
          
          setAnswers(prev => {
            const updateThanks = (answers: AnswerData[]): AnswerData[] => {
              return answers.map(a => {
                if (a.id === answerId) {
                  return {
                    ...a,
                    isThanked,
                    thankedAt: isThanked ? new Date() : undefined
                  };
                }
                if (a.replies && a.replies.length > 0) {
                  return { ...a, replies: updateThanks(a.replies) };
                }
                return a;
              });
            };
            return updateThanks(prev);
          });

          setQuestion(prev => prev ? {
            ...prev,
            thanksGivenCount
          } : null);
        }
      };

      window.addEventListener('question:answer', handleNewAnswer as EventListener);
      window.addEventListener('answer:thanked', handleAnswerThanked as EventListener);

      return () => {
        window.removeEventListener('question:answer', handleNewAnswer as EventListener);
        window.removeEventListener('answer:thanked', handleAnswerThanked as EventListener);
      };
    }, [isOpen, questionId]);

    // ✅ Load question
    useEffect(() => {
      if (isOpen && questionId) {
        loadQuestion();
      }
    }, [isOpen, questionId]);

const loadQuestion = async () => {
  setLoading(true);
  setError(null);
  try {
    const data = await QuestionAPI.getQuestion(questionId);
    console.log('📊 Question data loaded:', {
      questionId: data.question.id,
      questionUserId: data.question.userId,  // ✅ Should be present
      currentUserId: currentUserId
    });
    
    setQuestion(data.question);
    setAnswers(data.question.answers || []);

    // Track view
    await QuestionAPI.trackView(questionId);
  } catch (err: any) {
    console.error("Failed to load question:", err);
    setError(err.message || "Failed to load question");
  } finally {
    setLoading(false);
  }
};

    // ✅ NEW: Sort answers to show thanked ones first
    useEffect(() => {
      if (answers.length > 0) {
        setAnswers(prev => 
          [...prev].sort((a, b) => {
            // Thanked answers first
            if (a.isThanked && !b.isThanked) return -1;
            if (!a.isThanked && b.isThanked) return 1;
            
            // Then accepted answers
            if (a.isAccepted && !b.isAccepted) return -1;
            if (!a.isAccepted && b.isAccepted) return 1;
            
            // Then mentor answers
            if (a.isMentorAnswer && !b.isMentorAnswer) return -1;
            if (!a.isMentorAnswer && b.isMentorAnswer) return 1;
            
            // Finally by upvotes
            return b.upvoteCount - a.upvoteCount;
          })
        );
      }
    }, [answers]);

    const handleSubmitAnswer = async () => {
      if (!answerContent.trim() || isSubmitting) return;

      setIsSubmitting(true);
      setError(null);

      try {
        await onAnswer(questionId, answerContent.trim(), replyingTo?.id);
        setAnswerContent("");
        setReplyingTo(null);  // ✅ Clear reply state
        // Don't reload - WebSocket will update
      } catch (err: any) {
        console.error("Failed to submit answer:", err);
        setError(err.message || "Failed to submit answer");
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleUpvote = async () => {
      if (!question) return;

      try {
        await onUpvote(questionId);
        // Optimistic update
        setQuestion({
          ...question,
          upvoteCount: question.hasUpvoted
            ? question.upvoteCount - 1
            : question.upvoteCount + 1,
          hasUpvoted: !question.hasUpvoted,
        });
      } catch (err) {
        console.error("Failed to upvote:", err);
      }
    };

    // ✅ NEW: Handle thanks badge
    const handleGiveThanks = async (answerId: string) => {
      if (!question) return;
      
      try {
        await QuestionAPI.giveThanks(questionId, answerId);
        toast.success('Thanks given! 🙏');
      } catch (err: any) {
        console.error('Failed to give thanks:', err);
        toast.error(err.message || 'Failed to give thanks');
      }
    };

    // ✅ UPDATED: Handle remove thanks with confirmation
    const handleRemoveThanks = async (answerId: string) => {
      // ✅ Add confirmation
      const confirmed = window.confirm(
        'Are you sure you want to remove the thanks badge? This cannot be undone.'
      );
      
      if (!confirmed) return;
      
      if (!question) return;
      
      try {
        await QuestionAPI.removeThanks(questionId, answerId);
        toast.success('Thanks removed');
      } catch (err: any) {
        console.error('Failed to remove thanks:', err);
        toast.error('Failed to remove thanks');
      }
    };

    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-4xl question-modal-content bg-gradient-to-br from-gray-900 to-black border border-red-500/30 rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 p-6 flex items-center justify-between z-10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <FaArrowLeft className="text-white text-xl" />
              </button>
              <div>
                <h2 className="text-2xl font-black text-white">
                  Question Details
                </h2>
                {question && (
                  <p className="text-red-100 text-sm mt-1">
                    {question.answerCount}{" "}
                    {question.answerCount === 1 ? "answer" : "answers"}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <FaTimes className="text-white text-xl" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-xl text-center">
                <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-3" />
                <p className="text-red-400">{error}</p>
                <button
                  onClick={loadQuestion}
                  className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : question ? (
              <>
                {/* Question Card */}
                <div className="bg-gradient-to-br from-gray-900/80 to-black/90 border border-gray-800 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    {/* UpIt Button */}
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <motion.button
                        onClick={handleUpvote}
                        className={`p-3 rounded-lg transition-all ${
                          question.hasUpvoted
                            ? "bg-red-600 text-white shadow-lg shadow-red-500/30"
                            : "bg-gray-900/50 border border-gray-800 text-gray-400 hover:bg-red-600/20 hover:border-red-500/30 hover:text-red-400"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FaArrowUp className="text-xl" />
                      </motion.button>
                      <span
                        className={`text-sm font-bold ${
                          question.hasUpvoted ? "text-red-400" : "text-gray-400"
                        }`}
                      >
                        {question.upvoteCount}
                      </span>
                    </div>

                    {/* Avatar */}
                    <img
                      src={question.userAvatar}
                      alt={question.userName}
                      className="w-12 h-12 rounded-full border-2 border-red-500/30 flex-shrink-0"
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-sm font-semibold text-white">
                          {question.userName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(question.createdAt).toLocaleString()}
                        </span>
                        {question.isPinned && (
                          <FaStar className="text-yellow-500" />
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-white mb-3">
                        {question.title}
                      </h3>

                      {question.description && (
                        <p className="text-gray-300 mb-4 whitespace-pre-wrap">
                          {question.description}
                        </p>
                      )}

                      {/* Video Timestamp */}
                      {question.videoTimestamp && (
                        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2">
                          <FaClock className="text-red-400" />
                          <span className="text-red-400 text-sm">
                            Video Timestamp: {question.videoTimestamp}
                          </span>
                        </div>
                      )}

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-xs flex-wrap">
                        <span
                          className={`px-3 py-1 rounded-full border ${
                            question.status === "open"
                              ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"
                              : question.status === "answered"
                              ? "text-green-400 border-green-500/30 bg-green-500/10"
                              : "text-gray-400 border-gray-500/30 bg-gray-500/10"
                          }`}
                        >
                          {question.status}
                        </span>

                        <span className="text-gray-500 flex items-center gap-1">
                          <FaEye />
                          {question.viewCount} views
                        </span>

                        <span className="text-gray-500 flex items-center gap-1">
                          {question.visibility === "MENTOR_ONLY" && (
                            <FaUserShield />
                          )}
                          {question.visibility === "MENTOR_PUBLIC" && (
                            <FaUsers />
                          )}
                          {question.visibility === "PRIVATE" && <FaLock />}
                          {question.visibility.replace("_", " ")}
                        </span>
                      </div>

                      {/* Tags */}
                      {question.tags.length > 0 && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {question.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-red-600/10 border border-red-500/20 rounded text-xs text-red-400"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Answers Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">
                      {answers.length}{" "}
                      {answers.length === 1 ? "Answer" : "Answers"}
                    </h3>
                  </div>

                  {/* Answer Form */}
                  <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                    {/* ✅ NEW: Reply indicator */}
                    {replyingTo && (
                      <div className="mb-3 p-3 bg-gray-800/50 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FaReply className="text-red-400" />
                          <span className="text-sm text-gray-400">
                            Replying to <span className="text-white font-semibold">{replyingTo.userName}</span>
                          </span>
                        </div>
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    )}

                    <textarea
                      value={answerContent}
                      onChange={(e) => setAnswerContent(e.target.value)}
                      placeholder={replyingTo ? "Write your reply..." : "Write your answer..."}
                      rows={4}
                      maxLength={5000}
                      disabled={isSubmitting}
                      className="question-modal-textarea w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition-colors resize-none disabled:opacity-50"
                    />
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        {answerContent.length}/5000
                      </span>
                      <button
                        onClick={handleSubmitAnswer}
                        disabled={!answerContent.trim() || isSubmitting}
                        className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-700 disabled:to-gray-800 text-white font-bold rounded-lg transition-all disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Posting...
                          </>
                        ) : (
                          <>
                            <FaPaperPlane />
                            {replyingTo ? 'Post Reply' : 'Post Answer'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Answer List */}
              {answers.length > 0 ? (
  <div className="space-y-3">
    {answers.map((answer) => {
      // ✅ ADD DEBUG LOG HERE
      console.log('🔍 Rendering answer:', {
        answerId: answer.id,
        isQuestionAuthor: question?.userId === currentUserId,
        currentUserId,
        questionUserId: question?.userId
      });
      
      return (
        <AnswerCard
          key={answer.id}
          answer={answer}
          onReply={setReplyingTo}
          isQuestionAuthor={question?.userId === currentUserId}  // ✅ Ensure this is correct
          currentUserId={currentUserId}
          onGiveThanks={handleGiveThanks}
          onRemoveThanks={handleRemoveThanks}
          canGiveThanks={(question?.thanksGivenCount || 0) < 2}
        />
      );
    })}
  </div>
) : (
                    <div className="p-8 bg-gray-900/30 border border-gray-800 rounded-xl text-center">
                      <FaRegCommentDots className="text-4xl text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">
                        No answers yet. Be the first to answer!
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </motion.div>
      </div>
    );
  }
);
QuestionThreadModal.displayName = "QuestionThreadModal";

// ============================================
// ANSWER CARD
// ============================================

const AnswerCard = memo(({ 
  answer, 
  onReply, 
  depth = 0,
  isQuestionAuthor = false,
  currentUserId = '',
  onGiveThanks,
  onRemoveThanks,
  canGiveThanks = true,
}: { 
  answer: AnswerData; 
  onReply?: (answer: AnswerData) => void;
  depth?: number;
  isQuestionAuthor?: boolean;
  currentUserId?: string;
  onGiveThanks?: (answerId: string) => void;
  onRemoveThanks?: (answerId: string) => void;
  canGiveThanks?: boolean;
}) => {
  const maxDepth = 3;
  
  // ✅ ADD DEBUG LOGGING
  console.log('AnswerCard render:', {
    answerId: answer.id,
    answerUserId: answer.userId,
    currentUserId,
    isQuestionAuthor,
    isThanked: answer.isThanked,
    canGiveThanks,
    shouldShowThanksButton: isQuestionAuthor && !answer.isThanked && canGiveThanks && answer.userId !== currentUserId
  });;
  
  return (
    <div className={`${depth > 0 ? 'ml-8 mt-2' : ''}`}>
      <motion.div 
        className={`bg-gray-900/30 border rounded-xl p-4 transition-all ${
          answer.isThanked 
            ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-900/20 to-gray-900/30 shadow-lg shadow-yellow-500/10' // ✅ Unique highlight
            : 'border-gray-800 hover:border-red-500/20'
        }`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start gap-3">
          <img
            src={answer.userAvatar}
            alt={answer.userName}
            className="w-10 h-10 rounded-full border-2 border-red-500/30 flex-shrink-0"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-sm font-semibold text-white">
                {answer.userName}
              </span>
              
              {answer.isMentorAnswer && (
                <span className="px-2 py-0.5 bg-red-600/20 border border-red-500/30 rounded text-xs text-red-400 flex items-center gap-1">
                  <FaUserShield className="text-[10px]" />
                  Mentor
                </span>
              )}

              {/* ✅ UPDATED: Thanks Badge with Visual Feedback */}
              {answer.isThanked && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="relative group px-3 py-1 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full flex items-center gap-1.5 shadow-lg shadow-yellow-500/30"
                >
                  <span className="text-base">🙏</span>
                  <span className="text-xs font-black text-white">THANKS</span>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    <div className="bg-gray-900 border border-yellow-500/50 rounded-lg px-3 py-2 shadow-xl">
                      <p className="text-xs text-yellow-400 font-bold">
                        Thanked by question author
                      </p>
                      {answer.thankedAt && (
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(answer.thankedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-yellow-500/50" />
                  </div>
                </motion.div>
              )}
              
              <span className="text-xs text-gray-500">
                {new Date(answer.createdAt).toLocaleString()}
              </span>
              
              {answer.isAccepted && (
                <FaCheckCircle className="text-green-500 ml-auto" />
              )}
            </div>

            <p className="text-gray-300 whitespace-pre-wrap mb-3">{answer.content}</p>

            {/* Action buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <button className="text-xs text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1">
                <FaThumbsUp />
                {answer.upvoteCount > 0 && answer.upvoteCount}
              </button>
              
              {depth < maxDepth && onReply && (
                <button
                  onClick={() => onReply(answer)}
                  className="text-xs text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <FaReply />
                  Reply
                  {answer.replyCount > 0 && ` (${answer.replyCount})`}
                </button>
              )}

              {/* ✅ NEW: Give Thanks Button (only for question author) */}
              {isQuestionAuthor && !answer.isThanked && canGiveThanks && answer.userId !== currentUserId && onGiveThanks && (
                <motion.button
                  onClick={() => onGiveThanks(answer.id)}
                  className="ml-auto px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white text-xs font-bold rounded-lg transition-all hover:scale-105 flex items-center gap-1.5 shadow-lg shadow-yellow-500/30"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-sm">🙏</span>
                  Give Thanks
                </motion.button>
              )}

              {/* ✅ NEW: Remove Thanks Button */}
              {isQuestionAuthor && answer.isThanked && onRemoveThanks && (
                <button
                  onClick={() => onRemoveThanks(answer.id)}
                  className="ml-auto px-3 py-1.5 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white text-xs font-bold rounded-lg transition-all hover:scale-105 flex items-center gap-1.5 shadow-lg"
                >
                  <span className="text-sm">🗑️</span>
                  Remove Thanks
                </button>
              )}

              {/* ✅ Show remaining thanks count */}
              {isQuestionAuthor && !canGiveThanks && !answer.isThanked && (
                <span className="ml-auto text-xs text-gray-500 italic">
                  No thanks left (2/2 given)
                </span>
              )}
            </div>

            {answer.updatedAt && answer.updatedAt !== answer.createdAt && (
              <span className="text-xs text-gray-500 mt-2 block">
                Edited {new Date(answer.updatedAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Nested replies */}
      {answer.replies && answer.replies.length > 0 && (
        <div className="space-y-2 mt-2">
          {answer.replies.map((reply) => (
            <AnswerCard
              key={reply.id}
              answer={reply}
              onReply={onReply}
              depth={depth + 1}
              isQuestionAuthor={isQuestionAuthor} // ✅ Pass down
              currentUserId={currentUserId} // ✅ Pass down
              onGiveThanks={onGiveThanks} // ✅ Pass down
              onRemoveThanks={onRemoveThanks} // ✅ Pass down
              canGiveThanks={canGiveThanks} // ✅ Pass down
            />
          ))}
        </div>
      )}
    </div>
  );
});
AnswerCard.displayName = "AnswerCard";

// ============================================
// VIDEO TIMESTAMP SELECTOR
// ============================================

export const VideoTimestampSelector = memo(
  ({
    videoUrl,
    selectedTimestamp,
    onTimestampSelect,
  }: {
    videoUrl: string;
    selectedTimestamp: string;
    onTimestampSelect: (timestamp: string) => void;
  }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const formatTime = (seconds: number) => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);

      if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
          .toString()
          .padStart(2, "0")}`;
      }
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const handlePlayPause = () => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
      }
    };

    const handleMarkTimestamp = () => {
      if (videoRef.current) {
        const timestamp = formatTime(videoRef.current.currentTime);
        onTimestampSelect(timestamp);
      }
    };

    const handleTimeUpdate = () => {
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (videoRef.current) {
        setDuration(videoRef.current.duration);
      }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = parseFloat(e.target.value);
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        setCurrentTime(time);
      }
    };

    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="relative aspect-video bg-black">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Play/Pause Overlay */}
          <button
            onClick={handlePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 transition-colors group"
          >
            {isPlaying ? (
              <FaPause className="text-white text-5xl opacity-0 group-hover:opacity-100 transition-opacity" />
            ) : (
              <FaPlay className="text-white text-5xl opacity-100 group-hover:opacity-100 transition-opacity" />
            )}
          </button>

          {/* Timestamp Indicator */}
          {selectedTimestamp && (
            <div className="absolute top-4 left-4 px-3 py-2 bg-red-600 rounded-lg shadow-lg">
              <span className="text-white font-bold text-sm flex items-center gap-2">
                <FaMapMarkerAlt />
                {selectedTimestamp}
              </span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 space-y-3">
          {/* Progress Bar */}
          <div className="space-y-1">
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handlePlayPause}
              className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              {isPlaying ? (
                <FaPause className="text-white" />
              ) : (
                <FaPlay className="text-white" />
              )}
            </button>

            <button
              onClick={handleMarkTimestamp}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <FaMapMarkerAlt />
              Mark Current Time
            </button>

            {selectedTimestamp && (
              <button
                onClick={() => onTimestampSelect("")}
                className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                title="Clear timestamp"
              >
                <FaTimes className="text-white" />
              </button>
            )}
          </div>

          {selectedTimestamp && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-center">
              <span className="text-red-400 text-sm">
                Selected: {selectedTimestamp}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
);
VideoTimestampSelector.displayName = "VideoTimestampSelector";

// ============================================
// QUESTION THREAD VIEWER
// ============================================

export const QuestionThread = memo(
  ({ question, onClose }: { question: Question; onClose: () => void }) => {
    const [message, setMessage] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
      scrollToBottom();
    }, [question.messages]);

    const handleSendMessage = () => {
      if (message.trim()) {
        console.log("Sending message:", message);
        setMessage("");
        setReplyingTo(null);
      }
    };

    const handleReaction = (messageId: string, emoji: string) => {
      console.log("Adding reaction:", messageId, emoji);
    };

    const copyShareLink = () => {
      navigator.clipboard.writeText(question.shareableLink);
    };

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-full max-w-5xl h-[90vh] bg-gradient-to-br from-gray-900 to-black border border-red-500/30 rounded-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 flex-shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={question.userAvatar}
                    alt={question.userName}
                    className="w-10 h-10 rounded-full border-2 border-white/30"
                  />
                  <div>
                    <div className="text-white font-semibold">
                      {question.userName}
                    </div>
                    <div className="text-red-100 text-sm">
                      {new Date(question.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <h2 className="text-2xl font-black text-white mb-2">
                  {question.title}
                </h2>
                <div className="flex items-center gap-3 text-sm text-red-100">
                  <span className="flex items-center gap-1">
                    <FaVideo />
                    {question.lessonTitle}
                  </span>
                  {question.videoTimestamp && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <FaClock />
                        {question.videoTimestamp}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyShareLink}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                  title="Copy share link"
                >
                  <FaLink className="text-white" />
                </button>
                <button
                  onClick={onClose}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <FaTimes className="text-white text-xl" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 border-b border-gray-800 flex-shrink-0">
            <p className="text-white leading-relaxed mb-4">
              {question.content}
            </p>

            {question.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {question.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-red-600/10 border border-red-500/20 rounded-full text-sm text-red-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {question.messages.length === 0 ? (
              <div className="text-center py-12">
                <FaRegCommentDots className="text-5xl text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500">
                  No answers yet. Be the first to help!
                </p>
              </div>
            ) : (
              question.messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onReply={setReplyingTo}
                  onReaction={handleReaction}
                  currentUserId={MOCK_CURRENT_USER.id}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-800 p-4 flex-shrink-0">
            {replyingTo && (
              <div className="mb-2 px-4 py-2 bg-gray-900/50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  Replying to message
                </span>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <FaTimes />
                </button>
              </div>
            )}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type your answer..."
                  className="w-full px-4 py-3 pr-24 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition-colors"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                    <FaSmile className="text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                    <FaPaperclip className="text-gray-400" />
                  </button>
                </div>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-700 disabled:to-gray-800 text-white font-bold rounded-xl transition-all disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FaPaperPlane />
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
QuestionThread.displayName = "QuestionThread";

// ============================================
// ONLINE USERS LIST
// ============================================

export const OnlineUsersList = memo(
  ({
    users,
    currentUserId,
    onMention,
    onUserClick,
  }: {
    users: User[];
    currentUserId: string;
    onMention: (userId: string) => void;
    onUserClick?: (userId: string) => void;
  }) => {
    // ✅ FIX: Use useMemo to ensure updates propagate
    const { onlineUsers, offlineUsers } = useMemo(() => {
      const online = users.filter((u) => u.isOnline && u.id !== currentUserId);
      const offline = users.filter(
        (u) => !u.isOnline && u.id !== currentUserId
      );
      return { onlineUsers: online, offlineUsers: offline };
    }, [users, currentUserId]); // ✅ Recalculate when users array changes

    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-white font-bold flex items-center gap-2">
            <FaUsers className="text-red-500" />
            Online ({onlineUsers.length})
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="relative" style={{ overflow: "visible" }}>
            {onlineUsers.length > 0 && (
              <div className="space-y-2">
                {onlineUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => onUserClick?.(user.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-900/50 transition-colors group"
                  >
                    <div className="relative">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full border-2 border-gray-800 group-hover:border-red-500/50 transition-colors"
                      />
                      {/* ✅ FIX: Green dot for online users */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-950 animate-pulse" />
                      {user.role === "mentor" && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                          <FaUserShield className="text-black text-[8px]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors flex items-center gap-2">
                        {user.name}
                        {(() => {
                          const userAnalytics = MOCK_USER_ANALYTICS.find(
                            (a) => a.userId === user.id
                          );
                          if (
                            user.role === "mentor" &&
                            userAnalytics?.mentorBadge
                          ) {
                            return (
                              <MentorBadgeDisplay
                                badge={userAnalytics.mentorBadge}
                                size="sm"
                                showLabel={false}
                              />
                            );
                          } else if (userAnalytics?.currentBadge) {
                            return (
                              <AnimatedBadge
                                badge={userAnalytics.currentBadge}
                                size="sm"
                              />
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="text-xs text-green-400 flex items-center gap-1 font-bold">
                        <FaCircle className="text-[6px] animate-pulse" />
                        Online now
                      </div>
                    </div>
                    {user.isTyping && (
                      <div className="flex gap-0.5">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                        <div
                          className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <div
                          className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"
                          style={{ animationDelay: "0.4s" }}
                        />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {offlineUsers.length > 0 && (
              <div className="space-y-2 mt-4">
                <div className="text-xs text-gray-500 font-semibold px-2">
                  OFFLINE ({offlineUsers.length})
                </div>
                {offlineUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => onUserClick?.(user.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-900/50 transition-colors group"
                  >
                    <div className="relative">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full border-2 border-gray-800 opacity-60 group-hover:opacity-100 transition-opacity"
                      />
                      {/* ✅ FIX: Gray dot for offline users */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gray-600 rounded-full border-2 border-gray-950" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-semibold text-gray-400 group-hover:text-white transition-colors">
                        {user.name}
                      </div>
                      {user.lastSeen && (
                        <div className="text-xs text-gray-600">
                          {Math.floor(
                            (Date.now() - user.lastSeen.getTime()) / 60000
                          )}
                          m ago
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);
OnlineUsersList.displayName = "OnlineUsersList";

// ============================================
// USER PROFILE MODAL - OPTIMIZED VERSION
// ============================================

export const UserProfileModal = memo(
  ({
    user,
    analytics,
    onClose,
  }: {
    user: User;
    analytics: UserAnalytics;
    onClose: () => void;
  }) => {
    const getAchievementTitle = () => {
      if (!analytics.courseCompleted) return null;

      if (analytics.courseCompletionRank === 1) {
        return {
          title: "1st Scaleever",
          color: "from-yellow-400 to-yellow-600",
          icon: "🥇",
          description: "First to complete the course!",
        };
      } else if (analytics.courseCompletionRank === 2) {
        return {
          title: "2nd Scaleever",
          color: "from-gray-300 to-gray-500",
          icon: "🥈",
          description: "Second to complete the course!",
        };
      } else if (analytics.courseCompletionRank === 3) {
        return {
          title: "3rd Scaleever",
          color: "from-orange-400 to-orange-600",
          icon: "🥉",
          description: "Third to complete the course!",
        };
      } else {
        return {
          title: "Crasher of Course",
          color: "from-red-500 to-red-700",
          icon: "💥",
          description: "Course completed!",
        };
      }
    };

    const achievement = getAchievementTitle();

    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };

    const getTimeSince = (date: Date) => {
      const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
      if (minutes < 1) return "Just now";
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    };

    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-2 xs:p-3 sm:p-4 bg-black/95 backdrop-blur-md overflow-hidden"
        onClick={onClose}
      >
        {/* Enhanced Background Effects */}
        <div className="absolute inset-0 z-0">
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-red-900/30 via-black to-red-900/20"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.div
            className="absolute inset-0 opacity-20"
            animate={{ opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              backgroundImage: `
              linear-gradient(rgba(239, 68, 68, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(239, 68, 68, 0.3) 1px, transparent 1px)
            `,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        {/* Corner Effects - Smaller */}
        <div className="absolute inset-0 z-[5] pointer-events-none">
          {[
            { corner: "top-left", classes: "top-0 left-0" },
            { corner: "top-right", classes: "top-0 right-0" },
            { corner: "bottom-left", classes: "bottom-0 left-0" },
            { corner: "bottom-right", classes: "bottom-0 right-0" },
          ].map(({ corner, classes }) => (
            <motion.div
              key={corner}
              className={`absolute w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 ${classes}`}
              animate={{
                boxShadow: [
                  "0 0 20px rgba(239,68,68,0.2)",
                  "0 0 40px rgba(239,68,68,0.4)",
                  "0 0 20px rgba(239,68,68,0.2)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div
                className={`w-full h-full border-red-500/40 ${
                  corner === "top-left"
                    ? "border-r border-b"
                    : corner === "top-right"
                    ? "border-l border-b"
                    : corner === "bottom-left"
                    ? "border-r border-t"
                    : "border-l border-t"
                }`}
              />
            </motion.div>
          ))}
        </div>

        {/* Main Modal Container - Reduced max-width and height */}
        <motion.div
          className="relative w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden z-20"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          {/* Background Layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-lg sm:rounded-xl md:rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-lg sm:rounded-xl md:rounded-2xl" />

          {/* Close Button - Smaller */}
          <motion.button
            onClick={onClose}
            className="absolute top-2 right-2 z-50 p-2 bg-gray-900/80 hover:bg-red-600/80 border border-red-500/30 rounded-lg transition-all group backdrop-blur-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaTimes className="text-white group-hover:text-white text-lg" />
          </motion.button>

          {/* Header Section - Reduced padding */}
          <motion.div
            className="relative flex-shrink-0 p-3 sm:p-4 md:p-5 border-b border-red-500/20"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              {/* Avatar - Smaller */}
              <motion.div
                className="relative flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-xl blur-lg opacity-60" />
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-red-500/40 shadow-xl"
                />

                {/* Status Badge - Smaller */}
                <motion.div
                  className="absolute -bottom-1 -right-1 flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-gray-900/95 to-black/95 border border-red-500/40 rounded-md backdrop-blur-sm shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  <FaCircle
                    className={`text-[6px] ${
                      user.isOnline
                        ? "text-green-400 animate-pulse"
                        : "text-gray-500"
                    }`}
                  />
                  <span className="text-[10px] font-black text-white">
                    {user.isOnline ? "ONLINE" : "OFFLINE"}
                  </span>
                </motion.div>
              </motion.div>

              {/* User Info - Smaller fonts */}
              <div className="flex-1 min-w-0">
                <motion.h2
                  className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-1 drop-shadow-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {user.name}
                </motion.h2>

                <motion.div
                  className="flex items-center gap-2 mb-2 flex-wrap"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="px-2 py-1 bg-gradient-to-r from-red-600/20 to-red-700/20 border border-red-500/40 rounded-md text-[10px] text-red-400 font-black uppercase tracking-wider backdrop-blur-sm">
                    {user.role}
                  </span>

                  {!user.isOnline && user.lastSeen && (
                    <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                      <FaRegClock className="text-red-500 text-[10px]" />
                      {getTimeSince(user.lastSeen)}
                    </span>
                  )}
                </motion.div>

                <motion.p
                  className="text-xs text-gray-400 font-medium flex items-center gap-1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <span className="text-red-500">🎓</span>
                  Enrolled {formatDate(analytics.enrollmentDate)}
                </motion.p>
              </div>
            </div>

            {/* Achievement Badge - Smaller */}
            {achievement && (
              <motion.div
                className={`mt-3 relative overflow-hidden rounded-lg sm:rounded-xl p-3 border border-white/20 shadow-lg`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${achievement.color}`}
                />
                <div className="absolute inset-0 bg-black/20" />

                <div className="relative flex items-center gap-3">
                  <motion.span
                    className="text-2xl sm:text-3xl flex-shrink-0 drop-shadow-lg"
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    {achievement.icon}
                  </motion.span>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-black text-white drop-shadow-md mb-0.5">
                      {achievement.title}
                    </h3>
                    <p className="text-xs text-white/90 font-medium">
                      {achievement.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Scrollable Content - Reduced padding and gaps */}
          <div className="relative flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 space-y-4 sm:space-y-5">
            {/* Learner Badges Section */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-lg sm:rounded-xl border border-red-500/30 backdrop-blur-2xl" />
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-lg sm:rounded-xl" />

              <div className="relative p-3 sm:p-4 md:p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <div className="p-1.5 bg-red-600/20 rounded-lg">
                      <FaStar className="text-red-500 text-sm" />
                    </div>
                    Learner Journey
                  </h3>

                  <motion.div
                    className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 rounded-lg border border-red-500/40 shadow-lg"
                    whileHover={{ scale: 1.05 }}
                  >
                    <FaFire className="text-white text-sm" />
                    <span className="text-white font-black text-sm">
                      {analytics.engagement.xp}
                    </span>
                    <span className="text-white/80 text-xs font-bold">
                      XP • Lvl {analytics.engagement.level}
                    </span>
                  </motion.div>
                </div>

                {/* Current Badge Showcase - Smaller */}
                <motion.div
                  className="relative mb-4 overflow-hidden rounded-lg sm:rounded-xl"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-black/90 border border-red-500/40" />
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600/5 to-transparent" />

                  <div className="relative p-3 sm:p-4">
                    <div className="flex items-center gap-3">
                      <AnimatedBadge badge={analytics.currentBadge} size="md" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base sm:text-lg font-black text-white mb-1">
                          {analytics.currentBadge.name}
                        </h4>
                        <p className="text-xs text-gray-300 mb-2">
                          {analytics.currentBadge.description}
                        </p>
                        {analytics.currentBadge.earnedDate && (
                          <p className="text-xs text-green-400 font-bold flex items-center gap-1">
                            <FaCheckCircle className="text-[10px]" />
                            Earned{" "}
                            {formatDate(analytics.currentBadge.earnedDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* All Badges Grid - Smaller */}
                <div className="mb-4">
                  <h4 className="text-[10px] font-black text-red-400 mb-3 uppercase tracking-wider">
                    All Badges
                  </h4>
                  <div className="relative" style={{ overflow: "visible" }}>
                    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 gap-3">
                      {analytics.allBadges.map((badge, idx) => (
                        <motion.div
                          key={badge.id}
                          className="flex flex-col items-center"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.7 + idx * 0.05 }}
                        >
                          <AnimatedBadge
                            badge={badge}
                            size="sm"
                            showProgress={
                              !badge.earned &&
                              idx ===
                                analytics.allBadges.findIndex((b) => !b.earned)
                            }
                          />
                          <p
                            className={`text-[9px] mt-1 text-center truncate w-full font-bold ${
                              badge.earned ? "text-white" : "text-gray-600"
                            }`}
                          >
                            {badge.name.split(" ")[0]}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Next Badge Progress - Smaller */}
                {analytics.nextBadge && (
                  <motion.div
                    className="relative overflow-hidden rounded-lg sm:rounded-xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-950/40 to-black border border-red-600/40" />

                    <div className="relative p-3">
                      <div className="flex items-start gap-3">
                        <AnimatedBadge
                          badge={analytics.nextBadge}
                          size="sm"
                          showProgress
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-black text-white mb-1 flex items-center gap-1">
                            <span className="text-sm">🎯</span>
                            Next: {analytics.nextBadge.name}
                          </h5>
                          <p className="text-[10px] text-gray-300 mb-2">
                            {analytics.nextBadge.requirement}
                          </p>

                          <div className="relative w-full h-2 bg-black rounded-full overflow-hidden border border-red-900/50">
                            <motion.div
                              className={`h-full bg-gradient-to-r ${analytics.nextBadge.color} rounded-full`}
                              initial={{ width: 0 }}
                              animate={{
                                width: `${analytics.nextBadge.progress}%`,
                              }}
                              transition={{ duration: 1, delay: 1 }}
                            />
                          </div>

                          <p className="text-[10px] text-red-400 font-bold mt-1">
                            {Math.round(analytics.nextBadge.progress || 0)}%
                            Complete
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Mentor Badge Section - Smaller */}
            {user.role === "mentor" && analytics.mentorBadge && (
              <motion.div
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-950/30 via-black to-black border border-yellow-600/50 rounded-lg sm:rounded-xl backdrop-blur-2xl" />
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent rounded-lg sm:rounded-xl" />

                <div className="relative p-3 sm:p-4 md:p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-yellow-600/20 rounded-lg">
                      <FaUserShield className="text-yellow-500 text-lg" />
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-transparent bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text">
                      VERIFIED EXPERT
                    </h3>
                  </div>

                  {/* Mentor Badge Display */}
                  <motion.div
                    className="relative mb-4 overflow-hidden rounded-lg sm:rounded-xl"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="absolute inset-0 bg-black/80 border border-yellow-600/40" />

                    <div className="relative p-3 sm:p-4">
                      <div className="flex items-center gap-3">
                        <MentorBadgeDisplay
                          badge={analytics.mentorBadge}
                          size="md"
                          showLabel={false}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg sm:text-xl font-black text-transparent bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text mb-1">
                            {analytics.mentorBadge.name}
                          </h4>
                          <p className="text-xs text-gray-300 mb-3">
                            {analytics.mentorBadge.description}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="px-2 py-1 bg-gradient-to-r from-yellow-600/40 to-amber-600/40 border border-yellow-500/50 rounded-md">
                              <span className="text-[10px] font-black text-yellow-400">
                                {analytics.mentorBadge.tier.toUpperCase()} TIER
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-green-400 text-xs font-bold">
                              <FaCheckCircle className="text-[10px]" />
                              VERIFIED
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Mentor Stats - Smaller */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      {
                        value: analytics.engagement.questionsAnswered,
                        label: "Students",
                        color: "from-yellow-950/50 to-black",
                        border: "border-yellow-600/30",
                        text: "text-yellow-400",
                      },
                      {
                        value: analytics.engagement.helpfulAnswers,
                        label: "Answers",
                        color: "from-purple-950/50 to-black",
                        border: "border-purple-600/30",
                        text: "text-purple-400",
                      },
                      {
                        value: analytics.totalModules,
                        label: "Courses",
                        color: "from-red-950/50 to-black",
                        border: "border-red-600/30",
                        text: "text-red-400",
                      },
                    ].map((stat, idx) => (
                      <motion.div
                        key={idx}
                        className={`bg-gradient-to-br ${stat.color} border ${stat.border} rounded-lg p-2.5 text-center`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.1 + idx * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <div
                          className={`text-xl sm:text-2xl font-black ${stat.text} mb-1`}
                        >
                          {stat.value}
                        </div>
                        <div className="text-[10px] text-gray-300 font-bold">
                          {stat.label}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Combined Progress & Stats Section - Smaller */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-lg sm:rounded-xl border border-red-500/30 backdrop-blur-2xl" />
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-lg sm:rounded-xl" />

              <div className="relative p-3 sm:p-4 md:p-5">
                {/* Progress Header */}
                <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <div className="p-1.5 bg-red-600/20 rounded-lg">
                      <FaChartLine className="text-red-500 text-sm" />
                    </div>
                    Course Progress
                  </h3>
                  <motion.span
                    className="text-2xl sm:text-3xl font-black text-white drop-shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 1.3 }}
                  >
                    {analytics.courseProgress}%
                  </motion.span>
                </div>

                {/* Progress Bar - Thinner */}
                <div className="relative w-full h-3 bg-black rounded-full overflow-hidden border border-red-900/50 shadow-inner mb-4">
                  <motion.div
                    className="h-full bg-gradient-to-r from-red-600 via-red-500 to-red-700 rounded-full relative overflow-hidden"
                    initial={{ width: 0 }}
                    animate={{ width: `${analytics.courseProgress}%` }}
                    transition={{ duration: 1.5, delay: 1.4 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-white/20"
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  </motion.div>
                </div>

                {/* Stats Grid - Smaller */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {[
                    {
                      icon: FaBook,
                      label: "Modules",
                      value: `${analytics.modulesCompleted}/${analytics.totalModules}`,
                      progress:
                        (analytics.modulesCompleted / analytics.totalModules) *
                        100,
                    },
                    {
                      icon: FaVideo,
                      label: "Videos",
                      value: `${analytics.videosCompleted}/${analytics.totalVideos}`,
                      progress:
                        (analytics.videosCompleted / analytics.totalVideos) *
                        100,
                    },
                    {
                      icon: FaClock,
                      label: "Watch Time",
                      value: analytics.totalWatchTime,
                      progress: null,
                    },
                    {
                      icon: analytics.courseCompleted
                        ? FaCheckCircle
                        : FaRegClock,
                      label: "Status",
                      value: analytics.courseCompleted
                        ? "Completed ✓"
                        : "In Progress",
                      progress: null,
                      isComplete: analytics.courseCompleted,
                    },
                  ].map((stat, idx) => (
                    <motion.div
                      key={idx}
                      className="relative overflow-hidden rounded-lg sm:rounded-xl"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.5 + idx * 0.1 }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-black/90 border border-red-600/30" />

                      <div className="relative p-2.5 sm:p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={`p-2 rounded-lg shadow-lg ${
                              stat.isComplete
                                ? "bg-gradient-to-br from-green-600 to-green-700"
                                : "bg-gradient-to-br from-red-600 to-red-700"
                            }`}
                          >
                            <stat.icon className="text-white text-sm" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-gray-400 font-bold uppercase">
                              {stat.label}
                            </p>
                            <p className="text-base sm:text-lg font-black text-white truncate">
                              {stat.value}
                            </p>
                          </div>
                        </div>

                        {stat.progress !== null && (
                          <div className="relative w-full h-1.5 bg-red-950/50 rounded-full overflow-hidden border border-red-900/50">
                            <motion.div
                              className="h-full bg-gradient-to-r from-red-600 to-red-700 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${stat.progress}%` }}
                              transition={{
                                duration: 1,
                                delay: 1.6 + idx * 0.1,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Combined Activity & Engagement Section - Smaller */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-black/90 rounded-lg sm:rounded-xl border border-red-600/30 backdrop-blur-2xl" />

              <div className="relative p-3 sm:p-4 md:p-5">
                <h3 className="text-base sm:text-lg font-black text-white mb-4 flex items-center gap-2">
                  <div className="p-1.5 bg-red-600/20 rounded-lg">
                    <FaFire className="text-red-500 text-sm" />
                  </div>
                  Activity & Engagement
                </h3>

                {/* Last Active Lesson - Smaller */}
                <motion.div
                  className="mb-4 p-3 rounded-lg bg-gray-900/40 border border-red-500/20"
                  whileHover={{ scale: 1.01 }}
                >
                  <h4 className="text-[10px] font-black text-red-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                    <FaPlay className="text-[8px]" />
                    Last Active Lesson
                  </h4>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400 font-bold">
                      {analytics.lastActiveLesson.moduleTitle}
                    </p>
                    <p className="text-sm font-black text-white">
                      {analytics.lastActiveLesson.lessonTitle}
                    </p>
                    <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                      <span className="text-red-500">📅</span>
                      {getTimeSince(analytics.lastActiveLesson.timestamp)}
                    </p>
                  </div>
                </motion.div>

                {/* Engagement Stats Grid - Smaller */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {[
                    {
                      value: analytics.engagement.discussionsStarted,
                      label: "Discussions",
                      color: "from-purple-950/50 to-black",
                      border: "border-purple-600/30",
                      text: "text-purple-400",
                    },
                    {
                      value: analytics.engagement.questionsAnswered,
                      label: "Answers",
                      color: "from-blue-950/50 to-black",
                      border: "border-blue-600/30",
                      text: "text-blue-400",
                    },
                    {
                      value: analytics.engagement.helpfulAnswers,
                      label: "Helpful",
                      color: "from-green-950/50 to-black",
                      border: "border-green-600/30",
                      text: "text-green-400",
                    },
                    {
                      value: analytics.engagement.consecutiveDaysActive,
                      label: "Streak",
                      color: "from-orange-950/50 to-black",
                      border: "border-orange-600/30",
                      text: "text-orange-400",
                    },
                    {
                      value: analytics.engagement.challengesSolved,
                      label: "Challenges",
                      color: "from-red-950/50 to-black",
                      border: "border-red-600/30",
                      text: "text-red-400",
                    },
                    {
                      value: analytics.engagement.level,
                      label: "Level",
                      color: "from-yellow-950/50 to-black",
                      border: "border-yellow-600/30",
                      text: "text-yellow-400",
                    },
                  ].map((stat, idx) => (
                    <motion.div
                      key={idx}
                      className={`bg-gradient-to-br ${stat.color} border ${stat.border} rounded-lg p-2.5 text-center`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.9 + idx * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <div
                        className={`text-xl sm:text-2xl font-black ${stat.text} mb-1`}
                      >
                        {stat.value}
                      </div>
                      <div className="text-[10px] text-gray-300 font-bold">
                        {stat.label}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }
);
UserProfileModal.displayName = "UserProfileModal";

<style jsx global>{`
  /* Existing styles... */

  /* Ensure tooltips can escape overflow containers */
  .badge-tooltip-container {
    position: relative;
    z-index: 9999;
  }

  /* Prevent badge containers from clipping tooltips */
  .badges-grid-container {
    overflow: visible !important;
  }

  /* User hover tooltips */
  .user-hover-tooltip {
    position: fixed !important;
    z-index: 9999 !important;
    pointer-events: none !important;
  }
`}</style>