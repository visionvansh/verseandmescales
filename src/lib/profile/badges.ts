// /lib/profile/badges.ts
import prisma from '@/lib/prisma';
import { BadgeCategory } from '@prisma/client';

interface BadgeDefinition {
  type: string;
  category: BadgeCategory;
  title: string;
  description: string;
  icon: string;
  color: string;
  requirement: string;
  checkCriteria: (userId: string) => Promise<boolean>;
  displayOrder: number;
}

// ============================================
// XP LEVEL BADGES
// ============================================
const XP_LEVEL_BADGES: BadgeDefinition[] = [
  {
    type: 'rising_contributor',
    category: 'CONTRIBUTOR',
    title: 'Rising Contributor',
    description: 'Making your mark in the community.',
    icon: '🌟',
    color: 'from-gray-500 to-gray-700',
    requirement: '1,000 – 5,000 XP',
    displayOrder: 1,
    checkCriteria: async (userId) => {
      const userXP = await prisma.userXP.findUnique({
        where: { userId },
        select: { totalXP: true }
      });
      const xp = userXP?.totalXP || 0;
      return xp >= 1000 && xp < 5000;
    }
  },
  {
    type: 'active_contributor',
    category: 'CONTRIBUTOR',
    title: 'Active Contributor',
    description: 'Consistently contributing to the community.',
    icon: '⚡',
    color: 'from-blue-500 to-blue-700',
    requirement: '5,000 – 19,999 XP',
    displayOrder: 2,
    checkCriteria: async (userId) => {
      const userXP = await prisma.userXP.findUnique({
        where: { userId },
        select: { totalXP: true }
      });
      const xp = userXP?.totalXP || 0;
      return xp >= 5000 && xp < 20000;
    }
  },
  {
    type: 'top_contributor',
    category: 'CONTRIBUTOR',
    title: 'Top Contributor',
    description: 'Among the elite contributors.',
    icon: '🏆',
    color: 'from-yellow-500 to-orange-600',
    requirement: '20,000 – 34,999 XP',
    displayOrder: 3,
    checkCriteria: async (userId) => {
      const userXP = await prisma.userXP.findUnique({
        where: { userId },
        select: { totalXP: true }
      });
      const xp = userXP?.totalXP || 0;
      return xp >= 20000 && xp < 35000;
    }
  },
  {
    type: 'knowledge_man',
    category: 'CONTRIBUTOR',
    title: 'Knowledge Man',
    description: 'A fountain of wisdom and expertise.',
    icon: '🧠',
    color: 'from-purple-500 to-purple-700',
    requirement: '35,000 – 49,999 XP',
    displayOrder: 4,
    checkCriteria: async (userId) => {
      const userXP = await prisma.userXP.findUnique({
        where: { userId },
        select: { totalXP: true }
      });
      const xp = userXP?.totalXP || 0;
      return xp >= 35000 && xp < 50000;
    }
  },
  {
    type: 'influential_contributor',
    category: 'CONTRIBUTOR',
    title: 'Influential Contributor',
    description: 'Shaping the future of learning.',
    icon: '👑',
    color: 'from-red-500 to-red-700',
    requirement: '50,000 – 74,999 XP',
    displayOrder: 5,
    checkCriteria: async (userId) => {
      const userXP = await prisma.userXP.findUnique({
        where: { userId },
        select: { totalXP: true }
      });
      const xp = userXP?.totalXP || 0;
      return xp >= 50000 && xp < 75000;
    }
  },
  {
    type: 'community_breaker',
    category: 'CONTRIBUTOR',
    title: 'Community Breaker',
    description: 'Breaking barriers and setting new standards.',
    icon: '💥',
    color: 'from-pink-500 to-red-600',
    requirement: '75,000 – 99,999 XP',
    displayOrder: 6,
    checkCriteria: async (userId) => {
      const userXP = await prisma.userXP.findUnique({
        where: { userId },
        select: { totalXP: true }
      });
      const xp = userXP?.totalXP || 0;
      return xp >= 75000 && xp < 100000;
    }
  },
  {
    type: 'elite_innovator',
    category: 'CONTRIBUTOR',
    title: 'Elite Innovator',
    description: 'The pinnacle of contribution and innovation.',
    icon: '🚀',
    color: 'from-yellow-400 via-red-500 to-purple-600',
    requirement: '100,000 – 149,999 XP',
    displayOrder: 7,
    checkCriteria: async (userId) => {
      const userXP = await prisma.userXP.findUnique({
        where: { userId },
        select: { totalXP: true }
      });
      const xp = userXP?.totalXP || 0;
      return xp >= 100000;
    }
  }
];

