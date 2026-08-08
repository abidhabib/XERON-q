import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  Receipt, ChevronRight, X, Banknote, BadgeCheck, ArrowLeft, AlertTriangle,
  CalendarDays, Hash, ShieldCheck, CalendarX2, TrendingUp, Check,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { UserContext } from './UserContext/UserContext';
import NavBar from './NavBar';
import { RemoveTrailingZeros } from '../utils/utils';
import { useNavigate } from 'react-router-dom';

const monthDate = (m) => parseISO(`${m.slice(0, 4)}-${m.slice(4)}-01`);

/* ── Receipt detail row ── */
const DetailRow = ({ icon: Icon, label, value, valueClass = 'text-[#EDEDEE]', mono = false }) => (
  <div className="flex items-center gap-3">
    <span className="w-8 h-8 rounded-lg bg-[#1B1B1E] ring-1 ring-white/[0.05] flex items-center justify-center flex-shrink-0">
      <Icon size={14} className="text-[#C6A15B]" strokeWidth={2} />
    </span>
    <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
      <span className="fi text-[11.5px] text-[#6F6F76] flex-shrink-0">{label}</span>
      <span className={`fi text-[12.5px] font-medium truncate ${mono ? 'font-mono text-[11.5px] text-[#A0A0A6]' : valueClass}`}>{value}</span>
    </div>
  </div>
);

