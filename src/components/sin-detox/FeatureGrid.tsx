"use client";

import { useRef, useEffect, useMemo } from "react";
import { m } from "framer-motion";
import { FEATURES, STATS } from "@/lib/sin-detox/constants";
import { AnimatedCounter } from "./ui/AnimatedCounter";

// Feature Scroller Component - Auto-scrolling horizontal carousel
function FeatureScroller() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationFrameId: number;
    let scrollAmount = 0;
    
    const scroll = () => {
      scrollAmount += 0.4;
      if (scrollAmount >= scrollContainer.scrollWidth / 2) {
        scrollAmount = 0;
      }
      scrollContainer.scrollLeft = scrollAmount;
      animationFrameId = requestAnimationFrame(scroll);
    };

    const timeout = setTimeout(() => {
      animationFrameId = requestAnimationFrame(scroll);
    }, 500);
    
    return () => {
      clearTimeout(timeout);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  const doubledFeatures = useMemo(() => [...FEATURES, ...FEATURES], []);

  return (
    <div className="relative w-full overflow-hidden py-4">
      {/* Left Fade Mask */}
      <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-28 bg-gradient-to-r from-gray-950 to-transparent z-10 pointer-events-none" />
      
      {/* Right Fade Mask */}
      <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-28 bg-gradient-to-l from-gray-950 to-transparent z-10 pointer-events-none" />
      
      {/* Scrolling Container */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-hidden"
        style={{ scrollBehavior: 'auto' }}
      >
        {doubledFeatures.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <article
              key={`${feature.id}-${index}`}
              className="group relative flex-shrink-0 w-72 xs:w-80 sm:w-96 p-6 rounded-2xl bg-gradient-to-b from-gray-900/80 to-gray-950/80 border border-white/5 hover:border-red-500/30 transition-all duration-500 overflow-hidden"
            >
              {/* Background Icon */}
              <div
                className="absolute top-4 right-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500"
                aria-hidden="true"
              >
                <Icon className="text-7xl text-red-500" />
              </div>

              {/* Content */}
              <div className="relative z-10">
                <div className="w-12 h-12 bg-red-900/30 rounded-xl flex items-center justify-center text-red-500 mb-4 group-hover:bg-red-500 group-hover:text-white transition-all duration-300">
                  <Icon className="text-xl" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  {feature.title}
                </h3>
                <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3">
                  {feature.subtitle}
                </p>
                <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
                  {feature.description}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export function FeatureGrid() {
  return (
    <section
      id="features"
      className="py-12 sm:py-16 lg:py-20 relative overflow-hidden"
      aria-labelledby="features-heading"
    >
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Stats Row */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {STATS.map((stat, i) => (
            <m.div
              key={stat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-1">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wider">
                {stat.label}
              </div>
            </m.div>
          ))}
        </m.div>

        {/* Section Header */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2
            id="features-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4"
          >
            Why This <span className="text-red-500">Works</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-base sm:text-lg">
            Built on neuroscience, psychology, and spiritual wisdom—not
            motivational speeches.
          </p>
        </m.div>
      </div>

      {/* Full-width Feature Scroller */}
      <m.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <FeatureScroller />
      </m.div>
    </section>
  );
}