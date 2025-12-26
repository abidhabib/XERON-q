import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "./UserContext/UserContext";
import { RotateCw, LogOut, ShieldCheck, Hash } from 'lucide-react';

const Waiting = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { paymentOk, approved, isRejected, fetchUserData, trx_id, logout } = useContext(UserContext);
  
  const [displayText, setDisplayText] = useState("");
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Premium phrases
  const phrases = [
    "Securing your vault...",
    "Finalizing golden seal...",
    "Verifying blockchain integrity...",
    "Preparing your access..."
  ];

  // Typewriter effect
  useEffect(() => {
    fetchUserData().then(() => setLoading(false));
  }, []);

  useEffect(() => {
    const typeSpeed = isDeleting ? 20 : 80;
    const currentPhrase = phrases[currentPhraseIndex];

    if (!isDeleting) {
      if (displayText.length < currentPhrase.length) {
        const timeout = setTimeout(() => {
          setDisplayText(currentPhrase.substring(0, displayText.length + 1));
        }, typeSpeed);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => setIsDeleting(true), 2000);
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

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d121c] via-[#111827] to-[#0a0f1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header - Golden Vault Concept */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-900/20 to-amber-800/20 mb-4">
            <ShieldCheck className="w-8 h-8 text-[#D4AF37]" />
          </div>
          
          <h1 className="text-xl font-semibold text-white mb-2 min-h-[28px]">
            {displayText}
            <span className="ml-1 w-0.5 h-5 bg-[#D4AF37] inline-block animate-pulse align-middle"></span>
          </h1>
          
          <p className="text-[#D4AF37]/60 text-sm">
            Your transaction is being secured in the Crypto vault
          </p>
        </div>

        {/* Transaction ID Card */}
        {trx_id && (
          <div className="bg-[#19202a] rounded-2xl p-4 mb-6  ">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-[#D4AF37]/70 text-xs font-medium">Transaction ID</span>
            </div>
            <p className="font-mono text-sm text-white break-all">
              {trx_id}
            </p>
          </div>
        )}

        {/* Status Timeline */}
        <div className="space-y-5 mb-8">
          {/* Step 1: Payment Confirmed */}
          <div className="flex items-start gap-3">
            <div className="mt-1 w-1.5 h-1.5 animate-ping opacity-50 rounded-full bg-[#D4AF37]"></div>
            <div>
              <p className="text-white text-sm font-medium">Payment Confirming</p>
              <p className="text-[#D4AF37]/60 text-xs mt-1">
                Your USDT has been checking on BEP20
              </p>
            </div>
          </div>

          {/* Step 2: Security Verification (Current) */}
          <div className="flex items-start gap-3">
            <div className="relative mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/30"></div>
              <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-[#D4AF37]  opacity-50"></div>
            </div>
            <div>
              <p className="text-white text-sm font-medium">Security Verification</p>
              <p className="text-[#D4AF37]/60 text-xs mt-1">
                Final validation in progress
              </p>
            </div>
          </div>
        </div>

        {/* Support Footer */}
        <div className="mb-8 text-center text-[#D4AF37]/50 text-xs">
          <p>Verification typically completes within 10-30 minutes</p>
          <p className="mt-1">For assistance, contact <span className="text-[#D4AF37]">support@yourplatform.com</span></p>
        </div>
        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#19202a] hover:bg-[#1c2a3a] text-[#D4AF37] rounded-xl font-medium transition-all  "
          >
            <RotateCw className="w-4 h-4" />
            Check Status ! 
          </button>

        
        </div>

      </div>
    </div>
  );
};

export default Waiting;