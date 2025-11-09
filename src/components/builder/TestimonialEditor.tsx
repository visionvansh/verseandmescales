// components/builder/testimonial/TestimonialEditor.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaVideo,
  FaStar,
  FaEye,
  FaTimes,
  FaSave,
  FaArrowUp,
  FaArrowDown,
  FaPlay,
  FaUpload,
  FaInfoCircle,
  FaQuoteLeft,
  FaCheckCircle,
  FaClock,
  FaSpinner,
  FaFileVideo,
  FaPalette,
  FaHighlighter,
  FaMagic,
} from "react-icons/fa";

interface CustomField {
  id: string;
  label: string;
  value: string;
}

interface Testimonial {
  id: string;
  order: number;
  name: string;
  customFields: CustomField[];
  highlight: string;
  videoFile?: string;
  videoLength?: string;
}

interface TitleWord {
  text: string;
  shade?: 'none' | 'red-light' | 'red-medium' | 'red-dark' | 'red-gradient-1' | 'red-gradient-2' | 'red-gradient-3' | 'gray-light' | 'gray-medium';
}

interface TestimonialEditorProps {
  enabled: boolean;
  title: string;
  titleWords?: TitleWord[];
  testimonials: Testimonial[];
  onChange: (data: {
    enabled: boolean;
    title: string;
    titleWords?: TitleWord[];
    testimonials: Testimonial[];
  }) => void;
  showPreview?: boolean;
}

const MAX_TESTIMONIALS = 2; // Changed to 2
const MAX_CUSTOM_FIELDS = 3;

const shadeOptions = [
  { value: 'none', label: 'White', desc: 'Default', preview: 'text-white', color: 'bg-white' },
  { value: 'red-light', label: 'Red Light', desc: '400', preview: 'text-red-400', color: 'bg-red-400' },
  { value: 'red-medium', label: 'Red Medium', desc: '500', preview: 'text-red-500', color: 'bg-red-500' },
  { value: 'red-dark', label: 'Red Dark', desc: '600', preview: 'text-red-600', color: 'bg-red-600' },
  { value: 'red-gradient-1', label: 'Gradient 1', desc: '400→600', preview: 'bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent', color: 'bg-gradient-to-r from-red-400 to-red-600' },
  { value: 'red-gradient-2', label: 'Gradient 2', desc: '500→700', preview: 'bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent', color: 'bg-gradient-to-r from-red-500 to-red-700' },
  { value: 'red-gradient-3', label: 'Gradient 3', desc: '300→500', preview: 'bg-gradient-to-r from-red-300 to-red-500 bg-clip-text text-transparent', color: 'bg-gradient-to-r from-red-300 to-red-500' },
  { value: 'gray-light', label: 'Gray Light', desc: '400', preview: 'text-gray-400', color: 'bg-gray-400' },
  { value: 'gray-medium', label: 'Gray Medium', desc: '500', preview: 'text-gray-500', color: 'bg-gray-500' },
];

const getShadeClass = (shade?: string) => {
  const shades: any = {
    none: 'text-white',
    'red-light': 'text-red-400',
    'red-medium': 'text-red-500',
    'red-dark': 'text-red-600',
    'red-gradient-1': 'bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent',
    'red-gradient-2': 'bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent',
    'red-gradient-3': 'bg-gradient-to-r from-red-300 to-red-500 bg-clip-text text-transparent',
    'gray-light': 'text-gray-400',
    'gray-medium': 'text-gray-500',
  };
  return shades[shade || 'none'];
};

