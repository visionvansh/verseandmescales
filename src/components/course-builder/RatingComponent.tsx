//Volumes/vision/codes/course/my-app/src/components/course-builder/RatingComponent.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaCheck, FaTimes, FaEdit, FaTrash, FaUser, FaCalendar } from 'react-icons/fa';

interface RatingComponentProps {
  courseId: string;
  onRatingSubmitted?: () => void;
}

interface RatingData {
  userRating: {
    id: string;
    rating: number;
    review: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  averageRating: number;
  totalRatings: number;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

const ratingLabels = {
  1: { text: 'Poor', emoji: '😞', color: 'text-red-400' },
  2: { text: 'Fair', emoji: '😐', color: 'text-orange-400' },
  3: { text: 'Good', emoji: '🙂', color: 'text-yellow-400' },
  4: { text: 'Very Good', emoji: '😊', color: 'text-lime-400' },
  5: { text: 'Excellent', emoji: '🤩', color: 'text-green-400' },
};

export function RatingComponent({ courseId, onRatingSubmitted }: RatingComponentProps) {
  const [ratingData, setRatingData] = useState<RatingData | null>(null);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchRating();
  }, [courseId]);

  const fetchRating = async () => {
    try {
      const response = await fetch(`/api/course/rating?courseId=${courseId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setRatingData(data);
        
        if (data.userRating) {
          setSelectedRating(data.userRating.rating);
          setReview(data.userRating.review || '');
        }
      }
    } catch (err) {
      console.error('Failed to fetch rating:', err);
    }
  };

  const handleSubmitRating = async () => {
    if (selectedRating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/course/rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseId,
          rating: selectedRating,
          review: review.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit rating');
      }

      setShowSuccess(true);
      setIsEditing(false);
      setIsExpanded(false);
      fetchRating();
      onRatingSubmitted?.();

      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRating = async () => {
    if (!confirm('Are you sure you want to delete your rating?')) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/course/rating?courseId=${courseId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete rating');
      }

      setSelectedRating(0);
      setReview('');
      setIsEditing(false);
      setIsExpanded(false);
      fetchRating();
    } catch (err: any) {
      setError(err.message || 'Failed to delete rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (interactive: boolean = false, size: 'sm' | 'md' | 'lg' = 'lg') => {
    const sizeClasses = {
      sm: 'text-lg sm:text-xl',
      md: 'text-xl sm:text-2xl',
      lg: 'text-2xl sm:text-3xl md:text-4xl',
    };

    return (
      <div className="flex gap-1 sm:gap-2">
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = interactive 
            ? (hoveredStar || selectedRating) >= star
            : selectedRating >= star;

          return (
            <motion.button
              key={star}
              type="button"
              disabled={!interactive || isSubmitting}
              onClick={() => interactive && setSelectedRating(star)}
              onMouseEnter={() => interactive && setHoveredStar(star)}
              onMouseLeave={() => interactive && setHoveredStar(0)}
              className={`${sizeClasses[size]} transition-all ${
                interactive ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'
              } ${isActive ? 'text-yellow-400' : 'text-gray-600'}`}
              whileHover={interactive ? { scale: 1.1 } : {}}
              whileTap={interactive ? { scale: 0.95 } : {}}
            >
              <FaStar className={isActive ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : ''} />
            </motion.button>
          );
        })}
      </div>
    );
  };

  if (!ratingData) {
    return (
      <div className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-xl sm:rounded-2xl p-6 backdrop-blur-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-800 rounded w-1/3"></div>
          <div className="h-20 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  const hasRating = ratingData.userRating !== null;
  const showForm = (!hasRating || isEditing) && isExpanded;
  const currentRatingLabel = ratingLabels[(hoveredStar || selectedRating) as keyof typeof ratingLabels];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-xl"
    >
      {/* Header Section */}
      <div className="relative p-6 sm:p-8 bg-gradient-to-r from-red-600/10 to-transparent border-b border-red-500/20">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
              <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                COURSE
              </span>{' '}
              RATING
            </h3>
            
            {/* Average Rating Display */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="flex">{renderStars(false, 'sm')}</div>
                <span className="text-3xl sm:text-4xl font-black text-white">
                  {ratingData.averageRating.toFixed(1)}
                </span>
              </div>
              <div className="text-gray-400 text-sm">
                Based on <span className="text-white font-bold">{ratingData.totalRatings}</span> rating
                {ratingData.totalRatings !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {hasRating && !isExpanded && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setIsExpanded(true);
                }}
                className="p-2.5 sm:p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors group"
                title="Edit Rating"
              >
                <FaEdit className="text-gray-400 group-hover:text-white transition-colors" />
              </button>
              <button
                onClick={handleDeleteRating}
                disabled={isSubmitting}
                className="p-2.5 sm:p-3 bg-red-900/30 hover:bg-red-900/50 rounded-lg transition-colors group disabled:opacity-50"
                title="Delete Rating"
              >
                <FaTrash className="text-red-400 group-hover:text-red-300 transition-colors" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 sm:p-8">
        {/* Success Message */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-green-900/30 border border-green-500/30 rounded-lg flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <FaCheck className="text-green-400 text-lg" />
              </div>
              <p className="text-green-400 font-medium">
                Rating {hasRating ? 'updated' : 'submitted'} successfully!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-900/30 border border-red-500/30 rounded-lg flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <FaTimes className="text-red-400 text-lg" />
              </div>
              <p className="text-red-400 font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rating Form or Display */}
        {showForm ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6"
          >
            {/* Star Rating Input */}
            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/30">
              <label className="block text-gray-300 text-sm font-bold mb-4 uppercase tracking-wide">
                Your Rating *
              </label>
              <div className="flex flex-col items-center gap-4">
                {renderStars(true)}
                {currentRatingLabel && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-3xl">{currentRatingLabel.emoji}</span>
                    <span className={`text-xl font-bold ${currentRatingLabel.color}`}>
                      {currentRatingLabel.text}
                    </span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Review Input */}
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-3 uppercase tracking-wide">
                Write a Review (Optional)
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your experience with this course..."
                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent transition-all resize-none"
                rows={4}
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-gray-500 text-xs">
                  {review.length}/500 characters
                </p>
                {review.length > 450 && (
                  <p className="text-yellow-500 text-xs font-medium">
                    {500 - review.length} characters remaining
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSubmitRating}
                disabled={isSubmitting || selectedRating === 0}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3.5 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <FaCheck />
                    <span>{hasRating ? 'Update Rating' : 'Submit Rating'}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setIsEditing(false);
                  setIsExpanded(false);
                  setSelectedRating(ratingData.userRating?.rating || 0);
                  setReview(ratingData.userRating?.review || '');
                  setError(null);
                }}
                disabled={isSubmitting}
                className="px-6 bg-gray-800/50 hover:bg-gray-700/50 text-white py-3.5 rounded-xl font-bold transition-all disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        ) : hasRating ? (
          /* User's Existing Rating Display */
          <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/30">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <FaUser className="text-gray-400 text-sm" />
                    <span className="text-gray-400 text-sm font-medium">Your Rating:</span>
                  </div>
                  {renderStars(false, 'sm')}
                  <span className={`text-lg font-bold ${ratingLabels[selectedRating as keyof typeof ratingLabels].color}`}>
                    {ratingLabels[selectedRating as keyof typeof ratingLabels].text}
                  </span>
                </div>
                {ratingData.userRating?.review && (
                  <p className="text-gray-300 text-sm leading-relaxed italic border-l-2 border-red-500/50 pl-4 mt-3">
                    "{ratingData.userRating.review}"
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <FaCalendar className="text-gray-600" />
              <span>Rated on {new Date(ratingData.userRating!.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
          </div>
        ) : (
          /* Call to Action for New Rating */
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full bg-gradient-to-r from-red-600/20 to-transparent hover:from-red-600/30 border-2 border-red-500/30 hover:border-red-500/50 rounded-xl p-8 transition-all group"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="text-6xl group-hover:scale-110 transition-transform">⭐</div>
              <div>
                <h4 className="text-xl font-bold text-white mb-2">Rate This Course</h4>
                <p className="text-gray-400 text-sm">Share your experience with other students</p>
              </div>
              <div className="flex items-center gap-2 text-red-400 font-semibold">
                <span>Click to Rate</span>
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.span>
              </div>
            </div>
          </button>
        )}

        {/* Rating Distribution */}
        <div className="mt-8 pt-8 border-t border-gray-700/50">
          <h4 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wide">
            Rating Distribution
          </h4>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingData.ratingBreakdown[star as keyof typeof ratingData.ratingBreakdown];
              const percentage = ratingData.totalRatings > 0 
                ? (count / ratingData.totalRatings) * 100 
                : 0;

              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-14">
                    <span className="text-sm text-gray-400 font-medium">{star}</span>
                    <FaStar className="text-yellow-400 text-xs" />
                  </div>
                  <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600"
                    />
                  </div>
                  <span className="text-sm text-gray-400 w-20 text-right font-medium">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}