// components/course-builder/ChatsComponents.tsx
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
  LazyMotion,
  domAnimation,
  m,
} from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useWebSocket } from "@/hooks/useWebSocket";
import { ChatAPI } from "@/lib/api/chat";
import { QuestionAPI } from "@/lib/api/questions";
import Cookies from "js-cookie";
import {
  TypingIndicator,
  AnimatedBadge,
  MentorBadgeDisplay,
  LiveMessageBubble,
  OnlineUsersList,
  EmojiPicker,
} from "@/components/course-builder/chats/ChatUIComponents";
import {
  QuestionCard,
  NewQuestionModal,
  QuestionThreadModal,
  UserProfileModal,
} from "@/components/course-builder/chats/ChatQuestionComponents";
import {
  User,
  LiveMessage,
  Question,
  Lesson,
  ModuleGroup,
  TypingUser,
  ViewMode,
  QuestionData,
  MOCK_CURRENT_USER,
  MOCK_USERS,
  MOCK_LIVE_MESSAGES,
  MOCK_QUESTIONS,
  MOCK_USER_ANALYTICS,
} from "@/components/course-builder/chats/types";
import {
  FaClock,
  FaPlay,
  FaCheckCircle,
  FaChevronRight,
  FaChevronDown,
  FaStar,
  FaDownload,
  FaLock,
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
  FaChevronLeft,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import AvatarGenerator from "@/components/settings/AvatarGenerator";

// ============================================
// PROFILE AVATAR COMPONENT (handles default avatars)
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
// RESPONSIVE SKELETON LOADING COMPONENTS
// ============================================

const SkeletonBox = memo(({ className = "" }: { className?: string }) => (
  <div className={`bg-gray-800/50 rounded animate-pulse ${className}`} />
));
SkeletonBox.displayName = "SkeletonBox";

const ChatLoadingSkeleton = memo(() => (
  <LazyMotion features={domAnimation}>
    <div className="w-full">
      {/* Mobile Loading (< 1024px) */}
      <div className="block lg:hidden">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-xl border border-red-500/30 backdrop-blur-2xl" />
          <div
            className="relative flex flex-col"
            style={{
              height: "calc(100vh - 140px)",
              maxHeight: "calc(100vh - 140px)",
            }}
          >
            {/* Mobile Header Skeleton */}
            <div className="p-3 sm:p-4 border-b border-gray-800 flex-shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <SkeletonBox className="h-6 w-32 mb-2 rounded-lg" />
                  <SkeletonBox className="h-3 w-20 rounded-lg" />
                </div>
                <div className="flex gap-2">
                  <SkeletonBox className="w-8 h-8 rounded-lg" />
                  <SkeletonBox className="w-8 h-8 rounded-lg" />
                </div>
              </div>
            </div>

            {/* Mobile Tabs Skeleton */}
            <div className="flex border-b border-gray-800 flex-shrink-0">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-1 p-3">
                  <SkeletonBox className="h-8 w-full rounded-lg" />
                </div>
              ))}
            </div>

            {/* Messages Skeleton */}
            <div className="flex-1 overflow-hidden p-3 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${
                    i % 2 === 0 ? "flex-row-reverse" : ""
                  }`}
                >
                  <SkeletonBox className="w-8 h-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 max-w-[75%]">
                    <SkeletonBox className="h-3 w-20 mb-2 rounded-lg" />
                    <SkeletonBox
                      className={`h-16 w-full rounded-xl ${
                        i % 2 === 0 ? "rounded-tr-none" : "rounded-tl-none"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Input Skeleton */}
            <div className="p-3 border-t border-gray-800 flex-shrink-0">
              <div className="flex gap-2">
                <SkeletonBox className="flex-1 h-10 rounded-lg" />
                <SkeletonBox className="w-16 h-10 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Loading (>= 1024px) */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-6">
        {/* LEFT SIDEBAR */}
        <div className="lg:col-span-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
            <div className="relative p-4">
              <SkeletonBox className="h-8 w-32 mb-4 rounded-lg" />
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <SkeletonBox key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CENTER CONTENT */}
        <div className="lg:col-span-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
            <div
              className="relative flex flex-col"
              style={{
                height: "calc(100vh - 120px)",
                maxHeight: "calc(100vh - 120px)",
              }}
            >
              <div className="p-4 border-b border-gray-800 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <SkeletonBox className="h-8 w-48 mb-2 rounded-lg" />
                    <SkeletonBox className="h-4 w-24 rounded-lg" />
                  </div>
                  <div className="flex gap-2">
                    <SkeletonBox className="w-10 h-10 rounded-xl" />
                    <SkeletonBox className="w-10 h-10 rounded-xl" />
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden p-4 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${
                      i % 2 === 0 ? "flex-row-reverse" : ""
                    }`}
                  >
                    <SkeletonBox className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 max-w-md">
                      <SkeletonBox className="h-4 w-24 mb-2 rounded-lg" />
                      <SkeletonBox
                        className={`h-20 w-full rounded-xl ${
                          i % 2 === 0 ? "rounded-tr-none" : "rounded-tl-none"
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-gray-800 flex-shrink-0">
                <div className="flex gap-3">
                  <SkeletonBox className="flex-1 h-12 rounded-xl" />
                  <SkeletonBox className="w-20 h-12 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="lg:col-span-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
            <div className="relative p-4">
              <SkeletonBox className="h-8 w-32 mb-4 rounded-lg" />
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <SkeletonBox className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <SkeletonBox className="h-4 w-24 mb-1 rounded-lg" />
                      <SkeletonBox className="h-3 w-16 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </LazyMotion>
));
ChatLoadingSkeleton.displayName = "ChatLoadingSkeleton";

// ============================================
// MAIN CHAT INTERFACE
// ============================================

interface ChatRoomProps {
  roomId?: string;
  courseId?: string;
  modules?: ModuleGroup[];
  currentLessonId?: string;
  currentModuleId?: string;
}

