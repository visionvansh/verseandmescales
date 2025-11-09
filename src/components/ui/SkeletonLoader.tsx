// components/ui/SkeletonLoader.tsx
"use client";
import { motion } from "framer-motion";

interface SkeletonLoaderProps {
  className?: string;
  variant?: "text" | "rectangular" | "circular" | "input";
  width?: string;
  height?: string;
  animate?: boolean;
}

export const SkeletonLoader = ({
  className = "",
  variant = "rectangular",
  width = "100%",
  height = "20px",
  animate = true
}: SkeletonLoaderProps) => {
  const baseClasses = "bg-gradient-to-r from-gray-800/40 via-gray-700/40 to-gray-800/40 rounded-lg";
  
  const variantClasses = {
    text: "rounded",
    rectangular: "rounded-lg",
    circular: "rounded-full",
    input: "rounded-xl"
  };

  return (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
      animate={animate ? {
        opacity: [0.4, 0.7, 0.4],
      } : {}}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
};

export const SignInSkeleton = () => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 to-black/80 rounded-3xl border border-yellow-400/30 backdrop-blur-2xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent rounded-3xl" />
        
        <div className="relative p-8 md:p-10">
          {/* Header Skeleton */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6">
              <SkeletonLoader variant="circular" width="80px" height="80px" />
            </div>
            <SkeletonLoader variant="text" width="60%" height="32px" className="mx-auto mb-3" />
            <SkeletonLoader variant="text" width="80%" height="20px" className="mx-auto" />
          </div>

          {/* Social Login Skeleton */}
          <div className="mb-8 space-y-3">
            <SkeletonLoader variant="input" height="48px" />
            <SkeletonLoader variant="input" height="48px" />
          </div>

          {/* Divider Skeleton */}
          <div className="flex items-center mb-8">
            <SkeletonLoader variant="text" width="45%" height="1px" />
            <SkeletonLoader variant="text" width="10%" height="20px" className="mx-4" />
            <SkeletonLoader variant="text" width="45%" height="1px" />
          </div>

          {/* Form Skeleton */}
          <div className="space-y-6">
            {/* Email Field */}
            <div>
              <SkeletonLoader variant="text" width="30%" height="16px" className="mb-2" />
              <SkeletonLoader variant="input" height="56px" />
            </div>

            {/* Password Field */}
            <div>
              <SkeletonLoader variant="text" width="25%" height="16px" className="mb-2" />
              <SkeletonLoader variant="input" height="56px" />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <SkeletonLoader variant="text" width="35%" height="20px" />
              <SkeletonLoader variant="text" width="30%" height="20px" />
            </div>

            {/* Submit Button */}
            <SkeletonLoader variant="input" height="56px" />
          </div>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <SkeletonLoader variant="text" width="60%" height="20px" className="mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};