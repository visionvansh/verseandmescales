//Volumes/vision/codes/course/my-app/src/app/users/videoplayer/page.tsx
"use client";

import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  FaPlay, FaPause, FaExpand, FaCompress, FaVolumeMute, FaVolumeUp,
  FaChevronLeft, FaChevronRight, FaDownload, FaClock, FaCheckCircle,
  FaArrowLeft, FaBookOpen, FaListUl, FaStar, FaFire, FaLightbulb,
  FaQuestionCircle, FaComments, FaExclamationTriangle, FaCog, FaTachometerAlt, FaHdd, FaYoutube
} from 'react-icons/fa';

import { VideoPlayerQuestionModal } from '@/components/courseinside/VideoPlayerQuestionModal';

// Types
interface Resource { name: string; type: string; size: string; url: string; }
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

interface Note { id: string; timestamp: string; content: string; createdAt: string; }
interface VideoQuality { label: string; value: string; url?: string; bitrate?: string; }

interface Lesson {
  videoType: string; id: string; title: string; description: string;
  duration: string; videoUrl: string; videoQualities?: VideoQuality[];
  isCompleted: boolean; progressPercent?: number; lastPosition?: number;
  watchTime?: number; resources: Resource[]; transcript: string;
  keyTakeaways: string[]; relatedLessons: { id: string; title: string }[];
  module: { id: string; title: string }; course: { id: string; title: string };
}

