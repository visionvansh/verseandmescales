"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaHeart, FaComment, FaShare, FaPlay, FaRegHeart } from "react-icons/fa";
import { Post } from "@/components/profile/data/mockProfileData";
import UserHoverCard from "./UserHoverCard";
import { useRouter } from "next/navigation";

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
}

export default function PostCard({ post, onLike }: PostCardProps) {
  const router = useRouter();
  const [showHoverCard, setShowHoverCard] = useState(false);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [commentsCount, setCommentsCount] = useState(post.comments);
  const [isLiking, setIsLiking] = useState(false);

  // 🔄 WebSocket listener for real-time updates
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ws) {
      const ws = (window as any).ws;
      
      const handleUpdate = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        
        if (data.event === 'post:like' && data.data.postId === post.id) {
          setLikesCount(data.data.likesCount);
        }
        
        if (data.event === 'comment:new' && data.data.postId === post.id) {
          setCommentsCount(prev => prev + 1);
        }
      };
      
      ws.addEventListener('message', handleUpdate);
      
      return () => {
        ws.removeEventListener('message', handleUpdate);
      };
    }
  }, [post.id]);

  const handleAvatarHover = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    setShowHoverCard(true);
  };

  // ✅ FIXED: Handle like with proper API integration
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiking) return;
    
    setIsLiking(true);
    const previousLiked = isLiked;
    const previousCount = likesCount;
    
    // Optimistic update
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    
    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error);
      }
      
      // Update with server response
      setIsLiked(data.isLiked);
      setLikesCount(data.likesCount);
      
      onLike(post.id);
      
    } catch (error) {
      // Revert on error
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      console.error('Failed to like post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/users/profile/post/${post.id}`;
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // Track share on backend
      await fetch(`/api/posts/${post.id}/share`, {
        method: 'POST',
        credentials: 'include',
      });
      
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  // ✅ FIXED: Click handler to open full post page
  const handlePostClick = () => {
    router.push(`/users/profile/post/${post.id}`);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-5 sm:mb-6 cursor-pointer"
        onClick={handlePostClick}
        whileHover={{ scale: 1.01 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent rounded-2xl" />
        
        <div className="relative p-4 sm:p-5">
          {/* Post Header */}
          <div className="flex items-start gap-3 mb-4">
            <div
              className="relative cursor-pointer"
              onMouseEnter={handleAvatarHover}
              onMouseLeave={() => setShowHoverCard(false)}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/users/profile/${post.user.username}`);
              }}
            >
              <img
                src={post.user.avatar}
                alt={post.user.name}
                className="w-12 h-12 rounded-xl border-2 border-red-500/50"
              />
              {post.user.badges[0] && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-lg bg-gradient-to-br from-red-600 to-red-800 border border-black flex items-center justify-center text-xs">
                  {post.user.badges[0].icon}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 
                  className="text-white font-bold text-sm sm:text-base hover:text-red-400 cursor-pointer transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/users/profile/${post.user.username}`);
                  }}
                >
                  {post.user.name}
                </h3>
                <span className="text-gray-500 text-xs sm:text-sm">{post.user.username}</span>
                <span className="text-gray-600 text-xs">•</span>
                <span className="text-gray-500 text-xs">{formatTimestamp(post.timestamp)}</span>
              </div>
              
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-600/20 border border-red-500/30 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-[10px] font-semibold text-red-400 uppercase">
                  {post.user.type === 'both' ? 'Tutor & Learner' : post.user.type}
                </span>
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div className="mb-4">
            <p className="text-gray-300 text-sm sm:text-base whitespace-pre-wrap leading-relaxed line-clamp-5">
              {post.content}
            </p>
          </div>

          {/* Media */}
          {post.media && (
            <div className="mb-4 rounded-xl overflow-hidden border border-red-500/20">
              {post.mediaType === 'image' ? (
                <img
                  src={post.media}
                  alt="Post media"
                  className="w-full h-auto max-h-[400px] object-cover"
                />
              ) : (
                <div className="relative w-full h-[300px] bg-gray-900 flex items-center justify-center group">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-transparent" />
                  <div className="relative z-10 text-center">
                    <motion.div
                      className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaPlay className="text-white text-xl ml-1" />
                    </motion.div>
                    {post.videoDuration && (
                      <div className="text-gray-400 text-sm">Duration: {post.videoDuration}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ✅ FIXED: Actions with real counts */}
          <div className="flex items-center gap-6 sm:gap-8">
            <ActionButton
              icon={isLiked ? FaHeart : FaRegHeart}
              count={likesCount}
              active={isLiked}
              onClick={handleLike}
              activeColor="text-red-500"
            />
            <ActionButton
              icon={FaComment}
              count={commentsCount}
              onClick={(e) => {
                e.stopPropagation();
                handlePostClick();
              }}
            />
            <ActionButton
              icon={FaShare}
              count={post.shares}
              onClick={handleShare}
              label={copied ? "Copied!" : undefined}
            />
          </div>
        </div>
      </motion.div>

      <UserHoverCard
        user={post.user}
        isVisible={showHoverCard}
        position={hoverPosition}
      />
    </>
  );
}

interface ActionButtonProps {
  icon: any;
  count: number;
  active?: boolean;
  onClick: (e: React.MouseEvent) => void;
  activeColor?: string;
  label?: string;
}

function ActionButton({ icon: Icon, count, active, onClick, activeColor = "text-red-400", label }: ActionButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`flex items-center gap-2 text-sm sm:text-base transition-colors ${
        active ? activeColor : 'text-gray-400 hover:text-red-400'
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Icon className={active ? "fill-current" : ""} />
      <span className="font-medium">
        {label || (count > 0 ? count.toLocaleString() : "")}
      </span>
    </motion.button>
  );
}