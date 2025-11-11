// app/users/management/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaRocket,
  FaBook,
  FaStar,
  FaUsers,
  FaClock,
  FaCheckCircle,
  FaSpinner,
  FaHourglassHalf,
  FaChevronRight,
} from "react-icons/fa";

interface Course {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  price?: string;
  salePrice?: string;
  status: "DRAFT" | "PENDING" | "PUBLISHED" | "ARCHIVED";
  isPublished: boolean;
  publishedAt?: string;
  submittedAt?: string;
  completionPercentage: number;
  lastEditedSection?: string;
  homepageType?: string; // ✅ ADDED
  customHomepageFile?: string; // ✅ ADDED
  homepage?: {
    mainTitleLine1: string;
    videoUrl: string;
    courseStats?: {
      activeStudents: number;
      courseRating: number;
    };
  };
  _count?: {
    modules: number;
  };
  createdAt: string;
  updatedAt: string;
}

const CoursesManagementSkeleton = () => {
  return (
    <div className="container mx-auto px-3 xs:px-4 sm:px-6 py-4 xs:py-5 sm:py-6">
      <div className="mb-6">
        <div className="relative mb-6">
          <div className="h-16 sm:h-20 md:h-24 w-full max-w-md bg-gradient-to-r from-gray-900/50 via-gray-800/50 to-gray-900/50 rounded-2xl animate-pulse" />
        </div>
        <div className="flex gap-2 flex-wrap mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-10 w-20 bg-gray-900/50 rounded-lg animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="relative">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/20">
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className="h-6 w-24 bg-gray-800/40 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 80}ms` }}
                  />
                  <div className="h-4 w-16 bg-gray-800/40 rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-6 bg-gray-800/40 rounded-lg animate-pulse" />
                  <div className="h-6 bg-gray-800/40 rounded-lg w-2/3 animate-pulse" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-4 w-20 bg-gray-800/30 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-gray-800/30 rounded animate-pulse" />
                  <div className="h-4 w-12 bg-gray-800/30 rounded animate-pulse" />
                </div>
                <div className="h-3 w-32 bg-gray-800/30 rounded animate-pulse" />
                <div className="flex items-center gap-2 pt-2">
                  <div className="flex-1 h-10 bg-gray-800/40 rounded-lg animate-pulse" />
                  <div className="flex-1 h-10 bg-gray-800/40 rounded-lg animate-pulse" />
                  <div className="h-10 w-10 bg-gray-800/40 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CoursesManagementPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "DRAFT" | "PENDING" | "PUBLISHED">("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);
  const [continuingId, setContinuingId] = useState<string | null>(null); // ✅ ADDED

  useEffect(() => {
    loadCourses();
    
    if (searchParams.get('submitted') === 'true') {
      setShowSubmitSuccess(true);
      setTimeout(() => setShowSubmitSuccess(false), 5000);
      
      const url = new URL(window.location.href);
      url.searchParams.delete('submitted');
      window.history.replaceState({}, '', url.toString());
    }
  }, [filter]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const url = filter === "ALL" 
        ? "/api/course" 
        : `/api/course?status=${filter}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const createNewCourse = async () => {
    try {
      const response = await fetch("/api/course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Course" }),
      });

      if (response.ok) {
        const course = await response.json();
        // Start with card customization
        router.push(`/users/card-customisation?courseId=${course.id}`);
      }
    } catch (error) {
      console.error("Error creating course:", error);
    }
  };

  const togglePublishStatus = async (courseId: string, currentStatus: string) => {
    try {
      setPublishingId(courseId);
      const newStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
      
      const response = await fetch("/api/course", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, status: newStatus }),
      });

      if (response.ok) {
        loadCourses();
      }
    } catch (error) {
      console.error("Error updating course:", error);
    } finally {
      setPublishingId(null);
    }
  };

  const deleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      setDeletingId(courseId);
      const response = await fetch(`/api/course?id=${courseId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCourses(courses.filter(c => c.id !== courseId));
      }
    } catch (error) {
      console.error("Error deleting course:", error);
    } finally {
      setDeletingId(null);
    }
  };

  // ✅ UPDATED: Continue editing with API check
  const continueEditing = async (course: Course) => {
    try {
      setContinuingId(course.id);
      
      // Fetch full course details to check homepageType
      const response = await fetch(`/api/course?id=${course.id}`);
      
      if (response.ok) {
        const courseData = await response.json();
        
        // Check if course was created with a pre-made theme (custom homepage)
        if (courseData.homepageType === 'custom' && courseData.customHomepageFile) {
          // Redirect to studio card customization for custom-themed courses
          router.push(`/users/studio/card-customisation?courseId=${course.id}`);
        } else {
          // Normal course - redirect to regular card customization
          router.push(`/users/card-customisation?courseId=${course.id}`);
        }
      } else {
        // Fallback if API fails - assume normal course
        router.push(`/users/card-customisation?courseId=${course.id}`);
      }
    } catch (error) {
      console.error("Error determining course type:", error);
      // Fallback to regular card customization on error
      router.push(`/users/card-customisation?courseId=${course.id}`);
    } finally {
      setContinuingId(null);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return {
          icon: FaCheckCircle,
          color: "green",
          bgColor: "bg-green-500/20",
          textColor: "text-green-400",
          borderColor: "border-green-500/30",
          label: "Published",
        };
      case "PENDING":
        return {
          icon: FaHourglassHalf,
          color: "blue",
          bgColor: "bg-blue-500/20",
          textColor: "text-blue-400",
          borderColor: "border-blue-500/30",
          label: "Under Review",
        };
      case "DRAFT":
        return {
          icon: FaClock,
          color: "yellow",
          bgColor: "bg-yellow-500/20",
          textColor: "text-yellow-400",
          borderColor: "border-yellow-500/30",
          label: "Draft",
        };
      default:
        return {
          icon: FaClock,
          color: "gray",
          bgColor: "bg-gray-500/20",
          textColor: "text-gray-400",
          borderColor: "border-gray-500/30",
          label: status,
        };
    }
  };

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative z-10 mt-20">
        {loading ? (
          <CoursesManagementSkeleton />
        ) : (
          <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6 sm:py-8 md:py-10 lg:py-12">
            <div className="max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
              
              {showSubmitSuccess && (
                <m.div
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  className="fixed top-6 right-6 z-50 max-w-md"
                >
                  <div className="bg-gradient-to-br from-green-900/90 to-black/95 rounded-xl border border-green-500/30 backdrop-blur-2xl p-4 shadow-2xl">
                    <div className="flex items-start gap-3">
                      <FaCheckCircle className="text-green-500 text-2xl flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-white font-bold mb-1">
                          Course Submitted Successfully!
                        </h3>
                        <p className="text-green-300/80 text-sm">
                          Your course is now under review. You'll be notified once it's approved.
                        </p>
                      </div>
                    </div>
                  </div>
                </m.div>
              )}

              <m.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 sm:mb-10 md:mb-12"
              >
                <div className="relative mb-6 sm:mb-8">
                  <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                  >
                    <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-black tracking-tight">
                      <span className="inline-block text-white">My</span>
                      <span className="inline-block text-red-600 ml-3 sm:ml-4 md:ml-6">Courses</span>
                    </h1>
                    <m.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      className="h-1 sm:h-1.5 bg-gradient-to-r from-red-600 to-transparent mt-2 sm:mt-3 rounded-full"
                    />
                  </m.div>
                </div>

                <m.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-hide"
                >
                  {["ALL", "DRAFT", "PENDING", "PUBLISHED"].map((status, index) => {
                    const isSelected = filter === status;
                    
                    return (
                      <m.button
                        key={status}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.05 }}
                        onClick={() => setFilter(status as any)}
                        className={`
                          px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm md:text-base whitespace-nowrap transition-all duration-200 flex-shrink-0
                          ${isSelected 
                            ? 'bg-red-600 text-white' 
                            : 'bg-gray-900/80 text-gray-400 hover:bg-gray-800 hover:text-white border border-red-500/10 hover:border-red-500/30'
                          }
                        `}
                      >
                        {status}
                      </m.button>
                    );
                  })}
                </m.div>
              </m.div>

              {courses.length === 0 ? (
                <m.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 sm:py-16 md:py-20 px-4"
                >
                  <FaBook className="text-gray-600 text-4xl sm:text-5xl md:text-6xl mx-auto mb-4 sm:mb-6" />
                  <h2 className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
                    No Courses Yet
                  </h2>
                  <p className="text-gray-400 text-base sm:text-lg mb-6">
                    Create your first course to get started
                  </p>
                  <m.button
                    onClick={createNewCourse}
                    className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-3 rounded-lg font-bold hover:scale-105 transition-transform text-sm flex items-center gap-2 mx-auto"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaPlus className="text-sm" />
                    <span>Create Course</span>
                  </m.button>
                </m.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                  {courses.map((course, index) => {
                    const statusConfig = getStatusConfig(course.status);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <m.div
                        key={course.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className="group cursor-pointer"
                      >
                        <div className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/20 rounded-xl overflow-hidden hover:border-red-500/40 transition-all duration-300 hover:-translate-y-1">
                          
                          {/* Thumbnail */}
                          {course.thumbnail ? (
                            <div className="relative w-full aspect-video overflow-hidden bg-gray-800">
                              <img 
                                src={course.thumbnail} 
                                alt={course.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="relative w-full aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                              <FaBook className="text-gray-600 text-4xl" />
                            </div>
                          )}

                          <div className="p-4 sm:p-5 md:p-6">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                              <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}>
                                <StatusIcon className="text-xs" />
                                {statusConfig.label}
                              </span>
                              
                              {course.completionPercentage > 0 && (
                                <span className="text-xs text-gray-400">
                                  {course.completionPercentage}% Complete
                                </span>
                              )}
                            </div>

                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 line-clamp-2 group-hover:text-red-500 transition-colors">
                              {course.title}
                            </h3>

                            {course.description && (
                              <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                                {course.description}
                              </p>
                            )}

                            {course.price && (
                              <div className="flex items-center gap-2 mb-3">
                                {course.salePrice ? (
                                  <>
                                    <span className="text-lg font-bold text-red-400">
                                      ${course.salePrice}
                                    </span>
                                    <span className="text-sm text-gray-500 line-through">
                                      ${course.price}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-lg font-bold text-red-400">
                                    ${course.price}
                                  </span>
                                )}
                              </div>
                            )}

                            {course.status === "PENDING" && course.submittedAt && (
                              <p className="text-xs text-blue-400 mb-2 sm:mb-3">
                                Submitted {new Date(course.submittedAt).toLocaleDateString()}
                              </p>
                            )}

                            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">
                              <div className="flex items-center gap-1 sm:gap-1.5">
                                <FaBook className="text-red-400 flex-shrink-0" />
                                <span className="truncate">{course._count?.modules || 0} Modules</span>
                              </div>
                              {course.homepage?.courseStats && (
                                <>
                                  <div className="flex items-center gap-1 sm:gap-1.5">
                                    <FaUsers className="text-red-400 flex-shrink-0" />
                                    <span>{course.homepage.courseStats.activeStudents}</span>
                                  </div>
                                  <div className="flex items-center gap-1 sm:gap-1.5">
                                    <FaStar className="text-yellow-500 flex-shrink-0" />
                                    <span>{course.homepage.courseStats.courseRating}</span>
                                  </div>
                                </>
                              )}
                            </div>

                            {course.lastEditedSection && (
                              <p className="text-xs text-gray-500 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-red-500/10">
                                Last edited: {course.lastEditedSection === "card" ? "Card" : course.lastEditedSection === "homepage" ? "Homepage" : "Modules"}
                              </p>
                            )}

                            <div className="flex items-center gap-2">
                              {/* ✅ UPDATED: Continue button with loading state */}
                              <m.button
                                onClick={() => continueEditing(course)}
                                disabled={continuingId === course.id}
                                className="flex-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm text-red-400 flex items-center justify-center gap-1.5 sm:gap-2 transition-colors disabled:opacity-50"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                {continuingId === course.id ? (
                                  <>
                                    <FaSpinner className="text-xs animate-spin" />
                                    <span>Loading...</span>
                                  </>
                                ) : (
                                  <>
                                    <FaEdit className="text-xs" />
                                    <span>Continue</span>
                                    <FaChevronRight className="text-[10px]" />
                                  </>
                                )}
                              </m.button>

                              {(course.status === "DRAFT" || course.status === "PUBLISHED") && (
                                <m.button
                                  onClick={() => togglePublishStatus(course.id, course.status)}
                                  disabled={publishingId === course.id}
                                  className={`flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-colors ${
                                    course.status === "PUBLISHED"
                                      ? "bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 text-yellow-400"
                                      : "bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400"
                                  }`}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  {publishingId === course.id ? (
                                    <FaSpinner className="animate-spin text-xs" />
                                  ) : course.status === "PUBLISHED" ? (
                                    <>
                                      <FaClock className="text-xs" />
                                      <span>Unpublish</span>
                                    </>
                                  ) : (
                                    <>
                                      <FaRocket className="text-xs" />
                                      <span>Publish</span>
                                    </>
                                  )}
                                </m.button>
                              )}

                              <m.button
                                onClick={() => deleteCourse(course.id)}
                                disabled={deletingId === course.id}
                                className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm text-red-400 flex items-center justify-center transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                {deletingId === course.id ? (
                                  <FaSpinner className="animate-spin text-xs" />
                                ) : (
                                  <FaTrash className="text-xs" />
                                )}
                              </m.button>
                            </div>
                          </div>
                        </div>
                      </m.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </LazyMotion>
  );
};

export default CoursesManagementPage;