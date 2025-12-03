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
  secondaryCtaText?: string;
  videoUrl?: string;
  rating?: number;
  totalUsers?: string;
  showVideoCta?: boolean;
  className?: string;
  
  // Payment integration props
  enrollmentStatus?: any;
  onEnroll?: () => void;
  onStartLearning?: () => void;
  enrolling?: boolean;
  regularPrice?: string;
  salePrice?: string | null;
  hasSale?: boolean;
  saleEndsAt?: string | null;
}

// ===== COUNTDOWN TIMER COMPONENT =====
const CountdownTimer = ({ endsAt }: { endsAt: string }) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const endTime = new Date(endsAt).getTime();
      const difference = endTime - now;

      if (difference <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, expired: true };
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { hours, minutes, seconds, expired: false };
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

  if (timeLeft.expired) return null;

  const totalMinutes = timeLeft.hours * 60 + timeLeft.minutes;
  const isUrgent = totalMinutes < 60;
  const isCritical = totalMinutes < 10;

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 px-3 sm:px-4 py-2 rounded-lg backdrop-blur-xl"
    >
      <div className="flex items-center gap-2">
        <FaFire className={`text-xl ${isCritical ? "text-red-500 animate-pulse" : isUrgent ? "text-orange-500" : "text-orange-400"}`} />
        <span className={`text-sm sm:text-base font-bold uppercase tracking-wide ${
          isCritical ? "text-red-400" : isUrgent ? "text-orange-400" : "text-orange-300"
        }`}>
          SALE ENDS
        </span>
      </div>
      <span className="text-gray-400">•</span>
      <span className={`text-base sm:text-lg font-semibold tabular-nums ${
        isCritical ? "text-red-400 animate-pulse" : isUrgent ? "text-orange-400" : "text-orange-300"
      }`}>
        {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
      </span>
    </m.div>
  );
};

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
    <div className="min-h-[3rem] sm:min-h-[3.5rem] leading-snug">
      {renderText()}
      <span className={`${showCursor ? "opacity-100" : "opacity-0"} text-red-500 font-bold ml-1`}>|</span>
    </div>
  );
};

// 3. Spotlight Button Effect
const SpotlightButton = ({ onClick, children, disabled = false }: { onClick: () => void; children: React.ReactNode; disabled?: boolean }) => {
  const divRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!divRef.current || disabled) return;
    const div = divRef.current;
    const rect = div.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => !disabled && setOpacity(1);
  const handleBlur = () => setOpacity(0);
  const handleMouseEnter = () => !disabled && setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <button
      ref={divRef}
      onClick={onClick}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative group w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-zinc-900 overflow-hidden rounded-xl transition-all duration-300 border border-zinc-800 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
      }`}
    >
      {!disabled && (
        <div
          className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(220, 38, 38, 0.4), transparent 40%)`,
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
      <div className={`absolute inset-0 ring-1 ring-inset rounded-xl transition-all duration-300 ${
        disabled ? 'ring-zinc-800' : 'ring-red-500/20 group-hover:ring-red-500/50'
      }`} />
    </button>
  );
};

// ===== CLAMP UTILITY FUNCTION =====
const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// ===== HERO BACKGROUND COMPONENT =====
const HeroBackground = React.memo(({ 
  desktopImage, 
  mobileImage 
}: { 
  desktopImage: string; 
  mobileImage: string; 
}) => {
  const { scrollY } = useScroll();
  
  const y = useTransform(scrollY, (value) => {
    const clampedScroll = clamp(value, 0, 600);
    return (clampedScroll / 600) * 200;
  });
  
  const scale = useTransform(scrollY, (value) => {
    const clampedScroll = clamp(value, 0, 600);
    return 1 + (clampedScroll / 600) * 0.15;
  });

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
    className="inline-flex items-center gap-2 mb-4"
  >
    <div className="relative group cursor-default">
      <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-900 rounded-lg blur opacity-40 group-hover:opacity-75 transition duration-200" />
      <div className="relative px-4 py-1.5 bg-black rounded-lg border border-red-500/30 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-full w-full bg-red-500"></span>
        </span>
        <span className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-red-400 uppercase">
          {text}
        </span>
      </div>
    </div>
  </m.div>
));

