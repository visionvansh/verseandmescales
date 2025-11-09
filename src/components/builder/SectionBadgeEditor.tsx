// components/builder/SectionBadgeEditor.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaToggleOn, FaToggleOff, FaEdit, FaTimes } from "react-icons/fa";
import IconPicker from "./IconPicker";

interface SectionBadge {
  sectionId: string;
  enabled: boolean;
  text: string;
  emoji: string;
}

interface SectionBadgeEditorProps {
  badges: SectionBadge[];
  sections: Array<{
    id: string;
    title: string;
    type: string;
  }>;
  onChange: (badges: SectionBadge[]) => void;
}

const SectionBadgeEditor: React.FC<SectionBadgeEditorProps> = ({
  badges,
  sections,
  onChange,
}) => {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [currentEmoji, setCurrentEmoji] = useState("");

  const getBadgeForSection = (sectionId: string): SectionBadge => {
    return (
      badges.find((b) => b.sectionId === sectionId) || {
        sectionId,
        enabled: false,
        text: "",
        emoji: "🚀",
      }
    );
  };

  const updateBadge = (sectionId: string, updates: Partial<SectionBadge>) => {
    const newBadges = [...badges];
    const index = newBadges.findIndex((b) => b.sectionId === sectionId);

    if (index >= 0) {
      newBadges[index] = { ...newBadges[index], ...updates };
    } else {
      newBadges.push({
        sectionId,
        enabled: false,
        text: "",
        emoji: "🚀",
        ...updates,
      });
    }

    onChange(newBadges);
  };

  const toggleBadge = (sectionId: string) => {
    const badge = getBadgeForSection(sectionId);
    updateBadge(sectionId, { enabled: !badge.enabled });
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-800/50 border border-red-500/30 rounded-lg p-4">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <span className="text-2xl">🏷️</span>
          Section Badges
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          Add customizable badge labels above section titles (like "INSTAGRAM GROWTH MASTERCLASS 2025")
        </p>
      </div>

      {/* Sections List */}
      <div className="space-y-3">
        {sections.map((section) => {
          const badge = getBadgeForSection(section.id);
          const isEditing = editingSection === section.id;

          return (
            <motion.div
              key={section.id}
              className="bg-gray-800/50 border border-red-500/20 rounded-lg overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Section Header */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold text-sm mb-1">
                      {section.title || `${section.type} Section`}
                    </h4>
                    <p className="text-gray-500 text-xs capitalize">
                      {section.type.replace(/([A-Z])/g, " \$1").trim()}
                    </p>
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => toggleBadge(section.id)}
                    className="flex-shrink-0"
                  >
                    {badge.enabled ? (
                      <FaToggleOn className="text-3xl text-red-500" />
                    ) : (
                      <FaToggleOff className="text-3xl text-gray-600" />
                    )}
                  </button>
                </div>

                {/* Preview Badge */}
                {badge.enabled && badge.text && (
                  <div className="inline-flex items-center gap-2 bg-red-900/20 border border-red-500/30 px-3 py-1.5 rounded-full mb-3">
                    <span className="text-lg">{badge.emoji}</span>
                    <span className="text-red-400 font-bold text-xs">
                      {badge.text}
                    </span>
                  </div>
                )}

                {/* Edit Button */}
                {badge.enabled && (
                  <button
                    onClick={() =>
                      setEditingSection(isEditing ? null : section.id)
                    }
                    className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
                  >
                    {isEditing ? (
                      <>
                        <FaTimes /> Close
                      </>
                    ) : (
                      <>
                        <FaEdit /> Customize Badge
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Edit Form */}
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-red-500/20 p-4 bg-gray-900/30"
                >
                  <div className="space-y-3">
                    {/* Badge Text */}
                    <div>
                      <label className="block text-gray-400 text-xs font-bold mb-2">
                        Badge Text
                      </label>
                      <input
                        type="text"
                        value={badge.text}
                        onChange={(e) =>
                          updateBadge(section.id, { text: e.target.value.toUpperCase() })
                        }
                        placeholder="E.g., INSTAGRAM GROWTH MASTERCLASS 2025"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                      />
                      <p className="text-gray-500 text-xs mt-1">
                        Text will automatically be converted to uppercase
                      </p>
                    </div>

                    {/* Emoji Picker */}
                    <div>
                      <label className="block text-gray-400 text-xs font-bold mb-2">
                        Badge Emoji/Icon
                      </label>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center text-2xl">
                          {badge.emoji}
                        </div>
                        <button
                          onClick={() => {
                            setShowEmojiPicker(!showEmojiPicker);
                            setCurrentEmoji(badge.emoji);
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          {showEmojiPicker ? "Close Picker" : "Change Emoji"}
                        </button>
                      </div>

                      {/* Icon Picker */}
                      {showEmojiPicker && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3"
                        >
                          <IconPicker
                            selected={badge.emoji}
                            onSelect={(icon) => {
                              updateBadge(section.id, { emoji: icon });
                              setShowEmojiPicker(false);
                            }}
                          />
                        </motion.div>
                      )}
                    </div>

                    {/* Preview */}
                    <div className="pt-3 border-t border-red-500/20">
                      <label className="block text-gray-400 text-xs font-bold mb-2">
                        Preview
                      </label>
                      <div className="bg-black/50 border border-red-500/30 rounded-lg p-4 text-center">
                        <div className="inline-flex items-center gap-2 bg-red-900/20 border border-red-500/30 px-4 py-2 rounded-full">
                          <span className="text-xl">{badge.emoji}</span>
                          <span className="text-red-400 font-bold text-sm">
                            {badge.text || "YOUR TEXT HERE"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-3">
        <p className="text-gray-400 text-xs">
          💡 <strong>Tip:</strong> Enable badges for sections where you want to add context or categories (like course name, program type, or special labels)
        </p>
      </div>
    </div>
  );
};

export default SectionBadgeEditor;