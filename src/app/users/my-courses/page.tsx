'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
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
  FaChevronRight,
  FaChevronLeft,
  FaStar,
  FaBolt,
  FaTrophy,
  FaImage,
  FaPhotoVideo,
  FaDownload,
  FaQuestionCircle,
  FaComments,
  FaHeadset,
  FaInfinity,
  FaShieldAlt,
  FaArrowRight,
  FaArrowLeft,
} from 'react-icons/fa';
import { Spotlight } from "@/components/ui/Spotlight";

const InstagramCourseHomepage = () => {
  const [activeModule, setActiveModule] = useState<number | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeProofImage, setActiveProofImage] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeTransformationDay, setActiveTransformationDay] = useState(0);
  const [activeGuidanceStep, setActiveGuidanceStep] = useState(0);

  // Refs for horizontal scrolling
  const transformationScrollRef = useRef<HTMLDivElement>(null);
  const guidanceScrollRef = useRef<HTMLDivElement>(null);
  const beforeAfterScrollRef = useRef<HTMLDivElement>(null);

  // Fixed scroll function with proper type
  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = ref.current.clientWidth * 0.8;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Course Modules Data
  const courseModules = [
    {
      id: 1,
      title: "Foundation & Account Setup",
      icon: FaRocket,
      lessons: 8,
      duration: "2.5 hours",
      progress: 100,
      color: "from-red-600 to-red-700"
    },
    {
      id: 2,
      title: "Content Creation Mastery",
      icon: FaVideo,
      lessons: 12,
      duration: "4 hours",
      progress: 85,
      color: "from-red-500 to-red-600"
    },
    {
      id: 3,
      title: "Viral Growth Strategies",
      icon: FaFire,
      lessons: 10,
      duration: "3.5 hours",
      progress: 70,
      color: "from-red-600 to-red-700"
    },
    {
      id: 4,
      title: "Monetization Blueprint",
      icon: FaTrophy,
      lessons: 15,
      duration: "5 hours",
      progress: 60,
      color: "from-red-500 to-red-600"
    }
  ];

  // Video Testimonials Data
  const videoTestimonials = [
    {
      name: "Sarah Johnson",
      niche: "Fitness",
      followers: "125K",
      result: "\$8,500/mo",
      timeframe: "4 months",
      highlight: "I went from 0 to 125K followers and now make more than my corporate job!",
      videoLength: "3:45",
      thumbnail: "SJ"
    },
    {
      name: "Mike Chen",
      niche: "Finance",
      followers: "89K",
      result: "\$6,200/mo",
      timeframe: "3 months",
      highlight: "The monetization strategies are insane. I'm making money while I sleep!",
      videoLength: "2:30",
      thumbnail: "MC"
    },
    {
      name: "Emma Davis",
      niche: "Lifestyle",
      followers: "156K",
      result: "\$12,000/mo",
      timeframe: "5 months",
      highlight: "This course changed my life. I quit my 9-5 and now travel full-time!",
      videoLength: "4:15",
      thumbnail: "ED"
    }
  ];

  // Proof Gallery Data
  const proofGallery = [
    {
      title: "From 0 to 100K in 90 Days",
      description: "Complete beginner to viral success",
      category: "Growth Results"
    },
    {
      title: "$15K Month Revenue Screenshot",
      description: "Student's actual earnings dashboard",
      category: "Income Proof"
    },
    {
      title: "Viral Reel - 5.2M Views",
      description: "Using our proven content formula",
      category: "Viral Content"
    }
  ];

  // FAQs Data
  const faqs = [
    {
      id: 1,
      q: "Do I need any experience with Instagram or social media?",
      a: "Absolutely not! This course is designed for complete beginners. We start from the very basics and guide you step-by-step through everything you need to know."
    },
    {
      id: 2,
      q: "How much time do I need to invest daily?",
      a: "You can start with just 1-2 hours per day. As you grow, you can scale up your time investment. Many students see significant results working part-time while keeping their day jobs."
    },
    {
      id: 3,
      q: "What if I don't know what niche to choose?",
      a: "We have an entire module dedicated to helping you find the perfect niche based on your interests and market demand. Plus, our community and coaches will help guide you."
    },
    {
      id: 4,
      q: "Is there a money-back guarantee?",
      a: "Yes! We offer a 30-day money-back guarantee. If you're not satisfied with the course for any reason, just let us know and we'll refund you in full."
    },
    {
      id: 5,
      q: "Will this work in 2025 and beyond?",
      a: "Yes! Our strategies are based on fundamental principles of content and growth that remain effective regardless of algorithm changes. Plus, you get lifetime updates as we evolve with the platform."
    }
  ];

  // Personal Guidance Steps
  const guidanceSteps = [
    {
      icon: FaComments,
      title: "24/7 Live Support",
      description: "Get instant answers from our expert team and community members anytime you need help",
      color: "from-red-600 to-red-700"
    },
    {
      icon: FaHeadset,
      title: "1-on-1 Coaching Calls",
      description: "Schedule personalized strategy sessions with experienced coaches who've built successful pages",
      color: "from-red-500 to-red-600"
    },
    {
      icon: FaUsers,
      title: "Private Community Access",
      description: "Join 15,000+ active students sharing wins, strategies, and supporting each other daily",
      color: "from-red-600 to-red-700"
    },
    {
      icon: FaVideo,
      title: "Weekly Live Q&A Sessions",
      description: "Participate in group coaching calls where we answer questions and share latest strategies",
      color: "from-red-500 to-red-600"
    }
  ];

  // 90 Day Transformation Timeline
  const transformationTimeline = [
    {
      day: "Days 1-30",
      title: "Foundation Phase",
      description: "Set up your account, find your niche, create your first content pieces, and understand the algorithm",
      milestone: "First 1,000 Followers",
      icon: FaRocket,
      color: "from-red-600 to-red-700"
    },
    {
      day: "Days 31-60",
      title: "Growth Phase",
      description: "Implement viral content strategies, optimize posting schedule, engage with community, collaborate with others",
      milestone: "Reach 10,000+ Followers",
      icon: FaFire,
      color: "from-red-500 to-red-600"
    },
    {
      day: "Days 61-90",
      title: "Monetization Phase",
      description: "Launch your offers, set up affiliate partnerships, create sponsored content, build income streams",
      milestone: "First \$1,000+ Month",
      icon: FaTrophy,
      color: "from-red-600 to-red-700"
    }
  ];

  // Before vs After Comparison (Modified for mobile)
  const beforeAfterData = {
    before: {
      title: "BEFORE",
      items: {
        "Followers": "0-500",
        "Monthly Income": "\$0",
        "Content Quality": "Random & Inconsistent",
        "Engagement": "Poor (< 1%)",
        "Strategy": "Guessing & Hoping",
        "Growth": "Stuck & Frustrated"
      }
    },
    after: {
      title: "AFTER",
      items: {
        "Followers": "50K-200K+",
        "Monthly Income": "$5K-$20K+",
        "Content Quality": "Professional & Viral",
        "Engagement": "High (5-15%)",
        "Strategy": "Data-Driven System",
        "Growth": "Consistent & Scalable"
      }
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-black overflow-x-hidden">
      {/* Background Effects - Matching page.tsx */}
      <div className="absolute inset-0 z-0">
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
            backgroundSize: '60px 60px'
          }}
        />
        
        <motion.div 
          className="absolute inset-0 opacity-15"
          animate={{ opacity: [0.08, 0.22, 0.08] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 50, 50, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 50, 50, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '120px 120px'
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative w-full min-h-screen flex items-center justify-center py-8 sm:py-12 md:py-16 lg:py-20">
          <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Course Badge */}
              <motion.div
                className="inline-block bg-gradient-to-r from-red-900/30 to-red-900/30 border border-red-500/30 px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 rounded-full mb-4 sm:mb-5 md:mb-6 lg:mb-8 backdrop-blur-xl"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-red-400 font-bold text-xs xs:text-sm sm:text-base md:text-lg flex items-center gap-1.5 sm:gap-2">
                  <FaInstagram className="flex-shrink-0" /> <span className="whitespace-nowrap">INSTAGRAM GROWTH MASTERCLASS 2025</span>
                </span>
              </motion.div>

              {/* Main Headline */}
              <h1 className="text-[32px] xs:text-[36px] sm:text-[48px] md:text-[64px] lg:text-[80px] xl:text-[96px] 2xl:text-[112px] font-black text-white leading-[1.1] mb-3 sm:mb-4 md:mb-6 lg:mb-8 px-2 sm:px-4">
                BUILD A <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">FACELESS</span>
                <br />
                INSTAGRAM EMPIRE
              </h1>

              {/* Subheadline */}
              <p className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-300 mb-6 sm:mb-8 md:mb-10 lg:mb-12 max-w-4xl mx-auto leading-relaxed px-2 sm:px-4">
                Learn the exact system that helped <span className="text-red-400 font-bold">15,000+ students</span> grow from <span className="text-red-400 font-bold">0 to 100K+ followers</span> and earn <span className="text-red-400 font-bold">$5K-$20K/month</span> without showing their face
              </p>

              {/* NEW: 16:9 Video Section */}
              <motion.div
                className="max-w-5xl mx-auto mb-6 sm:mb-8 md:mb-10 lg:mb-12"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <div className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border-2 border-red-500/40 rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden backdrop-blur-xl shadow-[0_0_60px_rgba(239,68,68,0.3)]">
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent pointer-events-none" />
                  
                  {/* 16:9 Aspect Ratio Container */}
                  <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-black">
                    {/* Video Placeholder - Replace with your actual video component */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Play Button Overlay */}
                      <motion.div
                        className="relative z-10 cursor-pointer"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.6)]">
                          <FaPlay className="text-white text-2xl xs:text-3xl sm:text-4xl md:text-5xl ml-2" />
                        </div>
                      </motion.div>

                      {/* Video Info Overlay */}
                      <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
                        <div className="bg-black/80 backdrop-blur-md rounded-lg sm:rounded-xl p-3 sm:p-4 border border-red-500/30">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2">
                            <FaVideo className="text-red-400 text-lg sm:text-xl flex-shrink-0" />
                            <span className="text-white font-bold text-sm sm:text-base md:text-lg">Watch the Full Course Overview</span>
                          </div>
                          <p className="text-gray-300 text-xs sm:text-sm">See exactly what's inside and how it will transform your Instagram journey</p>
                        </div>
                      </div>

                      {/* Duration Badge */}
                      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
                        <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-red-500/30">
                          <span className="text-white font-bold text-xs sm:text-sm flex items-center gap-1.5">
                            <FaClock className="text-red-400" />
                            5:32
                          </span>
                        </div>
                      </div>

                      {/* Placeholder Text - Remove when adding real video */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                        <div className="bg-gray-900/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-700/50 mb-20">
                          <p className="text-gray-500 text-xs sm:text-sm">[Replace with your video embed or component]</p>
                        </div>
                      </div>
                    </div>

                    {/* You can replace the placeholder with an actual video embed like this: */}
                    {/* 
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                      title="Course Overview Video"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                    */}
                  </div>

                  {/* Video Stats Bar */}
                  <div className="relative z-10 bg-gradient-to-r from-gray-900/95 to-black/95 border-t border-red-500/20 px-4 py-3 sm:px-6 sm:py-4">
                    <div className="flex items-center justify-between gap-4 text-xs sm:text-sm">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-gray-400">
                        <FaCheckCircle className="text-red-400" />
                        <span>15,000+ Students</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-gray-400">
                        <FaStar className="text-red-400" />
                        <span>4.9/5 Rating</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-gray-400">
                        <FaTrophy className="text-red-400" />
                        <span className="hidden xs:inline">Proven Results</span>
                        <span className="xs:hidden">Results</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* CTA Button */}
              <motion.button
                className="bg-gradient-to-r from-red-600 to-red-700 text-white font-black py-4 xs:py-5 sm:py-6 md:py-7 lg:py-8 px-6 xs:px-8 sm:px-10 md:px-12 lg:px-16 rounded-xl sm:rounded-2xl text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl inline-flex items-center justify-center gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8 md:mb-10 lg:mb-12 shadow-[0_0_40px_rgba(239,68,68,0.4)] sm:shadow-[0_0_50px_rgba(239,68,68,0.5)] md:shadow-[0_0_60px_rgba(239,68,68,0.5)]"
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: "0 0 80px rgba(239,68,68,0.8)" 
                }}
                whileTap={{ scale: 0.98 }}
              >
                <FaRocket className="text-xl xs:text-2xl sm:text-3xl md:text-4xl flex-shrink-0" />
                <span className="whitespace-nowrap leading-none">START YOUR JOURNEY NOW</span>
              </motion.button>

              {/* Social Proof Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 xs:gap-4 sm:gap-5 md:gap-6 max-w-5xl mx-auto">
                {[
                  { icon: FaUsers, value: "15,000+", label: "Active Students" },
                  { icon: FaInstagram, value: "100K+", label: "Avg. Growth" },
                  { icon: FaTrophy, value: "$5K-20K", label: "Monthly Income" },
                  { icon: FaStar, value: "4.9/5", label: "Course Rating" }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-xl sm:rounded-2xl p-4 xs:p-5 sm:p-6 backdrop-blur-xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    whileHover={{ y: -5, borderColor: "rgba(239, 68, 68, 0.6)" }}
                  >
                    <stat.icon className="text-red-400 text-2xl xs:text-3xl sm:text-4xl mx-auto mb-2 sm:mb-3" />
                    <div className="text-xl xs:text-2xl sm:text-3xl font-black text-white mb-1">{stat.value}</div>
                    <div className="text-gray-400 text-xs xs:text-sm sm:text-base">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Get Personal Guidance Section - MOBILE OPTIMIZED WITH HORIZONTAL SCROLL */}
        <section className="relative w-full py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20">
          <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            
            <motion.div
              className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-[24px] xs:text-[28px] sm:text-[36px] md:text-[48px] lg:text-[56px] xl:text-[64px] 2xl:text-[72px] font-black text-white leading-[1.1] mb-2 sm:mb-3 md:mb-4 px-2 sm:px-4">
                GET <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">PERSONAL</span> GUIDANCE
              </h2>
              <p className="text-gray-300 text-sm xs:text-base sm:text-lg md:text-xl max-w-3xl mx-auto px-2">
                You're never alone on this journey. Get support every step of the way.
              </p>
            </motion.div>

            {/* Mobile: Horizontal Scroll Container */}
            <div className="md:hidden relative">
              <div 
                ref={guidanceScrollRef}
                className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {guidanceSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    className="min-w-[85vw] snap-center"
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border-2 border-red-500/40 rounded-2xl p-6 h-full backdrop-blur-xl overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent" />
                      
                      <div className="relative z-10">
                        {/* Icon */}
                        <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(239,68,68,0.4)]`}>
                          <step.icon className="text-white text-3xl" />
                        </div>

                        {/* Step Number */}
                        <div className="absolute top-4 right-4 text-6xl font-black text-red-400/20">
                          {String(index + 1).padStart(2, '0')}
                        </div>

                        {/* Content */}
                        <h3 className="text-2xl font-black text-white mb-3">{step.title}</h3>
                        <p className="text-gray-300 leading-relaxed text-base">{step.description}</p>

                        {/* Active indicator */}
                        <div className="mt-4 flex gap-1.5">
                          {guidanceSteps.map((_, i) => (
                            <div 
                              key={i} 
                              className={`h-1 rounded-full transition-all ${
                                i === index ? 'w-8 bg-red-500' : 'w-1 bg-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Scroll Indicators - Mobile */}
              <div className="flex justify-center gap-2 mt-4">
                <button
                  onClick={() => scrollContainer(guidanceScrollRef, 'left')}
                  className="bg-gray-900/50 border border-red-500/30 p-3 rounded-full text-white hover:bg-red-900/30 transition-colors"
                >
                  <FaChevronLeft />
                </button>
                <button
                  onClick={() => scrollContainer(guidanceScrollRef, 'right')}
                  className="bg-gray-900/50 border border-red-500/30 p-3 rounded-full text-white hover:bg-red-900/30 transition-colors"
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>

            {/* Desktop: Grid Layout */}
            <div className="hidden md:grid md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
              {guidanceSteps.map((step, index) => (
                <motion.div
                  key={index}
                  className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 backdrop-blur-xl overflow-hidden group"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  whileHover={{ y: -10, borderColor: "rgba(239, 68, 68, 0.6)" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative z-10">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r ${step.color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-5 shadow-[0_0_30px_rgba(239,68,68,0.3)]`}>
                      <step.icon className="text-white text-2xl sm:text-3xl" />
                    </div>

                    <div className="absolute top-4 right-4 text-6xl sm:text-7xl font-black text-red-400/10">
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-white mb-3">{step.title}</h3>
                    <p className="text-gray-300 leading-relaxed text-sm sm:text-base">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Before vs After Section - MOBILE OPTIMIZED WITH HORIZONTAL SWIPE */}
        <section className="relative w-full py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20 bg-gradient-to-b from-black via-red-950/10 to-black">
          <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            
            <motion.div
              className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-[24px] xs:text-[28px] sm:text-[36px] md:text-[48px] lg:text-[56px] xl:text-[64px] 2xl:text-[72px] font-black text-white leading-[1.1] mb-2 sm:mb-3 md:mb-4 px-2 sm:px-4">
                THE <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">TRANSFORMATION</span>
              </h2>
            </motion.div>

            {/* Mobile: Swipeable Comparison */}
            <div className="md:hidden">
              <div 
                ref={beforeAfterScrollRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {/* Before Card */}
                <motion.div
                  className="min-w-[85vw] snap-center"
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <div className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border-2 border-gray-600/50 rounded-2xl p-6 h-full backdrop-blur-xl">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gray-600"></div>
                    
                    <div className="text-center mb-6">
                      <div className="inline-block bg-gray-800/50 border border-gray-600/30 px-6 py-3 rounded-full mb-3">
                        <span className="text-gray-400 font-black text-2xl">{beforeAfterData.before.title}</span>
                      </div>
                      <div className="text-6xl mb-2">😔</div>
                      <p className="text-gray-500 text-sm">Your current situation...</p>
                    </div>

                    <div className="space-y-3">
                      {Object.entries(beforeAfterData.before.items).map(([key, value], index) => (
                        <motion.div
                          key={index}
                          className="flex justify-between items-center p-3 bg-gray-900/50 border border-gray-700/30 rounded-lg"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <span className="text-gray-400 font-medium text-sm">{key}:</span>
                          <span className="text-gray-500 font-bold text-sm">{value}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Arrow Indicator */}
                <div className="min-w-[10vw] snap-center flex items-center justify-center">
                  <div className="bg-gradient-to-r from-red-600 to-red-700 w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                    <FaArrowRight className="text-white text-xl" />
                  </div>
                </div>

                {/* After Card */}
                <motion.div
                  className="min-w-[85vw] snap-center"
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <div className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border-2 border-red-500/50 rounded-2xl p-6 h-full backdrop-blur-xl overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-red-700"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent"></div>
                    
                    <div className="relative z-10 text-center mb-6">
                      <div className="inline-block bg-gradient-to-r from-red-900/30 to-red-900/30 border border-red-500/30 px-6 py-3 rounded-full mb-3">
                        <span className="text-red-400 font-black text-2xl">{beforeAfterData.after.title}</span>
                      </div>
                      <div className="text-6xl mb-2">🚀</div>
                      <p className="text-red-400 text-sm font-bold">After taking the course!</p>
                    </div>

                    <div className="relative z-10 space-y-3">
                      {Object.entries(beforeAfterData.after.items).map(([key, value], index) => (
                        <motion.div
                          key={index}
                          className="flex justify-between items-center p-3 bg-red-900/20 border border-red-500/30 rounded-lg"
                          initial={{ opacity: 0, x: 20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <span className="text-gray-300 font-medium text-sm">{key}:</span>
                          <span className="text-red-400 font-bold text-sm">{value}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Swipe Hint */}
              <div className="text-center mt-4">
                <p className="text-gray-400 text-xs flex items-center justify-center gap-2">
                  <FaArrowLeft className="animate-pulse" />
                  Swipe to compare
                  <FaArrowRight className="animate-pulse" />
                </p>
              </div>
            </div>

            {/* Desktop: Side by Side */}
            <div className="hidden md:grid md:grid-cols-2 gap-4 sm:gap-6">
              {/* Before */}
              <motion.div
                className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border border-gray-600/50 rounded-xl sm:rounded-2xl p-6 sm:p-8 backdrop-blur-xl"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gray-600"></div>
                
                <div className="text-center mb-6 sm:mb-8">
                  <div className="inline-block bg-gray-800/50 border border-gray-600/30 px-4 py-2 sm:px-6 sm:py-3 rounded-full mb-4 sm:mb-6">
                    <span className="text-gray-400 font-black text-xl sm:text-2xl">{beforeAfterData.before.title}</span>
                  </div>
                  <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">😔</div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {Object.entries(beforeAfterData.before.items).map(([key, value], index) => (
                    <motion.div
                      key={index}
                      className="flex justify-between items-center p-3 sm:p-4 bg-gray-900/50 border border-gray-700/30 rounded-lg"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <span className="text-gray-400 font-medium text-sm sm:text-base">{key}:</span>
                      <span className="text-gray-500 font-bold text-sm sm:text-base">{value}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* After */}
              <motion.div
                className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/50 rounded-xl sm:rounded-2xl p-6 sm:p-8 backdrop-blur-xl overflow-hidden"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-red-700"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent"></div>
                
                <div className="relative z-10 text-center mb-6 sm:mb-8">
                  <div className="inline-block bg-gradient-to-r from-red-900/30 to-red-900/30 border border-red-500/30 px-4 py-2 sm:px-6 sm:py-3 rounded-full mb-4 sm:mb-6">
                    <span className="text-red-400 font-black text-xl sm:text-2xl">{beforeAfterData.after.title}</span>
                  </div>
                  <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">🚀</div>
                </div>

                <div className="relative z-10 space-y-3 sm:space-y-4">
                  {Object.entries(beforeAfterData.after.items).map(([key, value], index) => (
                    <motion.div
                      key={index}
                      className="flex justify-between items-center p-3 sm:p-4 bg-red-900/20 border border-red-500/30 rounded-lg"
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <span className="text-gray-300 font-medium text-sm sm:text-base">{key}:</span>
                      <span className="text-red-400 font-bold text-sm sm:text-base">{value}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 90 Day Transformation - WITH PROGRESS CONNECTORS ON DESKTOP */}
        <section className="relative w-full py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20">
          <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            
            <motion.div
              className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="inline-block bg-gradient-to-r from-red-900/30 to-red-900/30 border border-red-500/30 px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 rounded-full mb-3 sm:mb-4 md:mb-5 lg:mb-6 backdrop-blur-xl">
                <span className="text-red-400 font-bold text-xs xs:text-sm sm:text-base md:text-lg flex items-center gap-1.5 sm:gap-2">
                  <FaClock className="flex-shrink-0" /> <span className="whitespace-nowrap">YOUR 90-DAY ROADMAP TO SUCCESS</span>
                </span>
              </div>
              <h2 className="text-[24px] xs:text-[28px] sm:text-[36px] md:text-[48px] lg:text-[56px] xl:text-[64px] 2xl:text-[72px] font-black text-white leading-[1.1] mb-2 sm:mb-3 md:mb-4 px-2 sm:px-4">
                FROM ZERO TO <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">INSTAGRAM PRO</span>
              </h2>
            </motion.div>

            {/* Mobile: Horizontal Scrolling Timeline */}
            <div className="md:hidden">
              <div 
                ref={transformationScrollRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-6"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {transformationTimeline.map((phase, index) => (
                  <motion.div
                    key={index}
                    className="min-w-[85vw] snap-center"
                    initial={{ opacity: 0, x: 100 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <div className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border-2 border-red-500/40 rounded-2xl p-6 h-full backdrop-blur-xl overflow-hidden">
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent"></div>
                      
                      {/* Phase number */}
                      <div className="absolute top-4 right-4 text-7xl font-black text-red-400/20">
                        {String(index + 1).padStart(2, '0')}
                      </div>

                      <div className="relative z-10">
                        {/* Icon */}
                        <div className={`w-16 h-16 bg-gradient-to-r ${phase.color} rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(239,68,68,0.4)]`}>
                          <phase.icon className="text-white text-3xl" />
                        </div>

                        {/* Day Range */}
                        <div className="inline-block bg-red-900/20 border border-red-500/30 px-4 py-2 rounded-full mb-3">
                          <span className="text-red-400 font-bold text-sm">{phase.day}</span>
                        </div>

                        {/* Title */}
                        <h3 className="text-2xl font-black text-white mb-3">{phase.title}</h3>

                        {/* Description */}
                        <p className="text-gray-300 leading-relaxed mb-4 text-sm">{phase.description}</p>

                        {/* Milestone */}
                        <div className="bg-gradient-to-r from-red-600/20 to-red-700/20 border border-red-500/30 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <FaTrophy className="text-red-400 text-lg" />
                            <span className="text-red-400 font-bold text-xs uppercase tracking-wider">Milestone</span>
                          </div>
                          <p className="text-white font-black text-lg">{phase.milestone}</p>
                        </div>

                        {/* Progress dots */}
                        <div className="mt-4 flex gap-1.5 justify-center">
                          {transformationTimeline.map((_, i) => (
                            <div 
                              key={i} 
                              className={`h-1 rounded-full transition-all ${
                                i === index ? 'w-8 bg-red-500' : 'w-1 bg-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Navigation Arrows - Mobile */}
              <div className="flex justify-center gap-3 mt-6">
                <button
                  onClick={() => scrollContainer(transformationScrollRef, 'left')}
                  className="bg-gray-900/50 border border-red-500/30 p-3 rounded-full text-white hover:bg-red-900/30 transition-colors shadow-lg"
                >
                  <FaChevronLeft className="text-lg" />
                </button>
                <button
                  onClick={() => scrollContainer(transformationScrollRef, 'right')}
                  className="bg-gray-900/50 border border-red-500/30 p-3 rounded-full text-white hover:bg-red-900/30 transition-colors shadow-lg"
                >
                  <FaChevronRight className="text-lg" />
                </button>
              </div>

              {/* Swipe Hint */}
              <div className="text-center mt-4">
                <p className="text-gray-400 text-xs flex items-center justify-center gap-2">
                  <FaArrowLeft className="animate-pulse" />
                  Swipe through the timeline
                  <FaArrowRight className="animate-pulse" />
                </p>
              </div>
            </div>

            {/* Desktop: Grid Layout WITH PROGRESS CONNECTORS */}
            <div className="hidden md:block relative">
              {/* Progress Line Connectors - Desktop Only */}
              <div className="absolute top-24 left-0 right-0 h-1 flex items-center justify-center pointer-events-none z-0">
                <div className="w-[calc(100%-20%)] h-full relative">
                  {/* Base gray line */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/50 to-transparent"></div>
                  
                  {/* Animated progress line */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-red-600"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    style={{ transformOrigin: 'left' }}
                  />

                  {/* Animated dots on the line */}
                  {[0, 50, 100].map((position, idx) => (
                    <motion.div
                      key={idx}
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gradient-to-r from-red-600 to-red-700 shadow-[0_0_20px_rgba(239,68,68,0.6)]"
                      style={{ left: `${position}%` }}
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.5 + (idx * 0.3) }}
                    >
                      {/* Pulse animation */}
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
                  ))}
                </div>
              </div>

              {/* Phase Cards */}
              <div className="grid md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 relative z-10">
                {transformationTimeline.map((phase, index) => (
                  <motion.div
                    key={index}
                    className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 backdrop-blur-xl overflow-hidden group"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 }}
                    whileHover={{ y: -10, borderColor: "rgba(239, 68, 68, 0.6)" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="absolute top-4 right-4 text-6xl sm:text-7xl font-black text-red-400/20">
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    <div className="relative z-10">
                      <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r ${phase.color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-5 shadow-[0_0_30px_rgba(239,68,68,0.3)]`}>
                        <phase.icon className="text-white text-2xl sm:text-3xl" />
                      </div>

                      <div className="inline-block bg-red-900/20 border border-red-500/30 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-3 sm:mb-4">
                        <span className="text-red-400 font-bold text-xs sm:text-sm">{phase.day}</span>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-black text-white mb-3">{phase.title}</h3>
                      <p className="text-gray-300 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">{phase.description}</p>

                      <div className="bg-gradient-to-r from-red-600/20 to-red-700/20 border border-red-500/30 rounded-xl p-3 sm:p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <FaTrophy className="text-red-400" />
                          <span className="text-red-400 font-bold text-xs uppercase tracking-wider">Milestone</span>
                        </div>
                        <p className="text-white font-black text-base sm:text-lg">{phase.milestone}</p>
                      </div>
                    </div>

                    {/* Arrow connector visible on hover */}
                    {index < transformationTimeline.length - 1 && (
                      <motion.div
                        className="hidden lg:block absolute top-1/2 -right-8 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                        initial={{ x: -10 }}
                        whileInView={{ x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.8 + index * 0.2 }}
                      >
                        <FaArrowRight className="text-red-400 text-3xl drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Student Proof Gallery Section */}
        <section className="relative w-full py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20">
          <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            
            <motion.div
              className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="inline-block bg-gradient-to-r from-red-900/30 to-red-900/30 border border-red-500/30 px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 rounded-full mb-3 sm:mb-4 md:mb-5 lg:mb-6 backdrop-blur-xl">
                <span className="text-red-400 font-bold text-xs xs:text-sm sm:text-base md:text-lg flex items-center gap-1.5 sm:gap-2">
                  <FaCheckCircle className="flex-shrink-0" /> <span className="whitespace-nowrap">100% VERIFIED STUDENT SCREENSHOTS</span>
                </span>
              </div>
              <h2 className="text-[24px] xs:text-[28px] sm:text-[36px] md:text-[48px] lg:text-[56px] xl:text-[64px] 2xl:text-[72px] font-black text-white leading-[1.1] mb-2 sm:mb-3 md:mb-4 px-2 sm:4">
                REAL PROOF FROM <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">REAL STUDENTS</span>
              </h2>
            </motion.div>

            {/* Main Featured Proof */}
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
                  {/* Placeholder for actual image */}
                  <div className="text-center p-6 xs:p-8 sm:p-10 md:p-12 relative z-10">
                    <FaImage className="text-red-400 text-5xl xs:text-6xl sm:text-7xl md:text-8xl mx-auto mb-3 sm:mb-4 md:mb-5 lg:mb-6" />
                    <h3 className="text-xl xs:text-2xl sm:text-3xl font-black text-white mb-1 sm:mb-2">
                      {proofGallery[activeProofImage].title}
                    </h3>
                    <p className="text-gray-300 text-sm xs:text-base sm:text-lg md:text-xl mb-2 sm:mb-3 md:mb-4">
                      {proofGallery[activeProofImage].description}
                    </p>
                    <div className="inline-block bg-red-500/20 border border-red-500/40 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full">
                      <span className="text-red-400 font-bold flex items-center gap-1.5 sm:gap-2 text-xs xs:text-sm sm:text-base">
                        <FaCheckCircle /> Verified Proof
                      </span>
                    </div>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-2 xs:top-3 sm:top-4 left-2 xs:left-3 sm:left-4 bg-gradient-to-r from-red-600 to-red-700 px-2 py-1 xs:px-3 xs:py-1.5 sm:px-4 sm:py-2 rounded-full">
                    <span className="text-white font-bold text-[10px] xs:text-xs sm:text-sm">
                      {proofGallery[activeProofImage].category}
                    </span>
                  </div>

                  {/* Image placeholder text */}
                  <div className="absolute bottom-2 xs:bottom-3 sm:bottom-4 left-2 xs:left-3 sm:left-4 bg-black/80 px-2 py-1 xs:px-3 xs:py-1.5 sm:px-4 sm:py-2 rounded-full backdrop-blur-sm">
                    <span className="text-gray-400 text-[10px] xs:text-xs sm:text-sm flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                      <FaPhotoVideo /> [Your Proof Image #{activeProofImage + 1}]
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="p-3 xs:p-4 sm:p-5 md:p-6 border-t border-red-500/20 relative z-10">
                <div className="flex items-center justify-between gap-2 xs:gap-3 sm:gap-4">
                  <button
                    onClick={() => setActiveProofImage((prev) => (prev === 0 ? proofGallery.length - 1 : prev - 1))}
                    className="bg-gray-900/50 border border-red-500/30 px-3 py-2 xs:px-4 xs:py-2.5 sm:px-5 sm:py-3 md:px-6 rounded-lg sm:rounded-xl text-white font-bold hover:bg-red-900/30 transition-colors text-[10px] xs:text-xs sm:text-sm md:text-base whitespace-nowrap"
                  >
                    ← <span className="hidden xs:inline">Previous</span>
                  </button>
                  <div className="text-gray-400 text-[10px] xs:text-xs sm:text-sm">
                    {activeProofImage + 1} / {proofGallery.length}
                  </div>
                  <button
                    onClick={() => setActiveProofImage((prev) => (prev + 1) % proofGallery.length)}
                    className="bg-gray-900/50 border border-red-500/30 px-3 py-2 xs:px-4 xs:py-2.5 sm:px-5 sm:py-3 md:px-6 rounded-lg sm:rounded-xl text-white font-bold hover:bg-red-900/30 transition-colors text-[10px] xs:text-xs sm:text-sm md:text-base whitespace-nowrap"
                  >
                    <span className="hidden xs:inline">Next</span> →
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Download Section */}
            <motion.div
              className="mt-6 sm:mt-8 md:mt-10 lg:mt-12 text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="inline-block bg-gradient-to-r from-gray-900/90 to-black/95 border border-red-500/30 rounded-xl sm:rounded-2xl p-4 xs:p-5 sm:p-6 md:p-8 backdrop-blur-xl">
                <FaDownload className="text-red-400 text-3xl xs:text-4xl sm:text-5xl mx-auto mb-2 sm:mb-3 md:mb-4" />
                <h3 className="text-lg xs:text-xl sm:text-2xl font-black text-white mb-1 sm:mb-2">
                  Want To See More Proof?
                </h3>
                <p className="text-gray-300 mb-3 sm:mb-4 md:mb-6 text-xs xs:text-sm sm:text-base">
                  Download our complete proof package with 50+ verified student results
                </p>
                <button className="bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-2 xs:py-2.5 sm:py-3 px-4 xs:px-5 sm:px-6 md:px-8 rounded-lg sm:rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(239,68,68,0.3)] sm:shadow-[0_0_30px_rgba(239,68,68,0.3)] text-xs xs:text-sm sm:text-base">
                  Download Full Proof Pack (FREE)
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Visual Course Modules */}
        <section className="relative w-full py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20">
          <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            
            <motion.div
              className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-[24px] xs:text-[28px] sm:text-[36px] md:text-[48px] lg:text-[56px] xl:text-[64px] 2xl:text-[72px] font-black text-white leading-[1.1] mb-2 sm:mb-3 md:mb-4 px-2 sm:px-4">
                COMPLETE TRAINING <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">CURRICULUM</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-3 xs:gap-4 sm:gap-5 md:gap-6">
              {courseModules.map((module, index) => (
                <motion.div
                  key={module.id}
                  className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-xl sm:rounded-2xl p-4 xs:p-5 sm:p-6 md:p-8 backdrop-blur-xl overflow-hidden group"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  whileHover={{ y: -10, borderColor: "rgba(239, 68, 68, 0.6)" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative z-10">
                    {/* Module Icon */}
                    <div className={`w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 bg-gradient-to-r ${module.color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 md:mb-5 lg:mb-6 shadow-[0_0_30px_rgba(239,68,68,0.3)] sm:shadow-[0_0_40px_rgba(239,68,68,0.3)]`}>
                      <module.icon className="text-white text-xl xs:text-2xl sm:text-3xl" />
                    </div>

                    {/*Module Number */}
                    <div className="absolute top-2 xs:top-3 sm:top-4 right-2 xs:right-3 sm:right-4 text-5xl xs:text-6xl sm:text-7xl font-black text-red-400/10">
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    {/* Module Title */}
                    <h3 className="text-lg xs:text-xl sm:text-2xl font-black text-white mb-2 sm:mb-3 md:mb-4">{module.title}</h3>

                    {/* Module Stats */}
                    <div className="flex items-center gap-2 xs:gap-3 sm:gap-4 md:gap-5 mb-3 sm:mb-4 md:mb-5">
                      <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 text-gray-400 text-xs xs:text-sm sm:text-base">
                        <FaVideo />
                        <span>{module.lessons} Lessons</span>
                      </div>
                      <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 text-gray-400 text-xs xs:text-sm sm:text-base">
                        <FaClock />
                        <span>{module.duration}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative">
                      <div className="bg-gray-800 h-2 sm:h-3 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full bg-gradient-to-r ${module.color}`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${module.progress}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                      <div className="text-right mt-1 sm:mt-2">
                        <span className="text-red-400 font-bold text-xs xs:text-sm sm:text-base">{module.progress}% Covered</span>
                      </div>
                    </div>

                    {/* Expand Button */}
                    <button
                      onClick={() => setActiveModule(activeModule === module.id ? null : module.id)}
                      className="mt-3 sm:mt-4 md:mt-5 w-full bg-gray-900/50 border border-red-500/30 py-2 xs:py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-white font-bold hover:bg-red-900/30 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 text-xs xs:text-sm sm:text-base"
                    >
                      <span>View Module Details</span>
                      <FaChevronDown className={`transition-transform ${activeModule === module.id ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {activeModule === module.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 sm:mt-4 md:mt-5 pt-3 sm:pt-4 md:pt-5 border-t border-red-500/20"
                        >
                          <p className="text-gray-300 text-xs xs:text-sm sm:text-base leading-relaxed">
                            This module includes comprehensive video lessons, downloadable resources, and practical assignments to master {module.title.toLowerCase()}.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Student Video Stories Section - MOBILE FIXED */}
        <section className="relative w-full py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20 bg-gradient-to-b from-black via-red-950/10 to-black">
          <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            
            <motion.div
              className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="inline-block bg-gradient-to-r from-red-900/30 to-red-900/30 border border-red-500/30 px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 rounded-full mb-3 sm:mb-4 md:mb-5 lg:mb-6 backdrop-blur-xl">
                <span className="text-red-400 font-bold text-xs xs:text-sm sm:text-base md:text-lg flex items-center gap-1.5 sm:gap-2">
                  <FaVideo className="flex-shrink-0" /> <span className="whitespace-nowrap">STUDENT VIDEO TESTIMONIALS</span>
                </span>
              </div>
              <h2 className="text-[24px] xs:text-[28px] sm:text-[36px] md:text-[48px] lg:text-[56px] xl:text-[64px] 2xl:text-[72px] font-black text-white leading-[1.1] mb-2 sm:mb-3 md:mb-4 px-2 sm:px-4">
                HEAR IT FROM <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">OUR STUDENTS</span>
              </h2>
              <p className="text-gray-300 text-sm xs:text-base sm:text-lg md:text-xl max-w-3xl mx-auto px-2">
                Real people, real results. Watch our students share their success stories.
              </p>
            </motion.div>

            {/* Main Video Testimonial - FIXED MOBILE LAYOUT */}
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
                  {/* Video Container - FIXED FOR MOBILE */}
                  <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-black">
                    {/* Video Placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative z-10 text-center p-4">
                        <div className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-[0_0_40px_rgba(239,68,68,0.5)] cursor-pointer hover:scale-110 transition-transform">
                          <FaPlay className="text-white text-2xl xs:text-3xl sm:text-4xl md:text-5xl ml-1" />
                        </div>
                        <div className="bg-black/80 px-2 py-1 xs:px-3 xs:py-1.5 sm:px-4 sm:py-2 rounded-full inline-block backdrop-blur-sm">
                          <span className="text-white text-[10px] xs:text-xs sm:text-sm font-bold flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                            <FaVideo /> [Student Video {activeTestimonial + 1}] - {videoTestimonials[activeTestimonial].videoLength}
                          </span>
                        </div>
                      </div>

                      {/* Thumbnail Avatar */}
                      <div className="absolute top-2 xs:top-3 sm:top-4 left-2 xs:left-3 sm:left-4 w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center text-white font-black text-sm xs:text-base sm:text-lg md:text-xl border-2 xs:border-3 sm:border-4 border-white shadow-lg">
                        {videoTestimonials[activeTestimonial].thumbnail}
                      </div>
                    </div>
                  </div>

                  {/* Testimonial Info - POSITIONED BELOW VIDEO ON MOBILE */}
                  <div className="p-4 xs:p-5 sm:p-6 md:p-8 border-t border-red-500/20 bg-gradient-to-br from-gray-900/95 to-black">
                    {/* Student Info */}
                    <div className="mb-3 sm:mb-4">
                      <h3 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-black text-white mb-1">
                        {videoTestimonials[activeTestimonial].name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 sm:gap-3 text-xs xs:text-sm sm:text-base">
                        <span className="text-gray-400">{videoTestimonials[activeTestimonial].niche} Creator</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-red-400 font-bold">{videoTestimonials[activeTestimonial].followers} Followers</span>
                      </div>
                    </div>

                    {/* Results Grid */}
                    <div className="grid grid-cols-2 gap-2 xs:gap-3 sm:gap-4 mb-3 sm:mb-4 md:mb-5">
                      <div className="bg-gradient-to-br from-red-900/20 to-transparent border border-red-500/30 rounded-lg sm:rounded-xl p-2 xs:p-3 sm:p-4">
                        <div className="text-red-400 text-xs xs:text-sm mb-0.5 xs:mb-1">Monthly Income</div>
                        <div className="text-white font-black text-base xs:text-lg sm:text-xl md:text-2xl">
                          {videoTestimonials[activeTestimonial].result}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-red-900/20 to-transparent border border-red-500/30 rounded-lg sm:rounded-xl p-2 xs:p-3 sm:p-4">
                        <div className="text-red-400 text-xs xs:text-sm mb-0.5 xs:mb-1">Timeframe</div>
                        <div className="text-white font-black text-base xs:text-lg sm:text-xl md:text-2xl">
                          {videoTestimonials[activeTestimonial].timeframe}
                        </div>
                      </div>
                    </div>

                    {/* Highlight Quote */}
                    <div className="bg-gray-900/50 border border-red-500/20 rounded-lg sm:rounded-xl p-3 xs:p-4 sm:p-5 mb-4 sm:mb-5 md:mb-6">
                      <FaStar className="text-red-400 text-xl xs:text-2xl sm:text-3xl mb-2 sm:mb-3" />
                      <p className="text-gray-300 italic text-xs xs:text-sm sm:text-base md:text-lg leading-relaxed">
                        "{videoTestimonials[activeTestimonial].highlight}"
                      </p>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between gap-2 xs:gap-3 sm:gap-4">
                      <button
                        onClick={() => setActiveTestimonial((prev) => (prev === 0 ? videoTestimonials.length - 1 : prev - 1))}
                        className="bg-gray-900/50 border border-red-500/30 px-3 py-2 xs:px-4 xs:py-2.5 sm:px-5 sm:py-3 md:px-6 rounded-lg sm:rounded-xl text-white font-bold hover:bg-red-900/30 transition-colors text-[10px] xs:text-xs sm:text-sm md:text-base flex items-center gap-1 xs:gap-1.5 sm:gap-2"
                      >
                        <FaChevronLeft />
                        <span className="hidden xs:inline">Previous</span>
                      </button>
                      
                      <div className="flex gap-1 xs:gap-1.5 sm:gap-2">
                        {videoTestimonials.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setActiveTestimonial(index)}
                            className={`h-1.5 xs:h-2 sm:h-2.5 rounded-full transition-all ${
                              index === activeTestimonial 
                                ? 'w-6 xs:w-8 sm:w-10 bg-red-500' 
                                : 'w-1.5 xs:w-2 sm:w-2.5 bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>

                      <button
                        onClick={() => setActiveTestimonial((prev) => (prev + 1) % videoTestimonials.length)}
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
                    <div className="text-white font-black text-base xs:text-lg sm:text-xl md:text-2xl">1,200+ Video Reviews</div>
                    <div className="text-gray-400 text-[10px] xs:text-xs sm:text-sm">From verified students worldwide</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="relative w-full py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20">
          <div className="w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            
            <motion.div
              className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="inline-block bg-gradient-to-r from-red-900/30 to-red-900/30 border border-red-500/30 px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 rounded-full mb-3 sm:mb-4 md:mb-5 lg:mb-6 backdrop-blur-xl">
                <span className="text-red-400 font-bold text-xs xs:text-sm sm:text-base md:text-lg flex items-center gap-1.5 sm:gap-2">
                  <FaQuestionCircle className="flex-shrink-0" /> <span className="whitespace-nowrap">FREQUENTLY ASKED QUESTIONS</span>
                </span>
              </div>
              <h2 className="text-[24px] xs:text-[28px] sm:text-[36px] md:text-[48px] lg:text-[56px] xl:text-[64px] 2xl:text-[72px] font-black text-white leading-[1.1] mb-2 sm:mb-3 md:mb-4 px-2 sm:px-4">
                GOT <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">QUESTIONS?</span>
              </h2>
            </motion.div>

            <div className="max-w-4xl mx-auto space-y-3 xs:space-y-4 sm:space-y-5">
              {faqs.map((faq) => (
                <motion.div
                  key={faq.id}
                  className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-xl"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: faq.id * 0.1 }}
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === faq.id ? null : faq.id)}
                    className="w-full text-left p-4 xs:p-5 sm:p-6 flex items-start justify-between gap-2 xs:gap-3 sm:gap-4 hover:bg-red-900/10 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="text-base xs:text-lg sm:text-xl font-black text-white pr-2">
                        {faq.q}
                      </h3>
                    </div>
                    <div className={`flex-shrink-0 w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center transition-transform ${
                      activeFaq === faq.id ? 'rotate-180' : ''
                    }`}>
                      <FaChevronDown className="text-white text-xs xs:text-sm sm:text-base" />
                    </div>
                  </button>

                  <AnimatePresence>
                    {activeFaq === faq.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-red-500/20"
                      >
                        <div className="p-4 xs:p-5 sm:p-6 bg-red-900/5">
                          <p className="text-gray-300 leading-relaxed text-sm xs:text-base sm:text-lg">
                            {faq.a}
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

        {/* Final CTA Section */}
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
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-block mb-4 sm:mb-6 md:mb-8"
                >
                  <FaBolt className="text-red-400 text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl" />
                </motion.div>

                <h2 className="text-[24px] xs:text-[28px] sm:text-[36px] md:text-[48px] lg:text-[56px] xl:text-[64px] 2xl:text-[72px] font-black text-white leading-[1.1] mb-3 sm:mb-4 md:mb-6">
                  READY TO START YOUR<br />
                  <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">INSTAGRAM EMPIRE?</span>
                </h2>

                <p className="text-gray-300 text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 md:mb-10 lg:mb-12 max-w-3xl mx-auto leading-relaxed">
                  Join 15,000+ students who transformed their lives with Instagram. Start your journey to financial freedom today!
                </p>

                <div className="space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6">
                  <motion.button
                    className="bg-gradient-to-r from-red-600 to-red-700 text-white font-black py-4 xs:py-5 sm:py-6 md:py-7 lg:py-8 px-6 xs:px-8 sm:px-10 md:px-12 lg:px-16 rounded-xl sm:rounded-2xl text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl inline-flex items-center justify-center gap-2 sm:gap-3 md:gap-4 shadow-[0_0_40px_rgba(239,68,68,0.5)] sm:shadow-[0_0_60px_rgba(239,68,68,0.6)]"
                    whileHover={{ 
                      scale: 1.05, 
                      boxShadow: "0 0 80px rgba(239,68,68,0.8)" 
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FaRocket className="text-xl xs:text-2xl sm:text-3xl md:text-4xl flex-shrink-0" />
                    <span className="whitespace-nowrap leading-none">ENROLL NOW</span>
                  </motion.button>

                  <div className="flex flex-wrap items-center justify-center gap-2 xs:gap-3 sm:gap-4 md:gap-6 text-gray-400 text-[10px] xs:text-xs sm:text-sm md:text-base">
                    <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                      <FaShieldAlt className="text-red-400" />
                      <span>30-Day Money-Back Guarantee</span>
                    </div>
                    <span className="hidden xs:inline">•</span>
                    <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                      <FaInfinity className="text-red-400" />
                      <span>Lifetime Access</span>
                    </div>
                    <span className="hidden xs:inline">•</span>
                    <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                      <FaStar className="text-red-400" />
                      <span>Premium Support</span>
                    </div>
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

export default InstagramCourseHomepage;