HeroBadge.displayName = 'HeroBadge';

// ===== HEADLINE COMPONENT =====
const HeroHeadline = React.memo(({ line1, line2 }: { line1: string; line2: string }) => (
  <div className="relative mb-4 select-none">
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
    className="text-base sm:text-lg md:text-xl text-gray-300 max-w-[95%] sm:max-w-2xl mx-auto mb-6 font-mono"
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
      className="flex justify-center mb-6"
    >
      <div className="flex items-center gap-3 px-4 py-2 bg-white/5 backdrop-blur-md border-l-2 border-red-500 rounded-r-lg">
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <FaStar 
              key={i} 
              className={`text-xs ${i < Math.floor(rating) ? "text-red-500" : "text-gray-700"}`} 
            />
          ))}
        </div>
        <div className="h-4 w-[1px] bg-white/10" />
        <span className="text-xs font-mono text-gray-400">
          <span className="text-white font-bold">{totalUsers}</span> JOINED
        </span>
      </div>
    </m.div>
  );
});

HeroRating.displayName = 'HeroRating';

// ===== PAYMENT CTA BUTTONS COMPONENT =====
const PaymentCtaButtons = React.memo(({ 
  enrollmentStatus,
  onEnroll,
  onStartLearning,
  enrolling,
  regularPrice,
  salePrice,
  hasSale,
  saleEndsAt,
  onSecondaryClick,
  secondaryText,
  showSecondary
}: any) => {
  const shouldShowTimer = !enrollmentStatus?.enrolled && 
                          !enrollmentStatus?.isOwner && 
                          hasSale && 
                          saleEndsAt;

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 3 }}
      className="flex flex-col items-center gap-4 w-full max-w-2xl mx-auto px-4"
    >
      {/* Timer */}
      {shouldShowTimer && (
        <CountdownTimer endsAt={saleEndsAt} />
      )}

      {/* Payment Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
        {/* Primary Payment CTA */}
        {enrollmentStatus?.isOwner ? (
          <SpotlightButton onClick={() => {}}>
            <span className="flex items-center justify-center gap-2 text-white font-bold text-sm sm:text-base tracking-wide uppercase">
              <FaCheckCircle className="text-blue-500" />
              YOUR PROTOCOL
            </span>
          </SpotlightButton>
        ) : enrollmentStatus?.enrolled ? (
          <SpotlightButton onClick={onStartLearning}>
            <span className="flex items-center justify-center gap-2 text-white font-bold text-sm sm:text-base tracking-wide uppercase">
              <FaCheckCircle className="text-green-500" />
              CONTINUE TRAINING
            </span>
          </SpotlightButton>
        ) : (
          <SpotlightButton onClick={onEnroll} disabled={enrolling}>
            {enrolling ? (
              <span className="flex items-center justify-center gap-2 text-white font-bold text-sm sm:text-base tracking-wide uppercase">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                PROCESSING...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2 text-white font-bold text-sm sm:text-base tracking-wide uppercase whitespace-nowrap">
                <span>START AT</span>
                {hasSale ? (
                  <>
                    <span className="line-through opacity-70">
                      ${parseFloat(regularPrice).toFixed(0)}
                    </span>
                    <span className="text-yellow-300">
                      ${parseFloat(salePrice).toFixed(0)}
                    </span>
                  </>
                ) : (
                  <span>${parseFloat(regularPrice).toFixed(0)}</span>
                )}
                <FaFire className="text-red-500" />
              </span>
            )}
          </SpotlightButton>
        )}

        {/* Secondary CTA (Watch Video) */}
        {showSecondary && !enrollmentStatus?.enrolled && !enrollmentStatus?.isOwner && (
          <button
            onClick={onSecondaryClick}
            className="group relative w-full sm:w-auto px-6 py-2.5 sm:px-7 sm:py-3.5 text-gray-400 hover:text-white font-mono text-sm tracking-widest uppercase transition-all duration-300"
          >
            <span className="flex items-center justify-center gap-2.5">
              <span className="relative flex h-7 w-7 items-center justify-center rounded-full border border-gray-700 group-hover:border-white transition-colors">
                <FaPlayCircle className="text-xs" />
              </span>
              {secondaryText}
            </span>
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-red-500 group-hover:w-full transition-all duration-300" />
          </button>
        )}
      </div>
    </m.div>
  );
});

