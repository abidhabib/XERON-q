import { useState, useEffect, useContext } from 'react';
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
      <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
        <BalanceCard />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <History className="w-8 h-8 text-[#C5C8CE] mx-auto mb-3" />
            <p className="text-[#707A8A] text-sm">Loading history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      {/* Balance Card */}
      <BalanceCard />

      {/* Content */}
      <div className="px-3 py-4 flex-1">
        <div className="flex items-center gap-2 mb-5">
          <History className="w-5 h-5 text-[#F0B90B]" />
          <h1 className="text-xl font-semibold text-[#1E2026]">Mining History</h1>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-[#F5F5F5] rounded-full flex items-center justify-center mb-4 border border-[#E6E8EB]">
              <Coins className="w-8 h-8 text-[#C5C8CE]" />
            </div>
            <h3 className="text-lg font-medium text-[#1E2026] mb-1">No Activity Yet</h3>
            <p className="text-[#707A8A] text-sm max-w-[240px] mx-auto">
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
                  className="bg-white rounded-xl p-4 border border-[#E6E8EB] shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        isCollect ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'
                      }`}>
                        {isCollect ? (
                          <Coins className="w-[18px] h-[18px] text-emerald-600" />
                        ) : (
                          <ArrowDownToLine className="w-[18px] h-[18px] text-amber-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-[#1E2026] font-medium text-sm capitalize">
                          {isCollect ? 'Rovex collected' : 'Rovex Exchanged'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3.5 h-3.5 text-[#707A8A]" />
                          <span className="text-[11px] text-[#707A8A]">
                            {formatDate(record.created_at)} • {formatTime(record.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${
                        isCollect ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {isCollect ? '+' : '-'}
                        {RemoveTrailingZeros(record.usd_value || 0)}
                        <br />
                        <span className="text-[11px] text-[#707A8A] mt-1"> Rovix</span>
                        <br />
                        <span className='text-xs font-medium text-[#707A8A]'>≈ ${RemoveTrailingZeros(record.amount || 0)} </span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-6 pt-4 border-t border-[#E6E8EB] text-center">
            <p className="text-[#707A8A] text-sm">
              Showing {history.length} {history.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MiningHistory;