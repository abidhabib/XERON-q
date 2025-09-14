import { useState, useEffect, lazy, Suspense, useContext } from 'react';
import axios from 'axios';
import {
  FaCoins,
  FaCheckCircle,
  FaExclamationTriangle,
  FaHistory,
  FaSpinner,
  
} from 'react-icons/fa';
import { UserContext } from '../UserContext/UserContext';
import { RemoveTrailingZeros } from '../../utils/utils';

const NavBar = lazy(() => import('../NavBAr'));

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
  const [activeTab, setActiveTab] = useState('progress');
  const { NewName, currBalance } = useContext(UserContext);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

  const fetchSalaryHistory = async () => {
    if (history.length > 0) return;
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

  const getProgressPercentage = () => {
    if (!salaryData || salaryData.requiredJoins === 0) return 0;
    return Math.min(100, (salaryData.recruitsThisMonth / salaryData.requiredJoins) * 100);
  };

  const getProgressColor = () => {
    const percentage = getProgressPercentage();
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
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

  const CircularProgress = ({ percentage, size = 120 }) => {
    const strokeWidth = 12;
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
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#19202a"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-gray-800">
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

  useEffect(() => {
    if (activeTab === 'history' && history.length === 0) {
       fetchSalaryHistory();
    }
  }, [activeTab, history.length]);

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

      {/* Main Content */}
      <div className="flex flex-col flex-1 pt-14">
    

        {/* Notification Toast */}
        {collectionResult.isOpen && (
          <div className={`fixed top-3 left-3 right-3 z-50 px-3 py-2 rounded-lg shadow text-white text-sm flex items-center ${
            collectionResult.type === 'success'
              ? 'bg-green-500'
              : 'bg-red-500'
          }`}>
            {collectionResult.type === 'success' ? (
              <FaCheckCircle className="mr-2 flex-shrink-0" />
            ) : (
              <FaExclamationTriangle className="mr-2 flex-shrink-0" />
            )}
            <span className="flex-1 truncate">{collectionResult.message}</span>
            <button
              onClick={() => setCollectionResult({ isOpen: false, type: '', message: '' })}
              className="ml-2"
            >
              ×
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-3 py-4 flex-1">
          <div className="max-w-md mx-auto w-full">
            {/* Header Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-lg font-bold text-gray-900 flex items-center">
                  <FaCoins className="mr-2 text-yellow-500" />
                  Monthly Salary
                </h1>
                <div className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium">
                  {salaryData?.currentLevel}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Current Month</p>
                  <p className="text-sm font-medium text-gray-900">
                    {salaryData?.currentMonthName || 'Loading...'}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Salary Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {salaryData?.designatedSalaryDay || 'Loading...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                className={`px-3 py-2 text-xs font-medium ${
                  activeTab === 'progress'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('progress')}
              >
                Progress
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

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center items-center h-32">
                <FaSpinner className="animate-spin text-xl text-indigo-600" />
              </div>
            )}

            {/* Error State */}
            {!isLoading && error && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <div className="flex items-center">
                  <FaExclamationTriangle className="text-red-500 mr-2" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Main Content - Tabbed */}
            {!isLoading && !error && salaryData && (
              <>
                {/* Progress Tab */}
                {activeTab === 'progress' && (
                  <div className="space-y-4">
                    {/* Progress Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-bold text-gray-800">Monthly Progress</h2>
                        <div className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium">
                          {getProgressPercentage().toFixed(0)}% Complete
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <CircularProgress percentage={getProgressPercentage()} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Recruits</span>
                              <span>{salaryData.recruitsThisMonth}/{salaryData.requiredJoins}</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${getProgressColor()}`}
                                style={{ width: `${getProgressPercentage()}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-indigo-50 p-2 rounded">
                              <p className="text-xs text-indigo-600">Salary Amount</p>
                              <p className="text-sm font-bold text-gray-900">
                                ${salaryData.levelSalary}
                              </p>
                            </div>
                            <div className="bg-blue-50 p-2 rounded">
                              <p className="text-xs text-blue-600">Required Join</p>
                              <p className="text-sm font-bold text-gray-900">
                                {salaryData.requiredJoins}
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
                        onClick={handleCollectSalary}
                        disabled={!salaryData.isEligible || isCollecting}
                        className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center ${
                          salaryData.isEligible && !isCollecting
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
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
                    
                    {isHistoryLoading ? (
                      <div className="flex justify-center items-center h-24">
                        <FaSpinner className="animate-spin text-lg text-indigo-600" />
                      </div>
                    ) : history.length > 0 ? (
                      <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                        {history.map((payment) => (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100"
                          >
                            <div className="flex items-center">
                              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
                                <FaCoins className="text-sm" />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-bold text-gray-800">
                                  ${parseFloat(payment.amount).toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Stage {payment.level}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                {new Date(payment.payment_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <FaHistory className="mx-auto text-xl text-gray-300 mb-2" />
                        <p className="text-sm">No payment history</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlySalaryDashboard;