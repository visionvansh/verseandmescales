"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { m, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { 
  FaFire, 
  FaPlayCircle, 
  FaStar, 
  FaChevronDown,
  FaCheckCircle,
  FaShieldAlt,
  FaBolt
} from "react-icons/fa";
import { useVideoModal, useSmoothScroll } from "@/lib/sin-detox/hooks";
import { VideoModal } from "./ui/VideoModal";
import { 
  HERO_CONFIG, 
  HERO_BACKGROUND_DESKTOP, 
  HERO_BACKGROUND_MOBILE,
  HERO_VIDEO_URL
} from "@/lib/sin-detox/constants";

// ===== CONFIGURABLE PROPS =====
interface HeroSectionProps {
  backgroundDesktop?: string;
  backgroundMobile?: string;
  headlineLine1?: string;
  headlineLine2?: string;
  badgeText?: string;
  subheadline?: string;
  subheadlineHighlight?: string;
  primaryCtaText?: string;
  secondaryCtaText?: string;
  videoUrl?: string;
  rating?: number;
  totalUsers?: string;
  showVideoCta?: boolean;
  className?: string;
}

// ===== UTILITY COMPONENTS =====

// 1. Scramble/Decryption Text Effect
const ScrambleText = ({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) => {
  const [displayText, setDisplayText] = useState("");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()";

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let iteration = 0;
    
    const startScramble = () => {
      const interval = setInterval(() => {
        setDisplayText(
          text
            .split("")
            .map((letter, index) => {
              if (index < iteration) {
                return text[index];
              }
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join("")
        );

        if (iteration >= text.length) {
          clearInterval(interval);
        }

        iteration += 1 / 3;
      }, 30);
    };

    timeout = setTimeout(startScramble, delay * 1000);
    return () => clearTimeout(timeout);
  }, [text, delay]);

  return <span className={className}>{displayText || " "}</span>;
};

// 2. Typewriter Effect
const TypewriterText = ({ text, highlight, delay = 0 }: { text: string; highlight: string; delay?: number }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [startTyping, setStartTyping] = useState(false);
  const fullText = `${text} ${highlight}`;

  useEffect(() => {
    const timer = setTimeout(() => setStartTyping(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!startTyping) return;
    
    if (displayedText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1));
      }, 30 + Math.random() * 20);
      return () => clearTimeout(timeout);
    }
  }, [displayedText, fullText, startTyping]);

  useEffect(() => {
    const interval = setInterval(() => setShowCursor((prev) => !prev), 530);
    return () => clearInterval(interval);
  }, []);

  const renderText = () => {
    if (displayedText.length <= text.length) {
      return <span className="text-gray-300">{displayedText}</span>;
    }
    return (
      <>
        <span className="text-gray-300">{text} </span>
        <span className="text-white font-semibold drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
          {displayedText.slice(text.length + 1)}
        </span>
      </>
    );
  };

  return (
    <div className="min-h-[3.5rem] sm:min-h-[3.5rem] md:min-h-[4rem] leading-snug">
      {renderText()}
      <span className={`${showCursor ? "opacity-100" : "opacity-0"} text-red-500 font-bold ml-1`}>|</span>
    </div>
  );
};

// 3. Spotlight Button Effect
const SpotlightButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => {
  const divRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!divRef.current) return;
    const div = divRef.current;
    const rect = div.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => setOpacity(1);
  const handleBlur = () => setOpacity(0);
  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <button
      ref={divRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      // ✅ DECREASED: px-6 py-3.5 (was px-10 py-5)
      className="relative group w-full sm:w-auto px-6 py-3.5 sm:px-6 sm:py-4 bg-zinc-900 overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02] border border-zinc-800"
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(220, 38, 38, 0.4), transparent 40%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
      <div className="absolute inset-0 ring-1 ring-inset ring-red-500/20 rounded-xl group-hover:ring-red-500/50 transition-all duration-300" />
    </button>
  );
};

