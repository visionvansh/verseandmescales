"use client";

import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  FaPlay,
  FaPause,
  FaExpand,
  FaCompress,
  FaVolumeMute,
  FaVolumeUp,
  FaChevronLeft,
  FaChevronRight,
  FaDownload,
  FaClock,
  FaCheckCircle,
  FaArrowLeft,
  FaBookOpen,
  FaListUl,
  FaStar,
  FaShare,
  FaBookmark,
  FaRegBookmark,
  FaFire,
  FaLightbulb,
  FaQuestionCircle,
  FaComments,
  FaExclamationTriangle,
} from 'react-icons/fa';

// ✅ Import the new modal
import { VideoPlayerQuestionModal } from '@/components/courseinside/VideoPlayerQuestionModal';

// Types
interface Resource {
  name: string;
  type: string;
  size: string;
  url: string;
}

interface Note {
  id: string;
  timestamp: string;
  content: string;
  createdAt: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoUrl: string;
  isCompleted: boolean;
  progressPercent?: number;
  lastPosition?: number;
  watchTime?: number;
  resources: Resource[];
  transcript: string;
  keyTakeaways: string[];
  relatedLessons: { id: string; title: string }[];
  module: { id: string; title: string };
  course: { id: string; title: string };
}

// ============================================
// NOT ENROLLED PAGE COMPONENT
// ============================================

