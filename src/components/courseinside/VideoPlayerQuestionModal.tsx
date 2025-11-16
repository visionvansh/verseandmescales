"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  FaTimes,
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaClock,
  FaVideo,
  FaPlay,
  FaPause,
  FaMapMarkerAlt,
  FaExclamationTriangle,
  FaUserShield,
  FaUsers,
  FaLock,
  FaCheckCircle,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

interface VideoPlayerQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonData: {
    id: string;
    title: string;
    videoUrl: string;
    module: { id: string; title: string };
    course: { id: string; title: string };
  };
  roomId: string;
  currentVideoTime?: number;
  onQuestionCreated?: (question: any) => void;
}

const usePortal = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  return mounted;
};

const VideoTimestampSelector = ({
  videoUrl,
  selectedTimestamp,
  onTimestampSelect,
  initialTime = 0,
}: {
  videoUrl: string;
  selectedTimestamp: string;
  onTimestampSelect: (timestamp: string) => void;
  initialTime?: number;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (videoRef.current && initialTime > 0) {
      videoRef.current.currentTime = initialTime;
      setCurrentTime(initialTime);
    }
  }, [initialTime]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMarkTimestamp = () => {
    if (videoRef.current) {
      const timestamp = formatTime(videoRef.current.currentTime);
      onTimestampSelect(timestamp);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        <button
          onClick={handlePlayPause}
          className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 transition-colors group"
        >
          {isPlaying ? (
            <FaPause className="text-white text-5xl opacity-0 group-hover:opacity-100 transition-opacity" />
          ) : (
            <FaPlay className="text-white text-5xl opacity-100 group-hover:opacity-100 transition-opacity" />
          )}
        </button>

        {selectedTimestamp && (
          <div className="absolute top-4 left-4 px-3 py-2 bg-red-600 rounded-lg shadow-lg">
            <span className="text-white font-bold text-sm flex items-center gap-2">
              <FaMapMarkerAlt />
              {selectedTimestamp}
            </span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePlayPause}
            className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {isPlaying ? <FaPause className="text-white" /> : <FaPlay className="text-white" />}
          </button>

          <button
            onClick={handleMarkTimestamp}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <FaMapMarkerAlt />
            Mark Current Time
          </button>

          {selectedTimestamp && (
            <button
              onClick={() => onTimestampSelect("")}
              className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              title="Clear timestamp"
            >
              <FaTimes className="text-white" />
            </button>
          )}
        </div>

        {selectedTimestamp && (
          <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-center">
            <span className="text-red-400 text-sm">Selected: {selectedTimestamp}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const VideoPlayerQuestionModal = ({
  isOpen,
  onClose,
  lessonData,
  roomId,
  currentVideoTime = 0,
  onQuestionCreated,
}: VideoPlayerQuestionModalProps) => {
  const isMounted = usePortal();
  const [step, setStep] = useState(1); // Start at step 1 (video timestamp)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoTimestamp, setVideoTimestamp] = useState("");
  const [visibility, setVisibility] = useState<"PRIVATE" | "MENTOR_ONLY" | "MENTOR_PUBLIC">("MENTOR_PUBLIC");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setTitle("");
      setDescription("");
      setVideoTimestamp("");
      setVisibility("MENTOR_PUBLIC");
      setTags([]);
      setTagInput("");
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const questionData = {
        roomId,
        lessonId: lessonData.id,
        moduleId: lessonData.module.id,
        title: title.trim(),
        description: description.trim(),
        videoTimestamp: videoTimestamp || undefined,
        visibility,
        tags,
      };

      const response = await fetch('/api/chat/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionData),
      });

      if (!response.ok) throw new Error('Failed to create question');

      const result = await response.json();
      
      if (onQuestionCreated) {
        onQuestionCreated(result.question);
      }
      
      onClose();
      toast.success("Question posted successfully!");
    } catch (err: any) {
      console.error("Failed to create question:", err);
      setError(err.message || "Failed to create question");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  if (!isOpen || !isMounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-gradient-to-br from-gray-900/95 to-black/95 border border-red-500/30 rounded-2xl overflow-hidden backdrop-blur-2xl"
        style={{ maxHeight: 'calc(100vh - 32px)' }}
      >
        {/* Header */}
        <div className="border-b border-red-500/20 p-6 flex items-center justify-between bg-gradient-to-r from-red-600/10 to-transparent">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Ask a Question</h2>
            <p className="text-sm text-gray-400">About: {lessonData.title}</p>
            <p className="text-xs text-gray-500 mt-1">Step {step} of 3</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <FaTimes className="text-gray-400 hover:text-white text-xl" />
          </button>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-6 mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-xl flex items-start gap-3"
            >
              <FaExclamationTriangle className="text-red-500 text-lg flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-400 font-semibold mb-1">Error</p>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
                <FaTimes />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <AnimatePresence mode="wait">
            {/* STEP 1: Video Timestamp */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Select Video Timestamp (Optional)
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Mark the exact moment in the video where your question occurs
                  </p>
                </div>

                <VideoTimestampSelector
                  videoUrl={lessonData.videoUrl}
                  selectedTimestamp={videoTimestamp}
                  onTimestampSelect={setVideoTimestamp}
                  initialTime={currentVideoTime}
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setStep(2);
                      setError(null);
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    Continue
                    <FaArrowRight />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Write Question */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Write Your Question</h3>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Question Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., How do I handle async operations in React?"
                    maxLength={200}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">{title.length}/200 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide more context about your question..."
                    rows={8}
                    maxLength={2000}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition-colors resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">{description.length}/2000 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Tags (Optional - Max 5)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="Add a tag"
                      maxLength={20}
                      disabled={tags.length >= 5}
                      className="flex-1 px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition-colors disabled:opacity-50"
                    />
                    <button
                      onClick={addTag}
                      disabled={!tagInput.trim() || tags.length >= 5}
                      className="px-4 py-2 bg-red-600/20 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>

                  {tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-red-600/20 border border-red-500/30 rounded-full text-sm text-red-400 flex items-center gap-2"
                        >
                          #{tag}
                          <button onClick={() => removeTag(tag)} className="hover:text-red-300">
                            <FaTimes className="text-xs" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setStep(1);
                      setError(null);
                    }}
                    className="px-6 py-3 bg-gray-900/50 border border-gray-800 text-white font-bold rounded-xl hover:bg-gray-800/50 transition-all flex items-center gap-2"
                  >
                    <FaArrowLeft />
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (!title.trim()) {
                        setError("Please enter a question title");
                        return;
                      }
                      if (!description.trim()) {
                        setError("Please enter a description");
                        return;
                      }
                      setStep(3);
                      setError(null);
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    Continue
                    <FaArrowRight />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Choose Visibility */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Who Can Answer?</h3>
                  <p className="text-gray-400 text-sm">
                    Choose who can see and respond to your question
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      value: "MENTOR_ONLY",
                      icon: FaUserShield,
                      title: "Mentor Only",
                      description: "Only the mentor can see and answer this question",
                    },
                    {
                      value: "MENTOR_PUBLIC",
                      icon: FaUsers,
                      title: "Mentor + Public",
                      description: "Mentor answers, but everyone can see the question",
                    },
                    {
                      value: "PRIVATE",
                      icon: FaLock,
                      title: "Private (Coming Soon)",
                      description: "Only you and the mentor can see this question",
                    },
                  ].map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setVisibility(option.value as any)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          visibility === option.value
                            ? "bg-red-600/20 border-red-500"
                            : "bg-gray-900/30 border-gray-800 hover:border-red-500/30"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-3 rounded-xl ${
                              visibility === option.value ? "bg-red-500" : "bg-gray-800"
                            }`}
                          >
                            <Icon className="text-white text-xl" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-bold mb-1">{option.title}</h4>
                            <p className="text-sm text-gray-400">{option.description}</p>
                          </div>
                          {visibility === option.value && (
                            <FaCheckCircle className="text-red-500 text-xl" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Review Summary */}
                <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
                  <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                    <FaCheckCircle className="text-green-500" />
                    Review Your Question
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 w-24 flex-shrink-0">Lesson:</span>
                      <span className="text-white font-semibold">{lessonData.title}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 w-24 flex-shrink-0">Module:</span>
                      <span className="text-white">{lessonData.module.title}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 w-24 flex-shrink-0">Title:</span>
                      <span className="text-white">{title}</span>
                    </div>
                    {videoTimestamp && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 w-24 flex-shrink-0">Timestamp:</span>
                        <span className="text-red-400 font-mono">{videoTimestamp}</span>
                      </div>
                    )}
                    {tags.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 w-24 flex-shrink-0">Tags:</span>
                        <div className="flex gap-1 flex-wrap">
                          {tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-red-600/20 text-red-400 rounded text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setStep(2);
                      setError(null);
                    }}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gray-900/50 border border-gray-800 text-white font-bold rounded-xl hover:bg-gray-800/50 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <FaArrowLeft />
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-700 disabled:to-gray-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <FaCheck />
                        Post Question
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
};