// @/components/profile/data/mockProfileData.ts
export interface Avatar {
  id: string;
  avatarIndex: number;
  avatarSeed: string;
  avatarStyle: string;
  isPrimary: boolean;
  isCustomUpload: boolean;
  customImageUrl: string | null;
}

export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  avatarObject?: Avatar | null; // ✅ ADD THIS

  type: 'tutor' | 'learner' | 'both';
  xp: number;
  dateJoined: string;
  seekers: number;
  seeking: number;
  badges: Badge[];
  coursesMade: number;
  surname?: string; // ✅ ADD THIS LINE
  coursesLearning: number;
  bio?: string;
  isPrivate: boolean;
  coverImage?: string;
  location?: string;
  website?: string;
  country?: string;
  isFollowing?: boolean;
  isOwnProfile?: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requirement: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Post {
  id: string;
  userId: string;
  user: User;
  type: 'text' | 'image' | 'video';
  content: string;
  media?: string;
  mediaType?: 'image' | 'video';
  videoDuration?: string;
  likes: number;
  isLiked: boolean;
  comments: number;
  shares: number;
  timestamp: string;
  isPinned?: boolean;
}

export const mockBadges: Badge[] = [
  {
    id: 'scaler-learner',
    name: 'Scaler Learner',
    description: 'Completed 5 courses',
    icon: '🎓',
    color: 'from-red-600 to-red-800',
    requirement: '5 courses completed',
    rarity: 'common',
  },
  {
    id: 'knowledge-seeker',
    name: 'Knowledge Seeker',
    description: 'Enrolled in 10+ courses',
    icon: '📚',
    color: 'from-red-500 to-red-700',
    requirement: '10+ courses enrolled',
    rarity: 'common',
  },
  {
    id: 'master-tutor',
    name: 'Master Tutor',
    description: 'Created 3+ courses',
    icon: '👨‍🏫',
    color: 'from-red-700 to-red-900',
    requirement: '3+ courses created',
    rarity: 'rare',
  },
  {
    id: 'top-contributor',
    name: 'Top Contributor',
    description: '1000+ XP earned',
    icon: '⚡',
    color: 'from-yellow-600 to-red-600',
    requirement: '1000+ XP',
    rarity: 'epic',
  },
  {
    id: 'community-star',
    name: 'Community Star',
    description: '100+ followers',
    icon: '⭐',
    color: 'from-purple-600 to-red-600',
    requirement: '100+ seekers',
    rarity: 'epic',
  },
  {
    id: 'early-adopter',
    name: 'Early Adopter',
    description: 'Joined in first year',
    icon: '🚀',
    color: 'from-blue-600 to-red-600',
    requirement: 'Joined early',
    rarity: 'legendary',
  },
  {
    id: 'verified-expert',
    name: 'Verified Expert',
    description: 'Industry verified professional',
    icon: '✓',
    color: 'from-green-600 to-red-600',
    requirement: 'Verification required',
    rarity: 'legendary',
  },
];

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Alex Rodriguez',
    username: 'alexrod',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    type: 'both',
    xp: 2450,
    dateJoined: '2024-01-15',
    seekers: 234,
    seeking: 89,
    badges: [mockBadges[0], mockBadges[2], mockBadges[3]],
    coursesMade: 5,
    coursesLearning: 12,
    bio: '🎯 Full-stack developer & educator | Building the future of learning',
    isPrivate: false,
    coverImage: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200',
    location: 'San Francisco, CA',
    country: 'US', // ✅ ADD THIS
    website: 'alexdev.io',
    isFollowing: false,
  },
  {
    id: '2',
    name: 'Sarah Chen',
    username: 'sarahchen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    type: 'learner',
    xp: 1890,
    dateJoined: '2024-02-20',
    seekers: 156,
    seeking: 203,
    badges: [mockBadges[0], mockBadges[1], mockBadges[4]],
    coursesMade: 0,
    coursesLearning: 18,
    bio: '📖 Lifelong learner | AI & Machine Learning enthusiast',
    isPrivate: false,
    location: 'New York, NY',
    country: 'US', // ✅ ADD THIS
    isFollowing: true,
  },
  {
    id: '3',
    name: 'Marcus Johnson',
    username: 'marcusj',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
    type: 'tutor',
    xp: 3200,
    dateJoined: '2023-11-10',
    seekers: 489,
    seeking: 45,
    badges: [mockBadges[2], mockBadges[3], mockBadges[4], mockBadges[5], mockBadges[6]],
    coursesMade: 8,
    coursesLearning: 0,
    bio: '🎓 PhD in Computer Science | Teaching programming for 10+ years',
    isPrivate: false,
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200',
    location: 'London, UK',
    country: 'GB', // ✅ ADD THIS
    website: 'marcustech.edu',
    isFollowing: false,
  },
  {
    id: '4',
    name: 'Emily Watson',
    username: 'emilyw',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    type: 'learner',
    xp: 1250,
    dateJoined: '2024-03-05',
    seekers: 92,
    seeking: 134,
    badges: [mockBadges[0], mockBadges[1]],
    coursesMade: 0,
    coursesLearning: 8,
    bio: '💻 Web development student | React enthusiast',
    isPrivate: true,
    location: 'Austin, TX',
    country: 'US', // ✅ ADD THIS
    isFollowing: false,
  },
  {
    id: '5',
    name: 'David Kim',
    username: 'davidk',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    type: 'both',
    xp: 2890,
    dateJoined: '2024-01-22',
    seekers: 312,
    seeking: 156,
    badges: [mockBadges[0], mockBadges[2], mockBadges[3], mockBadges[4]],
    coursesMade: 4,
    coursesLearning: 15,
    bio: '🚀 Tech entrepreneur | Sharing knowledge & building communities',
    isPrivate: false,
    coverImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200',
    location: 'Seattle, WA',
    country: 'US', // ✅ ADD THIS
    website: 'davidkim.co',
    isFollowing: true,
  },
  {
    id: '6',
    name: 'Jessica Martinez',
    username: 'jessicam',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica',
    type: 'tutor',
    xp: 4100,
    dateJoined: '2023-09-12',
    seekers: 678,
    seeking: 34,
    badges: [mockBadges[2], mockBadges[3], mockBadges[5], mockBadges[6]],
    coursesMade: 12,
    coursesLearning: 0,
    bio: '💼 Senior Software Engineer | Mentor | Tech Speaker',
    isPrivate: true,
    location: 'Boston, MA',
    country: 'US', // ✅ ADD THIS
    isFollowing: false,
  },
  {
    id: '7',
    name: 'Ryan Cooper',
    username: 'ryanc',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ryan',
    type: 'learner',
    xp: 980,
    dateJoined: '2024-04-10',
    seekers: 45,
    seeking: 78,
    badges: [mockBadges[0]],
    coursesMade: 0,
    coursesLearning: 5,
    bio: '🌟 Junior developer learning every day',
    isPrivate: false,
    location: 'Toronto, CA',
    country: 'CA', // ✅ ADD THIS
    isFollowing: false,
  },
  {
    id: '8',
    name: 'Lisa Park',
    username: 'lisap',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
    type: 'tutor',
    xp: 3500,
    dateJoined: '2023-12-05',
    seekers: 523,
    seeking: 29,
    badges: [mockBadges[2], mockBadges[3], mockBadges[4]],
    coursesMade: 9,
    coursesLearning: 0,
    bio: '📱 Mobile app development expert | iOS & Android',
    isPrivate: false,
    location: 'Seoul, KR',
    country: 'KR', // ✅ ADD THIS
    website: 'lisapark.dev',
    isFollowing: false,
  },
];

