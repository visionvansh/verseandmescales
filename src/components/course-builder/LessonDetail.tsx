// components/course-builder/LessonDetail.tsx
"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCloudUploadAlt, FaPlay, FaTimes, FaFile, FaPlus, FaTrash,
  FaCheckCircle, FaClock, FaFileUpload, FaDownload, FaYoutube,
  FaVideo, FaExchangeAlt, FaSearch,
} from "react-icons/fa";

interface Resource {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  videoDuration: string;
  videoSize: string;
  resources: Resource[];
}

interface LessonDetailProps {
  lesson: Lesson;
  onUpdate: (updates: Partial<Lesson>) => void;
}

// ✅ Helper to format seconds to display time
const formatSecondsToTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// ✅ Helper to extract YouTube ID
const getYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url?.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// ✅ YOUTUBE VIDEOS LIBRARY - Add your actual YouTube videos here
const YOUTUBE_VIDEOS = [
  {
    id: 'yt-lesson1',
    name: 'Lesson 1',
    videoId: 'nKk3bnDOo9Y',
    duration: '983', // Duration in seconds (string)
    durationDisplay: '16:23',
    thumbnail: 'https://img.youtube.com/vi/nKk3bnDOo9Y/maxresdefault.jpg',
    category: 'Getting Started',
  },
  // Add more YouTube videos here
  {
    id: 'yt-lesson2',
    name: 'Lesson 2',
    videoId: 'HHZdL1cTG0s',
    duration: '765',
    durationDisplay: '12:45',
    thumbnail: 'https://img.youtube.com/vi/HHZdL1cTG0s/maxresdefault.jpg',
    category: 'Advanced',
  },
   {
    id: 'yt-lesson3',
    name: 'Lesson 3',
    videoId: 'JKQRW_x1ViA',
    duration: '988',
    durationDisplay: '16:28',
    thumbnail: 'https://img.youtube.com/vi/JKQRW_x1ViA/maxresdefault.jpg',
    category: 'Advanced',
  },
   {
    id: 'yt-lesson4',
    name: 'Lesson 4',
    videoId: 'fZDr4F9feos',
    duration: '604',
    durationDisplay: '10:04',
    thumbnail: 'https://img.youtube.com/vi/fZDr4F9feos/maxresdefault.jpg',
    category: 'Advanced',
  },
   {
    id: 'yt-lesson5',
    name: 'Lesson 5',
    videoId: 'mEHtz8CX8g0',
    duration: '410',
    durationDisplay: '6:50',
    thumbnail: 'https://img.youtube.com/vi/mEHtz8CX8g0/maxresdefault.jpg',
    category: 'Advanced',
  },
   {
    id: 'yt-lesson6',
    name: 'Lesson 6',
    videoId: '3-LIBiavzJw',
    duration: '720',
    durationDisplay: '12:00',
    thumbnail: 'https://img.youtube.com/vi/3-LIBiavzJw/maxresdefault.jpg',
    category: 'Advanced',
  },
   {
    id: 'yt-lesson7',
    name: 'Lesson 7',
    videoId: 'V-psx-ODqA4',
    duration: '1002',
    durationDisplay: '16:42',
    thumbnail: 'https://img.youtube.com/vi/V-psx-ODqA4/maxresdefault.jpg',
    category: 'Advanced',
  },
   {
    id: 'yt-lesson8',
    name: 'Lesson 8',
    videoId: 'vSX7DdbQrxI',
    duration: '974',
    durationDisplay: '16:14',
    thumbnail: 'https://img.youtube.com/vi/vSX7DdbQrxI/maxresdefault.jpg',
    category: 'Advanced',
  },
   {
    id: 'yt-lesson9',
    name: 'Lesson 9',
    videoId: 'Zqs4q1gOeJY',
    duration: '394',
    durationDisplay: '6:34',
    thumbnail: 'https://img.youtube.com/vi/Zqs4q1gOeJY/maxresdefault.jpg',
    category: 'Advanced',
  },
   {
    id: 'yt-lesson10',
    name: 'Lesson 10',
    videoId: 'QsHQRF3R_Xs',
    duration: '562',
    durationDisplay: '9:22',
    thumbnail: 'https://img.youtube.com/vi/QsHQRF3R_Xs/maxresdefault.jpg',
    category: 'Advanced',
  },
   {
    id: 'yt-lesson11',
    name: 'Lesson 11',
    videoId: 'nvU6QskJeds',
    duration: '487',
    durationDisplay: '8:07',
    thumbnail: 'https://img.youtube.com/vi/nvU6QskJeds/maxresdefault.jpg',
    category: 'Advanced',
  },
   {
    id: 'yt-lesson12',
    name: 'Lesson 12',
    videoId: 'cTVhTZO5M1A',
    duration: '404',
    durationDisplay: '6:44',
    thumbnail: 'https://img.youtube.com/vi/cTVhTZO5M1A/maxresdefault.jpg',
    category: 'Advanced',
  },
   {
    id: 'yt-lesson13',
    name: 'Lesson 13',
    videoId: 'tOGyR5zUPHs',
    duration: '603',
    durationDisplay: '10:03',
    thumbnail: 'https://img.youtube.com/vi/tOGyR5zUPHs/maxresdefault.jpg',
    category: 'Advanced',
  },
  {
    id: 'yt-lesson14',
    name: 'Lesson 14',
    videoId: '7MW3VcAE6Ec',
    duration: '579',
    durationDisplay: '9:39',
    thumbnail: 'https://img.youtube.com/vi/7MW3VcAE6Ec/maxresdefault.jpg',
    category: 'Advanced',
  },
  {
    id: 'yt-lesson15',
    name: 'Lesson 15',
    videoId: 'YNkVOBzVUq0',
    duration: '391',
    durationDisplay: '6:31',
    thumbnail: 'https://img.youtube.com/vi/YNkVOBzVUq0/maxresdefault.jpg',
    category: 'Advanced',
  },

];

