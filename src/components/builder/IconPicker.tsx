// components/builder/IconPicker.tsx
'use client';

import React, { useState } from 'react';
import { FaSearch } from 'react-icons/fa';

interface IconPickerProps {
  selected: string;
  onSelect: (icon: string) => void;
}

const IconPicker: React.FC<IconPickerProps> = ({ selected, onSelect }) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const iconCategories = {
    popular: {
      label: 'Popular',
      icons: ['🚀', '🔥', '⭐', '💎', '👑', '🏆', '⚡', '💪', '🎯', '✨'],
    },
    arrows: {
      label: 'Arrows & Directions',
      icons: ['→', '←', '↑', '↓', '↗️', '↘️', '🔄', '🔀', '➡️', '⬅️'],
    },
    business: {
      label: 'Business & Money',
      icons: ['💰', '💵', '💳', '📈', '💹', '🤑', '💸', '🏦', '📊', '💼'],
    },
    social: {
      label: 'Social & Communication',
      icons: ['📱', '💬', '📧', '📞', '📲', '📹', '🎥', '📸', '📷', '🎬'],
    },
    success: {
      label: 'Success & Achievement',
      icons: ['✅', '🎯', '🏆', '🥇', '🥈', '🥉', '🎖️', '👏', '🙌', '💯'],
    },
    emotions: {
      label: 'Emotions',
      icons: ['😊', '😍', '🤩', '😎', '🔥', '💪', '👍', '✌️', '🤝', '❤️'],
    },
    time: {
      label: 'Time & Calendar',
      icons: ['⏰', '⏱️', '⏲️', '🕐', '🕑', '🕒', '📅', '📆', '🗓️', '⏳'],
    },
    symbols: {
      label: 'Symbols',
      icons: ['✓', '✔️', '✅', '❌', '⭕', '🔴', '🟢', '🟡', '🔵', '⚫'],
    },
    education: {
      label: 'Education & Learning',
      icons: ['📚', '📖', '📝', '✏️', '📕', '📗', '📘', '📙', '🎓', '🏫'],
    },
    tools: {
      label: 'Tools & Settings',
      icons: ['⚙️', '🔧', '🔨', '🛠️', '⚡', '🔌', '💡', '🔦', '🔍', '🔎'],
    },
  };

  const categories = Object.entries(iconCategories);
  const allIcons =
    category === 'all'
      ? Object.values(iconCategories).flatMap((cat) => cat.icons)
      : iconCategories[category as keyof typeof iconCategories]?.icons || [];

  const filteredIcons = allIcons.filter((icon) =>
    icon.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
          placeholder="Search icons..."
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
            category === 'all'
              ? 'bg-red-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          All
        </button>
        {categories.map(([key, cat]) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              category === key
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Icon Grid */}
      <div className="grid grid-cols-10 gap-2 max-h-64 overflow-y-auto p-2 bg-gray-800 rounded-lg">
        {filteredIcons.map((icon, index) => (
          <button
            key={index}
            onClick={() => onSelect(icon)}
            className={`w-10 h-10 flex items-center justify-center text-2xl rounded-lg transition-all hover:scale-110 ${
              selected === icon
                ? 'bg-red-600 ring-2 ring-red-400'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={icon}
          >
            {icon}
          </button>
        ))}
      </div>

      {filteredIcons.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No icons found matching "{search}"</p>
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-gray-400 text-center">
        {filteredIcons.length} icons available • Click to select
      </p>
    </div>
  );
};

export default IconPicker;