'use client';

import React, { useState, memo, useCallback } from 'react';
import { 
  FaPlus, 
  FaTrash, 
  FaEdit, 
  FaImage, 
  FaTimes, 
  FaSave, 
  FaEye, 
  FaPalette,
  FaTag,
  FaMagic,
  FaHighlighter,
  FaCheckCircle,
  FaArrowUp,
  FaArrowDown,
  FaCloudUploadAlt,
  FaExclamationTriangle
} from 'react-icons/fa';

interface TitleWord {
  text: string;
  shade?: string;
}

interface ProofImage {
  id: string;
  order: number;
  imageUrl: string;
  title: string;
  description?: string;
  category?: string;
  showCategory?: boolean;
}

interface ProofSectionEditorProps {
  enabled: boolean;
  title: string;
  titleWords?: TitleWord[];
  images: ProofImage[];
  onChange: (data: { 
    enabled: boolean; 
    title: string; 
    titleWords?: TitleWord[];
    images: ProofImage[] 
  }) => void;
}

const MAX_PROOF_IMAGES = 5;

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
  const option = shadeOptions.find(s => s.value === shade);
  return option?.preview || 'text-white';
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
            onChange={(shade) => onUpdate(idx, { shade })}
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

const ProofSectionEditor: React.FC<ProofSectionEditorProps> = ({
  enabled,
  title,
  titleWords,
  images,
  onChange,
}) => {
  const [editingImage, setEditingImage] = useState<ProofImage | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState<'simple' | 'advanced'>('simple');
  const [localTitleWords, setLocalTitleWords] = useState<TitleWord[]>(
    titleWords || title.split(' ').map(word => ({ text: word, shade: 'none' }))
  );

  const addImage = useCallback(() => {
    if (images.length >= MAX_PROOF_IMAGES) {
      alert(`Maximum ${MAX_PROOF_IMAGES} proof images allowed`);
      return;
    }

    const newImage: ProofImage = {
      id: `proof-${Date.now()}`,
      order: images.length,
      imageUrl: '',
      title: 'New Proof',
      description: '',
      category: 'Growth Results',
      showCategory: true,
    };

    setEditingImage(newImage);
    setShowModal(true);
  }, [images.length]);

  const saveImage = useCallback(() => {
    if (!editingImage) return;

    const existingIndex = images.findIndex((img) => img.id === editingImage.id);
    let newImages;

    if (existingIndex >= 0) {
      newImages = [...images];
      newImages[existingIndex] = editingImage;
    } else {
      newImages = [...images, editingImage];
    }

    onChange({ enabled: true, title, titleWords: localTitleWords, images: newImages });
    setShowModal(false);
    setEditingImage(null);
  }, [editingImage, images, title, localTitleWords, onChange]);

  const deleteImage = useCallback((id: string) => {
    if (confirm('Delete this proof image?')) {
      onChange({
        enabled: true,
        title,
        titleWords: localTitleWords,
        images: images.filter((img) => img.id !== id),
      });
    }
  }, [images, title, localTitleWords, onChange]);

  const moveImage = useCallback((index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= newImages.length) return;

    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    
    newImages.forEach((img, idx) => {
      img.order = idx;
    });

    onChange({ enabled: true, title, titleWords: localTitleWords, images: newImages });
  }, [images, title, localTitleWords, onChange]);

  const handleSimpleTitleChange = useCallback((newTitle: string) => {
    const words = newTitle.split(' ').map(word => ({ text: word, shade: 'none' }));
    setLocalTitleWords(words);
    onChange({ enabled: true, title: newTitle, titleWords: words, images });
  }, [images, onChange]);

  const convertToWords = useCallback(() => {
    const text = localTitleWords.map(w => w.text).join(' ');
    if (!text || !text.trim()) {
      alert('Please enter text first');
      return;
    }

    const words = text.split(' ').filter(w => w.trim());
    const wordArray: TitleWord[] = words.map(word => ({
      text: word,
      shade: 'none'
    }));

    setLocalTitleWords(wordArray);
    onChange({ enabled: true, title: text, titleWords: wordArray, images });
  }, [localTitleWords, images, onChange]);

  const addWord = useCallback(() => {
    const newWords = [...localTitleWords, { text: '', shade: 'none' }];
    setLocalTitleWords(newWords);
    onChange({ 
      enabled: true, 
      title: newWords.map(w => w.text).join(' '), 
      titleWords: newWords, 
      images 
    });
  }, [localTitleWords, images, onChange]);

  const updateWord = useCallback((index: number, updates: Partial<TitleWord>) => {
    const updated = [...localTitleWords];
    updated[index] = { ...updated[index], ...updates };
    setLocalTitleWords(updated);
    onChange({ 
      enabled: true, 
      title: updated.map(w => w.text).join(' '), 
      titleWords: updated, 
      images 
    });
  }, [localTitleWords, images, onChange]);

  const deleteWord = useCallback((index: number) => {
    if (localTitleWords.length === 1) {
      setLocalTitleWords([]);
      onChange({ enabled: true, title: '', titleWords: [], images });
      return;
    }
    
    const updated = localTitleWords.filter((_, i) => i !== index);
    setLocalTitleWords(updated);
    onChange({ 
      enabled: true, 
      title: updated.map(w => w.text).join(' '), 
      titleWords: updated, 
      images 
    });
  }, [localTitleWords, images, onChange]);

  const moveWord = useCallback((index: number, direction: 'up' | 'down') => {
    const updated = [...localTitleWords];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= updated.length) return;

    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setLocalTitleWords(updated);
    onChange({ 
      enabled: true, 
      title: updated.map(w => w.text).join(' '), 
      titleWords: updated, 
      images 
    });
  }, [localTitleWords, images, onChange]);

  const renderWordEditor = useCallback(() => {
    if (localTitleWords.length === 0) {
      return (
        <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg p-3 lg:p-4 text-center">
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <FaPlus className="text-red-400 text-sm lg:text-base" />
          </div>
          <p className="text-gray-300 mb-1 font-bold text-xs lg:text-sm">
            Start Creating Section Title
          </p>
          <p className="text-gray-500 text-[10px] lg:text-xs mb-2 lg:mb-3">
            Add words or convert text
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center items-stretch sm:items-center">
            <button
              onClick={addWord}
              className="px-3 lg:px-4 py-1.5 lg:py-2 bg-red-600 rounded font-bold hover:bg-red-700 transition-colors inline-flex items-center justify-center gap-1.5 text-xs"
            >
              <FaPlus className="text-[10px]" /> Add Word
            </button>

            {title && (
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
      );
    }

    return (
      <div className="space-y-2 lg:space-y-3">
        {localTitleWords.map((word: TitleWord, idx: number) => (
          <WordEditor
            key={idx}
            word={word}
            idx={idx}
            totalWords={localTitleWords.length}
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
      </div>
    );
  }, [localTitleWords, title, addWord, convertToWords, updateWord, deleteWord, moveWord]);

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Header */}
      <div className="flex-1 min-w-0">
        <h2 className="text-lg lg:text-xl font-black text-white mb-1 truncate">
          Proof Gallery Section
        </h2>
        <p className="text-gray-400 text-[10px] lg:text-xs">
          Showcase student results and achievements
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
              Quick text input
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
              Word-by-word color
            </div>
          </button>
        </div>
      </div>

      {/* SIMPLE MODE */}
      {editMode === 'simple' && (
        <div className="space-y-3 lg:space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 lg:p-4">
            <h3 className="text-sm lg:text-base font-bold text-white mb-2 lg:mb-3 flex items-center gap-2">
              <FaHighlighter className="text-red-400 text-xs" />
              Section Title
            </h3>

            <div>
              <input
                type="text"
                value={localTitleWords.map(w => w.text).join(' ')}
                onChange={(e) => handleSimpleTitleChange(e.target.value)}
                className="w-full px-2 lg:px-3 py-2 lg:py-2.5 bg-gray-800 border-2 border-red-500/30 rounded text-white font-bold text-xs lg:text-sm focus:outline-none focus:border-red-500 transition-colors"
                placeholder="REAL PROOF FROM REAL STUDENTS"
              />
            </div>

            {/* Live Preview in Editor */}
            <div className="mt-3 lg:mt-4 p-3 lg:p-4 bg-black/60 border-2 border-red-500/30 rounded">
              <div className="flex items-center gap-2 mb-2 lg:mb-3">
                <FaEye className="text-red-400 text-xs" />
                <span className="text-[10px] font-bold text-gray-400">LIVE PREVIEW</span>
              </div>
              <div className="text-center">
                <h2 className="text-lg lg:text-2xl font-black leading-tight">
                  {localTitleWords.map((word, idx) => (
                    <span key={idx} className={`${getShadeClass(word.shade)} mr-1`}>
                      {word.text}
                    </span>
                  ))}
                </h2>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADVANCED MODE */}
      {editMode === 'advanced' && (
        <div className="space-y-3 lg:space-y-4">
          <div className="bg-gray-900 border-2 border-gray-800 rounded-lg p-2 lg:p-3">
           
            {renderWordEditor()}

            {/* Live Preview in Editor */}
            {localTitleWords.length > 0 && (
              <div className="mt-3 lg:mt-4 p-3 lg:p-4 bg-black/60 border-2 border-red-500/30 rounded">
                <div className="flex items-center gap-2 mb-2 lg:mb-3">
                  <FaEye className="text-red-400 text-xs" />
                  <span className="text-[10px] font-bold text-gray-400">LIVE PREVIEW</span>
                </div>
                <div className="text-center">
                  <h2 className="text-lg lg:text-2xl font-black leading-tight">
                    {localTitleWords.map((word, idx) => (
                      <span key={idx} className={`${getShadeClass(word.shade)} mr-1`}>
                        {word.text}
                      </span>
                    ))}
                  </h2>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Proof Images Section */}
      <div className="bg-gray-900 border-2 border-gray-800 rounded-lg p-3 lg:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 lg:gap-3 mb-3 lg:mb-4">
          <div>
            <h3 className="text-sm lg:text-base font-bold text-white mb-0.5">
              Proof Images
            </h3>
            <p className="text-[10px] lg:text-xs text-gray-400">
              {images.length}/{MAX_PROOF_IMAGES} images added
            </p>
          </div>
          <button
            onClick={addImage}
            disabled={images.length >= MAX_PROOF_IMAGES}
            className={`w-full sm:w-auto px-3 lg:px-4 py-2 lg:py-2.5 rounded font-bold transition-all flex items-center justify-center gap-1.5 text-xs ${
              images.length >= MAX_PROOF_IMAGES
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed border-2 border-gray-600'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            <FaPlus className="text-[10px]" />
            <span>Add Image</span>
            {images.length >= MAX_PROOF_IMAGES && <span className="text-[9px]">(Max)</span>}
          </button>
        </div>

        {images.length === 0 ? (
          <div className="text-center py-6 lg:py-8 bg-gray-800 border-2 border-dashed border-gray-700 rounded">
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-2 lg:mb-3">
              <FaImage className="text-2xl lg:text-3xl text-red-400" />
            </div>
            <p className="text-gray-400 mb-1 font-bold text-xs lg:text-sm">No proof images yet</p>
            <p className="text-gray-500 text-[10px] lg:text-xs mb-3 lg:mb-4">Add screenshots of student results</p>
            <button
              onClick={addImage}
              className="px-4 lg:px-5 py-2 lg:py-2.5 bg-red-600 rounded font-bold hover:bg-red-700 transition-colors text-xs inline-flex items-center gap-1.5"
            >
              <FaPlus className="text-[10px]" />
              Add Your First Proof
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="bg-gray-800 border border-gray-700 rounded overflow-hidden hover:border-red-500/50 transition-colors group"
              >
                {/* Image Preview with 16:9 ratio */}
                <div className="aspect-video bg-gray-800 flex items-center justify-center relative">
                  {image.imageUrl ? (
                    <img
                      src={image.imageUrl}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-gray-600">
                      <FaImage className="text-xl lg:text-2xl mx-auto mb-1" />
                      <span className="text-[10px] block">16:9 Ratio</span>
                      <span className="text-[9px] text-gray-700">Required</span>
                    </div>
                  )}

                  {/* Category Badge Preview */}
                  {image.showCategory && image.category && (
                    <div className="absolute top-1.5 lg:top-2 left-1.5 lg:left-2 bg-red-600 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full">
                      <span className="text-white font-bold text-[9px] lg:text-[10px] flex items-center gap-0.5 lg:gap-1">
                        <FaTag className="text-[7px] lg:text-[8px]" /> {image.category}
                      </span>
                    </div>
                  )}

                  {/* Order Badge */}
                  <div className="absolute top-1.5 lg:top-2 right-1.5 lg:right-2 bg-black/80 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full">
                    <span className="text-white font-bold text-[9px] lg:text-[10px]">
                      #{index + 1}
                    </span>
                  </div>
                </div>

                {/* Image Info */}
                <div className="p-2 lg:p-3">
                  <h4 className="font-bold text-white mb-1 text-xs lg:text-sm truncate">
                    {image.title}
                  </h4>
                  {image.description && (
                    <p className="text-[10px] lg:text-xs text-gray-400 mb-2 lg:mb-3 line-clamp-2 min-h-[2rem] lg:min-h-[2.5rem]">
                      {image.description}
                    </p>
                  )}

                  <div className="flex flex-col xs:flex-row gap-1.5 lg:gap-2">
                    <button
                      onClick={() => {
                        setEditingImage(image);
                        setShowModal(true);
                      }}
                      className="flex-1 px-2 lg:px-3 py-1.5 lg:py-2 bg-blue-600 rounded text-xs font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <FaEdit className="text-[10px]" /> Edit
                    </button>
                    <div className="flex gap-1.5 lg:gap-2 xs:flex-1">
                      <button
                        onClick={() => moveImage(index, 'up')}
                        disabled={index === 0}
                        className="flex-1 xs:flex-none px-2 lg:px-3 py-1.5 lg:py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move Left"
                      >
                        <FaArrowUp className="text-xs rotate-[-90deg]" />
                      </button>
                      <button
                        onClick={() => moveImage(index, 'down')}
                        disabled={index === images.length - 1}
                        className="flex-1 xs:flex-none px-2 lg:px-3 py-1.5 lg:py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move Right"
                      >
                        <FaArrowDown className="text-xs rotate-[-90deg]" />
                      </button>
                      <button
                        onClick={() => deleteImage(image.id)}
                        className="flex-1 xs:flex-none px-2 lg:px-3 py-1.5 lg:py-2 bg-red-600/20 border border-red-500/30 rounded hover:bg-red-600 hover:border-red-500 transition-all group"
                        title="Delete"
                      >
                        <FaTrash className="text-red-400 group-hover:text-white text-xs" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Section Preview */}
      {localTitleWords.length > 0 && images.length > 0 && (
        <div className="bg-black border-4 border-red-500/60 rounded-xl p-3 lg:p-4">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <h3 className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
              <FaEye className="text-red-400 text-xs" /> FULL SECTION PREVIEW
            </h3>
            <div className="text-[9px] lg:text-[10px] text-gray-500">
              {editMode === 'simple' ? 'Simple' : 'Advanced'} Mode • {images.length} Images
            </div>
          </div>
          
          <div className="mb-4 lg:mb-6 text-center">
            <h2 className="text-lg lg:text-2xl font-black leading-tight">
              {localTitleWords.map((word, idx) => (
                <span key={idx} className={`${getShadeClass(word.shade)} mr-1`}>
                  {word.text}
                </span>
              ))}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {images.slice(0, 3).map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-video bg-gray-900 rounded overflow-hidden">
                  {image.imageUrl && (
                    <img
                      src={image.imageUrl}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {image.showCategory && image.category && (
                    <div className="absolute top-1.5 lg:top-2 left-1.5 lg:left-2 bg-red-600 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full">
                      <span className="text-white font-bold text-[9px] lg:text-[10px] flex items-center gap-0.5 lg:gap-1">
                        <FaTag className="text-[7px] lg:text-[8px]" /> {image.category}
                      </span>
                    </div>
                  )}
                </div>
                <h4 className="mt-1.5 lg:mt-2 font-bold text-white text-xs lg:text-sm truncate">
                  {image.title}
                </h4>
              </div>
            ))}
          </div>

          {images.length > 3 && (
            <p className="text-center mt-3 lg:mt-4 text-[10px] lg:text-xs text-gray-400">
              + {images.length - 3} more image{images.length - 3 > 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* MODAL */}
      {showModal && editingImage && (
        <ProofImageModal
          image={editingImage}
          onSave={saveImage}
          onClose={() => {
            setShowModal(false);
            setEditingImage(null);
          }}
          onChange={setEditingImage}
        />
      )}
    </div>
  );
};

// Proof Image Modal Component
const ProofImageModal = memo(({ image, onSave, onClose, onChange }: any) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string>('');

  const handleCloudinaryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, GIF, WEBP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      setError('Cloudinary not configured. Please add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME to your .env.local file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ml_default'); 
      formData.append('folder', 'proof_images');

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return 85;
          }
          return prev + 15;
        });
      }, 300);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      clearInterval(progressInterval);
      setUploadProgress(95);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Cloudinary error:', errorData);
        throw new Error(
          errorData.error?.message || 
          `Upload failed with status ${response.status}. Check your upload preset settings.`
        );
      }

      const data = await response.json();
      setUploadProgress(100);

      onChange({ ...image, imageUrl: data.secure_url });

      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        setError('');
      }, 500);
    } catch (error) {
      console.error('Upload error:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Failed to upload image. Please check your Cloudinary configuration.'
      );
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const predefinedCategories = [
    'Growth Results',
    'Income Proof',
    'Viral Content',
    'Student Success',
    'Analytics',
    'Engagement',
    'Monetization',
    'Follower Growth',
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 lg:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-900 border-2 border-red-500/50 rounded-xl p-3 lg:p-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-3 lg:mb-4">
          <h3 className="text-base lg:text-lg font-black text-white flex items-center gap-2">
            <FaCloudUploadAlt className="text-red-400" />
            Edit Proof Image
          </h3>
          <button 
            onClick={onClose} 
            disabled={uploading}
            className="p-1.5 lg:p-2 hover:bg-gray-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaTimes className="text-gray-400 text-xs lg:text-sm" />
          </button>
        </div>

        <div className="space-y-3 lg:space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block text-[10px] lg:text-xs font-bold text-gray-300 mb-1.5 lg:mb-2">
              Upload Image (16:9 Ratio Recommended)
            </label>
            
            {/* Error Alert */}
            {error && (
              <div className="mb-3 p-3 bg-red-900/30 border-2 border-red-500/50 rounded flex items-start gap-2">
                <FaExclamationTriangle className="text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-200 text-xs font-bold mb-1">Upload Failed</p>
                  <p className="text-red-300 text-[10px]">{error}</p>
                </div>
                <button
                  onClick={() => setError('')}
                  className="text-red-400 hover:text-red-300"
                >
                  <FaTimes />
                </button>
              </div>
            )}

            <div className="border-2 border-dashed border-red-500/30 rounded p-3 lg:p-4 bg-gray-800/50 hover:border-red-500/50 transition-colors">
              {image.imageUrl ? (
                <div className="relative">
                  <div className="aspect-video w-full overflow-hidden rounded mb-2 lg:mb-3">
                    <img
                      src={image.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => onChange({ ...image, imageUrl: '' })}
                    disabled={uploading}
                    className="absolute top-1.5 lg:top-2 right-1.5 lg:right-2 p-1.5 lg:p-2 bg-red-600 rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaTrash className="text-[10px] lg:text-xs" />
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FaCloudUploadAlt className="text-3xl lg:text-4xl text-red-400 mx-auto mb-2" />
                  <p className="text-gray-300 mb-1 text-xs lg:text-sm font-bold">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-gray-500 text-[10px] lg:text-xs mb-2">
                    Recommended: 1920x1080px or 1280x720px
                  </p>
                  <p className="text-gray-600 text-[9px] lg:text-[10px]">
                    JPG, PNG, GIF, WEBP (Max 10MB)
                  </p>
                </div>
              )}

              {uploading && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-300 font-bold flex items-center gap-2">
                      <FaCloudUploadAlt className="text-red-400" />
                      Uploading...
                    </span>
                    <span className="text-xs text-red-400 font-bold">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full bg-red-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleCloudinaryUpload}
                disabled={uploading}
                className="w-full text-[10px] lg:text-xs text-gray-400 file:mr-2 lg:file:mr-3 file:py-1.5 lg:file:py-2 file:px-3 lg:file:px-4 file:rounded file:border-0 file:text-[10px] lg:file:text-xs file:font-bold file:bg-red-600 file:text-white hover:file:bg-red-700 file:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 file:transition-colors"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[10px] lg:text-xs font-bold text-gray-300 mb-1.5 lg:mb-2">Title</label>
            <input
              type="text"
              value={image.title}
              onChange={(e) => onChange({ ...image, title: e.target.value })}
              disabled={uploading}
              className="w-full px-2 lg:px-3 py-1.5 lg:py-2 bg-gray-800 border border-red-500/30 rounded text-white font-bold text-xs lg:text-sm focus:outline-none focus:border-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="From 0 to 100K in 90 Days"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] lg:text-xs font-bold text-gray-300 mb-1.5 lg:mb-2">
              Description <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
            <textarea
              value={image.description || ''}
              onChange={(e) => onChange({ ...image, description: e.target.value })}
              rows={3}
              disabled={uploading}
              className="w-full px-2 lg:px-3 py-1.5 lg:py-2 bg-gray-800 border border-red-500/30 rounded text-white text-[10px] lg:text-xs focus:outline-none focus:border-red-500 transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Complete beginner to viral success..."
            />
          </div>

          {/* Category Badge */}
          <div>
            <div className="flex items-center justify-between mb-1.5 lg:mb-2">
              <label className="block text-[10px] lg:text-xs font-bold text-gray-300">
                Category Badge
              </label>
              <label className="flex items-center gap-1.5 lg:gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={image.showCategory ?? true}
                  onChange={(e) => onChange({ ...image, showCategory: e.target.checked })}
                  disabled={uploading}
                  className="w-3.5 h-3.5 lg:w-4 lg:h-4 rounded border-gray-600 text-red-600 focus:ring-red-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                />
                <span className="text-[10px] lg:text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                  Show Badge
                </span>
              </label>
            </div>

            {image.showCategory && (
              <>
                <div className="grid grid-cols-2 gap-1.5 lg:gap-2 mb-2 lg:mb-3">
                  {predefinedCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => onChange({ ...image, category: cat })}
                      disabled={uploading}
                      className={`px-2 lg:px-3 py-1.5 lg:py-2 rounded font-bold transition-colors text-[10px] lg:text-xs disabled:opacity-50 disabled:cursor-not-allowed ${
                        image.category === cat
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={image.category || ''}
                  onChange={(e) => onChange({ ...image, category: e.target.value })}
                  disabled={uploading}
                  className="w-full px-2 lg:px-3 py-1.5 lg:py-2 bg-gray-800 border border-red-500/30 rounded text-white text-[10px] lg:text-xs focus:outline-none focus:border-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Or type custom category..."
                />

                {image.category && (
                  <div className="mt-2 lg:mt-3 p-2 lg:p-3 bg-gray-800/50 border border-gray-700 rounded">
                    <p className="text-[10px] text-gray-400 mb-1.5 lg:mb-2 font-bold">BADGE PREVIEW:</p>
                    <div className="inline-block bg-red-600 px-2 lg:px-3 py-1 lg:py-1.5 rounded-full">
                      <span className="text-white font-bold text-[10px] lg:text-xs flex items-center gap-1 lg:gap-1.5">
                        <FaTag className="text-[9px] lg:text-[10px]" /> {image.category}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col xs:flex-row gap-1.5 lg:gap-2 mt-4 lg:mt-5">
          <button
            onClick={onSave}
            disabled={uploading || !image.imageUrl || !image.title.trim()}
            className="flex-1 px-4 lg:px-5 py-2 lg:py-2.5 bg-red-600 rounded font-bold hover:bg-red-700 transition-colors text-xs lg:text-sm flex items-center justify-center gap-1.5 lg:gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSave className="text-[10px] lg:text-xs" />
            {uploading ? 'Uploading...' : 'Save Image'}
          </button>
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 lg:px-5 py-2 lg:py-2.5 bg-gray-800 border border-gray-700 rounded font-bold hover:bg-gray-700 hover:border-gray-600 transition-colors text-xs lg:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
});

ProofImageModal.displayName = 'ProofImageModal';

export default memo(ProofSectionEditor);