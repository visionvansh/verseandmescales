//Volumes/vision/codes/course/my-app/src/app/users/sin-detox/page.tsx
import { Metadata } from "next";
import { LazyMotion, domAnimation } from "framer-motion";
import {
  HeroSection,
  FeatureGrid,
  CurriculumSection,
  TestimonialsSection,
  FAQSection,
  CTASection,
  Footer,
  ScrollProgress,
} from "@/components/sin-detox";

// SEO Metadata
export const metadata: Metadata = {
  title: "Sin Detox Protocol | Break Free from Self-Sabotage | VerseAndMe",
  description:
    "A science-backed, spiritually-grounded protocol to break free from addictive patterns, rewire your brain, and build unshakeable discipline. Join 12,000+ transformed lives.",
  keywords: [
    "sin detox",
    "break addiction",
    "dopamine reset",
    "self discipline",
    "habit breaking",
    "spiritual discipline",
    "temptation",
    "self improvement",
  ],
  openGraph: {
    title: "Sin Detox Protocol | VerseAndMe",
    description:
      "Break free from self-sabotage. Rewire your brain. Build unstoppable discipline.",
    type: "website",
    url: "https://verseandme.com/sin-detox",
    images: [
      {
        url: "/og/sin-detox.jpg",
        width: 1200,
        height: 630,
        alt: "Sin Detox Protocol",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sin Detox Protocol | VerseAndMe",
    description: "Break free from self-sabotage. Join 12,000+ transformed lives.",
    images: ["/og/sin-detox.jpg"],
  },
};

export default function SinDetoxPage() {
  return (
    <LazyMotion features={domAnimation} strict>
      {/* Background Layer - Similar to Settings */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-black to-gray-950 -z-20" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/20 via-transparent to-transparent -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent -z-10" />
      
      <div className="relative min-h-screen text-white selection:bg-red-500/30 selection:text-red-200 antialiased">
        {/* Scroll Progress Indicator */}
        <ScrollProgress />

        {/* Main Content */}
        <main id="main-content">
          <HeroSection />
          <FeatureGrid />
          <CurriculumSection />
          <TestimonialsSection />
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </LazyMotion>
  );
}