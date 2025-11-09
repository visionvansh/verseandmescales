"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaHistory,
  FaExclamationTriangle,
  FaExclamation,
  FaInfo,
  FaKey,
  FaLock,
  FaFingerprint,
  FaUserShield,
  FaDesktop,
  FaSearch,
  FaCalendarAlt,
  FaFilter,
  FaDownload,
  FaClock
} from "react-icons/fa";

// Define TypeScript interfaces for our data
interface SecurityEvent {
  type: "security";
  id: string;
  severity: "high" | "medium" | "low";
  description: string;
  ipAddress: string;
  createdAt: string;
  userAgent?: string;
}

interface ActivityLog {
  type: "activity";
  id: string;
  action: string;
  description: string;
  ipAddress: string;
  createdAt: string;
  userAgent?: string;
}

// Union type for combined logs
type Log = (SecurityEvent | ActivityLog) & { timestamp: Date };

interface ActivityLogSectionProps {
  securityEvents: SecurityEvent[];
  activityLogs: ActivityLog[];
  isLoading?: boolean;
}

// ✅ ENHANCED: Skeleton Components with Full Responsiveness
const StatsSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 mb-2.5 sm:mb-3 md:mb-4 lg:mb-5 animate-pulse">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="bg-gray-800/30 p-1.5 sm:p-2 md:p-2.5 lg:p-3 rounded-lg sm:rounded-xl">
        <div className="h-4 sm:h-5 md:h-6 lg:h-7 bg-gray-700/50 rounded w-8 sm:w-10 md:w-12 mx-auto mb-0.5 sm:mb-1"></div>
        <div className="h-2 sm:h-2.5 md:h-3 bg-gray-700/50 rounded w-12 sm:w-16 md:w-20 mx-auto"></div>
      </div>
    ))}
  </div>
);

const FilterSkeleton = () => (
  <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 mb-2.5 sm:mb-3 md:mb-4 lg:mb-5 animate-pulse">
    <div className="flex-1">
      <div className="h-8 sm:h-9 md:h-10 lg:h-11 bg-gray-800/30 border border-gray-700/50 rounded-lg sm:rounded-xl"></div>
    </div>
    <div className="flex gap-1.5 sm:gap-2">
      <div className="h-8 sm:h-9 md:h-10 lg:h-11 w-24 sm:w-28 md:w-32 bg-gray-800/30 border border-gray-700/50 rounded-lg sm:rounded-xl"></div>
      <div className="h-8 sm:h-9 md:h-10 lg:h-11 w-24 sm:w-28 md:w-32 bg-gray-800/30 border border-gray-700/50 rounded-lg sm:rounded-xl"></div>
    </div>
  </div>
);

const LogItemSkeleton = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-2 sm:p-2.5 md:p-3 lg:p-4 rounded-lg sm:rounded-xl border border-gray-700/30 bg-gray-800/30 animate-pulse"
  >
    <div className="flex items-start">
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 bg-gray-700/50 rounded-full"></div>
      </div>
      <div className="ml-2 sm:ml-2.5 md:ml-3 flex-1 space-y-1.5 sm:space-y-2">
        <div className="flex justify-between gap-2">
          <div className="h-3 sm:h-3.5 md:h-4 bg-gray-700/50 rounded w-3/4"></div>
          <div className="h-2.5 sm:h-3 md:h-3.5 bg-gray-700/50 rounded w-12 sm:w-14 md:w-16 flex-shrink-0"></div>
        </div>
        <div className="h-2 sm:h-2.5 md:h-3 bg-gray-700/50 rounded w-24 sm:w-28 md:w-32"></div>
      </div>
    </div>
  </motion.div>
);

const LogGroupSkeleton = () => (
  <div className="space-y-1.5 sm:space-y-2 md:space-y-2.5">
    <div className="sticky top-0 z-10 bg-gray-900/90 backdrop-blur-sm py-1 sm:py-1.5 px-1.5 sm:px-2 rounded animate-pulse">
      <div className="h-3 sm:h-3.5 md:h-4 bg-gray-700/50 rounded w-20 sm:w-24 md:w-28"></div>
    </div>
    {[1, 2, 3].map((i) => (
      <LogItemSkeleton key={i} />
    ))}
  </div>
);

