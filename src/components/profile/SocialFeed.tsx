// components/profile/SocialFeed.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus } from "react-icons/fa";
import CreatePostModal from "./CreatePostModal";
import PostCard from "./PostCard";
import { Post } from "@/components/profile/data/mockProfileData";

interface SocialFeedProps {
  username?: string; // For user-specific feeds
}

export default function SocialFeed({ username }: SocialFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // ✅ Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setCurrentUserId(data.user.id);
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      }
    };
    
    fetchCurrentUser();
  }, []);

  // 🔄 Fetch posts from API
  const fetchPosts = useCallback(
    async (reset = false) => {
      try {
        setIsLoading(true);

        const params = new URLSearchParams();
        if (cursor && !reset) params.append("cursor", cursor);
        if (username) params.append("username", username);
        params.append("limit", "10");

        const response = await fetch(`/api/posts/feed?${params}`, {
          credentials: "include",
        });

        const data = await response.json();

        if (reset) {
          setPosts(data.posts);
        } else {
          setPosts((prev) => [...prev, ...data.posts]);
        }

        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [cursor, username]
  );

  // 🔄 Initial load
  useEffect(() => {
    fetchPosts(true);
  }, [username]);

  // 🔄 WebSocket for real-time updates
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ws = new WebSocket(
      process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001"
    );
    (window as any).ws = ws;

    ws.onopen = () => {
      console.log("✅ WebSocket connected for feed");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        // ✅ Only add posts from OTHER users (not your own)
        if (message.event === "post:new" && !username) {
          const newPost = message.data.post;
          
          // ✅ Prevent adding your own posts via WebSocket
          if (newPost.userId !== currentUserId) {
            setPosts((prev) => {
              // ✅ Check if post already exists
              const exists = prev.some(p => p.id === newPost.id);
              if (exists) return prev;
              
              return [newPost, ...prev];
            });
            
            console.log("✅ Added new post from another user:", newPost.id);
          }
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("🔌 WebSocket disconnected");
    };

    return () => {
      ws.close();
      delete (window as any).ws;
    };
  }, [username, currentUserId]);

  const handleLike = (postId: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  // ✅ FIXED: Single post creation function
  const handleCreatePost = async (
    content: string, 
    media?: File, 
    privacy: 'PUBLIC' | 'PRIVATE' | 'SEEKERS_ONLY' = 'PUBLIC'
  ) => {
    try {
      let mediaUrl = '';
      let mediaType = '';
      let mediaDuration = '';
      let mediaWidth = 0;
      let mediaHeight = 0;
      
      // Upload to Cloudinary if media exists
      if (media) {
        const formData = new FormData();
        formData.append('file', media);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
        
        const cloudinaryResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );
        
        if (!cloudinaryResponse.ok) {
          throw new Error('Failed to upload media');
        }
        
        const cloudinaryData = await cloudinaryResponse.json();
        mediaUrl = cloudinaryData.secure_url;
        mediaType = media.type.startsWith('video/') ? 'video' : 'image';
        mediaWidth = cloudinaryData.width;
        mediaHeight = cloudinaryData.height;
        
        if (mediaType === 'video') {
          mediaDuration = cloudinaryData.duration 
            ? `${Math.floor(cloudinaryData.duration / 60)}:${Math.floor(cloudinaryData.duration % 60).toString().padStart(2, '0')}`
            : '';
        }
      }

      // ✅ Create post via API (ONLY ONCE)
      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content,
          mediaUrl: mediaUrl || undefined,
          mediaType: mediaType || undefined,
          mediaDuration: mediaDuration || undefined,
          mediaWidth: mediaWidth || undefined,
          mediaHeight: mediaHeight || undefined,
          privacy,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create post');
      }

      const data = await response.json();

      // ✅ Add YOUR post to local state immediately (optimistic update)
      setPosts(prev => [data.post, ...prev]);
      
      console.log("✅ Post created and added to feed:", data.post.id);

      // ✅ Broadcast to OTHER users via WebSocket
      if (typeof window !== 'undefined' && (window as any).ws) {
        (window as any).ws.send(JSON.stringify({
          event: 'post:new',
          data: { 
            post: data.post
          }
        }));
        
        console.log("✅ Broadcasted post to other users via WebSocket");
      }
      
    } catch (error) {
      console.error('❌ Failed to create post:', error);
      throw error; // ✅ Re-throw so modal can handle the error
    }
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchPosts(false);
    }
  };

  // Loading state
  if (isLoading && posts.length === 0) {
    return (
      <div className="text-center py-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"
        />
        <p className="text-gray-400">Loading posts...</p>
      </div>
    );
  }

  // Empty state
  if (posts.length === 0 && !isLoading) {
    return (
      <>
        <div className="text-center py-16">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <div className="text-7xl mb-6">📝</div>
          </motion.div>
          <h3 className="text-2xl font-black text-white mb-3">No Posts Yet</h3>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Share your first post to start building your learning journey! Share
            achievements, tips, or ask questions.
          </p>
          <motion.button
            onClick={() => setShowCreateModal(true)}
            className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold text-lg flex items-center gap-3 mx-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaPlus />
            Create Your First Post
          </motion.button>
        </div>

        <CreatePostModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onPost={handleCreatePost}
        />
      </>
    );
  }

  return (
    <>
      {/* Create Post Button */}
      <motion.button
        onClick={() => setShowCreateModal(true)}
        className="w-full mb-6 p-5 bg-gray-900/50 border-2 border-dashed border-red-500/30 rounded-2xl text-gray-400 hover:border-red-500/50 hover:text-red-400 hover:bg-gray-900/70 transition-all flex items-center justify-center gap-3 font-bold text-base group"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <motion.div
          className="p-2 rounded-full bg-red-600/20 text-red-400 group-hover:bg-red-600/30"
          whileHover={{ rotate: 90 }}
          transition={{ duration: 0.3 }}
        >
          <FaPlus className="text-xl" />
        </motion.div>
        <span>Create a new post</span>
      </motion.button>

      {/* Posts */}
      <div className="space-y-6">
        <AnimatePresence>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onLike={handleLike} />
          ))}
        </AnimatePresence>
      </div>

      {/* Load More Button */}
      {hasMore && (
        <motion.button
          onClick={loadMore}
          disabled={isLoading}
          className="w-full mt-6 p-4 bg-gray-900/50 border border-red-500/30 rounded-xl text-gray-400 hover:border-red-500/50 hover:text-red-400 hover:bg-gray-900/70 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: isLoading ? 1 : 1.02 }}
          whileTap={{ scale: isLoading ? 1 : 0.98 }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full"
              />
              <span>Loading...</span>
            </div>
          ) : (
            "Load More Posts"
          )}
        </motion.button>
      )}

      {/* End of feed message */}
      {!hasMore && posts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-gray-500"
        >
          <div className="inline-block px-6 py-3 bg-gray-900/50 border border-red-500/20 rounded-xl">
            You've reached the end of the feed 🎉
          </div>
        </motion.div>
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPost={handleCreatePost}
      />
    </>
  );
}