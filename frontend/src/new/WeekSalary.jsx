// src/components/User/SalaryCollection.jsx (or wherever this file is located)
import React, { useState, useEffect, useContext, lazy, Suspense } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion'; // Import AnimatePresence
import {
  FaCalendarAlt,
  FaUserPlus,
  FaCheckCircle,
  FaCoins,
  FaTrophy,
  FaChartLine,
  FaHistory,
  FaExclamationTriangle,
  FaVrCardboard,
  FaSpinner // Import spinner icon
} from 'react-icons/fa';
import { UserContext } from '../UserContext/UserContext';
import { RemoveTrailingZeros } from '../../utils/utils';

// Lazy load NavBar component
const NavBar = lazy(() => import('../NavBAr'));

const SalaryCollection = () => {
  const [salaryData, setSalaryData] = useState(null);
  const [loading, setLoading] = useState(true); // Initially true for initial load
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [collecting, setCollecting] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { Userid } = useContext(UserContext);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Define base URL

  const fetchSalaryStatus = async () => {
    // Only set loading to true if it's the very first load or a manual refresh
    // setLoading(true); // Removed from here to prevent flicker on tab switch
    setError(''); // Clear previous errors
    try {
      const response = await axios.get(`${API_BASE_URL}/salary-status`, {
        withCredentials: true
      });
      setSalaryData(response.data.data);
      // setError(''); // Error cleared in try block
    } catch (err) {
      console.error("Error fetching salary status:", err);
      setError(err.response?.data?.error || err.message || 'Failed to load salary data');
      setSalaryData(null); // Clear potentially stale data on error
    } finally {
      // Only stop loading if we were actually loading (initial load or refresh)
      // This prevents the main UI from flickering when switching tabs
      // setLoading(false); // Removed from here
    }
  };

  const fetchSalaryHistory = async () => {
    if (history.length > 0) return; // Avoid refetching if already loaded
    setHistoryLoading(true);
    setError(''); // Clear errors related to history fetch
    try {
      const response = await axios.get(`${API_BASE_URL}/api/salary-history`, {
        withCredentials: true
      });
      setHistory(response.data.history);
    } catch (err) {
      console.error("Error fetching salary history:", err);
      setError(err.response?.data?.error || err.message || 'Failed to load salary history');
      // Optionally set a specific history error state if needed
    } finally {
      setHistoryLoading(false);
    }
  };

  // Handle initial data load
  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        await fetchSalaryStatus(); // Wait for status to load
        setLoading(false);
    };
    loadData();
  }, [Userid]); // Re-run on Userid change (if that indicates a need to reload base data)

  // Handle history loading when the history tab is selected
  useEffect(() => {
    if (activeTab === 'history' && history.length === 0) {
      fetchSalaryHistory();
    }
  }, [activeTab, history.length]); // Depend on activeTab and history length

  const collectSalary = async () => {
    if (!salaryData?.isEligible) return; // Guard clause
    try {
      setCollecting(true);
      setError('');
      setSuccess('');
      const response = await axios.post(`${API_BASE_URL}/collect-salary`, {}, { // Added empty body {}
        withCredentials: true
      });
      setSuccess(response.data.message);
      // Update local state optimistically or pessimistically
      // Pessimistic: Update after successful response
      setSalaryData(prev => ({
        ...prev,
        wallet: response.data.newBalance,
        isEligible: false,
        reason: "Collection completed for this week"
      }));
      // Optionally refresh history if you want the new payment to appear immediately
      // setHistory([]); // Clear history to force refetch
      // if (activeTab === 'history') fetchSalaryHistory();

    } catch (err) {
      console.error("Error collecting salary:", err);
      setError(err.response?.data?.error || err.message || 'Failed to collect salary');
    } finally {
      setCollecting(false);
      // Refresh data after collection - consider if this is necessary or too aggressive
      // setTimeout(fetchSalaryStatus, 1000); // Delay slightly to allow backend update
    }
  };

  // Helper functions
  const getProgressPercentage = () => {
    if (!salaryData || salaryData.sameLevelRequirement === 0) return 0; // Prevent division by zero
    const percent = (salaryData.newMembersThisWeek / salaryData.sameLevelRequirement) * 100;
    return Math.min(percent, 100);
  };

  const getProgressColor = () => {
    const percentage = getProgressPercentage();
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  // CircularProgress component
  const CircularProgress = ({ percentage }) => {
    const radius = 90;
    const stroke = 20;
    const normalizedRadius = radius - stroke / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <motion.circle // Use motion.circle for animation
          stroke="#19202a"
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }} // Start hidden
          animate={{ strokeDashoffset: offset }} // Animate to calculated offset
          transition={{ duration: 1.5, ease: "easeOut" }} // Add transition
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="fill-gray-800 font-semibold text-sm"
        >
          {percentage.toFixed(0)}%
        </text>
      </svg>
    );
  };

  const currDayName = new Date().toLocaleString('en-US', { weekday: 'long' });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-10">
      {/* Lazy loaded NavBar with Suspense fallback */}
      <Suspense fallback={
        <div className="h-16 bg-[#19202a] flex items-center justify-center">
          <FaSpinner className="animate-spin text-white text-xl" />
        </div>
      }>
        <NavBar />
      </Suspense>

      {/* Loading Overlay Screen */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }} // For AnimatePresence
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white bg-opacity-80"
        >
          <FaSpinner className="animate-spin text-4xl text-indigo-600 mb-4" />
          <p className="text-lg font-medium text-gray-700">Loading your salary dashboard...</p>
        </motion.div>
      )}

      {/* Main Content (conditionally rendered after initial load) */}
      {!loading && (
        <>
         {/* Header */}
        {salaryData && ( // Only render header if data exists
         <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-[#19202a] p-4 shadow-xl text-white"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold flex items-center">
                  <FaCoins className="mr-3 text-yellow-300" />
                  Weekly Salary Dashboard
                </h1>
                <p className="text-indigo-100 text-sm mt-2">
                  Track your progress and collect your weekly salary
                </p>
              </div>
              <div className="flex justify-between w-full md:w-auto md:mt-0 mt-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center mr-2 md:mr-4">
                  <FaCalendarAlt className="mr-2 text-indigo-200" />
                  <div>
                    <p className="text-sm font-medium text-indigo-200">Current Day</p>
                    <p className="text-sm font-bold">
                      {currDayName || 'Loading...'}
                    </p>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center">
                  <FaVrCardboard className="mr-2 text-indigo-200" />
                  <div>
                    <p className="text-sm font-medium text-indigo-200">Current Balance</p>
                    <p className="text-sm font-bold">
                      $ {salaryData ? RemoveTrailingZeros(salaryData.wallet) : '0.00'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className='text-sm mt-3 mb-3 text-yellow-300 block'
            >
              Your Stage <span className="font-bold text-indigo-200"> {salaryData?.currentLevel}</span> and your salary day is <span className="font-bold text-indigo-200"> {salaryData?.dayName}</span>
            </motion.span>
          </motion.div>
        )}

          {/* Tabs */}
          {salaryData && ( // Only render tabs if data exists
          <motion.div
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.4, delay: 0.1 }}
            className="max-w-4xl mx-auto mt-6 px-4"
          >
            <div className="flex border-b border-gray-200">
              <button
                className={`px-4 py-2 font-medium text-sm flex items-center ${
                  activeTab === 'dashboard'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('dashboard')}
              >
                <FaChartLine className="mr-2" />
                Dashboard
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm flex items-center ${
                  activeTab === 'history'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('history')}
              >
                <FaHistory className="mr-2" />
                History
              </button>
            </div>
          </motion.div>
          )}

          {/* Dashboard Content */}
          {salaryData && activeTab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className=" w-full px-2 mt-3"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-3 border border-blue-100 shadow-sm"
                >
                  <div className="flex items-center">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg text-white">
                      <FaUserPlus className="text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-blue-600 font-medium">Recruits This Week</p>
                      <p className="text-gray-800">
                        {salaryData.newMembersThisWeek}/{salaryData.sameLevelRequirement}
                      </p>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-3 border border-teal-100 shadow-sm"
                >
                  <div className="flex items-center">
                    <div className="p-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg text-white">
                      <FaCalendarAlt className="text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-teal-600 font-medium">Next Salary Day</p>
                      <p className="text-gray-800">
                        {salaryData.dayName}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Progress Section */}
              <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-md mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">
                    Weekly Progress
                  </h2>
                  <div className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-medium">
                    {getProgressPercentage().toFixed(1)}% Complete
                  </div>
                </div>
                {/* Interactive Progress Visualization */}
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  {/* Circular Progress */}
                  <div className="flex-shrink-0">
                    <CircularProgress percentage={getProgressPercentage()} />
                  </div>
                  {/* Progress Details */}
                  <div className="flex-1 w-full">
                    {/* Progress bar with animation */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span className='underline'>Recruitment Progress</span>
                        <span>{getProgressPercentage().toFixed(1)}%</span>
                      </div>
                      <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${getProgressColor()}`}
                          initial={{ width: 0 }} // Animate width on load
                          animate={{ width: `${getProgressPercentage()}%` }}
                          transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }} // Delay slightly
                        />
                      </div>
                    </div>
                    {/* Milestones */}
                    <div className="space-y-4 mt-3 mb-3">
                      <h3 className="font-semibold text-gray-700 flex items-center">
                        <FaTrophy className="text-yellow-500 mr-2" />
                        Progress Milestones
                      </h3>
                      {/* Add milestone details here if available */}
                    </div>
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100">
                        <p className="text-xs text-indigo-600 font-medium">Current Salary</p>
                        <p className="text-lg font-bold text-gray-800">
                          ${salaryData.salaryAmount}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-100">
                        <p className="text-xs text-blue-600 font-medium">Required Recruits</p>
                        <p className="text-lg font-bold text-gray-800">
                          {salaryData.sameLevelRequirement}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Collect Section */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-2 border border-indigo-100 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Salary Collection</h3>
                    <div className={`inline-flex items-center px-4 py-2 rounded-xl ${
                      salaryData.isEligible
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {salaryData.isEligible ? (
                        <FaCheckCircle className="mr-2 text-green-600" />
                      ) : (
                        <FaExclamationTriangle className="mr-2 text-orange-600" />
                      )}
                      <span className="font-medium">{salaryData.reason}</span>
                    </div>
                  </div>
                  <div className="w-full md:w-auto">
                    <motion.button
                      whileHover={{ scale: salaryData.isEligible && !collecting ? 1.03 : 1 }}
                      whileTap={{ scale: salaryData.isEligible && !collecting ? 0.98 : 1 }}
                      onClick={collectSalary}
                      disabled={!salaryData.isEligible || collecting}
                      className={`w-full py-3 px-6 rounded-xl font-bold flex items-center justify-center transition-all ${
                        salaryData.isEligible && !collecting
                          ? 'bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white shadow-lg'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {collecting ? (
                        <>
                          <FaSpinner className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <FaCoins className="mr-2" />
                          Collect ${RemoveTrailingZeros(salaryData.salaryAmount)}
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
                {salaryData.isEligible && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.5 }}
                    className="mt-4 p-4 bg-white rounded-xl border border-green-200 flex items-start"
                  >
                    <FaCheckCircle className="text-green-500 text-2xl mr-3 mt-1" />
                    <div>
                      <p className="text-green-800 font-medium">
                        You're eligible to collect your salary!
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Click the button to receive ${RemoveTrailingZeros(salaryData.salaryAmount)} now
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* How It Works */}
              <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.4 }}
                className="mt-8 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
              >
                <h3 className="text-lg font-bold text-gray-800 mb-4">How Salary Works</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 mr-3">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Weekly Payment Cycle</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Salary is paid on your stage's specific day each week ({salaryData.dayName})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 mr-3">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Recruitment Requirements</p>
                      <p className="text-sm text-gray-600 mt-1">
                        You need {salaryData.sameLevelRequirement} new recruits each week to qualify
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 mr-3">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Instant Payment</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Salary is added to your wallet immediately upon collection
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* History Tab */}
          {salaryData && activeTab === 'history' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto px-2 mt-3" // Adjusted margin
            >
              <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <FaHistory className="mr-2 text-indigo-600" />
                  Payment History
                </h2>
                {historyLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <FaSpinner className="animate-spin text-3xl text-indigo-600" />
                  </div>
                ) : history.length > 0 ? (
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2"> {/* Added scroll */}
                    <AnimatePresence>
                      {history.map((payment, index) => (
                        <motion.div
                          key={index} // Consider using a unique ID if available
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }} // Exit animation
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center">
                            <div className="p-3 bg-indigo-100 rounded-lg text-indigo-700">
                              <FaCoins className="text-xl" />
                            </div>
                            <div className="ml-4">
                              <p className="font-bold text-gray-800">
                                ${RemoveTrailingZeros(payment.amount)}
                              </p>
                              <p className="text-sm text-gray-600">
                                Stage {payment.level}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">{payment.date}</p>
                            <p className="text-xs text-gray-500 mt-1">{payment.time}</p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-10 text-gray-500"
                  >
                    <FaHistory className="mx-auto text-4xl text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No payment history found</p>
                    <p className="mt-2">Your salary payments will appear here once collected</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Error Message Popup */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.3 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.5 }}
                className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 px-2 py-4 rounded-xl shadow-lg bg-red-100 text-red-700 flex items-center max-w-md"
              >
                <FaExclamationTriangle className="mr-3 text-xl flex-shrink-0" />
                <span className="break-words">{error}</span>
                <button
                  onClick={() => setError('')}
                  className="ml-4 text-red-700 hover:text-red-800 flex-shrink-0"
                >
                  &times;
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Message Popup */}
          <AnimatePresence>
            {success && (
              <motion.div
               initial={{ opacity: 0, y: 50, scale: 0.3 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.5 }}
                className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-2 py-2 rounded-xl shadow-lg bg-green-100 text-green-700 flex items-center max-w-md"
              >
                <FaCheckCircle className="mr-3 text-xl flex-shrink-0" />
                <span className="break-words">{success}</span>
                <button
                  onClick={() => setSuccess('')}
                  className="ml-4 text-green-700 hover:text-green-800 flex-shrink-0"
                >
                  &times;
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

export default SalaryCollection;