const PaginationSkeleton = () => (
  <div className="flex justify-between items-center mt-3 sm:mt-4 md:mt-5 animate-pulse">
    <div className="h-7 sm:h-8 md:h-9 w-16 sm:w-18 md:w-20 bg-gray-800/50 rounded-lg sm:rounded-xl"></div>
    <div className="h-3 sm:h-3.5 md:h-4 w-20 sm:w-24 md:w-28 bg-gray-800/50 rounded"></div>
    <div className="h-7 sm:h-8 md:h-9 w-16 sm:w-18 md:w-20 bg-gray-800/50 rounded-lg sm:rounded-xl"></div>
  </div>
);

const FullLoadingSkeleton = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex justify-between items-center mb-2.5 sm:mb-3 md:mb-4 lg:mb-5">
      <div className="h-4 sm:h-5 md:h-6 lg:h-7 bg-gray-700/50 rounded w-24 sm:w-28 md:w-32 animate-pulse"></div>
      <div className="h-6 sm:h-7 md:h-8 w-20 sm:w-22 md:w-24 bg-gray-800/50 rounded animate-pulse"></div>
    </div>
    
    <StatsSkeleton />
    <FilterSkeleton />
    
    <div className="space-y-3 sm:space-y-4 md:space-y-5 max-h-[400px] sm:max-h-[500px] md:max-h-[600px] overflow-y-auto pr-1 sm:pr-1.5 md:pr-2 custom-scrollbar">
      <LogGroupSkeleton />
      <LogGroupSkeleton />
    </div>
    
    <PaginationSkeleton />
  </motion.div>
);

// ✅ ENHANCED: Empty state component with full responsiveness
const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="text-center py-8 sm:py-10 md:py-12 lg:py-16 bg-gray-800/20 rounded-lg sm:rounded-xl border border-gray-700/30"
  >
    <FaHistory className="mx-auto h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 text-gray-500 mb-2 sm:mb-2.5 md:mb-3" />
    <p className="text-gray-400 text-sm sm:text-base md:text-lg lg:text-xl font-medium mb-0.5 sm:mb-1">No Activity Logs</p>
    <p className="text-gray-500 text-xs sm:text-sm md:text-base">Your account activity will appear here</p>
  </motion.div>
);

const NoResultsState = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="text-center py-6 sm:py-7 md:py-8 lg:py-10 bg-gray-800/20 rounded-lg sm:rounded-xl border border-gray-700/30"
  >
    <FaSearch className="mx-auto h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-gray-500 mb-1.5 sm:mb-2" />
    <p className="text-gray-400 text-sm sm:text-base md:text-lg">No logs found matching your filters</p>
    <p className="text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-1">Try adjusting your search or filters</p>
  </motion.div>
);

