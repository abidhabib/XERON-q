import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { RemoveTrailingZeros } from '../utils/utils';
import NavBar from './NavBar';
import { UserContext } from './UserContext/UserContext';
import { Coins, ArrowDownToLine, History, RotateCw, X, CheckCircle2, Clock, Activity } from 'lucide-react';
import BalanceCard from './new/BalanceCard';

axios.defaults.withCredentials = true;
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) window.location.href = '/';
    return Promise.reject(error);
  }
);

const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const API = import.meta.env.VITE_API_BASE_URL;
const BASE_RATE = 0.42;

/* ── Toast ── */
const Toast = ({ message, type, onClose }) => {
  const map = {
    success: { ring: 'ring-[#8FC7A0]/20', icon: 'bg-[#8FC7A0]/15 text-[#8FC7A0]', sym: '✓' },
    error:   { ring: 'ring-[#E2A896]/20', icon: 'bg-[#E2A896]/15 text-[#E2A896]', sym: '✕' },
    info:    { ring: 'ring-[#C6A15B]/20', icon: 'bg-[#C6A15B]/15 text-[#C6A15B]', sym: 'ℹ' },
  };
  const s = map[type] || map.info;
  return (
    <div className={`fi flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#1B1B1E] ring-1 ${s.ring} shadow-[0_12px_32px_rgba(0,0,0,0.4)]`}>
      <span className={`w-5 h-5 flex items-center justify-center rounded-md text-[11px] font-bold ${s.icon}`}>{s.sym}</span>
      <span className="fi text-[13px] text-[#EDEDEE] font-medium">{message}</span>
      <button onClick={onClose} className="text-[#6F6F76] hover:text-[#A0A0A6] transition-colors ml-1"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
};

/* ── Bottom sheet ── */
const BottomSheet = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-[#1B1B1E] rounded-t-[24px] ring-1 ring-white/[0.06] shadow-[0_-16px_48px_rgba(0,0,0,0.5)] max-h-[85vh] sheet-up" onClick={(e) => e.stopPropagation()}>
        <div className="pt-3 flex justify-center"><div className="w-10 h-1 bg-[#2A2A30] rounded-full" /></div>
        {children}
      </div>
    </div>
  );
};

