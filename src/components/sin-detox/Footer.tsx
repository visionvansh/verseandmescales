"use client";

import Link from "next/link";
import { FaTwitter, FaInstagram, FaYoutube } from "react-icons/fa";
import { SITE_CONFIG } from "@/lib/sin-detox/constants";

const FOOTER_LINKS = {
  product: [
    { label: "Features", href: "#features" },
    { label: "Curriculum", href: "#curriculum" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Refund Policy", href: "/refund" },
  ],
};

const SOCIAL_LINKS = [
  { icon: FaTwitter, href: SITE_CONFIG.socialLinks.twitter, label: "Twitter" },
  { icon: FaInstagram, href: SITE_CONFIG.socialLinks.instagram, label: "Instagram" },
  { icon: FaYoutube, href: SITE_CONFIG.socialLinks.youtube, label: "YouTube" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="border-t border-white/5 bg-black pt-16 pb-8"
      role="contentinfo"
    >
      <div className="container mx-auto px-4 sm:px-6">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-black text-xl tracking-tighter mb-4"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <span className="text-white">
                VERSE<span className="text-red-500">AND</span>ME
              </span>
            </Link>
            <p className="text-gray-500 text-sm mb-4 max-w-xs">
              Breaking chains. Building discipline. Transforming lives through
              science-backed spiritual protocols.
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="text-lg" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Product
            </h4>
            <ul className="space-y-3">
              {FOOTER_LINKS.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-500 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Company
            </h4>
            <ul className="space-y-3">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-500 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Legal
            </h4>
            <ul className="space-y-3">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-500 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-xs text-center sm:text-left">
            © {currentYear} {SITE_CONFIG.name}. All rights reserved.
          </p>
          <p className="text-gray-700 text-xs">
            Constructed for the disciplined.
          </p>
        </div>
      </div>
    </footer>
  );
}