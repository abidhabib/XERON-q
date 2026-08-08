import { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { Coins, ArrowDownToLine } from 'lucide-react';
import { UserContext } from './UserContext/UserContext';
import { RemoveTrailingZeros } from '../utils/utils';
import NavBar from './NavBar';

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const dayLabel = (dayKey) => {
  const d = new Date(dayKey);
  if (isNaN(d.getTime())) return 'Earlier';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rec = new Date(d);
  rec.setHours(0, 0, 0, 0);
  const diff = Math.round((today - rec) / (24 * 60 * 60 * 1000));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/* ── Ledger row ── */
const LedgerRow = ({ record }) => {
  const isCollect = record.type === 'collect';
  return (
    <div className="relative flex items-center gap-3 py-2.5">
      <span
        className={`relative z-10 w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ring-1 ${
          isCollect ? 'bg-[#C6A15B]/10 text-[#C6A15B] ring-[#C6A15B]/15' : 'bg-[#212125] text-[#A0A0A6] ring-white/[0.05]'
        }`}
      >
        {isCollect ? <Coins size={16} strokeWidth={2} /> : <ArrowDownToLine size={16} strokeWidth={2} />}
      </span>
      <div className="flex-1 min-w-0">
        <p className="fi text-[13.5px] font-semibold text-[#EDEDEE] leading-tight truncate">
          {isCollect ? 'Coins collected' : 'Coins exchanged'}
        </p>
        <p className="fi tnum text-[11px] text-[#6F6F76] mt-0.5">{formatTime(record.created_at)}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`tnum text-[13.5px] font-semibold leading-tight ${isCollect ? 'text-[#C6A15B]' : 'text-[#A0A0A6]'}`}>
          {isCollect ? '+' : '−'}
          {RemoveTrailingZeros(record.usd_value || 0)}
        </p>
        <p className="tnum fi text-[10.5px] text-[#6F6F76] mt-0.5">≈ ${RemoveTrailingZeros(record.amount || 0)}</p>
      </div>
    </div>
  );
};

/* ── Skeleton row ── */
const SkeletonRow = () => (
  <div className="flex items-center gap-3 py-2.5">
    <div className="w-9 h-9 rounded-lg bg-[#212125] animate-pulse flex-shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 w-1/3 rounded bg-[#212125] animate-pulse" />
      <div className="h-2 w-1/4 rounded bg-[#212125] animate-pulse" />
    </div>
    <div className="space-y-1.5 flex-shrink-0">
      <div className="h-3 w-12 rounded bg-[#212125] animate-pulse ml-auto" />
      <div className="h-2 w-10 rounded bg-[#212125] animate-pulse ml-auto" />
    </div>
  </div>
);

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
        setHistory(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching mining history:', error);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [Userid]);

  const groups = useMemo(() => {
    const map = new Map();
    history.slice(0, 50).forEach((r) => {
      const day = r.created_at ? new Date(r.created_at).toDateString() : 'Unknown';
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(r);
    });
    return Array.from(map.entries());
  }, [history]);

  const totalMined = useMemo(
    () => history.filter((r) => r.type === 'collect').reduce((s, r) => s + (parseFloat(r.usd_value) || 0), 0),
    [history]
  );

  return (
    <div className="min-h-screen bg-[#161618]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@500;600&family=Inter:wght@400;500;600;700&display=swap');
        .fd { font-family: 'Cormorant', serif; }
        .fi { font-family: 'Inter', sans-serif; }
        .tnum { font-variant-numeric: tabular-nums; }
        @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .rise { animation: rise 0.45s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      <NavBar />

      <main className="lg:pl-[300px] pb-28 lg:pb-12">
        <div className="relative max-w-2xl mx-auto px-3 sm:px-6 pt-3 lg:pt-10">

          <div className="pointer-events-none absolute inset-x-0 top-0 h-56"
            style={{ background: 'radial-gradient(70% 100% at 50% 0%, rgba(198,161,91,0.05), transparent 70%)' }} />

          {/* Header + total mined */}
          <div className="rise relative flex items-end justify-between gap-4">
            <div>
              <h1 className="fd text-[26px] sm:text-[28px] font-medium text-[#EDEDEE] leading-tight">Mining History</h1>
              <p className="fi text-[13px] text-[#A0A0A6] mt-0.5">Your collections and exchanges</p>
            </div>
            {!loading && totalMined > 0 && (
              <div className="text-right flex-shrink-0">
                <p className="tnum text-[20px] font-semibold text-[#C6A15B] leading-none">+{RemoveTrailingZeros(totalMined)}</p>
                <p className="fi text-[9px] font-medium uppercase tracking-[0.14em] text-[#6F6F76] mt-1.5">Total mined</p>
              </div>
            )}
          </div>

          {loading ? (
            <div className="relative mt-6">
              <div className="h-2.5 w-16 rounded bg-[#212125] animate-pulse mb-2" />
              {[0, 1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
            </div>
          ) : history.length === 0 ? (
            <div className="rise relative mt-10 text-center py-12 px-6">
              <div className="w-12 h-12 mx-auto rounded-xl bg-[#212125] flex items-center justify-center text-[#C6A15B] mb-3.5">
                <Coins size={22} strokeWidth={1.8} />
              </div>
              <h3 className="fi text-[14.5px] font-semibold text-[#EDEDEE]">No activity yet</h3>
              <p className="fi text-[12.5px] text-[#A0A0A6] mt-1 max-w-[230px] mx-auto leading-relaxed">
                Your mining and exchange history will appear here.
              </p>
            </div>
          ) : (
            <div className="relative mt-2">
              {groups.map(([day, records], gi) => (
                <div key={day} className={`rise ${gi === 0 ? 'mt-4' : 'mt-7'}`} style={{ animationDelay: `${gi * 0.06}s` }}>
                  {/* date header */}
                  <p className="fi text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6F6F76] mb-1">
                    {dayLabel(day)}
                  </p>

                  {/* entries on a timeline spine */}
                  <div className="relative">
                    {records.length > 1 && (
                      <span className="absolute left-[17px] top-[18px] bottom-[18px] w-px bg-white/[0.05]" />
                    )}
                    <div className="flex flex-col">
                      {records.map((record, i) => (
                        <LedgerRow key={record.id || `${day}-${i}`} record={record} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <p className="fi text-center text-[11px] text-[#6F6F76] mt-9">
                Showing {Math.min(history.length, 50)}
                {history.length > 50 ? ` of ${history.length}` : ''} {history.length === 1 ? 'entry' : 'entries'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MiningHistory;