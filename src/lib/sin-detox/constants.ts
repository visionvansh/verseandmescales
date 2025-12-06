//Volumes/vision/codes/course/my-app/src/lib/sin-detox/constants.ts
import {
  FaBrain,
  FaDna,
  FaStopwatch,
  FaPray,
  FaShieldAlt,
  FaFistRaised,
  FaCheckCircle,
  FaUsers,
  FaBolt,
  FaHeart,
} from "react-icons/fa";
import type { Module, Feature, Testimonial, FAQItem, PricingTier, StatItem, HeroConfig } from "./types";

export const SITE_CONFIG = {
  name: "VerseAndMe",
  tagline: "Sin Detox Protocol",
  supportEmail: "support@verseandme.com",
  socialLinks: {
    twitter: "https://twitter.com/verseandme",
    instagram: "https://instagram.com/verseandme",
    youtube: "https://youtube.com/@verseandme",
  },
} as const;

// ===== HERO MEDIA PATHS - EDIT THESE =====
export const HERO_BACKGROUND_DESKTOP = "/img2.png";
export const HERO_BACKGROUND_MOBILE = "/bigg.png";
export const HERO_VIDEO_URL = "https://www.youtube.com/embed/your-video-id";
// =========================================

export const HERO_CONFIG: HeroConfig = {
  background: {
    desktop: HERO_BACKGROUND_DESKTOP,
    mobile: HERO_BACKGROUND_MOBILE,
    alt: "Sin Detox Protocol Background",
  },
  badge: {
    text: "System Override Protocol",
    icon: true,
  },
  headline: {
    line1: "SIN",
    line2: "DETOX",
  },
  subheadline: {
    text: "",
    highlight: "30-DAY DISCIPLINE BLUEPRINT",
  },
  cta: {
    primary: {
      text: "START THE PROTOCOL",
    },
    secondary: {
      text: "WATCH BRIEFING",
      videoUrl: HERO_VIDEO_URL,
    },
  },
  stats: {
    rating: 4.9,
    totalUsers: "12,000+",
  },
};

export const COURSE_MODULES: Module[] = [
  {
    id: 1,
    slug: "understanding-sin",
    title: "Understanding Sin, Temptation & Self-Sabotage",
    duration: "20–25 mins",
    icon: FaBrain,
    hook: "The battle isn't outside—your enemy is inside.",
    lessons: [
      {
        id: "1-1",
        title: "The Real Meaning of 'Sin'",
        description: "Patterns that destroy your future. Why habits feel stronger than willpower.",
        duration: "8 min",
      },
      {
        id: "1-2",
        title: "The Psychology Behind Temptation",
        description: "Dopamine loops, brain traps, and how social media algorithms hack your mind.",
        duration: "10 min",
      },
      {
        id: "1-3",
        title: "The Identity Trap",
        description: "Why motivation fails but identity shifts work.",
        duration: "7 min",
      },
    ],
  },
  {
    id: 2,
    slug: "root-causes",
    title: "Root Causes: Why You Keep Falling Back",
    duration: "20 mins",
    icon: FaDna,
    lessons: [
      {
        id: "2-1",
        title: "Emotional Triggers & Hidden Wounds",
        description: "Trauma, loneliness, boredom, and fear controlling decisions.",
        duration: "8 min",
      },
      {
        id: "2-2",
        title: "The 3 Types of Temptation Loops",
        description: "Habit loop, Emotional loop, Environmental loop.",
        duration: "6 min",
      },
      {
        id: "2-3",
        title: "The 'Night-Time Weakness' Effect",
        description: "Why you fall at night and how to break it permanently.",
        duration: "6 min",
      },
    ],
  },
  {
    id: 3,
    slug: "discipline-framework",
    title: "Discipline Framework to Replace Any Sinful Habit",
    duration: "30–35 mins",
    icon: FaStopwatch,
    hook: "You don't remove sin — you replace it.",
    isPremium: true,
    lessons: [
      {
        id: "3-1",
        title: "The 3-Day Reset",
        description: "How to reset brain dopamine in 72 hours.",
        duration: "12 min",
      },
      {
        id: "3-2",
        title: "The 6-Point Discipline Formula",
        description: "Time blocking, Focus sprints, Dopamine layering, Restriction & Reward.",
        duration: "15 min",
      },
      {
        id: "3-3",
        title: "Rewiring the Reward Center",
        description: "Replace bad pleasure with powerful pleasure.",
        duration: "8 min",
      },
    ],
  },
  {
    id: 4,
    slug: "spiritual-methods",
    title: "Spiritual + Psychological Methods",
    duration: "25 mins",
    icon: FaPray,
    lessons: [
      {
        id: "4-1",
        title: "Visualize. Speak. Break the Urge",
        description: "Verses for mind renewal, mental reprogramming, identity building.",
        duration: "15 min",
      },
      {
        id: "4-2",
        title: "Fasting for Discipline",
        description: "How fasting rewires self-control & the 4 types you should use.",
        duration: "10 min",
      },
    ],
  },
  {
    id: 5,
    slug: "building-discipline",
    title: "Building Discipline That Sticks for Life",
    duration: "Lifetime Skill",
    icon: FaShieldAlt,
    isPremium: true,
    lessons: [
      {
        id: "5-1",
        title: "The Art of Energy Transmutation",
        description: "Don't fight alone. Build a circle that pushes you to greatness.",
        duration: "12 min",
      },
      {
        id: "5-2",
        title: "Temptation Killer Environment",
        description: "Redesign your room, phone, and digital world to remove triggers automatically.",
        duration: "10 min",
      },
    ],
  },
  {
    id: 6,
    slug: "unstoppable-person",
    title: "Becoming an Unstoppable Person",
    duration: "20–25 mins",
    icon: FaFistRaised,
    hook: "Failure is not the end — it's the beginning.",
    lessons: [
      {
        id: "6-1",
        title: "Rebuild After Failure",
        description: "Shame removal and identity rebuild strategy.",
        duration: "12 min",
      },
      {
        id: "6-2",
        title: "Installing Warrior Discipline",
        description: "The final mindset shift to live with purpose.",
        duration: "10 min",
      },
    ],
  },
];

