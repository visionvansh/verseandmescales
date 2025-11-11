// components/types.ts
// ============================================
// TYPES
// ============================================

export interface User {
  id: string;
  name: string;
  username?: string;
  avatar: string;
  avatarObject?: {
    avatarIndex: number;
    avatarSeed: string;
    avatarStyle: string;
    isCustomUpload: boolean;
    customImageUrl?: string | null;
  } | null;
  customImageUrl?: string | null; // ✅ ADD THIS
  isOnline: boolean;
  lastSeen?: Date;
  role?: 'student' | 'mentor' | 'admin';
  isTyping?: boolean;
  
  xp?: number;
  seekers?: number;
  seeking?: number;
  coursesMade?: number;
  coursesLearning?: number;
  badges?: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
  }>;
  bio?: string;
  isPrivate?: boolean;
  coverImage?: string;
}

export interface UserAnalytics {
  userId: string;
  courseProgress: number; // percentage 0-100
  modulesCompleted: number;
  totalModules: number;
  videosCompleted: number;
  totalVideos: number;
  totalWatchTime: string; // e.g., "12h 34m"
  lastActiveLesson: {
    lessonId: string;
    lessonTitle: string;
    moduleTitle: string;
    timestamp: Date;
  };
  courseCompletionRank?: number; // 1, 2, 3, or undefined
  courseCompleted: boolean;
  enrollmentDate: Date;
  // Add these new fields:
  engagement: UserEngagement;
  currentBadge: LearnerBadge;
  allBadges: LearnerBadge[];
  nextBadge?: LearnerBadge;
  mentorBadge?: MentorBadge; // Add this for mentors only
}

export interface LearnerBadge {
  id: string;
  name: string;
  tier: 'rookie' | 'seeker' | 'sharer' | 'graduate';
  icon: string;
  color: string;
  glowColor: string;
  description: string;
  requirement: string;
  earned: boolean;
  earnedDate?: Date;
  progress?: number; // 0-100 for next badge
}

export interface MentorBadge {
  id: string;
  name: string;
  tier: 'master' | 'elite' | 'legendary';
  icon: string;
  color: string;
  glowColor: string;
  description: string;
  specialEffect?: 'sparkle' | 'pulse' | 'shine';
}

export interface UserEngagement {
  xp: number;
  level: number;
  discussionsStarted: number;
  questionsAnswered: number;
  helpfulAnswers: number;
  consecutiveDaysActive: number;
  challengesSolved: number;
}

// NEW: Simplified reply reference type
export interface MessageReply {
  id: string;
  content: string;
  userName: string;
  userId: string;
  userAvatar: string;
}

export interface LiveMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userRole?: 'student' | 'mentor' | 'admin';
  userMetadata?: User; // ✅ ADD THIS for hover card
  content: string;
  timestamp: Date;
  reactions: Reaction[];
  mentions: string[];
  edited?: boolean;
  isVoiceMessage?: boolean;
  voiceDuration?: string;
  imageUrl?: string;
  videoUrl?: string;
  replyTo?: MessageReply;
  isDeleted?: boolean;
  readBy: string[];
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface Question {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  lessonId: string;
  lessonTitle: string;
  moduleId: string;
  moduleTitle: string;
  title: string;
  content: string;
  timestamp: Date;
  videoTimestamp?: string;
  visibility: 'mentor-only' | 'mentor-public' | 'public';
  status: 'open' | 'answered' | 'closed';
  answerCount: number;
  views: number;
  upvotes: number;
  isPinned: boolean;
  tags: string[];
  shareableLink: string;
  messages: Message[];
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: Date;
  reactions: Reaction[];
  replies: Message[];
  mentions: string[];
  edited?: boolean;
  isAnswer?: boolean;
  isMentorAnswer?: boolean;
}

export interface ResourceFile {
  id: string;
  name: string;
  type: string;
  size: string;
  url: string;
}

export interface Lesson {
  id: string;
  title: string;
  duration?: string;
  moduleId: string;
  moduleTitle: string;
  videoUrl?: string;
  questionCount?: number;
}

export interface ModuleGroup {
  id: string;
  title: string;
  lessons: Lesson[];
  isExpanded: boolean;
}
export interface TypingUser {
  id: string;
  name: string;
  timestamp: Date;
}

export type ViewMode = 'live-chat' | 'ask-question';

