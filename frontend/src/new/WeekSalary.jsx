import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../UserContext/UserContext';
import { RemoveTrailingZeros } from '../../utils/utils';
import BalanceCard from './BalanceCard';
import { 
  Coins, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Users,
  Calendar,
  Lock,
  Trophy
} from 'lucide-react';

const SalaryCollection = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [collecting, setCollecting] = useState(false);
  const { Userid } = useContext(UserContext);
  const API = import.meta.env.VITE_API_BASE_URL;

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API}/api/salary/status`, { withCredentials: true });
      setStatus(res.data);
    } catch (err) {
      setError('Failed to load eligibility status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Userid) fetchStatus();
  }, [Userid]);

  const handleCollect = async () => {
    if (!status?.eligible) return;
    setCollecting(true);
    setError('');
    try {
      await axios.post(`${API}/api/salary/collect`, {}, { withCredentials: true });
      setSuccess('Salary collected successfully!');
      fetchStatus(); // Refresh to clear eligible flag for this week
    } catch (err) {
      setError(err.response?.data?.error || 'Collection failed');
    } finally {
      setCollecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <RefreshCw className="animate-spin text-amber-500 w-8 h-8" />
      </div>
    );
  }

  // ✅ SHOW: Permanently Eligible but Already Collected This Week
  if (status?.permanentlyEligible && !status.eligible && status.weekCredits === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900">
        <BalanceCard />
        <div className="flex-1 flex items-  justify-center">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-emerald-400 w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Salary Collected</h2>
            <p className="text-gray-400 mb-4">
              You’ve already collected your weekly salary.
            </p>
            <button
              onClick={fetchStatus}
              className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-white flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ SHOW: Not Yet Eligible (Never unlocked)
  if (!status?.permanentlyEligible) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 p-4">
        <BalanceCard />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="text-amber-500 w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Unlock Weekly Salary</h2>
            <p className="text-gray-400 mb-4">
              Recruit <span className="text-amber-400 font-medium">{status?.requiredRecruits || 0}</span> members in a single week to unlock lifetime salary.
            </p>
            
            {status?.recruitsThisWeek !== undefined && (
              <div className="bg-gray-700 rounded-xl p-4 mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Recruits This Week</span>
                  <span className="text-amber-400 font-medium">
                    {status.recruitsThisWeek}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Required</span>
                  <span className="text-white font-medium">
                    {status.requiredRecruits || 0}
                  </span>
                </div>
                <div className="h-2 bg-gray-600 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full"
                    style={{ 
                      width: `${status.requiredRecruits ? Math.min(100, (status.recruitsThisWeek / status.requiredRecruits) * 100) : 0}%` 
                    }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={fetchStatus}
              className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-white flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ SHOW: Eligible (Permanently unlocked + has credits + not collected this week)
  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <BalanceCard />
      <div className="p-4 flex-1">
        <div className="bg-gray-800 rounded-2xl p-5 mb-4">
          <div className="text-center mb-4">
            <div className="w-20 h-20 bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trophy className="text-emerald-400 w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-white">Weekly Salary Ready!</h2>
            <p className="text-emerald-400 font-semibold text-lg mt-1">
              ${RemoveTrailingZeros(status.weekCredits)}
            </p>
            <p className="text-gray-400 text-sm mt-2">Lifetime eligibility unlocked ✅</p>
          </div>

          <button
            onClick={handleCollect}
            disabled={collecting}
            className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
              collecting 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-gray-900 hover:from-emerald-400 hover:to-emerald-500'
            }`}
          >
            {collecting ? (
              <>
                <RefreshCw className="animate-spin w-4 h-4" />
                Processing...
              </>
            ) : (
              <>
                <Coins className="w-4 h-4" />
                Collect Salary
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toasts */}
      {error && (
        <div className="fixed bottom-4 left-4 right-4 p-3 bg-rose-900/50 text-rose-300 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto">×</button>
        </div>
      )}
      {success && (
        <div className="fixed top-4 left-4 right-4 p-3 bg-emerald-900/50 text-emerald-300 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="ml-auto">×</button>
        </div>
      )}
    </div>
  );
};

export default SalaryCollection;