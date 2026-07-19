import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCopy, FiCheckCircle } from "react-icons/fi";
import { UserContext } from "./UserContext/UserContext";
import { AlertTriangle, QrCode, Send, Hash, Wallet, LogOut } from 'lucide-react';

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
      .then(response => {
        if (response.data.userId) setUid(response.data.userId);
        else navigate('/');
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => {
    if (!uid) return;
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/bep20active`)
      .then(response => {
        if (response.data.success) {
          setAccount(response.data.account);
          return axios.get(`${import.meta.env.VITE_API_BASE_URL}/settings`);
        }
      })
      .then(feeResponse => {
        setUsdFee(parseInt(feeResponse.data.fee) || 0);
      })
      .catch(console.error);
  }, [uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const txIdRegex = /^0x[a-fA-F0-9]{64}$/;
    if (!txIdRegex.test(trx_id)) {
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
      setAddressError(
        error.response?.data?.error || 
        error.response?.data?.message || 
        "Network error"
      );
    } finally {
      setIsValidating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(account.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111827]">
        <div className="animate-spin rounded-full h-6 w-6 border-t-[#D4AF37] bg-gradient-to-r from-[#D4AF37] to-[#c69c2e]" />
      </div>
    );
  }

const handleLogout = () => {
  // clear auth data
  localStorage.removeItem("token");
  sessionStorage.clear();
logout();
  // redirect
  navigate("/");
};
  return (
    <div className="min-h-screen bg-[#111827] p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-center mb-2">
          <img src="./logo.png" alt="Logo" width={120} className="mb-2" />
        </div>

        {/* Compact QR + Details Layout - No Borders */}
        <div className="bg-[#19202a] rounded-2xl overflow-hidden shadow-lg shadow-[#D4AF37]/5">
          {/* Network Banner */}
          <div className="bg-gradient-to-r from-amber-900/30 to-amber-800/30 px-3 py-2 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-amber-400" />
            <span className="text-amber-300 font-semibold text-sm">BEP20 Network</span>
          </div>

          {/* Main Content: QR Left, Details Right */}
          <div className="p-4">
            <div className="flex gap-4">
              {/* QR Code - Left (Slightly Bigger) */}
              <div className="flex-shrink-0">
                {account.qrCode ? (
                  <img 
                    src={`${import.meta.env.VITE_API_BASE_URL}/storage/${account.qrCode.replace('/uploads/', '')}`} 
                    alt="QR"
                    className="w-32 h-32 rounded-xl bg-[#1c2a3a] shadow-lg shadow-[#D4AF37]/10"
                  />
                ) : (
                  <div className="w-32 h-32 bg-[#1c2a3a] rounded-xl flex items-center justify-center shadow-lg shadow-[#D4AF37]/10">
                    <QrCode className="w-8 h-8 text-[#D4AF37]/60" />
                  </div>
                )}
              </div>

              {/* Details - Right */}
              <div className="flex-1 min-w-0 space-y-3">
                {/* Amount - Better Visibility */}
                <div className="text-center p-3 bg-gradient-to-br from-[#1c2a3a] to-[#1a2530] rounded-xl">
                  <p className="text-amber-300/90 text-sm font-medium">Send exactly</p>
                  <p className="text-white font-bold text-xl mt-1 drop-shadow-lg">{usdFee} USDT</p>
                </div>

                {/* Address - Better Visibility */}
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-amber-300/90 text-sm font-medium flex items-center gap-1.5">
                      <Hash className="w-4 h-4" />
                      Wallet Address
                    </span>
                    <button
                      onClick={copyToClipboard}
                      className="text-amber-300/70 hover:text-amber-300 transition-colors p-1 -mt-0.5 rounded-lg hover:bg-[#1c2a3a]"
                      aria-label="Copy address"
                    >
                      {copied ? (
                        <FiCheckCircle className="text-emerald-400 w-4 h-4" />
                      ) : (
                        <FiCopy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div 
                    onClick={copyToClipboard}
                    className="font-mono text-sm leading-relaxed text-amber-200/90 bg-[#1c2a3a] p-3 rounded-xl break-all cursor-pointer hover:bg-[#202d3a] transition-colors"
                    title="Click to copy"
                  >
                    {account.address || 'Loading...'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form - No Borders */}
        <div className="mt-4 bg-[#19202a] rounded-2xl p-4 shadow-lg shadow-[#D4AF37]/5">
          {isRejected && (
            <div className="p-3 mb-4 bg-rose-900/30 rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
              <p className="text-rose-300 text-sm">
                Payment rejected. Use correct HASH and exact amount.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-amber-300/90 text-sm mb-2 flex items-center gap-1.5 font-medium">
                <Hash className="w-4 h-4" />
                BEP20 Transaction ID
              </label>
              <input
                type="text"
                value={trx_id}
                onChange={(e) => {
                  setTrxId(e.target.value);
                  setAddressError("");
                }}
                className="w-full px-4 py-3 bg-[#1c2a3a] rounded-xl text-white placeholder-amber-300/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 transition-all"
                placeholder="0x65fae...ec8f6"
                required
              />
              {addressError && (
                <p className="text-rose-400 text-sm mt-2 font-medium">{addressError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isValidating}
              className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                isValidating
                  ? 'bg-[#1c2a3a] text-amber-300/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#D4AF37] to-[#c69c2e] text-gray-900 shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/35 hover:from-[#e8c04e] hover:to-[#d4af37] active:scale-[0.98]'
              }`}
            >
              {isValidating ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Confirm Payment
                </>
              )}
            </button>
          </form>
        </div>

        {/* Independent Logout Button - Outside Form */}
        <button 
          onClick={handleLogout} 
          type="button"
          className="w-full mt-3 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-rose-600 to-rose-700 text-white flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20 hover:from-rose-500 hover:to-rose-600 active:scale-[0.98] transition-all"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>

        {/* Footer */}
        <div className="mt-6 text-center text-amber-300/70 text-sm">
          <p className="font-medium">Allow 10–30 minutes for confirmation</p>
          <p className="mt-1 text-amber-300/50">Contact support if issues persist</p>
        </div>
      </div>
    </div>
  );
};

export default Payment;