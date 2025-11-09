// components/course-builder/ModuleEditor.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaChevronDown,
  FaChevronUp,
  FaPlus,
  FaEdit,
  FaBook,
} from "react-icons/fa";

import LessonsList from "./LessonsListNew";

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

interface ModuleEditorProps {
  module: Module;
  onUpdate: (module: Module) => void;
  isMobile?: boolean;
}

const ModuleEditor: React.FC<ModuleEditorProps> = ({
  module,
  onUpdate,
  isMobile = false,
}) => {
  const [expandedOutcomes, setExpandedOutcomes] = useState(false);
  const [outcomeInput, setOutcomeInput] = useState("");

  const updateModule = (updates: Partial<Module>) => {
    onUpdate({
      ...module,
      ...updates,
    });
  };

  const addOutcome = () => {
    if (outcomeInput.trim()) {
      updateModule({
        learningOutcomes: [...module.learningOutcomes, outcomeInput.trim()],
      });
      setOutcomeInput("");
    }
  };

  const removeOutcome = (index: number) => {
    updateModule({
      learningOutcomes: module.learningOutcomes.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Module Info Section */}
      <div className="flex-shrink-0 p-4 xs:p-5 sm:p-6 border-b border-red-500/30 space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2">
            Module Title
          </label>
          <input
            type="text"
            value={module.title}
            onChange={(e) => updateModule({ title: e.target.value })}
            placeholder="Enter module title"
            className="w-full px-3 xs:px-4 py-2 xs:py-3 bg-gray-800/50 border border-red-500/20 rounded-lg text-sm xs:text-base text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2">
            Description
          </label>
          <textarea
            value={module.description}
            onChange={(e) => updateModule({ description: e.target.value })}
            placeholder="Describe what students will learn in this module"
            rows={3}
            className="w-full px-3 xs:px-4 py-2 xs:py-3 bg-gray-800/50 border border-red-500/20 rounded-lg text-sm xs:text-base text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all resize-none"
          />
        </div>

        {/* Difficulty Level */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2">
            Difficulty Level
          </label>
          <select
            value={module.difficulty}
            onChange={(e) =>
              updateModule({
                difficulty: e.target.value as "Beginner" | "Intermediate" | "Advanced",
              })
            }
            className="w-full px-3 xs:px-4 py-2 xs:py-3 bg-gray-800/50 border border-red-500/20 rounded-lg text-sm xs:text-base text-white focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all"
          >
            <option value="Beginner">🟢 Beginner</option>
            <option value="Intermediate">🟡 Intermediate</option>
            <option value="Advanced">🔴 Advanced</option>
          </select>
        </div>

        {/* Learning Outcomes */}
        <div>
          <button
            onClick={() => setExpandedOutcomes(!expandedOutcomes)}
            className="flex items-center justify-between w-full text-xs font-semibold text-gray-400 hover:text-gray-300 mb-2 transition-colors"
          >
            <span className="flex items-center gap-2">
              <FaBook className="text-red-500" />
              Learning Outcomes
              <span className="text-gray-600 font-normal">
                ({module.learningOutcomes.length})
              </span>
            </span>
            {expandedOutcomes ? (
              <FaChevronUp className="text-xs" />
            ) : (
              <FaChevronDown className="text-xs" />
            )}
          </button>

          <AnimatePresence>
            {expandedOutcomes && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                {/* Add Outcome Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={outcomeInput}
                    onChange={(e) => setOutcomeInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        addOutcome();
                      }
                    }}
                    placeholder="Add a learning outcome..."
                    className="flex-1 px-3 py-2 bg-gray-800/50 border border-red-500/20 rounded-lg text-xs xs:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50"
                  />
                  <button
                    onClick={addOutcome}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-all hover:scale-105"
                  >
                    <FaPlus className="text-xs" />
                  </button>
                </div>

                {/* Outcomes List */}
                <div className="space-y-2">
                  {module.learningOutcomes.map((outcome, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-start gap-2 p-2 bg-gray-800/30 rounded-lg border border-red-500/10"
                    >
                      <span className="flex-1 text-xs xs:text-sm text-gray-300 pt-0.5">
                        {outcome}
                      </span>
                      <button
                        onClick={() => removeOutcome(index)}
                        className="text-red-400 hover:text-red-300 text-xs flex-shrink-0"
                      >
                        ✕
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Lessons Section */}
      <div className="flex-1 overflow-y-auto p-4 xs:p-5 sm:p-6">
        <LessonsList
          lessons={module.lessons}
          onUpdate={(lessons) => updateModule({ lessons })}
        />
      </div>
    </div>
  );
};

export default ModuleEditor;