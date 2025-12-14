import { useState, useEffect, lazy, Suspense, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../UserContext/UserContext';
import { RemoveTrailingZeros } from '../../utils/utils';

// ✅ Lucide Icons (clean, modern)
import { 
  Coins, 
  History, 
  AlertTriangle,
  CheckCircle,
  RotateCw,
  Calendar
} from 'lucide-react';
import BalanceCard from './BalanceCard';

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
      setError(err.response?.data?.message || err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSalaryHistory = async () => {
    if (history.length > 0) return;
    setIsHistoryLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/monthly-salary/history`,
        { withCredentials: true }
      );
      if (response.data.status === 'success') {
        setHistory(response.data.history);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
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
        setCollectionResult({ isOpen: true, type: 'success', message: response.data.message });
        await fetchSalaryStatus();
      } else {
        throw new Error(response.data.message || 'Failed to collect salary');
      }
    } catch (err) {
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

  // ✅ Luxury Gold Progress Circle (no borders, conic gradient)
  const CircularProgress = () => {
    const percentage = getProgressPercentage();
    return (
      <div className="relative w-28 h-28 flex items-center justify-center">
        <div className="absolute w-full h-full rounded-full bg-[#1c2a3a]"></div>
        <div 
          className="absolute w-full h-full rounded-full"
          style={{
            background: `conic-gradient(from 0deg, #D4AF37 ${percentage}%, #1c2a3a ${percentage}%)`,
            clipPath: 'inset(12% round 50%)'
          }}
        ></div>
        <div className="text-center z-10">
          <span className="text-white font-bold text-sm block">
            {salaryData?.recruitsThisMonth || 0}
          </span>
          <span className="text-[#D4AF37]/70 text-[10px]">/{salaryData?.requiredJoins || 0}</span>
        </div>
      </div>
    );
  };

  const formatYearMonth = (yearMonthStr) => {
    if (!yearMonthStr || yearMonthStr.length !== 6) return '—';
    const year = yearMonthStr.substring(0, 4);
    const monthIndex = parseInt(yearMonthStr.substring(4, 6), 10) - 1;
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return monthIndex >= 0 && monthIndex < 12 ? `${monthNames[monthIndex]} ${year}` : '—';
  };

  useEffect(() => {
    fetchSalaryStatus();
  }, []);

  // ✅ Render loading as full-screen luxury loader
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#111827] items-center justify-center">
        <RotateCw className="w-8 h-8 text-[#D4AF37] animate-spin" />
        <p className="mt-3 text-[#D4AF37]/70 text-sm">Loading monthly salary...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#111827]">
      
      <BalanceCard />

      {/* Main Content */}
      <div className="px-2 pb-6 pt-2 flex-1">
        {/* Header */}
        <div className="bg-[#19202a] rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold text-white flex items-center gap-2">
              <Coins className="text-[#D4AF37]" />
              Monthly Salary
            </h1>
            <span className="text-[11px] bg-[#1c2a3a] text-[#D4AF37] px-2 py-0.5 rounded-full">
              {salaryData?.currentLevel}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1c2a3a] p-3 rounded-xl">
              <p className="text-[#D4AF37]/70 text-[11px] mb-1">Current Month</p>
              <p className="text-white text-sm font-medium">
                {salaryData?.currentMonthName || '—'}
              </p>
            </div>
            <div className="bg-[#1c2a3a] p-3 rounded-xl">
              <p className="text-[#D4AF37]/70 text-[11px] mb-1">Salary Date</p>
              <p className="text-white text-sm font-medium">
                {salaryData?.designatedSalaryDay || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-[#19202a] rounded-2xl p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-white">Monthly Progress</h2>
            <span className="text-[11px] text-[#D4AF37] bg-[#1c2a3a] px-2 py-0.5 rounded-full">
              {getProgressPercentage().toFixed(0)}% Complete
            </span>
          </div>

          <div className="flex items-center gap-4">
            <CircularProgress />
            <div className="flex-1">
              <div className="h-1.5 bg-[#1c2a3a] rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-amber-400"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1c2a3a] p-2.5 rounded-xl">
                  <p className="text-[11px] text-[#D4AF37]/70">Salary</p>
                  <p className="text-white font-semibold text-sm">
                    ${RemoveTrailingZeros(salaryData?.levelSalary)}
                  </p>
                </div>
                <div className="bg-[#1c2a3a] p-2.5 rounded-xl">
                  <p className="text-[11px] text-[#D4AF37]/70">Required</p>
                  <p className="text-white font-semibold text-sm">
                    {salaryData?.requiredJoins}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Collect */}
        <div className="bg-[#19202a] rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Salary Collection</h3>
            <span className={`text-[11px] px-2 py-0.5 rounded-full ${
              salaryData?.isEligible 
                ? 'bg-emerald-900/30 text-emerald-400' 
                : 'bg-amber-900/30 text-amber-400'
            }`}>
              {salaryData?.isEligible ? 'Eligible' : 'Not Eligible'}
            </span>
          </div>
          
          <p className="text-[#D4AF37]/70 text-sm mb-4">
            {salaryData?.reason}
          </p>
          
          <button
            onClick={handleCollectSalary}
            disabled={!salaryData?.isEligible || isCollecting}
            className={`w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center transition-all ${
              salaryData?.isEligible && !isCollecting
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#c69c2e] text-gray-900 shadow-[0_2px_6px_rgba(212,175,55,0.2)] hover:from-[#e8c04e] hover:to-[#d4af37]'
                : 'bg-[#1c2a3a] text-[#D4AF37]/50 cursor-not-allowed'
            }`}
          >
            {isCollecting ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Coins className="w-4 h-4 mr-2" />
                Collect Salary
              </>
            )}
          </button>
        </div>

        {/* View History */}
        <button
          onClick={fetchSalaryHistory}
          disabled={isHistoryLoading}
          className="w-full py-3 bg-[#19202a] hover:bg-[#1c2a3a] rounded-xl text-[#D4AF37] font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isHistoryLoading ? (
            <RotateCw className="w-4 h-4 animate-spin" />
          ) : (
            <History className="w-4 h-4" />
          )}
          View Full History
        </button>

        {/* History List */}
        {history.length > 0 && (
          <div className="mt-4 space-y-3 max-h-[40vh] overflow-y-auto">
            {history.map((payment) => (
              <div key={payment.id} className="bg-[#19202a] rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#1c2a3a] rounded-lg">
                      <Coins className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">
                        ${RemoveTrailingZeros(payment.amount)}
                      </p>
                      <p className="text-[#D4AF37]/70 text-[11px]">Stage {payment.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#D4AF37]/70 text-[11px]">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mt-4 p-3 bg-rose-900/20 border border-rose-800/30 rounded-xl flex items-center">
            <AlertTriangle className="w-4 h-4 text-rose-400 mr-2 flex-shrink-0" />
            <p className="text-rose-400 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Luxury Toasts */}
      {collectionResult.isOpen && (
        <div 
          className={`fixed top-3 left-3 right-3 z-50 p-3 rounded-xl text-sm flex items-center ${
            collectionResult.type === 'success'
              ? 'bg-emerald-900/30 border border-emerald-800/30 text-emerald-400'
              : 'bg-rose-900/30 border border-rose-800/30 text-rose-400'
          }`}
        >
          {collectionResult.type === 'success' ? (
            <CheckCircle className="w-4 h-4 mr-2" />
          ) : (
            <AlertTriangle className="w-4 h-4 mr-2" />
          )}
          <span className="flex-1">{collectionResult.message}</span>
          <button 
            onClick={() => setCollectionResult({ isOpen: false, type: '', message: '' })} 
            className="ml-2 opacity-80 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default MonthlySalaryDashboard;