// components/builder/CustomSectionEditor.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaArrowUp,
  FaArrowDown,
  FaGripVertical,
  FaSave,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaPalette,
  FaCheckCircle,
  FaMagic,
  FaInfoCircle,
  FaLink,
} from "react-icons/fa";
import IconPicker from "./IconPicker";

interface TitleWord {
  text: string;
  shade?:
    | "none"
    | "red-light"
    | "red-medium"
    | "red-dark"
    | "red-gradient-1"
    | "red-gradient-2"
    | "red-gradient-3"
    | "gray-light"
    | "gray-medium";
}

interface CustomSection {
  id: string;
  order: number;
  titleWords: TitleWord[];
  descriptionWords?: TitleWord[];
  subtitle?: string;
  cards: SectionCard[];
}

interface SectionCard {
  id: string;
  order: number;
  cardType: "steps_card" | "bullet_card" | "detailed_card" | "connecting_card";
  icon?: string;
  title: string;
  description?: string;
  color: string;
  showStepNumber?: boolean;
  stepNumber?: number;
  showIcon?: boolean;
  bulletPoints?: string[];
  bulletEmojis?: string[];
  useTwoColors?: boolean;
  secondaryColor?: string;
  showCountNumber?: boolean;
  countNumber?: number;
  dayRangeLabel?: string;
  milestoneText?: string;
  squareIcon?: string;
  isConnected?: boolean;
}

interface CustomSectionEditorProps {
  sections: CustomSection[];
  onChange: (sections: CustomSection[]) => void;
}

