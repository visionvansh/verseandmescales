// hooks/usePerformance.ts
"use client";

import { useState, useEffect } from 'react';

export const usePerformance = () => {
  const [isLowEnd, setIsLowEnd] = useState(false);

  useEffect(() => {
    // Detect low-end device
    const checkPerformance = () => {
      const memory = (performance as any).memory;
      const cores = navigator.hardwareConcurrency || 2;
      
      // Consider low-end if:
      // - Less than 4GB RAM
      // - Less than 4 CPU cores
      // - Slow connection
      const isLow = (
        (memory && memory.jsHeapSizeLimit < 4000000000) ||
        cores < 4 ||
        (navigator as any).connection?.effectiveType === '2g' ||
        (navigator as any).connection?.effectiveType === '3g'
      );
      
      setIsLowEnd(isLow);
    };

    checkPerformance();
  }, []);

  return { isLowEnd, shouldReduceMotion: isLowEnd };
};