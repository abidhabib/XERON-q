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
  Settings,
  Info,
  ExternalLink
} from 'lucide-react';
import BalanceCard from './BalanceCard';
import { RemoveTrailingZeros } from '../../utils/utils';

const Toast = ({ message, type, onClose }) => {
  const styles = {
    success: { icon: '✓', bg: 'bg-emerald-50 border-emerald-200 text-emerald-600' },
    error: { icon: '✕', bg: 'bg-red-50 border-red-200 text-red-600' },
    info: { icon: 'ℹ', bg: 'bg-amber-50 border-amber-200 text-amber-600' }
  };
  const s = styles[type];

  return (
    <div className={`flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg border ${s.bg} bg-white shadow-lg`}>
      <span className={`w-5 h-5 flex items-center justify-center rounded-md text-xs font-bold ${s.bg.split(' ')[0]} ${s.bg.split(' ')[2]}`}>{s.icon}</span>
      <span className="text-[#1e2329] font-medium">{message}</span>
      <button onClick={onClose} className="text-[#c1c7cd] hover:text-[#848e9c] ml-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const SuccessModal = ({ onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl p-6 w-full max-w-xs text-center shadow-xl">
      <div className="w-12 h-12 mx-auto mb-3 bg-[#fffbeb] rounded-full flex items-center justify-center">
        <CheckCircle2 className="text-[#f0b90b] w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-[#1e2329]">Request Received</h3>
      <p className="text-[#848e9c] text-xs mt-1">Processing will complete within 24 hours</p>
      <button
        onClick={onClose}
        className="mt-4 w-full h-12 bg-[#f0b90b] text-[#0b0e11] rounded-xl text-sm font-semibold active:opacity-85 transition-opacity"
      >
        View History
      </button>
    </div>
  </div>
);

const ActionCard = ({ to, icon: Icon, title }) => (
  <Link
    to={to}
    className="flex items-center justify-center gap-2 p-2.5 bg-white rounded-xl shadow-sm hover:bg-[#fafafa] active:bg-[#f0f0f0] transition-colors"
  >
    <div className="w-7 h-7 rounded-lg bg-[#fafafa] flex items-center justify-center">
      <Icon className="w-3.5 h-3.5 text-[#1e2329]" />
    </div>
    <span className="text-[13px] font-medium text-[#1e2329]">{title}</span>
  </Link>
);

const WithdrawPage = () => {
  const { Userid, userData, fetchUserData, team, level, currBalance } = useContext(UserContext);
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [withdrawLimits, setWithdrawLimits] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0);
  const [availableWallets, setAvailableWallets] = useState([]);
  const [selectedChain, setSelectedChain] = useState('');

  const API = import.meta.env.VITE_API_BASE_URL;

  const showToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), duration);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => {
    if (!Userid) return;
    const fetchData = async () => {
      try {
        const [limitsRes, walletsRes] = await Promise.all([
          axios.get(`${API}/fetchLimitsData`),
          axios.get(`${API}/api/wallets/${Userid}`)
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const now = Date.now();
    if (submitting || (now - lastSubmissionTime < 5000)) return;

    const numericAmount = RemoveTrailingZeros(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      showToast('Enter a valid amount', 'error');
      return;
    }

    const currentLimit = withdrawLimits.find(item => item.withdrawalAttempts === level)?.allow_limit;
    if (currentLimit && numericAmount < parseFloat(currentLimit)) {
      showToast(`Minimum withdrawal: $${currentLimit}`, 'error');
      return;
    }

    if (RemoveTrailingZeros(numericAmount) > RemoveTrailingZeros(currBalance)) {
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
      const payload = { amount: numericAmount, chain: selectedChain, address: selectedAddress, totalWithdrawn: userData.total_withdrawal, team };
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

  const chainInfo = {
    bep20: { name: 'BEP20', desc: 'Binance Smart Chain' },
    eth: { name: 'ETH', desc: 'Ethereum' },
    btc: { name: 'BTC', desc: 'Bitcoin' },
    trc20: { name: 'TRC20', desc: 'TRON Network' },
    sol: { name: 'SOL', desc: 'Solana' },
    polygon: { name: 'MATIC', desc: 'Polygon' }
  };
  const hirtory = () => {
    navigate('/wallet');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f5f5]">
      <BalanceCard />

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
<div className="">
  <p onClick={hirtory} className='text-amber-500 text-right underline text-sm mt-2 px-4'>show history</p>
</div>
      {/* Content */}
      <div className="px-4 py-3 flex-1">
        <div className="space-y-3">
          {availableWallets.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <div className="w-12 h-12 bg-[#fffbeb] rounded-full flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="text-[#f0b90b] w-6 h-6" />
              </div>
              <h3 className="text-[#1e2329] font-medium text-sm mb-1">No Withdrawal Addresses</h3>
              <p className="text-[#848e9c] text-sm mb-4">Add a wallet address to withdraw funds.</p>
              <Link to="/userWalletSettings" className="inline-flex items-center gap-1.5 text-[#f0b90b] text-sm font-medium">
                <Settings className="w-4 h-4" />
                Add Address
              </Link>
            </div>
          ) : (
            <>
              {/* Chain Selector */}
              {availableWallets.length > 1 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <label className="block text-[13px] font-medium text-[#848e9c] uppercase tracking-wider mb-2">Withdrawal Network</label>
                  <p className="text-xs text-[#848e9c] mb-3">Select the blockchain network for your withdrawal</p>
                  <div className="grid grid-cols-2 gap-2">
                    {availableWallets.map(([chain]) => {
                      const isSelected = selectedChain === chain;
                      const info = chainInfo[chain] || { name: chain.toUpperCase(), desc: 'Network' };
                      return (
                        <button
                          key={chain}
                          onClick={() => setSelectedChain(chain)}
                          className={`p-2.5 rounded-xl text-left transition-all ${isSelected ? 'bg-[#fffbeb] shadow-[0_0_0_2px_#f0b90b]' : 'bg-[#fafafa] hover:bg-[#f0f0f0]'}`}
                        >
                          <div className={`text-sm font-semibold ${isSelected ? 'text-[#b45309]' : 'text-[#1e2329]'}`}>{info.name}</div>
                          <div className="text-[10px] text-[#848e9c] mt-0.5">{info.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 p-2.5 bg-[#fafafa] rounded-xl flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-[#f0b90b] mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-[#848e9c]">Withdrawals are processed within 24 hours. Ensure your wallet supports the selected network.</p>
                  </div>

                  {/* Action Cards */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <ActionCard to="/userWalletSettings" icon={Settings} title="Update Address" />
                    <ActionCard to="/wallet" icon={ExternalLink} title="History" />
                  </div>
                </div>
              )}

              {/* Selected Address */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-[#848e9c] uppercase tracking-wide">
                    Your <span className="text-emerald-500">Active</span> {selectedChain?.toUpperCase()} Address
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <div
                  onClick={() => copyToClipboard(availableWallets.find(([chain]) => chain === selectedChain)?.[1] || '')}
                  className="flex items-center gap-2 p-3 bg-[#fafafa] rounded-xl cursor-pointer hover:bg-[#f0f0f0] transition-colors"
                >
                  <p className="font-mono text-xs text-[#1e2329] break-all flex-1 min-w-0">
                    {availableWallets.find(([chain]) => chain === selectedChain)?.[1] || '—'}
                  </p>
                  <Clipboard className="w-4 h-4 text-[#848e9c] flex-shrink-0" />
                </div>
                <p className="text-[11px] text-[#848e9c] mt-2">
                  Ensure this address supports <span className="font-medium text-[#1e2329]">{selectedChain?.toUpperCase()}</span> tokens.
                </p>
              </div>
            </>
          )}

          {/* Withdraw Form */}
          {availableWallets.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <label className="block text-[13px] font-medium text-[#848e9c] uppercase tracking-wider mb-2">Withdraw Amount</label>
              <div className="relative mb-2">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#848e9c]" />
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
                  className="w-full h-[52px] pl-10 pr-14 text-base font-medium text-[#1e2329] bg-[#fafafa] rounded-xl outline-none placeholder:text-[#c1c7cd] focus:ring-2 focus:ring-[#f0b90b] font-variant-numeric-tabular"
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setAmount(RemoveTrailingZeros(currBalance))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 text-[11px] font-semibold text-[#f0b90b] hover:bg-[#fffbeb] rounded-md transition-colors"
                  disabled={submitting}
                >
                  MAX
                </button>
              </div>
              <p className="text-[11px] text-[#848e9c] mb-4">Fee: $0</p>

              <div className="flex items-start gap-2.5 p-3 bg-[#fafafa] rounded-xl mb-4">
                <Clock className="w-4 h-4 text-[#f0b90b] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold text-[#1e2329]">Processing Time</p>
                  <p className="text-[11px] text-[#848e9c] mt-0.5">Withdrawals processed within 24 hours</p>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !selectedChain || !amount}
                className={`w-full h-[52px] flex items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.98] ${
                  submitting
                    ? 'bg-[#f5f5f5] text-[#c1c7cd] cursor-not-allowed'
                    : selectedChain && amount
                      ? 'bg-[#f0b90b] text-[#0b0e11] active:opacity-90'
                      : 'bg-[#f5f5f5] text-[#c1c7cd] cursor-not-allowed'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#c1c7cd]/30 border-t-[#c1c7cd] rounded-full animate-spin" />
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