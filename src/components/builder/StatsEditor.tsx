// components/builder/StatsEditor.tsx
'use client';

import React, { useState, useEffect, memo } from 'react';
import { FaUsers, FaInstagram, FaTrophy, FaStar } from 'react-icons/fa';

interface StatsEditorProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

interface CourseStats {
  activeStudents: number;
  courseRating: number;
  monthlyIncome: string;
  avgGrowth: string;
}

const StatsEditor: React.FC<StatsEditorProps> = ({ enabled, onChange }) => {
  const [stats, setStats] = useState<CourseStats>({
    activeStudents: 0,
    courseRating: 0,
    monthlyIncome: '\$0',
    avgGrowth: '0',
  });
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/course-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Header */}
      <div className="flex-1 min-w-0">
        <h2 className="text-lg lg:text-xl font-black text-white mb-1 truncate">
          Stats Cards
        </h2>
        <p className="text-gray-400 text-[10px] lg:text-xs">
          Display real-time course statistics
        </p>
      </div>

      {/* Stats Cards Preview */}
      <div className="bg-black border-2 border-red-500/60 rounded-lg lg:rounded-xl p-3 lg:p-4">
        <div className="flex items-center justify-between mb-2 lg:mb-3">
          <h3 className="text-[10px] lg:text-xs font-bold text-gray-400 flex items-center gap-1.5">
            <FaStar className="text-red-400 text-xs" /> 
            LIVE PREVIEW
          </h3>
          <div className="text-[9px] lg:text-[10px] text-gray-500">
            As seen by users
          </div>
        </div>
        
        {/* Responsive Grid - Optimized for split screen */}
        <div className="grid grid-cols-2 gap-2 lg:gap-3">
          {[
            { 
              icon: FaUsers, 
              value: stats.activeStudents === 0 ? '0' : `${stats.activeStudents.toLocaleString()}+`, 
              label: 'Active Buyers' 
            },
            { 
              icon: FaTrophy, 
              value: stats.monthlyIncome, 
              label: 'Monthly Income' 
            },
            { 
              icon: FaStar, 
              value: stats.courseRating === 0 ? '0.0/5' : `${stats.courseRating}/5`, 
              label: 'Course Rating' 
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-gray-900/90 to-black/95 border border-red-500/30 rounded-lg lg:rounded-xl p-2.5 lg:p-3 xl:p-4 backdrop-blur-xl hover:border-red-500/60 transition-all"
            >
              <stat.icon className="text-red-400 text-base lg:text-xl xl:text-2xl mx-auto mb-1.5 lg:mb-2" />
              <div className="text-sm lg:text-lg xl:text-xl font-black text-white mb-0.5 lg:mb-1 text-center break-words leading-tight">
                {stat.value}
              </div>
              <div className="text-gray-400 text-[9px] lg:text-[10px] xl:text-xs text-center leading-tight">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        
        {/* Empty State Info - Compact */}
        {stats.activeStudents === 0 && stats.courseRating === 0 && (
          <div className="mt-2 lg:mt-3 p-2 lg:p-3 bg-yellow-900/20 border border-yellow-500/40 rounded-lg">
            <p className="text-yellow-400 text-[10px] lg:text-xs text-center">
              Stats will appear once you have course data
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(StatsEditor);