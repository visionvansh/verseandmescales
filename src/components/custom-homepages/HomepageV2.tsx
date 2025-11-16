// HomepageV2.tsx - CORRECTED VERSION

"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FaBook, FaStar, FaCheckCircle, FaDownload, FaHeart, FaLeaf, FaComments, FaPray, FaBible, FaChevronLeft, FaChevronRight, FaFire } from "react-icons/fa";
import { GiBread, GiWheat } from "react-icons/gi";

interface HomepageV2Props {
  courseData: any;
  enrollmentStatus: any;
  onEnroll: () => void;
  onStartLearning: () => void;
  enrolling: boolean;
}

// ===== HARDCODED MEDIA PATHS - EDIT THESE =====
const HERO_IMAGE = "/images/jesus-bread.jpg";
const HERO_VIDEO = "/videos/recipe-demo.mp4";
const BACKGROUND_JESUS_IMAGE_DESKTOP = "/jesus.jpeg";
const BACKGROUND_JESUS_IMAGE_MOBILE = "/jesus2.png";
// ==============================================

// ✅ OPTIMIZED: Countdown Timer Component
const CountdownTimer = React.memo(({ endsAt }: { endsAt: string }) => {
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

  const { totalMinutes, isUrgent, isCritical } = useMemo(() => {
    const total = timeLeft.hours * 60 + timeLeft.minutes;
    return {
      totalMinutes: total,
      isUrgent: total < 60,
      isCritical: total < 10
    };
  }, [timeLeft.hours, timeLeft.minutes]);

  if (timeLeft.expired) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="inline-flex items-center gap-2 sm:gap-2.5 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg"
    >
      <div className="flex items-center gap-1.5 sm:gap-2">
        <FaFire
          className={`text-lg sm:text-xl md:text-2xl ${
            isCritical
              ? "text-red-500 animate-pulse"
              : isUrgent
              ? "text-orange-500"
              : "text-orange-400"
          }`}
        />
        <span
          className={`text-sm sm:text-base md:text-lg font-bold uppercase tracking-wide ${
            isCritical
              ? "text-red-400"
              : isUrgent
              ? "text-orange-400"
              : "text-orange-300"
          }`}
        >
          Sale
        </span>
      </div>
      <span className="text-sm sm:text-base text-gray-400">•</span>
      <span
        className={`text-sm sm:text-base md:text-lg font-semibold tabular-nums ${
          isCritical
            ? "text-red-400 animate-pulse"
            : isUrgent
            ? "text-orange-400"
            : "text-orange-300"
        }`}
      >
        {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
      </span>
    </motion.div>
  );
});

CountdownTimer.displayName = 'CountdownTimer';

// ✅ OPTIMIZED: Reduced testimonials for better performance
const testimonials = [
  { text: "I honestly thought it was just another 'holy' marketing gimmick… until I tasted it. Now my breakfast feels like communion. 😂🍞", author: "Sarah M.", rating: 5 },
  { text: "This bread feels anointed. My stomach has peace, my heart has joy!", author: "Michael T.", rating: 5 },
  { text: "Tastes like grandma's kitchen met the Book of Ezekiel. Heavenly!", author: "Rebecca L.", rating: 5 },
  { text: "I prayed for daily bread… and God really delivered!", author: "James K.", rating: 5 },
  { text: "My doctor said my energy levels improved. I told him, 'It's biblical carbs, not worldly ones!' 🙌", author: "Linda R.", rating: 5 },
  { text: "Even my kids, who think anything healthy is 'from the devil,' love this bread!", author: "Patricia W.", rating: 5 },
  { text: "It's weirdly satisfying knowing I'm eating something straight from Scripture. Faith + Fiber = Blessing!", author: "David H.", rating: 5 },
  { text: "I used to eat bread with guilt. Now I eat with gratitude.", author: "Jennifer B.", rating: 5 },
  { text: "My husband said it tastes like a miracle in loaf form. I agree.", author: "Mary S.", rating: 5 },
  { text: "Never thought I'd say this — I feel closer to God after toast. 😂", author: "Thomas G.", rating: 5 },
  { text: "This is not just bread. It's devotion disguised as breakfast.", author: "Elizabeth P.", rating: 5 },
  { text: "I've stopped buying any other kind. This one has the 'bread of life' vibe.", author: "Daniel N.", rating: 5 },
  { text: "I shared it with my church group — now they think I'm the holy baker.", author: "Karen D.", rating: 5 },
  { text: "It's like God whispered a recipe and someone finally listened!", author: "Christopher J.", rating: 5 },
  { text: "My body said thank you. My soul said amen.", author: "Matthew V.", rating: 5 },
  { text: "After eating this, I'm convinced the manna in the desert tasted similar.", author: "Joshua M.", rating: 5 },
  { text: "This bread reminded me that food can be worship when made with purpose.", author: "Rachel E.", rating: 5 },
  { text: "Best decision I made this year! Biblical nutrition is real.", author: "Andrew W.", rating: 5 },
  { text: "My mornings start with Scripture and this bread. Perfect combo!", author: "Emily R.", rating: 5 },
  { text: "This recipe changed my relationship with food completely.", author: "Hannah K.", rating: 5 }
];

