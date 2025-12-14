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
        return { label: 'Completed', color: 'text-emerald-400', anim: checkmarkAnimation };
      case 'pending':
        return { label: 'Processing', color: 'text-[#D4AF37]', anim: pendingAnimation };
      default:
        return { label: 'Rejected', color: 'text-rose-400', anim: RejectAnimation };
    }
  };

  const { label: statusLabel, color: statusColor, anim: animation } = getStatusConfig();

  return (
    // 🔥 Dark luxury background — matches your app
    <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl overflow-hidden max-h-[85vh] bg-[#19202a] border-t border-[#26303b] shadow-2xl">
      {/* Top Handle Bar — subtle */}
      <div className="flex justify-center pt-3 pb-2">
        <div className="w-12 h-1.5 bg-[#26303b] rounded-full" />
      </div>

      <div className="px-4 py-3 overflow-y-auto max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-[16px] font-semibold text-white tracking-tight">Payment Receipt</h1>
          <button
            onClick={() => setSelectedTransaction(null)}
            className="p-1.5 -m-1.5 text-gray-400 hover:text-[#D4AF37] rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[12px] text-[#D4AF37]/70 mb-3">Receipt #{idStr}</p>

        {/* Status Animation + Label */}
        <div className="flex flex-col items-center my-3">
          <div className="w-24 h-24 flex items-center justify-center mb-2">
            <Lottie loop={false} animationData={animation} play style={{ width: 96, height: 96 }} />
          </div>
          <span className={`text-[14px] font-medium ${statusColor}`}>{statusLabel}</span>
        </div>

        {/* Amount – Hero */}
        <div className="text-center my-3">
          <p className="text-[12px] uppercase tracking-wider text-[#D4AF37]/70 font-medium mb-1">Total Paid</p>
          <p className="text-[24px] font-bold text-white">
            ${removeTrailingZeros(Number(tx.amount || 0))}
          </p>
        </div>

        {/* Details Section */}
        <div className="my-3 space-y-2.5">
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
            value={formatWalletAddress(tx.account_number)}
            onToggle={toggleHideNumber}
            isHidden={hideNumber}
            onCopy={() => copyToClipboard(tx.account_number)}
          />
        </div>

        {/* Fee & Total */}
        <div className="pt-3 pb-2 border-t border-[#26303b] my-2">
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-[12px] uppercase tracking-wider text-[#D4AF37]/70">Processing Fee</span>
            <span className="text-[14px] font-medium text-white">
              ${removeTrailingZeros(Number(tx.fee || 0))}
            </span>
          </div>
          <div className="flex justify-between items-baseline mt-1">
            <span className="text-[12px] uppercase tracking-wider text-[#D4AF37]/70">Grand Total</span>
            <span className="text-[17px] font-bold text-white">
              ${removeTrailingZeros((Number(tx.amount || 0) + Number(tx.fee || 0)))}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-3 mb-4">
          <p className="text-[13px] text-emerald-400 tracking-wide">
            Secure • Verified • Fast Payments
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Reusable Detail Row (Dark Mode) ---
const DetailRow = ({ label, value, onCopy, onToggle, isHidden }) => (
  <div className="flex justify-between items-center py-1.5 border-b border-[#26303b]/50 last:border-0">
    <span className="text-[12px] uppercase tracking-wider text-[#D4AF37]/70">{label}</span>
    <div className="flex items-center gap-1.5">
      {onToggle && (
        <button
          onClick={onToggle}
          className="p-0.5 text-[#D4AF37]/60 hover:text-[#D4AF37] rounded transition-colors"
          aria-label={isHidden ? 'Show' : 'Hide'}
        >
          {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        </button>
      )}
      <span className="text-[15px] font-medium text-white tabular-nums">{value}</span>
      {onCopy && (
        <button
          onClick={onCopy}
          className="p-0.5 text-[#D4AF37]/60 hover:text-[#D4AF37] rounded transition-colors"
          aria-label="Copy"
        >
          <Copy className="w-3 h-3" />
        </button>
      )}
    </div>
  </div>
);

export default PaymentReceipt;