// ===== HERO BACKGROUND COMPONENT (UNCHANGED) =====
const HeroBackground = React.memo(({ 
  desktopImage, 
  mobileImage 
}: { 
  desktopImage: string; 
  mobileImage: string; 
}) => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 200]);
  const scale = useTransform(scrollY, [0, 600], [1, 1.15]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Mobile Background */}
      <m.div 
        className="absolute inset-0 md:hidden"
        style={{ y, scale }}
      >
        <div 
          className="absolute inset-0 bg-no-repeat will-change-transform"
          style={{
            backgroundImage: `url(${mobileImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            minHeight: '100vh',
            width: '100%',
          }}
          role="img"
          aria-label="Hero background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </m.div>
      
      {/* Desktop Background */}
      <m.div 
        className="absolute inset-0 hidden md:block"
        style={{ y, scale }}
      >
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
          style={{
            backgroundImage: `url(${desktopImage})`,
          }}
          role="img"
          aria-label="Hero background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
      </m.div>

      {/* Subtle Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
        aria-hidden="true"
      />

      {/* Bottom Fade to Content */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
    </div>
  );
});

HeroBackground.displayName = 'HeroBackground';

// ===== BADGE COMPONENT =====
const HeroBadge = React.memo(({ text }: { text: string }) => (
  <m.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    className="inline-flex items-center gap-2 mb-6 sm:mb-6"
  >
    <div className="relative group cursor-default">
      <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-900 rounded-lg blur opacity-40 group-hover:opacity-75 transition duration-200" />
      <div className="relative px-5 py-2 sm:px-4 sm:py-1.5 bg-black rounded-lg border border-red-500/30 flex items-center gap-2.5">
        <span className="relative flex h-2.5 w-2.5 sm:h-2 sm:w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-full w-full bg-red-500"></span>
        </span>
        <span className="text-xs sm:text-[10px] md:text-xs font-mono font-bold tracking-widest text-red-400 uppercase">
          {text}
        </span>
      </div>
    </div>
  </m.div>
));

HeroBadge.displayName = 'HeroBadge';

// ===== HEADLINE COMPONENT =====
const HeroHeadline = React.memo(({ line1, line2 }: { line1: string; line2: string }) => (
  <div className="relative mb-6 sm:mb-6 select-none">
    <h1 className="text-[18vw] xs:text-[4.5rem] sm:text-[6rem] md:text-[8rem] lg:text-[9rem] font-black tracking-tighter leading-[0.85] text-white mix-blend-difference">
      <ScrambleText text={line1} delay={0.2} />
    </h1>
    
    <h1 className="text-[18vw] xs:text-[4.5rem] sm:text-[6rem] md:text-[8rem] lg:text-[9rem] font-black tracking-tighter leading-[0.85]">
       <span className="text-transparent bg-clip-text bg-gradient-to-b from-red-500 via-red-600 to-red-900 filter drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">
         <ScrambleText text={line2} delay={0.8} />
       </span>
    </h1>
  </div>
));

HeroHeadline.displayName = 'HeroHeadline';

// ===== SUBHEADLINE COMPONENT =====
const HeroSubheadline = React.memo(({ text, highlight }: { text: string; highlight: string }) => (
  <m.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5, delay: 1.5 }}
    className="text-lg xs:text-lg sm:text-xl md:text-2xl text-gray-300 max-w-[95%] sm:max-w-2xl mx-auto mb-10 sm:mb-10 font-mono"
  >
    <TypewriterText text={text} highlight={highlight} delay={1.8} />
  </m.div>
));

HeroSubheadline.displayName = 'HeroSubheadline';

// ===== RATING COMPONENT =====
const HeroRating = React.memo(({ rating, totalUsers }: { rating: number; totalUsers: string }) => {
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 2.5 }}
      className="flex justify-center mb-10 sm:mb-8"
    >
      <div className="flex items-center gap-4 sm:gap-3 px-5 py-2.5 sm:px-4 sm:py-2 bg-white/5 backdrop-blur-md border-l-2 border-red-500 rounded-r-lg">
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <FaStar 
              key={i} 
              className={`text-sm sm:text-xs ${i < Math.floor(rating) ? "text-red-500" : "text-gray-700"}`} 
            />
          ))}
        </div>
        <div className="h-5 sm:h-4 w-[1px] bg-white/10" />
        <span className="text-sm sm:text-xs font-mono text-gray-400">
          <span className="text-white font-bold">{totalUsers}</span> JOINED
        </span>
      </div>
    </m.div>
  );
});

HeroRating.displayName = 'HeroRating';

// ===== CTA BUTTONS COMPONENT =====
const HeroCtaButtons = React.memo(({ 
  primaryText, 
  secondaryText, 
  onPrimaryClick, 
  onSecondaryClick,
  showSecondary = true 
}: { 
  primaryText: string; 
  secondaryText: string; 
  onPrimaryClick: () => void; 
  onSecondaryClick: () => void;
  showSecondary?: boolean;
}) => (
  <m.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 3 }}
    className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-4 px-4 sm:px-4 w-full sm:w-auto"
  >
    {/* Primary CTA with Spotlight Effect */}
    <SpotlightButton onClick={onPrimaryClick}>
      {/* ✅ DECREASED: text-base (was text-xl) */}
      <span className="flex items-center justify-center gap-2.5 sm:gap-2.5 text-white font-bold text-base sm:text-base tracking-wide uppercase">
        {primaryText}
        <FaFire className="text-red-500 text-base sm:text-sm" />
      </span>
    </SpotlightButton>

    {/* Secondary CTA */}
    {showSecondary && (
      <button
        onClick={onSecondaryClick}
        // ✅ DECREASED: px-6 py-3 (was px-10 py-5)
        className="group relative w-full sm:w-auto px-6 py-3 sm:px-6 sm:py-4 text-gray-400 hover:text-white font-mono text-sm sm:text-sm tracking-widest uppercase transition-all duration-300"
      >
        <span className="flex items-center justify-center gap-3 sm:gap-2.5">
          {/* ✅ DECREASED: h-8 w-8 (was h-10 w-10) */}
          <span className="relative flex h-8 w-8 sm:h-7 sm:w-7 items-center justify-center rounded-full border border-gray-700 group-hover:border-white transition-colors">
            <FaPlayCircle className="text-sm sm:text-xs" />
          </span>
          {secondaryText}
        </span>
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-red-500 group-hover:w-full transition-all duration-300" />
      </button>
    )}
  </m.div>
));

HeroCtaButtons.displayName = 'HeroCtaButtons';

// ===== TRUST BADGES COMPONENT =====
const HeroTrustBadges = React.memo(() => (
  <m.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.4, delay: 3.2 }}
    className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-6 mt-12 sm:mt-12 opacity-60 hover:opacity-100 transition-opacity duration-300"
  >
    {[
      { icon: FaShieldAlt, text: "ENCRYPTED" },
      { icon: FaCheckCircle, text: "VERIFIED" },
      { icon: FaBolt, text: "LIFETIME" }
    ].map((item, i) => (
      <div key={i} className="flex items-center gap-2.5 sm:gap-2 text-xs sm:text-[10px] font-mono tracking-widest text-gray-500 uppercase">
        <item.icon className="text-red-900 text-base sm:text-xs" />
        <span>{item.text}</span>
      </div>
    ))}
  </m.div>
));

HeroTrustBadges.displayName = 'HeroTrustBadges';

// ===== SCROLL INDICATOR COMPONENT =====
const ScrollIndicator = React.memo(({ onClick }: { onClick: () => void }) => (
  <m.button
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 4 }}
    onClick={onClick}
    className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 group"
    aria-label="Scroll to explore content"
  >
    <div className="h-8 sm:h-12 w-[1px] bg-gradient-to-b from-transparent via-red-500 to-transparent" />
    <span className="text-[9px] sm:text-[10px] font-mono font-bold tracking-[0.3em] text-red-500/50 group-hover:text-red-500 transition-colors uppercase vertical-rl">
      Scroll
    </span>
  </m.button>
));

ScrollIndicator.displayName = 'ScrollIndicator';

// ===== MAIN HERO SECTION COMPONENT =====
export function HeroSection({
  backgroundDesktop = HERO_BACKGROUND_DESKTOP,
  backgroundMobile = HERO_BACKGROUND_MOBILE,
  headlineLine1 = HERO_CONFIG.headline.line1,
  headlineLine2 = HERO_CONFIG.headline.line2,
  badgeText = HERO_CONFIG.badge.text,
  subheadline = HERO_CONFIG.subheadline.text,
  subheadlineHighlight = HERO_CONFIG.subheadline.highlight,
  primaryCtaText = HERO_CONFIG.cta.primary.text,
  secondaryCtaText = HERO_CONFIG.cta.secondary.text,
  videoUrl = HERO_VIDEO_URL,
  rating = HERO_CONFIG.stats.rating,
  totalUsers = HERO_CONFIG.stats.totalUsers,
  showVideoCta = true,
  className = "",
}: HeroSectionProps) {
  const { isOpen, videoUrl: modalVideoUrl, openModal, closeModal } = useVideoModal();
  const scrollTo = useSmoothScroll();

  const handlePrimaryClick = () => scrollTo("pricing");
  const handleSecondaryClick = () => videoUrl && openModal(videoUrl);
  const handleScrollClick = () => scrollTo("features");

  return (
    <>
      <section
        id="hero"
        className={`relative min-h-screen flex items-center justify-center overflow-hidden bg-black ${className}`}
        aria-label="Hero section"
      >
        {/* Background Layer (UNCHANGED) */}
        <HeroBackground 
          desktopImage={backgroundDesktop} 
          mobileImage={backgroundMobile} 
        />

        <div className="relative z-10 w-full max-w-[95%] lg:max-w-7xl mx-auto px-4 sm:px-4 text-center pt-0 pb-20 sm:pt-20 sm:pb-16">
           <div className="flex flex-col items-center justify-center">
              <HeroBadge text={badgeText} />
              <HeroHeadline line1={headlineLine1} line2={headlineLine2} />
              <HeroSubheadline text={subheadline} highlight={subheadlineHighlight} />
              <HeroRating rating={rating} totalUsers={totalUsers} />
              
              <HeroCtaButtons
                primaryText={primaryCtaText}
                secondaryText={secondaryCtaText}
                onPrimaryClick={handlePrimaryClick}
                onSecondaryClick={handleSecondaryClick}
                showSecondary={showVideoCta && !!videoUrl}
              />
              
              <HeroTrustBadges />
           </div>
        </div>

        <ScrollIndicator onClick={handleScrollClick} />
      </section>

      {showVideoCta && (
        <VideoModal 
          isOpen={isOpen} 
          videoUrl={modalVideoUrl} 
          onClose={closeModal} 
        />
      )}
    </>
  );
}

export default HeroSection;