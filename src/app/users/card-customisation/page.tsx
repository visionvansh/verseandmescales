///Volumes/vision/codes/course/my-app/src/app/users/card-customisation/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  motion,
  LazyMotion,
  domAnimation,
  m,
  AnimatePresence,
} from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  FaImage,
  FaDollarSign,
  FaTag,
  FaSpinner,
  FaSave,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaBook,
  FaUsers,
  FaStar,
  FaClock,
  FaFire,
} from "react-icons/fa";

interface CardSettings {
  title: string;
  description: string;
  thumbnail: string;
  price: string;
  salePrice: string;
  // ✅ NEW: Sale timer fields
  saleHours: string;
  saleMinutes: string;
  saleEndsAt: string | null;
}

// ✅ IMPROVED: Professional Countdown Timer
const CountdownTimer = ({ endsAt }: { endsAt: string }) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = new Date(endsAt).getTime();
      const difference = endTime - now;

      if (difference <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, expired: true };
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { hours, minutes, seconds, expired: false };
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.expired) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endsAt]);

  if (timeLeft.expired) {
    return null;
  }

  return (
    <m.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-1 text-red-400"
    >
      <FaClock className="text-xs animate-pulse" />
      <span className="text-xs font-semibold tabular-nums">
        {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
      </span>
    </m.div>
  );
};

