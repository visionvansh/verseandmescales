"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaInstagram,
  FaCheckCircle,
  FaRocket,
  FaUsers,
  FaVideo,
  FaClock,
  FaFire,
  FaPlay,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaStar,
  FaCrown,
  FaBolt,
  FaTrophy,
  FaImage,
  FaQuestionCircle,
  FaArrowLeft,
  FaArrowRight,
  FaPhotoVideo,
  FaSpinner,
} from "react-icons/fa";
import { Spotlight } from "@/components/ui/Spotlight";

// Countdown Timer Component for Sale Price
const CountdownTimer = ({ endsAt }: { endsAt: string }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = new Date(endsAt).getTime();
      const difference = endTime - now;

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds, expired: false };
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.expired) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endsAt]);

  if (timeLeft.expired) {
    return (
      <div className="inline-block bg-gradient-to-r from-gray-900/90 to-black/95 border border-gray-700/30 rounded-xl px-4 py-2 sm:px-5 sm:py-2.5 backdrop-blur-xl">
        <span className="text-gray-400 font-bold text-xs xs:text-sm">
          Sale Ended
        </span>
      </div>
    );
  }

  return (
    <div className="inline-block bg-gradient-to-r from-red-900/30 to-red-900/30 border border-red-500/30 rounded-xl px-4 py-2 sm:px-5 sm:py-2.5 backdrop-blur-xl animate-pulse">
      <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3">
        <FaClock className="text-red-400 text-xs xs:text-sm animate-pulse" />
        <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3">
          <span className="text-white font-bold text-xs xs:text-sm sm:text-base hidden xs:inline">
            Sale ends in:
          </span>
          <span className="text-white font-bold text-xs xs:text-sm sm:text-base xs:hidden">
            Sale Ends:
          </span>
          <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 text-red-400 font-black tabular-nums text-xs xs:text-sm sm:text-base">
            {timeLeft.days > 0 && (
              <>
                <span>{timeLeft.days}d</span>
                <span className="opacity-50">:</span>
              </>
            )}
            <span>{String(timeLeft.hours).padStart(2, "0")}h</span>
            <span className="opacity-50">:</span>
            <span>{String(timeLeft.minutes).padStart(2, "0")}m</span>
            <span className="opacity-50">:</span>
            <span>{String(timeLeft.seconds).padStart(2, "0")}s</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface TitleWord {
  text: string;
  shade?: string;
}

interface LivePreviewProps {
  data: any;
  enrollmentStatus?: {
    enrolled: boolean;
    isOwner: boolean;
  } | null;
  onEnroll?: () => void;
  onStartLearning?: () => void;
  enrolling?: boolean;
}

// Helper function to get shade classes (SYNCED WITH TITLEEDITOR)
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

// Custom Card Preview Component
const CustomCardPreview = ({
  card,
  index,
  isLast = false,
  isFirst = false,
  totalCards = 0,
  columnsCount = 3,
}: {
  card: any;
  index: number;
  isLast?: boolean;
  isFirst?: boolean;
  totalCards?: number;
  columnsCount?: number;
}) => {
  const isBulletCard = card.cardType === "bullet_card";
  const isConnectingCard = card.cardType === "connecting_card";
  const isStepsCard = card.cardType === "steps_card";
  const isDetailedCard = card.cardType === "detailed_card";
  const isBeforeAfterStyle =
    isBulletCard && (card.useTwoColors || card.bulletEmojis);

  if (isBulletCard) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-xl sm:rounded-2xl p-4 xs:p-5 sm:p-6 md:p-8 backdrop-blur-xl overflow-hidden group"
        whileHover={{ y: -10, borderColor: "rgba(239, 68, 68, 0.6)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10">
          {isBeforeAfterStyle ? (
            <>
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
                <div className="text-4xl mb-2">{card.icon || "🚀"}</div>
                {card.description && (
                  <p
                    className={`${
                      card.useTwoColors ? "text-gray-500" : "text-red-400"
                    } text-sm font-bold`}
                  >
                    {card.description}
                  </p>
                )}
              </div>
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
            </>
          ) : (
            <>
              <div
                className={`w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 bg-gradient-to-r ${
                  card.color || "from-red-600 to-red-700"
                } rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 md:mb-5 lg:mb-6 shadow-[0_0_30px_rgba(239,68,68,0.3)]`}
              >
                <span className="text-xl xs:text-2xl sm:text-3xl">
                  {card.icon || "🚀"}
                </span>
              </div>
              <h3 className="text-lg xs:text-xl sm:text-2xl font-black text-white mb-2 sm:mb-3">
                {card.title}
              </h3>
              {card.description && (
                <p className="text-gray-300 leading-relaxed mb-3 sm:mb-4 text-xs xs:text-sm sm:text-base">
                  {card.description}
                </p>
              )}
              {card.bulletPoints && card.bulletPoints.length > 0 && (
                <ul className="space-y-1.5 sm:space-y-2">
                  {card.bulletPoints.map((point: string, idx: number) => (
                    <li
                      key={idx}
                      className="flex items-start gap-1.5 sm:gap-2 text-gray-300 text-xs xs:text-sm sm:text-base"
                    >
                      <span className="text-red-400 mt-0.5 sm:mt-1">
                        {card.bulletEmojis?.[idx] || "•"}
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </motion.div>
    );
  } else if (isConnectingCard) {
    const row = Math.floor(index / columnsCount);
    const col = index % columnsCount;
    const hasCardAbove = index >= columnsCount;
    const hasCardBelow = index < totalCards - columnsCount;

    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-xl sm:rounded-2xl p-4 xs:p-5 sm:p-6 md:p-8 backdrop-blur-xl overflow-visible group"
        whileHover={{ y: -10, borderColor: "rgba(239, 68, 68, 0.6)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl sm:rounded-2xl" />
        {hasCardAbove && card.isConnected && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full w-0.5 h-4 sm:h-6 md:h-8 bg-gradient-to-b from-transparent via-red-500/60 to-red-600"></div>
        )}
        <div className="relative z-10">
          <div
            className={`w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 bg-gradient-to-r ${card.color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-5 shadow-[0_0_30px_rgba(239,68,68,0.3)]`}
          >
            <span className="text-xl xs:text-2xl sm:text-3xl">
              {card.icon || "🚀"}
            </span>
          </div>
          <div className="absolute top-2 xs:top-3 sm:top-4 right-2 xs:right-3 sm:right-4 text-5xl xs:text-6xl sm:text-7xl font-black text-red-400/10">
            {String(index + 1).padStart(2, "0")}
          </div>
          {card.dayRangeLabel && (
            <div className="inline-block bg-red-900/20 border border-red-500/30 px-3 py-1.5 rounded-full mb-2">
              <span className="text-red-400 font-bold text-xs">
                {card.dayRangeLabel}
              </span>
            </div>
          )}
          <h3 className="text-lg xs:text-xl sm:text-2xl font-black text-white mb-2">
            {card.title}
          </h3>
          <p className="text-gray-300 leading-relaxed mb-4 text-sm xs:text-base">
            {card.description}
          </p>
          {card.milestoneText && (
            <div className="bg-gradient-to-r from-red-600/20 to-red-700/20 border border-red-500/30 rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-red-400">🏆</span>
                <span className="text-red-400 font-bold text-xs uppercase tracking-wider">
                  Milestone
                </span>
              </div>
              <p className="text-white font-black text-sm xs:text-base">
                {card.milestoneText}
              </p>
            </div>
          )}
        </div>
        {hasCardBelow && card.isConnected && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0.5 h-4 sm:h-6 md:h-8 bg-gradient-to-b from-red-600 via-red-500/60 to-transparent"></div>
        )}
      </motion.div>
    );
  } else {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-xl sm:rounded-2xl p-4 xs:p-5 sm:p-6 md:p-8 backdrop-blur-xl overflow-hidden group"
        whileHover={{ y: -10, borderColor: "rgba(239, 68, 68, 0.6)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10">
          <div
            className={`w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 bg-gradient-to-r ${
              card.color || "from-red-600 to-red-700"
            } rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 md:mb-5 lg:mb-6 shadow-[0_0_30px_rgba(239,68,68,0.3)]`}
          >
            <span className="text-xl xs:text-2xl sm:text-3xl">
              {card.icon || "🚀"}
            </span>
          </div>
          {((isStepsCard && card.showStepNumber) ||
            (isDetailedCard && card.showCountNumber)) && (
            <div className="absolute top-2 xs:top-3 sm:top-4 right-2 xs:right-3 sm:right-4 text-5xl xs:text-6xl sm:text-7xl font-black text-red-400/10">
              {isStepsCard
                ? String(card.stepNumber || 1).padStart(2, "0")
                : String(card.countNumber || 1).padStart(2, "0")}
            </div>
          )}
          {isStepsCard && card.showStepNumber && (
            <div className="text-red-400 font-bold mb-2 text-xs xs:text-sm sm:text-base">
              STEP {card.stepNumber || 1}
            </div>
          )}
          {isDetailedCard && card.dayRangeLabel && (
            <div className="inline-block bg-red-900/20 border border-red-500/30 px-2 py-1 xs:px-3 xs:py-1.5 sm:px-4 sm:py-2 rounded-full mb-2 sm:mb-3 md:mb-4">
              <span className="text-red-400 font-bold text-[10px] xs:text-xs sm:text-sm">
                {card.dayRangeLabel}
              </span>
            </div>
          )}
          <h3 className="text-lg xs:text-xl sm:text-2xl font-black text-white mb-2 sm:mb-3">
            {card.title}
          </h3>
          {card.description && (
            <p className="text-gray-300 leading-relaxed mb-3 sm:mb-4 text-xs xs:text-sm sm:text-base">
              {card.description}
            </p>
          )}
          {isDetailedCard && card.milestoneText && (
            <div className="bg-gradient-to-r from-red-600/20 to-red-700/20 border border-red-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <span className="text-red-400 text-base xs:text-lg sm:text-xl">
                  🏆
                </span>
                <span className="text-red-400 font-bold text-[10px] xs:text-xs uppercase tracking-wider">
                  Milestone
                </span>
              </div>
              <p className="text-white font-black text-sm xs:text-base sm:text-lg">
                {card.milestoneText}
              </p>
            </div>
          )}
          {card.highlightedBox && !card.milestoneText && (
            <div className="bg-gradient-to-r from-red-600/20 to-red-700/20 border border-red-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4 mt-3 sm:mt-4">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <FaTrophy className="text-red-400 text-sm xs:text-base" />
                <span className="text-red-400 font-bold text-[10px] xs:text-xs uppercase">
                  Milestone
                </span>
              </div>
              <p className="text-white font-black text-sm xs:text-base sm:text-lg">
                {card.highlightedBox}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    );
  }
};

const LivePreview: React.FC<LivePreviewProps> = ({
  data,
  enrollmentStatus = null,
  onEnroll,
  onStartLearning,
  enrolling = false,
}) => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeProofImage, setActiveProofImage] = useState(0);
  const customSectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const scrollContainer = (
    ref: HTMLDivElement | null,
    direction: "left" | "right"
  ) => {
    if (ref) {
      const scrollAmount = ref.clientWidth * 0.8;
      ref.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const getBadgeForSection = (sectionId: string) => {
    return data.sectionBadges?.find(
      (b: any) => b.sectionId === sectionId && b.enabled
    );
  };

  const SectionBadge = ({ badge }: { badge: any }) => {
    if (!badge || !badge.text) return null;
    return (
      <motion.div
        className="inline-block bg-gradient-to-r from-red-900/30 to-red-900/30 border border-red-500/30 px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 rounded-full mb-4 sm:mb-5 md:mb-6 lg:mb-8 backdrop-blur-xl"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="text-red-400 font-bold text-xs xs:text-sm sm:text-base md:text-lg flex items-center gap-1.5 sm:gap-2">
          <span className="text-base sm:text-lg flex-shrink-0">
            {badge.emoji}
          </span>
          <span className="whitespace-nowrap">{badge.text}</span>
        </span>
      </motion.div>
    );
  };

  const renderHighlightedText = (
    text: string,
    highlightedWords: string[] = [],
    highlightedSentences: string[] = []
  ) => {
    let result = text;
    highlightedSentences.forEach((sentence) => {
      const escapedSentence = sentence.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escapedSentence})`, "gi");
      result = result.replace(
        regex,
        '<span class="text-red-400 font-bold">$1</span>'
      );
    });
    highlightedWords.forEach((word) => {
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(
        `(?![^<]*>)(?!<span class="text-red-400 font-bold">)(${escapedWord})(?![^<]*<\\/span>)`,
        "gi"
      );
      result = result.replace(
        regex,
        '<span class="text-red-400 font-bold">$1</span>'
      );
    });
    return result;
  };

  const getIconComponent = (iconName: string) => {
    const icons: any = {
      FaRocket,
      FaBolt,
      FaFire,
      FaStar,
      FaCrown,
      FaTrophy,
    };
    return icons[iconName] || FaRocket;
  };

  const renderTitleLine = (lineKey: "line1" | "line2" | "line3") => {
    const wordsKey = `${lineKey}Words` as
      | "line1Words"
      | "line2Words"
      | "line3Words";
    const words = data.mainTitle?.[wordsKey];
    const simpleText = data.mainTitle?.[lineKey] || "";
    if (words && words.length > 0) {
      return (
        <div className="mb-1 sm:mb-2">
          {words.map((word: TitleWord, i: number) => (
            <span
              key={i}
              className={`${getShadeClass(word.shade)} mr-1.5 sm:mr-2`}
            >
              {word.text}
            </span>
          ))}
        </div>
      );
    }
    if (simpleText && simpleText.trim()) {
      return (
        <div className="mb-1 sm:mb-2">
          {simpleText.split(" ").map((word: string, i: number) => (
            <span
              key={i}
              className={
                data.mainTitle?.highlightedWords?.includes(word)
                  ? "bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent mr-1.5 sm:mr-2"
                  : "text-white mr-1.5 sm:mr-2"
              }
            >
              {word}
            </span>
          ))}
        </div>
      );
    }
    return null;
  };

  const hasConnectingCards = (section: any) => {
    return section.cards?.some(
      (card: any) => card.cardType === "connecting_card" && card.isConnected
    );
  };

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden">
      <div className="absolute inset-0 z-0">
        {data.backgroundType === "black" || !data.backgroundType ? (
          <div className="absolute inset-0 bg-black" />
        ) : data.backgroundType === "spotlights" ? (
          <>
            <Spotlight
              className="-top-40 left-0 md:left-60 md:-top-20 opacity-100"
              fill="rgba(220, 38, 38, 0.9)"
            />
            <Spotlight
              className="top-10 left-full h-[80vh] w-[50vw] opacity-70"
              fill="rgba(220, 38, 38, 0.7)"
            />
            <Spotlight
              className="bottom-0 right-0 h-[60vh] w-[40vw] opacity-50"
              fill="rgba(220, 38, 38, 0.5)"
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-red-900/30 via-black to-red-900/20"
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black via-gray-900/50 to-black" />
            <motion.div
              className="absolute inset-0 opacity-25"
              animate={{ opacity: [0.15, 0.35, 0.15] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              style={{
                backgroundImage: `
                  linear-gradient(rgba(220, 38, 38, 0.4) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(220, 38, 38, 0.4) 1px, transparent 1px)
                `,
                backgroundSize: "60px 60px",
              }}
            />
            <motion.div
              className="absolute inset-0 opacity-15"
              animate={{ opacity: [0.08, 0.22, 0.08] }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }}
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255, 50, 50, 0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255, 50, 50, 0.3) 1px, transparent 1px)
                `,
                backgroundSize: "120px 120px",
              }}
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-black" />
        )}
      </div>
      <div className="relative z-10">
        <section className="relative w-full min-h-screen flex items-center justify-center py-8 sm:py-12 md:py-16 lg:py-20">
          <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <SectionBadge badge={getBadgeForSection("hero")} />
              <h1 className="text-[32px] xs:text-[36px] sm:text-[48px] md:text-[64px] lg:text-[80px] xl:text-[96px] 2xl:text-[112px] font-black text-white leading-[1.1] mb-3 sm:mb-4 md:mb-6 lg:mb-8 px-2 sm:px-4">
                {data.mainTitleLines >= 1 && renderTitleLine("line1")}
                {data.mainTitleLines >= 2 && renderTitleLine("line2")}
                {data.mainTitleLines >= 3 && renderTitleLine("line3")}
              </h1>
              <p
                className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-300 mb-6 sm:mb-8 md:mb-10 lg:mb-12 max-w-4xl mx-auto leading-relaxed px-2 sm:px-4"
                dangerouslySetInnerHTML={{
                  __html: renderHighlightedText(
                    data.subheading.text || "",
                    data.subheading.highlightedWords || [],
                    data.subheading.highlightedSentences || []
                  ),
                }}
              />
              {data.videoEnabled && data.videoUrl && (
                <motion.div
                  className="max-w-5xl mx-auto mb-6 sm:mb-8 md:mb-10 lg:mb-12"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  <div className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border-2 border-red-500/40 rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden backdrop-blur-xl shadow-[0_0_60px_rgba(239,68,68,0.3)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent pointer-events-none" />

                    {/* 16:9 Aspect Ratio Container - FULLY RESPONSIVE */}
                    <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-black">
                      <video
                        src={data.videoUrl}
                        poster={data.videoThumbnail}
                        controls
                        className="absolute top-0 left-0 w-full h-full object-contain bg-black"
                        preload="metadata"
                      >
                        Your browser does not support the video tag.
                      </video>

                      {/* Video Info Overlay - RESPONSIVE */}
                      {(data.videoTitle || data.videoDescription) && (
                        <div className="absolute bottom-2 left-2 right-2 xs:bottom-3 xs:left-3 xs:right-3 sm:bottom-4 sm:left-4 sm:right-4 md:bottom-6 md:left-6 md:right-6">
                          <div className="bg-black/80 backdrop-blur-md rounded-lg sm:rounded-xl p-2 xs:p-3 sm:p-4 border border-red-500/30">
                            {data.videoTitle && (
                              <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 mb-1 sm:mb-2">
                                <FaVideo className="text-red-400 text-sm xs:text-base sm:text-lg md:text-xl flex-shrink-0" />
                                <span className="text-white font-bold text-xs xs:text-sm sm:text-base md:text-lg">
                                  {data.videoTitle}
                                </span>
                              </div>
                            )}
                            {data.videoDescription && (
                              <p className="text-gray-300 text-[10px] xs:text-xs sm:text-sm line-clamp-2">
                                {data.videoDescription}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Duration Badge - RESPONSIVE */}
                      {data.videoDuration && (
                        <div className="absolute top-2 right-2 xs:top-3 xs:right-3 sm:top-4 sm:right-4 md:top-6 md:right-6">
                          <div className="bg-black/80 backdrop-blur-md px-2 py-1 xs:px-3 xs:py-1.5 sm:px-4 sm:py-2 rounded-full border border-red-500/30">
                            <span className="text-white font-bold text-[10px] xs:text-xs sm:text-sm flex items-center gap-1 xs:gap-1.5">
                              <FaClock className="text-red-400" />
                              {data.videoDuration}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Video Stats Bar - MATCHED WITH INSTAGRAMCOURSEHOMEPAGE */}
                    <div className="relative z-10 bg-gradient-to-r from-gray-900/95 to-black/95 border-t border-red-500/20 px-3 py-2 xs:px-4 xs:py-3 sm:px-6 sm:py-4">
                      <div className="flex items-center justify-between gap-2 xs:gap-3 sm:gap-4 text-[10px] xs:text-xs sm:text-sm">
                        <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 text-gray-400">
                          <FaCheckCircle className="text-red-400 flex-shrink-0" />
                          <span className="hidden xs:inline">
                            15,000+ Students
                          </span>
                          <span className="xs:hidden">15K+</span>
                        </div>
                        <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 text-gray-400">
                          <FaStar className="text-red-400 flex-shrink-0" />
                          <span>4.9/5 Rating</span>
                        </div>
                        <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 text-gray-400">
                          <FaTrophy className="text-red-400 flex-shrink-0" />
                          <span className="hidden xs:inline">
                            Proven Results
                          </span>
                          <span className="xs:hidden">Results</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <motion.button
                onClick={() => {
                  if (enrollmentStatus?.enrolled) {
                    onStartLearning?.();
                  } else if (enrollmentStatus?.isOwner) {
                    return;
                  } else {
                    onEnroll?.();
                  }
                }}
                disabled={enrolling || enrollmentStatus?.isOwner}
                className={`font-black py-4 xs:py-5 sm:py-6 md:py-7 lg:py-8 px-6 xs:px-8 sm:px-10 md:px-12 lg:px-16 rounded-xl sm:rounded-2xl text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl inline-flex items-center justify-center gap-2 sm:gap-3 md:gap-4 transition-all ${
                  enrollmentStatus?.enrolled
                    ? "bg-gradient-to-r from-green-600 to-green-700 shadow-[0_0_40px_rgba(34,197,94,0.4)] sm:shadow-[0_0_50px_rgba(34,197,94,0.5)]"
                    : enrollmentStatus?.isOwner
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 shadow-[0_0_40px_rgba(59,130,246,0.4)] cursor-not-allowed opacity-75"
                    : "bg-gradient-to-r from-red-600 to-red-700 shadow-[0_0_40px_rgba(239,68,68,0.4)] sm:shadow-[0_0_50px_rgba(239,68,68,0.5)]"
                } text-white`}
                whileHover={
                  !enrollmentStatus?.isOwner
                    ? {
                        scale: 1.05,
                        boxShadow: enrollmentStatus?.enrolled
                          ? "0 0 80px rgba(34,197,94,0.8)"
                          : "0 0 80px rgba(239,68,68,0.8)",
                      }
                    : {}
                }
                whileTap={!enrollmentStatus?.isOwner ? { scale: 0.98 } : {}}
              >
                {enrolling ? (
                  <>
                    <FaSpinner className="text-xl xs:text-2xl sm:text-3xl md:text-4xl flex-shrink-0 animate-spin" />
                    <span className="whitespace-nowrap leading-none">
                      ENROLLING...
                    </span>
                  </>
                ) : enrollmentStatus?.enrolled ? (
                  <>
                    <FaPlay className="text-xl xs:text-2xl sm:text-3xl md:text-4xl flex-shrink-0" />
                    <span className="whitespace-nowrap leading-none">
                      START LEARNING
                    </span>
                  </>
                ) : enrollmentStatus?.isOwner ? (
                  <>
                    <FaCheckCircle className="text-xl xs:text-2xl sm:text-3xl md:text-4xl flex-shrink-0" />
                    <span className="whitespace-nowrap leading-none">
                      YOUR COURSE
                    </span>
                  </>
                ) : (
                  <>
                    {React.createElement(getIconComponent(data.ctaButtonIcon), {
                      className:
                        "text-xl xs:text-2xl sm:text-3xl md:text-4xl flex-shrink-0",
                    })}
                    <span className="leading-none flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                      {/* User's custom button text */}
                      <span className="whitespace-nowrap">
                        {data.ctaButtonText || "ENROLL NOW"}
                      </span>

                      {/* Dynamic pricing - always shown */}
                      {data.footerPrice &&
                        data.footerPrice !== "0" &&
                        data.footerPrice !== "" && (
                          <span className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                            <span className="hidden xs:inline">AT</span>
                            {data.footerSalePrice &&
                            parseFloat(data.footerSalePrice) > 0 &&
                            parseFloat(data.footerSalePrice) <
                              parseFloat(data.footerPrice) ? (
                              <>
                                {/* Original price crossed out */}
                                <span className="line-through opacity-70 text-sm xs:text-base sm:text-lg md:text-xl">
                                  ${parseFloat(data.footerPrice).toFixed(0)}
                                </span>
                                {/* Sale price */}
                                <span className="font-black text-lg xs:text-xl sm:text-2xl md:text-3xl text-yellow-300">
                                  ${parseFloat(data.footerSalePrice).toFixed(0)}
                                </span>
                              </>
                            ) : (
                              /* Regular price */
                              <span className="font-black">
                                ${parseFloat(data.footerPrice).toFixed(0)}
                              </span>
                            )}
                          </span>
                        )}
                    </span>
                  </>
                )}
              </motion.button>

              {/* Sale Timer - Show below button if sale is active */}
              {!enrollmentStatus?.enrolled &&
                !enrollmentStatus?.isOwner &&
                data.footerSalePrice &&
                parseFloat(data.footerSalePrice) > 0 &&
                data.saleEndsAt && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 sm:mt-4 mb-6 sm:mb-8 md:mb-10 lg:mb-12"
                  >
                    <CountdownTimer endsAt={data.saleEndsAt} />
                  </motion.div>
                )}
              {data.statsEnabled && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 xs:gap-4 sm:gap-5 md:gap-6 max-w-4xl mx-auto mt-10">
                  {[
                    {
                      icon: FaUsers,
                      value: (() => {
                        const val = data.courseStats?.activeStudents ?? 0;
                        return val === 0 ? "0" : `${val.toLocaleString()}+`;
                      })(),
                      label: "Active Buyers",
                    },
                    {
                      icon: FaTrophy,
                      value: data.courseStats?.monthlyIncome ?? "$0",
                      label: "Monthly Income",
                    },
                    {
                      icon: FaStar,
                      value: (() => {
                        const rating = data.courseStats?.courseRating ?? 0;
                        // ✅ FIX: Show rating even if it's 0, format to 1 decimal
                        return `${rating.toFixed(1)}/5`;
                      })(),
                      label: "Course Rating",
                    },
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-xl sm:rounded-2xl p-4 xs:p-5 sm:p-6 backdrop-blur-xl"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      whileHover={{
                        y: -5,
                        borderColor: "rgba(239, 68, 68, 0.6)",
                      }}
                    >
                      <stat.icon className="text-red-400 text-2xl xs:text-3xl sm:text-4xl mx-auto mb-2 sm:mb-3" />
                      <div className="text-xl xs:text-2xl sm:text-3xl font-black text-white mb-1">
                        {stat.value}
                      </div>
                      <div className="text-gray-400 text-xs xs:text-sm sm:text-base">
                        {stat.label}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </section>
        {data.customSections && data.customSections.length > 0 && (
          <>
            {data.customSections.map((section: any, sectionIndex: number) => (
              <section
                key={section.id}
                className="relative w-full py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20"
              >
                <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
                  <motion.div
                    className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                  >
                    <SectionBadge badge={getBadgeForSection(section.id)} />
                    <h2 className="text-[24px] xs:text-[28px] sm:text-[36px] md:text-[48px] lg:text-[56px] xl:text-[64px] 2xl:text-[72px] font-black leading-[1.1] mb-2 sm:mb-3 md:mb-4 px-2 sm:px-4">
                      {section.titleWords && section.titleWords.length > 0 ? (
                        <>
                          {section.titleWords.map((word: any, idx: number) => (
                            <span
                              key={idx}
                              className={`${getShadeClass(
                                word.shade
                              )} mr-1.5 sm:mr-2`}
                            >
                              {word.text}
                            </span>
                          ))}
                        </>
                      ) : (
                        <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                          {section.title?.toUpperCase() || "SECTION TITLE"}
                        </span>
                      )}
                    </h2>
                    {section.descriptionWords &&
                    section.descriptionWords.length > 0 ? (
                      <p className="text-sm xs:text-base sm:text-lg md:text-xl max-w-3xl mx-auto px-2 sm:px-4 leading-relaxed">
                        {section.descriptionWords.map(
                          (word: any, idx: number) => (
                            <span
                              key={idx}
                              className={`${getShadeClass(word.shade)} mr-1`}
                            >
                              {word.text}
                            </span>
                          )
                        )}
                      </p>
                    ) : section.subtitle ? (
                      <p className="text-gray-300 text-sm xs:text-base sm:text-lg md:text-xl max-w-3xl mx-auto px-2 sm:px-4">
                        {section.subtitle}
                      </p>
                    ) : null}
                  </motion.div>
                  <div className="md:hidden relative">
                    <div
                      ref={(el) => {
                        customSectionRefs.current[sectionIndex] = el;
                      }}
                      className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
                      style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}
                    >
                      {section.cards?.map((card: any, cardIndex: number) => (
                        <div key={card.id} className="min-w-[85vw] snap-center">
                          <CustomCardPreview
                            card={card}
                            index={cardIndex}
                            isFirst={cardIndex === 0}
                            isLast={cardIndex === section.cards.length - 1}
                          />
                        </div>
                      ))}
                    </div>
                    {section.cards && section.cards.length > 1 && (
                      <div className="flex justify-center gap-3 mt-4">
                        <button
                          onClick={() =>
                            scrollContainer(
                              customSectionRefs.current[sectionIndex],
                              "left"
                            )
                          }
                          className="bg-gray-900/50 border border-red-500/30 p-3 rounded-full text-white hover:bg-red-900/30 transition-colors"
                        >
                          <FaChevronLeft />
                        </button>
                        <button
                          onClick={() =>
                            scrollContainer(
                              customSectionRefs.current[sectionIndex],
                              "right"
                            )
                          }
                          className="bg-gray-900/50 border border-red-500/30 p-3 rounded-full text-white hover:bg-red-900/30 transition-colors"
                        >
                          <FaChevronRight />
                        </button>
                      </div>
                    )}
                    {section.cards && section.cards.length > 1 && (
                      <div className="text-center mt-3">
                        <p className="text-gray-400 text-xs flex items-center justify-center gap-2">
                          <FaArrowLeft className="animate-pulse" />
                          Swipe to explore
                          <FaArrowRight className="animate-pulse" />
                        </p>
                      </div>
                    )}
                  </div>
                  {hasConnectingCards(section) ? (
                    (() => {
                      const totalCards = section.cards?.length || 0;
                      const columnsCount = totalCards <= 4 ? 2 : 3;
                      const gridClass =
                        columnsCount === 2
                          ? "md:grid-cols-2"
                          : "md:grid-cols-3";
                      return (
                        <div className="hidden md:block relative">
                          <div className="absolute top-24 left-0 right-0 h-1 flex items-center justify-center pointer-events-none z-0">
                            <div
                              className={`${
                                columnsCount === 2
                                  ? "w-[calc(100%-30%)]"
                                  : "w-[calc(100%-20%)]"
                              } h-full relative`}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/50 to-transparent"></div>
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-red-600"
                                initial={{ scaleX: 0 }}
                                whileInView={{ scaleX: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.5, delay: 0.5 }}
                                style={{ transformOrigin: "left" }}
                              />
                              {Array.from({
                                length: Math.min(totalCards, columnsCount),
                              }).map((_, idx) => {
                                const totalDots = Math.min(
                                  totalCards,
                                  columnsCount
                                );
                                const spacing =
                                  totalDots > 1 ? 100 / (totalDots - 1) : 0;
                                return (
                                  <motion.div
                                    key={idx}
                                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gradient-to-r from-red-600 to-red-700 shadow-[0_0_20px_rgba(239,68,68,0.6)]"
                                    style={{
                                      left:
                                        totalDots === 1
                                          ? "50%"
                                          : `${idx * spacing}%`,
                                    }}
                                    initial={{ scale: 0, opacity: 0 }}
                                    whileInView={{ scale: 1, opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{
                                      duration: 0.4,
                                      delay: 0.5 + idx * 0.3,
                                    }}
                                  >
                                    <motion.div
                                      className="absolute inset-0 rounded-full bg-red-500"
                                      animate={{
                                        scale: [1, 1.8, 1],
                                        opacity: [0.8, 0, 0.8],
                                      }}
                                      transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: idx * 0.3,
                                      }}
                                    />
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                          <div
                            className={`grid ${gridClass} gap-4 sm:gap-5 md:gap-6 lg:gap-8 relative z-10`}
                          >
                            {section.cards?.map(
                              (card: any, cardIndex: number) => (
                                <CustomCardPreview
                                  key={card.id}
                                  card={card}
                                  index={cardIndex}
                                  isFirst={cardIndex === 0}
                                  isLast={
                                    cardIndex === section.cards.length - 1
                                  }
                                  totalCards={totalCards}
                                  columnsCount={columnsCount}
                                />
                              )
                            )}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="hidden md:grid md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                      {section.cards?.map((card: any, cardIndex: number) => (
                        <CustomCardPreview
                          key={card.id}
                          card={card}
                          index={cardIndex}
                          isFirst={cardIndex === 0}
                          isLast={cardIndex === section.cards.length - 1}
                          totalCards={section.cards?.length || 0}
                          columnsCount={2}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            ))}
          </>
        )}
        {data.proofSectionEnabled && data.proofImages.length > 0 && (
          <section className="relative w-full py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20">
            <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
              <motion.div
                className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-16"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <SectionBadge badge={getBadgeForSection("proof")} />
                <h2 className="text-[24px] xs:text-[28px] sm:text-[36px] md:text-[48px] lg:text-[56px] xl:text-[64px] 2xl:text-[72px] font-black leading-[1.1] mb-2 sm:mb-3 md:mb-4 px-2 sm:px-4">
                  {data.proofSectionTitleWords &&
                  data.proofSectionTitleWords.length > 0 ? (
                    <>
                      {data.proofSectionTitleWords.map(
                        (word: TitleWord, idx: number) => (
                          <span
                            key={idx}
                            className={`${getShadeClass(
                              word.shade
                            )} mr-1.5 sm:mr-2`}
                          >
                            {word.text}
                          </span>
                        )
                      )}
                    </>
                  ) : (
                    <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                      {data.proofSectionTitle ||
                        "REAL PROOF FROM REAL STUDENTS"}
                    </span>
                  )}
                </h2>
              </motion.div>

              {/* Main Featured Proof - MATCHED DESIGN */}
              <motion.div
                className="relative max-w-4xl mx-auto mb-6 sm:mb-8 md:mb-10 lg:mb-12 bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/40 sm:border-2 rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden backdrop-blur-xl"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent" />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeProofImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative aspect-video bg-gradient-to-br from-gray-900 to-black flex items-center justify-center"
                  >
                    {data.proofImages[activeProofImage]?.imageUrl ? (
                      <img
                        src={data.proofImages[activeProofImage].imageUrl}
                        alt={data.proofImages[activeProofImage].title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-6 xs:p-8 sm:p-10 md:p-12 relative z-10">
                        <FaImage className="text-red-400 text-5xl xs:text-6xl sm:text-7xl md:text-8xl mx-auto mb-3 sm:mb-4 md:mb-5 lg:mb-6" />
                        <h3 className="text-xl xs:text-2xl sm:text-3xl font-black text-white mb-1 sm:mb-2">
                          {data.proofImages[activeProofImage]?.title}
                        </h3>
                        <p className="text-gray-300 text-sm xs:text-base sm:text-lg md:text-xl mb-2 sm:mb-3 md:mb-4">
                          {data.proofImages[activeProofImage]?.description}
                        </p>
                        <div className="inline-block bg-red-500/20 border border-red-500/40 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full">
                          <span className="text-red-400 font-bold flex items-center gap-1.5 sm:gap-2 text-xs xs:text-sm sm:text-base">
                            <FaCheckCircle /> Verified Proof
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Category Badge */}
                    {data.proofImages[activeProofImage]?.showCategory &&
                      data.proofImages[activeProofImage]?.category && (
                        <div className="absolute top-2 xs:top-3 sm:top-4 left-2 xs:left-3 sm:left-4 bg-gradient-to-r from-red-600 to-red-700 px-2 py-1 xs:px-3 xs:py-1.5 sm:px-4 sm:py-2 rounded-full">
                          <span className="text-white font-bold text-[10px] xs:text-xs sm:text-sm">
                            {data.proofImages[activeProofImage].category}
                          </span>
                        </div>
                      )}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="p-3 xs:p-4 sm:p-5 md:p-6 border-t border-red-500/20 relative z-10">
                  <div className="flex items-center justify-between gap-2 xs:gap-3 sm:gap-4">
                    <button
                      onClick={() =>
                        setActiveProofImage((prev) =>
                          prev === 0 ? data.proofImages.length - 1 : prev - 1
                        )
                      }
                      className="bg-gray-900/50 border border-red-500/30 px-3 py-2 xs:px-4 xs:py-2.5 sm:px-5 sm:py-3 md:px-6 rounded-lg sm:rounded-xl text-white font-bold hover:bg-red-900/30 transition-colors text-[10px] xs:text-xs sm:text-sm md:text-base whitespace-nowrap"
                    >
                      ← <span className="hidden xs:inline">Previous</span>
                    </button>
                    <div className="text-gray-400 text-[10px] xs:text-xs sm:text-sm">
                      {activeProofImage + 1} / {data.proofImages.length}
                    </div>
                    <button
                      onClick={() =>
                        setActiveProofImage(
                          (prev) => (prev + 1) % data.proofImages.length
                        )
                      }
                      className="bg-gray-900/50 border border-red-500/30 px-3 py-2 xs:px-4 xs:py-2.5 sm:px-5 sm:py-3 md:px-6 rounded-lg sm:rounded-xl text-white font-bold hover:bg-red-900/30 transition-colors text-[10px] xs:text-xs sm:text-sm md:text-base whitespace-nowrap"
                    >
                      <span className="hidden xs:inline">Next</span> →
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        )}
        {data.testimonialsEnabled && data.testimonials.length > 0 && (
          <section className="relative w-full py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20 bg-gradient-to-b from-black via-red-950/10 to-black">
            <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
              <motion.div
                className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <SectionBadge badge={getBadgeForSection("testimonials")} />
                <h2 className="text-[24px] xs:text-[28px] sm:text-[36px] md:text-[48px] lg:text-[56px] xl:text-[64px] 2xl:text-[72px] font-black leading-[1.1] mb-2 sm:mb-3 md:mb-4 px-2 sm:px-4">
                  {data.testimonialsTitleWords &&
                  data.testimonialsTitleWords.length > 0 ? (
                    <>
                      {data.testimonialsTitleWords.map(
                        (word: TitleWord, idx: number) => (
                          <span
                            key={idx}
                            className={`${getShadeClass(
                              word.shade
                            )} mr-1.5 sm:mr-2`}
                          >
                            {word.text}
                          </span>
                        )
                      )}
                    </>
                  ) : (
                    <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                      {data.testimonialsTitle?.toUpperCase() ||
                        "HEAR IT FROM OUR STUDENTS"}
                    </span>
                  )}
                </h2>
                <p className="text-gray-300 text-sm xs:text-base sm:text-lg md:text-xl max-w-3xl mx-auto px-2">
                  Real people, real results. Watch our students share their
                  success stories.
                </p>
              </motion.div>

              {/* Main Video Testimonial - FULLY RESPONSIVE */}
              <motion.div
                className="relative max-w-5xl mx-auto mb-6 sm:mb-8 md:mb-10 lg:mb-12"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTestimonial}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/40 sm:border-2 rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden backdrop-blur-xl"
                  >
                    {/* Video Container - MATCHED WITH INSTAGRAMCOURSEHOMEPAGE */}
                    <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-black">
                      {data.testimonials[activeTestimonial]?.videoFile ? (
                        <>
                          <video
                            src={data.testimonials[activeTestimonial].videoFile}
                            controls
                            className="absolute top-0 left-0 w-full h-full object-contain bg-black"
                            preload="metadata"
                          >
                            Your browser does not support the video tag.
                          </video>
                          {data.testimonials[activeTestimonial]
                            ?.videoLength && (
                            <div className="absolute top-2 right-2 xs:top-3 xs:right-3 sm:top-4 sm:right-4 md:top-6 md:right-6 pointer-events-none">
                              <div className="bg-black/80 backdrop-blur-md px-2 py-1 xs:px-3 xs:py-1.5 sm:px-4 sm:py-2 rounded-full border border-red-500/30">
                                <span className="text-white font-bold text-[10px] xs:text-xs sm:text-sm flex items-center gap-1 xs:gap-1.5">
                                  <FaClock className="text-red-400" />
                                  {
                                    data.testimonials[activeTestimonial]
                                      .videoLength
                                  }
                                </span>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="relative z-10 text-center p-4">
                            <div className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-[0_0_40px_rgba(239,68,68,0.5)] cursor-pointer hover:scale-110 transition-transform">
                              <FaPlay className="text-white text-2xl xs:text-3xl sm:text-4xl md:text-5xl ml-1" />
                            </div>
                            <div className="bg-black/80 px-2 py-1 xs:px-3 xs:py-1.5 sm:px-4 sm:py-2 rounded-full inline-block backdrop-blur-sm">
                              <span className="text-white text-[10px] xs:text-xs sm:text-sm font-bold flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                                <FaVideo /> [Student Video{" "}
                                {activeTestimonial + 1}]
                              </span>
                            </div>
                          </div>

                          {/* Thumbnail Avatar */}
                          <div className="absolute top-2 xs:top-3 sm:top-4 left-2 xs:left-3 sm:left-4 w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center text-white font-black text-sm xs:text-base sm:text-lg md:text-xl border-2 xs:border-3 sm:border-4 border-white shadow-lg">
                            {data.testimonials[activeTestimonial]?.name
                              ?.split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase() || "ST"}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Testimonial Info - POSITIONED BELOW VIDEO WITH BOXES */}
                    <div className="p-4 xs:p-5 sm:p-6 md:p-8 border-t border-red-500/20 bg-gradient-to-br from-gray-900/95 to-black">
                      {/* Student Info */}
                      <div className="mb-3 sm:mb-4">
                        <h3 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-black text-white mb-1">
                          {data.testimonials[activeTestimonial].name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 sm:gap-3 text-xs xs:text-sm sm:text-base">
                          <span className="text-gray-400">
                            {data.testimonials[activeTestimonial]
                              .customFields?.[0]?.value || "Creator"}
                          </span>
                          {data.testimonials[activeTestimonial]
                            .customFields?.[1] && (
                            <>
                              <span className="text-gray-600">•</span>
                              <span className="text-red-400 font-bold">
                                {
                                  data.testimonials[activeTestimonial]
                                    .customFields[1].value
                                }
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Results Grid - BOX DESIGN MATCHED */}
                      {/* Results Grid - MATCHED WITH TESTIMONIALEDITOR PREVIEW */}
                      {data.testimonials[activeTestimonial].customFields &&
                        data.testimonials[activeTestimonial].customFields
                          .length > 0 && (
                          <div className="grid grid-cols-2 gap-1.5 lg:gap-2 mb-2">
                            {data.testimonials[activeTestimonial].customFields
                              .slice(0, 2)
                              .map((field: any) => (
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
                      {/* Highlight Quote */}
                      <div className="bg-gray-900/50 border border-red-500/20 rounded-lg sm:rounded-xl p-3 xs:p-4 sm:p-5 mb-4 sm:mb-5 md:mb-6">
                        <FaStar className="text-red-400 text-xl xs:text-2xl sm:text-3xl mb-2 sm:mb-3" />
                        <p className="text-gray-300 italic text-xs xs:text-sm sm:text-base md:text-lg leading-relaxed">
                          "{data.testimonials[activeTestimonial].highlight}"
                        </p>
                      </div>

                      {/* Navigation */}
                      <div className="flex items-center justify-between gap-2 xs:gap-3 sm:gap-4">
                        <button
                          onClick={() =>
                            setActiveTestimonial((prev) =>
                              prev === 0
                                ? data.testimonials.length - 1
                                : prev - 1
                            )
                          }
                          className="bg-gray-900/50 border border-red-500/30 px-3 py-2 xs:px-4 xs:py-2.5 sm:px-5 sm:py-3 md:px-6 rounded-lg sm:rounded-xl text-white font-bold hover:bg-red-900/30 transition-colors text-[10px] xs:text-xs sm:text-sm md:text-base flex items-center gap-1 xs:gap-1.5 sm:gap-2"
                        >
                          <FaChevronLeft />
                          <span className="hidden xs:inline">Previous</span>
                        </button>
                        <div className="flex gap-1 xs:gap-1.5 sm:gap-2">
                          {data.testimonials.map((_: any, index: number) => (
                            <button
                              key={index}
                              onClick={() => setActiveTestimonial(index)}
                              className={`h-1.5 xs:h-2 sm:h-2.5 rounded-full transition-all ${
                                index === activeTestimonial
                                  ? "w-6 xs:w-8 sm:w-10 bg-red-500"
                                  : "w-1.5 xs:w-2 sm:w-2.5 bg-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                        <button
                          onClick={() =>
                            setActiveTestimonial(
                              (prev) => (prev + 1) % data.testimonials.length
                            )
                          }
                          className="bg-gray-900/50 border border-red-500/30 px-3 py-2 xs:px-4 xs:py-2.5 sm:px-5 sm:py-3 md:px-6 rounded-lg sm:rounded-xl text-white font-bold hover:bg-red-900/30 transition-colors text-[10px] xs:text-xs sm:text-sm md:text-base flex items-center gap-1 xs:gap-1.5 sm:gap-2"
                        >
                          <span className="hidden xs:inline">Next</span>
                          <FaChevronRight />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </motion.div>

              {/* Testimonial Count */}
              <div className="text-center">
                <div className="inline-block bg-gradient-to-r from-gray-900/90 to-black/95 border border-red-500/30 rounded-xl sm:rounded-2xl px-4 py-3 xs:px-5 xs:py-3.5 sm:px-6 sm:py-4 backdrop-blur-xl">
                  <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3">
                    <FaUsers className="text-red-400 text-xl xs:text-2xl sm:text-3xl" />
                    <div className="text-left">
                      <div className="text-white font-black text-base xs:text-lg sm:text-xl md:text-2xl">
                        1,200+ Video Reviews
                      </div>
                      <div className="text-gray-400 text-[10px] xs:text-xs sm:text-sm">
                        From verified students worldwide
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
        {data.faqEnabled && data.faqs.length > 0 && (
          <section className="relative w-full py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20">
            <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
              <motion.div
                className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <SectionBadge badge={getBadgeForSection("faq")} />
                <h2 className="text-[24px] xs:text-[28px] sm:text-[36px] md:text-[48px] lg:text-[56px] xl:text-[64px] 2xl:text-[72px] font-black leading-[1.1] mb-2 sm:mb-3 md:mb-4 px-2 sm:px-4">
                  {data.faqTitleWords && data.faqTitleWords.length > 0 ? (
                    <>
                      {data.faqTitleWords.map(
                        (word: TitleWord, idx: number) => (
                          <span
                            key={idx}
                            className={`${getShadeClass(
                              word.shade
                            )} mr-1.5 sm:mr-2`}
                          >
                            {word.text}
                          </span>
                        )
                      )}
                    </>
                  ) : (
                    <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                      {data.faqTitle?.toUpperCase() || "GOT QUESTIONS?"}
                    </span>
                  )}
                </h2>
              </motion.div>
              <div className="max-w-4xl mx-auto space-y-3 xs:space-y-4 sm:space-y-5">
                {data.faqs.map((faq: any, index: number) => (
                  <motion.div
                    key={faq.id}
                    className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <button
                      onClick={() =>
                        setActiveFaq(activeFaq === index ? null : index)
                      }
                      className="w-full text-left p-4 xs:p-5 sm:p-6 flex items-start justify-between gap-2 xs:gap-3 sm:gap-4 hover:bg-red-900/10 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="text-base xs:text-lg sm:text-xl font-black text-white pr-2">
                          {faq.question}
                        </h3>
                      </div>
                      <div
                        className={`flex-shrink-0 w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center transition-transform ${
                          activeFaq === index ? "rotate-180" : ""
                        }`}
                      >
                        <FaChevronDown className="text-white text-xs xs:text-sm sm:text-base" />
                      </div>
                    </button>
                    <AnimatePresence>
                      {activeFaq === index && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-red-500/20"
                        >
                          <div className="p-4 xs:p-5 sm:p-6 bg-red-900/5">
                            <p className="text-gray-300 leading-relaxed text-sm xs:text-base sm:text-lg">
                              {faq.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}
        <section className="relative w-full py-8 sm:py-10 md:py-16 lg:py-20 xl:py-24 bg-gradient-to-b from-black via-red-950/20 to-black">
          <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <motion.div
              className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border-2 border-red-500/50 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] p-6 xs:p-8 sm:p-10 md:p-12 lg:p-16 xl:p-20 text-center overflow-hidden backdrop-blur-xl"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-transparent" />
              <div className="relative z-10">
                <SectionBadge badge={getBadgeForSection("footer")} />
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-block mb-4 sm:mb-6 md:mb-8"
                >
                  <FaBolt className="text-red-400 text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl" />
                </motion.div>
                <h2 className="text-[24px] xs:text-[28px] sm:text-[36px] md:text-[48px] lg:text-[56px] xl:text-[64px] 2xl:text-[72px] font-black text-white leading-[1.1] mb-3 sm:mb-4 md:mb-6">
                  {data.footerTitleWords && data.footerTitleWords.length > 0 ? (
                    <>
                      {data.footerTitleWords.map(
                        (word: TitleWord, idx: number) => (
                          <span
                            key={idx}
                            className={`${getShadeClass(
                              word.shade
                            )} mr-1.5 sm:mr-2`}
                          >
                            {word.text}
                          </span>
                        )
                      )}
                    </>
                  ) : (
                    <span className="text-white">{data.footerTitle || ""}</span>
                  )}
                </h2>
                <p className="text-gray-300 text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 md:mb-10 lg:mb-12 max-w-3xl mx-auto leading-relaxed">
                  {data.footerDescriptionWords &&
                  data.footerDescriptionWords.length > 0 ? (
                    <>
                      {data.footerDescriptionWords.map(
                        (word: TitleWord, i: number) => (
                          <span
                            key={i}
                            className={`${getShadeClass(word.shade)} mr-1`}
                          >
                            {word.text}
                          </span>
                        )
                      )}
                    </>
                  ) : (
                    data.footerDescription || ""
                  )}
                </p>
                <div className="space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6">
                  <motion.button
                    onClick={() => {
                      if (enrollmentStatus?.enrolled) {
                        onStartLearning?.();
                      } else if (enrollmentStatus?.isOwner) {
                        return;
                      } else {
                        onEnroll?.();
                      }
                    }}
                    disabled={enrolling || enrollmentStatus?.isOwner}
                    className={`font-black py-4 xs:py-5 sm:py-6 md:py-7 lg:py-8 px-6 xs:px-8 sm:px-10 md:px-12 lg:px-16 rounded-xl sm:rounded-2xl text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl inline-flex items-center justify-center gap-2 sm:gap-3 md:gap-4 transition-all ${
                      enrollmentStatus?.enrolled
                        ? "bg-gradient-to-r from-green-600 to-green-700 shadow-[0_0_40px_rgba(34,197,94,0.5)]"
                        : enrollmentStatus?.isOwner
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 shadow-[0_0_40px_rgba(59,130,246,0.5)] cursor-not-allowed opacity-75"
                        : "bg-gradient-to-r from-red-600 to-red-700 shadow-[0_0_40px_rgba(239,68,68,0.5)] sm:shadow-[0_0_60px_rgba(239,68,68,0.6)]"
                    } text-white`}
                    whileHover={
                      !enrollmentStatus?.isOwner
                        ? {
                            scale: 1.05,
                            boxShadow: enrollmentStatus?.enrolled
                              ? "0 0 80px rgba(34,197,94,0.8)"
                              : "0 0 80px rgba(239,68,68,0.8)",
                          }
                        : {}
                    }
                    whileTap={!enrollmentStatus?.isOwner ? { scale: 0.98 } : {}}
                  >
                    {enrolling ? (
                      <>
                        <FaSpinner className="text-xl xs:text-2xl sm:text-3xl md:text-4xl flex-shrink-0 animate-spin" />
                        <span className="whitespace-nowrap leading-none">
                          ENROLLING...
                        </span>
                      </>
                    ) : enrollmentStatus?.enrolled ? (
                      <>
                        <FaPlay className="text-xl xs:text-2xl sm:text-3xl md:text-4xl flex-shrink-0" />
                        <span className="whitespace-nowrap leading-none">
                          START LEARNING
                        </span>
                      </>
                    ) : enrollmentStatus?.isOwner ? (
                      <>
                        <FaCheckCircle className="text-xl xs:text-2xl sm:text-3xl md:text-4xl flex-shrink-0" />
                        <span className="whitespace-nowrap leading-none">
                          YOUR COURSE
                        </span>
                      </>
                    ) : (
                      <>
                        <FaRocket className="text-xl xs:text-2xl sm:text-3xl md:text-4xl flex-shrink-0" />
                        <span className="leading-none flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                          {/* User's custom button text */}
                          <span className="whitespace-nowrap">
                            {data.ctaButtonText || "ENROLL NOW"}
                          </span>

                          {/* Dynamic pricing */}
                          {data.footerPrice &&
                            data.footerPrice !== "0" &&
                            data.footerPrice !== "" && (
                              <span className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                                <span className="hidden xs:inline">AT</span>
                                {data.footerSalePrice &&
                                parseFloat(data.footerSalePrice) > 0 &&
                                parseFloat(data.footerSalePrice) <
                                  parseFloat(data.footerPrice) ? (
                                  <>
                                    <span className="line-through opacity-70 text-sm xs:text-base sm:text-lg md:text-xl">
                                      ${parseFloat(data.footerPrice).toFixed(0)}
                                    </span>
                                    <span className="font-black text-lg xs:text-xl sm:text-2xl md:text-3xl text-yellow-300">
                                      $
                                      {parseFloat(data.footerSalePrice).toFixed(
                                        0
                                      )}
                                    </span>
                                  </>
                                ) : (
                                  <span className="font-black">
                                    ${parseFloat(data.footerPrice).toFixed(0)}
                                  </span>
                                )}
                              </span>
                            )}
                        </span>
                      </>
                    )}
                  </motion.button>

                  {/* Sale Timer for footer button too */}
                  {!enrollmentStatus?.enrolled &&
                    !enrollmentStatus?.isOwner &&
                    data.footerSalePrice &&
                    parseFloat(data.footerSalePrice) > 0 &&
                    data.saleEndsAt && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 sm:mt-4"
                      >
                        <CountdownTimer endsAt={data.saleEndsAt} />
                      </motion.div>
                    )}
                  {/* Footer Badges - MATCHED DESIGN */}
                  <div className="flex flex-wrap items-center justify-center gap-2 xs:gap-3 sm:gap-4 md:gap-6 text-gray-400 text-[10px] xs:text-xs sm:text-sm md:text-base">
                    {data.footerIcons.map((icon: any, index: number) => (
                      <React.Fragment key={index}>
                        <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                          <span className="text-red-400 text-sm xs:text-base sm:text-lg md:text-xl flex-shrink-0">
                            {(() => {
                              const emojiMap: any = {
                                shield: "🛡️",
                                infinity: "♾️",
                                star: "⭐",
                                fire: "🔥",
                                rocket: "🚀",
                                trophy: "🏆",
                                crown: "👑",
                                lightning: "⚡",
                                check: "✅",
                                lock: "🔒",
                              };
                              return emojiMap[icon.name] || "⭐";
                            })()}
                          </span>
                          <span>{icon.label}</span>
                        </div>
                        {index < data.footerIcons.length - 1 && (
                          <span className="hidden xs:inline">•</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LivePreview;
