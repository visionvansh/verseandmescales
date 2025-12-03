"use client";

import { memo } from "react";
import { m } from "framer-motion";
import { FaQuoteLeft, FaCrown } from "react-icons/fa";
import type { Module } from "@/lib/sin-detox/types";

interface ModuleCardProps {
  module: Module;
  index: number;
  isActive?: boolean;
}

export const ModuleCard = memo(function ModuleCard({ module, index, isActive }: ModuleCardProps) {
  const Icon = module.icon;

  return (
    <m.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative h-full"
    >
      <div className="relative h-full bg-gradient-to-b from-gray-900/60 to-black/80 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-red-500/40 transition-all duration-500 overflow-hidden hover:shadow-[0_0_50px_-15px_rgba(220,38,38,0.3)]">
        {/* Shimmer Effect */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"
          aria-hidden="true"
        />

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-start gap-4 sm:gap-5 mb-6">
            <div className="relative shrink-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-gray-800 to-black border border-red-500/30 flex items-center justify-center text-xl sm:text-2xl text-red-500 group-hover:scale-110 group-hover:border-red-500/50 transition-all duration-300 shadow-lg shadow-red-900/20">
                <Icon />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-red-500 font-bold text-xs tracking-widest uppercase">
                  Module {String(module.id).padStart(2, "0")}
                </span>
                <div className="h-px bg-red-900/50 flex-1" aria-hidden="true" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white leading-tight group-hover:text-red-100 transition-colors">
                {module.title}
              </h3>
            </div>
          </div>

          {/* Lessons List */}
          <ul className="space-y-2 sm:space-y-3 pl-2 border-l-2 border-white/10 ml-6">
            {module.lessons.map((lesson) => (
              <li
                key={lesson.id}
                className="relative pl-5 sm:pl-6 py-1 group/lesson"
              >
                <div
                  className="absolute left-[-5px] top-2.5 w-2 h-2 rounded-full bg-gray-700 group-hover/lesson:bg-red-500 transition-colors border border-black"
                  aria-hidden="true"
                />
                <h4 className="text-sm font-semibold text-gray-200 group-hover/lesson:text-white transition-colors">
                  {lesson.title}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 group-hover/lesson:text-gray-400 transition-colors">
                  {lesson.description}
                </p>
              </li>
            ))}
          </ul>

          {/* Hook Quote */}
          {module.hook && (
            <div className="mt-6 pt-5 border-t border-white/5 relative">
              <FaQuoteLeft
                className="absolute top-3 left-0 text-red-900/40 text-xl sm:text-2xl -translate-y-1/2"
                aria-hidden="true"
              />
              <p className="text-sm text-red-400 italic font-medium pl-7 sm:pl-8 opacity-80">
                "{module.hook}"
              </p>
            </div>
          )}
        </div>
      </div>
    </m.article>
  );
});