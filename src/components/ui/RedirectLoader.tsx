// components/ui/RedirectLoader.tsx
"use client";
import { useEffect, useState } from "react";
import { FaCheckCircle, FaShieldAlt } from "react-icons/fa";
import { MdVerified } from "react-icons/md";

interface RedirectLoaderProps {
  message?: string;
  submessage?: string;
  icon?: "check" | "shield" | "verified";
  show?: boolean;
}

export const RedirectLoader = ({
  message = "Success!",
  submessage = "Redirecting you now...",
  icon = "check",
  show = true
}: RedirectLoaderProps) => {
  const [progress, setProgress] = useState(0);

  const iconMap = {
    check: FaCheckCircle,
    shield: FaShieldAlt,
    verified: MdVerified
  };

  const IconComponent = iconMap[icon];

  // Simple progress bar animation
  useEffect(() => {
    if (!show) return;
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95">
      {/* Subtle Background Gradient - Static, no animation */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(239, 68, 68, 0.15) 0%, transparent 70%)"
        }}
      />

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <div className="relative">
          {/* Glass Card */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-950/60 to-black/80 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-2xl" />
          
          <div className="relative p-8 sm:p-10">
            {/* Icon Container */}
            <div className="flex justify-center mb-6">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                {/* Subtle pulsing ring - CSS only, no framer-motion */}
                <div 
                  className="absolute inset-0 bg-red-400/20 rounded-full animate-ping-slow"
                  style={{ animationDuration: '2s' }}
                />
                
                {/* Icon Background */}
                <div className="relative w-full h-full bg-gradient-to-br from-red-400/30 to-red-600/30 rounded-full flex items-center justify-center border-2 border-red-400/50 backdrop-blur-sm">
                  <IconComponent className="text-4xl sm:text-5xl text-red-400" />
                </div>
              </div>
            </div>

            {/* Text Content */}
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {message}
              </h2>
              <p className="text-gray-400 text-sm sm:text-base">
                {submessage}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="relative w-full h-2 bg-gray-800/50 rounded-full overflow-hidden border border-gray-700/50">
              <div
                className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-300 ease-out"
                style={{ 
                  width: `${progress}%`,
                  boxShadow: "0 0 10px rgba(239, 68, 68, 0.5)"
                }}
              />
            </div>

            {/* Loading Dots - CSS animation only */}
            <div className="flex justify-center gap-2 mt-6">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};