///Volumes/vision/codes/course/my-app/src/components/settings/AvatarGenerator.tsx
"use client";
import { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';
import { FaUser } from 'react-icons/fa';

interface AvatarGeneratorProps {
  userId: string;
  avatarIndex: number;
  size?: number;
  className?: string;
  style?: 'avataaars';
  useDefault?: boolean;
}

const AvatarGenerator = ({ 
  userId, 
  avatarIndex, 
  size = 64, 
  className = "",
  style = 'avataaars',
  useDefault = false
}: AvatarGeneratorProps) => {
  // ✅ NEW: Default avatar with RED user icon on WHITE background
  if (useDefault || avatarIndex === -1) {
    return (
      <div
        className={`rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
          border: '2px solid rgba(239, 68, 68, 0.3)',
        }}
      >
        <FaUser 
          className="text-red-600" 
          style={{ 
            fontSize: size * 0.45,
            opacity: 0.85 
          }} 
        />
      </div>
    );
  }

  const avatarSvg = useMemo(() => {
    const seed = `${userId}-${avatarIndex}`;
    
    const redShades = ['ff0000', 'dc2626', 'ef4444', 'f87171', 'fca5a5', 'b91c1c', '991b1b', 'e11d48', 'be123c'];
    const whiteShades = ['ffffff', 'fafafa', 'f5f5f5', 'f0f0f0', 'e5e5e5', 'e8e8e8', 'ececec'];
    
    const primaryRed = redShades[avatarIndex % redShades.length];
    const secondaryRed = redShades[(avatarIndex + 3) % redShades.length];
    const primaryWhite = whiteShades[avatarIndex % whiteShades.length];
    const secondaryWhite = whiteShades[(avatarIndex + 2) % whiteShades.length];

    const avatar = createAvatar(avataaars, {
      seed,
      size: 200,
      backgroundColor: ['000000'],
      backgroundType: ['solid'],
      clothesColor: [primaryRed, secondaryRed],
      skinColor: [primaryWhite, secondaryWhite],
      hairColor: [primaryRed, secondaryRed],
      facialHairColor: [primaryRed],
      accessoriesColor: [primaryRed],
    });

    return avatar.toString();
  }, [userId, avatarIndex, style]);

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`rounded-full overflow-hidden bg-black flex-shrink-0 ${className}`}
      style={{
        display: 'block',
        width: size,
        height: size,
        borderRadius: '9999px',
      }}
      dangerouslySetInnerHTML={{ __html: avatarSvg }}
    />
  );
};

export default AvatarGenerator;