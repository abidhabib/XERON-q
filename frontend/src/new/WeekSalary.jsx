import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  FaWallet, 
  FaCalendarAlt, 
  FaUserPlus, 
  FaCheckCircle,
  FaCoins,
  FaTrophy,
  FaChartLine,
  FaHistory,
  FaArrowRight,
  FaExclamationTriangle,
  FaVrCardboard
} from 'react-icons/fa';
import { UserContext } from '../UserContext/UserContext';
import { RemoveTrailingZeros } from '../../utils/utils';
import NavBar from '../NavBAr';

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

  const fetchSalaryStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/salary-status`, {
        withCredentials: true
      });
      setSalaryData(response.data.data);
      setError('');
    } catch (err) {
      setError('Failed to load salary data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalaryHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/salary-history`, {
        withCredentials: true
      });
      setHistory(response.data.history);
    } catch (err) {
      console.error('Failed to load salary history', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryStatus();
  }, [Userid]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchSalaryHistory();
    }
  }, [activeTab]);

  const collectSalary = async () => {
    try {
      setCollecting(true);
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/collect-salary/${Userid}`);
      setSuccess(response.data.message);
      
      // Update wallet balance in UI
      setSalaryData(prev => ({
        ...prev,
        wallet: response.data.newBalance,
        isEligible: false,
        reason: "Already collected this week"
      }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to collect salary');
    } finally {
      setCollecting(false);
      // Refresh data after collection
      setTimeout(fetchSalaryStatus, 2000);
    }
  };
console.log(salaryData);
const getProgressPercentage = () => {
  if (!salaryData) return 0;
  const percent = (salaryData.newMembersThisWeek / salaryData.sameLevelRequirement) * 100;
  return Math.min(percent, 100);
};

const getProgressColor = () => {
  const percentage = getProgressPercentage();
  if (percentage >= 100) return 'bg-green-500';
  if (percentage >= 50) return 'bg-yellow-400';
  return 'bg-red-400';
};

// Dummy CircularProgress component
const CircularProgress = ({ percentage }) => {
  const radius = 90;
  const stroke = 20;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const strokeDashoffset = offset;

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
      <circle
        stroke="#19202a"
        fill="transparent"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-out' }}
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
        {percentage}%
      </text>
    </svg>
  );
};

  

  if (!salaryData) {
    return (
   null
    );
  }
const currDayName = new Date().toLocaleString('en-US', { weekday: 'long' });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-10">
      {/* Header */}
      <NavBar/>
  <div className="bg-[#19202a] p-4  shadow-xl text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center">
                <FaCoins className="mr-3 text-yellow-300" />
                Weekly  Salary Dashboard
              </h1>
              <p className="text-indigo-100 mt-1">
                Track your progress and collect your weekly salary
              </p>
            </div>
           <div className="flex justify-between w-full">
             <div className="mt-4 md:mt-0 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 flex items-center">
              <FaCalendarAlt className="mr-2 text-indigo-200" />
              <div>
                <p className="text-sm font-medium text-indigo-200">Current Day</p>
                <p className="text-lg font-bold">
                  { currDayName|| 'Loading...'}
                </p>
              </div>
            </div>
             <div className="mt-4 md:mt-0 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 flex items-center">
              <FaVrCardboard className="mr-2 text-indigo-200" />
              <div>
                <p className="text-sm font-medium text-indigo-200">Current Balance</p>
                <p className="text-lg font-bold">
                 $ {salaryData?.wallet || 'Loading...'}
                </p>
              </div>
            </div>
           </div>

                     <span className='text-sm mt-3 mb-3 text-yellow-300 '>Your Stage <span className="font-bold text-indigo-200"> {salaryData?.currentLevel}</span> and your salary day is <span className="font-bold text-indigo-200"> {salaryData?.dayName}</span></span>

          </div>
        </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto mt-6 px-4">
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
      </div>

      {/* Dashboard Content */}
      {activeTab === 'dashboard' && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
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
                  <p className="text-xl font-bold text-gray-800">
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
                  <p className="text-xl font-bold text-gray-800">
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
                  Weekly Progress</h2>
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
                        <span className='underline'> Recruitment Progress</span>
                        <span>{getProgressPercentage().toFixed(1)}%</span>
                      </div>
                      <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
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
                          ${ salaryData.salaryAmount}
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
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
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
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      {salaryData.isEligible && <FaCheckCircle className="mr-2" />}
                      Collect ${RemoveTrailingZeros(salaryData.salaryAmount)}
                    </>
                  )}
                </motion.button>
              </div>
            </div>
            
            {salaryData.isEligible && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
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
          <div className="mt-8 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
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
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="mt-3">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Payment History</h2>
            
            {historyLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
              </div>
            ) : history.length > 0 ? (
              <div className="space-y-4">
                {history.map((payment, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
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
              </div>
            ) : (
              <div className="text-center py-10">
                <FaHistory className="mx-auto text-4xl text-gray-300 mb-4" />
                <p className="text-lg font-medium text-gray-600">No payment history found</p>
                <p className="text-gray-500 mt-2">Your salary payments will appear here once collected</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-xl shadow-lg bg-red-100 text-red-700 flex items-center max-w-md"
        >
          <FaExclamationTriangle className="mr-3 text-xl" />
          <span>{error}</span>
          <button 
            onClick={() => setError('')}
            className="ml-4 text-red-700 hover:text-red-800"
          >
            &times;
          </button>
        </motion.div>
      )}
      
      {success && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-xl shadow-lg bg-green-100 text-green-700 flex items-center max-w-md"
        >
          <FaCheckCircle className="mr-3 text-xl" />
          <span>{success}</span>
          <button 
            onClick={() => setSuccess('')}
            className="ml-4 text-green-700 hover:text-green-800"
          >
            &times;
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default SalaryCollection;