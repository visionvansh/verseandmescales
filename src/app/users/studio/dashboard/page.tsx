//Volumes/vision/codes/course/my-app/src/app/users/studio/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getAvailableCustomHomepages } from "@/components/custom-homepages";
import { FaCode, FaPlus, FaSpinner } from "react-icons/fa";

export default function StudioDashboard() {
  const router = useRouter();
  const [availableHomepages, setAvailableHomepages] = useState<any[]>([]);
  const [customCourses, setCustomCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    // Verify access
    const isAuthorized = sessionStorage.getItem("studio_authorized");
    if (isAuthorized !== "true") {
      router.push("/users/studio");
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      // Get available homepage templates
      const homepages = getAvailableCustomHomepages();
      setAvailableHomepages(homepages);

      // Load existing custom courses
      const response = await fetch("/api/studio/custom-courses");
      if (response.ok) {
        const data = await response.json();
        setCustomCourses(data);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createCustomCourse = async (homepageFileId: string) => {
    setCreating(homepageFileId);
    
    try {
      const response = await fetch("/api/studio/custom-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "New Custom Course",
          homepageType: "custom",
          customHomepageFile: homepageFileId,
        }),
      });

      if (response.ok) {
        const course = await response.json();
        router.push(`/users/studio/card-customisation?courseId=${course.id}`);
      }
    } catch (error) {
      console.error("Error creating custom course:", error);
    } finally {
      setCreating(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <FaSpinner className="text-red-500 text-4xl animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-black text-white mb-4">
            <FaCode className="inline mr-4 text-red-500" />
            Custom Course Studio
          </h1>
          <p className="text-gray-400 text-lg">
            Create courses with custom-coded homepages
          </p>
        </motion.div>

        {/* Available Homepage Templates */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">
            Available Homepage Templates
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableHomepages.map((homepage, index) => (
              <motion.div
                key={homepage.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-gray-900 to-black border border-red-500/30 rounded-xl p-6 hover:border-red-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <FaCode className="text-red-500 text-2xl" />
                  <span className="text-xs text-gray-500 font-mono">
                    {homepage.fileName}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">
                  {homepage.name}
                </h3>
                
                <p className="text-gray-400 text-sm mb-4">
                  {homepage.description || "Custom coded homepage"}
                </p>
                
                <button
                  onClick={() => createCustomCourse(homepage.id)}
                  disabled={creating === homepage.id}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {creating === homepage.id ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FaPlus />
                      Create Course with This
                    </>
                  )}
                </button>
              </motion.div>
            ))}
          </div>

          {availableHomepages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">
                No custom homepage templates found. Create one in{" "}
                <code className="bg-gray-800 px-2 py-1 rounded">
                  src/components/custom-homepages/
                </code>
              </p>
            </div>
          )}
        </div>

        {/* Existing Custom Courses */}
        {customCourses.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">
              Your Custom Courses
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-gradient-to-br from-gray-900 to-black border border-red-500/20 rounded-xl p-6"
                >
                  <h3 className="text-xl font-bold text-white mb-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Using: {course.customHomepageFile}
                  </p>
                  <button
                    onClick={() => router.push(`/users/studio/card-customisation?courseId=${course.id}`)}
                    className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Edit Course
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}