// components/builder/FooterEditor.tsx
'use client';

import React, { useState, memo, useCallback } from 'react';
import { FaPlus, FaTrash, FaBolt, FaRocket, FaArrowUp, FaArrowDown, FaPalette, FaCheckCircle, FaDollarSign, FaMagic, FaEye, FaInfoCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import IconPicker from './IconPicker';

interface TitleWord {
  text: string;
  shade?: 'none' | 'red-light' | 'red-medium' | 'red-dark' | 'red-gradient-1' | 'red-gradient-2' | 'red-gradient-3' | 'gray-light' | 'gray-medium';
}

interface DescriptionWord {
  text: string;
  shade?: 'none' | 'red-light' | 'red-medium' | 'red-dark' | 'red-gradient-1' | 'red-gradient-2' | 'red-gradient-3' | 'gray-light' | 'gray-medium';
}

interface FooterIcon {
  name: string;
  label: string;
}

interface FooterEditorProps {
  title: string;
  titleWords?: TitleWord[];
  description: string;
  descriptionWords?: DescriptionWord[];
  price: string;          // ✅ Read-only from Course Card
  salePrice?: string;     // ✅ Read-only from Course Card
  ctaButtonText?: string; // ✅ NEW: From CTA Button Editor
  ctaButtonIcon?: string; // ✅ NEW: From CTA Button Editor
  icons: FooterIcon[];
  onChange: (data: {
    title: string;
    titleWords?: TitleWord[];
    description: string;
    descriptionWords?: DescriptionWord[];
    price: string;
    salePrice?: string;
    icons: FooterIcon[];
  }) => void;
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
  type,
  onUpdate,
  onDelete,
  onMove
}: {
  word: TitleWord | DescriptionWord;
  idx: number;
  totalWords: number;
  type: 'title' | 'description';
  onUpdate: (idx: number, updates: Partial<TitleWord | DescriptionWord>) => void;
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
            onChange={(e) => onUpdate(idx, { text: type === 'title' ? e.target.value.toUpperCase() : e.target.value })}
            className="w-full px-2 lg:px-3 py-1.5 lg:py-2 bg-gray-900 border border-red-500/30 rounded text-white font-bold text-xs lg:text-sm focus:outline-none focus:border-red-500 transition-colors"
            placeholder={type === 'title' ? 'WORD' : 'word'}
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
          <span className={`${type === 'title' ? 'text-base lg:text-lg xl:text-xl font-black' : 'text-sm lg:text-base font-medium'} ${getShadeClass(word.shade)} truncate`}>
            {word.text || (type === 'title' ? 'WORD' : 'word')}
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

const FooterEditor: React.FC<FooterEditorProps> = memo(({
  title,
  titleWords,
  description,
  descriptionWords,
  price,
  salePrice,
  ctaButtonText = "ENROLL NOW", // ✅ Default fallback
  ctaButtonIcon = "FaRocket",   // ✅ Default fallback
  icons,
  onChange,
  showPreview = false,
}) => {
  const [editMode, setEditMode] = useState<'simple' | 'advanced'>('simple');
  const [showIconPicker, setShowIconPicker] = useState(false);

  const convertTitleToWords = useCallback(() => {
    if (!title || !title.trim()) {
      alert('Please enter title text first');
      return;
    }

    const words = title.split(' ').filter(w => w.trim());
    const wordArray: TitleWord[] = words.map(word => ({
      text: word,
      shade: 'none'
    }));

    onChange({ title, titleWords: wordArray, description, descriptionWords, price, salePrice, icons });
  }, [title, description, descriptionWords, price, salePrice, icons, onChange]);

  const convertDescriptionToWords = useCallback(() => {
    if (!description || !description.trim()) {
      alert('Please enter description text first');
      return;
    }

    const words = description.split(' ').filter(w => w.trim());
    const wordArray: DescriptionWord[] = words.map(word => ({
      text: word,
      shade: 'none'
    }));

    onChange({ title, titleWords, description, descriptionWords: wordArray, price, salePrice, icons });
  }, [title, titleWords, description, price, salePrice, icons, onChange]);

  const addTitleWord = useCallback(() => {
    const currentWords = titleWords || [];
    onChange({ title, titleWords: [...currentWords, { text: '', shade: 'none' }], description, descriptionWords, price, salePrice, icons });
  }, [titleWords, title, description, descriptionWords, price, salePrice, icons, onChange]);

  const updateTitleWord = useCallback((index: number, updates: Partial<TitleWord>) => {
    const currentWords = [...(titleWords || [])];
    currentWords[index] = { ...currentWords[index], ...updates };
    onChange({ title, titleWords: currentWords, description, descriptionWords, price, salePrice, icons });
  }, [titleWords, title, description, descriptionWords, price, salePrice, icons, onChange]);

  const deleteTitleWord = useCallback((index: number) => {
    const currentWords = titleWords || [];
    if (currentWords.length === 1) {
      onChange({ title, titleWords: [], description, descriptionWords, price, salePrice, icons });
      return;
    }
    onChange({ title, titleWords: currentWords.filter((_, i) => i !== index), description, descriptionWords, price, salePrice, icons });
  }, [titleWords, title, description, descriptionWords, price, salePrice, icons, onChange]);

  const moveTitleWord = useCallback((index: number, direction: 'up' | 'down') => {
    const currentWords = [...(titleWords || [])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentWords.length) return;
    [currentWords[index], currentWords[newIndex]] = [currentWords[newIndex], currentWords[index]];
    onChange({ title, titleWords: currentWords, description, descriptionWords, price, salePrice, icons });
  }, [titleWords, title, description, descriptionWords, price, salePrice, icons, onChange]);

  const addDescriptionWord = useCallback(() => {
    const currentWords = descriptionWords || [];
    onChange({ title, titleWords, description, descriptionWords: [...currentWords, { text: '', shade: 'none' }], price, salePrice, icons });
  }, [descriptionWords, title, titleWords, description, price, salePrice, icons, onChange]);

  const updateDescriptionWord = useCallback((index: number, updates: Partial<DescriptionWord>) => {
    const currentWords = [...(descriptionWords || [])];
    currentWords[index] = { ...currentWords[index], ...updates };
    onChange({ title, titleWords, description, descriptionWords: currentWords, price, salePrice, icons });
  }, [descriptionWords, title, titleWords, description, price, salePrice, icons, onChange]);

  const deleteDescriptionWord = useCallback((index: number) => {
    const currentWords = descriptionWords || [];
    if (currentWords.length === 1) {
      onChange({ title, titleWords, description, descriptionWords: [], price, salePrice, icons });
      return;
    }
    onChange({ title, titleWords, description, descriptionWords: currentWords.filter((_, i) => i !== index), price, salePrice, icons });
  }, [descriptionWords, title, titleWords, description, price, salePrice, icons, onChange]);

  const moveDescriptionWord = useCallback((index: number, direction: 'up' | 'down') => {
    const currentWords = [...(descriptionWords || [])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentWords.length) return;
    [currentWords[index], currentWords[newIndex]] = [currentWords[newIndex], currentWords[index]];
    onChange({ title, titleWords, description, descriptionWords: currentWords, price, salePrice, icons });
  }, [descriptionWords, title, titleWords, description, price, salePrice, icons, onChange]);

  const addIcon = useCallback((iconName: string, label: string) => {
    onChange({ title, titleWords, description, descriptionWords, price, salePrice, icons: [...icons, { name: iconName, label }] });
    setShowIconPicker(false);
  }, [title, titleWords, description, descriptionWords, price, salePrice, icons, onChange]);

  const removeIcon = useCallback((index: number) => {
    onChange({ title, titleWords, description, descriptionWords, price, salePrice, icons: icons.filter((_, i) => i !== index) });
  }, [title, titleWords, description, descriptionWords, price, salePrice, icons, onChange]);

  const getIconEmoji = (name: string): string => {
    const emojiMap: { [key: string]: string } = {
      shield: '🛡️',
      infinity: '♾️',
      star: '⭐',
      fire: '🔥',
      rocket: '🚀',
      trophy: '🏆',
      crown: '👑',
      lightning: '⚡',
      check: '✅',
      lock: '🔒',
    };
    return emojiMap[name] || '⭐';
  };

  // ✅ UPDATED: Use ctaButtonText from props
  const formatButtonText = () => {
    const buttonText = ctaButtonText || "ENROLL NOW";
    
    if (!price || price === '0' || price === '') {
      return buttonText;
    }

    const priceNum = parseFloat(price);
    const salePriceNum = salePrice ? parseFloat(salePrice) : null;

    if (salePriceNum && salePriceNum > 0 && salePriceNum < priceNum) {
      return (
        <>
          {buttonText} AT <span className="line-through opacity-70">${priceNum.toFixed(0)}</span> ${salePriceNum.toFixed(0)}
        </>
      );
    }

    return `${buttonText} AT $${priceNum.toFixed(0)}`;
  };

  const renderTitleEditor = useCallback(() => {
    const words = titleWords || [];

    if (words.length === 0) {
      return (
        <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg p-3 lg:p-4 text-center">
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <FaPlus className="text-red-400 text-sm lg:text-base" />
          </div>
          <p className="text-gray-300 mb-1 font-bold text-xs lg:text-sm">
            Start Creating Title
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center items-stretch sm:items-center">
            <button
              onClick={addTitleWord}
              className="px-3 lg:px-4 py-1.5 lg:py-2 bg-red-600 rounded font-bold hover:bg-red-700 transition-colors inline-flex items-center justify-center gap-1.5 text-xs"
            >
              <FaPlus className="text-[10px]" /> Add Word
            </button>

            {title && (
              <>
                <span className="text-gray-500 text-xs hidden sm:inline">or</span>
                <button
                  onClick={convertTitleToWords}
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
            type="title"
            onUpdate={updateTitleWord}
            onDelete={deleteTitleWord}
            onMove={moveTitleWord}
          />
        ))}

        <button
          onClick={addTitleWord}
          className="w-full px-3 lg:px-4 py-2 lg:py-2.5 bg-gray-800 border-2 border-dashed border-red-500/30 rounded text-red-400 hover:bg-red-900/10 hover:border-red-500 transition-all font-bold flex items-center justify-center gap-2 text-xs"
        >
          <FaPlus className="text-[10px]" />
          Add Another Word
        </button>
      </div>
    );
  }, [titleWords, title, addTitleWord, convertTitleToWords, updateTitleWord, deleteTitleWord, moveTitleWord]);

  const renderDescriptionEditor = useCallback(() => {
    const words = descriptionWords || [];

    if (words.length === 0) {
      return (
        <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg p-3 lg:p-4 text-center">
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <FaPlus className="text-red-400 text-sm lg:text-base" />
          </div>
          <p className="text-gray-300 mb-1 font-bold text-xs lg:text-sm">
            Start Creating Description
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center items-stretch sm:items-center">
            <button
              onClick={addDescriptionWord}
              className="px-3 lg:px-4 py-1.5 lg:py-2 bg-red-600 rounded font-bold hover:bg-red-700 transition-colors inline-flex items-center justify-center gap-1.5 text-xs"
            >
              <FaPlus className="text-[10px]" /> Add Word
            </button>

            {description && (
              <>
                <span className="text-gray-500 text-xs hidden sm:inline">or</span>
                <button
                  onClick={convertDescriptionToWords}
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
        {words.map((word: DescriptionWord, idx: number) => (
          <WordEditor
            key={idx}
            word={word}
            idx={idx}
            totalWords={words.length}
            type="description"
            onUpdate={updateDescriptionWord}
            onDelete={deleteDescriptionWord}
            onMove={moveDescriptionWord}
          />
        ))}

        <button
          onClick={addDescriptionWord}
          className="w-full px-3 lg:px-4 py-2 lg:py-2.5 bg-gray-800 border-2 border-dashed border-red-500/30 rounded text-red-400 hover:bg-red-900/10 hover:border-red-500 transition-all font-bold flex items-center justify-center gap-2 text-xs"
        >
          <FaPlus className="text-[10px]" />
          Add Another Word
        </button>
      </div>
    );
  }, [descriptionWords, description, addDescriptionWord, convertDescriptionToWords, updateDescriptionWord, deleteDescriptionWord, moveDescriptionWord]);

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Header */}
      <div className="flex-1 min-w-0">
        <h2 className="text-lg lg:text-xl font-black text-white mb-1 truncate">
          Footer Section Editor
        </h2>
        <p className="text-gray-400 text-[10px] lg:text-xs">
          Customize your final call-to-action
        </p>
      </div>

      {/* ✅ NEW: Info Card for Read-Only Fields */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/30 rounded-lg p-3 lg:p-4"
      >
        <div className="flex items-start gap-2 mb-2">
          <FaInfoCircle className="text-blue-400 text-sm mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-xs lg:text-sm font-bold text-blue-400 mb-1">
              Linked Settings
            </h3>
            <div className="text-[10px] lg:text-xs text-gray-400 space-y-1">
              <p>• <span className="font-semibold">Pricing</span> is managed in <span className="text-blue-300">Card Customization</span></p>
              <p>• <span className="font-semibold">Button Text</span> comes from <span className="text-blue-300">CTA Button Editor</span></p>
            </div>
          </div>
        </div>
      </motion.div>

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
              <span className="text-xs">Simple</span>
            </div>
            <div className="text-[9px] opacity-80 hidden lg:block">
              Quick edit
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

      {/* SIMPLE MODE */}
      {editMode === 'simple' && (
        <div className="space-y-3 lg:space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 lg:p-4">
            <h3 className="text-sm lg:text-base font-bold text-white mb-2 lg:mb-3">
              Footer Text
            </h3>

            <div className="space-y-2 lg:space-y-3">
              <div>
                <label className="block text-[10px] lg:text-xs font-bold text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => onChange({ title: e.target.value, titleWords, description, descriptionWords, price, salePrice, icons })}
                  className="w-full px-2 lg:px-3 py-2 lg:py-2.5 bg-gray-800 border-2 border-red-500/30 rounded text-white font-bold text-xs lg:text-sm focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="READY TO START YOUR JOURNEY?"
                />
              </div>

              <div>
                <label className="block text-[10px] lg:text-xs font-bold text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => onChange({ title, titleWords, description: e.target.value, descriptionWords, price, salePrice, icons })}
                  rows={3}
                  className="w-full px-2 lg:px-3 py-2 lg:py-2.5 bg-gray-800 border-2 border-red-500/30 rounded text-white text-xs lg:text-sm focus:outline-none focus:border-red-500 transition-colors resize-none"
                  placeholder="Join 15,000+ students who transformed their lives..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADVANCED MODE */}
      {editMode === 'advanced' && (
        <div className="space-y-3 lg:space-y-4">
          {/* Title Editor */}
          <div className="bg-gray-900 border-2 border-gray-800 rounded-lg p-2 lg:p-3">
            <h3 className="text-sm lg:text-base font-bold text-white mb-3 lg:mb-4">
              Title Words
            </h3>
            {renderTitleEditor()}
          </div>

          {/* Description Editor */}
          <div className="bg-gray-900 border-2 border-gray-800 rounded-lg p-2 lg:p-3">
            <h3 className="text-sm lg:text-base font-bold text-white mb-3 lg:mb-4">
              Description Words
            </h3>
            {renderDescriptionEditor()}
          </div>
        </div>
      )}
      

      {/* ✅ UPDATED: Trust Badges with Responsive Icon Picker */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 lg:p-4">
        <h3 className="text-sm lg:text-base font-bold text-white mb-2 lg:mb-3">
          Trust Badges
        </h3>

        {/* Custom Icons */}
        <div className="space-y-2">
          {icons.map((icon, index) => (
            <div
              key={index}
              className="flex items-center gap-2 lg:gap-3 bg-gray-800 border border-red-500/30 rounded p-2 lg:p-2.5"
            >
              <span className="text-lg lg:text-xl flex-shrink-0">{getIconEmoji(icon.name)}</span>
              <input
                type="text"
                value={icon.label}
                onChange={(e) => {
                  const newIcons = [...icons];
                  newIcons[index] = { ...newIcons[index], label: e.target.value };
                  onChange({ title, titleWords, description, descriptionWords, price, salePrice, icons: newIcons });
                }}
                className="flex-1 min-w-0 px-2 lg:px-3 py-1.5 lg:py-2 bg-gray-900 border border-gray-700 rounded text-white text-[10px] lg:text-xs focus:outline-none focus:border-red-500"
                placeholder="Badge label"
              />
              <button
                onClick={() => removeIcon(index)}
                className="p-1.5 lg:p-2 bg-red-600 rounded hover:bg-red-700 flex-shrink-0"
              >
                <FaTrash className="text-[10px]" />
              </button>
            </div>
          ))}

          <button
            onClick={() => setShowIconPicker(!showIconPicker)}
            className="w-full px-3 lg:px-4 py-2 lg:py-2.5 bg-gray-800 border border-dashed border-gray-600 rounded text-gray-400 hover:border-red-500/50 hover:text-red-400 transition-colors text-xs"
          >
            <FaPlus className="inline mr-2 text-[10px]" />
            Add Custom Badge
          </button>

          {/* ✅ FIXED: Responsive Icon Picker */}
          <AnimatePresence>
            {showIconPicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 lg:mt-3 p-3 lg:p-4 bg-gray-800 border border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2 lg:mb-3">
                    <h4 className="text-xs lg:text-sm font-bold text-white">Select Icon</h4>
                    <button
                      onClick={() => setShowIconPicker(false)}
                      className="text-gray-400 hover:text-red-400 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                  
                  {/* ✅ Scrollable container with max height */}
                  <div className="max-h-[200px] lg:max-h-[300px] overflow-y-auto pr-2 -mr-2">
                    <IconPicker
                      selected=""
                      onSelect={(iconName) => {
                        const label = prompt('Enter badge label:');
                        if (label) addIcon(iconName, label);
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Live Preview - Only shown when showPreview is true (mobile/tablet editor) */}
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
          
          <div className="bg-gradient-to-br from-gray-900/90 to-black/95 border-2 border-red-500/50 rounded-xl p-6 lg:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-transparent rounded-xl" />

            <div className="relative z-10">
              {/* Icon */}
              <div className="inline-block mb-4 lg:mb-6">
                <FaBolt className="text-red-400 text-3xl lg:text-5xl animate-pulse" />
              </div>

              {/* Title */}
              <h2 className="text-2xl lg:text-4xl xl:text-5xl font-black leading-tight mb-3 lg:mb-4">
                {editMode === 'advanced' && titleWords && titleWords.length > 0 ? (
                  <>
                    {titleWords.map((word: TitleWord, i: number) => (
                      <span key={i} className={`${getShadeClass(word.shade)} mr-1`}>
                        {word.text}
                      </span>
                    ))}
                  </>
                ) : (
                  <span className="text-white">{title || 'READY TO START?'}</span>
                )}
              </h2>

              {/* Description */}
              <p className="text-gray-300 text-sm lg:text-lg mb-6 lg:mb-10 max-w-2xl mx-auto leading-relaxed">
                {editMode === 'advanced' && descriptionWords && descriptionWords.length > 0 ? (
                  <>
                    {descriptionWords.map((word: DescriptionWord, i: number) => (
                      <span key={i} className={`${getShadeClass(word.shade)} mr-1`}>
                        {word.text}
                      </span>
                    ))}
                  </>
                ) : (
                  description || 'Join thousands of students transforming their lives...'
                )}
              </p>

              {/* CTA Button */}
              <button className="bg-gradient-to-r from-red-600 to-red-700 text-white font-black py-3 lg:py-5 px-6 lg:px-10 rounded-xl text-sm lg:text-xl inline-flex items-center justify-center gap-2 lg:gap-3 shadow-[0_0_40px_rgba(239,68,68,0.4)] hover:scale-105 transition-transform mb-4 lg:mb-6">
                <FaRocket className="text-lg lg:text-2xl" />
                <span>{formatButtonText()}</span>
              </button>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 lg:gap-4 text-gray-400 text-[10px] lg:text-sm">
                {icons.map((icon, index) => (
                  <React.Fragment key={index}>
                    <div className="flex items-center gap-1.5 lg:gap-2">
                      <span className="text-red-400 text-sm lg:text-lg">{getIconEmoji(icon.name)}</span>
                      <span>{icon.label}</span>
                    </div>
                    {index < icons.length - 1 && (
                      <span className="text-gray-600 hidden sm:inline">•</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

FooterEditor.displayName = 'FooterEditor';

export default FooterEditor;