// Helper Functions
const getYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url?.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// [NotEnrolledPage component]
const NotEnrolledPage = memo(({ courseId }: { courseId: string }) => {
  const router = useRouter();
  return (
    <div className="relative w-full min-h-screen overflow-x-hidden mt-16 sm:mt-20">
      <div className="relative z-10">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 sm:py-12 md:py-16">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-2xl" />
              
              <div className="relative p-6 sm:p-8 md:p-12 lg:p-16 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 sm:mb-8 rounded-full bg-gradient-to-br from-red-600/20 to-red-800/20 border-2 border-red-500/30 flex items-center justify-center"
                >
                  <FaExclamationTriangle className="text-4xl sm:text-5xl text-red-400" />
                </motion.div>

                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
                  You Are Not Enrolled
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-gray-400 mb-8 max-w-md mx-auto px-4">
                  You need to enroll in this course to access the learning materials and modules
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto px-4">
                  <button
                    onClick={() => router.push(`/users/courses/${courseId}`)}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:scale-105 transition-transform text-sm sm:text-base"
                  >
                    View Course Details
                  </button>
                  <button
                    onClick={() => router.push('/users/courses')}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gray-800/50 border border-gray-700 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors text-sm sm:text-base"
                  >
                    Browse Courses
                  </button>
                </div>

                <div className="mt-8 pt-8">
                  <button
                    onClick={() => router.back()}
                    className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm"
                  >
                    ← Go Back
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
});
NotEnrolledPage.displayName = 'NotEnrolledPage';

// [Skeleton components]
const Skeleton = memo(({ className = "", animate = true }: { className?: string; animate?: boolean }) => (
  <div 
    className={`bg-gray-800/50 rounded ${animate ? 'skeleton-pulse' : ''} ${className}`}
    style={{ minHeight: '1rem' }}
  />
));
Skeleton.displayName = 'Skeleton';

const VideoLoadingSkeleton = memo(() => (
  <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 overflow-hidden rounded-lg sm:rounded-xl lg:rounded-2xl">
    <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 skeleton-shimmer" />
    <div className="relative z-10 flex flex-col items-center gap-4">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-700/50 skeleton-pulse flex items-center justify-center">
        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-600/50 rounded skeleton-pulse" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="h-3 w-24 bg-gray-700/50 rounded skeleton-pulse" />
        <div className="h-2 w-16 bg-gray-700/30 rounded skeleton-pulse" />
      </div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
      <div className="h-1 w-full bg-gray-700/50 rounded-full mb-3 skeleton-pulse" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 bg-gray-700/50 rounded-lg skeleton-pulse" />
          <div className="w-20 h-5 bg-gray-700/50 rounded skeleton-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-12 h-5 bg-gray-700/50 rounded skeleton-pulse" />
          <div className="w-12 h-5 bg-gray-700/50 rounded skeleton-pulse" />
          <div className="w-8 h-8 bg-gray-700/50 rounded-lg skeleton-pulse" />
        </div>
      </div>
    </div>
  </div>
));
VideoLoadingSkeleton.displayName = 'VideoLoadingSkeleton';

const QualityChangeSkeleton = memo(() => (
  <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 overflow-hidden rounded-lg sm:rounded-xl lg:rounded-2xl backdrop-blur-sm">
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-end gap-1">
        <div className="w-2 h-4 bg-gray-600/60 rounded skeleton-pulse" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-6 bg-gray-600/60 rounded skeleton-pulse" style={{ animationDelay: '100ms' }} />
        <div className="w-2 h-8 bg-gray-600/60 rounded skeleton-pulse" style={{ animationDelay: '200ms' }} />
        <div className="w-2 h-5 bg-gray-600/60 rounded skeleton-pulse" style={{ animationDelay: '300ms' }} />
        <div className="w-2 h-7 bg-gray-600/60 rounded skeleton-pulse" style={{ animationDelay: '400ms' }} />
      </div>
      <div className="h-3 w-28 bg-gray-700/50 rounded skeleton-pulse" />
    </div>
  </div>
));
QualityChangeSkeleton.displayName = 'QualityChangeSkeleton';

const VideoPlayerSkeleton = memo(() => (
  <div className="relative bg-black rounded-lg sm:rounded-xl lg:rounded-2xl overflow-hidden mb-4 sm:mb-6 aspect-video border border-red-500/30">
    <div className="absolute inset-0 bg-gray-900/50 skeleton-pulse" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-800/50 skeleton-pulse" />
    </div>
  </div>
));
VideoPlayerSkeleton.displayName = 'VideoPlayerSkeleton';

const VideoInfoSkeleton = memo(() => (
  <div className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 backdrop-blur-xl mb-4 sm:mb-6">
    <div className="mb-4">
      <Skeleton className="h-6 sm:h-8 lg:h-10 w-3/4 mb-3" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6" />
    </div>
    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-6 w-36" />
    </div>
  </div>
));
VideoInfoSkeleton.displayName = 'VideoInfoSkeleton';

const TabNavigationSkeleton = memo(() => (
  <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto scrollbar-hide pb-2">
    <Skeleton className="h-10 w-32 rounded-lg flex-shrink-0" />
    <Skeleton className="h-10 w-32 rounded-lg flex-shrink-0" />
    <Skeleton className="h-10 w-32 rounded-lg flex-shrink-0" />
  </div>
));
TabNavigationSkeleton.displayName = 'TabNavigationSkeleton';

const TabContentSkeleton = memo(() => (
  <div className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 backdrop-blur-xl">
    <Skeleton className="h-6 w-48 mb-4" />
    <div className="space-y-3">
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
    </div>
  </div>
));
TabContentSkeleton.displayName = 'TabContentSkeleton';

const SidebarSkeleton = memo(() => (
  <div className="space-y-4 sm:space-y-6">
    <div className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
      <Skeleton className="h-5 w-40 mb-4" />
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 flex-1 rounded-lg" />
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
    <div className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
      <Skeleton className="h-5 w-32 mb-4" />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  </div>
));
SidebarSkeleton.displayName = 'SidebarSkeleton';

const LoadingSkeleton = memo(() => (
  <div className="relative w-full min-h-screen overflow-x-hidden">
    <div className="relative z-10">
      <section className="relative w-full py-3 sm:py-4 lg:py-6">
        <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32 rounded-lg" />
          </div>
        </div>
      </section>

      <section className="relative w-full py-4 sm:py-6 lg:py-8">
        <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <div className="lg:col-span-2">
              <VideoPlayerSkeleton />
              <VideoInfoSkeleton />
              <TabNavigationSkeleton />
              <TabContentSkeleton />
            </div>
            <div className="lg:col-span-1">
              <SidebarSkeleton />
            </div>
          </div>
        </div>
      </section>
    </div>

    <style jsx global>{`
      .skeleton-pulse {
        animation: skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      @keyframes skeleton-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .skeleton-shimmer {
        animation: skeleton-shimmer 2s ease-in-out infinite;
      }
      @keyframes skeleton-shimmer {
        0% { opacity: 0.5; }
        50% { opacity: 0.8; }
        100% { opacity: 0.5; }
      }
      @media (prefers-reduced-motion: reduce) {
        .skeleton-pulse,
        .skeleton-shimmer {
          animation: none;
          opacity: 0.7;
        }
      }
    `}</style>
  </div>
));
LoadingSkeleton.displayName = 'LoadingSkeleton';

// ============================================
// MAIN COMPONENT
// ============================================

const VideoPlayerPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonId = searchParams.get('lessonId');
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const progressSaveInterval = useRef<NodeJS.Timeout | undefined>(undefined);

  // State
  const [lessonData, setLessonData] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [videoDurationSeconds, setVideoDurationSeconds] = useState(0);
  const [videoCurrentSeconds, setVideoCurrentSeconds] = useState(0);
  const [activeTab, setActiveTab] = useState<"resources" | "transcript" | "notes">("resources");
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [watchTime, setWatchTime] = useState(0);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [isMarkedComplete, setIsMarkedComplete] = useState(false);
  const [isRestoringPosition, setIsRestoringPosition] = useState(false);
  
  // Quality & Controls
  const [availableQualities, setAvailableQualities] = useState<VideoQuality[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>('auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isChangingQuality, setIsChangingQuality] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

  // Questions
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [roomId, setRoomId] = useState<string>("");

  // YouTube specific
  const [isYoutube, setIsYoutube] = useState(false);
  const [youtubeId, setYoutubeId] = useState<string | null>(null);

  // Enrollment
  const [enrollmentStatus, setEnrollmentStatus] = useState({ checked: false, enrolled: false, isOwner: false, courseId: null as string | null });

  // --- Enrollment Check ---
  const checkEnrollmentAccess = useCallback(async (courseId: string) => {
    try {
      const response = await fetch(`/api/course/check-enrollment?courseId=${courseId}`, { credentials: 'include' });
      if (!response.ok) {
        setEnrollmentStatus({ checked: true, enrolled: false, isOwner: false, courseId });
        return false;
      }
      const data = await response.json();
      const hasAccess = data.enrolled || data.isOwner;
      setEnrollmentStatus({ checked: true, enrolled: data.enrolled || false, isOwner: data.isOwner || false, courseId });
      return hasAccess;
    } catch (error) {
      setEnrollmentStatus({ checked: true, enrolled: false, isOwner: false, courseId });
      return false;
    }
  }, []);

  // --- Load Lesson Data ---
  useEffect(() => {
    if (lessonId) fetchLessonDataUpdated();
    else { setError("No lesson ID provided"); setLoading(false); }
  }, [lessonId]);

const fetchLessonDataUpdated = async () => {
  try {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/course/video?lessonId=${lessonId}`);
    if (!response.ok) throw new Error('Failed to fetch lesson data');
    const data = await response.json();

    if (data.course?.id) {
      const hasAccess = await checkEnrollmentAccess(data.course.id);
      if (!hasAccess) { setLoading(false); return; }
    }
    
    setLessonData(data);
    
    // ✅ Parse duration (data.duration is already in seconds from API)
    const durationSeconds = parseInt(data.duration) || 0;
    setVideoDurationSeconds(durationSeconds);
    setDuration(formatTime(durationSeconds));
    
    // Determine Player Type
    const ytId = getYoutubeId(data.videoUrl);
    if (ytId) {
      setIsYoutube(true);
      setYoutubeId(ytId);
    } else {
      setIsYoutube(false);
      setAvailableQualities(parseVideoQualities(data.videoUrl));
    }

    if (data.watchTime > 0) setWatchTime(data.watchTime);
    if (data.progressPercent > 0) setProgress(data.progressPercent);
    setIsMarkedComplete(data.isCompleted);
    
  } catch (err) {
    console.error(err);
    setError('Failed to load lesson data');
  } finally {
    setLoading(false);
  }
};

  const parseVideoQualities = (videoUrl: string): VideoQuality[] => {
    // Check if it's a Cloudinary URL
    if (videoUrl.includes('cloudinary.com')) {
      const baseUrl = videoUrl.split('/upload/')[0] + '/upload/';
      const videoPath = videoUrl.split('/upload/')[1];
      
      return [
        { label: 'Auto', value: 'auto', url: videoUrl },
        { label: '1080p', value: '1080', url: `${baseUrl}q_auto,h_1080/${videoPath}`, bitrate: '~5 Mbps' },
        { label: '720p', value: '720', url: `${baseUrl}q_auto,h_720/${videoPath}`, bitrate: '~2.5 Mbps' },
        { label: '480p', value: '480', url: `${baseUrl}q_auto,h_480/${videoPath}`, bitrate: '~1 Mbps' },
        { label: '360p', value: '360', url: `${baseUrl}q_auto,h_360/${videoPath}`, bitrate: '~0.5 Mbps' },
      ];
    }
    // For static videos or others
    return [{ label: 'Auto', value: 'auto', url: videoUrl }];
  };

  // --- YouTube Iframe Loader ---
  useEffect(() => {
    if (isYoutube && !window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, [isYoutube]);

  // --- Unified Controls ---
  const formatTime = useCallback((seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const togglePlay = useCallback(() => {
    if (isYoutube && youtubePlayerRef.current) {
        if (isPlaying) youtubePlayerRef.current.pauseVideo();
        else youtubePlayerRef.current.playVideo();
        setIsPlaying(!isPlaying);
    } else if (videoRef.current) {
        if (isPlaying) videoRef.current.pause();
        else videoRef.current.play();
        setIsPlaying(!isPlaying);
    }
  }, [isPlaying, isYoutube]);

  const handleProgressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    setProgress(newProgress);
    const newTime = (videoDurationSeconds * newProgress) / 100;
    
    if (isYoutube && youtubePlayerRef.current) {
        youtubePlayerRef.current.seekTo(newTime, true);
    } else if (videoRef.current) {
        videoRef.current.currentTime = newTime;
    }
    setVideoCurrentSeconds(newTime);
    setCurrentTime(formatTime(newTime));
  }, [videoDurationSeconds, formatTime, isYoutube]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (isYoutube && youtubePlayerRef.current) {
        youtubePlayerRef.current.setVolume(newVolume * 100);
        if (newVolume === 0) youtubePlayerRef.current.mute();
        else youtubePlayerRef.current.unMute();
    } else if (videoRef.current) {
        videoRef.current.volume = newVolume;
    }
  }, [isYoutube]);

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    const newVol = newMuted ? 0 : 1;
    setVolume(newVol);

    if (isYoutube && youtubePlayerRef.current) {
      if (newMuted) youtubePlayerRef.current.mute();
      else { youtubePlayerRef.current.unMute(); youtubePlayerRef.current.setVolume(100); }
    } else if (videoRef.current) {
      videoRef.current.muted = newMuted;
      videoRef.current.volume = newVol;
    }
  }, [isMuted, isYoutube]);

  const toggleFullscreen = useCallback(() => {
    const container = videoContainerRef.current;
    const video = videoRef.current;

    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      if (container?.requestFullscreen) {
        container.requestFullscreen().catch(err => {
          console.warn("Standard requestFullscreen failed, trying fallback:", err);
          if (video && (video as any).webkitEnterFullscreen) {
            (video as any).webkitEnterFullscreen();
          }
        });
      } else if (container && (container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      } else if (video && (video as any).webkitEnterFullscreen) {
        (video as any).webkitEnterFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
      setIsFullscreen(false);
    }
  }, []);

  const changePlaybackSpeed = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    if (isYoutube && youtubePlayerRef.current) {
        youtubePlayerRef.current.setPlaybackRate(speed);
    } else if (videoRef.current) {
        videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  }, [isYoutube]);

  // --- Quality Control (New) ---
  const changeVideoQuality = useCallback(async (quality: VideoQuality) => {
    try {
      setIsChangingQuality(true);
      if (isYoutube && youtubePlayerRef.current) {
        youtubePlayerRef.current.setPlaybackQuality(quality.value);
        setCurrentQuality(quality.value);
        setShowQualityMenu(false);
      } else if (videoRef.current && quality.url) {
        const currentTime = videoRef.current.currentTime;
        const wasPlaying = !videoRef.current.paused;
        videoRef.current.src = quality.url;
        videoRef.current.load();
        videoRef.current.currentTime = currentTime;
        if(wasPlaying) await videoRef.current.play();
        setCurrentQuality(quality.value);
        setShowQualityMenu(false);
      }
    } catch (e) {
      console.error("Quality change failed", e);
    } finally {
      setIsChangingQuality(false);
    }
  }, [isYoutube]);

  // --- YouTube Event Handlers ---
  const onPlayerReady = (event: any) => {
    const durationSec = event.target.getDuration();
    
    console.log('🎬 YouTube Player Ready:', {
      durationSec,
      formatted: formatTime(durationSec)
    });
    
    if (durationSec && durationSec > 0) {
      setVideoDurationSeconds(durationSec);
      setDuration(formatTime(durationSec));
    }
    
    // Stop loading spinner
    setIsVideoLoading(false); 
    setIsVideoReady(true);

    // Extract qualities
    const qualities = event.target.getAvailableQualityLevels();
    if (qualities && qualities.length > 0) {
      const formattedQualities = qualities.map((q: string) => ({
        label: q === 'auto' ? 'Auto' : q.toUpperCase(),
        value: q,
        bitrate: q.includes('hd') ? 'HD' : 'SD'
      }));
      setAvailableQualities(formattedQualities);
    }

    // Update duration in backend if we got a valid duration
    if (durationSec && durationSec > 0) {
      updateDurationInBackend(durationSec);
    }

    // Restore position
    if (lessonData?.lastPosition && lessonData.lastPosition > 0) {
      console.log('⏩ Restoring YouTube position to:', lessonData.lastPosition);
      event.target.seekTo(lessonData.lastPosition, true);
      setVideoCurrentSeconds(lessonData.lastPosition);
      setCurrentTime(formatTime(lessonData.lastPosition));
      if (durationSec > 0) {
        setProgress((lessonData.lastPosition / durationSec) * 100);
      }
    }
  };

  const onPlayerStateChange = (event: any) => {
    setIsPlaying(event.data === 1); // 1 = Playing
  };

  // YouTube Polling for Progress - UPDATED
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isYoutube && isPlaying && youtubePlayerRef.current) {
      interval = setInterval(() => {
        try {
          const player = youtubePlayerRef.current;
          if (!player) return;
          
          const curr = player.getCurrentTime();
          const dur = player.getDuration();
          
          if (curr !== undefined && dur && dur > 0) {
            const newProgress = (curr / dur) * 100;
            
            setVideoCurrentSeconds(curr);
            setCurrentTime(formatTime(curr));
            setProgress(newProgress);
            setWatchTime(prev => Math.max(prev, curr)); // Track max watch time
            
            // Also update duration if not set
            if (videoDurationSeconds <= 0) {
              setVideoDurationSeconds(dur);
              setDuration(formatTime(dur));
            }
          }
        } catch (e) {
          console.warn('YouTube polling error:', e);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isYoutube, isPlaying, formatTime, videoDurationSeconds]);

  // --- Initialize YouTube Player ---
  useEffect(() => {
    if (!isYoutube || !youtubeId) return;

    const createPlayer = () => {
      if (youtubePlayerRef.current) return;
      youtubePlayerRef.current = new window.YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: youtubeId,
        playerVars: {
          'playsinline': 1,
          'controls': 0,
          'rel': 0,
          'modestbranding': 1,
          'disablekb': 1,
          'origin': window.location.origin 
        },
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange
        }
      });
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const existingOnReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (existingOnReady) existingOnReady();
        createPlayer();
      };
    }

    return () => {
        if (youtubePlayerRef.current && youtubePlayerRef.current.destroy) {
            try { youtubePlayerRef.current.destroy(); } catch (e) {}
            youtubePlayerRef.current = null;
        }
    };
  }, [isYoutube, youtubeId]);

  // --- API Calls ---
  const updateDurationInBackend = async (durationSec: number) => {
     if(!lessonId || !lessonData) return;
     try {
       await fetch('/api/course/lesson/update-metadata', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           lessonId,
           duration: durationSec.toString(),
         }),
       });
       console.log("✅ Duration updated in backend");
     } catch (e) {
       console.warn("Could not auto-update duration", e);
     }
  };

  // UPDATED saveProgress function
  const saveProgress = useCallback(async (forceComplete = false) => {
  if (!lessonId || !lessonData) return;
  
  // For YouTube, get current duration from player if available
  let currentDuration = videoDurationSeconds;
  let currentPosition = videoCurrentSeconds;
  let currentProgress = progress;
  let currentWatchTime = watchTime;
  
  // If YouTube player exists, get fresh values
  if (isYoutube && youtubePlayerRef.current) {
    try {
      const ytDuration = youtubePlayerRef.current.getDuration();
      const ytCurrentTime = youtubePlayerRef.current.getCurrentTime();
      
      if (ytDuration && ytDuration > 0) {
        currentDuration = ytDuration;
        currentPosition = ytCurrentTime;
        currentProgress = (ytCurrentTime / ytDuration) * 100;
        currentWatchTime = ytCurrentTime;
      }
    } catch (e) {
      console.warn('Could not get YouTube player state:', e);
    }
  }
  
  // Don't save if we don't have valid duration
  if (currentDuration <= 0) {
    console.warn('⚠️ Cannot save progress: Invalid duration');
    return;
  }
  
  console.log('💾 Saving progress:', {
    lessonId,
    isYoutube,
    watchTime: Math.floor(currentWatchTime),
    progressPercent: Math.round(currentProgress),
    lastPosition: Math.floor(currentPosition),
    totalDuration: Math.floor(currentDuration),
    forceComplete,
    isAlreadyMarkedComplete: isMarkedComplete // ✅ Track if already complete
  });
  
  try {
    setIsSavingProgress(true);
    const response = await fetch('/api/course/lesson/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lessonId,
        moduleId: lessonData.module.id,
        courseId: lessonData.course.id,
        watchTime: Math.floor(currentWatchTime),
        progressPercent: Math.round(currentProgress),
        lastPosition: Math.floor(currentPosition),
        isCompleted: forceComplete || currentProgress >= 90,
        totalDuration: Math.floor(currentDuration)
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Failed to save progress:', errorData);
    } else {
      const data = await response.json();
      console.log('✅ Progress saved successfully:', data);
      
      // ✅ Update local state based on server response
      if (data.progress?.isCompleted) {
        setIsMarkedComplete(true);
      }
      
      // ✅ Update progress display if server says it was already complete
      if (data.progress?.wasAlreadyCompleted) {
        setProgress(100); // Keep showing 100% for completed videos
      }
    }
  } catch (e) { 
    console.error('❌ Error saving progress:', e); 
  } finally { 
    setIsSavingProgress(false); 
  }
}, [lessonId, lessonData, progress, watchTime, videoCurrentSeconds, videoDurationSeconds, isYoutube, isMarkedComplete]);

  // UPDATED auto-save interval
  useEffect(() => {
    if (isPlaying && (videoDurationSeconds > 0 || isYoutube)) {
      progressSaveInterval.current = setInterval(() => {
        saveProgress(false);
      }, 10000); // Save every 10 seconds
      
      return () => {
        if (progressSaveInterval.current) {
          clearInterval(progressSaveInterval.current);
        }
      };
    }
  }, [isPlaying, saveProgress, videoDurationSeconds, isYoutube]);

  // Add cleanup to save progress when leaving the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Sync save on page leave
      if (lessonId && lessonData && (progress > 0 || watchTime > 0)) {
        // Use sendBeacon for reliable save on page leave
        const data = JSON.stringify({
          lessonId,
          moduleId: lessonData.module.id,
          courseId: lessonData.course.id,
          watchTime: Math.floor(watchTime),
          progressPercent: Math.round(progress),
          lastPosition: Math.floor(videoCurrentSeconds),
          isCompleted: progress >= 90,
          totalDuration: Math.floor(videoDurationSeconds)
        });
        
        navigator.sendBeacon('/api/course/lesson/progress', new Blob([data], { type: 'application/json' }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also save when component unmounts
      if (lessonId && lessonData && (progress > 0 || watchTime > 0)) {
        saveProgress(false);
      }
    };
  }, [lessonId, lessonData, progress, watchTime, videoCurrentSeconds, videoDurationSeconds, saveProgress]);

  // --- Video Controls UI Logic ---
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeout) clearTimeout(controlsTimeout);
    if (window.innerWidth >= 768 && isPlaying) {
      setControlsTimeout(setTimeout(() => setShowControls(false), 3000));
    }
  }, [isPlaying, controlsTimeout]);

  const handleVideoTap = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.video-controls')) {
      return;
    }
    if (window.innerWidth < 768) {
      setShowControls(prev => !prev);
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    const handleLoadStart = () => {
      console.log('📹 Video: Load started');
      setIsVideoLoading(true);
      setIsVideoReady(false);
      setVideoError(false);
    };

    const handleLoadedMetadata = () => {
      console.log('📹 Video: Metadata loaded');
      if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
        const totalSeconds = video.duration;
        setVideoDurationSeconds(totalSeconds);
        setDuration(formatTime(totalSeconds));
        console.log('⏱️ Video metadata loaded, duration:', totalSeconds);
        
        if (isMobile) {
          setIsVideoLoading(false);
          setIsVideoReady(true);
        }
      }
    };

    const handleLoadedData = () => {
      console.log('📹 Video: Data loaded');
      setIsVideoLoading(false);
      setIsVideoReady(true);
    };

    const handleCanPlay = () => {
      console.log('📹 Video: Can play');
      setIsVideoLoading(false);
      setIsVideoReady(true);
    };

    const handleCanPlayThrough = () => {
      console.log('📹 Video: Can play through');
      setIsVideoLoading(false);
      setIsVideoReady(true);
    };

    const handleWaiting = () => {
      console.log('⏳ Video: Waiting/Buffering');
      if (!isChangingQuality) {
        setIsVideoLoading(true);
      }
    };

    const handlePlaying = () => {
      console.log('▶️ Video: Playing');
      setIsVideoLoading(false);
      setIsVideoReady(true);
    };

    const handleError = (e: Event) => {
      console.error('❌ Video error:', e);
      const videoElement = e.target as HTMLVideoElement;
      if (videoElement.error) {
        console.error('❌ Video error code:', videoElement.error.code);
        console.error('❌ Video error message:', videoElement.error.message);
      }
      setVideoError(true);
      setIsVideoLoading(false);
    };

    const handleTimeUpdate = () => {
      if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
        const currentSeconds = video.currentTime;
        const totalSeconds = video.duration;
        const progressPercent = (currentSeconds / totalSeconds) * 100;
        
        setVideoCurrentSeconds(currentSeconds);
        setProgress(progressPercent);
        setCurrentTime(formatTime(currentSeconds));
        
        if (isPlaying) {
          setWatchTime(currentSeconds);
        }
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(100);
      saveProgress(true);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleStalled = () => {
      console.log('⚠️ Video: Stalled');
      if (video.readyState < 3) {
        console.log('🔄 Attempting to recover from stall...');
        video.load();
      }
    };

    const handleSuspend = () => {
      console.log('⏸️ Video: Suspended');
      if (isMobile && video.readyState >= 1) {
        setIsVideoLoading(false);
        setIsVideoReady(true);
      }
    };

    if (!isYoutube) {
      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('canplaythrough', handleCanPlayThrough);
      video.addEventListener('waiting', handleWaiting);
      video.addEventListener('playing', handlePlaying);
      video.addEventListener('error', handleError);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('ended', handleEnded);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('stalled', handleStalled);
      video.addEventListener('suspend', handleSuspend);

      if (video.readyState === 0) {
        console.log('🔄 Forcing video load...');
        video.load();
      }

      if (video.readyState >= 1) {
        handleLoadedMetadata();
      }
      if (video.readyState >= 2) {
        handleLoadedData();
      }
      if (video.readyState >= 3) {
        handleCanPlay();
      }

      const mobileTimeout = setTimeout(() => {
        if (isMobile && !isVideoReady && !videoError) {
          console.log('📱 Mobile timeout: Marking video as ready');
          setIsVideoLoading(false);
          setIsVideoReady(true);
        }
      }, 3000);

      return () => {
        clearTimeout(mobileTimeout);
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('canplaythrough', handleCanPlayThrough);
        video.removeEventListener('waiting', handleWaiting);
        video.removeEventListener('playing', handlePlaying);
        video.removeEventListener('error', handleError);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('ended', handleEnded);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('stalled', handleStalled);
        video.removeEventListener('suspend', handleSuspend);
      };
    }
  }, [formatTime, isPlaying, saveProgress, isVideoReady, videoError, isChangingQuality, isYoutube]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !lessonData?.lastPosition || lessonData.lastPosition <= 0 || !isVideoReady) return;

    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const restorePosition = () => {
      if (!mounted || !video || !isVideoReady) return;

      if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
        const savedPosition = lessonData.lastPosition || 0;
        
        if (savedPosition > 0 && savedPosition < video.duration && 
            Math.abs(video.currentTime - savedPosition) > 1) {
          console.log(`⏩ Restoring position to ${savedPosition}s`);
          setIsRestoringPosition(true);
          
          video.currentTime = savedPosition;
          setVideoCurrentSeconds(savedPosition);
          setCurrentTime(formatTime(savedPosition));
          
          const progressPercent = (savedPosition / video.duration) * 100;
          setProgress(progressPercent);
          
          setTimeout(() => {
            if (mounted) {
              setIsRestoringPosition(false);
            }
          }, 2000);
        }
      }
    };

    if (isVideoReady) {
      timeoutId = setTimeout(restorePosition, 100);
    }

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [lessonData?.lastPosition, formatTime, isVideoReady]);

  const handleAddNote = useCallback(() => {
    if (newNote.trim()) {
      const note: Note = {
        id: Date.now().toString(),
        timestamp: currentTime,
        content: newNote,
        createdAt: new Date().toLocaleString(),
      };
      setNotes(prev => [...prev, note]);
      setNewNote("");
    }
  }, [newNote, currentTime]);

  const handleDeleteNote = useCallback((noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
  }, []);

  const handleTabChange = useCallback((tab: "resources" | "transcript" | "notes") => {
    setActiveTab(tab);
  }, []);

  useEffect(() => {
    if (lessonData?.course?.id) {
      fetchRoomId(lessonData.course.id);
    }
  }, [lessonData?.course?.id]);

  const fetchRoomId = async (courseId: string) => {
    try {
      const response = await fetch(`/api/chat/room?courseId=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setRoomId(data.roomId);
      }
    } catch (error) {
      console.error('Failed to fetch room ID:', error);
    }
  };

  const handleQuestionCreated = (question: any) => {
    console.log('Question created:', question);
  };

  const handleMarkComplete = async () => {
    await saveProgress(true);
    setTimeout(() => {
      if (lessonData?.module?.id) {
        router.push(`/users/learning?moduleId=${lessonData.module.id}`);
      }
    }, 1000);
  };

  if (enrollmentStatus.checked && !enrollmentStatus.enrolled && !enrollmentStatus.isOwner && enrollmentStatus.courseId) {
    return <NotEnrolledPage courseId={enrollmentStatus.courseId} />;
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !lessonData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="relative z-10 text-center max-w-md w-full">
          <div className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-xl">
            <FaExclamationTriangle className="text-red-500 text-5xl sm:text-6xl mx-auto mb-4 sm:mb-6" />
            <h1 className="text-white text-2xl sm:text-3xl font-black mb-3 sm:mb-4">{error || 'Lesson Not Found'}</h1>
            <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6">We couldn't load the lesson. Please try again.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.back()}
                className="flex-1 bg-gray-900/50 border border-red-500/30 text-white px-4 sm:px-6 py-3 rounded-xl font-bold hover:bg-gray-800/50 transition-colors text-sm sm:text-base"
              >
                <FaArrowLeft className="inline mr-2" />
                Go Back
              </button>
              <button
                onClick={fetchLessonDataUpdated}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 sm:px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform text-sm sm:text-base"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden mt-16 sm:mt-20">
      <div className="relative z-10">
        {/* Header */}
        <section className="relative w-full py-3 sm:py-4 lg:py-6">
          <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  if (lessonData?.module?.id) {
                    router.push(`/users/learning?moduleId=${lessonData.module.id}`);
                  } else {
                    router.back();
                  }
                }}
                className="flex items-center gap-2 text-gray-400 hover:text-white hover:-translate-x-1 transition-transform"
              >
                <FaArrowLeft className="text-xs sm:text-sm" />
                <span className="text-[11px] sm:text-sm lg:text-base font-semibold hidden xs:inline">Back to Lessons</span>
                <span className="text-[11px] sm:text-sm lg:text-base font-semibold xs:hidden">Back</span>
              </button>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="relative w-full py-4 sm:py-6 lg:py-8">
          <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {/* Video Section */}
              <div className="lg:col-span-2 w-full">
                <div 
                  ref={videoContainerRef}
                  className="relative bg-black rounded-lg sm:rounded-xl lg:rounded-2xl md:overflow-hidden overflow-visible mb-4 sm:mb-6 group animate-fadeIn w-full border border-red-500/30 aspect-video touch-action-manipulation"
                  onMouseMove={resetControlsTimeout}
                  onTouchStart={resetControlsTimeout}
                  onClick={handleVideoTap}
                  style={{ touchAction: 'manipulation' }}
                >
                  {isChangingQuality && <QualityChangeSkeleton />}
                  {isVideoLoading && !videoError && !isChangingQuality && <VideoLoadingSkeleton />}

                  {videoError && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 overflow-hidden rounded-lg sm:rounded-xl lg:rounded-2xl">
                      <div className="text-center px-4">
                        <FaExclamationTriangle className="text-red-500 text-3xl sm:text-4xl mx-auto mb-3" />
                        <p className="text-white text-xs sm:text-sm font-semibold mb-3">Failed to load video</p>
                        <button
                          onClick={() => {
                            setVideoError(false);
                            if (videoRef.current) {
                              videoRef.current.load();
                            }
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-all"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  )}

                  {isYoutube ? (
                    <div id="youtube-player" className="w-full h-full pointer-events-auto" />
                  ) : lessonData.videoType === 'mega' ? (
                    <div className="absolute inset-0 bg-black rounded-lg sm:rounded-xl lg:rounded-2xl overflow-hidden">
                      <iframe
                        src={lessonData.videoUrl}
                        className="w-full h-full"
                        frameBorder="0"
                        allowFullScreen
                        allow="autoplay; fullscreen"
                        title="MEGA Video Player"
                      />
                    </div>
                  ) : (
                    <video
                      ref={videoRef}
                      key={lessonData.videoUrl}
                      className="w-full h-full bg-black object-contain rounded-lg sm:rounded-xl lg:rounded-2xl"
                      preload="metadata"
                      playsInline
                      webkit-playsinline="true"
                      crossOrigin="anonymous"
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <source src={lessonData.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  )}
                  {isYoutube && <FaYoutube className="absolute top-4 right-4 text-4xl text-red-600" />}

                  <EnhancedVideoControls
                    isPlaying={isPlaying}
                    progress={progress}
                    volume={volume}
                    isMuted={isMuted}
                    isFullscreen={isFullscreen}
                    currentTime={currentTime}
                    duration={duration}
                    playbackSpeed={playbackSpeed}
                    togglePlay={togglePlay}
                    handleProgressChange={handleProgressChange}
                    handleVolumeChange={handleVolumeChange}
                    toggleMute={toggleMute}
                    toggleFullscreen={toggleFullscreen}
                    changePlaybackSpeed={changePlaybackSpeed}
                    availableQualities={availableQualities}
                    currentQuality={currentQuality}
                    showQualityMenu={showQualityMenu}
                    setShowQualityMenu={setShowQualityMenu}
                    showSpeedMenu={showSpeedMenu}
                    setShowSpeedMenu={setShowSpeedMenu}
                    changeVideoQuality={changeVideoQuality}
                    showControls={showControls}
                  />
                </div>

                {/* Video Info */}
                <div className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 backdrop-blur-xl mb-4 sm:mb-6 animate-fadeIn">
                  <div className="flex items-start justify-between gap-3 sm:gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-white mb-2 break-words">
                        {lessonData.title}
                      </h1>
                      <p className="text-xs sm:text-sm lg:text-base text-gray-400 leading-relaxed">
                        {lessonData.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <InfoItem icon={FaClock} text={duration !== "0:00" ? duration : lessonData.duration} />
                    <InfoItem icon={FaDownload} text={`${lessonData.resources.length} Resources`} />
                    {isMarkedComplete && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <FaCheckCircle className="text-green-500 text-xs" />
                        <span className="text-green-400 font-semibold">Completed</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="animate-fadeIn" style={{ animationDelay: '100ms' }}>
                  <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

                  <AnimatePresence mode="wait">
                    {activeTab === "resources" && (
                      <ResourcesTab key="resources" resources={lessonData.resources} />
                    )}

                    {activeTab === "transcript" && (
                      <TranscriptTab key="transcript" transcript={lessonData.transcript} />
                    )}

                    {activeTab === "notes" && (
                      <NotesTab
                        key="notes"
                        notes={notes}
                        newNote={newNote}
                        setNewNote={setNewNote}
                        handleAddNote={handleAddNote}
                        handleDeleteNote={handleDeleteNote}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 w-full">
                <Sidebar
                  lessonData={lessonData}
                  currentTime={currentTime}
                  duration={duration}
                  progress={progress}
                  playbackSpeed={playbackSpeed}
                  watchTime={watchTime}
                  videoCurrentSeconds={videoCurrentSeconds}
                  videoDurationSeconds={videoDurationSeconds}
                  handleMarkComplete={handleMarkComplete}
                  isMarkedComplete={isMarkedComplete}
                  isSavingProgress={isSavingProgress}
                  router={router}
                  onAskQuestion={() => setIsQuestionModalOpen(true)}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {lessonData && roomId && (
        <VideoPlayerQuestionModal
          isOpen={isQuestionModalOpen}
          onClose={() => setIsQuestionModalOpen(false)}
          lessonData={{
            id: lessonData.id,
            title: lessonData.title,
            videoUrl: lessonData.videoUrl,
            module: lessonData.module,
            course: lessonData.course,
          }}
          roomId={roomId}
          currentVideoTime={videoCurrentSeconds}
          onQuestionCreated={handleQuestionCreated}
        />
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }

        .skeleton-pulse {
          animation: skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        
        .skeleton-shimmer {
          animation: skeleton-shimmer 2s ease-in-out infinite;
        }
        
        @keyframes skeleton-shimmer {
          0% { opacity: 0.5; }
          50% { opacity: 0.8; }
          100% { opacity: 0.5; }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
          
          .animate-fadeIn,
          .animate-slideIn,
          .skeleton-pulse,
          .skeleton-shimmer {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

// ============================================
// ENHANCED VIDEO CONTROLS - MOBILE OPTIMIZED
// ============================================
const EnhancedVideoControls = memo(({
  isPlaying,
  progress,
  volume,
  isMuted,
  isFullscreen,
  currentTime,
  duration,
  playbackSpeed,
  togglePlay,
  handleProgressChange,
  handleVolumeChange,
  toggleMute,
  toggleFullscreen,
  changePlaybackSpeed,
  availableQualities,
  currentQuality,
  showQualityMenu,
  setShowQualityMenu,
  showSpeedMenu,
  setShowSpeedMenu,
  changeVideoQuality,
  showControls,
}: any) => {
  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 px-3 pb-3 pt-8 md:p-3 transition-opacity duration-300 bg-gradient-to-t from-black/90 via-black/50 to-transparent ${
        showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Progress Bar */}
      <div className="mb-2 md:mb-3">
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress}
          onChange={handleProgressChange}
          className="w-full h-0.5 md:h-1 bg-gray-500/50 rounded-full appearance-none cursor-pointer 
            [&::-webkit-slider-thumb]:appearance-none 
            [&::-webkit-slider-thumb]:w-2.5 
            [&::-webkit-slider-thumb]:h-2.5 
            md:[&::-webkit-slider-thumb]:w-3 
            md:[&::-webkit-slider-thumb]:h-3 
            [&::-webkit-slider-thumb]:rounded-full 
            [&::-webkit-slider-thumb]:bg-red-500 
            [&::-webkit-slider-thumb]:border-0
            md:[&::-webkit-slider-thumb]:border-2 
            [&::-webkit-slider-thumb]:border-white 
            [&::-webkit-slider-thumb]:shadow-lg 
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-2.5 
            [&::-moz-range-thumb]:h-2.5 
            md:[&::-moz-range-thumb]:w-3 
            md:[&::-moz-range-thumb]:h-3 
            [&::-moz-range-thumb]:rounded-full 
            [&::-moz-range-thumb]:bg-red-500 
            [&::-moz-range-thumb]:border-0
            md:[&::-moz-range-thumb]:border-2 
            [&::-moz-range-thumb]:border-white 
            [&::-moz-range-thumb]:shadow-lg 
            [&::-moz-range-thumb]:cursor-pointer"
          style={{
            background: `linear-gradient(to right, rgb(220, 38, 38) ${progress}%, rgba(255, 255, 255, 0.2) ${progress}%)`
          }}
        />
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between gap-1 md:gap-2">
        {/* Left Controls */}
        <div className="flex items-center gap-3 md:gap-2">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-auto h-auto md:w-8 md:h-8 rounded md:rounded-lg md:bg-black/40 md:backdrop-blur-sm md:border md:border-white/30 
              text-white md:hover:bg-black/60 transition-all active:scale-95 active:bg-white/10 md:shadow-lg flex items-center justify-center p-1"
          >
            {isPlaying ? (
              <FaPause className="text-base md:text-sm drop-shadow-md" />
            ) : (
              <FaPlay className="text-base md:text-sm ml-0.5 drop-shadow-md" />
            )}
          </button>

          {/* Time Display */}
          <div className="md:px-2 md:py-1 md:rounded-lg md:bg-black/40 md:backdrop-blur-sm md:border md:border-white/20 md:shadow-lg">
            <span className="text-white text-[10px] md:text-xs font-semibold whitespace-nowrap drop-shadow-md">
              {currentTime} / {duration}
            </span>
          </div>

          {/* Volume - Desktop Only */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm border border-white/20 shadow-lg">
            <button
              onClick={toggleMute}
              className="text-white hover:text-red-400 transition-colors"
            >
              {isMuted || volume === 0 ? (
                <FaVolumeMute className="text-sm" />
              ) : (
                <FaVolumeUp className="text-sm" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer 
                [&::-webkit-slider-thumb]:appearance-none 
                [&::-webkit-slider-thumb]:w-3 
                [&::-webkit-slider-thumb]:h-3 
                [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:bg-red-500 
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-moz-range-thumb]:w-3 
                [&::-moz-range-thumb]:h-3 
                [&::-moz-range-thumb]:rounded-full 
                [&::-moz-range-thumb]:bg-red-500 
                [&::-moz-range-thumb]:cursor-pointer"
            />
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-4 md:gap-1.5">
          {/* Speed Control */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSpeedMenu(!showSpeedMenu);
                setShowQualityMenu(false);
              }}
              className={`md:px-2.5 md:py-1.5 rounded md:rounded-lg md:backdrop-blur-sm md:border font-semibold text-[10px] md:text-xs 
                transition-all active:scale-95 active:bg-white/10 md:shadow-lg flex items-center gap-1 px-1.5 py-0.5 ${
                showSpeedMenu
                  ? 'text-red-400 md:bg-red-600/60 md:border-red-400/60 md:text-white'
                  : 'text-white md:bg-black/40 md:border-white/30 md:hover:bg-black/60 md:hover:border-white/40'
              }`}
            >
              <FaTachometerAlt className="text-sm md:text-xs drop-shadow-md" />
              <span className="hidden sm:inline drop-shadow-md">{playbackSpeed}x</span>
            </button>

            {/* Speed Menu */}
            {showSpeedMenu && (
              <div className="absolute top-full right-0 mt-2 md:bottom-full md:mb-2 md:top-auto bg-black/95 backdrop-blur-xl border border-white/30 
                  rounded-lg md:rounded-xl shadow-2xl overflow-y-auto max-h-[60vh] min-w-[100px] md:min-w-[120px] z-50 animate-fadeIn origin-top-right md:origin-bottom-right">
                <div className="p-1 md:p-2">
                  <div className="text-[9px] md:text-xs font-bold text-red-400 px-1.5 md:px-3 py-1 md:py-2 border-b border-white/20 sticky top-0 bg-black/95">
                    Speed
                  </div>
                  <div>
                    {speedOptions.map((speed) => (
                      <button
                        key={speed}
                        onClick={() => changePlaybackSpeed(speed)}
                        className={`w-full px-1.5 md:px-3 py-1 md:py-2 text-left text-[9px] md:text-xs transition-all rounded md:rounded-lg my-0.5 active:bg-white/10 ${
                          playbackSpeed === speed
                            ? 'bg-red-600/40 border border-white/30 text-white font-semibold'
                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{speed === 1 ? 'Normal' : `${speed}x`}</span>
                          {playbackSpeed === speed && (
                            <FaCheckCircle className="text-[8px] md:text-xs text-red-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quality Control */}
          {availableQualities.length > 1 && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowQualityMenu(!showQualityMenu);
                  setShowSpeedMenu(false);
                }}
                className={`md:px-2.5 md:py-1.5 rounded md:rounded-lg md:backdrop-blur-sm md:border font-semibold text-[10px] md:text-xs 
                  transition-all active:scale-95 active:bg-white/10 md:shadow-lg flex items-center gap-1 px-1.5 py-0.5 ${
                  showQualityMenu
                    ? 'text-red-400 md:bg-red-600/60 md:border-red-400/60 md:text-white'
                    : 'text-white md:bg-black/40 md:border-white/30 md:hover:bg-black/60 md:hover:border-white/40'
                }`}
              >
                <FaHdd className="text-sm md:text-xs drop-shadow-md" />
                <span className="hidden sm:inline drop-shadow-md">
                  {availableQualities.find((q: VideoQuality) => q.value === currentQuality)?.label || 'Auto'}
                </span>
              </button>

              {/* Quality Menu */}
              {showQualityMenu && (
                <div className="absolute top-full right-0 mt-2 md:bottom-full md:mb-2 md:top-auto bg-black/95 backdrop-blur-xl border border-white/30 
                  rounded-lg md:rounded-xl shadow-2xl overflow-y-auto max-h-[60vh] min-w-[130px] md:min-w-[140px] z-50 animate-fadeIn origin-top-right md:origin-bottom-right">
                  <div className="p-1 md:p-2">
                    <div className="text-[9px] md:text-xs font-bold text-red-400 px-1.5 md:px-3 py-1 md:py-2 border-b border-white/20 sticky top-0 bg-black/95">
                      Quality
                    </div>
                    <div>
                      {availableQualities.map((quality: VideoQuality) => (
                        <button
                          key={quality.value}
                          onClick={() => changeVideoQuality(quality)}
                          className={`w-full px-1.5 md:px-3 py-1 md:py-2 text-left text-[9px] md:text-xs transition-all rounded md:rounded-lg my-0.5 active:bg-white/10 ${
                            currentQuality === quality.value
                              ? 'bg-red-600/40 border border-white/30 text-white font-semibold'
                              : 'text-gray-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold truncate">{quality.label}</div>
                              {quality.bitrate && (
                                <div className="text-[8px] md:text-[10px] text-gray-500 truncate">{quality.bitrate}</div>
                              )}
                            </div>
                            {currentQuality === quality.value && (
                              <FaCheckCircle className="text-[8px] md:text-xs text-red-400 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Volume - Mobile & Tablet Only */}
          <button
            onClick={toggleMute}
            className="lg:hidden text-white hover:text-red-400 transition-colors active:scale-95 active:text-white/80 p-1"
          >
            {isMuted || volume === 0 ? (
              <FaVolumeMute className="text-base md:text-sm drop-shadow-md" />
            ) : (
              <FaVolumeUp className="text-base md:text-sm drop-shadow-md" />
            )}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="w-auto h-auto md:w-8 md:h-8 rounded md:rounded-lg md:bg-black/40 md:backdrop-blur-sm md:border md:border-white/30 
              text-white md:hover:bg-black/60 transition-all active:scale-95 active:bg-white/10 md:shadow-lg flex items-center justify-center p-1"
          >
            {isFullscreen ? (
              <FaCompress className="text-base md:text-sm drop-shadow-md" />
            ) : (
              <FaExpand className="text-base md:text-sm drop-shadow-md" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
});
EnhancedVideoControls.displayName = 'EnhancedVideoControls';

// ============================================
// SIDEBAR COMPONENT
// ============================================

const Sidebar = memo(({
  lessonData,
  currentTime,
  duration,
  progress,
  playbackSpeed,
  watchTime,
  videoCurrentSeconds,
  videoDurationSeconds,
  handleMarkComplete,
  isMarkedComplete,
  isSavingProgress,
  router,
  onAskQuestion,
}: any) => {
  const watchedMinutes = Math.floor(watchTime / 60);
  const watchedSeconds = Math.floor(watchTime % 60);
  const totalMinutes = Math.floor(videoDurationSeconds / 60);
  const totalSeconds = Math.floor(videoDurationSeconds % 60);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Ask Question Card */}
      <div className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 backdrop-blur-xl animate-fadeIn" style={{ animationDelay: '200ms' }}>
        <div className="text-center">
          <FaQuestionCircle className="text-2xl sm:text-3xl text-red-500 mx-auto mb-1.5 sm:mb-2" />
          <h3 className="text-sm sm:text-base font-black text-white mb-1 sm:mb-1.5">Need Help?</h3>
          <p className="text-[10px] sm:text-xs text-gray-400 mb-2 sm:mb-3 px-2">
            Have questions? Ask the mentor!
          </p>
          <button 
            onClick={onAskQuestion}
            className="w-full py-2 sm:py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg text-white font-semibold text-[11px] sm:text-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <FaQuestionCircle className="text-[10px] sm:text-xs" />
            Ask a Question
          </button>
        </div>
      </div>
    </div>
  );
});
Sidebar.displayName = 'Sidebar';

// ============================================
// MEMOIZED COMPONENTS
// ============================================

const InfoItem = memo(({ 
  icon: Icon, 
  text 
}: { 
  icon: React.ElementType;
  text: string;
}) => (
  <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs text-gray-400">
    <Icon className="text-red-500 text-[10px] sm:text-xs" />
    <span>{text}</span>
  </div>
));
InfoItem.displayName = 'InfoItem';

const TabNavigation = memo(({ 
  activeTab, 
  onTabChange 
}: { 
  activeTab: string;
  onTabChange: (tab: any) => void;
}) => {
  const tabs = [
    { id: "resources", label: "Resources", icon: FaDownload },
    { id: "notes", label: "Notes", icon: FaComments },
  ];

  return (
    <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto scrollbar-hide pb-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-semibold text-[11px] sm:text-xs transition-all whitespace-nowrap active:scale-95 flex-shrink-0 border ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white border-transparent"
                : "bg-gray-900/50 border-red-500/30 text-gray-400 hover:text-white hover:bg-red-900/30"
            }`}
          >
            <Icon className="text-[10px] sm:text-xs" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
});
TabNavigation.displayName = 'TabNavigation';

const ResourcesTab = memo(({ resources }: { resources: Resource[] }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.2 }}
    className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 backdrop-blur-xl"
  >
    <h3 className="text-base sm:text-lg lg:text-xl font-black text-white mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
      <FaDownload className="text-red-500 text-sm sm:text-base" />
      Downloadable Resources
    </h3>
    <p className="text-[10px] sm:text-xs text-gray-400 mb-3 sm:mb-4">
      Download these resources to supplement your learning.
    </p>
    {resources.length > 0 ? (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {resources.map((resource, idx) => (
            <a
              key={idx}
              href={resource.url}
              className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-900/50 border border-red-500/30 rounded-lg hover:bg-red-900/30 hover:border-red-500/40 transition-all group hover:-translate-y-1 animate-slideIn"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                <FaDownload className="text-white text-xs sm:text-sm" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[11px] sm:text-xs font-bold text-white group-hover:text-red-400 transition-colors truncate mb-0.5">
                  {resource.name}
                </h4>
                <p className="text-[9px] sm:text-[10px] text-gray-500">
                  {resource.type} • {resource.size}
                </p>
              </div>
              <FaChevronRight className="text-gray-600 group-hover:text-red-400 transition-colors flex-shrink-0 text-[10px] sm:text-xs" />
            </a>
          ))}
        </div>

        <button className="w-full mt-3 sm:mt-4 py-2 sm:py-2.5 px-3 sm:px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] text-[11px] sm:text-xs">
          <FaDownload className="text-[10px] sm:text-xs" />
          <span>Download All Resources</span>
        </button>
      </>
    ) : (
      <div className="text-center py-6 sm:py-8">
        <FaDownload className="text-3xl sm:text-4xl text-gray-700 mx-auto mb-2 sm:mb-3" />
        <p className="text-gray-500 text-[10px] sm:text-xs">No resources available for this lesson yet.</p>
      </div>
    )}
  </motion.div>
));
ResourcesTab.displayName = 'ResourcesTab';

const TranscriptTab = memo(({ transcript }: { transcript: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.2 }}
    className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 backdrop-blur-xl"
  >
    <h3 className="text-base sm:text-lg lg:text-xl font-black text-white mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
      <FaBookOpen className="text-red-500 text-sm sm:text-base" />
      Transcript
    </h3>
    <div className="prose prose-invert max-w-none">
      <div className="text-[11px] sm:text-xs lg:text-sm text-gray-300 leading-relaxed whitespace-pre-line">
        {transcript || "Transcript coming soon..."}
      </div>
    </div>
  </motion.div>
));
TranscriptTab.displayName = 'TranscriptTab';

const NotesTab = memo(({
  notes,
  newNote,
  setNewNote,
  handleAddNote,
  handleDeleteNote,
}: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.2 }}
    className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 backdrop-blur-xl"
  >
    <h3 className="text-base sm:text-lg lg:text-xl font-black text-white mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
      <FaComments className="text-red-500 text-sm sm:text-base" />
      My Notes
    </h3>

    <div className="mb-3 sm:mb-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
          placeholder="Add a note at current timestamp..."
          className="flex-1 px-2.5 sm:px-3 py-2 sm:py-2.5 bg-gray-900/50 border border-red-500/30 rounded-lg text-white placeholder-gray-500 text-[11px] sm:text-xs focus:outline-none focus:border-red-500/50 transition-colors"
        />
        <button
          onClick={handleAddNote}
          disabled={!newNote.trim()}
          className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-bold rounded-lg text-[11px] sm:text-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Add Note
        </button>
      </div>
    </div>

    {notes.length > 0 ? (
      <div className="space-y-2 sm:space-y-3">
        {notes.map((note: Note, idx: number) => (
          <div
            key={note.id}
            className="p-2.5 sm:p-3 bg-gray-900/50 border border-red-500/30 rounded-lg group animate-slideIn"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-red-600/20 border border-red-500/30 rounded text-[9px] sm:text-[10px] font-bold text-red-400">
                {note.timestamp}
              </span>
              <button
                onClick={() => handleDeleteNote(note.id)}
                className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs sm:text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-300 mb-1">{note.content}</p>
            <p className="text-[9px] sm:text-[10px] text-gray-600">{note.createdAt}</p>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-6 sm:py-8">
        <FaComments className="text-3xl sm:text-4xl text-gray-700 mx-auto mb-2 sm:mb-3" />
        <p className="text-gray-500 text-[10px] sm:text-xs">No notes yet. Add your first note above!</p>
      </div>
    )}
  </motion.div>
));
NotesTab.displayName = 'NotesTab';

export default VideoPlayerPage;