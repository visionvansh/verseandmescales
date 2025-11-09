'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaRocket, FaUsers, FaVideo, FaClock, FaFire, FaPlay, FaChevronDown,
  FaStar, FaBolt, FaTrophy, FaImage, FaCheckCircle, FaComments, FaHeadset,
  FaInfinity, FaShieldAlt, FaInstagram, FaPhotoVideo, FaDownload,
  FaQuestionCircle, FaArrowRight, FaArrowLeft, FaChevronRight, FaChevronLeft,
  FaHeart, FaLightbulb, FaGift, FaMagic, FaThumbsUp, FaSmile, FaCrown,
  FaGem, FaChartLine, FaBullseye, FaMedal, FaAward, FaCertificate, // Changed FaDiamond to FaGem, FaTarget to FaBullseye
  FaGraduationCap, FaBook, FaPen, FaPalette, FaMusic, FaCamera, FaMicrophone,
  FaFilm, FaGamepad, FaLaptop, FaMobile, FaDesktop, FaKeyboard, FaMouse,
  FaPrint, FaSave, FaFolder, FaFile, FaClipboard, FaCalendar, FaCreditCard,
  FaShoppingCart, FaStore, FaTag, FaGlobe, FaMapMarker, FaPhone, FaEnvelope,
  FaHome, FaCog, FaBell, FaLock, FaUnlock, FaKey, FaUserCircle, FaUserShield,
  FaHeartbeat, FaDumbbell, FaRunning, FaBicycle, FaSwimmer, FaFootballBall
} from 'react-icons/fa';
import { Spotlight } from "@/components/ui/Spotlight";

// Icon Library (100+ icons)
export const ICON_LIBRARY = {
  // Actions & UI
  FaRocket, FaPlay, FaCheckCircle, FaChevronDown, FaChevronRight, FaChevronLeft,
  FaArrowRight, FaArrowLeft, FaSave, FaCog, FaBell, FaLock, FaUnlock, FaKey,
  
  // Social & Communication
  FaUsers, FaComments, FaHeadset, FaInstagram, FaHeart, FaThumbsUp, FaSmile,
  FaPhone, FaEnvelope, FaGlobe,
  
  // Media & Content
  FaVideo, FaImage, FaPhotoVideo, FaCamera, FaMicrophone, FaFilm, FaMusic,
  FaBook, FaPen, FaPalette,
  
  // Achievement & Success
  FaTrophy, FaStar, FaBolt, FaCrown, FaGem, FaMedal, FaAward, // Removed FaDiamond, kept FaGem
  FaCertificate, FaGraduationCap, FaFire, FaMagic, FaBullseye, FaChartLine, // Changed FaTarget to FaBullseye
  
  // Time & Progress
  FaClock, FaCalendar, FaInfinity,
  
  // Business & Finance
  FaCreditCard, FaShoppingCart, FaStore, FaTag, FaDownload,
  
  // Technology
  FaLaptop, FaMobile, FaDesktop, FaKeyboard, FaMouse, FaGamepad,
  
  // Organization
  FaFolder, FaFile, FaClipboard, FaPrint,
  
  // Security & Trust
  FaShieldAlt, FaUserCircle, FaUserShield,
  
  // Lifestyle & Health
  FaHeartbeat, FaDumbbell, FaRunning, FaBicycle, FaSwimmer, FaFootballBall,
  FaHome, FaMapMarker, FaGift, FaLightbulb, FaQuestionCircle
};

interface TitleConfig {
  lines: number;
  text: string;
  highlights: { word: string; start: number; end: number }[];
}

interface VideoConfig {
  url: string;
  title: string;
  description: string;
}

interface StatsConfig {
  activeStudents: number;
  courseRating: number;
  monthlyIncome: string;
  avgGrowth: string;
}

interface CustomSectionConfig {
  id: string;
  title: TitleConfig;
  sectionType: 'guidance' | 'transformation' | 'timeline';
  cards: CardConfig[];
}

interface CardConfig {
  id: string;
  cardType: 'numbered' | 'points' | 'timeline';
  icon: string;
  emoji?: string;
  stepNumber?: number;
  dayRange?: string;
  title: string;
  description: string;
  points?: string[];
  milestone?: string;
  highlightBox?: string;
  colorGradient: string;
}

interface ProofImageConfig {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  category: string;
}