// ============================================
// LEARNER BADGES
// ============================================
const LEARNER_BADGES: BadgeDefinition[] = [
  {
    type: 'new_seaker',
    category: 'LEARNER',
    title: 'New Seaker',
    description: 'Just started the journey of knowledge. Curious and ambitious.',
    icon: '🌱',
    color: 'from-green-500 to-green-700',
    requirement: 'Complete 1 course',
    displayOrder: 10,
    checkCriteria: async (userId) => {
      const completedCourses = await prisma.lessonProgress.groupBy({
        by: ['courseId'],
        where: {
          userId,
          isCompleted: true
        },
        _count: true
      });
      return completedCourses.length >= 1;
    }
  },
  {
    type: 'active_seaker',
    category: 'LEARNER',
    title: 'Active Seaker',
    description: 'Actively exploring multiple paths of learning.',
    icon: '📚',
    color: 'from-blue-500 to-blue-700',
    requirement: 'Complete 3+ courses',
    displayOrder: 11,
    checkCriteria: async (userId) => {
      const completedCourses = await prisma.lessonProgress.groupBy({
        by: ['courseId'],
        where: {
          userId,
          isCompleted: true
        },
        _count: true
      });
      return completedCourses.length >= 3;
    }
  },
  {
    type: 'scaler_learner',
    category: 'LEARNER',
    title: 'Scaler Learner',
    description: 'Growing fast — mastering multiple disciplines.',
    icon: '🎓',
    color: 'from-purple-500 to-purple-700',
    requirement: 'Complete 5+ courses',
    displayOrder: 12,
    checkCriteria: async (userId) => {
      const completedCourses = await prisma.lessonProgress.groupBy({
        by: ['courseId'],
        where: {
          userId,
          isCompleted: true
        },
        _count: true
      });
      return completedCourses.length >= 5;
    }
  },
  {
    type: 'elite_scholar',
    category: 'LEARNER',
    title: 'Elite Scholar',
    description: 'One of the top learners who deeply engages and shares insights.',
    icon: '🌟',
    color: 'from-yellow-500 to-orange-600',
    requirement: 'Complete 10+ courses with top ratings',
    displayOrder: 13,
    checkCriteria: async (userId) => {
      const completedCourses = await prisma.lessonProgress.groupBy({
        by: ['courseId'],
        where: {
          userId,
          isCompleted: true
        },
        _count: true
      });
      // TODO: Add rating check when review system is implemented
      return completedCourses.length >= 10;
    }
  },
  {
    type: 'mentor_seaker',
    category: 'LEARNER',
    title: 'Mentor Seaker',
    description: 'Learner turned guide — helps other Seakers in their path.',
    icon: '🔥',
    color: 'from-red-500 to-red-700',
    requirement: 'Complete 20+ courses and mentor others',
    displayOrder: 14,
    checkCriteria: async (userId) => {
      const [completedCourses, answersGiven] = await Promise.all([
        prisma.lessonProgress.groupBy({
          by: ['courseId'],
          where: { userId, isCompleted: true },
          _count: true
        }),
        prisma.questionAnswer.count({
          where: { userId }
        })
      ]);
      return completedCourses.length >= 20 && answersGiven >= 10;
    }
  }
];

