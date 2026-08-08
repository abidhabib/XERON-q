import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../UserContext/UserContext';
import { RemoveTrailingZeros } from '../../utils/utils';
import { Clipboard, CheckCircle2, ShieldCheck, X, Clock, Settings, Check, History, Landmark, Wallet, ArrowUpRight } from 'lucide-react';
import NavBar from '../NavBar';

const chainInfo = {
  bep20: { name: 'BEP20', desc: 'Binance Smart Chain' },
  eth: { name: 'ETH', desc: 'Ethereum' },
  btc: { name: 'BTC', desc: 'Bitcoin' },
  trc20: { name: 'TRC20', desc: 'TRON Network' },
  sol: { name: 'SOL', desc: 'Solana' },
  polygon: { name: 'MATIC', desc: 'Polygon' },
};

const SectionLabel = ({ children }) => (
  <p className="fi text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6F6F76]">{children}</p>
);

const FlowHero = ({ chain, hasAddress }) => (
  <div className="relative flex items-center justify-between">
    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
      <div className="vault-breathe w-12 h-12 rounded-full bg-[#C6A15B]/10 ring-1 ring-[#C6A15B]/25 flex items-center justify-center">
        <Landmark size={20} strokeWidth={1.8} className="text-[#C6A15B]" />
      </div>
      <p className="fi text-[8.5px] font-semibold uppercase tracking-[0.12em] text-[#6F6F76]">WEBTHREE</p>
    </div>

    <div className="relative flex-1 mx-2 h-6 flex items-center">
      <div className="w-full border-t border-dashed border-[#3A3A40]" />
      <span className="flow-dot" style={{ animationDelay: '0s' }} />
      <span className="flow-dot" style={{ animationDelay: '0.8s' }} />
      <span className="flow-dot" style={{ animationDelay: '1.6s' }} />
    </div>

    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
      <div className="relative w-12 h-12 rounded-full bg-[#212125] ring-1 ring-white/[0.08] flex items-center justify-center">
        <Wallet size={20} strokeWidth={1.8} className="text-[#A0A0A6]" />
        {hasAddress && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#8FC7A0] ring-2 ring-[#161618]" />}
      </div>
      <p className="fi text-[8.5px] font-semibold uppercase tracking-[0.12em] text-[#6F6F76]">{chain ? chain.toUpperCase() : 'Wallet'}</p>
    </div>
  </div>
);

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

/* ── Success modal ── */
const SuccessModal = ({ amount, onClose }) => (
  <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-5">
    <div className="pop-in w-full max-w-xs bg-[#1B1B1E] rounded-2xl ring-1 ring-white/[0.06] p-6 text-center shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
      <div className="w-14 h-14 mx-auto rounded-full bg-[#C6A15B]/10 ring-1 ring-[#C6A15B]/20 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-7 h-7 text-[#C6A15B]" />
      </div>
      <h3 className="fd text-[22px] font-medium text-[#EDEDEE]">Request received</h3>
      <p className="fi text-[12.5px] text-[#A0A0A6] mt-1.5 leading-relaxed">
        Your withdrawal of <span className="tnum font-semibold text-[#EDEDEE]">${RemoveTrailingZeros(amount)}</span> is processing and completes within 24 hours.
      </p>
      <button onClick={onClose} className="fi mt-5 w-full h-11 rounded-xl bg-[#C6A15B] text-[#161618] font-semibold hover:bg-[#D8BA7C] transition-colors">
        View history
      </button>
    </div>
  </div>
);

const WithdrawPage = () => {
  const { Userid, userData, fetchUserData, team, level, currBalance } = useContext(UserContext);
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [withdrawLimits, setWithdrawLimits] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [withdrawnAmount, setWithdrawnAmount] = useState(0);
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0);
  const [availableWallets, setAvailableWallets] = useState([]);
  const [selectedChain, setSelectedChain] = useState('');

  const API = import.meta.env.VITE_API_BASE_URL;

  const showToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), duration);
  };
  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  useEffect(() => {
    if (!Userid) return;
    const fetchData = async () => {
      try {
        const [limitsRes, walletsRes] = await Promise.all([
          axios.get(`${API}/fetchLimitsData`),
          axios.get(`${API}/api/wallets/${Userid}`),
        ]);
        if (limitsRes.data.status === 'success') setWithdrawLimits(limitsRes.data.data);
        if (walletsRes.data.success) {
          const entries = Object.entries(walletsRes.data.wallets || {});
          setAvailableWallets(entries);
          if (entries.length > 0 && !selectedChain) setSelectedChain(entries[0][0]);
        }
      } catch {
        showToast('Unable to load withdrawal data. Please retry.', 'error');
      }
    };
    fetchData();
  }, [Userid, API]);

  useEffect(() => {
    if (availableWallets.length === 0) setSelectedChain('');
    else if (!selectedChain && availableWallets.length > 0) setSelectedChain(availableWallets[0][0]);
  }, [availableWallets, selectedChain]);

  const balance = currBalance ?? 0;
  const amtNum = amount ? Number(RemoveTrailingZeros(amount)) : 0;
  const balNum = Number(RemoveTrailingZeros(balance)) || 0;
  const overBalance = amount !== '' && amtNum > balNum;
  const rawPct = balNum > 0 ? (amtNum / balNum) * 100 : amtNum > 0 ? 100 : 0;
  const pctOfBalance = Math.min(100, rawPct);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const now = Date.now();
    if (submitting || now - lastSubmissionTime < 5000) return;

    const numericAmount = RemoveTrailingZeros(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return showToast('Enter a valid amount', 'error');

    const currentLimit = withdrawLimits.find((item) => item.withdrawalAttempts === level)?.allow_limit;
    if (currentLimit && numericAmount < parseFloat(currentLimit)) return showToast(`Minimum withdrawal: $${currentLimit}`, 'error');
    if (overBalance) return showToast('Insufficient balance', 'error');
    if (!selectedChain) return showToast('Please select a withdrawal network', 'error');

    const selectedAddress = availableWallets.find(([chain]) => chain === selectedChain)?.[1];
    if (!selectedAddress) return showToast('Invalid wallet address', 'error');

    setSubmitting(true);
    setLastSubmissionTime(now);
    try {
      const payload = { amount: numericAmount, chain: selectedChain, address: selectedAddress, totalWithdrawn: userData.total_withdrawal, team };
      const { data } = await axios.post(`${API}/withdraw`, payload, { withCredentials: true });
      if (data.status === 'success') {
        setWithdrawnAmount(numericAmount);
        setShowSuccessModal(true);
        await fetchUserData();
        setAmount('');
      }
    } catch (error) {
      let message = 'Withdrawal failed. Please try again.';
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          showToast('Session expired. Please log in again.', 'error');
          navigate('/');
          return;
        }
        message = error.response?.data?.error || message;
      }
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessModal(false);
    navigate('/wallet');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Address copied to clipboard', 'success');
  };

  const setPreset = (pct) => setAmount(RemoveTrailingZeros((balNum * pct) / 100));

  const currentLimit = withdrawLimits.find((item) => item.withdrawalAttempts === level)?.allow_limit;
  const selectedAddress = availableWallets.find(([chain]) => chain === selectedChain)?.[1] || '';
  const canSubmit = !submitting && !!selectedChain && !!amount && !overBalance;

  return (
    <div className="min-h-screen bg-[#161618]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@500;600&family=Inter:wght@400;500;600;700&display=swap');
        .fd { font-family: 'Cormorant', serif; }
        .fi { font-family: 'Inter', sans-serif; }
        .tnum { font-variant-numeric: tabular-nums; }
        @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .rise { animation: rise 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes popIn { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
        .pop-in { animation: popIn 0.3s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes flowDot {
          0% { left: 0%; opacity: 0; transform: translateY(-50%) scale(0.5); }
          15% { opacity: 1; transform: translateY(-50%) scale(1); }
          85% { opacity: 1; transform: translateY(-50%) scale(1); }
          100% { left: 100%; opacity: 0; transform: translateY(-50%) scale(0.5); }
        }
        .flow-dot {
          position: absolute; top: 50%; width: 6px; height: 6px; margin-left: -3px;
          border-radius: 9999px; background: #D8BA7C;
          box-shadow: 0 0 8px rgba(216,186,124,0.8);
          animation: flowDot 2.4s linear infinite;
        }
        @keyframes vaultBreathe {
          0%, 100% { box-shadow: 0 0 0 0 rgba(198,161,91,0); }
          50% { box-shadow: 0 0 20px 2px rgba(198,161,91,0.22); }
        }
        .vault-breathe { animation: vaultBreathe 3s ease-in-out infinite; }
      `}</style>

      <NavBar />

      <main className="lg:pl-[120px] pb-28 lg:pb-12">
        <div className="relative max-w-md mx-auto px-4 sm:px-6 pt-3 lg:pt-10">

          <div className="pointer-events-none absolute inset-x-0 top-0 h-56"
            style={{ background: 'radial-gradient(70% 100% at 50% 0%, rgba(198,161,91,0.05), transparent 70%)' }} />

          {/* Header */}
          <div className="rise relative flex items-center justify-between gap-4">
            <div>
              <h1 className="fd text-[26px] sm:text-[28px] font-medium text-[#EDEDEE] leading-tight">Withdraw</h1>
              <p className="fi text-[13px] text-[#A0A0A6] mt-0.5">Send funds to your wallet</p>
            </div>
            <button
              onClick={() => navigate('/wallet')}
              className="fi flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#1B1B1E] ring-1 ring-white/[0.05] text-[#A0A0A6] hover:text-[#EDEDEE] hover:ring-[#C6A15B]/20 text-[12px] font-medium transition-all flex-shrink-0"
            >
              <History size={14} /> History
            </button>
          </div>

          {/* Toasts */}
          <div className="fixed top-4 right-4 z-[100] space-y-2">
            {toasts.map((t) => <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />)}
          </div>

          {availableWallets.length === 0 ? (
            <div className="rise relative mt-10 text-center py-12 px-6">
              <div className="w-12 h-12 mx-auto rounded-xl bg-[#212125] flex items-center justify-center text-[#C6A15B] mb-3.5">
                <ShieldCheck size={22} strokeWidth={1.8} />
              </div>
              <h3 className="fi text-[14.5px] font-semibold text-[#EDEDEE]">No withdrawal address</h3>
              <p className="fi text-[12.5px] text-[#A0A0A6] mt-1 max-w-[230px] mx-auto leading-relaxed">Add a wallet address to withdraw funds.</p>
              <Link to="/userWalletSettings" className="fi inline-flex items-center gap-2 mt-5 h-10 px-5 rounded-xl bg-[#C6A15B] text-[#161618] text-[13px] font-semibold hover:bg-[#D8BA7C] transition-colors">
                <Settings size={15} /> Add address
              </Link>
            </div>
          ) : (
            <>
              {/* The flow — living centerpiece */}
              <div className="rise relative mt-6 rounded-xl bg-[#1B1B1E]/60 ring-1 ring-white/[0.04] px-4 py-5" style={{ animationDelay: '0.04s' }}>
                <FlowHero chain={selectedChain} hasAddress={!!selectedAddress} />
              </div>

              {/* Amount — hero */}
              <div className="rise relative mt-4" style={{ animationDelay: '0.08s' }}>
                <SectionLabel>Amount</SectionLabel>
                <div className={`mt-3 rounded-xl bg-[#1B1B1E] ring-1 transition-all ${overBalance ? 'ring-[#E2A896]/40' : 'ring-white/[0.05] focus-within:ring-[#C6A15B]/40'}`}>
                  <div className="flex items-center gap-2.5 px-4 h-16">
                    <span className="fi text-[22px] font-medium text-[#6F6F76]">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => {
                        let value = e.target.value.replace(/[^0-9.]/g, '');
                        const parts = value.split('.');
                        if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
                        if (value.startsWith('.')) value = '0' + value;
                        setAmount(value);
                      }}
                      placeholder="0.00"
                      className="fi tnum flex-1 min-w-0 bg-transparent outline-none text-[26px] font-semibold text-[#EDEDEE] placeholder:text-[#3A3A40]"
                      disabled={submitting}
                    />
                  </div>
                  {/* live % of balance meter */}
                  <div className="px-4 pb-3.5">
                    <div className="h-1 bg-[#212125] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${overBalance ? 'bg-[#E2A896]' : 'bg-[#C6A15B]'}`} style={{ width: `${pctOfBalance}%` }} />
                    </div>
                    <p className={`fi tnum text-[9.5px] mt-1.5 text-right ${overBalance ? 'text-[#E2A896]' : 'text-[#6F6F76]'}`}>
                      {rawPct.toFixed(0)}% of balance
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mt-2.5">
                  {[25, 50, 75, 100].map((pct) => (
                    <button key={pct} type="button" onClick={() => setPreset(pct)} disabled={submitting}
                      className="fi h-8 rounded-lg text-[11px] font-semibold bg-[#212125] text-[#A0A0A6] hover:bg-[#27272C] hover:text-[#EDEDEE] transition-colors disabled:opacity-50">
                      {pct === 100 ? 'Max' : `${pct}%`}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-2.5">
                  <p className={`fi text-[11px] ${overBalance ? 'text-[#E2A896]' : 'text-[#6F6F76]'}`}>
                    Available: <span className="tnum font-medium">${RemoveTrailingZeros(balance)}</span>
                  </p>
                  <p className="fi text-[11px] text-[#6F6F76]">Fee: <span className="text-[#A0A0A6]">$0</span></p>
                </div>
              </div>

              {/* Network selector */}
              {availableWallets.length > 1 && (
                <div className="rise relative mt-5" style={{ animationDelay: '0.12s' }}>
                  <SectionLabel>Network</SectionLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                    {availableWallets.map(([chain]) => {
                      const isSelected = selectedChain === chain;
                      const info = chainInfo[chain] || { name: chain.toUpperCase(), desc: 'Network' };
                      return (
                        <button key={chain} onClick={() => setSelectedChain(chain)}
                          className={`text-left p-3 rounded-xl ring-1 transition-all duration-200 ${
                            isSelected ? 'bg-[#C6A15B]/[0.08] ring-[#C6A15B]/40' : 'bg-[#1B1B1E] ring-white/[0.05] hover:ring-[#C6A15B]/20'
                          }`}>
                          <div className="flex items-center gap-1.5">
                            <span className={`fi text-[13px] font-semibold ${isSelected ? 'text-[#C6A15B]' : 'text-[#EDEDEE]'}`}>{info.name}</span>
                            {isSelected && <Check size={12} className="text-[#C6A15B]" strokeWidth={3} />}
                          </div>
                          <p className="fi text-[10px] text-[#6F6F76] mt-0.5">{info.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Destination */}
              <div className="rise relative mt-5" style={{ animationDelay: '0.16s' }}>
                <div className="flex items-center justify-between">
                  <SectionLabel>Destination</SectionLabel>
                  <Link to="/userWalletSettings" className="fi flex items-center gap-1 text-[11px] font-medium text-[#6F6F76] hover:text-[#C6A15B] transition-colors">
                    <Settings size={11} /> Update
                  </Link>
                </div>
                <div className="mt-3 flex items-center gap-3 p-3.5 rounded-xl bg-[#1B1B1E] ring-1 ring-white/[0.05]">
                  <span className="w-9 h-9 rounded-lg bg-[#1E2A22] text-[#8FC7A0] flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={16} strokeWidth={2} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="fi text-[10px] font-semibold uppercase tracking-wide text-[#8FC7A0]">Active</span>
                      <span className="fi text-[10px] text-[#6F6F76]">· {selectedChain?.toUpperCase()}</span>
                    </div>
                    <p className="fi font-mono text-[11.5px] text-[#A0A0A6] truncate mt-0.5">{selectedAddress || '—'}</p>
                  </div>
                  <button onClick={() => copyToClipboard(selectedAddress)}
                    className="w-9 h-9 rounded-lg bg-[#212125] text-[#A0A0A6] hover:text-[#C6A15B] hover:bg-[#27272C] flex items-center justify-center flex-shrink-0 transition-colors"
                    aria-label="Copy address">
                    <Clipboard size={15} />
                  </button>
                </div>
              </div>

              {/* Processing note */}
              <div className="rise relative mt-4 flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-[#1B1B1E]/60 ring-1 ring-white/[0.04]" style={{ animationDelay: '0.2s' }}>
                <Clock size={15} className="text-[#C6A15B] flex-shrink-0" />
                <p className="fi text-[11.5px] text-[#A0A0A6]">
                  Processed within 24 hours{currentLimit ? ` · Min $${currentLimit}` : ''}
                </p>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`rise group relative fi w-full h-12 rounded-xl mt-5 flex items-center justify-center gap-2 text-[14px] font-semibold transition-all active:scale-[0.99] ${
                  canSubmit
                    ? 'bg-[#C6A15B] text-[#161618] hover:bg-[#D8BA7C] shadow-[0_10px_28px_rgba(198,161,91,0.14)]'
                    : 'bg-[#212125] text-[#57575D] cursor-not-allowed'
                }`}
                style={{ animationDelay: '0.24s' }}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#161618]/25 border-t-[#161618] rounded-full animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    Withdraw funds
                    <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </main>

      {showSuccessModal && <SuccessModal amount={withdrawnAmount} onClose={handleSuccessConfirm} />}
    </div>
  );
};

export default WithdrawPage;