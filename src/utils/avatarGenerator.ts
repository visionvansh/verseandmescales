// utils/avatarGenerator.ts
import { FaUser } from 'react-icons/fa';

export interface AvatarConfig {
  userId: string;
  avatarIndex: number;
  avatarSeed: string;
  avatarStyle?: string;
}

export function generateAvatarUrl(config: AvatarConfig, size: number = 64): string {
  const { userId, avatarIndex, avatarSeed, avatarStyle = 'avataaars' } = config;
  
  const redShades = ['ff0000', 'dc2626', 'ef4444', 'f87171', 'fca5a5', 'b91c1c', '991b1b', 'e11d48', 'be123c'];
  const whiteShades = ['ffffff', 'fafafa', 'f5f5f5', 'f0f0f0', 'e5e5e5', 'e8e8e8', 'ececec'];
  
  const primaryRed = redShades[avatarIndex % redShades.length];
  const secondaryRed = redShades[(avatarIndex + 3) % redShades.length];
  const primaryWhite = whiteShades[avatarIndex % whiteShades.length];
  const secondaryWhite = whiteShades[(avatarIndex + 2) % whiteShades.length];
  
  const params = new URLSearchParams({
    seed: avatarSeed,
    size: size.toString(),
    backgroundColor: '000000',
    backgroundType: 'solid',
  });
  
  params.append('clothesColor', `${primaryRed},${secondaryRed}`);
  params.append('skinColor', `${primaryWhite},${secondaryWhite}`);
  params.append('hairColor', `${primaryRed},${secondaryRed}`);
  params.append('facialHairColor', primaryRed);
  params.append('accessoriesColor', primaryRed);
  
  return `https://api.dicebear.com/7.x/${avatarStyle}/svg?${params.toString()}`;
}

// NEW: Helper to check if user has any avatar set
export function hasUserAvatar(user: {
  img?: string | null;
  avatars?: Array<{
    avatarIndex: number;
    isCustomUpload: boolean;
    customImageUrl?: string | null;
  }>;
}): boolean {
  if (user.img) return true;
  if (user.avatars && user.avatars.length > 0) {
    const primaryAvatar = user.avatars[0];
    return primaryAvatar.isCustomUpload ? !!primaryAvatar.customImageUrl : true;
  }
  return false;
}

export function getAvatarUrlFromUser(user: {
  id: string;
  username: string;
  img?: string | null;
  avatars?: Array<{
    avatarIndex: number;
    avatarSeed: string;
    avatarStyle: string;
    isPrimary: boolean;
    isCustomUpload: boolean;
    customImageUrl?: string | null;
  }>;
}, size: number = 64): string | null {
  const primaryAvatar = user.avatars?.[0];
  
  if (primaryAvatar) {
    if (primaryAvatar.isCustomUpload && primaryAvatar.customImageUrl) {
      return primaryAvatar.customImageUrl;
    } else {
      return generateAvatarUrl({
        userId: user.id,
        avatarIndex: primaryAvatar.avatarIndex,
        avatarSeed: primaryAvatar.avatarSeed,
        avatarStyle: primaryAvatar.avatarStyle
      }, size);
    }
  }
  
  if (user.img) {
    return user.img;
  }
  
  // NEW: Return null instead of generating default
  // This signals to use the FaUser icon
  return null;
}