// ============================================
// TUTOR BADGES
// ============================================
const TUTOR_BADGES: BadgeDefinition[] = [
  {
    type: 'emerging_tutor',
    category: 'TUTOR',
    title: 'Emerging Tutor',
    description: 'Just stepped into the world of teaching.',
    icon: '👨‍🏫',
    color: 'from-orange-500 to-orange-700',
    requirement: 'Create first course',
    displayOrder: 20,
    checkCriteria: async (userId) => {
      const count = await prisma.course.count({
        where: { userId, isPublished: true }
      });
      return count >= 1;
    }
  },
  {
    type: 'popular_tutor',
    category: 'TUTOR',
    title: 'Popular Tutor',
    description: 'Teaching style attracting consistent learners.',
    icon: '⭐',
    color: 'from-yellow-500 to-yellow-700',
    requirement: '100+ learners in one course',
    displayOrder: 21,
    checkCriteria: async (userId) => {
      // Count unique users who have progress in any of the tutor's courses
      const courses = await prisma.course.findMany({
        where: { userId, isPublished: true },
        select: { id: true }
      });
      
      if (courses.length === 0) return false;
      
      for (const course of courses) {
        const learnerCount = await prisma.lessonProgress.groupBy({
          by: ['userId'],
          where: { courseId: course.id }
        });
        
        if (learnerCount.length >= 100) return true;
      }
      
      return false;
    }
  },
  {
    type: 'master_tutor',
    category: 'TUTOR',
    title: 'Master Tutor',
    description: 'Reached mastery — course widely recognized and impactful.',
    icon: '🎖️',
    color: 'from-blue-600 to-purple-700',
    requirement: '500+ learners in any single course',
    displayOrder: 22,
    checkCriteria: async (userId) => {
      const courses = await prisma.course.findMany({
        where: { userId, isPublished: true },
        select: { id: true }
      });
      
      if (courses.length === 0) return false;
      
      for (const course of courses) {
        const learnerCount = await prisma.lessonProgress.groupBy({
          by: ['userId'],
          where: { courseId: course.id }
        });
        
        if (learnerCount.length >= 500) return true;
      }
      
      return false;
    }
  },
  {
    type: 'edupreneur',
    category: 'TUTOR',
    title: 'Edupreneur',
    description: 'Building a full-scale teaching brand.',
    icon: '💼',
    color: 'from-green-600 to-teal-700',
    requirement: '5 courses with 100+ learners each',
    displayOrder: 23,
    checkCriteria: async (userId) => {
      const courses = await prisma.course.findMany({
        where: { userId, isPublished: true },
        select: { id: true }
      });
      
      if (courses.length < 5) return false;
      
      let coursesWithEnoughLearners = 0;
      
      for (const course of courses) {
        const learnerCount = await prisma.lessonProgress.groupBy({
          by: ['userId'],
          where: { courseId: course.id }
        });
        
        if (learnerCount.length >= 100) {
          coursesWithEnoughLearners++;
        }
      }
      
      return coursesWithEnoughLearners >= 5;
    }
  },
  {
    type: 'legacy_creator',
    category: 'TUTOR',
    title: 'Legacy Creator',
    description: 'Established educator inspiring the next generation.',
    icon: '🏛️',
    color: 'from-purple-600 to-pink-700',
    requirement: '10+ courses with 500+ learners each',
    displayOrder: 24,
    checkCriteria: async (userId) => {
      const courses = await prisma.course.findMany({
        where: { userId, isPublished: true },
        select: { id: true }
      });
      
      if (courses.length < 10) return false;
      
      let coursesWithEnoughLearners = 0;
      
      for (const course of courses) {
        const learnerCount = await prisma.lessonProgress.groupBy({
          by: ['userId'],
          where: { courseId: course.id }
        });
        
        if (learnerCount.length >= 500) {
          coursesWithEnoughLearners++;
        }
      }
      
      return coursesWithEnoughLearners >= 10;
    }
  }
];

