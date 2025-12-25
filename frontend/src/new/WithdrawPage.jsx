import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../UserContext/UserContext';
import {
  Clipboard,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  ShieldCheck,
  X,
  Clock,
  Home,
  Plus
} from 'lucide-react';
import BalanceCard from './BalanceCard';
import { HiArrowTopRightOnSquare } from 'react-icons/hi2';

// --- Toast Component (unchanged) ---
const Toast = ({ message, type, onClose }) => {
  const iconMap = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400" />,
    info: <AlertCircle className="w-4 h-4 text-amber-400" />
  };

  const bgMap = {
    success: 'bg-emerald-900/20 border-emerald-800/30',
    error: 'bg-rose-900/20 border-rose-800/30',
    info: 'bg-amber-900/20 border-amber-800/30'
  };

  return (
    <div className={`animate-fade-in-up flex items-center gap-2 px-3 py-2 text-sm rounded-lg border ${bgMap[type]} backdrop-blur-sm`}>
      {iconMap[type]}
      <span className="text-gray-200">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// --- Success Modal (unchanged) ---
const SuccessModal = ({ onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-[#19202a] rounded-2xl p-5 w-full max-w-xs border border-[#26303b] shadow-2xl">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 mb-3">
          <CheckCircle2 className="text-amber-400 w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-white">Request Received</h3>
        <p className="text-amber-400/80 text-xs mt-1">Processing will complete within 24 hours</p>
        <button
          onClick={onClose}
          className="mt-4 w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 py-2.5 rounded-xl text-sm font-medium transition-all shadow-[0_4px_12px_rgba(212,175,55,0.15)]"
        >
          View History
        </button>
      </div>
    </div>
  </div>
);

// --- ActionCard Component ---
const ActionCard = ({ to, icon: Icon, title }) => (
  <Link
    to={to}
    className="bg-[#19202a] rounded-xl p-3.5 transition-all duration-200 hover:bg-[#1c2a3a] active:scale-[0.98] flex items-center gap-3 w-full"
  >
    <div className="w-10 h-10 rounded-lg bg-[#1c2a3a] flex items-center justify-center">
      <Icon className="w-5 h-5 text-[#D4AF37]" />
    </div>
    <span className="text-white font-medium text-sm">{title}</span>
  </Link>
);

// --- Main Component ---
const WithdrawPage = () => {
  const { Userid, userData, fetchUserData, team, level, currBalance } = useContext(UserContext);
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [withdrawLimits, setWithdrawLimits] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0);
  const [availableWallets, setAvailableWallets] = useState([]); // [['bep20', '0x...'], ...]
  const [selectedChain, setSelectedChain] = useState('');       // 'bep20'

  const API = import.meta.env.VITE_API_BASE_URL;

  const showToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // ✅ Fetch data with proper dependencies
  useEffect(() => {
    if (!Userid) return;

    const fetchData = async () => {
      try {
        const [limitsRes, walletsRes] = await Promise.all([
          axios.get(`${API}/fetchLimitsData`),
          axios.get(`${API}/api/wallets/${Userid}`)
        ]);

        if (limitsRes.data.status === 'success') {
          setWithdrawLimits(limitsRes.data.data);
        }

        if (walletsRes.data.success) {
          const walletEntries = Object.entries(walletsRes.data.wallets || {});
          setAvailableWallets(walletEntries);
          
          // Auto-select first wallet only if none selected yet
          if (walletEntries.length > 0 && !selectedChain) {
            setSelectedChain(walletEntries[0][0]);
          }
        }
      } catch (error) {
        showToast('Unable to load withdrawal data. Please retry.', 'error');
      }
    };

    fetchData();
  }, [Userid, API]); // ✅ Removed 'level' and 'selectedChain' to prevent infinite loop

  // ✅ Handle empty wallets
  useEffect(() => {
    if (availableWallets.length === 0) {
      setSelectedChain('');
    } else if (!selectedChain && availableWallets.length > 0) {
      setSelectedChain(availableWallets[0][0]);
    }
  }, [availableWallets, selectedChain]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const now = Date.now();

    if (submitting || (now - lastSubmissionTime < 5000)) return;

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      showToast('Enter a valid amount', 'error');
      return;
    }

    const currentLimit = withdrawLimits.find(item => item.withdrawalAttempts === level)?.allow_limit;
    if (currentLimit && numericAmount < parseFloat(currentLimit)) {
      showToast(`Minimum withdrawal: $${currentLimit}`, 'error');
      return;
    }

    if (numericAmount > currBalance) {
      showToast('Insufficient balance', 'error');
      return;
    }

    if (!selectedChain) {
      showToast('Please select a withdrawal network', 'error');
      return;
    }

    const selectedAddress = availableWallets.find(([chain]) => chain === selectedChain)?.[1];
    if (!selectedAddress) {
      showToast('Invalid wallet address', 'error');
      return;
    }

    setSubmitting(true);
    setLastSubmissionTime(now);

    try {
      const payload = {
        amount: numericAmount,
        chain: selectedChain,
        address: selectedAddress,
        totalWithdrawn: userData.total_withdrawal,
        team
      };

      const { data } = await axios.post(`${API}/withdraw`, payload, { withCredentials: true });

      if (data.status === 'success') {
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

  const displayBalance = currBalance ? parseFloat(currBalance).toFixed(2) : '0.00';

  return (
    <div className="flex flex-col min-h-screen bg-[#111827]">
      <div className="bg-[#111827]">
        <BalanceCard />
      </div>

      {/* Action Cards */}
      <div className="px-4 pt-4 pb-3">
        <div className="grid grid-cols-2 gap-3">
          <ActionCard
            to="/userWalletSettings"
            icon={Home}
            title="Update Address"
          />
          <ActionCard
            to="/wallet"
            icon={HiArrowTopRightOnSquare}
            title="History"
          />
        </div>
      </div>

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="px-2 py-3 flex-1">
        <div className="max-w-md mx-auto w-full space-y-5">
          {/* Wallet Selection */}
          {availableWallets.length === 0 ? (
            <div className="bg-[#19202a] rounded-2xl p-4 text-center">
              <div className="w-12 h-12 bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="text-amber-400 w-6 h-6" />
              </div>
              <h3 className="text-white font-medium mb-1">No Withdrawal Addresses</h3>
              <p className="text-amber-400/70 text-sm mb-4">
                Add a wallet address to withdraw funds.
              </p>
              <Link
                to="/userWalletSettings"
                className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Address
              </Link>
            </div>
          ) : (
            <>
              {/* Chain Selector */}
              {availableWallets.length > 1 && (
                <div className="bg-[#19202a] rounded-2xl p-3">
                  <label className="block text-amber-400/80 text-sm mb-2">Withdrawal Network</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableWallets.map(([chain]) => (
                      <button
                        key={chain}
                        onClick={() => setSelectedChain(chain)}
                        className={`p-2 rounded-lg text-xs transition-all ${
                          selectedChain === chain
                            ? 'bg-[#D4AF37]/20 border border-[#D4AF37] text-white'
                            : 'bg-[#1c2a3a] text-amber-400/70 hover:bg-[#202d3d]'
                        }`}
                      >
                        {chain.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Address */}
              <div className="bg-[#19202a] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-amber-400/70 uppercase tracking-wide">
                    Your <span className="text-green-500">Active</span> {selectedChain?.toUpperCase()} Address
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div
                  onClick={() => copyToClipboard(
                    availableWallets.find(([chain]) => chain === selectedChain)?.[1] || ''
                  )}
                  className="group flex items-center gap-2 p-3 bg-[#1c2a3a] rounded-xl cursor-pointer hover:bg-[#202d3d] transition-colors"
                >
                  <p className="font-mono text-sm text-gray-200 break-all flex-1 min-w-0">
                    {availableWallets.find(([chain]) => chain === selectedChain)?.[1] || '—'}
                  </p>
                  <Clipboard className="w-4 h-4 text-amber-400/60 group-hover:text-amber-400 transition-colors" />
                </div>
                <p className="text-[#D4AF37]/60 text-xs mt-2">
                  Ensure this address supports <span className="font-medium">{selectedChain?.toUpperCase()}</span> tokens.
                </p>
              </div>
            </>
          )}

          {/* Withdraw Form */}
          {availableWallets.length > 0 && (
            <div className="bg-[#19202a] rounded-2xl p-2">
              <div className="mb-4">
                <label className="block text-amber-400/80 text-sm font-medium mb-2">Withdraw Amount</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="w-4 h-4 text-amber-400/50" />
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={e => {
                      let value = e.target.value.replace(/[^0-9.]/g, '');
                      const parts = value.split('.');
                      if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
                      if (value.startsWith('.')) value = '0' + value;
                      setAmount(value);
                    }}
                    placeholder="0.00"
                    className="w-full pl-9 pr-12 py-3 bg-[#1c2a3a] rounded-xl text-white placeholder-amber-400/30 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setAmount(displayBalance)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-medium text-amber-400 hover:text-amber-300"
                    disabled={submitting}
                  >
                    MAX
                  </button>
                </div>
                <div className="mt-2 flex items-center text-xs text-amber-400/60">
                  <span className="mx-1">•</span>
                  <span>Fee: $0</span>
                </div>
              </div>

              {/* Processing Info */}
              <div className="flex items-start gap-2.5 p-3 bg-[#1c2a3a] rounded-xl mb-5">
                <Clock className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">Processing Time</p>
                  <p className="text-amber-400/70 text-xs mt-0.5">Withdrawals processed within 24 hours</p>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !selectedChain || !amount}
                className={`w-full py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  submitting
                    ? 'bg-[#1c2a3a] text-amber-400/50 cursor-not-allowed'
                    : selectedChain && amount
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-gray-900 shadow-[0_4px_12px_rgba(212,175,55,0.15)] hover:from-amber-600 hover:to-amber-700'
                      : 'bg-[#1c2a3a] text-amber-400/40 cursor-not-allowed'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Withdraw Funds'
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {showSuccessModal && <SuccessModal onClose={handleSuccessConfirm} />}
    </div>
  );
};

export default WithdrawPage;