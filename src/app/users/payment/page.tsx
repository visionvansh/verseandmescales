// src/app/users/payment/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaDollarSign,
  FaChartLine,
  FaMoneyBillWave,
  FaClock,
  FaCheckCircle,
  FaSpinner,
  FaExternalLinkAlt,
  FaDownload,
  FaFilter,
  FaSearch,
  FaExclamationCircle,
  FaInfoCircle,
  FaCreditCard,
  FaUniversity,
  FaReceipt,
  FaChartBar,
  FaCalendarAlt,
} from "react-icons/fa";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Transaction {
  id: string;
  amount: number;
  platformFee: number;
  sellerAmount: number;
  stripeFee: number;
  netAmount: number;
  courseName: string;
  buyerName: string;
  buyerEmail: string;
  date: string;
  status: string;
  paymentMethod: string;
  stripePaymentId: string;
}

interface EarningsData {
  totalEarned: number;
  availableBalance: number;
  pendingBalance: number;
  withdrawnAmount: number;
  totalPlatformFees: number;
  totalStripeFees: number;
  netEarnings: number;
  stripeAccountStatus: string | null;
  stripeAccountId: string | null;
  transactionCount: number;
  avgTransactionValue: number;
  recentTransactions: Transaction[];
  withdrawals: Array<{
    id: string;
    amount: number;
    status: string;
    requestedAt: string;
    completedAt?: string;
    stripePayoutId?: string;
  }>;
  monthlyData: Array<{
    month: string;
    sales: number;
    fees: number;
    net: number;
  }>;
  courseBreakdown: Array<{
    courseName: string;
    sales: number;
    revenue: number;
  }>;
}