// ============================================
// DUAL ROLE BADGES
// ============================================
const DUAL_ROLE_BADGES: BadgeDefinition[] = [
  {
    type: 'knowledge_alchemist',
    category: 'DUAL_ROLE',
    title: 'Knowledge Alchemist',
    description: 'Learns, teaches, and transforms ideas into impact.',
    icon: '🔮',
    color: 'from-indigo-600 to-purple-700',
    requirement: 'Learn 5+ courses & create 1 course',
    displayOrder: 30,
    checkCriteria: async (userId) => {
      const [completedCourses, createdCourses] = await Promise.all([
        prisma.lessonProgress.groupBy({
          by: ['courseId'],
          where: { userId, isCompleted: true },
          _count: true
        }),
        prisma.course.count({
          where: { userId, isPublished: true }
        })
      ]);
      return completedCourses.length >= 5 && createdCourses >= 1;
    }
  },
  {
    type: 'wisdom_architect',
    category: 'DUAL_ROLE',
    title: 'Wisdom Architect',
    description: 'Builds bridges between learning and teaching.',
    icon: '🏗️',
    color: 'from-cyan-600 to-blue-700',
    requirement: 'Learn 10+ courses & create 3+ courses',
    displayOrder: 31,
    checkCriteria: async (userId) => {
      const [completedCourses, createdCourses] = await Promise.all([
        prisma.lessonProgress.groupBy({
          by: ['courseId'],
          where: { userId, isCompleted: true },
          _count: true
        }),
        prisma.course.count({
          where: { userId, isPublished: true }
        })
      ]);
      return completedCourses.length >= 10 && createdCourses >= 3;
    }
  },
  {
    type: 'realm_master',
    category: 'DUAL_ROLE',
    title: 'Realm Master',
    description: 'Commands both learning and teaching realms — elite of the platform.',
    icon: '⚔️',
    color: 'from-red-600 via-purple-600 to-blue-700',
    requirement: '500+ learners & complete 10+ courses',
    displayOrder: 32,
    checkCriteria: async (userId) => {
      const [completedCourses, courses] = await Promise.all([
        prisma.lessonProgress.groupBy({
          by: ['courseId'],
          where: { userId, isCompleted: true },
          _count: true
        }),
        prisma.course.findMany({
          where: { userId, isPublished: true },
          select: { id: true }
        })
      ]);
      
      if (completedCourses.length < 10) return false;
      
      let totalLearners = 0;
      
      for (const course of courses) {
        const learnerCount = await prisma.lessonProgress.groupBy({
          by: ['userId'],
          where: { courseId: course.id }
        });
        totalLearners += learnerCount.length;
      }
      
      return totalLearners >= 500;
    }
  }
];

// ============================================
// SPECIAL BADGES
// ============================================
const SPECIAL_BADGES: BadgeDefinition[] = [
  {
    type: 'early_adopter',
    category: 'SPECIAL',
    title: 'Early Adopter',
    description: 'Joined in the first year of the platform.',
    icon: '🚀',
    color: 'from-blue-600 to-indigo-700',
    requirement: 'Joined early',
    displayOrder: 40,
    checkCriteria: async (userId) => {
      const user = await prisma.student.findUnique({
        where: { id: userId },
        select: { createdAt: true }
      });
      
      if (!user) return false;
      
      // Check if user joined within first year of platform
      const platformStart = new Date('2024-01-01');
      const firstYearEnd = new Date('2025-01-01');
      
      return user.createdAt >= platformStart && user.createdAt < firstYearEnd;
    }
  },
  {
    type: 'verified_expert',
    category: 'SPECIAL',
    title: 'Verified Expert',
    description: 'Industry verified professional.',
    icon: '✓',
    color: 'from-green-600 to-emerald-700',
    requirement: 'Verification required',
    displayOrder: 41,
    checkCriteria: async (userId) => {
      // This should be manually assigned by admins
      const badge = await prisma.userBadge.findFirst({
        where: {
          userId,
          badgeType: 'verified_expert',
          isEarned: true
        }
      });
      return !!badge;
    }
  },
  {
    type: 'community_legend',
    category: 'SPECIAL',
    title: 'Community Legend',
    description: 'Exceptional contributions recognized by the community.',
    icon: '🌟',
    color: 'from-yellow-400 via-orange-500 to-red-600',
    requirement: 'Community recognition',
    displayOrder: 42,
    checkCriteria: async (userId) => {
      const [followers, posts, answers] = await Promise.all([
        prisma.follow.count({
          where: { followingId: userId, isAccepted: true }
        }),
        prisma.post.count({
          where: { userId, isDeleted: false }
        }),
        prisma.questionAnswer.count({
          where: { userId, isThanked: true }
        })
      ]);
      
      return followers >= 500 && posts >= 100 && answers >= 50;
    }
  }
];

