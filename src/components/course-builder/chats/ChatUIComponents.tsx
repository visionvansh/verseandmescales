"use client";

import React, {
  useState,
  useRef,
  useEffect,
  memo,
  useMemo,
  useCallback,
} from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  PanInfo,
} from "framer-motion";
import Cookies from "js-cookie";
import ChatUserHoverCard from "@/components/course-builder/chats/ChatUserHoverCard";
import { HoverCardPortal } from "./HoverCardPortal";
import { useUserHover } from "@/hooks/useUserHover";
import AvatarGenerator from "@/components/settings/AvatarGenerator";
import { MediaDisplay } from '@/components/course-builder/chats/MediaDisplay';
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
  FaAt,
  FaCopy,
  FaForward,
} from "react-icons/fa";
import {
  User,
  UserAnalytics,
  LearnerBadge,
  MentorBadge,
  LiveMessage,
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
import { format } from "date-fns";
import { detectDriveLinks, removeDriveLinksFromText } from '@/utils/driveUtils';
import { DriveDisplay } from './DriveDisplay';

// ============================================
// ENHANCED EMOJI PICKER WITH CATEGORIES
// ============================================

export const EmojiPicker = memo(
  ({ onSelect }: { onSelect: (emoji: string) => void }) => {
    const [activeCategory, setActiveCategory] = useState("popular");

    const emojiCategories = {
      popular: ["😀", "😂", "❤️", "🔥", "👍", "👏", "🎉", "💡"],
      smileys: [
        "😀",
        "😃",
        "😄",
        "😁",
        "😆",
        "😅",
        "🤣",
        "😂",
        "🙂",
        "🙃",
        "😉",
        "😊",
      ],
      gestures: [
        "👍",
        "👎",
        "👏",
        "🙌",
        "👊",
        "✊",
        "🤝",
        "🙏",
        "💪",
        "🤘",
        "🤙",
        "👌",
      ],
      hearts: [
        "❤️",
        "🧡",
        "💛",
        "💚",
        "💙",
        "💜",
        "🖤",
        "🤍",
        "🤎",
        "💕",
        "💖",
        "💗",
      ],
      objects: [
        "🔥",
        "⚡",
        "💡",
        "💎",
        "🎉",
        "🎊",
        "🎈",
        "🎁",
        "🏆",
        "🥇",
        "🌟",
        "✨",
      ],
    };

    const categories = [
      { id: "popular", label: "🌟", name: "Popular" },
      { id: "smileys", label: "😀", name: "Smileys" },
      { id: "gestures", label: "👍", name: "Gestures" },
      { id: "hearts", label: "❤️", name: "Hearts" },
      { id: "objects", label: "🎉", name: "Objects" },
    ];

    return (
      <div className="bg-gray-950 border-2 border-gray-800 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Category Tabs */}
        <div className="flex border-b border-gray-800 bg-gray-900/50 p-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-1 px-3 py-2 rounded-lg text-xl transition-all ${
                activeCategory === cat.id
                  ? "bg-red-600/20 scale-110"
                  : "hover:bg-gray-800/50 opacity-60"
              }`}
              title={cat.name}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Emoji Grid */}
        <div className="p-3 max-h-[50vh] overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-1 sm:gap-2">
            {emojiCategories[
              activeCategory as keyof typeof emojiCategories
            ].map((emoji, idx) => (
              <motion.button
                key={`${emoji}-${idx}`}
                onClick={() => onSelect(emoji)}
                className="text-2xl sm:text-3xl hover:scale-125 active:scale-95 transition-transform p-2 hover:bg-gray-800 rounded-xl relative group"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.95 }}
                style={{ minWidth: "44px", minHeight: "44px" }}
              >
                {emoji}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/0 via-red-500/20 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }
);
EmojiPicker.displayName = "EmojiPicker";

// ============================================
// INLINE QUICK ACTIONS (APPEARS ON HOVER/TAP)
// ============================================

export const InlineQuickActions = memo(
  ({
    onReply,
    onReact,
    onMore,
    isOwn = false,
  }: {
    onReply: () => void;
    onReact: () => void;
    onMore: () => void;
    isOwn?: boolean;
  }) => {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 5 }}
        transition={{ duration: 0.15 }}
        className={`flex items-center gap-1 bg-gray-900/95 backdrop-blur-md rounded-full px-2 py-1.5 shadow-2xl border border-gray-800 ${
          isOwn ? "flex-row-reverse" : ""
        }`}
      >
        <button
          onClick={onReact}
          className="p-2 hover:bg-gray-800 rounded-full transition-all active:scale-90 group"
          title="React"
        >
          <FaSmile className="text-gray-400 group-hover:text-yellow-400 transition-colors text-sm" />
        </button>

        <button
          onClick={onReply}
          className="p-2 hover:bg-gray-800 rounded-full transition-all active:scale-90 group"
          title="Reply"
        >
          <FaReply className="text-gray-400 group-hover:text-blue-400 transition-colors text-sm" />
        </button>

        <button
          onClick={onMore}
          className="p-2 hover:bg-gray-800 rounded-full transition-all active:scale-90 group"
          title="More options"
        >
          <FaEllipsisV className="text-gray-400 group-hover:text-white transition-colors text-sm" />
        </button>
      </motion.div>
    );
  }
);
InlineQuickActions.displayName = "InlineQuickActions";

// ============================================
// SWIPE ACTION INDICATOR - FIXED SNAP BACK
// ============================================

const SwipeActionIndicator = memo(
  ({
    direction,
    progress,
  }: {
    direction: "left" | "right";
    progress: number;
  }) => {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: Math.min(progress / 80, 1) }}
        className={`absolute top-0 bottom-0 w-16 flex items-center justify-center ${
          direction === "left" ? "right-full mr-2" : "left-full ml-2"
        }`}
      >
        <motion.div
          animate={{
            scale: progress > 60 ? [1, 1.2, 1] : 1,
            rotate: progress > 60 ? [0, 10, 0, -10, 0] : 0,
          }}
          transition={{ repeat: progress > 60 ? Infinity : 0, duration: 0.5 }}
          className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg"
        >
          <FaReply className="text-white text-lg" />
        </motion.div>
      </motion.div>
    );
  }
);
SwipeActionIndicator.displayName = "SwipeActionIndicator";

// ============================================
// PROFILE AVATAR COMPONENT
// ============================================

const ProfileAvatar = ({
  customImage,
  avatar,
  userId,
  size = 32,
  className = "",
}: {
  customImage?: string | null;
  avatar?: any | null;
  userId: string;
  size?: number;
  className?: string;
}) => {
  // ✅ 1. Custom uploaded HTTP image
  if (customImage && customImage.startsWith("http")) {
    return (
      <img
        src={customImage}
        alt="Profile"
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // ✅ 2. Avatar from avatarObject - custom upload
  if (avatar?.isCustomUpload && avatar.customImageUrl) {
    return (
      <img
        src={avatar.customImageUrl}
        alt="Profile"
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // ✅ 3. Generated avatar from avatarObject
  if (avatar && avatar.avatarIndex >= 0) {
    return (
      <AvatarGenerator
        userId={userId}
        avatarIndex={avatar.avatarIndex}
        size={size}
        style={(avatar.avatarStyle as "avataaars") || "avataaars"}
        className={className}
      />
    );
  }

  // ✅ 4. DEFAULT: Red user icon on white background
  // This handles ALL remaining cases:
  // - No customImage
  // - No avatarObject
  // - Invalid avatarObject data
  // - Dicebear URLs (which we ignore now)
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
// ============================================
// MESSAGE STATUS INDICATOR
// ============================================

const MessageStatus = memo(
  ({
    status,
    readBy,
  }: {
    status: "sending" | "sent" | "delivered" | "read";
    readBy?: string[];
  }) => {
    return (
      <div className="flex items-center gap-1">
        {status === "sending" && (
          <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
        )}
        {status === "sent" && <FaCheck className="text-gray-500 text-xs" />}
        {status === "delivered" && (
          <FaCheckDouble className="text-gray-500 text-xs" />
        )}
        {status === "read" && (
          <div className="flex items-center gap-0.5">
            <FaCheckDouble className="text-blue-400 text-xs" />
            {readBy && readBy.length > 0 && (
              <span className="text-[10px] text-blue-400">{readBy.length}</span>
            )}
          </div>
        )}
      </div>
    );
  }
);
MessageStatus.displayName = "MessageStatus";

// ============================================
// READ RECEIPT AVATARS
// ============================================

const ReadReceiptAvatars = memo(
  ({ users, max = 3 }: { users: User[]; max?: number }) => {
    const displayUsers = users.slice(0, max);
    const remaining = users.length - max;

    return (
      <div className="flex items-center -space-x-2">
        {displayUsers.map((user, idx) => (
          <img
            key={user.id}
            src={user.avatar}
            alt={user.name}
            className="w-5 h-5 rounded-full border-2 border-gray-900 hover:scale-110 transition-transform cursor-pointer"
            title={user.name}
            style={{ zIndex: max - idx }}
          />
        ))}
        {remaining > 0 && (
          <div className="w-5 h-5 rounded-full border-2 border-gray-900 bg-gray-800 flex items-center justify-center text-[8px] text-white font-bold">
            +{remaining}
          </div>
        )}
      </div>
    );
  }
);
ReadReceiptAvatars.displayName = "ReadReceiptAvatars";

// ============================================
// TYPING INDICATOR
// ============================================

export const TypingIndicator = memo(({ users }: { users: TypingUser[] }) => {
  if (users.length === 0) return null;

  const names = users.map((u) => u.name).join(", ");
  const text =
    users.length === 1 ? `${names} is typing` : `${names} are typing`;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-red-500 rounded-full"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
      <span className="text-sm text-gray-400">{text}</span>
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

        <div
          className="fixed opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[9999]"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 shadow-2xl backdrop-blur-sm whitespace-nowrap max-w-xs">
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
        <div
          className={`relative ${sizes[size].container} rounded-full bg-gradient-to-br ${badge.color} shadow-lg flex items-center justify-center border-2 border-yellow-300/50 transition-all group-hover:scale-110 group-hover:border-yellow-200`}
        >
          <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
          <span className={`${sizes[size].icon} relative z-10`}>
            {badge.icon}
          </span>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
            <FaUserShield className="text-white text-[8px]" />
          </div>
        </div>

        {showLabel && size !== "sm" && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <div
              className={`px-2 py-0.5 bg-gradient-to-r ${badge.color} rounded-full ${sizes[size].label} font-black text-white shadow-lg border border-yellow-300/30`}
            >
              {badge.name.toUpperCase()}
            </div>
          </div>
        )}

        <div
          className="fixed opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[9999]"
          style={{
            transform: "translate(-50%, calc(-100% - 8px))",
          }}
        >
          <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-yellow-500/50 rounded-lg px-4 py-3 shadow-2xl max-w-xs">
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
// ADVANCED MESSAGE BUBBLE - FIXED LAYOUT & OVERFLOW
// ============================================

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
    users = [],
  }: {
    message: LiveMessage;
    currentUserId: string;
    onReply: (message: LiveMessage) => void;
    onReaction: (messageId: string, emoji: string) => void;
    onEdit: (messageId: string) => void;
    onDelete: (messageId: string) => void;
    onMention: (userId: string) => void;
    onUserClick?: (userId: string) => void;
    users?: User[];
  }) => {
    // State
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const [showInlineActions, setShowInlineActions] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [messageStatus, setMessageStatus] = useState<
      "sending" | "sent" | "delivered" | "read"
    >("read");

    // ✅ DEBUG: Log incoming message data
    useEffect(() => {
      console.log('🎨 MESSAGE RENDER DEBUG:', {
        id: message.id,
        hasContent: !!message.content,
        contentLength: message.content?.length,
        messageType: message.messageType,
        hasMediaUrl: !!message.mediaUrl,
        mediaUrl: message.mediaUrl?.substring(0, 50),
        mediaType: message.mediaType,
        mediaFileName: message.mediaFileName,
        allKeys: Object.keys(message)
      });
    }, [message]);

    // Refs
    const messageRef = useRef<HTMLDivElement | null>(null);
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const touchStartTimeRef = useRef<number>(0);

    // Motion values for swipe
    const x = useMotionValue(0);
    const swipeProgress = useTransform(x, [0, 80], [0, 80]);

    const isOwn = message.userId === currentUserId;
    const isMentor = message.userRole === "mentor";
    const {
      showHoverCard,
      hoveredUser,
      hoverPosition,
      handleUserHover,
      handleUserLeave,
      keepHoverCardOpen,
    } = useUserHover();

    // Detect mobile
    useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 1024);
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Clean up timers
    useEffect(() => {
      return () => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
        }
      };
    }, []);

    // User data
    const messageUser: User = useMemo(() => {
      if (message.userMetadata) {
        return {
          ...message.userMetadata,
          avatar: message.userMetadata.avatar || message.userAvatar,
          isOnline: true,
        };
      }

      const userName = message.userName || "Unknown User";
      const username =
        userName.toLowerCase().replace(/\s+/g, "") ||
        message.userId ||
        "unknown";

      return {
        id: message.userId || "",
        name: userName,
        username: username,
        avatar:
          message.userAvatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.userId}`,
        avatarObject: null,
        isOnline: true,
        role: message.userRole || "student",
        xp: 0,
        seekers: 0,
        seeking: 0,
        coursesMade: 0,
        coursesLearning: 0,
        badges: [],
        bio: "",
        isPrivate: false,
      };
    }, [message]);

    // Format timestamp
    const formattedTime = useMemo(() => {
      try {
        if (!message.timestamp) return "now";

        const dateObj =
          message.timestamp instanceof Date
            ? message.timestamp
            : new Date(message.timestamp);
        if (isNaN(dateObj.getTime())) return "now";

        const now = new Date();
        const diffMs = now.getTime() - dateObj.getTime();
        const seconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (seconds < 30) return "now";
        if (seconds < 60) return `${seconds}s`;
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;

        return format(dateObj, "MMM d, HH:mm");
      } catch {
        return "now";
      }
    }, [message.timestamp]);

    // Read receipt users
    const readByUsers = useMemo(() => {
      if (!message.readBy || message.readBy.length === 0) return [];
      return users.filter(
        (u) => message.readBy?.includes(u.id) && u.id !== currentUserId
      );
    }, [message.readBy, users, currentUserId]);

    // Long press handlers
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
      touchStartTimeRef.current = Date.now();

      longPressTimerRef.current = setTimeout(() => {
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        setShowActionsMenu(true);
        setShowInlineActions(false);
      }, 500);
    }, []);

    const handleTouchEnd = useCallback(() => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }, []);

    const handleTouchMove = useCallback(() => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }, []);

    // Swipe handler
    const handleDragEnd = useCallback(
      (event: any, info: PanInfo) => {
        const threshold = 80;

        if (Math.abs(info.offset.x) > threshold) {
          onReply(message);
          if (navigator.vibrate) navigator.vibrate(30);
        }

        x.set(0);
      },
      [x, onReply, message]
    );

    // Quick actions handlers
    const handleQuickReact = useCallback(() => {
      setShowEmojiPicker(true);
      setShowInlineActions(false);
    }, []);

    const handleQuickReply = useCallback(() => {
      onReply(message);
      setShowInlineActions(false);
    }, [onReply, message]);

    const handleQuickMore = useCallback(() => {
      setShowActionsMenu(true);
      setShowInlineActions(false);
    }, []);

    // Copy message
    const handleCopy = useCallback(() => {
      navigator.clipboard.writeText(message.content);
      setShowActionsMenu(false);
      toast.success("Message copied!");
    }, [message.content]);

    // ✅ DETECT DRIVE LINKS IN TEXT CONTENT
    const driveLinksInText = useMemo(() => {
      if (!message.content || message.mediaUrl) return null;
      
      const links = detectDriveLinks(message.content);
      if (links.length === 0) return null;
      
      const cleanedText = removeDriveLinksFromText(message.content, links);
      
      return {
        links,
        cleanedText: cleanedText.trim(),
      };
    }, [message.content, message.mediaUrl]);

    if (message.isDeleted) {
      return (
        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-500 text-sm italic opacity-50">
          <FaTrash className="text-xs" />
          This message was deleted
        </div>
      );
    }

    return (
      <>
        {/* MATCH SKELETON LAYOUT STRUCTURE */}
        <motion.div
          ref={messageRef}
          className={`group relative ${isOwn ? "flex-row-reverse" : ""}`}
          style={{ x: isMobile && !isOwn ? x : 0 }}
          drag={isMobile && !isOwn ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={{ left: 0, right: 0.2 }}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          onHoverStart={() => !isMobile && setShowInlineActions(true)}
          onHoverEnd={() =>
            !isMobile &&
            !showEmojiPicker &&
            !showActionsMenu &&
            setShowInlineActions(false)
          }
          onTouchStart={isMobile ? handleTouchStart : undefined}
          onTouchEnd={isMobile ? handleTouchEnd : undefined}
          onTouchMove={isMobile ? handleTouchMove : undefined}
        >
          {/* Swipe indicator */}
          {isMobile && !isOwn && (
            <SwipeActionIndicator
              direction="right"
              progress={swipeProgress.get()}
            />
          )}

          {/* EXACT SKELETON STRUCTURE: flex gap-2 sm:gap-3 */}
          <div
            className={`flex gap-2 sm:gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
          >
            {/* Avatar - MATCH SKELETON: w-8 h-8 sm:w-10 sm:h-10 */}
            <div className="flex-shrink-0">
              <button
                onClick={() => onUserClick?.(message.userId)}
                onMouseEnter={(e) =>
                  !isMobile && handleUserHover(messageUser, e)
                }
                onMouseLeave={handleUserLeave}
                className="relative group/avatar"
              >
                <div className="relative">
                  <ProfileAvatar
                    customImage={messageUser.avatar}
                    avatar={message.userMetadata?.avatarObject}
                    userId={message.userId}
                    size={isMobile ? 32 : 40}
                    className={`border-2 transition-all cursor-pointer ${
                      isOwn
                        ? "border-red-500/50 group-hover/avatar:border-red-500 group-hover/avatar:scale-105"
                        : "border-gray-800 group-hover/avatar:border-red-500/50 group-hover/avatar:scale-105"
                    }`}
                  />

                  {messageUser.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-950" />
                  )}

                  {isMentor && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center border-2 border-gray-950 shadow-lg">
                      <FaUserShield className="text-black text-[8px]" />
                    </div>
                  )}
                </div>
              </button>
            </div>

            {/* Content - MATCH SKELETON: flex-1 max-w-[75%] sm:max-w-md */}
            <div
              className={`flex-1 max-w-[75%] sm:max-w-md ${
                isOwn ? "flex flex-col items-end" : ""
              }`}
            >
              {/* User header - MATCH SKELETON */}
              {!isOwn && (
                <div className="flex items-center gap-2 mb-2 px-1">
                  <button
                    onClick={() => onUserClick?.(message.userId)}
                    onMouseEnter={(e) =>
                      !isMobile && handleUserHover(messageUser, e)
                    }
                    onMouseLeave={handleUserLeave}
                    className="text-sm font-bold text-white hover:text-red-400 transition-colors truncate"
                  >
                    {messageUser.name}
                  </button>

                  {isMentor && (
                    <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black text-[8px] font-bold rounded-full uppercase shadow-lg">
                      MENTOR
                    </span>
                  )}

                  <span className="text-[10px] text-gray-500 ml-auto">
                    {formattedTime}
                  </span>
                </div>
              )}

              {/* Reply context */}
              {message.replyTo && (
                <div
                  className={`mb-2 px-3 py-2 rounded-xl border-l-4 ${
                    isOwn
                      ? "border-red-500/50 bg-red-900/10"
                      : "border-blue-500/50 bg-blue-900/10"
                  }`}
                >
                  <div className="text-[10px] text-gray-500 mb-1 flex items-center gap-1">
                    <FaReply className="text-[8px]" />
                    <span>{message.replyTo.userName}</span>
                  </div>
                  <div className="text-xs text-gray-400 line-clamp-2 break-words">
                    {message.replyTo.content}
                  </div>
                </div>
              )}

              {/* Message bubble - MATCH SKELETON: w-full with proper rounding */}
              <div className="relative w-full">
                <motion.div
                  className={`relative ${
                    isOwn
                      ? "bg-gradient-to-br from-red-600 to-red-700 rounded-xl rounded-tr-none"
                      : isMentor
                      ? "bg-gradient-to-br from-yellow-600/20 via-yellow-500/20 to-yellow-600/20 backdrop-blur-md border-2 border-yellow-500/40 rounded-xl rounded-tl-none"
                      : "bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-md border border-gray-700/50 rounded-xl rounded-tl-none"
                  } px-4 py-3 shadow-xl transition-all overflow-hidden`}
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                >
           
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                  {/* Content */}
                  <div className="relative z-10">
                    {/* ✅ DRIVE LINKS FROM TEXT */}
                    {driveLinksInText && driveLinksInText.links.length > 0 ? (
                      <div className="space-y-3">
                        {/* Render Drive previews */}
                        {driveLinksInText.links.map((link, index) => (
                          <DriveDisplay
                            key={index}
                            url={link.url}
                            fileName={`Google ${link.type.charAt(0).toUpperCase() + link.type.slice(1)}`}
                          />
                        ))}
                        
                        {/* Render remaining text if any */}
                        {driveLinksInText.cleanedText && (
                          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-white message-content-wrapper mt-2">
                            {driveLinksInText.cleanedText}
                          </p>
                        )}
                      </div>
                    ) : message.mediaUrl && message.mediaType ? (
                      // ✅ UPLOADED MEDIA (images, videos, PDFs, Drive uploads)
                      <div className="space-y-2 media-display-container">
                        <MediaDisplay
                          url={message.mediaUrl}
                          type={message.mediaType}
                          fileName={message.mediaFileName}
                          thumbnail={message.mediaThumbnail}
                          width={message.mediaWidth}
                          height={message.mediaHeight}
                        />
                        {message.content && message.content !== message.mediaFileName && (
                          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-white message-content-wrapper mt-2">
                            {message.content}
                          </p>
                        )}
                      </div>
                    ) : message.isVoiceMessage ? (
                      // ✅ VOICE MESSAGE
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <button className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors flex-shrink-0">
                          <FaPlay className="text-white text-sm ml-0.5" />
                        </button>
                        <div className="flex-1">
                          <div className="h-8 flex items-center gap-1">
                            {[...Array(20)].map((_, i) => (
                              <div
                                key={i}
                                className="w-1 bg-white/40 rounded-full transition-all hover:bg-white/60"
                                style={{
                                  height: `${Math.random() * 100 + 20}%`,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-white/60 font-mono">
                          {message.voiceDuration || "0:00"}
                        </span>
                      </div>
                    ) : (
                      // ✅ REGULAR TEXT
                      <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-white message-content-wrapper">
                        {message.content}
                      </p>
                    )}
                  </div>
                </motion.div>

                {/* FIXED INLINE ACTIONS POSITIONING */}
                <AnimatePresence>
                  {showInlineActions &&
                    !showEmojiPicker &&
                    !showActionsMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={`absolute top-1/2 -translate-y-1/2 z-[100] ${
                          isOwn ? "right-full mr-2" : "left-full ml-2"
                        }`}
                      >
                        <InlineQuickActions
                          onReply={handleQuickReply}
                          onReact={handleQuickReact}
                          onMore={handleQuickMore}
                          isOwn={isOwn}
                        />
                      </motion.div>
                    )}
                </AnimatePresence>
              </div>

              {/* Message footer */}
              <div
                className={`flex items-center gap-2 mt-1 px-1 text-[10px] ${
                  isOwn ? "flex-row-reverse" : ""
                }`}
              >
                {isOwn && (
                  <>
                    <span className="text-gray-500">{formattedTime}</span>
                    <MessageStatus
                      status={messageStatus}
                      readBy={message.readBy}
                    />
                    {message.edited && (
                      <span className="text-gray-500">(edited)</span>
                    )}
                  </>
                )}
              </div>

              {/* Reactions */}
              {message.reactions.length > 0 && (
                <div
                  className={`flex gap-1 mt-2 flex-wrap ${
                    isOwn ? "justify-end" : ""
                  }`}
                >
                  {message.reactions.map((reaction, idx) => {
                    const hasUserReacted =
                      reaction.users?.includes(currentUserId);
                    return (
                      <motion.button
                        key={idx}
                        onClick={() => onReaction(message.id, reaction.emoji)}
                        className={`px-2 py-1 rounded-full flex items-center gap-1.5 transition-all text-sm font-medium backdrop-blur-sm ${
                          hasUserReacted
                            ? "bg-red-600/30 border-2 border-red-500/50 shadow-lg shadow-red-500/20"
                            : "bg-gray-900/50 border border-gray-700 hover:bg-gray-800/70 hover:border-red-500/30"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="text-base">{reaction.emoji}</span>
                        <span
                          className={`text-xs ${
                            hasUserReacted ? "text-white" : "text-gray-400"
                          }`}
                        >
                          {reaction.count}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Read receipts */}
              {isOwn && readByUsers.length > 0 && (
                <div
                  className={`flex items-center gap-2 mt-2 ${
                    isOwn ? "justify-end" : ""
                  }`}
                >
                  <span className="text-[10px] text-gray-500">Seen by</span>
                  <ReadReceiptAvatars users={readByUsers} max={3} />
                </div>
              )}
            </div>
          </div>

          {/* Full Actions Menu - IMPROVED FOR MOBILE */}
          <AnimatePresence>
            {showActionsMenu && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
                  onClick={() => setShowActionsMenu(false)}
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-gray-950 border-2 border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                      <h3 className="text-white font-bold">Message Actions</h3>
                      <button
                        onClick={() => setShowActionsMenu(false)}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <FaTimes className="text-gray-400" />
                      </button>
                    </div>

                    <div className="p-2 space-y-1">
                      <button
                        onClick={handleQuickReact}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-900 rounded-xl transition-colors text-left"
                        style={{ minHeight: "44px" }}
                      >
                        <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                          <FaSmile className="text-yellow-400" />
                        </div>
                        <span className="text-white font-medium">
                          Add Reaction
                        </span>
                      </button>

                      <button
                        onClick={handleQuickReply}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-900 rounded-xl transition-colors text-left"
                        style={{ minHeight: "44px" }}
                      >
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                          <FaReply className="text-blue-400" />
                        </div>
                        <span className="text-white font-medium">Reply</span>
                      </button>

                      <button
                        onClick={handleCopy}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-900 rounded-xl transition-colors text-left"
                        style={{ minHeight: "44px" }}
                      >
                        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                          <FaCopy className="text-purple-400" />
                        </div>
                        <span className="text-white font-medium">
                          Copy Message
                        </span>
                      </button>

                      {isOwn && (
                        <>
                          <div className="h-px bg-gray-800 my-2" />

                          <button
                            onClick={() => {
                              onEdit(message.id);
                              setShowActionsMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-900 rounded-xl transition-colors text-left"
                            style={{ minHeight: "44px" }}
                          >
                            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                              <FaEdit className="text-green-400" />
                            </div>
                            <span className="text-white font-medium">Edit</span>
                          </button>

                          <button
                            onClick={() => {
                              onDelete(message.id);
                              setShowActionsMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-900/50 rounded-xl transition-colors text-left"
                            style={{ minHeight: "44px" }}
                          >
                            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                              <FaTrash className="text-red-400" />
                            </div>
                            <span className="text-white font-medium">
                              Delete
                            </span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Emoji Picker */}
          <AnimatePresence>
            {showEmojiPicker && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[10001] bg-black/60 backdrop-blur-sm"
                  onClick={() => setShowEmojiPicker(false)}
                />

                <HoverCardPortal>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="fixed z-[10002] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <EmojiPicker
                      onSelect={(emoji) => {
                        onReaction(message.id, emoji);
                        setShowEmojiPicker(false);
                        if (navigator.vibrate) navigator.vibrate(30);
                      }}
                    />
                  </motion.div>
                </HoverCardPortal>
              </>
            )}
          </AnimatePresence>
        </motion.div>

        {/* User Hover Card */}
        {!isMobile && showHoverCard && hoveredUser && (
          <HoverCardPortal>
            <div
              onMouseEnter={keepHoverCardOpen}
              onMouseLeave={handleUserLeave}
              style={{
                position: "fixed",
                left: `${hoverPosition.x}px`,
                top: `${hoverPosition.y}px`,
                zIndex: 10000,
                pointerEvents: "auto",
              }}
            >
              <ChatUserHoverCard
                user={hoveredUser}
                isVisible={showHoverCard}
                position={hoverPosition}
              />
            </div>
          </HoverCardPortal>
        )}
      </>
    );
  }
);

LiveMessageBubble.displayName = "LiveMessageBubble";

// ============================================
// MESSAGE BUBBLE FOR QUESTIONS (UNCHANGED)
// ============================================

export const MessageBubble = memo(
  ({
    message,
    onReply,
    onReaction,
    isReply = false,
    currentUserId,
    currentUser, // ✅ ADD THIS PROP
  }: {
    message: Message;
    onReply: (messageId: string) => void;
    onReaction: (messageId: string, emoji: string) => void;
    isReply?: boolean;
    currentUserId: string;
    currentUser?: User; // ✅ ADD THIS PROP TYPE
  }) => {
    const [showReactions, setShowReactions] = useState(false);
    const isCurrentUser = message.userId === currentUserId;
    const isMentor = message.isMentorAnswer;

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 1024);
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const commonEmojis = ["👍", "❤️", "🎉", "🔥", "✅", "🤔"];

    return (
      <div
        className={`flex gap-2 sm:gap-3 ${
          isReply ? "ml-8 sm:ml-12 mt-2" : ""
        } ${isCurrentUser ? "flex-row-reverse" : ""}`}
      >
        {!isCurrentUser && (
          <div className="flex-shrink-0">
            <ProfileAvatar
              customImage={message.userAvatar}
              avatar={null}
              userId={message.userId}
              size={isMobile ? 24 : 32}
              className="border-2 border-red-500/30"
            />
          </div>
        )}

        <div
          className={`flex-1 max-w-[85%] sm:max-w-2xl ${
            isCurrentUser ? "flex justify-end" : ""
          }`}
        >
          <div>
            {!isCurrentUser && (
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs sm:text-sm font-semibold text-white truncate">
                  {message.userName}
                </span>
                {isMentor && (
                  <span className="px-1.5 sm:px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black text-[8px] sm:text-[10px] font-bold rounded-full flex items-center gap-1 whitespace-nowrap">
                    <FaUserShield className="text-[6px] sm:text-[8px]" />
                    MENTOR
                  </span>
                )}
                <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
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
              } rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${
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

              <p className="text-white text-xs sm:text-sm leading-relaxed break-words">
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
                    className="p-1 sm:p-1.5 bg-gray-800/90 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <FaSmile className="text-gray-400 text-xs" />
                  </button>
                  {!isReply && (
                    <button
                      onClick={() => onReply(message.id)}
                      className="p-1 sm:p-1.5 bg-gray-800/90 hover:bg-gray-700 rounded-lg transition-colors"
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
                        className="text-lg sm:text-xl hover:scale-110 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {message.reactions.length > 0 && (
              <div className="flex gap-1 sm:gap-1.5 mt-2 flex-wrap">
                {message.reactions.map((reaction, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => onReaction(message.id, reaction.emoji)}
                    className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full flex items-center gap-1 sm:gap-1.5 transition-all text-xs sm:text-sm font-medium ${
                      reaction.users && reaction.users.includes(currentUserId)
                        ? "bg-red-600/30 border-2 border-red-500/50 shadow-lg shadow-red-500/20"
                        : "bg-gray-900/50 border border-gray-800 hover:bg-gray-800/70 hover:border-red-500/30"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-sm sm:text-base">
                      {reaction.emoji}
                    </span>
                    <span
                      className={`text-xs ${
                        reaction.users && reaction.users.includes(currentUserId)
                          ? "text-white"
                          : "text-gray-400"
                      }`}
                    >
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
                    currentUser={currentUser} // ✅ PASS IT DOWN
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ✅ FIX: Use currentUser prop instead of undefined 'user' */}
        {isCurrentUser && currentUser && (
          <div className="flex-shrink-0">
            <ProfileAvatar
              customImage={currentUser.avatar}
              avatar={currentUser.avatarObject}
              userId={currentUser.id}
              size={isMobile ? 32 : 40}
              className="border-2 border-gray-800 opacity-60 group-hover:opacity-100 transition-opacity"
            />
          </div>
        )}
      </div>
    );
  }
);
MessageBubble.displayName = "MessageBubble";

// ============================================
// ONLINE USERS LIST (UNCHANGED)
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
    const {
      showHoverCard,
      hoveredUser,
      hoverPosition,
      handleUserHover,
      handleUserLeave,
      keepHoverCardOpen,
    } = useUserHover();

    const [isMobile, setIsMobile] = useState(false);
    const [adjustedPosition, setAdjustedPosition] = useState({ x: 0, y: 0 });
    const hoverCardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 1024);
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // ✅ SMART POSITIONING: Prevent hover card from going off-screen
    useEffect(() => {
      if (!showHoverCard || !hoverCardRef.current) return;

      const card = hoverCardRef.current;
      const cardRect = card.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = hoverPosition.x;
      let adjustedY = hoverPosition.y;

      // Horizontal adjustment
      if (cardRect.right > viewportWidth - 20) {
        // Too far right - move left
        adjustedX = viewportWidth - cardRect.width - 20;
      } else if (cardRect.left < 20) {
        // Too far left - move right
        adjustedX = 20;
      }

      // Vertical adjustment
      if (cardRect.bottom > viewportHeight - 20) {
        // Too far down - position above
        adjustedY = hoverPosition.y - cardRect.height - 20;
      } else if (cardRect.top < 20) {
        // Too far up - position below
        adjustedY = 20;
      }

      setAdjustedPosition({ x: adjustedX, y: adjustedY });
    }, [showHoverCard, hoverPosition]);

    const validUsers = useMemo(
      () => users.filter((user) => user && user.id && user.name),
      [users]
    );

    const { onlineUsers, offlineUsers } = useMemo(() => {
      const online = validUsers.filter(
        (u) => u.isOnline && u.id !== currentUserId
      );
      const offline = validUsers.filter(
        (u) => !u.isOnline && u.id !== currentUserId
      );
      return { onlineUsers: online, offlineUsers: offline };
    }, [validUsers, currentUserId]);

    return (
      <>
        <div className="h-full flex flex-col">
          <div className="p-3 sm:p-4 border-b border-gray-800 flex-shrink-0">
            <h3 className="text-white font-bold flex items-center gap-2 text-sm sm:text-base">
              <FaUsers className="text-red-500" />
              Online ({onlineUsers.length})
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-2 sm:p-4 space-y-2 sm:space-y-4">
            <div className="relative" style={{ overflow: "visible" }}>
              {onlineUsers.length > 0 && (
                <div className="space-y-1 sm:space-y-2">
                  {onlineUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => onUserClick?.(user.id)}
                      onMouseEnter={(e) => {
                        if (!isMobile) {
                          handleUserHover(user, e);
                        }
                      }}
                      onMouseLeave={handleUserLeave}
                      className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-gray-900/50 transition-colors group"
                    >
                      <div className="relative flex-shrink-0">
                        <ProfileAvatar
                          customImage={user.avatar}
                          avatar={user.avatarObject}
                          userId={user.id}
                          size={isMobile ? 32 : 40}
                          className="border-2 border-gray-800 group-hover:border-red-500/50 transition-colors"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-gray-950 animate-pulse" />
                        {user.role === "mentor" && (
                          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                            <FaUserShield className="text-black text-[6px] sm:text-[8px]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-white group-hover:text-red-400 transition-colors flex items-center gap-1 sm:gap-2 truncate">
                          <span className="truncate">{user.name}</span>
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
                        <div className="text-[10px] sm:text-xs text-green-400 flex items-center gap-1 font-bold">
                          <FaCircle className="text-[4px] sm:text-[6px] animate-pulse" />
                          Online now
                        </div>
                      </div>
                      {user.isTyping && (
                        <div className="flex gap-0.5">
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-red-500 rounded-full animate-pulse" />
                          <div
                            className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-red-500 rounded-full animate-pulse"
                            style={{ animationDelay: "0.2s" }}
                          />
                          <div
                            className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-red-500 rounded-full animate-pulse"
                            style={{ animationDelay: "0.4s" }}
                          />
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMention(user.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 sm:p-1.5 hover:bg-red-500/10 rounded transition-all"
                        title="Mention user"
                      >
                        <FaAt className="text-red-400 text-xs" />
                      </button>
                    </button>
                  ))}
                </div>
              )}

              {offlineUsers.length > 0 && (
                <div className="space-y-1 sm:space-y-2 mt-3 sm:mt-4">
                  <div className="text-[10px] sm:text-xs text-gray-500 font-semibold px-2">
                    OFFLINE ({offlineUsers.length})
                  </div>
                  {offlineUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => onUserClick?.(user.id)}
                      onMouseEnter={(e) => {
                        if (!isMobile) {
                          handleUserHover(user, e);
                        }
                      }}
                      onMouseLeave={handleUserLeave}
                      className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-gray-900/50 transition-colors group"
                    >
                      <div className="relative flex-shrink-0">
                        <ProfileAvatar
                          customImage={user.avatar}
                          avatar={user.avatarObject}
                          userId={user.id}
                          size={isMobile ? 32 : 40}
                          className="border-2 border-gray-800 opacity-60 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gray-600 rounded-full border-2 border-gray-950" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-gray-400 group-hover:text-white transition-colors truncate">
                          {user.name}
                        </div>
                        {user.lastSeen && (
                          <div className="text-[10px] sm:text-xs text-gray-600">
                            {Math.floor((Date.now() - user.lastSeen.getTime()) / 60000)}m ago
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMention(user.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 sm:p-1.5 hover:bg-red-500/10 rounded transition-all"
                        title="Mention user"
                      >
                        <FaAt className="text-red-400 text-xs" />
                      </button>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ✅ FIXED POSITIONING: Hover card stays on screen */}
        {!isMobile && showHoverCard && hoveredUser && (
          <HoverCardPortal>
            <div
              ref={hoverCardRef}
              onMouseEnter={keepHoverCardOpen}
              onMouseLeave={handleUserLeave}
              style={{
                position: "fixed",
                left: `${adjustedPosition.x}px`,
                top: `${adjustedPosition.y}px`,
                zIndex: 10000,
                pointerEvents: "auto",
                transition: "left 0.1s ease, top 0.1s ease",
              }}
            >
              <ChatUserHoverCard
                user={hoveredUser}
                isVisible={showHoverCard}
                position={adjustedPosition}
              />
            </div>
          </HoverCardPortal>
        )}
      </>
    );
  }
);
OnlineUsersList.displayName = "OnlineUsersList";