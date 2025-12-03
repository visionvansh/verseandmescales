//Volumes/vision/codes/course/my-app/src/lib/sin-detox/types.ts
import { IconType } from "react-icons";

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration?: string;
}

export interface Module {
  id: number;
  slug: string;
  title: string;
  duration: string;
  icon: IconType;
  lessons: Lesson[];
  hook?: string;
  isPremium?: boolean;
}

export interface Feature {
  id: string;
  title: string;
  subtitle: string;
  icon: IconType;
  description: string;
}

export interface Testimonial {
  id: string;
  name: string;
  avatar: string;
  role: string;
  content: string;
  rating: number;
  verified: boolean;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  features: string[];
  highlighted: boolean;
  cta: string;
}

export interface StatItem {
  id: string;
  value: number;
  suffix: string;
  label: string;
}

// Add to existing types.ts

export interface HeroBackgroundConfig {
  desktop: string;
  mobile: string;
  alt?: string;
}

export interface HeroConfig {
  background: HeroBackgroundConfig;
  badge: {
    text: string;
    icon?: boolean;
  };
  headline: {
    line1: string;
    line2: string;
  };
  subheadline: {
    text: string;
    highlight: string;
  };
  cta: {
    primary: {
      text: string;
      href?: string;
    };
    secondary: {
      text: string;
      videoUrl?: string;
    };
  };
  stats: {
    rating: number;
    totalUsers: string;
  };
}