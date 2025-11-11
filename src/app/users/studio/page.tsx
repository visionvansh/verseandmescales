//Volumes/vision/codes/course/my-app/src/app/users/studio/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaLock, FaKey, FaSpinner } from "react-icons/fa";

export default function StudioAccessPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if already authorized
    const isAuthorized = sessionStorage.getItem("studio_authorized");
    if (isAuthorized === "true") {
      router.push("/users/studio/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError("");

    try {
      const response = await fetch("/api/studio/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        sessionStorage.setItem("studio_authorized", "true");
        router.push("/users/studio/dashboard");
      } else {
        setError("Invalid password");
        setPassword("");
      }
    } catch (error) {
      setError("Something went wrong");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-black rounded-2xl" />
          <div className="absolute inset-0 border border-red-500/30 rounded-2xl" />
          
          <div className="relative p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaLock className="text-red-500 text-2xl" />
              </div>
              <h1 className="text-3xl font-black text-white mb-2">
                Studio Access
              </h1>
              <p className="text-gray-400">
                Enter password to access custom course management
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Access Password
                </label>
                <div className="relative">
                  <FaKey className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-900/50 border border-red-500/30 rounded-lg pl-12 pr-4 py-3 text-white focus:border-red-500 focus:outline-none"
                    placeholder="Enter studio password"
                    required
                  />
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-sm"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 px-6 py-3 rounded-lg font-bold hover:scale-105 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <FaKey />
                    Access Studio
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}