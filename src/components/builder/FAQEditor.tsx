"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaEye,
  FaTimes,
  FaSave,
  FaArrowUp,
  FaArrowDown,
  FaChevronDown,
  FaPalette,
  FaMagic,
  FaCheckCircle,
  FaQuestionCircle,
  FaLightbulb,
} from "react-icons/fa";

interface FAQ {
  id: string;
  order: number;
  question: string;
  answer: string;
}

interface TitleWord {
  text: string;
  shade?: string;
}

interface FAQEditorProps {
  enabled: boolean;
  title: string;
  titleWords?: TitleWord[];
  faqs: FAQ[];
  onChange: (data: {
    enabled: boolean;
    title: string;
    titleWords?: TitleWord[];
    faqs: FAQ[];
  }) => void;
}

const MAX_FAQS = 5;

const shadeOptions = [
  {
    value: "none",
    label: "White",
    desc: "Default",
    preview: "text-white",
    color: "bg-white",
  },
  {
    value: "red-light",
    label: "Red Light",
    desc: "400",
    preview: "text-red-400",
    color: "bg-red-400",
  },
  {
    value: "red-medium",
    label: "Red Medium",
    desc: "500",
    preview: "text-red-500",
    color: "bg-red-500",
  },
  {
    value: "red-dark",
    label: "Red Dark",
    desc: "600",
    preview: "text-red-600",
    color: "bg-red-600",
  },
  {
    value: "red-gradient-1",
    label: "Gradient 1",
    desc: "400→600",
    preview:
      "bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent",
    color: "bg-gradient-to-r from-red-400 to-red-600",
  },
  {
    value: "red-gradient-2",
    label: "Gradient 2",
    desc: "500→700",
    preview:
      "bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent",
    color: "bg-gradient-to-r from-red-500 to-red-700",
  },
  {
    value: "red-gradient-3",
    label: "Gradient 3",
    desc: "300→500",
    preview:
      "bg-gradient-to-r from-red-300 to-red-500 bg-clip-text text-transparent",
    color: "bg-gradient-to-r from-red-300 to-red-500",
  },
  {
    value: "gray-light",
    label: "Gray Light",
    desc: "400",
    preview: "text-gray-400",
    color: "bg-gray-400",
  },
  {
    value: "gray-medium",
    label: "Gray Medium",
    desc: "500",
    preview: "text-gray-500",
    color: "bg-gray-500",
  },
];

const getShadeClass = (shade?: string) => {
  const option = shadeOptions.find((s) => s.value === shade);
  return option?.preview || "text-white";
};

