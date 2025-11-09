// components/profile/UserHoverCard.tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { User } from "@/components/profile/data/mockProfileData";
import { FaStar, FaUserFriends, FaChalkboardTeacher, FaGraduationCap, FaLock } from "react-icons/fa";
import { useRouter } from "next/navigation";
import AvatarGenerator from "@/components/settings/AvatarGenerator";

interface UserHoverCardProps {
  user: User;
  isVisible: boolean;
  position: { x: number; y: number };
}

export default function UserHoverCard({ user, isVisible, position }: UserHoverCardProps) {
  const router = useRouter();
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [flipVertical, setFlipVertical] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Check if card would go off screen
      const cardHeight = 400; // Approximate card height
      const cardWidth = 320; // 80 * 4 = 320px (w-80)
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let newY = position.y - 20;
      let shouldFlip = false;

      // Check if card would go off top
      if (newY - cardHeight < 0) {
        newY = position.y + 40; // Show below instead
        shouldFlip = true;
      }

      // Check if card would go off bottom
      if (newY + cardHeight > viewportHeight) {
        newY = viewportHeight - cardHeight - 20;
      }

      // Ensure X position stays in viewport
      let newX = position.x;
      if (newX - cardWidth / 2 < 0) {
        newX = cardWidth / 2 + 10;
      } else if (newX + cardWidth / 2 > viewportWidth) {
        newX = viewportWidth - cardWidth / 2 - 10;
      }

      setAdjustedPosition({ x: newX, y: newY });
      setFlipVertical(shouldFlip);
    }
  }, [isVisible, position]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: flipVertical ? -10 : 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: flipVertical ? -10 : 10 }}
          transition={{ duration: 0.2 }}
          className="fixed z-[100]"
          style={{
            left: adjustedPosition.x,
            top: adjustedPosition.y,
            transform: flipVertical ? 'translate(-50%, 0%)' : 'translate(-50%, -100%)',
          }}
        >
          <div className="relative w-80">
            {/* ✅ Removed red gradient overlay */}
            <div className="absolute inset-0 bg-black/95 rounded-2xl border border-red-500/40" />
            
            <div className="relative p-5">
              {user.isPrivate ? (
                // Private Profile Hover
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-600/20 border-2 border-red-500/30 mb-3">
                    <FaLock className="text-2xl text-red-500" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1">{user.name}</h3>
                  <p className="text-gray-400 text-sm mb-3">@{user.username}</p>
                  <div className="px-4 py-2 bg-gray-900/50 rounded-lg border border-red-500/20">
                    <p className="text-xs text-gray-400">🔒 This profile is private</p>
                  </div>
                </div>
              ) : (
                // Public Profile Hover
                <>
                  {/* Cover if exists */}
                  {user.coverImage && (
                    <div className="relative h-20 -mx-5 -mt-5 mb-4 rounded-t-2xl overflow-hidden">
                      <img
                        src={user.coverImage}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
                    </div>
                  )}

                  {/* Avatar with Default Support */}
                  <div className="flex items-start gap-4 mb-4" style={{ marginTop: user.coverImage ? '-40px' : '0' }}>
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 rounded-xl border-3 border-black shadow-xl overflow-hidden bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                        {user.avatarObject?.isCustomUpload && user.avatarObject?.customImageUrl ? (
                          // Custom uploaded avatar
                          <img
                            src={user.avatarObject.customImageUrl}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : user.avatarObject && 
                            typeof user.avatarObject.avatarIndex === 'number' && 
                            user.avatarObject.avatarIndex >= 0 ? (
                          // Generated avatar
                          <AvatarGenerator
                            userId={user.id}
                            avatarIndex={user.avatarObject.avatarIndex}
                            size={64}
                            style={(user.avatarObject.avatarStyle || 'avataaars') as 'avataaars'}
                          />
                        ) : (
                          // Default avatar (RED user icon on WHITE background)
                          <AvatarGenerator
                            userId={user.id}
                            avatarIndex={-1}
                            size={64}
                            useDefault={true}
                          />
                        )}
                      </div>
                      
                      {user.badges[0] && (
                        <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-gradient-to-br ${user.badges[0].color} border-2 border-black flex items-center justify-center text-sm shadow-lg`}>
                          {user.badges[0].icon}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-base truncate">
                        {user.name}
                      </h3>
                      <p className="text-gray-400 text-sm truncate">@{user.username}</p>
                    </div>
                  </div>

                  {/* Bio */}
                  {user.bio && (
                    <p className="text-gray-400 text-xs line-clamp-2 mb-4">
                      {user.bio}
                    </p>
                  )}

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-black text-red-400 flex items-center justify-center gap-1">
                        <FaStar className="text-xs" />
                        {user.xp}
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold">XP</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-black text-white">{user.seekers}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold">Seekers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-black text-white">{user.seeking}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold">Seeking</div>
                    </div>
                  </div>

                  {/* Courses */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="px-3 py-2 bg-purple-600/10 border border-purple-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
                        <FaChalkboardTeacher />
                        <span>{user.coursesMade} Created</span>
                      </div>
                    </div>
                    <div className="px-3 py-2 bg-blue-600/10 border border-blue-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
                        <FaGraduationCap />
                        <span>{user.coursesLearning} Learning</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges Preview */}
                  {user.badges.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs text-gray-500 font-bold">Badges:</span>
                      <div className="flex gap-1">
                        {user.badges.slice(0, 4).map((badge) => (
                          <div
                            key={badge.id}
                            className={`w-7 h-7 rounded-lg bg-gradient-to-br ${badge.color} border border-white/20 flex items-center justify-center text-sm shadow-lg`}
                            title={badge.name}
                          >
                            {badge.icon}
                          </div>
                        ))}
                        {user.badges.length > 4 && (
                          <div className="w-7 h-7 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-xs text-gray-400 font-bold">
                            +{user.badges.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Button - Made clickable */}
                  <button
                    className="w-full py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-bold text-sm shadow-lg hover:from-red-700 hover:to-red-800 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/users/profile/${user.username}`);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
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