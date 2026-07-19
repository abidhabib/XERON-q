import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Coins, Calendar, ArrowLeft, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { UserContext } from './UserContext/UserContext';
import BalanceCard from './new/BalanceCard';

const SalaryHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { Userid } = useContext(UserContext);
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_BASE_URL;

  const fetchHistory = async () => {
    if (!Userid) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API}/api/salary/history`, { withCredentials: true });
      setHistory(res.data.history || []);
    } catch {
      setError('Failed to load salary history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [Userid]);

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      <BalanceCard />

      <div className="px-4 pt-3 pb-6 flex-1">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#f0f0f0] text-[#848e9c] hover:text-[#1e2329] transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-[#1e2329]">Salary History</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-[#f0f0f0] border-t-[#f0b90b] rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-[#f6465d] text-sm">{error}</div>
        ) : history.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <div className="w-12 h-12 bg-[#fafafa] rounded-full flex items-center justify-center mx-auto mb-3">
              <Coins className="w-6 h-6 text-[#c1c7cd]" />
            </div>
            <p className="text-[#1e2329] font-medium text-sm mb-1">No salary payments yet</p>
            <p className="text-[#848e9c] text-xs">Collect your first weekly salary to see history here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-3.5 shadow-sm flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Coins className="w-[18px] h-[18px] text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1e2329] text-[15px]">
                    ${item.amount.toFixed(2)}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-[#848e9c] text-xs">
                    <Calendar className="w-3 h-3" />
                    <span>Week {item.week}</span>
                    <span>•</span>
                    <span>{format(new Date(item.date), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <button
            onClick={fetchHistory}
            className="mt-3 w-full h-11 bg-[#fafafa] hover:bg-[#f0f0f0] rounded-xl text-[#f0b90b] flex items-center justify-center gap-2 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        )}
      </div>
    </div>
  );
};

export default SalaryHistory;