const FAQEditor: React.FC<FAQEditorProps> = ({
  enabled,
  title,
  titleWords,
  faqs,
  onChange,
}) => {
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activePreviewFAQ, setActivePreviewFAQ] = useState<string | null>(null);
  const [showColorCustomization, setShowColorCustomization] = useState(false);

  const initializeTitleWords = () => {
    if (titleWords && titleWords.length > 0) {
      return titleWords;
    }
    return title.split(" ").map((word) => ({
      text: word,
      shade: "red-gradient-1",
    }));
  };

  const [localTitleWords, setLocalTitleWords] = useState<TitleWord[]>(
    initializeTitleWords()
  );

  useEffect(() => {
    if (!titleWords || titleWords.length === 0) {
      const initialWords = title.split(" ").map((word) => ({
        text: word,
        shade: "red-gradient-1",
      }));
      setLocalTitleWords(initialWords);
      onChange({ enabled, title, titleWords: initialWords, faqs });
    }
  }, []);

  const addFAQ = () => {
    if (faqs.length >= MAX_FAQS) {
      alert(`Maximum ${MAX_FAQS} FAQs allowed`);
      return;
    }

    const newFAQ: FAQ = {
      id: `faq-${Date.now()}`,
      order: faqs.length,
      question: "Your question here?",
      answer: "Your detailed answer here.",
    };

    setEditingFAQ(newFAQ);
    setShowModal(true);
  };

  const saveFAQ = () => {
    if (!editingFAQ) return;

    const existingIndex = faqs.findIndex((f) => f.id === editingFAQ.id);
    let newFAQs;

    if (existingIndex >= 0) {
      newFAQs = [...faqs];
      newFAQs[existingIndex] = editingFAQ;
    } else {
      newFAQs = [...faqs, editingFAQ];
    }

    onChange({ enabled, title, titleWords: localTitleWords, faqs: newFAQs });
    setShowModal(false);
    setEditingFAQ(null);
  };

  const deleteFAQ = (id: string) => {
    if (confirm("Delete this FAQ?")) {
      onChange({
        enabled,
        title,
        titleWords: localTitleWords,
        faqs: faqs.filter((f) => f.id !== id),
      });
    }
  };

  const moveFAQ = (index: number, direction: "up" | "down") => {
    const newFAQs = [...faqs];
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= faqs.length) return;

    [newFAQs[index], newFAQs[newIndex]] = [newFAQs[newIndex], newFAQs[index]];
    newFAQs.forEach((f, i) => (f.order = i));

    onChange({ enabled, title, titleWords: localTitleWords, faqs: newFAQs });
  };

  const updateWordShade = (index: number, shade: string) => {
    const updated = [...localTitleWords];
    updated[index] = { ...updated[index], shade };
    setLocalTitleWords(updated);
    onChange({
      enabled,
      title: updated.map((w) => w.text).join(" "),
      titleWords: updated,
      faqs,
    });
  };

  const ColorPicker = ({
    value,
    onChange: onColorChange,
    index,
  }: {
    value: string;
    onChange: (value: string) => void;
    index: number;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState<"bottom" | "top">(
      "bottom"
    );
    const buttonRef = useRef<HTMLButtonElement>(null);
    const selectedOption =
      shadeOptions.find((opt) => opt.value === value) || shadeOptions[0];

    useEffect(() => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        if (spaceBelow < 300 && spaceAbove > spaceBelow) {
          setDropdownPosition("top");
        } else {
          setDropdownPosition("bottom");
        }
      }
    }, [isOpen]);

    return (
      <div className="relative w-full">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-2 lg:px-3 py-1.5 lg:py-2 bg-gray-900 border border-red-500/30 rounded text-white font-bold hover:border-red-500 transition-colors flex items-center justify-between text-[10px] lg:text-xs min-h-[32px] lg:min-h-[36px]"
        >
          <div className="flex items-center gap-1.5 lg:gap-2 min-w-0 flex-1">
            <div
              className={`w-3 h-3 lg:w-4 lg:h-4 rounded ${selectedOption.color} border border-white/20 flex-shrink-0`}
            />
            <span className="truncate text-[9px] lg:text-xs">
              {selectedOption.label}
            </span>
          </div>
          <FaPalette className="text-red-400 flex-shrink-0 text-[9px] lg:text-[10px] ml-1" />
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100]"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={`absolute z-[101] ${
                  dropdownPosition === "top" ? "bottom-full mb-2" : "top-full mt-2"
                } left-0 sm:left-auto sm:right-0 w-72 sm:w-80 bg-gray-800 border-2 border-red-500/50 rounded-lg overflow-hidden`}
                style={{ maxWidth: "calc(100vw - 2rem)" }}
              >
                <div className="p-2 bg-gray-900 border-b border-gray-700">
                  <h4 className="text-[10px] lg:text-xs font-bold text-white">
                    Select Color
                  </h4>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {shadeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onColorChange(option.value);
                        setIsOpen(false);
                      }}
                      className={`w-full p-2 lg:p-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 text-left ${
                        value === option.value ? "bg-red-900/20" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`w-5 h-5 lg:w-6 lg:h-6 rounded ${option.color} border border-white/20 flex-shrink-0`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-bold text-[10px] lg:text-xs truncate">
                            {option.label}
                          </div>
                          <div className="text-gray-400 text-[9px] lg:text-[10px] truncate">
                            {option.desc}
                          </div>
                        </div>
                        {value === option.value && (
                          <FaCheckCircle className="text-red-500 flex-shrink-0 text-xs" />
                        )}
                      </div>
                      <div
                        className={`text-sm lg:text-base font-black ${option.preview}`}
                      >
                        PREVIEW
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Header with Enable Toggle */}
      <div className="flex flex-col xs:flex-row items-start xs:items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg lg:text-xl font-black text-white mb-1 truncate">
            FAQ Section
          </h2>
          <p className="text-gray-400 text-[10px] lg:text-xs">
            Answer common questions from potential students
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
          <span className="text-[10px] lg:text-xs font-bold text-gray-300 hidden sm:inline">
            Enable Section
          </span>
          <div className="relative">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) =>
                onChange({
                  enabled: e.target.checked,
                  title,
                  titleWords: localTitleWords,
                  faqs,
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 lg:w-12 h-5.5 lg:h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[3px] after:bg-white after:rounded-full after:h-4.5 lg:after:h-5 after:w-4.5 lg:after:w-5 after:transition-all peer-checked:bg-red-600"></div>
          </div>
        </label>
      </div>

      {enabled && (
        <>
          {/* Section Title Configuration */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-2 lg:p-3">
            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 mb-2 lg:mb-3">
              <h3 className="text-sm lg:text-base font-bold text-white flex items-center gap-1.5">
                <FaQuestionCircle className="text-red-400 text-xs" />
                Section Title
              </h3>
              <button
                onClick={() =>
                  setShowColorCustomization(!showColorCustomization)
                }
                className="px-2 lg:px-3 py-1.5 lg:py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1.5 text-[10px] lg:text-xs font-bold w-full xs:w-auto"
              >
                <FaPalette className="text-[10px]" />
                <span>
                  {showColorCustomization ? "Hide" : "Customize"} Colors
                </span>
              </button>
            </div>

            {/* Fixed Title Display */}
            <div className="bg-gray-800/50 border-2 border-gray-700 rounded-lg p-2 lg:p-3">
              <div className="flex items-start gap-1.5 lg:gap-2 mb-2">
                <div className="w-4 h-4 lg:w-5 lg:h-5 bg-yellow-600/20 border border-yellow-500/30 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-yellow-400 text-[10px]">🔒</span>
                </div>
                <div>
                  <p className="text-[10px] lg:text-xs text-gray-400 font-bold">
                    Fixed Title Text
                  </p>
                  <p className="text-[9px] lg:text-[10px] text-gray-500 mt-0.5">
                    Title text cannot be changed, but you can customize word colors
                  </p>
                </div>
              </div>
              <div className="text-xl lg:text-2xl font-black leading-tight flex flex-wrap gap-1">
                {localTitleWords.map((word, idx) => (
                  <span key={idx} className={`${getShadeClass(word.shade)}`}>
                    {word.text}
                  </span>
                ))}
              </div>
            </div>

            {/* Color Customization Panel */}
            <AnimatePresence>
              {showColorCustomization && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 lg:mt-3"
                >
                  <div className="bg-gray-800/50 border border-red-500/30 rounded-lg p-2 lg:p-3">
                    <p className="text-[10px] lg:text-xs text-gray-400 mb-2 lg:mb-3 flex items-center gap-1.5">
                      <FaMagic className="text-red-400 text-[10px] flex-shrink-0" />
                      <span>Customize each word's color individually</span>
                    </p>
                    <div className="space-y-2 lg:space-y-2.5">
                      {localTitleWords.map((word, index) => (
                        <div
                          key={index}
                          className="bg-gray-900 border border-gray-700 rounded-lg p-2 lg:p-2.5 flex flex-col sm:flex-row gap-2 lg:gap-3 items-start sm:items-center"
                        >
                          <div className="flex-1 min-w-0 w-full sm:w-auto">
                            <label className="block text-[9px] lg:text-[10px] font-bold text-gray-400 mb-1">
                              Word Text
                            </label>
                            <div className="px-2 lg:px-3 py-1.5 lg:py-2 bg-gray-800 border border-gray-600 rounded text-white font-bold text-[10px] lg:text-xs break-words">
                              {word.text}
                            </div>
                          </div>

                          <div className="w-full sm:w-48 lg:w-56 flex-shrink-0">
                            <label className="block text-[9px] lg:text-[10px] font-bold text-gray-400 mb-1">
                              Color
                            </label>
                            <ColorPicker
                              value={word.shade || "red-gradient-1"}
                              onChange={(shade) =>
                                updateWordShade(index, shade)
                              }
                              index={index}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Live Title Preview */}
            <div className="mt-2 lg:mt-3 p-2 lg:p-3 bg-black/60 border-2 border-red-500/30 rounded-lg">
              <div className="flex items-center gap-1.5 mb-2">
                <FaEye className="text-red-400 text-[10px]" />
                <span className="text-[9px] lg:text-[10px] font-bold text-gray-400">
                  TITLE PREVIEW
                </span>
              </div>
              <div className="text-center">
                <h2 className="text-xl lg:text-2xl font-black leading-tight flex flex-wrap gap-1 justify-center">
                  {localTitleWords.map((word, idx) => (
                    <span
                      key={idx}
                      className={`${getShadeClass(word.shade)}`}
                    >
                      {word.text}
                    </span>
                  ))}
                </h2>
              </div>
            </div>
          </div>

          {/* FAQs Management Section */}
          <div className="bg-gray-900 border-2 border-gray-800 rounded-lg p-2 lg:p-3">
            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 mb-2 lg:mb-3">
              <div>
                <h3 className="text-sm lg:text-base font-bold text-white mb-0.5">
                  Frequently Asked Questions
                </h3>
                <p className="text-[10px] lg:text-xs text-gray-400">
                  {faqs.length}/{MAX_FAQS} questions added
                </p>
              </div>
              <button
                onClick={addFAQ}
                disabled={faqs.length >= MAX_FAQS}
                className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 text-[10px] lg:text-xs w-full xs:w-auto justify-center xs:justify-start ${
                  faqs.length >= MAX_FAQS
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed border-2 border-gray-600"
                    : "bg-gradient-to-r from-red-600 to-red-700 hover:opacity-90"
                }`}
              >
                <FaPlus className="text-[10px]" />
                <span>Add Question</span>
                {faqs.length >= MAX_FAQS && (
                  <span className="text-[9px]">(Max)</span>
                )}
              </button>
            </div>

            {/* Max Limit Warning */}
            {faqs.length >= MAX_FAQS && (
              <div className="bg-yellow-900/20 border-2 border-yellow-500/40 rounded-lg p-2 lg:p-2.5 mb-2 lg:mb-3">
                <div className="flex items-start gap-1.5 lg:gap-2">
                  <FaLightbulb className="text-yellow-400 flex-shrink-0 mt-0.5 text-xs" />
                  <div>
                    <p className="text-yellow-400 font-bold text-[10px] lg:text-xs mb-0.5">
                      Maximum Reached
                    </p>
                    <p className="text-yellow-300/80 text-[9px] lg:text-[10px]">
                      You've reached the maximum of {MAX_FAQS} FAQs. Delete one
                      to add a new question.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {faqs.length === 0 ? (
              <div className="text-center py-6 lg:py-8 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-dashed border-gray-700 rounded-lg">
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-2 lg:mb-3">
                  <FaQuestionCircle className="text-2xl lg:text-3xl text-red-400" />
                </div>
                <p className="text-gray-400 mb-1 font-bold text-xs lg:text-sm">
                  No FAQs yet
                </p>
                <p className="text-gray-500 text-[10px] lg:text-xs mb-3 lg:mb-4 px-4">
                  Add frequently asked questions to help potential students
                </p>
                <button
                  onClick={addFAQ}
                  className="px-4 lg:px-6 py-2 lg:py-2.5 bg-gradient-to-r from-red-600 to-red-700 rounded-lg font-bold hover:opacity-90 transition-opacity text-[10px] lg:text-xs inline-flex items-center gap-1.5"
                >
                  <FaPlus className="text-[10px]" />
                  Add Your First FAQ
                </button>
              </div>
            ) : (
              <div className="space-y-2 lg:space-y-2.5">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-2 lg:p-2.5 hover:border-red-500/50 transition-all"
                  >
                    <div className="flex flex-col xs:flex-row xs:items-start gap-2 lg:gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 lg:mb-2">
                          <div className="w-6 h-6 lg:w-7 lg:h-7 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-black text-[10px] lg:text-xs">
                              Q{index + 1}
                            </span>
                          </div>
                          <h4 className="font-bold text-white text-xs lg:text-sm line-clamp-2">
                            {faq.question}
                          </h4>
                        </div>
                        <p className="text-[10px] lg:text-xs text-gray-400 pl-8 lg:pl-9 line-clamp-2">
                          {faq.answer}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 flex-shrink-0 w-full xs:w-auto">
                        <button
                          onClick={() => moveFAQ(index, "up")}
                          disabled={index === 0}
                          className="p-1.5 lg:p-2 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-1 xs:flex-initial"
                          title="Move Up"
                        >
                          <FaArrowUp className="text-[10px]" />
                        </button>
                        <button
                          onClick={() => moveFAQ(index, "down")}
                          disabled={index === faqs.length - 1}
                          className="p-1.5 lg:p-2 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-1 xs:flex-initial"
                          title="Move Down"
                        >
                          <FaArrowDown className="text-[10px]" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingFAQ(faq);
                            setShowModal(true);
                          }}
                          className="p-1.5 lg:p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex-1 xs:flex-initial"
                          title="Edit"
                        >
                          <FaEdit className="text-[10px]" />
                        </button>
                        <button
                          onClick={() => deleteFAQ(faq.id)}
                          className="p-1.5 lg:p-2 bg-red-600/20 border border-red-500/30 rounded-lg hover:bg-red-600 hover:border-red-500 transition-all group flex-1 xs:flex-initial"
                          title="Delete"
                        >
                          <FaTrash className="text-red-400 group-hover:text-white text-[10px]" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Full Section Preview */}
          {faqs.length > 0 && (
            <div className="bg-black border-4 border-red-500/60 rounded-lg p-2 lg:p-3">
              <div className="flex flex-col xs:flex-row items-start xs:items-center xs:justify-between gap-2 mb-2 lg:mb-3">
                <h3 className="text-[9px] lg:text-[10px] font-bold text-gray-400 flex items-center gap-1">
                  <FaEye className="text-red-400 text-[10px]" /> FULL SECTION
                  PREVIEW
                </h3>
                <div className="text-[9px] lg:text-[10px] text-gray-500">
                  {faqs.length} Question{faqs.length > 1 ? "s" : ""}
                </div>
              </div>

              {/* Title */}
              <div className="text-center mb-3 lg:mb-4">
                <h2 className="text-xl lg:text-2xl font-black leading-tight flex flex-wrap gap-1 justify-center">
                  {localTitleWords.map((word, idx) => (
                    <span
                      key={idx}
                      className={`${getShadeClass(word.shade)}`}
                    >
                      {word.text}
                    </span>
                  ))}
                </h2>
              </div>

              {/* FAQ Accordion Preview */}
              <div className="max-w-4xl mx-auto space-y-2 lg:space-y-2.5">
                {faqs.slice(0, 3).map((faq) => (
                  <div
                    key={faq.id}
                    className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setActivePreviewFAQ(
                          activePreviewFAQ === faq.id ? null : faq.id
                        )
                      }
                      className="w-full text-left p-2 lg:p-3 flex items-start justify-between gap-2 hover:bg-red-900/10 transition-colors"
                    >
                      <h3 className="text-xs lg:text-sm font-black text-white flex-1 leading-snug">
                        {faq.question}
                      </h3>
                      <div
                        className={`w-6 h-6 lg:w-7 lg:h-7 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center transition-transform flex-shrink-0 ${
                          activePreviewFAQ === faq.id ? "rotate-180" : ""
                        }`}
                      >
                        <FaChevronDown className="text-white text-[10px]" />
                      </div>
                    </button>

                    <AnimatePresence>
                      {activePreviewFAQ === faq.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-red-500/20"
                        >
                          <div className="p-2 lg:p-3 bg-red-900/5">
                            <p className="text-gray-300 leading-relaxed text-[10px] lg:text-xs">
                              {faq.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                {faqs.length > 3 && (
                  <p className="text-center text-gray-500 text-[10px] lg:text-xs mt-2 lg:mt-3">
                    +{faqs.length - 3} more question
                    {faqs.length - 3 > 1 ? "s" : ""} will be shown
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {showModal && editingFAQ && (
          <FAQModal
            faq={editingFAQ}
            onSave={saveFAQ}
            onClose={() => {
              setShowModal(false);
              setEditingFAQ(null);
            }}
            onChange={setEditingFAQ}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// FAQ Modal Component
const FAQModal = ({ faq, onSave, onClose, onChange }: any) => {
  const charCount = faq.answer.length;
  const isOptimalLength = charCount >= 150 && charCount <= 300;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 lg:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-900 border-2 border-red-500/50 rounded-lg p-3 lg:p-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-3 lg:mb-4">
          <h3 className="text-base lg:text-lg font-black text-white">
            Edit FAQ
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FaTimes className="text-gray-400 text-sm" />
          </button>
        </div>

        <div className="space-y-3 lg:space-y-4">
          {/* Question */}
          <div>
            <label className="block text-[10px] lg:text-xs font-bold text-gray-300 mb-1">
              Question <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={faq.question}
              onChange={(e) => onChange({ ...faq, question: e.target.value })}
              className="w-full px-2 lg:px-3 py-2 lg:py-2.5 bg-gray-800 border-2 border-red-500/30 rounded-lg text-white font-bold text-xs lg:text-sm focus:outline-none focus:border-red-500 transition-colors"
              placeholder="What's included in the course?"
            />
            <p className="text-[9px] lg:text-[10px] text-gray-500 mt-1">
              Make it clear and specific
            </p>
          </div>

          {/* Answer */}
          <div>
            <label className="block text-[10px] lg:text-xs font-bold text-gray-300 mb-1">
              Answer <span className="text-red-500">*</span>
            </label>
            <textarea
              value={faq.answer}
              onChange={(e) => onChange({ ...faq, answer: e.target.value })}
              rows={6}
              className="w-full px-2 lg:px-3 py-2 lg:py-2.5 bg-gray-800 border-2 border-red-500/30 rounded-lg text-white text-[10px] lg:text-xs focus:outline-none focus:border-red-500 transition-colors leading-relaxed resize-none"
              placeholder="Provide a detailed, helpful answer..."
            />
            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 mt-1">
              <p
                className={`text-[9px] lg:text-[10px] font-bold ${
                  isOptimalLength ? "text-green-400" : "text-gray-500"
                }`}
              >
                {charCount} characters {isOptimalLength && "✓ Optimal"}
              </p>
              <p className="text-[9px] lg:text-[10px] text-gray-500">
                Recommended: 150-300
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-2 lg:p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <FaEye className="text-red-400 text-[10px]" />
              <h4 className="text-[10px] lg:text-xs font-bold text-gray-400">
                LIVE PREVIEW
              </h4>
            </div>
            <div className="bg-gray-900 rounded-lg p-2 lg:p-3">
              <h5 className="font-bold text-white mb-1.5 lg:mb-2 text-xs lg:text-sm">
                {faq.question || "Your question here..."}
              </h5>
              <p className="text-gray-300 text-[10px] lg:text-xs leading-relaxed">
                {faq.answer || "Your answer will appear here..."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col xs:flex-row gap-2 mt-3 lg:mt-4">
          <button
            onClick={onSave}
            disabled={!faq.question.trim() || !faq.answer.trim()}
            className="flex-1 px-4 py-2 lg:py-2.5 bg-gradient-to-r from-red-600 to-red-700 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity text-[10px] lg:text-xs flex items-center justify-center gap-1.5"
          >
            <FaSave className="text-[10px]" />
            Save FAQ
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 lg:py-2.5 bg-gray-800 border border-gray-700 rounded-lg font-bold hover:bg-gray-700 hover:border-gray-600 transition-colors text-[10px] lg:text-xs flex-1 xs:flex-initial"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FAQEditor;