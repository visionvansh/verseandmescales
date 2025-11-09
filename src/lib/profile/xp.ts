// src/lib/xp/award.ts
import { updateUserXPAndBadges } from '@/lib/profile/badges';

export const XP_REWARDS = {
  POST_CREATE: 10,
  POST_LIKE: 2,
  COMMENT_CREATE: 5,
  COURSE_CREATE: 100,
  COURSE_COMPLETE: 50,
  ANSWER_QUESTION: 15,
  ANSWER_ACCEPTED: 25,
  QUESTION_UPVOTE: 3,
  ANSWER_UPVOTE: 3,
  FOLLOWER_GAINED: 5
};

export async function awardXP(
  userId: string,
  action: keyof typeof XP_REWARDS,
  metadata?: any
) {
  const xpAmount = XP_REWARDS[action];
  
  if (!xpAmount) {
    console.error(`Unknown XP action: ${action}`);
    return null;
  }

  try {
    const result = await updateUserXPAndBadges(
      userId,
      xpAmount,
      action.toLowerCase(),
      `Earned ${xpAmount} XP for ${action.toLowerCase().replace(/_/g, ' ')}`
    );

    return result;
  } catch (error) {
    console.error('Failed to award XP:', error);
    return null;
  }
}