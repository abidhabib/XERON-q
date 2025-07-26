import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaWallet, FaCalendarAlt, FaUserPlus, FaCheckCircle } from 'react-icons/fa';
import { UserContext } from '../UserContext/UserContext';
import { RemoveTrailingZeros } from '../../utils/utils';
import NavBar from '../NavBAr';

const SalaryCollection = () => {
  const [salaryData, setSalaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [collecting, setCollecting] = useState(false);
const {Userid} = useContext(UserContext);
console.log(Userid);

  const fetchSalaryStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/salary-status/${Userid}`);
      console.log(response.data);
      
      setSalaryData(response.data.data);
      setError('');
    } catch (err) {
      setError('Failed to load salary data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryStatus();
  }, [Userid]);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!salaryData) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Failed to load salary information</p>
        <button 
          onClick={fetchSalaryStatus}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  const progress = Math.min(
    (salaryData.newMembersThisWeek / salaryData.sameLevelRequirement) * 100, 
    100
  );

  return (
    <div className=" mx-auto ">

      <NavBar/>
      {/* Status Card */}
      <div className="p-3">

    
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 mb-6 border border-blue-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <FaWallet className="mr-2 text-indigo-600" /> Current Level
            </h2>
            <p className="text-3xl font-bold text-indigo-600">Level {salaryData.currentLevel}</p>
          </div>
          <div className="bg-indigo-100 p-3 rounded-lg">
            <span className="text-2xl font-bold text-indigo-700">${RemoveTrailingZeros(salaryData.salaryAmount)}</span>
            <p className="text-xs text-indigo-500 mt-1">Per week</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Next salary day</p>
            <p className="font-medium flex items-center">
              <FaCalendarAlt className="mr-1 text-blue-500" /> {salaryData.dayName}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Your wallet</p>
            <p className="font-bold text-green-600">${RemoveTrailingZeros(salaryData.wallet)}</p>
          </div>
        </div>
      </div>

      {/* Recruitment Progress */}
      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex justify-between mb-2">
          <h3 className="font-medium text-gray-700 flex items-center">
            <FaUserPlus className="mr-2 text-blue-500" /> Weekly Recruitment
          </h3>
          <span className="text-sm font-medium text-gray-700">
            {salaryData.newMembersThisWeek}/{salaryData.sameLevelRequirement}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div 
            className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1 }}
          ></motion.div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          You need {salaryData.sameLevelRequirement} new members this week to qualify for salary
        </p>
      </div>

      {/* Eligibility Status */}
      <div className={`rounded-xl p-4 mb-6 ${
        salaryData.isEligible 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <div className="flex items-start">
          <div className={`flex-shrink-0 mt-1 h-5 w-5 rounded-full ${
            salaryData.isEligible ? 'bg-green-500' : 'bg-yellow-500'
          }`}></div>
          <div className="ml-3">
            <h3 className={`text-sm font-medium ${
              salaryData.isEligible ? 'text-green-800' : 'text-yellow-800'
            }`}>
              {salaryData.isEligible 
                ? 'Eligible to collect salary!' 
                : 'Not eligible right now'}
            </h3>
            <p className={`mt-1 text-sm ${
              salaryData.isEligible ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {salaryData.reason}
            </p>
          </div>
        </div>
      </div>

      {/* Collect Button */}
      <div className="text-center">
        <button
          onClick={collectSalary}
          disabled={!salaryData.isEligible || collecting}
          className={`w-full py-2 px-4 rounded-xl  text-white shadow-lg transition-all
            ${salaryData.isEligible 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transform hover:scale-[1.02]' 
              : 'bg-gray-300 cursor-not-allowed'}
            flex items-center justify-center
          `}
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
        </button>
        
        {salaryData.isEligible && (
          <p className="text-xs text-gray-500 mt-2">
            Collect your salary today before midnight
          </p>
        )}
      </div>

      {/* Messages */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-center"
        >
          {error}
        </motion.div>
      )}
      
      {success && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-center"
        >
          {success}
        </motion.div>
      )}

      {/* Help Information */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="font-medium text-gray-700 mb-2">How Salary Works</h3>
        <ul className="text-xs text-gray-600 space-y-2">
          <li className="flex items-start">
            <span className="text-green-500 mr-2 mt-0.5">✓</span>
            <span>Salary is paid on your level's specific day each week</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2 mt-0.5">✓</span>
            <span>First-time at a level: Salary paid automatically on salary day</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2 mt-0.5">✓</span>
            <span>Same level: Need {salaryData.sameLevelRequirement} new recruits each week</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2 mt-0.5">✓</span>
            <span>Salary is added to your backend wallet immediately</span>
          </li>
        </ul>
      </div>
        </div>
    </div>
  );
};

export default SalaryCollection;