/* ── LIVE streaming chart — the beating heart ── */
const LiveMarketChart = ({ burst }) => {
  const seed = useMemo(() => {
    const arr = [];
    let r = BASE_RATE;
    for (let i = 0; i < 44; i++) {
      r += (Math.random() - 0.5) * 0.012;
      r = Math.max(0.36, Math.min(0.48, r));
      arr.push(r);
    }
    return arr;
  }, []);
  const [series, setSeries] = useState(seed);

  useEffect(() => {
    const id = setInterval(() => {
      setSeries((prev) => {
        const last = prev[prev.length - 1];
        let next = last + (Math.random() - 0.5) * 0.014;
        next = Math.max(0.36, Math.min(0.48, next));
        return [...prev.slice(1), next];
      });
    }, 800);
    return () => clearInterval(id);
  }, []);

  const W = 320, H = 140, PX = 4, PT = 16, PB = 10;
  const max = Math.max(...series), min = Math.min(...series);
  const range = max - min || 1;
  const coords = series.map((v, i) => ({
    x: PX + (i / (series.length - 1)) * (W - PX * 2),
    y: PT + (1 - (v - min) / range) * (H - PT - PB),
  }));
  const line = coords.map((c, i) => `${i ? 'L' : 'M'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const area = `${line} L${coords[coords.length - 1].x.toFixed(1)},${H - PB} L${coords[0].x.toFixed(1)},${H - PB} Z`;
  const last = coords[coords.length - 1];

  const cur = series[series.length - 1];
  const change = cur - series[0];
  const changePct = (change / series[0]) * 100;
  const up = change >= 0;

  return (
    <div className="relative rounded-xl bg-[#161618] ring-1 ring-white/[0.04] overflow-hidden">
      {/* chart header — live rate */}
      <div className="relative z-10 flex items-center justify-between px-3.5 pt-3">
        <div className="flex items-center gap-2">
          <span className="relative flex w-1.5 h-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8FC7A0] opacity-60" />
            <span className="relative inline-flex rounded-full h-1.5 h-1.5 w-1.5 bg-[#8FC7A0]" />
          </span>
          <span className="fi text-[9px] font-semibold uppercase tracking-[0.16em] text-[#6F6F76]">Live · WEB3/USD</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="tnum fi text-[14px] font-semibold text-[#EDEDEE] leading-none">${cur.toFixed(4)}</span>
          <span className={`tnum fi flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${up ? 'bg-[#8FC7A0]/10 text-[#8FC7A0]' : 'bg-[#E2A896]/10 text-[#E2A896]'}`}>
            {up ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
          </span>
        </div>
      </div>

      {/* the streaming line */}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-32 mt-1" preserveAspectRatio="none">
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={PX} x2={W - PX} y1={PT + f * (H - PT - PB)} y2={PT + f * (H - PT - PB)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        ))}
        <path d={area} fill="rgba(198,161,91,0.10)" />
        <path d={line} fill="none" stroke="#C6A15B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={last.x} cy={last.y} r="3" fill="rgba(216,186,124,0.3)" className="chart-ping" />
        <circle cx={last.x} cy={last.y} r="2.8" fill="#D8BA7C" />
      </svg>

      {/* collect burst */}
      {burst && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="mburst" style={{ left: `${15 + Math.random() * 70}%`, animationDelay: `${(i % 5) * 0.1}s` }} />
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Scrolling ticker tape ── */
const Ticker = ({ items }) => {
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden rounded-lg bg-[#161618] ring-1 ring-white/[0.04] h-8 flex items-center">
      <div className="ticker-track flex items-center gap-6 whitespace-nowrap">
        {row.map((it, i) => (
          <span key={i} className="fi flex items-center gap-1.5 text-[10.5px]">
            <span className="text-[#C6A15B]">◆</span>
            <span className="text-[#6F6F76]">{it.label}</span>
            <span className="tnum font-semibold text-[#A0A0A6]">{it.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

/* ── Stat tile ── */
const Stat = ({ label, value, sub }) => (
  <div className="rounded-xl bg-[#161618] ring-1 ring-white/[0.04] p-3">
    <p className="fi text-[8.5px] font-semibold uppercase tracking-[0.12em] text-[#6F6F76]">{label}</p>
    <p className="tnum text-[15px] font-semibold text-[#EDEDEE] mt-1 leading-none truncate">{value}</p>
    <p className="fi text-[9px] text-[#6F6F76] mt-1">{sub}</p>
  </div>
);

/* ── Action button ── */
const ActionButton = ({ onClick, disabled, loading, icon, label, primary }) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    className={`fi h-11 rounded-xl flex items-center justify-center gap-2 text-[13.5px] font-semibold transition-all duration-200 disabled:cursor-not-allowed ${
      primary
        ? disabled
          ? 'bg-[#212125] text-[#57575D]'
          : 'bg-[#C6A15B] text-[#161618] hover:bg-[#D8BA7C] shadow-[0_10px_28px_rgba(198,161,91,0.14)] active:scale-[0.99]'
        : disabled
          ? 'bg-[#212125] text-[#57575D] ring-1 ring-white/[0.04]'
          : 'bg-[#212125] text-[#EDEDEE] hover:bg-[#27272C] active:scale-[0.99]'
    }`}
  >
    {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : <>{icon}<span>{label}</span></>}
  </button>
);

/* ── Main ── */
const MiningTask = () => {
  const [userData, setUserData] = useState({ coin: 0, balance: 0, last_collect_date: null });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState({ collect: false, exchange: false });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [collectAvailable, setCollectAvailable] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [collectSuccessSheet, setCollectSuccessSheet] = useState(false);
  const [collectMessage, setCollectMessage] = useState('');
  const [exchangeSheetOpen, setExchangeSheetOpen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [burst, setBurst] = useState(false);
  const { setCurrBalance } = useContext(UserContext);
  const navigate = useNavigate();

  const showToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), duration);
  };
  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/user-data`);
      const data = res.data || {};
      const user = {
        coin: data.coin ?? 0,
        balance: data.balance ?? 0,
        last_collect_date: data.last_collect_date ?? null,
        isEligibleToCollect: Boolean(data.is_eligible_to_collect),
      };
      setUserData(user);
      setCollectAvailable(user.isEligibleToCollect);
    } catch (err) {
      console.error('User data fetch error:', err);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/coin-collect-history`);
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
    fetchHistory();
  }, [fetchUserData, fetchHistory, refreshTrigger]);

  /* real mining metrics */
  const collects = useMemo(() => history.filter((r) => r.type === 'collect'), [history]);
  const totalMined = useMemo(() => collects.reduce((s, r) => s + (parseFloat(r.usd_value) || 0), 0), [collects]);
  const lifetimeValue = useMemo(() => collects.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0), [collects]);

  const tickerItems = [
    { label: 'TOTAL MINED', value: `${RemoveTrailingZeros(totalMined)} WEB3` },
    { label: 'LIFETIME VALUE', value: `$${RemoveTrailingZeros(lifetimeValue)}` },
    { label: 'SESSIONS', value: `${collects.length}` },
    { label: 'YOUR HOLDINGS', value: `${RemoveTrailingZeros(userData.coin ?? 0)} WEB3` },
    { label: 'STATUS', value: collectAvailable ? 'READY TO MINE' : 'PRE-COOLDOWN' },
  ];

  const handleCollect = async () => {
    if (!collectAvailable || loading.collect) return;
    setLoading((prev) => ({ ...prev, collect: true }));
    setBurst(true);
    setTimeout(() => setBurst(false), 2000);
    try {
      const res = await axios.post(`${API}/collect-coin`);
      setRefreshTrigger((p) => p + 1);
      setCollectMessage(res.data?.message || 'Coins collected successfully');
      setCollectSuccessSheet(true);
    } catch (err) {
      showToast(err.response?.data?.error || 'Collection failed', 'error');
    } finally {
      setLoading((prev) => ({ ...prev, collect: false }));
    }
  };

  const handleExchangeClick = () => {
    if ((userData.coin ?? 0) <= 0) return showToast('You have no coins to exchange', 'error');
    setExchangeSheetOpen(true);
  };

  const confirmExchange = async () => {
    setExchangeSheetOpen(false);
    setLoading((prev) => ({ ...prev, exchange: true }));
    try {
      const res = await axios.post(`${API}/exchange-coin`);
      if (!res.data?.success) throw new Error(res.data?.error || 'Exchange failed');
      setCurrBalance(RemoveTrailingZeros(res.data.balance));
      setRefreshTrigger((p) => p + 1);
      showToast(res.data?.message || 'Exchange completed successfully', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || err.message || 'Exchange failed', 'error');
    } finally {
      setLoading((prev) => ({ ...prev, exchange: false }));
    }
  };

  const lastCollect = userData.last_collect_date ? new Date(userData.last_collect_date).getTime() : 0;
  const remaining = collectAvailable ? 0 : Math.max(0, lastCollect + COOLDOWN_MS - now);
  const progress = collectAvailable ? 100 : lastCollect ? Math.min(100, ((COOLDOWN_MS - remaining) / COOLDOWN_MS) * 100) : 0;
  const fmt = (ms) => {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h > 0 ? `${h}h ${pad(m)}m ${pad(sec)}s` : m > 0 ? `${m}m ${pad(sec)}s` : `${pad(sec)}s`;
  };

  return (
    <div className="min-h-screen bg-[#161618]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@500;600&family=Inter:wght@400;500;600;700&display=swap');
        .fd { font-family: 'Cormorant', serif; }
        .fi { font-family: 'Inter', sans-serif; }
        .tnum { font-variant-numeric: tabular-nums; }
        @keyframes chartPing { 0% { r: 3; opacity: 0.6; } 100% { r: 9; opacity: 0; } }
        .chart-ping { animation: chartPing 1.8s ease-out infinite; }
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .ticker-track { animation: ticker 22s linear infinite; }
        @keyframes mburst { 0% { transform: translateY(0) scale(1); opacity: 0.95; } 100% { transform: translateY(-70px) scale(0.2); opacity: 0; } }
        .mburst { position: absolute; bottom: 20%; width: 5px; height: 5px; border-radius: 9999px; background: #D8BA7C; box-shadow: 0 0 8px rgba(216,186,124,0.8); animation: mburst 1.2s ease-out infinite; }
        @keyframes floatUp { 0% { transform: translateY(0); opacity: 0; } 12% { opacity: 0.6; } 88% { opacity: 0.6; } 100% { transform: translateY(-180px); opacity: 0; } }
        .particle { position: absolute; bottom: -8px; width: 3px; height: 3px; border-radius: 9999px; background: #C6A15B; animation: floatUp linear infinite; }
        @keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .sheet-up { animation: sheetUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .rise { animation: rise 0.45s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      <NavBar />

      <main className="lg:pl-[120px] pb-28 lg:pb-12">
        <div className="relative max-w-md mx-auto px-3 sm:px-6 pt-3 lg:pt-8">

          <div className="pointer-events-none absolute inset-x-0 top-0 h-72"
            style={{ background: 'radial-gradient(70% 100% at 50% 0%, rgba(198,161,91,0.05), transparent 70%)' }} />

          {/* Wallet hero */}
          <div className="rise relative">
            <BalanceCard />
          </div>

          {/* ══ Mining terminal ══ */}
          <div className="rise relative mt-3 rounded-xl bg-[#1B1B1E] ring-1 ring-white/[0.04] p-3 overflow-hidden" style={{ animationDelay: '0.06s' }}>
         

            {/* terminal header */}
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-xl bg-[#C6A15B]/10 ring-1 ring-[#C6A15B]/20 flex items-center justify-center flex-shrink-0">
                  <Coins size={20} strokeWidth={1.8} className="text-[#C6A15B]" />
                </span>
                <div>
                  <p className="fi text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6F6F76]">Your holdings</p>
                  <p className="tnum text-[26px] font-semibold text-[#EDEDEE] leading-none mt-1">
                    {RemoveTrailingZeros(userData.coin ?? 0)} <span className="text-[13px] text-[#6F6F76]">WEB3</span>
                  </p>
                </div>
              </div>
              {collectAvailable ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C6A15B]/10 ring-1 ring-[#C6A15B]/25 flex-shrink-0">
                  <span className="relative flex w-1.5 h-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C6A15B] opacity-60" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#C6A15B]" />
                  </span>
                  <span className="fi text-[10.5px] font-semibold text-[#C6A15B]">Ready</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#212125] ring-1 ring-white/[0.06] flex-shrink-0">
                  <Clock size={11} className="text-[#6F6F76]" />
                  <span className="fi text-[10.5px] font-medium text-[#A0A0A6]">Cooldown</span>
                </span>
              )}
            </div>

            {/* LIVE chart */}
            <div className="relative mt-4">
              <LiveMarketChart burst={burst} />
            </div>

            {/* stats */}
            <div className="relative grid grid-cols-3 gap-2 mt-4">
              <Stat label="Total mined" value={RemoveTrailingZeros(totalMined)} sub="WEB3" />
              <Stat label="Lifetime value" value={`$${RemoveTrailingZeros(lifetimeValue)}`} sub="earned" />
              <Stat label="Collects" value={collects.length} sub="sessions" />
            </div>

            {/* cooldown */}
            {!collectAvailable && (
              <div className="relative mt-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="fi text-[10.5px] text-[#6F6F76]">Next collection</span>
                  <span className="tnum fi text-[11px] font-semibold text-[#C6A15B]">{fmt(remaining)}</span>
                </div>
                <div className="h-1 bg-[#212125] rounded-full overflow-hidden">
                  <div className="h-full bg-[#C6A15B] rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {/* actions */}
            <div className="relative grid grid-cols-2 gap-3 mt-5">
              <ActionButton
                primary
                onClick={handleCollect}
                disabled={!collectAvailable || loading.collect}
                loading={loading.collect}
                label={collectAvailable ? 'Mine' : 'Minied'}
              />
              <ActionButton
                onClick={handleExchangeClick}
                disabled={(userData.coin ?? 0) <= 0 || loading.exchange}
                loading={loading.exchange}
                icon={<ArrowDownToLine className="w-4 h-4" />}
                label="Exchange to USD"
              />
            </div>
          </div>

          <button
            onClick={() => navigate('/mining-history')}
            className="rise relative fi mt-3 w-full h-11 rounded-xl bg-[#1B1B1E] ring-1 ring-white/[0.04] text-[#A0A0A6] hover:text-[#EDEDEE] hover:ring-[#C6A15B]/20 flex items-center justify-center gap-2 text-[13px] font-medium transition-all"
            style={{ animationDelay: '0.1s' }}
          >
            <History className="w-4 h-4" /> See full history
          </button>
        </div>
      </main>

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map((t) => <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />)}
      </div>

      {/* Collect success */}
      <BottomSheet isOpen={collectSuccessSheet} onClose={() => setCollectSuccessSheet(false)}>
        <div className="px-5 pt-2 pb-7 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-[#1E2A22] ring-1 ring-[#8FC7A0]/25 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-7 h-7 text-[#8FC7A0]" />
          </div>
          <h3 className="fd text-[22px] font-medium text-[#EDEDEE]">Collected!</h3>
          <p className="fi text-[13px] text-[#A0A0A6] mt-1.5">{collectMessage}</p>
          <button onClick={() => setCollectSuccessSheet(false)} className="fi mt-6 w-full h-11 rounded-xl bg-[#C6A15B] text-[#161618] font-semibold hover:bg-[#D8BA7C] transition-colors">
            Done
          </button>
        </div>
      </BottomSheet>

      {/* Exchange confirm */}
      <BottomSheet isOpen={exchangeSheetOpen} onClose={() => setExchangeSheetOpen(false)}>
        <div className="px-5 pt-2 pb-7 text-center relative">
          <button onClick={() => setExchangeSheetOpen(false)} className="absolute top-3 right-3 p-1.5 rounded-lg text-[#6F6F76] hover:text-[#EDEDEE] hover:bg-[#212125] transition-colors" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
          <div className="mx-auto w-14 h-14 rounded-full bg-[#C6A15B]/10 ring-1 ring-[#C6A15B]/20 flex items-center justify-center mb-4">
            <ArrowDownToLine className="w-6 h-6 text-[#C6A15B]" />
          </div>
          <h3 className="fd text-[22px] font-medium text-[#EDEDEE]">Confirm exchange</h3>
          <p className="fi text-[13px] text-[#A0A0A6] mt-1.5">
            Exchange <span className="tnum font-semibold text-[#EDEDEE]">{RemoveTrailingZeros(userData.coin ?? 0)}</span> coins to your balance?
          </p>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setExchangeSheetOpen(false)} className="fi flex-1 h-11 rounded-xl bg-[#212125] text-[#A0A0A6] font-medium hover:bg-[#27272C] transition-colors">Cancel</button>
            <button onClick={confirmExchange} className="fi flex-1 h-11 rounded-xl bg-[#C6A15B] text-[#161618] font-semibold hover:bg-[#D8BA7C] transition-colors">Confirm</button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};

export default MiningTask;