// components/course-builder/chats/ChatUserHoverCard.tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { User } from "@/components/course-builder/chats/types";
import { FaStar, FaLock, FaGraduationCap, FaChalkboardTeacher } from "react-icons/fa";
import { useRouter } from "next/navigation";

interface ChatUserHoverCardProps {
  user: User;
  isVisible: boolean;
  position: { x: number; y: number };
}

export default function ChatUserHoverCard({ user, isVisible, position }: ChatUserHoverCardProps) {
  const router = useRouter();
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [flipVertical, setFlipVertical] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Responsive card dimensions
      const isMobile = window.innerWidth < 640;
      const cardHeight = isMobile ? 280 : user.isPrivate ? 200 : 320;
      const cardWidth = isMobile ? 280 : 320;
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let newY = position.y - 20;
      let shouldFlip = false;

      // Check if card would go off top
      if (newY - cardHeight < 0) {
        newY = position.y + 40;
        shouldFlip = true;
      }

      // Check if card would go off bottom
      if (newY + cardHeight > viewportHeight) {
        newY = viewportHeight - cardHeight - 20;
      }

      // Ensure X position stays in viewport
      let newX = position.x;
      if (newX - cardWidth / 2 < 10) {
        newX = cardWidth / 2 + 10;
      } else if (newX + cardWidth / 2 > viewportWidth - 10) {
        newX = viewportWidth - cardWidth / 2 - 10;
      }

      setAdjustedPosition({ x: newX, y: newY });
      setFlipVertical(shouldFlip);
    }
  }, [isVisible, position, user.isPrivate]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: flipVertical ? -10 : 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: flipVertical ? -10 : 10 }}
          transition={{ duration: 0.2 }}
          className="fixed z-[10000]"
          style={{
            left: adjustedPosition.x,
            top: adjustedPosition.y,
            transform: flipVertical ? 'translate(-50%, 0%)' : 'translate(-50%, -100%)',
          }}
        >
          <div className="relative w-[280px] sm:w-80">
            <div className="absolute inset-0 bg-black/95 rounded-xl sm:rounded-2xl border border-red-500/40" />
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-transparent rounded-xl sm:rounded-2xl" />
            
            <div className="relative p-4 sm:p-5">
              {user.isPrivate ? (
                // Private Profile - Minimal
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
                // Public Profile - Compact
                <>
                  {/* Avatar & Name */}
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 border-black shadow-xl"
                      />
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

                  {/* Bio - Compact */}
                  {user.bio && (
                    <p className="text-gray-400 text-xs line-clamp-2 mb-3">
                      {user.bio}
                    </p>
                  )}

                  {/* Quick Stats - Compact Grid */}
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

                  {/* Courses - Compact */}
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

                  {/* Badges - Compact Row */}
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

            {/* Arrow */}
            <div
              className="absolute left-1/2 transform -translate-x-1/2"
              style={{ 
                [flipVertical ? 'top' : 'bottom']: '-8px',
              }}
            >
              <div className={`border-l-8 border-r-8 ${flipVertical ? 'border-b-8 border-b-red-500/40' : 'border-t-8 border-t-red-500/40'} border-l-transparent border-r-transparent`} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}