export const mockPosts: Post[] = [
  {
    id: '1',
    userId: '1',
    user: mockUsers[0],
    type: 'video',
    content: '🎉 Just finished editing my new course on React Server Components! Here\'s a quick preview of what you\'ll learn. Dropping next week! 🚀',
    media: 'https://example.com/video1.mp4',
    mediaType: 'video',
    videoDuration: '0:45',
    likes: 234,
    isLiked: false,
    comments: 45,
    shares: 23,
    timestamp: '2024-10-25T08:30:00Z',
    isPinned: true,
  },
  {
    id: '2',
    userId: '2',
    user: mockUsers[1],
    type: 'text',
    content: `💡 Today I learned about the power of TypeScript generics! Mind blown 🤯
The way you can create reusable, type-safe functions is just amazing. If you're not using TypeScript yet, you're missing out!`,
    likes: 156,
    isLiked: true,
    comments: 28,
    shares: 12,
    timestamp: '2024-10-25T07:15:00Z',
  },
  {
    id: '3',
    userId: '3',
    user: mockUsers[2],
    type: 'image',
    content: '📊 Student progress update! So proud of everyone who completed the Advanced JavaScript course this month. Your dedication is inspiring! 🌟',
    media: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
    mediaType: 'image',
    likes: 489,
    isLiked: false,
    comments: 67,
    shares: 34,
    timestamp: '2024-10-24T18:45:00Z',
  },
  {
    id: '4',
    userId: '1',
    user: mockUsers[0],
    type: 'image',
    content: '✨ My coding setup is finally complete! Clean desk = clear mind. What does your workspace look like? 💻',
    media: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
    mediaType: 'image',
    likes: 192,
    isLiked: true,
    comments: 18,
    shares: 5,
    timestamp: '2024-10-24T15:20:00Z',
  },
  {
    id: '5',
    userId: '5',
    user: mockUsers[4],
    type: 'video',
    content: '🔥 Quick tip: How to optimize your React app performance in 60 seconds! This simple trick reduced my load time by 40%. Try it out! ⚡',
    media: 'https://example.com/video2.mp4',
    mediaType: 'video',
    videoDuration: '0:58',
    likes: 312,
    isLiked: false,
    comments: 52,
    shares: 28,
    timestamp: '2024-10-24T12:00:00Z',
  },
  {
    id: '6',
    userId: '1',
    user: mockUsers[0],
    type: 'text',
    content: `🎯 Pro tip for new developers:
1. Write code
2. Break it
3. Fix it
4. Repeat
That's how you learn! Don't be afraid of errors, they're your best teachers. 💪`,
    likes: 445,
    isLiked: true,
    comments: 89,
    shares: 67,
    timestamp: '2024-10-23T20:30:00Z',
  },
];

export const getCurrentUser = (): User => mockUsers[0];

export const getUserByUsername = (username: string): User | undefined => {
  return mockUsers.find(u => u.username === username);
};

export const getUserPosts = (userId: string): Post[] => {
  return mockPosts.filter(p => p.userId === userId);
};

export const getUserSeekers = (userId: string): User[] => {
  return mockUsers.filter(u => u.id !== userId).slice(0, 3);
};

export const getUserSeeking = (userId: string): User[] => {
  return mockUsers.filter(u => u.id !== userId).slice(0, 2);
};