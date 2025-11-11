// components/course-builder/chats/ChatUserHoverCard.tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { User } from "@/components/course-builder/chats/types";
import { FaStar, FaLock, FaGraduationCap, FaChalkboardTeacher } from "react-icons/fa";
import { useRouter } from "next/navigation";
import AvatarGenerator from "@/components/settings/AvatarGenerator";

interface ChatUserHoverCardProps {
  user: User;
  isVisible: boolean;
  position: { x: number; y: number };
}

export default function ChatUserHoverCard({ user, isVisible, position }: ChatUserHoverCardProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [flipVertical, setFlipVertical] = useState(false);
  const [arrowOffset, setArrowOffset] = useState(0); // ✅ Track arrow horizontal offset

  useEffect(() => {
    if (isVisible && cardRef.current) {
      const isMobile = window.innerWidth < 640;
      const cardWidth = isMobile ? 280 : 320;
      const cardHeight = user.isPrivate ? (isMobile ? 200 : 220) : (isMobile ? 280 : 320);
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const padding = 16; // Minimum distance from screen edges

      // ✅ Calculate horizontal position (try to center above avatar first)
      let newX = position.x;
      let cardLeft = newX - cardWidth / 2;
      let originalCenterX = newX; // Store original center position
      
      // Check left boundary
      if (cardLeft < padding) {
        cardLeft = padding;
        newX = cardLeft + cardWidth / 2;
      }
      // Check right boundary
      else if (cardLeft + cardWidth > viewportWidth - padding) {
        cardLeft = viewportWidth - cardWidth - padding;
        newX = cardLeft + cardWidth / 2;
      }

      // ✅ Calculate arrow offset (distance from card center to avatar center)
      const arrowOffsetPx = originalCenterX - newX;
      setArrowOffset(arrowOffsetPx);

      // ✅ Calculate vertical position (above avatar by default)
      let newY = position.y - cardHeight - 16; // 16px gap above avatar
      let shouldFlip = false;

      // Check if card would go above viewport
      if (newY < padding) {
        // Flip to below avatar
        newY = position.y + 16; // 16px gap below avatar
        shouldFlip = true;
      }

      // Check if card would go below viewport when flipped
      if (shouldFlip && newY + cardHeight > viewportHeight - padding) {
        // Position at bottom with padding
        newY = viewportHeight - cardHeight - padding;
        shouldFlip = false; // Don't show arrow if constrained
      }

      setAdjustedPosition({ x: newX, y: newY });
      setFlipVertical(shouldFlip);
    }
  }, [isVisible, position, user.isPrivate]);

  // ✅ Helper to render avatar
  const renderAvatar = () => {
    if (user.customImageUrl) {
      return (
        <img
          src={user.customImageUrl}
          alt={user.name}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 border-black shadow-xl object-cover"
        />
      );
    }

    if (user.avatarObject?.isCustomUpload && user.avatarObject.customImageUrl) {
      return (
        <img
          src={user.avatarObject.customImageUrl}
          alt={user.name}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 border-black shadow-xl object-cover"
        />
      );
    }

    if (user.avatarObject && user.avatarObject.avatarIndex >= 0) {
      return (
        <AvatarGenerator
          userId={user.id}
          avatarIndex={user.avatarObject.avatarIndex}
          size={56}
          style={user.avatarObject.avatarStyle as "avataaars"}
          className="border-2 border-black shadow-xl"
        />
      );
    }

    return (
      <AvatarGenerator
        userId={user.id}
        avatarIndex={-1}
        size={56}
        useDefault={true}
        className="border-2 border-black shadow-xl"
      />
    );
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, scale: 0.9, y: flipVertical ? 10 : -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: flipVertical ? 10 : -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed z-[10000] pointer-events-auto"
          style={{
            left: `${adjustedPosition.x}px`,
            top: `${adjustedPosition.y}px`,
            transform: 'translate(-50%, 0%)',
            maxWidth: 'calc(100vw - 32px)',
          }}
        >
          <div className="relative w-[280px] sm:w-80">
            {/* Card Background */}
            <div className="absolute inset-0 bg-black/95 rounded-xl sm:rounded-2xl border border-red-500/40 shadow-2xl backdrop-blur-xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-transparent rounded-xl sm:rounded-2xl" />
            
            {/* Card Content */}
            <div className="relative p-4 sm:p-5">
              {user.isPrivate ? (
                <div className="text-center py-3 sm:py-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-600/20 border-2 border-red-500/30 mb-2 sm:mb-3">
                    <FaLock className="text-xl sm:text-2xl text-red-500" />
                  </div>
                  <h3 className="text-white font-bold text-base sm:text-lg mb-1">{user.name}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3">@{user.username || 'user'}</p>
                  <div className="px-3 py-2 bg-gray-900/50 rounded-lg border border-red-500/20">
                    <p className="text-xs text-gray-400">🔒 Private profile</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Avatar & Name */}
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <div className="relative flex-shrink-0">
                      {renderAvatar()}
                      {user.badges && user.badges[0] && (
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-gradient-to-br ${user.badges[0].color || 'from-red-500 to-red-700'} border-2 border-black flex items-center justify-center text-xs shadow-lg`}>
                          {user.badges[0].icon}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-sm sm:text-base truncate">
                        {user.name}
                      </h3>
                      <p className="text-gray-400 text-xs truncate">@{user.username || 'user'}</p>
                    </div>
                  </div>

                  {/* Bio */}
                  {user.bio && (
                    <p className="text-gray-400 text-xs line-clamp-2 mb-3">
                      {user.bio}
                    </p>
                  )}

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center px-2 py-1.5 bg-gray-900/50 rounded-lg border border-gray-800">
                      <div className="text-sm sm:text-base font-black text-red-400 flex items-center justify-center gap-1">
                        <FaStar className="text-[8px] sm:text-xs" />
                        {user.xp || 0}
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase font-bold">XP</div>
                    </div>
                    <div className="text-center px-2 py-1.5 bg-gray-900/50 rounded-lg border border-gray-800">
                      <div className="text-sm sm:text-base font-black text-white">{user.seekers || 0}</div>
                      <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase font-bold">Seekers</div>
                    </div>
                    <div className="text-center px-2 py-1.5 bg-gray-900/50 rounded-lg border border-gray-800">
                      <div className="text-sm sm:text-base font-black text-white">{user.seeking || 0}</div>
                      <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase font-bold">Seeking</div>
                    </div>
                  </div>

                  {/* Courses */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="px-2 py-1.5 bg-purple-600/10 border border-purple-500/30 rounded-lg">
                      <div className="flex items-center gap-1.5 text-purple-400 text-xs font-bold">
                        <FaChalkboardTeacher className="flex-shrink-0" />
                        <span className="truncate">{user.coursesMade || 0} Made</span>
                      </div>
                    </div>
                    <div className="px-2 py-1.5 bg-blue-600/10 border border-blue-500/30 rounded-lg">
                      <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold">
                        <FaGraduationCap className="flex-shrink-0" />
                        <span className="truncate">{user.coursesLearning || 0} Learning</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  {user.badges && user.badges.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-3 overflow-x-auto no-scrollbar pb-1">
                      <span className="text-[10px] text-gray-500 font-bold flex-shrink-0">Badges:</span>
                      <div className="flex gap-1">
                        {user.badges.slice(0, 5).map((badge, idx) => (
                          <div
                            key={badge.id || idx}
                            className={`w-6 h-6 rounded-lg bg-gradient-to-br ${badge.color || 'from-gray-500 to-gray-700'} border border-white/20 flex items-center justify-center text-xs shadow-lg flex-shrink-0`}
                            title={badge.name}
                          >
                            {badge.icon}
                          </div>
                        ))}
                        {user.badges.length > 5 && (
                          <div className="w-6 h-6 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-[10px] text-gray-400 font-bold flex-shrink-0">
                            +{user.badges.length - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    className="w-full py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-bold text-xs sm:text-sm shadow-lg hover:from-red-700 hover:to-red-800 transition-all active:scale-95"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/users/profile/${user.username || user.id}`);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{ minHeight: '40px' }}
                  >
                    View Profile
                  </button>
                </>
              )}
            </div>

            {/* ✅ Arrow pointing directly at the avatar (offset from center) */}
            <div
              className="absolute transform -translate-x-1/2 transition-all duration-200"
              style={{ 
                left: `calc(50% + ${arrowOffset}px)`,
                [flipVertical ? 'top' : 'bottom']: '-8px',
                // Clamp arrow position within card bounds (with padding)
                marginLeft: `clamp(-${(280/2) - 20}px, 0px, ${(280/2) - 20}px)`,
              }}
            >
              <div 
                className={`
                  border-l-8 border-r-8 border-l-transparent border-r-transparent
                  ${flipVertical 
                    ? 'border-b-8 border-b-red-500/40' 
                    : 'border-t-8 border-t-red-500/40'
                  }
                `} 
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}