const CustomSectionEditor: React.FC<CustomSectionEditorProps> = ({
  sections,
  onChange,
}) => {
  const [editingSection, setEditingSection] = useState<CustomSection | null>(
    null
  );
  const [editingCard, setEditingCard] = useState<SectionCard | null>(null);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);

  const maxSections = 3;

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

  const addSection = () => {
    if (sections.length >= maxSections) {
      alert(`Maximum ${maxSections} sections allowed`);
      return;
    }

    const newSection: CustomSection = {
      id: `section-${Date.now()}`,
      order: sections.length,
      titleWords: [{ text: "ADD YOUR TITLE", shade: "gray-light" }],
      descriptionWords: [{ text: "ADD YOUR DESCRIPTION", shade: "none" }],
      cards: [],
    };

    setEditingSection(newSection);
    setShowSectionModal(true);
  };

  const saveSection = () => {
    if (!editingSection) return;

    const existingIndex = sections.findIndex((s) => s.id === editingSection.id);

    if (existingIndex >= 0) {
      const updated = [...sections];
      updated[existingIndex] = editingSection;
      onChange(updated);
    } else {
      onChange([...sections, editingSection]);
    }

    setShowSectionModal(false);
    setEditingSection(null);
  };

  const deleteSection = (id: string) => {
    if (confirm("Delete this section and all its cards?")) {
      onChange(sections.filter((s) => s.id !== id));
    }
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const newSections = [...sections];
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= sections.length) return;

    [newSections[index], newSections[newIndex]] = [
      newSections[newIndex],
      newSections[index],
    ];
    newSections.forEach((s, i) => (s.order = i));

    onChange(newSections);
  };

  const addCard = (
    sectionId: string,
    cardType: "steps_card" | "bullet_card" | "detailed_card" | "connecting_card"
  ) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    const newCard: SectionCard = {
      id: `card-${Date.now()}`,
      order: section.cards.length,
      cardType,
      icon: "🚀",
      title: "Card Title",
      description: "Card description goes here",
      color: "from-red-600 to-red-700",

      ...(cardType === "steps_card" && {
        showStepNumber: true,
        stepNumber: section.cards.length + 1,
      }),

      ...(cardType === "bullet_card" && {
        showIcon: true,
        bulletPoints: ["First point", "Second point"],
        bulletEmojis: ["•", "•"],
        useTwoColors: false,
        secondaryColor: "from-red-500 to-red-600",
      }),

      ...(cardType === "detailed_card" && {
        showCountNumber: true,
        countNumber: section.cards.length + 1,
        dayRangeLabel: "Days 1-30",
        milestoneText: "First Milestone",
        squareIcon: "🎯",
      }),

      ...(cardType === "connecting_card" && {
        showCountNumber: true,
        countNumber: section.cards.length + 1,
        dayRangeLabel: "Days 1-30",
        milestoneText: "First Milestone",
        icon: "🚀",
        isConnected: true,
      }),
    };

    setEditingSection(section);
    setEditingCard(newCard);
    setShowCardModal(true);
  };

  const saveCard = () => {
    if (!editingSection || !editingCard) return;

    const updatedSection = { ...editingSection };
    const existingIndex = updatedSection.cards.findIndex(
      (c) => c.id === editingCard.id
    );

    if (existingIndex >= 0) {
      updatedSection.cards[existingIndex] = editingCard;
    } else {
      updatedSection.cards.push(editingCard);
    }

    const sectionIndex = sections.findIndex((s) => s.id === updatedSection.id);
    const newSections = [...sections];
    newSections[sectionIndex] = updatedSection;

    onChange(newSections);
    setShowCardModal(false);
    setEditingCard(null);
    setEditingSection(null);
  };

  const deleteCard = (sectionId: string, cardId: string) => {
    if (confirm("Delete this card?")) {
      const section = sections.find((s) => s.id === sectionId);
      if (!section) return;

      const updatedSection = {
        ...section,
        cards: section.cards.filter((c) => c.id !== cardId),
      };

      const newSections = sections.map((s) =>
        s.id === sectionId ? updatedSection : s
      );
      onChange(newSections);
    }
  };

  const moveCard = (
    sectionId: string,
    cardIndex: number,
    direction: "up" | "down"
  ) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    const cards = [...section.cards];
    const newIndex = direction === "up" ? cardIndex - 1 : cardIndex + 1;

    if (newIndex < 0 || newIndex >= cards.length) return;

    [cards[cardIndex], cards[newIndex]] = [cards[newIndex], cards[cardIndex]];
    cards.forEach((c, i) => (c.order = i));

    const updatedSection = { ...section, cards };
    const newSections = sections.map((s) =>
      s.id === sectionId ? updatedSection : s
    );
    onChange(newSections);
  };

  return (
    <div className="space-y-3 lg:space-y-4">
{/* Header */}
<div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-2">
  <div className="flex-1 min-w-0">
    <h2 className="text-lg lg:text-xl font-black text-white mb-1 truncate">
      Custom Sections Manager
    </h2>
    <p className="text-gray-400 text-[10px] lg:text-xs">
      Create up to {maxSections} custom sections ({sections.length}/
      {maxSections} used)
    </p>
  </div>
  
  {/* ADD THIS BUTTON */}
  {sections.length > 0 && sections.length < maxSections && (
    <button
      onClick={addSection}
      className="flex items-center gap-1.5 px-3 lg:px-4 py-2 lg:py-2.5 bg-gradient-to-r from-red-600 to-red-700 rounded-lg font-bold hover:opacity-90 transition-opacity text-xs lg:text-sm whitespace-nowrap"
    >
      <FaPlus className="text-[10px]" />
      <span>Add Section {sections.length + 1}</span>
    </button>
  )}
</div>

      {/* Sections List */}
      <div className="space-y-3 lg:space-y-4">
        {sections.map((section, sectionIndex) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 border-2 border-red-500/30 rounded-lg p-2 lg:p-3"
          >
            {/* Section Header */}
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FaGripVertical className="text-gray-600 cursor-move text-xs flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1 mb-0.5">
                    {section.titleWords.map((word, idx) => (
                      <span
                        key={idx}
                        className={`text-sm lg:text-base font-black ${getShadeClass(
                          word.shade
                        )}`}
                      >
                        {word.text}
                      </span>
                    ))}
                  </div>
                  {section.descriptionWords &&
                  section.descriptionWords.length > 0 ? (
                    <p className="text-[10px] lg:text-xs flex flex-wrap gap-0.5">
                      {section.descriptionWords.map((word, idx) => (
                        <span key={idx} className={getShadeClass(word.shade)}>
                          {word.text}
                        </span>
                      ))}
                    </p>
                  ) : section.subtitle ? (
                    <p className="text-[10px] lg:text-xs text-gray-400">
                      {section.subtitle}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => moveSection(sectionIndex, "up")}
                  disabled={sectionIndex === 0}
                  className="p-1.5 bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-50 text-xs"
                  title="Move Up"
                >
                  <FaArrowUp />
                </button>
                <button
                  onClick={() => moveSection(sectionIndex, "down")}
                  disabled={sectionIndex === sections.length - 1}
                  className="p-1.5 bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-50 text-xs"
                  title="Move Down"
                >
                  <FaArrowDown />
                </button>
                <button
                  onClick={() => {
                    setEditingSection(section);
                    setShowSectionModal(true);
                  }}
                  className="p-1.5 bg-blue-600 rounded hover:bg-blue-700 text-xs"
                  title="Edit Section"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => deleteSection(section.id)}
                  className="p-1.5 bg-red-600 rounded hover:bg-red-700 text-xs"
                  title="Delete Section"
                >
                  <FaTrash />
                </button>
              </div>
            </div>

            {/* Live Preview of Section Title */}
            <div className="mb-3 lg:mb-4 p-2 lg:p-3 bg-black border border-red-500/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] lg:text-xs font-bold text-gray-400 flex items-center gap-1">
                  <FaEye className="text-red-400" /> SECTION PREVIEW
                </span>
              </div>
              <div className="text-center">
                <h2 className="text-xl lg:text-2xl font-black leading-tight mb-1.5 lg:mb-2">
                  {section.titleWords.map((word, idx) => (
                    <span
                      key={idx}
                      className={`${getShadeClass(word.shade)} mr-1.5`}
                    >
                      {word.text}
                    </span>
                  ))}
                </h2>
                {section.descriptionWords &&
                  section.descriptionWords.length > 0 && (
                    <p className="text-xs lg:text-sm flex flex-wrap gap-1 justify-center">
                      {section.descriptionWords.map((word, idx) => (
                        <span key={idx} className={getShadeClass(word.shade)}>
                          {word.text}
                        </span>
                      ))}
                    </p>
                  )}
              </div>
            </div>

            {/* Add Card Buttons */}
            <div className="mb-3 flex flex-col xs:flex-row gap-2">
              <button
                onClick={() => addCard(section.id, "steps_card")}
                className="flex-1 px-2 lg:px-3 py-2 lg:py-2.5 bg-gradient-to-r from-red-600 to-red-700 rounded-lg font-bold hover:opacity-90 transition-opacity"
              >
                <div className="text-xs lg:text-sm">+ Steps Card</div>
                <div className="text-[10px] text-red-200 mt-0.5">
                  With step numbers
                </div>
              </button>
              <button
                onClick={() => addCard(section.id, "bullet_card")}
                className="flex-1 px-2 lg:px-3 py-2 lg:py-2.5 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg font-bold hover:opacity-90 transition-opacity"
              >
                <div className="text-xs lg:text-sm">+ Bullet Card</div>
                <div className="text-[10px] text-orange-200 mt-0.5">
                  With bullet points
                </div>
              </button>
              <button
                onClick={() => addCard(section.id, "detailed_card")}
                className="flex-1 px-2 lg:px-3 py-2 lg:py-2.5 bg-gradient-to-r from-pink-600 to-red-600 rounded-lg font-bold hover:opacity-90 transition-opacity"
              >
                <div className="text-xs lg:text-sm">+ Detailed Card</div>
                <div className="text-[10px] text-pink-200 mt-0.5">
                  With timeline
                </div>
              </button>
              <button
                onClick={() => addCard(section.id, "connecting_card")}
                className="flex-1 px-2 lg:px-3 py-2 lg:py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-bold hover:opacity-90 transition-opacity"
              >
                <div className="text-xs lg:text-sm">+ Connecting Card</div>
                <div className="text-[10px] text-blue-200 mt-0.5">
                  With connectors
                </div>
              </button>
            </div>

            {/* Cards Grid */}
{section.cards.length === 0 ? (
  <div className="text-center py-6 lg:py-8 bg-gray-800/50 border border-dashed border-gray-700 rounded-lg">
    <p className="text-gray-500 mb-2 text-xs lg:text-sm">
      No cards in this section yet
    </p>
    <p className="text-[10px] text-gray-600">
      Click one of the buttons above to add a card
    </p>
  </div>
) : (
  <div className={`grid gap-2 lg:gap-3 ${
    // Check if section has connecting cards
    section.cards.some((c: any) => c.cardType === 'connecting_card')
      ? section.cards.length <= 4
        ? 'sm:grid-cols-2' // 2 columns for 4 or fewer cards
        : 'sm:grid-cols-2 md:grid-cols-3' // 3 columns for more than 4 cards
      : 'sm:grid-cols-2' // Default 2 columns for other card types
  }`}>
    {section.cards.map((card, cardIndex) => (
      <motion.div
        key={card.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-gray-800 border border-red-500/30 rounded-lg p-2 lg:p-3 group hover:border-red-500/60 transition-colors"
      >
        {/* Card Type Badge */}
        <div className="absolute top-1.5 right-1.5 z-10">
          <div className="bg-black/80 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-red-400 border border-red-500/30">
            {getCardTypeLabel(card.cardType)}
            {card.cardType === "connecting_card" && (
              <FaLink className="inline ml-1 text-[8px]" />
            )}
          </div>
        </div>

        {/* Inline Card Preview */}
        <div className="mb-2 lg:mb-3">
          <CardPreview 
            card={card} 
            index={cardIndex}
            totalCards={section.cards.length}
            sectionCards={section.cards}
          />
        </div>

        {/* Card Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-700">
          <div className="flex gap-1">
            <button
              onClick={() => moveCard(section.id, cardIndex, "up")}
              disabled={cardIndex === 0}
              className="p-1 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 text-[10px]"
              title="Move Up"
            >
              <FaArrowUp />
            </button>
            <button
              onClick={() =>
                moveCard(section.id, cardIndex, "down")
              }
              disabled={cardIndex === section.cards.length - 1}
              className="p-1 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 text-[10px]"
              title="Move Down"
            >
              <FaArrowDown />
            </button>
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => {
                setEditingSection(section);
                setEditingCard(card);
                setShowCardModal(true);
              }}
              className="p-1 bg-blue-600 rounded hover:bg-blue-700 text-[10px]"
              title="Edit Card"
            >
              <FaEdit />
            </button>
            <button
              onClick={() => deleteCard(section.id, card.id)}
              className="p-1 bg-red-600 rounded hover:bg-red-700 text-[10px]"
              title="Delete Card"
            >
              <FaTrash />
            </button>
          </div>
        </div>
      </motion.div>
    ))}
  </div>
)}
          </motion.div>
        ))}

        {sections.length === 0 && (
          <div className="text-center py-8 lg:py-12 text-white bg-gray-900 border-2 border-dashed border-gray-700 rounded-lg">
            <div className="text-3xl lg:text-4xl mb-2 lg:mb-3">📝</div>
            <p className="text-sm lg:text-base font-bold mb-1">
              No custom sections yet
            </p>
            <p className="text-xs lg:text-sm mb-3 lg:mb-4">
              Create your first custom section to get started
            </p>
            <button
              onClick={addSection}
              className="px-4 lg:px-6 py-2 lg:py-3 bg-red-600 rounded-lg font-bold text-xs lg:text-sm hover:bg-red-700 transition-colors"
            >
              Create Your First Section
            </button>
          </div>
        )}
      </div>

      {/* Section Modal */}
      <AnimatePresence>
        {showSectionModal && editingSection && (
          <SectionModal
            section={editingSection}
            onSave={saveSection}
            onClose={() => {
              setShowSectionModal(false);
              setEditingSection(null);
            }}
            onChange={setEditingSection}
            shadeOptions={shadeOptions}
          />
        )}
      </AnimatePresence>

      {/* Card Modal */}
      <AnimatePresence>
        {showCardModal && editingCard && editingSection && (
          <CardModal
            card={editingCard}
            section={editingSection}
            onSave={saveCard}
            onClose={() => {
              setShowCardModal(false);
              setEditingCard(null);
            }}
            onChange={setEditingCard}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper function to get shade class
const getShadeClass = (shade?: string) => {
  const shades: any = {
    none: "text-white",
    "red-light": "text-red-400",
    "red-medium": "text-red-500",
    "red-dark": "text-red-600",
    "red-gradient-1":
      "bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent",
    "red-gradient-2":
      "bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent",
    "red-gradient-3":
      "bg-gradient-to-r from-red-300 to-red-500 bg-clip-text text-transparent",
    "gray-light": "text-gray-400",
    "gray-medium": "text-gray-500",
  };
  return shades[shade || "none"];
};

// Updated Card Preview Component - Now matches the Instagram Course Homepage designs
// Replace the CardPreview component (around line 420) with this updated version:

const CardPreview = ({ 
  card, 
  index, 
  totalCards = 4,
  sectionCards = []
}: { 
  card: any; 
  index: number;
  totalCards?: number;
  sectionCards?: any[];
}) => {
  const isBeforeAfterStyle = card.cardType === "bullet_card";

  if (isBeforeAfterStyle) {
    // BULLET CARD DESIGN (unchanged)
    return (
      <div className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border-2 border-red-500/40 rounded-2xl overflow-hidden">
        {/* Bold Line at Top - Grey or Red based on useTwoColors */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 ${
            card.useTwoColors
              ? "bg-gray-600"
              : "bg-gradient-to-r from-red-600 to-red-700"
          }`}
        ></div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent pointer-events-none"></div>

        <div className="relative z-10 p-6">
          <div className="text-center mb-4">
            <div
              className={`inline-block ${
                card.useTwoColors
                  ? "bg-gray-800/50 border border-gray-600/30"
                  : "bg-gradient-to-r from-red-900/30 to-red-900/30 border border-red-500/30"
              } px-4 py-2 rounded-full mb-3`}
            >
              <span
                className={`${
                  card.useTwoColors ? "text-gray-400" : "text-red-400"
                } font-black text-lg`}
              >
                {card.title || "TITLE"}
              </span>
            </div>

            {/* Only show icon if showIcon is true */}
            {card.showIcon !== false && (
              <div className="text-4xl mb-2">{card.icon || "🚀"}</div>
            )}

            {card.description && (
              <p
                className={`${
                  card.useTwoColors ? "text-gray-500" : "text-red-400"
                } text-sm`}
              >
                {card.description}
              </p>
            )}
          </div>

          {/* Bullet Points with Lines and Alternating Colors */}
          <div className="space-y-2">
            {(card.bulletPoints || []).map((point: string, idx: number) => (
              <div
                key={idx}
                className={`flex justify-between items-center p-3 ${
                  card.useTwoColors && idx % 2 === 1
                    ? "bg-red-900/20 border border-red-500/30"
                    : card.useTwoColors
                    ? "bg-gray-900/50 border border-gray-700/30"
                    : "bg-red-900/20 border border-red-500/30"
                } rounded-lg`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`${
                      card.useTwoColors && idx % 2 === 1
                        ? "text-red-400"
                        : card.useTwoColors
                        ? "text-gray-400"
                        : "text-red-400"
                    } text-lg`}
                  >
                    {card.bulletEmojis?.[idx] || "•"}
                  </span>
                  <span
                    className={`${
                      card.useTwoColors && idx % 2 === 1
                        ? "text-gray-300"
                        : card.useTwoColors
                        ? "text-gray-400"
                        : "text-gray-300"
                    } font-medium text-sm`}
                  >
                    {point}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  } else if (card.cardType === "connecting_card") {
    // CONNECTING CARD DESIGN with dynamic column detection
    const hasConnectingCards = sectionCards.some((c: any) => c.cardType === 'connecting_card');
    
    // Determine columns based on total cards (2 cols for ≤4 cards, 3 cols for >4)
    const columns = hasConnectingCards && totalCards > 4 ? 3 : 2;
    
    // Calculate row and column position
    const row = Math.floor(index / columns);
    const col = index % columns;
    
    // Determine if there are cards to connect to
    const hasCardAbove = index >= columns;
    const hasCardBelow = index < totalCards - columns;
    const hasCardOnLeft = col > 0;
    const hasCardOnRight = col < columns - 1 && index < totalCards - 1;
    
    return (
      <div className="relative">
        {/* Top Connection Line - only if there's a card above AND isConnected is true */}
        {hasCardAbove && card.isConnected && (
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0.5 h-2 bg-gradient-to-b from-red-500/40 to-red-600"></div>
        )}

        <div className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-xl p-4 md:p-6 backdrop-blur-xl overflow-hidden group hover:border-red-500/60 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="relative z-10">
            {/* Icon */}
            <div
              className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r ${card.color} rounded-xl flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(239,68,68,0.3)]`}
            >
              <span className="text-xl md:text-2xl">{card.icon}</span>
            </div>

            {/* Phase number */}
            <div className="absolute top-2 right-2 text-4xl md:text-5xl font-black text-red-400/15">
              {String(index + 1).padStart(2, "0")}
            </div>

            {/* Day Range */}
            {card.dayRangeLabel && (
              <div className="inline-block bg-red-900/20 border border-red-500/30 px-2 md:px-3 py-1 md:py-1.5 rounded-full mb-2">
                <span className="text-red-400 font-bold text-[10px] md:text-xs">
                  {card.dayRangeLabel}
                </span>
              </div>
            )}

            {/* Title */}
            <h3 className="text-base md:text-lg font-black text-white mb-2 leading-tight">{card.title}</h3>
            
            {/* Description */}
            <p className="text-gray-300 leading-relaxed mb-3 text-xs md:text-sm line-clamp-3">
              {card.description}
            </p>

            {/* Milestone */}
            {card.milestoneText && (
              <div className="bg-gradient-to-r from-red-600/20 to-red-700/20 border border-red-500/30 rounded-lg p-2 md:p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-red-400 text-sm">🏆</span>
                  <span className="text-red-400 font-bold text-[9px] md:text-xs uppercase tracking-wider">
                    Milestone
                  </span>
                </div>
                <p className="text-white font-black text-xs md:text-sm line-clamp-2">{card.milestoneText}</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Connection Line - only if there's a card below AND isConnected is true */}
        {hasCardBelow && card.isConnected && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0.5 h-2 bg-gradient-to-b from-red-600 to-red-500/40"></div>
        )}
      </div>
    );
  } else {
    // STEPS CARD & DETAILED CARD (unchanged)
    return (
      <div className="relative">
        <div
          className={`w-12 h-12 bg-gradient-to-r ${card.color} rounded-xl flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(239,68,68,0.3)]`}
        >
          <span className="text-2xl">{card.icon}</span>
        </div>

        {((card.cardType === "steps_card" && card.showStepNumber) ||
          (card.cardType === "detailed_card" && card.showCountNumber)) && (
          <div className="absolute top-2 right-2 text-5xl font-black text-red-400/10">
            {card.cardType === "steps_card"
              ? String(card.stepNumber).padStart(2, "0")
              : String(card.countNumber).padStart(2, "0")}
          </div>
        )}

        {card.cardType === "steps_card" && card.showStepNumber && (
          <div className="text-red-400 font-bold mb-2 text-xs">
            STEP {card.stepNumber}
          </div>
        )}

        {card.cardType === "detailed_card" && card.dayRangeLabel && (
          <div className="inline-block bg-red-900/20 border border-red-500/30 px-3 py-1.5 rounded-full mb-2">
            <span className="text-red-400 font-bold text-xs">
              {card.dayRangeLabel}
            </span>
          </div>
        )}

        <h3 className="text-lg font-black text-white mb-2">{card.title}</h3>
        <p className="text-gray-300 leading-relaxed mb-3 text-sm">
          {card.description}
        </p>

        {card.cardType === "detailed_card" && card.milestoneText && (
          <div className="bg-gradient-to-r from-red-600/20 to-red-700/20 border border-red-500/30 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-red-400">🏆</span>
              <span className="text-red-400 font-bold text-xs uppercase tracking-wider">
                Milestone
              </span>
            </div>
            <p className="text-white font-black text-sm">
              {card.milestoneText}
            </p>
          </div>
        )}
      </div>
    );
  }
};

// Color Picker Component
const ColorPicker = ({
  value,
  onChange,
  shadeOptions,
}: {
  value: string;
  onChange: (value: string) => void;
  shadeOptions: any[];
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption =
    shadeOptions.find((opt) => opt.value === value) || shadeOptions[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-2 lg:px-3 py-1.5 lg:py-2 bg-gray-900 border border-red-500/30 rounded-lg text-white font-bold hover:border-red-500 transition-colors flex items-center justify-between text-[10px] lg:text-xs"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={`w-3 h-3 lg:w-4 lg:h-4 rounded ${selectedOption.color} border border-white/20 flex-shrink-0`}
          />
          <span className="truncate">{selectedOption.label}</span>
        </div>
        <FaPalette className="text-red-400 flex-shrink-0 text-[10px]" />
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
              className="absolute z-50 mt-1 w-full max-w-xs bg-gray-800 border-2 border-red-500/50 rounded-lg shadow-2xl overflow-hidden"
            >
              <div className="p-2 bg-gray-900 border-b border-gray-700">
                <h4 className="text-xs font-bold text-white">Select Color</h4>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {shadeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full p-2 hover:bg-gray-700 transition-colors border-b border-gray-700 text-left ${
                      value === option.value ? "bg-red-900/20" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`w-5 h-5 rounded ${option.color} border border-white/20 flex-shrink-0`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-bold text-xs truncate">
                          {option.label}
                        </div>
                        <div className="text-gray-400 text-[10px] truncate">
                          {option.desc}
                        </div>
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Section Modal Component
const SectionModal = ({
  section,
  onSave,
  onClose,
  onChange,
  shadeOptions,
}: any) => {
  const [editMode, setEditMode] = useState<"title" | "description">("title");

  const addWord = (type: "title" | "description") => {
    if (type === "title") {
      onChange({
        ...section,
        titleWords: [...section.titleWords, { text: "WORD", shade: "none" }],
      });
    } else {
      onChange({
        ...section,
        descriptionWords: [
          ...(section.descriptionWords || []),
          { text: "word", shade: "none" },
        ],
      });
    }
  };

  const updateWord = (
    type: "title" | "description",
    index: number,
    updates: Partial<TitleWord>
  ) => {
    if (type === "title") {
      const newWords = [...section.titleWords];
      newWords[index] = { ...newWords[index], ...updates };
      onChange({ ...section, titleWords: newWords });
    } else {
      const newWords = [...(section.descriptionWords || [])];
      newWords[index] = { ...newWords[index], ...updates };
      onChange({ ...section, descriptionWords: newWords });
    }
  };

  const deleteWord = (type: "title" | "description", index: number) => {
    if (type === "title") {
      if (section.titleWords.length === 1) return;
      onChange({
        ...section,
        titleWords: section.titleWords.filter(
          (_: any, i: number) => i !== index
        ),
      });
    } else {
      onChange({
        ...section,
        descriptionWords: (section.descriptionWords || []).filter(
          (_: any, i: number) => i !== index
        ),
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-900 border-2 border-red-500/30 rounded-lg p-3 lg:p-4 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-3 lg:mb-4">
          <h3 className="text-base lg:text-lg font-black text-white">
            Edit Section
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FaTimes className="text-gray-400 text-sm" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-gray-900 border-2 border-gray-800 rounded-lg p-1 mb-3 lg:mb-4">
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setEditMode("title")}
              className={`px-3 py-2 lg:py-2.5 rounded-lg font-bold transition-all text-xs lg:text-sm ${
                editMode === "title"
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <FaMagic className="text-[10px]" />
                <span>Title</span>
              </div>
            </button>
            <button
              onClick={() => setEditMode("description")}
              className={`px-3 py-2 lg:py-2.5 rounded-lg font-bold transition-all text-xs lg:text-sm ${
                editMode === "description"
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <FaMagic className="text-[10px]" />
                <span>Description</span>
              </div>
            </button>
          </div>
        </div>

        <div className="space-y-3 lg:space-y-4">
          {editMode === "title" ? (
            <>
              {/* Live Preview */}
              <div className="bg-black border-2 border-red-500/30 rounded-lg p-3 lg:p-4">
                <div className="text-[10px] lg:text-xs font-bold text-gray-400 mb-2 flex items-center gap-1">
                  <FaEye className="text-red-400" /> TITLE PREVIEW
                </div>
                <div className="text-xl lg:text-2xl font-black leading-tight flex flex-wrap gap-1.5">
                  {section.titleWords.map((word: TitleWord, idx: number) => (
                    <span key={idx} className={getShadeClass(word.shade)}>
                      {word.text}
                    </span>
                  ))}
                </div>
              </div>

              {/* Word Editor */}
              <div className="space-y-2 lg:space-y-3">
                {section.titleWords.map((word: TitleWord, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-2 lg:p-3 hover:border-red-500/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                        Word #{idx + 1}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1">
                          Text
                        </label>
                        <input
                          type="text"
                          value={word.text}
                          onChange={(e) =>
                            updateWord("title", idx, {
                              text: e.target.value.toUpperCase(),
                            })
                          }
                          className="w-full px-2 lg:px-3 py-2 lg:py-2.5 bg-gray-900 border border-red-500/30 rounded-lg text-white font-bold text-xs lg:text-sm focus:outline-none focus:border-red-500 transition-colors"
                          placeholder="WORD"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1">
                          Color
                        </label>
                        <ColorPicker
                          value={word.shade || "none"}
                          onChange={(shade) =>
                            updateWord("title", idx, { shade: shade as any })
                          }
                          shadeOptions={shadeOptions}
                        />
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-700 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-[10px] text-gray-500 font-bold flex-shrink-0">
                          LIVE:
                        </span>
                        <span
                          className={`text-base lg:text-lg font-black ${getShadeClass(
                            word.shade
                          )} truncate`}
                        >
                          {word.text || "WORD"}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteWord("title", idx)}
                        disabled={section.titleWords.length === 1}
                        className="p-1.5 bg-red-600/20 border border-red-500/30 rounded-lg hover:bg-red-600 hover:border-red-500 transition-all group flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete"
                      >
                        <FaTrash className="text-red-400 group-hover:text-white text-[10px]" />
                      </button>
                    </div>
                  </motion.div>
                ))}

                <button
                  onClick={() => addWord("title")}
                  className="w-full px-3 lg:px-4 py-2 lg:py-2.5 bg-gray-800 border-2 border-dashed border-red-500/30 rounded-lg text-red-400 hover:bg-red-900/10 hover:border-red-500 transition-all font-bold flex items-center justify-center gap-1.5 text-xs"
                >
                  <FaPlus className="text-[10px]" />
                  Add Another Word
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Description Live Preview */}
              <div className="bg-black border-2 border-red-500/30 rounded-lg p-3 lg:p-4">
                <div className="text-[10px] lg:text-xs font-bold text-gray-400 mb-2 flex items-center gap-1">
                  <FaEye className="text-red-400" /> DESCRIPTION PREVIEW
                </div>
                <div className="text-sm lg:text-base leading-relaxed flex flex-wrap gap-1">
                  {(section.descriptionWords || []).map(
                    (word: TitleWord, idx: number) => (
                      <span key={idx} className={getShadeClass(word.shade)}>
                        {word.text}
                      </span>
                    )
                  )}
                  {(!section.descriptionWords ||
                    section.descriptionWords.length === 0) && (
                    <span className="text-gray-500 italic text-xs">
                      No description words yet. Add some below!
                    </span>
                  )}
                </div>
              </div>

              {/* Description Word Editor */}
              <div className="space-y-2 lg:space-y-3">
                {(section.descriptionWords || []).map(
                  (word: TitleWord, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-2 lg:p-3 hover:border-red-500/50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                          Word #{idx + 1}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 mb-1">
                            Text
                          </label>
                          <input
                            type="text"
                            value={word.text}
                            onChange={(e) =>
                              updateWord("description", idx, {
                                text: e.target.value,
                              })
                            }
                            className="w-full px-2 lg:px-3 py-2 lg:py-2.5 bg-gray-900 border border-red-500/30 rounded-lg text-white text-xs lg:text-sm focus:outline-none focus:border-red-500 transition-colors"
                            placeholder="word"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 mb-1">
                            Color
                          </label>
                          <ColorPicker
                            value={word.shade || "none"}
                            onChange={(shade) =>
                              updateWord("description", idx, {
                                shade: shade as any,
                              })
                            }
                            shadeOptions={shadeOptions}
                          />
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-gray-700 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-[10px] text-gray-500 font-bold flex-shrink-0">
                            LIVE:
                          </span>
                          <span
                            className={`text-sm lg:text-base ${getShadeClass(
                              word.shade
                            )} truncate`}
                          >
                            {word.text || "word"}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteWord("description", idx)}
                          className="p-1.5 bg-red-600/20 border border-red-500/30 rounded-lg hover:bg-red-600 hover:border-red-500 transition-all group flex-shrink-0"
                          title="Delete"
                        >
                          <FaTrash className="text-red-400 group-hover:text-white text-[10px]" />
                        </button>
                      </div>
                    </motion.div>
                  )
                )}

                <button
                  onClick={() => addWord("description")}
                  className="w-full px-3 lg:px-4 py-2 lg:py-2.5 bg-gray-800 border-2 border-dashed border-red-500/30 rounded-lg text-red-400 hover:bg-red-900/10 hover:border-red-500 transition-all font-bold flex items-center justify-center gap-1.5 text-xs"
                >
                  <FaPlus className="text-[10px]" />
                  Add Another Word
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 mt-3 lg:mt-4">
          <button
            onClick={onSave}
            className="flex-1 px-3 lg:px-4 py-2 lg:py-2.5 bg-red-600 rounded-lg font-bold hover:bg-red-700 transition-colors text-xs lg:text-sm"
          >
            <FaSave className="inline mr-1 text-[10px]" />
            Save Section
          </button>
          <button
            onClick={onClose}
            className="px-3 lg:px-4 py-2 lg:py-2.5 bg-gray-800 rounded-lg font-bold hover:bg-gray-700 transition-colors text-xs lg:text-sm"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Card Modal Component - UPDATED FOR ALL CARD TYPES
const CardModal = ({ card, section, onSave, onClose, onChange }: any) => {
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showSquareIconPicker, setShowSquareIconPicker] = useState(false);
  const [showBulletEmojiPicker, setShowBulletEmojiPicker] = useState<
    number | null
  >(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-900 border-2 border-red-500/30 rounded-lg p-3 lg:p-4 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-3 lg:mb-4">
          <div>
            <h3 className="text-base lg:text-lg font-black text-white">
              Edit {getCardTypeLabel(card.cardType)}
            </h3>
            <p className="text-[10px] lg:text-xs text-gray-400 mt-0.5">
              {getCardTypeDescription(card.cardType)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FaTimes className="text-gray-400 text-sm" />
          </button>
        </div>

        <div className="space-y-3 lg:space-y-4">
          {/* Icon */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5 lg:mb-2">
              Main Icon
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="flex items-center gap-2 px-3 lg:px-4 py-2 lg:py-3 bg-gray-800 border border-red-500/30 rounded-lg hover:border-red-500 transition-colors"
              >
                <span className="text-2xl">{card.icon || "🚀"}</span>
                <span className="text-xs text-gray-400">Click to change</span>
              </button>
            </div>
            {showIconPicker && (
              <div className="mt-2 p-2 bg-gray-800 border border-gray-700 rounded-lg">
                <IconPicker
                  selected={card.icon}
                  onSelect={(icon: any) => {
                    onChange({ ...card, icon });
                    setShowIconPicker(false);
                  }}
                />
              </div>
            )}
          </div>
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5">
              Card Title
            </label>
            <input
              type="text"
              value={card.title}
              onChange={(e) => onChange({ ...card, title: e.target.value })}
              className="w-full px-2 lg:px-3 py-2 lg:py-2.5 bg-gray-800 border border-red-500/30 rounded-lg text-white font-bold text-xs lg:text-sm focus:outline-none focus:border-red-500"
              placeholder="Enter card title"
            />
          </div>
          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              value={card.description || ""}
              onChange={(e) =>
                onChange({ ...card, description: e.target.value })
              }
              rows={3}
              className="w-full px-2 lg:px-3 py-2 lg:py-2.5 bg-gray-800 border border-red-500/30 rounded-lg text-white text-xs lg:text-sm focus:outline-none focus:border-red-500 leading-relaxed"
              placeholder="Enter card description"
            />
          </div>
          {/* Card Type Specific Fields */}
          {card.cardType === "steps_card" && (
            <>
              <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg p-2 lg:p-3">
                <div>
                  <label className="text-xs font-bold text-white">
                    Show Step Number
                  </label>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Display "STEP X" label
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={card.showStepNumber || false}
                    onChange={(e) =>
                      onChange({ ...card, showStepNumber: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {card.showStepNumber && (
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    Step Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={card.stepNumber || 1}
                    onChange={(e) =>
                      onChange({
                        ...card,
                        stepNumber: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-2 lg:px-3 py-2 lg:py-2.5 bg-gray-800 border border-red-500/30 rounded-lg text-white font-bold text-xs lg:text-sm focus:outline-none focus:border-red-500"
                  />
                </div>
              )}
            </>
          )}
          {/* Bullet Card Specific */}
  
          {/* Bullet Card Specific */}
          {card.cardType === "bullet_card" && (
            <>
              {/* Show Icon Toggle */}
              <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg p-2 lg:p-3">
                <div>
                  <label className="text-xs font-bold text-white">
                    Show Icon
                  </label>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Display icon in the card
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={card.showIcon !== false}
                    onChange={(e) =>
                      onChange({ ...card, showIcon: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {/* Toggle for Red/Grey Two-Color Mode */}
              <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg p-2 lg:p-3">
                <div>
                  <label className="text-xs font-bold text-white">
                    Use Red & Grey Colors
                  </label>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Alternate between red and grey for bullet points (like "The
                    Transformation" section)
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={card.useTwoColors || false}
                    onChange={(e) =>
                      onChange({ ...card, useTwoColors: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {/* Enhanced Bullet Point Editor with Emoji Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Bullet Points with Emoji
                </label>
                <BulletPointEditor
                  points={card.bulletPoints || []}
                  emojis={card.bulletEmojis || []}
                  onChange={(points: string[], emojis: string[]) =>
                    onChange({
                      ...card,
                      bulletPoints: points,
                      bulletEmojis: emojis,
                    })
                  }
                  showEmojiPicker={showBulletEmojiPicker}
                  setShowEmojiPicker={setShowBulletEmojiPicker}
                />
              </div>
            </>
          )}
          {/* Detailed Card Specific Fields */}
          {(card.cardType === "detailed_card" ||
            card.cardType === "connecting_card") && (
            <>
              <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg p-2 lg:p-3">
                <div>
                  <label className="text-xs font-bold text-white">
                    Show Count Number
                  </label>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Display number in background
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={card.showCountNumber !== false}
                    onChange={(e) =>
                      onChange({ ...card, showCountNumber: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {card.showCountNumber && (
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    Count Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={card.countNumber || 1}
                    onChange={(e) =>
                      onChange({
                        ...card,
                        countNumber: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-2 lg:px-3 py-2 lg:py-2.5 bg-gray-800 border border-red-500/30 rounded-lg text-white font-bold text-xs lg:text-sm focus:outline-none focus:border-red-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Day Range Label
                  <span className="text-gray-500 text-[10px] ml-1">
                    (Small red box)
                  </span>
                </label>
                <input
                  type="text"
                  value={card.dayRangeLabel || ""}
                  onChange={(e) =>
                    onChange({ ...card, dayRangeLabel: e.target.value })
                  }
                  className="w-full px-2 lg:px-3 py-2 lg:py-2.5 bg-gray-800 border border-red-500/30 rounded-lg text-white text-xs lg:text-sm focus:outline-none focus:border-red-500"
                  placeholder="Days 1-30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Milestone Text
                  <span className="text-gray-500 text-[10px] ml-1">
                    (Highlighted box)
                  </span>
                </label>
                <input
                  type="text"
                  value={card.milestoneText || ""}
                  onChange={(e) =>
                    onChange({ ...card, milestoneText: e.target.value })
                  }
                  className="w-full px-2 lg:px-3 py-2 lg:py-2.5 bg-gray-800 border border-red-500/30 rounded-lg text-white font-bold text-xs lg:text-sm focus:outline-none focus:border-red-500"
                  placeholder="First 1,000 Followers"
                />
              </div>

              {card.cardType === "detailed_card" && (
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    Square Box Icon
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setShowSquareIconPicker(!showSquareIconPicker)
                      }
                      className="flex items-center gap-2 px-3 lg:px-4 py-2 lg:py-3 bg-gray-800 border border-red-500/30 rounded-lg hover:border-red-500 transition-colors"
                    >
                      <span className="text-2xl">
                        {card.squareIcon || "🎯"}
                      </span>
                      <span className="text-xs text-gray-400">
                        Click to change
                      </span>
                    </button>
                  </div>
                  {showSquareIconPicker && (
                    <div className="mt-2 p-2 bg-gray-800 border border-gray-700 rounded-lg">
                      <IconPicker
                        selected={card.squareIcon}
                        onSelect={(icon: any) => {
                          onChange({ ...card, squareIcon: icon });
                          setShowSquareIconPicker(false);
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Connected Cards Option (For connecting_card type) */}
              {card.cardType === "connecting_card" && (
                <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg p-2 lg:p-3">
                  <div>
                    <label className="text-xs font-bold text-white">
                      Show Connection Lines
                    </label>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Display connector lines between cards
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={card.isConnected !== false}
                      onChange={(e) =>
                        onChange({ ...card, isConnected: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
              )}
            </>
          )}
          {/* Live Card Preview */}
          <div className="bg-black border-2 border-red-500/50 rounded-lg p-3 lg:p-4">
            <h4 className="text-[10px] lg:text-xs font-bold text-gray-400 mb-2 flex items-center gap-1">
              <FaEye className="text-red-400" /> CARD PREVIEW
            </h4>
            <div className="max-w-md mx-auto">
              <CardPreview card={card} index={0} />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-3 lg:mt-4">
          <button
            onClick={onSave}
            className="flex-1 px-3 lg:px-4 py-2 lg:py-2.5 bg-red-600 rounded-lg font-bold hover:bg-red-700 transition-colors text-xs lg:text-sm"
          >
            <FaSave className="inline mr-1 text-[10px]" />
            Save Card
          </button>
          <button
            onClick={onClose}
            className="px-3 lg:px-4 py-2 lg:py-2.5 bg-gray-800 rounded-lg font-bold hover:bg-gray-700 transition-colors text-xs lg:text-sm"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Bullet Point Editor Component
const BulletPointEditor = ({
  points,
  emojis,
  onChange,
  showEmojiPicker,
  setShowEmojiPicker,
}: {
  points: string[];
  emojis: string[];
  onChange: (points: string[], emojis: string[]) => void;
  showEmojiPicker: number | null;
  setShowEmojiPicker: (index: number | null) => void;
}) => {
  const [newPoint, setNewPoint] = useState("");

  const addPoint = () => {
    if (newPoint.trim()) {
      const newPoints = [...points, newPoint.trim()];
      const newEmojis = [...emojis];
      // Add default emoji for the new point
      newEmojis.push("•");

      onChange(newPoints, newEmojis);
      setNewPoint("");
    }
  };

  const removePoint = (index: number) => {
    const newPoints = points.filter((_, i) => i !== index);
    const newEmojis = emojis.filter((_, i) => i !== index);
    onChange(newPoints, newEmojis);
  };

  const updatePoint = (index: number, value: string) => {
    const updatedPoints = [...points];
    updatedPoints[index] = value;
    onChange(updatedPoints, emojis);
  };

  const updateEmoji = (index: number, emoji: string) => {
    const updatedEmojis = [...emojis];
    updatedEmojis[index] = emoji;
    onChange(points, updatedEmojis);
    setShowEmojiPicker(null);
  };

  // Common emojis for bullet points
  const commonEmojis = [
    "•",
    "⭐",
    "✅",
    "🔥",
    "🚀",
    "💎",
    "💡",
    "📌",
    "👉",
    "🔍",
    "🎯",
    "⚡",
    "🛠️",
    "📊",
    "📈",
  ];

  return (
    <div className="space-y-2">
      {points.map((point, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-start gap-2 bg-gray-800 border border-gray-700 rounded-lg p-2 hover:border-red-500/50 transition-all"
        >
          <div className="flex-shrink-0 relative">
            <button
              onClick={() =>
                setShowEmojiPicker(showEmojiPicker === index ? null : index)
              }
              className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <span className="text-red-400 text-lg">
                {emojis[index] || "•"}
              </span>
            </button>

            {showEmojiPicker === index && (
              <div className="absolute top-full left-0 mt-2 z-50 bg-gray-800 border border-gray-600 rounded-lg p-2 shadow-xl">
                <div className="grid grid-cols-5 gap-1">
                  {commonEmojis.map((emoji, emojiIndex) => (
                    <button
                      key={emojiIndex}
                      onClick={() => updateEmoji(index, emoji)}
                      className={`w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 ${
                        emojis[index] === emoji
                          ? "bg-red-900/30 border border-red-500/50"
                          : ""
                      }`}
                    >
                      <span className="text-lg">{emoji}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <input
            type="text"
            value={point}
            onChange={(e) => updatePoint(index, e.target.value)}
            className="flex-1 bg-transparent text-gray-300 focus:outline-none text-xs py-1.5"
            placeholder="Bullet point text..."
          />
          <button
            onClick={() => removePoint(index)}
            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded flex-shrink-0"
          >
            <FaTrash className="text-[10px]" />
          </button>
        </motion.div>
      ))}

      <div className="flex gap-2">
        <input
          type="text"
          value={newPoint}
          onChange={(e) => setNewPoint(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addPoint()}
          className="flex-1 px-2 lg:px-3 py-2 lg:py-2.5 bg-gray-800 border border-red-500/30 rounded-lg text-white text-xs focus:outline-none focus:border-red-500"
          placeholder="Add new bullet point..."
        />
        <button
          onClick={addPoint}
          disabled={!newPoint.trim()}
          className="px-3 lg:px-4 py-2 lg:py-2.5 bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xs flex-shrink-0"
        >
          <FaPlus className="text-[10px]" />
        </button>
      </div>
    </div>
  );
};

// Helper functions
function getCardTypeLabel(type: string): string {
  const labels: any = {
    steps_card: "Steps Card",
    bullet_card: "Bullet Card",
    detailed_card: "Detailed Card",
    connecting_card: "Connecting Card",
  };
  return labels[type] || type;
}

function getCardTypeDescription(type: string): string {
  const descriptions: any = {
    steps_card: "Perfect for step-by-step processes with numbered guidance",
    bullet_card: "Great for listing features, benefits, or key points",
    detailed_card: "Ideal for timeline-based content with milestones",
    connecting_card: "Timeline cards with visual connectors between them",
  };
  return descriptions[type] || "";
}

export default CustomSectionEditor;