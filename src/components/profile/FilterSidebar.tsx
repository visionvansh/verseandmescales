// components/profile/FilterSidebar.tsx
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaSearch, FaGraduationCap, FaBook, FaUsers, FaStar } from "react-icons/fa";
import { User } from "@/components/profile/data/mockProfileData";
import UserHoverCard from "./UserHoverCard";
import AvatarGenerator from "@/components/settings/AvatarGenerator";

interface FilterSidebarProps {
  users?: User[];
}

export default function FilterSidebar({ users: propUsers = [] }: FilterSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<'all' | 'tutors' | 'learners'>('all');
  const [users, setUsers] = useState<User[]>(propUsers);
  const [isLoading, setIsLoading] = useState(false);
  const [showHoverCard, setShowHoverCard] = useState(false);
  const [hoveredUser, setHoveredUser] = useState<User | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  const filters = [
    { id: 'all', label: 'All Users', icon: FaUsers },
    { id: 'tutors', label: 'Tutors', icon: FaGraduationCap },
    { id: 'learners', label: 'Learners', icon: FaBook },
  ];

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, activeFilter]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (activeFilter !== 'all') params.append('filter', activeFilter);
      params.append('limit', '20');
      
      const response = await fetch(`/api/users/discover?${params}`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data.users);
      
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserHover = (user: User, e: React.MouseEvent) => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    const rect = e.currentTarget.getBoundingClientRect();
    setHoverPosition({
      x: rect.right + 10,
      y: rect.top + rect.height / 2
    });
    setHoveredUser(user);
    
    const timeout = setTimeout(() => {
      setShowHoverCard(true);
    }, 100);
    
    setHoverTimeout(timeout);
  };

  const handleUserLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    
    const timeout = setTimeout(() => {
      setShowHoverCard(false);
    }, 100);
    
    setHoverTimeout(timeout);
  };

  // ✅ Updated Helper function with default avatar support
  const renderUserAvatar = (user: User, size: number) => {
    // Priority 1: Custom uploaded image
    if (user.avatarObject?.isCustomUpload && user.avatarObject?.customImageUrl) {
      return (
        <img
          src={user.avatarObject.customImageUrl}
          alt={user.name}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 border-red-500/50 object-cover"
        />
      );
    }

    // Priority 2: Generated avatar (only if avatarIndex is valid)
    if (user.avatarObject && 
        typeof user.avatarObject.avatarIndex === 'number' && 
        user.avatarObject.avatarIndex >= 0) {
      return (
        <div className="w-8 h-8 sm:w-10 sm:h-10">
          <AvatarGenerator
            userId={user.id}
            avatarIndex={user.avatarObject.avatarIndex}
            size={size}
            style={(user.avatarObject.avatarStyle || 'avataaars') as 'avataaars'}
            className="rounded-lg border-2 border-red-500/50"
          />
        </div>
      );
    }

    // Priority 3: Default avatar (RED user icon on WHITE background)
    return (
      <div className="w-8 h-8 sm:w-10 sm:h-10">
        <AvatarGenerator
          userId={user.id}
          avatarIndex={-1}
          size={size}
          useDefault={true}
          className="rounded-lg border-2 border-red-500/50"
        />
      </div>
    );
  };

  return (
    <>
      <div className="sticky top-4 sm:top-6">
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-xl sm:rounded-2xl border border-red-500/30" />
          
          <div className="relative p-3 xs:p-4 sm:p-5">
            {/* Header - Responsive text */}
            <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center">
              <FaSearch className="mr-1.5 sm:mr-2 text-red-500 text-sm sm:text-base" />
              <span className="text-sm sm:text-base">Discover People</span>
            </h2>

            {/* Search Bar - Responsive sizing */}
            <div className="relative mb-3 sm:mb-4">
              <FaSearch className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs sm:text-sm" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-gray-900/50 border border-red-500/20 rounded-lg sm:rounded-xl text-white text-xs sm:text-sm placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition-colors"
              />
            </div>

            {/* Filters - Responsive spacing */}
            <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
              {filters.map((filter) => {
                const Icon = filter.icon;
                const isActive = activeFilter === filter.id;
                
                return (
                  <motion.button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id as any)}
                    className={`w-full p-2.5 sm:p-3 rounded-lg sm:rounded-xl text-left transition-all border ${
                      isActive
                        ? 'bg-red-600/20 border-red-500/50 text-red-400'
                        : 'bg-gray-900/40 border-red-500/20 text-gray-300 hover:bg-gray-800/50 hover:border-red-500/40'
                    }`}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <Icon className={`text-base sm:text-lg ${isActive ? 'text-red-500' : 'text-gray-500'}`} />
                      <span className="font-semibold text-xs sm:text-sm">{filter.label}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* User List - Responsive sizing */}
            <div 
              className="space-y-1.5 sm:space-y-2 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-1 sm:pr-2"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              
              <h3 className="text-[10px] xs:text-xs font-bold text-gray-500 uppercase mb-1.5 sm:mb-2 sticky top-0 bg-black/80 backdrop-blur-sm py-1">
                {isLoading ? 'Loading...' : `${users.length} People Found`}
              </h3>
              
              {isLoading ? (
                <div className="text-center py-6 sm:py-8">
                  <motion.div
                    className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-red-500 border-t-transparent rounded-full mx-auto"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-gray-500">
                  <p className="text-xs sm:text-sm">No users found</p>
                </div>
              ) : (
                users.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative group cursor-pointer"
                    onClick={() => window.location.href = `/users/profile/${user.username}`}
                    onMouseEnter={(e) => handleUserHover(user, e)}
                    onMouseLeave={handleUserLeave}
                  >
                    <div className="absolute inset-0 bg-gray-900/30 rounded-lg sm:rounded-xl border border-red-500/10 group-hover:bg-gray-800/50 group-hover:border-red-500/30 transition-all" />
                    
                    <div className="relative p-2 sm:p-3 flex items-center gap-2 sm:gap-3">
                      {/* ✅ Avatar with default fallback */}
                      <div className="relative flex-shrink-0">
                        {renderUserAvatar(user, 40)}
                        
                        {user.badges[0] && (
                          <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-md bg-gradient-to-br from-red-600 to-red-800 border border-black flex items-center justify-center text-[8px] sm:text-[10px]">
                            {user.badges[0].icon}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold text-xs sm:text-sm truncate group-hover:text-red-400 transition-colors">
                          {user.name}
                        </div>
                        <div className="text-gray-500 text-[10px] xs:text-xs truncate">@{user.username}</div>
                      </div>

                      <div className="flex-shrink-0 text-right">
                        <div className="flex items-center gap-0.5 sm:gap-1 text-red-400 text-[10px] xs:text-xs font-bold">
                          <FaStar className="text-[8px] sm:text-[10px]" />
                          <span>{user.xp}</span>
                        </div>
                        <div className="text-gray-600 text-[9px] xs:text-[10px] capitalize">{user.type}</div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Hover Card */}
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