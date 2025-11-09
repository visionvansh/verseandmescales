// components/profile/ProfileTabs.tsx
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaNewspaper, FaUserFriends, FaHeart, FaChartBar } from "react-icons/fa";
import SocialFeed from "./SocialFeed";
import SeekersTab from "./SeekersTab";
import SeekingTab from "./SeekingTab";

interface ProfileTabsProps {
  username: string;
  isOwnProfile: boolean;
}

export default function ProfileTabs({ username, isOwnProfile }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState('posts');
  const [seekers, setSeekers] = useState([]);
  const [seeking, setSeeking] = useState([]);
  const [counts, setCounts] = useState({
    posts: 0,
    seekers: 0,
    seeking: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Fetch counts on mount
  useEffect(() => {
    fetchCounts();
  }, [username]);

  // ✅ Fetch tab data when active tab changes
  useEffect(() => {
    if (activeTab === 'seekers') {
      fetchSeekers();
    } else if (activeTab === 'seeking') {
      fetchSeeking();
    }
  }, [activeTab, username]);

  // ✅ WebSocket for real-time count updates
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001');

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.event === 'follow:new' && data.data.targetUserId) {
          setCounts(prev => ({ ...prev, seekers: prev.seekers + 1 }));
          if (activeTab === 'seekers') fetchSeekers();
        }

        if (data.event === 'follow:removed' && data.data.targetUserId) {
          setCounts(prev => ({ ...prev, seekers: Math.max(0, prev.seekers - 1) }));
          if (activeTab === 'seekers') fetchSeekers();
        }

        if (data.event === 'post:new' && data.data.post?.user?.username === username) {
          setCounts(prev => ({ ...prev, posts: prev.posts + 1 }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    return () => ws.close();
  }, [username, activeTab]);

  const fetchCounts = async () => {
    try {
      const [postsRes, seekersRes, seekingRes] = await Promise.all([
        fetch(`/api/posts/feed?username=${username}&limit=1`, { credentials: 'include' }),
        // ✅ FIXED: Use correct API endpoints
        fetch(`/api/profile/${username}/followers`, { credentials: 'include' }),
        fetch(`/api/profile/${username}/following`, { credentials: 'include' })
      ]);

      const [postsData, seekersData, seekingData] = await Promise.all([
        postsRes.json(),
        seekersRes.json(),
        seekingRes.json()
      ]);

      setCounts({
        posts: postsData.posts?.length || 0,
        // ✅ FIXED: Use users.length instead of total
        seekers: seekersData.users?.length || 0,
        seeking: seekingData.users?.length || 0
      });
    } catch (error) {
      console.error('Failed to fetch counts:', error);
    }
  };

  const fetchSeekers = async () => {
    try {
      setIsLoading(true);
      // ✅ FIXED: Use correct API endpoint
      const response = await fetch(`/api/profile/${username}/followers`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSeekers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch seekers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSeeking = async () => {
    try {
      setIsLoading(true);
      // ✅ FIXED: Use correct API endpoint
      const response = await fetch(`/api/profile/${username}/following`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSeeking(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch seeking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'posts', label: 'Posts', icon: FaNewspaper, count: counts.posts },
    { id: 'seekers', label: 'Seekers', icon: FaUserFriends, count: counts.seekers },
    { id: 'seeking', label: 'Seeking', icon: FaHeart, count: counts.seeking },
    ...(isOwnProfile ? [{ id: 'analytics', label: 'Analytics', icon: FaChartBar, count: 0 }] : []),
  ];

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30" />
      
      <div className="relative">
        {/* Tab Headers */}
        <div className="border-b border-red-500/20">
          <div className="flex overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 px-6 sm:px-8 py-4 sm:py-5 font-bold text-sm sm:text-base transition-all relative ${
                    isActive ? 'text-red-400' : 'text-gray-400 hover:text-gray-300'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="text-lg" />
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <motion.span 
                        key={tab.count}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          isActive
                            ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                            : 'bg-gray-800/50 text-gray-500'
                        }`}
                      >
                        {tab.count}
                      </motion.span>
                    )}
                  </div>
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-red-500 rounded-t-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'posts' && <SocialFeed username={username} />}
            {activeTab === 'seekers' && (
              isLoading ? (
                <div className="text-center py-12">
                  <motion.div
                    className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              ) : (
                <SeekersTab users={seekers} />
              )
            )}
            {activeTab === 'seeking' && (
              isLoading ? (
                <div className="text-center py-12">
                  <motion.div
                    className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              ) : (
                <SeekingTab users={seeking} />
              )
            )}
            {activeTab === 'analytics' && <AnalyticsTab />}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-2xl font-bold text-white mb-2">Analytics Coming Soon</h3>
        <p className="text-gray-400">Track your profile performance and engagement</p>
      </div>
    </div>
  );
}