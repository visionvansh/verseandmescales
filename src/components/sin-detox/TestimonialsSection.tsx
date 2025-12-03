"use client";

import React, { useEffect, useRef, useMemo, memo } from "react";
import { m } from "framer-motion";
import { FaStar } from "react-icons/fa";
import { FaShieldAlt } from "react-icons/fa";
import { TESTIMONIALS } from "@/lib/sin-detox/constants";

const TestimonialScroller = memo(function TestimonialScroller() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationFrameId: number;
    let scrollAmount = 0;

    const scroll = () => {
      scrollAmount += 0.3;
      if (scrollAmount >= scrollContainer.scrollWidth / 2) {
        scrollAmount = 0;
      }
      scrollContainer.scrollLeft = scrollAmount;
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  const doubledTestimonials = useMemo(() => [...TESTIMONIALS, ...TESTIMONIALS], []);

  return (
    <div className="relative w-full overflow-hidden py-4">
      {/* Left Fade */}
      <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-28 bg-gradient-to-r from-black/60 to-transparent z-10 pointer-events-none" />
      {/* Right Fade */}
      <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-28 bg-gradient-to-l from-black/60 to-transparent z-10 pointer-events-none" />

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-hidden"
        style={{ scrollBehavior: 'auto' }}
      >
        {doubledTestimonials.map((testimonial, index) => (
          <div
            key={`${testimonial.id}-${index}`}
            className="relative flex-shrink-0 w-72 xs:w-80 sm:w-96 group"
          >
            {/* Glow Effect Behind Card */}
            <div className="absolute inset-0 bg-red-600/20 blur-xl rounded-2xl opacity-50 group-hover:opacity-70 transition-opacity" />
            
            {/* Card */}
            <div className="relative bg-black/70 border border-red-600/30 rounded-xl p-5 backdrop-blur-md">
              {/* Star Rating */}
              <div className="flex items-center gap-1 mb-2">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <FaStar key={i} className="text-red-400 text-xs" />
                ))}
              </div>
              {/* Quote Content */}
              <p className="text-gray-300 text-sm mb-3 line-clamp-4 leading-relaxed">
                "{testimonial.content}"
              </p>
              {/* Author */}
              <p className="text-red-400 font-bold text-sm">
                — {testimonial.name}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="relative w-full py-12 sm:py-16 lg:py-20 overflow-hidden"
    >
      <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <m.div
          className="text-center mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <span className="text-red-500 font-bold tracking-[0.2em] uppercase text-xs mb-3 block flex items-center justify-center gap-2">
            <FaShieldAlt /> WAR ROOM REPORTS
          </span>
          <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] mb-2 px-2">
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              REAL RESULTS
            </span>
            <span className="text-white">, NO FLUFF</span>
          </h2>
        </m.div>

        {/* Testimonial Scroller */}
        <TestimonialScroller />
      </div>
    </section>
  );
}