// Optimized Skeleton Loader Component
const CardCustomisationSkeleton = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor Panel Skeleton */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
        <div className="relative p-6 space-y-6">
          {/* Thumbnail Skeleton */}
          <div className="space-y-3">
            <div className="h-5 bg-gray-800/40 rounded-lg animate-pulse w-1/3" />
            <div
              className="aspect-video bg-gray-800/40 rounded-xl animate-pulse"
              style={{ animationDelay: "100ms" }}
            />
          </div>

          {/* Title Skeleton */}
          <div className="space-y-3" style={{ animationDelay: "200ms" }}>
            <div className="h-5 bg-gray-800/40 rounded-lg animate-pulse w-1/4" />
            <div className="h-12 bg-gray-800/40 rounded-lg animate-pulse" />
          </div>

          {/* Description Skeleton */}
          <div className="space-y-3" style={{ animationDelay: "300ms" }}>
            <div className="h-5 bg-gray-800/40 rounded-lg animate-pulse w-1/3" />
            <div className="h-24 bg-gray-800/40 rounded-lg animate-pulse" />
          </div>

          {/* Pricing Skeleton */}
          <div
            className="grid grid-cols-2 gap-4"
            style={{ animationDelay: "400ms" }}
          >
            <div className="space-y-3">
              <div className="h-5 bg-gray-800/40 rounded-lg animate-pulse w-2/3" />
              <div className="h-12 bg-gray-800/40 rounded-lg animate-pulse" />
            </div>
            <div className="space-y-3">
              <div className="h-5 bg-gray-800/40 rounded-lg animate-pulse w-2/3" />
              <div className="h-12 bg-gray-800/40 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Preview Panel Skeleton */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
        <div className="relative p-6">
          <div className="h-6 bg-gray-800/40 rounded-lg animate-pulse w-1/4 mb-4" />

          <div className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/20 rounded-xl overflow-hidden">
            {/* Thumbnail skeleton */}
            <div
              className="aspect-video bg-gray-800/40 animate-pulse"
              style={{ animationDelay: "100ms" }}
            />

            {/* Content skeleton */}
            <div className="p-6 space-y-4">
              <div
                className="h-8 bg-gray-800/40 rounded-lg animate-pulse w-3/4"
                style={{ animationDelay: "200ms" }}
              />
              <div
                className="h-4 bg-gray-800/40 rounded-lg animate-pulse w-full"
                style={{ animationDelay: "300ms" }}
              />
              <div
                className="h-4 bg-gray-800/40 rounded-lg animate-pulse w-2/3"
                style={{ animationDelay: "400ms" }}
              />

              <div className="flex items-center gap-3 pt-2 pb-4 border-b border-red-500/10">
                <div
                  className="w-10 h-10 rounded-full bg-gray-800/40 animate-pulse"
                  style={{ animationDelay: "500ms" }}
                />
                <div
                  className="h-4 bg-gray-800/40 rounded-lg animate-pulse w-1/3"
                  style={{ animationDelay: "600ms" }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div
                  className="h-4 bg-gray-800/40 rounded-lg animate-pulse w-1/4"
                  style={{ animationDelay: "700ms" }}
                />
                <div
                  className="h-4 bg-gray-800/40 rounded-lg animate-pulse w-1/4"
                  style={{ animationDelay: "800ms" }}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div
                  className="h-8 bg-gray-800/40 rounded-lg animate-pulse w-1/3"
                  style={{ animationDelay: "900ms" }}
                />
                <div
                  className="h-10 bg-gray-800/40 rounded-lg animate-pulse w-1/3"
                  style={{ animationDelay: "1000ms" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CardCustomisationPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [courseId, setCourseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPreviewHovered, setIsPreviewHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const [settings, setSettings] = useState<CardSettings>({
    title: "",
    description: "",
    thumbnail: "",
    price: "",
    salePrice: "",
    saleHours: "24",
    saleMinutes: "0",
    saleEndsAt: null,
  });

  // Mock data for preview
  const mockPreviewData = {
    owner: {
      name: "John Doe",
      avatar: "",
    },
    stats: {
      students: 1234,
      rating: 4.8,
      duration: "12h 30m",
    },
  };

  useEffect(() => {
    const id = searchParams.get("courseId");
    if (!id) {
      router.push("/users/courses-management");
      return;
    }
    setCourseId(id);
    fetchSettings(id);
  }, []);

  const fetchSettings = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/course/card-settings?courseId=${id}`);
      if (response.ok) {
        const data = await response.json();

        // ✅ Calculate remaining time if sale is active
        let saleHours = "24";
        let saleMinutes = "0";

        if (data.saleEndsAt && data.salePrice) {
          const now = new Date().getTime();
          const endTime = new Date(data.saleEndsAt).getTime();
          const difference = endTime - now;

          if (difference > 0) {
            const hours = Math.floor(difference / (1000 * 60 * 60));
            const minutes = Math.floor(
              (difference % (1000 * 60 * 60)) / (1000 * 60)
            );
            saleHours = hours.toString();
            saleMinutes = minutes.toString();
          }
        }

        setSettings({
          title: data.title || "",
          description: data.description || "",
          thumbnail: data.thumbnail || "",
          price: data.price || "",
          salePrice: data.salePrice || "",
          saleHours,
          saleMinutes,
          saleEndsAt: data.saleEndsAt || null,
        });
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = document.createElement("img");
    const objectUrl = URL.createObjectURL(file);

    img.onload = async () => {
      const aspectRatio = img.width / img.height;
      const isValid16x9 = Math.abs(aspectRatio - 16 / 9) < 0.1;

      if (!isValid16x9) {
        alert(
          "Please upload an image with 16:9 aspect ratio (e.g., 1920x1080)"
        );
        URL.revokeObjectURL(objectUrl);
        return;
      }

      try {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "upload_preset",
          process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
        );
        formData.append("folder", "course-thumbnails");

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSettings((prev) => ({ ...prev, thumbnail: data.secure_url }));
          setHasUnsavedChanges(true);
          setImageError(false);
        }
      } catch (error) {
        console.error("Upload error:", error);
        alert("Failed to upload thumbnail");
      } finally {
        setUploading(false);
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.src = objectUrl;
  };

  const handleSave = async () => {
    if (!courseId) return;

    try {
      setIsSaving(true);
      setSaveSuccess(false);

      // ✅ Calculate sale end time if sale price is set
      let saleEndsAt = null;
      if (settings.salePrice && parseFloat(settings.salePrice) > 0) {
        const hours = parseInt(settings.saleHours) || 0;
        const minutes = parseInt(settings.saleMinutes) || 0;
        const totalMilliseconds = hours * 60 * 60 * 1000 + minutes * 60 * 1000;

        if (totalMilliseconds > 0) {
          saleEndsAt = new Date(Date.now() + totalMilliseconds).toISOString();
        }
      }

      const response = await fetch("/api/course/card-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          title: settings.title,
          description: settings.description,
          thumbnail: settings.thumbnail,
          price: settings.price,
          salePrice: settings.salePrice,
          saleEndsAt, // ✅ Send calculated end time
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings((prev) => ({
          ...prev,
          saleEndsAt: data.course.saleEndsAt,
        }));
        setSaveSuccess(true);
        setHasUnsavedChanges(false);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinue = async () => {
    if (hasUnsavedChanges) {
      await handleSave();
    }
    router.push(`/users/homepage-builder?courseId=${courseId}`);
  };

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative z-10 min-h-screen mt-20">
        <div className="container mx-auto px-3 xs:px-4 sm:px-6 py-4 xs:py-5 sm:py-6">
          {/* Header */}
          <m.div
            className="relative mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-2xl" />

            <div className="relative p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <m.button
                    onClick={() => router.push("/users/courses-management")}
                    className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-colors border border-red-500/20 hover:border-red-500/40"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaChevronLeft className="text-red-400 text-sm" />
                  </m.button>

                  <div className="bg-gradient-to-br from-red-600/20 to-red-700/20 rounded-xl flex items-center justify-center border border-red-500/30 w-12 h-12 sm:w-14 sm:h-14">
                    <FaImage className="text-red-500 text-xl sm:text-2xl" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                      Course Card
                    </h1>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-gray-400 text-xs sm:text-sm">
                        Customize your course appearance
                      </p>
                      {hasUnsavedChanges && (
                        <span className="text-xs text-yellow-400">
                          • Unsaved changes
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <m.button
                    onClick={handleSave}
                    disabled={isSaving || !hasUnsavedChanges}
                    className={`px-4 sm:px-5 py-2 rounded-lg font-bold transition-all text-sm flex items-center gap-2 whitespace-nowrap ${
                      hasUnsavedChanges
                        ? "bg-gradient-to-r from-green-600 to-green-700 hover:scale-105"
                        : "bg-gray-700/50 cursor-not-allowed"
                    }`}
                    whileHover={hasUnsavedChanges ? { scale: 1.05 } : {}}
                    whileTap={hasUnsavedChanges ? { scale: 0.95 } : {}}
                  >
                    {isSaving ? (
                      <>
                        <FaSpinner className="animate-spin text-sm" />
                        <span className="hidden xs:inline">Saving...</span>
                      </>
                    ) : saveSuccess ? (
                      <>
                        <FaCheckCircle className="text-sm" />
                        <span className="hidden xs:inline">Saved!</span>
                      </>
                    ) : (
                      <>
                        <FaSave className="text-sm" />
                        <span className="hidden xs:inline">Save</span>
                      </>
                    )}
                  </m.button>

                  <m.button
                    onClick={handleContinue}
                    className="bg-gradient-to-r from-red-600 to-red-700 px-4 sm:px-6 py-2 rounded-lg font-bold hover:scale-105 transition-transform text-sm flex items-center gap-2 whitespace-nowrap"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="hidden sm:inline">
                      Continue to Homepage
                    </span>
                    <span className="sm:hidden">Continue</span>
                    <FaChevronRight className="text-xs" />
                  </m.button>
                </div>
              </div>
            </div>
          </m.div>

          {/* Main Content */}
          {loading ? (
            <CardCustomisationSkeleton />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Editor Panel */}
              <m.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-2xl" />

                <div className="relative p-6 space-y-6">
                  {/* Thumbnail Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      <FaImage className="inline mr-2 text-red-500" />
                      Course Thumbnail (16:9 ratio)
                    </label>

                    {settings.thumbnail ? (
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-red-500/30 group">
                        <Image
                          src={settings.thumbnail}
                          alt={settings.title || "Course preview"}
                          fill
                          unoptimized // ✅ ADD THIS
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={() => setImageError(true)}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <label className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer font-semibold text-sm">
                            Change
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleThumbnailUpload}
                              className="hidden"
                              disabled={uploading}
                            />
                          </label>
                          <button
                            onClick={() => {
                              setSettings((prev) => ({
                                ...prev,
                                thumbnail: "",
                              }));
                              setHasUnsavedChanges(true);
                              setImageError(false);
                            }}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="block aspect-video rounded-xl border-2 border-dashed border-red-500/30 hover:border-red-500/60 transition-colors cursor-pointer">
                        <div className="h-full flex flex-col items-center justify-center gap-3">
                          {uploading ? (
                            <>
                              <FaSpinner className="text-4xl text-red-500 animate-spin" />
                              <p className="text-gray-400 font-semibold">
                                Uploading...
                              </p>
                            </>
                          ) : (
                            <>
                              <FaImage className="text-4xl text-gray-600" />
                              <p className="text-gray-400 font-semibold">
                                Click to upload thumbnail
                              </p>
                              <p className="text-gray-600 text-sm">
                                Recommended: 1920x1080 (16:9)
                              </p>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      If no thumbnail is uploaded, a default icon will be shown
                    </p>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Course Title
                    </label>
                    <input
                      type="text"
                      value={settings.title}
                      onChange={(e) => {
                        setSettings((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Enter course title"
                      className="w-full bg-gray-900/50 border border-red-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Short Description
                    </label>
                    <textarea
                      value={settings.description}
                      onChange={(e) => {
                        setSettings((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Brief description for the course card"
                      rows={3}
                      className="w-full bg-gray-900/50 border border-red-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-red-500 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        <FaDollarSign className="inline mr-2 text-red-500" />
                        Price
                      </label>
                      <input
                        type="text"
                        value={settings.price}
                        onChange={(e) => {
                          setSettings((prev) => ({
                            ...prev,
                            price: e.target.value,
                          }));
                          setHasUnsavedChanges(true);
                        }}
                        placeholder="99"
                        className="w-full bg-gray-900/50 border border-red-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        <FaTag className="inline mr-2 text-red-500" />
                        Sale Price (Optional)
                      </label>
                      <input
                        type="text"
                        value={settings.salePrice}
                        onChange={(e) => {
                          setSettings((prev) => ({
                            ...prev,
                            salePrice: e.target.value,
                          }));
                          setHasUnsavedChanges(true);
                        }}
                        placeholder="49"
                        className="w-full bg-gray-900/50 border border-red-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-red-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* ✅ NEW: Sale Duration (Only show if sale price is entered) */}
                  {settings.salePrice && parseFloat(settings.salePrice) > 0 && (
                    <m.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      <label className="block text-sm font-semibold text-gray-300">
                        <FaClock className="inline mr-2 text-red-500" />
                        Sale Duration
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-400 mb-2">
                            Hours
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="720"
                            value={settings.saleHours}
                            onChange={(e) => {
                              setSettings((prev) => ({
                                ...prev,
                                saleHours: e.target.value,
                              }));
                              setHasUnsavedChanges(true);
                            }}
                            className="w-full bg-gray-900/50 border border-red-500/30 rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-2">
                            Minutes
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={settings.saleMinutes}
                            onChange={(e) => {
                              setSettings((prev) => ({
                                ...prev,
                                saleMinutes: e.target.value,
                              }));
                              setHasUnsavedChanges(true);
                            }}
                            className="w-full bg-gray-900/50 border border-red-500/30 rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Sale will automatically end after this duration
                      </p>
                    </m.div>
                  )}
                </div>
              </m.div>

              {/* Preview Panel - Optimized, removed heavy glows */}
              <m.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative"
              >
                <div className="sticky top-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-2xl" />

                  <div className="relative p-6">
                    <h3 className="text-lg font-bold text-white mb-4">
                      Live Preview
                    </h3>

                    {/* Course Card Preview - Optimized version */}
                    <div
                      onMouseEnter={() => setIsPreviewHovered(true)}
                      onMouseLeave={() => setIsPreviewHovered(false)}
                      className="group cursor-pointer"
                    >
                      <div className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/20 rounded-xl overflow-hidden hover:border-red-500/40 transition-all duration-300">
                        {/* Thumbnail - 16:9 Aspect Ratio */}
                        <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-black overflow-hidden">
                          {settings.thumbnail && !imageError ? (
                            <>
                              <Image
                                src={settings.thumbnail}
                                alt={settings.title || "Course preview"}
                                fill
                                unoptimized // ✅ ADD THIS
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={() => setImageError(true)}
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              />

                              {/* Simplified overlay - removed heavy glow */}
                              <AnimatePresence>
                                {isPreviewHovered && (
                                  <m.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/50 flex items-center justify-center"
                                  />
                                )}
                              </AnimatePresence>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                              <FaBook className="text-red-400 text-4xl sm:text-5xl md:text-6xl opacity-30 group-hover:opacity-50 transition-opacity" />
                            </div>
                          )}

                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                          {/* Duration Badge */}
                          <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 bg-black/70 backdrop-blur-sm text-white px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-semibold flex items-center gap-1">
                            <FaClock className="text-red-400" />
                            {mockPreviewData.stats.duration}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 sm:p-5 md:p-6">
                          <h3 className="text-white text-lg sm:text-xl md:text-2xl font-bold mb-2 line-clamp-2 group-hover:text-red-500 transition-colors leading-tight">
                            {settings.title || "Course Title Preview"}
                          </h3>
                          <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 leading-relaxed">
                            {settings.description ||
                              "Your course description will appear here. Add a compelling description to attract students."}
                          </p>

                          {/* Owner */}
                          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-red-500/10">
                            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-red-500/50 flex-shrink-0 overflow-hidden">
                              {mockPreviewData.owner.avatar ? (
                                <Image
                                  src={mockPreviewData.owner.avatar}
                                  alt={mockPreviewData.owner.name}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                                  <span className="text-white font-bold text-xs sm:text-sm">
                                    {mockPreviewData.owner.name
                                      .charAt(0)
                                      .toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className="text-gray-300 font-medium text-xs sm:text-sm md:text-base truncate flex-1">
                              {mockPreviewData.owner.name}
                            </span>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center justify-between text-xs sm:text-sm mb-3 sm:mb-4 gap-2">
                            <div className="flex items-center gap-1 sm:gap-2 text-gray-400">
                              <FaUsers className="text-red-400 flex-shrink-0 text-xs sm:text-sm" />
                              <span className="truncate font-medium">
                                {mockPreviewData.stats.students.toLocaleString()}
                                <span className="hidden sm:inline ml-1">
                                  students
                                </span>
                              </span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 text-gray-400">
                              <FaStar className="text-yellow-500 flex-shrink-0 text-xs sm:text-sm" />
                              <span className="font-semibold text-white">
                                {mockPreviewData.stats.rating.toFixed(1)}
                              </span>
                            </div>
                          </div>

                          {/* ✅ IMPROVED: Price & Timer - Timer on the right */}
                          {/* ✅ IMPROVED: Price & Sale Display in Preview */}
                          <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-3 xs:gap-2">
                            <div className="flex flex-col gap-2">
                              {settings.salePrice &&
                              parseFloat(settings.salePrice) > 0 ? (
                                <>
                                  {/* Sale Timer */}
                                  {settings.saleEndsAt && (
                                    <CountdownTimer
                                      endsAt={settings.saleEndsAt}
                                    />
                                  )}

                                  {/* Price Display */}
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-500 line-through text-xs sm:text-sm">
                                      ${settings.price || "0"}
                                    </span>
                                    <span className="text-red-500 font-bold text-lg sm:text-xl md:text-2xl">
                                      ${settings.salePrice}
                                    </span>
                                    {settings.price && settings.salePrice && (
                                      <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/30">
                                        {Math.round(
                                          ((parseFloat(settings.price) -
                                            parseFloat(settings.salePrice)) /
                                            parseFloat(settings.price)) *
                                            100
                                        )}
                                        % OFF
                                      </span>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <span className="text-red-500 font-bold text-lg sm:text-xl md:text-2xl">
                                  ${settings.price || "0"}
                                </span>
                              )}
                            </div>
                            <button className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm md:text-base font-semibold transition-all duration-300 hover:scale-105 active:scale-95">
                              View Course
                            </button>
                          </div>
                        </div>

                        {/* Removed heavy hover glow effect for performance */}
                      </div>
                    </div>

                    {/* Preview Note */}
                    <div className="mt-4 p-3 bg-gray-900/50 border border-red-500/20 rounded-lg">
                      <p className="text-xs text-gray-400">
                        <span className="text-red-400 font-semibold">
                          Note:
                        </span>{" "}
                        Owner info and stats shown are preview placeholders.
                        They will reflect actual course data on the courses
                        page.
                      </p>
                    </div>
                  </div>
                </div>
              </m.div>
            </div>
          )}
        </div>
      </div>
    </LazyMotion>
  );
};

export default CardCustomisationPage;