export type QuestionVisibility = 'MENTOR_ONLY' | 'MENTOR_PUBLIC' | 'PRIVATE';

export interface QuestionData {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  videoTimestamp?: string;
  visibility: QuestionVisibility;
  status: 'open' | 'answered' | 'closed';
  isPinned: boolean;
  upvoteCount: number;
  viewCount: number;
  answerCount: number;
  userId: string;
  userName: string;
  userAvatar: string;
  
  // ✅ ADD AVATAR OBJECT DATA
  customImageUrl?: string | null;
  userAvatarObject?: {
    avatarIndex: number;
    avatarSeed: string;
    avatarStyle: string;
    isCustomUpload: boolean;
    customImageUrl?: string | null;
  } | null;
  
  lessonId: string;
  moduleId: string;
  hasUpvoted: boolean;
  hasViewed?: boolean;
  createdAt: Date;
  thanksGivenCount: number;
  canGiveThanks: boolean;
  updatedAt: Date;
  answers?: AnswerData[];
}

export interface AnswerData {
  id: string;
  content: string;
  isAccepted: boolean;
  isMentorAnswer: boolean;
  upvoteCount: number;
  replyCount: number;
  parentAnswerId?: string | null;
  userId: string;
  isThanked: boolean;
  thankedAt?: Date;
  userName: string;
  userAvatar: string;
  
  // ✅ ADD AVATAR OBJECT DATA
  customImageUrl?: string | null;
  userAvatarObject?: {
    avatarIndex: number;
    avatarSeed: string;
    avatarStyle: string;
    isCustomUpload: boolean;
    customImageUrl?: string | null;
  } | null;
  
  isMentor: boolean;
  hasUpvoted: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  replies?: AnswerData[];
}

export interface LessonWithVideo extends Lesson {
  videoUrl: string;
}

// ============================================
// BADGE SYSTEM HELPERS
// ============================================

export const LEARNER_BADGES: Omit<LearnerBadge, 'earned' | 'earnedDate' | 'progress'>[] = [
  {
    id: 'rookie',
    name: 'Rookie Learner',
    tier: 'rookie',
    icon: '🌱',
    color: 'from-green-400 to-green-600',
    glowColor: 'shadow-green-500/50',
    description: 'Welcome to your learning journey!',
    requirement: 'Join the course',
  },
  {
    id: 'seeker',
    name: 'Knowledge Seeker',
    tier: 'seeker',
    icon: '📚',
    color: 'from-blue-400 to-blue-600',
    glowColor: 'shadow-blue-500/50',
    description: 'Making great progress!',
    requirement: 'Complete 3 modules or earn 1000 XP',
  },
  {
    id: 'sharer',
    name: 'Insight Sharer',
    tier: 'sharer',
    icon: '💡',
    color: 'from-purple-400 to-purple-600',
    glowColor: 'shadow-purple-500/50',
    description: 'Helping others learn!',
    requirement: 'Start 5 discussions and answer 10 questions',
  },
  {
    id: 'graduate',
    name: 'Scaleever Graduate',
    tier: 'graduate',
    icon: '🎓',
    color: 'from-yellow-400 to-yellow-600',
    glowColor: 'shadow-yellow-500/50',
    description: 'Course master achieved!',
    requirement: 'Complete the full course',
  },
];

// ============================================
// MENTOR BADGE SYSTEM
// ============================================

export const MENTOR_BADGES: MentorBadge[] = [
  {
    id: 'mentor-master',
    name: 'Mentor of Mastery',
    tier: 'master',
    icon: '👨‍🏫',
    color: 'from-yellow-400 via-yellow-500 to-amber-600',
    glowColor: 'shadow-yellow-500/60',
    description: 'Verified Expert & Master Instructor',
    specialEffect: 'shine',
  },
  {
    id: 'mentor-elite',
    name: 'Elite Instructor',
    tier: 'elite',
    icon: '⚡',
    color: 'from-purple-400 via-purple-500 to-indigo-600',
    glowColor: 'shadow-purple-500/60',
    description: 'Elite Teacher & Course Architect',
    specialEffect: 'pulse',
  },
  {
    id: 'mentor-legendary',
    name: 'Legendary Guide',
    tier: 'legendary',
    icon: '👑',
    color: 'from-amber-400 via-orange-500 to-red-600',
    glowColor: 'shadow-orange-500/60',
    description: 'Legendary Master of Knowledge',
    specialEffect: 'sparkle',
  },
];

