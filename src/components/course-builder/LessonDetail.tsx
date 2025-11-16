// components/course-builder/LessonDetail.tsx
"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCloudUploadAlt,
  FaPlay,
  FaTimes,
  FaFile,
  FaPlus,
  FaTrash,
  FaCheckCircle,
  FaClock,
  FaFileUpload,
  FaDownload,
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

const LessonDetail: React.FC<LessonDetailProps> = ({ lesson, onUpdate }) => {
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [expandResources, setExpandResources] = useState(false);
  const [openResourceMenu, setOpenResourceMenu] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format file size
  const formatFileSize = (bytes: string): string => {
    if (!bytes) return "";
    const size = parseInt(bytes);
    if (size === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return Math.round((size / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Format duration
  const formatDuration = (seconds: string): string => {
    if (!seconds) return "";
    const sec = parseInt(seconds);
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVideoUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("video/")) {
      setUploadError("Please upload a video file");
      alert("Please upload a video file");
      return;
    }

    // Check file size (2GB limit)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB in bytes
    if (file.size > maxSize) {
      setUploadError("File size exceeds 2GB limit");
      alert("File size exceeds 2GB limit");
      return;
    }

    // Validate environment variables
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      console.error("Missing Cloudinary credentials:", {
        cloudName: cloudName ? "✓" : "✗",
        uploadPreset: uploadPreset ? "✓" : "✗"
      });
      setUploadError("Cloudinary configuration missing. Please check environment variables.");
      alert("Cloudinary configuration error. Check console for details.");
      return;
    }

    setIsUploadingVideo(true);
    setUploadProgress(0);
    setUploadError("");

    try {
      // Extract video metadata first
      const video = document.createElement("video");
      video.preload = "metadata";

      const metadataPromise = new Promise<{duration: number, size: number}>((resolve) => {
        video.onloadedmetadata = () => {
          resolve({
            duration: video.duration,
            size: file.size
          });
        };
        video.onerror = () => {
          resolve({
            duration: 0,
            size: file.size
          });
        };
        video.src = URL.createObjectURL(file);
      });

      const metadata = await metadataPromise;

      // Upload to Cloudinary using XMLHttpRequest for progress tracking
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", "course-videos"); // Optional: organize uploads

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      // Handle upload completion
      const uploadPromise = new Promise<string>((resolve, reject) => {
        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              console.log("✅ Upload successful:", response);
              resolve(response.secure_url);
            } catch (e) {
              console.error("❌ Failed to parse response:", xhr.responseText);
              reject(new Error("Invalid response from server"));
            }
          } else {
            console.error("❌ Upload failed with status:", xhr.status);
            console.error("Response:", xhr.responseText);
            
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              const errorMessage = errorResponse.error?.message || "Upload failed";
              reject(new Error(errorMessage));
            } catch (e) {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener("error", () => {
          console.error("❌ Network error during upload");
          reject(new Error("Network error. Check your internet connection."));
        });

        xhr.addEventListener("abort", () => {
          console.error("❌ Upload cancelled");
          reject(new Error("Upload cancelled"));
        });
      });

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;
      console.log("📤 Uploading to:", uploadUrl);
      
      xhr.open("POST", uploadUrl);
      xhr.send(formData);

      const cloudinaryUrl = await uploadPromise;

      // Update lesson with Cloudinary URL and metadata
      onUpdate({
        videoUrl: cloudinaryUrl,
        videoDuration: metadata.duration.toString(),
        videoSize: metadata.size.toString(),
      });

      setIsUploadingVideo(false);
      setUploadProgress(0);
      setUploadError("");
      
      // Clean up blob URL
      URL.revokeObjectURL(video.src);
      
      console.log("✅ Video upload complete");
      
    } catch (error) {
      console.error("❌ Error uploading video:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload video";
      setUploadError(errorMessage);
      alert(`Upload Failed: ${errorMessage}`);
      setIsUploadingVideo(false);
      setUploadProgress(0);
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
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <FaPlay className="text-red-500 text-xs" />
          Video Content
        </h4>

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

        {lesson.videoUrl ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-600/10 border border-green-500/30 rounded-lg space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-green-500 text-base" />
                <span className="text-sm font-semibold text-green-400">
                  Video Uploaded
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
            <div className="bg-black/50 rounded-lg overflow-hidden aspect-video flex items-center justify-center border border-green-500/20">
              <video
                src={lesson.videoUrl}
                controls
                className="w-full h-full object-cover"
              />
            </div>

            {/* Video Metadata */}
            <div className="grid grid-cols-2 gap-3">
              {lesson.videoDuration && (
                <div className="flex items-center gap-2 p-2 bg-gray-900/50 rounded-lg">
                  <FaClock className="text-green-500 text-xs" />
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="text-xs font-semibold text-white">
                      {formatDuration(lesson.videoDuration)}
                    </p>
                  </div>
                </div>
              )}

              {lesson.videoSize && (
                <div className="flex items-center gap-2 p-2 bg-gray-900/50 rounded-lg">
                  <FaFileUpload className="text-green-500 text-xs" />
                  <div>
                    <p className="text-xs text-gray-500">File Size</p>
                    <p className="text-xs font-semibold text-white">
                      {formatFileSize(lesson.videoSize)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
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
              </div>

              {isUploadingVideo && (
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-red-600 to-red-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
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
                Supported formats: MP4, WebM, Ogg (Max 2GB)
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Resources Section */}
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