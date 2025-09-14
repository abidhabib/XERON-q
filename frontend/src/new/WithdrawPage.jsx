import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../UserContext/UserContext';
import { RemoveTrailingZeros } from '../../utils/utils';
import {
  ClipboardCopy,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  ShieldCheck,
  X
} from 'lucide-react';
import NavBAr from '../NavBAr';
import { FiHome, FiMail, FiUsers } from "react-icons/fi";
import { AiOutlineVerified } from "react-icons/ai";
import NotificationBell from '../NotificationBell';

const Toast = ({ message, type, onClose }) => {
  const iconMap = {
    success: <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />,
    error: <AlertCircle className="w-3.5 h-3.5 text-red-600" />,
    info: <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
  };

  return (
    <div className="animate-fade-in-up flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white border rounded shadow-sm border-gray-200">
      {iconMap[type]}
      <span className="flex-1 text-gray-700">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

const SuccessModal = ({ onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-3">
    <div className="bg-white rounded-lg p-4 w-full max-w-xs shadow-lg">
      <div className="text-center">
        <CheckCircle2 className="mx-auto mb-2 text-green-500 w-8 h-8" />
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Request Received</h3>
        <p className="text-xs text-gray-500 mb-3">Processing will complete in a few hours.</p>
        <button
          onClick={onClose}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded text-xs font-medium transition-colors"
        >
          View History
        </button>
      </div>
    </div>
  </div>
);

const WithdrawPage = () => {
  const { Userid, userData, fetchUserData, team, level, currBalance, NewName, backend_wallet } = useContext(UserContext);
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [withdrawLimits, setWithdrawLimits] = useState([]);
  const [accountDetails, setAccountDetails] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0);

  const menuItems = [
    { 
      name: "Home", 
      link: "/wallet", 
      icon: <FiHome className="w-4 h-4" />,
      label: "Dashboard Home"
    },
    { 
      name: "Alerts", 
      link: "/alerts", 
      icon: <NotificationBell iconClass="w-4 h-4" />,
      label: "View Notifications"
    },
    { 
      name: "Contact", 
      link: "/contact", 
      icon: <FiMail className="w-4 h-4" />,
      label: "Contact Support"
    },
    { 
      name: "Team", 
      link: "/team", 
      icon: <FiUsers className="w-4 h-4" />,
      label: "View Team"
    }
  ];

  // Calculate progress (backend_wallet / 3)
  const progress = backend_wallet ? Math.min(Math.round((backend_wallet / 3) * 100), 100) : 0;

  // Format currency properly
  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toFixed(2);
  };

  const showToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [limitsRes, accountRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/fetchLimitsData`),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/getUserAccount/${Userid}`, {
            withCredentials: true,
          })
        ]);

        if (limitsRes.data.status === 'success') {
          setWithdrawLimits(limitsRes.data.data);
        }

        if (accountRes.data.status === 'success') {
          setAccountDetails(accountRes.data.userAccount);
        }
      } catch (error) {
        showToast('Please update your wallet details in Settings!');
        navigate('/userwalletsettings')
      }
    };

    fetchData();
  }, [Userid, level]);

  useEffect(() => {
    const validateAccountDetails = () => {
      if (!accountDetails) return;

      const isValid = accountDetails.coin_address && accountDetails.coin_address.trim() !== '';

      if (!isValid) {
        showToast('Please complete your crypto wallet details');
        navigate('/UserWalletSettings');
      }
    };

    validateAccountDetails();
  }, [accountDetails, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const now = Date.now();

    if (submitting || !accountDetails || (now - lastSubmissionTime < 5000)) {
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      showToast('Invalid amount');
      return;
    }

    if (numericAmount <= 0) {
      showToast('Amount must be greater than zero');
      return;
    }

    const currentLimit = withdrawLimits.find(item => item.withdrawalAttempts === level)?.allow_limit;
    if (currentLimit && numericAmount < parseFloat(currentLimit)) {
      showToast(`Amount must be at least $${currentLimit}`);
      return;
    }

    if (numericAmount > currBalance) {
      showToast('Insufficient balance');
      return;
    }

    setSubmitting(true);
    setLastSubmissionTime(now);

    try {
      const payload = {
        amount: numericAmount,
        accountNumber: accountDetails.coin_address,
        bankName: accountDetails.address_type,
        totalWithdrawn: userData.total_withdrawal,
        team: team
      };

      const { data } = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/withdraw`,
        payload,
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      );

      if (data.status === 'success') {
        setShowSuccessModal(true);
        await fetchUserData();
      }
    } catch (error) {
      handleSubmissionError(error);
    } finally {
      setSubmitting(false);
      setAmount('');
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessModal(false);
    navigate('/wallet');
  };

  const handleSubmissionError = (error) => {
    let message = 'Withdrawal failed. Please try again.';

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        showToast('Session expired. Please login again.');
        navigate('/');
        return;
      }
      message = error.response?.data?.error || message;
    }

    showToast(message);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Wallet address copied', 'success');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Fixed Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <NavBAr />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 pt-16">
      {/* Mini Dashboard - Tightened version */}
<div className="py-4 bg-[#19202a] shadow">
  <div className="flex items-center px-3 mb-2.5">
    <p className="text-white uppercase flex items-center text-sm font-medium">
      {NewName || 'User'} 
      <span className="text-green-500 ml-1">
        <AiOutlineVerified className="w-4 h-4" />
      </span>
    </p>
  </div>

  <div className="flex justify-between items-center px-3 mb-3.5">
    <div>
      <p className="text-xs text-gray-400 mb-0.5">Available Balance</p>
      <p className="text-white text-xl font-bold">
        ${formatCurrency(currBalance)}
      </p>
    </div>
    <div className="px-2.5 py-1 font-bold text-green-400 bg-transparent border border-green-400 rounded-full text-xs">
      Progress {progress}%
    </div>
  </div>

  <div className="px-3 pb-1.5">
    <div className="grid grid-cols-4 gap-1.5">
      {menuItems.map((item, index) => (
        <button
          key={index}
          onClick={() => navigate(item.link)}
          className="flex flex-col items-center p-1.5 text-white hover:bg-white/10 rounded transition-colors"
          aria-label={item.label}
        >
          <div className="border border-white/20 rounded-full p-2 mb-0.5 flex items-center justify-center bg-white/5">
            {item.icon}
          </div>
          <span className="text-xs text-center">{item.name}</span>
        </button>
      ))}
    </div>
  </div>
</div>

        {/* Toast Notifications */}
        <div className="fixed top-3 right-3 z-50 space-y-1.5">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>
{/* Withdraw Content - Modern minimal design */}
<div className="px-3 py-4 flex-1">
  <div className="max-w-md mx-auto w-full">
    {/* Account Info Card */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Available Balance</p>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-xl font-bold text-gray-900">
              ${RemoveTrailingZeros(currBalance)}
            </span>
          </div>
        </div>
       
      </div>

      {accountDetails && (
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">
              {accountDetails.address_type} Wallet
            </p>
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
          </div>
          
          <div className="flex items-center gap-2">
            <p className="font-mono text-xs text-gray-900 break-all flex-1">
              {accountDetails.coin_address}
            </p>
            <button 
              onClick={() => copyToClipboard(accountDetails.coin_address)} 
              className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
            >
              <ClipboardCopy className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>

    {/* Withdraw Form */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="mb-5">
        <label className="text-xs font-medium text-gray-700 mb-2 block">Withdraw Amount</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <DollarSign className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="number"
            value={amount}
            onChange={e => {
              let value = e.target.value.replace(/[^0-9.]/g, '');
              const parts = value.split('.');
              if (parts.length > 2) value = parts[0] + '.' + parts[1];
              if (value === '.') value = '0.';
              setAmount(value);
            }}
            placeholder="0.00"
            className="w-full pl-8 pr-16 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
          <button
            onClick={() => setAmount(currBalance)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            MAX
          </button>
        </div>
        
        <div className="mt-2 flex gap-2">
          <span className="text-xs text-gray-500">Min: $10</span>
          <span className="text-xs text-gray-500">•</span>
          <span className="text-xs text-gray-500">Fee: $0</span>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-5">
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
          <div>
            <p className="text-xs font-medium text-gray-900">Processing Time</p>
            <p className="text-xs text-gray-600 mt-0.5">Withdrawals processed within 24 hours</p>
          </div>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || !accountDetails}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-sm rounded-lg font-medium shadow-sm transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            <span>Processing...</span>
          </div>
        ) : (
          'Withdraw Funds'
        )}
      </button>
    </div>
  </div>
</div>
     
      </div>

      {showSuccessModal && <SuccessModal onClose={handleSuccessConfirm} />}
    </div>
  );
};

export default WithdrawPage;