export const calculateUserBadge = (analytics: Omit<UserAnalytics, 'currentBadge' | 'allBadges' | 'nextBadge'>): {
  currentBadge: LearnerBadge;
  allBadges: LearnerBadge[];
  nextBadge?: LearnerBadge;
} => {
  const badges: LearnerBadge[] = [];
  
  // Rookie Learner - Always earned
  badges.push({
    ...LEARNER_BADGES[0],
    earned: true,
    earnedDate: analytics.enrollmentDate,
    progress: 100,
  });

  // Knowledge Seeker - 3 modules OR 1000 XP
  const seekerEarned = analytics.modulesCompleted >= 3 || analytics.engagement.xp >= 1000;
  const seekerProgress = Math.min(100, Math.max(
    (analytics.modulesCompleted / 3) * 100,
    (analytics.engagement.xp / 1000) * 100
  ));
  badges.push({
    ...LEARNER_BADGES[1],
    earned: seekerEarned,
    earnedDate: seekerEarned ? new Date(analytics.enrollmentDate.getTime() + 7 * 24 * 60 * 60 * 1000) : undefined,
    progress: seekerProgress,
  });

  // Insight Sharer - 5 discussions AND 10 answers
  const sharerEarned = analytics.engagement.discussionsStarted >= 5 && analytics.engagement.questionsAnswered >= 10;
  const sharerProgress = Math.min(100, Math.max(
    (analytics.engagement.discussionsStarted / 5) * 50,
    (analytics.engagement.questionsAnswered / 10) * 50
  ));
  badges.push({
    ...LEARNER_BADGES[2],
    earned: sharerEarned,
    earnedDate: sharerEarned ? new Date(analytics.enrollmentDate.getTime() + 14 * 24 * 60 * 60 * 1000) : undefined,
    progress: sharerProgress,
  });

  // Scaleever Graduate - Complete course
  badges.push({
    ...LEARNER_BADGES[3],
    earned: analytics.courseCompleted,
    earnedDate: analytics.courseCompleted ? new Date(analytics.enrollmentDate.getTime() + 30 * 24 * 60 * 60 * 1000) : undefined,
    progress: analytics.courseProgress,
  });

  // Find current badge (highest earned)
  const earnedBadges = badges.filter(b => b.earned);
  const currentBadge = earnedBadges[earnedBadges.length - 1] || badges[0];

  // Find next badge
  const nextBadge = badges.find(b => !b.earned);

  return {
    currentBadge,
    allBadges: badges,
    nextBadge,
  };
};

// ============================================
// MOCK DATA
// ============================================

export const MOCK_CURRENT_USER: User = {
  id: 'current-user',
  name: 'John Doe',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  isOnline: true,
  role: 'student',
};

export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    name: 'Sarah Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    isOnline: true,
    role: 'mentor',
  },
  {
    id: 'user-2',
    name: 'Alice Smith',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    isOnline: true,
    role: 'student',
  },
  {
    id: 'user-3',
    name: 'Bob Wilson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    isOnline: false,
    lastSeen: new Date(Date.now() - 30 * 60 * 1000),
    role: 'student',
  },
  {
    id: 'user-4',
    name: 'Emma Brown',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    isOnline: true,
    role: 'student',
  },
  {
    id: 'user-5',
    name: 'David Lee',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    isOnline: false,
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
    role: 'student',
  },
];

export const MOCK_LIVE_MESSAGES: LiveMessage[] = [
  {
    id: 'msg-1',
    userId: 'user-1',
    userName: 'Sarah Johnson',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    userRole: 'mentor',
    content: 'Welcome everyone! Feel free to ask any questions about today\'s lesson.',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    reactions: [
      { emoji: '👍', count: 5, users: ['user-2', 'user-3', 'user-4', 'current-user', 'user-5'] },
      { emoji: '🔥', count: 2, users: ['user-2', 'user-4'] },
    ],
    mentions: [],
    readBy: ['user-2', 'user-3', 'user-4', 'current-user'],
  },
  {
    id: 'msg-2',
    userId: 'user-2',
    userName: 'Alice Smith',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    userRole: 'student',
    content: '@Sarah Johnson Can you explain the useEffect cleanup function again?',
    timestamp: new Date(Date.now() - 55 * 60 * 1000),
    reactions: [
      { emoji: '❤️', count: 3, users: ['user-3', 'user-4', 'current-user'] },
    ],
    mentions: ['user-1'],
    readBy: ['user-1', 'user-3', 'current-user'],
  },
  {
    id: 'msg-3',
    userId: 'user-1',
    userName: 'Sarah Johnson',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    userRole: 'mentor',
    content: 'Sure! The cleanup function runs before the component unmounts or before the effect runs again. It\'s perfect for removing event listeners or canceling subscriptions.',
    timestamp: new Date(Date.now() - 50 * 60 * 1000),
    reactions: [
      { emoji: '🎉', count: 4, users: ['user-2', 'user-3', 'user-4', 'current-user'] },
      { emoji: '💡', count: 2, users: ['user-2', 'current-user'] },
    ],
    mentions: [],
    readBy: ['user-2', 'user-3', 'user-4', 'current-user'],
  },
];

