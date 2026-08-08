import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCopy, FiCheckCircle } from "react-icons/fi";
import { UserContext } from "./UserContext/UserContext";
import { AlertTriangle, QrCode, Send, Wallet, LogOut, Clock, CheckCircle2 } from 'lucide-react';

const HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;

const Payment = () => {
  const navigate = useNavigate();
  const [account, setAccount] = useState({ address: "", qrCode: "" });
  const [trx_id, setTrxId] = useState("");
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState(null);
  const [usdFee, setUsdFee] = useState(0);
  const [copied, setCopied] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const { isRejected, logout } = useContext(UserContext);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/getUserIdFromSession`, { withCredentials: true })
      .then((response) => {
        if (response.data.userId) setUid(response.data.userId);
        else navigate('/');
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => {
    if (!uid) return;
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/bep20active`)
      .then((response) => {
        if (response.data.success) {
          setAccount(response.data.account);
          return axios.get(`${import.meta.env.VITE_API_BASE_URL}/settings`);
        }
      })
      .then((feeResponse) => {
        if (feeResponse) setUsdFee(parseInt(feeResponse.data.fee) || 0);
      })
      .catch(console.error);
  }, [uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!HASH_REGEX.test(trx_id)) {
      setAddressError("Invalid BEP20 transaction ID");
      return;
    }
    setIsValidating(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/payment`,
        { trx_id, id: uid },
        { withCredentials: true }
      );
      if (response.data.status === 'success') {
        window.location.replace('/waiting');
      } else {
        setAddressError(response.data.error || "Payment verification failed");
      }
    } catch (error) {
      setAddressError(error.response?.data?.error || error.response?.data?.message || "Network error");
    } finally {
      setIsValidating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(account.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.clear();
    logout();
    navigate("/");
  };

  const hashTouched = trx_id.length > 0;
  const hashValid = HASH_REGEX.test(trx_id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#161618]">
        <div className="w-7 h-7 border-2 border-[#2E2E33] border-t-[#C6A15B] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#161618]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@500;600&family=Inter:wght@400;500;600;700&display=swap');
        .fd { font-family: 'Cormorant', serif; }
        .fi { font-family: 'Inter', sans-serif; }
        .tnum { font-variant-numeric: tabular-nums; }
        @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .rise { animation: rise 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes scan {
          0% { top: 8%; opacity: 0; }
          12% { opacity: 1; }
          88% { opacity: 1; }
          100% { top: 92%; opacity: 0; }
        }
        .scan-line {
          position: absolute; left: 8%; right: 8%; height: 2px; border-radius: 9999px;
          background: rgba(198,161,91,0.75);
          box-shadow: 0 0 10px rgba(198,161,91,0.6);
          animation: scan 2.8s ease-in-out infinite;
        }
        @keyframes stepPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(198,161,91,0.4); }
          50% { box-shadow: 0 0 9px 1px rgba(198,161,91,0.55); }
        }
        .step-active { animation: stepPulse 2s ease-in-out infinite; }
        @keyframes amountBreathe {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.82; }
        }
        .amount-breathe { animation: amountBreathe 3s ease-in-out infinite; }
      `}</style>

      <main className="min-h-screen flex items-center justify-center px-4 py-10">
        <div className="relative w-full max-w-md">

          <div className="pointer-events-none absolute inset-x-0 -top-6 h-64"
            style={{ background: 'radial-gradient(70% 100% at 50% 0%, rgba(198,161,91,0.06), transparent 70%)' }} />

          {/* Onboarding header */}
          <div className="rise relative flex flex-col items-center text-center">
            <div className="w-11 h-11 rounded-xl bg-[#212125] ring-1 ring-[#C6A15B]/15 flex items-center justify-center p-2">
              <img src="./logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>

            {/* step indicator */}
            <div className="flex items-center gap-1.5 mt-5">
              <span className="w-6 h-1 rounded-full bg-[#C6A15B]" />
              <span className="step-active w-6 h-1 rounded-full bg-[#C6A15B]" />
              <span className="w-6 h-1 rounded-full bg-[#212125]" />
            </div>
            <p className="fi text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[#6F6F76] mt-2">Step 2 of 3 · Payment</p>

            <h1 className="fd text-[26px] sm:text-[28px] font-medium text-[#EDEDEE] leading-tight mt-3">Activate your account</h1>
            <p className="fi text-[13px] text-[#A0A0A6] mt-1 max-w-[280px]">Send the activation fee to unlock your wallet</p>
          </div>

          {/* Payment panel */}
          <div className="rise relative rounded-2xl bg-[#1B1B1E] ring-1 ring-white/[0.04] p-4 mt-5" style={{ animationDelay: '0.06s' }}>
            {/* network */}
            <div className="flex items-center justify-center gap-1.5">
              <Wallet size={13} className="text-[#C6A15B]" strokeWidth={2} />
              <span className="fi text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C6A15B]">BEP20 · Binance Smart Chain</span>
            </div>

            {/* QR with scanner frame */}
            <div className="flex justify-center mt-5">
              <div className="relative">
                <div className="relative bg-white  rounded-xl">
                  {account.qrCode ? (
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL}/storage/${account.qrCode.replace('/uploads/', '')}`}
                      alt="Payment QR"
                      className="w-32 h-32 rounded-md object-contain"
                    />
                  ) : (
                    <div className="w-32 h-32 flex items-center justify-center">
                      <QrCode className="w-8 h-8 text-[#9A9A9A]" />
                    </div>
                  )}
                  <span className="scan-line" />
                </div>
                <span className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-2 border-l-2 border-[#C6A15B] rounded-tl-lg" />
                <span className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-2 border-r-2 border-[#C6A15B] rounded-tr-lg" />
                <span className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-2 border-l-2 border-[#C6A15B] rounded-bl-lg" />
                <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-2 border-r-2 border-[#C6A15B] rounded-br-lg" />
              </div>
            </div>

            {/* amount */}
            <div className="text-center mt-4">
              <p className="fi text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6F6F76]">Send exactly</p>
              <p className="amount-breathe tnum text-[30px] font-semibold text-[#EDEDEE] mt-1 leading-none">
                {usdFee} <span className="text-[#C6A15B] text-[17px] font-semibold">USDT</span>
              </p>
            </div>

            {/* address */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="fi text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6F6F76]">Wallet address</span>
                <button onClick={copyToClipboard} className="fi flex items-center gap-1 text-[11px] font-medium text-[#6F6F76] hover:text-[#C6A15B] transition-colors" aria-label="Copy address">
                  {copied ? <FiCheckCircle className="w-3.5 h-3.5 text-[#8FC7A0]" /> : <FiCopy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div
                onClick={copyToClipboard}
                className="fi font-mono text-[11.5px] leading-relaxed text-[#A0A0A6] bg-[#161618] ring-1 ring-white/[0.04] p-3 rounded-xl break-all cursor-pointer hover:ring-[#C6A15B]/25 transition-all"
                title="Click to copy"
              >
                {account.address || 'Loading…'}
              </div>
            </div>
          </div>

          {/* Rejected warning */}
          {isRejected && (
            <div className="rise relative flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-[#241619] ring-1 ring-[#E2A896]/20 mt-4">
              <AlertTriangle size={16} className="text-[#E2A896] flex-shrink-0 mt-[1px]" />
              <p className="fi text-[12.5px] text-[#E2A896] leading-snug">Payment rejected. Use the correct hash and the exact amount.</p>
            </div>
          )}

          {/* Confirm form */}
          <form onSubmit={handleSubmit} className="rise relative mt-4" style={{ animationDelay: '0.1s' }}>
            <label className="fi block text-[13px] font-medium text-[#A0A0A6] mb-2">BEP20 Transaction ID</label>
            <input
              type="text"
              value={trx_id}
              onChange={(e) => { setTrxId(e.target.value); setAddressError(""); }}
              placeholder="0x65fae…ec8f6"
              spellCheck={false}
              className={`fi w-full h-12 px-4 text-[13px] font-mono text-[#EDEDEE] bg-[#212125] rounded-xl outline-none transition-all placeholder:text-[#57575D] focus:bg-[#27272C] ${
                hashTouched && !hashValid ? 'ring-2 ring-[#E2A896]/40' : 'focus:ring-2 focus:ring-[#C6A15B]/40'
              }`}
              required
            />
            {hashTouched && !hashValid && (
              <p className="fi text-[11px] text-[#E2A896] mt-1.5">A BEP20 hash is 66 characters and starts with 0x.</p>
            )}
            {hashValid && (
              <p className="fi flex items-center gap-1 text-[11px] text-[#8FC7A0] mt-1.5">
                <CheckCircle2 size={11} /> Valid format
              </p>
            )}
            {addressError && (
              <p className="fi text-[12px] text-[#E2A896] mt-2">{addressError}</p>
            )}

            <button
              type="submit"
              disabled={isValidating}
              className={`fi w-full h-12 rounded-xl mt-4 flex items-center justify-center gap-2 text-[14px] font-semibold transition-all active:scale-[0.99] ${
                isValidating
                  ? 'bg-[#A9884A] text-[#161618] cursor-not-allowed'
                  : 'bg-[#C6A15B] text-[#161618] hover:bg-[#D8BA7C] shadow-[0_10px_28px_rgba(198,161,91,0.14)]'
              }`}
            >
              {isValidating ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#161618]/25 border-t-[#161618] rounded-full animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  <Send size={15} strokeWidth={2} /> Confirm payment
                </>
              )}
            </button>
          </form>

          {/* Logout */}
          <button
            onClick={handleLogout}
            type="button"
            className="rise relative fi w-full mt-3 h-11 rounded-xl bg-[#1B1B1E] ring-1 ring-white/[0.05] text-[#A0A0A6] hover:text-[#E2A896] hover:ring-[#E2A896]/25 flex items-center justify-center gap-2 text-[13px] font-medium transition-all"
            style={{ animationDelay: '0.14s' }}
          >
            <LogOut size={15} /> Log out
          </button>

          {/* Footer */}
          <div className="rise relative text-center mt-6" style={{ animationDelay: '0.18s' }}>
            <p className="fi flex items-center justify-center gap-1.5 text-[11.5px] text-[#6F6F76]">
              <Clock size={12} className="text-[#C6A15B]" /> Allow 10–30 minutes for confirmation
            </p>
            <p className="fi text-[11px] text-[#57575D] mt-1.5">Contact support if the issue persists</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Payment;