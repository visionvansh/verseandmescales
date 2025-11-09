"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { FaCheckCircle, FaGraduationCap, FaMoneyBillWave, FaUserGraduate, 
         FaChalkboardTeacher, FaChartLine, FaSignInAlt, FaLightbulb, 
         FaLock, FaRegClock, FaPhoneAlt, FaEnvelope, FaRocket, FaTrophy,
         FaUsers, FaVideo, FaCertificate, FaShieldAlt, FaGlobe, FaMobileAlt,
         FaHeadset, FaStar, FaArrowRight, FaPlay, FaDollarSign, FaHandHoldingUsd, FaQuestionCircle,FaInstagram, FaLaptopCode, FaSearch } from "react-icons/fa";
import { Spotlight } from "@/components/ui/Spotlight";
import Image from "next/image";
import MainContent from "@/components/MainContent";
import Footer from "@/components/Footer";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [earningCalculator, setEarningCalculator] = useState({
    students: 100,
    coursePrice: 49,
  });
  const router = useRouter();

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
      text: "After listing my course on Verseandme, my monthly income tripled! The platform made it incredibly easy to reach thousands of students who were eager to learn. I went from $2K to $6K per month in just 3 months!",
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
      text: "Both teaching and learning on Verseandme has transformed my business. I now have multiple income streams and a network of amazing professionals. My courses generate $12K monthly on autopilot!",
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
    { value: "$127K", label: "Highest Monthly Earnings", sublabel: "by top instructor" },
    { value: "89%", label: "Course Completion Rate", sublabel: "above industry average" },
    { value: "4.7★", label: "Average Course Rating", sublabel: "from 2M+ reviews" },
    { value: "32min", label: "Average Daily Learning", sublabel: "per active student" },
  ];

  // Skeletal Loading State
  if (isLoading) {
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

        <div className="relative z-10 container mx-auto px-4 py-16">
          {/* Hero Skeleton */}
          <div className="text-center mb-12">
            <div className="h-12 bg-gray-800/50 rounded-lg w-3/4 mx-auto mb-4 mt-8 animate-pulse" />
            <div className="h-6 bg-gray-800/50 rounded-lg w-1/2 mx-auto animate-pulse" />
            <div className="h-10 bg-gray-800/50 rounded-lg w-64 mx-auto mt-8 animate-pulse" />
          </div>

          {/* Features Skeleton */}
          <div className="max-w-6xl mx-auto mt-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-gray-800/30 rounded-2xl p-6 animate-pulse">
                  <div className="h-10 w-10 bg-red-600/30 rounded-full mb-4" />
                  <div className="h-6 bg-gray-700/50 rounded w-1/2 mb-3" />
                  <div className="h-4 bg-gray-700/50 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-700/50 rounded w-5/6 mb-2" />
                  <div className="h-4 bg-gray-700/50 rounded w-4/6" />
                </div>
              ))}
            </div>
          </div>

          {/* Course Cards Skeleton */}
          <div className="max-w-6xl mx-auto mt-20">
            <div className="h-8 bg-gray-800/50 rounded-lg w-1/3 mb-6 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-gray-800/30 rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-40 bg-gray-700/50" />
                  <div className="p-5">
                    <div className="h-5 bg-gray-700/50 rounded w-3/4 mb-3" />
                    <div className="h-4 bg-gray-700/50 rounded w-1/2 mb-3" />
                    <div className="h-4 bg-gray-700/50 rounded w-1/3 mb-3" />
                    <div className="h-8 bg-red-600/30 rounded-lg w-full mt-4" />
                  </div>
                </div>
              ))}
            </div>
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

      {/* Header */}
      <header className="relative z-10 py-4 top-0 bg-black/80 backdrop-blur-lg border-b border-gray-800/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <motion.div
                initial={{ rotate: -10, scale: 0.9 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="bg-red-600 text-white h-10 w-10 rounded-lg flex items-center justify-center font-bold text-xl">VS</div>
              </motion.div>
              <h1 className="text-white font-bold text-xl">
                Verseandme <span className="text-red-500">Scales</span>
              </h1>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">How It Works</a>
              <a href="#courses" className="text-gray-300 hover:text-white transition-colors">Courses</a>
              <a href="#earn" className="text-gray-300 hover:text-white transition-colors">Start Earning</a>
              <a href="#testimonials" className="text-gray-300 hover:text-white transition-colors">Success Stories</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
            </nav>

            <div className="flex items-center space-x-4">
              <motion.button 
                className="hidden md:block bg-transparent border border-red-500 text-red-500 px-4 py-2 rounded-lg hover:bg-red-500/10 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/auth/login')}
              >
                Log In
              </motion.button>
              
              <motion.button 
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:from-red-500 hover:to-red-600 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ boxShadow: "0 10px 25px rgba(220, 38, 38, 0.3)" }}
                onClick={() => router.push('/auth/signup')}
              >
                Sign Up Free
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Component */}
      <MainContent {...commonProps} />

      {/* Footer Component */}
      <Footer />
    </div>
  );
}