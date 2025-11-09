// components/course-builder/SubmissionReviewModal.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaCheckCircle,
  FaSpinner,
  FaExclamationTriangle,
  FaBook,
  FaLayerGroup,
  FaVideo,
  FaQuoteRight,
  FaQuestion,
  FaImage,
  FaPaperPlane,
} from "react-icons/fa";

interface SubmissionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  homepageData: any;
  moduleData: any;
  onSubmitSuccess: () => void;
}

const SubmissionReviewModal: React.FC<SubmissionReviewModalProps> = ({
  isOpen,
  onClose,
  courseId,
  homepageData,
  moduleData,
  onSubmitSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/course/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      const data = await response.json();

      if (response.ok) {
        onSubmitSuccess();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setSubmitError(data.error || "Failed to submit course");
        
        // Show validation issues if any
        if (data.issues && Array.isArray(data.issues)) {
          setSubmitError(data.issues.join(", "));
        }
      }
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate summary statistics
  const homepageSummary = {
    title: homepageData?.mainTitle?.line1 || "Not set",
    hasVideo: !!homepageData?.videoUrl,
    customSections: homepageData?.customSections?.length || 0,
    testimonials: homepageData?.testimonials?.length || 0,
    faqs: homepageData?.faqs?.length || 0,
    proofImages: homepageData?.proofImages?.length || 0,
  };

  const moduleSummary = {
    totalModules: moduleData?.modules?.length || 0,
    totalLessons: moduleData?.modules?.reduce(
      (sum: number, m: any) => sum + (m.lessons?.length || 0),
      0
    ) || 0,
    totalResources: moduleData?.modules?.reduce(
      (sum: number, m: any) =>
        sum +
        (m.lessons?.reduce(
          (lSum: number, l: any) => lSum + (l.resources?.length || 0),
          0
        ) || 0),
      0
    ) || 0,
  };

  const completionPercentage = calculateCompletionPercentage(homepageSummary, moduleSummary);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 to-black/98 rounded-2xl border border-red-500/30 backdrop-blur-2xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-2xl" />

          <div className="relative">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-red-500/20">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-red-600/20 to-red-700/20 rounded-xl flex items-center justify-center border border-red-500/30 w-12 h-12">
                  <FaPaperPlane className="text-red-500 text-xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-black bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                    Submit Course for Review
                  </h2>
                  <p className="text-gray-400 text-sm mt-0.5">
                    Review your changes before submission
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-800/50 transition-colors text-gray-400 hover:text-white"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] hide-scrollbar">
              {/* Completion Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">
                    Course Completion
                  </span>
                  <span className="text-sm font-bold text-red-400">
                    {completionPercentage}%
                  </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-red-600 to-red-500"
                  />
                </div>
              </div>

              {/* Warning if incomplete */}
              {completionPercentage < 100 && (
                <div className="mb-6 p-4 bg-yellow-600/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
                  <FaExclamationTriangle className="text-yellow-500 text-xl flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-yellow-400 font-bold mb-1">
                      Course Incomplete
                    </h3>
                    <p className="text-yellow-300/80 text-sm">
                      Some sections are missing content. While you can still submit,
                      completing all sections will improve your course quality.
                    </p>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {submitError && (
                <div className="mb-6 p-4 bg-red-600/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                  <FaExclamationTriangle className="text-red-500 text-xl flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-red-400 font-bold mb-1">
                      Submission Error
                    </h3>
                    <p className="text-red-300/80 text-sm">{submitError}</p>
                  </div>
                </div>
              )}

              {/* Overview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Homepage Overview */}
                <div className="bg-gray-900/40 border border-red-500/20 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 rounded-lg p-2.5 border border-blue-500/30">
                      <FaLayerGroup className="text-blue-500 text-lg" />
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      Homepage Content
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <SummaryItem
                      icon={FaBook}
                      label="Main Title"
                      value={homepageSummary.title}
                      complete={!!homepageSummary.title}
                    />
                    <SummaryItem
                      icon={FaVideo}
                      label="Video Section"
                      value={homepageSummary.hasVideo ? "Configured" : "Not set"}
                      complete={homepageSummary.hasVideo}
                    />
                    <SummaryItem
                      icon={FaLayerGroup}
                      label="Custom Sections"
                      value={`${homepageSummary.customSections} sections`}
                      complete={homepageSummary.customSections > 0}
                    />
                    <SummaryItem
                      icon={FaQuoteRight}
                      label="Testimonials"
                      value={`${homepageSummary.testimonials} testimonials`}
                      complete={homepageSummary.testimonials > 0}
                    />
                    <SummaryItem
                      icon={FaQuestion}
                      label="FAQs"
                      value={`${homepageSummary.faqs} questions`}
                      complete={homepageSummary.faqs > 0}
                    />
                    <SummaryItem
                      icon={FaImage}
                      label="Proof Gallery"
                      value={`${homepageSummary.proofImages} images`}
                      complete={homepageSummary.proofImages > 0}
                    />
                  </div>
                </div>

                {/* Course Modules Overview */}
                <div className="bg-gray-900/40 border border-red-500/20 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 rounded-lg p-2.5 border border-green-500/30">
                      <FaBook className="text-green-500 text-lg" />
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      Course Structure
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <SummaryItem
                      icon={FaLayerGroup}
                      label="Total Modules"
                      value={`${moduleSummary.totalModules} modules`}
                      complete={moduleSummary.totalModules > 0}
                    />
                    <SummaryItem
                      icon={FaVideo}
                      label="Total Lessons"
                      value={`${moduleSummary.totalLessons} lessons`}
                      complete={moduleSummary.totalLessons > 0}
                    />
                    <SummaryItem
                      icon={FaBook}
                      label="Resources"
                      value={`${moduleSummary.totalResources} resources`}
                      complete={moduleSummary.totalResources > 0}
                    />
                  </div>

                  {/* Module Details */}
                  {moduleSummary.totalModules > 0 && (
                    <div className="mt-4 pt-4 border-t border-red-500/20">
                      <p className="text-xs text-gray-400 mb-2 font-medium">
                        Module Breakdown:
                      </p>
                      <div className="space-y-2 max-h-40 overflow-y-auto hide-scrollbar">
                        {moduleData?.modules?.map((module: any, index: number) => (
                          <div
                            key={module.id}
                            className="text-xs text-gray-300 bg-gray-800/30 rounded-lg p-2"
                          >
                            <div className="font-medium text-white mb-1">
                              {index + 1}. {module.title}
                            </div>
                            <div className="text-gray-400">
                              {module.lessons?.length || 0} lessons •{" "}
                              {module.difficulty}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg">
                <h4 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                  <FaCheckCircle className="text-sm" />
                  What happens next?
                </h4>
                <ul className="text-blue-300/80 text-sm space-y-1 ml-6 list-disc">
                  <li>Your course will be submitted for review</li>
                  <li>Status will change to "Pending"</li>
                  <li>You'll be notified once the review is complete</li>
                  <li>You can continue editing while under review</li>
                </ul>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-red-500/20">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-lg font-bold text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <motion.button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-lg font-bold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 transition-all disabled:opacity-50 flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <FaPaperPlane />
                    <span>Submit for Review</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Summary Item Component
const SummaryItem: React.FC<{
  icon: React.ComponentType<any>;
  label: string;
  value: string;
  complete: boolean;
}> = ({ icon: Icon, label, value, complete }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
    <div className="flex items-center gap-2">
      <Icon className={`text-sm ${complete ? "text-green-500" : "text-gray-500"}`} />
      <span className="text-sm text-gray-300">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className={`text-sm font-medium ${complete ? "text-white" : "text-gray-500"}`}>
        {value}
      </span>
      {complete ? (
        <FaCheckCircle className="text-green-500 text-xs" />
      ) : (
        <div className="w-4 h-4 rounded-full border-2 border-gray-600" />
      )}
    </div>
  </div>
);

// Calculate completion percentage
function calculateCompletionPercentage(
  homepage: any,
  modules: any
): number {
  let completed = 0;
  let total = 10; // Total checkpoints

  // Homepage checkpoints (5)
  if (homepage.title) completed++;
  if (homepage.hasVideo) completed++;
  if (homepage.customSections > 0) completed++;
  if (homepage.testimonials > 0) completed++;
  if (homepage.faqs > 0) completed++;

  // Module checkpoints (5)
  if (modules.totalModules > 0) completed++;
  if (modules.totalModules >= 3) completed++; // Bonus for 3+ modules
  if (modules.totalLessons > 0) completed++;
  if (modules.totalLessons >= 5) completed++; // Bonus for 5+ lessons
  if (modules.totalResources > 0) completed++;

  return Math.round((completed / total) * 100);
}

export default SubmissionReviewModal;