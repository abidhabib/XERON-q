import axios from "axios";
import {  useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCopy, FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import { User } from "lucide-react";
import { UserContext } from "./UserContext/UserContext";

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
const {isRejected} = useContext(UserContext);

  // Only BEP20 details
 

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/getUserIdFromSession`, { withCredentials: true })
      .then(response => {
        if (response.data.userId) {
          setUid(response.data.userId);
        } else {
          navigate('/');
        }
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!uid) return;
    
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/bep20active`)
    .then(response => {
      if (response.data.success) {
        setAccount(response.data.account); // account = { address, qrCode }
        return axios.get(`${import.meta.env.VITE_API_BASE_URL}/get-fee`);
      }
      throw new Error('Failed to fetch account details');
    })
    
      .then(feeResponse => {
        if (feeResponse.data.success) {
          setUsdFee(parseInt(feeResponse.data.fee));
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }, [uid]);
console.log(usdFee);



  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate transaction ID format
    const txIdRegex = /^0x[a-fA-F0-9]{64}$/;
    if (!txIdRegex.test(trx_id)) {
      setAddressError("Invalid transaction ID format");
      return;
    }
    
    setIsValidating(true);
    
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/payment`, // Changed to match backend
        { trx_id, id: uid },
        { withCredentials: true }
      );
  
      if (response.data.status === 'success') {
        navigate('/waiting');
      } else {
        setAddressError(response.data.error || "Payment verification failed");
      }
    } catch (error) {
      console.error('Payment submission error:', error);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="mb-8 text-center">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <FiArrowLeft className="mr-2" /> Back
          </button>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Complete Payment</h1>
          <p className="text-gray-500">Send exact amount to continue</p>
        </div>

        {/* Network Information */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6 overflow-hidden">
          <div className="bg-[#19202a] p-3 text-white text-center">
            <h2 className="font-bold">BEP20 Network</h2>
            <p className="text-xs opacity-80">Only BEP20 supported at this time</p>
          </div>
          
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-500">Wallet Address</span>
              <button
                onClick={copyToClipboard}
                className="text-gray-500 hover:text-blue-600 transition-colors"
              >
                {copied ? (
                  <FiCheckCircle className="text-green-500 w-5 h-5" />
                ) : (
                  <FiCopy className="w-5 h-5" />
                )}
              </button>
            </div>
            
            <div className="font-mono text-sm text-gray-800 bg-gray-50 p-3 rounded-lg mb-4 break-all">
              {account.address}
            </div>
            
            <div className="flex justify-center mb-4">
              <img 
                       src={`${import.meta.env.VITE_API_BASE_URL}/storage/${account.qrCode.replace('/uploads/', '')}`} 
                       alt="BEP20 QR Code" 
                className="w-40 h-40 rounded-lg border border-gray-200"
              />
            </div>
            
            <div className="text-center bg-blue-50 rounded-lg py-2 px-4">
              <p className="text-sm font-medium">
                Send exactly <span className="text-blue-600 font-bold">{usdFee} USDT</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Using BEP20 network only
              </p>
            </div>
          </div>
        </div>

        {/* Payment Verification Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2 px-3">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Verify Payment</h3>
          <h2 className="text-red-500 text-xs font-semibold font-mono mb-2">{isRejected ? "Payment Rejected Try Again with correct HASH ID/Amount" : ""}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste HASH ID (BEP20)
              </label>
              <input
                type="text"
                value={trx_id}
                onChange={(e) => {
                  setTrxId(e.target.value);
                  setAddressError("");
                }}
                className="w-full p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0x65faeec26d25a73...a4785f316061ec8f6"
                required
              />
              {addressError && (
                <p className="text-red-500 text-sm mt-1">{addressError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isValidating}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white py-2 rounded-lg text-sm shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isValidating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                  <span>Verifying Payment...</span>
                </div>
              ) : (
                'Confirm Payment'
              )}
            </button>
          </form>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Allow 10-30 minutes for transaction confirmation</p>
          <p className="mt-1">Contact support if you encounter any issues</p>
        </div>
      </div>
    </div>
  );
};

export default Payment;