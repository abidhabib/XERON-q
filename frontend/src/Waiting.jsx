import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "./UserContext/UserContext";
import { RotateCw, LogOut, ShieldCheck, Hash, CheckCircle2, Loader2 } from 'lucide-react';

const Waiting = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { paymentOk, approved, isRejected, fetchUserData, trx_id, logout } = useContext(UserContext);
  
  const [displayText, setDisplayText] = useState("");
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Premium phrases with better variety
  const phrases = [
    "Securing your vault...",
    "Finalizing golden seal...",
    "Verifying blockchain integrity...",
    "Preparing your access...",
    "Encrypting your credentials..."
  ];

  // Typewriter effect
  useEffect(() => {
    fetchUserData().then(() => setLoading(false));
  }, []);

  useEffect(() => {
    const typeSpeed = isDeleting ? 25 : 70;
    const currentPhrase = phrases[currentPhraseIndex];

    if (!isDeleting) {
      if (displayText.length < currentPhrase.length) {
        const timeout = setTimeout(() => {
          setDisplayText(currentPhrase.substring(0, displayText.length + 1));
        }, typeSpeed);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => setIsDeleting(true), 1800);
        return () => clearTimeout(timeout);
      }
    } else {
      if (displayText.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayText(currentPhrase.substring(0, displayText.length - 1));
        }, typeSpeed);
        return () => clearTimeout(timeout);
      } else {
        setIsDeleting(false);
        setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
      }
    }
  }, [displayText, isDeleting, currentPhraseIndex]);

  // Navigation logic
  useEffect(() => {
    if (!loading) {
      if (isRejected === 1 || paymentOk === 0) {
        navigate("/payment");
      } else if (approved === 1) {
        navigate("/wallet-page");
      }
    }
  }, [isRejected, approved, paymentOk, navigate, loading]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0d121c] via-[#111827] to-[#0a0f1a] flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-b-[#D4AF37]/40 animate-spin animation-delay-150" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d121c] via-[#111827] to-[#0a0f1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Header - Premium Vault Concept */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-900/30 to-amber-800/30 mb-4 shadow-lg shadow-[#D4AF37]/10">
            <ShieldCheck className="w-7 h-7 text-[#D4AF37]" />
          </div>
          
          <h1 className="text-lg font-semibold text-white mb-2 min-h-[28px] tracking-tight">
            {displayText}
            <span className="ml-1 w-0.5 h-5 bg-gradient-to-b from-[#D4AF37] to-transparent inline-block animate-pulse align-middle rounded-full"></span>
          </h1>
          
          <p className="text-amber-300/80 text-sm font-medium">
            Your transaction is being secured
          </p>
        </div>

        {/* Transaction ID Card - No Borders, Subtle Shadow */}
        {trx_id && (
          <div className="bg-[#19202a] rounded-2xl p-4 mb-5 shadow-lg shadow-[#D4AF37]/5">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300/90 text-xs font-semibold uppercase tracking-wide">Transaction Hash</span>
            </div>
            <p className="font-mono text-sm text-amber-100/90 break-all bg-[#1c2a3a] p-3 rounded-xl">
              {trx_id}
            </p>
          </div>
        )}

        {/* Status Timeline - Enhanced Visibility */}
        <div className="space-y-4 mb-7">
          {/* Step 1: Payment Confirmed */}
          <div className="flex items-start gap-3 p-3 bg-[#19202a] rounded-xl shadow-sm shadow-[#D4AF37]/3">
            <div className="mt-0.5 relative">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30" />
              <CheckCircle2 className="absolute -inset-1 w-4 h-4 text-emerald-500/20" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Payment Received</p>
              <p className="text-amber-300/70 text-xs mt-0.5">
                USDT detected on BEP20 network
              </p>
            </div>
          </div>

          {/* Step 2: Security Verification (Active) */}
          <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-[#19202a] to-[#1c2a3a] rounded-xl shadow-lg shadow-[#D4AF37]/8">
            <div className="relative mt-0.5">
              <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Security Verification</p>
              <p className="text-amber-300/80 text-xs mt-0.5 font-medium">
                Final validation in progress...
              </p>
            </div>
          </div>

          {/* Step 3: Access Granted (Pending) */}
          <div className="flex items-start gap-3 p-3 bg-[#19202a]/50 rounded-xl opacity-60">
            <div className="mt-0.5 w-2 h-2 rounded-full bg-[#D4AF37]/30" />
            <div>
              <p className="text-amber-300/60 text-sm font-medium">Access Granted</p>
              <p className="text-amber-300/40 text-xs mt-0.5">
                Wallet activation pending
              </p>
            </div>
          </div>
        </div>

        {/* Support Footer - Better Visibility */}
        <div className="mb-6 text-center">
          <p className="text-amber-300/70 text-sm font-medium">
            Verification completes in 10–30 minutes
          </p>
          <p className="text-amber-300/50 text-sm mt-1">
            Need help? <a href="mailto:support@yourplatform.com" className="text-[#D4AF37] hover:text-[#e8c04e] font-semibold transition-colors">Contact Support</a>
          </p>
        </div>

        {/* Action Buttons - Compact & Premium */}
        <div className="space-y-2.5">
          <button
            onClick={() => window.location.reload()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#19202a] hover:bg-[#1c2a3a] text-amber-300 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-[#D4AF37]/5 hover:shadow-[#D4AF37]/10 active:scale-[0.98]"
          >
            <RotateCw className="w-4 h-4" />
            Refresh Status
          </button>

          {/* Independent Logout Button - Visually Distinct */}
          <button
            onClick={() => setShowLogoutConfirm(!showLogoutConfirm)}
            type="button"
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-rose-600/90 to-rose-700/90 hover:from-rose-500 hover:to-rose-600 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-rose-900/30 hover:shadow-rose-900/50 active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>

          {/* Optional: Confirm Logout (Subtle) */}
          {showLogoutConfirm && (
            <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium text-sm transition-all"
              >
                Yes, Logout
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 bg-[#1c2a3a] hover:bg-[#203040] text-amber-300 rounded-xl font-medium text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Decorative Bottom Accent */}
        <div className="mt-8 flex justify-center">
          <div className="h-1 w-24 bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent rounded-full" />
        </div>

      </div>
    </div>
  );
};

export default Waiting;