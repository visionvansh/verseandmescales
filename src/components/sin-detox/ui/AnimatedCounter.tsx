//Volumes/vision/codes/course/my-app/src/components/sin-detox/ui/AnimatedCounter.tsx
"use client";

import { useAnimatedCounter } from "@/lib/sin-detox/hooks";

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({ value, suffix = "", className = "" }: AnimatedCounterProps) {
  const { count, ref } = useAnimatedCounter(value, 2500);

  return (
    <span ref={ref} className={className}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}