const COLORS = ['#dc2626', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

export default function PaymentDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EarningsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "analytics">("overview");

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/payment/dashboard', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch earnings');
      }
      
      const earningsData = await response.json();
      setData(earningsData);
    } catch (err: any) {
      console.error('Error fetching earnings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    try {
      setConnectingStripe(true);
      setError(null);
      
      const response = await fetch('/api/payment/connect-stripe', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create connect link');
      }
      
      const { url } = await response.json();
      
      if (!url) {
        throw new Error('No redirect URL received');
      }
      
      window.location.href = url;
    } catch (err: any) {
      console.error('Error connecting Stripe:', err);
      setError(err.message);
    } finally {
      setConnectingStripe(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!data || amount > data.availableBalance) {
      setError('Insufficient balance');
      return;
    }

    try {
      setWithdrawing(true);
      setError(null);
      
      const response = await fetch('/api/payment/withdraw', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Withdrawal failed');
      }

      setWithdrawAmount("");
      fetchEarningsData();
      
      // Show success message
      alert('✅ Withdrawal request submitted! Funds will arrive in 2-3 business days.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setWithdrawing(false);
    }
  };

  const exportTransactions = () => {
    if (!data) return;

    const csv = [
      ['Date', 'Course', 'Buyer', 'Gross', 'Platform Fee', 'Stripe Fee', 'Net Amount', 'Status'].join(','),
      ...data.recentTransactions.map(t => 
        [
          new Date(t.date).toLocaleDateString(),
          `"${t.courseName}"`,
          `"${t.buyerName}"`,
          t.amount.toFixed(2),
          t.platformFee.toFixed(2),
          t.stripeFee.toFixed(2),
          t.netAmount.toFixed(2),
          t.status
        ].join(',')
      )
    ].join('');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="text-red-500 text-4xl animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your earnings...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <FaExclamationCircle className="text-red-500 text-5xl mx-auto mb-4" />
          <h1 className="text-white text-2xl font-bold mb-4">Error Loading Dashboard</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={fetchEarningsData}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold mb-4">No Earnings Data</h1>
          <p className="text-gray-400">Start selling courses to see your earnings!</p>
        </div>
      </div>
    );
  }

  const needsStripeConnect = !data.stripeAccountId || data.stripeAccountStatus !== 'active';

  // Filter transactions
  const filteredTransactions = data.recentTransactions.filter(tx => {
    const matchesSearch = tx.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.buyerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const txDate = new Date(tx.date);
      const now = new Date();
      const daysDiff = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);
      
      matchesDate = dateFilter === '7d' ? daysDiff <= 7 :
                   dateFilter === '30d' ? daysDiff <= 30 :
                   dateFilter === '90d' ? daysDiff <= 90 : true;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-white mb-2">
                💰 Payment Dashboard
              </h1>
              <p className="text-gray-400">
                Track your sales, manage payouts, and analyze revenue
              </p>
            </div>
            <button
              onClick={exportTransactions}
              className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <FaDownload />
              Export Data
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-start gap-3"
            >
              <FaExclamationCircle className="text-red-400 text-xl mt-0.5" />
              <div className="flex-1">
                <h4 className="text-red-400 font-semibold mb-1">Error</h4>
                <p className="text-gray-300 text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </motion.div>
          )}

          {/* Stripe Connect Banner */}
          {needsStripeConnect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/50 rounded-xl p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FaUniversity className="text-yellow-400 text-2xl" />
                    <h3 className="text-xl font-bold text-yellow-400">
                      Connect Your Bank Account
                    </h3>
                  </div>
                  <p className="text-gray-300 mb-4">
                    Connect your bank account via Stripe to receive automatic payouts. 
                    Funds are typically available within 2-3 business days.
                  </p>
                  <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
                    <FaCheckCircle className="text-green-400" />
                    <span>Secure & encrypted</span>
                    <FaCheckCircle className="text-green-400" />
                    <span>Automatic transfers</span>
                    <FaCheckCircle className="text-green-400" />
                    <span>No setup fees</span>
                  </div>
                  <button
                    onClick={handleConnectStripe}
                    disabled={connectingStripe}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-6 py-3 rounded-lg font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {connectingStripe ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <FaUniversity />
                        Connect Bank Account
                        <FaExternalLinkAlt className="text-xs" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={FaDollarSign}
              label="Total Revenue"
              value={`$${data.totalEarned.toFixed(2)}`}
              subtext={`${data.transactionCount} transactions`}
              color="from-green-600 to-green-700"
              trend={+15.2}
            />
            <StatCard
              icon={FaMoneyBillWave}
              label="Available Balance"
              value={`$${data.availableBalance.toFixed(2)}`}
              subtext="Ready to withdraw"
              color="from-blue-600 to-blue-700"
              highlight={data.availableBalance > 0}
            />
            <StatCard
              icon={FaClock}
              label="Pending"
              value={`$${data.pendingBalance.toFixed(2)}`}
              subtext="Processing payments"
              color="from-yellow-600 to-yellow-700"
            />
            <StatCard
              icon={FaCheckCircle}
              label="Withdrawn"
              value={`$${data.withdrawnAmount.toFixed(2)}`}
              subtext="Lifetime payouts"
              color="from-purple-600 to-purple-700"
            />
          </div>

          {/* Detailed Breakdown */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <FaReceipt className="text-red-400 text-xl" />
                <h3 className="text-lg font-bold text-white">Fee Breakdown</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Gross Revenue:</span>
                  <span className="text-white font-semibold">${data.totalEarned.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Platform Fee (10%):</span>
                  <span className="text-red-400">-${data.totalPlatformFees.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Stripe Fees (~2.9%):</span>
                  <span className="text-red-400">-${data.totalStripeFees.toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-gray-700">
                  <div className="flex justify-between">
                    <span className="text-white font-bold">Net Earnings:</span>
                    <span className="text-green-400 font-bold">${data.netEarnings.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <FaChartBar className="text-blue-400 text-xl" />
                <h3 className="text-lg font-bold text-white">Performance</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Sales:</span>
                  <span className="text-white font-semibold">{data.transactionCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Avg. Sale Value:</span>
                  <span className="text-white font-semibold">${data.avgTransactionValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Success Rate:</span>
                  <span className="text-green-400 font-semibold">98.5%</span>
                </div>
                <div className="pt-3 border-t border-gray-700">
                  <div className="flex justify-between">
                    <span className="text-white font-bold">This Month:</span>
                    <span className="text-blue-400 font-bold">
                      {data.monthlyData?.[data.monthlyData.length - 1]?.sales || 0} sales
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <FaInfoCircle className="text-purple-400 text-xl" />
                <h3 className="text-lg font-bold text-white">Payout Info</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Status:</span>
                  <span className={`font-semibold ${
                    data.stripeAccountStatus === 'active' 
                      ? 'text-green-400' 
                      : 'text-yellow-400'
                  }`}>
                    {data.stripeAccountStatus === 'active' ? '✓ Active' : 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Method:</span>
                  <span className="text-white font-semibold">Bank Transfer</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Frequency:</span>
                  <span className="text-white font-semibold">On Demand</span>
                </div>
                <div className="pt-3 border-t border-gray-700">
                  <div className="flex justify-between">
                    <span className="text-white font-bold">Processing:</span>
                    <span className="text-purple-400 font-semibold">2-3 days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Withdrawal Section */}
          {!needsStripeConnect && data.availableBalance > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <FaUniversity className="text-green-400 text-2xl" />
                <h3 className="text-xl font-bold text-white">
                  Withdraw Funds
                </h3>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Transfer your available balance to your connected bank account. 
                Minimum withdrawal: \$10.00
              </p>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                    step="0.01"
                    min="10"
                    max={data.availableBalance}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  />
                  <p className="text-gray-400 text-xs mt-2">
                    Available: ${data.availableBalance.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={handleWithdraw}
                  disabled={
                    withdrawing || 
                    !withdrawAmount || 
                    parseFloat(withdrawAmount) < 10 ||
                    parseFloat(withdrawAmount) > data.availableBalance
                  }
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                >
                  {withdrawing ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaMoneyBillWave />
                      Withdraw
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-700">
            {[
              { id: 'overview', label: 'Overview', icon: FaChartLine },
              { id: 'transactions', label: 'Transactions', icon: FaReceipt },
              { id: 'analytics', label: 'Analytics', icon: FaChartBar },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'text-red-400 border-b-2 border-red-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Revenue Chart */}
                {data.monthlyData && data.monthlyData.length > 0 && (
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-6">
                      Revenue Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={data.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="sales"
                          stroke="#dc2626"
                          strokeWidth={2}
                          dot={{ fill: '#dc2626' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="net"
                          stroke="#22c55e"
                          strokeWidth={2}
                          dot={{ fill: '#22c55e' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Course Breakdown */}
                {data.courseBreakdown && data.courseBreakdown.length > 0 && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                      <h3 className="text-xl font-bold text-white mb-6">
                        Top Courses
                      </h3>
                      <div className="space-y-4">
                        {data.courseBreakdown.slice(0, 5).map((course, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-white font-medium">{course.courseName}</p>
                              <p className="text-gray-400 text-sm">{course.sales} sales</p>
                            </div>
                            <p className="text-green-400 font-bold">
                              ${course.revenue.toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                      <h3 className="text-xl font-bold text-white mb-6">
                        Revenue Distribution
                      </h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={data.courseBreakdown.slice(0, 6)}
                            dataKey="revenue"
                            nameKey="courseName"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label
                          >
                            {data.courseBreakdown.slice(0, 6).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'transactions' && (
              <motion.div
                key="transactions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Filters */}
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="all">All Status</option>
                      <option value="succeeded">Succeeded</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="all">All Time</option>
                      <option value="7d">Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                      <option value="90d">Last 90 Days</option>
                    </select>
                  </div>
                </div>

                {/* Transactions Table */}
                <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-900/50">
                        <tr>
                          <th className="text-left p-4 text-gray-400 font-semibold">Date</th>
                          <th className="text-left p-4 text-gray-400 font-semibold">Course</th>
                          <th className="text-left p-4 text-gray-400 font-semibold">Buyer</th>
                          <th className="text-right p-4 text-gray-400 font-semibold">Gross</th>
                          <th className="text-right p-4 text-gray-400 font-semibold">Platform Fee</th>
                          <th className="text-right p-4 text-gray-400 font-semibold">Stripe Fee</th>
                          <th className="text-right p-4 text-gray-400 font-semibold">Net</th>
                          <th className="text-center p-4 text-gray-400 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((tx, index) => (
                          <tr
                            key={tx.id}
                            className={`border-t border-gray-700 hover:bg-gray-900/30 transition-colors ${
                              index % 2 === 0 ? 'bg-gray-900/10' : ''
                            }`}
                          >
                            <td className="p-4 text-gray-300 text-sm">
                              {new Date(tx.date).toLocaleDateString()}
                            </td>
                            <td className="p-4 text-white font-medium max-w-xs truncate">
                              {tx.courseName}
                            </td>
                            <td className="p-4 text-gray-300 text-sm">
                              {tx.buyerName}
                            </td>
                            <td className="p-4 text-right text-white font-semibold">
                              ${tx.amount.toFixed(2)}
                            </td>
                            <td className="p-4 text-right text-red-400 text-sm">
                              -${tx.platformFee.toFixed(2)}
                            </td>
                            <td className="p-4 text-right text-red-400 text-sm">
                              -${tx.stripeFee.toFixed(2)}
                            </td>
                            <td className="p-4 text-right text-green-400 font-bold">
                              ${tx.netAmount.toFixed(2)}
                            </td>
                            <td className="p-4">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                tx.status === 'succeeded' 
                                  ? 'bg-green-500/20 text-green-400'
                                  : tx.status === 'pending'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : tx.status === 'failed'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-gray-500/20 text-gray-400'
                              }`}>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredTransactions.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-400">No transactions found</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-xl font-bold text-white mb-6">
                    Monthly Comparison
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="sales" fill="#dc2626" />
                      <Bar dataKey="fees" fill="#ef4444" />
                      <Bar dataKey="net" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Withdrawal History */}
                {data.withdrawals.length > 0 && (
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-6">
                      Withdrawal History
                    </h3>
                    <div className="space-y-4">
                      {data.withdrawals.map((withdrawal) => (
                        <div
                          key={withdrawal.id}
                          className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700"
                        >
                          <div className="flex-1">
                            <p className="text-white font-semibold">
                              ${withdrawal.amount.toFixed(2)}
                            </p>
                            <p className="text-gray-400 text-sm">
                              Requested {new Date(withdrawal.requestedAt).toLocaleDateString()}
                              {withdrawal.completedAt && ` • Completed ${new Date(withdrawal.completedAt).toLocaleDateString()}`}
                            </p>
                            {withdrawal.stripePayoutId && (
                              <p className="text-gray-500 text-xs mt-1">
                                ID: {withdrawal.stripePayoutId}
                              </p>
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            withdrawal.status === 'completed'
                              ? 'bg-green-500/20 text-green-400'
                              : withdrawal.status === 'processing'
                              ? 'bg-blue-500/20 text-blue-400'
                              : withdrawal.status === 'failed'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {withdrawal.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color,
  trend,
  highlight,
}: {
  icon: any;
  label: string;
  value: string;
  subtext: string;
  color: string;
  trend?: number;
  highlight?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-gray-800/50 rounded-xl p-6 border transition-all ${
        highlight ? 'border-green-500/50 shadow-lg shadow-green-500/20' : 'border-gray-700'
      }`}
    >
      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
        <Icon className="text-white text-xl" />
      </div>
      <h3 className="text-gray-400 text-sm mb-2">{label}</h3>
      <div className="flex items-end justify-between">
        <p className="text-white text-3xl font-black">{value}</p>
        {trend && (
          <span className={`text-sm font-semibold ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-gray-500 text-xs mt-2">{subtext}</p>
    </motion.div>
  );
}