// components/course-builder/ModulesList.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlus,
  FaTrash,
  FaEllipsisV,
  FaGripVertical,
  FaBook,
  FaCheckCircle,
} from "react-icons/fa";

interface Module {
  id: string;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  learningOutcomes: string[];
  lessons: any[];
}

interface ModulesListProps {
  modules: Module[];
  selectedModuleId: string | null;
  onSelectModule: (moduleId: string) => void;
  onUpdateModules: (modules: Module[]) => void;
}

const difficultyColors = {
  Beginner: "bg-green-600/20 text-green-400 border-green-500/30",
  Intermediate: "bg-yellow-600/20 text-yellow-400 border-yellow-500/30",
  Advanced: "bg-red-600/20 text-red-400 border-red-500/30",
};

const ModulesList: React.FC<ModulesListProps> = ({
  modules,
  selectedModuleId,
  onSelectModule,
  onUpdateModules,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const addModule = () => {
    const newModule: Module = {
      id: `module-${Date.now()}`,
      title: "New Module",
      description: "",
      difficulty: "Beginner",
      learningOutcomes: [],
      lessons: [],
    };
    const updatedModules = [...modules, newModule];
    onUpdateModules(updatedModules);
    onSelectModule(newModule.id);
  };

  const deleteModule = (id: string) => {
    const updatedModules = modules.filter((m) => m.id !== id);
    onUpdateModules(updatedModules);
    if (selectedModuleId === id && updatedModules.length > 0) {
      onSelectModule(updatedModules[0].id);
    }
    setOpenMenu(null);
  };

  const duplicateModule = (module: Module) => {
    const newModule: Module = {
      ...module,
      id: `module-${Date.now()}`,
      title: `${module.title} (Copy)`,
    };
    const updatedModules = [...modules, newModule];
    onUpdateModules(updatedModules);
    setOpenMenu(null);
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-gray-900/95 backdrop-blur-sm border-b border-red-500/30 p-3 xs:p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <FaBook className="text-red-500" />
            <span>Modules</span>
            <span className="text-sm text-gray-400 font-normal">
              ({modules.length})
            </span>
          </h2>
          <button
            onClick={addModule}
            className="flex items-center gap-1.5 px-2 xs:px-3 py-1.5 xs:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-xs sm:text-sm transition-all hover:scale-105 whitespace-nowrap"
          >
            <FaPlus className="text-xs" />
            <span className="hidden xs:inline">Add Module</span>
            <span className="xs:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Modules List */}
      <div className="flex-1 overflow-y-auto p-2 xs:p-3 sm:p-4 space-y-2">
        {modules.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 px-3"
          >
            <FaBook className="mx-auto text-4xl text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm font-medium">
              No modules yet
            </p>
            <p className="text-gray-600 text-xs mt-1">
              Click "Add Module" to create your first module
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {modules.map((module, index) => {
              const isSelected = selectedModuleId === module.id;
              const menuOpen = openMenu === module.id;

              return (
                <motion.div
                  key={module.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                >
                  <div
                    onClick={() => onSelectModule(module.id)}
                    className={`group relative p-3 xs:p-4 rounded-lg lg:rounded-xl cursor-pointer transition-all duration-200 border backdrop-blur-sm overflow-visible ${
                      isSelected
                        ? "bg-red-600/20 border-red-500/50 shadow-lg shadow-red-600/20"
                        : "bg-gray-800/30 border-red-500/10 hover:bg-gray-800/50 hover:border-red-500/30"
                    }`}
                  >
                    <div className="relative z-10">
                      {/* Module Title */}
                      <div className="flex items-start gap-2 mb-2">
                        <div
                          className={`flex-shrink-0 mt-0.5 ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
                        >
                          <FaGripVertical
                            className={`text-sm ${isSelected ? "text-red-500" : "text-gray-600"}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className={`font-semibold text-xs xs:text-sm truncate ${
                              isSelected ? "text-red-400" : "text-white"
                            }`}
                          >
                            {module.title || "Untitled Module"}
                          </h3>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {module.lessons.length} lesson
                            {module.lessons.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      {/* Difficulty Badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                            difficultyColors[
                              module.difficulty as keyof typeof difficultyColors
                            ]
                          }`}
                        >
                          {module.difficulty}
                        </span>
                        {module.learningOutcomes.length > 0 && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <FaCheckCircle className="text-green-500" />
                            {module.learningOutcomes.length} outcomes
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Menu Button */}
                    <div className="absolute top-3 right-3 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenu(menuOpen ? null : module.id);
                        }}
                        className={`p-1.5 rounded-lg transition-all ${
                          isSelected
                            ? "bg-red-600/30 text-red-400 hover:bg-red-600/50"
                            : "bg-gray-800/50 text-gray-400 hover:bg-gray-800/80 hover:text-white"
                        }`}
                      >
                        <FaEllipsisV className="text-xs" />
                      </button>
                    </div>
                  </div>

                  {/* Dropdown Menu - Fixed z-index positioning */}
                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-3 top-12 w-40 bg-gray-900 border border-red-500/30 rounded-lg shadow-2xl z-[9999] overflow-hidden"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateModule(module);
                          }}
                          className="w-full px-3 py-2.5 text-left text-xs text-gray-300 hover:bg-red-600/20 hover:text-red-400 transition-colors font-medium"
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteModule(module.id);
                          }}
                          className="w-full px-3 py-2.5 text-left text-xs text-red-400 hover:bg-red-600/20 transition-colors border-t border-red-500/10 font-medium"
                        >
                          Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default ModulesList;