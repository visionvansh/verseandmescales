//Volumes/vision/codes/course/my-app/src/components/sin-detox/ui/ScrollProgress.tsx
"use client";

import { m } from "framer-motion";
import { useScrollProgress } from "@/lib/sin-detox/hooks";

export function ScrollProgress() {
  const scaleX = useScrollProgress();

  return (
    <m.div
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 origin-left z-[100]"
      style={{ scaleX }}
      aria-hidden="true"
    />
  );
}