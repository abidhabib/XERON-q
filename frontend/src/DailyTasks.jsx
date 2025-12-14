import { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import { RemoveTrailingZeros } from '../utils/utils';
import { UserContext } from "./UserContext/UserContext";
import React from 'react';
import BalanceCard from './new/BalanceCard';
import NavBar from './NavBAr';
import { useNavigate } from 'react-router-dom';

// Lucide Icons
import { 
  Cpu, 
  Coins, 
  ArrowDownToLine,
  History,
  RotateCw
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

// ✅ Golden Pulse Mining Animation
const MiningAnimation = ({ isMining }) => {
  if (isMining) return null;

  return (
    <div className="relative w-full h-32 mb-6 flex items-center justify-center">
      <div className="relative z-10">
        <div className="w-14 h-14 rounded-xl bg-[#1c2a3a] flex items-center justify-center shadow-lg ">
          <Cpu className="w-7 h-7 text-[#D4AF37] animate-pulse" />
        </div>
      </div>
      {/* ✅ Subtle golden pulse rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute w-28 h-28 border-2 border-[#c9a030] rounded-full animate-ping"></div>
        <div className="absolute w-36 h-36 border border-[#c9a030] rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

// ✅ Golden Action Button
const ActionButton = React.memo(({ onClick, disabled, loading, icon, label, isSell = false }) => {
  const baseClasses = "flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all flex-1";
  
  // ✅ Sell: solid gold | Exchange: gold outline
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
      {loading ? (
        <RotateCw className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {icon}
          <span>{label}</span>
        </>
      )}
    </button>
  );
});

const CustomModal = React.memo(({ isOpen, onClose, children, size = 'sm' }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = { sm: 'max-w-xs', md: 'max-w-md', lg: 'max-w-lg' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* ✅ Blurred Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* ✅ Modal Card */}
      <div 
        className={`relative bg-[#19202a] rounded-xl w-full ${sizeClasses[size]}  shadow-2xl`}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-[#D4AF37]/70 hover:text-[#D4AF37] rounded-full transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="pt-8 pb-6 px-3">{children}</div>
      </div>
    </div>
  );
});

const StatusModal = React.memo(({ isOpen, onClose, type, title, message }) => {
  const isSuccess = type === 'success';
  return (
    <CustomModal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        <div className={`mx-auto flex items-center justify-center w-12 h-12 rounded-full mb-4 ${
          isSuccess ? 'bg-emerald-900/30' : 'bg-rose-900/30'
        }`}>
          {isSuccess ? (
            <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-[#D4AF37]/70 mb-6 text-sm">{message}</p>
        <button
          className="w-full py-2.5 px-4 bg-[#1c2a3a] hover:bg-[#26303b] text-white rounded-lg font-medium transition-colors text-sm"
          onClick={onClose}
        >
          Continue
        </button>
      </div>
    </CustomModal>
  );
});

const ExchangeConfirmModal = React.memo(({ isOpen, onClose, onConfirm, coinAmount }) => (
  <CustomModal isOpen={isOpen} onClose={onClose} size="sm">
    <div className="text-center">
      <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-[#D4AF37]/20 mb-4 border-none">
        <ArrowDownToLine className="w-6 h-6 text-[#D4AF37]" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">Confirm Exchange</h3>
      <p className="text-[#D4AF37]/70 mb-6 text-sm ">
        Exchange <span className="font-semibold">{RemoveTrailingZeros(coinAmount)}</span> Coins?
      </p>
      <div className="flex gap-3">
        <button
          className="flex-1 py-2.5 px-4 bg-[#1c2a3a] hover:bg-[#26303b] text-[#D4AF37] rounded-lg font-medium transition-colors text-sm"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#D4AF37] to-[#c69c2e] text-gray-900 rounded-lg font-medium transition-all text-sm shadow-[0_2px_6px_rgba(212,175,55,0.25)]"
          onClick={onConfirm}
        >
          Confirm
        </button>
      </div>
    </div>
  </CustomModal>
));

const MiningTask = () => {
  const [state, setState] = useState({
    userData: { winstuk_coin: 0, balance: 0, last_collect_date: null },
    loading: { collect: false, exchange: false },
    modals: { success: false, error: false, exchangeConfirm: false },
    modalData: { title: '', message: '', type: 'success' }
  });

  const [coinValue, setCoinValue] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isMining, setIsMining] = useState(false);
  const [collectAvailable, setCollectAvailable] = useState(true);
  const navigate = useNavigate();

  // API calls
  const fetchCoinValue = useCallback(async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/get-coin-value`);
      setCoinValue(response.data?.value || 1);
    } catch (error) {
      console.error('Error fetching coin value:', error);
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/user-data`);
      const data = response.data || {};
      const userData = {
        winstuk_coin: data.winstuk_coin ?? 0,
        balance: data.balance ?? 0,
        last_collect_date: data.last_collect_date ?? null
      };
      setState(prev => ({ ...prev, userData }));
      
      if (userData.last_collect_date) {
        const lastCollect = new Date(userData.last_collect_date);
        const today = new Date();
        setCollectAvailable(
          !isNaN(lastCollect.getTime()) && 
          lastCollect.toDateString() !== today.toDateString()
        );
      } else {
        setCollectAvailable(true);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, []);

  const initializeData = useCallback(async () => {
    await Promise.all([fetchCoinValue(), fetchUserData()]);
  }, [fetchCoinValue, fetchUserData]);

  useEffect(() => {
    initializeData();
  }, [initializeData, refreshTrigger]);

  const updateLoading = useCallback((type, isLoading) => {
    setState(prev => ({ ...prev, loading: { ...prev.loading, [type]: isLoading } }));
  }, []);

  const showModal = useCallback((type, title, message) => {
    setState(prev => ({ ...prev, modals: { ...prev.modals, [type]: true }, modalData: { title, message, type } }));
  }, []);

  const closeModal = useCallback((type) => {
    setState(prev => ({ ...prev, modals: { ...prev.modals, [type]: false } }));
  }, []);

  const handleCollect = useCallback(async () => {
    if (!collectAvailable || state.loading.collect) return;
    
    updateLoading('collect', true);
    setIsMining(true);
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/collect-coin`);
      setRefreshTrigger(prev => prev + 1);
      showModal('success', 'Success!', response.data?.message || 'Coins collected successfully');
      setCollectAvailable(false);
    } catch (error) {
      const message = error.response?.data?.error || 'Collection failed';
      showModal('error', 'Error', message);
    } finally {
      updateLoading('collect', false);
      setTimeout(() => setIsMining(false), 2000);
    }
  }, [collectAvailable, state.loading.collect, updateLoading, showModal]);

  const handleExchangeClick = useCallback(() => {
    const coins = state.userData.winstuk_coin ?? 0;
    if (coins <= 0) {
      showModal('error', 'No Coins', 'You have no coins to exchange');
      return;
    }
    setState(prev => ({ ...prev, modals: { ...prev.modals, exchangeConfirm: true } }));
  }, [state.userData.winstuk_coin, showModal]);

  const confirmExchange = useCallback(async () => {
    updateLoading('exchange', true);
    closeModal('exchangeConfirm');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/exchange-coin`);
      setRefreshTrigger(prev => prev + 1);
      showModal('success', 'Success!', response.data?.message || 'Exchange completed successfully');
    } catch (error) {
      const message = error.response?.data?.error || 'Exchange failed';
      showModal('error', 'Error', message);
    } finally {
      updateLoading('exchange', false);
    }
  }, [updateLoading, closeModal, showModal]);

  return (
    <div className="min-h-screen bg-[#111827]">
    

      <BalanceCard />

      <div className="mt-6">
        <div className="space-y-6 pt-8">
          <MiningAnimation isMining={isMining} />

          <div className="bg-[#19202a] rounded-2xl p-4 space-y-4 mx-4 mt-5 ">
            <div className="text-center ">
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

            {/* ✅ Single Row: Sell + Exchange */}
            <div className="grid grid-cols-2 gap-3">
              <ActionButton
                onClick={handleCollect}
                disabled={!collectAvailable || state.loading.collect}
                loading={state.loading.collect}
                icon={<Coins className="w-4 h-4" />}
                label={collectAvailable ? "Sell" : "Sold Today"}
                isSell={true}
              />
              <ActionButton
                onClick={handleExchangeClick}
                disabled={(state.userData.winstuk_coin ?? 0) <= 0}
                loading={state.loading.exchange}
                icon={<ArrowDownToLine className="w-4 h-4" />}
                label="Exchange"
                isSell={false}
              />
            </div>
          </div>

          {/* History Button */}
          <button
            onClick={() => navigate('/mining-history')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#19202a] hover:bg-[#1c2a3a] rounded-xl text-[#D4AF37] font-medium transition-colors"
          >
            <History className="w-4 h-4" />
            <span>See Full History</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <StatusModal
        isOpen={state.modals.success}
        onClose={() => closeModal('success')}
        type="success"
        title={state.modalData.title}
        message={state.modalData.message}
      />
      <StatusModal
        isOpen={state.modals.error}
        onClose={() => closeModal('error')}
        type="error"
        title={state.modalData.title}
        message={state.modalData.message}
      />
      <ExchangeConfirmModal
        isOpen={state.modals.exchangeConfirm}
        onClose={() => closeModal('exchangeConfirm')}
        onConfirm={confirmExchange}
        coinAmount={state.userData.winstuk_coin ?? 0}
      />
    </div>
  );
};

export default MiningTask;