interface TestimonialConfig {
  id: string;
  name: string;
  niche?: string;
  followers?: string;
  result?: string;
  timeframe?: string;
  highlight: string;
  videoUrl?: string;
  videoLength?: string;
  thumbnail?: string;
  highlightedDetails?: { label: string; value: string }[];
  successStory?: string;
}

interface FAQConfig {
  id: string;
  question: string;
  answer: string;
}

interface HomepageConfig {
  heroTitle: TitleConfig;
  heroSubheading: TitleConfig;
  heroVideo?: VideoConfig;
  heroButtonText: string;
  stats: StatsConfig;
  customSections: CustomSectionConfig[];
  proofSectionTitle: TitleConfig;
  proofImages: ProofImageConfig[];
  testimonialsEnabled: boolean;
  testimonialsTitle: string;
  testimonials: TestimonialConfig[];
  faqs: FAQConfig[];
  footerText?: string;
  footerHighlightText?: string;
  footerIcon: string;
}

// Default configuration
const DEFAULT_CONFIG: HomepageConfig = {
  heroTitle: {
    lines: 2,
    text: "BUILD A FACELESS INSTAGRAM EMPIRE",
    highlights: [{ word: "FACELESS", start: 8, end: 16 }]
  },
  heroSubheading: {
    lines: 1,
    text: "Learn the exact system that helped 15,000+ students grow from 0 to 100K+ followers and earn $5K-$20K/month without showing their face",
    highlights: [
      { word: "15,000+ students", start: 40, end: 56 },
      { word: "0 to 100K+ followers", start: 67, end: 87 },
      { word: "$5K-$20K/month", start: 97, end: 111 }
    ]
  },
  heroButtonText: "START YOUR JOURNEY NOW",
  stats: {
    activeStudents: 15000,
    courseRating: 4.9,
    monthlyIncome: "$5K-20K",
    avgGrowth: "100K+"
  },
  customSections: [],
  proofSectionTitle: {
    lines: 2,
    text: "REAL PROOF FROM REAL STUDENTS",
    highlights: [{ word: "REAL STUDENTS", start: 16, end: 29 }]
  },
  proofImages: [],
  testimonialsEnabled: true,
  testimonialsTitle: "Hear it from our students",
  testimonials: [],
  faqs: [],
  footerIcon: "FaRocket"
};

