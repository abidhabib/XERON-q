import { useEffect, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import { UserContext } from '../UserContext/UserContext';
import NavBar from '../NavBAr';

// ✅ Lucide Icons (clean, consistent)
import { 
  Copy, 
  CheckCircle, 
  AlertTriangle,
  ShieldCheck,
  Info,
  RotateCw
} from 'lucide-react';
import BalanceCard from './BalanceCard';

// Constants
const BEP20_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const DEBOUNCE_DELAY = 500;

const CryptoAddressForm = () => {
  const { Userid } = useContext(UserContext);
  const [formState, setFormState] = useState({
    inputAddress: '',
    savedAddress: '',
    isDirty: false
  });
  const [toast, setToast] = useState({ show: false, message: '' });

  const [apiState, setApiState] = useState({
    isLoading: false,
    isSubmitting: false,
    error: null
  });
  const [validation, setValidation] = useState({
    isValid: true,
    message: ''
  });
  
  const validateAddress = useCallback((address) => {
    const isValid = BEP20_PATTERN.test(address);
    setValidation({
      isValid,
      message: isValid ? '' : 'Invalid BEP20 address format'
    });
    return isValid;
  }, []);

  useEffect(() => {
    const fetchAddress = async () => {
      setApiState(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/getCryptoAddress/${Userid}`
        );
        if (data.status === 'success' && data.addressType === 'bep20') {
          setFormState(prev => ({
            ...prev,
            savedAddress: data.address || '',
            isDirty: false
          }));
        }
      } catch (err) {
        setApiState(prev => ({ ...prev, error: 'Failed to load saved address' }));
      } finally {
        setApiState(prev => ({ ...prev, isLoading: false }));
      }
    };
    if (Userid) fetchAddress();
  }, [Userid]);

  useEffect(() => {
    if (!formState.isDirty) return;
    const timerId = setTimeout(() => validateAddress(formState.inputAddress), DEBOUNCE_DELAY);
    return () => clearTimeout(timerId);
  }, [formState.inputAddress, formState.isDirty, validateAddress]);

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateAddress(formState.inputAddress)) return;

  setApiState({ isLoading: false, isSubmitting: true, error: null });

  try {
    const { data } = await axios.put(
      `${import.meta.env.VITE_API_BASE_URL}/updateCryptoAddress`,
      { address: formState.inputAddress, addressType: 'bep20', userId: Userid }
    );

    if (data.success) {
      setFormState(prev => ({ inputAddress: '', savedAddress: prev.inputAddress, isDirty: false }));
      
      // ✅ Show success toast
      setToast({ show: true, message: 'Address saved successfully' });
      setTimeout(() => setToast({ show: false, message: '' }), 2500);
    }
  } catch (err) {
    const errorMessage = err.response?.data?.message || 'Failed to save address';
    setApiState(prev => ({ ...prev, error: errorMessage }));
  } finally {
    setApiState(prev => ({ ...prev, isSubmitting: false }));
  }
};

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formState.savedAddress);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setFormState(prev => ({ ...prev, inputAddress: value, isDirty: true }));
  };

  const isFormValid = validation.isValid && formState.inputAddress.trim();
  const showSuccess = !formState.isDirty && formState.savedAddress;

  return (
    <div className="flex flex-col min-h-screen bg-[#111827]">
     <div className="bg-[#111827] ">
        <BalanceCard />
      </div>

      {/* Main Content */}
      <div className="px-2 pb-6 pt-2 flex-1">
        <div className="bg-[#19202a] rounded-2xl py-4 px-2">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-[#D4AF37] flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">BEP20</span>
            </div>
            <div>
              <h2 className="text-white text-base font-semibold"> Your BEP20 Wallet Address</h2>
              <p className="text-[#D4AF37]/70 text-xs">Binance Smart Chain</p>
            </div>
          </div>

          {/* Loading */}
          {apiState.isLoading && (
            <div className="mb-5 flex justify-center py-6">
              <RotateCw className="w-6 h-6 text-[#D4AF37] animate-spin" />
            </div>
          )}

          {/* Saved Address */}
          {showSuccess && (
            <div className="mb-5 bg-[#1c2a3a] rounded-xl p-3  ">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <p className="text-white text-sm font-medium">Saved Address</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400">
                  Active
                </span>
              </div>
              
              <div className="mt-2.5 flex items-center gap-2">
                <span className="text-[#D4AF37]/80 text-xs font-mono break-all flex-1">
                  {formState.savedAddress}
                </span>
                <button
                  onClick={copyToClipboard}
                  className="text-[#D4AF37]/60 hover:text-[#D4AF37] p-1 transition-colors"
                  aria-label="Copy address"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="bep20-address" 
                className="block text-[#D4AF37]/80 text-sm mb-2"
              >
                BEP20 Wallet Address
              </label>
              <div className="relative">
                <input
                  id="bep20-address"
                  type="text"
                  value={formState.inputAddress}
                  onChange={handleInputChange}
                  placeholder="0x..."
                  aria-invalid={!validation.isValid}
                  className={`w-full px-3 py-3 bg-[#1c2a3a] rounded-xl text-white placeholder-[#D4AF37]/40 text-sm focus:outline-none transition-all ${
                    validation.isValid
                      ? 'focus:ring-1 focus:ring-[#D4AF37]'
                      : 'focus:ring-1 focus:ring-rose-500'
                  }`}
                />
                
                {!validation.isValid && formState.isDirty && (
                  <p className="mt-2 text-rose-400 text-xs flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {validation.message}
                  </p>
                )}
              </div>
              
              <div className="mt-3 bg-[#1c2a3a] rounded-xl p-3  ">
                <div className="flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[#D4AF37] text-xs font-medium">Format</p>
                    <p className="text-[#D4AF37]/70 text-xs mt-0.5">
                      0x + 40 hex characters
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={apiState.isSubmitting || !isFormValid}
              className={`w-full py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                apiState.isSubmitting
                  ? 'bg-[#1c2a3a] text-[#D4AF37]/70 cursor-not-allowed'
                  : isFormValid
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#c69c2e] text-gray-900 shadow-[0_2px_6px_rgba(212,175,55,0.2)] hover:from-[#e8c04e] hover:to-[#d4af37]'
                    : 'bg-[#1c2a3a] text-[#D4AF37]/50 cursor-not-allowed'
              }`}
            >
              {apiState.isSubmitting ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {formState.savedAddress ? 'Update Address' : 'Save Address'}
                </>
              )}
            </button>

            {apiState.error && (
              <div className="p-3 bg-rose-900/20 border border-rose-800/30 rounded-xl">
                <p className="text-center text-rose-400 text-sm flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {apiState.error}
                </p>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="mt-5 pt-3 border-t border-[#26303b] text-center">
            <div className="flex items-center justify-center gap-1.5 text-[#D4AF37]/70 text-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>AES-256 encrypted</span>
            </div>
          </div>
        </div>
      </div>
      {/* ✅ Custom Success Toast */}
{toast.show && (
  <div className="fixed top-15 left-1/2 right-2 transform -translate-x-1/2 z-50">
    <div className="flex items-center gap-2 px-4 py-2.5 bg-[#c9a030]/30 backdrop-blur-sm rounded shadow-lg animate-fadeInOut">
      <CheckCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
      <span className="text-white text-sm font-medium">{toast.message}</span>
    </div>
  </div>
)}
    </div>
  );
};

export default CryptoAddressForm;