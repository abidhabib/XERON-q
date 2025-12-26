import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCopy, FiCheckCircle } from "react-icons/fi";
import { UserContext } from "./UserContext/UserContext";
import { AlertTriangle, QrCode, Send, Hash, Wallet } from 'lucide-react';

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
  const { isRejected,logout } = useContext(UserContext);

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
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#D4AF37]/30 border-t-[#D4AF37]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827] p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
<div className="flex items-center justify-center ">
               <img src="./logo.png" alt="Logo" width={120} className="mb-6" />

</div>
        {/* Compact QR + Details Layout */}
        <div className="bg-[#19202a] rounded-2xl overflow-hidden">
          {/* Network Banner */}
          <div className="bg-gradient-to-r from-amber-900/20 to-amber-800/20 px-3 py-2 flex items-center gap-2">
            <Wallet className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-400  underline font-medium">BEP20 Network</span>
          </div>

          {/* Main Content: QR Left, Details Right */}
          <div className="p-3">
            <div className="flex gap-3">
              {/* QR Code - Left */}
              <div className="flex-shrink-0">
                {account.qrCode ? (
                  <img 
                    src={`${import.meta.env.VITE_API_BASE_URL}/storage/${account.qrCode.replace('/uploads/', '')}`} 
                    alt="QR"
                    className="w-24 h-24 rounded-lg border border-[#26303b]"
                  />
                ) : (
                  <div className="w-24 h-24 bg-[#1c2a3a] rounded-lg flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-[#D4AF37]/40" />
                  </div>
                )}
              </div>

              {/* Details - Right */}
              <div className="flex-1 min-w-0 space-y-3">
                {/* Amount */}
                <div className="text-center p-2 bg-[#1c2a3a] rounded-lg">
                  <p className="text-[#D4AF37]/70 text-xs">Send exactly</p>
                  <p className="text-white font-bold text-lg mt-0.5">{usdFee} USDT</p>
                </div>

                {/* Address */}
                <div>
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-[#D4AF37]/70 text-xs flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      Wallet
                    </span>
                    <button
                      onClick={copyToClipboard}
                      className="text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors p-0.5 -mt-0.5"
                    >
                      {copied ? (
                        <FiCheckCircle className="text-emerald-400 w-3 h-3" />
                      ) : (
                        <FiCopy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-[10px] leading-tight text-[#D4AF37]/80 bg-[#1c2a3a] p-2 rounded-lg break-all">
                    {account.address || 'Loading...'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="mt-4 bg-[#19202a] rounded-2xl p-3">
          {isRejected && (
            <div className="p-2.5 mb-3 bg-rose-900/20 rounded-lg flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 mt-0.5 flex-shrink-0" />
              <p className="text-rose-400 text-xs">
                Payment rejected. Use correct HASH and amount.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[#D4AF37]/80 text-xs mb-1.5 flex items-center gap-1">
                <Hash className="w-3 h-3" />
                BEP20 Transaction ID
              </label>
              <input
                type="text"
                value={trx_id}
                onChange={(e) => {
                  setTrxId(e.target.value);
                  setAddressError("");
                }}
                className="w-full px-3 py-2 bg-[#1c2a3a] rounded-lg text-white placeholder-[#D4AF37]/40 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                placeholder="0x65fae...ec8f6"
                required
              />
              {addressError && (
                <p className="text-rose-400 text-xs mt-1">{addressError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isValidating}
              className={`w-full py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-1.5 ${
                isValidating
                  ? 'bg-[#1c2a3a] text-[#D4AF37]/50'
                  : 'bg-gradient-to-r from-[#D4AF37] to-[#c69c2e] text-gray-900'
              }`}
            >
              {isValidating ? (
                <>
                  <div className="w-3 h-3 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Confirm Payment
                </>
              )}
            </button>
            <button onClick={logout} className="w-full py-2 rounded-lg font-medium text-sm mt-2 bg-red-600 text-white flex items-center justify-center gap-1.5 hover:bg-red-700 transition-colors">
              Logout
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-[#D4AF37]/60 text-[10px]">
          <p>Allow 10–30 minutes for confirmation</p>
          <p className="mt-0.5">Contact support if issues persist</p>
        </div>
      </div>
    </div>
  );
};

export default Payment;