/* ── Receipt modal ── */
const ReceiptModal = ({ payment, onClose }) => {
  if (!payment) return null;
  const date = monthDate(payment.month);
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4" onClick={onClose}>
      <div className="pop-in relative w-full max-w-sm bg-[#1B1B1E] rounded-2xl ring-1 ring-white/[0.06] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.5)]" onClick={(e) => e.stopPropagation()}>

        {/* PAID stamp */}
        <div className="absolute top-16 right-5 rotate-[-14deg] border-[1.5px] border-[#8FC7A0]/50 text-[#8FC7A0]/70 rounded px-2.5 py-0.5 fi text-[11px] font-bold tracking-[0.2em] pointer-events-none select-none">
          PAID
        </div>

        {/* header */}
        <div className="flex items-center justify-between p-3 pb-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#C6A15B]/10 ring-1 ring-[#C6A15B]/20 flex items-center justify-center">
              <Receipt size={18} className="text-[#C6A15B]" strokeWidth={2} />
            </span>
            <div>
              <h3 className="fd text-[18px] font-medium text-[#EDEDEE] leading-tight">Salary Receipt</h3>
              <p className="fi text-[11px] text-[#6F6F76]">Payment confirmation</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6F6F76] hover:text-[#EDEDEE] hover:bg-[#212125] transition-colors" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* success seal */}
        <div className="flex justify-center py-2 mb-3">
          <div className="relative w-20 h-20 rounded-full bg-[#1E2A22] ring-1 ring-[#8FC7A0]/25 flex items-center justify-center">
            <Banknote size={32} strokeWidth={1.6} className="text-[#8FC7A0]" />
            <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-[#C6A15B] ring-2 ring-[#1B1B1E] flex items-center justify-center">
              <BadgeCheck size={15} className="text-[#161618]" strokeWidth={2.5} />
            </span>
          </div>
        </div>

        {/* details */}
        <div className="mx-3 rounded-xl bg-[#161618] ring-1 ring-white/[0.04] p-3 space-y-3">
          <DetailRow icon={CalendarDays} label="Payment date" value={format(date, 'dd MMM yyyy')} />
          <DetailRow icon={CalendarDays} label="For period" value={format(date, 'MMMM yyyy')} />
          <div className="border-t border-dashed border-white/[0.08]" />
          <DetailRow icon={Hash} label="Transaction ID" value={payment.transactionId || 'SAL-' + Date.now()} mono />
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-[#1B1B1E] ring-1 ring-white/[0.05] flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={14} className="text-[#8FC7A0]" strokeWidth={2} />
            </span>
            <div className="flex-1 flex items-center justify-between gap-3">
              <span className="fi text-[11.5px] text-[#6F6F76]">Status</span>
              <span className="fi inline-flex items-center gap-1 text-[12.5px] font-medium text-[#8FC7A0]">
                <BadgeCheck size={13} /> Confirmed
              </span>
            </div>
          </div>
        </div>

        {/* total */}
        <div className="text-center pt-4 pb-2">
          <p className="fi text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6F6F76]">Total amount</p>
          <p className="tnum text-[34px] font-semibold text-[#C6A15B] mt-1 leading-none">${RemoveTrailingZeros(payment.amount)}</p>
          <p className="fi text-[11px] text-[#6F6F76] mt-2">Successfully transferred to your balance</p>
        </div>

        <div className="p-3 pt-3">
          <button onClick={onClose} className="fi w-full h-11 rounded-xl bg-[#212125] text-[#A0A0A6] hover:bg-[#27272C] hover:text-[#EDEDEE] text-[13px] font-medium transition-colors">
            Close receipt
          </button>
        </div>
      </div>
    </div>
  );
};

const MonthSalaryHistory = () => {
  const { Userid } = useContext(UserContext);
  const API = import.meta.env.VITE_API_BASE_URL;
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      if (!Userid) { setLoading(false); return; }
      try {
        const res = await axios.get(`${API}/api/monthly-salary/history`, { withCredentials: true });
        setHistory(res.data.history || []);
      } catch {
        setError('Failed to load payment history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [Userid, API]);

  const totalEarned = history.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

  return (
    <div className="min-h-screen bg-[#161618]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@500;600&family=Inter:wght@400;500;600;700&display=swap');
        .fd { font-family: 'Cormorant', serif; }
        .fi { font-family: 'Inter', sans-serif; }
        .tnum { font-variant-numeric: tabular-nums; }
        @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .rise { animation: rise 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes amountBreathe { 0%,100% { opacity: 1; } 50% { opacity: 0.85; } }
        .amount-breathe { animation: amountBreathe 3s ease-in-out infinite; }
        @keyframes popIn { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
        .pop-in { animation: popIn 0.3s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      <NavBar />

      <main className="lg:pl-[120px] pb-28 lg:pb-12">
        <div className="relative max-w-2xl mx-auto px-3 sm:px-6 pt-4 lg:pt-10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-56"
            style={{ background: 'radial-gradient(70% 100% at 50% 0%, rgba(198,161,91,0.05), transparent 70%)' }} />

          {/* Header */}
          <div className="rise relative flex items-center gap-3">
            <button
              onClick={() => navigate('/salaryofMonth')}
              className="w-9 h-9 rounded-lg bg-[#1B1B1E] ring-1 ring-white/[0.05] flex items-center justify-center text-[#A0A0A6] hover:text-[#EDEDEE] hover:ring-[#C6A15B]/20 transition-all flex-shrink-0"
              aria-label="Back"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="fd text-[24px] sm:text-[26px] font-medium text-[#EDEDEE] leading-tight">Salary History</h1>
              <p className="fi text-[12.5px] text-[#A0A0A6] mt-0.5">Your collected monthly income</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-7 h-7 border-2 border-[#2E2E33] border-t-[#C6A15B] rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {error && (
                <div className="rise relative flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-[#241619] ring-1 ring-[#E2A896]/20 mt-5">
                  <AlertTriangle size={16} className="text-[#E2A896] flex-shrink-0" />
                  <p className="fi text-[13px] text-[#E2A896]">{error}</p>
                </div>
              )}

              {/* Lifetime earnings */}
              {!error && history.length > 0 && (
                <div className="rise relative rounded-2xl bg-[#1B1B1E] ring-1 ring-white/[0.04] p-5 mt-5 overflow-hidden" style={{ animationDelay: '0.05s' }}>
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-24"
                    style={{ background: 'radial-gradient(70% 100% at 50% 0%, rgba(198,161,91,0.07), transparent 70%)' }} />
                  <div className="relative flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp size={13} className="text-[#C6A15B]" strokeWidth={2.2} />
                        <p className="fi text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6F6F76]">Lifetime earnings</p>
                      </div>
                      <p className="tnum amount-breathe text-[36px] font-semibold text-[#C6A15B] mt-1.5 leading-none">
                        ${RemoveTrailingZeros(totalEarned)}
                      </p>
                      <p className="fi text-[11px] text-[#6F6F76] mt-1.5">
                        {history.length} payment{history.length !== 1 ? 's' : ''} collected
                      </p>
                    </div>
                    <span className="w-12 h-12 rounded-xl bg-[#C6A15B]/10 ring-1 ring-[#C6A15B]/20 flex items-center justify-center flex-shrink-0">
                      <Banknote size={22} strokeWidth={1.8} className="text-[#C6A15B]" />
                    </span>
                  </div>
                </div>
              )}

              {/* List */}
              {history.length === 0 ? (
                <div className="rise relative mt-8 text-center py-12 px-6">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-[#212125] flex items-center justify-center text-[#C6A15B] mb-3.5">
                    <CalendarX2 size={22} strokeWidth={1.8} />
                  </div>
                  <h3 className="fi text-[14.5px] font-semibold text-[#EDEDEE]">No salary payments yet</h3>
                  <p className="fi text-[12.5px] text-[#A0A0A6] mt-1 max-w-[220px] mx-auto leading-relaxed">
                    Once you collect your first salary, it'll appear here.
                  </p>
                </div>
              ) : (
                <div className="relative flex flex-col gap-2 mt-4">
                  {history.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedPayment(item)}
                      className="rise group w-full flex items-center gap-3.5 p-3.5 rounded-xl bg-[#1B1B1E] ring-1 ring-white/[0.04] hover:ring-[#C6A15B]/25 hover:-translate-y-0.5 transition-all text-left"
                      style={{ animationDelay: `${0.08 + index * 0.04}s` }}
                    >
                      <div className="relative flex-shrink-0">
                        <span className="w-10 h-10 rounded-xl bg-[#C6A15B]/10 ring-1 ring-[#C6A15B]/15 flex items-center justify-center">
                          <Banknote size={17} strokeWidth={2} className="text-[#C6A15B]" />
                        </span>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#1E2A22] ring-2 ring-[#1B1B1E] flex items-center justify-center">
                          <Check size={8} className="text-[#8FC7A0]" strokeWidth={3.5} />
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="fi text-[14px] font-semibold text-[#EDEDEE] leading-tight">
                          {format(monthDate(item.month), 'MMMM yyyy')}
                        </p>
                        <p className="fi text-[11px] text-[#6F6F76] mt-0.5">
                          {item.date ? `Collected ${format(new Date(item.date), 'MMM dd, yyyy')}` : 'Monthly salary'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <p className="tnum text-[14px] font-semibold text-[#C6A15B] leading-tight">+${RemoveTrailingZeros(item.amount)}</p>
                          <p className="fi text-[9.5px] font-medium text-[#8FC7A0] mt-0.5">Credited</p>
                        </div>
                        <ChevronRight size={16} className="text-[#6F6F76] group-hover:text-[#C6A15B] group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {selectedPayment && <ReceiptModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />}
    </div>
  );
};

export default MonthSalaryHistory;