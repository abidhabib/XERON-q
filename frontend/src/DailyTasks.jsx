import React, { useState, useEffect, useCallback, useContext } from 'react';
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
import { UserContext } from './UserContext/UserContext';

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

// ✅ Toast (Light Mode)
const Toast = ({ message, type, onClose }) => {
  const iconMap = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    error: <AlertCircle className="w-4 h-4 text-rose-500" />,
    info: <AlertCircle className="w-4 h-4 text-amber-500" />
  };

  const bgMap = {
    success: 'bg-emerald-50 border-emerald-200',
    error: 'bg-rose-50 border-rose-200',
    info: 'bg-amber-50 border-amber-200'
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg border ${bgMap[type]} shadow-sm`}>
      {iconMap[type]}
      <span className="text-[#1E2026]">{message}</span>
      <button onClick={onClose} className="text-[#C5C8CE] hover:text-[#707A8A] transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// ✅ Reusable Bottom Sheet (Light Mode)
const BottomSheet = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl border-t border-[#E6E8EB] shadow-2xl max-h-[85vh]"
        style={{
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.33, 1, 0.68, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="pt-3 flex justify-center">
          <div className="w-12 h-1.5 bg-[#C5C8CE] rounded-full"></div>
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
        <div className="w-14 h-14 rounded-xl bg-[#F5F5F5] border border-[#E6E8EB] flex items-center justify-center shadow-sm">
          <Cpu className="w-7 h-7 text-[#F0B90B] animate-pulse" />
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute w-28 h-28 border-2 border-[#F0B90B]/30 rounded-full animate-ping"></div>
        <div className="absolute w-36 h-36 border border-[#F0B90B]/20 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

const ActionButton = ({ onClick, disabled, loading, icon, label, isSell = false }) => {
  const baseClasses = "flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all flex-1";
  const enabledClasses = isSell
    ? "bg-[#F0B90B] text-[#1E2026] hover:bg-[#E5AC00] active:scale-[0.98] shadow-sm"
    : "bg-white border border-[#E6E8EB] text-[#1E2026] hover:bg-[#F5F5F5] hover:border-[#C5C8CE]";
  const disabledClasses = "bg-[#F5F5F5] text-[#C5C8CE] cursor-not-allowed border border-[#E6E8EB]";

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

  // Bottom sheet states
  const [collectSuccessSheet, setCollectSuccessSheet] = useState(false);
  const [collectMessage, setCollectMessage] = useState('');
  const [exchangeSheetOpen, setExchangeSheetOpen] = useState(false);
  const { setCurrBalance } = useContext(UserContext);
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

  const fetchUserData = useCallback(async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/user-data`);
      const data = res.data || {};
      const user = {
        coin: data.coin ?? 0,
        balance: data.balance ?? 0,
        last_collect_date: data.last_collect_date ?? null,
        isEligibleToCollect: Boolean(data.is_eligible_to_collect)
      };
      setUserData(user);
      setCollectAvailable(user.isEligibleToCollect);
    } catch (err) {
      console.error('User data fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData, refreshTrigger]);

  const handleCollect = async () => {
    if (!collectAvailable || loading.collect) return;

    setLoading(prev => ({ ...prev, collect: true }));
    setIsMining(true);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/collect-coin`);
      setRefreshTrigger(p => p + 1);
      setCollectMessage(res.data?.message || 'Coins collected successfully');
      setCollectSuccessSheet(true);
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

      if (!res.data?.success) {
        throw new Error(res.data?.error || 'Exchange failed');
      }

      const newBalance = RemoveTrailingZeros(res.data.balance);
      setCurrBalance(newBalance);
      setRefreshTrigger(p => p + 1);
      showToast(res.data?.message || 'Exchange completed successfully', 'success');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Exchange failed';
      showToast(msg, 'error');
    } finally {
      setLoading(prev => ({ ...prev, exchange: false }));
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <BalanceCard />

      <div className="px-3 mt-4">
        <div className="bg-white rounded-2xl px-4 py-4 border border-[#E6E8EB] shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#F0B90B]/10 rounded-xl border border-[#F0B90B]/20">
                <Coins className="w-5 h-5 text-[#F0B90B]" />
              </div>
              <div>
                <p className="text-[#707A8A] text-xs font-medium">Available Rovex Coins</p>
                <p className="text-[#1E2026] text-xl font-semibold mt-0.5">
                  {RemoveTrailingZeros(userData.coin ?? 0)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[#707A8A] text-xs">Rovex</p>
              <p className="text-[#F0B90B] text-sm font-medium mt-0.5">Coin</p>
            </div>
          </div>
        </div>
      </div>

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

          <div className="bg-white rounded-2xl p-4 space-y-4 mx-2 border border-[#E6E8EB] shadow-sm">
            <div className="text-center">
              <p className="text-[#707A8A] text-sm mb-2">
                Daily coin collection · 24h cooldown
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F5F5F5] rounded-full border border-[#E6E8EB]">
                <span className="text-[11px] text-[#707A8A]">Status:</span>
                <span className={`text-[11px] font-medium ${
                  collectAvailable ? 'text-emerald-600' : 'text-amber-600'
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

            <button
              onClick={() => navigate('/mining-history')}
              className="w-full flex items-center mt-5 justify-center gap-2 py-3 bg-[#F5F5F5] hover:bg-[#EBECF0] rounded-xl text-[#1E2026] font-medium transition-colors border border-[#E6E8EB]"
            >
              <History className="w-4 h-4 text-[#707A8A]" />
              <span>See Full History</span>
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Collect Success Bottom Sheet */}
      <BottomSheet
        isOpen={collectSuccessSheet}
        onClose={() => setCollectSuccessSheet(false)}
      >
        <div className="px-4 pt-2 pb-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-4 border border-emerald-200">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-[#1E2026] mb-2">Collected!</h3>
          <p className="text-[#707A8A] text-sm mb-6">{collectMessage}</p>
          <button
            onClick={() => setCollectSuccessSheet(false)}
            className="w-full py-2.5 bg-[#F0B90B] text-[#1E2026] rounded-lg font-medium transition-colors text-sm hover:bg-[#E5AC00] active:scale-[0.98] shadow-sm"
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
            className="absolute top-3 right-3 p-1 text-[#C5C8CE] hover:text-[#707A8A] rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mx-auto w-12 h-12 rounded-full bg-[#F0B90B]/10 flex items-center justify-center mb-4 border border-[#F0B90B]/20">
            <ArrowDownToLine className="w-6 h-6 text-[#F0B90B]" />
          </div>
          <h3 className="text-lg font-semibold text-[#1E2026] mb-2">Confirm Exchange</h3>
          <p className="text-[#707A8A] mb-6 text-sm">
            Exchange <span className="font-semibold text-[#1E2026]">{RemoveTrailingZeros(userData.coin ?? 0)}</span> Coins?
          </p>
          <div className="flex gap-3">
            <button
              className="flex-1 py-2.5 px-4 bg-white border border-[#E6E8EB] text-[#707A8A] rounded-lg font-medium transition-colors text-sm hover:bg-[#F5F5F5]"
              onClick={() => setExchangeSheetOpen(false)}
            >
              Cancel
            </button>
            <button
              className="flex-1 py-2.5 px-4 bg-[#F0B90B] text-[#1E2026] rounded-lg font-medium transition-all text-sm hover:bg-[#E5AC00] active:scale-[0.98] shadow-sm"
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