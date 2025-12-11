import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sidebar } from '../SideBarSection/Sidebar';
import { 
  HiOutlineGift,
  HiOutlineUserAdd,
  HiOutlineCreditCard,
  HiCurrencyDollar
} from 'react-icons/hi';
import { FaSpinner } from 'react-icons/fa';

// Configuration Pattern - Centralize settings configuration
const SETTINGS_CONFIG = {
  fee: {
    title: "Joining Fee",
    icon: HiOutlineCreditCard,
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    bgColor: "bg-indigo-600",
    hoverBg: "hover:bg-indigo-700",
    focusRing: "focus:ring-indigo-200",
    type: "number"
  },
  percentage: {
    title: "New User Bonus",
    subtitle: "Percentage bonus given to new users",
    icon: HiOutlineUserAdd,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    bgColor: "bg-green-600",
    hoverBg: "hover:bg-green-700",
    focusRing: "focus:ring-green-200",
    type: "number"
  },
  offer: {
    title: "Special Offer",
    subtitle: "Current special offer text",
    icon: HiOutlineGift,
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
    bgColor: "bg-yellow-600",
    hoverBg: "hover:bg-yellow-700",
    focusRing: "focus:ring-yellow-200",
    type: "text",
    placeholder: "Enter special offer text"
  },
  coinValue: {
    title: "Coin Value",
    subtitle: "Current coin value in USD",
    icon: HiCurrencyDollar,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    bgColor: "bg-purple-600",
    hoverBg: "hover:bg-purple-700",
    focusRing: "focus:ring-purple-200",
    type: "number",
    step: "0.01"
  }
};

// Component Pattern - Reusable Setting Card
const SettingCard = ({ 
  config, 
  value, 
  onChange, 
  onUpdate, 
  isUpdating,
  type 
}) => {
  const {
    title,
    subtitle,
    icon: Icon,
    iconBg,
    iconColor,
    bgColor,
    hoverBg,
    focusRing,
    type: inputType,
    placeholder,
    step
  } = config;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
      <div className="flex items-center mb-4">
        <div className={`${iconBg} p-2 rounded-lg mr-3 transition-colors`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-800">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type={inputType}
          step={step}
          className={`flex-1 py-2 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 ${focusRing} focus:border-transparent transition-all`}
          value={value || ''}
          onChange={(e) => onChange(type, e.target.value)}
          placeholder={placeholder}
        />
        <button
          onClick={() => onUpdate(type)}
          disabled={isUpdating}
          className={`px-6 py-2 rounded-lg text-white font-medium transition-all whitespace-nowrap ${
            isUpdating 
              ? 'bg-gray-400 cursor-not-allowed' 
              : `${bgColor} ${hoverBg}`
          }`}
        >
          <div className="flex items-center justify-center">
            {isUpdating ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                <span>Saving...</span>
              </>
            ) : (
              'Save Changes'
            )}
          </div>
        </button>
      </div>
    </div>
  );
};

// Loading State Pattern
const LoadingState = () => (
  <div className="flex justify-center items-center h-64">
    <div className="text-center">
      <FaSpinner className="animate-spin text-4xl text-indigo-600 mx-auto mb-4" />
      <p className="text-gray-600">Loading settings...</p>
    </div>
  </div>
);

// Error State Pattern
const ErrorState = ({ onRetry }) => (
  <div className="flex flex-col items-center justify-center h-64 bg-red-50 rounded-lg p-6">
    <div className="text-red-500 mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-800 mb-2">Failed to load settings</h3>
    <p className="text-gray-600 mb-4">There was an error loading the system settings.</p>
    <button
      onClick={onRetry}
      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
    >
      Try Again
    </button>
  </div>
);

// Success Toast Pattern
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fadeIn`}>
      {message}
    </div>
  );
};

const Settings = () => {
  const [settings, setSettings] = useState({
    fee: "",
    usdRate: 0.0,
    offer: "",
    percentage: 0,
    coinValue: ""
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // API Layer Pattern - Centralize API calls
// In your Settings component, update the api.updateSetting function:
const api = {
    fetchSettings: async () => {
        try {
            const [
                feeRes, 
                offerRes, 
                percentageRes,
                coinValueRes
            ] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/get-fee`),
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/get-offer`),
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/get-percentage`),
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/get-coin-value`)
            ]);

            return {
                fee: feeRes.data.fee,
                offer: offerRes.data.offer,
                percentage: percentageRes.data.initial_percent,
                coinValue: coinValueRes.data.value
            };
        } catch (err) {
            throw new Error('Failed to fetch settings');
        }
    },
    
    updateSetting: async (type, value) => {
        const endpointMap = {
            fee: '/update-fee',
            offer: '/update-offer',
            percentage: '/update-percentage',
            coinValue: '/update-coin-value'
        };
        
        // Validate value before sending
        if (value === undefined || value === null || value === '') {
            throw new Error('Value cannot be empty');
        }
        
        const payload = { value: value }; // Changed from newFeeValue to value for consistency
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}${endpointMap[type]}`, payload);
    }
};

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.fetchSettings();
      setSettings(data);
    } catch (err) {
      setError(err.message);
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  const handleUpdate = async (type) => {
    setUpdating(prev => ({ ...prev, [type]: true }));
    
    try {
      await api.updateSetting(type, settings[type]);
      showToast(`${SETTINGS_CONFIG[type].title} updated successfully!`, 'success');
    } catch (err) {
      console.error(`Error updating ${type}:`, err);
      showToast(`Failed to update ${SETTINGS_CONFIG[type].title}`, 'error');
    } finally {
      setUpdating(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleChange = (type, value) => {
    setSettings(prev => ({ ...prev, [type]: value }));
  };

  const handleCloseToast = () => {
    setToast(null);
  };

  // Layout Pattern - Responsive Grid
  return (
    <div className=" min-h-screen bg-gray-50">
      
      <div className="p-4">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">System Settings</h1>
          <p className="text-gray-600 mt-2">Manage platform configuration and preferences</p>
        </div>

        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={handleCloseToast} 
          />
        )}

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState onRetry={fetchSettings} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Object.entries(SETTINGS_CONFIG).map(([key, config]) => (
              <SettingCard
                key={key}
                type={key}
                config={config}
                value={settings[key]}
                onChange={handleChange}
                onUpdate={handleUpdate}
                isUpdating={updating[key] || false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;