const NotEnrolledPage = memo(({ courseId }: { courseId: string }) => {
  const router = useRouter();
  
  return (
    <div className="relative w-full min-h-screen overflow-x-hidden mt-20">
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
              
              <div className="relative p-8 sm:p-12 md:p-16 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 sm:mb-8 rounded-full bg-gradient-to-br from-red-600/20 to-red-800/20 border-2 border-red-500/30 flex items-center justify-center"
                >
                  <FaExclamationTriangle className="text-4xl sm:text-5xl text-red-400" />
                </motion.div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                  You Are Not Enrolled
                </h2>
                <p className="text-base sm:text-lg text-gray-400 mb-8 max-w-md mx-auto">
                  You need to enroll in this course to access the learning materials and modules
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
                  <button
                    onClick={() => router.push(`/users/courses/${courseId}`)}
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:scale-105 transition-transform text-base"
                  >
                    View Course Details
                  </button>
                  <button
                    onClick={() => router.push('/users/courses')}
                    className="w-full sm:w-auto px-8 py-3 bg-gray-800/50 border border-gray-700 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors text-base"
                  >
                    Browse Courses
                  </button>
                </div>

                <div className="mt-8 pt-8 border-t border-red-500/20">
                  <button
                    onClick={() => router.back()}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
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

// ============================================
// SKELETON COMPONENTS
// ============================================

const Skeleton = memo(({ className = "", animate = true }: { className?: string; animate?: boolean }) => (
  <div 
    className={`bg-gray-800/50 rounded ${animate ? 'skeleton-pulse' : ''} ${className}`}
    style={{ minHeight: '1rem' }}
  />
));
Skeleton.displayName = 'Skeleton';

const VideoPlayerSkeleton = memo(() => (
  <div className="relative bg-black rounded-xl sm:rounded-2xl overflow-hidden mb-6 aspect-video">
    <div className="absolute inset-0 bg-gray-900/50 skeleton-pulse" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-800/50 skeleton-pulse" />
    </div>
  </div>
));
VideoPlayerSkeleton.displayName = 'VideoPlayerSkeleton';

const VideoInfoSkeleton = memo(() => (
  <div className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-gray-800/30 rounded-xl sm:rounded-2xl p-5 sm:p-6 backdrop-blur-xl mb-6">
    <div className="mb-4">
      <Skeleton className="h-8 sm:h-10 w-3/4 mb-3" />
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
  <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
    <Skeleton className="h-10 w-32 rounded-lg flex-shrink-0" />
    <Skeleton className="h-10 w-32 rounded-lg flex-shrink-0" />
    <Skeleton className="h-10 w-32 rounded-lg flex-shrink-0" />
  </div>
));
TabNavigationSkeleton.displayName = 'TabNavigationSkeleton';

const TabContentSkeleton = memo(() => (
  <div className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-gray-800/30 rounded-xl sm:rounded-2xl p-5 sm:p-6 backdrop-blur-xl">
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
  <div className="space-y-6">
    <div className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-gray-800/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
      <Skeleton className="h-5 w-40 mb-4" />
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 flex-1 rounded-lg" />
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
    <div className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-gray-800/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
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
      <section className="relative w-full py-4 sm:py-6 border-b border-red-500/20">
        <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32 rounded-lg" />
            <div className="flex items-center gap-2 sm:gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </div>
        </div>
      </section>

      <section className="relative w-full py-6 sm:py-8">
        <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
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
      @media (prefers-reduced-motion: reduce) {
        .skeleton-pulse {
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
  const videoRef = useRef<HTMLVideoElement>(null);

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
  const [activeTab, setActiveTab] = useState< "resources" | "transcript" | "notes">("resources");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [watchTime, setWatchTime] = useState(0);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [isMarkedComplete, setIsMarkedComplete] = useState(false);
  const [isRestoringPosition, setIsRestoringPosition] = useState(false); // ✅ NEW

  // ✅ ADD THESE NEW STATES
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [roomId, setRoomId] = useState<string>("");

  // ✅ ADD THIS STATE
  const [enrollmentStatus, setEnrollmentStatus] = useState<{
    checked: boolean;
    enrolled: boolean;
    isOwner: boolean;
    courseId: string | null;
  }>({
    checked: false,
    enrolled: false,
    isOwner: false,
    courseId: null,
  });

  const progressSaveInterval = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (lessonId) {
      fetchLessonDataUpdated();
    } else {
      setError("No lesson ID provided");
      setLoading(false);
    }
  }, [lessonId]);

  // ✅ MODIFIED: Don't redirect, just set state
  const checkEnrollmentAccess = useCallback(async (courseId: string) => {
    try {
      const response = await fetch(`/api/course/check-enrollment?courseId=${courseId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        setEnrollmentStatus({ 
          checked: true, 
          enrolled: false, 
          isOwner: false,
          courseId 
        });
        return false;
      }

      const data = await response.json();
      
      const hasAccess = data.enrolled || data.isOwner;
      setEnrollmentStatus({
        checked: true,
        enrolled: data.enrolled || false,
        isOwner: data.isOwner || false,
        courseId
      });

      return hasAccess;
    } catch (error) {
      console.error('Enrollment check failed:', error);
      setEnrollmentStatus({ 
        checked: true, 
        enrolled: false, 
        isOwner: false,
        courseId 
      });
      return false;
    }
  }, []);

  const fetchLessonDataUpdated = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/course/video?lessonId=${lessonId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch lesson data');
      }

      const data = await response.json();
      
      // ✅ MODIFIED: Check enrollment after getting lesson data
      if (data.course?.id) {
        const hasAccess = await checkEnrollmentAccess(data.course.id);
        if (!hasAccess) {
          setLoading(false);
          return; // Don't set lesson data
        }
      }
      
      setLessonData(data);
      
      // Set initial states from database
      if (data.watchTime > 0) {
        setWatchTime(data.watchTime);
      }
      if (data.progressPercent > 0) {
        setProgress(data.progressPercent);
      }
      setIsMarkedComplete(data.isCompleted);
      
    } catch (err) {
      console.error('Error fetching lesson:', err);
      setError('Failed to load lesson data');
    } finally {
      setLoading(false);
    }
  };

  // ✅ ADD THIS: Fetch room ID when lesson loads
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

  // ✅ ADD THIS: Handle question creation
  const handleQuestionCreated = (question: any) => {
    console.log('Question created:', question);
    // Optionally show success message or refresh questions
  };

  // Format time helper function
  const formatTime = useCallback((seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) {
      return "0:00";
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Save progress to database
  const saveProgress = useCallback(async (forceComplete = false) => {
    if (!lessonId || !lessonData?.module?.id || !lessonData?.course?.id) return;
    
    const currentProgress = Math.round(progress);
    const shouldMarkComplete = forceComplete || currentProgress >= 90;

    try {
      setIsSavingProgress(true);
      
      const response = await fetch('/api/course/lesson/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          moduleId: lessonData.module.id,
          courseId: lessonData.course.id,
          watchTime: Math.floor(watchTime),
          progressPercent: currentProgress,
          lastPosition: Math.floor(videoCurrentSeconds),
          isCompleted: shouldMarkComplete,
        }),
      });

      if (response.ok) {
        console.log('Progress saved:', {
          lastPosition: Math.floor(videoCurrentSeconds),
          progressPercent: currentProgress,
          watchTime: Math.floor(watchTime)
        }); // ✅ Debug log
        
        if (shouldMarkComplete) {
          setIsMarkedComplete(true);
        }
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setIsSavingProgress(false);
    }
  }, [lessonId, lessonData, progress, watchTime, videoCurrentSeconds]);

  // Auto-save progress every 10 seconds
  useEffect(() => {
    if (isPlaying && lessonId && lessonData) {
      progressSaveInterval.current = setInterval(() => {
        saveProgress(false);
      }, 10000);

      return () => {
        if (progressSaveInterval.current) {
          clearInterval(progressSaveInterval.current);
        }
      };
    }
  }, [isPlaying, lessonId, lessonData, saveProgress]);

  // ✅ IMPROVED: Save progress when leaving page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (lessonId && lessonData && videoCurrentSeconds > 0) {
        const data = JSON.stringify({
          lessonId,
          moduleId: lessonData.module.id,
          courseId: lessonData.course.id,
          watchTime: Math.floor(watchTime),
          progressPercent: Math.round(progress),
          lastPosition: Math.floor(videoCurrentSeconds),
          isCompleted: progress >= 90,
        });
        
        console.log('Saving on unload:', {
          lastPosition: Math.floor(videoCurrentSeconds),
          progressPercent: Math.round(progress)
        });
        
        navigator.sendBeacon(
          '/api/course/lesson/progress',
          new Blob([data], { type: 'application/json' })
        );
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && lessonId && lessonData && videoCurrentSeconds > 0) {
        console.log('Saving on visibility change');
        saveProgress(false);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Final save on component unmount
      if (lessonId && lessonData && videoCurrentSeconds > 0) {
        handleBeforeUnload();
      }
    };
  }, [lessonId, lessonData, progress, watchTime, videoCurrentSeconds, saveProgress]);

  // Manual mark as complete
  const handleMarkComplete = async () => {
    await saveProgress(true);
    
    setTimeout(() => {
      if (lessonData?.module?.id) {
        router.push(`/users/learning?moduleId=${lessonData.module.id}`);
      }
    }, 1000);
  };

  // Video Controls
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleProgressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    setProgress(newProgress);
    if (videoRef.current && videoDurationSeconds > 0) {
      const newTime = (videoDurationSeconds * newProgress) / 100;
      videoRef.current.currentTime = newTime;
      setVideoCurrentSeconds(newTime);
      setCurrentTime(formatTime(newTime));
    }
  }, [videoDurationSeconds, formatTime]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
      if (newMutedState) {
        setVolume(0);
      } else {
        setVolume(1);
        videoRef.current.volume = 1;
      }
    }
  }, [isMuted]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const changePlaybackSpeed = useCallback(() => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  }, [playbackSpeed]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.duration && !isNaN(video.duration)) {
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

    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration)) {
        const totalSeconds = video.duration;
        setVideoDurationSeconds(totalSeconds);
        setDuration(formatTime(totalSeconds));
        console.log('Video metadata loaded, duration:', totalSeconds);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(100);
      saveProgress(true);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    // Trigger metadata handler if video is already loaded
    if (video.readyState >= 1) {
      handleLoadedMetadata();
    }

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [formatTime, isPlaying, saveProgress]);

  // ✅ IMPROVED: Restore video position when lessonData loads
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !lessonData?.lastPosition || lessonData.lastPosition <= 0) return;

    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const restorePosition = () => {
      if (!mounted || !video) return;

      // Ensure video has duration loaded
      if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
        const savedPosition = lessonData.lastPosition || 0;
        
        // Only restore if position is valid and different from current
        if (savedPosition > 0 && savedPosition < video.duration && 
            Math.abs(video.currentTime - savedPosition) > 1) {
          
          console.log(`Restoring position to ${savedPosition}s`);
          setIsRestoringPosition(true);
          
          video.currentTime = savedPosition;
          setVideoCurrentSeconds(savedPosition);
          setCurrentTime(formatTime(savedPosition));
          
          // Update progress bar
          const progressPercent = (savedPosition / video.duration) * 100;
          setProgress(progressPercent);
          
          // Hide indicator after 2 seconds
          setTimeout(() => {
            if (mounted) {
              setIsRestoringPosition(false);
            }
          }, 2000);
        }
      } else {
        // Retry if duration not loaded yet
        timeoutId = setTimeout(restorePosition, 100);
      }
    };

    // Wait for metadata to be fully loaded
    const handleLoadedMetadata = () => {
      console.log('Video metadata loaded, restoring position');
      // Small delay to ensure everything is initialized
      timeoutId = setTimeout(restorePosition, 50);
    };

    // Check if metadata is already loaded
    if (video.readyState >= 1) {
      handleLoadedMetadata();
    } else {
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
    }

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [lessonData?.lastPosition, formatTime]);

  // Note handlers
  const handleAddNote = useCallback(() => {
    if (newNote.trim() && videoRef.current) {
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

  const handleTabChange = useCallback((tab:  "resources" | "transcript" | "notes") => {
    setActiveTab(tab);
  }, []);

  // ✅ ADD THIS: Show not enrolled page
  if (enrollmentStatus.checked && !enrollmentStatus.enrolled && !enrollmentStatus.isOwner && enrollmentStatus.courseId) {
    return <NotEnrolledPage courseId={enrollmentStatus.courseId} />;
  }

  // LOADING STATE
  if (loading) {
    return <LoadingSkeleton />;
  }

  // ERROR STATE
  if (error || !lessonData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="relative z-10 text-center max-w-md">
          <div className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-2xl p-8 backdrop-blur-xl">
            <FaExclamationTriangle className="text-red-500 text-6xl mx-auto mb-6" />
            <h1 className="text-white text-3xl font-black mb-4">{error || 'Lesson Not Found'}</h1>
            <p className="text-gray-400 mb-6">We couldn't load the lesson. Please try again.</p>
            <div className="flex gap-3">
              <button
                onClick={() => router.back()}
                className="flex-1 bg-gray-900/50 border border-red-500/30 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800/50 transition-colors"
              >
                <FaArrowLeft className="inline mr-2" />
                Go Back
              </button>
              <button
                onClick={fetchLessonDataUpdated}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
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
    <div className="relative w-full min-h-screen overflow-x-hidden mt-20">
      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <section className="relative w-full py-4 sm:py-6 border-b border-red-500/20">
          <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between">
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
                <FaArrowLeft className="text-sm sm:text-base" />
                <span className="text-sm sm:text-base font-semibold hidden sm:inline">Back to Lessons</span>
              </button>

              <div className="flex items-center gap-2 sm:gap-3">
                <ActionButton
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  icon={isBookmarked ? FaBookmark : FaRegBookmark}
                  isActive={isBookmarked}
                />
                <ActionButton icon={FaShare} />
              </div>
            </div>
          </div>
        </section>

        {/* Video Player Section */}
        <section className="relative w-full py-6 sm:py-8">
          <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Main Video Column */}
              <div className="lg:col-span-2">
                {/* Video Player */}
                <div className="relative bg-black rounded-xl sm:rounded-2xl overflow-hidden mb-6 group animate-fadeIn">
                  <video
                    ref={videoRef}
                    key={lessonData.videoUrl} // ✅ Force remount on video change
                    className="w-full aspect-video bg-black"
                    onClick={togglePlay}
                    preload="metadata"
                  >
                    <source src={lessonData.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>

                  {/* ✅ Position Restored Indicator */}
                  {isRestoringPosition && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600/90 backdrop-blur-sm px-4 py-2 rounded-lg z-50 animate-fadeIn">
                      <span className="text-white text-sm font-semibold flex items-center gap-2">
                        <FaClock />
                        Resumed from {currentTime}
                      </span>
                    </div>
                  )}

                  {/* Video Controls Overlay */}
                  <VideoControls
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
                  />
                </div>

                {/* Video Info */}
                <div className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-xl sm:rounded-2xl p-5 sm:p-6 backdrop-blur-xl mb-6 animate-fadeIn">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3">
                        {lessonData.title}
                      </h1>
                      <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                        {lessonData.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <InfoItem icon={FaClock} text={duration !== "0:00" ? duration : lessonData.duration} />
                    <InfoItem icon={FaDownload} text={`${lessonData.resources.length} Resources`} />
                    {isMarkedComplete && (
                      <div className="flex items-center gap-2 text-sm">
                        <FaCheckCircle className="text-green-500" />
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
              <div className="lg:col-span-1">
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
                  onAskQuestion={() => setIsQuestionModalOpen(true)} // ✅ ADD THIS
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ✅ ADD THIS: Question Modal */}
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

      {/* Animations */}
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

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
          
          .animate-fadeIn,
          .animate-slideIn {
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
// UPDATE SIDEBAR COMPONENT
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
  onAskQuestion, // ✅ ADD THIS PROP
}: any) => {
  const watchedMinutes = Math.floor(watchTime / 60);
  const watchedSeconds = Math.floor(watchTime % 60);
  const totalMinutes = Math.floor(videoDurationSeconds / 60);
  const totalSeconds = Math.floor(videoDurationSeconds % 60);

  return (
    <div className="space-y-6">
      {/* Navigation */}




      {/* ✅ UPDATE Help Section with Ask Question button */}
      <div className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 backdrop-blur-xl animate-fadeIn" style={{ animationDelay: '200ms' }}>
        <div className="text-center">
          <FaQuestionCircle className="text-4xl text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-black text-white mb-2">Need Help?</h3>
          <p className="text-sm text-gray-400 mb-4">
            Have questions about this lesson? Ask the mentor directly!
          </p>
          <button 
            onClick={onAskQuestion}
            className="w-full py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg text-white font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <FaQuestionCircle />
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

const ActionButton = memo(({ 
  onClick, 
  icon: Icon, 
  isActive = false 
}: { 
  onClick?: () => void;
  icon: React.ElementType;
  isActive?: boolean;
}) => (
  <button
    onClick={onClick}
    className="p-2 sm:p-2.5 rounded-lg bg-gray-900/50 border border-red-500/30 hover:bg-red-900/30 transition-all hover:scale-105 active:scale-95"
  >
    <Icon className={`text-sm sm:text-base ${isActive ? 'text-red-500' : 'text-gray-400'}`} />
  </button>
));
ActionButton.displayName = 'ActionButton';

const InfoItem = memo(({ 
  icon: Icon, 
  text 
}: { 
  icon: React.ElementType;
  text: string;
}) => (
  <div className="flex items-center gap-2 text-sm text-gray-400">
    <Icon className="text-red-500" />
    <span>{text}</span>
  </div>
));
InfoItem.displayName = 'InfoItem';

const VideoControls = memo(({
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
}: any) => (
  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
    <div className="absolute inset-0 flex items-center justify-center">
      <button
        onClick={togglePlay}
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 active:scale-90 transition-transform"
      >
        {isPlaying ? (
          <FaPause className="text-2xl sm:text-3xl text-white" />
        ) : (
          <FaPlay className="text-2xl sm:text-3xl text-white ml-1" />
        )}
      </button>
    </div>

    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
      <div className="mb-4">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleProgressChange}
          className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-600"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={togglePlay}
            className="text-white hover:text-red-400 transition-colors"
          >
            {isPlaying ? (
              <FaPause className="text-lg sm:text-xl" />
            ) : (
              <FaPlay className="text-lg sm:text-xl" />
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-white hover:text-red-400 transition-colors"
            >
              {isMuted || volume === 0 ? (
                <FaVolumeMute className="text-lg sm:text-xl" />
              ) : (
                <FaVolumeUp className="text-lg sm:text-xl" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-16 sm:w-20 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
          </div>

          <div className="text-white text-sm font-medium">
            {currentTime} / {duration}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={changePlaybackSpeed}
            className="px-2 sm:px-3 py-1 bg-gray-800/80 hover:bg-gray-700/80 rounded text-white text-xs sm:text-sm font-semibold transition-colors"
          >
            {playbackSpeed}x
          </button>

          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-red-400 transition-colors"
          >
            {isFullscreen ? (
              <FaCompress className="text-lg sm:text-xl" />
            ) : (
              <FaExpand className="text-lg sm:text-xl" />
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
));
VideoControls.displayName = 'VideoControls';

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
    <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all whitespace-nowrap active:scale-95 ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white"
                : "bg-gray-900/50 border border-red-500/30 text-gray-400 hover:text-white hover:bg-red-900/30"
            }`}
          >
            <Icon className="text-xs sm:text-sm" />
            <span className="hidden sm:inline">{tab.label}</span>
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
    className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-xl sm:rounded-2xl p-5 sm:p-6 backdrop-blur-xl"
  >
    <h3 className="text-xl sm:text-2xl font-black text-white mb-4 flex items-center gap-2">
      <FaDownload className="text-red-500" />
      Downloadable Resources
    </h3>
    <p className="text-sm text-gray-400 mb-6">
      Download these valuable resources to supplement your learning and put the lessons into practice.
    </p>
    {resources.length > 0 ? (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {resources.map((resource, idx) => (
            <a
              key={idx}
              href={resource.url}
              className="flex items-center gap-4 p-4 bg-gray-900/50 border border-red-500/20 rounded-lg hover:bg-red-900/30 hover:border-red-500/40 transition-all group hover:-translate-y-1 animate-slideIn"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                <FaDownload className="text-white text-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors truncate mb-1">
                  {resource.name}
                </h4>
                <p className="text-xs text-gray-500">
                  {resource.type} • {resource.size}
                </p>
              </div>
              <FaChevronRight className="text-gray-600 group-hover:text-red-400 transition-colors flex-shrink-0" />
            </a>
          ))}
        </div>

        <button className="w-full mt-6 py-3 px-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
          <FaDownload />
          <span>Download All Resources</span>
        </button>
      </>
    ) : (
      <div className="text-center py-12">
        <FaDownload className="text-5xl text-gray-700 mx-auto mb-4" />
        <p className="text-gray-500">No resources available for this lesson yet.</p>
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
    className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-xl sm:rounded-2xl p-5 sm:p-6 backdrop-blur-xl"
  >
    <h3 className="text-xl sm:text-2xl font-black text-white mb-4 flex items-center gap-2">
      <FaBookOpen className="text-red-500" />
      Transcript
    </h3>
    <div className="prose prose-invert max-w-none">
      <div className="text-sm sm:text-base text-gray-300 leading-relaxed whitespace-pre-line">
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
    className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-xl sm:rounded-2xl p-5 sm:p-6 backdrop-blur-xl"
  >
    <h3 className="text-xl sm:text-2xl font-black text-white mb-4 flex items-center gap-2">
      <FaComments className="text-red-500" />
      My Notes
    </h3>

    <div className="mb-6">
      <div className="flex gap-2">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
          placeholder="Add a note at current timestamp..."
          className="flex-1 px-4 py-3 bg-gray-900/50 border border-red-500/20 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-red-500/50 transition-colors"
        />
        <button
          onClick={handleAddNote}
          disabled={!newNote.trim()}
          className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-bold rounded-lg text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Add
        </button>
      </div>
    </div>

    {notes.length > 0 ? (
      <div className="space-y-3">
        {notes.map((note: Note, idx: number) => (
          <div
            key={note.id}
            className="p-4 bg-gray-900/50 border border-red-500/20 rounded-lg group animate-slideIn"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className="px-2.5 py-1 bg-red-600/20 border border-red-500/30 rounded text-xs font-bold text-red-400">
                {note.timestamp}
              </span>
              <button
                onClick={() => handleDeleteNote(note.id)}
                className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-300 mb-2">{note.content}</p>
            <p className="text-xs text-gray-600">{note.createdAt}</p>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-12">
        <FaComments className="text-5xl text-gray-700 mx-auto mb-4" />
        <p className="text-gray-500">No notes yet. Add your first note above!</p>
      </div>
    )}
  </motion.div>
));
NotesTab.displayName = 'NotesTab';

export default VideoPlayerPage;
