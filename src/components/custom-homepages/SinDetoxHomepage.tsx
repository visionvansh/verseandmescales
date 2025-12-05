//Volumes/vision/codes/course/my-app/src/components/custom-homepages/SinDetoxHomepage.tsx
"use client";

import React from "react";
import { LazyMotion, domAnimation } from "framer-motion";
import {
  HeroSection,
  FeatureGrid,
  CurriculumSection,
  TestimonialsSection,
  Footer,
  ScrollProgress,
} from "@/components/sin-detox";

interface SinDetoxHomepageProps {
  courseData: any;
  enrollmentStatus: any;
  onEnroll: () => void;
  onStartLearning: () => void;
  enrolling: boolean;
}

export default function SinDetoxHomepage({
  courseData,
  enrollmentStatus,
  onEnroll,
  onStartLearning,
  enrolling,
}: SinDetoxHomepageProps) {
  const regularPrice = courseData?.price || courseData?.footerPrice || "97.00";
  const salePrice = courseData?.salePrice || courseData?.footerSalePrice || null;
  const saleEndsAt = courseData?.saleEndsAt || null;
  
  const hasSale = salePrice && 
                  parseFloat(salePrice) > 0 && 
                  parseFloat(salePrice) < parseFloat(regularPrice) &&
                  saleEndsAt && 
                  new Date(saleEndsAt) > new Date();

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden bg-black">
      <LazyMotion features={domAnimation} strict>
        <div className="relative min-h-screen text-white selection:bg-red-500/30 selection:text-red-200 antialiased">
          <ScrollProgress />

          <main id="main-content">
            <HeroSection
              enrollmentStatus={enrollmentStatus}
              onEnroll={onEnroll}
              onStartLearning={onStartLearning}
              enrolling={enrolling}
              regularPrice={regularPrice}
              salePrice={salePrice}
              hasSale={hasSale}
              saleEndsAt={saleEndsAt}
            />
            
            {/* ✅ REST OF SECTIONS WITH GRID BACKGROUND */}
            <div className="relative">
              {/* Grid Background for Remaining Sections */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(239, 68, 68, 0.35) 1.5px, transparent 1.5px),
                    linear-gradient(90deg, rgba(239, 68, 68, 0.35) 1.5px, transparent 1.5px)
                  `,
                  backgroundSize: "60px 60px",
                }}
              />
              
              <FeatureGrid />
              <CurriculumSection />
              <TestimonialsSection />
            
            </div>
          </main>

          <Footer />
        </div>
      </LazyMotion>
    </div>
  );
}