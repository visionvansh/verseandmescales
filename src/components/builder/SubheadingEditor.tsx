// components/builder/SubheadingEditor.tsx
'use client';

import React, { useState } from 'react';
import { FaPlus, FaTrash, FaHighlighter, FaArrowUp, FaArrowDown, FaInfoCircle, FaMagic, FaEye, FaPalette, FaCheckCircle, FaQuoteRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface SubheadingWord {
  text: string;
  shade?: 'none' | 'red-light' | 'red-medium' | 'red-dark' | 'red-gradient-1' | 'red-gradient-2' | 'red-gradient-3' | 'gray-light' | 'gray-medium';
}

interface SubheadingEditorProps {
  data: {
    text: string;
    highlightedWords: string[];
    highlightedSentences: string[];
    words?: SubheadingWord[];
  };
  lines: number;
  onChange: (data: any) => void;
  onLinesChange: (lines: number) => void;
  showPreview?: boolean;
}

const SubheadingEditor: React.FC<SubheadingEditorProps> = ({ 
  data, 
  lines, 
  onChange, 
  onLinesChange,
  showPreview = false
}) => {
  const [editMode, setEditMode] = useState<'simple' | 'advanced'>('simple');
  const [highlightInput, setHighlightInput] = useState('');
  const [sentenceInput, setSentenceInput] = useState('');

  const getShadeClass = (shade?: string) => {
    const shades: any = {
      none: 'text-gray-300',
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

  const shadeOptions = [
    { value: 'none', label: 'Gray', desc: 'Default (300)', preview: 'text-gray-300', color: 'bg-gray-300' },
    { value: 'red-light', label: 'Red Light', desc: 'Soft (400)', preview: 'text-red-400', color: 'bg-red-400' },
    { value: 'red-medium', label: 'Red Medium', desc: 'Bold (500)', preview: 'text-red-500', color: 'bg-red-500' },
    { value: 'red-dark', label: 'Red Dark', desc: 'Deep (600)', preview: 'text-red-600', color: 'bg-red-600' },
    { value: 'red-gradient-1', label: 'Gradient Light', desc: '400→600', preview: 'bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent', color: 'bg-gradient-to-r from-red-400 to-red-600' },
    { value: 'red-gradient-2', label: 'Gradient Dark', desc: '500→700', preview: 'bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent', color: 'bg-gradient-to-r from-red-500 to-red-700' },
    { value: 'red-gradient-3', label: 'Gradient Soft', desc: '300→500', preview: 'bg-gradient-to-r from-red-300 to-red-500 bg-clip-text text-transparent', color: 'bg-gradient-to-r from-red-300 to-red-500' },
    { value: 'gray-light', label: 'Gray Light', desc: 'Muted (400)', preview: 'text-gray-400', color: 'bg-gray-400' },
    { value: 'gray-medium', label: 'Gray Medium', desc: 'Dark (500)', preview: 'text-gray-500', color: 'bg-gray-500' },
  ];

  const convertToWords = () => {
    const text = data.text;
    if (!text || !text.trim()) {
      alert('Please enter text first');
      return;
    }

    const words = text.split(' ').filter(w => w.trim());
    const wordArray: SubheadingWord[] = words.map(word => ({
      text: word,
      shade: data.highlightedWords?.includes(word) ? 'red-gradient-1' : 'none'
    }));

    onChange({ ...data, words: wordArray });
  };

  const handleTextChange = (value: string) => {
    onChange({ ...data, text: value });
  };

  const addHighlight = () => {
    const word = highlightInput.trim();
    if (word && !data.highlightedWords.includes(word)) {
      onChange({ ...data, highlightedWords: [...data.highlightedWords, word] });
      setHighlightInput('');
    }
  };

  const removeHighlight = (word: string) => {
    onChange({
      ...data,
      highlightedWords: data.highlightedWords.filter((w) => w !== word),
    });
  };

  const addSentenceHighlight = () => {
    const sentence = sentenceInput.trim();
    if (sentence && !data.highlightedSentences?.includes(sentence)) {
      onChange({ 
        ...data, 
        highlightedSentences: [...(data.highlightedSentences || []), sentence] 
      });
      setSentenceInput('');
    }
  };

  const removeSentenceHighlight = (sentence: string) => {
    onChange({
      ...data,
      highlightedSentences: (data.highlightedSentences || []).filter((s) => s !== sentence),
    });
  };

  const addWord = () => {
    const currentWords = data.words || [];
    onChange({ ...data, words: [...currentWords, { text: '', shade: 'none' }] });
  };

  const updateWord = (index: number, updates: Partial<SubheadingWord>) => {
    const currentWords = [...(data.words || [])];
    currentWords[index] = { ...currentWords[index], ...updates };
    onChange({ ...data, words: currentWords });
  };

  const deleteWord = (index: number) => {
    const currentWords = data.words || [];
    
    if (currentWords.length === 1) {
      onChange({ ...data, words: [] });
      return;
    }
    
    onChange({ ...data, words: currentWords.filter((_: any, i: number) => i !== index) });
  };

  const moveWord = (index: number, direction: 'up' | 'down') => {
    const currentWords = [...(data.words || [])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= currentWords.length) return;

    [currentWords[index], currentWords[newIndex]] = [currentWords[newIndex], currentWords[index]];
    onChange({ ...data, words: currentWords });
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
          className="w-full px-2 xs:px-3 lg:px-2.5 xl:px-3 py-1.5 xs:py-2 lg:py-1.5 xl:py-2 bg-gray-900 border border-red-500/30 rounded-lg text-white font-bold hover:border-red-500 transition-colors flex items-center justify-between text-[10px] xs:text-xs lg:text-[10px] xl:text-xs"
        >
          <div className="flex items-center gap-1.5 xs:gap-2 lg:gap-1.5 xl:gap-2 min-w-0">
            <div className={`w-4 h-4 xs:w-5 xs:h-5 lg:w-4 lg:h-4 xl:w-5 xl:h-5 rounded ${selectedOption.color} border border-white/20 flex-shrink-0`} />
            <span className="truncate">{selectedOption.label}</span>
          </div>
          <FaPalette className="text-red-400 flex-shrink-0 text-[10px] xs:text-xs" />
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 mt-2 w-full max-w-xs bg-gray-800 border-2 border-red-500/50 rounded-lg shadow-2xl overflow-hidden"
              >
                <div className="p-2 xs:p-2.5 lg:p-2 xl:p-2.5 bg-gray-900 border-b border-gray-700">
                  <h4 className="text-[10px] xs:text-xs lg:text-[10px] xl:text-xs font-bold text-white">Select Color</h4>
                </div>
                <div className="max-h-56 xs:max-h-64 lg:max-h-56 xl:max-h-64 overflow-y-auto">
                  {shadeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onColorChange(option.value);
                        setIsOpen(false);
                      }}
                      className={`w-full p-2 xs:p-3 lg:p-2 xl:p-3 hover:bg-gray-700 transition-colors border-b border-gray-700 text-left ${
                        value === option.value ? 'bg-red-900/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 xs:gap-2.5 lg:gap-2 xl:gap-2.5 mb-1.5">
                        <div className={`w-5 h-5 xs:w-6 xs:h-6 lg:w-5 lg:h-5 xl:w-6 xl:h-6 rounded ${option.color} border border-white/20 flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-bold text-[10px] xs:text-xs lg:text-[10px] xl:text-xs truncate">{option.label}</div>
                          <div className="text-gray-400 text-[9px] xs:text-[10px] lg:text-[9px] xl:text-[10px] truncate">{option.desc}</div>
                        </div>
                        {value === option.value && (
                          <FaCheckCircle className="text-red-500 flex-shrink-0 text-xs" />
                        )}
                      </div>
                      <div className={`text-sm xs:text-base lg:text-sm xl:text-base font-bold ${option.preview}`}>
                        PREVIEW TEXT
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

  const renderWordEditor = () => {
    const words = data.words || [];

    if (words.length === 0) {
      return (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-dashed border-gray-600 rounded-lg p-3 xs:p-4 lg:p-3 xl:p-5 text-center">
          <div className="w-10 h-10 xs:w-12 xs:h-12 lg:w-10 lg:h-10 xl:w-12 xl:h-12 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-2 xs:mb-3 lg:mb-2 xl:mb-3">
            <FaPlus className="text-red-400 text-base xs:text-lg lg:text-base xl:text-lg" />
          </div>
          <p className="text-gray-300 mb-1 xs:mb-1.5 lg:mb-1 xl:mb-1.5 font-bold text-[10px] xs:text-xs lg:text-[10px] xl:text-sm">
            Start Creating Subheading
          </p>
          <p className="text-gray-500 text-[9px] xs:text-[10px] lg:text-[9px] xl:text-xs mb-2 xs:mb-3 lg:mb-2 xl:mb-3">
            Add words directly or convert from Simple Mode
          </p>
          
          <div className="flex flex-col xs:flex-row gap-1.5 xs:gap-2 lg:gap-1.5 xl:gap-2 justify-center items-stretch xs:items-center">
            <button
              onClick={() => addWord()}
              className="px-3 xs:px-4 lg:px-3 xl:px-4 py-1.5 xs:py-2 lg:py-1.5 xl:py-2 bg-gradient-to-r from-red-600 to-red-700 rounded-lg font-bold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-1.5 text-[10px] xs:text-xs lg:text-[10px] xl:text-xs"
            >
              <FaPlus className="text-[9px] xs:text-[10px]" /> Add Word
            </button>

            {data.text && (
              <>
                <span className="text-gray-500 text-[10px] hidden xs:inline">or</span>
                <button
                  onClick={() => convertToWords()}
                  className="px-3 xs:px-4 lg:px-3 xl:px-4 py-1.5 xs:py-2 lg:py-1.5 xl:py-2 bg-gray-700 border border-gray-600 rounded-lg font-bold hover:bg-gray-600 transition-colors inline-flex items-center justify-center gap-1.5 text-[10px] xs:text-xs lg:text-[10px] xl:text-xs"
                >
                  <FaMagic className="text-[9px] xs:text-[10px]" /> Convert Text
                </button>
              </>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2 xs:space-y-3 lg:space-y-2 xl:space-y-3">
        {words.map((word: SubheadingWord, idx: number) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-2 xs:p-3 lg:p-2 xl:p-3 hover:border-red-500/50 transition-all"
          >
            <div className="flex items-center justify-between mb-1.5 xs:mb-2 lg:mb-1.5 xl:mb-2">
              <span className="bg-red-600 text-white px-1.5 xs:px-2 lg:px-1.5 xl:px-2 py-0.5 xs:py-1 lg:py-0.5 xl:py-1 rounded-full text-[9px] xs:text-[10px] lg:text-[9px] xl:text-[10px] font-bold">
                Word #{idx + 1}
              </span>
              <div className="flex gap-0.5 xs:gap-1 lg:gap-0.5 xl:gap-1">
                <button
                  onClick={() => moveWord(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1 xs:p-1.5 lg:p-1 xl:p-1.5 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move Left"
                >
                  <FaArrowUp className="text-[9px] xs:text-[10px] lg:text-[9px] xl:text-[10px] rotate-[-90deg]" />
                </button>
                <button
                  onClick={() => moveWord(idx, 'down')}
                  disabled={idx === words.length - 1}
                  className="p-1 xs:p-1.5 lg:p-1 xl:p-1.5 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move Right"
                >
                  <FaArrowDown className="text-[9px] xs:text-[10px] lg:text-[9px] xl:text-[10px] rotate-[-90deg]" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 xs:gap-3 lg:gap-2 xl:gap-3">
              <div>
                <label className="block text-[9px] xs:text-[10px] lg:text-[9px] xl:text-[10px] font-bold text-gray-400 mb-1">
                  Text
                </label>
                <input
                  type="text"
                  value={word.text}
                  onChange={(e) =>
                    updateWord(idx, { text: e.target.value })
                  }
                  className="w-full px-2 xs:px-3 lg:px-2 xl:px-3 py-1.5 xs:py-2 lg:py-1.5 xl:py-2 bg-gray-900 border border-red-500/30 rounded-lg text-white font-medium text-xs xs:text-sm lg:text-xs xl:text-sm focus:outline-none focus:border-red-500 transition-colors"
                  placeholder=""
                />
              </div>

              <div>
                <label className="block text-[9px] xs:text-[10px] lg:text-[9px] xl:text-[10px] font-bold text-gray-400 mb-1">
                  Color
                </label>
                <ColorPicker
                  value={word.shade || 'none'}
                  onChange={(shade) => updateWord(idx, { shade: shade as any })}
                />
              </div>
            </div>

            <div className="mt-2 xs:mt-3 lg:mt-2 xl:mt-3 pt-2 xs:pt-3 lg:pt-2 xl:pt-3 border-t border-gray-700 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 xs:gap-2 lg:gap-1.5 xl:gap-2 flex-1 min-w-0">
                <span className="text-[9px] xs:text-[10px] lg:text-[9px] xl:text-[10px] text-gray-500 font-bold flex-shrink-0">LIVE:</span>
                <span className={`text-xs xs:text-sm lg:text-xs xl:text-base font-medium ${getShadeClass(word.shade)} truncate`}>
                  {word.text || 'word'}
                </span>
              </div>
              <button
                onClick={() => deleteWord(idx)}
                className="p-1.5 xs:p-2 lg:p-1.5 xl:p-2 bg-red-600/20 border border-red-500/30 rounded-lg hover:bg-red-600 hover:border-red-500 transition-all group flex-shrink-0"
                title="Delete"
              >
                <FaTrash className="text-red-400 group-hover:text-white text-[10px] xs:text-xs lg:text-[10px] xl:text-xs" />
              </button>
            </div>
          </motion.div>
        ))}

        <button
          onClick={() => addWord()}
          className="w-full px-3 xs:px-4 lg:px-3 xl:px-4 py-2 xs:py-3 lg:py-2 xl:py-3 bg-gray-800 border-2 border-dashed border-red-500/30 rounded-lg text-red-400 hover:bg-red-900/10 hover:border-red-500 transition-all font-bold flex items-center justify-center gap-1.5 xs:gap-2 lg:gap-1.5 xl:gap-2 text-[10px] xs:text-xs lg:text-[10px] xl:text-xs"
        >
          <FaPlus />
          Add Another Word
        </button>
      </div>
    );
  };

  const extractSentences = () => {
    const sentences = data.text.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.map(s => s.trim()).filter(s => s.length > 0);
  };

  const renderHighlightedText = () => {
    let text = data.text;

    // Highlight sentences first
    (data.highlightedSentences || []).forEach((sentence) => {
      const escapedSentence = sentence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedSentence})`, "gi");
      text = text.replace(
        regex,
        '<span class="text-red-400 font-bold">$1</span>'
      );
    });

    // Then highlight words
    data.highlightedWords.forEach((word) => {
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(
        `(?![^<]*>)(?!<span class="text-red-400 font-bold">)(${escapedWord})(?![^<]*<\\/span>)`,
        "gi"
      );
      text = text.replace(
        regex,
        '<span class="text-red-400 font-bold">$1</span>'
      );
    });

    return text;
  };

  return (
    <div className="space-y-3 xs:space-y-4 lg:space-y-3 xl:space-y-4">
      {/* Header */}
      <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-2 xs:gap-3 lg:gap-2 xl:gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-base xs:text-xl lg:text-base xl:text-2xl font-black text-white mb-0.5 xs:mb-1 lg:mb-0.5 xl:mb-1 truncate">
            Subheading Editor
          </h2>
          <p className="text-gray-400 text-[9px] xs:text-xs lg:text-[9px] xl:text-xs">
            Customize your homepage subheading with colors
          </p>
        </div>
      </div>

      {/* SIMPLE MODE */}
      {editMode === 'simple' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 xs:space-y-4 lg:space-y-3 xl:space-y-4"
        >
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 xs:p-4 lg:p-3 xl:p-4">
            <h3 className="text-xs xs:text-sm lg:text-xs xl:text-base font-bold text-white mb-2 xs:mb-3 lg:mb-2 xl:mb-3 flex items-center gap-1.5 xs:gap-2 lg:gap-1.5 xl:gap-2">
              <FaHighlighter className="text-red-400 text-[10px] xs:text-xs lg:text-[10px] xl:text-sm" />
              Enter Subheading Text
            </h3>

            <div>
              <label className="block text-[9px] xs:text-[10px] lg:text-[9px] xl:text-xs font-bold text-gray-300 mb-1 xs:mb-1.5 lg:mb-1 xl:mb-1.5">
                Subheading Content
              </label>
              <textarea
                value={data.text}
                onChange={(e) => handleTextChange(e.target.value)}
                rows={lines + 2}
                className="w-full px-2 xs:px-3 lg:px-2 xl:px-4 py-2 xs:py-3 lg:py-2 xl:py-3 bg-gray-800 border-2 border-red-500/30 rounded-lg text-white font-medium text-xs xs:text-sm lg:text-xs xl:text-base leading-relaxed focus:outline-none focus:border-red-500 transition-colors resize-none"
                placeholder=""
              />
              <div className="mt-1 xs:mt-1.5 lg:mt-1 xl:mt-1.5 text-[9px] xs:text-[10px] lg:text-[9px] xl:text-xs text-gray-400">
                Character count: {data.text.length}
              </div>
            </div>
          </div>

          {/* Sentence Highlights */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 xs:p-4 lg:p-3 xl:p-4">
            <div className="flex items-center justify-between mb-2 xs:mb-3 lg:mb-2 xl:mb-3">
              <h3 className="text-xs xs:text-sm lg:text-xs xl:text-base font-bold text-white flex items-center gap-1.5 xs:gap-2 lg:gap-1.5 xl:gap-2">
                <FaQuoteRight className="text-red-400 text-[10px] xs:text-xs lg:text-[10px] xl:text-sm" />
                Sentence Highlights
              </h3>
              <span className="text-[9px] xs:text-[10px] lg:text-[9px] xl:text-xs text-gray-500">
                {(data.highlightedSentences || []).length} sentence{(data.highlightedSentences || []).length !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-[9px] xs:text-[10px] lg:text-[9px] xl:text-xs text-gray-400 mb-2 xs:mb-3 lg:mb-2 xl:mb-3">
              Highlight entire sentences in red with bold styling
            </p>
            
            <div className="flex gap-1.5 xs:gap-2 lg:gap-1.5 xl:gap-2 mb-2 xs:mb-3 lg:mb-2 xl:mb-3">
              <input
                type="text"
                value={sentenceInput}
                onChange={(e) => setSentenceInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSentenceHighlight()}
                className="flex-1 px-2 xs:px-3 lg:px-2 xl:px-3 py-1.5 xs:py-2 lg:py-1.5 xl:py-2 bg-gray-800 border-2 border-red-500/30 rounded-lg text-white text-[10px] xs:text-xs lg:text-[10px] xl:text-sm focus:outline-none focus:border-red-500 transition-colors"
                placeholder=""
              />
              <button
                onClick={addSentenceHighlight}
                disabled={!sentenceInput.trim()}
                className="px-3 xs:px-4 lg:px-3 xl:px-4 py-1.5 xs:py-2 lg:py-1.5 xl:py-2 bg-gradient-to-r from-red-600 to-red-700 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity text-[10px] xs:text-xs lg:text-[10px] xl:text-xs flex-shrink-0"
              >
                <FaPlus className="inline mr-1 text-[9px] xs:text-[10px] lg:text-[9px] xl:text-[10px]" />
                <span className="hidden xs:inline">Add</span>
              </button>
            </div>

            {/* Quick sentence selection */}
            {data.text && extractSentences().length > 0 && (
              <div className="mb-2 xs:mb-3 lg:mb-2 xl:mb-3">
                <p className="text-[9px] xs:text-[10px] lg:text-[9px] xl:text-[10px] text-gray-500 mb-1.5">Quick select from text:</p>
                <div className="space-y-1.5 max-h-32 xs:max-h-40 lg:max-h-32 xl:max-h-40 overflow-y-auto">
                  {extractSentences().map((sentence, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-1.5 p-1.5 xs:p-2 lg:p-1.5 xl:p-2 rounded-lg text-[10px] xs:text-xs lg:text-[10px] xl:text-xs cursor-pointer transition-colors ${
                        (data.highlightedSentences || []).includes(sentence)
                          ? "bg-red-600/20 border border-red-500/30"
                          : "bg-gray-800 hover:bg-gray-700"
                      }`}
                      onClick={() => {
                        if ((data.highlightedSentences || []).includes(sentence)) {
                          removeSentenceHighlight(sentence);
                        } else {
                          onChange({ 
                            ...data, 
                            highlightedSentences: [...(data.highlightedSentences || []), sentence] 
                          });
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={(data.highlightedSentences || []).includes(sentence)}
                        onChange={() => {}}
                        className="mt-0.5 cursor-pointer flex-shrink-0"
                      />
                      <span className={(data.highlightedSentences || []).includes(sentence) ? "text-red-400 font-medium" : "text-gray-300"}>
                        {sentence}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(data.highlightedSentences || []).length > 0 ? (
              <div className="space-y-1.5">
                {(data.highlightedSentences || []).map((sentence, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-start gap-1.5 px-2 xs:px-3 lg:px-2 xl:px-3 py-1.5 xs:py-2 lg:py-1.5 xl:py-2 bg-gradient-to-r from-red-600/20 to-red-700/20 border-2 border-red-500/40 rounded-lg group hover:border-red-500"
                  >
                    <span className="text-red-400 font-bold text-[10px] xs:text-xs lg:text-[10px] xl:text-xs flex-1">
                      {sentence}
                    </span>
                    <button
                      onClick={() => removeSentenceHighlight(sentence)}
                      className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      <FaTrash className="text-[9px] xs:text-[10px] lg:text-[9px] xl:text-[10px]" />
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 xs:py-6 lg:py-4 xl:py-6 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg text-[9px] xs:text-[10px] lg:text-[9px] xl:text-xs">
                No sentence highlights yet
              </div>
            )}
          </div>

          {/* Word Highlights */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 xs:p-4 lg:p-3 xl:p-4">
            <div className="flex items-center justify-between mb-2 xs:mb-3 lg:mb-2 xl:mb-3">
              <h3 className="text-xs xs:text-sm lg:text-xs xl:text-base font-bold text-white flex items-center gap-1.5 xs:gap-2 lg:gap-1.5 xl:gap-2">
                <FaMagic className="text-red-400 text-[10px] xs:text-xs lg:text-[10px] xl:text-sm" />
                Word Highlights
              </h3>
              <span className="text-[9px] xs:text-[10px] lg:text-[9px] xl:text-xs text-gray-500">
                {data.highlightedWords.length} word{data.highlightedWords.length !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-[9px] xs:text-[10px] lg:text-[9px] xl:text-xs text-gray-400 mb-2 xs:mb-3 lg:mb-2 xl:mb-3">
              Make specific words/phrases appear in red
            </p>
            
            <div className="flex gap-1.5 xs:gap-2 lg:gap-1.5 xl:gap-2 mb-2 xs:mb-3 lg:mb-2 xl:mb-3">
              <input
                type="text"
                value={highlightInput}
                onChange={(e) => setHighlightInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addHighlight()}
                className="flex-1 px-2 xs:px-3 lg:px-2 xl:px-3 py-1.5 xs:py-2 lg:py-1.5 xl:py-2 bg-gray-800 border-2 border-red-500/30 rounded-lg text-white text-[10px] xs:text-xs lg:text-[10px] xl:text-sm focus:outline-none focus:border-red-500 transition-colors"
                placeholder=""
              />
              <button
                onClick={addHighlight}
                disabled={!highlightInput.trim()}
                className="px-3 xs:px-4 lg:px-3 xl:px-4 py-1.5 xs:py-2 lg:py-1.5 xl:py-2 bg-gradient-to-r from-red-600 to-red-700 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity text-[10px] xs:text-xs lg:text-[10px] xl:text-xs flex-shrink-0"
              >
                <FaPlus className="inline mr-1 text-[9px] xs:text-[10px] lg:text-[9px] xl:text-[10px]" />
                <span className="hidden xs:inline">Add</span>
              </button>
            </div>

            {data.highlightedWords.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {data.highlightedWords.map((word, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 xs:gap-1.5 lg:gap-1 xl:gap-1.5 px-2 xs:px-3 lg:px-2 xl:px-3 py-1 xs:py-1.5 lg:py-1 xl:py-1.5 bg-gradient-to-r from-red-600/20 to-red-700/20 border-2 border-red-500/40 rounded-lg group hover:border-red-500"
                  >
                    <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent font-black text-[10px] xs:text-xs lg:text-[10px] xl:text-xs">
                      {word}
                    </span>
                    <button
                      onClick={() => removeHighlight(word)}
                      className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTrash className="text-[9px] xs:text-[10px] lg:text-[9px] xl:text-[10px]" />
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 xs:py-6 lg:py-4 xl:py-6 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg text-[9px] xs:text-[10px] lg:text-[9px] xl:text-xs">
                No word highlights yet
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ADVANCED MODE */}
      {editMode === 'advanced' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 xs:space-y-4 lg:space-y-3 xl:space-y-4"
        >
          <div className="bg-gray-900 border-2 border-gray-800 rounded-lg p-2 xs:p-3 lg:p-2 xl:p-4">
            <div className="flex items-center justify-between mb-3 xs:mb-4 lg:mb-3 xl:mb-4">
              <h3 className="text-xs xs:text-sm lg:text-xs xl:text-base font-bold text-white flex items-center gap-1.5 xs:gap-2 lg:gap-1.5 xl:gap-2">
                <span className="bg-gradient-to-r from-red-600 to-red-700 text-white px-2 xs:px-3 lg:px-2 xl:px-3 py-0.5 xs:py-1 lg:py-0.5 xl:py-1 rounded-full text-[9px] xs:text-[10px] lg:text-[9px] xl:text-xs">
                  Word Editor
                </span>
              </h3>
            </div>
            {renderWordEditor()}
          </div>
        </motion.div>
      )}

      {/* Full Preview */}
      {showPreview && (
        <div className="mt-3 xs:mt-4 lg:mt-3 xl:mt-6 p-3 xs:p-4 lg:p-3 xl:p-6 bg-black border-4 border-red-500/60 rounded-xl shadow-2xl">
          <div className="flex items-center justify-between mb-3 xs:mb-4 lg:mb-3 xl:mb-4">
            <h3 className="text-[9px] xs:text-[10px] lg:text-[9px] xl:text-xs font-bold text-gray-400 flex items-center gap-1 xs:gap-1.5 lg:gap-1 xl:gap-1.5">
              <FaEye className="text-red-400 text-[10px] xs:text-xs lg:text-[10px] xl:text-xs" /> FULL PREVIEW
            </h3>
            <div className="text-[8px] xs:text-[9px] lg:text-[8px] xl:text-[10px] text-gray-500">
              {editMode === 'simple' ? 'Simple' : 'Advanced'}
            </div>
          </div>
          <div className="text-center">
            {editMode === 'advanced' && data.words && data.words.length > 0 ? (
              <p className={`leading-relaxed ${
                lines === 1 ? 'text-xs xs:text-sm lg:text-xs xl:text-lg' : 
                lines === 2 ? 'text-[10px] xs:text-xs lg:text-[10px] xl:text-base' : 
                'text-[9px] xs:text-[10px] lg:text-[9px] xl:text-sm'
              }`}>
                {data.words.map((word: SubheadingWord, i: number) => (
                  <span key={i} className={`${getShadeClass(word.shade)} mr-1`}>
                    {word.text}
                  </span>
                ))}
              </p>
            ) : (
              <p
                className={`leading-relaxed ${
                  lines === 1 ? 'text-xs xs:text-sm lg:text-xs xl:text-lg' : 
                  lines === 2 ? 'text-[10px] xs:text-xs lg:text-[10px] xl:text-base' : 
                  'text-[9px] xs:text-[10px] lg:text-[9px] xl:text-sm'
                }`}
                dangerouslySetInnerHTML={{ __html: renderHighlightedText() }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubheadingEditor;