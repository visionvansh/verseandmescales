"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  FaEnvelope,
  FaShieldAlt,
  FaLock,
  FaBolt,
  FaChevronRight,
} from "react-icons/fa";
import { HiArrowRight, HiCheckCircle } from "react-icons/hi2";
import { SITE_CONFIG } from "@/lib/sin-detox/constants";

const FOOTER_LINKS = {
  protocol: [
    { label: "The Framework", href: "#curriculum" },
    { label: "Why It Works", href: "#features" },
    { label: "War Room Reports", href: "#testimonials" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ],
};

const TRUST_BADGES = [
  { icon: FaShieldAlt, text: "256-bit Encryption" },
  { icon: FaLock, text: "100% Confidential" },
  { icon: FaBolt, text: "Lifetime Access" },
];

const NewsletterSignup = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSubmitted(true);
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-red-600/20 to-red-900/20 rounded-2xl blur-xl opacity-50" />
      
      <div className="relative bg-gradient-to-b from-gray-900/80 to-black/80 border border-red-500/20 rounded-xl p-5 sm:p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-3">
          <FaEnvelope className="text-red-500 text-sm" aria-hidden="true" />
          <span className="text-red-500 font-bold tracking-[0.2em] uppercase text-xs">
            Intel Drop
          </span>
        </div>
        
        <h3 className="text-lg sm:text-xl font-black text-white mb-2 leading-tight">
          Get Battle-Tested Strategies
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed mb-4">
          Weekly insights on discipline, brain rewiring, and spiritual warfare.
        </p>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
              required
              disabled={isLoading}
              aria-label="Email address for newsletter"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Subscribe
                  <HiArrowRight className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-3 py-3 px-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <HiCheckCircle className="text-green-500 text-xl flex-shrink-0" aria-hidden="true" />
            <span className="text-green-400 text-sm font-medium">You're in. Check your inbox.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="relative border-t border-white/5 overflow-hidden"
      role="contentinfo"
      aria-label="Site footer"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black to-black pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-red-900/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-red-600/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      
      {/* Main Footer Content */}
      <div className="relative z-10">
        
        {/* Top Section - CTA Banner */}
        <div className="border-b border-white/5">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left - CTA Text */}
              <div className="text-center lg:text-left order-2 lg:order-1">
                <span className="text-red-500 font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                  Ready to Transform?
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black leading-[1.1] mb-3">
                  Your Enemy Is{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">
                    Inside
                  </span>
                  .
                  <br />
                  <span className="text-gray-400">Conquer It Today.</span>
                </h2>
                <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 mb-5 leading-relaxed">
                  Join 12,000+ warriors who've broken free from self-sabotage using the Sin Detox Protocol.
                </p>
                <Link
                  href="#pricing"
                  className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-all duration-300 group shadow-lg shadow-red-600/20 hover:shadow-red-500/30"
                >
                  Start The Protocol
                  <FaChevronRight className="text-xs group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Link>
              </div>
              
              {/* Right - Newsletter */}
              <div className="order-1 lg:order-2">
                <NewsletterSignup />
              </div>
            </div>
          </div>
        </div>

        {/* Links Section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-14">
          
          {/* Mobile: Stacked Layout */}
          <div className="block lg:hidden space-y-8">
            
            {/* Brand Section */}
            <div className="text-center pb-6 border-b border-white/5">
              <Link
                href="/"
                className="inline-block font-black text-xl tracking-tighter mb-3 hover:opacity-80 transition-opacity"
                aria-label="Verse and Me Scales home"
              >
                <span className="text-white">VERSE<span className="text-red-500">&</span>ME<span className="text-gray-500">SCALES</span></span>
              </Link>
              <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
                Breaking chains. Building discipline. Transforming lives through science-backed spiritual protocols.
              </p>
            </div>

            {/* Protocol Links */}
            <nav className="pb-6 border-b border-white/5" aria-labelledby="footer-protocol-heading">
              <h4 
                id="footer-protocol-heading"
                className="text-white font-bold mb-4 text-sm uppercase tracking-wider flex items-center gap-2 justify-center"
              >
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" aria-hidden="true" />
                Quick Links
              </h4>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-3 max-w-sm mx-auto">
                {FOOTER_LINKS.protocol.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                    >
                      <FaChevronRight className="text-[8px] text-red-500/50 group-hover:text-red-500 transition-colors" aria-hidden="true" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Contact & Trust Badges */}
            <div className="text-center space-y-5">
              <div>
                <h4 className="text-white font-bold mb-3 text-sm uppercase tracking-wider flex items-center gap-2 justify-center">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full" aria-hidden="true" />
                  Support
                </h4>
                <a 
                  href={`mailto:${SITE_CONFIG.supportEmail}`}
                  className="text-gray-400 hover:text-red-400 text-sm transition-colors inline-flex items-center gap-2 hover:underline"
                  aria-label="Email support"
                >
                  <FaEnvelope className="text-xs" />
                  business@verseandme.com
                </a>
              </div>
              
              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                {TRUST_BADGES.map((badge, i) => {
                  const Icon = badge.icon;
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-500 bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                      <Icon className="text-red-500 text-sm flex-shrink-0" aria-hidden="true" />
                      <span className="whitespace-nowrap">{badge.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Desktop: Grid Layout */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-10">
            
            {/* Brand Column */}
            <div>
              <Link
                href="/"
                className="inline-block font-black text-xl tracking-tighter mb-4 hover:opacity-80 transition-opacity"
                aria-label="Verse and Me Scales home"
              >
                <span className="text-white">VERSE<span className="text-red-500">&</span>ME<span className="text-gray-500">SCALES</span></span>
              </Link>
              <p className="text-gray-500 text-sm mb-5 leading-relaxed max-w-xs">
                Breaking chains. Building discipline. Transforming lives through science-backed spiritual protocols.
              </p>
            </div>

            {/* Protocol Links */}
            <nav aria-labelledby="footer-protocol-heading-desktop">
              <h4 
                id="footer-protocol-heading-desktop"
                className="text-white font-bold mb-4 text-sm uppercase tracking-wider flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" aria-hidden="true" />
                Protocol
              </h4>
              <ul className="space-y-3">
                {FOOTER_LINKS.protocol.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-gray-500 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                    >
                      <FaChevronRight className="text-[8px] text-gray-700 group-hover:text-red-500 transition-colors" aria-hidden="true" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Contact & Trust */}
            <div>
              <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" aria-hidden="true" />
                Support
              </h4>
              <a 
                href={`mailto:${SITE_CONFIG.supportEmail}`}
                className="text-gray-400 hover:text-white text-sm transition-colors inline-block mb-5 hover:underline"
                aria-label="Email support"
              >
                support@verseandme.com
              </a>
              
              {/* Trust Badges */}
              <div className="space-y-3">
                {TRUST_BADGES.map((badge, i) => {
                  const Icon = badge.icon;
                  return (
                    <div key={i} className="flex items-center gap-2.5 text-xs text-gray-500">
                      <Icon className="text-red-900 text-sm flex-shrink-0" aria-hidden="true" />
                      <span>{badge.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 bg-black/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="text-center">
              <p className="text-gray-600 text-xs">
                © {currentYear}{" "}
                <span className="font-black tracking-tighter text-white">VERSE<span className="text-red-500">&</span>ME<span className="text-gray-500">SCALES</span></span>. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;