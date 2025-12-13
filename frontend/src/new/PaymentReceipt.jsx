import React from 'react';
import { X, Copy, Eye, EyeOff } from 'lucide-react';
import Lottie from 'react-lottie-player';

// Adjust path if needed — using your specified path
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

  // Status config
  const getStatusConfig = () => {
    switch (tx.approved) {
      case 'approved':
        return { label: 'Completed', color: 'text-emerald-600', anim: checkmarkAnimation };
      case 'pending':
        return { label: 'Processing', color: 'text-amber-600', anim: pendingAnimation };
      default:
        return { label: 'Rejected', color: 'text-rose-600', anim: RejectAnimation };
    }
  };

  const { label: statusLabel, color: statusColor, anim: animation } = getStatusConfig();

  return (
    <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl overflow-hidden max-h-[85vh] bg-white">
      {/* Top Handle Bar */}
      <div className="flex justify-center pt-3 pb-2">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
      </div>

      <div className="px-4 py-3 overflow-y-auto max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-[15px] font-semibold text-gray-900 tracking-tight">Payment Receipt</h1>
          <button
            onClick={() => setSelectedTransaction(null)}
            className="p-1.5 -m-1.5 text-gray-400 hover:text-gray-700 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-gray-500 mb-3">Receipt #{idStr}</p>

        {/* Status Animation + Label */}
        <div className="flex flex-col items-center my-3">
          <div className="w-24 h-24 flex items-center justify-center mb-2">
            <Lottie loop={false} animationData={animation} play style={{ width: 96, height: 96 }} />
          </div>
          <span className={`text-[13px] font-medium ${statusColor}`}>{statusLabel}</span>
        </div>

        {/* Amount – Hero */}
        <div className="text-center my-3">
          <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium mb-1">Total Paid</p>
          <p className="text-[22px] font-bold text-gray-900">
            ${removeTrailingZeros(Number(tx.amount || 0))}
          </p>
        </div>

        {/* Details Section */}
        <div className="my-3 space-y-2.5">
          <DetailRow label="Transaction ID" value={shortId} onCopy={() => copyToClipboard(tx.id)} />
          <DetailRow label="Date & Time" value={tx.date ? formatDateTime(tx.date) : '—'} />
          <DetailRow label="Wallet" value={tx.bank_name || 'Main Wallet'} />
          <DetailRow
            label="Address"
            value={formatWalletAddress(tx.account_number)}
            onToggle={toggleHideNumber}
            isHidden={hideNumber}
            onCopy={() => copyToClipboard(tx.account_number)}
          />
        </div>

        {/* Fee & Total */}
        <div className="pt-3 pb-2 border-t border-gray-100/40 my-2">
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-[11px] uppercase tracking-wider text-gray-500">Processing Fee</span>
            <span className="text-[13px] font-medium text-gray-900">
              ${removeTrailingZeros(Number(tx.fee || 0))}
            </span>
          </div>
          <div className="flex justify-between items-baseline mt-1">
            <span className="text-[11px] uppercase tracking-wider text-gray-500">Grand Total</span>
            <span className="text-[16px] font-bold text-gray-900">
              ${removeTrailingZeros((Number(tx.amount || 0) + Number(tx.fee || 0)))}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-3 mb-4">
          <p className="text-[10px] text-gray-500 tracking-wide">
            Secure • Verified • {tx.date ? new Date(tx.date).getFullYear() : ''}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pb-2">
          <button
            onClick={() => setSelectedTransaction(null)}
            className="flex-1 py-2 text-[13px] font-medium text-gray-700 bg-gray-100/70 rounded-xl hover:bg-gray-200/60 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {/* implement share */}}
            className="flex-1 py-2 text-[13px] font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Reusable Detail Row with Separator ---
const DetailRow = ({ label, value, onCopy, onToggle, isHidden }) => (
  <div className="flex justify-between items-center py-1.5 border-b border-gray-100/30 last:border-0">
    <span className="text-[11px] uppercase tracking-wider text-gray-500">{label}</span>
    <div className="flex items-center gap-1.5">
      {onToggle && (
        <button
          onClick={onToggle}
          className="p-0.5 text-gray-400 hover:text-gray-600 rounded"
          aria-label={isHidden ? 'Show' : 'Hide'}
        >
          {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        </button>
      )}
      <span className="text-[14px] font-medium text-gray-900 tabular-nums">{value}</span>
      {onCopy && (
        <button
          onClick={onCopy}
          className="p-0.5 text-gray-400 hover:text-gray-600 rounded"
          aria-label="Copy"
        >
          <Copy className="w-3 h-3" />
        </button>
      )}
    </div>
  </div>
);

export default PaymentReceipt;