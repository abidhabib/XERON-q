// src/pages/SalaryHistory.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  History,
  FileText,
  CreditCard,
  ChevronRight,
  X,
  Coins,
  CheckCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { UserContext } from './UserContext/UserContext';
import BalanceCard from './new/BalanceCard';
import { RemoveTrailingZeros } from '../utils/utils';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// ✅ Receipt Modal
const ReceiptModal = ({ payment, onClose }) => {
  if (!payment) return null;

  const date = parseISO(`${payment.month.slice(0,4)}-${payment.month.slice(4)}-01`);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-2">
      <div 
        className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl animate-scaleIn border border-[#E6E8EB]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[#F0F0F0]">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                <CreditCard className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1E2026]">Salary Receipt</h3>
                <p className="text-sm text-[#707A8A]">Payment confirmation</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[#707A8A]" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center py-4">
            <div className="relative">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-200">
                <CreditCard className="w-10 h-10 text-emerald-500" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#F0B90B] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                <CheckCircle className="w-4 h-4 text-[#1E2026]" />
              </div>
            </div>
          </div>

          <div className="bg-[#F5F5F5] rounded-xl p-5 space-y-4 border border-[#E6E8EB]">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-[#707A8A]">Payment Date</p>
                <p className="text-[#1E2026] font-medium">{format(date, 'dd MMM yyyy')}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#707A8A]">For Period</p>
                <p className="text-[#1E2026] font-medium">{format(date, 'MMMM yyyy')}</p>
              </div>
            </div>

            <div className="h-px bg-[#E6E8EB]" />

            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-[#707A8A]">Transaction ID</p>
                <p className="text-[#1E2026] font-mono text-sm">{payment.transactionId || 'SAL-' + Date.now()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#707A8A]">Status</p>
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Confirmed</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center pt-4 border-t border-[#F0F0F0]">
            <p className="text-sm text-[#707A8A] mb-2">Total Amount</p>
            <p className="text-4xl font-bold text-emerald-600">${RemoveTrailingZeros(payment.amount)}</p>
            <p className="text-sm text-[#707A8A] mt-2">Successfully transferred to your account</p>
          </div>
        </div>

        <div className="p-6 border-t border-[#F0F0F0]">
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#F5F5F5] hover:bg-[#EBECF0] text-[#1E2026] rounded-xl font-medium transition-colors border border-[#E6E8EB]"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

const renderLoading = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F5F5]">
    <div className="relative">
      <div className="w-16 h-16 rounded-full border-4 border-[#E6E8EB]"></div>
      <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-[#F0B90B] border-t-transparent animate-spin"></div>
      <Coins className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-[#F0B90B]" />
    </div>
    <p className="mt-4 text-[#707A8A] animate-pulse">Loading salary history...</p>
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
    return renderLoading();
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <BalanceCard />
      <div className="p-3 md:p-3">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div 
            className="flex items-center gap-2 mb-6 cursor-pointer"
            onClick={() => { navigate('/salaryofMonth') }}
          >
            <ArrowBack className="w-5 h-5 text-[#F0B90B]" />
            <h1 className="text-xl font-bold text-[#1E2026]">Salary History</h1>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* History List */}
          {history.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-[#E6E8EB] shadow-sm">
              <div className="w-12 h-12 bg-[#F5F5F5] rounded-full flex items-center justify-center mx-auto mb-3 border border-[#E6E8EB]">
                <FileText className="w-6 h-6 text-[#C5C8CE]" />
              </div>
              <p className="text-[#707A8A]">No salary payments yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl overflow-hidden border border-[#E6E8EB] shadow-sm">
              {history.map((item, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedPayment(item)}
                  className="p-4 hover:bg-[#FAFAFA] cursor-pointer transition-colors flex items-center justify-between border-b border-[#F0F0F0] last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-md border border-emerald-200">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[#1E2026] font-medium">
                        {format(parseISO(`${item.month.slice(0,4)}-${item.month.slice(4)}-01`), 'MMM yyyy')}
                      </p>
                      <p className="text-[#707A8A] text-xs mt-0.5">
                        {item.date ? format(new Date(item.date), 'MMM dd, yyyy') : 'Collected'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">${RemoveTrailingZeros(item.amount)}</span>
                    <ChevronRight className="w-4 h-4 text-[#C5C8CE]" />
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