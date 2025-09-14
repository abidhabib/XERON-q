import { useState, useEffect, useCallback, useMemo, lazy, useContext, useRef } from 'react';
import axios from 'axios';
import { CgArrowsExchange } from "react-icons/cg";
import { RemoveTrailingZeros } from '../utils/utils';
import { FaCoins, FaEthereum } from "react-icons/fa";
import { SlWallet } from "react-icons/sl";
import { UserContext } from "./UserContext/UserContext";
import React from 'react';
import Lottie from 'lottie-react';
import { FiCpu } from 'react-icons/fi';

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
const NavBar = lazy(() => import('./NavBAr'));



const MiningAnimation = ({ isMining }) => {
  if (!isMining) return null;

  return (
    <div className="mining-animation mt-4">
      <div className="processor">
        <FiCpu />
      </div>
     
      {/* Mining grid lines */}
      <div className="grid-lines">
        <div className="grid-line horizontal"></div>
        <div className="grid-line vertical"></div>
      </div>
      {/* Floating crypto symbols */}
    
      
      <style jsx>{`
        .mining-animation {
          width: 160px;
          height: 160px;
          margin: 0 auto 1.5rem;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .processor {
          width: 100%;
          height: 100px;
          background: linear-gradient(135deg, #0f172a, #1e293b);
          border-radius: 12px;
          display: flex;
          justify-content: center;
          align-items: center;
          color: #2ffb24ff;
          font-size: 2rem;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.4);
          position: relative;
          z-index: 2;
          border: 1px solid #334155;
        }
        
        .pulse-dots {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
        }
        
        .dot {
          position: absolute;
          width: 12px;
          height: 12px;
          background-color: #19202a;
          border-radius: 50%;
          opacity: 0.8;
        }
        
        .dot-1 {
          top: 15px;
          left: 15px;
          animation: pulse 1.5s infinite;
        }
        
        .dot-2 {
          top: 15px;
          right: 15px;
          animation: pulse 1.5s infinite 0.2s;
        }
        
        .dot-3 {
          bottom: 15px;
          right: 15px;
          animation: pulse 1.5s infinite 0.4s;
        }
        
        .dot-4 {
          bottom: 15px;
          left: 15px;
          animation: pulse 1.5s infinite 0.6s;
        }
        
        /* Mining grid lines */
        .grid-lines {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
        }
        
        .grid-line {
          position: absolute;
          background: linear-gradient(90deg, transparent, #fbbf24, transparent);
        }
        
        .grid-line.horizontal {
          width: 100%;
          height: 1px;
          top: 50%;
          animation: scan 3s linear infinite;
        }
        
        .grid-line.vertical {
          width: 1px;
          height: 100%;
          left: 50%;
          animation: scan-vertical 3s linear infinite;
        }
        
        /* Crypto symbols */
        .crypto-symbols {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
        }
        
        .symbol {
          position: absolute;
          color: #fbbf24;
          font-weight: bold;
          opacity: 0;
          font-size: 1.2rem;
        }
        
        .btc {
          top: -20px;
          left: 30%;
          animation: float 4s ease-in-out infinite;
        }
        
        .eth {
          bottom: -20px;
          right: 30%;
          animation: float 4s ease-in-out infinite 1s;
        }
        
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0.5; }
        }
        
        @keyframes scan {
          0% { transform: translateY(-80px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(80px); opacity: 0; }
        }
        
        @keyframes scan-vertical {
          0% { transform: translateX(-80px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(80px); opacity: 0; }
        }
        
        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-40px) rotate(180deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};


const styles = {
  demoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    padding: '20px'
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 5px 20px rgba(0, 0, 0, 0.1)',
    padding: '30px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    width: '280px',
    height: '280px'
  },
  cell: {
    width: '60px',
    height: '60px',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    transition: 'all 0.3s ease'
  },
  activeCell: {
    backgroundColor: 'rgba(74, 108, 247, 0.2)',
    borderColor: '#4a6cf7',
    boxShadow: '0 0 15px rgba(74, 108, 247, 0.3)'
  },
  toggleButton: {
    marginTop: '20px',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  startButton: {
    backgroundColor: '#4a6cf7',
    color: 'white'
  },
  stopButton: {
    backgroundColor: '#ef4444',
    color: 'white'
  }
};



// Modal Components
const CustomModal = ({ isOpen, onClose, children, size = 'sm' }) => {
  useEffect(() => {
    const bodyClass = 'modal-open';
    if (isOpen) {
      document.body.classList.add(bodyClass);
    } else {
      document.body.classList.remove(bodyClass);
    }
    return () => document.body.classList.remove(bodyClass);
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-xs',
    md: 'max-w-md',
    lg: 'max-w-lg'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`bg-white rounded-xl w-full ${sizeClasses[size]} relative shadow-xl transform transition-all duration-200 scale-100`}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="pt-8 pb-6 px-5">{children}</div>
      </div>
    </div>
  );
};

const ExchangeConfirmModal = ({ isOpen, onClose, onConfirm, coinAmount }) => (
  <CustomModal isOpen={isOpen} onClose={onClose} size="sm">
    <div className="text-center">
      <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mb-4">
        <CgArrowsExchange className="w-6 h-6 text-amber-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm Exchange</h3>
      <p className="text-gray-600 mb-6 text-sm">
        Exchange <span className="font-semibold">{RemoveTrailingZeros(coinAmount)}</span> Coin?
      </p>
      <div className="flex gap-3">
        <button
          className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white rounded-lg font-medium transition-all text-sm"
          onClick={onConfirm}
        >
          Confirm
        </button>
      </div>
    </div>
  </CustomModal>
);

const StatusModal = ({ isOpen, onClose, type, title, message }) => {
  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-100' : 'bg-red-100';
  const iconColor = isSuccess ? 'text-green-600' : 'text-red-600';
  
  return (
    <CustomModal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        <div className={`mx-auto flex items-center justify-center w-12 h-12 rounded-full ${bgColor} mb-4`}>
          {isSuccess ? (
            <svg className={`w-6 h-6 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className={`w-6 h-6 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6 text-sm">{message}</p>
        <button
          className="w-full py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors text-sm"
          onClick={onClose}
        >
          Continue
        </button>
      </div>
    </CustomModal>
  );
};

// UI Components
const ActionButton = React.memo(({ onClick, disabled, loading, icon, label, variant = 'primary' }) => {
  const baseClasses = "flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all w-full";
  
  // Updated classes with #19202a background
  const primaryClasses = "bg-[#2a3542] text-white hover:bg-[#2a3566] shadow-sm";
  const secondaryClasses = "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 shadow-sm";
  const disabledClasses = "bg-gray-100 text-gray-400 cursor-not-allowed";
  
  return (
    <button
      className={`${baseClasses} ${disabled ? disabledClasses : (variant === 'primary' ? primaryClasses : secondaryClasses)} ${loading ? 'opacity-80' : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Processing...</span>
        </>
      ) : (
        <>
          {icon}
          <span>{label}</span>
        </>
      )}
    </button>
  );
});

const TransactionHistory = React.memo(({ history }) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <h4 className="text-sm font-semibold text-gray-700">Recent Minig History</h4>
      <span className="text-xs text-gray-500">{history.length} items</span>
    </div>
    
    {history.length === 0 ? (
      <div className="text-center py-6 text-gray-500">
        <svg className="w-10 h-10 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p className="text-sm">No transactions yet</p>
      </div>
    ) : (
      <div className="max-h-52 overflow-y-auto pr-2 space-y-2">
        {history.slice(0, 5).map((record) => (
          <div key={record.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${record.type === 'collect' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                {record.type === 'collect' ? (
                  <FaCoins className="w-4 h-4" />
                ) : (
                  <CgArrowsExchange className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 capitalize">{record.type}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-medium ${record.type === 'collect' ? 'text-green-600' : 'text-amber-600'}`}>
                {record.type === 'collect' ? '+' : '-'}{RemoveTrailingZeros(record.amount)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Coin</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
));

const MiningTask = () => {
  const { NewName, currBalance, backend_wallet } = useContext(UserContext);
  const [state, setState] = useState({
    userData: { winstuk_coin: 0, balance: 0, last_collect_date: null },
    loading: { collect: false, exchange: false },
    history: [],
    modals: {
      success: false,
      error: false,
      exchangeConfirm: false
    },
    modalData: {
      title: '',
      message: '',
      type: 'success'
    }
  });

  const [coinValue, setCoinValue] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isMining, setIsMining] = useState(false);

  // Format currency properly
  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toFixed(2);
  };

  // API calls
  const fetchCoinValue = useCallback(async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/get-coin-value`);
      setCoinValue(response.data.value);
    } catch (error) {
      console.error('Error fetching coin value:', error);
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/user-data`);
      setState(prev => ({ ...prev, userData: response.data }));
    } catch (error) {
      console.error('Error fetching user ', error);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/coin-collect-history`);
      setState(prev => ({ ...prev, history: response.data }));
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  }, []);

  const initializeData = useCallback(async () => {
    try {
      await Promise.all([
        fetchCoinValue(),
        fetchUserData(),
        fetchHistory()
      ]);
    } catch (error) {
      console.error('Initialization error:', error);
    }
  }, [fetchCoinValue, fetchUserData, fetchHistory]);

  useEffect(() => {
    initializeData();
  }, [initializeData, refreshTrigger]);

  // Helpers
  const canCollect = useMemo(() => {
    if (state.loading.collect) return false;
    if (!state.userData.last_collect_date) return true;
    const lastCollect = new Date(state.userData.last_collect_date);
    const today = new Date();
    return lastCollect.toDateString() !== today.toDateString();
  }, [state.loading.collect, state.userData.last_collect_date]);

  const updateLoading = useCallback((type, isLoading) => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, [type]: isLoading }
    }));
  }, []);

  const showModal = useCallback((type, title, message) => {
    setState(prev => ({
      ...prev,
      modals: { ...prev.modals, [type]: true },
      modalData: { title, message, type }
    }));
  }, []);

  const closeModal = useCallback((type) => {
    setState(prev => ({
      ...prev,
      modals: { ...prev.modals, [type]: false }
    }));
  }, []);

  // Event handlers
  const handleCollect = useCallback(async () => {
    if (!canCollect) return;
    
    updateLoading('collect', true);
    setIsMining(true);
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/collect-coin`);
      setRefreshTrigger(prev => prev + 1);
      showModal('success', 'Success!', response.data.message || 'Coins collected successfully');
    } catch (error) {
      const message = error.response?.data?.error || 'Collection failed';
      showModal('error', 'Error', message);
    } finally {
      updateLoading('collect', false);
      setTimeout(() => {
        setIsMining(false);
      }, 1000);
    }
  }, [canCollect, updateLoading, showModal]);

  const handleExchangeClick = useCallback(() => {
    if ((state.userData.winstuk_coin || 0) <= 0) return;
    setState(prev => ({ 
      ...prev, 
      modals: { ...prev.modals, exchangeConfirm: true }
    }));
  }, [state.userData.winstuk_coin]);

  const confirmExchange = useCallback(async () => {
    setState(prev => ({ 
      ...prev, 
      loading: { ...prev.loading, exchange: true }, 
      modals: { ...prev.modals, exchangeConfirm: false }
    }));

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/exchange-coin`);
      setRefreshTrigger(prev => prev + 1);
      showModal('success', 'Success!', response.data.message || 'Exchange completed successfully');
    } catch (error) {
      const message = error.response?.data?.error || 'Exchange failed';
      showModal('error', 'Error', message);
    } finally {
      setState(prev => ({ ...prev, loading: { ...prev.loading, exchange: false } }));
    }
  }, [showModal]);

  // Computed values
  const availableTokens = useMemo(() => 
    RemoveTrailingZeros((state.userData.winstuk_coin || 0) * coinValue), 
    [state.userData.winstuk_coin, coinValue]
  );

  const walletBalance = useMemo(() => 
    RemoveTrailingZeros(state.userData.balance || 0), 
    [state.userData.balance]
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Fixed Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <NavBar />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 pt-16">
        {/* Mini Dashboard - EXACT SAME HEIGHT AS REFERRAL PROGRAM */}
        <div className="py-6 bg-[#19202a] shadow-lg">
          <div className="flex items-center px-4 mb-4">
            <p className="text-white uppercase flex items-center text-lg font-medium">
              {NewName || 'User'} 
              <span className="text-green-500 ml-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </span>
            </p>
          </div>

          <div className="flex justify-between items-center px-4 mb-6">
            <p className="text-white text-2xl font-bold">
              ${formatCurrency(walletBalance)}
            </p>
            <div className="px-3 py-1.5 font-bold text-green-400 bg-transparent border border-green-400 rounded-full text-xs">
              Coin Name {availableTokens}
            </div>
          </div>

          <div className="px-4 pb-2">
            <div className="grid grid-cols-3 gap-2">
             
              <div 
                className="flex flex-col items-center p-2 text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                onClick={handleExchangeClick}
              >
                <div className="border border-white/20 rounded-full p-2.5 mb-1 flex items-center justify-center bg-white/5">
                  <CgArrowsExchange className="w-5 h-5" />
                </div>
                <span className="text-xs text-center mt-1">Exchange</span>
              </div>
              <div className="flex flex-col items-center p-2 text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                <div className="border border-white/20 rounded-full p-2.5 mb-1 flex items-center justify-center bg-white/5">
                  <SlWallet className="w-5 h-5" />
                </div>
                <span className="text-xs text-center mt-1">Wallet</span>
              </div>
              <div className="flex flex-col items-center p-2 text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                <div className="border border-white/20 rounded-full p-2.5 mb-1 flex items-center justify-center bg-white/5">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs text-center mt-1">Home</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mining Content */}
          
          <div className="bg-white rounded-xl p-2 shadow border border-gray-200 overflow-hidden relative">
            {/* Mining Animation Overlay */}
<MiningAnimation isMining={true}/>
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
              coinAmount={state.userData.winstuk_coin || 0}
            />

            {/* Mining Section */}
            
              {/* Actions */}
              <div className="mb-6">
                <ActionButton
                  onClick={handleCollect}
                  disabled={!canCollect || state.loading.collect}
                  loading={state.loading.collect}
                  icon={<FaCoins className="w-4 h-4" />}
                  label="Collect Coin"
                  variant="primary"
                />
              
              </div>

              {/* History */}
              <TransactionHistory history={state.history} />
            </div>
        </div>
    </div>
  );
};

export default MiningTask;