const LessonDetail: React.FC<LessonDetailProps> = ({ lesson, onUpdate }) => {
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [expandResources, setExpandResources] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [uploadSpeed, setUploadSpeed] = useState<string>("");
  const [showVideoSelector, setShowVideoSelector] = useState(false);
  const [videoSourceType, setVideoSourceType] = useState<'upload' | 'youtube'>('upload');
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadStartTimeRef = useRef<number>(0);
  const uploadedBytesRef = useRef<number>(0);

  // Format file size
  const formatFileSize = (bytes: string | number): string => {
    if (!bytes) return "";
    const size = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    if (size === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return Math.round((size / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Calculate upload speed
  const calculateUploadSpeed = (uploadedBytes: number, elapsedTime: number): string => {
    if (elapsedTime === 0) return "";
    const bytesPerSecond = uploadedBytes / (elapsedTime / 1000);
    return formatFileSize(bytesPerSecond) + "/s";
  };

  // ✅ Handle YouTube video selection
  const handleYoutubeVideoSelect = (video: typeof YOUTUBE_VIDEOS[0]) => {
    console.log('✅ YouTube Video Selected:', {
      name: video.name,
      durationSeconds: video.duration,
      videoUrl: `https://www.youtube.com/watch?v=${video.videoId}`
    });

    onUpdate({
      videoUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
      videoDuration: video.duration, // ✅ Store as seconds (string)
      videoSize: "0", // YouTube videos don't have file size
    });
    setShowVideoSelector(false);
    setVideoSourceType('youtube');
  };

  // ✅ Handle video upload (existing code)
  const handleVideoUpload = async (file: File) => {
    if (!file.type.startsWith("video/")) {
      setUploadError("Please upload a video file");
      alert("Please upload a video file");
      return;
    }

    const maxSize = 3 * 1024 * 1024 * 1024; // 3GB
    if (file.size > maxSize) {
      setUploadError("File size exceeds 3GB limit");
      alert("File size exceeds 3GB. Maximum: 3GB");
      return;
    }

    setIsUploadingVideo(true);
    setUploadProgress(0);
    setUploadError("");
    setUploadSpeed("");
    uploadStartTimeRef.current = Date.now();
    uploadedBytesRef.current = 0;

    try {
      console.log(`📤 Starting upload: ${file.name} (${formatFileSize(file.size)})`);

      // Get video metadata
      const video = document.createElement("video");
      video.preload = "metadata";

      const metadata = await new Promise<{duration: number, size: number}>((resolve) => {
        video.onloadedmetadata = () => {
          resolve({ duration: video.duration, size: file.size });
        };
        video.onerror = () => {
          resolve({ duration: 0, size: file.size });
        };
        video.src = URL.createObjectURL(file);
      });

      // Initialize chunked upload
      const initResponse = await fetch("/api/upload/video-chunked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          folder: "course-videos",
        }),
      });

      if (!initResponse.ok) {
        throw new Error("Failed to initialize upload");
      }

      const uploadConfig = await initResponse.json();

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("timestamp", uploadConfig.timestamp);
      formData.append("signature", uploadConfig.signature);
      formData.append("api_key", uploadConfig.apiKey);
      formData.append("folder", uploadConfig.folder);
      formData.append("resource_type", "video");

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
          
          uploadedBytesRef.current = e.loaded;
          const elapsedTime = Date.now() - uploadStartTimeRef.current;
          const speed = calculateUploadSpeed(e.loaded, elapsedTime);
          setUploadSpeed(speed);
          
          console.log(`📊 Progress: ${progress}% (${formatFileSize(e.loaded)} / ${formatFileSize(e.total)}) - ${speed}`);
        }
      });

      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              console.log("✅ Upload successful:", response);
              resolve(response);
            } catch (e) {
              reject(new Error("Invalid response from server"));
            }
          } else {
            console.error("❌ Upload failed:", xhr.status, xhr.responseText);
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Network error")));
        xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));
        xhr.addEventListener("timeout", () => reject(new Error("Upload timeout")));
      });

      xhr.open("POST", `https://api.cloudinary.com/v1_1/${uploadConfig.cloudName}/video/upload`);
      xhr.timeout = 600000; // 10 minutes
      xhr.send(formData);

      const result = await uploadPromise;

      // ✅ Store duration as seconds (string)
      const durationInSeconds = Math.floor(result.duration || metadata.duration);
      const durationString = durationInSeconds.toString();

      console.log('✅ Video Uploaded:', {
        durationSeconds: durationString,
        videoUrl: result.secure_url
      });

      onUpdate({
        videoUrl: result.secure_url,
        videoDuration: durationString, // ✅ Store as seconds (string)
        videoSize: (result.bytes || metadata.size).toString(),
      });

      setIsUploadingVideo(false);
      setUploadProgress(100);
      URL.revokeObjectURL(video.src);
      
      console.log("✅ Video upload complete");
      
    } catch (error) {
      console.error("❌ Error uploading video:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload video";
      setUploadError(errorMessage);
      alert(`Upload Failed: ${errorMessage}`);
      setIsUploadingVideo(false);
      setUploadProgress(0);
      setUploadSpeed("");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleVideoUpload(files[0]);
    }
  };

  const addResource = () => {
    const newResource: Resource = {
      id: `resource-${Date.now()}`,
      title: "",
      description: "",
      fileUrl: "",
      fileType: "pdf",
    };

    onUpdate({
      resources: [...lesson.resources, newResource],
    });
  };

  const updateResource = (
    resourceId: string,
    updates: Partial<Resource>
  ) => {
    onUpdate({
      resources: lesson.resources.map((r) =>
        r.id === resourceId ? { ...r, ...updates } : r
      ),
    });
  };

  const deleteResource = (resourceId: string) => {
    onUpdate({
      resources: lesson.resources.filter((r) => r.id !== resourceId),
    });
  };

  // Check if current video is YouTube
  const isYoutubeVideo = lesson.videoUrl && (lesson.videoUrl.includes('youtube.com') || lesson.videoUrl.includes('youtu.be'));
  const youtubeId = isYoutubeVideo ? getYoutubeId(lesson.videoUrl) : null;
  
  // Display duration in human-readable format
  const displayDuration = lesson.videoDuration ? formatSecondsToTime(parseInt(lesson.videoDuration)) : null;

  // Filter videos based on search query
  const filteredYoutubeVideos = YOUTUBE_VIDEOS.filter(video =>
    video.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 xs:p-5 sm:p-6 space-y-6">
      {/* Lesson Title & Description */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2">
            Lesson Title
          </label>
          <input
            type="text"
            value={lesson.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Enter lesson title"
            className="w-full px-3 xs:px-4 py-2 xs:py-3 bg-gray-800/50 border border-red-500/20 rounded-lg text-sm xs:text-base text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2">
            Description
          </label>
          <textarea
            value={lesson.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Describe what will be covered in this lesson..."
            rows={3}
            className="w-full px-3 xs:px-4 py-2 xs:py-3 bg-gray-800/50 border border-red-500/20 rounded-lg text-sm xs:text-base text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition-all resize-none"
          />
        </div>
      </div>

      {/* Video Upload Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <FaPlay className="text-red-500 text-xs" />
            Video Content
          </h4>
          {lesson.videoUrl && (
            <button
              onClick={() => setShowVideoSelector(!showVideoSelector)}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <FaExchangeAlt className="text-xs" />
              Change Video
            </button>
          )}
        </div>

        {/* Error Display */}
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-600/10 border border-red-500/30 rounded-lg"
          >
            <p className="text-xs text-red-400">❌ {uploadError}</p>
          </motion.div>
        )}

        {lesson.videoUrl && !showVideoSelector ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-600/10 border border-green-500/30 rounded-lg space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-green-500 text-base" />
                <span className="text-sm font-semibold text-green-400">
                  {videoSourceType === 'youtube' ? 'YouTube Video Selected' : 'Video Uploaded'}
                </span>
              </div>
              <button
                onClick={() =>
                  onUpdate({
                    videoUrl: "",
                    videoDuration: "",
                    videoSize: "",
                  })
                }
                className="p-1 text-green-500 hover:text-green-400 bg-green-600/10 hover:bg-green-600/20 rounded transition-all"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>

            {/* Video Preview */}
            <div className="bg-black/50 rounded-lg overflow-hidden aspect-video flex items-center justify-center border border-green-500/20 relative">
              {isYoutubeVideo && youtubeId ? (
                <>
                  <img 
                    src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
                    className="w-full h-full object-cover opacity-80"
                    alt="YouTube Thumbnail"
                  />
                  <FaYoutube className="absolute text-6xl text-red-600" />
                </>
              ) : (
                <video
                  src={lesson.videoUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Video Metadata */}
            <div className="grid grid-cols-2 gap-3">
              {displayDuration && (
                <div className="flex items-center gap-2 p-2 bg-gray-900/50 rounded-lg">
                  <FaClock className="text-green-500 text-xs" />
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="text-xs font-semibold text-white">
                      {displayDuration}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 p-2 bg-gray-900/50 rounded-lg">
                {isYoutubeVideo ? (
                  <>
                    <FaYoutube className="text-red-500 text-xs" />
                    <div>
                      <p className="text-xs text-gray-500">Source</p>
                      <p className="text-xs font-semibold text-white">YouTube</p>
                    </div>
                  </>
                ) : lesson.videoSize && parseInt(lesson.videoSize) > 0 ? (
                  <>
                    <FaFileUpload className="text-green-500 text-xs" />
                    <div>
                      <p className="text-xs text-gray-500">File Size</p>
                      <p className="text-xs font-semibold text-white">
                        {formatFileSize(lesson.videoSize)}
                      </p>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Video Source Selector */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setVideoSourceType('upload')}
                className={`flex-1 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  videoSourceType === 'upload'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                }`}
              >
                <FaCloudUploadAlt className="inline mr-1" />
                Upload New
              </button>
              <button
                onClick={() => setVideoSourceType('youtube')}
                className={`flex-1 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  videoSourceType === 'youtube'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                }`}
              >
                <FaYoutube className="inline mr-1" />
                YouTube
              </button>
            </div>

            {videoSourceType === 'upload' ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative p-6 xs:p-8 border-2 border-dashed rounded-lg transition-all duration-200 ${
                  dragOver
                    ? "border-red-500 bg-red-600/10"
                    : "border-red-500/30 bg-red-600/5 hover:bg-red-600/10"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleVideoUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div className="text-center space-y-3">
                  <motion.div
                    animate={isUploadingVideo ? { scale: 1.1 } : { scale: 1 }}
                    transition={{ duration: 0.5, repeat: isUploadingVideo ? Infinity : 0 }}
                  >
                    <FaCloudUploadAlt className="mx-auto text-3xl xs:text-4xl text-red-500" />
                  </motion.div>

                  <div>
                    <p className="text-sm xs:text-base font-semibold text-white">
                      {isUploadingVideo ? `Uploading... ${uploadProgress}%` : "Upload Video"}
                    </p>
                    <p className="text-xs xs:text-sm text-gray-500 mt-1">
                      Drag and drop your video or click to browse
                    </p>
                    {uploadSpeed && (
                      <p className="text-xs text-green-400 mt-1">
                        Speed: {uploadSpeed}
                      </p>
                    )}
                  </div>

                  {isUploadingVideo && (
                    <div className="space-y-2">
                      <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-red-600 to-red-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className="text-xs text-gray-400">
                        {uploadProgress}% complete
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingVideo}
                    className="px-4 xs:px-6 py-2 xs:py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white text-xs xs:text-sm font-semibold rounded-lg transition-all hover:scale-105 disabled:scale-100"
                  >
                    {isUploadingVideo ? `Uploading ${uploadProgress}%...` : "Choose Video"}
                  </button>

                  <p className="text-xs text-gray-600 mt-2">
                    Supported formats: MP4, WebM, MOV, AVI (Max 3GB)
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="space-y-3"
              >
                {/* Search Bar */}
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search YouTube videos..."
                    className="w-full pl-9 pr-4 py-2 bg-gray-800/50 border border-red-500/20 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50"
                  />
                </div>

                <div className="text-center mb-4">
                  <FaYoutube className="mx-auto text-4xl text-red-600 mb-3" />
                  <h4 className="text-sm font-bold text-white mb-1">YouTube Video Library</h4>
                  <p className="text-xs text-gray-400">
                    Select from {filteredYoutubeVideos.length} curated YouTube video{filteredYoutubeVideos.length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {filteredYoutubeVideos.map((video) => (
                    <button
                      key={video.id}
                      onClick={() => handleYoutubeVideoSelect(video)}
                      className="p-3 bg-gray-800/50 border border-red-500/20 rounded-lg hover:bg-red-900/20 hover:border-red-500/40 transition-all text-left group relative overflow-hidden"
                    >
                      {/* Thumbnail Background */}
                      <div 
                        className="absolute inset-0 opacity-10 bg-cover bg-center blur-sm"
                        style={{ backgroundImage: `url(${video.thumbnail})` }}
                      />
                      
                      <div className="relative flex items-center gap-3 mb-2">
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                          <FaYoutube className="text-white text-lg" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors truncate">
                            {video.name}
                          </h5>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <FaClock className="text-xs" />
                            {video.durationDisplay}
                          </p>
                        </div>
                      </div>
                      
                      {video.category && (
                        <div className="relative mt-2">
                          <span className="text-xs px-2 py-0.5 bg-red-600/20 border border-red-500/30 rounded text-red-400">
                            {video.category}
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                
                {filteredYoutubeVideos.length === 0 && (
                  <div className="text-center py-6">
                    <FaYoutube className="text-3xl text-gray-700 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">
                      {searchQuery ? 'No videos found matching your search' : 'No YouTube videos available'}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Resources Section - Keep existing code */}
      <div className="space-y-3 border-t border-red-500/20 pt-4 xs:pt-5 sm:pt-6">
        <button
          onClick={() => setExpandResources(!expandResources)}
          className="flex items-center justify-between w-full"
        >
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <FaFile className="text-red-500 text-xs" />
            <span>Resources</span>
            <span className="text-xs text-gray-600 font-normal">
              ({lesson.resources.length})
            </span>
          </h4>
          <motion.button
            animate={{ rotate: expandResources ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="p-1 text-gray-500"
          >
            ▼
          </motion.button>
        </button>

        <AnimatePresence>
          {expandResources && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {lesson.resources.length === 0 ? (
                <p className="text-xs text-gray-600 py-3">
                  No resources added yet
                </p>
              ) : (
                <div className="space-y-2">
                  {lesson.resources.map((resource) => (
                    <motion.div
                      key={resource.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="p-3 bg-gray-800/30 border border-red-500/10 rounded-lg space-y-2 group"
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="text"
                          value={resource.title}
                          onChange={(e) =>
                            updateResource(resource.id, { title: e.target.value })
                          }
                          placeholder="Resource name"
                          className="flex-1 px-2 py-1.5 bg-gray-900/50 border border-red-500/10 rounded text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500/30"
                        />
                        <select
                          value={resource.fileType}
                          onChange={(e) =>
                            updateResource(resource.id, { fileType: e.target.value })
                          }
                          className="px-2 py-1.5 bg-gray-900/50 border border-red-500/10 rounded text-xs text-white focus:outline-none focus:border-red-500/30"
                        >
                          <option value="pdf">PDF</option>
                          <option value="doc">DOC</option>
                          <option value="ppt">PPT</option>
                          <option value="zip">ZIP</option>
                          <option value="other">Other</option>
                        </select>
                        <button
                          onClick={() => deleteResource(resource.id)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-600/10 rounded transition-all opacity-0 group-hover:opacity-100"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </div>

                      <textarea
                        value={resource.description}
                        onChange={(e) =>
                          updateResource(resource.id, {
                            description: e.target.value,
                          })
                        }
                        placeholder="Resource description"
                        rows={2}
                        className="w-full px-2 py-1.5 bg-gray-900/50 border border-red-500/10 rounded text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500/30 resize-none"
                      />

                      <input
                        type="url"
                        value={resource.fileUrl}
                        onChange={(e) =>
                          updateResource(resource.id, { fileUrl: e.target.value })
                        }
                        placeholder="https://example.com/file.pdf"
                        className="w-full px-2 py-1.5 bg-gray-900/50 border border-red-500/10 rounded text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500/30"
                      />
                    </motion.div>
                  ))}
                </div>
              )}

              <button
                onClick={addResource}
                className="w-full px-3 py-2 border border-dashed border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2"
              >
                <FaPlus className="text-xs" />
                Add Resource
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LessonDetail;