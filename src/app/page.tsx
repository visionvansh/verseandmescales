"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaCheckCircle, FaGraduationCap, FaMoneyBillWave, FaUserGraduate, 
         FaChalkboardTeacher, FaChartLine, FaSignInAlt, FaLightbulb, 
         FaLock, FaRegClock, FaPhoneAlt, FaEnvelope, FaRocket, FaTrophy,
         FaUsers, FaVideo, FaCertificate, FaShieldAlt, FaGlobe, FaMobileAlt,
         FaHeadset, FaStar, FaArrowRight, FaPlay, FaDollarSign, FaHandHoldingUsd, 
         FaQuestionCircle, FaInstagram, FaLaptopCode, FaSearch, FaUserCircle, 
         FaSignOutAlt} from "react-icons/fa";
import { Spotlight } from "@/components/ui/Spotlight";
import Image from "next/image";
import MainContent from "@/components/MainContent";
import Footer from "@/components/Footer";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [earningCalculator, setEarningCalculator] = useState({
    students: 100,
    coursePrice: 49,
  });
  const router = useRouter();
  
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Testimonial auto-rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandOpen(true);
      }
      if (e.key === "Escape") {
        setIsCommandOpen(false);
        setSearchQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Calculate potential earnings
  const calculateEarnings = () => {
    const monthly = earningCalculator.students * earningCalculator.coursePrice;
    const commission = monthly * 0.95; // 5% platform fee
    const yearly = commission * 12;
    return { monthly: commission, yearly };
  };

  // Course categories
  const categories = [
    { icon: "💰", title: "Financial Growth", count: 127, color: "from-green-500 to-emerald-600" },
    { icon: "📱", title: "Social Media Mastery", count: 94, color: "from-pink-500 to-rose-600" },
    { icon: "💻", title: "Digital Marketing", count: 86, color: "from-blue-500 to-cyan-600" },
    { icon: "🔥", title: "Trending Skills", count: 152, color: "from-orange-500 to-red-600" },
    { icon: "📈", title: "Business & Entrepreneurship", count: 110, color: "from-purple-500 to-indigo-600" },
    { icon: "🧠", title: "Personal Development", count: 78, color: "from-yellow-500 to-amber-600" },
  ];

  // Sample featured courses
  const featuredCourses = [
    {
      id: 1,
      title: "Advanced Social Media Strategy",
      instructor: "Emily Rodriguez",
      rating: 4.9,
      students: 15892,
      price: 129.99,
      image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=300&h=200&auto=format&fit=crop",
      category: "Social Media",
      duration: "12 hours",
      lessons: 45,
    },
    {
      id: 2,
      title: "Financial Freedom Blueprint",
      instructor: "Michael Chen",
      rating: 4.8,
      students: 12458,
      price: 149.99,
      image: "https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?q=80&w=300&h=200&auto=format&fit=crop",
      category: "Finance",
      duration: "18 hours",
      lessons: 62,
    },
    {
      id: 3,
      title: "Content Creation Masterclass",
      instructor: "Sarah Johnson",
      rating: 4.7,
      students: 9874,
      price: 99.99,
      image: "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?q=80&w=300&h=200&auto=format&fit=crop",
      category: "Content Creation",
      duration: "10 hours",
      lessons: 38,
    },
  ];

  // Testimonials
  const testimonials = [
    {
      id: 1,
      name: "Alex Thompson",
      role: "Content Creator",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      text: "After listing my course on Verseandme, my monthly income tripled! The platform made it incredibly easy to reach thousands of students who were eager to learn. I went from \$2K to \$6K per month in just 3 months!",
      earning: "\$6,000/mo",
      students: 423,
    },
    {
      id: 2,
      name: "Jessica Wu",
      role: "Social Media Influencer",
      image: "https://randomuser.me/api/portraits/women/44.jpg",
      text: "I took three courses on social media optimization and within two months my follower count went from 2K to over 50K. The quality of courses here is unmatched! My engagement rate increased by 400% and I landed 5 brand deals.",
      coursesCompleted: 8,
      followerGrowth: "2,500%",
    },
    {
      id: 3,
      name: "Marcus Johnson",
      role: "Digital Entrepreneur",
      image: "https://randomuser.me/api/portraits/men/22.jpg",
      text: "Both teaching and learning on Verseandme has transformed my business. I now have multiple income streams and a network of amazing professionals. My courses generate \$12K monthly on autopilot!",
      earning: "\$12,000/mo",
      courses: 4,
    },
  ];

  // Stats
  const stats = [
    { value: "250K+", label: "Active Students", icon: FaUsers },
    { value: "\$2.7M", label: "Instructor Earnings", icon: FaDollarSign },
    { value: "12K+", label: "Premium Courses", icon: FaGraduationCap },
    { value: "97%", label: "Satisfaction Rate", icon: FaStar },
  ];

  // Learning benefits
  const learningBenefits = [
    {
      icon: FaVideo,
      title: "High-Quality Video Content",
      description: "Learn from HD video lectures, downloadable resources, and interactive assignments designed by industry experts.",
    },
    {
      icon: FaCertificate,
      title: "Earn Verified Certificates",
      description: "Boost your resume with certificates of completion that are recognized by employers worldwide.",
    },
    {
      icon: FaMobileAlt,
      title: "Learn Anywhere, Anytime",
      description: "Access courses on desktop, mobile, or tablet. Download lessons for offline learning on the go.",
    },
    {
      icon: FaUsers,
      title: "Join Learning Communities",
      description: "Connect with fellow students, participate in discussions, and build your professional network.",
    },
    {
      icon: FaChartLine,
      title: "Track Your Progress",
      description: "Monitor your learning journey with detailed analytics, quizzes, and milestone achievements.",
    },
    {
      icon: FaHeadset,
      title: "24/7 Support",
      description: "Get help whenever you need it with our dedicated student support team and instructor Q&A.",
    },
  ];

  // Instructor benefits
  const instructorBenefits = [
    {
      icon: FaRocket,
      title: "Launch in Minutes",
      description: "Our intuitive course builder lets you create and publish professional courses in record time. No technical skills required.",
      stat: "Average setup: 2 hours",
    },
    {
      icon: FaGlobe,
      title: "Global Reach",
      description: "Tap into our worldwide audience of 250K+ eager learners. Your course is instantly available in 180+ countries.",
      stat: "180+ countries",
    },
    {
      icon: FaHandHoldingUsd,
      title: "Maximize Your Earnings",
      description: "Keep up to 97% of your course revenue. Set your own prices, create bundles, and run promotions your way.",
      stat: "Up to 97% revenue share",
    },
    {
      icon: FaChartLine,
      title: "Advanced Analytics",
      description: "Track student engagement, course performance, and revenue in real-time with our comprehensive dashboard.",
      stat: "Real-time insights",
    },
    {
      icon: FaShieldAlt,
      title: "Secure & Protected",
      description: "Your content is protected with advanced DRM, watermarking, and our robust intellectual property protection system.",
      stat: "Bank-level security",
    },
    {
      icon: FaTrophy,
      title: "Marketing Support",
      description: "We promote top courses through email campaigns, social media, and featured placements to boost your sales.",
      stat: "200K+ marketing reach",
    },
  ];

  // Course creation steps
  const creationSteps = [
    {
      step: 1,
      title: "Plan Your Course",
      description: "Define your target audience, learning outcomes, and course structure. Our AI assistant helps you outline the perfect curriculum.",
      time: "30 mins",
      tips: ["Identify student pain points", "Define clear learning objectives", "Research competitor courses", "Plan 5-10 core modules"],
    },
    {
      step: 2,
      title: "Record Your Content",
      description: "Film your lessons using our recording guidelines. No fancy equipment needed - a smartphone and good lighting work great!",
      time: "2-5 days",
      tips: ["Use natural lighting", "Record in quiet space", "Keep videos 5-15 minutes", "Create engaging slides"],
    },
    {
      step: 3,
      title: "Upload & Structure",
      description: "Upload videos, add quizzes, assignments, and downloadable resources. Our platform automatically processes and optimizes everything.",
      time: "2-3 hours",
      tips: ["Organize in logical sequence", "Add video timestamps", "Include practice exercises", "Upload supplementary materials"],
    },
    {
      step: 4,
      title: "Price & Publish",
      description: "Set your pricing strategy, write compelling course descriptions, and hit publish. Your course goes live instantly!",
      time: "1 hour",
      tips: ["Research market pricing", "Offer launch discount", "Write SEO-friendly description", "Choose eye-catching thumbnail"],
    },
    {
      step: 5,
      title: "Market & Earn",
      description: "Promote your course using our built-in tools. Track sales, engage students, and watch your income grow!",
      time: "Ongoing",
      tips: ["Share on social media", "Email your network", "Create free preview content", "Engage with students"],
    },
  ];

  // FAQ data
  const faqs = [
    {
      question: "How much money can I realistically make as an instructor?",
      answer: "Instructor earnings vary widely based on course quality, niche, and marketing efforts. Our top instructors earn $50K-$200K+ annually. The average active instructor makes \$3,000-\$8,000 per month. With just 200 students at \$49 per course, you'd earn \$9,310/month after platform fees. Many instructors start part-time and scale to full-time income within 6-12 months.",
    },
    {
      question: "What's the time commitment for creating a course?",
      answer: "Most instructors create their first course in 1-2 weeks working part-time. Planning takes 3-5 hours, recording 10-20 hours (for a 3-5 hour course), and editing/uploading 5-10 hours. Once published, courses generate passive income with minimal maintenance - usually 2-4 hours monthly for student support and updates.",
    },
    {
      question: "Do I need to be an expert to teach?",
      answer: "Not necessarily! If you're 2-3 steps ahead of your students, you can teach. Many successful instructors are practitioners sharing real-world experience rather than traditional 'experts.' Students value practical, actionable knowledge over theoretical expertise. Your unique perspective and teaching style matter more than credentials.",
    },
    {
      question: "How do students find my course?",
      answer: "We drive traffic through multiple channels: (1) Our marketplace with 250K+ active students searching daily, (2) SEO-optimized course pages ranking on Google, (3) Email campaigns to relevant audience segments, (4) Social media promotion of top courses, (5) Affiliate marketing program, and (6) Featured placements for high-quality courses. You can also promote directly to your audience.",
    },
    {
      question: "What equipment do I need to create courses?",
      answer: "Minimal! Most instructors start with: (1) Smartphone or webcam for video, (2) Good lighting (natural window light works), (3) Quiet recording space, (4) Free editing software (we recommend DaVinci Resolve or iMovie), (5) Optional: \$30-50 microphone for better audio. Total startup cost: \$0-100. Quality content matters more than expensive equipment.",
    },
    {
      question: "How does the payment system work?",
      answer: "We handle all payments and send you monthly payouts. Students pay via credit card, PayPal, or local payment methods. You receive 95-97% of revenue (depending on plan) deposited directly to your bank account or PayPal on the 15th of each month. We provide detailed sales reports and handle all tax documentation (1099 forms for US instructors).",
    },
    {
      question: "Can I really learn skills that change my life?",
      answer: "Absolutely! Our platform focuses on practical, implementation-focused courses with measurable outcomes. Students report: 73% career advancement within 6 months, 86% increased income, 91% gained practical skills they use daily. Unlike traditional education, our courses are taught by practitioners currently working in their fields, ensuring real-world relevance.",
    },
    {
      question: "What makes Verseandme different from other platforms?",
      answer: "Five key differences: (1) Higher revenue share - you keep up to 97% vs 50% elsewhere, (2) Quality focus - we curate courses for impact, not volume, (3) Marketing support - we actively promote your courses, (4) Community - engaged learners who complete courses and leave reviews, (5) Tools - advanced analytics, AI assistant, and marketing features included free.",
    },
  ];

  // Success metrics
  const successMetrics = [
    { value: "\$127K", label: "Highest Monthly Earnings", sublabel: "by top instructor" },
    { value: "89%", label: "Course Completion Rate", sublabel: "above industry average" },
    { value: "4.7★", label: "Average Course Rating", sublabel: "from 2M+ reviews" },
    { value: "32min", label: "Average Daily Learning", sublabel: "per active student" },
  ];

  // Command Palette Items
  const commandItems = [
    {
      category: "Quick Actions",
      items: [
        { icon: FaGraduationCap, label: "Browse Courses", href: "/users/courses", color: "text-blue-400" },
        { icon: FaDollarSign, label: "Start Selling", href: "/courses/management", color: "text-red-400" },
        { icon: FaSignOutAlt, label: "Create New Account", href: "/auth/signup", color: "text-purple-400" },
        { icon: FaSignInAlt, label: "Log In", href: "/auth/signin", color: "text-green-400" },
      ],
    },
    {
      category: "Features",
      items: [
        //{ icon: FaVideo, label: "How It Works", href: "#features", color: "text-yellow-400" },
        //{ icon: FaUsers, label: "Success Stories", href: "#testimonials", color: "text-pink-400" },
        //{ icon: FaDollarSign, label: "Pricing", href: "#pricing", color: "text-green-400" },
      ],
    },
  ];

  const filteredCommands = commandItems
    .map((category) => ({
      ...category,
      items: category.items.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.items.length > 0);

  // Skeletal Loading State
  if (isLoading || authLoading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-black">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <Spotlight
            className="-top-40 left-0 md:left-60 md:-top-20 opacity-100"
            fill="rgba(220, 38, 38, 0.9)"
          />
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-red-900/30 via-black to-red-900/20"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black via-gray-900/50 to-black" />
        </div>

        {/* Header Skeleton */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-[99999]"
        >
          <div className="max-w-[1800px] mx-auto">
            <div className="relative rounded-xl sm:rounded-2xl overflow-visible">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 backdrop-blur-2xl rounded-xl sm:rounded-2xl" />
              <div className="absolute inset-0 border border-red-500/20 rounded-xl sm:rounded-2xl" />

              <div className="relative px-3 sm:px-4 md:px-6 py-2 sm:py-3">
                {/* Desktop Skeleton */}
                <div className="hidden md:grid md:grid-cols-[auto_1fr_auto] items-center gap-4">
                  <div className="w-32 h-6 bg-gray-800/40 rounded animate-pulse" />
                  <div className="w-full max-w-lg h-11 bg-gray-800/40 rounded-xl animate-pulse mx-auto" />
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-9 bg-gray-800/40 rounded-xl animate-pulse" />
                    <div className="w-24 h-9 bg-gray-800/40 rounded-xl animate-pulse" />
                  </div>
                </div>

                {/* Mobile Skeleton */}
                <div className="flex md:hidden items-center justify-between gap-2">
                  <div className="w-20 h-5 bg-gray-800/40 rounded-lg animate-pulse" />
                  <div className="flex-1 max-w-[200px] h-9 bg-gray-800/40 rounded-lg animate-pulse" />
                  <div className="w-7 h-7 bg-gray-800/40 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        <div className="relative z-10 container mx-auto px-4 pt-20 sm:pt-24 md:pt-28 lg:pt-32">
          {/* Hero Skeleton */}
          <div className="text-center mb-12">
            <div className="h-12 bg-gray-800/50 rounded-lg w-3/4 mx-auto mb-4 animate-pulse" />
            <div className="h-6 bg-gray-800/50 rounded-lg w-1/2 mx-auto animate-pulse" />
            <div className="h-10 bg-gray-800/50 rounded-lg w-64 mx-auto mt-8 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Pass all state and data to the components
  const commonProps = {
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
    successMetrics
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Background Effects */}
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
      </div>

      {/* Updated Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-6 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-[99999]"
        style={{ isolation: "isolate" }}
      >
        <div className="max-w-[1800px] mx-auto ">
          <div className="relative rounded-xl sm:rounded-2xl overflow-visible">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 backdrop-blur-2xl rounded-xl sm:rounded-2xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent rounded-xl sm:rounded-2xl" />
            <div className="absolute inset-0 border border-red-500/20 rounded-xl sm:rounded-2xl" />

            <div className="relative px-3 sm:px-4 md:px-6 py-2 sm:py-3">
              {/* Desktop Layout */}
              <div className="hidden md:grid md:grid-cols-[auto_1fr_auto] items-center gap-4">
                {/* Logo */}
                <div>
                  <Link
                    href="/"
                    className="inline-block font-black text-xl tracking-tighter hover:opacity-80 transition-opacity"
                    aria-label="Verse and Me Scales home"
                  >
                    <span className="text-white">
                      VERSE<span className="text-red-500">&</span>ME
                      <span className="text-gray-500">SCALES</span>
                    </span>
                  </Link>
                </div>

                {/* Center: Command Bar */}
                <div className="flex justify-center">
                  <motion.button
                    onClick={() => setIsCommandOpen(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full max-w-lg relative rounded-xl overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 to-black/70 backdrop-blur-sm" />
                    <div className="absolute inset-0 border border-red-500/20 group-hover:border-red-500/40 rounded-xl transition-all" />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-red-600/0 to-transparent group-hover:from-red-600/5"
                      whileHover={{ opacity: 1 }}
                    />

                    <div className="relative flex items-center gap-3 px-4 py-2.5">
                      <FaSearch className="text-gray-500 text-sm" />
                      <span className="flex-1 text-left text-sm text-gray-500">
                        Search courses, topics...
                      </span>
                      <kbd className="px-2 py-1 bg-gray-800/50 border border-gray-700/50 rounded text-xs text-gray-400 font-mono">
                        ⌘K
                      </kbd>
                    </div>
                  </motion.button>
                </div>

                {/* Right: Auth Buttons */}
                <div className="flex items-center gap-2">
                  {isAuthenticated ? (
                    <motion.button 
                      className="bg-gradient-to-r from-red-600 to-red-700 text-white px-5 py-2 rounded-lg hover:from-red-500 hover:to-red-600 transition-all text-sm font-medium shadow-lg"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push('/users')}
                    >
                      Get in
                    </motion.button>
                  ) : (
                    <>
                      <motion.button 
                        className="bg-transparent border border-red-500 text-red-500 px-4 py-2 rounded-lg hover:bg-red-500/10 transition-all text-sm font-medium"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/auth/signin')}
                      >
                        Log In
                      </motion.button>
                      
                      <motion.button 
                        className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:from-red-500 hover:to-red-600 transition-all text-sm font-medium shadow-lg"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ boxShadow: "0 5px 15px rgba(220, 38, 38, 0.3)" }}
                        onClick={() => router.push('/auth/signup')}
                      >
                        Sign Up Free
                      </motion.button>
                    </>
                  )}
                </div>
              </div>

              {/* Mobile Layout - UPDATED */}
              <div className="flex md:hidden items-center justify-between gap-2">
                <div>
                  <Link
                    href="/"
                    className="inline-block font-black text-xs tracking-tighter hover:opacity-80 transition-opacity mt-6"
                    aria-label="Verse and Me Scales home"
                  >
                    <span className="text-white">
                      VERSE<span className="text-red-500">&</span>ME
                      <span className="text-gray-500">SCALES</span>
                    </span>
                  </Link>
                </div>

                {/* Mobile search button */}
                <motion.button
                  onClick={() => setIsCommandOpen(true)}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 max-w-[200px] sm:max-w-xs mx-auto relative rounded-lg overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 to-black/70 backdrop-blur-sm" />
                  <div className="absolute inset-0 border border-red-500/20 rounded-lg" />

                  <div className="relative flex items-center gap-2 px-3 py-1.5">
                    <FaSearch className="text-gray-500 text-xs flex-shrink-0" />
                    <span className="flex-1 text-left text-xs text-gray-500 truncate">
                      Search...
                    </span>
                  </div>
                </motion.button>

                {/* Mobile auth button - UPDATED: Removed border */}
                {isAuthenticated ? (
                  <motion.button 
                    className="bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-md"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/users')}
                  >
                    Get in
                  </motion.button>
                ) : (
                  <motion.button 
                    className="bg-transparent text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/auth/signin')}
                  >
                    <FaUserCircle className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Command Palette */}
      <AnimatePresence>
        {isCommandOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCommandOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200000]"
            />

            <div className="fixed inset-0 z-[200001] flex items-start justify-center pt-[10vh] px-4">
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full max-w-2xl rounded-xl sm:rounded-2xl overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/98 to-black/98 backdrop-blur-3xl" />
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent" />
                <div className="absolute inset-0 border border-red-500/30 rounded-xl sm:rounded-2xl" />

                <div className="relative">
                  <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-800/50">
                    <FaSearch className="text-gray-400 text-base sm:text-lg flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Type a command or search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-gray-500 outline-none"
                    />
                    <kbd className="hidden sm:block px-2 py-1 bg-gray-800/50 border border-gray-700/50 rounded text-xs text-gray-400 font-mono">
                      ESC
                    </kbd>
                  </div>

                  <div className="max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {filteredCommands.length > 0 ? (
                      filteredCommands.map((category) => (
                        <div key={category.category} className="py-2 sm:py-3">
                          <div className="px-4 sm:px-6 py-1.5 sm:py-2">
                            <h3 className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              {category.category}
                            </h3>
                          </div>
                          <div>
                            {category.items.map((item, index) => (
                              <Link
                                key={index}
                                href={item.href}
                                onClick={() => {
                                  setIsCommandOpen(false);
                                  setSearchQuery("");
                                }}
                                className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-2.5 sm:py-3 hover:bg-gradient-to-r hover:from-red-600/10 hover:to-transparent transition-all group"
                              >
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gray-900/50 border border-gray-800 flex items-center justify-center group-hover:border-red-500/30 transition-all flex-shrink-0">
                                  <item.icon
                                    className={`text-sm sm:text-lg ${
                                      item.color || "text-gray-400"
                                    } group-hover:scale-110 transition-transform`}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs sm:text-sm font-medium text-white group-hover:text-red-400 transition-colors truncate">
                                    {item.label}
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 sm:py-16 text-center">
                        <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">
                          🔍
                        </div>
                        <p className="text-xs sm:text-sm text-gray-400">
                          No results found
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="px-4 sm:px-6 py-2 sm:py-3 border-t border-gray-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-500">
                      <div className="hidden sm:flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-gray-800/50 border border-gray-700/50 rounded text-[10px] font-mono">
                          ↑↓
                        </kbd>
                        <span>Navigate</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-gray-800/50 border border-gray-700/50 rounded text-[10px] font-mono">
                          ↵
                        </kbd>
                        <span>Select</span>
                      </div>
                    </div>
                    <div>
                      <Link
                        href="/"
                        className="inline-block font-black text-sm tracking-tighter hover:opacity-80 transition-opacity"
                        aria-label="Verse and Me Scales home"
                      >
                        <span className="text-white">
                          VERSE<span className="text-red-500">&</span>ME
                          <span className="text-gray-500">SCALES</span>
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content with responsive top margin */}
      <div className="pt-16 sm:pt-16 md:pt-24 lg:pt-28 mt-14 sm:mt-0">
        <MainContent {...commonProps} />
        <Footer />
      </div>
    </div>
  );
}