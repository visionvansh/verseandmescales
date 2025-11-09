// app/users/course-builder/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import {
  FaCheckCircle,
  FaSpinner,
  FaChevronLeft,
  FaBook,
  FaPaperPlane,
  FaSave,
} from "react-icons/fa";
import { useRouter } from "next/navigation";

import ModulesList from "@/components/course-builder/ModulesList";
import ModuleEditor from "@/components/course-builder/ModulesEditor";
import SubmissionReviewModal from "@/components/course-builder/SubmissionReviewModal";

interface Module {
  id: string;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  learningOutcomes: string[];
  lessons: Lesson[];
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

interface Resource {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
}

interface CourseData {
  id?: string;
  courseId?: string;
  modules: Module[];
}

// Optimized Skeleton Loader Component
const CourseBuilderSkeleton = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
      {/* Sidebar Skeleton */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
        <div className="relative p-5 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-gray-800/40 rounded-lg animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
        <div className="relative p-6 space-y-4">
          <div className="h-8 bg-gray-800/40 rounded-lg animate-pulse w-1/3" />
          <div className="h-4 bg-gray-800/40 rounded-lg animate-pulse w-2/3" />
          <div className="space-y-3 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 bg-gray-800/40 rounded-lg animate-pulse"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const CourseBuilder = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [showMobileEditor, setShowMobileEditor] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [homepageData, setHomepageData] = useState<any>(null);
  const [courseData, setCourseData] = useState<CourseData>({
    modules: [],
  });
  const [courseId, setCourseId] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('courseId');
    
    if (!id) {
      router.push('/users/courses-management');
      return;
    }
    
    setCourseId(id);
    loadData(id);
  }, []);

  const loadData = async (courseId: string) => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadCourseData(courseId),
        loadHomepageData(courseId)
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCourseData = async (courseId: string) => {
    try {
      const response = await fetch(`/api/course/coursemaker?courseId=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        if (data?.modules?.length > 0) {
          setCourseData({
            ...data,
            courseId,
          });
          setSelectedModuleId(data.modules[0].id);
          setHasUnsavedChanges(false);
        }
      }
    } catch (error) {
      console.error("Error loading course:", error);
    }
  };

  const loadHomepageData = async (courseId: string) => {
    try {
      const response = await fetch(`/api/course/homepage?courseId=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setHomepageData(data);
      }
    } catch (error) {
      console.error("Error loading homepage:", error);
    }
  };

  const saveCourse = async () => {
    if (!courseId) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const response = await fetch("/api/course/coursemaker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...courseData,
          courseId,
        }),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setHasUnsavedChanges(false);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const error = await response.json();
        console.error("Save failed:", error);
        alert(`Failed to save: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error saving course:", error);
      alert('Failed to save course. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (hasUnsavedChanges) {
      await saveCourse();
    }
    setShowSubmissionModal(true);
  };

  const handleSubmissionSuccess = () => {
    router.push('/users/courses-management?submitted=true');
  };

  const updateModules = (modules: Module[]) => {
    setCourseData((prev) => ({
      ...prev,
      modules,
    }));
    setHasUnsavedChanges(true);
  };

  const handleSelectModule = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    if (window.innerWidth < 1024) {
      setShowMobileEditor(true);
    }
  };

  const selectedModule = courseData.modules.find(
    (m) => m.id === selectedModuleId
  );

  return (
    <LazyMotion features={domAnimation}>
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
          scroll-behavior: smooth;
        }
      `}</style>

      {/* Main Content with mt-20 */}
      <div className="relative z-10 min-h-screen mt-20">
        <div className="container mx-auto px-3 xs:px-4 sm:px-6 py-4 xs:py-5 sm:py-6">
          {/* Header Card */}
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
                    onClick={() => router.push(`/users/homepage-builder?courseId=${courseId}`)}
                    className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-colors border border-red-500/20 hover:border-red-500/40"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaChevronLeft className="text-red-400 text-sm" />
                  </m.button>

                  <div className="bg-gradient-to-br from-red-600/20 to-red-700/20 rounded-xl flex items-center justify-center border border-red-500/30 w-12 h-12 sm:w-14 sm:h-14">
                    <FaBook className="text-red-500 text-xl sm:text-2xl" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                      Course Builder
                    </h1>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-gray-400 text-xs sm:text-sm">
                        Create and manage your course modules
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
                    onClick={saveCourse}
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
                    onClick={handleSubmit}
                    className="bg-gradient-to-r from-red-600 to-red-700 px-4 sm:px-6 py-2 rounded-lg font-bold hover:scale-105 transition-transform text-sm flex items-center gap-2 whitespace-nowrap"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaPaperPlane className="text-sm" />
                    <span className="hidden xs:inline">Submit Course</span>
                    <span className="xs:hidden">Submit</span>
                  </m.button>
                </div>
              </div>
            </div>
          </m.div>

          {/* Main Content Area */}
          {isLoading ? (
            <CourseBuilderSkeleton />
          ) : (
            <div className="relative">
              {/* Desktop Layout */}
              <div className="hidden lg:block">
                <div className="grid grid-cols-[320px_1fr] gap-6">
                  <m.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                  >
                    <div className="sticky top-6">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
                      <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-2xl" />
                      
                      <div className="relative max-h-[calc(100vh-140px)] overflow-y-auto rounded-2xl hide-scrollbar">
                        <ModulesList
                          modules={courseData.modules}
                          selectedModuleId={selectedModuleId}
                          onSelectModule={handleSelectModule}
                          onUpdateModules={updateModules}
                        />
                      </div>
                    </div>
                  </m.div>

                  <m.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-2xl" />
                    
                    <div className="relative max-h-[calc(100vh-140px)] overflow-y-auto rounded-2xl hide-scrollbar">
                      <AnimatePresence mode="wait">
                        {selectedModule ? (
                          <motion.div
                            key={selectedModule.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                          >
                            <ModuleEditor
                              module={selectedModule}
                              onUpdate={(updatedModule) => {
                                updateModules(
                                  courseData.modules.map((m) =>
                                    m.id === updatedModule.id ? updatedModule : m
                                  )
                                );
                              }}
                            />
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-full flex items-center justify-center p-12"
                          >
                            <div className="text-center">
                              <div className="bg-gradient-to-br from-red-600/20 to-red-700/20 rounded-2xl flex items-center justify-center border border-red-500/30 w-20 h-20 mx-auto mb-6">
                                <FaBook className="text-red-500 text-4xl" />
                              </div>
                              <h3 className="text-xl font-bold text-white mb-2">
                                No Module Selected
                              </h3>
                              <p className="text-gray-400 text-sm">
                                Select or create a module to get started
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </m.div>
                </div>
              </div>

              {/* Mobile/Tablet Layout */}
              <div className="lg:hidden">
                <AnimatePresence mode="wait">
                  {!showMobileEditor ? (
                    <m.div
                      key="modules-list"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
                      <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-2xl" />
                      
                      <div className="relative max-h-[calc(100vh-200px)] overflow-y-auto rounded-2xl hide-scrollbar">
                        <ModulesList
                          modules={courseData.modules}
                          selectedModuleId={selectedModuleId}
                          onSelectModule={handleSelectModule}
                          onUpdateModules={updateModules}
                        />
                      </div>
                    </m.div>
                  ) : (
                    <m.div
                      key="module-editor"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
                      <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-2xl" />
                      
                      <div className="relative max-h-[calc(100vh-200px)] overflow-y-auto rounded-2xl hide-scrollbar">
                        {selectedModule ? (
                          <>
                            <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-red-500/30 p-4">
                              <m.button
                                onClick={() => setShowMobileEditor(false)}
                                className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-red-600/10"
                                whileTap={{ scale: 0.95 }}
                              >
                                <FaChevronLeft className="text-sm" />
                                <span className="font-medium text-sm">Back to Modules</span>
                              </m.button>
                              
                              <h2 className="text-base font-bold text-white mt-3 truncate">
                                {selectedModule.title}
                              </h2>
                            </div>

                            <div className="p-4 sm:p-6">
                              <ModuleEditor
                                module={selectedModule}
                                onUpdate={(updatedModule) => {
                                  updateModules(
                                    courseData.modules.map((m) =>
                                      m.id === updatedModule.id ? updatedModule : m
                                    )
                                  );
                                }}
                                isMobile
                              />
                            </div>
                          </>
                        ) : null}
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>

      <SubmissionReviewModal
        isOpen={showSubmissionModal}
        onClose={() => setShowSubmissionModal(false)}
        courseId={courseId || ''}
        homepageData={homepageData}
        moduleData={courseData}
        onSubmitSuccess={handleSubmissionSuccess}
      />
    </LazyMotion>
  );
};

export default CourseBuilder;