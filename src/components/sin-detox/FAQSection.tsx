"use client";

import { useState, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { FaPlus, FaMinus } from "react-icons/fa";
import { FAQ_ITEMS } from "@/lib/sin-detox/constants";

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = useCallback((index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  }, []);

  return (
    <section
      id="faq"
      className="py-20 sm:py-24 lg:py-32 bg-black relative"
      aria-labelledby="faq-heading"
    >
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        {/* Section Header */}
        <m.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="text-red-500 font-bold tracking-[0.2em] uppercase text-xs sm:text-sm mb-4 block">
            Questions Answered
          </span>
          <h2
            id="faq-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4"
          >
            Frequently Asked <span className="text-red-500">Questions</span>
          </h2>
        </m.header>

        {/* FAQ Accordion */}
        <div className="space-y-3 sm:space-y-4">
          {FAQ_ITEMS.map((item, index) => (
            <m.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="border border-white/10 rounded-xl overflow-hidden bg-gradient-to-b from-gray-900/50 to-black/50"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full flex items-center justify-between p-5 sm:p-6 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${item.id}`}
              >
                <span className="text-base sm:text-lg font-semibold text-white pr-4">
                  {item.question}
                </span>
                <span
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    openIndex === index
                      ? "bg-red-500 text-white"
                      : "bg-white/10 text-gray-400"
                  }`}
                >
                  {openIndex === index ? (
                    <FaMinus className="text-sm" />
                  ) : (
                    <FaPlus className="text-sm" />
                  )}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <m.div
                    id={`faq-answer-${item.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                      <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
                        {item.answer}
                      </p>
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}