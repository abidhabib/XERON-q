import React from 'react';
import { X, Copy, Eye, EyeOff } from 'lucide-react';
import Lottie from 'react-lottie-player';

// Animations
import checkmarkAnimation from '../checkmark.json';
import RejectAnimation from '../reject.json';
import pendingAnimation from '../pendingAnimation.json';

const PaymentReceipt = ({ selectedTransaction, setSelectedTransaction }) => {
  const [hideNumber, setHideNumber] = React.useState(true);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
console.log(selectedTransaction);

  const removeTrailingZeros = (num) => parseFloat(num.toFixed(2));
  const toggleHideNumber = () => setHideNumber(!hideNumber);

  const formatWalletAddress = (address) => {
    if (!address) return '—';
    return hideNumber
      ? '•••• •••• •••• ' + address.slice(-4)
      : address.slice(0, 6) + '…' + address.slice(-4);
  };

  const tx = selectedTransaction || {};
  const idStr = String(tx.id || '').padStart(8, '0');
  const shortId = idStr.slice(0, 6) + (tx.uid ? `-${tx.uid}` : '');

  const copyToClipboard = (text) => navigator.clipboard.writeText(String(text));

  const getStatusConfig = () => {
    switch (tx.approved) {
      case 'approved':
        return { 
          label: 'Completed', 
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          anim: checkmarkAnimation 
        };
      case 'pending':
        return { 
          label: 'Processing', 
          color: 'text-amber-600',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          anim: pendingAnimation 
        };
      default:
        return { 
          label: 'Rejected', 
          color: 'text-rose-600',
          bg: 'bg-rose-50',
          border: 'border-rose-200',
          anim: RejectAnimation 
        };
    }
  };

  const { label: statusLabel, color: statusColor, bg: statusBg, border: statusBorder, anim: animation } = getStatusConfig();

  return (
    <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl overflow-hidden max-h-[85vh] bg-white border-t border-[#E6E8EB] shadow-2xl">
      {/* Top Handle Bar */}
      <div className="flex justify-center pt-3 pb-2">
        <div className="w-12 h-1.5 bg-[#C5C8CE] rounded-full" />
      </div>

      <div className="px-5 py-3 overflow-y-auto max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-[16px] font-semibold text-[#1E2026] tracking-tight">Payment Receipt</h1>
          <button
            onClick={() => setSelectedTransaction(null)}
            className="p-1.5 -m-1.5 text-[#707A8A] hover:text-[#1E2026] hover:bg-[#F5F5F5] rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[12px] text-[#707A8A] mb-4">Receipt #{idStr}</p>

        {/* Status Animation + Label */}
        <div className="flex flex-col items-center my-4">
          <div className="w-24 h-24 flex items-center justify-center mb-2">
            <Lottie loop={false} animationData={animation} play style={{ width: 96, height: 96 }} />
          </div>
          <span className={`text-[14px] font-semibold ${statusColor}`}>{statusLabel}</span>
        </div>

        {/* Amount – Hero */}
        <div className="text-center my-4">
          <p className="text-[12px] uppercase tracking-wider text-[#707A8A] font-medium mb-1">Total Paid</p>
          <p className="text-[28px] font-bold text-[#1E2026]">
            ${removeTrailingZeros(Number(tx.amount || 0))}
          </p>
        </div>

        {/* Details Section */}
        <div className="my-4 space-y-1">
          <DetailRow 
            label="Transaction ID" 
            value={shortId} 
            onCopy={() => copyToClipboard(tx.id)} 
          />
          <DetailRow 
            label="Date & Time" 
            value={tx.date ? formatDateTime(tx.date) : '—'} 
          />
          <DetailRow 
            label="Wallet" 
            value={tx.bank_name || 'Main Wallet'} 
          />
          <DetailRow
            label="Address"
            value={formatWalletAddress(tx.address ? tx.address : tx.account_number)}
            onToggle={toggleHideNumber}
            isHidden={hideNumber}
            onCopy={() => copyToClipboard(tx.account_number? tx.account_number : tx.address)}
          />
        </div>

        {/* Fee & Total */}
        <div className="pt-4 pb-2 border-t border-[#E6E8EB] my-3">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-[12px] uppercase tracking-wider text-[#707A8A]">Processing Fee</span>
            <span className="text-[14px] font-medium text-[#1E2026]">
              ${removeTrailingZeros(Number(tx.fee || 0))}
            </span>
          </div>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-[12px] uppercase tracking-wider text-[#707A8A]">Grand Total</span>
            <span className="text-[18px] font-bold text-[#1E2026]">
              ${removeTrailingZeros((Number(tx.amount || 0) + Number(tx.fee || 0)))}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-4 mb-5">
          <p className="text-[13px] text-emerald-600 tracking-wide font-medium">
            Secure • Verified • Fast Payments
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Reusable Detail Row (Light Mode) ---
const DetailRow = ({ label, value, onCopy, onToggle, isHidden }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-[#F0F0F0] last:border-0">
    <span className="text-[12px] uppercase tracking-wider text-[#707A8A] font-medium">{label}</span>
    <div className="flex items-center gap-2">
      {onToggle && (
        <button
          onClick={onToggle}
          className="p-1 text-[#C5C8CE] hover:text-[#707A8A] rounded transition-colors"
          aria-label={isHidden ? 'Show' : 'Hide'}
        >
          {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      )}
      <span className="text-[15px] font-medium text-[#1E2026] tabular-nums">{value}</span>
      {onCopy && (
        <button
          onClick={onCopy}
          className="p-1 text-[#C5C8CE] hover:text-[#F0B90B] rounded transition-colors"
          aria-label="Copy"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  </div>
);

export default PaymentReceipt;