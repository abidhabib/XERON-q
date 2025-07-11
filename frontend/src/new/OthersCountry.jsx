import React, { useEffect, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import { AiOutlineCheckCircle, AiOutlineCopy } from 'react-icons/ai';
import { BsShieldCheck } from 'react-icons/bs';
import { TbBrandBinance } from 'react-icons/tb';
import { UserContext } from '../UserContext/UserContext';

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
      message: isValid ? '' : 'Invalid BEP20 address format (must start with 0x and 40 hex characters)'
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
          error: 'Failed to load saved address. Please refresh to try again.'
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
        || 'Failed to save address. Please try again.';
        
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
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-amber-100 p-2 rounded-lg">
          <TbBrandBinance className="w-6 h-6 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">BEP20 Wallet Address</h2>
      </div>

      {apiState.isLoading ? (
        <div className="mb-6 flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : showSuccess ? (
        <div className="mb-6 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-start gap-3 p-4">
            <BsShieldCheck className="flex-shrink-0 w-5 h-5 text-green-500 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-gray-700">Saved BEP20 Address</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span 
                  className="text-sm font-mono break-all text-gray-600"
                  data-testid="saved-address"
                >
                  {formState.savedAddress}
                </span>
                <button
                  onClick={copyToClipboard}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Copy address"
                >
                  <AiOutlineCopy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label 
            htmlFor="bep20-address" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            BEP20 Wallet Address
          </label>
          <div className="relative">
            <input
              id="bep20-address"
              type="text"
              value={formState.inputAddress}
              onChange={handleInputChange}
              placeholder="Enter BEP20 address (0x...)"
              aria-invalid={!validation.isValid}
              aria-describedby={!validation.isValid ? "address-error" : undefined}
              className={`w-full px-4 py-2 text-sm rounded-lg bg-gray-50 border ${
                validation.isValid
                  ? 'border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
                  : 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
              } text-gray-800 transition-all`}
            />
            
            {!validation.isValid && formState.isDirty && (
              <p 
                id="address-error"
                className="mt-2 text-sm text-red-500"
              >
                {validation.message}
              </p>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Ensure this is your Binance Smart Chain (BSC) address. Double-check before saving.
          </p>
        </div>

        <button
          type="submit"
          disabled={apiState.isSubmitting || !isFormValid}
          aria-busy={apiState.isSubmitting}
          className={`w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-2 rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed ${
            apiState.isSubmitting ? 'opacity-90 cursor-wait' : 'hover:from-blue-700 hover:to-indigo-800'
          } flex items-center justify-center gap-2`}
        >
          {apiState.isSubmitting ? (
            <>
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
              Processing...
            </>
          ) : (
            <>
              <AiOutlineCheckCircle className="w-5 h-5" />
              {formState.savedAddress ? 'Update Address' : 'Save Address'}
            </>
          )}
        </button>

        {apiState.error && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
            <p className="text-center text-red-500 text-sm">{apiState.error}</p>
          </div>
        )}
      </form>

      <div className="mt-6 pt-5 border-t border-gray-100 text-center text-sm text-gray-500">
        <p className="flex items-center justify-center gap-2">
          <BsShieldCheck className="w-4 h-4 text-gray-400" />
          Secured with AES-256 encryption
        </p>
      </div>
    </div>
  );
};

export default CryptoAddressForm;