export default function HomepageCustomizer() {
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<'preview' | 'customize'>('customize');
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Title customization helper
  const renderTitle = (titleConfig: TitleConfig) => {
    const lines = titleConfig.text.split('');
    return lines.map((line, lineIndex) => {
      let result: React.ReactNode[] = [];
      let lastIndex = 0;
      
      titleConfig.highlights.forEach(highlight => {
        const lineStartIndex = titleConfig.text.split('').slice(0, lineIndex).join('').length + (lineIndex > 0 ? lineIndex : 0);
        const lineEndIndex = lineStartIndex + line.length;
        
        if (highlight.start >= lineStartIndex && highlight.start < lineEndIndex) {
          const relativeStart = highlight.start - lineStartIndex;
          const relativeEnd = Math.min(highlight.end - lineStartIndex, line.length);
          
          if (relativeStart > lastIndex) {
            result.push(<span key={`normal-${lastIndex}`}>{line.slice(lastIndex, relativeStart)}</span>);
          }
          
          result.push(
            <span key={`highlight-${relativeStart}`} className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              {line.slice(relativeStart, relativeEnd)}
            </span>
          );
          
          lastIndex = relativeEnd;
        }
      });
      
      if (lastIndex < line.length) {
        result.push(<span key={`normal-${lastIndex}`}>{line.slice(lastIndex)}</span>);
      }
      
      return (
        <React.Fragment key={lineIndex}>
          {result}
          {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="relative w-full min-h-screen bg-black">
      {/* Tab Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-red-500/30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('customize')}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                activeTab === 'customize'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              🎨 Customize
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                activeTab === 'preview'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              👁️ Preview
            </button>
            <button
              onClick={() => {/* Save to database */}}
              className="ml-auto px-6 py-3 rounded-lg font-bold bg-green-600 hover:bg-green-700 text-white transition-all"
            >
              💾 Save Homepage
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20">
        {activeTab === 'customize' ? (
          <CustomizePanel config={config} setConfig={setConfig} />
        ) : (
          <PreviewPanel config={config} />
        )}
      </div>
    </div>
  );
}

// Customization Panel Component
function CustomizePanel({ 
  config, 
  setConfig 
}: { 
  config: HomepageConfig; 
  setConfig: React.Dispatch<React.SetStateAction<HomepageConfig>> 
}) {
  const [openSection, setOpenSection] = useState<string | null>('hero');

  const sections = [
    { id: 'hero', label: '🎯 Hero Section', icon: FaRocket },
    { id: 'video', label: '🎥 Video Section', icon: FaVideo },
    { id: 'button', label: '🔘 CTA Button', icon: FaBolt },
    { id: 'stats', label: '📊 Stats Cards', icon: FaChartLine },
    { id: 'custom', label: '📦 Custom Sections (0/5)', icon: FaGift },
    { id: 'proof', label: '🖼️ Proof Gallery', icon: FaImage },
    { id: 'testimonials', label: '⭐ Testimonials', icon: FaStar },
    { id: 'faq', label: '❓ FAQ Section', icon: FaQuestionCircle },
    { id: 'footer', label: '👣 Footer', icon: FaCheckCircle }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="space-y-4">
        {sections.map(section => (
          <motion.div
            key={section.id}
            className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-red-900/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <section.icon className="text-red-400 text-2xl" />
                <span className="text-white font-bold text-lg">{section.label}</span>
              </div>
              <FaChevronDown 
                className={`text-red-400 transition-transform ${openSection === section.id ? 'rotate-180' : ''}`}
              />
            </button>
            
            <AnimatePresence>
              {openSection === section.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-red-500/20"
                >
                  <div className="p-6">
                    {section.id === 'hero' && <HeroCustomizer config={config} setConfig={setConfig} />}
                    {section.id === 'video' && <VideoCustomizer config={config} setConfig={setConfig} />}
                    {section.id === 'button' && <ButtonCustomizer config={config} setConfig={setConfig} />}
                    {section.id === 'stats' && <StatsCustomizer config={config} setConfig={setConfig} />}
                    {section.id === 'custom' && <CustomSectionsManager config={config} setConfig={setConfig} />}
                    {section.id === 'proof' && <ProofGalleryCustomizer config={config} setConfig={setConfig} />}
                    {section.id === 'testimonials' && <TestimonialsCustomizer config={config} setConfig={setConfig} />}
                    {section.id === 'faq' && <FAQCustomizer config={config} setConfig={setConfig} />}
                    {section.id === 'footer' && <FooterCustomizer config={config} setConfig={setConfig} />}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Individual Customizer Components
function HeroCustomizer({ config, setConfig }: { config: HomepageConfig; setConfig: React.Dispatch<React.SetStateAction<HomepageConfig>> }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-white font-bold mb-2">Title Lines</label>
        <div className="flex gap-2">
          {[1, 2, 3].map(lines => (
            <button
              key={lines}
              onClick={() => setConfig({...config, heroTitle: {...config.heroTitle, lines}})}
              className={`px-4 py-2 rounded-lg font-bold ${
                config.heroTitle.lines === lines
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              {lines} Line{lines > 1 ? 's' : ''}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-white font-bold mb-2">Title Text</label>
        <textarea
          value={config.heroTitle.text}
          onChange={(e) => setConfig({...config, heroTitle: {...config.heroTitle, text: e.target.value}})}
          className="w-full px-4 py-3 bg-gray-800 border border-red-500/30 rounded-lg text-white"
          rows={config.heroTitle.lines}
          placeholder="Enter your title (use 
 for line breaks)"
        />
      </div>

      <div>
        <label className="block text-white font-bold mb-2">Highlight Words</label>
        <p className="text-gray-400 text-sm mb-2">Select words in your title to highlight in red gradient</p>
        {/* Add word selection UI here */}
      </div>

      {/* Similar structure for subheading */}
      <div className="pt-6 border-t border-red-500/20">
        <h3 className="text-white font-bold text-lg mb-4">Subheading</h3>
        {/* Repeat similar controls for subheading */}
      </div>
    </div>
  );
}

function VideoCustomizer({ config, setConfig }: { config: HomepageConfig; setConfig: React.Dispatch<React.SetStateAction<HomepageConfig>> }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-white font-bold mb-2">Video URL</label>
        <input
          type="url"
          value={config.heroVideo?.url || ''}
          onChange={(e) => setConfig({
            ...config,
            heroVideo: { ...config.heroVideo, url: e.target.value, title: config.heroVideo?.title || '', description: config.heroVideo?.description || '' }
          })}
          className="w-full px-4 py-3 bg-gray-800 border border-red-500/30 rounded-lg text-white"
          placeholder="https://youtube.com/embed/..."
        />
      </div>
      
      <div>
        <label className="block text-white font-bold mb-2">Video Title</label>
        <input
          type="text"
          value={config.heroVideo?.title || ''}
          onChange={(e) => setConfig({
            ...config,
            heroVideo: { ...config.heroVideo, title: e.target.value, url: config.heroVideo?.url || '', description: config.heroVideo?.description || '' }
          })}
          className="w-full px-4 py-3 bg-gray-800 border border-red-500/30 rounded-lg text-white"
          placeholder="Watch the Full Course Overview"
        />
      </div>

      <div>
        <label className="block text-white font-bold mb-2">Video Description</label>
        <textarea
          value={config.heroVideo?.description || ''}
          onChange={(e) => setConfig({
            ...config,
            heroVideo: { ...config.heroVideo, description: e.target.value, url: config.heroVideo?.url || '', title: config.heroVideo?.title || '' }
          })}
          className="w-full px-4 py-3 bg-gray-800 border border-red-500/30 rounded-lg text-white"
          rows={2}
          placeholder="See exactly what's inside..."
        />
      </div>
    </div>
  );
}

function ButtonCustomizer({ config, setConfig }: { config: HomepageConfig; setConfig: React.Dispatch<React.SetStateAction<HomepageConfig>> }) {
  return (
    <div>
      <label className="block text-white font-bold mb-2">Button Text</label>
      <input
        type="text"
        value={config.heroButtonText}
        onChange={(e) => setConfig({...config, heroButtonText: e.target.value})}
        className="w-full px-4 py-3 bg-gray-800 border border-red-500/30 rounded-lg text-white font-bold text-center text-xl"
        placeholder="START YOUR JOURNEY NOW"
      />
      <p className="text-gray-400 text-sm mt-2">
        Design is locked to match InstagramCourseHomepage style
      </p>
    </div>
  );
}

function StatsCustomizer({ config, setConfig }: { config: HomepageConfig; setConfig: React.Dispatch<React.SetStateAction<HomepageConfig>> }) {
  return (
    <div className="space-y-4">
      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
        <p className="text-yellow-400 text-sm">
          ⚠️ These stats are fetched from your database. Values shown here are for preview only.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-white font-bold mb-2">Active Students</label>
          <input
            type="number"
            value={config.stats.activeStudents}
            onChange={(e) => setConfig({
              ...config,
              stats: { ...config.stats, activeStudents: parseInt(e.target.value) }
            })}
            className="w-full px-4 py-3 bg-gray-800 border border-red-500/30 rounded-lg text-white"
            disabled
          />
        </div>

        <div>
          <label className="block text-white font-bold mb-2">Course Rating</label>
          <input
            type="number"
            step="0.1"
            value={config.stats.courseRating}
            onChange={(e) => setConfig({
              ...config,
              stats: { ...config.stats, courseRating: parseFloat(e.target.value) }
            })}
            className="w-full px-4 py-3 bg-gray-800 border border-red-500/30 rounded-lg text-white"
            disabled
          />
        </div>

        <div>
          <label className="block text-white font-bold mb-2">Monthly Income</label>
          <input
            type="text"
            value={config.stats.monthlyIncome}
            onChange={(e) => setConfig({
              ...config,
              stats: { ...config.stats, monthlyIncome: e.target.value }
            })}
            className="w-full px-4 py-3 bg-gray-800 border border-red-500/30 rounded-lg text-white"
            disabled
          />
        </div>

        <div>
          <label className="block text-white font-bold mb-2">Avg. Growth</label>
          <input
            type="text"
            value={config.stats.avgGrowth}
            onChange={(e) => setConfig({
              ...config,
              stats: { ...config.stats, avgGrowth: e.target.value }
            })}
            className="w-full px-4 py-3 bg-gray-800 border border-red-500/30 rounded-lg text-white"
            disabled
          />
        </div>
      </div>
    </div>
  );
}

function CustomSectionsManager({ config, setConfig }: { config: HomepageConfig; setConfig: React.Dispatch<React.SetStateAction<HomepageConfig>> }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-gray-400">
          Add up to 5 custom sections with different card layouts
        </p>
        <button
          onClick={() => {/* Add new section */}}
          disabled={config.customSections.length >= 5}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-bold"
        >
          + Add Section ({config.customSections.length}/5)
        </button>
      </div>

      {config.customSections.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No custom sections yet. Click "Add Section" to create one.
        </div>
      )}

      {/* List existing sections */}
      {config.customSections.map((section: CustomSectionConfig, index: number) => (
        <div key={section.id} className="bg-gray-800/50 rounded-lg p-4 border border-red-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-bold">Section {index + 1}: {section.title.text}</span>
            <button
              onClick={() => {/* Remove section */}}
              className="text-red-400 hover:text-red-300"
            >
              🗑️ Remove
            </button>
          </div>
          <p className="text-gray-400 text-sm">Type: {section.sectionType} • Cards: {section.cards.length}</p>
        </div>
      ))}
    </div>
  );
}

function ProofGalleryCustomizer({ config, setConfig }: { config: HomepageConfig; setConfig: React.Dispatch<React.SetStateAction<HomepageConfig>> }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-white font-bold mb-2">Section Title</label>
        <input
          type="text"
          value={config.proofSectionTitle.text}
          onChange={(e) => setConfig({
            ...config,
            proofSectionTitle: { ...config.proofSectionTitle, text: e.target.value }
          })}
          className="w-full px-4 py-3 bg-gray-800 border border-red-500/30 rounded-lg text-white"
          placeholder="REAL PROOF FROM
REAL STUDENTS"
        />
      </div>

      <div>
        <button
          onClick={() => {/* Add proof image */}}
          className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold"
        >
          + Add Proof Image
        </button>
      </div>

      {config.proofImages.map((proof: ProofImageConfig, index: number) => (
        <div key={proof.id} className="bg-gray-800/50 rounded-lg p-4 border border-red-500/20">
          <input
            type="text"
            value={proof.title}
            onChange={(e) => {/* Update proof title */}}
            className="w-full mb-2 px-3 py-2 bg-gray-900 border border-red-500/30 rounded text-white"
            placeholder="Proof title..."
          />
          <input
            type="text"
            value={proof.imageUrl}
            onChange={(e) => {/* Update image URL */}}
            className="w-full px-3 py-2 bg-gray-900 border border-red-500/30 rounded text-white"
            placeholder="Image URL..."
          />
        </div>
      ))}
    </div>
  );
}

function TestimonialsCustomizer({ config, setConfig }: { config: HomepageConfig; setConfig: React.Dispatch<React.SetStateAction<HomepageConfig>> }) {
  const titleOptions = [
    "Hear it from our students",
    "Our testimonies",
    "From Our Learners",
    "Their Journey, Their Words",
    "Why They Chose Us",
    "Proven Results"
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center gap-2 text-white font-bold mb-4">
          <input
            type="checkbox"
            checked={config.testimonialsEnabled}
            onChange={(e) => setConfig({...config, testimonialsEnabled: e.target.checked})}
            className="w-5 h-5"
          />
          Enable Testimonials Section
        </label>
      </div>

      {config.testimonialsEnabled && (
        <>
          <div>
            <label className="block text-white font-bold mb-2">Section Title</label>
            <select
              value={config.testimonialsTitle}
              onChange={(e) => setConfig({...config, testimonialsTitle: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800 border border-red-500/30 rounded-lg text-white"
            >
              {titleOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {/* Add testimonial */}}
            className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold"
          >
            + Add Testimonial
          </button>
        </>
      )}
    </div>
  );
}

function FAQCustomizer({ config, setConfig }: { config: HomepageConfig; setConfig: React.Dispatch<React.SetStateAction<HomepageConfig>> }) {
  return (
    <div className="space-y-4">
      <button
        onClick={() => {/* Add FAQ */}}
        className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold"
      >
        + Add FAQ
      </button>

      {config.faqs.map((faq: FAQConfig, index: number) => (
        <div key={faq.id} className="bg-gray-800/50 rounded-lg p-4 border border-red-500/20">
          <input
            type="text"
            value={faq.question}
            onChange={(e) => {/* Update question */}}
            className="w-full mb-2 px-3 py-2 bg-gray-900 border border-red-500/30 rounded text-white font-bold"
            placeholder="Question..."
          />
          <textarea
            value={faq.answer}
            onChange={(e) => {/* Update answer */}}
            className="w-full px-3 py-2 bg-gray-900 border border-red-500/30 rounded text-white"
            rows={3}
            placeholder="Answer..."
          />
        </div>
      ))}
    </div>
  );
}

function FooterCustomizer({ config, setConfig }: { config: HomepageConfig; setConfig: React.Dispatch<React.SetStateAction<HomepageConfig>> }) {
  const iconOptions = Object.keys(ICON_LIBRARY).slice(0, 20); // Show first 20 icons

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-white font-bold mb-2">Normal Text</label>
        <input
          type="text"
          value={config.footerText || ''}
          onChange={(e) => setConfig({...config, footerText: e.target.value})}
          className="w-full px-4 py-3 bg-gray-800 border border-red-500/30 rounded-lg text-white"
          placeholder="Ready to start your"
        />
      </div>

      <div>
        <label className="block text-white font-bold mb-2">Highlighted Text (Red)</label>
        <input
          type="text"
          value={config.footerHighlightText || ''}
          onChange={(e) => setConfig({...config, footerHighlightText: e.target.value})}
          className="w-full px-4 py-3 bg-gray-800 border border-red-500/30 rounded-lg text-white"
          placeholder="Instagram Empire"
        />
      </div>

      <div>
        <label className="block text-white font-bold mb-2">Icon</label>
        <div className="grid grid-cols-6 gap-2">
          {iconOptions.map(iconName => {
            const IconComponent = ICON_LIBRARY[iconName as keyof typeof ICON_LIBRARY];
            return (
              <button
                key={iconName}
                onClick={() => setConfig({...config, footerIcon: iconName})}
                className={`p-3 rounded-lg border-2 transition-all ${
                  config.footerIcon === iconName
                    ? 'border-red-500 bg-red-900/30'
                    : 'border-gray-700 bg-gray-800 hover:border-red-500/50'
                }`}
              >
                <IconComponent className="text-2xl text-red-400 mx-auto" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Preview Panel Component (continued in next part due to length...)
function PreviewPanel({ config }: { config: HomepageConfig }) {
  const [activeModule, setActiveModule] = useState<number | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeProofImage, setActiveProofImage] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const renderTitle = (titleConfig: TitleConfig) => {
    const lines = titleConfig.text.split('');
    return lines.map((line, lineIndex) => {
      let result: React.ReactNode[] = [];
      let lastIndex = 0;
      
      titleConfig.highlights.forEach(highlight => {
        const lineStartIndex = titleConfig.text.split('').slice(0, lineIndex).join('').length + (lineIndex > 0 ? lineIndex : 0);
        const lineEndIndex = lineStartIndex + line.length;
        
        if (highlight.start >= lineStartIndex && highlight.start < lineEndIndex) {
          const relativeStart = highlight.start - lineStartIndex;
          const relativeEnd = Math.min(highlight.end - lineStartIndex, line.length);
          
          if (relativeStart > lastIndex) {
            result.push(<span key={`normal-${lastIndex}`}>{line.slice(lastIndex, relativeStart)}</span>);
          }
          
          result.push(
            <span key={`highlight-${relativeStart}`} className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              {line.slice(relativeStart, relativeEnd)}
            </span>
          );
          
          lastIndex = relativeEnd;
        }
      });
      
      if (lastIndex < line.length) {
        result.push(<span key={`normal-${lastIndex}`}>{line.slice(lastIndex)}</span>);
      }
      
      return (
        <React.Fragment key={lineIndex}>
          {result}
          {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="relative w-full min-h-screen bg-black overflow-x-hidden">
      {/* Background Effects - Same as InstagramCourseHomepage */}
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

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative w-full min-h-screen flex items-center justify-center py-20">
          <div className="w-full max-w-[1800px] mx-auto px-8">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Course Badge */}
              <motion.div
                className="inline-block bg-gradient-to-r from-red-900/30 to-red-900/30 border border-red-500/30 px-6 py-3 rounded-full mb-8 backdrop-blur-xl"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-red-400 font-bold text-lg flex items-center gap-2">
                  <FaInstagram /> INSTAGRAM GROWTH MASTERCLASS 2025
                </span>
              </motion.div>

              {/* Main Headline */}
              <h1 className="text-[112px] font-black text-white leading-[1.1] mb-8 px-4">
                {renderTitle(config.heroTitle)}
              </h1>

              {/* Subheadline */}
              <p className="text-3xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed px-4">
                {renderTitle(config.heroSubheading)}
              </p>

              {/* Video Section */}
              {config.heroVideo && (
                <motion.div
                  className="max-w-5xl mx-auto mb-12"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  <div className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border-2 border-red-500/40 rounded-3xl overflow-hidden backdrop-blur-xl shadow-[0_0_60px_rgba(239,68,68,0.3)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent pointer-events-none" />
                    
                    <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-black">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          className="relative z-10 cursor-pointer"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="w-36 h-36 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.6)]">
                            <FaPlay className="text-white text-5xl ml-2" />
                          </div>
                        </motion.div>

                        <div className="absolute bottom-6 left-6 right-6">
                          <div className="bg-black/80 backdrop-blur-md rounded-xl p-4 border border-red-500/30">
                            <div className="flex items-center gap-3 mb-2">
                              <FaVideo className="text-red-400 text-xl" />
                              <span className="text-white font-bold text-lg">{config.heroVideo.title}</span>
                            </div>
                            <p className="text-gray-300 text-sm">{config.heroVideo.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10 bg-gradient-to-r from-gray-900/95 to-black/95 border-t border-red-500/20 px-6 py-4">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                          <FaCheckCircle className="text-red-400" />
                          <span>{config.stats.activeStudents.toLocaleString()}+ Students</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <FaStar className="text-red-400" />
                          <span>{config.stats.courseRating}/5 Rating</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <FaTrophy className="text-red-400" />
                          <span>Proven Results</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* CTA Button */}
              <motion.button
                className="bg-gradient-to-r from-red-600 to-red-700 text-white font-black py-8 px-16 rounded-2xl text-3xl inline-flex items-center justify-center gap-4 mb-12 shadow-[0_0_60px_rgba(239,68,68,0.5)]"
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: "0 0 80px rgba(239,68,68,0.8)" 
                }}
                whileTap={{ scale: 0.98 }}
              >
                <FaRocket className="text-4xl" />
                <span>{config.heroButtonText}</span>
              </motion.button>

              {/* Social Proof Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
                {[
                  { icon: FaUsers, value: `${config.stats.activeStudents.toLocaleString()}+`, label: "Active Students" },
                  { icon: FaInstagram, value: config.stats.avgGrowth, label: "Avg. Growth" },
                  { icon: FaTrophy, value: config.stats.monthlyIncome, label: "Monthly Income" },
                  { icon: FaStar, value: config.stats.courseRating.toFixed(1) + "/5", label: "Course Rating" }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-2xl p-6 backdrop-blur-xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    whileHover={{ y: -5, borderColor: "rgba(239, 68, 68, 0.6)" }}
                  >
                    <stat.icon className="text-red-400 text-4xl mx-auto mb-3" />
                    <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                    <div className="text-gray-400 text-base">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Custom Sections would render here */}
        {config.customSections.map((section, index) => (
          <section key={section.id} className="relative w-full py-20">
            {/* Render custom section based on type */}
          </section>
        ))}

        {/* Proof Gallery Section */}
        {config.proofImages.length > 0 && (
          <section className="relative w-full py-20">
            <div className="w-full max-w-[1800px] mx-auto px-8">
              <motion.div
                className="text-center mb-16"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <h2 className="text-[72px] font-black text-white leading-[1.1] mb-4">
                  {renderTitle(config.proofSectionTitle)}
                </h2>
              </motion.div>

              {/* Proof gallery carousel */}
              <motion.div
                className="relative max-w-4xl mx-auto mb-12 bg-gradient-to-br from-gray-900/90 to-black/95 border-2 border-red-500/40 rounded-3xl overflow-hidden backdrop-blur-xl"
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
                    <div className="text-center p-12 relative z-10">
                      <FaImage className="text-red-400 text-8xl mx-auto mb-6" />
                      <h3 className="text-3xl font-black text-white mb-2">
                        {config.proofImages[activeProofImage]?.title}
                      </h3>
                      <p className="text-gray-300 text-xl mb-4">
                        {config.proofImages[activeProofImage]?.description}
                      </p>
                      <div className="inline-block bg-red-500/20 border border-red-500/40 px-4 py-2 rounded-full">
                        <span className="text-red-400 font-bold flex items-center gap-2">
                          <FaCheckCircle /> Verified Proof
                        </span>
                      </div>
                    </div>

                    <div className="absolute top-4 left-4 bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 rounded-full">
                      <span className="text-white font-bold text-sm">
                        {config.proofImages[activeProofImage]?.category}
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="p-6 border-t border-red-500/20 relative z-10">
                  <div className="flex items-center justify-between gap-4">
                    <button
                      onClick={() => setActiveProofImage((prev) => (prev === 0 ? config.proofImages.length - 1 : prev - 1))}
                      className="bg-gray-900/50 border border-red-500/30 px-6 py-3 rounded-xl text-white font-bold hover:bg-red-900/30 transition-colors"
                    >
                      ← Previous
                    </button>
                    <div className="text-gray-400 text-sm">
                      {activeProofImage + 1} / {config.proofImages.length}
                    </div>
                    <button
                      onClick={() => setActiveProofImage((prev) => (prev + 1) % config.proofImages.length)}
                      className="bg-gray-900/50 border border-red-500/30 px-6 py-3 rounded-xl text-white font-bold hover:bg-red-900/30 transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* Testimonials Section */}
        {config.testimonialsEnabled && config.testimonials.length > 0 && (
          <section className="relative w-full py-20 bg-gradient-to-b from-black via-red-950/10 to-black">
            <div className="w-full max-w-[1800px] mx-auto px-8">
              <motion.div
                className="text-center mb-12"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <h2 className="text-[72px] font-black text-white leading-[1.1] mb-4">
                  {config.testimonialsTitle.toUpperCase()}
                </h2>
              </motion.div>

              {/* Testimonials carousel */}
            </div>
          </section>
        )}

        {/* FAQ Section */}
        {config.faqs.length > 0 && (
          <section className="relative w-full py-20">
            <div className="w-full max-w-[1800px] mx-auto px-8">
              <motion.div
                className="text-center mb-12"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <h2 className="text-[72px] font-black text-white leading-[1.1] mb-4">
                  GOT <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">QUESTIONS?</span>
                </h2>
              </motion.div>

              <div className="max-w-4xl mx-auto space-y-5">
                {config.faqs.map((faq, index) => (
                  <motion.div
                    key={faq.id}
                    className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-2xl overflow-hidden backdrop-blur-xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <button
                      onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                      className="w-full text-left p-6 flex items-start justify-between gap-4 hover:bg-red-900/10 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-white pr-2">
                          {faq.question}
                        </h3>
                      </div>
                      <div className={`flex-shrink-0 w-8 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center transition-transform ${
                        activeFaq === index ? 'rotate-180' : ''
                      }`}>
                        <FaChevronDown className="text-white" />
                      </div>
                    </button>

                    <AnimatePresence>
                      {activeFaq === index && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-red-500/20"
                        >
                          <div className="p-6 bg-red-900/5">
                            <p className="text-gray-300 leading-relaxed text-lg">
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

        {/* Footer CTA */}
        <section className="relative w-full py-24 bg-gradient-to-b from-black via-red-950/20 to-black">
          <div className="w-full max-w-[1800px] mx-auto px-8">
            <motion.div
              className="relative bg-gradient-to-br from-gray-900/90 to-black/95 border-2 border-red-500/50 rounded-[2.5rem] p-20 text-center overflow-hidden backdrop-blur-xl"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-transparent" />
              
              <div className="relative z-10">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-block mb-8"
                >
                  {React.createElement(ICON_LIBRARY[config.footerIcon as keyof typeof ICON_LIBRARY] || FaRocket, {
                    className: "text-red-400 text-8xl"
                  })}
                </motion.div>

                <h2 className="text-[72px] font-black text-white leading-[1.1] mb-6">
                  {config.footerText && <>{config.footerText} </>}
                  {config.footerHighlightText && (
                    <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                      {config.footerHighlightText}
                    </span>
                  )}
                </h2>

                <motion.button
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white font-black py-8 px-16 rounded-2xl text-3xl inline-flex items-center justify-center gap-4 shadow-[0_0_60px_rgba(239,68,68,0.6)]"
                  whileHover={{ 
                    scale: 1.05, 
                    boxShadow: "0 0 80px rgba(239,68,68,0.8)" 
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FaRocket className="text-4xl" />
                  <span>ENROLL NOW</span>
                </motion.button>

                <div className="flex flex-wrap items-center justify-center gap-6 text-gray-400 text-base mt-8">
                  <div className="flex items-center gap-2">
                    <FaShieldAlt className="text-red-400" />
                    <span>30-Day Money-Back Guarantee</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-2">
                    <FaInfinity className="text-red-400" />
                    <span>Lifetime Access</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-2">
                    <FaStar className="text-red-400" />
                    <span>Premium Support</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}