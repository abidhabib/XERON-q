import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { RemoveTrailingZeros } from '../utils/utils';
import BalanceCard from './new/BalanceCard';

// Lucide Icons
import { 
  Cpu, 
  Coins, 
  ArrowDownToLine,
  History,
  RotateCw,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

// Axios Config
axios.defaults.withCredentials = true;
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ✅ Toast (Golden Luxury – Top Right)
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
    <div className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border ${bgMap[type]} backdrop-blur-sm`}>
      {iconMap[type]}
      <span className="text-gray-200">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// ✅ Reusable Bottom Sheet (Matches WithdrawalHistory)
const BottomSheet = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="absolute bottom-0 left-0 right-0 bg-[#19202a] rounded-t-2xl border-t border-[#26303b] shadow-2xl max-h-[85vh]"
        style={{
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.33, 1, 0.68, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="pt-3 flex justify-center">
          <div className="w-12 h-1.5 bg-gray-700 rounded-full"></div>
        </div>
        {children}
      </div>
    </div>
  );
};

const MiningAnimation = ({ isMining }) => {
  if (isMining) return null;

  return (
    <div className="relative w-full h-32 mb-6 flex items-center justify-center">
      <div className="relative z-10">
        <div className="w-14 h-14 rounded-xl bg-[#1c2a3a] flex items-center justify-center shadow-lg">
          <Cpu className="w-7 h-7 text-[#D4AF37] animate-pulse" />
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute w-28 h-28 border-2 border-[#c9a030] rounded-full animate-ping"></div>
        <div className="absolute w-36 h-36 border border-[#c9a030] rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

const ActionButton = ({ onClick, disabled, loading, icon, label, isSell = false }) => {
  const baseClasses = "flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all flex-1";
  const enabledClasses = isSell
    ? "bg-gradient-to-r from-[#D4AF37] to-[#c69c2e] text-gray-900 hover:from-[#e8c04e] hover:to-[#d4af37] shadow-[0_2px_8px_rgba(212,175,55,0.2)]"
    : "bg-transparent border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10";
  const disabledClasses = "bg-[#1c2a3a] text-[#D4AF37]/50 cursor-not-allowed";

  return (
    <button
      className={`${baseClasses} ${disabled ? disabledClasses : enabledClasses} ${loading ? 'opacity-80' : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : (
        <>
          {icon}
          <span>{label}</span>
        </>
      )}
    </button>
  );
};