export const ChatRoom = memo(
  ({
    roomId: propRoomId,
    courseId,
    modules: propModules = [],
    currentLessonId,
    currentModuleId,
  }: ChatRoomProps) => {
    const searchParams = useSearchParams();
    const paramCourseId = searchParams.get("courseId");
    const finalCourseId = courseId || paramCourseId;

    // State
    const [roomId, setRoomId] = useState<string | null>(propRoomId || null);
    const [liveMessages, setLiveMessages] = useState<LiveMessage[]>([]);
    const [message, setMessage] = useState("");
    const [replyingTo, setReplyingTo] = useState<LiveMessage | null>(null);
    const [editingMessage, setEditingMessage] = useState<LiveMessage | null>(
      null
    );
    const [editContent, setEditContent] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [participants, setParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<"chat" | "questions" | "online">(
      "chat"
    );

    // Responsive state
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [viewportHeight, setViewportHeight] = useState(0);

    // Modules state
    const [modules, setModules] = useState<ModuleGroup[]>(propModules);
    const [modulesLoading, setModulesLoading] = useState(true);

    // Questions state
    const [questions, setQuestions] = useState<QuestionData[]>([]);
    const [questionsLoading, setQuestionsLoading] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<string | null>(
      null
    );
    const [isNewQuestionOpen, setIsNewQuestionOpen] = useState(false);
    const [questionFilters, setQuestionFilters] = useState({
      status: "all" as const,
      lesson: currentLessonId || "all",
      sort: "recent" as const,
    });

    const [expandedModules, setExpandedModules] = useState<Set<string>>(
      new Set(["module-1"])
    );
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<
      "all" | "open" | "answered" | "closed"
    >("all");
    const [selectedProfileUserId, setSelectedProfileUserId] = useState<
      string | null
    >(null);
    const [viewMode, setViewMode] = useState<ViewMode>("live-chat");

    // Refs
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLTextAreaElement | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const messagesContainerRef = useRef<HTMLDivElement | null>(null);

    // Get auth token
    const token = Cookies.get("auth-token") || "";

    // Detect device type and viewport
    useEffect(() => {
      const handleResize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        setIsMobile(width < 1024);
        setIsTablet(width >= 768 && width < 1024);
        setViewportHeight(height);
      };

      handleResize();
      window.addEventListener("resize", handleResize);
      window.addEventListener("orientationchange", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("orientationchange", handleResize);
      };
    }, []);

    // Handle mobile keyboard
    useEffect(() => {
      if (!isMobile) return;

      const handleFocus = () => {
        // Scroll to input when keyboard opens
        setTimeout(() => {
          inputRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }, 300);
      };

      const inputElement = inputRef.current;
      inputElement?.addEventListener("focus", handleFocus);

      return () => {
        inputElement?.removeEventListener("focus", handleFocus);
      };
    }, [isMobile]);

    // Fetch course modules
    useEffect(() => {
      const fetchModules = async () => {
        if (!finalCourseId || propModules.length > 0) {
          if (propModules.length > 0) {
            setModules(propModules);
            setModulesLoading(false);
          }
          return;
        }

        try {
          setModulesLoading(true);

          const response = await fetch(`/api/courses/${finalCourseId}/modules`);
          const data = await response.json();

          const transformedModules: ModuleGroup[] = data.modules.map(
            (module: any) => ({
              id: module.id,
              title: module.title,
              lessons: module.lessons.map((lesson: any) => ({
                id: lesson.id,
                title: lesson.title,
                duration: lesson.duration,
                moduleId: module.id,
                moduleTitle: module.title,
                videoUrl: lesson.videoUrl,
                questionCount: lesson.questionCount || 0,
              })),
              isExpanded: false,
            })
          );

          setModules(transformedModules);
        } catch (err) {
          console.error("Failed to fetch modules:", err);
        } finally {
          setModulesLoading(false);
        }
      };

      fetchModules();
    }, [finalCourseId, propModules]);

    // Initialize room
    useEffect(() => {
      const initializeRoom = async () => {
        if (!finalCourseId) {
          setError("No course ID provided");
          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          setError(null);

          const { room } = await ChatAPI.getOrCreateRoom(finalCourseId);
          setRoomId(room.id);

          const { messages: apiMessages } = await ChatAPI.fetchMessages({
            roomId: room.id,
          });
          const transformedMessages = apiMessages.map((msg: any) =>
            transformMessage(msg)
          );
          setLiveMessages(transformedMessages);

          const { participants: roomParticipants } =
            await ChatAPI.fetchParticipants({ roomId: room.id });
          setParticipants(roomParticipants);

          const currentParticipant = roomParticipants.find((p: any) => p.user);
          if (currentParticipant) {
            setCurrentUser({
              id: currentParticipant.userId,
              name:
                currentParticipant.user.name ||
                currentParticipant.user.username,
              username: currentParticipant.user.username,
              avatar:
                currentParticipant.user.avatar ||
                currentParticipant.user.img ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentParticipant.userId}`,
              avatarObject: currentParticipant.user.avatarObject || null,
              isOnline: true,
              role: currentParticipant.role,
            });
          }

          setLoading(false);
        } catch (err) {
          console.error("Failed to initialize chat:", err);
          setError("Failed to load chat room");
          setLoading(false);
        }
      };

      initializeRoom();
    }, [finalCourseId]);

    // Fetch questions
    useEffect(() => {
      if (roomId) {
        fetchQuestions();
      }
    }, [roomId, questionFilters]);

    const fetchQuestions = async () => {
      setQuestionsLoading(true);
      try {
        const params: any = { roomId };

        if (questionFilters.lesson !== "all") {
          params.lessonId = questionFilters.lesson;
        }
        if (questionFilters.status !== "all") {
          params.status = questionFilters.status;
        }

        const data = await QuestionAPI.fetchQuestions(params);

        let sorted = [...data.questions];
        if (questionFilters.sort === "recent") {
          sorted.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        } else if (questionFilters.sort === "popular") {
          sorted.sort((a, b) => b.upvoteCount - a.upvoteCount);
        } else if (questionFilters.sort === "unanswered") {
          sorted.sort((a, b) => (a.answerCount === 0 ? -1 : 1));
        }

        setQuestions(sorted);
      } catch (err) {
        console.error("Failed to fetch questions:", err);
        toast.error("Failed to load questions");
      } finally {
        setQuestionsLoading(false);
      }
    };

    // WebSocket handlers
    const handleNewMessage = useCallback((newMessage: any) => {
      setLiveMessages((prev) => {
        const exists = prev.find((m) => m.id === newMessage.id);
        if (exists) return prev;
        return [...prev, transformMessage(newMessage)];
      });
    }, []);

    const handleMessageEdited = useCallback((data: any) => {
      console.log("✏️ Client: Received edit event", data);

      setLiveMessages((prev) => {
        const updated = prev.map((msg) => {
          if (msg.id === data.messageId) {
            return {
              ...msg,
              content: data.content,
              edited: true,
              timestamp: msg.timestamp,
            };
          }
          return msg;
        });

        console.log("✅ Client: Messages updated after edit");
        return updated;
      });
    }, []);

    const handleMessageDeleted = useCallback((data: any) => {
      console.log("🗑️ Client: Received delete event", data);

      setLiveMessages((prev) => {
        const updated = prev.map((msg) => {
          if (msg.id === data.messageId) {
            return {
              ...msg,
              isDeleted: true,
              content: "[Message deleted]",
              timestamp: msg.timestamp,
            };
          }
          return msg;
        });

        console.log("✅ Client: Messages updated after delete");
        return updated;
      });
    }, []);

    const handleReactionUpdate = useCallback((data: any) => {
      console.log("📊 Reaction update:", data);

      setLiveMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === data.messageId) {
            const reactions = [...msg.reactions];
            const existingIndex = reactions.findIndex(
              (r) => r.emoji === data.emoji
            );

            if (data.added) {
              if (existingIndex >= 0) {
                if (!reactions[existingIndex].users.includes(data.userId)) {
                  reactions[existingIndex].users.push(data.userId);
                  reactions[existingIndex].count =
                    reactions[existingIndex].users.length;
                }
              } else {
                reactions.push({
                  emoji: data.emoji,
                  count: 1,
                  users: [data.userId],
                });
              }
            } else {
              if (existingIndex >= 0) {
                reactions[existingIndex].users = reactions[
                  existingIndex
                ].users.filter((u) => u !== data.userId);
                reactions[existingIndex].count =
                  reactions[existingIndex].users.length;

                if (reactions[existingIndex].users.length === 0) {
                  reactions.splice(existingIndex, 1);
                }
              }
            }

            return { ...msg, reactions };
          }
          return msg;
        })
      );
    }, []);

    const handleTyping = useCallback((data: any) => {
      if (data.isTyping) {
        setTypingUsers((prev) => {
          if (prev.find((u) => u.id === data.userId)) return prev;
          return [
            ...prev,
            {
              id: data.userId,
              name: data.username,
              timestamp: new Date(),
            },
          ];
        });

        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.id !== data.userId));
        }, 3000);
      } else {
        setTypingUsers((prev) => prev.filter((u) => u.id !== data.userId));
      }
    }, []);

    const handleUserOnline = useCallback((data: any) => {
      console.log("🟢 Client: User came online", data);

      setParticipants((prev) => {
        const existingIndex = prev.findIndex((p) => p.userId === data.userId);

        const userData = data.userMetadata || {
          id: data.userId,
          username: data.username,
          name: data.name || data.username,
          img: data.avatar || data.img,
          avatar: data.avatar || data.img,
          avatarObject: data.avatarObject || null,
        };

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            isOnline: true,
            lastSeen: undefined,
            user: {
              ...updated[existingIndex].user,
              ...userData,
              img: userData.avatar || userData.img,
              avatar: userData.avatar,
              avatarObject: userData.avatarObject,
            },
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              userId: data.userId,
              isOnline: true,
              role: data.role || "student",
              user: userData,
              messagesCount: 0,
              joinedAt: new Date(),
            },
          ];
        }
      });
    }, []);

    const handleUserOffline = useCallback((data: any) => {
      console.log("⚫ Client: User went offline", data);

      setParticipants((prev) => {
        const updated = prev.map((p) => {
          if (p.userId === data.userId) {
            return {
              ...p,
              isOnline: false,
              lastSeen: new Date(data.timestamp),
              user: {
                ...p.user,
                ...(data.avatar && {
                  avatar: data.avatar,
                  img: data.avatar,
                }),
                ...(data.name && { name: data.name }),
              },
            };
          }
          return p;
        });

        console.log("✅ Client: Participants updated - user offline");
        return updated;
      });
    }, []);

    const handleError = useCallback((error: any) => {
      console.error("SSE error:", error);
      setError(error.message || "Connection error");
    }, []);

    const {
      isConnected,
      isRoomJoined,
      error: wsError,
      sendMessage: wsSendMessage,
      editMessage: wsEditMessage,
      deleteMessage: wsDeleteMessage,
      toggleReaction: wsToggleReaction,
      startTyping: wsStartTyping,
      stopTyping: wsStopTyping,
    } = useWebSocket({
      roomId: roomId || "",
      enabled: !!roomId,
      onMessage: handleNewMessage,
      onMessageEdited: handleMessageEdited,
      onMessageDeleted: handleMessageDeleted,
      onReaction: handleReactionUpdate,
      onTyping: handleTyping,
      onUserOnline: handleUserOnline,
      onUserOffline: handleUserOffline,
      onError: handleError,

      onQuestionNew: (data) => {
        console.log("📝 New question received:", data);
        setQuestions((prev) => {
          const exists = prev.find((q) => q.id === data.question.id);
          if (exists) return prev;
          return [data.question, ...prev];
        });
      },

      onQuestionUpvote: (data) => {
        console.log("👍 Question upvoted:", data);
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === data.questionId
              ? {
                  ...q,
                  upvoteCount: data.upvoteCount,
                  hasUpvoted: data.upvoted,
                }
              : q
          )
        );
      },

      onQuestionView: (data) => {
        console.log("👁️ Question viewed:", data);
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === data.questionId ? { ...q, viewCount: data.viewCount } : q
          )
        );
      },

      onQuestionAnswer: (data) => {
        console.log("💬 Question answered:", data);

        setQuestions((prev) =>
          prev.map((q) =>
            q.id === data.questionId
              ? {
                  ...q,
                  answerCount: data.answerCount,
                  status: data.status || q.status,
                }
              : q
          )
        );
      },

      onAnswerThanked: (data) => {
        console.log("🙏 Answer thanked:", data);
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === data.questionId
              ? {
                  ...q,
                  thanksGivenCount: data.thanksGivenCount,
                }
              : q
          )
        );
      },
    });

    // Message handlers
    const handleSendMessage = async () => {
      if (!message.trim() && !isRecording) return;
      if (!roomId) {
        setError("Chat room not ready");
        return;
      }

      const messageToSend = message;
      const replyingToMessage = replyingTo;

      setMessage("");
      setReplyingTo(null);
      setIsRecording(false);

      try {
        await wsSendMessage({
          content: messageToSend,
          replyToId: replyingToMessage?.id,
          messageType: isRecording ? "voice" : "text",
        });

        setError(null);
        wsStopTyping();
      } catch (err: any) {
        console.error("Failed to send message:", err);

        if (
          !err.message?.includes("Joining room") &&
          !err.message?.includes("queue")
        ) {
          setMessage(messageToSend);
          setReplyingTo(replyingToMessage);
          setError(err.message || "Failed to send message");
        } else {
          setError(null);
        }
      }
    };

    const handleReaction = async (messageId: string, emoji: string) => {
      try {
        await wsToggleReaction(messageId, emoji);
      } catch (err) {
        console.error("Failed to toggle reaction:", err);
      }
    };

    const handleEdit = async (messageId: string) => {
      const messageToEdit = liveMessages.find((m) => m.id === messageId);
      if (messageToEdit) {
        setEditingMessage(messageToEdit);
        setEditContent(messageToEdit.content);
      }
    };

    const handleSaveEdit = async () => {
      if (!editingMessage || !editContent.trim()) return;

      try {
        await wsEditMessage(editingMessage.id, editContent);
        setEditingMessage(null);
        setEditContent("");
        setError(null);
      } catch (err) {
        console.error("Failed to edit message:", err);
        setError("Failed to edit message");
      }
    };

    const handleCancelEdit = () => {
      setEditingMessage(null);
      setEditContent("");
    };

    const handleDelete = async (messageId: string) => {
      if (
        !confirm(
          "Are you sure you want to delete this message? This action cannot be undone."
        )
      ) {
        return;
      }

      try {
        await wsDeleteMessage(messageId);
        setError(null);
      } catch (err) {
        console.error("Failed to delete message:", err);
        setError("Failed to delete message");
      }
    };

    const handleMention = (userId: string) => {
      const user = participants.find((p) => p.userId === userId);
      if (user) {
        setMessage(`@${user.user.name || user.user.username} ${message}`);
        inputRef.current?.focus();

        // Close sidebar on mobile after mention
        if (isMobile && activeTab === "online") {
          setActiveTab("chat");
        }
      }
    };

    const handleUserClick = useCallback((userId: string) => {
      setSelectedProfileUserId(userId);
    }, []);

    const handleMessageChange = (value: string) => {
      setMessage(value);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (value.length > 0) {
        wsStartTyping();

        typingTimeoutRef.current = setTimeout(() => {
          wsStopTyping();
        }, 3000);
      } else {
        wsStopTyping();
      }
    };

    const transformMessage = (dbMessage: any): LiveMessage => {
      const parseTimestamp = (msg: any): Date => {
        const timestamp = msg.timestamp || msg.createdAt;

        if (!timestamp) {
          console.error("❌ Missing timestamp for message:", msg.id);
          return new Date();
        }

        try {
          if (timestamp instanceof Date && !isNaN(timestamp.getTime())) {
            return timestamp;
          }

          const parsed = new Date(timestamp);
          if (!isNaN(parsed.getTime())) {
            return parsed;
          }

          if (timestamp._seconds) {
            return new Date(timestamp._seconds * 1000);
          }

          console.error("❌ Could not parse timestamp:", timestamp);
          return new Date();
        } catch (error) {
          console.error("❌ Timestamp parsing error:", error);
          return new Date();
        }
      };

      const getUserData = () => {
        if (dbMessage.userMetadata) {
          return {
            avatar: dbMessage.userMetadata.avatar,
            name: dbMessage.userMetadata.name,
            role: dbMessage.userMetadata.role,
            metadata: dbMessage.userMetadata,
          };
        }

        const user = dbMessage.user;
        if (!user) {
          return {
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${dbMessage.userId}`,
            name: "Unknown User",
            role: "student",
            metadata: null,
          };
        }

        const primaryAvatar =
          user.avatars?.find((a: any) => a.isPrimary) || user.avatars?.[0];
        let avatar = user.img;

        if (primaryAvatar) {
          if (primaryAvatar.isCustomUpload && primaryAvatar.customImageUrl) {
            avatar = primaryAvatar.customImageUrl;
          } else {
            avatar = `https://api.dicebear.com/7.x/${primaryAvatar.avatarStyle}/svg?seed=${primaryAvatar.avatarSeed}&size=64`;
          }
        } else if (!avatar || !avatar.includes("http")) {
          avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;
        }

        return {
          avatar,
          name: user.name || user.username || "Unknown User",
          role: user.role || "student",
          metadata: null,
        };
      };

      const userData = getUserData();

      const transformReactions = (
        reactions: any[]
      ): Array<{ emoji: string; count: number; users: string[] }> => {
        if (!reactions || !Array.isArray(reactions)) {
          return [];
        }

        return reactions.map((r: any) => {
          let users: string[] = [];

          if (Array.isArray(r.users)) {
            users = r.users;
          } else if (r.userId) {
            users = [r.userId];
          } else if (r.user?.id) {
            users = [r.user.id];
          }

          return {
            emoji: r.emoji || "👍",
            count: r.count || users.length || 1,
            users: users,
          };
        });
      };

      const messageTimestamp = parseTimestamp(dbMessage);

      return {
        id: dbMessage.id,
        userId: dbMessage.userId,
        userName: userData.name,
        userAvatar: userData.avatar,
        userRole: userData.role,
        content: dbMessage.content,
        timestamp: messageTimestamp,
        reactions: transformReactions(dbMessage.reactions),
        mentions: dbMessage.mentions?.map((m: any) => m.mentionedUserId) || [],
        readBy: dbMessage.readReceipts?.map((rr: any) => rr.userId) || [],
        replyTo: dbMessage.replyTo
          ? transformMessage(dbMessage.replyTo)
          : undefined,
        isVoiceMessage: dbMessage.messageType === "voice",
        voiceDuration: dbMessage.voiceDuration?.toString(),
        edited: dbMessage.isEdited || dbMessage.edited || false,
        isDeleted: dbMessage.isDeleted || false,
        userMetadata: userData.metadata || undefined,
      };
    };

    const transformedUsers: User[] = useMemo(
      () =>
        participants.map((p) => {
          // ✅ FIX: Don't generate fallback avatars here
          // Let ProfileAvatar handle defaults
          const hasCustomImage = p.user?.img && p.user.img.startsWith("http");
          const hasAvatarObject =
            p.user?.avatarObject &&
            (p.user.avatarObject.isCustomUpload ||
              p.user.avatarObject.avatarIndex >= 0);

          return {
            id: p.userId,
            name: p.user?.name || p.user?.username || "Unknown",
            avatar: hasCustomImage ? p.user.img : null, // ✅ Only set if valid HTTP URL
            avatarObject: hasAvatarObject ? p.user.avatarObject : null, // ✅ Only set if valid
            isOnline: p.isOnline,
            lastSeen: p.lastSeen ? new Date(p.lastSeen) : undefined,
            role: p.role,
            isTyping: typingUsers.some((tu) => tu.id === p.userId),
            xp: p.user?.xp || 0,
            seekers: p.user?.seekers || 0,
            seeking: p.user?.seeking || 0,
            coursesMade: p.user?.coursesMade || 0,
            coursesLearning: p.user?.coursesLearning || 0,
            badges: p.user?.badges || [],
            bio: p.user?.bio || "",
            isPrivate: p.user?.isPrivate || false,
            username: p.user?.username || `user${p.userId.slice(0, 6)}`,
          };
        }),
      [participants, typingUsers]
    );

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [liveMessages]);

    const moduleGroups = useMemo((): ModuleGroup[] => {
      return modules.map((module) => ({
        ...module,
        isExpanded: expandedModules.has(module.id),
      }));
    }, [modules, expandedModules]);

    const toggleModule = useCallback((moduleId: string) => {
      setExpandedModules((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(moduleId)) {
          newSet.delete(moduleId);
        } else {
          newSet.add(moduleId);
        }
        return newSet;
      });
    }, []);

    const filteredQuestions = useMemo(() => {
      return questions.filter((q) => {
        const matchesSearch =
          q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (q.description?.toLowerCase() || "").includes(
            searchQuery.toLowerCase()
          );
        const matchesFilter =
          filterStatus === "all" || q.status === filterStatus;
        const matchesLesson =
          !selectedLesson || q.lessonId === selectedLesson.id;
        const matchesModule = !selectedModule || q.moduleId === selectedModule;
        const matchesUser = !selectedUser || q.userId === selectedUser;

        return (
          matchesSearch &&
          matchesFilter &&
          matchesLesson &&
          matchesModule &&
          matchesUser
        );
      });
    }, [
      searchQuery,
      filterStatus,
      selectedLesson,
      selectedModule,
      selectedUser,
      questions,
    ]);

    const selectedProfileUser = useMemo(() => {
      if (!selectedProfileUserId) return null;
      return (
        transformedUsers.find((u) => u.id === selectedProfileUserId) ||
        (selectedProfileUserId === currentUser?.id ? currentUser : null)
      );
    }, [selectedProfileUserId, transformedUsers, currentUser]);

    const selectedProfileAnalytics = useMemo(() => {
      if (!selectedProfileUserId) return null;
      return MOCK_USER_ANALYTICS.find(
        (a) => a.userId === selectedProfileUserId
      );
    }, [selectedProfileUserId]);

    const handleQuestionReaction = (messageId: string, emoji: string) => {
      console.log("Adding reaction:", messageId, emoji);
    };

    const handleCreateQuestion = useCallback((question: QuestionData) => {
      console.log("✅ Question created locally:", question);

      setQuestions((prev) => {
        const exists = prev.find((q) => q.id === question.id);
        if (exists) {
          console.log("⚠️ Question already exists in state");
          return prev;
        }

        console.log("➕ Adding new question to state");
        return [question, ...prev];
      });

      setIsNewQuestionOpen(false);
      toast.success("Question posted successfully! 🎉");
    }, []);

    const handleUpvoteQuestion = useCallback(
      async (questionId: string) => {
        if (!currentUser) return;

        console.log("👍 Upvoting question:", questionId);

        setQuestions((prev) =>
          prev.map((q) => {
            if (q.id === questionId) {
              const wasUpvoted = q.hasUpvoted;
              return {
                ...q,
                hasUpvoted: !wasUpvoted,
                upvoteCount: wasUpvoted ? q.upvoteCount - 1 : q.upvoteCount + 1,
              };
            }
            return q;
          })
        );

        try {
          const response = await QuestionAPI.toggleUpvote(questionId);

          if (response?.question) {
            setQuestions((prev) =>
              prev.map((q) =>
                q.id === questionId
                  ? {
                      ...q,
                      upvoteCount: response.question.upvoteCount,
                      hasUpvoted: response.question.hasUpvoted,
                    }
                  : q
              )
            );
          }

          console.log("✅ Upvote synced with server");
        } catch (err) {
          console.error("❌ Failed to upvote question:", err);

          setQuestions((prev) =>
            prev.map((q) => {
              if (q.id === questionId) {
                const wasUpvoted = q.hasUpvoted;
                return {
                  ...q,
                  hasUpvoted: !wasUpvoted,
                  upvoteCount: wasUpvoted
                    ? q.upvoteCount - 1
                    : q.upvoteCount + 1,
                };
              }
              return q;
            })
          );

          toast.error("Failed to upvote question");
        }
      },
      [currentUser]
    );

    const handleAnswerQuestion = useCallback(
      async (questionId: string, content: string, parentAnswerId?: string) => {
        if (!currentUser) return;

        console.log("💬 Posting answer to question:", questionId);

        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId ? { ...q, answerCount: q.answerCount + 1 } : q
          )
        );

        try {
          const response = await QuestionAPI.createAnswer(
            questionId,
            content,
            parentAnswerId
          );

          console.log("✅ Answer created:", response);

          if (response?.answer) {
            setQuestions((prev) =>
              prev.map((q) =>
                q.id === questionId
                  ? {
                      ...q,
                      answerCount:
                        response.question?.answerCount || q.answerCount,
                      status: response.question?.status || q.status,
                    }
                  : q
              )
            );
          }

          toast.success("Answer posted successfully! 🎉");
        } catch (err) {
          console.error("❌ Failed to answer question:", err);

          setQuestions((prev) =>
            prev.map((q) =>
              q.id === questionId
                ? { ...q, answerCount: Math.max(0, q.answerCount - 1) }
                : q
            )
          );

          toast.error("Failed to post answer");
        }
      },
      [currentUser]
    );

    // Calculate dynamic heights
    const containerHeight = useMemo(() => {
      if (isMobile) {
        // Account for mobile browser UI
        return `${viewportHeight - 140}px`;
      }
      return "calc(100vh - 120px)";
    }, [isMobile, viewportHeight]);

    if (loading || modulesLoading) {
      return <ChatLoadingSkeleton />;
    }

    if (error && !roomId) {
      return (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center max-w-sm sm:max-w-md w-full">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-xl sm:rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
              <div className="relative p-6 sm:p-8">
                <FaExclamationTriangle className="text-red-500 text-4xl sm:text-5xl mx-auto mb-4" />
                <h3 className="text-white text-lg sm:text-xl font-bold mb-2">
                  Failed to Load Chat
                </h3>
                <p className="text-gray-400 text-sm mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors text-sm font-bold active:scale-95"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!currentUser) {
      return null;
    }

    return (
      <LazyMotion features={domAnimation}>
        {/* ✅ ADVANCED RESPONSIVE STYLES */}
        <style jsx global>{`
          /* ============================================
             CRITICAL: MESSAGE OVERFLOW FIX
             ============================================ */
          .message-content-wrapper {
            word-wrap: break-word;
            word-break: break-word;
            overflow-wrap: break-word;
            hyphens: auto;
            max-width: 100%;
            overflow: hidden;
          }

          /* Mobile message bubble constraints */
          @media (max-width: 640px) {
            .message-bubble {
              max-width: calc(
                100vw - 80px
              ) !important; /* Account for avatar + padding */
              min-width: 0;
            }

            .message-bubble-own {
              max-width: calc(
                100vw - 60px
              ) !important; /* Less space needed without avatar */
            }

            .message-content-wrapper {
              max-width: 100%;
              font-size: 14px;
              line-height: 1.5;
            }

            .message-content-wrapper pre,
            .message-content-wrapper code {
              max-width: 100%;
              overflow-x: auto;
              font-size: 12px;
            }

            .message-content-wrapper img {
              max-width: 100%;
              height: auto;
            }
          }

          /* Tablet constraints */
          @media (min-width: 641px) and (max-width: 1023px) {
            .message-bubble {
              max-width: 70% !important;
            }

            .message-content-wrapper {
              font-size: 15px;
            }
          }

          /* Desktop constraints */
          @media (min-width: 1024px) {
            .message-bubble {
              max-width: 600px !important;
            }
          }

          /* ============================================
             RESPONSIVE HEIGHT SYSTEM
             ============================================ */
          .chat-container-responsive {
            height: calc(100dvh - 140px);
            max-height: calc(100dvh - 140px);
            min-height: 400px;
          }

          @media (min-width: 640px) {
            .chat-container-responsive {
              height: calc(100vh - 140px);
              max-height: calc(100vh - 140px);
            }
          }

          @media (min-width: 1024px) {
            .chat-container-responsive {
              height: calc(100vh - 120px);
              max-height: calc(100vh - 120px);
            }
          }

          /* Support for iOS Safari */
          @supports (-webkit-touch-callout: none) {
            .chat-container-responsive {
              height: -webkit-fill-available;
              max-height: -webkit-fill-available;
            }
          }

          /* ============================================
             SCROLLBAR REMOVAL - ALL BROWSERS
             ============================================ */

          .no-scrollbar::-webkit-scrollbar,
          .hide-scrollbar::-webkit-scrollbar,
          .scrollbar-hide::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }

          .no-scrollbar,
          .hide-scrollbar,
          .scrollbar-hide {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
          }
          /* Fix for inline actions overflow */
          .message-bubble-container {
            position: relative;
            /* Don't clip the inline actions */
            overflow: visible !important;
          }

          /* Ensure parent containers don't clip */
          .messages-container {
            overflow-y: auto !important;
            overflow-x: visible !important;
          }

          /* Prevent inline actions from being cut off */
          @media (min-width: 1024px) {
            .message-bubble-container {
              /* Add padding to accommodate inline actions */
              padding-left: 60px;
              padding-right: 60px;
            }
          }

          /* Mobile: No extra padding needed */
          @media (max-width: 1023px) {
            .message-bubble-container {
              padding-left: 0.5rem;
              padding-right: 0.5rem;
            }
          }
          /* Messages container */
          .messages-container {
            position: relative;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            overscroll-behavior: contain;
          }

          .messages-container::-webkit-scrollbar {
            display: none !important;
          }

          /* ============================================
             MOBILE OPTIMIZATIONS
             ============================================ */
          @media (max-width: 1023px) {
            /* Prevent zoom on input focus */
            input[type="text"],
            input[type="search"],
            textarea,
            select {
              font-size: 16px !important;
            }

            /* Touch targets */
            button,
            a,
            [role="button"] {
              min-height: 44px;
              min-width: 44px;
            }

            /* Mobile safe areas */
            .mobile-safe-bottom {
              padding-bottom: max(env(safe-area-inset-bottom), 16px);
            }

            /* Improve tap response */
            * {
              -webkit-tap-highlight-color: transparent;
              touch-action: manipulation;
            }

            /* Fix mobile keyboard overlapping */
            .chat-input-container {
              position: sticky;
              bottom: 0;
              z-index: 100;
            }
          }

          /* ============================================
             SMOOTH ANIMATIONS
             ============================================ */
          * {
            -webkit-overflow-scrolling: touch;
          }

          @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }

          /* ============================================
             LOADING STATES
             ============================================ */
          @keyframes shimmer {
            0% {
              background-position: -1000px 0;
            }
            100% {
              background-position: 1000px 0;
            }
          }

          .animate-shimmer {
            animation: shimmer 2s infinite linear;
            background: linear-gradient(
              to right,
              #1f2937 0%,
              #374151 20%,
              #1f2937 40%,
              #1f2937 100%
            );
            background-size: 1000px 100%;
          }

          /* ============================================
             MODAL OVERLAY
             ============================================ */
          .modal-overlay {
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
          }

          .modal-overlay::-webkit-scrollbar {
            display: none !important;
          }

          /* ============================================
             GRID SYSTEM FIX
             ============================================ */
          .responsive-grid {
            display: grid;
            gap: 1rem;
            width: 100%;
          }

          @media (max-width: 1023px) {
            .responsive-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (min-width: 1024px) {
            .responsive-grid {
              grid-template-columns: minmax(200px, 1fr) minmax(0, 2fr) minmax(
                  200px,
                  1fr
                );
              gap: 1.5rem;
            }
          }

          /* ============================================
             PREVENT LAYOUT SHIFT
             ============================================ */
          .prevent-layout-shift {
            contain: layout style paint;
          }

          /* ============================================
             PERFORMANCE OPTIMIZATIONS
             ============================================ */
          .will-change-transform {
            will-change: transform;
          }

          .will-change-opacity {
            will-change: opacity;
          }

          /* GPU acceleration */
          .gpu-accelerate {
            transform: translateZ(0);
            backface-visibility: hidden;
            perspective: 1000px;
          }
        `}</style>

        <div className="w-full responsive-grid">
          {/* LEFT SIDEBAR - Desktop Only, Mobile Drawer */}
          <AnimatePresence>
            {(!isMobile || showMobileSidebar) && (
              <m.div
                initial={isMobile ? { x: -320 } : { opacity: 1 }}
                animate={isMobile ? { x: 0 } : { opacity: 1 }}
                exit={isMobile ? { x: -320 } : { opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className={`
        ${isMobile ? "fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[320px]" : ""}
      `}
              >
                {/* Mobile Backdrop */}
                {isMobile && (
                  <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm -z-10"
                    onClick={() => setShowMobileSidebar(false)}
                  />
                )}

                <div
                  className={`
        relative
        ${isMobile ? "h-full" : "chat-container-responsive"}
      `}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900/98 to-black/98 rounded-r-2xl lg:rounded-2xl border-r lg:border border-red-500/30 backdrop-blur-2xl shadow-2xl" />

                  <div className="relative h-full flex flex-col">
                    {/* Mobile Header */}
                    {isMobile && (
                      <div className="p-4 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
                        <h3 className="text-lg font-bold text-white">
                          Navigation
                        </h3>
                        <button
                          onClick={() => setShowMobileSidebar(false)}
                          className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors active:scale-95"
                        >
                          <FaTimes className="text-gray-400" />
                        </button>
                      </div>
                    )}

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-4">
                      <div className="space-y-2 mb-6">
                        {/* Live Chat Button */}
                        <button
                          onClick={() => {
                            setViewMode("live-chat");
                            setActiveTab("chat"); // ✅ Set active tab for mobile
                            setSelectedModule(null);
                            setSelectedLesson(null);
                            setSelectedUser(null);
                            if (isMobile) setShowMobileSidebar(false);
                          }}
                          className={`w-full text-left p-3 sm:p-4 rounded-xl transition-all flex items-center gap-3 active:scale-98 ${
                            viewMode === "live-chat"
                              ? "bg-red-600/20 border-2 border-red-500 shadow-lg shadow-red-500/20"
                              : "bg-gray-900/50 border border-gray-800 hover:border-red-500/30 hover:bg-gray-900/70"
                          }`}
                        >
                          <div
                            className={`p-2 sm:p-3 rounded-xl transition-colors ${
                              viewMode === "live-chat"
                                ? "bg-red-500"
                                : "bg-gray-800"
                            }`}
                          >
                            <FaComments className="text-white text-base sm:text-xl" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-bold text-sm sm:text-base truncate">
                              Live Discussion
                            </div>
                            <div className="text-xs text-gray-400 truncate">
                              Real-time chat
                            </div>
                          </div>
                          {viewMode === "live-chat" && (
                            <FaCheckCircle className="text-red-500 text-lg flex-shrink-0" />
                          )}
                        </button>

                        {/* Ask Question Button */}
                        <button
                          onClick={() => {
                            setViewMode("ask-question");
                            setActiveTab("questions"); // ✅ Set active tab for mobile
                            if (isMobile) setShowMobileSidebar(false);
                          }}
                          className={`w-full text-left p-3 sm:p-4 rounded-xl transition-all flex items-center gap-3 active:scale-98 ${
                            viewMode === "ask-question"
                              ? "bg-red-600/20 border-2 border-red-500 shadow-lg shadow-red-500/20"
                              : "bg-gray-900/50 border border-gray-800 hover:border-red-500/30 hover:bg-gray-900/70"
                          }`}
                        >
                          <div
                            className={`p-2 sm:p-3 rounded-xl transition-colors ${
                              viewMode === "ask-question"
                                ? "bg-red-500"
                                : "bg-gray-800"
                            }`}
                          >
                            <FaQuestionCircle className="text-white text-base sm:text-xl" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-bold text-sm sm:text-base truncate">
                              Ask Question
                            </div>
                            <div className="text-xs text-gray-400 truncate">
                              Browse & ask
                            </div>
                          </div>
                          {viewMode === "ask-question" && (
                            <FaCheckCircle className="text-red-500 text-lg flex-shrink-0" />
                          )}
                        </button>
                      </div>

                      {/* Question Filters (when in question mode) */}
                      {viewMode === "ask-question" && (
                        <div className="space-y-4">
                          {/* Module List */}
                          <div className="space-y-2">
                            <div className="text-xs text-gray-500 font-semibold px-2 flex items-center gap-2 uppercase tracking-wide">
                              <FaBook className="text-red-500" />
                              COURSE CONTENT
                            </div>
                            {moduleGroups.map((module) => (
                              <div key={module.id}>
                                <button
                                  onClick={() => {
                                    toggleModule(module.id);
                                    setSelectedModule(module.id);
                                    setSelectedLesson(null);
                                    setSelectedUser(null);
                                  }}
                                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group active:scale-98 ${
                                    selectedModule === module.id &&
                                    !selectedLesson
                                      ? "bg-red-600/20 border border-red-500/30"
                                      : "bg-gray-900/50 border border-gray-800 hover:border-red-500/30"
                                  }`}
                                >
                                  <span className="text-white font-bold text-sm truncate flex-1">
                                    {module.title}
                                  </span>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-xs text-gray-500">
                                      {module.lessons.length}
                                    </span>
                                    <FaChevronDown
                                      className={`text-gray-400 transition-transform duration-200 ${
                                        module.isExpanded ? "rotate-180" : ""
                                      }`}
                                    />
                                  </div>
                                </button>

                                {/* Lessons List */}
                                <AnimatePresence>
                                  {module.isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="ml-2 mt-2 space-y-1">
                                        {module.lessons.map((lesson) => {
                                          const lessonQuestions =
                                            questions.filter(
                                              (q) => q.lessonId === lesson.id
                                            );

                                          return (
                                            <button
                                              key={lesson.id}
                                              onClick={() => {
                                                setSelectedLesson(
                                                  selectedLesson?.id ===
                                                    lesson.id
                                                    ? null
                                                    : lesson
                                                );
                                                setSelectedModule(module.id);
                                                setSelectedUser(null);
                                              }}
                                              className={`w-full text-left p-3 rounded-xl transition-all active:scale-98 ${
                                                selectedLesson?.id === lesson.id
                                                  ? "bg-red-600/20 border-2 border-red-500"
                                                  : "bg-gray-900/50 border border-gray-800 hover:border-red-500/30"
                                              }`}
                                            >
                                              <div className="flex items-start justify-between mb-1">
                                                <span className="text-white font-semibold text-sm line-clamp-2 flex-1 pr-2">
                                                  {lesson.title}
                                                </span>
                                                {lessonQuestions.length > 0 && (
                                                  <span className="px-2 py-0.5 bg-red-600/20 text-red-400 rounded-full text-xs font-bold flex-shrink-0">
                                                    {lessonQuestions.length}
                                                  </span>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                  <FaClock />
                                                  {lesson.duration}
                                                </span>
                                                <span>•</span>
                                                <span>
                                                  {lesson.questionCount}{" "}
                                                  questions
                                                </span>
                                              </div>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </m.div>
            )}
          </AnimatePresence>

          {/* CENTER CONTENT */}
          <div className="w-full min-w-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-xl sm:rounded-2xl border border-red-500/30 backdrop-blur-2xl" />

              <div
                className="relative flex flex-col overflow-hidden rounded-xl sm:rounded-2xl"
                style={{
                  height: containerHeight,
                  maxHeight: containerHeight,
                }}
              >
                {/* ✅ Mobile/Tablet Tab Navigation (< 1024px ONLY) */}
                <div className="lg:hidden flex border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm flex-shrink-0">
                  <button
                    onClick={() => setActiveTab("chat")}
                    className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 font-bold transition-all relative text-xs sm:text-sm active:scale-95 ${
                      activeTab === "chat"
                        ? "text-red-500 bg-red-600/10"
                        : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                    }`}
                    style={{ minHeight: "48px" }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <FaComments className="text-sm sm:text-base" />
                      <span className="hidden xs:inline">Chat</span>
                    </div>
                    {activeTab === "chat" && (
                      <m.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-red-600"
                      />
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab("questions")}
                    className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 font-bold transition-all relative text-xs sm:text-sm active:scale-95 ${
                      activeTab === "questions"
                        ? "text-red-500 bg-red-600/10"
                        : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                    }`}
                    style={{ minHeight: "48px" }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <FaQuestionCircle className="text-sm sm:text-base" />
                      <span className="hidden xs:inline">Questions</span>
                      {questions.filter((q) => q.status === "open").length >
                        0 && (
                        <span className="px-1.5 sm:px-2 py-0.5 bg-red-600 text-white text-[10px] sm:text-xs rounded-full">
                          {questions.filter((q) => q.status === "open").length}
                        </span>
                      )}
                    </div>
                    {activeTab === "questions" && (
                      <m.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-red-600"
                      />
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab("online")}
                    className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 font-bold transition-all relative text-xs sm:text-sm active:scale-95 ${
                      activeTab === "online"
                        ? "text-red-500 bg-red-600/10"
                        : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                    }`}
                    style={{ minHeight: "48px" }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <FaUsers className="text-sm sm:text-base" />
                      <span className="hidden xs:inline">Online</span>
                      <span className="text-[10px] sm:text-xs">
                        ({transformedUsers.filter((u) => u.isOnline).length})
                      </span>
                    </div>
                    {activeTab === "online" && (
                      <m.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-red-600"
                      />
                    )}
                  </button>
                </div>

                {/* ✅ DESKTOP: Always show CHAT content (no tabs) */}
                {/* ✅ MOBILE/TABLET: Show content based on active tab */}
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Show on Desktop OR when Chat tab is active on mobile */}
                  <div
                    className={`${
                      isMobile
                        ? activeTab === "chat"
                          ? "flex"
                          : "hidden"
                        : viewMode === "live-chat"
                        ? "flex"
                        : "hidden"
                    } flex-1 flex-col min-h-0`}
                  >
                    {/* CHAT CONTENT - Same as before */}
                    <m.div
                      key="chat"
                      initial={false}
                      className="flex-1 flex flex-col min-h-0"
                    >
                      {/* Header */}
                      <div className="relative z-10 p-3 sm:p-4 border-b border-gray-800 flex-shrink-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h2 className="text-base sm:text-lg md:text-2xl font-black text-white flex items-center gap-2 truncate">
                              <FaUsers className="text-red-500 text-sm sm:text-base md:text-xl flex-shrink-0" />
                              <span className="truncate">Live Discussion</span>
                            </h2>
                            <p className="text-gray-400 text-xs sm:text-sm mt-0.5 truncate">
                              {
                                transformedUsers.filter((u) => u.isOnline)
                                  .length
                              }{" "}
                              online
                              {!isConnected && (
                                <span className="ml-2 text-[10px] sm:text-xs text-yellow-400 inline-flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
                                  Reconnecting...
                                </span>
                              )}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            <button
                              className="p-2 sm:p-3 bg-gray-900/50 hover:bg-gray-800/50 border border-gray-800 rounded-lg sm:rounded-xl transition-colors active:scale-95"
                              disabled={!isConnected}
                              style={{ minHeight: "40px", minWidth: "40px" }}
                            >
                              <FaSearch className="text-gray-400 text-sm sm:text-base" />
                            </button>
                            <button
                              className="hidden sm:block p-3 bg-gray-900/50 hover:bg-gray-800/50 border border-gray-800 rounded-xl transition-colors active:scale-95"
                              disabled={!isConnected}
                            >
                              <FaVideo className="text-gray-400" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Messages Area */}
                      <div
                        ref={messagesContainerRef}
                        className="relative flex-1 overflow-y-auto no-scrollbar hide-scrollbar scrollbar-hide messages-container"
                        style={{
                          overflowX: "hidden",
                          WebkitOverflowScrolling: "touch",
                          overscrollBehavior: "contain",
                        }}
                      >
                        <div className="px-2 sm:px-3 md:px-4 py-3 sm:py-4 space-y-2 sm:space-y-3">
                          {liveMessages.map((msg) => (
                            <LiveMessageBubble
                              key={msg.id}
                              message={msg}
                              currentUserId={currentUser.id}
                              onReply={setReplyingTo}
                              onReaction={handleReaction}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              onMention={handleMention}
                              onUserClick={handleUserClick}
                            />
                          ))}

                          <TypingIndicator users={typingUsers} />
                          <div ref={messagesEndRef} />
                        </div>
                      </div>

                      {/* Input Area - Keep all existing code */}
                      <div className="relative z-10 border-t border-gray-800 p-2 sm:p-3 md:p-4 flex-shrink-0 bg-gray-900/50 mobile-safe-bottom chat-input-container">
                        {/* Edit Modal */}
                        <AnimatePresence>
                          {editingMessage && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                              onClick={handleCancelEdit}
                            >
                              <motion.div
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.9 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-gray-900 border border-red-500/30 rounded-2xl p-4 sm:p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto no-scrollbar"
                              >
                                <div className="flex items-center justify-between mb-4">
                                  <h3 className="text-lg sm:text-xl font-bold text-white">
                                    Edit Message
                                  </h3>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="text-gray-400 hover:text-white transition-colors active:scale-95 p-2"
                                  >
                                    <FaTimes />
                                  </button>
                                </div>

                                <textarea
                                  value={editContent}
                                  onChange={(e) =>
                                    setEditContent(e.target.value)
                                  }
                                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition-colors resize-none no-scrollbar"
                                  rows={4}
                                  autoFocus
                                />

                                <div className="flex gap-3 mt-4">
                                  <button
                                    onClick={handleCancelEdit}
                                    className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors active:scale-95 text-sm sm:text-base"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleSaveEdit}
                                    disabled={!editContent.trim()}
                                    className="flex-1 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-700 disabled:to-gray-800 text-white rounded-xl transition-colors disabled:cursor-not-allowed active:scale-95 text-sm sm:text-base"
                                  >
                                    Save Changes
                                  </button>
                                </div>
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Reply Preview */}
                        <AnimatePresence>
                          {replyingTo && (
                            <m.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="mb-2 sm:mb-3 px-3 sm:px-4 py-2 sm:py-3 bg-gray-900/50 border border-gray-800 rounded-lg sm:rounded-xl"
                            >
                              <div className="flex items-start justify-between gap-2 sm:gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="text-[10px] sm:text-xs text-gray-500 mb-1">
                                    Replying to{" "}
                                    <span className="text-red-400">
                                      {replyingTo.userName}
                                    </span>
                                  </div>
                                  <div className="text-xs sm:text-sm text-gray-400 line-clamp-2 break-words">
                                    {replyingTo.content}
                                  </div>
                                </div>
                                <button
                                  onClick={() => setReplyingTo(null)}
                                  className="text-gray-400 hover:text-white transition-colors p-1 active:scale-95 flex-shrink-0"
                                >
                                  <FaTimes className="text-xs sm:text-sm" />
                                </button>
                              </div>
                            </m.div>
                          )}
                        </AnimatePresence>

                        {/* Input Row */}
                        <div className="flex gap-2 sm:gap-3">
                          <div className="flex-1 relative min-w-0">
                            <textarea
                              ref={inputRef}
                              value={message}
                              onChange={(e) =>
                                handleMessageChange(e.target.value)
                              }
                              onKeyPress={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendMessage();
                                }
                              }}
                              placeholder="Type message..."
                              rows={1}
                              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-20 sm:pr-32 bg-gray-900/50 border border-gray-800 rounded-lg sm:rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition-colors resize-none text-sm sm:text-base no-scrollbar"
                              disabled={!isConnected}
                              style={{
                                minHeight: "44px",
                                maxHeight: "120px",
                                fontSize: "16px", // Prevent iOS zoom
                              }}
                            />

                            <div className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 flex gap-0.5 sm:gap-1">
                              <button
                                onClick={() =>
                                  setShowEmojiPicker(!showEmojiPicker)
                                }
                                className="p-1.5 sm:p-2 hover:bg-gray-800 rounded-lg transition-colors active:scale-95"
                                disabled={!isConnected}
                                style={{ minHeight: "36px", minWidth: "36px" }}
                              >
                                <FaSmile className="text-gray-400 text-sm sm:text-base" />
                              </button>
                              <button
                                className="hidden sm:block p-2 hover:bg-gray-800 rounded-lg transition-colors active:scale-95"
                                disabled={!isConnected}
                              >
                                <FaImage className="text-gray-400" />
                              </button>
                              <button
                                onClick={() => setIsRecording(!isRecording)}
                                className={`p-1.5 sm:p-2 rounded-lg transition-colors active:scale-95 ${
                                  isRecording
                                    ? "bg-red-600 text-white"
                                    : "hover:bg-gray-800 text-gray-400"
                                }`}
                                disabled={!isConnected}
                                style={{ minHeight: "36px", minWidth: "36px" }}
                              >
                                <FaMicrophone className="text-sm sm:text-base" />
                              </button>
                            </div>

                            {showEmojiPicker && (
                              <div className="absolute bottom-full right-0 mb-2 emoji-picker-container z-[10000]">
                                <EmojiPicker
                                  onSelect={(emoji) => {
                                    setMessage(message + emoji);
                                    setShowEmojiPicker(false);
                                    inputRef.current?.focus();
                                  }}
                                />
                              </div>
                            )}
                          </div>

                          <button
                            onClick={handleSendMessage}
                            disabled={
                              (!message.trim() && !isRecording) || !isConnected
                            }
                            className="px-3 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-700 disabled:to-gray-800 text-white font-bold rounded-lg sm:rounded-xl transition-all disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base flex-shrink-0 active:scale-95"
                            style={{ minHeight: "44px", minWidth: "44px" }}
                          >
                            <FaPaperPlane className="text-xs sm:text-sm" />
                            <span className="hidden xs:inline">Send</span>
                          </button>
                        </div>

                        {/* Status Messages */}
                        {!isConnected && (
                          <div className="mt-2 text-[10px] sm:text-xs text-yellow-400 flex items-center gap-1 sm:gap-2">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-500 rounded-full animate-pulse" />
                            Reconnecting...
                          </div>
                        )}

                        {isConnected && !isRoomJoined && (
                          <div className="mt-2 text-[10px] sm:text-xs text-blue-400 flex items-center gap-1 sm:gap-2">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-pulse" />
                            Joining room...
                          </div>
                        )}

                        {wsError &&
                          !wsError.includes("Joining") &&
                          !wsError.includes("queue") && (
                            <div className="mt-2 text-[10px] sm:text-xs text-red-400 flex items-center gap-1 sm:gap-2">
                              <FaExclamationTriangle className="flex-shrink-0" />
                              <span className="truncate">{wsError}</span>
                            </div>
                          )}

                        {isRecording && (
                          <div className="mt-2 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-red-400">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse" />
                            Recording...
                          </div>
                        )}
                      </div>
                    </m.div>
                  </div>

                  {/* ✅ MOBILE/TABLET ONLY: Questions Tab Content */}
                 {((isMobile && activeTab === "questions") || (!isMobile && viewMode === "ask-question")) && (
                    <m.div
                      key="questions"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 flex flex-col min-h-0 relative"
                    >
                      {/* ✅ HEADER WITH DESKTOP BUTTON */}
                      <div className="p-3 sm:p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm flex-shrink-0">
                        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                          {/* Title & Stats */}
                          <div className="flex flex-col gap-3 flex-1">
                            {/* Title */}
                            <div className="flex items-center gap-2">
                              <FaQuestionCircle className="text-red-500 text-lg sm:text-xl flex-shrink-0" />
                              <h3 className="text-base sm:text-lg font-bold text-white">
                                Questions & Answers
                              </h3>
                            </div>

                            {/* Stats Row */}
                            <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                              <span className="flex items-center gap-1.5">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                                <span className="font-semibold">
                                  {
                                    questions.filter((q) => q.status === "open")
                                      .length
                                  }{" "}
                                  Open
                                </span>
                              </span>
                              <span className="flex items-center gap-1.5">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <span className="font-semibold">
                                  {
                                    questions.filter(
                                      (q) => q.status === "answered"
                                    ).length
                                  }{" "}
                                  Answered
                                </span>
                              </span>
                              <span className="flex items-center gap-1.5">
                                <FaEye className="text-gray-500" />
                                <span className="font-semibold">
                                  {questions.length} Total
                                </span>
                              </span>
                            </div>
                          </div>

                          {/* ✅ DESKTOP BUTTON (Hidden on Mobile) */}
                          <motion.button
                            onClick={() => setIsNewQuestionOpen(true)}
                            className="hidden lg:flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl transition-all shadow-lg border border-red-500/30"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="p-1 bg-white/20 rounded-lg">
                              <FaPlus className="text-sm" />
                            </div>
                            <span>Ask Question</span>
                          </motion.button>
                        </div>
                      </div>

                      {/* Questions List */}
                      <div className="flex-1 overflow-y-auto no-scrollbar hide-scrollbar scrollbar-hide p-2 sm:p-4 space-y-2 sm:space-y-3 pb-20 lg:pb-4">
                        {questionsLoading ? (
                          <div className="flex items-center justify-center py-10 sm:py-20">
                            <div className="w-8 h-8 sm:w-12 sm:h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                          </div>
                        ) : questions.length > 0 ? (
                          questions.map((question) => (
                            <QuestionCard
                              key={question.id}
                              question={question}
                              onClick={() => setSelectedQuestion(question.id)}
                              onUpvote={handleUpvoteQuestion}
                            />
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center py-10 sm:py-20 text-center px-4">
                            <FaQuestionCircle className="text-4xl sm:text-6xl text-gray-700 mb-3 sm:mb-4" />
                            <p className="text-gray-400 text-base sm:text-lg mb-1 sm:mb-2">
                              No questions yet
                            </p>
                            <p className="text-gray-500 text-sm mb-4 sm:mb-6">
                              Be the first to ask a question!
                            </p>
                            <button
                              onClick={() => setIsNewQuestionOpen(true)}
                              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-lg sm:rounded-xl transition-all text-sm sm:text-base flex items-center gap-2 active:scale-95"
                              style={{ minHeight: "44px" }}
                            >
                              <FaPlus className="text-xs sm:text-sm" />
                              <span>Ask Question</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* ✅ MOBILE FAB (Hidden on Desktop) */}
                      <AnimatePresence>
                        {questions.length > 0 && (
                          <motion.button
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsNewQuestionOpen(true)}
                            className="lg:hidden fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 p-4 sm:p-5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-full shadow-2xl border-2 border-red-500/50 backdrop-blur-sm group"
                            style={{ minHeight: "56px", minWidth: "56px" }}
                          >
                            <FaPlus className="text-xl sm:text-2xl group-hover:rotate-90 transition-transform duration-300" />

                            {/* Tooltip */}
                            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 border border-red-500/30 rounded-lg text-sm font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              Ask Question
                            </span>
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </m.div>
                  )}

                  {/* ✅ MOBILE/TABLET ONLY: Online Tab Content */}
                  {isMobile && activeTab === "online" && (
                    <m.div
                      key="online"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 overflow-y-auto no-scrollbar hide-scrollbar scrollbar-hide p-2 sm:p-4"
                    >
                      <OnlineUsersList
                        users={transformedUsers}
                        currentUserId={currentUser.id}
                        onMention={handleMention}
                        onUserClick={handleUserClick}
                      />
                    </m.div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR - Desktop Only */}
          <div className="hidden lg:block">
            <div className="relative chat-container-responsive">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />

              <div className="relative h-full flex flex-col overflow-hidden rounded-2xl">
                {/* ✅ ALWAYS SHOW ONLINE USERS - Regardless of active tab */}
                <OnlineUsersList
                  users={transformedUsers}
                  currentUserId={currentUser.id}
                  onMention={handleMention}
                  onUserClick={handleUserClick}
                />
              </div>
            </div>
          </div>

          {/* Modals */}
          <AnimatePresence>
            {isNewQuestionOpen && roomId && (
              <NewQuestionModal
                isOpen={isNewQuestionOpen}
                onClose={() => setIsNewQuestionOpen(false)}
                modules={modules}
                roomId={roomId}
                onQuestionCreated={handleCreateQuestion}
              />
            )}

            {selectedQuestion && (
              <QuestionThreadModal
                questionId={selectedQuestion}
                isOpen={!!selectedQuestion}
                onClose={() => setSelectedQuestion(null)}
                onUpvote={handleUpvoteQuestion}
                onAnswer={handleAnswerQuestion}
              />
            )}

            {selectedProfileUser && selectedProfileAnalytics && (
              <UserProfileModal
                user={selectedProfileUser}
                analytics={selectedProfileAnalytics}
                onClose={() => setSelectedProfileUserId(null)}
              />
            )}
          </AnimatePresence>
        </div>
      </LazyMotion>
    );
  }
);

ChatRoom.displayName = "ChatRoom";

export const ChatInterface = ChatRoom;
