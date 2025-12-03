"use client";

import { m } from "framer-motion";
import { FaLock, FaShieldAlt, FaBolt, FaInfinity, FaCheck } from "react-icons/fa";
import { PRICING_TIERS } from "@/lib/sin-detox/constants";
import { useSmoothScroll } from "@/lib/sin-detox/hooks";

export function CTASection() {
  const scrollTo = useSmoothScroll();

  return (
    <section
      id="pricing"
      className="py-20 sm:py-24 lg:py-32 relative overflow-hidden"
      aria-labelledby="pricing-heading"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-red-950/20 to-black" />
      <div
        className="absolute inset-0 bg-[url('/patterns/carbon-fibre.png')] opacity-10"
        aria-hidden="true"
      />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <m.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-600 to-red-800 rounded-full mb-6 shadow-lg shadow-red-500/30">
            <FaLock className="text-2xl sm:text-3xl text-white" />
          </div>
          <h2
            id="pricing-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4"
          >
            BECOME <span className="text-red-500">UNSTOPPABLE</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-base sm:text-lg">
            Choose your path to freedom. The 3-Day Reset starts the moment you join.
          </p>
        </m.header>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {PRICING_TIERS.map((tier, index) => (
            <m.article
              key={tier.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl sm:rounded-3xl overflow-hidden ${
                tier.highlighted
                  ? "bg-gradient-to-b from-red-900/40 to-black border-2 border-red-500/50 shadow-[0_0_60px_-15px_rgba(220,38,38,0.4)]"
                  : "bg-gradient-to-b from-gray-900/80 to-black border border-white/10"
              }`}
            >
              {/* Popular Badge */}
              {tier.highlighted && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="px-4 py-1.5 bg-gradient-to-r from-red-500 to-red-600 rounded-full text-xs font-bold text-white uppercase tracking-wider shadow-lg">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="p-6 sm:p-8 lg:p-10">
                {/* Tier Name */}
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {tier.name}
                </h3>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-6">
                  {tier.originalPrice && (
                    <span className="text-lg text-gray-500 line-through">
                      ${tier.originalPrice}
                    </span>
                  )}
                  <span className="text-4xl sm:text-5xl font-black text-white">
                    ${tier.price}
                  </span>
                  <span className="text-gray-500 text-sm">one-time</span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                      <span className="text-gray-300 text-sm sm:text-base">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  className={`w-full py-4 rounded-xl font-bold text-base sm:text-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black ${
                    tier.highlighted
                      ? "bg-white text-black hover:bg-gray-100 focus:ring-white"
                      : "bg-red-600 hover:bg-red-500 text-white focus:ring-red-500"
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            </m.article>
          ))}
        </div>

        {/* Trust Badges */}
        <m.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-10 sm:mt-12 text-sm text-gray-500"
        >
          <span className="flex items-center gap-2">
            <FaShieldAlt className="text-red-500" />
            Secure SSL Payment
          </span>
          <span className="hidden sm:inline w-1 h-1 bg-gray-700 rounded-full" />
          <span className="flex items-center gap-2">
            <FaInfinity className="text-red-500" />
            Lifetime Access
          </span>
          <span className="hidden sm:inline w-1 h-1 bg-gray-700 rounded-full" />
          <span className="flex items-center gap-2">
            <FaBolt className="text-red-500" />
            Instant Start
          </span>
        </m.div>
      </div>
    </section>
  );
}