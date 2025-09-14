import { useEffect, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import { AiOutlineCheckCircle, AiOutlineCopy, AiOutlineWarning } from 'react-icons/ai';
import { BsShieldCheck } from 'react-icons/bs';
import { TbBrandBinance } from 'react-icons/tb';
import { UserContext } from '../UserContext/UserContext';
import NavBar from '../NavBAr';
import { FiInfo } from 'react-icons/fi';

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
  const [apiState, setApiState] = useState({
    isLoading: false,
    isSubmitting: false,
    error: null
  });
  const [validation, setValidation] = useState({
    isValid: true,
    message: ''
  });
  
  // Memoized address validation
  const validateAddress = useCallback((address) => {
    const isValid = BEP20_PATTERN.test(address);
    setValidation({
      isValid,
      message: isValid ? '' : 'Invalid BEP20 address format'
    });
    return isValid;
  }, []);

  // Fetch saved address
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
        setApiState(prev => ({
          ...prev,
          error: 'Failed to load saved address'
        }));
        console.error('Fetch error:', err);
      } finally {
        setApiState(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    if (Userid) fetchAddress();
  }, [Userid]);

  // Debounced validation
  useEffect(() => {
    if (!formState.isDirty) return;
    
    const timerId = setTimeout(() => {
      validateAddress(formState.inputAddress);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timerId);
  }, [formState.inputAddress, formState.isDirty, validateAddress]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAddress(formState.inputAddress)) return;

    setApiState({ isLoading: false, isSubmitting: true, error: null });

    try {
      const { data } = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/updateCryptoAddress`,
        { 
          address: formState.inputAddress, 
          addressType: 'bep20', 
          userId: Userid 
        }
      );

      if (data.success) {
        setFormState(prev => ({
          inputAddress: '',
          savedAddress: prev.inputAddress,
          isDirty: false
        }));
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message 
        || 'Failed to save address';
        
      setApiState(prev => ({
        ...prev,
        error: errorMessage
      }));
      console.error('Update error:', err);
    } finally {
      setApiState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formState.savedAddress);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setFormState(prev => ({
      ...prev,
      inputAddress: value,
      isDirty: true
    }));
  };

  // Derived state
  const isFormValid = validation.isValid && formState.inputAddress.trim();
  const showSuccess = !formState.isDirty && formState.savedAddress;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Fixed Navbar with proper spacing */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <NavBar />
      </div>

      {/* Main Content with padding to prevent overlap */}
      <div className="flex flex-col flex-1 pt-16">
        <div className="max-w-md w-full mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-amber-100 p-2 rounded-lg">
                <TbBrandBinance className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">BEP20 Wallet</h2>
                <p className="text-xs text-gray-500">Binance Smart Chain</p>
              </div>
            </div>

            {apiState.isLoading ? (
              <div className="mb-5 flex justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-amber-500"></div>
              </div>
            ) : showSuccess ? (
              <div className="mb-5 bg-green-50 rounded-lg border border-green-200">
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BsShieldCheck className="flex-shrink-0 w-4 h-4 text-green-500" />
                      <p className="font-medium text-gray-700 text-sm">Saved Address</p>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                  
                  <div className="mt-2 flex items-center gap-2">
                    <span 
                      className="text-xs font-mono break-all text-gray-600 flex-1"
                      data-testid="saved-address"
                    >
                      {formState.savedAddress}
                    </span>
                    <button
                      onClick={copyToClipboard}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                      aria-label="Copy address"
                    >
                      <AiOutlineCopy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label 
                  htmlFor="bep20-address" 
                  className="block text-xs font-medium text-gray-700 mb-2"
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
                    aria-describedby={!validation.isValid ? "address-error" : undefined}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${
                      validation.isValid
                        ? 'bg-gray-50 border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                        : 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    } text-gray-800 transition-all`}
                  />
                  
                  {!validation.isValid && formState.isDirty && (
                    <p 
                      id="address-error"
                      className="mt-1.5 text-xs text-red-500 flex items-center gap-1"
                    >
                      <AiOutlineWarning className="w-3.5 h-3.5" />
                      {validation.message}
                    </p>
                  )}
                </div>
                
                <div className="mt-2 bg-blue-50 rounded p-2.5">
                  <div className="flex items-start gap-2">
                    <FiInfo className="flex-shrink-0 w-3.5 h-3.5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-blue-800">Format</p>
                      <p className="text-xs text-blue-700 mt-0.5">
                        0x + 40 hex characters
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={apiState.isSubmitting || !isFormValid}
                aria-busy={apiState.isSubmitting}
                className={`w-full py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  apiState.isSubmitting 
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : isFormValid
                      ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {apiState.isSubmitting ? (
                  <>
                    <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <AiOutlineCheckCircle className="w-3.5 h-3.5" />
                    {formState.savedAddress ? 'Update Address' : 'Save Address'}
                  </>
                )}
              </button>

              {apiState.error && (
                <div className="p-2.5 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-center text-red-500 text-xs flex items-center justify-center gap-1.5">
                    <AiOutlineWarning className="w-3.5 h-3.5" />
                    {apiState.error}
                  </p>
                </div>
              )}
            </form>

            <div className="mt-5 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
                <BsShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                <span>AES-256 encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default CryptoAddressForm;