// ============================================
// ALL BADGES
// ============================================
export const ALL_BADGE_DEFINITIONS: BadgeDefinition[] = [
  ...XP_LEVEL_BADGES,
  ...LEARNER_BADGES,
  ...TUTOR_BADGES,
  ...DUAL_ROLE_BADGES,
  ...SPECIAL_BADGES
];

// ============================================
// MAIN BADGE CHECK FUNCTION
// ============================================
export async function checkAndAwardBadges(userId: string) {
  const results: { badge: any; isNew: boolean }[] = [];
  
  for (const badgeDef of ALL_BADGE_DEFINITIONS) {
    try {
      const eligible = await badgeDef.checkCriteria(userId);
      
      if (eligible) {
        const existingBadge = await prisma.userBadge.findFirst({
          where: {
            userId,
            badgeType: badgeDef.type
          }
        });
        
        if (!existingBadge) {
          const newBadge = await prisma.userBadge.create({
            data: {
              userId,
              badgeType: badgeDef.type,
              category: badgeDef.category,
              title: badgeDef.title,
              description: badgeDef.description,
              icon: badgeDef.icon,
              color: badgeDef.color,
              requirement: badgeDef.requirement,
              displayOrder: badgeDef.displayOrder,
              isEarned: true,
              earnedAt: new Date()
            }
          });
          
          results.push({ badge: newBadge, isNew: true });
          
          console.log(`✅ Awarded badge: ${badgeDef.title} to user ${userId}`);
        } else if (!existingBadge.isEarned) {
          // Update existing badge to earned
          const updatedBadge = await prisma.userBadge.update({
            where: { id: existingBadge.id },
            data: {
              isEarned: true,
              earnedAt: new Date()
            }
          });
          
          results.push({ badge: updatedBadge, isNew: true });
        }
      }
    } catch (error) {
      console.error(`Error checking badge ${badgeDef.type}:`, error);
    }
  }
  
  return results;
}

// ============================================
// UPDATE XP TITLE
// ============================================
export function getContributorTitle(totalXP: number): string {
  if (totalXP >= 100000) return 'Elite Innovator';
  if (totalXP >= 75000) return 'Community Breaker';
  if (totalXP >= 50000) return 'Influential Contributor';
  if (totalXP >= 35000) return 'Knowledge Man';
  if (totalXP >= 20000) return 'Top Contributor';
  if (totalXP >= 5000) return 'Active Contributor';
  if (totalXP >= 1000) return 'Rising Contributor';
  return 'New Member';
}

// ============================================
// UPDATE USER XP AND CHECK BADGES
// ============================================
export async function updateUserXPAndBadges(
  userId: string,
  xpAmount: number,
  action: string,
  description?: string
) {
  try {
    // Update XP
    const userXP = await prisma.userXP.upsert({
      where: { userId },
      create: {
        userId,
        totalXP: xpAmount,
        currentLevel: Math.floor(xpAmount / 1000),
        contributorTitle: getContributorTitle(xpAmount),
        [`xpFrom${action.charAt(0).toUpperCase() + action.slice(1)}`]: xpAmount
      },
      update: {
        totalXP: { increment: xpAmount },
        currentLevel: Math.floor((await prisma.userXP.findUnique({ where: { userId } }))!.totalXP / 1000),
        contributorTitle: getContributorTitle(
          (await prisma.userXP.findUnique({ where: { userId } }))!.totalXP + xpAmount
        )
      }
    });

    // Record XP history
    await prisma.xPHistory.create({
      data: {
        userXPId: userXP.id,
        amount: xpAmount,
        action,
        description: description || `Earned ${xpAmount} XP from ${action}`
      }
    });

    // Check and award badges
    const newBadges = await checkAndAwardBadges(userId);

    return {
      userXP,
      newBadges
    };
  } catch (error) {
    console.error('Error updating XP and badges:', error);
    throw error;
  }
}

// ============================================
// GET USER'S HIGHEST EARNED BADGE
// ============================================
export async function getHighestBadge(userId: string) {
  const badge = await prisma.userBadge.findFirst({
    where: {
      userId,
      isEarned: true,
      isDisplayed: true
    },
    orderBy: {
      displayOrder: 'asc'
    }
  });

  return badge;
}