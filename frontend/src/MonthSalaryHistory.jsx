// src/pages/SalaryHistory.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  History,
  FileText,
  CreditCard,
  ChevronRight,
  X,
  Coins
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { UserContext } from './UserContext/UserContext';
import BalanceCard from './new/BalanceCard';
import { RemoveTrailingZeros } from '../utils/utils';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// ✅ Receipt Modal (reused from MonthlySalary)
const ReceiptModal = ({ payment, onClose }) => {
  if (!payment) return null;
  console.log(payment);
  
  const date = parseISO(`${payment.month.slice(0,4)}-${payment.month.slice(4)}-01`);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2">
      <div 
        className="w-full max-w-md bg-gray-900 rounded-2xl overflow-hidden   shadow-2xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CreditCard className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Salary Receipt</h3>
                <p className="text-sm text-white/60">Payment confirmation</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center py-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-full flex items-center justify-center">
                <CreditCard className="w-10 h-10 text-emerald-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900/50 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-white/60">Payment Date</p>
                <p className="text-white font-medium">{format(date, 'dd MMM yyyy')}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/60">For Period</p>
                <p className="text-white font-medium">{format(date, 'MMMM yyyy')}</p>
              </div>
            </div>
            
            <div className="h-px bg-white/10" />
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-white/60">Transaction ID</p>
                <p className="text-white font-mono text-sm">{payment.transactionId || 'SAL-' + Date.now()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/60">Status</p>
                <div className="flex items-center gap-2 text-emerald-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  <span className="font-medium">Confirmed</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center pt-4 border-t border-white/10">
            <p className="text-sm text-white/60 mb-2">Total Amount</p>
            <p className="text-4xl font-bold text-emerald-400">${RemoveTrailingZeros(payment.amount)}</p>
            <p className="text-sm text-white/60 mt-2">Successfully transferred to your account</p>
          </div>
        </div>
        
        <div className="p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-950">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-gray-800"></div>
        <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-[#D4AF37] border-t-transparent animate-spin"></div>
        <Coins className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-[#D4AF37]" />
      </div>
      <p className="mt-4 text-white/60 animate-pulse">Loading salary history...</p>
    </div>
  );


const MonthSalaryHistory = () => {
  const { Userid } = useContext(UserContext);
  const API = import.meta.env.VITE_API_BASE_URL;
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
const navigate = useNavigate();
  useEffect(() => {
    const fetchHistory = async () => {
      if (!Userid) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API}/api/monthly-salary/history`, { withCredentials: true });
        setHistory(res.data.history || []);
      } catch (err) {
        setError('Failed to load payment history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [Userid, API]);

  if (loading) {
    return (
     renderLoading()
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950">
      <BalanceCard />
      <div className="p-3 md:p-3">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6" 
          onClick={()=>{navigate('/salaryofMonth')}}
          >
            <ArrowBack className="w-5 h-5 text-[#D4AF37]" />
            <h1 className="text-xl font-bold text-white">Salary History</h1>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-3 bg-rose-500/10 rounded-lg text-rose-400 text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              {error}
            </div>
          )}

          {/* History List */}
          {history.length === 0 ? (
            <div className="bg-[#121826] rounded-xl p-8 text-center">
              <div className="w-12 h-12 bg-[#161d2a] rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-[#D4AF37]/40" />
              </div>
              <p className="text-[#D4AF37]/60">No salary payments yet</p>
            </div>
          ) : (
            <div className="bg-[#121826] rounded-xl overflow-hidden">
              {history.map((item, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedPayment(item)}
                  className="p-4 hover:bg-[#141b2a] cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-md">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {format(parseISO(`${item.month.slice(0,4)}-${item.month.slice(4)}-01`), 'MMM yyyy')}
                      </p>
                      <p className="text-[#D4AF37]/50 text-xs mt-0.5">
                        {item.date ? format(new Date(item.date), 'MMM dd, yyyy') : 'Collected'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">${RemoveTrailingZeros(item.amount)}</span>
                    <ChevronRight className="w-4 h-4 text-[#D4AF37]/40" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedPayment && (
        <ReceiptModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </div>
  );
};

export default MonthSalaryHistory;