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
  Lock,
  Trophy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SalaryCollection = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [collecting, setCollecting] = useState(false);
  const { Userid } = useContext(UserContext);
  const API = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API}/api/salary/status`, { withCredentials: true });
      setStatus(res.data);
    } catch {
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
      fetchStatus();
    } catch (err) {
      setError(err.response?.data?.error || 'Collection failed');
    } finally {
      setCollecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f5f5]">
        <div className="w-8 h-8 border-2 border-[#f0f0f0] border-t-[#f0b90b] rounded-full animate-spin" />
      </div>
    );
  }

  // Already collected this week
  if (status?.permanentlyEligible && !status.eligible && status.weekCredits === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f5f5f5]">
        <BalanceCard />
        <div className="px-4 pt-3 pb-6 flex-1">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-base font-semibold text-[#1e2329]">Week Salary</h1>
            <button
              onClick={() => navigate('/salary-history')}
              className="px-3.5 py-1.5 rounded-lg text-[13px] font-semibold bg-[#f0b90b] text-[#0b0e11] active:opacity-85 transition-opacity"
            >
              Show History
            </button>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-emerald-500 w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-[#1e2329] mb-2">Salary Collected</h2>
            <p className="text-sm text-[#848e9c] mb-4">You've already collected your weekly salary.</p>
            <button
              onClick={fetchStatus}
              className="w-full h-11 bg-[#fafafa] hover:bg-[#f0f0f0] rounded-xl text-sm text-[#1e2329] font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not eligible yet
  if (!status?.permanentlyEligible) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f5f5f5]">
        <BalanceCard />
        <div className="px-4 pt-3 pb-6 flex-1">
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <div className="w-16 h-16 bg-[#fffbeb] rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="text-[#f0b90b] w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-[#1e2329] mb-2">Unlock Weekly Salary</h2>
            <p className="text-sm text-[#848e9c] mb-4">
              Recruit <span className="text-[#f0b90b] font-semibold">{status?.requiredRecruits || 0}</span> members in a single week to unlock lifetime salary.
            </p>
            {status?.recruitsThisWeek !== undefined && (
              <div className="bg-[#fafafa] rounded-xl p-4 mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#848e9c]">Recruits This Week</span>
                  <span className="text-[#f0b90b] font-semibold">{status.recruitsThisWeek}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#848e9c]">Required</span>
                  <span className="text-[#1e2329] font-semibold">{status.requiredRecruits || 0}</span>
                </div>
                <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#f0b90b] rounded-full"
                    style={{ width: `${status.requiredRecruits ? Math.min(100, (status.recruitsThisWeek / status.requiredRecruits) * 100) : 0}%` }}
                  />
                </div>
              </div>
            )}
            <button
              onClick={fetchStatus}
              className="w-full h-11 bg-[#fafafa] hover:bg-[#f0f0f0] rounded-xl text-sm text-[#1e2329] font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ready to collect
  return (
    <div className="flex flex-col min-h-screen bg-[#f5f5f5]">
      <BalanceCard />
      <div className="px-4 pt-3 pb-6 flex-1">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-center mb-5">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trophy className="text-emerald-500 w-10 h-10" />
            </div>
            <h2 className="text-lg font-bold text-[#1e2329]">Weekly Salary Ready!</h2>
            <p className="text-emerald-600 font-bold text-3xl mt-2">
              ${RemoveTrailingZeros(status.weekCredits)}
            </p>
            <p className="text-[#848e9c] text-sm mt-2 flex items-center justify-center gap-1">
              Lifetime eligibility unlocked <CheckCircle className="w-4 h-4 text-emerald-500" />
            </p>
          </div>

          <button
            onClick={handleCollect}
            disabled={collecting}
            className={`w-full h-[52px] flex items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.98] ${
              collecting
                ? 'bg-[#f5f5f5] text-[#c1c7cd] cursor-not-allowed'
                : 'bg-[#f0b90b] text-[#0b0e11] active:opacity-90'
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

      {error && (
        <div className="fixed bottom-4 left-4 right-4 flex justify-center z-50">
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto text-lg leading-none">&times;</button>
          </div>
        </div>
      )}
      {success && (
        <div className="fixed top-4 left-4 right-4 flex justify-center z-50">
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-600 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="ml-auto text-lg leading-none">&times;</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryCollection;