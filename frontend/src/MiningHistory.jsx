import  { useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Lucide Icons
import { Coins, ArrowDownToLine, History, Calendar } from 'lucide-react';
import { UserContext } from './UserContext/UserContext';
import { RemoveTrailingZeros } from '../utils/utils';
import BalanceCard from './new/BalanceCard';

// Safe date formatters
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const MiningHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { Userid } = useContext(UserContext);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!Userid) return;
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/coin-collect-history`);
        const data = Array.isArray(response.data) ? response.data : [];
        setHistory(data);
      } catch (error) {
        console.error('Error fetching mining history:', error);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [Userid]);

  if (loading && history.length === 0) {
    return (
      <div className="min-h-screen bg-[#111827] flex flex-col">
      
        <BalanceCard />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <History className="w-8 h-8 text-[#D4AF37]/50 mx-auto mb-3" />
            <p className="text-[#D4AF37]/70 text-sm">Loading history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827] flex flex-col">
    

      {/* Balance Card */}
      <BalanceCard />

      {/* Content */}
      <div className="px-2 py-4 flex-1">
        <div className="flex items-center gap-2 mb-5">
          <History className="w-5 h-5 text-[#D4AF37]" />
          <h1 className="text-xl font-semibold text-white">Mining History</h1>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-[#1c2a3a] rounded-full flex items-center justify-center mb-4">
              <Coins className="w-8 h-8 text-[#D4AF37]/50" />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">No Activity Yet</h3>
            <p className="text-[#D4AF37]/70 text-sm max-w-[240px] mx-auto">
              Your mining and exchange history will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.slice(0, 50).map((record, index) => {
              const key = record.id || `history-${index}`;
              const isCollect = record.type === 'collect';
              
              return (
                <div
                  key={key}
                  className="bg-[#19202a] rounded-xl p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        isCollect ? 'bg-emerald-900/30' : 'bg-amber-900/30'
                      }`}>
                        {isCollect ? (
                          <Coins className="w-4.5 h-4.5 text-emerald-400" />
                        ) : (
                          <ArrowDownToLine className="w-4.5 h-4.5 text-amber-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm capitalize">
                          {isCollect ? 'Rovex collected' : 'Rovex  Exchanged'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3.5 h-3.5 text-[#D4AF37]/70" />
                          <span className="text-[11px] text-[#D4AF37]/70">
                            {formatDate(record.created_at)} • {formatTime(record.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${
                        isCollect ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {isCollect ? '+' : '-'}
                        {RemoveTrailingZeros(record.amount || 0)}
                      </p>
                      <p className="text-[11px] text-[#D4AF37]/70 mt-1">Coins</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-6 pt-4 border-t border-[#26303b] text-center">
            <p className="text-[#D4AF37]/70 text-sm">
              Showing {history.length} {history.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MiningHistory;