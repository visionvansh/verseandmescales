// app/dashboard/homepage-builder/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";

import { motion, AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";

import { useRouter } from "next/navigation";

import {
  FaEye,
  FaCode,
  FaLayerGroup,
  FaPalette,
  FaVideo,
  FaImage,
  FaQuoteRight,
  FaQuestion,
  FaChevronLeft,
  FaColumns,
  FaTags,
  FaCog,
  FaCheckCircle,
  FaSpinner,
  FaBook,
  FaChevronRight,
  FaSave,
} from "react-icons/fa";

// Import sub-components
import TitleEditor from "@/components/builder/TitleEditor";
import SubheadingEditor from "@/components/builder/SubheadingEditor";
import VideoEditor from "@/components/builder/VideoEditor";
import ButtonEditor from "@/components/builder/ButtonEditor";
import StatsEditor from "@/components/builder/StatsEditor";
import CustomSectionEditor from "@/components/builder/CustomSectionEditor";
import ProofSectionEditor from "@/components/builder/ProofSectionEditor";
import TestimonialEditor from "@/components/builder/TestimonialEditor";
import FAQEditor from "@/components/builder/FAQEditor";
import FooterEditor from "@/components/builder/FooterEditor";
import BackgroundEditor from "@/components/builder/BackgroundEditor";
import SectionBadgeEditor from "@/components/builder/SectionBadgeEditor";
import LivePreview from "@/components/builder/LivePreview";

type ShadeType = "none" | "red-light" | "red-medium" | "red-dark" | "red-gradient-1" | "red-gradient-2" | "red-gradient-3" | "gray-light" | "gray-medium";

interface TitleWord {
  text: string;
  shade?: ShadeType;
}

interface DescriptionWord {
  text: string;
  shade?: ShadeType;
}

interface FooterIcon {
  name: string;
  label: string;
}

interface SectionBadge {
  sectionId: string;
  enabled: boolean;
  text: string;
  emoji: string;
}

interface HomepageData {
  id?: string;
  backgroundType: string;
  backgroundColor: string;
  gradientFrom: string;
  gradientTo: string;
  primaryColor: string;
  secondaryColor: string;
  darkMode: boolean;
  mainTitle: {
    line1: string;
    line2: string;
    line3: string;
    highlightedWords: string[];
    line1Words?: TitleWord[];
    line2Words?: TitleWord[];
    line3Words?: TitleWord[];
  };
  mainTitleLines: number;
  subheading: {
    text: string;
    highlightedWords: string[];
    highlightedSentences: string[];
    words?: DescriptionWord[];
  };
  subheadingLines: number;
  videoEnabled: boolean;
  videoUrl: string;
  videoTitle: string;
  videoDescription: string;
  videoDuration: string;
  ctaButtonText: string;
  ctaButtonIcon: string;
  statsEnabled: boolean;
  customSections: any[];
  proofSectionEnabled: boolean;
  proofSectionTitle: string;
  proofSectionTitleWords?: TitleWord[];
  proofImages: any[];
  curriculumTitle: string;
  testimonialsEnabled: boolean;
  testimonialsTitle: string;
  testimonialsTitleWords?: TitleWord[];
  testimonials: any[];
  faqEnabled: boolean;
  faqTitle: string;
  faqTitleWords?: TitleWord[];
  faqs: any[];
  footerTitle: string;
  footerTitleWords?: TitleWord[];
  footerDescription: string;
  footerDescriptionWords?: DescriptionWord[];
  footerPrice: string;
  footerSalePrice?: string;
  saleEndsAt?: string | null;
  footerIcons: FooterIcon[];
  sectionBadges: SectionBadge[];
  courseStats?: {
    activeStudents: number;
    courseRating: number;
    monthlyIncome: string;
    avgGrowth: string;
  };
}

// Optimized Skeleton Loader Component
const HomepageBuilderSkeleton = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-2 gap-6">
      {/* Sidebar Skeleton - Desktop Only */}
      <div className="hidden lg:block relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
        <div className="relative p-5 space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-12 bg-gray-800/40 rounded-lg animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="relative lg:col-span-1 xl:col-span-1">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
        <div className="relative p-6 space-y-6">
          {/* Title Skeleton */}
          <div className="space-y-3">
            <div className="h-6 bg-gray-800/40 rounded-lg animate-pulse w-1/4" />
            <div className="h-10 bg-gray-800/40 rounded-lg animate-pulse" />
          </div>

          {/* Content Blocks */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="h-4 bg-gray-800/40 rounded-lg animate-pulse w-1/3" />
              <div className="h-24 bg-gray-800/40 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const HomepageBuilder = () => {
  const router = useRouter();

  const [courseId, setCourseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("split");
  const [activeSection, setActiveSection] = useState("background");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileContent, setShowMobileContent] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
 
  const previousWidthRef = useRef<number>(0);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);
 
  const [homepageData, setHomepageData] = useState<HomepageData>({
    backgroundType: "black",
    backgroundColor: "#000000",
    gradientFrom: "#dc2626",
    gradientTo: "#000000",
    primaryColor: "#dc2626",
    secondaryColor: "#000000",
    darkMode: true,
    mainTitle: {
      line1: "",
      line2: "",
      line3: "",
      highlightedWords: [],
      line1Words: [],
      line2Words: [],
      line3Words: [],
    },
    mainTitleLines: 1,
    subheading: {
      text: "",
      highlightedWords: [],
      highlightedSentences: [],
      words: [],
    },
    subheadingLines: 1,
    videoEnabled: true,
    videoUrl: "",
    videoTitle: "",
    videoDescription: "",
    videoDuration: "",
    ctaButtonText: "START YOUR JOURNEY",
    ctaButtonIcon: "FaRocket",
    statsEnabled: true,
    customSections: [],
    proofSectionEnabled: true,
    proofSectionTitle: "",
    proofSectionTitleWords: [],
    proofImages: [],
    curriculumTitle: "",
    testimonialsEnabled: true,
    testimonialsTitle: "",
    testimonialsTitleWords: [],
    testimonials: [],
    faqEnabled: true,
    faqTitle: "GOT QUESTIONS?",
    faqTitleWords: [],
    faqs: [],
    footerTitle: "",
    footerTitleWords: [],
    footerDescription: "",
    footerDescriptionWords: [],
    footerPrice: "",
    footerSalePrice: "",
    saleEndsAt: null,
    footerIcons: [
      { name: 'shield', label: '30-Day Guarantee' },
      { name: 'infinity', label: 'Lifetime Access' },
      { name: 'star', label: 'Premium Support' },
    ],
    sectionBadges: [],
    courseStats: {
      activeStudents: 0,
      courseRating: 0,
      monthlyIncome: '\$0',
      avgGrowth: '0',
    },
  });

  // Initialize and load data
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('courseId');
    
    if (!id) {
      router.push('/dashboard/courses');
      return;
    }
    
    setCourseId(id);
    
    // Load data immediately
    loadHomepageData(id);
  }, []);

  // Monitor changes to homepageData (skip initial load)
  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }
    // Mark as having unsaved changes whenever data changes
    setHasUnsavedChanges(true);
  }, [homepageData]);

  useEffect(() => {
    const checkMobile = () => {
      const currentWidth = window.innerWidth;
      const previousWidth = previousWidthRef.current;
      
      if (previousWidth === 0) {
        if (currentWidth < 1024) {
          setActiveTab("editor");
          setShowMobileMenu(true);
          setShowMobileContent(false);
        } else {
          setActiveTab("split");
          setShowMobileMenu(false);
          setShowMobileContent(false);
        }
      } else if (
        (previousWidth >= 1024 && currentWidth < 1024) ||
        (previousWidth < 1024 && currentWidth >= 1024)
      ) {
        if (currentWidth < 1024) {
          setActiveTab("editor");
          setShowMobileMenu(true);
          setShowMobileContent(false);
        } else {
          setActiveTab("split");
          setShowMobileMenu(false);
          setShowMobileContent(false);
        }
      }
      
      previousWidthRef.current = currentWidth;
    };
    
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        checkMobile();
      }, 150);
    };
    checkMobile();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  const loadHomepageData = async (courseId: string) => {
    setIsLoading(true);
    try {
      // Load homepage data
      const homepageResponse = await fetch(`/api/course/homepage?courseId=${courseId}`);
      
      // ✅ Load course data to get price
      const courseResponse = await fetch(`/api/course?id=${courseId}`);
      
      if (homepageResponse.ok && courseResponse.ok) {
        const homepageData = await homepageResponse.json();
        const courseData = await courseResponse.json();
        
        if (homepageData) {
          setHomepageData({
            ...homepageData,
            courseId,
            // ✅ Set price data from course model
            footerPrice: courseData.price || "",
            footerSalePrice: courseData.salePrice || "",
            saleEndsAt: courseData.saleEndsAt || null, // ✅ Add this field
            subheading: {
              ...homepageData.subheading,
              highlightedSentences: homepageData.subheading?.highlightedSentences || [],
            },
            sectionBadges: homepageData.sectionBadges || [],
          });
          setHasUnsavedChanges(false);
        }
      }
    } catch (error) {
      console.error("Error loading homepage:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save to database (manual save)
  const saveHomepage = async () => {
    if (!courseId) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const response = await fetch("/api/course/homepage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...homepageData,
          courseId,
        }),
      });
      if (response.ok) {
        setSaveSuccess(true);
        setHasUnsavedChanges(false);
        
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error saving homepage:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSection = (section: string, data: any) => {
    setHomepageData((prev) => ({
      ...prev,
      [section]: data,
    }));
    setHasUnsavedChanges(true);
  };

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    if (window.innerWidth < 1024) {
      setShowMobileMenu(false);
      setShowMobileContent(true);
    }
  };

  const handleBackToMenu = () => {
    setShowMobileContent(false);
    setShowMobileMenu(true);
  };

  const getAllSectionsForBadges = () => {
    const sections = [
      { 
        id: "hero", 
        title: homepageData.mainTitle.line1 || "Main Title", 
        type: "hero" 
      },
    ];
    homepageData.customSections.forEach((s: any) => {
      sections.push({
        id: s.id,
        title: s.title || "Custom Section",
        type: "customSection"
      });
    });
    if (homepageData.proofSectionEnabled) {
      sections.push({
        id: "proof",
        title: homepageData.proofSectionTitle || "Proof Gallery",
        type: "proofSection"
      });
    }
    if (homepageData.testimonialsEnabled) {
      sections.push({
        id: "testimonials",
        title: homepageData.testimonialsTitle || "Testimonials",
        type: "testimonials"
      });
    }
    if (homepageData.faqEnabled) {
      sections.push({
        id: "faq",
        title: homepageData.faqTitle || "FAQ",
        type: "faq"
      });
    }
    sections.push({
      id: "footer",
      title: homepageData.footerTitle || "Footer CTA",
      type: "footer"
    });
    return sections;
  };

  const sections = [
    { id: "background", label: "Background", icon: FaPalette },
    { id: "title", label: "Main Title", icon: FaPalette },
    { id: "subheading", label: "Subheading", icon: FaPalette },
    { id: "video", label: "Video", icon: FaVideo },
    { id: "button", label: "CTA Button", icon: FaCog },
    { id: "stats", label: "Stats Cards", icon: FaLayerGroup },
    { id: "sections", label: "Custom Sections", icon: FaLayerGroup },
    { id: "proof", label: "Proof Gallery", icon: FaImage },
    { id: "testimonials", label: "Testimonials", icon: FaQuoteRight },
    { id: "faq", label: "FAQ", icon: FaQuestion },
    { id: "footer", label: "Footer", icon: FaCog },
    { id: "badges", label: "Section Badges", icon: FaTags },
  ];

  return (
    <LazyMotion features={domAnimation}>
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
          scroll-behavior: smooth;
        }
      `}</style>

      {/* Main Content with mt-20 */}
      <div className="relative z-20 min-h-screen mt-20">
        <div className="container mx-auto px-3 xs:px-4 sm:px-6 py-4 xs:py-5 sm:py-6">
          {/* Header Card */}
          <m.div
            className="relative mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-2xl" />
            
            <div className="relative p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {/* Back Navigation Button */}
                  <m.button
                    onClick={() => router.push('/users/card-customisation')}
                    className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-colors border border-red-500/20 hover:border-red-500/40"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaChevronLeft className="text-red-400 text-sm" />
                  </m.button>
                  <div className="bg-gradient-to-br from-red-600/20 to-red-700/20 rounded-xl flex items-center justify-center border border-red-500/30 w-12 h-12 sm:w-14 sm:h-14">
                    <FaLayerGroup className="text-red-500 text-xl sm:text-2xl" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                      Homepage Builder
                    </h1>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <p className="text-gray-400 text-xs sm:text-sm">
                        Create and customize your landing page
                      </p>
                      
                      {hasUnsavedChanges && (
                        <span className="text-xs text-yellow-400">
                          • Unsaved changes
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-wrap">
                  {/* View Mode Tabs - Desktop */}
                  <div className="hidden lg:flex gap-2 flex-1 sm:flex-initial">
                    <button
                      onClick={() => setActiveTab("split")}
                      className={`px-3 py-2 rounded-lg font-bold transition-all text-sm flex items-center gap-2 ${
                        activeTab === "split"
                          ? "bg-red-600 text-white"
                          : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50"
                      }`}
                    >
                      <FaColumns className="text-sm" />
                      <span className="hidden xl:inline">Split</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("editor")}
                      className={`px-3 py-2 rounded-lg font-bold transition-all text-sm flex items-center gap-2 ${
                        activeTab === "editor"
                          ? "bg-red-600 text-white"
                          : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50"
                      }`}
                    >
                      <FaCode className="text-sm" />
                      <span className="hidden xl:inline">Editor</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("preview")}
                      className={`px-3 py-2 rounded-lg font-bold transition-all text-sm flex items-center gap-2 ${
                        activeTab === "preview"
                          ? "bg-red-600 text-white"
                          : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50"
                      }`}
                    >
                      <FaEye className="text-sm" />
                      <span className="hidden xl:inline">Preview</span>
                    </button>
                  </div>

                  {/* Mobile/Tablet Tabs */}
                  <div className="flex lg:hidden gap-2 flex-1">
                    <button
                      onClick={() => {
                        setActiveTab("editor");
                        setShowMobileMenu(true);
                        setShowMobileContent(false);
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg font-bold transition-all text-xs flex items-center justify-center gap-1.5 ${
                        activeTab === "editor"
                          ? "bg-red-600 text-white"
                          : "bg-gray-800/50 text-gray-400"
                      }`}
                    >
                      <FaCode className="text-xs" />
                      <span>Editor</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("preview")}
                      className={`flex-1 px-3 py-2 rounded-lg font-bold transition-all text-xs flex items-center justify-center gap-1.5 ${
                        activeTab === "preview"
                          ? "bg-red-600 text-white"
                          : "bg-gray-800/50 text-gray-400"
                      }`}
                    >
                      <FaEye className="text-xs" />
                      <span>Preview</span>
                    </button>
                  </div>

                  {/* Save Button */}
                  <m.button
                    onClick={saveHomepage}
                    disabled={isSaving || !hasUnsavedChanges}
                    className={`px-4 sm:px-5 py-2 rounded-lg font-bold transition-all text-sm flex items-center gap-2 whitespace-nowrap ${
                      hasUnsavedChanges
                        ? "bg-gradient-to-r from-green-600 to-green-700 hover:scale-105"
                        : "bg-gray-700/50 cursor-not-allowed"
                    }`}
                    whileHover={hasUnsavedChanges ? { scale: 1.05 } : {}}
                    whileTap={hasUnsavedChanges ? { scale: 0.95 } : {}}
                  >
                    {isSaving ? (
                      <>
                        <FaSpinner className="animate-spin text-sm" />
                        <span className="hidden sm:inline">Saving...</span>
                      </>
                    ) : saveSuccess ? (
                      <>
                        <FaCheckCircle className="text-sm" />
                        <span className="hidden sm:inline">Saved!</span>
                      </>
                    ) : (
                      <>
                        <FaSave className="text-sm" />
                        <span className="hidden sm:inline">Save</span>
                      </>
                    )}
                  </m.button>
                  <m.button
                    onClick={() => router.push(`/users/course-builder?courseId=${courseId}`)}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-5 py-2 rounded-lg font-bold hover:scale-105 transition-transform text-sm flex items-center gap-2 whitespace-nowrap"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaBook className="text-sm" />
                    <span className="hidden sm:inline">Customize Course</span>
                    <span className="sm:hidden">Course</span>
                    <FaChevronRight className="text-xs" />
                  </m.button>
                </div>
              </div>
            </div>
          </m.div>

          {/* Main Content Area */}
          {isLoading ? (
            <HomepageBuilderSkeleton />
          ) : (
            <div className="relative">
              {/* Desktop Layout */}
              <div className="hidden lg:block">
                {activeTab === "split" && (
                  <div className="grid grid-cols-2 gap-6">
                    <EditorPanel
                      sections={sections}
                      activeSection={activeSection}
                      setActiveSection={setActiveSection}
                      homepageData={homepageData}
                      updateSection={updateSection}
                      getAllSectionsForBadges={getAllSectionsForBadges}
                    />
                    <m.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                      className="relative"
                    >
                      <div className="sticky top-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
                        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-2xl" />
                        
                        <div className="relative max-h-[calc(100vh-140px)] overflow-y-auto rounded-2xl hide-scrollbar">
                          <LivePreview data={homepageData} />
                        </div>
                      </div>
                    </m.div>
                  </div>
                )}
                {activeTab === "editor" && (
                  <EditorPanel
                    sections={sections}
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    homepageData={homepageData}
                    updateSection={updateSection}
                    getAllSectionsForBadges={getAllSectionsForBadges}
                  />
                )}
                {activeTab === "preview" && (
                  <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-2xl" />
                    
                    <div className="relative max-h-[calc(100vh-140px)] overflow-y-auto rounded-2xl hide-scrollbar">
                      <LivePreview data={homepageData} />
                    </div>
                  </m.div>
                )}
              </div>

              {/* Mobile/Tablet Layout */}
              <div className="lg:hidden">
                <AnimatePresence mode="wait">
                  {activeTab === "editor" && (
                    <m.div
                      key="mobile-editor"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {showMobileMenu && !showMobileContent && (
                        <MobileSectionsMenu
                          sections={sections}
                          activeSection={activeSection}
                          onSectionChange={handleSectionChange}
                        />
                      )}
                      {showMobileContent && (
                        <MobileSectionContent
                          sections={sections}
                          activeSection={activeSection}
                          homepageData={homepageData}
                          updateSection={updateSection}
                          onBackToMenu={handleBackToMenu}
                          getAllSectionsForBadges={getAllSectionsForBadges}
                        />
                      )}
                    </m.div>
                  )}
                  {activeTab === "preview" && (
                    <m.div
                      key="mobile-preview"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
                      <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-2xl" />
                      
                      <div className="relative max-h-[calc(100vh-200px)] overflow-y-auto rounded-2xl hide-scrollbar">
                        <LivePreview data={homepageData} />
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
    </LazyMotion>
  );
};

// Mobile Sections Menu Component
const MobileSectionsMenu = ({ sections, activeSection, onSectionChange }: any) => {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
      <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-2xl" />
      
      <div className="relative p-4 sm:p-5 max-h-[calc(100vh-200px)] overflow-y-auto hide-scrollbar">
        <h2 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center">
          <FaLayerGroup className="mr-2 text-red-500 text-sm" />
          Sections
        </h2>
        
        <nav className="space-y-2">
          {sections.map((section: any, index: number) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <m.button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`w-full p-3 rounded-lg text-left transition-all duration-300 border backdrop-blur-sm relative overflow-hidden ${
                  isActive
                    ? 'bg-red-600/20 border-red-500/50 text-red-400'
                    : 'bg-gray-900/40 border-red-500/20 text-gray-300 hover:bg-gray-800/50 hover:border-red-500/40'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Icon className={`text-lg flex-shrink-0 ${isActive ? 'text-red-500' : 'text-gray-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-sm truncate ${isActive ? 'text-red-400' : 'text-white'}`}>
                        {section.label}
                      </div>
                    </div>
                  </div>
                  <FaChevronLeft 
                    className={`text-base flex-shrink-0 ${isActive ? 'text-red-500' : 'text-gray-500'}`} 
                    style={{ transform: 'rotate(180deg)' }} 
                  />
                </div>
                
                {isActive && (
                  <m.div
                    className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-transparent"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </m.button>
            );
          })}
        </nav>
      </div>
    </m.div>
  );
};

// Mobile Section Content Component
const MobileSectionContent = ({
  sections,
  activeSection,
  homepageData,
  updateSection,
  onBackToMenu,
  getAllSectionsForBadges,
}: any) => {
  const currentSection = sections.find((s: any) => s.id === activeSection);
  
  return (
    <m.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
      <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-2xl" />
      
      <div className="relative p-4 sm:p-5 max-h-[calc(100vh-200px)] overflow-y-auto hide-scrollbar">
        <m.button
          onClick={onBackToMenu}
          className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors mb-4 p-2 rounded-lg hover:bg-red-600/10"
          whileTap={{ scale: 0.95 }}
        >
          <FaChevronLeft className="text-sm" />
          <span className="font-medium text-sm">Back to Sections</span>
        </m.button>
        {currentSection && (
          <h2 className="text-lg font-bold text-white mb-4 flex items-center">
            <currentSection.icon className="mr-2 text-red-500 text-sm" />
            {currentSection.label}
          </h2>
        )}
        <AnimatePresence mode="wait">
          <m.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderSectionContent(activeSection, homepageData, updateSection, getAllSectionsForBadges, true)}
          </m.div>
        </AnimatePresence>
      </div>
    </m.div>
  );
};

// Editor Panel Component
const EditorPanel = ({
  sections,
  activeSection,
  setActiveSection,
  homepageData,
  updateSection,
  getAllSectionsForBadges,
}: any) => {
  return (
    <m.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-[280px_1fr] gap-6"
    >
      <div className="relative">
        <div className="sticky top-6">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-2xl" />
          
          <div className="relative p-5 max-h-[calc(100vh-140px)] overflow-y-auto hide-scrollbar">
            <h3 className="text-lg font-bold mb-4 text-red-400 flex items-center">
              <FaLayerGroup className="mr-2" />
              Sections
            </h3>
            
            <div className="space-y-2">
              {sections.map((section: any) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all border backdrop-blur-sm relative overflow-hidden ${
                      isActive
                        ? "bg-red-600/20 border-red-500/50 text-red-400"
                        : "bg-gray-900/40 border-red-500/20 text-gray-300 hover:bg-gray-800/50 hover:border-red-500/40"
                    }`}
                  >
                    <Icon className={`text-lg flex-shrink-0 ${isActive ? 'text-red-500' : 'text-gray-500'}`} />
                    <span className={`flex-1 text-left text-sm truncate ${isActive ? 'text-red-400' : 'text-white'}`}>
                      {section.label}
                    </span>
                    
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-r"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-2xl" />
        
        <div className="relative p-6 max-h-[calc(100vh-140px)] overflow-y-auto hide-scrollbar">
          <AnimatePresence mode="wait">
            <m.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderSectionContent(activeSection, homepageData, updateSection, getAllSectionsForBadges, false)}
            </m.div>
          </AnimatePresence>
        </div>
      </div>
    </m.div>
  );
};

// Render Section Content Function
const renderSectionContent = (
  activeSection: string,
  homepageData: HomepageData,
  updateSection: (section: string, data: any) => void,
  getAllSectionsForBadges: () => any[],
  showPreview: boolean
) => {
  switch (activeSection) {
    case "background":
      return (
        <BackgroundEditor
          backgroundType={homepageData.backgroundType}
          backgroundColor={homepageData.backgroundColor}
          gradientFrom={homepageData.gradientFrom}
          gradientTo={homepageData.gradientTo}
          onChange={(data: any) => {
            updateSection("backgroundType", data.backgroundType);
            updateSection("backgroundColor", data.backgroundColor);
            updateSection("gradientFrom", data.gradientFrom);
            updateSection("gradientTo", data.gradientTo);
          }}
        />
      );
    case "title":
      return (
        <TitleEditor
          data={homepageData.mainTitle}
          lines={homepageData.mainTitleLines}
          onChange={(data: any) => updateSection("mainTitle", data)}
          onLinesChange={(lines: any) => updateSection("mainTitleLines", lines)}
          showPreview={showPreview}
        />
      );
    case "subheading":
      return (
        <SubheadingEditor
          data={homepageData.subheading}
          lines={homepageData.subheadingLines}
          onChange={(data: any) => updateSection("subheading", data)}
          onLinesChange={(lines: any) => updateSection("subheadingLines", lines)}
          showPreview={showPreview}
        />
      );
    case "video":
      return (
        <VideoEditor
          enabled={homepageData.videoEnabled}
          url={homepageData.videoUrl}
          title={homepageData.videoTitle}
          description={homepageData.videoDescription}
          duration={homepageData.videoDuration}
          onChange={(data: any) => {
            updateSection("videoEnabled", data.enabled);
            updateSection("videoUrl", data.url);
            updateSection("videoTitle", data.title);
            updateSection("videoDescription", data.description);
            updateSection("videoDuration", data.duration);
          }}
        />
      );
    case "button":
      return (
        <ButtonEditor
          text={homepageData.ctaButtonText}
          icon={homepageData.ctaButtonIcon}
          price={homepageData.footerPrice}
          salePrice={homepageData.footerSalePrice}
          saleEndsAt={homepageData.saleEndsAt}
          onChange={(data: any) => {
            updateSection("ctaButtonText", data.text);
            updateSection("ctaButtonIcon", data.icon);
          }}
        />
      );
    case "stats":
      return (
        <StatsEditor
          enabled={homepageData.statsEnabled}
          onChange={(enabled: any) => updateSection("statsEnabled", enabled)}
        />
      );
    case "sections":
      return (
        <CustomSectionEditor
          sections={homepageData.customSections}
          onChange={(sections: any) => updateSection("customSections", sections)}
        />
      );
    case "proof":
      return (
        <ProofSectionEditor
          enabled={homepageData.proofSectionEnabled}
          title={homepageData.proofSectionTitle}
          titleWords={homepageData.proofSectionTitleWords}
          images={homepageData.proofImages}
          onChange={(data: any) => {
            updateSection("proofSectionEnabled", data.enabled);
            updateSection("proofSectionTitle", data.title);
            updateSection("proofSectionTitleWords", data.titleWords);
            updateSection("proofImages", data.images);
          }}
        />
      );
    case "testimonials":
      return (
        <TestimonialEditor
          enabled={homepageData.testimonialsEnabled}
          title={homepageData.testimonialsTitle}
          titleWords={homepageData.testimonialsTitleWords}
          testimonials={homepageData.testimonials}
          onChange={(data: any) => {
            updateSection("testimonialsEnabled", data.enabled);
            updateSection("testimonialsTitle", data.title);
            updateSection("testimonialsTitleWords", data.titleWords);
            updateSection("testimonials", data.testimonials);
          }}
          showPreview={showPreview}
        />
      );
    case "faq":
      return (
        <FAQEditor
          enabled={homepageData.faqEnabled}
          title={homepageData.faqTitle}
          titleWords={homepageData.faqTitleWords}
          faqs={homepageData.faqs}
          onChange={(data: any) => {
            updateSection("faqEnabled", data.enabled);
            updateSection("faqTitle", data.title);
            updateSection("faqTitleWords", data.titleWords);
            updateSection("faqs", data.faqs);
          }}
        />
      );
    case "footer":
      return (
        <FooterEditor
          title={homepageData.footerTitle}
          titleWords={homepageData.footerTitleWords}
          description={homepageData.footerDescription}
          descriptionWords={homepageData.footerDescriptionWords}
          price={homepageData.footerPrice}
          salePrice={homepageData.footerSalePrice}
          icons={homepageData.footerIcons}
          onChange={(data: any) => {
            updateSection("footerTitle", data.title);
            updateSection("footerTitleWords", data.titleWords);
            updateSection("footerDescription", data.description);
            updateSection("footerDescriptionWords", data.descriptionWords);
            updateSection("footerPrice", data.price);
            updateSection("footerSalePrice", data.salePrice);
            updateSection("footerIcons", data.icons);
          }}
        />
      );
    case "badges":
      return (
        <SectionBadgeEditor
          badges={homepageData.sectionBadges}
          sections={getAllSectionsForBadges()}
          onChange={(badges: any) => updateSection("sectionBadges", badges)}
        />
      );
    default:
      return null;
  }
};

export default HomepageBuilder;