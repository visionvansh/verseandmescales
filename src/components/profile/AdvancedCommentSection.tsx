"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaReply, 
  FaEdit, 
  FaTrash, 
  FaEllipsisV,
  FaSmile,
  FaImage,
  FaPaperPlane,
  FaTimes,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaUserCircle,
  FaClock,
  FaHeart,
  FaRegHeart
} from "react-icons/fa";
import Image from "next/image";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  isEdited: boolean;
  editedAt?: string;
  user: {
    id: string;
    username: string;
    name: string;
    img: string;
    userXP?: {
      totalXP: number;
      contributorTitle: string;
    };
    badges?: Array<{
      icon: string;
      title: string;
      color: string;
    }>;
  };
  reactions: Array<{
    emoji: string;
    count: number;
    hasReacted: boolean;
    users: Array<{
      id: string;
      username: string;
      name: string;
      img: string;
    }>;
  }>;
  replies: Comment[];
  _count: {
    reactions: number;
    replies: number;
  };
  parentId?: string;
}

interface UltraAdvancedCommentSectionProps {
  postId: string;
  currentUserId?: string;
}

const EMOJI_REACTIONS = [
  { emoji: '❤️', label: 'Love' },
  { emoji: '👍', label: 'Like' },
  { emoji: '😂', label: 'Laugh' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😡', label: 'Angry' },
  { emoji: '🎉', label: 'Celebrate' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '👏', label: 'Applause' },
  { emoji: '💯', label: '100' }
];

export default function UltraAdvancedCommentSection({ 
  postId, 
  currentUserId 
}: UltraAdvancedCommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'top'>('newest');

  useEffect(() => {
    fetchComments();
  }, [postId, sortBy]);

  // WebSocket for real-time updates
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ws = (window as any).ws;
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);

      switch (data.event) {
        case 'comment:new':
          if (data.data.postId === postId) {
            if (data.data.comment.parentId) {
              setComments(prev => prev.map(comment => 
                comment.id === data.data.comment.parentId
                  ? { 
                      ...comment, 
                      replies: [...comment.replies, data.data.comment],
                      _count: { ...comment._count, replies: comment._count.replies + 1 }
                    }
                  : comment
              ));
            } else {
              setComments(prev => [data.data.comment, ...prev]);
            }
          }
          break;

        case 'comment:edited':
          if (data.data.postId === postId) {
            updateCommentContent(data.data.commentId, data.data.content, data.data.editedAt);
          }
          break;

        case 'comment:deleted':
          if (data.data.postId === postId) {
            removeComment(data.data.commentId);
          }
          break;

        case 'comment:reaction':
          if (data.data.postId === postId) {
            updateCommentReactions(data.data.commentId, data.data.reactions);
          }
          break;
      }
    };

    ws.addEventListener('message', handleMessage);

    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [postId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments?sort=${sortBy}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCommentText.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const mentions = newCommentText.match(/@(\w+)/g)?.map(m => m.slice(1)) || [];

      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content: newCommentText,
          mentions
        })
      });

      if (response.ok) {
        setNewCommentText("");
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateCommentContent = (commentId: string, content: string, editedAt: string) => {
    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        return { ...comment, content, isEdited: true, editedAt };
      }
      if (comment.replies) {
        return {
          ...comment,
          replies: comment.replies.map(reply =>
            reply.id === commentId
              ? { ...reply, content, isEdited: true, editedAt }
              : reply
          )
        };
      }
      return comment;
    }));
  };

  const removeComment = (commentId: string) => {
    setComments(prev => prev.filter(comment => {
      if (comment.id === commentId) return false;
      if (comment.replies) {
        comment.replies = comment.replies.filter(reply => reply.id !== commentId);
      }
      return true;
    }));
  };

  const updateCommentReactions = (commentId: string, reactions: any[]) => {
    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        return { ...comment, reactions };
      }
      if (comment.replies) {
        return {
          ...comment,
          replies: comment.replies.map(reply =>
            reply.id === commentId
              ? { ...reply, reactions }
              : reply
          )
        };
      }
      return comment;
    }));
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"
        />
        <p className="text-gray-400">Loading comments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white flex items-center gap-3">
          <div className="p-2 bg-red-600/20 rounded-xl">
            💬
          </div>
          <span>Comments ({comments.length})</span>
        </h2>

        {/* Sort Options */}
        <div className="flex items-center gap-2 bg-gray-900/50 border border-red-500/20 rounded-xl p-1">
          {[
            { value: 'newest', label: 'Newest' },
            { value: 'top', label: 'Top' },
            { value: 'oldest', label: 'Oldest' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value as any)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                sortBy === option.value
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comment Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-gray-900/90 to-black/95 rounded-2xl border-2 border-red-500/30 group-hover:border-red-500/50 transition-all" />
        
        <form onSubmit={handleSubmitComment} className="relative p-6">
          <div className="flex gap-4">
            {currentUserId && (
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-lg border-2 border-red-500/50">
                  <FaUserCircle />
                </div>
              </div>
            )}

            <div className="flex-1 space-y-3">
              <textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Share your thoughts... (Use @username to mention)"
                className="w-full px-4 py-3 bg-gray-900/50 border border-red-500/20 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-red-500/50 focus:bg-gray-900/70 transition-all"
                rows={3}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors text-gray-400 hover:text-white"
                    title="Add emoji"
                  >
                    <FaSmile className="text-xl" />
                  </button>
                  <button
                    type="button"
                    className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors text-gray-400 hover:text-white"
                    title="Add image"
                  >
                    <FaImage className="text-xl" />
                  </button>
                </div>

                <motion.button
                  type="submit"
                  disabled={!newCommentText.trim() || isSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-red-700 hover:to-red-800 transition-all flex items-center gap-2"
                  whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                >
                  <FaPaperPlane />
                  {isSubmitting ? 'Posting...' : 'Post Comment'}
                </motion.button>
              </div>
            </div>
          </div>
        </form>
      </motion.div>

      {/* Comments List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {comments.map((comment, index) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              postId={postId}
              index={index}
            />
          ))}
        </AnimatePresence>

        {comments.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="text-7xl mb-4">💭</div>
            <h3 className="text-2xl font-bold text-white mb-2">No comments yet</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Be the first to share your thoughts on this post!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  currentUserId,
  postId,
  depth = 0,
  index = 0
}: {
  comment: Comment;
  currentUserId?: string;
  postId: string;
  depth?: number;
  index?: number;
}) {
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editText, setEditText] = useState(comment.content);
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwnComment = currentUserId === comment.user.id;
  const maxDepth = 5;
  const hasReplies = comment.replies && comment.replies.length > 0;

  const handleReaction = async (emoji: string) => {
    try {
      const response = await fetch(`/api/comments/${comment.id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ emoji })
      });

      setShowReactions(false);
    } catch (error) {
      console.error('Failed to react:', error);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const mentions = replyText.match(/@(\w+)/g)?.map(m => m.slice(1)) || [];

      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content: replyText,
          parentId: comment.id,
          mentions
        })
      });

      if (response.ok) {
        setReplyText("");
        setIsReplying(false);
      }
    } catch (error) {
      console.error('Failed to post reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;

    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: editText })
      });

      if (response.ok) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to edit comment:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this comment?')) return;

    try {
      await fetch(`/api/comments/${comment.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const timeAgo = (date: string) => {
    const now = new Date();
    const posted = new Date(date);
    const seconds = Math.floor((now.getTime() - posted.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return posted.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.05 }}
      className={`relative group ${depth > 0 ? 'ml-12 mt-4' : ''}`}
    >
      {/* Connector Line for Replies */}
      {depth > 0 && (
        <div className="absolute left-[-24px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-500/30 to-transparent" />
      )}

      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/20 group-hover:border-red-500/40 transition-all" />
      
      <div className="relative p-5">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative">
              <img
                src={comment.user.img}
                alt={comment.user.name}
                className="w-11 h-11 rounded-xl border-2 border-red-500/30 group-hover:border-red-500/50 transition-all cursor-pointer"
              />
              {comment.user.badges && comment.user.badges[0] && (
                <div 
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-lg bg-gradient-to-br from-red-600 to-red-800 border-2 border-black flex items-center justify-center text-xs shadow-lg"
                  title={comment.user.badges[0].title}
                >
                  {comment.user.badges[0].icon}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-bold hover:text-red-400 transition-colors cursor-pointer">
                    {comment.user.name}
                  </span>
                  <span className="text-gray-500 text-sm">@{comment.user.username}</span>
                  
                  {comment.user.userXP && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-red-600/20 rounded-full border border-red-500/30">
                      <span className="text-red-400 text-xs font-bold">
                        {comment.user.userXP.totalXP} XP
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                    <FaClock className="text-[10px]" />
                    <span>{timeAgo(comment.createdAt)}</span>
                  </div>

                  {comment.isEdited && (
                    <span className="text-gray-600 text-xs italic">(edited)</span>
                  )}
                </div>
              </div>

              {isOwnComment && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <FaEllipsisV className="text-gray-500" />
                  </button>

                  <AnimatePresence>
                    {showMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-red-500/20 rounded-xl shadow-2xl z-20 overflow-hidden"
                      >
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-3 text-left text-white hover:bg-gray-800 transition-colors flex items-center gap-3"
                        >
                          <FaEdit className="text-blue-400" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            handleDelete();
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-3 text-left text-red-400 hover:bg-gray-800 transition-colors flex items-center gap-3"
                        >
                          <FaTrash />
                          <span>Delete</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Content */}
            {isEditing ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 mb-3"
              >
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-red-500/20 rounded-xl text-white resize-none focus:outline-none focus:border-red-500/50 transition-all"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all flex items-center gap-2"
                  >
                    <FaCheck />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditText(comment.content);
                    }}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all flex items-center gap-2"
                  >
                    <FaTimes />
                    Cancel
                  </button>
                </div>
              </motion.div>
            ) : (
              <p className="text-gray-300 text-[15px] mb-4 leading-relaxed whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            )}

            {/* Actions */}
            {!isEditing && (
              <div className="flex items-center gap-4 flex-wrap">
                {/* Reactions */}
                {comment.reactions.length > 0 && (
                  <div className="flex items-center gap-2">
                    {comment.reactions.map((reaction) => (
                      <motion.button
                        key={reaction.emoji}
                        onClick={() => handleReaction(reaction.emoji)}
                        className={`group/reaction flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                          reaction.hasReacted
                            ? 'bg-red-600/30 border border-red-500/50 text-red-400'
                            : 'bg-gray-800/50 border border-gray-700 text-gray-400 hover:bg-gray-800 hover:border-gray-600'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title={reaction.users.map(u => u.name).join(', ')}
                      >
                        <span className="text-base">{reaction.emoji}</span>
                        <span>{reaction.count}</span>
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Add Reaction */}
                <div className="relative">
                  <button
                    onClick={() => setShowReactions(!showReactions)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg text-gray-400 hover:text-white text-sm font-semibold transition-all"
                  >
                    <FaSmile />
                    <span>React</span>
                  </button>

                  <AnimatePresence>
                    {showReactions && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute left-0 top-full mt-2 p-3 bg-gray-900 border border-red-500/20 rounded-xl shadow-2xl z-20"
                      >
                        <div className="flex gap-2">
                          {EMOJI_REACTIONS.map((emoji) => (
                            <motion.button
                              key={emoji.emoji}
                              onClick={() => handleReaction(emoji.emoji)}
                              className="text-2xl hover:scale-125 transition-transform"
                              whileHover={{ scale: 1.3, y: -5 }}
                              title={emoji.label}
                            >
                              {emoji.emoji}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Reply Button */}
                {depth < maxDepth && (
                  <button
                    onClick={() => setIsReplying(!isReplying)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg text-gray-400 hover:text-white text-sm font-semibold transition-all"
                  >
                    <FaReply />
                    <span>Reply</span>
                    {comment._count.replies > 0 && (
                      <span className="px-1.5 py-0.5 bg-gray-700 rounded-full text-xs">
                        {comment._count.replies}
                      </span>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Reply Form */}
            <AnimatePresence>
              {isReplying && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  <form onSubmit={handleSubmitReply} className="space-y-3">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to @${comment.user.username}...`}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-red-500/20 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-red-500/50 transition-all"
                      rows={2}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={!replyText.trim() || isSubmitting}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 transition-all flex items-center gap-2"
                      >
                        <FaPaperPlane className="text-sm" />
                        {isSubmitting ? 'Replying...' : 'Reply'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsReplying(false);
                          setReplyText("");
                        }}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Nested Replies */}
            {hasReplies && (
              <div className="mt-4">
                {/* Show/Hide Replies Button */}
                {comment._count.replies > 3 && (
                  <button
                    onClick={() => setShowAllReplies(!showAllReplies)}
                    className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-semibold mb-3 transition-colors"
                  >
                    {showAllReplies ? <FaChevronUp /> : <FaChevronDown />}
                    <span>
                      {showAllReplies 
                        ? 'Hide replies' 
                        : `Show ${comment._count.replies} ${comment._count.replies === 1 ? 'reply' : 'replies'}`
                      }
                    </span>
                  </button>
                )}

                <AnimatePresence>
                  {(showAllReplies || comment._count.replies <= 3) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      {comment.replies.map((reply, replyIndex) => (
                        <CommentItem
                          key={reply.id}
                          comment={reply}
                          currentUserId={currentUserId}
                          postId={postId}
                          depth={depth + 1}
                          index={replyIndex}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}