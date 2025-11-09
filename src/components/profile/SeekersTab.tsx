// components/profile/SeekersTab.tsx
"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { User } from "@/components/profile/data/mockProfileData";
import UserHoverCard from "./UserHoverCard";
import { FaStar, FaChalkboardTeacher, FaGraduationCap, FaUserGraduate } from "react-icons/fa";
import { useRouter } from "next/navigation";

interface SeekersTabProps {
  users: User[];
}

export default function SeekersTab({ users }: SeekersTabProps) {
  const router = useRouter();
  const [showHoverCard, setShowHoverCard] = useState(false);
  const [hoveredUser, setHoveredUser] = useState<User | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleUserHover = (user: User, e: React.MouseEvent) => {
    if (hoverTimeout) clearTimeout(hoverTimeout);

    const rect = e.currentTarget.getBoundingClientRect();
    setHoverPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    setHoveredUser(user);
    
    const timeout = setTimeout(() => {
      setShowHoverCard(true);
    }, 200);
    
    setHoverTimeout(timeout);
  };

  const handleUserLeave = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    
    const timeout = setTimeout(() => {
      setShowHoverCard(false);
    }, 150);
    
    setHoverTimeout(timeout);
  };

  const getUserTypeIcon = (type: string) => {
    switch(type) {
      case 'tutor':
        return <FaChalkboardTeacher className="text-purple-500" />;
      case 'learner':
        return <FaGraduationCap className="text-blue-500" />;
      case 'both':
        return <FaUserGraduate className="text-red-500" />;
      default:
        return null;
    }
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👥</div>
        <h3 className="text-xl font-bold text-white mb-2">No Seekers Yet</h3>
        <p className="text-gray-400">When people follow this profile, they'll appear here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="relative group cursor-pointer"
            onClick={() => router.push(`/users/profile/${user.username}`)}
            onMouseEnter={(e) => handleUserHover(user, e)}
            onMouseLeave={handleUserLeave}
          >
            <div className="absolute inset-0 bg-gray-900/50 rounded-xl border border-red-500/20 group-hover:border-red-500/40 transition-all" />
            
            <div className="relative p-5">
              <div className="flex items-start gap-4 mb-3">
                <div className="relative flex-shrink-0">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-16 h-16 rounded-xl border-2 border-red-500/50 group-hover:border-red-500 transition-colors"
                  />
                  {user.badges[0] && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-lg bg-gradient-to-br from-red-600 to-red-800 border border-black flex items-center justify-center text-sm">
                      {user.badges[0].icon}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-base truncate group-hover:text-red-400 transition-colors">
                    {user.name}
                  </h3>
                  <p className="text-gray-400 text-sm truncate">@{user.username}</p>
                  
                  <div className="flex items-center gap-2 mt-1">
                    {getUserTypeIcon(user.type)}
                    <div className="flex items-center gap-1 text-red-400 text-xs font-bold">
                      <FaStar className="text-[10px]" />
                      {user.xp}
                    </div>
                  </div>
                </div>
              </div>

              {user.bio && (
                <p className="text-gray-400 text-xs line-clamp-2 mb-3">
                  {user.bio}
                </p>
              )}

              <motion.button
                className="w-full py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-red-400 text-sm font-semibold transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle follow back
                }}
              >
                Follow Back
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      <div
        onMouseEnter={() => {
          if (hoverTimeout) clearTimeout(hoverTimeout);
          setShowHoverCard(true);
        }}
        onMouseLeave={handleUserLeave}
      >
        {hoveredUser && (
          <UserHoverCard
            user={hoveredUser}
            isVisible={showHoverCard}
            position={hoverPosition}
          />
        )}
      </div>
    </>
  );
}