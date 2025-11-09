// components/profile/CreatePostModal.tsx
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaImage,
  FaVideo,
  FaSmile,
  FaPaperPlane,
  FaGlobeAmericas,
  FaLock,
  FaUsers,
  FaUserFriends,
  FaGlobe
} from "react-icons/fa";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPost: (content: string, media?: File, privacy?: 'PUBLIC' | 'PRIVATE' | 'SEEKERS_ONLY') => Promise<void>;
}

export default function CreatePostModal({
  isOpen,
  onClose,
  onPost,
}: CreatePostModalProps) {
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>("");
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'PRIVATE' | 'SEEKERS_ONLY'>('PUBLIC');
  const [isPosting, setIsPosting] = useState(false);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMedia(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // ✅ FIXED: Just pass data to parent, don't create post here
  const handlePost = async () => {
    if (!content.trim() && !media) return;

    setIsPosting(true);

    try {
      // ✅ Call parent's handler which does the actual creation
      await onPost(content, media || undefined, privacy);

      // ✅ Reset form only after successful creation
      setContent("");
      setMedia(null);
      setMediaPreview("");
      setPrivacy("PUBLIC");
      
      // ✅ Close modal
      onClose();
    } catch (error) {
      console.error("Failed to create post:", error);
      alert(error instanceof Error ? error.message : "Failed to create post");
    } finally {
      setIsPosting(false);
    }
  };

  const privacyOptions = [
    {
      value: "PUBLIC",
      label: "Public",
      icon: FaGlobeAmericas,
      description: "Anyone can see",
    },
    {
      value: "SEEKERS_ONLY",
      label: "Seekers Only",
      icon: FaUsers,
      description: "Only your seekers",
    },
    {
      value: "PRIVATE",
      label: "Private",
      icon: FaLock,
      description: "Only you",
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black rounded-3xl border border-red-500/30" />

              <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-red-500/20">
                  <h2 className="text-2xl font-black text-white">
                    Create Post
                  </h2>
                  <motion.button
                    onClick={onClose}
                    className="p-2 rounded-xl bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FaTimes className="text-xl" />
                  </motion.button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                  {/* Text Area */}
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's on your mind? Share your thoughts, tips, or achievements..."
                    className="w-full h-32 px-4 py-3 bg-gray-900/50 border border-red-500/20 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-red-500/40 transition-all"
                    maxLength={500}
                  />

                  <div className="flex justify-end mt-2 mb-4">
                    <span
                      className={`text-xs font-semibold ${
                        content.length > 450 ? "text-red-400" : "text-gray-500"
                      }`}
                    >
                      {content.length}/500
                    </span>
                  </div>

                  {/* Media Preview */}
                  {mediaPreview && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative mb-4 rounded-xl overflow-hidden border-2 border-red-500/30"
                    >
                      {media?.type.startsWith("video/") ? (
                        <video
                          src={mediaPreview}
                          className="w-full max-h-80 object-contain bg-black"
                          controls
                        />
                      ) : (
                        <img
                          src={mediaPreview}
                          alt="Preview"
                          className="w-full max-h-80 object-contain bg-black"
                        />
                      )}
                      <motion.button
                        onClick={() => {
                          setMedia(null);
                          setMediaPreview("");
                        }}
                        className="absolute top-3 right-3 p-2 rounded-full bg-black/80 text-white hover:bg-red-600 transition-all"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FaTimes />
                      </motion.button>
                    </motion.div>
                  )}

                  {/* Privacy Selector */}
                  <div className="mb-4">
                    <label className="text-sm font-bold text-gray-400 mb-2 block">
                      Who can see this?
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {privacyOptions.map((option) => {
                        const Icon = option.icon;
                        const isSelected = privacy === option.value;

                        return (
                          <motion.button
                            key={option.value}
                            onClick={() => setPrivacy(option.value as any)}
                            className={`relative p-4 rounded-xl border-2 transition-all ${
                              isSelected
                                ? "border-red-500 bg-red-600/20"
                                : "border-red-500/20 bg-gray-900/50 hover:border-red-500/40"
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Icon
                              className={`text-2xl mb-2 mx-auto ${
                                isSelected ? "text-red-400" : "text-gray-400"
                              }`}
                            />
                            <div
                              className={`text-xs font-bold mb-1 ${
                                isSelected ? "text-white" : "text-gray-400"
                              }`}
                            >
                              {option.label}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {option.description}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-red-500/20">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMediaUpload}
                        className="hidden"
                      />
                      <motion.div
                        className="p-3 rounded-xl bg-gray-900/50 text-blue-400 hover:bg-blue-600/20 transition-all"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FaImage className="text-xl" />
                      </motion.div>
                    </label>

                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleMediaUpload}
                        className="hidden"
                      />
                      <motion.div
                        className="p-3 rounded-xl bg-gray-900/50 text-purple-400 hover:bg-purple-600/20 transition-all"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FaVideo className="text-xl" />
                      </motion.div>
                    </label>

                    <motion.button
                      className="p-3 rounded-xl bg-gray-900/50 text-yellow-400 hover:bg-yellow-600/20 transition-all"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaSmile className="text-xl" />
                    </motion.button>
                  </div>

                  <motion.button
                    onClick={handlePost}
                    disabled={(!content.trim() && !media) || isPosting}
                    className={`px-8 py-3 rounded-xl font-bold text-base flex items-center gap-2 transition-all ${
                      (!content.trim() && !media) || isPosting
                        ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-red-600 to-red-700 text-white"
                    }`}
                    whileHover={
                      (!content.trim() && !media) || isPosting
                        ? {}
                        : { scale: 1.05 }
                    }
                    whileTap={
                      (!content.trim() && !media) || isPosting
                        ? {}
                        : { scale: 0.95 }
                    }
                  >
                    {isPosting ? (
                      <>
                        <motion.div
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                        Posting...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane />
                        Post
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}