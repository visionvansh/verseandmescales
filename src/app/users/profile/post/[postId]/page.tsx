"use client";
import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaArrowLeft, FaHeart, FaRegHeart, FaShare, FaComment, 
  FaEllipsisH, FaTimes, FaReply, FaPaperPlane, FaSmile
} from "react-icons/fa";
import ProfileLayout from "@/components/profile/ProfileLayout";
import FilterSidebar from "@/components/profile/FilterSidebar";

interface PageProps {
  params: Promise<{ postId: string }>;
}

interface User {
  id: string;
  username: string;
  name: string;
  img: string;
}

interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  user: User;
}

interface Comment {
  id: string;
  content: string;
  userId: string;
  user: {
    id: string;
    username: string;
    name: string;
    img: string;
    userXP?: {
      totalXP: number;
      contributorTitle: string;
    };
  };
  createdAt: string;
  isEdited: boolean;
  editedAt?: string;
  reactions: Reaction[];
  replies: Comment[];
  repliesCount: number;
  reactionsCount: number;
  parentId?: string;
}

// Optimized Skeleton Loader Component
const PostPageSkeleton = () => {
  return (
    <div className="px-3 xs:px-4 sm:px-6">
      {/* Back Button Skeleton */}
      <div className="mb-4 sm:mb-6">
        <div className="h-10 w-24 bg-gray-800/40 rounded-xl animate-pulse" />
      </div>

      {/* Post Content Skeleton */}
      <motion.div
        className="relative mb-4 sm:mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-xl sm:rounded-2xl border border-red-500/30" />
        
        <div className="relative p-4 sm:p-6 space-y-4">
          {/* User Info Skeleton */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gray-800/40 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-800/40 rounded-lg animate-pulse w-32" 
                   style={{ animationDelay: '100ms' }} />
              <div className="h-3 bg-gray-800/40 rounded-lg animate-pulse w-24" 
                   style={{ animationDelay: '150ms' }} />
            </div>
            <div className="h-8 w-20 bg-gray-800/40 rounded-lg animate-pulse flex-shrink-0" 
                 style={{ animationDelay: '200ms' }} />
          </div>

          {/* Content Skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-800/40 rounded-lg animate-pulse w-full" 
                 style={{ animationDelay: '250ms' }} />
            <div className="h-4 bg-gray-800/40 rounded-lg animate-pulse w-5/6" 
                 style={{ animationDelay: '300ms' }} />
            <div className="h-4 bg-gray-800/40 rounded-lg animate-pulse w-4/6" 
                 style={{ animationDelay: '350ms' }} />
          </div>

          {/* Media Skeleton */}
          <div className="h-64 sm:h-80 bg-gray-800/40 rounded-lg sm:rounded-xl animate-pulse" 
               style={{ animationDelay: '400ms' }} />

          {/* Stats Skeleton */}
          <div className="flex items-center gap-3 sm:gap-6 border-y border-red-500/20 py-3 sm:py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2" 
                   style={{ animationDelay: `${400 + i * 50}ms` }}>
                <div className="h-4 bg-gray-800/40 rounded-lg animate-pulse w-12" />
                <div className="h-3 bg-gray-800/40 rounded-lg animate-pulse w-16" />
              </div>
            ))}
          </div>

          {/* Actions Skeleton */}
          <div className="flex items-center gap-2 sm:gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-24 bg-gray-800/40 rounded-lg animate-pulse" 
                   style={{ animationDelay: `${600 + i * 50}ms` }} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Comment Form Skeleton */}
      <motion.div
        className="relative mb-4 sm:mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-xl sm:rounded-2xl border border-red-500/30" />
        <div className="relative p-4 sm:p-6 space-y-4">
          <div className="h-6 bg-gray-800/40 rounded-lg animate-pulse w-40" />
          <div className="h-24 bg-gray-800/40 rounded-lg animate-pulse" 
               style={{ animationDelay: '100ms' }} />
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-800/40 rounded-lg animate-pulse w-32" 
                 style={{ animationDelay: '150ms' }} />
            <div className="h-10 w-24 bg-gray-800/40 rounded-lg animate-pulse" 
                 style={{ animationDelay: '200ms' }} />
          </div>
        </div>
      </motion.div>

      {/* Comments Section Skeleton */}
      <motion.div
        className="space-y-3 sm:space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
          <div className="h-6 bg-gray-800/40 rounded-lg animate-pulse w-32" />
        </div>

        {/* Comment Cards Skeleton */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="relative" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-lg sm:rounded-xl border border-red-500/20" />
            <div className="relative p-3 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-800/40 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  {/* User info */}
                  <div className="flex items-center gap-2">
                    <div className="h-4 bg-gray-800/40 rounded-lg animate-pulse w-24" />
                    <div className="h-3 bg-gray-800/40 rounded-lg animate-pulse w-20" />
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-800/40 rounded-lg animate-pulse w-full" />
                    <div className="h-3 bg-gray-800/40 rounded-lg animate-pulse w-4/5" />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="h-6 w-16 bg-gray-800/40 rounded-lg animate-pulse" />
                    <div className="h-6 w-16 bg-gray-800/40 rounded-lg animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Loading indicator */}
      <div className="fixed bottom-8 right-8 z-50">
        <div className="bg-gradient-to-br from-gray-900/90 to-black/95 backdrop-blur-xl border border-red-500/30 rounded-full px-6 py-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="relative w-5 h-5">
              <div className="absolute inset-0 border-2 border-red-500/30 rounded-full"></div>
              <div className="absolute inset-0 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <span className="text-sm font-medium text-white">Loading post...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PostPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { postId } = resolvedParams;
  const router = useRouter();
  
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likedByUsers, setLikedByUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionUsers, setMentionUsers] = useState<any[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchPost();
    fetchComments();
    fetchLikes();
  }, [postId]);

  // WebSocket for real-time updates
  useEffect(() => {
    if (typeof window === "undefined" || !currentUser) return;

    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001");

    ws.onopen = () => {
      console.log("✅ Connected to post page WebSocket");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.event === "post:like" && data.data.postId === postId) {
          setPost((prev: any) => ({
            ...prev,
            likesCount: data.data.likesCount,
            isLiked: data.data.userId === currentUser?.id ? data.data.isLiked : prev.isLiked
          }));
          fetchLikes();
        }

        if (data.event === "comment:new" && data.data.postId === postId) {
          const newComment = data.data.comment;
          
          if (newComment.parentId) {
            setComments(prev => prev.map(comment => 
              comment.id === newComment.parentId
                ? { 
                    ...comment, 
                    replies: [newComment, ...comment.replies], 
                    repliesCount: comment.repliesCount + 1 
                  }
                : comment
            ));
          } else {
            setComments(prev => [newComment, ...prev]);
          }
          
          setPost((prev: any) => ({
            ...prev,
            commentsCount: prev.commentsCount + 1
          }));
        }

        if (data.event === "comment:reaction") {
          updateCommentReaction(data.data);
        }

        if (data.event === "comment:edited") {
          updateComment(data.data.commentId, { 
            content: data.data.content, 
            isEdited: true, 
            editedAt: data.data.editedAt 
          });
        }

        if (data.event === "comment:deleted") {
          removeComment(data.data.commentId);
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

    return () => ws.close();
  }, [postId, currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Post not found');
      const data = await response.json();
      setPost(data.post);
    } catch (error) {
      console.error('Failed to fetch post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const fetchLikes = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/likes`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setLikedByUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch likes:', error);
    }
  };

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      
      setPost((prev: any) => ({
        ...prev,
        isLiked: data.isLiked,
        likesCount: data.likesCount
      }));

      fetchLikes();
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          content: commentText,
          parentId: replyTo?.id 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCommentText("");
        setReplyTo(null);
        
        if (replyTo) {
          setComments(prev => prev.map(comment => 
            comment.id === replyTo.id
              ? { ...comment, replies: [data.comment, ...comment.replies], repliesCount: comment.repliesCount + 1 }
              : comment
          ));
        } else {
          setComments([data.comment, ...comments]);
        }
        
        setPost((prev: any) => ({ ...prev, commentsCount: prev.commentsCount + 1 }));
      }
    } catch (error) {
      console.error('Failed to comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMention = (text: string) => {
    const match = text.match(/@(\w*)$/);
    if (match) {
      setMentionSearch(match[1]);
      setShowMentions(true);
      searchUsers(match[1]);
    } else {
      setShowMentions(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query) return setMentionUsers([]);
    
    try {
      const response = await fetch(`/api/users/discover?search=${query}&limit=5`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setMentionUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const insertMention = (username: string) => {
    const text = commentText.replace(/@\w*$/, `@${username} `);
    setCommentText(text);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const updateCommentReaction = (data: any) => {
    const updateReactionInComment = (comment: Comment): Comment => {
      if (comment.id === data.commentId) {
        const newReactions = data.reactions || [];
        return { 
          ...comment, 
          reactions: newReactions,
          reactionsCount: newReactions.length 
        };
      }
      
      if (comment.replies && comment.replies.length > 0) {
        return { 
          ...comment, 
          replies: comment.replies.map(updateReactionInComment) 
        };
      }
      
      return comment;
    };

    setComments(prev => prev.map(updateReactionInComment));
  };

  const updateComment = (commentId: string, updates: Partial<Comment>) => {
    const updateInComments = (comment: Comment): Comment => {
      if (comment.id === commentId) {
        return { ...comment, ...updates };
      }
      if (comment.replies && comment.replies.length > 0) {
        return { ...comment, replies: comment.replies.map(updateInComments) };
      }
      return comment;
    };

    setComments(prev => prev.map(updateInComments));
  };

  const removeComment = (commentId: string) => {
    const filterComments = (comments: Comment[]): Comment[] => {
      return comments.filter(comment => {
        if (comment.id === commentId) return false;
        if (comment.replies && comment.replies.length > 0) {
          comment.replies = filterComments(comment.replies);
        }
        return true;
      });
    };

    setComments(prev => filterComments(prev));
    setPost((prev: any) => ({ ...prev, commentsCount: Math.max(0, prev.commentsCount - 1) }));
  };

  if (isLoading) {
    return (
      <ProfileLayout header={<div />} sidebar={<FilterSidebar />}>
        <PostPageSkeleton />
      </ProfileLayout>
    );
  }

  if (!post) {
    return (
      <ProfileLayout header={<div />} sidebar={<FilterSidebar />}>
        <div className="text-center py-8 sm:py-12 px-4">
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-4">Post Not Found</h1>
          <button
            onClick={() => router.back()}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white rounded-xl font-bold text-sm sm:text-base hover:bg-red-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout header={<div />} sidebar={<FilterSidebar />}>
      <div className="px-3 xs:px-4 sm:px-6">
        {/* Back Button */}
        <motion.button
          onClick={() => router.back()}
          className="mb-4 sm:mb-6 px-3 sm:px-4 py-2 bg-gray-900/50 border border-red-500/20 rounded-xl text-gray-300 font-semibold flex items-center gap-2 hover:bg-gray-900 transition-all text-sm sm:text-base"
          whileHover={{ scale: 1.05, x: -5 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaArrowLeft className="text-xs sm:text-sm" />
          <span>Back</span>
        </motion.button>

        {/* Post Content */}
        <motion.div
          className="relative mb-4 sm:mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-xl sm:rounded-2xl border border-red-500/30" />
          
          <div className="relative p-4 sm:p-6">
            {/* User Info */}
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <img
                src={post.user.img}
                alt={post.user.name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl border-2 border-red-500/50 cursor-pointer hover:border-red-500 transition-colors flex-shrink-0"
                onClick={() => router.push(`/users/profile/${post.user.username}`)}
              />
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold cursor-pointer hover:text-red-400 transition-colors text-sm sm:text-base truncate"
                     onClick={() => router.push(`/users/profile/${post.user.username}`)}>
                  {post.user.name}
                </div>
                <div className="text-gray-400 text-xs sm:text-sm truncate">@{post.user.username}</div>
              </div>
              {post.user.userXP && (
                <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-red-600/10 border border-red-500/30 rounded-lg flex-shrink-0">
                  <span className="text-red-400 text-xs font-bold">{post.user.userXP.totalXP} XP</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="text-gray-300 mb-3 sm:mb-4 whitespace-pre-wrap text-sm sm:text-base lg:text-lg leading-relaxed break-words">
              {post.content}
            </div>

            {/* Media */}
            {post.mediaUrl && (
              <div className="mb-3 sm:mb-4 rounded-lg sm:rounded-xl overflow-hidden border border-red-500/20">
                {post.mediaType === 'image' ? (
                  <img src={post.mediaUrl} alt="Post media" className="w-full max-h-[300px] sm:max-h-[400px] md:max-h-[500px] object-cover" />
                ) : (
                  <video src={post.mediaUrl} controls className="w-full max-h-[300px] sm:max-h-[400px] md:max-h-[500px]" />
                )}
              </div>
            )}

            {/* Engagement Stats */}
            <div className="flex items-center gap-3 sm:gap-6 border-y border-red-500/20 py-3 sm:py-4 my-3 sm:my-4 overflow-x-auto hide-scrollbar">
              <button
                onClick={() => setShowLikesModal(true)}
                className="flex items-center gap-1 sm:gap-2 text-gray-400 hover:text-red-400 transition-colors whitespace-nowrap flex-shrink-0"
              >
                <span className="font-bold text-white text-sm sm:text-base">{post.likesCount}</span>
                <span className="text-xs sm:text-sm">Likes</span>
              </button>
              <div className="flex items-center gap-1 sm:gap-2 text-gray-400 whitespace-nowrap flex-shrink-0">
                <span className="font-bold text-white text-sm sm:text-base">{post.commentsCount}</span>
                <span className="text-xs sm:text-sm">Comments</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 text-gray-400 whitespace-nowrap flex-shrink-0">
                <span className="font-bold text-white text-sm sm:text-base">{post.viewsCount || 0}</span>
                <span className="text-xs sm:text-sm">Views</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-4 md:gap-6 flex-wrap">
              <motion.button
                onClick={handleLike}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-semibold transition-all text-xs sm:text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {post.isLiked ? (
                  <>
                    <FaHeart className="text-red-500 text-sm sm:text-base" />
                    <span className="text-red-500">Liked</span>
                  </>
                ) : (
                  <>
                    <FaRegHeart className="text-gray-400 text-sm sm:text-base" />
                    <span className="text-gray-400">Like</span>
                  </>
                )}
              </motion.button>
              <motion.button
                onClick={() => textareaRef.current?.focus()}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-semibold text-gray-400 hover:text-red-400 transition-colors text-xs sm:text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaComment className="text-sm sm:text-base" />
                <span>Comment</span>
              </motion.button>
              <motion.button
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-semibold text-gray-400 hover:text-red-400 transition-colors text-xs sm:text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaShare className="text-sm sm:text-base" />
                <span>Share</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Comment Form */}
        <motion.div
          className="relative mb-4 sm:mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-xl sm:rounded-2xl border border-red-500/30" />
          <div className="relative p-4 sm:p-6">
            <h3 className="text-white font-bold text-base sm:text-lg mb-3 sm:mb-4">
              {replyTo ? `Replying to @${replyTo.username}` : 'Add a Comment'}
            </h3>
            
            {replyTo && (
              <motion.div
                className="mb-3 sm:mb-4 px-3 sm:px-4 py-2 bg-red-600/10 border border-red-500/30 rounded-lg flex items-center justify-between"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <span className="text-gray-300 text-xs sm:text-sm">
                  Replying to <span className="text-red-400 font-semibold">@{replyTo.username}</span>
                </span>
                <button
                  onClick={() => setReplyTo(null)}
                  className="text-gray-400 hover:text-red-400 transition-colors p-1"
                >
                  <FaTimes className="text-xs sm:text-sm" />
                </button>
              </motion.div>
            )}

            <form onSubmit={handleCommentSubmit} className="relative">
              <textarea
                ref={textareaRef}
                value={commentText}
                onChange={(e) => {
                  setCommentText(e.target.value);
                  handleMention(e.target.value);
                }}
                placeholder="Write a comment... (Use @ to mention someone)"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-900/50 border border-red-500/20 rounded-lg sm:rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-red-500/40 transition-colors text-sm sm:text-base"
                rows={3}
              />
              
              {/* Mention Dropdown */}
              <AnimatePresence>
                {showMentions && mentionUsers.length > 0 && (
                  <motion.div
                    className="absolute bottom-full left-0 mb-2 w-full sm:w-64 bg-gray-900 border border-red-500/30 rounded-lg overflow-hidden shadow-2xl z-50 max-h-48 overflow-y-auto"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    {mentionUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => insertMention(user.username)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 hover:bg-red-600/20 transition-colors text-left"
                      >
                        <img src={user.avatar || user.img} alt={user.name} className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-semibold text-xs sm:text-sm truncate">{user.name}</div>
                          <div className="text-gray-400 text-xs truncate">@{user.username}</div>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-2 sm:mt-3 flex items-center justify-between gap-2 flex-wrap">
                <div className="text-gray-500 text-xs sm:text-sm">
                  {commentText.length} / 2000 characters
                </div>
                <motion.button
                  type="submit"
                  disabled={!commentText.trim() || isSubmitting}
                  className="px-4 sm:px-6 py-1.5 sm:py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg sm:rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                  whileHover={{ scale: !commentText.trim() || isSubmitting ? 1 : 1.05 }}
                  whileTap={{ scale: !commentText.trim() || isSubmitting ? 1 : 0.95 }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="relative w-3 h-3 sm:w-4 sm:h-4">
                        <div className="absolute inset-0 border-2 border-white/30 rounded-full"></div>
                        <div className="absolute inset-0 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <span className="hidden xs:inline">Posting...</span>
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="text-xs sm:text-sm" />
                      <span>{replyTo ? 'Reply' : 'Post'}</span>
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Comments Section */}
        <motion.div
          className="space-y-3 sm:space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
            <h3 className="text-white font-bold text-lg sm:text-xl">
              Comments ({comments.length})
            </h3>
          </div>

          {comments.length === 0 ? (
            <div className="text-center py-8 sm:py-12 px-4">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">💬</div>
              <p className="text-gray-400 text-sm sm:text-base">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <AnimatePresence>
              {comments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  postId={postId}
                  currentUser={currentUser}
                  onReply={(id, username) => {
                    setReplyTo({ id, username });
                    textareaRef.current?.focus();
                  }}
                />
              ))}
            </AnimatePresence>
          )}
        </motion.div>

        {/* Likes Modal */}
        <AnimatePresence>
          {showLikesModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLikesModal(false)}
            >
              <motion.div
                className="bg-gray-900 border border-red-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md w-full max-h-[80vh] sm:max-h-[600px] overflow-y-auto"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-white font-bold text-lg sm:text-xl">Liked by</h3>
                  <button
                    onClick={() => setShowLikesModal(false)}
                    className="text-gray-400 hover:text-white transition-colors p-2"
                  >
                    <FaTimes className="text-sm sm:text-base" />
                  </button>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {likedByUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                      onClick={() => {
                        router.push(`/users/profile/${user.username}`);
                        setShowLikesModal(false);
                      }}
                    >
                      <img
                        src={user.img || user.avatar}
                        alt={user.name}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 border-red-500/30 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold text-sm sm:text-base truncate">{user.name}</div>
                        <div className="text-gray-400 text-xs sm:text-sm truncate">@{user.username}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </ProfileLayout>
  );
}

// Comment Card Component (keep exactly the same as before)
interface CommentCardProps {
  comment: Comment;
  postId: string;
  currentUser: any;
  onReply: (id: string, username: string) => void;
  depth?: number;
}

function CommentCard({ comment, postId, currentUser, onReply, depth = 0 }: CommentCardProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [showMenu, setShowMenu] = useState(false);

  const isOwnComment = currentUser?.id === comment.userId;
  const maxDepth = 3;

  const handleReaction = async (emoji: string) => {
    try {
      const response = await fetch(`/api/comments/${comment.id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) throw new Error('Failed to react');

      setShowReactions(false);
    } catch (error) {
      console.error('Failed to react:', error);
    }
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;

    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: editText }),
      });

      if (response.ok) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to edit comment:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await fetch(`/api/comments/${comment.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const reactionGroups = (comment.reactions || []).reduce((acc, reaction) => {
    if (!reaction || !reaction.emoji) return acc;
    
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, Reaction[]>);

  const hasUserReacted = (emoji: string) => {
    return (comment.reactions || []).some(r => r.emoji === emoji && r.userId === currentUser?.id);
  };

  return (
    <motion.div
      className={`relative ${depth > 0 ? 'ml-4 sm:ml-6 md:ml-8 mt-2 sm:mt-3' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-lg sm:rounded-xl border border-red-500/20" />
      
      <div className="relative p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <img
            src={comment.user.img}
            alt={comment.user.name}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 border-red-500/30 flex-shrink-0"
          />
          
          <div className="flex-1 min-w-0">
            {/* User Info & Menu */}
            <div className="flex items-start justify-between mb-1 sm:mb-2 gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                  <span className="text-white font-semibold text-xs sm:text-sm truncate">{comment.user.name}</span>
                  <span className="text-gray-500 text-xs">@{comment.user.username}</span>
                  {comment.user.userXP && (
                    <span className="text-red-400 text-xs font-bold px-1.5 sm:px-2 py-0.5 bg-red-600/10 border border-red-500/30 rounded whitespace-nowrap">
                      {comment.user.userXP.totalXP} XP
                    </span>
                  )}
                  <span className="text-gray-600 text-xs whitespace-nowrap">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                  {comment.isEdited && (
                    <span className="text-gray-600 text-xs">(edited)</span>
                  )}
                </div>
              </div>

              {isOwnComment && (
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                  >
                    <FaEllipsisH className="text-xs sm:text-sm" />
                  </button>
                  
                  <AnimatePresence>
                    {showMenu && (
                      <motion.div
                        className="absolute right-0 top-full mt-1 bg-gray-900 border border-red-500/30 rounded-lg overflow-hidden shadow-2xl z-10 min-w-[100px] sm:min-w-[120px]"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setShowMenu(false);
                          }}
                          className="w-full px-3 sm:px-4 py-2 text-left text-white hover:bg-red-600/20 transition-colors text-xs sm:text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            handleDelete();
                            setShowMenu(false);
                          }}
                          className="w-full px-3 sm:px-4 py-2 text-left text-red-400 hover:bg-red-600/20 transition-colors text-xs sm:text-sm"
                        >
                          Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Comment Content */}
            {isEditing ? (
              <div className="mb-2 sm:mb-3">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-900/50 border border-red-500/20 rounded-lg text-white resize-none focus:outline-none focus:border-red-500/40 text-xs sm:text-sm"
                  rows={2}
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={handleEdit}
                    className="px-3 sm:px-4 py-1 bg-red-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-red-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditText(comment.content);
                    }}
                    className="px-3 sm:px-4 py-1 bg-gray-700 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-300 text-xs sm:text-sm mb-2 sm:mb-3 leading-relaxed whitespace-pre-wrap break-words">
                {comment.content.split(/(@\w+)/g).map((part, i) =>
                  part.startsWith('@') ? (
                    <span key={i} className="text-red-400 font-semibold">{part}</span>
                  ) : (
                    part
                  )
                )}
              </p>
            )}

            {/* Reactions Display */}
            {Object.keys(reactionGroups).length > 0 && (
              <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-3">
                {Object.entries(reactionGroups).map(([emoji, reactions]) => (
                  <motion.button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-xs transition-all ${
                      hasUserReacted(emoji)
                        ? 'bg-red-600/20 border border-red-500/50'
                        : 'bg-gray-800/50 border border-gray-700 hover:border-red-500/30'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={reactions
                      .filter(r => r.user)
                      .map(r => r.user.name)
                      .join(', ')
                    }
                  >
                    <span className="text-sm sm:text-base">{emoji}</span>
                    <span className={`text-xs ${hasUserReacted(emoji) ? 'text-red-400 font-bold' : 'text-gray-400'}`}>
                      {reactions.length}
                    </span>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm flex-wrap">
              {depth < maxDepth && (
                <button
                  onClick={() => onReply(comment.id, comment.user.username)}
                  className="flex items-center gap-1 text-gray-400 hover:text-red-400 transition-colors font-semibold"
                >
                  <FaReply className="text-xs" />
                  <span>Reply</span>
                </button>
              )}

              <div className="relative">
                <button
                  onClick={() => setShowReactions(!showReactions)}
                  className="flex items-center gap-1 text-gray-400 hover:text-red-400 transition-colors font-semibold"
                >
                  <FaSmile className="text-xs" />
                  <span>React</span>
                </button>

                <AnimatePresence>
                  {showReactions && (
                    <motion.div
                      className="absolute left-0 bottom-full mb-2 z-20 bg-gray-900 border border-red-500/30 rounded-lg p-1.5 sm:p-2 shadow-2xl"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      <div className="flex gap-1">
                        {['❤️', '👍', '😂', '😮', '😢', '🎉', '🔥'].map((emoji) => (
                          <motion.button
                            key={emoji}
                            onClick={() => handleReaction(emoji)}
                            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-lg sm:text-2xl hover:bg-red-600/20 rounded-lg transition-colors"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {emoji}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {comment.repliesCount > 0 && (
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="text-gray-400 hover:text-red-400 transition-colors font-semibold whitespace-nowrap"
                >
                  {showReplies ? 'Hide' : 'Show'} {comment.repliesCount} {comment.repliesCount === 1 ? 'reply' : 'replies'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Nested Replies */}
        <AnimatePresence>
          {showReplies && comment.replies && comment.replies.length > 0 && (
            <motion.div
              className="mt-2 sm:mt-3 space-y-2 sm:space-y-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {comment.replies.map((reply) => (
                <CommentCard
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  currentUser={currentUser}
                  onReply={onReply}
                  depth={depth + 1}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}