// ✅ Main Component with Full Responsiveness
const ActivityLogSection = ({ 
  securityEvents = [], 
  activityLogs = [],
  isLoading = false 
}: ActivityLogSectionProps) => {
  // State for filtering and viewing
  const [activeTab, setActiveTab] = useState<"all" | "security" | "activity">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  
  // Combine and sort all logs for the "All" tab
  const combinedLogs = useMemo<Log[]>(() => {
    if (activeTab === "security") return securityEvents.map(event => ({
      ...event,
      type: 'security' as const,
      timestamp: new Date(event.createdAt)
    }));
    
    if (activeTab === "activity") return activityLogs.map(log => ({
      ...log,
      type: 'activity' as const,
      timestamp: new Date(log.createdAt)
    }));
    
    const combined = [
      ...securityEvents.map(event => ({ 
        ...event, 
        type: 'security' as const,
        timestamp: new Date(event.createdAt)
      })),
      ...activityLogs.map(log => ({ 
        ...log, 
        type: 'activity' as const,
        timestamp: new Date(log.createdAt)
      }))
    ];
    
    return combined.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [securityEvents, activityLogs, activeTab]);
  
  // Apply search and time filters
  const filteredLogs = useMemo(() => {
    let filtered = combinedLogs;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        (log.description && log.description.toLowerCase().includes(term)) || 
        (log.type === "activity" && log.action.toLowerCase().includes(term)) || 
        (log.ipAddress && log.ipAddress.toLowerCase().includes(term))
      );
    }
    
    const now = new Date();
    if (timeFilter === "today") {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      filtered = filtered.filter(log => log.timestamp >= startOfDay);
    } else if (timeFilter === "week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
      filtered = filtered.filter(log => log.timestamp >= startOfWeek);
    } else if (timeFilter === "month") {
      const startOfMonth = new Date(now);
      startOfMonth.setMonth(now.getMonth() - 1);
      filtered = filtered.filter(log => log.timestamp >= startOfMonth);
    }
    
    return filtered;
  }, [combinedLogs, searchTerm, timeFilter]);
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (page - 1) * itemsPerPage, 
    page * itemsPerPage
  );
  
  // Group logs by date for better organization
  const groupedLogs = useMemo(() => {
    const groups: Record<string, Log[]> = {};
    
    paginatedLogs.forEach(log => {
      const date = log.timestamp.toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(log);
    });
    
    return groups;
  }, [paginatedLogs]);
  
  // Export logs as JSON
  const exportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + 
      encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `activity_logs_${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };
  
  // Get the appropriate icon for a log item
  const getLogIcon = (log: Log) => {
    if (log.type === 'security') {
      if (log.severity === "high") return <FaExclamationTriangle className="text-red-400" />;
      if (log.severity === "medium") return <FaExclamation className="text-yellow-400" />;
      return <FaInfo className="text-blue-400" />;
    } else {
      if (log.action?.includes("login")) return <FaKey className="text-blue-400" />;
      if (log.action?.includes("password")) return <FaLock className="text-yellow-400" />;
      if (log.action?.includes("2fa")) return <FaFingerprint className="text-green-400" />;
      if (log.action?.includes("profile")) return <FaUserShield className="text-purple-400" />;
      if (log.action?.includes("session")) return <FaDesktop className="text-red-400" />;
      return <FaHistory className="text-gray-400" />;
    }
  };
  
  // Statistics for the summary section
  const stats = useMemo(() => {
    return {
      total: combinedLogs.length,
      security: securityEvents.length,
      activity: activityLogs.length,
      highSeverity: securityEvents.filter(e => e.severity === "high").length,
      recent: combinedLogs.filter(log => 
        log.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length
    };
  }, [combinedLogs, securityEvents, activityLogs]);

  // Show full loading skeleton on initial load
  if (isLoading) {
    return <FullLoadingSkeleton />;
  }

  // Show empty state if no logs at all
  if (securityEvents.length === 0 && activityLogs.length === 0) {
    return (
      <motion.div
        key="activity"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-2.5 sm:mb-3 md:mb-4 lg:mb-5">
          <h4 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-medium text-white">
            Activity Log
          </h4>
        </div>
        <EmptyState />
      </motion.div>
    );
  }

  return (
    <motion.div
      key="activity"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* ✅ RESPONSIVE: Header with consistent spacing */}
      <div className="flex justify-between items-center mb-2.5 sm:mb-3 md:mb-4 lg:mb-5">
        <h4 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-medium text-white">
          Activity Log
        </h4>
        <motion.button
          onClick={exportLogs}
          disabled={filteredLogs.length === 0}
          className="text-[10px] xs:text-xs sm:text-sm md:text-base bg-gray-800 text-blue-400 hover:text-blue-300 px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 md:py-2 rounded-lg sm:rounded-xl flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaDownload className="mr-1 sm:mr-1.5 text-[10px] xs:text-xs sm:text-sm" /> 
          <span className="hidden xs:inline">Export Logs</span>
          <span className="xs:hidden">Export</span>
        </motion.button>
      </div>
      
      {/* ✅ RESPONSIVE: Summary Statistics */}
      <AnimatePresence mode="wait">
        <motion.div
          key="stats"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 mb-2.5 sm:mb-3 md:mb-4 lg:mb-5"
        >
          {[
            { value: stats.total, label: "Total Logs", color: "blue" },
            { value: stats.security, label: "Security Events", color: "yellow" },
            { value: stats.activity, label: "Account Activity", color: "green" },
            { value: stats.highSeverity, label: "High Severity", color: "red" },
            { value: stats.recent, label: "Last 24 Hours", color: "purple" }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-800/30 p-1.5 sm:p-2 md:p-2.5 lg:p-3 rounded-lg sm:rounded-xl text-center hover:bg-gray-800/50 transition-colors"
            >
              <div className={`text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-${stat.color}-400`}>
                {stat.value}
              </div>
              <div className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm text-gray-400 truncate">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
      
      {/* ✅ RESPONSIVE: Filter Controls */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 mb-2.5 sm:mb-3 md:mb-4 lg:mb-5"
      >
        <div className="relative flex-1">
          <FaSearch className="absolute left-2 sm:left-2.5 md:left-3 top-2 sm:top-2.5 md:top-3 text-gray-500 pointer-events-none text-xs sm:text-sm md:text-base" />
          <input
            type="text"
            placeholder="Search logs..."
            className="w-full bg-gray-800/30 border border-gray-700/50 rounded-lg sm:rounded-xl pl-7 sm:pl-8 md:pl-9 lg:pl-10 pr-2.5 sm:pr-3 md:pr-4 py-1.5 sm:py-2 md:py-2.5 lg:py-3 text-xs sm:text-sm md:text-base text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>
        
        <div className="flex gap-1.5 sm:gap-2">
          {/* ✅ RESPONSIVE: Time Filter */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              className="appearance-none w-full bg-gray-800/30 border border-gray-700/50 rounded-lg sm:rounded-xl pl-7 sm:pl-8 md:pl-9 pr-6 sm:pr-7 md:pr-8 py-1.5 sm:py-2 md:py-2.5 lg:py-3 text-xs sm:text-sm md:text-base text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all cursor-pointer"
              value={timeFilter}
              onChange={(e) => {
                setTimeFilter(e.target.value as typeof timeFilter);
                setPage(1);
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
            </select>
            <FaCalendarAlt className="absolute left-2 sm:left-2.5 md:left-3 top-2 sm:top-2.5 md:top-3 text-gray-500 pointer-events-none text-xs sm:text-sm md:text-base" />
          </div>
          
          {/* ✅ RESPONSIVE: Type Filter */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              className="appearance-none w-full bg-gray-800/30 border border-gray-700/50 rounded-lg sm:rounded-xl pl-7 sm:pl-8 md:pl-9 pr-6 sm:pr-7 md:pr-8 py-1.5 sm:py-2 md:py-2.5 lg:py-3 text-xs sm:text-sm md:text-base text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all cursor-pointer"
              value={activeTab}
              onChange={(e) => {
                setActiveTab(e.target.value as typeof activeTab);
                setPage(1);
              }}
            >
              <option value="all">All Logs</option>
              <option value="security">Security</option>
              <option value="activity">Activity</option>
            </select>
            <FaFilter className="absolute left-2 sm:left-2.5 md:left-3 top-2 sm:top-2.5 md:top-3 text-gray-500 pointer-events-none text-xs sm:text-sm md:text-base" />
          </div>
        </div>
      </motion.div>
      
      {/* ✅ RESPONSIVE: Log Display */}
      <AnimatePresence mode="wait">
        {filteredLogs.length === 0 ? (
          <NoResultsState />
        ) : (
          <motion.div
            key="logs-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2.5 sm:space-y-3 md:space-y-4 lg:space-y-5 max-h-[400px] sm:max-h-[500px] md:max-h-[600px] overflow-y-auto pr-1 sm:pr-1.5 md:pr-2 custom-scrollbar"
          >
            {Object.entries(groupedLogs).map(([date, logs], groupIndex) => (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.05 }}
                className="space-y-1.5 sm:space-y-2 md:space-y-2.5"
              >
                {/* ✅ RESPONSIVE: Date Header */}
                <div className="sticky top-0 z-10 bg-gray-900/90 backdrop-blur-sm py-1 sm:py-1.5 px-1.5 sm:px-2 md:px-2.5 rounded flex items-center">
                  <FaClock className="text-gray-500 mr-1.5 sm:mr-2 text-xs sm:text-sm md:text-base flex-shrink-0" />
                  <span className="text-xs sm:text-sm md:text-base text-gray-400 font-medium">{date}</span>
                </div>
                
                {/* ✅ RESPONSIVE: Log Items */}
                <AnimatePresence mode="popLayout">
                  {logs.map((log, logIndex) => (
                    <motion.div
                      key={log.id}
                      className={`p-2 sm:p-2.5 md:p-3 lg:p-4 rounded-lg sm:rounded-xl border transition-all cursor-pointer ${
                        expandedItem === log.id ? "bg-gray-700/30 shadow-lg" : "bg-gray-800/30"
                      } ${
                        log.type === 'security' ? 
                          (log.severity === "high" ? "border-red-500/30 hover:border-red-500/50" : 
                            log.severity === "medium" ? "border-yellow-500/30 hover:border-yellow-500/50" : 
                            "border-blue-500/30 hover:border-blue-500/50") :
                          "border-gray-700/30 hover:border-gray-600/50"
                      } hover:bg-gray-700/30`}
                      onClick={() => setExpandedItem(expandedItem === log.id ? null : log.id)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: logIndex * 0.03 }}
                      whileHover={{ x: 2 }}
                      layout
                    >
                      <div className="flex items-start">
                        {/* ✅ RESPONSIVE: Icon */}
                        <div className="flex-shrink-0 mt-0.5 text-xs sm:text-sm md:text-base">
                          {getLogIcon(log)}
                        </div>
                        
                        <div className="ml-2 sm:ml-2.5 md:ml-3 flex-1 min-w-0">
                          {/* ✅ RESPONSIVE: Header */}
                          <div className="flex justify-between items-start gap-2">
                            <div className="text-xs sm:text-sm md:text-base font-medium text-white flex-1 truncate">
                              {log.description}
                            </div>
                            <div className="text-[10px] xs:text-xs sm:text-sm text-gray-500 flex-shrink-0">
                              {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          
                          {/* ✅ RESPONSIVE: Metadata */}
                          <div className="text-[10px] xs:text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1 flex items-center flex-wrap gap-1 sm:gap-2">
                            <span className="font-mono truncate">{log.ipAddress}</span>
                            {log.type === 'security' && (
                              <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] xs:text-[10px] sm:text-xs font-medium ${
                                log.severity === "high" ? "bg-red-500/20 text-red-400" :
                                log.severity === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                                "bg-blue-500/20 text-blue-400"
                              }`}>
                                {log.severity.toUpperCase()}
                              </span>
                            )}
                          </div>
                          
                          {/* ✅ RESPONSIVE: Expanded details */}
                          <AnimatePresence>
                            {expandedItem === log.id && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="mt-2 sm:mt-2.5 md:mt-3 text-[10px] xs:text-xs sm:text-sm border-t border-gray-700/30 pt-2 sm:pt-2.5 md:pt-3"
                              >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 md:gap-3">
                                  {log.type === 'security' && (
                                    <>
                                      <div className="text-gray-500">Severity Level:</div>
                                      <div className={`font-medium ${
                                        log.severity === "high" ? "text-red-400" : 
                                        log.severity === "medium" ? "text-yellow-400" : 
                                        "text-blue-400"
                                      }`}>
                                        {log.severity.charAt(0).toUpperCase() + log.severity.slice(1)}
                                      </div>
                                    </>
                                  )}
                                  {log.type === 'activity' && (
                                    <>
                                      <div className="text-gray-500">Action Type:</div>
                                      <div className="text-gray-300 font-medium truncate">{log.action}</div>
                                    </>
                                  )}
                                  <div className="text-gray-500">Date & Time:</div>
                                  <div className="text-gray-300 font-mono text-[9px] xs:text-[10px] sm:text-xs truncate">
                                    {log.timestamp.toLocaleString()}
                                  </div>
                                  <div className="text-gray-500">IP Address:</div>
                                  <div className="text-gray-300 font-mono truncate">{log.ipAddress}</div>
                                  {log.userAgent && (
                                    <>
                                      <div className="text-gray-500">User Agent:</div>
                                      <div className="text-gray-300 text-[9px] xs:text-[10px] sm:text-xs break-all">
                                        {log.userAgent}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* ✅ RESPONSIVE: Pagination Controls */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-between items-center mt-3 sm:mt-4 md:mt-5 gap-2"
        >
          <motion.button 
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 bg-gray-800/50 rounded-lg sm:rounded-xl text-xs sm:text-sm md:text-base text-gray-400 hover:text-white hover:bg-gray-800/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            whileHover={{ scale: page === 1 ? 1 : 1.05 }}
            whileTap={{ scale: page === 1 ? 1 : 0.95 }}
          >
            <span className="hidden xs:inline">Previous</span>
            <span className="xs:hidden">Prev</span>
          </motion.button>
          
          <div className="flex flex-col xs:flex-row items-center gap-0.5 xs:gap-2">
            <span className="text-xs sm:text-sm md:text-base text-gray-400 whitespace-nowrap">
              Page {page} of {totalPages}
            </span>
            <span className="text-[10px] xs:text-xs sm:text-sm text-gray-500 whitespace-nowrap">
              ({filteredLogs.length} {filteredLogs.length === 1 ? 'log' : 'logs'})
            </span>
          </div>
          
          <motion.button 
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 bg-gray-800/50 rounded-lg sm:rounded-xl text-xs sm:text-sm md:text-base text-gray-400 hover:text-white hover:bg-gray-800/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            whileHover={{ scale: page === totalPages ? 1 : 1.05 }}
            whileTap={{ scale: page === totalPages ? 1 : 0.95 }}
          >
            Next
          </motion.button>
        </motion.div>
      )}

      {/* ✅ RESPONSIVE: Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        @media (min-width: 640px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 5px;
          }
        }
        
        @media (min-width: 768px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.5);
          border-radius: 10px;
          transition: background 0.2s;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.7);
        }
      `}</style>
    </motion.div>
  );
};

export default ActivityLogSection;