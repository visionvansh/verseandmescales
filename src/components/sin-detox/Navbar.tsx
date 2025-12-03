"use client";

import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FaBars, FaTimes } from "react-icons/fa";
import { useSmoothScroll } from "@/lib/sin-detox/hooks";
import { SITE_CONFIG } from "@/lib/sin-detox/constants";

const NAV_LINKS = [
  { id: "features", label: "Features" },
  { id: "curriculum", label: "Curriculum" },
  { id: "testimonials", label: "Results" },
  { id: "faq", label: "FAQ" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const scrollTo = useSmoothScroll();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (elementId: string) => {
    scrollTo(elementId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-black/90 backdrop-blur-xl border-b border-white/10 shadow-lg"
            : "bg-transparent"
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="container mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="font-black text-xl sm:text-2xl tracking-tighter flex items-center gap-2 group"
            aria-label={`${SITE_CONFIG.name} Home`}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <span className="hidden sm:inline">
              VERSE<span className="text-red-500">AND</span>ME
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 group-hover:w-full transition-all duration-300" />
              </button>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/auth/signin"
              className="text-sm font-semibold text-gray-400 hover:text-white transition-colors hidden sm:inline"
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-red-500/25 hover:shadow-red-500/40"
            >
              Get Started
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-white"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <m.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/10 z-40 lg:hidden"
          >
            <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className="text-left text-lg font-medium text-gray-300 hover:text-white py-2 transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <hr className="border-white/10 my-2" />
              <Link
                href="/auth/signin"
                className="text-lg font-medium text-gray-400 hover:text-white py-2"
              >
                Login
              </Link>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}