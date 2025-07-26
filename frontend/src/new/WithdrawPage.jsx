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

const Toast = ({ message, type, onClose }) => {
  const iconMap = {
    success: <CheckCircle2 className="w-4 h-4 text-green-600" />,
    error: <AlertCircle className="w-4 h-4 text-red-600" />,
    info: <AlertCircle className="w-4 h-4 text-blue-600" />
  };

  return (
    <div className="animate-fade-in-up flex items-center gap-2 px-3 py-2 text-sm bg-white border rounded-lg -200">
      {iconMap[type]}
      <span className="flex-1 text-gray-700">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const SuccessModal = ({ onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
    <div className="bg-white rounded-xl p-4 w-11/12 max-w-sm text-center shadow-lg">
      <CheckCircle2 className="mx-auto mb-3 text-green-600 w-10 h-10" />
      <h2 className="text-lg font-semibold mb-1">Request Received</h2>
      <p className="text-sm text-gray-600 mb-4">Processing will complete in a few hours.</p>
      <button
        onClick={onClose}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium"
      >
        View History
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
  const [accountDetails, setAccountDetails] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0);

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
        navigate('/Bank-And-Crypto');
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
      console.log(payload);
      

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
    showToast('Wallet address copied to clipboard', 'success');
  };

  return (
    <div className="min-h-screen bg-gray-50">
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

      <div className=" mx-auto ">
        <NavBAr />

     

        <div className="bg-[#19202a] p-3 rounded-b-xl text-white mb-4">
        <p className="text-xs text-gray-300">Available Balance</p>
  <div className="flex items-center gap-1 text-lg font-semibold">
    <DollarSign className="w-4 h-4" />
    <span>${RemoveTrailingZeros(currBalance)}</span>
  </div>
  {accountDetails && (
    <div className="bg-gray-700 p-3 mt-3 rounded-lg text-xs">
      <div className="flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-blue-500 mt-0.5" />
        <div className="flex-1">
          <p className="text-blue-100 font-medium uppercase tracking-wide">
            <span className="underline text-amber-400">{accountDetails.address_type}</span> Wallet
          </p>
          
          <p className="mt-2 font-mono text-sm break-all text-green-500">{accountDetails.coin_address}
{" "}
          <button onClick={() => copyToClipboard(accountDetails.coin_address)} className="text-gray-300 hover:text-blue-400">
          <ClipboardCopy className="w-4 h-4" />
        </button>
          </p>
          
        </div>
     
      </div>
    </div>
  )}
</div>


<div className="bg-white rounded-xl  p-4">
  <div className="mb-4">
    <div className="flex justify-between items-center mb-1">
      <label className="text-sm font-medium">Amount</label>
      <button
        onClick={() => setAmount(currBalance)}
        className="text-xs text-blue-600 hover:text-blue-700"
      >
        Use Max
      </button>
    </div>
    <div className="relative">
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
        className="w-full text-sm pl-4 pr-12 py-2 bg-gray-50 border border-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">USD</span>
    </div>
  </div>

  <p className="text-xs text-center text-gray-500 mb-4">No fees • Instant</p>

  <button
    onClick={handleSubmit}
    disabled={submitting || !accountDetails}
    className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white py-2 text-sm rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
    >
    {submitting ? (
      <div className="flex items-center justify-center gap-2">
        <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
        <span>Processing...</span>
      </div>
    ) : (
      'Withdraw'
    )}
  </button>
</div>


      </div>

      {showSuccessModal && <SuccessModal onClose={handleSuccessConfirm} />}
    </div>
  );
};

export default WithdrawPage;