import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  HiOutlineGift,
  HiOutlineUserAdd,
  HiOutlineCreditCard,
  HiCurrencyDollar,
  HiOutlineCog,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineRefresh,
  HiOutlineTrendingUp,
  HiOutlineCalendar,
  HiOutlineGlobe
} from 'react-icons/hi';
import { FaSpinner } from 'react-icons/fa';

// --- Settings Configuration ---
const SETTINGS_CONFIG = {
  fee: {
    title: "Joining Fee",
    subtitle: "One-time fee for new user registration",
    icon: HiOutlineCreditCard,
    color: "indigo",
    type: "number",
    prefix: "$",
    step: "0.01",
    section: "financial"
  },
  webBackendFeePercent: {
    title: "Web Backend % of Fee",
    subtitle: "Percentage of joining fee allocated to web backend",
    icon: HiOutlineGlobe,
    color: "slate",
    type: "number",
    suffix: "%",
    step: "0.1",
    placeholder: "e.g. 10.0",
    section: "financial"
  },
  coinValue: {
    title: "Coin Value",
    subtitle: "1 WBE3 Coin equals how many USD",
    icon: HiCurrencyDollar,
    color: "purple",
    type: "number",
    prefix: "$",
    step: "0.01",
    section: "financial"
  },
  percentage: {
    title: "New User Backend",
    subtitle: "Percentage Backend given to new users on approve",
    icon: HiOutlineUserAdd,
    color: "emerald",
    type: "number",
    suffix: "%",
    step: "0.1",
    section: "incentives"
  },
  offer: {
    title: "Special Offer",
    subtitle: "Current promotional offer text displayed to users",
    icon: HiOutlineGift,
    color: "amber",
    type: "text",
    placeholder: "e.g. Get 20% bonus on first deposit!",
    section: "incentives"
  },
  // weekSalaryPersonRequire: {
  //   title: "Weekly Salary Requirement",
  //   subtitle: "Minimum weekly salary per person (USD)",
  //   icon: HiOutlineTrendingUp,
  //   color: "blue",
  //   type: "number",
  //   prefix: "$",
  //   step: "0.01",
  //   placeholder: "e.g. 500.00",
  //   section: "salary"
  // },
  monthSalaryPersonRequire: {
    title: "Monthly Person Require",
    subtitle: "Required monthly salary threshold per person",
    icon: HiOutlineCalendar,
    color: "cyan",
    type: "number",
    prefix: "",
    step: "0.01",
    placeholder: "e.g. 2000.00",
    section: "salary"
  },
  monthSalaryAmount: {
    title: "Monthly Salary Amount",
    subtitle: "Actual monthly salary payout per person (USD)",
    icon: HiCurrencyDollar,
    color: "teal",
    type: "number",
    prefix: "$",
    step: "0.01",
    placeholder: "e.g. 2000.00",
    section: "salary"
  }
};

const COLOR_MAP = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', ring: 'focus:ring-indigo-500/20', btn: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', ring: 'focus:ring-purple-500/20', btn: 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', ring: 'focus:ring-emerald-500/20', btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', ring: 'focus:ring-amber-500/20', btn: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', ring: 'focus:ring-blue-500/20', btn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200', ring: 'focus:ring-cyan-500/20', btn: 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-200' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200', ring: 'focus:ring-teal-500/20', btn: 'bg-teal-600 hover:bg-teal-700 shadow-teal-200' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300', ring: 'focus:ring-slate-500/20', btn: 'bg-slate-700 hover:bg-slate-800 shadow-slate-300' },
};

// --- Sub-components ---

const SectionHeader = ({ title, description }) => (
  <div className="mb-4 mt-8 first:mt-0">
    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
    <div className="h-px bg-slate-200 mt-3"></div>
  </div>
);

