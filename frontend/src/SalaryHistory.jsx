// src/pages/SalaryHistory.jsx  (or components if you prefer)
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Coins, 
  Calendar,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
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
    } catch (err) {
      setError('Failed to load salary history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [Userid]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header with Back Button */}
   

      <BalanceCard />

      <div className="p-4 flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="animate-spin text-amber-500 w-6 h-6" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-rose-400 text-sm">
            {error}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <Coins className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-gray-500">No salary payments yet</p>
            <p className="text-gray-600 text-sm mt-1">Collect your first weekly salary to see history here.</p>
          </div>
        ) : (
          <div className="space-y-3">
               <div className="flex items-center px-2 py-3 border-b border-gray-800/50">
        <button
          onClick={() => navigate(-1)} // or navigate('/salary')
          className="p-2 -ml-1 text-gray-400 hover:text-amber-400 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-white ml-1">Salary History</h1>
      </div>
            {history.map((item, index) => (
              <div 
                key={index} 
                className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="font-medium text-white text-base">
                        ${item.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-gray-400 text-xs">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span>Week {item.week}</span>
                      <span>•</span>
                      <span>{format(new Date(item.date), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <button
            onClick={fetchHistory}
            className="mt-6 w-full py-2.5 bg-gray-800/60 hover:bg-gray-700/60 rounded-xl text-amber-400 flex items-center justify-center gap-2 transition-colors text-sm font-medium"
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