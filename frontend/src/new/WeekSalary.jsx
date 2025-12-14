import React, { useState, useEffect, useContext, lazy, Suspense } from 'react';
import axios from 'axios';
import { UserContext } from '../UserContext/UserContext';
import { RemoveTrailingZeros } from '../../utils/utils';
import BalanceCard from './BalanceCard';

// ✅ Lucide Icons
import { 
  Coins, 
  ChartLine, 
  History, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Calendar
} from 'lucide-react';

const NavBar = lazy(() => import('../NavBAr'));

const SalaryCollection = () => {
  const [salaryData, setSalaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [collecting, setCollecting] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { Userid } = useContext(UserContext);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchSalaryStatus = async () => {
    setError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/salary-status`, { withCredentials: true });
      setSalaryData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load salary data');
      setSalaryData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalaryHistory = async () => {
    if (history.length > 0) return;
    setHistoryLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/salary-history`, { withCredentials: true });
      setHistory(response.data.history);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryStatus();
  }, [Userid]);

  const collectSalary = async () => {
    if (!salaryData?.isEligible) return;
    try {
      setCollecting(true);
      setError('');
      setSuccess('');
      const response = await axios.post(`${API_BASE_URL}/collect-salary`, {}, { withCredentials: true });
      setSuccess(response.data.message);
      setSalaryData(prev => ({
        ...prev,
        wallet: response.data.newBalance,
        isEligible: false,
        reason: "Collection completed for this week"
      }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to collect salary');
    } finally {
      setCollecting(false);
    }
  };

  const getProgressPercentage = () => {
    if (!salaryData || salaryData.sameLevelRequirement === 0) return 0;
    return Math.min((salaryData.newMembersThisWeek / salaryData.sameLevelRequirement) * 100, 100);
  };

  // ✅ Simplified, elegant progress circle (no SVG borders)
  const CircularProgress = ({ percentage }) => (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <div className="absolute w-full h-full rounded-full bg-[#1c2a3a]"></div>
      <div 
        className="absolute w-full h-full rounded-full"
        style={{
          background: `conic-gradient(from 0deg, #D4AF37 ${percentage}%, #1c2a3a ${percentage}%)`,
          clipPath: 'inset(15% round 50%)'
        }}
      ></div>
      <span className="text-white font-semibold text-sm z-10">{Math.round(percentage)}%</span>
    </div>
  );

  const currDayName = new Date().toLocaleString('en-US', { weekday: 'long' });

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#111827] items-center justify-center">
        <div className="text-[#D4AF37] animate-pulse">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
        <p className="mt-3 text-[#D4AF37]/70 text-sm">Loading salary dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#111827]">
     

      <BalanceCard />

      <div className="px-2 pb-6 pt-2">
        {/* Header */}
        <div className="bg-[#19202a] rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold text-white flex items-center gap-2">
              <Coins className="text-[#D4AF37]" />
              Weekly Salary
            </h1>
            <span className="text-[11px] bg-[#1c2a3a] text-[#D4AF37] px-2 py-0.5 rounded-full">
              {salaryData?.currentLevel}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1c2a3a] p-3 rounded-xl">
              <p className="text-[#D4AF37]/70 text-[11px] mb-1">Current Day</p>
              <p className="text-white text-sm font-medium">{currDayName}</p>
            </div>
            <div className="bg-[#1c2a3a] p-3 rounded-xl">
              <p className="text-[#D4AF37]/70 text-[11px] mb-1">Salary Day</p>
              <p className="text-white text-sm font-medium">{salaryData?.dayName}</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-[#19202a] rounded-2xl p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-white">Weekly Progress</h2>
            <span className="text-[11px] text-[#D4AF37] bg-[#1c2a3a] px-2 py-0.5 rounded-full">
              {getProgressPercentage().toFixed(0)}% Complete
            </span>
          </div>

          <div className="flex items-center gap-4">
            <CircularProgress percentage={getProgressPercentage()} />
            <div className="flex-1">
              <div className="text-[11px] text-[#D4AF37]/70 mb-1">
                {salaryData?.newMembersThisWeek} / {salaryData?.sameLevelRequirement} recruits
              </div>
              <div className="h-1.5 bg-[#1c2a3a] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-amber-400"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-[#1c2a3a] p-2.5 rounded-xl">
                  <p className="text-[11px] text-[#D4AF37]/70">Salary</p>
                  <p className="text-white font-semibold text-sm">
                    ${RemoveTrailingZeros(salaryData?.salaryAmount)}
                  </p>
                </div>
                <div className="bg-[#1c2a3a] p-2.5 rounded-xl">
                  <p className="text-[11px] text-[#D4AF37]/70">Required</p>
                  <p className="text-white font-semibold text-sm">
                    {salaryData?.sameLevelRequirement}
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
            onClick={collectSalary}
            disabled={!salaryData?.isEligible || collecting}
            className={`w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center transition-all ${
              salaryData?.isEligible && !collecting
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#c69c2e] text-gray-900 shadow-[0_2px_6px_rgba(212,175,55,0.2)] hover:from-[#e8c04e] hover:to-[#d4af37]'
                : 'bg-[#1c2a3a] text-[#D4AF37]/50 cursor-not-allowed'
            }`}
          >
            {collecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Coins className="w-4 h-4 mr-2" />
                Collect ${RemoveTrailingZeros(salaryData?.salaryAmount)}
              </>
            )}
          </button>
        </div>

        {/* View History */}
        <button
          onClick={fetchSalaryHistory}
          disabled={historyLoading}
          className="w-full py-3 bg-[#19202a] hover:bg-[#1c2a3a] rounded-xl text-[#D4AF37] font-medium transition-colors flex items-center justify-center gap-2"
        >
          {historyLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <History className="w-4 h-4" />
          )}
          View Full History
        </button>

        {/* History List (if loaded) */}
        {history.length > 0 && (
          <div className="mt-4 space-y-3 max-h-[40vh] overflow-y-auto">
            {history.map((payment, index) => (
              <div key={index} className="bg-[#19202a] rounded-xl p-3">
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
                    <p className="text-[#D4AF37]/70 text-[11px]">{payment.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toasts - Themed */}
      {error && (
        <div className="fixed bottom-4 left-4 right-4 z-50 p-3 rounded-xl bg-rose-900/30 border border-rose-800/30 text-rose-400 text-sm flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="ml-2">×</button>
        </div>
      )}

      {success && (
        <div className="fixed top-4 left-4 right-4 z-50 p-3 rounded-xl bg-emerald-900/30 border border-emerald-800/30 text-emerald-400 text-sm flex items-center">
          <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="flex-1">{success}</span>
          <button onClick={() => setSuccess('')} className="ml-2">×</button>
        </div>
      )}
    </div>
  );
};

export default SalaryCollection;