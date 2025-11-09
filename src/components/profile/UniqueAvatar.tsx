"use client";
import { useMemo } from 'react';

interface UniqueAvatarProps {
  userId: string;
  username: string;
  size?: number;
  className?: string;
}

export default function UniqueAvatar({ userId, username, size = 128, className = '' }: UniqueAvatarProps) {
  const avatarData = useMemo(() => {
    // Generate unique pattern based on userId
    const hash = userId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    // Generate pattern grid (8x8)
    const grid: boolean[][] = [];
    let seed = Math.abs(hash);
    
    for (let i = 0; i < 8; i++) {
      grid[i] = [];
      for (let j = 0; j < 4; j++) {
        seed = (seed * 9301 + 49297) % 233280;
        grid[i][j] = seed / 233280 > 0.5;
        grid[i][7 - j] = grid[i][j]; // Mirror for symmetry
      }
    }

    // Select colors based on hash
    const redShades = ['#dc2626', '#ef4444', '#f87171', '#b91c1c', '#991b1b'];
    const blackShades = ['#000000', '#1a1a1a', '#262626', '#171717', '#0a0a0a'];
    
    const primaryColor = redShades[Math.abs(hash) % redShades.length];
    const secondaryColor = blackShades[Math.abs(hash * 2) % blackShades.length];

    return { grid, primaryColor, secondaryColor };
  }, [userId]);

  const initial = username.charAt(0).toUpperCase();
  const cellSize = size / 8;

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Pixel Pattern Background */}
      <svg width={size} height={size} viewBox="0 0 8 8" className="absolute inset-0">
        <rect width="8" height="8" fill={avatarData.secondaryColor} />
        {avatarData.grid.map((row, i) =>
          row.map((cell, j) =>
            cell ? (
              <rect
                key={`${i}-${j}`}
                x={j}
                y={i}
                width="1"
                height="1"
                fill={avatarData.primaryColor}
              />
            ) : null
          )
        )}
      </svg>

      {/* Initial Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
        <span 
          className="font-black text-white"
          style={{ fontSize: size * 0.4 }}
        >
          {initial}
        </span>
      </div>

      {/* Border */}
      <div className="absolute inset-0 border-2 border-red-500/30 rounded-full" />
    </div>
  );
}