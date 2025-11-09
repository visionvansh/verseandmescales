import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  FaCheckCircle,
  FaGraduationCap,
  FaMoneyBillWave,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaChartLine,
  FaSignInAlt,
  FaLightbulb,
  FaLock,
  FaRegClock,
  FaPhoneAlt,
  FaEnvelope,
  FaRocket,
  FaTrophy,
  FaUsers,
  FaVideo,
  FaCertificate,
  FaShieldAlt,
  FaGlobe,
  FaMobileAlt,
  FaHeadset,
  FaStar,
  FaArrowRight,
  FaArrowLeft,
  FaPlay,
  FaDollarSign,
  FaHandHoldingUsd,
  FaQuestionCircle,
  FaInstagram,
  FaLaptopCode,
  FaSearch,
  FaBolt,
  FaFire,
  FaChevronDown,
  FaChevronUp,
  FaBookOpen,
  FaClock,
  FaInfinity,
  FaQuoteLeft,
} from "react-icons/fa";

const MainContent = ({
  activeTestimonial,
  setActiveTestimonial,
  activeFaq,
  setActiveFaq,
  earningCalculator,
  setEarningCalculator,
  calculateEarnings,
  categories,
  featuredCourses,
  testimonials,
  stats,
  learningBenefits,
  instructorBenefits,
  creationSteps,
  faqs,
  successMetrics,
}) => {
  // Real-time counter states
  const [liveUsers, setLiveUsers] = useState(287);
  const [todayJoined, setTodayJoined] = useState(43);
  const [expandedCard, setExpandedCard] = useState(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Sample sales data for timeline
  const salesData = [
    {
      name: "Sarah M.",
      course: "Instagram Growth Mastery",
      price: 49.99,
      time: "Just now",
      country: "🇺🇸",
      impact: "Grew to 50K followers",
    },
    {
      name: "Ahmed K.",
      course: "Spiritual Healing & Peace",
      price: 29.99,
      time: "3m ago",
      country: "🇦🇪",
      impact: "Found inner peace",
    },
    {
      name: "Maria G.",
      course: "Business Scaling Blueprint",
      price: 89.99,
      time: "7m ago",
      country: "🇪🇸",
      impact: "Hit first $10K month",
    },
    {
      name: "David L.",
      course: "Content Creation Pro",
      price: 39.99,
      time: "12m ago",
      country: "🇬🇧",
      impact: "Landed $5K brand deal",
    },
    {
      name: "Yuki T.",
      course: "Passive Income Secrets",
      price: 59.99,
      time: "18m ago",
      country: "🇯🇵",
      impact: "Earning $3K/month",
    },
    {
      name: "Carlos R.",
      course: "TikTok Viral Formula",
      price: 44.99,
      time: "25m ago",
      country: "🇧🇷",
      impact: "Video hit 2M views",
    },
  ];

  const [currentSaleIndex, setCurrentSaleIndex] = useState(0);
  const [visibleSales, setVisibleSales] = useState(salesData.slice(0, 3));

  // Compact testimonials data
  const compactTestimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Instagram Coach",
      image: "/testimonials/sarah.jpg",
      rating: 5,
      text: "From 2K to 50K followers in 3 months. The strategies actually work!",
      metric: "$12K/mo",
      metricLabel: "Course Revenue",
    },
    {
      id: 2,
      name: "Ahmed Hassan",
      role: "Spiritual Guide",
      image: "/testimonials/ahmed.jpg",
      rating: 5,
      text: "Found my purpose and helped 5,000+ students find inner peace.",
      metric: "5,000+",
      metricLabel: "Students Impacted",
    },
    {
      id: 3,
      name: "Maria Garcia",
      role: "Business Consultant",
      image: "/testimonials/maria.jpg",
      rating: 5,
      text: "Built a 6-figure course business in under 6 months. Life-changing!",
      metric: "$150K",
      metricLabel: "Annual Revenue",
    },
    {
      id: 4,
      name: "David Chen",
      role: "Tech Instructor",
      image: "/testimonials/david.jpg",
      rating: 5,
      text: "Teaching coding changed my life. Now earning more than my day job.",
      metric: "$8K/mo",
      metricLabel: "Passive Income",
    },
  ];

  // Course cards data with detailed information
  const courseCards = [
    {
      id: 1,
      icon: FaInstagram,
      title: "Social Media Mastery",
      shortDesc: "Grow 10K+ followers, create viral content & monetize",
      gradient: "from-pink-900/40 to-purple-900/40",
      borderColor: "border-pink-500/30",
      hoverBorder: "hover:border-pink-500/60",
      iconGradient: "from-pink-600 to-purple-600",
      textColor: "text-pink-400",
      price: "$19.99",
      courses: "350+",
      checkColor: "text-pink-400",
      pulseColor: "bg-pink-400",
      features: ["Instagram & TikTok secrets"],
      detailedInfo: {
        duration: "8-12 weeks",
        level: "Beginner to Advanced",
        students: "45,000+",
        rating: 4.8,
        modules: [
          "Instagram Algorithm Mastery",
          "Viral Content Creation",
          "Monetization Strategies",
          "Brand Deal Negotiations",
          "Community Building",
        ],
        outcomes: [
          "Grow to 10K+ followers in 90 days",
          "Create content that gets 100K+ views",
          "Land your first $5K brand deal",
          "Build an engaged community",
        ],
        bonuses: [
          "Content Calendar Template",
          "Viral Caption Library",
          "DM Script Templates",
        ],
      },
    },
    {
      id: 2,
      icon: "🕊️",
      title: "Spiritual Healing",
      shortDesc: "Remove sins, strengthen faith & find inner peace",
      gradient: "from-indigo-900/40 to-blue-900/40",
      borderColor: "border-indigo-500/30",
      hoverBorder: "hover:border-indigo-500/60",
      iconGradient: "from-indigo-600 to-blue-600",
      textColor: "text-indigo-400",
      price: "$14.99",
      courses: "420+",
      checkColor: "text-indigo-400",
      pulseColor: "bg-indigo-400",
      features: ["Repentance & forgiveness"],
      detailedInfo: {
        duration: "Lifetime access",
        level: "All levels",
        students: "62,000+",
        rating: 4.9,
        modules: [
          "Understanding Sin & Repentance",
          "Daily Prayer Practices",
          "Quran Study & Reflection",
          "Spiritual Purification",
          "Finding Inner Peace",
        ],
        outcomes: [
          "Develop consistent prayer habits",
          "Find emotional healing",
          "Strengthen your faith",
          "Build spiritual resilience",
        ],
        bonuses: [
          "Daily Prayer Guide",
          "Dhikr Tracker",
          "Spiritual Journal Templates",
        ],
      },
    },
    {
      id: 3,
      icon: FaLaptopCode,
      title: "Master Any Skill",
      shortDesc: "12,000+ courses in 200+ categories to transform you",
      gradient: "from-cyan-900/40 to-blue-900/40",
      borderColor: "border-cyan-500/30",
      hoverBorder: "hover:border-cyan-500/60",
      iconGradient: "from-cyan-600 to-blue-600",
      textColor: "text-cyan-400",
      price: "$19.99",
      courses: "12,000+",
      checkColor: "text-cyan-400",
      pulseColor: "bg-cyan-400",
      features: ["Tech, Business, Design"],
      detailedInfo: {
        duration: "Self-paced",
        level: "All levels",
        students: "250,000+",
        rating: 4.7,
        modules: [
          "Web Development",
          "Digital Marketing",
          "Graphic Design",
          "Business Strategy",
          "Personal Development",
        ],
        outcomes: [
          "Master in-demand skills",
          "Build professional portfolio",
          "Increase earning potential",
          "Launch your career",
        ],
        bonuses: [
          "Industry certifications",
          "Career coaching",
          "Job placement support",
        ],
      },
    },
    {
      id: 4,
      icon: FaHandHoldingUsd,
      title: "Create & Earn",
      shortDesc: "Build courses, earn 97% revenue share passively",
      gradient: "from-green-900/40 to-emerald-900/40",
      borderColor: "border-green-500/30",
      hoverBorder: "hover:border-green-500/60",
      iconGradient: "from-green-600 to-emerald-600",
      textColor: "text-green-400",
      price: "97% Share",
      courses: "∞",
      checkColor: "text-green-400",
      pulseColor: "bg-green-400",
      features: ["Free to start"],
      detailedInfo: {
        duration: "Lifetime earnings",
        level: "Creator",
        students: "Your students",
        rating: 4.9,
        modules: [
          "Course Creation Mastery",
          "Marketing Your Course",
          "Student Engagement",
          "Scaling Your Income",
          "Advanced Monetization",
        ],
        outcomes: [
          "Create your first course",
          "Earn $3K+ monthly passive income",
          "Build your teaching brand",
          "Scale to $10K+ monthly",
        ],
        bonuses: [
          "Course Builder Tools",
          "Marketing Templates",
          "1-on-1 Launch Support",
        ],
      },
    },
  ];

  // Navigation functions
  const nextCard = () => {
    setActiveCardIndex((prev) => (prev + 1) % courseCards.length);
    setExpandedCard(null);
  };

  const prevCard = () => {
    setActiveCardIndex(
      (prev) => (prev - 1 + courseCards.length) % courseCards.length
    );
    setExpandedCard(null);
  };

  // Animate live counters
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveUsers((prev) => prev + Math.floor(Math.random() * 2));
      if (Math.random() > 0.8) {
        setTodayJoined((prev) => prev + 1);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Rotate sales timeline
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSaleIndex((prev) => (prev + 1) % salesData.length);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const newVisible = [];
    for (let i = 0; i < 3; i++) {
      newVisible.push(salesData[(currentSaleIndex + i) % salesData.length]);
    }
    setVisibleSales(newVisible);
  }, [currentSaleIndex]);

  return (
    <>
      {/* Hero Section */}
      <section className="relative z-10 w-full py-3 sm:py-4 md:py-6 lg:py-8 xl:py-8">
        <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <motion.div
            className="text-center w-full"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* 1. SOCIAL PROOF BADGE */}
            <motion.div
              className="flex justify-center mb-3 sm:mb-4 md:mb-5 lg:mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="bg-red-600/20 border border-red-500/30 text-red-400 px-3 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-2.5 lg:px-8 lg:py-3 rounded-full text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg font-medium inline-flex items-center gap-1.5 sm:gap-2 md:gap-3">
                <span className="text-base sm:text-lg md:text-xl lg:text-2xl">
                  🚀
                </span>
                <span className="whitespace-nowrap leading-none">
                  Join{" "}
                  <span className="hidden xs:inline">250,000+ Learners &</span>
                  <span className="xs:hidden">250K+ Learners</span>
                  <span className="hidden sm:inline"> 12,000+ Instructors</span>
                </span>
              </span>
            </motion.div>

            {/* 2. MAIN HEADLINE */}
            <h1 className="font-bold text-white mb-3 sm:mb-4 md:mb-5 lg:mb-7 px-2 sm:px-4 md:px-6 lg:px-8 leading-[1.1] sm:leading-[1.15] md:leading-[1.2] text-[28px] xs:text-[32px] sm:text-[40px] md:text-[48px] lg:text-[56px] xl:text-[64px] 2xl:text-[80px]">
              <span className="block mb-1 sm:mb-2 md:mb-3">
                Learn, Teach, and Earn
              </span>
              <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
                All in One Place
              </span>
            </h1>

            {/* 3. SUBHEADING */}
            <p className="text-gray-300 mb-5 sm:mb-7 md:mb-9 lg:mb-12 w-full max-w-[95%] xs:max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[75%] xl:max-w-[70%] 2xl:max-w-[65%] mx-auto px-3 sm:px-4 md:px-6 leading-relaxed text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">
              Grow your social media, cleanse your mindset, and master new
              skills through powerful courses. Build and monetize your Instagram
              pages — or create your own courses and start earning with{" "}
              <span className="text-red-400 font-semibold whitespace-nowrap">
                Verseandme Scales
              </span>
            </p>

            {/* 4. PRIMARY CTA BUTTONS */}
            <div className="flex justify-center mb-5 sm:mb-7 md:mb-9 lg:mb-11 px-3 sm:px-4 md:px-6">
              <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6 w-full max-w-[800px]">
                <motion.button
                  className="w-full xs:flex-1 xs:max-w-[360px] bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-lg sm:rounded-xl md:rounded-2xl hover:from-red-500 hover:to-red-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 mx-auto xs:mx-0 py-2.5 xs:py-3 sm:py-3.5 md:py-4 lg:py-5 px-4 xs:px-5 sm:px-6 md:px-8 lg:px-12 text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FaRocket className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl flex-shrink-0" />
                  <span className="whitespace-nowrap leading-none">
                    <span className="hidden sm:inline">
                      Start Earning Today - It's Free
                    </span>
                    <span className="sm:hidden">Start Earning - Free</span>
                  </span>
                </motion.button>

                <motion.button
                  className="w-full xs:flex-1 xs:max-w-[340px] bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 text-white font-medium rounded-lg sm:rounded-xl md:rounded-2xl hover:bg-gray-700/50 transition-all flex items-center justify-center gap-2 mx-auto xs:mx-0 py-2.5 xs:py-3 sm:py-3.5 md:py-4 lg:py-5 px-4 xs:px-5 sm:px-6 md:px-8 lg:px-12 text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FaPlay className="text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg flex-shrink-0" />
                  <span className="whitespace-nowrap leading-none">
                    <span className="hidden sm:inline">
                      Browse 12,000+ Courses
                    </span>
                    <span className="sm:hidden">Browse Courses</span>
                  </span>
                </motion.button>
              </div>
            </div>

            {/* 5. TRUST INDICATORS */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-5 lg:gap-7 px-3 sm:px-4 md:px-6 mb-6 sm:mb-8 md:mb-10 lg:mb-14 text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg text-gray-400 overflow-x-auto">
              <motion.div
                className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <FaCheckCircle className="text-green-500 flex-shrink-0 text-xs xs:text-sm sm:text-base md:text-lg" />
                <span>No credit card</span>
              </motion.div>
              <motion.div
                className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <FaCheckCircle className="text-green-500 flex-shrink-0 text-xs xs:text-sm sm:text-base md:text-lg" />
                <span>2hr setup</span>
              </motion.div>
              <motion.div
                className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
              >
                <FaCheckCircle className="text-green-500 flex-shrink-0 text-xs xs:text-sm sm:text-base md:text-lg" />
                <span>30-day money-back guarantee</span>
              </motion.div>
            </div>

            {/* 6. REAL-TIME ACTIVITY DASHBOARD */}
            <motion.div
              className="w-full mb-6 sm:mb-8 md:mb-10 lg:mb-14"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8">
                {/* Live User Counter */}
                <div className="bg-gradient-to-br from-red-900/30 via-red-800/20 to-black/40 backdrop-blur-xl border border-red-500/30 rounded-xl sm:rounded-2xl relative overflow-hidden p-3 xs:p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8 h-[240px] xs:h-[260px] sm:h-[280px] md:h-[320px] lg:h-[340px] xl:h-[360px]">
                  <div className="absolute top-0 right-0 w-20 h-20 xs:w-24 xs:h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-red-500/10 rounded-full blur-3xl" />

                  <div className="relative z-10 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-2 xs:mb-3 sm:mb-4 flex-shrink-0">
                      <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                        <motion.div
                          className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full"
                          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        <span className="text-green-400 font-semibold text-[10px] xs:text-xs sm:text-sm md:text-base">
                          LIVE NOW
                        </span>
                      </div>
                      <FaBolt className="text-yellow-400 text-base xs:text-lg sm:text-xl md:text-2xl" />
                    </div>

                    <div className="space-y-2 xs:space-y-3 sm:space-y-4 flex-1 min-h-0">
                      <div className="flex-shrink-0">
                        <div className="text-gray-400 mb-0.5 xs:mb-1 text-[10px] xs:text-xs sm:text-sm">
                          Active Learners Right Now
                        </div>
                        <motion.div
                          className="font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
                          key={liveUsers}
                          initial={{ opacity: 0.7 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.8 }}
                        >
                          {liveUsers.toLocaleString()}
                        </motion.div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 xs:gap-3 sm:gap-4 pt-2 xs:pt-3 sm:pt-4 border-t border-red-500/20 flex-shrink-0">
                        <div>
                          <div className="text-gray-400 mb-0.5 xs:mb-1 text-[10px] xs:text-xs sm:text-sm">
                            Joined Today
                          </div>
                          <motion.div
                            className="font-bold text-green-400 text-lg xs:text-xl sm:text-2xl md:text-3xl"
                            key={todayJoined}
                            initial={{ opacity: 0.7 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8 }}
                          >
                            +{todayJoined.toLocaleString()}
                          </motion.div>
                        </div>
                        <div>
                          <div className="text-gray-400 mb-0.5 xs:mb-1 text-[10px] xs:text-xs sm:text-sm">
                            Revenue Today
                          </div>
                          <div className="font-bold text-blue-400 text-lg xs:text-xl sm:text-2xl md:text-3xl">
                            ${((todayJoined * 38.5) / 1000).toFixed(1)}K
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center gap-1.5 xs:gap-2 pt-2 xs:pt-3 sm:pt-4 flex-shrink-0">
                      <div className="flex -space-x-1 xs:-space-x-1.5 sm:-space-x-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="rounded-full bg-gradient-to-br from-red-500 to-red-700 border-2 border-black flex items-center justify-center text-white font-bold w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[8px] xs:text-[10px] sm:text-xs"
                          >
                            {String.fromCharCode(65 + i)}
                          </div>
                        ))}
                      </div>
                      <span className="text-gray-400 line-clamp-1 text-[10px] xs:text-xs sm:text-sm">
                        +{Math.floor(Math.random() * 20 + 30)}{" "}
                        <span className="hidden xs:inline">people</span>{" "}
                        learning<span className="hidden xs:inline"> now</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Sales Timeline */}
                <div className="bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-black/40 backdrop-blur-xl border border-gray-700/30 rounded-xl sm:rounded-2xl relative overflow-hidden p-3 xs:p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8 h-[240px] xs:h-[260px] sm:h-[280px] md:h-[320px] lg:h-[340px] xl:h-[360px]">
                  <div className="absolute bottom-0 left-0 w-20 h-20 xs:w-24 xs:h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-green-500/10 rounded-full blur-3xl" />

                  <div className="relative z-10 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-2 xs:mb-3 sm:mb-4 flex-shrink-0">
                      <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                        <FaFire className="text-orange-500 text-base xs:text-lg sm:text-xl md:text-2xl" />
                        <span className="text-white font-semibold text-[10px] xs:text-xs sm:text-sm md:text-base">
                          <span className="hidden sm:inline">
                            Recent Life Changes
                          </span>
                          <span className="sm:hidden">Live Sales</span>
                        </span>
                      </div>
                      <span className="text-gray-400 bg-gray-800/50 px-1.5 xs:px-2 sm:px-3 py-0.5 xs:py-1 rounded-full whitespace-nowrap text-[9px] xs:text-[10px] sm:text-xs">
                        Real-time
                      </span>
                    </div>

                    <div className="flex-1 overflow-hidden min-h-0">
                      <div className="h-full flex flex-col justify-start">
                        <AnimatePresence mode="sync">
                          {visibleSales.map((sale, index) => (
                            <motion.div
                              key={`${sale.name}-${currentSaleIndex}-${index}`}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{
                                duration: 0.6,
                                delay: index * 0.15,
                                ease: "easeInOut",
                              }}
                              className="bg-black/40 backdrop-blur-sm border border-gray-700/30 rounded-lg sm:rounded-xl hover:border-green-500/30 transition-all mb-1.5 xs:mb-2 sm:mb-3 last:mb-0 p-2 xs:p-2.5 sm:p-3 flex-shrink-0"
                            >
                              <div className="flex items-start gap-1.5 xs:gap-2 sm:gap-3">
                                <div className="rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white font-bold flex-shrink-0 w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-[10px] xs:text-xs sm:text-sm">
                                  {sale.country}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-0.5 gap-1.5 xs:gap-2">
                                    <span className="text-white font-semibold truncate text-[10px] xs:text-xs sm:text-sm">
                                      {sale.name}
                                    </span>
                                    <span className="text-green-400 font-bold flex-shrink-0 text-[10px] xs:text-xs sm:text-sm">
                                      ${sale.price}
                                    </span>
                                  </div>
                                  <div className="text-gray-400 mb-0.5 truncate text-[9px] xs:text-[10px] sm:text-xs">
                                    {sale.course}
                                  </div>
                                  <div className="flex items-center justify-between gap-1.5 xs:gap-2">
                                    <span className="text-yellow-400 italic truncate text-[9px] xs:text-[10px] sm:text-xs">
                                      "{sale.impact}"
                                    </span>
                                    <span className="text-gray-500 flex-shrink-0 text-[8px] xs:text-[9px] sm:text-[10px]">
                                      {sale.time}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="mt-2 xs:mt-3 sm:mt-4 pt-2 xs:pt-3 sm:pt-4 border-t border-gray-700/30 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-[9px] xs:text-[10px] sm:text-xs">
                          <span className="hidden sm:inline">
                            Instructor Earnings (Last 24h)
                          </span>
                          <span className="sm:hidden">24h Earnings</span>
                        </span>
                        <motion.span
                          className="font-bold text-green-400 text-sm xs:text-base sm:text-lg md:text-xl"
                          animate={{ opacity: [1, 0.8, 1] }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          +\$8,430
                        </motion.span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 7. COURSE CATEGORIES HEADER */}
            <motion.div
              className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3 md:mb-4">
                Master Any Skill,{" "}
                <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
                  Transform Your Life
                </span>
              </h2>
              <p className="text-gray-300 text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl max-w-3xl mx-auto px-4">
                From social media mastery to spiritual growth - learn everything
                you need to succeed
              </p>
            </motion.div>

            {/* 8. DETAILED CATEGORY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-8 sm:mb-10 md:mb-12 lg:mb-16">
              {/* Social Media Growth */}
              <motion.div
                className="group bg-gradient-to-br from-pink-900/30 to-purple-900/30 backdrop-blur-sm border border-pink-700/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 hover:border-pink-500/50 transition-all hover:shadow-lg hover:shadow-pink-500/20"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -5 }}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-pink-600 to-purple-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <FaInstagram className="text-white text-xl sm:text-2xl" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 group-hover:text-pink-400 transition-colors">
                  Social Media Mastery
                </h3>
                <p className="text-gray-300 mb-3 sm:mb-4 text-xs sm:text-sm leading-relaxed">
                  Learn proven strategies to explode your follower count, create
                  viral content, and build an engaged community across all
                  platforms.
                </p>
                <ul className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                  <li className="flex items-start gap-2 text-gray-400 text-xs sm:text-sm">
                    <FaCheckCircle className="text-pink-500 flex-shrink-0 mt-0.5 text-xs" />
                    <span>Grow 10K+ followers in 90 days</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400 text-xs sm:text-sm">
                    <FaCheckCircle className="text-pink-500 flex-shrink-0 mt-0.5 text-xs" />
                    <span>Instagram & TikTok algorithms decoded</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400 text-xs sm:text-sm">
                    <FaCheckCircle className="text-pink-500 flex-shrink-0 mt-0.5 text-xs" />
                    <span>Content creation & viral hooks</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400 text-xs sm:text-sm">
                    <FaCheckCircle className="text-pink-500 flex-shrink-0 mt-0.5 text-xs" />
                    <span>Engagement & community building</span>
                  </li>
                </ul>
                <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-pink-700/30">
                  <span className="text-[10px] sm:text-xs text-gray-400">
                    350+ courses
                  </span>
                  <span className="text-pink-400 text-xs sm:text-sm font-semibold">
                    From \$19.99
                  </span>
                </div>
              </motion.div>

              {/* Monetization & Earning */}
              <motion.div
                className="group bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur-sm border border-green-700/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/20"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <FaDollarSign className="text-white text-xl sm:text-2xl" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 group-hover:text-green-400 transition-colors">
                  Monetization Strategies
                </h3>
                <p className="text-gray-300 mb-3 sm:mb-4 text-xs sm:text-sm leading-relaxed">
                  Turn your social media presence into a money-making machine.
                  Learn multiple income streams and passive revenue tactics.
                </p>
                <ul className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                  <li className="flex items-start gap-2 text-gray-400 text-xs sm:text-sm">
                    <FaCheckCircle className="text-green-500 flex-shrink-0 mt-0.5 text-xs" />
                    <span>Instagram monetization secrets</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400 text-xs sm:text-sm">
                    <FaCheckCircle className="text-green-500 flex-shrink-0 mt-0.5 text-xs" />
                    <span>Brand deals & sponsorships ($5K-$50K)</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400 text-xs sm:text-sm">
                    <FaCheckCircle className="text-green-500 flex-shrink-0 mt-0.5 text-xs" />
                    <span>Affiliate marketing mastery</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400 text-xs sm:text-sm">
                    <FaCheckCircle className="text-green-500 flex-shrink-0 mt-0.5 text-xs" />
                    <span>Digital products & courses</span>
                  </li>
                </ul>
                <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-green-700/30">
                  <span className="text-[10px] sm:text-xs text-gray-400">
                    280+ courses
                  </span>
                  <span className="text-green-400 text-xs sm:text-sm font-semibold">
                    From \$24.99
                  </span>
                </div>
              </motion.div>

              {/* Spiritual Growth & Wellness */}
              <motion.div
                className="group bg-gradient-to-br from-indigo-900/30 to-blue-900/30 backdrop-blur-sm border border-indigo-700/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 hover:border-indigo-500/50 transition-all hover:shadow-lg hover:shadow-indigo-500/20"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ y: -5 }}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-white text-xl sm:text-2xl">🕊️</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 group-hover:text-indigo-400 transition-colors">
                  Spiritual Growth & Faith
                </h3>
                <p className="text-gray-300 mb-3 sm:mb-4 text-xs sm:text-sm leading-relaxed">
                  Find inner peace, strengthen your faith, and learn powerful
                  spiritual practices for forgiveness, healing, and personal
                  transformation.
                </p>
                <ul className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                  <li className="flex items-start gap-2 text-gray-400 text-xs sm:text-sm">
                    <FaCheckCircle className="text-indigo-500 flex-shrink-0 mt-0.5 text-xs" />
                    <span>Repentance & sin removal practices</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400 text-xs sm:text-sm">
                    <FaCheckCircle className="text-indigo-500 flex-shrink-0 mt-0.5 text-xs" />
                    <span>Islamic studies & Quran recitation</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400 text-xs sm:text-sm">
                    <FaCheckCircle className="text-indigo-500 flex-shrink-0 mt-0.5 text-xs" />
                    <span>Prayer, meditation & mindfulness</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400 text-xs sm:text-sm">
                    <FaCheckCircle className="text-indigo-500 flex-shrink-0 mt-0.5 text-xs" />
                    <span>Spiritual healing & life purpose</span>
                  </li>
                </ul>
                <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-indigo-700/30">
                  <span className="text-[10px] sm:text-xs text-gray-400">
                    420+ courses
                  </span>
                  <span className="text-indigo-400 text-xs sm:text-sm font-semibold">
                    From \$14.99
                  </span>
                </div>
              </motion.div>

              {/* Business & Entrepreneurship */}
              <motion.div
                className="group bg-gradient-to-br from-orange-900/30 to-red-900/30 backdrop-blur-sm border border-orange-700/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/20"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileHover={{ y: -5 }}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <FaRocket className="text-white text-xl sm:text-2xl" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 group-hover:text-orange-400 transition-colors">
                  Business & Startups
                </h3>
                <p className="text-gray-300 mb-3 sm:mb-4 text-xs sm:text-sm leading-relaxed">
                  Launch and scale your business with expert guidance. From idea
                  validation to million-dollar exits.
                </p>
                <ul className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                  <li className="flex items-start gap-2 text-gray-400 text-xs sm:text-sm">
                    <FaCheckCircle className="text-orange-500 flex-shrink-0 mt-0.5 text-xs" />
                    <span>Start a business in 30 days</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400 text-xs sm:text-sm">
                    <FaCheckCircle className="text-orange-500 flex-shrink-0 mt-0.5 text-xs" />
                    <span>E-commerce & dropshipping</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400 text-xs sm:text-sm">
                    <FaCheckCircle className="text-orange-500 flex-shrink-0 mt-0.5 text-xs" />
                    <span>Digital marketing & sales funnels</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400 text-xs sm:text-sm">
                    <FaCheckCircle className="text-orange-500 flex-shrink-0 mt-0.5 text-xs" />
                    <span>Scaling to 6 & 7 figures</span>
                  </li>
                </ul>
                <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-orange-700/30">
                  <span className="text-[10px] sm:text-xs text-gray-400">
                    520+ courses
                  </span>
                  <span className="text-orange-400 text-xs sm:text-sm font-semibold">
                    From \$29.99
                  </span>
                </div>
              </motion.div>

              {/* Personal Development */}
              <motion.div
                className="group bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-sm border border-purple-700/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/20"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                whileHover={{ y: -5 }}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <FaStar className="text-white text-xl sm:text-2xl" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 group-hover:text-purple-400 transition-colors">
                  Personal Development
                </h3>
                <p className="text-gray-300 mb-3 sm:mb-4 text-xs sm:text-sm leading-relaxed">
                  Unlock your full potential with courses on productivity,
                  confidence, relationships, and mental wellness.
                </p>
                <ul className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                  <li className="flex items-start gap-2 text-gray-400 text-xs sm:text-sm">
                    <FaCheckCircle className="text-purple-500 flex-shrink-0 mt-0.5 text-xs" />
                    <span>Build unshakeable confidence</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400 text-xs sm:text-sm">
                    <FaCheckCircle className="text-purple-500 flex-shrink-0 mt-0.5 text-xs" />
                    <span>Productivity & time management</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400 text-xs sm:text-sm">
                    <FaCheckCircle className="text-purple-500 flex-shrink-0 mt-0.5 text-xs" />
                    <span>Communication & public speaking</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400 text-xs sm:text-sm">
                    <FaCheckCircle className="text-purple-500 flex-shrink-0 mt-0.5 text-xs" />
                    <span>Mental health & emotional wellness</span>
                  </li>
                </ul>
                <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-purple-700/30">
                  <span className="text-[10px] sm:text-xs text-gray-400">
                    680+ courses
                  </span>
                  <span className="text-purple-400 text-xs sm:text-sm font-semibold">
                    From \$19.99
                  </span>
                </div>
              </motion.div>

              {/* Tech & Creative Skills */}
              <motion.div
                className="group bg-gradient-to-br from-cyan-900/30 to-blue-900/30 backdrop-blur-sm border border-cyan-700/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/20"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                whileHover={{ y: -5 }}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <FaLaptopCode className="text-white text-xl sm:text-2xl" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 group-hover:text-cyan-400 transition-colors">
                  Tech & Creative Skills
                </h3>
                <p className="text-gray-300 mb-3 sm:mb-4 text-xs sm:text-sm leading-relaxed">
                  Master in-demand skills in programming, design, video editing,
                  and AI - become a digital creator or developer.
                </p>
                <ul className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                  <li className="flex items-start gap-2 text-gray-400 text-xs sm:text-sm">
                    <FaCheckCircle className="text-cyan-500 flex-shrink-0 mt-0.5 text-xs" />
                    <span>Web development & coding</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400 text-xs sm:text-sm">
                    <FaCheckCircle className="text-cyan-500 flex-shrink-0 mt-0.5 text-xs" />
                    <span>Graphic design & video editing</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400 text-xs sm:text-sm">
                    <FaCheckCircle className="text-cyan-500 flex-shrink-0 mt-0.5 text-xs" />
                    <span>AI tools & ChatGPT mastery</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400 text-xs sm:text-sm">
                    <FaCheckCircle className="text-cyan-500 flex-shrink-0 mt-0.5 text-xs" />
                    <span>Photography & content creation</span>
                  </li>
                </ul>
                <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-cyan-700/30">
                  <span className="text-[10px] sm:text-xs text-gray-400">
                    890+ courses
                  </span>
                  <span className="text-cyan-400 text-xs sm:text-sm font-semibold">
                    From \$22.99
                  </span>
                </div>
              </motion.div>
            </div>

            {/* 11. TWO PATHS TO SUCCESS SECTION */}
            <motion.div
              className="mb-8 sm:mb-10 md:mb-12 lg:mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              {/* Section Header */}
              <div className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-16">
                <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3 md:mb-4">
                  Two Paths to{" "}
                  <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
                    Success
                  </span>
                </h2>
                <p className="text-gray-300 text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl">
                  Whether you're teaching or learning, getting started is simple
                </p>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 xl:gap-16">
                {/* For Course Creators */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                >
                  <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 backdrop-blur-sm border border-red-700/30 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-7 lg:p-8 h-full">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-5 md:mb-6 flex items-center">
                      <FaChalkboardTeacher className="mr-2 sm:mr-3 text-red-500 text-xl sm:text-2xl flex-shrink-0" />
                      For Course Creators
                    </h3>
                    <div className="space-y-5 sm:space-y-6 md:space-y-8">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1">
                          <span className="font-bold text-white text-sm sm:text-base">
                            1
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">
                            Create Your Account
                          </h4>
                          <p className="text-gray-300 text-xs sm:text-sm mb-1 sm:mb-2">
                            Sign up in 2 minutes and complete your instructor
                            profile with your credentials and expertise.
                          </p>
                          <div className="text-xs sm:text-sm text-red-400 font-medium">
                            ✓ 100% free to start
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1">
                          <span className="font-bold text-white text-sm sm:text-base">
                            2
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">
                            Build Your Course
                          </h4>
                          <p className="text-gray-300 text-xs sm:text-sm mb-1 sm:mb-2">
                            Upload videos, create quizzes, and organize content
                            using our drag-and-drop builder. AI helps you
                            structure everything.
                          </p>
                          <div className="text-xs sm:text-sm text-red-400 font-medium">
                            ✓ Takes 1-2 weeks average
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1">
                          <span className="font-bold text-white text-sm sm:text-base">
                            3
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">
                            Publish & Get Paid
                          </h4>
                          <p className="text-gray-300 text-xs sm:text-sm mb-1 sm:mb-2">
                            Set your price, hit publish, and start earning. We
                            handle payments, hosting, and student management.
                          </p>
                          <div className="text-xs sm:text-sm text-red-400 font-medium">
                            ✓ Keep 97% of revenue
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1">
                          <span className="font-bold text-white text-sm sm:text-base">
                            4
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">
                            Scale Your Income
                          </h4>
                          <p className="text-gray-300 text-xs sm:text-sm mb-1 sm:mb-2">
                            Use our marketing tools, create more courses, and
                            build bundles. Many instructors earn $10K+ monthly
                            within 6 months.
                          </p>
                          <div className="text-xs sm:text-sm text-red-400 font-medium">
                            ✓ Passive income forever
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 sm:mt-7 md:mt-8 p-3 sm:p-4 bg-red-600/10 border border-red-500/20 rounded-lg sm:rounded-xl">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <FaTrophy className="text-yellow-400 text-xl sm:text-2xl flex-shrink-0" />
                        <div>
                          <div className="text-white font-semibold text-sm sm:text-base">
                            Success Guarantee
                          </div>
                          <div className="text-gray-400 text-xs sm:text-sm">
                            Our top instructors earn $50K-$200K/year
                          </div>
                        </div>
                      </div>
                    </div>

                    <motion.button
                      className="mt-5 sm:mt-6 bg-gradient-to-r from-red-600/90 to-red-700/90 text-white font-bold py-3 sm:py-4 px-5 sm:px-6 rounded-lg sm:rounded-xl hover:from-red-500 hover:to-red-600 transition-all w-full flex items-center justify-center gap-2 text-sm sm:text-base"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        boxShadow: "0 10px 25px rgba(220, 38, 38, 0.2)",
                      }}
                    >
                      <FaRocket className="text-sm sm:text-base" /> Become an
                      Instructor - It's Free
                    </motion.button>
                  </div>
                </motion.div>

                {/* For Learners */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                >
                  <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/30 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-7 lg:p-8 h-full">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-5 md:mb-6 flex items-center">
                      <FaUserGraduate className="mr-2 sm:mr-3 text-red-500 text-xl sm:text-2xl flex-shrink-0" />
                      <span>For Learners</span>
                    </h3>

                    <div className="space-y-5 sm:space-y-6 md:space-y-8">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1">
                          <span className="font-bold text-white text-sm sm:text-base">
                            1
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">
                            Find Your Course
                          </h4>
                          <p className="text-gray-300 text-xs sm:text-sm mb-1 sm:mb-2">
                            Browse 12,000+ courses, filter by skill level, read
                            reviews, and preview lessons before enrolling.
                          </p>
                          <div className="text-xs sm:text-sm text-green-400 font-medium">
                            ✓ 12,000+ courses to choose from
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1">
                          <span className="font-bold text-white text-sm sm:text-base">
                            2
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">
                            Learn at Your Pace
                          </h4>
                          <p className="text-gray-300 text-xs sm:text-sm mb-1 sm:mb-2">
                            Access course content instantly on any device.
                            Download lessons for offline learning. No deadlines
                            or pressure.
                          </p>
                          <div className="text-xs sm:text-sm text-green-400 font-medium">
                            ✓ Lifetime access included
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1">
                          <span className="font-bold text-white text-sm sm:text-base">
                            3
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">
                            Apply & Practice
                          </h4>
                          <p className="text-gray-300 text-xs sm:text-sm mb-1 sm:mb-2">
                            Complete hands-on projects, take quizzes, and build
                            portfolio pieces that demonstrate your new skills.
                          </p>
                          <div className="text-xs sm:text-sm text-green-400 font-medium">
                            ✓ Real-world projects included
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1">
                          <span className="font-bold text-white text-sm sm:text-base">
                            4
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">
                            Get Results
                          </h4>
                          <p className="text-gray-300 text-xs sm:text-sm mb-1 sm:mb-2">
                            Earn verified certificates, boost your income,
                            advance your career, or launch your side business.
                          </p>
                          <div className="text-xs sm:text-sm text-green-400 font-medium">
                            ✓ Avg +$12K income increase
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 sm:mt-7 md:mt-8 p-3 sm:p-4 bg-green-600/10 border border-green-500/20 rounded-lg sm:rounded-xl">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <FaShieldAlt className="text-green-400 text-xl sm:text-2xl flex-shrink-0" />
                        <div>
                          <div className="text-white font-semibold text-sm sm:text-base">
                            30-Day Money-Back Guarantee
                          </div>
                          <div className="text-gray-400 text-xs sm:text-sm">
                            Not satisfied? Full refund, no questions asked
                          </div>
                        </div>
                      </div>
                    </div>

                    <motion.button
                      className="mt-5 sm:mt-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 text-white font-medium py-3 sm:py-4 px-5 sm:px-6 rounded-lg sm:rounded-xl hover:bg-gray-700/50 hover:border-red-500/30 transition-all w-full flex items-center justify-center gap-2 text-sm sm:text-base"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <FaGraduationCap className="text-sm sm:text-base" /> Start
                      Learning Today
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* 12. COMPACT PROFESSIONAL TESTIMONIALS SECTION - NEW */}
            <motion.div
              className="mb-8 sm:mb-10 md:mb-12 lg:mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              {/* Section Header */}
              <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12">
                <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3 md:mb-4">
                  Trusted by{" "}
                  <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
                    Successful Creators and Learners
                  </span>
                </h2>
                <p className="text-gray-300 text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl">
                  Real people achieving extraordinary results
                </p>
              </div>

              {/* Testimonials Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                {compactTestimonials.map((testimonial, index) => (
                  <motion.div
                    key={testimonial.id}
                    className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm border border-gray-700/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 hover:border-red-500/30 transition-all group"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    {/* Quote Icon */}
                    <div className="mb-3 sm:mb-4">
                      <FaQuoteLeft className="text-red-500/30 text-xl sm:text-2xl group-hover:text-red-500/50 transition-colors" />
                    </div>

                    {/* Rating */}
                    <div className="flex gap-0.5 mb-2 sm:mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <FaStar
                          key={i}
                          className="text-yellow-400 text-xs sm:text-sm"
                        />
                      ))}
                    </div>

                    {/* Testimonial Text */}
                    <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 line-clamp-3">
                      "{testimonial.text}"
                    </p>

                    {/* Metric Badge */}
                    <div className="bg-red-600/10 border border-red-500/20 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                      <div className="text-red-400 font-bold text-base sm:text-lg md:text-xl">
                        {testimonial.metric}
                      </div>
                      <div className="text-gray-400 text-[10px] sm:text-xs">
                        {testimonial.metricLabel}
                      </div>
                    </div>

                    {/* Author Info */}
                    <div className="flex items-center gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-700/30">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold text-xs sm:text-sm truncate">
                          {testimonial.name}
                        </div>
                        <div className="text-gray-400 text-[10px] sm:text-xs truncate">
                          {testimonial.role}
                        </div>
                      </div>
                      <FaCheckCircle className="text-green-500 text-sm sm:text-base flex-shrink-0" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
};
export default MainContent;