const ColorPicker = ({ 
  value, 
  onChange: onColorChange 
}: { 
  value: string; 
  onChange: (value: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = shadeOptions.find(opt => opt.value === value) || shadeOptions[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-2 lg:px-3 py-1.5 lg:py-2 bg-gray-900 border border-red-500/30 rounded text-white font-bold hover:border-red-500 transition-colors flex items-center justify-between text-[10px] lg:text-xs"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-3 h-3 lg:w-4 lg:h-4 rounded ${selectedOption.color} border border-white/20 flex-shrink-0`} />
          <span className="truncate">{selectedOption.label}</span>
        </div>
        <FaPalette className="text-red-400 flex-shrink-0 text-[10px]" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-50 mt-1 w-full max-w-xs bg-gray-800 border-2 border-red-500/50 rounded-lg overflow-hidden">
            <div className="p-2 bg-gray-900 border-b border-gray-700">
              <h4 className="text-xs font-bold text-white">Select Color</h4>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {shadeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onColorChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full p-2 hover:bg-gray-700 transition-colors border-b border-gray-700 text-left ${
                    value === option.value ? 'bg-red-900/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-5 h-5 rounded ${option.color} border border-white/20 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-bold text-xs truncate">{option.label}</div>
                      <div className="text-gray-400 text-[10px] truncate">{option.desc}</div>
                    </div>
                    {value === option.value && (
                      <FaCheckCircle className="text-red-500 flex-shrink-0 text-xs" />
                    )}
                  </div>
                  <div className={`text-sm font-black ${option.preview}`}>
                    PREVIEW
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const WordEditor = ({ 
  word, 
  idx, 
  totalWords,
  onUpdate,
  onDelete,
  onMove
}: {
  word: TitleWord;
  idx: number;
  totalWords: number;
  onUpdate: (idx: number, updates: Partial<TitleWord>) => void;
  onDelete: (idx: number) => void;
  onMove: (idx: number, direction: 'up' | 'down') => void;
}) => {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 lg:p-3 hover:border-red-500/50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
          Word #{idx + 1}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onMove(idx, 'up')}
            disabled={idx === 0}
            className="p-1 lg:p-1.5 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Move Left"
          >
            <FaArrowUp className="text-[10px] rotate-[-90deg]" />
          </button>
          <button
            onClick={() => onMove(idx, 'down')}
            disabled={idx === totalWords - 1}
            className="p-1 lg:p-1.5 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Move Right"
          >
            <FaArrowDown className="text-[10px] rotate-[-90deg]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 mb-1">
            Text
          </label>
          <input
            type="text"
            value={word.text}
            onChange={(e) => onUpdate(idx, { text: e.target.value.toUpperCase() })}
            className="w-full px-2 lg:px-3 py-1.5 lg:py-2 bg-gray-900 border border-red-500/30 rounded text-white font-bold text-xs lg:text-sm focus:outline-none focus:border-red-500 transition-colors"
            placeholder="WORD"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 mb-1">
            Color
          </label>
          <ColorPicker
            value={word.shade || 'none'}
            onChange={(shade) => onUpdate(idx, { shade: shade as any })}
          />
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-700 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-[10px] text-gray-500 font-bold flex-shrink-0">LIVE:</span>
          <span className={`text-base lg:text-lg xl:text-xl font-black ${getShadeClass(word.shade)} truncate`}>
            {word.text || 'WORD'}
          </span>
        </div>
        <button
          onClick={() => onDelete(idx)}
          className="p-1.5 lg:p-2 bg-red-600/20 border border-red-500/30 rounded hover:bg-red-600 hover:border-red-500 transition-all group flex-shrink-0"
          title="Delete"
        >
          <FaTrash className="text-red-400 group-hover:text-white text-[10px]" />
        </button>
      </div>
    </div>
  );
};

const TestimonialEditor: React.FC<TestimonialEditorProps> = ({
  enabled,
  title,
  titleWords,
  testimonials,
  onChange,
  showPreview = false,
}) => {
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState<'simple' | 'advanced'>('simple');

  const addTestimonial = () => {
    if (testimonials.length >= MAX_TESTIMONIALS) {
      alert(`Maximum ${MAX_TESTIMONIALS} testimonials allowed`);
      return;
    }

    const newTestimonial: Testimonial = {
      id: `testimonial-${Date.now()}`,
      order: testimonials.length,
      name: "",
      customFields: [],
      highlight: "",
    };

    setEditingTestimonial(newTestimonial);
    setShowModal(true);
  };

  const saveTestimonial = () => {
    if (!editingTestimonial) return;

    // Validation
    if (!editingTestimonial.name.trim()) {
      alert("Please enter student name");
      return;
    }

    if (!editingTestimonial.highlight.trim()) {
      alert("Please enter testimonial quote");
      return;
    }

    if (!editingTestimonial.videoFile) {
      alert("Please upload a video testimonial");
      return;
    }

    const existingIndex = testimonials.findIndex(
      (t) => t.id === editingTestimonial.id
    );
    let newTestimonials;

    if (existingIndex >= 0) {
      newTestimonials = [...testimonials];
      newTestimonials[existingIndex] = editingTestimonial;
    } else {
      newTestimonials = [...testimonials, editingTestimonial];
    }

    onChange({
      enabled,
      title,
      titleWords,
      testimonials: newTestimonials,
    });
    setShowModal(false);
    setEditingTestimonial(null);
  };

  const deleteTestimonial = (id: string) => {
    if (confirm("Delete this testimonial?")) {
      onChange({
        enabled,
        title,
        titleWords,
        testimonials: testimonials.filter((t) => t.id !== id),
      });
    }
  };

  const moveTestimonial = (index: number, direction: "up" | "down") => {
    const newTestimonials = [...testimonials];
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= testimonials.length) return;

    [newTestimonials[index], newTestimonials[newIndex]] = [
      newTestimonials[newIndex],
      newTestimonials[index],
    ];
    newTestimonials.forEach((t, i) => (t.order = i));

    onChange({
      enabled,
      title,
      titleWords,
      testimonials: newTestimonials,
    });
  };

  const convertToWords = () => {
    if (!title || !title.trim()) {
      alert('Please enter title text first');
      return;
    }

    const words = title.trim().split(/\s+/).filter(w => w.trim());
    const wordArray: TitleWord[] = words.map(word => ({
      text: word.toUpperCase(),
      shade: 'none'
    }));

    onChange({ enabled, title, titleWords: wordArray, testimonials });
  };

  const addWord = () => {
    const currentWords = titleWords || [];
    const newWord: TitleWord = { text: '', shade: 'none' };
    onChange({ enabled, title, titleWords: [...currentWords, newWord], testimonials });
  };

  const updateWord = (index: number, updates: Partial<TitleWord>) => {
    const currentWords = [...(titleWords || [])];
    currentWords[index] = { ...currentWords[index], ...updates };
    onChange({ enabled, title, titleWords: currentWords, testimonials });
  };

  const deleteWord = (index: number) => {
    const currentWords = titleWords || [];
    
    if (currentWords.length === 1) {
      onChange({ enabled, title, titleWords: [], testimonials });
      return;
    }
    
    onChange({ enabled, title, titleWords: currentWords.filter((_, i) => i !== index), testimonials });
  };

  const moveWord = (index: number, direction: 'up' | 'down') => {
    const currentWords = [...(titleWords || [])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= currentWords.length) return;

    [currentWords[index], currentWords[newIndex]] = [currentWords[newIndex], currentWords[index]];
    onChange({ enabled, title, titleWords: currentWords, testimonials });
  };

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Header with Enable Toggle */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg lg:text-xl font-black text-white mb-1 truncate">
            Testimonials Section
          </h2>
          <p className="text-gray-400 text-[10px] lg:text-xs">
            Add student success stories and video reviews
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
          <span className="text-[10px] lg:text-xs font-bold text-gray-300 hidden sm:inline">
            Enable
          </span>
          <div className="relative">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) =>
                onChange({
                  enabled: e.target.checked,
                  title,
                  titleWords,
                  testimonials,
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
          {/* Section Title Editor */}
          <div className="space-y-3 lg:space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-2 lg:p-3">
              <h3 className="text-sm lg:text-base font-bold text-white mb-2 lg:mb-3 flex items-center gap-1.5">
                <FaQuoteLeft className="text-red-400 text-xs" />
                Section Title
              </h3>

              {/* Mode Switcher */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-1 mb-3">
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => setEditMode('simple')}
                    className={`px-2 lg:px-3 py-2 lg:py-2.5 rounded font-bold transition-colors ${
                      editMode === 'simple'
                        ? 'bg-red-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <FaHighlighter className="text-[10px] lg:text-xs" />
                      <span className="text-xs">Simple</span>
                    </div>
                    <div className="text-[9px] opacity-80 hidden lg:block">
                      Quick text
                    </div>
                  </button>
                  <button
                    onClick={() => setEditMode('advanced')}
                    className={`px-2 lg:px-3 py-2 lg:py-2.5 rounded font-bold transition-colors ${
                      editMode === 'advanced'
                        ? 'bg-red-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <FaMagic className="text-[10px] lg:text-xs" />
                      <span className="text-xs">Advanced</span>
                    </div>
                    <div className="text-[9px] opacity-80 hidden lg:block">
                      Word control
                    </div>
                  </button>
                </div>
              </div>

              {/* Simple Mode */}
              {editMode === 'simple' && (
                <div>
                  <label className="block text-[10px] lg:text-xs font-bold text-gray-300 mb-1">
                    Title Text
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => onChange({ enabled, title: e.target.value, titleWords, testimonials })}
                    className="w-full px-2 lg:px-3 py-1.5 lg:py-2 bg-gray-800 border-2 border-red-500/30 rounded text-white font-bold text-[10px] lg:text-xs focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="HEAR IT FROM OUR LEARNERS"
                  />
                </div>
              )}

              {/* Advanced Mode */}
              {editMode === 'advanced' && (
                <div className="space-y-2 lg:space-y-3">
                  {titleWords && titleWords.length > 0 ? (
                    <>
                      {titleWords.map((word: TitleWord, idx: number) => (
                        <WordEditor
                          key={idx}
                          word={word}
                          idx={idx}
                          totalWords={titleWords.length}
                          onUpdate={updateWord}
                          onDelete={deleteWord}
                          onMove={moveWord}
                        />
                      ))}

                      <button
                        onClick={addWord}
                        className="w-full px-3 lg:px-4 py-2 lg:py-2.5 bg-gray-800 border-2 border-dashed border-red-500/30 rounded text-red-400 hover:bg-red-900/10 hover:border-red-500 transition-all font-bold flex items-center justify-center gap-2 text-xs"
                      >
                        <FaPlus className="text-[10px]" />
                        Add Another Word
                      </button>
                    </>
                  ) : (
                    <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg p-3 lg:p-4 text-center">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <FaPlus className="text-red-400 text-sm lg:text-base" />
                      </div>
                      <p className="text-gray-300 mb-1 font-bold text-xs lg:text-sm">
                        Start Creating Title
                      </p>
                      <p className="text-gray-500 text-[10px] lg:text-xs mb-2 lg:mb-3">
                        Add words or convert existing text
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-2 justify-center items-stretch sm:items-center">
                        <button
                          onClick={addWord}
                          className="px-3 lg:px-4 py-1.5 lg:py-2 bg-red-600 rounded font-bold hover:bg-red-700 transition-colors inline-flex items-center justify-center gap-1.5 text-xs"
                        >
                          <FaPlus className="text-[10px]" /> Add Word
                        </button>

                        {title && title.trim() && (
                          <>
                            <span className="text-gray-500 text-xs hidden sm:inline">or</span>
                            <button
                              onClick={convertToWords}
                              className="px-3 lg:px-4 py-1.5 lg:py-2 bg-gray-700 border border-gray-600 rounded font-bold hover:bg-gray-600 transition-colors inline-flex items-center justify-center gap-1.5 text-xs"
                            >
                              <FaMagic className="text-[10px]" /> Convert Text
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Testimonials Section */}
          <div className="bg-gray-900 border-2 border-gray-800 rounded-lg p-2 lg:p-3">
            <div className="flex items-center justify-between gap-2 mb-2 lg:mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm lg:text-base font-bold text-white mb-0.5 truncate">
                  Student Testimonials
                </h3>
                <p className="text-[10px] lg:text-xs text-gray-400">
                  {testimonials.length}/{MAX_TESTIMONIALS} testimonials
                </p>
              </div>
              <button
                onClick={addTestimonial}
                disabled={testimonials.length >= MAX_TESTIMONIALS}
                className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded font-bold transition-all flex items-center gap-1.5 text-[10px] lg:text-xs flex-shrink-0 ${
                  testimonials.length >= MAX_TESTIMONIALS
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed border-2 border-gray-600"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                <FaPlus className="text-[10px]" />
                <span className="hidden xs:inline">Add</span>
                {testimonials.length >= MAX_TESTIMONIALS && (
                  <span className="text-[9px]">(Max)</span>
                )}
              </button>
            </div>

            {testimonials.length === 0 ? (
              <div className="text-center py-6 lg:py-8 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg">
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-2 lg:mb-3">
                  <FaStar className="text-2xl lg:text-3xl text-red-400" />
                </div>
                <p className="text-gray-400 mb-1 font-bold text-xs lg:text-sm">
                  No testimonials yet
                </p>
                <p className="text-gray-500 text-[10px] lg:text-xs mb-3 lg:mb-4 px-4">
                  Add student success stories and video reviews
                </p>
                <button
                  onClick={addTestimonial}
                  className="px-4 lg:px-6 py-2 lg:py-2.5 bg-red-600 rounded font-bold hover:bg-red-700 transition-colors text-[10px] lg:text-xs inline-flex items-center gap-1.5"
                >
                  <FaPlus className="text-[10px]" />
                  Add Your First Testimonial
                </button>
              </div>
            ) : (
              <div className="space-y-2 lg:space-y-2.5">
                {testimonials.map((testimonial, index) => (
                  <motion.div
                    key={testimonial.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-2 lg:p-2.5 hover:border-red-500/50 transition-all"
                  >
                    <div className="flex items-center gap-2 lg:gap-3">
                      <div className="flex items-center gap-2 lg:gap-3 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <h4 className="text-xs lg:text-sm font-bold text-white truncate">
                              {testimonial.name || 'Unnamed Student'}
                            </h4>
                            <span className="bg-red-600 text-white px-1.5 py-0.5 rounded-full text-[9px] lg:text-[10px] font-bold flex-shrink-0">
                              #{index + 1}
                            </span>
                          </div>
                          {testimonial.customFields.length > 0 && (
                            <p className="text-[10px] lg:text-xs text-gray-400 mb-1 line-clamp-1">
                              {testimonial.customFields
                                .map((f) => f.value)
                                .join(" • ")}
                            </p>
                          )}
                          <div className="flex items-start gap-1">
                            <FaQuoteLeft className="text-red-400 text-[9px] flex-shrink-0 mt-0.5" />
                            <p className="text-[10px] lg:text-xs text-gray-300 italic line-clamp-1">
                              {testimonial.highlight || 'No quote added'}
                            </p>
                          </div>
                          {testimonial.videoFile && (
                            <div className="mt-1 flex items-center gap-1">
                              <FaCheckCircle className="text-green-400 text-[9px]" />
                              <span className="text-[9px] lg:text-[10px] text-gray-500">
                                Video attached
                                {testimonial.videoLength &&
                                  ` • ${testimonial.videoLength}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => moveTestimonial(index, "up")}
                          disabled={index === 0}
                          className="p-1.5 lg:p-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move Up"
                        >
                          <FaArrowUp className="text-[10px]" />
                        </button>
                        <button
                          onClick={() => moveTestimonial(index, "down")}
                          disabled={index === testimonials.length - 1}
                          className="p-1.5 lg:p-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move Down"
                        >
                          <FaArrowDown className="text-[10px]" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingTestimonial(testimonial);
                            setShowModal(true);
                          }}
                          className="p-1.5 lg:p-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                          title="Edit"
                        >
                          <FaEdit className="text-[10px]" />
                        </button>
                        <button
                          onClick={() => deleteTestimonial(testimonial.id)}
                          className="p-1.5 lg:p-2 bg-red-600/20 border border-red-500/30 rounded hover:bg-red-600 hover:border-red-500 transition-all group"
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

          {/* Full Preview */}
          {showPreview && testimonials.length > 0 && (
            <div className="bg-black border-4 border-red-500/60 rounded-lg p-2 lg:p-3">
              <div className="flex items-center justify-between mb-2 lg:mb-3">
                <h3 className="text-[9px] lg:text-[10px] font-bold text-gray-400 flex items-center gap-1">
                  <FaEye className="text-red-400 text-[10px]" /> FULL PREVIEW
                </h3>
                <div className="text-[9px] lg:text-[10px] text-gray-500">
                  {testimonials.length} Testimonial
                  {testimonials.length > 1 ? "s" : ""}
                </div>
              </div>

              <div className="mb-3 lg:mb-4 text-center">
                <h2 className="text-xl lg:text-2xl font-black leading-tight">
                  {titleWords && titleWords.length > 0 ? (
                    <>
                      {titleWords.map((word: TitleWord, i: number) => (
                        <span key={i} className={`${getShadeClass(word.shade)} mr-1`}>
                          {word.text}
                        </span>
                      ))}
                    </>
                  ) : (
                    <span className="text-white">{title || 'TESTIMONIALS'}</span>
                  )}
                </h2>
              </div>

              <TestimonialPreview testimonial={testimonials[0]} />

              {testimonials.length > 1 && (
                <p className="text-center mt-2 lg:mt-3 text-[10px] lg:text-xs text-gray-400">
                  + {testimonials.length - 1} more testimonial
                  {testimonials.length - 1 > 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {showModal && editingTestimonial && (
          <TestimonialModal
            testimonial={editingTestimonial}
            onSave={saveTestimonial}
            onClose={() => {
              setShowModal(false);
              setEditingTestimonial(null);
            }}
            onChange={setEditingTestimonial}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Testimonial Modal Component (keep the same as before)
const TestimonialModal = ({ testimonial, onSave, onClose, onChange }: any) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const extractVideoDuration = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      
      let hasResolved = false;
      
      const timeout = setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          URL.revokeObjectURL(video.src);
          reject(new Error('Metadata extraction timeout'));
        }
      }, 15000);

      video.onloadedmetadata = () => {
        if (!hasResolved) {
          hasResolved = true;
          clearTimeout(timeout);
          
          const durationFormatted = formatDuration(video.duration);
          URL.revokeObjectURL(video.src);
          resolve(durationFormatted);
        }
      };

      video.onerror = () => {
        if (!hasResolved) {
          hasResolved = true;
          clearTimeout(timeout);
          URL.revokeObjectURL(video.src);
          reject(new Error('Failed to load video'));
        }
      };

      try {
        video.src = URL.createObjectURL(file);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  };

  const uploadToCloudinary = async (
    file: File,
    onProgress: (progress: number) => void
  ): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error('Configuration missing. Please add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to your .env.local file.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('resource_type', 'video');
    formData.append('folder', 'testimonial-videos');

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.secure_url) {
              resolve(response.secure_url);
            } else {
              reject(new Error('No URL returned from upload'));
            }
          } catch (error) {
            reject(new Error('Failed to parse upload response'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.error?.message || `Upload failed with status: ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload. Please check your internet connection.'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload was cancelled'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timed out. Please try again.'));
      });

      xhr.timeout = 600000;
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`);
      xhr.send(formData);
    });
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      alert("Please upload a video file");
      return;
    }

    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Video file is too large. Maximum size is 500MB');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      console.log('Starting video processing...');

      let extractedDuration = '';
      
      try {
        extractedDuration = await extractVideoDuration(file);
        console.log('Video duration extracted:', extractedDuration);
        
        onChange({ ...testimonial, videoLength: extractedDuration });
      } catch (metadataError) {
        console.warn('Could not extract video duration:', metadataError);
      }

      const uploadedUrl = await uploadToCloudinary(file, (progress) => {
        setUploadProgress(progress);
      });

      console.log('Video uploaded:', uploadedUrl);

      onChange({ 
        ...testimonial, 
        videoFile: uploadedUrl,
        videoLength: extractedDuration
      });

      console.log('Upload complete!');

    } catch (error) {
      console.error('Error uploading video:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to upload video: ${errorMessage}
Please check your configuration and try again.`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const addCustomField = () => {
    if (testimonial.customFields.length >= MAX_CUSTOM_FIELDS) {
      alert(`Maximum ${MAX_CUSTOM_FIELDS} information fields allowed`);
      return;
    }

    const newField: CustomField = {
      id: `field-${Date.now()}`,
      label: "",
      value: "",
    };

    onChange({
      ...testimonial,
      customFields: [...testimonial.customFields, newField],
    });
  };

  const updateCustomField = (id: string, updates: Partial<CustomField>) => {
    const updatedFields = testimonial.customFields.map((field: CustomField) =>
      field.id === id ? { ...field, ...updates } : field
    );
    onChange({ ...testimonial, customFields: updatedFields });
  };

  const deleteCustomField = (id: string) => {
    onChange({
      ...testimonial,
      customFields: testimonial.customFields.filter((f: CustomField) => f.id !== id),
    });
  };

  const clearVideo = () => {
    onChange({ ...testimonial, videoFile: undefined, videoLength: undefined });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 lg:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-900 border-2 border-red-500/50 rounded-lg p-3 lg:p-4 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-3 lg:mb-4">
          <h3 className="text-base lg:text-lg font-black text-white">
            Edit Testimonial
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-800 rounded transition-colors"
          >
            <FaTimes className="text-gray-400 text-sm" />
          </button>
        </div>

        <div className="space-y-3 lg:space-y-4">
          {/* Name */}
          <div>
            <label className="block text-[10px] lg:text-xs font-bold text-gray-300 mb-1">
              Student Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={testimonial.name}
              onChange={(e) =>
                onChange({ ...testimonial, name: e.target.value })
              }
              className="w-full px-2 lg:px-3 py-1.5 lg:py-2 bg-gray-800 border border-red-500/30 rounded text-white font-bold text-xs lg:text-sm focus:outline-none focus:border-red-500 transition-colors"
              placeholder="John Smith"
            />
          </div>

          {/* Custom Fields */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] lg:text-xs font-bold text-gray-300">
                Student Information Fields
              </label>
              <button
                onClick={addCustomField}
                disabled={testimonial.customFields.length >= MAX_CUSTOM_FIELDS}
                className={`px-2 py-1 rounded font-bold text-[10px] flex items-center gap-1 ${
                  testimonial.customFields.length >= MAX_CUSTOM_FIELDS
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                <FaPlus className="text-[9px]" />
                Add ({testimonial.customFields.length}/{MAX_CUSTOM_FIELDS})
              </button>
            </div>

            {testimonial.customFields.length === 0 ? (
              <div className="text-center py-4 bg-gray-800 border-2 border-dashed border-gray-700 rounded">
                <FaInfoCircle className="text-gray-600 text-2xl mx-auto mb-2" />
                <p className="text-gray-500 text-xs mb-2">No information fields added</p>
                <button
                  onClick={addCustomField}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded font-bold text-xs inline-flex items-center gap-1"
                >
                  <FaPlus className="text-[9px]" />
                  Add Field
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {testimonial.customFields.map((field: CustomField, index: number) => (
                  <div
                    key={field.id}
                    className="bg-gray-800/50 border border-red-500/30 rounded-lg p-2"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-[9px] font-bold">
                        Field #{index + 1}
                      </span>
                      <button
                        onClick={() => deleteCustomField(field.id)}
                        className="p-1 bg-red-600/20 border border-red-500/30 rounded hover:bg-red-600 transition-all group"
                        title="Delete"
                      >
                        <FaTrash className="text-red-400 group-hover:text-white text-[9px]" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] text-gray-500 font-bold mb-1">
                          Field Label
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) =>
                            updateCustomField(field.id, { label: e.target.value })
                          }
                          className="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded text-white text-[10px] focus:outline-none focus:border-red-500 transition-colors"
                          placeholder="e.g., Niche"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-gray-500 font-bold mb-1">
                          Value
                        </label>
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) =>
                            updateCustomField(field.id, { value: e.target.value })
                          }
                          className="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded text-white text-[10px] focus:outline-none focus:border-red-500 transition-colors"
                          placeholder="e.g., Fitness"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[9px] lg:text-[10px] text-gray-500 mt-1.5 flex items-center gap-1">
              <FaInfoCircle className="text-red-400 text-[10px]" />
              Add up to {MAX_CUSTOM_FIELDS} custom information fields
            </p>
          </div>

          {/* Highlight Quote - REQUIRED */}
          <div>
            <label className="block text-[10px] lg:text-xs font-bold text-gray-300 mb-1">
              Main Testimonial Quote <span className="text-red-500">*</span>
            </label>
            <textarea
              value={testimonial.highlight}
              onChange={(e) =>
                onChange({ ...testimonial, highlight: e.target.value })
              }
              rows={3}
              required
              className="w-full px-2 lg:px-3 py-1.5 lg:py-2 bg-gray-800 border border-red-500/30 rounded text-white text-[10px] lg:text-xs focus:outline-none focus:border-red-500 transition-colors resize-none"
              placeholder="This course completely transformed my life and career..."
            />
            <p className="text-[9px] lg:text-[10px] text-gray-500 mt-1">
              The main quote that will be displayed
            </p>
          </div>

          {/* Video Upload - REQUIRED */}
          <div>
            <label className="block text-[10px] lg:text-xs font-bold text-gray-300 mb-1.5 lg:mb-2">
              Video Testimonial <span className="text-red-500">*</span>
            </label>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/mov,video/avi,video/webm,video/*"
              onChange={handleVideoUpload}
              disabled={isUploading}
              className="hidden"
            />

            {isUploading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-2 border-red-500/30 rounded-lg p-3 lg:p-4 text-center"
              >
                <FaSpinner className="animate-spin text-red-500 text-xl lg:text-2xl mx-auto mb-2 lg:mb-3" />
                <p className="text-white font-bold text-xs lg:text-sm mb-2">Uploading...</p>
                <div className="w-full bg-gray-700 rounded-full h-1.5 lg:h-2 mb-1.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full transition-all duration-300"
                  />
                </div>
                <p className="text-gray-400 text-[10px] lg:text-xs font-bold">{Math.round(uploadProgress)}%</p>
                <p className="text-gray-500 text-[9px] lg:text-[10px] mt-2">
                  {uploadProgress < 30 && "Starting upload..."}
                  {uploadProgress >= 30 && uploadProgress < 70 && "Uploading your video..."}
                  {uploadProgress >= 70 && uploadProgress < 100 && "Almost done..."}
                  {uploadProgress === 100 && "Processing..."}
                </p>
              </motion.div>
            ) : testimonial.videoFile ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border-2 border-green-500/30 bg-green-900/10 rounded-lg p-2 lg:p-3"
              >
                <div className="relative">
                  <div className="aspect-video w-full overflow-hidden rounded-lg mb-2 bg-black">
                    <video
                      src={testimonial.videoFile}
                      controls
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1 text-green-400 text-[10px]">
                    <FaCheckCircle className="text-[9px]" />
                    <span>Video uploaded</span>
                  </div>
                  {testimonial.videoLength && (
                    <div className="flex items-center gap-1 text-gray-400 text-[10px]">
                      <FaClock className="text-[9px]" />
                      <span>{testimonial.videoLength}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded font-bold text-[10px] transition-colors"
                  >
                    Replace Video
                  </button>
                  <button
                    onClick={clearVideo}
                    className="px-3 py-1.5 bg-red-600/20 border border-red-500/30 hover:bg-red-600 rounded font-bold text-[10px] transition-colors flex items-center gap-1"
                  >
                    <FaTimes className="text-[9px]" /> Clear
                  </button>
                </div>
              </motion.div>
            ) : (
              <div 
                className="border-2 border-dashed border-red-500/30 hover:border-red-500/60 rounded-lg p-3 lg:p-4 text-center transition-colors cursor-pointer group"
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-red-600/30 transition-colors">
                  <FaFileVideo className="text-red-400 text-base lg:text-xl" />
                </div>
                <p className="text-white font-bold text-xs lg:text-sm mb-1">
                  Click to upload video
                </p>
                <p className="text-gray-400 text-[10px] lg:text-xs mb-2 lg:mb-3">
                  MP4, MOV, AVI, WebM • Max 500MB
                </p>
                <button
                  type="button"
                  className="px-3 lg:px-4 py-1.5 lg:py-2 bg-gradient-to-r from-red-600 to-red-700 hover:opacity-90 text-white font-bold rounded-lg transition-opacity text-[10px] lg:text-xs inline-flex items-center gap-1.5"
                >
                  <FaUpload className="text-[9px]" />
                  Choose Video File
                </button>
              </div>
            )}

            <p className="text-[9px] lg:text-[10px] text-gray-500 mt-1.5 flex items-center gap-1">
              <FaInfoCircle className="text-red-400 text-[10px]" />
              Video duration is automatically detected
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-3 lg:mt-4">
          <button
            onClick={onSave}
            disabled={!testimonial.name.trim() || !testimonial.highlight.trim() || !testimonial.videoFile}
            className="flex-1 px-4 py-2 lg:py-2.5 bg-red-600 rounded font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[10px] lg:text-xs flex items-center justify-center gap-1.5"
          >
            <FaSave className="text-[10px]" />
            Save Testimonial
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 lg:py-2.5 bg-gray-800 border border-gray-700 rounded font-bold hover:bg-gray-700 hover:border-gray-600 transition-colors text-[10px] lg:text-xs"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Testimonial Preview Component
const TestimonialPreview = ({ testimonial }: { testimonial: Testimonial }) => {
  return (
    <div className="bg-gray-900/90 border-2 border-red-500/40 rounded-lg overflow-hidden">
      {/* Video Preview */}
      {testimonial.videoFile ? (
        <div className="relative aspect-video bg-gray-900">
          <video
            src={testimonial.videoFile}
            controls
            className="w-full h-full object-cover"
          />
          {testimonial.videoLength && (
            <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded-full border border-red-500/30">
              <span className="text-white font-bold text-[9px] lg:text-[10px] flex items-center gap-1">
                <FaClock className="text-red-400" />
                {testimonial.videoLength}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="relative aspect-video bg-gray-900">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-red-600 rounded-full flex items-center justify-center">
              <FaPlay className="text-white text-base lg:text-xl ml-1" />
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-2 lg:p-3 border-t border-red-500/20">
        <div className="mb-2">
          <h3 className="text-base lg:text-lg font-black text-white mb-1">
            {testimonial.name || 'Student Name'}
          </h3>
          {testimonial.customFields.length > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] lg:text-xs flex-wrap">
              {testimonial.customFields.map((field: CustomField, idx: number) => (
                <React.Fragment key={field.id}>
                  <span className="text-gray-400">
                    {field.value}
                  </span>
                  {idx < testimonial.customFields.length - 1 && (
                    <span className="text-gray-600">•</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Results Grid */}
        {testimonial.customFields.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5 lg:gap-2 mb-2">
            {testimonial.customFields.slice(0, 2).map((field: CustomField) => (
              <div
                key={field.id}
                className="bg-red-900/20 border border-red-500/30 rounded p-1.5 lg:p-2"
              >
                <div className="text-red-400 text-[9px] lg:text-[10px] mb-0.5 font-bold">
                  {field.label}
                </div>
                <div className="text-white font-black text-sm lg:text-base">
                  {field.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quote */}
        <div className="bg-gray-900/50 border border-red-500/20 rounded p-2 lg:p-2.5">
          <FaStar className="text-red-400 text-base lg:text-lg mb-1.5 lg:mb-2" />
          <p className="text-gray-300 italic text-[10px] lg:text-xs leading-relaxed">
            "{testimonial.highlight || 'Testimonial quote will appear here'}"
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestimonialEditor;