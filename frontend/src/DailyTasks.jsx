import { useState, useEffect, useCallback, useMemo, lazy, useContext } from 'react';
import axios from 'axios';
import { CgArrowsExchange } from "react-icons/cg";
import { RemoveTrailingZeros } from '../utils/utils';
import { FaCoins, FaHistory } from "react-icons/fa";
import { UserContext } from "./UserContext/UserContext";
import React from 'react';
import { FiCpu, FiHome, FiMail, FiUsers } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { RiNotificationBadgeFill } from 'react-icons/ri';
import { AiOutlineVerified } from 'react-icons/ai';
import BalanceCard from './new/BalanceCard';

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

// Tab Component
const TabButton = ({ active, onClick, icon: Icon, label, badge }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all duration-200 text-sm font-medium ${
      active
        ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
    }`}
  >
    <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : ''}`} />
    <span>{label}</span>
    {badge && (
      <span className="inline-flex items-center justify-center min-w-5 h-5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full px-1">
        {badge}
      </span>
    )}
  </button>
);

// Mining Animation Component
const MiningAnimation = ({ isMining }) => {
  if (isMining) return null;

  return (
    <div className="relative w-full h-32 mb-6 flex items-center justify-center">
      <div className="relative z-10">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 flex items-center justify-center shadow-lg">
          <FiCpu className="w-7 h-7 text-green-400 animate-pulse" />
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute w-28 h-28 border-2 border-green-400/20 rounded-full animate-ping"></div>
        <div className="absolute w-36 h-36 border border-green-400/10 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

// Modal Components (Keep as is, optimized for performance)
const CustomModal = React.memo(({ isOpen, onClose, children, size = 'sm' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-xs',
    md: 'max-w-md',
    lg: 'max-w-lg'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div 
        className={`bg-white rounded-xl w-full ${sizeClasses[size]} relative shadow-xl animate-slideUp`}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-full transition-colors z-10"
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
});

const ExchangeConfirmModal = React.memo(({ isOpen, onClose, onConfirm, coinAmount }) => (
  <CustomModal isOpen={isOpen} onClose={onClose} size="sm">
    <div className="text-center">
      <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mb-4">
        <CgArrowsExchange className="w-6 h-6 text-amber-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm Exchange</h3>
      <p className="text-gray-600 mb-6 text-sm">
        Exchange <span className="font-semibold">{RemoveTrailingZeros(coinAmount)}</span> Coins?
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
));

const StatusModal = React.memo(({ isOpen, onClose, type, title, message }) => {
  const isSuccess = type === 'success';
  
  return (
    <CustomModal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        <div className={`mx-auto flex items-center justify-center w-12 h-12 rounded-full ${
          isSuccess ? 'bg-green-100' : 'bg-red-100'
        } mb-4`}>
          {isSuccess ? (
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
});

// UI Components
const ActionButton = React.memo(({ onClick, disabled, loading, icon, label, variant = 'primary' }) => {
  const baseClasses = "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all w-full";
  
  const primaryClasses = "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-sm";
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

// Stat Card Component
const StatCard = React.memo(({ title, value, subtext, icon: Icon, gradient = 'from-blue-500 to-blue-600' }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
    <div className="flex items-start justify-between mb-2">
      <div>
        <p className="text-sm text-gray-600 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      {Icon && (
        <div className={`p-2 rounded-lg bg-gradient-to-r ${gradient}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
    {subtext && (
      <p className="text-xs text-gray-500 mt-2">{subtext}</p>
    )}
  </div>
));

// History List Component
const HistoryList = React.memo(({ history }) => {
  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
          <FaHistory className="w-5 h-5 text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm">No transactions yet</p>
        <p className="text-gray-400 text-xs mt-1">Your mining history will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {history.slice(0, 20).map((record) => (
        <div
          key={record.id || record.created_at}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              record.type === 'collect' 
                ? 'bg-green-100 text-green-600' 
                : 'bg-amber-100 text-amber-600'
            }`}>
              {record.type === 'collect' ? (
                <FaCoins className="w-4 h-4" />
              ) : (
                <CgArrowsExchange className="w-4 h-4" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 capitalize">{record.type}</p>
              <p className="text-xs text-gray-500">
                {new Date(record.created_at).toLocaleDateString()} •{' '}
                {new Date(record.created_at).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-sm font-semibold ${
              record.type === 'collect' ? 'text-green-600' : 'text-amber-600'
            }`}>
              {record.type === 'collect' ? '+' : '-'}
              {RemoveTrailingZeros(record.amount || 0)}
            </p>
            <p className="text-xs text-gray-500">Coins</p>
          </div>
        </div>
      ))}
    </div>
  );
});

// Main Component
const MiningTask = () => {
  const { NewName, currBalance, backend_wallet } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState('mining');
    const menuItems = [
    { 
      name: "Home", 
      link: "/wallet", 
      icon: <FiHome className="w-5 h-5" />,
      label: "Dashboard Home"
    },
    { 
      name: "Alerts", 
      link: "/alerts", 
      icon: <RiNotificationBadgeFill iconClass="w-5 h-5" />,
      label: "View Notifications"
    },
    { 
      name: "Contact", 
      link: "/contact", 
      icon: <FiMail className="w-5 h-5" />,
      label: "Contact Support"
    },
    { 
      name: "Team", 
      link: "/team", 
      icon: <FiUsers className="w-5 h-5" />,
      label: "View Team"
    }
  ];

  // Calculate progress (backend_wallet / 3)
  const progress = backend_wallet ? Math.min(Math.round((backend_wallet / 3) * 100), 100) : 0;

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
  const [collectAvailable, setCollectAvailable] = useState(true);

  // Format currency
  const formatCurrency = useCallback((amount) => {
    const num = parseFloat(amount || 0);
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }, []);

  // API calls
  const fetchCoinValue = useCallback(async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/get-coin-value`);
      setCoinValue(response.data.value || 1);
    } catch (error) {
      console.error('Error fetching coin value:', error);
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/user-data`);
      const userData = response.data || { winstuk_coin: 0, balance: 0, last_collect_date: null };
      setState(prev => ({ ...prev, userData }));
      
      if (userData.last_collect_date) {
        const lastCollect = new Date(userData.last_collect_date);
        const today = new Date();
        setCollectAvailable(lastCollect.toDateString() !== today.toDateString());
      } else {
        setCollectAvailable(true);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/coin-collect-history`);
      setState(prev => ({ ...prev, history: response.data || [] }));
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
      setTimeout(() => {
        setIsMining(false);
      }, 2000);
    }
  }, [collectAvailable, state.loading.collect, updateLoading, showModal]);

  const handleExchangeClick = useCallback(() => {
    if ((state.userData.winstuk_coin || 0) <= 0) {
      showModal('error', 'No Coins', 'You have no coins to exchange');
      return;
    }
    setState(prev => ({ 
      ...prev, 
      modals: { ...prev.modals, exchangeConfirm: true }
    }));
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

  // Computed values
  const availableTokens = useMemo(() => 
    RemoveTrailingZeros((state.userData.winstuk_coin || 0) * coinValue), 
    [state.userData.winstuk_coin, coinValue]
  );

  const walletBalance = useMemo(() => 
    RemoveTrailingZeros(state.userData.balance || 0), 
    [state.userData.balance]
  );

  // Add CSS animation
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-slideUp {
        animation: slideUp 0.3s ease-out;
      }
    `;
    document.head.appendChild(styleSheet);
    
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <div className="sticky top-0 left-0 right-0 z-50">
        <NavBar />
      </div>

      {/* Header */}
       {/* Main Content */}
           <div className="flex flex-col flex-1 pt-16">
         <BalanceCard />
        
           </div>

      {/* Tabs Navigation */}
      <div className="sticky  bg-gray-50   px-4 pt-4 pb-4">
        <div className="max-w-md mx-auto">
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
            <TabButton
              active={activeTab === 'mining'}
              onClick={() => setActiveTab('mining')}
              icon={FiCpu}
              label="Mining"
            />
            <TabButton
              active={activeTab === 'history'}
              onClick={() => setActiveTab('history')}
              icon={FaHistory}
              label="History"
              badge={state.history.length > 0 ? state.history.length : undefined}
            />
          </div>
        </div>
      </div>

      {/* Tab Content */}
        <div className="max-w-md mx-auto">
          {activeTab === 'mining' ? (
            /* Mining Tab */
            <div className="space-y-6">
              {/* Mining Animation */}
              <MiningAnimation isMining={isMining} />

              {/* Mining Card */}
              <div className="bg-white rounded-2xl shadow-sm  p-3 mt-6">
                <div className="text-center mb-6">
                  <p className="text-gray-600 text-sm mb-4">
                    Collect your daily coins. Available once per 24 hours.
                  </p>
                  
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full">
                    <span className="text-sm text-gray-700">Status:</span>
                    <span className={`text-sm font-semibold ${collectAvailable ? 'text-green-600' : 'text-amber-600'}`}>
                      {collectAvailable ? 'Available' : 'Collected Today'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <ActionButton
                    onClick={handleCollect}
                    disabled={!collectAvailable || state.loading.collect}
                    loading={state.loading.collect}
                    icon={<FaCoins className="w-4 h-4" />}
                    label={collectAvailable ? "Collect Daily Coins" : "Already Collected"}
                    variant="primary"
                  />
                  
                  <ActionButton
                    onClick={handleExchangeClick}
                    disabled={(state.userData.winstuk_coin || 0) <= 0}
                    loading={state.loading.exchange}
                    icon={<CgArrowsExchange className="w-4 h-4" />}
                    label="Exchange Coins"
                    variant="secondary"
                  />
                </div>

               
              </div>
            </div>
          ) : (
            /* History Tab */
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-3">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">  History</h2>
                    <p className="text-sm text-gray-500 mt-1">Your mining and exchange activities</p>
                  </div>
                  <span className="text-xs font-medium px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                    {state.history.length} total
                  </span>
                </div>
                
                <div className="max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                  <HistoryList history={state.history} />
                </div>
              </div>
            </div>
          )}
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
        coinAmount={state.userData.winstuk_coin || 0}
      />
    </div>
  );
};

export default MiningTask;