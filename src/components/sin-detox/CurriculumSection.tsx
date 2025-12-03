"use client";

import { useRef, useState, useCallback } from "react";
import { m } from "framer-motion";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import { COURSE_MODULES } from "@/lib/sin-detox/constants";
import { ModuleCard } from "./ModuleCard";

export function CurriculumSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollPosition = container.scrollLeft;
      const containerWidth = container.offsetWidth;
      const itemWidth = containerWidth * 0.78;

      const newIndex = Math.round(scrollPosition / itemWidth);
      const clampedIndex = Math.min(Math.max(newIndex, 0), COURSE_MODULES.length - 1);

      if (clampedIndex !== activeIndex) {
        setActiveIndex(clampedIndex);
      }
    }
  }, [activeIndex]);

  const scrollToIndex = (index: number) => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.offsetWidth;
      const itemWidth = containerWidth * 0.78;
      scrollContainerRef.current.scrollTo({ 
        left: itemWidth * index, 
        behavior: 'smooth' 
      });
    }
  };

  const canScrollLeft = activeIndex > 0;
  const canScrollRight = activeIndex < COURSE_MODULES.length - 1;

  return (
    <section
      id="curriculum"
      className="py-20 sm:py-24 lg:py-32 relative overflow-hidden"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <m.header
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="text-red-500 font-bold tracking-[0.25em] uppercase text-xs mb-6 block">
            Declassified Protocol
          </span>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight">
            THE FRAMEWORK FOR <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-gray-500">
              TOTAL DOMINANCE
            </span>
          </h2>
        </m.header>

        {/* Mobile Swipe Hint */}
        <div className="flex items-center justify-center gap-2 mb-6 md:hidden">
          <span className="text-gray-500 text-xs tracking-wide uppercase">
            Swipe to explore
          </span>
          <HiChevronRight className="text-gray-500 text-sm animate-pulse" />
        </div>

        {/* Horizontal Carousel */}
        <div className="relative">
          
          {/* Fade Masks - MOBILE ONLY */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black via-black/80 to-transparent z-20 pointer-events-none flex items-center justify-start pl-1 md:hidden">
            {canScrollLeft && (
              <HiChevronLeft className="text-white/30 text-2xl" />
            )}
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black via-black/80 to-transparent z-20 pointer-events-none flex items-center justify-end pr-1 md:hidden">
            {canScrollRight && (
              <HiChevronRight className="text-white/30 text-2xl" />
            )}
          </div>

          {/* Scroll Container */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="
              flex md:grid 
              md:grid-cols-2 xl:grid-cols-3 
              gap-4 sm:gap-6 xl:gap-8 
              overflow-x-auto md:overflow-visible 
              snap-x snap-mandatory md:snap-none 
              py-4 
              px-4 md:px-0 
              scrollbar-hide
              items-stretch
            "
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {/* Left spacer for centering first card */}
            <div className="w-[11vw] md:hidden shrink-0" />
            
            {COURSE_MODULES.map((module, index) => {
              const isActive = index === activeIndex;
              const isAdjacent = Math.abs(index - activeIndex) === 1;
              
              return (
                <div 
                  key={module.id} 
                  className={`
                    snap-center shrink-0 
                    w-[78vw] sm:w-[380px] md:w-auto
                    transition-opacity duration-200
                    ${isActive ? 'opacity-100' : isAdjacent ? 'opacity-60' : 'opacity-40'}
                    md:opacity-100
                  `}
                  style={{ transform: 'translateZ(0)' }}
                >
                  <ModuleCard module={module} index={index} isActive={isActive} />
                </div>
              );
            })}
            {/* Right spacer for last card */}
            <div className="w-[11vw] md:hidden shrink-0" />
          </div>

          {/* Mobile Navigation Controls */}
          <div className="mt-8 flex flex-col items-center gap-4 md:hidden">
            
            {/* Progress Indicator */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 font-medium tabular-nums">
                {String(activeIndex + 1).padStart(2, '0')}
              </span>
              <div className="w-32 h-0.5 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full"
                  style={{ 
                    width: `${((activeIndex + 1) / COURSE_MODULES.length) * 100}%`,
                    transition: 'width 200ms ease-out',
                  }}
                />
              </div>
              <span className="text-xs text-gray-500 font-medium tabular-nums">
                {String(COURSE_MODULES.length).padStart(2, '0')}
              </span>
            </div>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => scrollToIndex(activeIndex - 1)}
                disabled={!canScrollLeft}
                className={`
                  w-10 h-10 rounded-full border flex items-center justify-center
                  transition-all duration-200
                  ${canScrollLeft 
                    ? 'border-white/20 text-white active:scale-95' 
                    : 'border-white/5 text-white/20 cursor-not-allowed'}
                `}
                aria-label="Previous module"
              >
                <HiChevronLeft className="text-lg" />
              </button>
              <button
                onClick={() => scrollToIndex(activeIndex + 1)}
                disabled={!canScrollRight}
                className={`
                  w-10 h-10 rounded-full border flex items-center justify-center
                  transition-all duration-200
                  ${canScrollRight 
                    ? 'border-white/20 text-white active:scale-95' 
                    : 'border-white/5 text-white/20 cursor-not-allowed'}
                `}
                aria-label="Next module"
              >
                <HiChevronRight className="text-lg" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}