const SettingCard = ({ config, value, onChange, onUpdate, isUpdating, saved }) => {
  const { title, subtitle, icon: Icon, color, type, prefix, suffix, placeholder, step } = config;
  const colors = COLOR_MAP[color] || COLOR_MAP.indigo;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 transition-all hover:shadow-md hover:border-slate-300 group">
      <div className="flex items-start mb-4">
        <div className={`${colors.bg} p-2.5 rounded-lg mr-3 transition-colors group-hover:scale-105 duration-200`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{subtitle}</p>}
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="relative">
          {prefix && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-400 font-medium text-sm">{prefix}</span>
            </div>
          )}
          <input
            type={type}
            step={step}
            className={`w-full py-2.5 ${prefix ? 'pl-7' : 'pl-4'} ${suffix ? 'pr-8' : 'pr-4'} rounded-lg border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 ${colors.ring} focus:border-transparent focus:bg-white transition-all text-sm font-medium`}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
          {suffix && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-slate-400 font-medium text-sm">{suffix}</span>
            </div>
          )}
        </div>
        
        <button
          onClick={onUpdate}
          disabled={isUpdating}
          className={`w-full px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-all flex items-center justify-center shadow-md ${
            saved 
              ? 'bg-emerald-500 shadow-emerald-200' 
              : isUpdating 
                ? 'bg-slate-400 cursor-not-allowed shadow-none' 
                : `${colors.btn}`
          }`}
        >
          {isUpdating ? (
            <>
              <FaSpinner className="animate-spin mr-2 w-4 h-4" />
              Saving...
            </>
          ) : saved ? (
            <>
              <HiOutlineCheckCircle className="mr-2 w-4 h-4" />
              Saved!
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 animate-pulse">
    <div className="flex items-start mb-4">
      <div className="w-10 h-10 bg-slate-200 rounded-lg mr-3"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
        <div className="h-3 bg-slate-100 rounded w-1/2"></div>
      </div>
    </div>
    <div className="space-y-3">
      <div className="h-10 bg-slate-100 rounded-lg"></div>
      <div className="h-10 bg-slate-100 rounded-lg"></div>
    </div>
  </div>
);

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center px-4 py-3 rounded-xl shadow-xl border animate-in slide-in-from-right-4 fade-in duration-300 ${
      isSuccess 
        ? 'bg-white border-emerald-200 text-emerald-800' 
        : 'bg-white border-rose-200 text-rose-800'
    }`}>
      <div className={`p-1.5 rounded-full mr-3 ${isSuccess ? 'bg-emerald-100' : 'bg-rose-100'}`}>
        {isSuccess 
          ? <HiOutlineCheckCircle className="w-5 h-5 text-emerald-600" />
          : <HiOutlineExclamationCircle className="w-5 h-5 text-rose-600" />
        }
      </div>
      <div>
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button onClick={onClose} className="ml-4 p-1 hover:bg-slate-100 rounded transition-colors opacity-60 hover:opacity-100">
        <span className="text-lg leading-none">&times;</span>
      </button>
    </div>
  );
};

// --- Main Component ---

const Settings = () => {
  const [settings, setSettings] = useState({
    fee: "",
    webBackendFeePercent: "",
    percentage: "",
    offer: "",
    coinValue: "",
    weekSalaryPersonRequire: "",
    monthSalaryPersonRequire: "",
    monthSalaryAmount: ""
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [savedFields, setSavedFields] = useState({});
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const api = {
    fetchSettings: async () => {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/settings`);
      return res.data;
    },
    updateSetting: async (type, value) => {
      const current = await api.fetchSettings();
      const payload = { ...current, [type]: value };
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/settings`, payload);
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
      setSettings({
        fee: data.fee?.toString() || "",
        webBackendFeePercent: data.webBackendFeePercent?.toString() || "",
        percentage: data.percentage?.toString() || "",
        offer: data.offer || "",
        coinValue: data.coinValue?.toString() || "",
        weekSalaryPersonRequire: data.weekSalaryPersonRequire?.toString() || "",
        monthSalaryPersonRequire: data.monthSalaryPersonRequire?.toString() || "",
        monthSalaryAmount: data.monthSalaryAmount?.toString() || ""
      });
    } catch (err) {
      setError(err.message || 'Failed to load settings');
      showToast('Failed to load settings. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type) => setToast({ message, type });

  const handleUpdate = async (type) => {
    setUpdating(prev => ({ ...prev, [type]: true }));
    setSavedFields(prev => ({ ...prev, [type]: false }));
    
    try {
      await api.updateSetting(type, settings[type]);
      setSavedFields(prev => ({ ...prev, [type]: true }));
      showToast(`${SETTINGS_CONFIG[type].title} updated successfully!`, 'success');
      
      setTimeout(() => {
        setSavedFields(prev => ({ ...prev, [type]: false }));
      }, 2000);
    } catch (err) {
      console.error(`Error updating ${type}:`, err);
      showToast(`Failed to update ${SETTINGS_CONFIG[type].title}`, 'error');
    } finally {
      setUpdating(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleChange = (type, value) => {
    setSettings(prev => ({ ...prev, [type]: value }));
    if (savedFields[type]) {
      setSavedFields(prev => ({ ...prev, [type]: false }));
    }
  };

  // Group settings by section
  const sections = {
    financial: { title: "Financial Configuration", description: "Platform fees, backend allocation, and currency values", keys: [] },
    incentives: { title: "User Incentives", description: "Bonuses and promotional offers", keys: [] },
    salary: { title: "Salary Configuration", description: "Monthly salary requirements", keys: [] }
  };

  Object.entries(SETTINGS_CONFIG).forEach(([key, config]) => {
    if (sections[config.section]) {
      sections[config.section].keys.push(key);
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
        {/* Page Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-200">
              <HiOutlineCog className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
              <p className="text-sm text-slate-500 mt-0.5">Manage platform configuration and preferences</p>
            </div>
          </div>
          
          {!loading && !error && (
            <button
              onClick={fetchSettings}
              className="flex items-center px-4 py-2.5 text-sm font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              <HiOutlineRefresh className="w-4 h-4 text-slate-500 mr-2" />
              Reload Settings
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4">
              <HiOutlineExclamationCircle className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Failed to Load Settings</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-sm text-center">{error}</p>
            <button
              onClick={fetchSettings}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all font-medium text-sm"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(sections).map(([sectionKey, section]) => (
              <div key={sectionKey}>
                <SectionHeader title={section.title} description={section.description} />
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                  {section.keys.map(key => (
                    <SettingCard
                      key={key}
                      config={SETTINGS_CONFIG[key]}
                      value={settings[key]}
                      onChange={(val) => handleChange(key, val)}
                      onUpdate={() => handleUpdate(key)}
                      isUpdating={updating[key] || false}
                      saved={savedFields[key] || false}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;