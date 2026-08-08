import React from 'react';
import { X, Copy, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import Lottie from 'react-lottie-player';

import checkmarkAnimation from '../checkmark.json';
import RejectAnimation from '../reject.json';
import pendingAnimation from '../pendingAnimation.json';

/* ── Receipt line-item ── */
const DetailRow = ({ label, value, onCopy, onToggle, isHidden }) => (
  <div className="flex justify-between items-center gap-3 py-3 border-b border-white/[0.05] last:border-0">
    <span className="fi text-[10.5px] font-medium uppercase tracking-[0.12em] text-[#6F6F76] flex-shrink-0">{label}</span>
    <div className="flex items-center gap-1.5 min-w-0">
      {onToggle && (
        <button
          onClick={onToggle}
          className="p-1 text-[#6F6F76] hover:text-[#A0A0A6] transition-colors flex-shrink-0"
          aria-label={isHidden ? 'Show' : 'Hide'}
        >
          {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      )}
      <span className="fi tnum text-[13px] font-medium text-[#EDEDEE] truncate">{value}</span>
      {onCopy && (
        <button
          onClick={onCopy}
          className="p-1 text-[#6F6F76] hover:text-[#C6A15B] transition-colors flex-shrink-0"
          aria-label="Copy"
        >
          <Copy size={14} />
        </button>
      )}
    </div>
  </div>
);

const PaymentReceipt = ({ selectedTransaction, setSelectedTransaction }) => {
  const [hideNumber, setHideNumber] = React.useState(true);

  const formatDateTime = (dateString) =>
    new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

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
        return { label: 'Completed', text: 'text-[#8FC7A0]', tint: 'bg-[#8FC7A0]/10', ring: 'ring-[#8FC7A0]/20', anim: checkmarkAnimation };
      case 'pending':
        return { label: 'Processing', text: 'text-[#C6A15B]', tint: 'bg-[#C6A15B]/10', ring: 'ring-[#C6A15B]/20', anim: pendingAnimation };
      default:
        return { label: 'Rejected', text: 'text-[#E2A896]', tint: 'bg-[#E2A896]/10', ring: 'ring-[#E2A896]/20', anim: RejectAnimation };
    }
  };

  const { label: statusLabel, text: statusText, tint, ring, anim: animation } = getStatusConfig();

  return (
    <div className="absolute bottom-0 left-0 right-0 rounded-t-[24px] overflow-hidden max-h-[88vh] bg-[#1B1B1E] ring-1 ring-white/[0.06] shadow-[0_-16px_48px_rgba(0,0,0,0.5)] sheet-up">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@500;600&family=Inter:wght@400;500;600;700&display=swap');
        .fd { font-family: 'Cormorant', serif; }
        .fi { font-family: 'Inter', sans-serif; }
        .tnum { font-variant-numeric: tabular-nums; }
        @keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .sheet-up { animation: sheetUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      {/* Grabber */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 bg-[#2A2A30] rounded-full" />
      </div>

      <div className="px-4 pt-2 pb-6 overflow-y-auto max-h-[82vh]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="fd text-[20px] font-medium text-[#EDEDEE] leading-tight">Payment Receipt</h1>
            <p className="fi tnum text-[11px] text-[#6F6F76] mt-0.5">Receipt #{idStr}</p>
          </div>
          <button
            onClick={() => setSelectedTransaction(null)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6F6F76] hover:text-[#EDEDEE] hover:bg-[#212125] transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Status animation */}
        <div className="flex flex-col items-center mt-4">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center ring-1 ${tint} ${ring}`}>
            <Lottie loop={false} animationData={animation} play style={{ width: 80, height: 80 }} />
          </div>
          <span className={`fi text-[14px] font-semibold mt-3 ${statusText}`}>{statusLabel}</span>
        </div>

        {/* Amount hero */}
        <div className="text-center mt-5">
          <p className="fi text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6F6F76]">Total Paid</p>
          <p className="tnum text-[34px] font-semibold text-[#EDEDEE] mt-1.5 leading-none">
            <span className="text-[#A0A0A6] text-[22px] mr-0.5">$</span>
            {removeTrailingZeros(Number(tx.amount || 0))}
          </p>
        </div>

        {/* Details */}
        <div className="mt-5 rounded-xl bg-[#161618] px-4">
          <DetailRow label="Transaction ID" value={shortId} onCopy={() => copyToClipboard(tx.id)} />
          <DetailRow label="Date & Time" value={tx.date ? formatDateTime(tx.date) : '—'} />
          <DetailRow label="Wallet" value={tx.bank_name || 'Main Wallet'} />
          <DetailRow
            label="Address"
            value={formatWalletAddress(tx.address ? tx.address : tx.account_number)}
            onToggle={toggleHideNumber}
            isHidden={hideNumber}
            onCopy={() => copyToClipboard(tx.account_number ? tx.account_number : tx.address)}
          />
        </div>

        {/* Fee & total */}
        <div className="mt-4">
          <div className="flex justify-between items-center">
            <span className="fi text-[11px] text-[#6F6F76]">Processing Fee</span>
            <span className="tnum fi text-[13px] font-medium text-[#A0A0A6]">
              ${removeTrailingZeros(Number(tx.fee || 0))}
            </span>
          </div>
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/[0.05]">
            <span className="fi text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A0A0A6]">Grand Total</span>
            <span className="tnum text-[18px] font-semibold text-[#C6A15B]">
              ${removeTrailingZeros(Number(tx.amount || 0) + Number(tx.fee || 0))}
            </span>
          </div>
        </div>

        {/* Trust footer */}
        <div className="flex items-center justify-center gap-1.5 mt-6">
          <ShieldCheck size={12} className="text-[#C6A15B]" />
          <p className="fi text-[10.5px] text-[#6F6F76] tracking-wide">Secure · Verified · Fast payments</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceipt;