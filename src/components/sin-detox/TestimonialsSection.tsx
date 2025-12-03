"use client";

import { useState, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { FaStar, FaQuoteLeft, FaChevronLeft, FaChevronRight, FaCheckCircle } from "react-icons/fa";
import { TESTIMONIALS } from "@/lib/sin-detox/constants";

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextTestimonial = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  }, []);

  const prevTestimonial = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  }, []);

  const activeTestimonial = TESTIMONIALS[activeIndex];

  return (
    <section
      id="testimonials"
      className="py-20 sm:py-24 lg:py-32 bg-gradient-to-b from-black via-gray-950 to-black relative overflow-hidden"
      aria-labelledby="testimonials-heading"
    >
      {/* Background Decoration */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(220,38,38,0.08),transparent_60%)]"
        aria-hidden="true"
      />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <m.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="text-red-500 font-bold tracking-[0.2em] uppercase text-xs sm:text-sm mb-4 block">
            Real Results
          </span>
          <h2
            id="testimonials-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4"
          >
            Transformed <span className="text-red-500">Lives</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-base sm:text-lg">
            Join thousands who have broken free using the Sin Detox Protocol.
          </p>
        </m.header>

        {/* Featured Testimonial */}
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-b from-gray-900/80 to-black/80 backdrop-blur-sm rounded-3xl border border-white/10 p-8 sm:p-10 lg:p-12">
            <FaQuoteLeft
              className="absolute top-6 left-6 sm:top-8 sm:left-8 text-red-900/30 text-4xl sm:text-5xl"
              aria-hidden="true"
            />

            <AnimatePresence mode="wait">
              <m.div
                key={activeIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="relative z-10"
              >
                {/* Rating */}
                <div className="flex gap-1 mb-6 justify-center sm:justify-start" aria-label={`${activeTestimonial.rating} star rating`}>
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={`text-lg ${
                        i < activeTestimonial.rating ? "text-yellow-500" : "text-gray-700"
                      }`}
                    />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-lg sm:text-xl lg:text-2xl text-gray-200 leading-relaxed mb-8 text-center sm:text-left">
                  "{activeTestimonial.content}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-4 justify-center sm:justify-start">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gray-800 border-2 border-red-500/30">
                    <Image
                      src={activeTestimonial.avatar}
                      alt={activeTestimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">
                        {activeTestimonial.name}
                      </span>
                      {activeTestimonial.verified && (
                        <FaCheckCircle className="text-green-500 text-sm" aria-label="Verified" />
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {activeTestimonial.role}
                    </span>
                  </div>
                </div>
              </m.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-white/10">
              <button
                onClick={prevTestimonial}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Previous testimonial"
              >
                <FaChevronLeft />
              </button>

              {/* Dots */}
              <div className="flex gap-2">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i === activeIndex
                        ? "bg-red-500 w-8"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                    aria-label={`Go to testimonial ${i + 1}`}
                    aria-current={i === activeIndex ? "true" : "false"}
                  />
                ))}
              </div>

              <button
                onClick={nextTestimonial}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Next testimonial"
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}