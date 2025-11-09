// components/profile/BadgeDisplay.tsx
"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { Badge } from "@/components/profile/data/mockProfileData";

interface BadgeDisplayProps {
  badges: Badge[];
}

export default function BadgeDisplay({ badges }: BadgeDisplayProps) {
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      {badges.map((badge, index) => (
        <motion.div
          key={badge.id}
          className="relative"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          onMouseEnter={() => setHoveredBadge(badge.id)}
          onMouseLeave={() => setHoveredBadge(null)}
        >
          <div className={`relative px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r ${badge.color} border border-white/20 cursor-pointer transition-transform hover:scale-110`}>
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">{badge.icon}</span>
              <span className="text-xs sm:text-sm font-bold text-white">{badge.name}</span>
            </div>
          </div>

          {/* Tooltip */}
          {hoveredBadge === badge.id && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50"
            >
              <div className="bg-black border border-red-500/30 rounded-lg p-3 shadow-xl min-w-[200px]">
                <div className="text-white font-bold text-sm mb-1">{badge.name}</div>
                <div className="text-gray-400 text-xs mb-2">{badge.description}</div>
                <div className="text-red-400 text-xs font-semibold">{badge.requirement}</div>
              </div>
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
}