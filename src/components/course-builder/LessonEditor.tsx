// components/course-builder/LessonsEditor.tsx
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
  FaUpload,
  FaFile,
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

interface LessonsEditorProps {
  lessons: Lesson[];
  onChange: (lessons: Lesson[]) => void;
}

const LessonsEditor: React.FC<LessonsEditorProps> = ({ lessons, onChange }) => {
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

  const addLesson = () => {
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: "",
      description: "",
      videoUrl: "",
      duration: "",
      resources: [],
    };
    onChange([...lessons, newLesson]);
    setExpandedLessons(new Set([...expandedLessons, newLesson.id]));
  };

  const updateLesson = (id: string, field: keyof Lesson, value: any) => {
    onChange(
      lessons.map((lesson) =>
        lesson.id === id ? { ...lesson, [field]: value } : lesson
      )
    );
  };

  const deleteLesson = (id: string) => {
    onChange(lessons.filter((lesson) => lesson.id !== id));
    const newExpanded = new Set(expandedLessons);
    newExpanded.delete(id);
    setExpandedLessons(newExpanded);
  };

  const toggleLesson = (id: string) => {
    const newExpanded = new Set(expandedLessons);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedLessons(newExpanded);
  };

  const addResource = (lessonId: string) => {
    const lesson = lessons.find((l) => l.id === lessonId);
    if (lesson) {
      const newResource: Resource = {
        id: `resource-${Date.now()}`,
        title: "",
        description: "",
        fileUrl: "",
        fileType: "pdf",
      };
      updateLesson(lessonId, "resources", [...lesson.resources, newResource]);
    }
  };

  const updateResource = (
    lessonId: string,
    resourceId: string,
    field: keyof Resource,
    value: any
  ) => {
    const lesson = lessons.find((l) => l.id === lessonId);
    if (lesson) {
      const newResources = lesson.resources.map((resource) =>
        resource.id === resourceId ? { ...resource, [field]: value } : resource
      );
      updateLesson(lessonId, "resources", newResources);
    }
  };

  const deleteResource = (lessonId: string, resourceId: string) => {
    const lesson = lessons.find((l) => l.id === lessonId);
    if (lesson) {
      const newResources = lesson.resources.filter((r) => r.id !== resourceId);
      updateLesson(lessonId, "resources", newResources);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-white flex items-center">
          <FaPlayCircle className="mr-2 text-red-500" />
          Lessons ({lessons.length})
        </h4>
        <button
          onClick={addLesson}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-600/80 hover:bg-red-600 rounded-lg font-semibold text-sm transition-all hover:scale-105"
        >
          <FaPlus className="text-xs" />
          Add Lesson
        </button>
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-900/30 rounded-lg border border-red-500/10">
          <FaPlayCircle className="mx-auto text-3xl mb-2 opacity-50" />
          <p className="text-sm">No lessons yet. Add your first lesson to this module.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {lessons.map((lesson, index) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 to-black/50 rounded-lg border border-red-500/10" />
                
                <div className="relative p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-2 cursor-move">
                      <FaGripVertical className="text-gray-600 text-sm" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-600/20 text-red-400 font-bold text-xs">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          value={lesson.title}
                          onChange={(e) =>
                            updateLesson(lesson.id, "title", e.target.value)
                          }
                          placeholder="Lesson Title"
                          className="flex-1 px-3 py-1.5 bg-gray-900/50 border border-red-500/20 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50"
                        />
                      </div>

                      <textarea
                        value={lesson.description}
                        onChange={(e) =>
                          updateLesson(lesson.id, "description", e.target.value)
                        }
                        placeholder="Lesson Description (Optional)"
                        rows={2}
                        className="w-full px-3 py-2 mb-2 bg-gray-900/30 border border-red-500/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/30 resize-none"
                      />

                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Video URL
                          </label>
                          <input
                            type="text"
                            value={lesson.videoUrl}
                            onChange={(e) =>
                              updateLesson(lesson.id, "videoUrl", e.target.value)
                            }
                            placeholder="https://..."
                            className="w-full px-3 py-1.5 bg-gray-900/30 border border-red-500/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Duration
                          </label>
                          <input
                            type="text"
                            value={lesson.duration}
                            onChange={(e) =>
                              updateLesson(lesson.id, "duration", e.target.value)
                            }
                            placeholder="e.g., 15:30"
                            className="w-full px-3 py-1.5 bg-gray-900/30 border border-red-500/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/30"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleLesson(lesson.id)}
                        className="p-1.5 hover:bg-gray-800/50 rounded-lg transition-colors"
                      >
                        {expandedLessons.has(lesson.id) ? (
                          <FaChevronUp className="text-gray-400 text-sm" />
                        ) : (
                          <FaChevronDown className="text-gray-400 text-sm" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteLesson(lesson.id)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-600/10 rounded-lg transition-colors"
                      >
                        <FaTrash className="text-sm" />
                      </button>
                    </div>
                  </div>

                  {/* Resources Section */}
                  <AnimatePresence>
                    {expandedLessons.has(lesson.id) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-red-500/10"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-300 flex items-center">
                            <FaFile className="mr-1.5 text-red-500" />
                            Downloadable Resources
                          </span>
                          <button
                            onClick={() => addResource(lesson.id)}
                            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                          >
                            <FaPlus className="text-xs" />
                            Add Resource
                          </button>
                        </div>

                        {lesson.resources.length === 0 ? (
                          <div className="text-center py-4 text-gray-600 bg-gray-900/20 rounded-lg border border-red-500/5">
                            <FaFile className="mx-auto text-2xl mb-1 opacity-30" />
                            <p className="text-xs">No resources yet</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {lesson.resources.map((resource) => (
                              <div
                                key={resource.id}
                                className="p-2 bg-gray-900/30 border border-red-500/10 rounded-lg"
                              >
                                <div className="flex gap-2 mb-2">
                                  <input
                                    type="text"
                                    value={resource.title}
                                    onChange={(e) =>
                                      updateResource(
                                        lesson.id,
                                        resource.id,
                                        "title",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Resource Title"
                                    className="flex-1 px-2 py-1 bg-gray-900/50 border border-red-500/10 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500/30"
                                  />
                                  <button
                                    onClick={() =>
                                      deleteResource(lesson.id, resource.id)
                                    }
                                    className="p-1 text-red-400 hover:text-red-300 hover:bg-red-600/10 rounded transition-colors"
                                  >
                                    <FaTrash className="text-xs" />
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  value={resource.description}
                                  onChange={(e) =>
                                    updateResource(
                                      lesson.id,
                                      resource.id,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Resource Description"
                                  className="w-full px-2 py-1 mb-2 bg-gray-900/50 border border-red-500/10 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500/30"
                                />
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={resource.fileUrl}
                                    onChange={(e) =>
                                      updateResource(
                                        lesson.id,
                                        resource.id,
                                        "fileUrl",
                                        e.target.value
                                      )
                                    }
                                    placeholder="File URL or upload"
                                    className="flex-1 px-2 py-1 bg-gray-900/50 border border-red-500/10 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500/30"
                                  />
                                  <select
                                    value={resource.fileType}
                                    onChange={(e) =>
                                      updateResource(
                                        lesson.id,
                                        resource.id,
                                        "fileType",
                                        e.target.value
                                      )
                                    }
                                    className="px-2 py-1 bg-gray-900/50 border border-red-500/10 rounded text-xs text-white focus:outline-none focus:border-red-500/30"
                                  >
                                    <option value="pdf">PDF</option>
                                    <option value="doc">DOC</option>
                                    <option value="zip">ZIP</option>
                                    <option value="other">Other</option>
                                  </select>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default LessonsEditor;