// components/profile/PrivateProfileCard.tsx
"use client";
import { motion } from "framer-motion";
import { FaLock, FaUserShield } from "react-icons/fa";

export default function PrivateProfileCard() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/30" />
      
      <div className="relative p-12 text-center">
        {/* Lock Icon */}
        <motion.div
          className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-red-600/20 to-red-800/20 border-2 border-red-500/30 mb-6"
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <FaLock className="text-4xl text-red-500" />
        </motion.div>

        <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
          This Profile is Private
        </h2>
        
        <p className="text-gray-400 text-sm sm:text-base mb-6 max-w-md mx-auto">
          This user has chosen to keep their profile private. Follow them to see their posts, courses, and activity.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <motion.button
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold text-sm flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaUserShield />
            Request to Follow
          </motion.button>
        </div>

        {/* Decorative Elements - Optimized */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${20 + i * 30}%`,
                top: `${20 + i * 20}%`,
              }}
              animate={{
                y: [0, -15, 0],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            >
              <FaLock className="text-red-500/20 text-xl" />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}