PaymentCtaButtons.displayName = 'PaymentCtaButtons';

// ===== TRUST BADGES COMPONENT =====
const HeroTrustBadges = React.memo(() => (
  <m.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.4, delay: 3.2 }}
    className="flex flex-wrap items-center justify-center gap-6 mt-8 opacity-60 hover:opacity-100 transition-opacity duration-300"
  >
    {[
      { icon: FaShieldAlt, text: "ENCRYPTED" },
      { icon: FaCheckCircle, text: "VERIFIED" },
      { icon: FaBolt, text: "LIFETIME" }
    ].map((item, i) => (
      <div key={i} className="flex items-center gap-2 text-[10px] sm:text-xs font-mono tracking-widest text-gray-500 uppercase">
        <item.icon className="text-red-900 text-xs" />
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
    className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 group"
    aria-label="Scroll to explore content"
  >
    <div className="h-10 w-[1px] bg-gradient-to-b from-transparent via-red-500 to-transparent" />
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
  secondaryCtaText = HERO_CONFIG.cta.secondary.text,
  videoUrl = HERO_VIDEO_URL,
  rating = HERO_CONFIG.stats.rating,
  totalUsers = HERO_CONFIG.stats.totalUsers,
  showVideoCta = true,
  className = "",
  
  // Payment integration props
  enrollmentStatus,
  onEnroll,
  onStartLearning,
  enrolling = false,
  regularPrice = "97.00",
  salePrice = null,
  hasSale = false,
  saleEndsAt = null,
}: HeroSectionProps) {
  const { isOpen, videoUrl: modalVideoUrl, openModal, closeModal } = useVideoModal();
  const scrollTo = useSmoothScroll();

  const handleSecondaryClick = () => videoUrl && openModal(videoUrl);
  const handleScrollClick = () => scrollTo("features");

  return (
    <>
      <section
        id="hero"
        className={`relative min-h-screen flex items-center justify-center overflow-hidden ${className}`}
        aria-label="Hero section"
      >
        {/* Background Layer */}
        <HeroBackground 
          desktopImage={backgroundDesktop} 
          mobileImage={backgroundMobile} 
        />

        <div className="relative z-10 w-full max-w-[95%] lg:max-w-7xl mx-auto px-4 text-center pt-20 pb-16">
           <div className="flex flex-col items-center justify-center">
              <HeroBadge text={badgeText} />
              <HeroHeadline line1={headlineLine1} line2={headlineLine2} />
              <HeroSubheadline text={subheadline} highlight={subheadlineHighlight} />
              <HeroRating rating={rating} totalUsers={totalUsers} />
              
              {/* Integrated Payment CTA Buttons */}
              <PaymentCtaButtons
                enrollmentStatus={enrollmentStatus}
                onEnroll={onEnroll}
                onStartLearning={onStartLearning}
                enrolling={enrolling}
                regularPrice={regularPrice}
                salePrice={salePrice}
                hasSale={hasSale}
                saleEndsAt={saleEndsAt}
                onSecondaryClick={handleSecondaryClick}
                secondaryText={secondaryCtaText}
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