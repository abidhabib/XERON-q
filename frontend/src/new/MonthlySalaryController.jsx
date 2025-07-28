// src/components/User/MonthlySalaryDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios'; // Ensure axios is configured with withCredentials if needed globally
import { motion, AnimatePresence } from 'framer-motion'; // Import AnimatePresence for modal animations
import {
  FaCoins,
  FaCalendarAlt,
  FaUsers,
  FaCheckCircle,
  FaExclamationTriangle,
  FaHistory, // Import History icon
  FaSpinner,
  FaTimes // Import Times icon for close button
} from 'react-icons/fa';

const MonthlySalaryDashboard = () => {
  const [salaryData, setSalaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectionResult, setCollectionResult] = useState({ isOpen: false, type: '', message: '' });

  // --- History State ---
  const [history, setHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  // --- End History State ---

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Fetch salary status
  const fetchSalaryStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Ensure credentials are sent with the request
      const response = await axios.get(`${API_BASE_URL}/api/monthly-salary/status`, { withCredentials: true }); // Explicitly add if not global
      if (response.data.status === 'success') {
        setSalaryData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch salary status.');
      }
    } catch (err) {
      console.error("Error fetching monthly salary status:", err);
      setError(err.response?.data?.message || err.message || 'An error occurred while fetching data.');
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL]);

  // --- Fetch History Function ---
  const fetchSalaryHistory = useCallback(async () => {
    if (!isHistoryModalOpen) return; // Only fetch when modal is open

    setIsHistoryLoading(true);
    setHistoryError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/monthly-salary/history`, { withCredentials: true });
      if (response.data.status === 'success') {
        setHistory(response.data.history);
      } else {
        throw new Error(response.data.message || 'Failed to fetch salary history.');
      }
    } catch (err) {
      console.error("Error fetching monthly salary history:", err);
      setHistoryError(err.response?.data?.message || err.message || 'An error occurred while fetching history.');
      setHistory([]); // Clear history on error
    } finally {
      setIsHistoryLoading(false);
    }
  }, [API_BASE_URL, isHistoryModalOpen]);
  // --- End Fetch History ---

  useEffect(() => {
    fetchSalaryStatus();
  }, [fetchSalaryStatus]);

  // --- Fetch history when modal opens ---
  useEffect(() => {
    if (isHistoryModalOpen) {
      fetchSalaryHistory();
    }
  }, [isHistoryModalOpen, fetchSalaryHistory]);
  // --- End Fetch on Open ---

  const handleCollectSalary = async () => {
    if (!salaryData?.isEligible) return;

    setIsCollecting(true);
    setCollectionResult({ isOpen: false, type: '', message: '' });
    try {
      const response = await axios.post(`${API_BASE_URL}/api/monthly-salary/collect`, {}, { withCredentials: true }); // Add credentials
      if (response.data.status === 'success') {
        setCollectionResult({
          isOpen: true,
          type: 'success',
          message: response.data.message
        });
        fetchSalaryStatus(); // Refresh status
      } else {
        throw new Error(response.data.message || 'Failed to collect salary.');
      }
    } catch (err) {
      console.error("Error collecting monthly salary:", err);
      setCollectionResult({
        isOpen: true,
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to collect salary. Please try again.'
      });
    } finally {
      setIsCollecting(false);
    }
  };

  const closePopup = () => {
    setCollectionResult({ isOpen: false, type: '', message: '' });
  };

  // --- History Modal Handlers ---
  const openHistoryModal = () => {
    setIsHistoryModalOpen(true);
  };

  const closeHistoryModal = () => {
    setIsHistoryModalOpen(false);
    // Optionally clear history state when closing to save memory
    // setHistory([]);
    // setHistoryError(null);
  };
  // --- End History Modal Handlers ---

  // --- UI Helper Functions ---
  const getProgressPercentage = () => {
    if (!salaryData) return 0;
    if (salaryData.requiredJoins === 0) return 100;
    return Math.min((salaryData.recruitsThisMonth / salaryData.requiredJoins) * 100, 100);
  };

  const getProgressColor = () => {
    const percentage = getProgressPercentage();
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  // Helper to format YYYYMM to Month Year
  const formatYearMonth = (yearMonthStr) => {
    if (!yearMonthStr || yearMonthStr.length !== 6) return 'Invalid Date';
    const year = yearMonthStr.substring(0, 4);
    const monthIndex = parseInt(yearMonthStr.substring(4, 6), 10) - 1; // JS months are 0-indexed
    if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return 'Invalid Date';
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    return `${monthNames[monthIndex]} ${year}`;
  };
  // --- End UI Helpers ---

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
      {/* Popup/Toast for Collection Result */}
      <AnimatePresence>
        {collectionResult.isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-lg shadow-lg text-white flex items-center ${
              collectionResult.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {collectionResult.type === 'success' ? (
              <FaCheckCircle className="mr-2 text-xl" />
            ) : (
              <FaExclamationTriangle className="mr-2 text-xl" />
            )}
            <span>{collectionResult.message}</span>
            <button
              onClick={closePopup}
              className="ml-4 text-white hover:text-gray-200 focus:outline-none"
            >
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6"
        >
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center">
              <FaCoins className="mr-3" />
              Monthly Salary Dashboard
            </h1>
            <p className="text-indigo-100 mt-1">
              Track your progress and collect your monthly rewards.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <FaSpinner className="animate-spin text-4xl text-indigo-600" />
            </div>
          ) : error ? (
            <div className="p-6">
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
          ) : salaryData ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-indigo-50 rounded-xl p-4 border border-indigo-100"
                >
                  <div className="flex items-center">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                      <FaCoins className="text-indigo-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500">Current Balance</p>
                      <p className="text-xl font-bold text-gray-800">${salaryData.currentBalance.toFixed(2)}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-purple-50 rounded-xl p-4 border border-purple-100"
                >
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <FaCalendarAlt className="text-purple-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500">Current Month</p>
                      <p className="text-xl font-bold text-gray-800">{salaryData.currentMonthName}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-blue-50 rounded-xl p-4 border border-blue-100"
                >
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FaUsers className="text-blue-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500">Your Level</p>
                      <p className="text-xl font-bold text-gray-800">Level {salaryData.currentLevel}</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Progress Section */}
              <div className="px-6 pb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Monthly Progress</h2>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Recruits: {salaryData.recruitsThisMonth} / {salaryData.requiredJoins}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {getProgressPercentage().toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <motion.div
                      className={`h-4 rounded-full ${getProgressColor()}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${getProgressPercentage()}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    ></motion.div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center text-sm text-gray-600">
                    <span className="mr-4 flex items-center">
                      <span className="font-medium">Salary:</span>
                      <span className="ml-1">${salaryData.levelSalary.toFixed(2)}</span>
                    </span>
                    <span className="mr-4 flex items-center">
                      <span className="font-medium">Salary Day:</span>
                      <span className="ml-1">
                        {salaryData.designatedSalaryDay ? (
                          <>
                            {salaryData.designatedSalaryDay}
                            <sup>{getOrdinalSuffix(salaryData.designatedSalaryDay)}</sup>
                          </>
                        ) : (
                          'N/A'
                        )}
                      </span>
                    </span>
                    <span className="flex items-center">
                      <span className="font-medium">Today:</span>
                      <span className="ml-1">
                        {salaryData.todayDate}
                        <sup>{getOrdinalSuffix(salaryData.todayDate)}</sup>
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Collect Salary Section */}
              <div className="px-6 pb-6">
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Salary Collection</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className={`text-sm ${salaryData.isEligible ? 'text-green-600' : 'text-red-600'}`}>
                        <span className="font-medium">Status:</span> {salaryData.reason}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <button
                        onClick={handleCollectSalary}
                        disabled={!salaryData.isEligible || isCollecting}
                        className={`px-5 py-2.5 rounded-lg font-medium flex items-center justify-center transition-all duration-300 ${
                          salaryData.isEligible && !isCollecting
                            ? 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {isCollecting ? (
                          <>
                            <FaSpinner className="animate-spin mr-2" />
                            Collecting...
                          </>
                        ) : (
                          <>
                            <FaCoins className="mr-2" />
                            Collect Salary
                          </>
                        )}
                      </button>
                      {/* History Button */}
                      <button
                        onClick={openHistoryModal}
                        className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium flex items-center justify-center transition-colors"
                      >
                        <FaHistory className="mr-2" />
                        View History
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No salary data available.
            </div>
          )}
        </motion.div>
      </div>

      {/* --- History Modal --- */}
      <AnimatePresence>
        {isHistoryModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            onClick={closeHistoryModal} // Close modal if backdrop is clicked
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
              <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center">
                  <FaHistory className="mr-2" /> Salary Payment History
                </h2>
                <button
                  onClick={closeHistoryModal}
                  className="text-gray-300 hover:text-white focus:outline-none"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {isHistoryLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <FaSpinner className="animate-spin text-3xl text-gray-500" />
                  </div>
                ) : historyError ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded text-center">
                    <p>Error loading history: {historyError}</p>
                  </div>
                ) : history.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {history.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                              {new Date(payment.payment_date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                              {formatYearMonth(payment.payment_year_month)}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                              {payment.level}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-green-600">
                              ${parseFloat(payment.amount).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    <FaHistory className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p>No salary payment history found.</p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-4 py-3 flex justify-end border-t border-gray-200">
                <button
                  onClick={closeHistoryModal}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* --- End History Modal --- */}
    </div>
  );
};

export default MonthlySalaryDashboard;