// ✅ OPTIMIZED: Testimonial Scroller with reduced animation complexity
const TestimonialScroller = React.memo(() => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationFrameId: number;
    let scrollAmount = 0;
    
    const scroll = () => {
      scrollAmount += 0.3;
      if (scrollAmount >= scrollContainer.scrollWidth / 2) {
        scrollAmount = 0;
      }
      scrollContainer.scrollLeft = scrollAmount;
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  const doubledTestimonials = useMemo(() => [...testimonials, ...testimonials], []);

  return (
    <div className="relative w-full overflow-hidden py-6 sm:py-8">
      <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
      
      <div 
        ref={scrollRef}
        className="flex gap-3 sm:gap-4 overflow-x-hidden"
        style={{ scrollBehavior: 'auto' }}
      >
        {doubledTestimonials.map((testimonial, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-72 xs:w-80 sm:w-96 bg-gradient-to-br from-gray-900/90 to-black/95 border border-amber-600/30 rounded-xl sm:rounded-2xl p-4 xs:p-5 sm:p-6 backdrop-blur-xl"
          >
            <div className="flex items-center gap-1 mb-2 sm:mb-3">
              {[...Array(testimonial.rating)].map((_, i) => (
                <FaStar key={i} className="text-yellow-400 text-xs sm:text-sm" />
              ))}
            </div>
            <p className="text-gray-300 text-xs xs:text-sm sm:text-base mb-3 sm:mb-4 line-clamp-4 leading-relaxed">
              "{testimonial.text}"
            </p>
            <p className="text-amber-400 font-bold text-xs xs:text-sm sm:text-base">
              — {testimonial.author}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
});

TestimonialScroller.displayName = 'TestimonialScroller';

// ✅ REMOVED: useEnrollmentStatus hook - will use prop instead

export default function HomepageV2({
  courseData,
  enrollmentStatus: propEnrollmentStatus,
  onEnroll,
  onStartLearning,
  enrolling,
}: HomepageV2Props) {
  // ✅ FIX: ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  
  // ✅ OPTIMIZED: Memoized pricing calculations
  const { regularPrice, salePrice, saleEndsAt, hasSale } = useMemo(() => {
    const regular = courseData?.price || courseData?.footerPrice || "9.99";
    const sale = courseData?.salePrice || courseData?.footerSalePrice || null;
    const endsAt = courseData?.saleEndsAt || null;
    
    const hasValidSale = sale && 
                    parseFloat(sale) > 0 && 
                    parseFloat(sale) < parseFloat(regular) &&
                    endsAt && 
                    new Date(endsAt) > new Date();

    return {
      regularPrice: regular,
      salePrice: sale,
      saleEndsAt: endsAt,
      hasSale: hasValidSale
    };
  }, [courseData]);

  // ✅ OPTIMIZED: Memoized timer visibility check
  const shouldShowTimer = useMemo(() => {
    return !propEnrollmentStatus?.enrolled && 
           !propEnrollmentStatus?.isOwner && 
           hasSale && 
           saleEndsAt;
  }, [propEnrollmentStatus?.enrolled, propEnrollmentStatus?.isOwner, hasSale, saleEndsAt]);

  // ✅ OPTIMIZED: Memoized feature items
  const featureItems = useMemo(() => [
    { icon: GiBread, title: "Complete Recipe", desc: "Step-by-step instructions with exact measurements from Ezekiel 4:9", color: "from-amber-600 to-orange-600" },
    { icon: FaHeart, title: "Health Benefits Guide", desc: "Nutritional breakdown and spiritual significance explained", color: "from-red-600 to-pink-600" },
    { icon: FaComments, title: "Private Community Access", desc: "Connect with fellow believers, share recipes, discuss faith & nutrition", color: "from-green-600 to-emerald-600", highlight: true }
  ], []);

  // ✅ NOW IT'S SAFE TO USE enrollmentStatus (all hooks are called above)
  const enrollmentStatus = propEnrollmentStatus;

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden bg-black">
      {/* ✅ HERO SECTION */}
      <section className="relative w-full min-h-screen flex items-center justify-center py-8 sm:py-12 md:py-16 lg:py-20">
        {/* ✅ Hero Background - Optimized with will-change */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* Mobile Background */}
          <div className="absolute inset-0 md:hidden flex items-center justify-center">
            <div 
              className="absolute inset-0 bg-no-repeat will-change-transform"
              style={{
                backgroundImage: `url(${BACKGROUND_JESUS_IMAGE_MOBILE})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                opacity: 0.85,
                minHeight: '100vh',
                width: '100%',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/90" />
          </div>
          
          {/* Desktop Background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full hidden md:block" style={{ paddingBottom: '56.25%' }}>
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
              style={{
                backgroundImage: `url(${BACKGROUND_JESUS_IMAGE_DESKTOP})`,
                opacity: 0.85,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/90" />
          </div>
          
          {/* Grid Pattern Overlay - Simplified */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(251, 191, 36, 0.4) 2px, transparent 2px),
                linear-gradient(90deg, rgba(251, 191, 36, 0.4) 2px, transparent 2px)
              `,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Badge - Reduced animation complexity */}
            <motion.div
              className="inline-block bg-gradient-to-r from-amber-900/30 to-amber-900/30 border border-amber-500/30 px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 rounded-full mb-4 sm:mb-5 md:mb-6 lg:mb-8 backdrop-blur-xl mt-13 md:mt-24 lg:mt-10 xl:mt-12"
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-amber-400 font-bold text-xs xs:text-sm sm:text-base md:text-lg flex items-center gap-1.5 sm:gap-2">
                <GiWheat className="text-base sm:text-lg flex-shrink-0" />
                <span className="whitespace-nowrap">EZEKIEL 4:9 - ANCIENT BIBLICAL WISDOM</span>
              </span>
            </motion.div>

            {/* Main Title */}
            <h1 className="text-[32px] xs:text-[36px] sm:text-[48px] md:text-[64px] lg:text-[80px] xl:text-[96px] 2xl:text-[112px] font-black leading-[1.1] mb-3 sm:mb-4 md:mb-6 lg:mb-8 px-2 sm:px-4">
              <div className="mb-1 sm:mb-2">
                <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent mr-1.5 sm:mr-2">
                  THE
                </span>
                <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent mr-1.5 sm:mr-2">
                  EZEKIEL
                </span>
                <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent mr-1.5 sm:mr-2">
                  BREAD
                </span>
              </div>
              <div className="mb-1 sm:mb-2">
                <span className="text-white mr-1.5 sm:mr-2">RECIPE</span>
                <span className="text-white mr-1.5 sm:mr-2">REVEALED</span>
              </div>
            </h1>

            {/* Scripture Quote Box */}
            <div className="max-w-3xl mx-auto mb-6 sm:mb-8 bg-amber-900/20 border-l-4 border-amber-600 p-4 xs:p-5 sm:p-6 rounded-lg backdrop-blur-sm mt-8">
              <p className="text-amber-400 font-bold text-xs xs:text-sm sm:text-base mb-2 flex items-center justify-center gap-2">
                <FaBible /> EZEKIEL 4:9
              </p>
              <p className="text-white text-sm xs:text-base sm:text-lg md:text-xl italic leading-relaxed">
                "And take thou unto thee wheat, and barley, and beans, and lentiles, and millet, and fitches, 
                and put them in one vessel, and make thee bread thereof..."
              </p>
            </div>

            {/* Video Section */}
            <motion.div
              className="max-w-5xl mx-auto mb-8 sm:mb-10 md:mb-12"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <div className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border border-amber-600/40 sm:border-2 sm:border-amber-600/50 rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 to-transparent pointer-events-none" />
                
                <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-black">
                  <video
                    src={HERO_VIDEO}
                    controls
                    poster={BACKGROUND_JESUS_IMAGE_DESKTOP}
                    className="absolute top-0 left-0 w-full h-full object-contain bg-black"
                    preload="metadata"
                    playsInline
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>

                {/* Video Stats Bar */}
                <div className="relative z-10 bg-gradient-to-r from-gray-900/95 to-black/95 border-t border-amber-500/20 px-3 py-2 xs:px-4 xs:py-3 sm:px-6 sm:py-4">
                  <div className="flex items-center justify-between gap-2 xs:gap-3 sm:gap-4 text-[10px] xs:text-xs sm:text-sm">
                    <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 text-gray-400">
                      <FaCheckCircle className="text-amber-400 flex-shrink-0" />
                      <span className="hidden xs:inline">2,847+ Believers</span>
                      <span className="xs:hidden">2.8K+</span>
                    </div>
                    <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 text-gray-400">
                      <FaStar className="text-amber-400 flex-shrink-0" />
                      <span>4.9/5 Rating</span>
                    </div>
                    <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 text-gray-400">
                      <FaBook className="text-amber-400 flex-shrink-0" />
                      <span className="hidden xs:inline">100% Biblical</span>
                      <span className="xs:hidden">Biblical</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ✅ TIMER ABOVE THE BUTTON */}
            {shouldShowTimer && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-4 sm:mb-6"
              >
                <div className="flex justify-center">
                  <CountdownTimer endsAt={saleEndsAt} />
                </div>
              </motion.div>
            )}

            {/* ✅ BIGGER MOBILE BUTTONS - ONE LINE, NO GLOW */}
            {enrollmentStatus?.isOwner ? (
              <button className="bg-gradient-to-r from-blue-600 to-blue-700 font-black py-5 xs:py-6 sm:py-7 md:py-8 lg:py-9 px-8 xs:px-10 sm:px-14 md:px-16 lg:px-20 rounded-xl sm:rounded-2xl text-base xs:text-lg sm:text-2xl md:text-3xl lg:text-4xl inline-flex items-center justify-center gap-2 xs:gap-2.5 sm:gap-3 text-white w-auto">
                <FaCheckCircle className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl flex-shrink-0" />
                <span className="whitespace-nowrap leading-none">YOUR RECIPE</span>
              </button>
            ) : enrollmentStatus?.enrolled ? (
              <motion.button 
                onClick={onStartLearning}
                className="bg-gradient-to-r from-green-600 to-green-700 font-black py-5 xs:py-6 sm:py-7 md:py-8 lg:py-9 px-8 xs:px-10 sm:px-14 md:px-16 lg:px-20 rounded-xl sm:rounded-2xl text-base xs:text-lg sm:text-2xl md:text-3xl lg:text-4xl inline-flex items-center justify-center gap-2 xs:gap-2.5 sm:gap-3 text-white w-auto"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <FaDownload className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl flex-shrink-0" />
                <span className="whitespace-nowrap leading-none">DOWNLOAD RECIPE</span>
              </motion.button>
            ) : (
              <motion.button 
                onClick={onEnroll}
                disabled={enrolling}
                className="bg-gradient-to-r from-amber-600 to-orange-600 font-black py-5 xs:py-6 sm:py-7 md:py-8 lg:py-9 px-6 xs:px-8 sm:px-12 md:px-14 lg:px-18 rounded-xl sm:rounded-2xl text-sm xs:text-base sm:text-xl md:text-2xl lg:text-3xl inline-flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-2.5 text-white w-auto"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                {enrolling ? (
                  <>
                    <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="whitespace-nowrap leading-none">PROCESSING...</span>
                  </>
                ) : (
                  <>
                    <GiBread className="text-xl xs:text-2xl sm:text-3xl md:text-4xl flex-shrink-0" />
                    <span className="whitespace-nowrap leading-none">GET RECIPE AT</span>
                    {hasSale ? (
                      <>
                        <span className="line-through opacity-70 whitespace-nowrap leading-none">
                          ${parseFloat(regularPrice).toFixed(0)}
                        </span>
                        <span className="font-black text-yellow-300 whitespace-nowrap leading-none">
                          ${parseFloat(salePrice).toFixed(0)}
                        </span>
                      </>
                    ) : (
                      <span className="font-black whitespace-nowrap leading-none">
                        ${parseFloat(regularPrice).toFixed(0)}
                      </span>
                    )}
                  </>
                )}
              </motion.button>
            )}

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 xs:gap-3 sm:gap-4 md:gap-6 mt-6 sm:mt-8 text-gray-400 text-[10px] xs:text-xs sm:text-sm md:text-base">
              <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                <FaCheckCircle className="text-green-400 flex-shrink-0" />
                <span>Instant PDF Download</span>
              </div>
              <span className="hidden xs:inline">•</span>
              <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                <FaHeart className="text-red-400 flex-shrink-0" />
                <span>100% Biblical</span>
              </div>
              <span className="hidden xs:inline">•</span>
              <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                <FaLeaf className="text-green-400 flex-shrink-0" />
                <span>All-Natural</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ✅ REST OF SECTIONS - keeping them exactly as they were */}
      <div className="relative">
        {/* Grid Background for Remaining Sections */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(251, 191, 36, 0.35) 1.5px, transparent 1.5px),
              linear-gradient(90deg, rgba(251, 191, 36, 0.35) 1.5px, transparent 1.5px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* KEY INFO SECTION */}
        <section className="relative w-full py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20">
          <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-amber-600/30 rounded-xl sm:rounded-2xl p-6 xs:p-8 sm:p-10 md:p-12 backdrop-blur-xl">
              <h2 className="text-[24px] xs:text-[28px] sm:text-[36px] md:text-[48px] font-black text-center leading-[1.1] mb-4 sm:mb-6">
                <span className="text-amber-400">Ancient Wisdom</span>
                <span className="text-white"> Meets Modern Science</span>
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 text-gray-300 text-sm xs:text-base sm:text-lg">
                <div>
                  <h3 className="text-amber-400 font-bold mb-2 flex items-center gap-2">
                    <FaBible /> Biblical Foundation
                  </h3>
                  <p className="leading-relaxed">
                    Rooted in <strong>Ezekiel 4:9</strong> — a sacred blend of grains and legumes that sustained prophets. 
                    This divine recipe nourishes both body and spirit.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-green-400 font-bold mb-2 flex items-center gap-2">
                    <FaLeaf /> Scientific Validation
                  </h3>
                  <p className="leading-relaxed">
                    Modern nutrition confirms: <strong>complete plant-based protein</strong>, rich in fiber, 
                    essential nutrients, and natural energy.
                  </p>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-amber-600/30 text-center">
                <p className="text-amber-400 font-black text-lg xs:text-xl sm:text-2xl italic">
                  "Taste the bread that sustained the prophets. Experience the nourishment heaven intended."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* WHAT YOU GET SECTION */}
        <section className="relative w-full py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20">
          <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <motion.div
              className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-[24px] xs:text-[28px] sm:text-[36px] md:text-[48px] lg:text-[56px] xl:text-[64px] font-black leading-[1.1] mb-2 sm:mb-3 md:mb-4 px-2 sm:px-4">
                <span className="text-white">What You'll </span>
                <span className="text-amber-400">Receive</span>
              </h2>
            </motion.div>
            
            {/* Mobile: Horizontal Scroll */}
            <div className="md:hidden relative">
              <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {featureItems.map((item, idx) => (
                  <div key={idx} className="min-w-[85vw] snap-center">
                    <div className={`bg-gradient-to-br from-gray-900/90 to-black/95 border ${item.highlight ? 'border-2 border-green-600/30' : 'border-amber-600/30'} rounded-xl sm:rounded-2xl p-4 xs:p-5 sm:p-6 backdrop-blur-xl text-center h-full`}>
                      <div className={`w-14 h-14 xs:w-16 xs:h-16 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
                        <item.icon className="text-3xl xs:text-4xl text-white" />
                      </div>
                      <h3 className="text-lg xs:text-xl font-black text-white mb-2 sm:mb-3">
                        {item.title}
                      </h3>
                      <p className="text-gray-300 text-xs xs:text-sm leading-relaxed">
                        {item.highlight ? (
                          <><strong className="text-green-400">{item.desc.split(',')[0]}</strong>{item.desc.substring(item.desc.indexOf(','))}</>
                        ) : item.desc}
                      </p>
                      {item.highlight && (
                        <div className="mt-3 pt-3 border-t border-green-600/30">
                          <p className="text-green-400 text-xs font-bold flex items-center justify-center gap-1">
                            <FaPray className="text-sm" /> Faith-Based Support Group
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-center gap-3 mt-4">
                <p className="text-gray-400 text-xs flex items-center gap-2">
                  <FaChevronLeft className="animate-pulse" />
                  Swipe to explore
                  <FaChevronRight className="animate-pulse" />
                </p>
              </div>
            </div>

            {/* Desktop: Grid */}
            <div className="hidden md:grid md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {featureItems.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.4 }}
                  whileHover={{ y: -8 }}
                  className={`bg-gradient-to-br from-gray-900/90 to-black/95 border ${item.highlight ? 'border-2 border-green-600/30' : 'border-amber-600/30'} rounded-xl sm:rounded-2xl p-4 xs:p-5 sm:p-6 md:p-8 backdrop-blur-xl text-center`}
                >
                  <div className={`w-14 h-14 xs:w-16 xs:h-16 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
                    <item.icon className="text-3xl xs:text-4xl text-white" />
                  </div>
                  <h3 className="text-lg xs:text-xl sm:text-2xl font-black text-white mb-2 sm:mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-300 text-xs xs:text-sm sm:text-base leading-relaxed">
                    {item.highlight ? (
                      <><strong className="text-green-400">{item.desc.split(',')[0]}</strong>{item.desc.substring(item.desc.indexOf(','))}</>
                    ) : item.desc}
                  </p>
                  {item.highlight && (
                    <div className="mt-3 pt-3 border-t border-green-600/30">
                      <p className="text-green-400 text-xs font-bold flex items-center justify-center gap-1">
                        <FaPray className="text-sm" /> Faith-Based Support Group
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
        <section className="relative w-full py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20 bg-gradient-to-b from-black via-amber-950/10 to-black">
          <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <motion.div
              className="text-center mb-6 sm:mb-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-[24px] xs:text-[28px] sm:text-[36px] md:text-[48px] lg:text-[56px] xl:text-[64px] font-black leading-[1.1] mb-2 px-2 sm:px-4">
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  REAL STORIES
                </span>
                <span className="text-white"> — REAL BLESSINGS</span>
              </h2>
              <p className="text-gray-400 text-xs xs:text-sm sm:text-base">
                Over 20+ believers sharing their transformation
              </p>
            </motion.div>
            <TestimonialScroller />
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="relative w-full py-8 sm:py-10 md:py-16 lg:py-20 xl:py-24 bg-gradient-to-b from-black via-amber-950/20 to-black">
          <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <motion.div
              className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border-2 border-amber-500/50 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] p-6 xs:p-8 sm:p-10 md:p-12 lg:p-16 xl:p-20 text-center overflow-hidden backdrop-blur-xl"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 to-transparent" />
              <div className="relative z-10">
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block mb-4 sm:mb-6 md:mb-8"
                >
                  <GiBread className="text-amber-400 text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl" />
                </motion.div>
                <h2 className="text-[24px] xs:text-[28px] sm:text-[36px] md:text-[48px] lg:text-[56px] xl:text-[64px] font-black text-white leading-[1.1] mb-3 sm:mb-4">
                  Start Your Sacred Journey Today
                </h2>
                <p className="text-gray-300 text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 md:mb-10 max-w-3xl mx-auto leading-relaxed">
                  Join thousands who discovered the transformative power of biblical nutrition + faithful community
                </p>
                
                {!enrollmentStatus?.enrolled && !enrollmentStatus?.isOwner && (
                  <>
                    {/* ✅ TIMER ABOVE FOOTER BUTTON */}
                    {shouldShowTimer && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mb-4 sm:mb-6"
                      >
                        <div className="flex justify-center">
                          <CountdownTimer endsAt={saleEndsAt} />
                        </div>
                      </motion.div>
                    )}

                    {/* ✅ BIGGER FOOTER BUTTON - ONE LINE, NO GLOW */}
                    <motion.button 
                      onClick={onEnroll}
                      disabled={enrolling}
                      className="bg-gradient-to-r from-amber-600 to-orange-600 font-black py-5 xs:py-6 sm:py-7 md:py-8 lg:py-9 px-6 xs:px-8 sm:px-12 md:px-14 lg:px-18 rounded-xl sm:rounded-2xl text-sm xs:text-base sm:text-xl md:text-2xl lg:text-3xl inline-flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-2.5 text-white w-auto"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      {enrolling ? (
                        <>
                          <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                          <span className="whitespace-nowrap">PROCESSING...</span>
                        </>
                      ) : (
                        <>
                          <GiBread className="text-xl xs:text-2xl sm:text-3xl md:text-4xl flex-shrink-0" />
                          <span className="whitespace-nowrap">GET ACCESS</span>
                          {hasSale ? (
                            <>
                              <span className="line-through opacity-70 whitespace-nowrap">
                                ${parseFloat(regularPrice).toFixed(0)}
                              </span>
                              <span className="font-black text-yellow-300 whitespace-nowrap">
                                ${parseFloat(salePrice).toFixed(0)}
                              </span>
                            </>
                          ) : (
                            <span className="font-black whitespace-nowrap">
                              ${parseFloat(regularPrice).toFixed(0)}
                            </span>
                          )}
                        </>
                      )}
                    </motion.button>
                  </>
                )}

                <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-2 xs:gap-3 sm:gap-4 text-gray-400 text-[10px] xs:text-xs sm:text-sm">
                  {[
                    { icon: FaCheckCircle, text: "Instant Download" },
                    { icon: FaCheckCircle, text: "Community Access" },
                    { icon: FaCheckCircle, text: "Lifetime Support" }
                  ].map((item, idx) => (
                    <React.Fragment key={idx}>
                      <div className="flex items-center gap-1 xs:gap-1.5">
                        <item.icon className="text-green-400 flex-shrink-0" />
                        <span>{item.text}</span>
                      </div>
                      {idx < 2 && <span className="hidden xs:inline">•</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}