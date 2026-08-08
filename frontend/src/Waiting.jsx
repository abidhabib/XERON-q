import { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "./UserContext/UserContext";
import { RotateCw, LogOut, Hash, CheckCircle2, Loader2, Clock } from 'lucide-react';

const FEED = [
  { tone: 'ok', text: 'transaction hash received' },
  { tone: 'ok', text: 'BEP20 format validated' },
  { tone: 'run', text: 'checking network confirmations' },
  { tone: 'ok', text: 'signature verified' },
  { tone: 'run', text: 'queued for final approval' },
];

const shortHash = (h) => (h ? `${h.slice(0, 10)}…${h.slice(-8)}` : '');

/* ── Live verification feed ── */
const VerificationFeed = () => {
  const [lines, setLines] = useState([]);
  const [idx, setIdx] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    let t;
    if (idx >= FEED.length) {
      t = setTimeout(() => { setLines([]); setIdx(0); }, 4200);
    } else {
      t = setTimeout(() => {
        const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLines((prev) => [...prev, { ...FEED[idx], time, key: `${Date.now()}-${idx}` }]);
        setIdx((i) => i + 1);
      }, idx === 0 ? 500 : 1300);
    }
    return () => clearTimeout(t);
  }, [idx]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines]);

  return (
    <div className="rounded-xl bg-[#141416] ring-1 ring-white/[0.05] overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#17171A]">
        <span className="fi text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#6F6F76]">Verification log</span>
        <span className="flex items-center gap-1.5">
          
          <span className="fi text-[9.5px] font-medium text-[#C6A15B]">verifying...</span>
        </span>
      </div>
      <div ref={scrollRef} className="no-scrollbar h-[118px] overflow-y-auto px-3.5 py-3 font-mono text-[11px] space-y-1.5">
        {lines.map((l) => (
          <div key={l.key} className="feed-line flex items-center gap-2">
            <span className="text-[#4A4A50] flex-shrink-0">{l.time}</span>
            {l.tone === 'ok' ? (
              <CheckCircle2 size={11} className="text-[#8FC7A0] flex-shrink-0" />
            ) : (
              <Loader2 size={11} className="text-[#C6A15B] animate-spin flex-shrink-0" />
            )}
            <span className={l.tone === 'ok' ? 'text-[#A0A0A6]' : 'text-[#C6A15B]'}>{l.text}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-3.5 bg-[#C6A15B] rounded-[1px] animate-pulse" />
        </div>
      </div>
    </div>
  );
};

const Waiting = () => {
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const navigate = useNavigate();
  const { paymentOk, approved, isRejected, fetchUserData, trx_id, logout } = useContext(UserContext);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    fetchUserData().then(() => setLoading(false));
  }, []);

  /* elapsed timer */
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  /* navigation */
  useEffect(() => {
    if (!loading) {
      if (isRejected === 1 || paymentOk === 0) navigate("/payment");
      else if (approved === 1) navigate("/wallet-page");
    }
  }, [isRejected, approved, paymentOk, navigate, loading]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#161618] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-[#2E2E33] border-t-[#C6A15B] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#161618]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@500;600&family=Inter:wght@400;500;600;700&display=swap');
        .fd { font-family: 'Cormorant', serif; }
        .fi { font-family: 'Inter', sans-serif; }
        .tnum { font-variant-numeric: tabular-nums; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .rise { animation: rise 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        .feed-line { animation: rise 0.3s ease-out both; }
        @keyframes auraBreathe { 0%,100% { opacity: 0.5; transform: scale(0.96); } 50% { opacity: 0.9; transform: scale(1.05); } }
        .aura-breathe { animation: auraBreathe 4s ease-in-out infinite; }
        @keyframes scanRotate { to { transform: rotate(360deg); } }
        .scan-rotate { animation: scanRotate 3.2s linear infinite; }
        @keyframes spinSlower { to { transform: rotate(360deg); } }
        .spin-slower { animation: spinSlower 26s linear infinite; }
        @keyframes orbit { to { transform: rotate(360deg); } }
        .orbit-1 { animation: orbit 13s linear infinite; }
        .orbit-2 { animation: orbit 17s linear infinite reverse; }
        .odot { position: absolute; top: 0; left: 50%; width: 6px; height: 6px; margin: -3px 0 0 -3px; border-radius: 9999px; background: #D8BA7C; box-shadow: 0 0 8px rgba(216,186,124,0.8); }
        .odot-sm { width: 4px; height: 4px; margin: -2px 0 0 -2px; background: #C6A15B; }
        @keyframes corePulse { 0%,100% { box-shadow: 0 0 0 0 rgba(198,161,91,0); } 50% { box-shadow: 0 0 22px 2px rgba(198,161,91,0.25); } }
        .core-pulse { animation: corePulse 3s ease-in-out infinite; }
        @keyframes popIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        .pop-in { animation: popIn 0.25s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      <main className="min-h-screen flex items-center justify-center px-4 py-10">
        <div className="relative w-full max-w-md">

          <div className="pointer-events-none absolute inset-x-0 -top-6 h-64"
            style={{ background: 'radial-gradient(70% 100% at 50% 0%, rgba(198,161,91,0.06), transparent 70%)' }} />

          {/* Top row — step + live elapsed */}
          <div className="rise relative flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-1 rounded-full bg-[#C6A15B]" />
              <span className="w-5 h-1 rounded-full bg-[#C6A15B]" />
              <span className="w-5 h-1 rounded-full bg-[#C6A15B] animate-pulse" />
            </div>
            <span className="flex items-center gap-1.5">
              <span className="relative flex w-1.5 h-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C6A15B] opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#C6A15B]" />
              </span>
            </span>
          </div>

          {/* Scanning core */}
          <div className="rise relative flex justify-center mt-8" style={{ animationDelay: '0.05s' }}>
            <div className="relative w-40 h-40 flex items-center justify-center">
              <div className="aura-breathe absolute inset-0 rounded-full blur-2xl"
                style={{ background: 'radial-gradient(circle, rgba(198,161,91,0.20), transparent 70%)' }} />
              <svg className="absolute inset-0 w-full h-full scan-rotate" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="72" fill="none" stroke="rgba(198,161,91,0.45)" strokeWidth="2" strokeLinecap="round" strokeDasharray="70 382" />
              </svg>
              <div className="absolute inset-4 rounded-full border border-dashed border-[#C6A15B]/15 spin-slower" />
              <div className="absolute inset-2 orbit-1"><span className="odot" /></div>
              <div className="absolute inset-6 orbit-2"><span className="odot odot-sm" /></div>
              <div className="core-pulse relative w-16 h-16 rounded-2xl bg-[#C6A15B]/10 ring-1 ring-[#C6A15B]/30 flex items-center justify-center">
                <Hash size={26} strokeWidth={1.8} className="text-[#C6A15B]" />
              </div>
            </div>
          </div>

          {/* Headline */}
          <div className="rise relative text-center mt-6" style={{ animationDelay: '0.1s' }}>
            <h1 className="fd text-[26px] font-medium text-[#EDEDEE] leading-tight">Your payment is under review</h1>
            <p className="fi text-[12.5px] text-[#A0A0A6] mt-1">We'll unlock your wallet the moment it's confirmed</p>
          </div>

          {/* Hash chip */}
          {trx_id && (
            <div className="rise relative flex justify-center mt-4" style={{ animationDelay: '0.14s' }}>
              <span className="fi font-mono text-[10.5px] text-[#6F6F76] bg-[#1B1B1E] ring-1 ring-white/[0.05] px-3 py-1.5 rounded-full">
                {shortHash(trx_id)}
              </span>
            </div>
          )}

          {/* Live verification feed */}
          <div className="rise relative mt-6" style={{ animationDelay: '0.18s' }}>
            <VerificationFeed />
          </div>

          {/* Actions */}
          <div className="rise relative flex flex-col gap-2.5 mt-6" style={{ animationDelay: '0.22s' }}>
            <button
              onClick={() => window.location.reload()}
              className="fi w-full h-11 rounded-xl bg-[#1B1B1E] ring-1 ring-white/[0.05] text-[#A0A0A6] hover:text-[#EDEDEE] hover:ring-[#C6A15B]/20 flex items-center justify-center gap-2 text-[13px] font-medium transition-all"
            >
              <RotateCw size={15} /> Refresh status
            </button>
            <button
              onClick={() => setShowLogoutConfirm(!showLogoutConfirm)}
              type="button"
              className="fi w-full h-11 rounded-xl bg-[#1B1B1E] ring-1 ring-white/[0.05] text-[#A0A0A6] hover:text-[#E2A896] hover:ring-[#E2A896]/25 flex items-center justify-center gap-2 text-[13px] font-medium transition-all"
            >
              <LogOut size={15} /> Log out
            </button>
            {showLogoutConfirm && (
              <div className="pop-in flex gap-2">
                <button onClick={handleLogout} className="fi flex-1 h-10 rounded-xl bg-[#241619] ring-1 ring-[#E2A896]/25 text-[#E2A896] text-[13px] font-medium hover:bg-[#2A1915] transition-colors">
                  Yes, log out
                </button>
                <button onClick={() => setShowLogoutConfirm(false)} className="fi flex-1 h-10 rounded-xl bg-[#212125] text-[#A0A0A6] text-[13px] font-medium hover:bg-[#27272C] transition-colors">
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Support footer */}
          <div className="rise relative text-center mt-6" style={{ animationDelay: '0.26s' }}>
            <p className="fi flex items-center justify-center gap-1.5 text-[11.5px] text-[#6F6F76]">
              <Clock size={12} className="text-[#C6A15B]" /> Verification completes in 10–30 minutes
            </p>
            <p className="fi text-[11px] text-[#57575D] mt-1.5">
              Need help?{' '}
              <a href="mailto:support@yourplatform.com" className="text-[#C6A15B] hover:text-[#D8BA7C] transition-colors">Contact support</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Waiting;