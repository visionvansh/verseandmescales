// components/course-builder/LessonsListNew.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlus,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
  FaPlayCircle,
  FaGripVertical,
  FaEllipsisV,
} from "react-icons/fa";

import LessonDetail from "./LessonDetail";

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

interface LessonsListNewProps {
  lessons: Lesson[];
  onUpdate: (lessons: Lesson[]) => void;
}

const LessonsListNew: React.FC<LessonsListNewProps> = ({ lessons, onUpdate }) => {
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const addLesson = () => {
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: "New Lesson",
      description: "",
      videoUrl: "",
      videoDuration: "",
      videoSize: "",
      resources: [],
    };
    const updated = [...lessons, newLesson];
    onUpdate(updated);
    setExpandedLessonId(newLesson.id);
  };

  const updateLesson = (id: string, updates: Partial<Lesson>) => {
    onUpdate(
      lessons.map((lesson) =>
        lesson.id === id ? { ...lesson, ...updates } : lesson
      )
    );
  };

  const deleteLesson = (id: string) => {
    onUpdate(lessons.filter((lesson) => lesson.id !== id));
    if (expandedLessonId === id) {
      setExpandedLessonId(null);
    }
  };

  const duplicateLesson = (lesson: Lesson) => {
    const newLesson: Lesson = {
      ...lesson,
      id: `lesson-${Date.now()}`,
      title: `${lesson.title} (Copy)`,
    };
    onUpdate([...lessons, newLesson]);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base xs:text-lg font-bold text-white flex items-center gap-2">
          <FaPlayCircle className="text-red-500 text-sm xs:text-base" />
          <span>Lessons</span>
          <span className="text-xs xs:text-sm text-gray-400 font-normal">
            ({lessons.length})
          </span>
        </h3>
        <button
          onClick={addLesson}
          className="flex items-center gap-1.5 px-2.5 xs:px-3 py-1.5 xs:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-xs transition-all hover:scale-105"
        >
          <FaPlus className="text-xs" />
          <span className="hidden xs:inline">Add Lesson</span>
          <span className="xs:hidden">Add</span>
        </button>
      </div>

      {/* Lessons List */}
      {lessons.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 px-3 bg-gray-800/30 rounded-lg border border-red-500/10"
        >
          <FaPlayCircle className="mx-auto text-4xl text-gray-700 mb-3" />
          <p className="text-gray-500 text-sm font-medium">
            No lessons yet
          </p>
          <p className="text-gray-600 text-xs mt-1">
            Click "Add Lesson" to create your first lesson
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {lessons.map((lesson, index) => {
              const isExpanded = expandedLessonId === lesson.id;

              return (
                <motion.div
                  key={lesson.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`border rounded-lg lg:rounded-xl backdrop-blur-sm overflow-hidden transition-all duration-200 ${
                    isExpanded
                      ? "bg-red-600/10 border-red-500/40 shadow-lg shadow-red-600/10"
                      : "bg-gray-800/30 border-red-500/10 hover:bg-gray-800/50 hover:border-red-500/30"
                  }`}
                >
                  {/* Lesson Header */}
                  <div
                    onClick={() =>
                      setExpandedLessonId(isExpanded ? null : lesson.id)
                    }
                    className="p-3 xs:p-4 cursor-pointer flex items-start gap-3 group"
                  >
                    {/* Drag Handle */}
                    <div className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <FaGripVertical
                        className={`text-xs ${isExpanded ? "text-red-500" : "text-gray-600"}`}
                      />
                    </div>

                    {/* Lesson Number */}
                    <div className={`flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 rounded-lg flex-shrink-0 ${isExpanded ? "bg-red-600/30 text-red-400" : "bg-gray-700/50 text-gray-400"} font-bold text-xs transition-all`}>
                      {index + 1}
                    </div>

                    {/* Lesson Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-semibold text-xs xs:text-sm truncate mb-0.5 ${isExpanded ? "text-red-400" : "text-white"}`}>
                        {lesson.title || "Untitled Lesson"}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">
                        {lesson.description ||
                          "No description added yet"}
                      </p>
                      {lesson.videoUrl && (
                        <div className="text-xs text-green-500 mt-1 flex items-center gap-1">
                          ✓ Video uploaded
                        </div>
                      )}
                    </div>

                    {/* Expand Icon & Menu */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedLessonId(isExpanded ? null : lesson.id);
                        }}
                        className={`p-1.5 rounded-lg transition-all ${isExpanded ? "bg-red-600/30 text-red-400" : "text-gray-500 hover:bg-gray-700/50"}`}
                      >
                        {isExpanded ? (
                          <FaChevronUp className="text-xs" />
                        ) : (
                          <FaChevronDown className="text-xs" />
                        )}
                      </button>

                      {/* Menu Button */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(openMenu === lesson.id ? null : lesson.id);
                          }}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-700/50 hover:text-white transition-all"
                        >
                          <FaEllipsisV className="text-xs" />
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                          {openMenu === lesson.id && (
                            <motion.div
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-0 mt-1 w-40 bg-gray-900 border border-red-500/30 rounded-lg shadow-xl z-50 overflow-hidden"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateLesson(lesson);
                                  setOpenMenu(null);
                                }}
                                className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-red-600/20 hover:text-red-400 transition-colors"
                              >
                                Duplicate
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteLesson(lesson.id);
                                  setOpenMenu(null);
                                }}
                                className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-red-600/20 transition-colors border-t border-red-500/10"
                              >
                                Delete
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-red-500/20"
                      >
                        <LessonDetail
                          lesson={lesson}
                          onUpdate={(updates) =>
                            updateLesson(lesson.id, updates)
                          }
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default LessonsListNew;