export const FEATURES: Feature[] = [
  {
    id: "neuroscience",
    title: "Neuroscience",
    subtitle: "Dopamine & Brain Plasticity",
    icon: FaBrain,
    description: "We don't use willpower. We use biology.",
  },
  {
    id: "action-plans",
    title: "Action Plans",
    subtitle: "No Fluff. Pure Tactics.",
    icon: FaCheckCircle,
    description: "Specific 3-day resets and 6-point formulas.",
  },
  {
    id: "identity-shift",
    title: "Identity Shift",
    subtitle: "Psychological Rebirth",
    icon: FaDna,
    description: "Stop fighting sin. Outgrow it entirely.",
  },
  {
    id: "war-room",
    title: "War Room",
    subtitle: "Brotherhood & Community",
    icon: FaShieldAlt,
    description: "You cannot win this war alone. Join us.",
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    name: "Marcus T.",
    avatar: "/avatars/marcus.jpg",
    role: "Software Engineer",
    content: "After 15 years of struggling, this protocol finally broke the cycle. The 3-Day Reset was a game-changer. I'm 6 months clean now.",
    rating: 5,
    verified: true,
  },
  {
    id: "t2",
    name: "David K.",
    avatar: "/avatars/david.jpg",
    role: "Business Owner",
    content: "The identity shift module completely changed how I see myself. I don't fight urges anymore—I simply don't have them the same way.",
    rating: 5,
    verified: true,
  },
  {
    id: "t3",
    name: "James R.",
    avatar: "/avatars/james.jpg",
    role: "College Student",
    content: "I was skeptical at first, but the science-backed approach made sense. My focus, energy, and confidence are through the roof.",
    rating: 5,
    verified: true,
  },
  {
    id: "t4",
    name: "Michael S.",
    avatar: "/avatars/michael.jpg",
    role: "Pastor",
    content: "I've recommended this to my congregation. It combines spiritual truth with practical psychology in a way I've never seen before.",
    rating: 5,
    verified: true,
  },
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: "faq-1",
    question: "How is this different from other programs?",
    answer: "Sin Detox combines cutting-edge neuroscience with spiritual principles. We don't just tell you to 'try harder'—we rewire the brain pathways that create temptation in the first place. Our 3-Day Reset protocol has a 94% success rate in breaking initial addiction cycles.",
  },
  {
    id: "faq-2",
    question: "How long until I see results?",
    answer: "Most members report significant shifts within the first 72 hours of starting the protocol. Full transformation typically occurs over 30-90 days as you rebuild neural pathways and establish your new identity.",
  },
  {
    id: "faq-3",
    question: "Is this a religious program?",
    answer: "Sin Detox is spiritually-grounded but practically-focused. We incorporate timeless spiritual wisdom alongside modern psychology and neuroscience. People of all faiths (and no faith) have found success with our methods.",
  },
  {
    id: "faq-4",
    question: "What if I fail or relapse?",
    answer: "Module 6 is dedicated entirely to rebuilding after failure. Relapse is not the end—it's data. Our shame-removal protocol helps you bounce back stronger than before. You also get lifetime access to the War Room community for ongoing support.",
  },
  {
    id: "faq-5",
    question: "Is my information kept private?",
    answer: "Absolutely. We use bank-level encryption for all data. Your enrollment and participation are 100% confidential. We never share or sell your information.",
  },
];

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "basic",
    name: "Basic Access",
    price: 49,
    features: [
      "All 6 Core Modules",
      "3-Day Reset Protocol",
      "Lifetime Access",
      "Mobile-Friendly Platform",
    ],
    highlighted: false,
    cta: "Get Started",
  },
  {
    id: "premium",
    name: "Premium",
    price: 97,
    originalPrice: 149,
    features: [
      "Everything in Basic",
      "War Room Community Access",
      "Weekly Live Q&A Sessions",
      "Private Accountability Partner",
      "Bonus: Advanced Fasting Guide",
      "Priority Email Support",
    ],
    highlighted: true,
    cta: "Join Premium",
  },
];

export const STATS: StatItem[] = [
  { id: "s1", value: 12847, suffix: "+", label: "Lives Transformed" },
  { id: "s2", value: 94, suffix: "%", label: "Success Rate" },
  { id: "s3", value: 4.9, suffix: "/5", label: "Average Rating" },
  { id: "s4", value: 30, suffix: " Days", label: "Average Breakthrough" },
];

export const ANIMATION_CONFIG = {
  spring: { type: "spring", stiffness: 100, damping: 20 },
  smooth: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  stagger: { staggerChildren: 0.1 },
} as const;