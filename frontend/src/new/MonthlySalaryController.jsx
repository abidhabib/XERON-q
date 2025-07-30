// src/components/User/MonthlySalaryDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCoins,
  FaCalendarAlt,
  FaUsers,
  FaCheckCircle,
  FaExclamationTriangle,
  FaHistory,
  FaSpinner,
  FaTimes,
  FaCrown,
  FaTrophy,
  FaMedal,
  FaWallet,
  FaDollyFlatbed,
  FaVrCardboard
} from 'react-icons/fa';

const MonthlySalaryDashboard = () => {
  const [salaryData, setSalaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectionResult, setCollectionResult] = useState({ 
    isOpen: false, 
    type: '', 
    message: '' 
  });
  
  const [history, setHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Fetch monthly salary status
  const fetchSalaryStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/monthly-salary/status`, 
        { withCredentials: true }
      );
      
      if (response.data.status === 'success') {
        setSalaryData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch salary status');
      }
    } catch (err) {
      console.error("Error fetching monthly salary status:", err);
      setError(err.response?.data?.message || err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch salary history
  const fetchSalaryHistory = async () => {
    setIsHistoryLoading(true);
    setHistory([]);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/monthly-salary/history`, 
        { withCredentials: true }
      );
      
      if (response.data.status === 'success') {
        setHistory(response.data.history);
      } else {
        throw new Error(response.data.message || 'Failed to fetch history');
      }
    } catch (err) {
      console.error("Error fetching salary history:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Collect monthly salary
  const handleCollectSalary = async () => {
    if (!salaryData?.isEligible) return;
    
    setIsCollecting(true);
    setCollectionResult({ isOpen: false, type: '', message: '' });
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/monthly-salary/collect`, 
        {}, 
        { withCredentials: true }
      );
      
      if (response.data.status === 'success') {
        setCollectionResult({
          isOpen: true,
          type: 'success',
          message: response.data.message
        });
        // Refresh status and balance
        await fetchSalaryStatus();
      } else {
        throw new Error(response.data.message || 'Failed to collect salary');
      }
    } catch (err) {
      console.error("Error collecting salary:", err);
      setCollectionResult({
        isOpen: true,
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to collect salary'
      });
    } finally {
      setIsCollecting(false);
    }
  };

  // Open history modal and fetch data
  const openHistoryModal = () => {
    setIsHistoryModalOpen(true);
    fetchSalaryHistory();
  };

  // Helper functions
  const getProgressPercentage = () => {
    if (!salaryData || salaryData.requiredJoins === 0) return 0;
    return Math.min(100, (salaryData.recruitsThisMonth / salaryData.requiredJoins) * 100);
  };

  const getProgressColor = () => {
    const percentage = getProgressPercentage();
    if (percentage >= 100) return 'bg-gradient-to-r from-green-500 to-emerald-600';
    if (percentage >= 75) return 'bg-gradient-to-r from-blue-500 to-indigo-600';
    if (percentage >= 50) return 'bg-gradient-to-r from-yellow-500 to-amber-600';
    return 'bg-gradient-to-r from-red-500 to-rose-600';
  };



  const formatYearMonth = (yearMonthStr) => {
    if (!yearMonthStr || yearMonthStr.length !== 6) return 'Invalid Date';
    const year = yearMonthStr.substring(0, 4);
    const monthIndex = parseInt(yearMonthStr.substring(4, 6), 10) - 1;
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return monthIndex >= 0 && monthIndex < 12 
      ? `${monthNames[monthIndex]} ${year}` 
      : 'Invalid Date';
  };

  // Circular progress component
  const CircularProgress = ({ percentage, size = 180 }) => {
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeDasharray={circumference}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%" >
              <stop offset="0%" stopColor="#19202a" />
              <stop offset="100%" stopColor="#19202a" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl  font-bold text-gray-800">
            {salaryData?.recruitsThisMonth || 0}/{salaryData?.requiredJoins || 0}
          </span>
          <span className="text-xs text-gray-500 mt-1">Recruits</span>
        </div>
      </div>
    );
  };

  useEffect(() => {
    fetchSalaryStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Notification Popup */}
      <AnimatePresence>
        {collectionResult.isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-xl shadow-xl text-white flex items-center ${
              collectionResult.type === 'success' 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                : 'bg-gradient-to-r from-red-500 to-rose-600'
            }`}
          >
            {collectionResult.type === 'success' ? (
              <FaCheckCircle className="mr-3 text-xl" />
            ) : (
              <FaExclamationTriangle className="mr-3 text-xl" />
            )}
            <span className="font-medium">{collectionResult.message}</span>
            <button
              onClick={() => setCollectionResult({ isOpen: false, type: '', message: '' })}
              className="ml-4 text-white hover:text-gray-200 focus:outline-none"
            >
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dashboard Layout */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Dashboard Header */}
        <div className="bg-[#19202a] p-6 md:p-8 rounded-2xl shadow-xl text-white mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center">
                <FaCoins className="mr-3 text-yellow-300" />
                Monthly Salary Dashboard
              </h1>
              <p className="text-indigo-100 mt-1">
                Track your progress and collect your monthly rewards
              </p>
            </div>
           <div className="flex justify-between w-full">
             <div className="mt-4 md:mt-0 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 flex items-center">
              <FaCalendarAlt className="mr-2 text-indigo-200" />
              <div>
                <p className="text-sm font-medium text-indigo-200">Current Month</p>
                <p className="text-lg font-bold">
                  {salaryData?.currentMonthName || 'Loading...'}
                </p>
              </div>
            </div>
             <div className="mt-4 md:mt-0 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 flex items-center">
              <FaVrCardboard className="mr-2 text-indigo-200" />
              <div>
                <p className="text-sm font-medium text-indigo-200">Current Balance</p>
                <p className="text-lg font-bold">
                 $ {salaryData?.currentBalance || 'Loading...'}
                </p>
              </div>
            </div>
           </div>

                     <span className='text-sm mt-3 mb-3 text-yellow-300 '>Your Stage <span className="font-bold text-indigo-200"> {salaryData?.currentLevel}</span> and your salary day is <span className="font-bold text-indigo-200"> {salaryData?.designatedSalaryDay}</span></span>

          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-indigo-600" />
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="p-6 mb-8">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaExclamationTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!isLoading && !error && salaryData && (
          <>
       
            {/* Progress Section */}
            <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-md mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Monthly Progress</h2>
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
         
              </div>
                     
                {/* Progress Details */}
                <div className="flex-1 w-full">
                    {/* Progress bar with animation */}
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Recruitment Progress</span>
                        <span>{getProgressPercentage().toFixed(1)}%</span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${getProgressColor()}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${getProgressPercentage()}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                    
                    {/* Milestones */}
                    <div className="space-y-4 mt-3 mb-3">
                      <h3 className="font-semibold text-gray-700 flex items-center">
                        <FaTrophy className="text-yellow-500 mr-2" />
                        Progress Milestones
                      </h3>
               
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100">
                        <p className="text-xs text-indigo-600 font-medium">Current Salary</p>
                        <p className="text-lg font-bold text-gray-800">
                          ${salaryData.levelSalary.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-100">
                        <p className="text-xs text-blue-600 font-medium">Required Recruits</p>
                        <p className="text-lg font-bold text-gray-800">
                          {salaryData.requiredJoins}
                        </p>
                      </div>
                    </div>
                  </div>
            </div>

            {/* Collect Salary Section */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-3 border border-indigo-100 shadow-sm">
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
                
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCollectSalary}
                    disabled={!salaryData.isEligible || isCollecting}
                    className={`px-6 py-3 rounded-xl font-bold flex items-center justify-center transition-all ${
                      salaryData.isEligible && !isCollecting
                        ? 'bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isCollecting ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FaCoins className="mr-2" />
                        Collect Salary
                      </>
                    )}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={openHistoryModal}
                    className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-800 rounded-xl font-bold flex items-center justify-center border border-gray-200 shadow-sm"
                  >
                    <FaHistory className="mr-2" />
                    Payment History
                  </motion.button>
                </div>
              </div>
              
              {salaryData.isEligible && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-white rounded-xl border border-green-200 flex items-start"
                >
                  <FaMedal className="text-green-500 text-2xl mr-3 mt-1" />
                  <div>
                    <p className="text-green-800 font-medium">
                      You're eligible to collect your salary!
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Click the button to receive ${salaryData.levelSalary.toFixed(2)} now
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </>
        )}
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {isHistoryModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            onClick={() => setIsHistoryModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-[#1a202c] text-white p-3 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center">
                  <FaHistory className="mr-3 text-yellow-400" /> 
                  Salary Payment History
                </h2>
                <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="text-gray-300 hover:text-white focus:outline-none"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {isHistoryLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <FaSpinner className="animate-spin text-3xl text-indigo-600" />
                  </div>
                ) : history.length > 0 ? (
                  <div className="space-y-4">
                    {history.map((payment) => (
                      <motion.div
                        key={payment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center">
                          <div className="p-3 bg-indigo-100 rounded-lg text-indigo-700">
                            <FaCoins className="text-xl" />
                          </div>
                          <div className="ml-4">
                            <p className="font-bold text-gray-800">
                              ${parseFloat(payment.amount).toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Stage {payment.level}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatYearMonth(payment.payment_year_month)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    <FaHistory className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No salary payment history found</p>
                    <p className="mt-2">Your salary payments will appear here once collected</p>
                  </div>
                )}
              </div>

            
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MonthlySalaryDashboard;