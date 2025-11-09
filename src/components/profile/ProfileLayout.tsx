//Volumes/vision/codes/course/my-app/src/components/profile/ProfileLayout.tsx
"use client";
import { ReactNode } from "react";

interface ProfileLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  header: ReactNode;
}

export default function ProfileLayout({ children, sidebar, header }: ProfileLayoutProps) {
  return (
    <div className="relative mt-20">
      {/* Main Content */}
      <div className="relative z-20">
        <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-4 sm:py-5 md:py-6 lg:py-8 xl:py-10">
          <div className="max-w-full sm:max-w-[95%] md:max-w-[92%] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
            
            {/* Header */}
            {header}

            {/* Main Grid - Responsive */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 md:gap-6 lg:gap-7 xl:gap-8">
              {/* Sidebar - Hidden on mobile, visible on desktop */}
              <div className="hidden lg:block lg:col-span-3">
                {sidebar}
              </div>

              {/* Content */}
              <div className="lg:col-span-9">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}