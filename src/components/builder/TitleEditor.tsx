//components/builder/TitleEditor
'use client';

import React, { useState, memo, useCallback } from 'react';
import { FaPlus, FaTrash, FaHighlighter, FaArrowUp, FaArrowDown, FaMagic, FaEye, FaPalette, FaCheckCircle } from 'react-icons/fa';

interface TitleWord {
  text: string;
  shade?: 'none' | 'red-light' | 'red-medium' | 'red-dark' | 'red-gradient-1' | 'red-gradient-2' | 'red-gradient-3' | 'gray-light' | 'gray-medium';
}

interface TitleEditorProps {
  data: {
    line1: string;
    line2: string;
    line3: string;
    highlightedWords: string[];
    line1Words?: TitleWord[];
    line2Words?: TitleWord[];
    line3Words?: TitleWord[];
  };
  lines: number;
  onChange: (data: any) => void;
  onLinesChange: (lines: number) => void;
  showPreview?: boolean;
}

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

const ColorPicker = memo(({ 
  value, 
  onChange: onColorChange 
}: { 
  value: string; 
  onChange: (value: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = shadeOptions.find(opt => opt.value === value) || shadeOptions[0];

  const handleSelect = useCallback((optionValue: string) => {
    onColorChange(optionValue);
    setIsOpen(false);
  }, [onColorChange]);

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
                  onClick={() => handleSelect(option.value)}
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
});

ColorPicker.displayName = 'ColorPicker';

const WordEditor = memo(({ 
  word, 
  idx, 
  totalWords,
  lineKey,
  onUpdate,
  onDelete,
  onMove
}: {
  word: TitleWord;
  idx: number;
  totalWords: number;
  lineKey: string;
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
            placeholder=""
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
});

WordEditor.displayName = 'WordEditor';

const TitleEditor: React.FC<TitleEditorProps> = ({ 
  data, 
  lines, 
  onChange, 
  onLinesChange,
  showPreview = false
}) => {
  const [editMode, setEditMode] = useState<'simple' | 'advanced'>('simple');
  const [highlightInput, setHighlightInput] = useState('');

  const convertToWords = useCallback((lineKey: 'line1' | 'line2' | 'line3') => {
    const text = data[lineKey];
    if (!text || !text.trim()) {
      alert('Please enter text first');
      return;
    }

    const words = text.split(' ').filter(w => w.trim());
    const wordArray: TitleWord[] = words.map(word => ({
      text: word,
      shade: data.highlightedWords?.includes(word) ? 'red-gradient-1' : 'none'
    }));

    onChange({ ...data, [`${lineKey}Words`]: wordArray });
  }, [data, onChange]);

  const handleTextChange = useCallback((line: string, value: string) => {
    onChange({ ...data, [line]: value });
  }, [data, onChange]);

  const addHighlight = useCallback(() => {
    const word = highlightInput.trim();
    if (word && !data.highlightedWords.includes(word)) {
      onChange({ ...data, highlightedWords: [...data.highlightedWords, word] });
      setHighlightInput('');
    }
  }, [highlightInput, data, onChange]);

  const removeHighlight = useCallback((word: string) => {
    onChange({
      ...data,
      highlightedWords: data.highlightedWords.filter((w) => w !== word),
    });
  }, [data, onChange]);

  const addWord = useCallback((lineKey: 'line1' | 'line2' | 'line3') => {
    const wordsKey = `${lineKey}Words` as 'line1Words' | 'line2Words' | 'line3Words';
    const currentWords = data[wordsKey] || [];
    onChange({ ...data, [wordsKey]: [...currentWords, { text: '', shade: 'none' }] });
  }, [data, onChange]);

  const updateWord = useCallback((
    lineKey: 'line1' | 'line2' | 'line3',
    index: number,
    updates: Partial<TitleWord>
  ) => {
    const wordsKey = `${lineKey}Words` as 'line1Words' | 'line2Words' | 'line3Words';
    const currentWords = [...(data[wordsKey] || [])];
    currentWords[index] = { ...currentWords[index], ...updates };
    onChange({ ...data, [wordsKey]: currentWords });
  }, [data, onChange]);

  const deleteWord = useCallback((lineKey: 'line1' | 'line2' | 'line3', index: number) => {
    const wordsKey = `${lineKey}Words` as 'line1Words' | 'line2Words' | 'line3Words';
    const currentWords = data[wordsKey] || [];
    
    if (currentWords.length === 1) {
      onChange({ ...data, [wordsKey]: [] });
      return;
    }
    
    onChange({ ...data, [wordsKey]: currentWords.filter((_: any, i: number) => i !== index) });
  }, [data, onChange]);

  const moveWord = useCallback((
    lineKey: 'line1' | 'line2' | 'line3',
    index: number,
    direction: 'up' | 'down'
  ) => {
    const wordsKey = `${lineKey}Words` as 'line1Words' | 'line2Words' | 'line3Words';
    const currentWords = [...(data[wordsKey] || [])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= currentWords.length) return;

    [currentWords[index], currentWords[newIndex]] = [currentWords[newIndex], currentWords[index]];
    onChange({ ...data, [wordsKey]: currentWords });
  }, [data, onChange]);

  const renderWordEditor = useCallback((lineKey: 'line1' | 'line2' | 'line3', lineNumber: number) => {
    const wordsKey = `${lineKey}Words` as 'line1Words' | 'line2Words' | 'line3Words';
    const words = data[wordsKey] || [];

    if (words.length === 0) {
      return (
        <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg p-3 lg:p-4 text-center">
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <FaPlus className="text-red-400 text-sm lg:text-base" />
          </div>
          <p className="text-gray-300 mb-1 font-bold text-xs lg:text-sm">
            Line {lineNumber} - Start Creating
          </p>
          <p className="text-gray-500 text-[10px] lg:text-xs mb-2 lg:mb-3">
            Add words or convert text
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center items-stretch sm:items-center">
            <button
              onClick={() => addWord(lineKey)}
              className="px-3 lg:px-4 py-1.5 lg:py-2 bg-red-600 rounded font-bold hover:bg-red-700 transition-colors inline-flex items-center justify-center gap-1.5 text-xs"
            >
              <FaPlus className="text-[10px]" /> Add Word
            </button>

            {data[lineKey] && (
              <>
                <span className="text-gray-500 text-xs hidden sm:inline">or</span>
                <button
                  onClick={() => convertToWords(lineKey)}
                  className="px-3 lg:px-4 py-1.5 lg:py-2 bg-gray-700 border border-gray-600 rounded font-bold hover:bg-gray-600 transition-colors inline-flex items-center justify-center gap-1.5 text-xs"
                >
                  <FaMagic className="text-[10px]" /> Convert Text
                </button>
              </>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2 lg:space-y-3">
        {words.map((word: TitleWord, idx: number) => (
          <WordEditor
            key={idx}
            word={word}
            idx={idx}
            totalWords={words.length}
            lineKey={lineKey}
            onUpdate={(index, updates) => updateWord(lineKey, index, updates)}
            onDelete={(index) => deleteWord(lineKey, index)}
            onMove={(index, direction) => moveWord(lineKey, index, direction)}
          />
        ))}

        <button
          onClick={() => addWord(lineKey)}
          className="w-full px-3 lg:px-4 py-2 lg:py-2.5 bg-gray-800 border-2 border-dashed border-red-500/30 rounded text-red-400 hover:bg-red-900/10 hover:border-red-500 transition-all font-bold flex items-center justify-center gap-2 text-xs"
        >
          <FaPlus className="text-[10px]" />
          Add Another Word
        </button>
      </div>
    );
  }, [data, addWord, convertToWords, updateWord, deleteWord, moveWord]);

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Header */}
      <div className="flex-1 min-w-0">
        <h2 className="text-lg lg:text-xl font-black text-white mb-1 truncate">
          Main Title Editor
        </h2>
        <p className="text-gray-400 text-[10px] lg:text-xs">
          Create titles with custom colors
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="bg-gray-900 border-2 border-gray-800 rounded-lg p-1">
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => setEditMode('simple')}
            className={`px-2 lg:px-3 py-2 lg:py-2.5 rounded font-bold transition-colors ${
              editMode === 'simple'
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <FaHighlighter className="text-[10px] lg:text-xs" />
              <span className="text-xs">Simple</span>
            </div>
            <div className="text-[9px] opacity-80 hidden lg:block">
              Quick highlights
            </div>
          </button>
          <button
            onClick={() => setEditMode('advanced')}
            className={`px-2 lg:px-3 py-2 lg:py-2.5 rounded font-bold transition-colors ${
              editMode === 'advanced'
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
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

      {/* Number of Lines */}
      <div>
        <label className="block text-xs font-bold text-gray-300 mb-2">
          <span>Title Lines</span>
          <span className="text-gray-500 text-[10px] ml-1">(1-3)</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((num) => (
            <button
              key={num}
              onClick={() => onLinesChange(num)}
              className={`px-3 lg:px-4 py-2 lg:py-3 rounded-lg font-bold transition-colors ${
                lines === num
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border-2 border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="text-lg lg:text-xl mb-0.5">{num}</div>
              <div className="text-[10px] lg:text-xs">Line{num > 1 ? 's' : ''}</div>
            </button>
          ))}
        </div>
      </div>

      {/* SIMPLE MODE */}
      {editMode === 'simple' && (
        <div className="space-y-3 lg:space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 lg:p-4">
            <h3 className="text-sm lg:text-base font-bold text-white mb-2 lg:mb-3 flex items-center gap-2">
              <FaHighlighter className="text-red-400 text-xs" />
              Enter Title Text
            </h3>

            <div className="space-y-2 lg:space-y-3">
              {lines >= 1 && (
                <div>
                  <label className="block text-[10px] lg:text-xs font-bold text-gray-300 mb-1">
                    Line 1 {lines === 1 && '(Main)'}
                  </label>
                  <input
                    type="text"
                    value={data.line1}
                    onChange={(e) => handleTextChange('line1', e.target.value)}
                    className="w-full px-2 lg:px-3 py-2 lg:py-2.5 bg-gray-800 border-2 border-red-500/30 rounded text-white font-bold text-xs lg:text-sm focus:outline-none focus:border-red-500 transition-colors"
                    placeholder=""
                  />
                </div>
              )}

              {lines >= 2 && (
                <div>
                  <label className="block text-[10px] lg:text-xs font-bold text-gray-300 mb-1">
                    Line 2
                  </label>
                  <input
                    type="text"
                    value={data.line2}
                    onChange={(e) => handleTextChange('line2', e.target.value)}
                    className="w-full px-2 lg:px-3 py-2 lg:py-2.5 bg-gray-800 border-2 border-red-500/30 rounded text-white font-bold text-xs lg:text-sm focus:outline-none focus:border-red-500 transition-colors"
                    placeholder=""
                  />
                </div>
              )}

              {lines >= 3 && (
                <div>
                  <label className="block text-[10px] lg:text-xs font-bold text-gray-300 mb-1">
                    Line 3
                  </label>
                  <input
                    type="text"
                    value={data.line3}
                    onChange={(e) => handleTextChange('line3', e.target.value)}
                    className="w-full px-2 lg:px-3 py-2 lg:py-2.5 bg-gray-800 border-2 border-red-500/30 rounded text-white font-bold text-xs lg:text-sm focus:outline-none focus:border-red-500 transition-colors"
                    placeholder=""
                  />
                </div>
              )}
            </div>
          </div>

          {/* Highlights */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 lg:p-4">
            <div className="flex items-center justify-between mb-2 lg:mb-3">
              <h3 className="text-sm lg:text-base font-bold text-white flex items-center gap-2">
                <FaMagic className="text-red-400 text-xs" />
                Red Highlights
              </h3>
              <span className="text-[10px] text-gray-500">
                {data.highlightedWords.length} word{data.highlightedWords.length !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-[10px] lg:text-xs text-gray-400 mb-2 lg:mb-3">
              Make words appear with red gradient
            </p>
            
            <div className="flex gap-2 mb-2 lg:mb-3">
              <input
                type="text"
                value={highlightInput}
                onChange={(e) => setHighlightInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addHighlight()}
                className="flex-1 px-2 lg:px-3 py-1.5 lg:py-2 bg-gray-800 border-2 border-red-500/30 rounded text-white text-xs focus:outline-none focus:border-red-500 transition-colors"
                placeholder=""
              />
              <button
                onClick={addHighlight}
                disabled={!highlightInput.trim()}
                className="px-3 lg:px-4 py-1.5 lg:py-2 bg-red-600 rounded font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs flex-shrink-0"
              >
                <FaPlus className="inline mr-1 text-[10px]" />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>

            {data.highlightedWords.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {data.highlightedWords.map((word, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 px-2 lg:px-2.5 py-1 lg:py-1.5 bg-red-600/20 border-2 border-red-500/40 rounded group hover:border-red-500 transition-colors"
                  >
                    <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent font-black text-[10px] lg:text-xs">
                      {word}
                    </span>
                    <button
                      onClick={() => removeHighlight(word)}
                      className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTrash className="text-[9px]" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 lg:py-6 text-gray-500 border-2 border-dashed border-gray-700 rounded text-[10px] lg:text-xs">
                No highlights yet
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADVANCED MODE */}
      {editMode === 'advanced' && (
        <div className="space-y-3 lg:space-y-4">
          {lines >= 1 && (
            <div className="bg-gray-900 border-2 border-gray-800 rounded-lg p-2 lg:p-3">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <h3 className="text-sm lg:text-base font-bold text-white flex items-center gap-2">
                  <span className="bg-red-600 text-white px-2 lg:px-2.5 py-0.5 lg:py-1 rounded-full text-[10px] lg:text-xs">
                    Line 1
                  </span>
                </h3>
              </div>
              {renderWordEditor('line1', 1)}
            </div>
          )}

          {lines >= 2 && (
            <div className="bg-gray-900 border-2 border-gray-800 rounded-lg p-2 lg:p-3">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <h3 className="text-sm lg:text-base font-bold text-white flex items-center gap-2">
                  <span className="bg-red-600 text-white px-2 lg:px-2.5 py-0.5 lg:py-1 rounded-full text-[10px] lg:text-xs">
                    Line 2
                  </span>
                </h3>
              </div>
              {renderWordEditor('line2', 2)}
            </div>
          )}

          {lines >= 3 && (
            <div className="bg-gray-900 border-2 border-gray-800 rounded-lg p-2 lg:p-3">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <h3 className="text-sm lg:text-base font-bold text-white flex items-center gap-2">
                  <span className="bg-red-600 text-white px-2 lg:px-2.5 py-0.5 lg:py-1 rounded-full text-[10px] lg:text-xs">
                    Line 3
                  </span>
                </h3>
              </div>
              {renderWordEditor('line3', 3)}
            </div>
          )}
        </div>
      )}

      {/* Full Preview */}
      {showPreview && (
        <div className="mt-3 lg:mt-4 p-3 lg:p-4 bg-black border-4 border-red-500/60 rounded-lg">
          <div className="flex items-center justify-between mb-2 lg:mb-3">
            <h3 className="text-[10px] lg:text-xs font-bold text-gray-400 flex items-center gap-1">
              <FaEye className="text-red-400 text-xs" /> FULL PREVIEW
            </h3>
            <div className="text-[9px] lg:text-[10px] text-gray-500">
              {editMode === 'simple' ? 'Simple' : 'Advanced'}
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-xl lg:text-2xl xl:text-3xl font-black leading-tight">
              {lines >= 1 && (
                <div className="mb-1">
                  {editMode === 'advanced' && data.line1Words && data.line1Words.length > 0 ? (
                    <>
                      {data.line1Words.map((word: TitleWord, i: number) => (
                        <span key={i} className={`${getShadeClass(word.shade)} mr-1`}>
                          {word.text}
                        </span>
                      ))}
                    </>
                  ) : (
                    data.line1.split(' ').map((word, i) => (
                      <span
                        key={i}
                        className={
                          data.highlightedWords.includes(word)
                            ? 'bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent mr-1'
                            : 'text-white mr-1'
                        }
                      >
                        {word}
                      </span>
                    ))
                  )}
                </div>
              )}

              {lines >= 2 && (
                <div className="mb-1">
                  {editMode === 'advanced' && data.line2Words && data.line2Words.length > 0 ? (
                    <>
                      {data.line2Words.map((word: TitleWord, i: number) => (
                        <span key={i} className={`${getShadeClass(word.shade)} mr-1`}>
                          {word.text}
                        </span>
                      ))}
                    </>
                  ) : (
                    data.line2.split(' ').map((word, i) => (
                      <span
                        key={i}
                        className={
                          data.highlightedWords.includes(word)
                            ? 'bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent mr-1'
                            : 'text-white mr-1'
                        }
                      >
                        {word}
                      </span>
                    ))
                  )}
                </div>
              )}

              {lines >= 3 && data.line3 && (
                <div>
                  {editMode === 'advanced' && data.line3Words && data.line3Words.length > 0 ? (
                    <>
                      {data.line3Words.map((word: TitleWord, i: number) => (
                        <span key={i} className={`${getShadeClass(word.shade)} mr-1`}>
                          {word.text}
                        </span>
                      ))}
                    </>
                  ) : (
                    data.line3.split(' ').map((word, i) => (
                      <span
                        key={i}
                        className={
                          data.highlightedWords.includes(word)
                            ? 'bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent mr-1'
                            : 'text-white mr-1'
                        }
                      >
                        {word}
                      </span>
                    ))
                  )}
                </div>
              )}
            </h1>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(TitleEditor);