// ✅ MAIN COMPONENT
const MiningTask = () => {
  const [userData, setUserData] = useState({ coin: 0, balance: 0, last_collect_date: null });
  const [loading, setLoading] = useState({ collect: false, exchange: false });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isMining, setIsMining] = useState(false);
  const [collectAvailable, setCollectAvailable] = useState(true);
  const [toasts, setToasts] = useState([]);

  // ✅ Bottom sheet states
  const [collectSuccessSheet, setCollectSuccessSheet] = useState(false);
  const [collectMessage, setCollectMessage] = useState('');
  const [exchangeSheetOpen, setExchangeSheetOpen] = useState(false);

  const navigate = useNavigate();

  // --- Toast Helpers ---
  const showToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // --- API Calls ---
  const fetchUserData = useCallback(async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/user-data`);
      const data = res.data || {};
      const user = {
        coin: data.coin ?? 0,
        balance: data.balance ?? 0,
        last_collect_date: data.last_collect_date ?? null
      };
      setUserData(user);

      if (user.last_collect_date) {
        const last = new Date(user.last_collect_date);
        const today = new Date();
        setCollectAvailable(last.toDateString() !== today.toDateString());
      } else {
        setCollectAvailable(true);
      }
    } catch (err) {
      console.error('User data fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData, refreshTrigger]);

  // --- Handlers ---
  const handleCollect = async () => {
    if (!collectAvailable || loading.collect) return;

    setLoading(prev => ({ ...prev, collect: true }));
    setIsMining(true);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/collect-coin`);
      setRefreshTrigger(p => p + 1);
      setCollectMessage(res.data?.message || 'Coins collected successfully');
      setCollectSuccessSheet(true);
      setCollectAvailable(false);
    } catch (err) {
      const msg = err.response?.data?.error || 'Collection failed';
      showToast(msg, 'error');
    } finally {
      setLoading(prev => ({ ...prev, collect: false }));
      setTimeout(() => setIsMining(false), 2000);
    }
  };

  const handleExchangeClick = () => {
    if ((userData.coin ?? 0) <= 0) {
      showToast('You have no coins to exchange', 'error');
      return;
    }
    setExchangeSheetOpen(true);
  };

  const confirmExchange = async () => {
    setExchangeSheetOpen(false);
    setLoading(prev => ({ ...prev, exchange: true }));

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/exchange-coin`);
      setRefreshTrigger(p => p + 1);
      showToast(res.data?.message || 'Exchange completed successfully', 'success');
    } catch (err) {
      const msg = err.response?.data?.error || 'Exchange failed';
      showToast(msg, 'error');
    } finally {
      setLoading(prev => ({ ...prev, exchange: false }));
    }
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-[#111827]">
      <BalanceCard />

      {/* Toasts - Top Right */}
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

      <div className="mt-6">
        <div className="space-y-6 pt-8">
          <MiningAnimation isMining={isMining} />

          <div className="bg-[#19202a] rounded-2xl p-4 space-y-4 mx-4">
            <div className="text-center">
              <p className="text-[#D4AF37]/70 text-sm mb-2">
                Daily coin collection · 24h cooldown
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1c2a3a] rounded-full">
                <span className="text-[11px] text-[#D4AF37]/80">Status:</span>
                <span className={`text-[11px] font-medium ${
                  collectAvailable ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {collectAvailable ? 'Available' : 'Collected Today'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ActionButton
                onClick={handleCollect}
                disabled={!collectAvailable || loading.collect}
                loading={loading.collect}
                icon={<Coins className="w-4 h-4" />}
                label={collectAvailable ? "Collect" : "Collected"}
                isSell={true}
              />
              <ActionButton
                onClick={handleExchangeClick}
                disabled={(userData.coin ?? 0) <= 0 || loading.exchange}
                loading={loading.exchange}
                icon={<ArrowDownToLine className="w-4 h-4" />}
                label="Exchange"
                isSell={false}
              />
            </div>
          </div>

          <button
            onClick={() => navigate('/mining-history')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#19202a] hover:bg-[#1c2a3a] rounded-xl text-[#D4AF37] font-medium transition-colors mx-4"
          >
            <History className="w-4 h-4" />
            <span>See Full History</span>
          </button>
        </div>
      </div>

      {/* ✅ Collect Success Bottom Sheet */}
      <BottomSheet
        isOpen={collectSuccessSheet}
        onClose={() => setCollectSuccessSheet(false)}
      >
        <div className="px-4 pt-2 pb-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-900/30 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Collected!</h3>
          <p className="text-[#D4AF37]/70 text-sm mb-6">{collectMessage}</p>
          <button
            onClick={() => setCollectSuccessSheet(false)}
            className="w-full py-2.5 bg-[#1c2a3a] hover:bg-[#26303b] text-white rounded-lg font-medium transition-colors text-sm"
          >
            Done
          </button>
        </div>
      </BottomSheet>

      {/* ✅ Exchange Confirmation Bottom Sheet */}
      <BottomSheet
        isOpen={exchangeSheetOpen}
        onClose={() => setExchangeSheetOpen(false)}
      >
        <div className="px-4 pt-2 pb-6 text-center relative">
          <button
            onClick={() => setExchangeSheetOpen(false)}
            className="absolute top-3 right-3 p-1 text-[#D4AF37]/70 hover:text-[#D4AF37] rounded-full"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mx-auto w-12 h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center mb-4">
            <ArrowDownToLine className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Confirm Exchange</h3>
          <p className="text-[#D4AF37]/70 mb-6 text-sm">
            Exchange <span className="font-semibold">{RemoveTrailingZeros(userData.coin ?? 0)}</span> Coins?
          </p>
          <div className="flex gap-3">
            <button
              className="flex-1 py-2.5 px-4 bg-[#1c2a3a] hover:bg-[#26303b] text-[#D4AF37] rounded-lg font-medium transition-colors text-sm"
              onClick={() => setExchangeSheetOpen(false)}
            >
              Cancel
            </button>
            <button
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#D4AF37] to-[#c69c2e] text-gray-900 rounded-lg font-medium transition-all text-sm shadow-[0_2px_6px_rgba(212,175,55,0.25)]"
              onClick={confirmExchange}
            >
              Confirm
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};

export default MiningTask;