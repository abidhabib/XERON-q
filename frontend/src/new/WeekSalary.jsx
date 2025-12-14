import React, { useState, useEffect, useContext, lazy, Suspense } from 'react';
import axios from 'axios';
import {

  FaCheckCircle,
  FaCoins,
  FaChartLine,
  FaHistory,
  FaExclamationTriangle,
  FaSpinner
} from 'react-icons/fa';
import { UserContext } from '../UserContext/UserContext';
import { RemoveTrailingZeros } from '../../utils/utils';
import BalanceCard from './BalanceCard';

const NavBar = lazy(() => import('../NavBAr'));

const SalaryCollection = () => {
  const [salaryData, setSalaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [collecting, setCollecting] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { Userid } = useContext(UserContext);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchSalaryStatus = async () => {
    setError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/salary-status`, {
        withCredentials: true
      });
      setSalaryData(response.data.data);
    } catch (err) {
      console.error("Error fetching salary status:", err);
      setError(err.response?.data?.error || err.message || 'Failed to load salary data');
      setSalaryData(null);
    }
  };

  const fetchSalaryHistory = async () => {
    if (history.length > 0) return;
    setHistoryLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/salary-history`, {
        withCredentials: true
      });
      setHistory(response.data.history);
    } catch (err) {
      console.error("Error fetching salary history:", err);
      setError(err.response?.data?.error || err.message || 'Failed to load salary history');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchSalaryStatus();
      setLoading(false);
    };
    loadData();
  }, [Userid]);

  useEffect(() => {
    if (activeTab === 'history' && history.length === 0) {
      fetchSalaryHistory();
    }
  }, [activeTab, history.length]);

  const collectSalary = async () => {
    if (!salaryData?.isEligible) return;
    try {
      setCollecting(true);
      setError('');
      setSuccess('');
      const response = await axios.post(`${API_BASE_URL}/collect-salary`, {}, {
        withCredentials: true
      });
      setSuccess(response.data.message);
      setSalaryData(prev => ({
        ...prev,
        wallet: response.data.newBalance,
        isEligible: false,
        reason: "Collection completed for this week"
      }));
    } catch (err) {
      console.error("Error collecting salary:", err);
      setError(err.response?.data?.error || err.message || 'Failed to collect salary');
    } finally {
      setCollecting(false);
    }
  };

  const getProgressPercentage = () => {
    if (!salaryData || salaryData.sameLevelRequirement === 0) return 0;
    const percent = (salaryData.newMembersThisWeek / salaryData.sameLevelRequirement) * 100;
    return Math.min(percent, 100);
  };

  const getProgressColor = () => {
    const percentage = getProgressPercentage();
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const CircularProgress = ({ percentage }) => {
    const radius = 60;
    const stroke = 8;
    const normalizedRadius = radius - stroke / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative">
        <svg height={radius * 2} width={radius * 2}>
          <circle
            stroke="#e5e7eb"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke="#19202a"
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-800">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
    );
  };

  const currDayName = new Date().toLocaleString('en-US', { weekday: 'long' });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Fixed Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Suspense fallback={
          <div className="h-14 bg-[#19202a] flex items-center justify-center">
            <FaSpinner className="animate-spin text-white text-lg" />
          </div>
        }>
          <NavBar />
        </Suspense>
      </div>

      <BalanceCard/>
        {loading && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80">
            <FaSpinner className="animate-spin text-2xl text-indigo-600 mb-3" />
            <p className="text-sm font-medium text-gray-700">Loading dashboard...</p>
          </div>
        )}

        {/* Content */}
        {!loading && salaryData && (
          <div className="px-3 py-4 flex-1">
            <div className="max-w-md mx-auto w-full">
              {/* Header Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h1 className="text-lg font-bold text-gray-900 flex items-center">
                    <FaCoins className="mr-2 text-yellow-500" />
                    Weekly Salary
                  </h1>
                  <div className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium">
                    {salaryData.currentLevel}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Current Day</p>
                    <p className="text-sm font-medium text-gray-900">
                      {currDayName}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Salary Day</p>
                    <p className="text-sm font-medium text-gray-900">
                      {salaryData.dayName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  className={`px-3 py-2 text-xs font-medium flex items-center ${
                    activeTab === 'dashboard'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('dashboard')}
                >
                  <FaChartLine className="mr-1.5 text-xs" />
                  Dashboard
                </button>
                <button
                  className={`px-3 py-2 text-xs font-medium flex items-center ${
                    activeTab === 'history'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('history')}
                >
                  <FaHistory className="mr-1.5 text-xs" />
                  History
                </button>
              </div>

              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <div className="space-y-4">
                  {/* Progress Card */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-sm font-bold text-gray-800">
                        Weekly Progress
                      </h2>
                      <div className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium">
                        {getProgressPercentage().toFixed(0)}% Complete
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <CircularProgress percentage={getProgressPercentage()} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="mb-2">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Recruits</span>
                            <span>{salaryData.newMembersThisWeek}/{salaryData.sameLevelRequirement}</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${getProgressColor()}`}
                              style={{ width: `${getProgressPercentage()}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <div className="bg-indigo-50 p-2 rounded">
                            <p className="text-xs text-indigo-600">Salary Amount</p>
                            <p className="text-sm font-bold text-gray-900">
                              ${RemoveTrailingZeros(salaryData.salaryAmount)}
                            </p>
                          </div>
                          <div className="bg-blue-50 p-2 rounded">
                            <p className="text-xs text-blue-600">Required Join</p>
                            <p className="text-sm font-bold text-gray-900">
                              {salaryData.sameLevelRequirement}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Collect Card */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-800">Salary Collection</h3>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        salaryData.isEligible
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {salaryData.isEligible ? 'Eligible' : 'Not Eligible'}
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-4">
                      {salaryData.reason}
                    </p>
                    
                    <button
                      onClick={collectSalary}
                      disabled={!salaryData.isEligible || collecting}
                      className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center ${
                        salaryData.isEligible && !collecting
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {collecting ? (
                        <>
                          <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <FaCoins className="mr-2" />
                          Collect ${RemoveTrailingZeros(salaryData.salaryAmount)}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center">
                    <FaHistory className="mr-2 text-indigo-600" />
                    Payment History
                  </h2>
                  
                  {historyLoading ? (
                    <div className="flex justify-center items-center h-24">
                      <FaSpinner className="animate-spin text-lg text-indigo-600" />
                    </div>
                  ) : history.length > 0 ? (
                    <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                      {history.map((payment, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100"
                        >
                          <div className="flex items-center">
                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
                              <FaCoins className="text-sm" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-bold text-gray-800">
                                ${RemoveTrailingZeros(payment.amount)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Stage {payment.level}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">{payment.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <FaHistory className="mx-auto text-2xl text-gray-300 mb-2" />
                      <p className="text-sm">No payment history</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
     

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-3 left-3 right-3 z-50 px-3 py-2 rounded-lg shadow-lg bg-red-100 text-red-700 text-sm flex items-center">
          <FaExclamationTriangle className="mr-2 flex-shrink-0" />
          <span className="flex-1 truncate">{error}</span>
          <button
            onClick={() => setError('')}
            className="ml-2 text-red-700 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Success Toast */}
      {success && (
        <div className="fixed top-3 left-3 right-3 z-50 px-3 py-2 rounded-lg shadow-lg bg-green-100 text-green-700 text-sm flex items-center">
          <FaCheckCircle className="mr-2 flex-shrink-0" />
          <span className="flex-1 truncate">{success}</span>
          <button
            onClick={() => setSuccess('')}
            className="ml-2 text-green-700 hover:text-green-800"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default SalaryCollection;