export const MOCK_LESSONS: Lesson[] = [
  {
    id: 'lesson-1',
    title: 'Introduction to React Hooks',
    duration: '15:30',
    moduleId: 'module-1',
    moduleTitle: 'React Fundamentals',
    questionCount: 12,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  {
    id: 'lesson-2',
    title: 'useState and useEffect',
    duration: '22:45',
    moduleId: 'module-1',
    moduleTitle: 'React Fundamentals',
    questionCount: 8,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  {
    id: 'lesson-3',
    title: 'Custom Hooks',
    duration: '18:20',
    moduleId: 'module-1',
    moduleTitle: 'React Fundamentals',
    questionCount: 15,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  {
    id: 'lesson-4',
    title: 'Context API',
    duration: '25:10',
    moduleId: 'module-2',
    moduleTitle: 'Advanced React',
    questionCount: 6,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  {
    id: 'lesson-5',
    title: 'useReducer Hook',
    duration: '20:35',
    moduleId: 'module-2',
    moduleTitle: 'Advanced React',
    questionCount: 9,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
];

export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'q1',
    userId: 'user-2',
    userName: 'Alice Smith',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    lessonId: 'lesson-1',
    lessonTitle: 'Introduction to React Hooks',
    moduleId: 'module-1',
    moduleTitle: 'React Fundamentals',
    title: 'How do I properly cleanup useEffect?',
    content: 'I\'m having trouble understanding when and how to cleanup side effects in useEffect. Can someone explain?',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    videoTimestamp: '05:23',
    visibility: 'public',
    status: 'answered',
    answerCount: 5,
    views: 45,
    upvotes: 12,
    isPinned: true,
    tags: ['useEffect', 'cleanup', 'hooks'],
    shareableLink: 'https://course.com/q/q1',
    messages: [
      {
        id: 'm1',
        userId: 'user-1',
        userName: 'Sarah Johnson',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        content: 'Great question! The cleanup function in useEffect is returned from the effect callback.',
        timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        reactions: [
          { emoji: '👍', count: 8, users: ['current-user', 'user-3'] },
        ],
        replies: [],
        mentions: [],
        isAnswer: true,
        isMentorAnswer: true,
      },
    ],
  },
  {
    id: 'q2',
    userId: 'user-4',
    userName: 'Emma Brown',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    lessonId: 'lesson-2',
    lessonTitle: 'useState and useEffect',
    moduleId: 'module-1',
    moduleTitle: 'React Fundamentals',
    title: 'useState vs useReducer - when to use which?',
    content: 'I\'m confused about when I should use useState versus useReducer.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    videoTimestamp: '12:45',
    visibility: 'public',
    status: 'open',
    answerCount: 2,
    views: 28,
    upvotes: 7,
    isPinned: false,
    tags: ['useState', 'useReducer'],
    shareableLink: 'https://course.com/q/q2',
    messages: [],
  },
  {
    id: 'q3',
    userId: 'current-user',
    userName: 'John Doe',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    lessonId: 'lesson-3',
    lessonTitle: 'Custom Hooks',
    moduleId: 'module-1',
    moduleTitle: 'React Fundamentals',
    title: 'How to share logic between components?',
    content: 'What\'s the best way to create reusable custom hooks?',
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    visibility: 'mentor-public',
    status: 'open',
    answerCount: 0,
    views: 5,
    upvotes: 2,
    isPinned: false,
    tags: ['custom-hooks'],
    shareableLink: 'https://course.com/q/q3',
    messages: [],
  },
];

export const MOCK_USER_ANALYTICS: UserAnalytics[] = [
  {
    userId: 'user-1',
    courseProgress: 100,
    modulesCompleted: 2,
    totalModules: 2,
    videosCompleted: 5,
    totalVideos: 5,
    totalWatchTime: '1h 42m',
    lastActiveLesson: {
      lessonId: 'lesson-5',
      lessonTitle: 'useReducer Hook',
      moduleTitle: 'Advanced React',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    courseCompletionRank: 1,
    courseCompleted: true,
    enrollmentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    engagement: {
      xp: 2500,
      level: 5,
      discussionsStarted: 8,
      questionsAnswered: 15,
      helpfulAnswers: 12,
      consecutiveDaysActive: 30,
      challengesSolved: 20,
    },
    // Add Mentor Badge
    mentorBadge: MENTOR_BADGES[0], // Mentor of Mastery
    ...calculateUserBadge({
      userId: 'user-1',
      courseProgress: 100,
      modulesCompleted: 2,
      totalModules: 2,
      videosCompleted: 5,
      totalVideos: 5,
      totalWatchTime: '1h 42m',
      lastActiveLesson: {
        lessonId: 'lesson-5',
        lessonTitle: 'useReducer Hook',
        moduleTitle: 'Advanced React',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      courseCompletionRank: 1,
      courseCompleted: true,
      enrollmentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      engagement: {
        xp: 2500,
        level: 5,
        discussionsStarted: 8,
        questionsAnswered: 15,
        helpfulAnswers: 12,
        consecutiveDaysActive: 30,
        challengesSolved: 20,
      },
    }),
  },
  {
    userId: 'user-2',
    courseProgress: 100,
    modulesCompleted: 2,
    totalModules: 2,
    videosCompleted: 5,
    totalVideos: 5,
    totalWatchTime: '1h 45m',
    lastActiveLesson: {
      lessonId: 'lesson-5',
      lessonTitle: 'useReducer Hook',
      moduleTitle: 'Advanced React',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    courseCompletionRank: 2,
    courseCompleted: true,
    enrollmentDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
    engagement: {
      xp: 2200,
      level: 4,
      discussionsStarted: 6,
      questionsAnswered: 12,
      helpfulAnswers: 10,
      consecutiveDaysActive: 25,
      challengesSolved: 18,
    },
    ...calculateUserBadge({
      userId: 'user-2',
      courseProgress: 100,
      modulesCompleted: 2,
      totalModules: 2,
      videosCompleted: 5,
      totalVideos: 5,
      totalWatchTime: '1h 45m',
      lastActiveLesson: {
        lessonId: 'lesson-5',
        lessonTitle: 'useReducer Hook',
        moduleTitle: 'Advanced React',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
      courseCompletionRank: 2,
      courseCompleted: true,
      enrollmentDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      engagement: {
        xp: 2200,
        level: 4,
        discussionsStarted: 6,
        questionsAnswered: 12,
        helpfulAnswers: 10,
        consecutiveDaysActive: 25,
        challengesSolved: 18,
      },
    }),
  },
  {
    userId: 'user-3',
    courseProgress: 60,
    modulesCompleted: 1,
    totalModules: 2,
    videosCompleted: 3,
    totalVideos: 5,
    totalWatchTime: '58m',
    lastActiveLesson: {
      lessonId: 'lesson-3',
      lessonTitle: 'Custom Hooks',
      moduleTitle: 'React Fundamentals',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
    },
    courseCompleted: false,
    enrollmentDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    engagement: {
      xp: 600,
      level: 2,
      discussionsStarted: 2,
      questionsAnswered: 3,
      helpfulAnswers: 1,
      consecutiveDaysActive: 15,
      challengesSolved: 5,
    },
    ...calculateUserBadge({
      userId: 'user-3',
      courseProgress: 60,
      modulesCompleted: 1,
      totalModules: 2,
      videosCompleted: 3,
      totalVideos: 5,
      totalWatchTime: '58m',
      lastActiveLesson: {
        lessonId: 'lesson-3',
        lessonTitle: 'Custom Hooks',
        moduleTitle: 'React Fundamentals',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
      },
      courseCompleted: false,
      enrollmentDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      engagement: {
        xp: 600,
        level: 2,
        discussionsStarted: 2,
        questionsAnswered: 3,
        helpfulAnswers: 1,
        consecutiveDaysActive: 15,
        challengesSolved: 5,
      },
    }),
  },
  {
    userId: 'user-4',
    courseProgress: 100,
    modulesCompleted: 2,
    totalModules: 2,
    videosCompleted: 5,
    totalVideos: 5,
    totalWatchTime: '1h 50m',
    lastActiveLesson: {
      lessonId: 'lesson-5',
      lessonTitle: 'useReducer Hook',
      moduleTitle: 'Advanced React',
      timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000),
    },
    courseCompletionRank: 3,
    courseCompleted: true,
    enrollmentDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    engagement: {
      xp: 1800,
      level: 4,
      discussionsStarted: 7,
      questionsAnswered: 14,
      helpfulAnswers: 11,
      consecutiveDaysActive: 22,
      challengesSolved: 16,
    },
    ...calculateUserBadge({
      userId: 'user-4',
      courseProgress: 100,
      modulesCompleted: 2,
      totalModules: 2,
      videosCompleted: 5,
      totalVideos: 5,
      totalWatchTime: '1h 50m',
      lastActiveLesson: {
        lessonId: 'lesson-5',
        lessonTitle: 'useReducer Hook',
        moduleTitle: 'Advanced React',
        timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000),
      },
      courseCompletionRank: 3,
      courseCompleted: true,
      enrollmentDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      engagement: {
        xp: 1800,
        level: 4,
        discussionsStarted: 7,
        questionsAnswered: 14,
        helpfulAnswers: 11,
        consecutiveDaysActive: 22,
        challengesSolved: 16,
      },
    }),
  },
  {
    userId: 'user-5',
    courseProgress: 100,
    modulesCompleted: 2,
    totalModules: 2,
    videosCompleted: 5,
    totalVideos: 5,
    totalWatchTime: '2h 10m',
    lastActiveLesson: {
      lessonId: 'lesson-5',
      lessonTitle: 'useReducer Hook',
      moduleTitle: 'Advanced React',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    courseCompleted: true,
    enrollmentDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    engagement: {
      xp: 1500,
      level: 3,
      discussionsStarted: 3,
      questionsAnswered: 8,
      helpfulAnswers: 6,
      consecutiveDaysActive: 12,
      challengesSolved: 10,
    },
    ...calculateUserBadge({
      userId: 'user-5',
      courseProgress: 100,
      modulesCompleted: 2,
      totalModules: 2,
      videosCompleted: 5,
      totalVideos: 5,
      totalWatchTime: '2h 10m',
      lastActiveLesson: {
        lessonId: 'lesson-5',
        lessonTitle: 'useReducer Hook',
        moduleTitle: 'Advanced React',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      courseCompleted: true,
      enrollmentDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      engagement: {
        xp: 1500,
        level: 3,
        discussionsStarted: 3,
        questionsAnswered: 8,
        helpfulAnswers: 6,
        consecutiveDaysActive: 12,
        challengesSolved: 10,
      },
    }),
  },
  {
    userId: 'current-user',
    courseProgress: 80,
    modulesCompleted: 1,
    totalModules: 2,
    videosCompleted: 4,
    totalVideos: 5,
    totalWatchTime: '1h 20m',
    lastActiveLesson: {
      lessonId: 'lesson-4',
      lessonTitle: 'Context API',
      moduleTitle: 'Advanced React',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
    },
    courseCompleted: false,
    enrollmentDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    engagement: {
      xp: 800,
      level: 2,
      discussionsStarted: 1,
      questionsAnswered: 5,
      helpfulAnswers: 3,
      consecutiveDaysActive: 18,
      challengesSolved: 8,
    },
    ...calculateUserBadge({
      userId: 'current-user',
      courseProgress: 80,
      modulesCompleted: 1,
      totalModules: 2,
      videosCompleted: 4,
      totalVideos: 5,
      totalWatchTime: '1h 20m',
      lastActiveLesson: {
        lessonId: 'lesson-4',
        lessonTitle: 'Context API',
        moduleTitle: 'Advanced React',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
      },
      courseCompleted: false,
      enrollmentDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      engagement: {
        xp: 800,
        level: 2,
        discussionsStarted: 1,
        questionsAnswered: 5,
        helpfulAnswers: 3,
        consecutiveDaysActive: 18,
        challengesSolved: 8,
      },
    }),
  },

  
];