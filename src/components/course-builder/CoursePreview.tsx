// components/course-builder/CoursePreview.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  FaBook,
  FaPlayCircle,
  FaClock,
  FaFile,
  FaDownload,
  FaCheckCircle,
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
  duration: string;
  resources: Resource[];
}

interface Module {
  id: string;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  learningOutcomes: string[];
  lessons: Lesson[];
}

interface CourseData {
  modules: Module[];
}

interface CoursePreviewProps {
  data: CourseData;
}

const CoursePreview: React.FC<CoursePreviewProps> = ({ data }) => {
  const difficultyColors = {
    Beginner: "bg-green-600/20 text-green-400 border-green-500/30",
    Intermediate: "bg-yellow-600/20 text-yellow-400 border-yellow-500/30",
    Advanced: "bg-red-600/20 text-red-400 border-red-500/30",
  };

  const totalLessons = data.modules.reduce(
    (acc, module) => acc + module.lessons.length,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Course <span className="text-red-500">Curriculum</span>
          </h1>
          <p className="text-gray-400 text-lg">
            {data.modules.length} Modules • {totalLessons} Lessons
          </p>
        </motion.div>

        {/* Modules */}
        {data.modules.length === 0 ? (
          <div className="text-center py-20">
            <FaBook className="mx-auto text-6xl text-gray-700 mb-4" />
            <p className="text-gray-500 text-xl">
              No modules created yet. Start building your course!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {data.modules.map((module, moduleIndex) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: moduleIndex * 0.1 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                
                <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 rounded-2xl border border-red-500/20 p-6 backdrop-blur-xl">
                  {/* Module Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/30 flex-shrink-0">
                        <span className="text-red-400 font-black text-lg">
                          {moduleIndex + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-2">
                          {module.title || "Untitled Module"}
                        </h3>
                        {module.description && (
                          <p className="text-gray-400 mb-3">
                            {module.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                              difficultyColors[module.difficulty]
                            }`}
                          >
                            {module.difficulty}
                          </span>
                          <span className="text-sm text-gray-500">
                            {module.lessons.length} Lessons
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Learning Outcomes */}
                  {module.learningOutcomes.length > 0 &&
                    module.learningOutcomes.some((o) => o.trim()) && (
                      <div className="mb-6 p-4 bg-gray-900/50 rounded-xl border border-red-500/10">
                        <h4 className="text-sm font-semibold text-gray-300 mb-3">
                          What You'll Learn:
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {module.learningOutcomes
                            .filter((o) => o.trim())
                            .map((outcome, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2 text-sm text-gray-400"
                              >
                                <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{outcome}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                  {/* Lessons */}
                  {module.lessons.length > 0 ? (
                    <div className="space-y-3">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div
                          key={lesson.id}
                          className="p-4 bg-gray-900/30 rounded-xl border border-red-500/10 hover:border-red-500/20 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600/10 border border-red-500/20 flex-shrink-0">
                              <FaPlayCircle className="text-red-500 text-sm" />
                            </div>
                                                        <div className="flex-1">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <h5 className="font-semibold text-white">
                                  {lessonIndex + 1}.{" "}
                                  {lesson.title || "Untitled Lesson"}
                                </h5>
                                {lesson.duration && (
                                  <span className="flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap">
                                    <FaClock />
                                    {lesson.duration}
                                  </span>
                                )}
                              </div>

                              {lesson.description && (
                                <p className="text-sm text-gray-400 mb-3">
                                  {lesson.description}
                                </p>
                              )}

                              {lesson.videoUrl && (
                                <div className="mb-3 p-2 bg-gray-900/50 rounded-lg border border-red-500/10">
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <FaPlayCircle className="text-red-500" />
                                    <span className="truncate">
                                      {lesson.videoUrl}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Resources */}
                              {lesson.resources.length > 0 && (
                                <div className="space-y-2">
                                  <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                                    <FaFile className="text-red-500" />
                                    Resources:
                                  </span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {lesson.resources.map((resource) => (
                                      <div
                                        key={resource.id}
                                        className="p-2 bg-gray-900/50 rounded-lg border border-red-500/10 hover:border-red-500/20 transition-all group/resource"
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm text-white truncate">
                                              {resource.title || "Untitled Resource"}
                                            </div>
                                            {resource.description && (
                                              <div className="text-xs text-gray-500 truncate">
                                                {resource.description}
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded uppercase">
                                              {resource.fileType}
                                            </span>
                                            <FaDownload className="text-red-500 text-xs opacity-0 group-hover/resource:opacity-100 transition-opacity" />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-600 bg-gray-900/30 rounded-xl border border-red-500/10">
                      <FaPlayCircle className="mx-auto text-3xl mb-2 opacity-30" />
                      <p className="text-sm">No lessons in this module yet</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursePreview;