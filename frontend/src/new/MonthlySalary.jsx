// src/pages/MonthlySalary.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { UserContext } from '../UserContext/UserContext';
import axios from 'axios';
import {
  Coins,
  CheckCircle,
  RotateCw,
  History,
  Upload,
  User,
  Smartphone,
  MessageCircle,
  Trophy,
  Users,
  Calendar,
  Star,
  AlertTriangle,
  FileText,
  ShieldCheck,
  X,
  ChevronRight,
  CreditCard,
  BadgeCheck,
  Clock,
  Target,
  Award,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { format, parseISO, isAfter, isBefore, addMonths } from 'date-fns';
import BalanceCard from './BalanceCard';

// ✅ Confetti with improved timing
const useConfetti = () => {
  const trigger = () => {
    if (typeof window === 'undefined') return;
    import('canvas-confetti')
      .then((mod) => {
        const confetti = mod.default;
        const duration = 2000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(() => {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
            colors: ['#D4AF37', '#FFD700', '#FFFFFF', '#F4E4A6']
          });
        }, 250);
      })
      .catch(console.warn);
  };
  return trigger;
};

// ✅ Enhanced Upload Field
const UploadField = ({ label, description, accept, onChange, required, error, icon: Icon = Upload }) => {
  const [preview, setPreview] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File must be under 5 MB');
      return;
    }
    onChange(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-white/90 flex items-center gap-2">
          <Icon className="w-4 h-4 text-[#D4AF37]" />
          {label}
          {required && <span className="text-rose-500">*</span>}
        </label>
        {description && (
          <span className="text-xs text-white/50">{description}</span>
        )}
      </div>
      
      <label
        className={`relative flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer group ${
          error
            ? 'border-rose-500/50 bg-rose-500/5'
            : isDragging
            ? 'border-[#D4AF37] bg-[#D4AF37]/5'
            : preview
            ? 'border-emerald-500/30 bg-emerald-500/5'
            : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="relative w-full h-full p-2">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <Upload className="w-6 h-6 text-white" />
            </div>
          </div>
        ) : (
          <div className="text-center p-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 transition-colors ${
              isDragging ? 'bg-[#D4AF37]' : 'bg-white/10'
            }`}>
              <Icon className={`w-5 h-5 ${isDragging ? 'text-gray-900' : 'text-[#D4AF37]'}`} />
            </div>
            <p className="text-sm font-medium text-white mb-1">
              {isDragging ? 'Drop file here' : 'Click or drag to upload'}
            </p>
            <p className="text-xs text-white/50">
              PNG, JPG up to 5MB
            </p>
          </div>
        )}
        <input
          type="file"
          accept={accept}
          onChange={handleFileInput}
          className="hidden"
          required={required}
        />
      </label>
      
      {error && (
        <div className="flex items-center gap-2 text-rose-400 text-sm">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
};

// ✅ Enhanced Phone Input
const PhoneInput = ({ value, onChange, placeholder, countryCode, onCountryChange, countryOptions, icon: Icon = Smartphone }) => {
  const [isFocused, setIsFocused] = useState(false);

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 15) val = val.slice(0, 15);
    onChange(val);
  };

  const formatPhone = (num) => {
    if (!num) return '';
    if (num.length <= 3) return num;
    if (num.length <= 6) return `(${num.slice(0, 3)}) ${num.slice(3)}`;
    return `(${num.slice(0, 3)}) ${num.slice(3, 6)}-${num.slice(6, 10)}`;
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white/90 flex items-center gap-2">
        <Icon className="w-4 h-4 text-[#D4AF37]" />
        {placeholder}
      </label>
      <div className={`flex gap-2 p-2 rounded-xl  transition-all duration-200 ${
        isFocused
          ? '-[#D4AF37] bg-white/5'
          : '-white/10 bg-white/5 hover:bg-white/10'
      }`}>
        <div className="relative flex-1">
          <select
            value={countryCode}
            onChange={(e) => onCountryChange(e.target.value)}
            className="w-full bg-transparent text-white px-3 py-2.5 text-sm focus:outline-none appearance-none cursor-pointer"
          >
            {countryOptions.map((country) => (
              <option key={country.code} value={country.code} className="bg-gray-900">
                {country.code} {country.name}
              </option>
            ))}
          </select>
          <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none rotate-90" />
        </div>
        <div className="w-px bg-white/10" />
        <input
          type="tel"
          value={formatPhone(value)}
          onChange={handlePhoneChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="flex-1 bg-transparent text-white px-3 py-2.5 text-sm focus:outline-none placeholder-white/30"
          placeholder="Phone number"
          inputMode="numeric"
          required
        />
      </div>
    </div>
  );
};

// ✅ Enhanced Countdown Timer
const CountdownTimer = ({ nextWindowStart }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!nextWindowStart) return;
    const target = new Date(nextWindowStart);

    const update = () => {
      const diff = target - new Date();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [nextWindowStart]);

  if (!nextWindowStart) return null;

  const timeUnits = [
    { value: timeLeft.days, label: 'Days', color: 'text-blue-400' },
    { value: timeLeft.hours, label: 'Hours', color: 'text-emerald-400' },
    { value: timeLeft.minutes, label: 'Minutes', color: 'text-amber-400' },
    { value: timeLeft.seconds, label: 'Seconds', color: 'text-rose-400' },
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm rounded-2xl p-6 ">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-[#D4AF37]/10 rounded-lg">
          <Clock className="w-5 h-5 text-[#D4AF37]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Next Collection Window</h3>
          <p className="text-sm text-white/60">Salary collection will be available in</p>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-3">
        {timeUnits.map((unit, i) => (
          <div key={unit.label} className="text-center">
            <div className="bg-gray-900/50 rounded-xl p-3 mb-2">
              <span className={`text-2xl font-bold ${unit.color}`}>
                {unit.value.toString().padStart(2, '0')}
              </span>
            </div>
            <span className="text-xs text-white/50">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ✅ Enhanced Salary Receipt Modal
const ReceiptModal = ({ payment, onClose }) => {
  if (!payment) return null;
  const date = parseISO(`${payment.month.slice(0,4)}-${payment.month.slice(4)}-01`);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="w-full max-w-md bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl overflow-hidden border border-white/10 shadow-2xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CreditCard className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Salary Receipt</h3>
                <p className="text-sm text-white/60">Payment confirmation</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center py-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center">
                <Award className="w-4 h-4 text-gray-900" />
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900/50 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-white/60">Payment Date</p>
                <p className="text-white font-medium">{format(date, 'dd MMM yyyy')}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/60">For Period</p>
                <p className="text-white font-medium">{format(date, 'MMMM yyyy')}</p>
              </div>
            </div>
            
            <div className="h-px bg-white/10" />
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-white/60">Transaction ID</p>
                <p className="text-white font-mono text-sm">{payment.transactionId || 'SAL-' + Date.now()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/60">Status</p>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Confirmed</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center pt-4 border-t border-white/10">
            <p className="text-sm text-white/60 mb-2">Total Amount</p>
            <p className="text-4xl font-bold text-emerald-400">${payment.amount.toFixed(2)}</p>
            <p className="text-sm text-white/60 mt-2">Successfully transferred to your account</p>
          </div>
        </div>
        
        <div className="p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, subtitle, color = "gold", size = "md" }) => {
  const bgColor = color === "emerald" 
    ? "bg-emerald-500/10" 
    : color === "blue" 
      ? "bg-blue-500/10" 
      : "bg-[#161d2a]";
  
  const iconColor = color === "emerald" 
    ? "text-emerald-400" 
    : color === "blue" 
      ? "text-blue-400" 
      : "text-[#D4AF37]";

  const padding = size === "sm" ? "p-3" : "p-4";
  const titleSize = size === "sm" ? "text-[11px]" : "text-xs";
  const valueSize = size === "sm" ? "text-base" : "text-lg";
  const subtitleSize = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <div className={`${padding} bg-[#121826] rounded-xl`}>
      <div className={`flex items-center gap-2 mb-1.5 ${titleSize} text-[#D4AF37]/70`}>
        <Icon className="w-3.5 h-3.5" />
        {title}
      </div>
      <div className="flex items-center justify-between">
        <span className={`font-bold ${valueSize} text-white`}>{value}</span>
        <div className={`p-1.5 rounded-md ${bgColor}`}>
          <Icon className={`w-3 h-3 ${iconColor}`} />
        </div>
      </div>
      <p className={`${subtitleSize} text-[#D4AF37]/50 mt-1`}>{subtitle}</p>
    </div>
  );
};
// ✅ Enhanced Progress Bar
const ProgressBar = ({ current, required, label, showPercentage = true }) => {
  const percentage = required ? Math.min(100, (current / required) * 100) : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-white">{label}</span>
        {showPercentage && (
          <span className="text-sm font-bold text-[#D4AF37]">{Math.round(percentage)}%</span>
        )}
      </div>
      <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#D4AF37] to-[#c69c2e] rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-white/50">
        <span>{current} members</span>
        <span>{required} required</span>
      </div>
    </div>
  );
};

// ✅ Main Component
const MonthlySalary = () => {
  const { Userid } = useContext(UserContext);
  const API = import.meta.env.VITE_API_BASE_URL;
  const triggerConfetti = useConfetti();

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadErrors, setUploadErrors] = useState({});
  const [form, setForm] = useState({
    fullName: '',
    documentType: 'nic',
    documentNumber: '',
    phoneCountryCode: '+1',
    phoneNumber: '',
    whatsappCountryCode: '+1',
    whatsappNumber: '',
    identityFront: null,
    identityBack: null,
    selfie: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [hasFetchedHistory, setHasFetchedHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const countryOptions = [
    { code: '+1', name: 'United States' },
    { code: '+44', name: 'United Kingdom' },
    { code: '+91', name: 'India' },
    { code: '+86', name: 'China' },
    { code: '+81', name: 'Japan' },
    { code: '+49', name: 'Germany' },
    { code: '+33', name: 'France' },
    { code: '+61', name: 'Australia' },
    { code: '+971', name: 'UAE' },
    { code: '+966', name: 'Saudi Arabia' },
    { code: '+92', name: 'Pakistan' },
    { code: '+94', name: 'Sri Lanka' },
    // Add more as needed...
  ].sort((a, b) => a.name.localeCompare(b.name));

  const fetchStatus = useCallback(async () => {
    if (!Userid) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API}/api/monthly-salary/status`, { withCredentials: true });
      setStatus(res.data);
    } catch (err) {
      setError('Unable to load salary status. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [Userid, API]);

  const fetchHistory = async () => {
    if (!Userid) return;
    setIsHistoryLoading(true);
    try {
      const res = await axios.get(`${API}/api/monthly-salary/history`, { withCredentials: true });
      setHistory(res.data.history || []);
      setHasFetchedHistory(true);
    } catch (err) {
      setError('Failed to load payment history.');
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!form.identityFront) errors.identityFront = 'Front ID image is required';
    if (!form.identityBack) errors.identityBack = 'Back ID image is required';
    if (!form.selfie) errors.selfie = 'Selfie with ID is required';
    setUploadErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setError('Please fill all required fields');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v) formData.append(k, v);
    });
    
    try {
      await axios.post(`${API}/api/monthly-salary/apply`, formData, { withCredentials: true });
      setSuccess('Application submitted successfully! Verification usually takes 24-48 hours.');
      fetchStatus();
      setForm({
        fullName: '',
        documentType: 'nic',
        documentNumber: '',
        phoneCountryCode: '+1',
        phoneNumber: '',
        whatsappCountryCode: '+1',
        whatsappNumber: '',
        identityFront: null,
        identityBack: null,
        selfie: null,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCollect = async () => {
    try {
      const res = await axios.post(`${API}/api/monthly-salary/collect`, {}, { withCredentials: true });
      setSuccess(`🎉 Successfully collected $${res.data.amount}! Funds have been added to your balance.`);
      triggerConfetti();
      fetchStatus();
      if (!hasFetchedHistory) fetchHistory();
    } catch (err) {
      setError(err.response?.data?.error || 'Collection failed. Please try again later.');
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-950">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-gray-800"></div>
        <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-[#D4AF37] border-t-transparent animate-spin"></div>
        <Coins className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-[#D4AF37]" />
      </div>
      <p className="mt-4 text-white/60 animate-pulse">Loading salary dashboard...</p>
    </div>
  );

  const renderNotEligible = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm rounded-2xl px-3 py-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Coins className="w-10 h-10 text-[#D4AF37]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Monthly Salary Program</h1>
          <p className="text-white/60">Unlock guaranteed monthly income by building your team</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-900/50 rounded-xl p-4">
            <p className="text-sm text-white/60 mb-1">Current Team</p>
            <p className="text-2xl font-bold text-white">{status?.currentTeam || 0}</p>
          </div>
          <div className="bg-gray-900/50 rounded-xl p-4">
            <p className="text-sm text-white/60 mb-1">Required Team</p>
            <p className="text-2xl font-bold text-[#D4AF37]">{status?.requiredTeam || 0}</p>
          </div>
        </div>

        <ProgressBar
          current={status?.currentTeam || 0}
          required={status?.requiredTeam || 1}
          label="Team Progress"
        />

        <div className="mt-8 p-3 bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 rounded-xl ">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-[#D4AF37]" />
            <div>
              <p className="font-medium text-white">Your Potential Earnings</p>
              <p className="text-3xl font-bold text-[#D4AF37]">${status?.salaryAmount?.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-white/60">per month upon approval</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

const renderApplicationForm = () => (
  <div className="max-w-2xl mx-auto">
    <div className="bg-black/20 rounded-2xl p-4"> {/* No gradient, no blur */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-[#D4AF37]/10 rounded-lg">
          <BadgeCheck className="w-5 h-5 text-[#D4AF37]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Complete Your Application</h2>
          <p className="text-xs text-white/50 mt-0.5">Verify your identity to activate salary benefits</p>
        </div>
      </div>

      {(error || success) && (
        <div className={`mb-5 p-3 rounded-lg ${
          success ? 'bg-emerald-500/10' : 'bg-rose-500/10'
        }`}>
          <div className="flex items-start gap-2.5">
            {success ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
            )}
            <p className={`text-sm ${success ? 'text-emerald-400' : 'text-rose-400'}`}>
              {success || error}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full Name */}
        <div>
          <label className="block text-xs text-white/60 mb-1.5">Full Legal Name</label>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-full bg-white/5 rounded-lg px-3 py-2.5 text-white placeholder:text-white/30
                       focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-0
                       transition-colors"
            placeholder="Enter your full name as on ID"
            required
          />
        </div>

        {/* Document Type & Number (side-by-side, tight grid) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/60 mb-1.5">Document Type</label>
            <select
              value={form.documentType}
              onChange={(e) => setForm({ ...form, documentType: e.target.value })}
              className="w-full bg-white/5 rounded-lg px-3 py-2.5 text-white appearance-none
                         focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-0
                         transition-colors"
              required
            >
              <option value="nic" className="bg-gray-800">National ID</option>
              <option value="passport" className="bg-gray-800">Passport</option>
              <option value="driving_license" className="bg-gray-800">Driving License</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-white/60 mb-1.5">Document Number</label>
            <input
              type="text"
              value={form.documentNumber}
              onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
              className="w-full bg-white/5 rounded-lg px-3 py-2.5 text-white placeholder:text-white/30
                         focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-0
                         transition-colors"
              placeholder="ID number"
              required
            />
          </div>
        </div>

        {/* Phone Inputs — assumed to follow same style */}
        <PhoneInput
          value={form.phoneNumber}
          onChange={(val) => setForm({ ...form, phoneNumber: val })}
          placeholder="Phone Number"
          countryCode={form.phoneCountryCode}
          onCountryChange={(code) => setForm({ ...form, phoneCountryCode: code })}
          countryOptions={countryOptions}
          className="!bg-white/5 !border-0 !rounded-lg !px-3 !py-2.5
                     focus:!ring-2 focus:!ring-[#D4AF37] focus:!ring-offset-0"
        />

        <PhoneInput
          value={form.whatsappNumber}
          onChange={(val) => setForm({ ...form, whatsappNumber: val })}
          placeholder="WhatsApp Number"
          countryCode={form.whatsappCountryCode}
          onCountryChange={(code) => setForm({ ...form, whatsappCountryCode: code })}
          countryOptions={countryOptions}
          icon={MessageCircle}
          className="!bg-white/5 !border-0 !rounded-lg !px-3 !py-2.5
                     focus:!ring-2 focus:!ring-[#D4AF37] focus:!ring-offset-0"
        />

        {/* Upload Fields – ensure UploadField also follows minimal style */}
        <div className="space-y-4 pt-1">
          <h3 className="text-base font-medium text-white">Verification Documents</h3>
          <p className="text-xs text-white/50 -mt-1">Upload clear images for verification</p>

          <UploadField
            label="ID Front Side"
            description="Clear image of front side"
            accept="image/*"
            onChange={(file) => setForm({ ...form, identityFront: file })}
            required
            error={uploadErrors.identityFront}
            icon={CreditCard}
            minimalStyle // <-- ensure your UploadField accepts a prop to style minimally
          />
          
          <UploadField
            label="ID Back Side"
            description="Clear image of back side"
            accept="image/*"
            onChange={(file) => setForm({ ...form, identityBack: file })}
            required
            error={uploadErrors.identityBack}
            icon={CreditCard}
            minimalStyle
          />
          
          <UploadField
            label="Selfie with ID"
            description="Your face with ID in same frame"
            accept="image/*"
            onChange={(file) => setForm({ ...form, selfie: file })}
            required
            error={uploadErrors.selfie}
            icon={User}
            minimalStyle
          />
        </div>

        {/* Submit Button – subtle gradient optional, but keep tight */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-[#D4AF37] text-gray-900 font-semibold rounded-lg
                     flex items-center justify-center gap-2
                     hover:opacity-95 active:scale-[0.99] transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              Submit Application
            </>
          )}
        </button>
      </form>
    </div>
  </div>
);

  const renderApprovedDashboard = () => (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className=" font-bold text-white">Monthly Salary</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-[#D4AF37] text-gray-900'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-[#D4AF37] text-gray-900'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              History
            </button>
          </div>
        </div>

     {activeTab === 'overview' && (
  <div className="space-y-4">
    {/* 4 Stat Cards – Tight, Borderless, Golden Minimal */}
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        icon={Users}
        title="Team"
        value={`${status?.currentTeam || 0}/${status?.requiredTeam || 0}`}
        subtitle="members"
        size="sm"
      />
      <StatCard
        icon={Trophy}
        title="Salary"
        value={`$${status?.salaryAmount?.toFixed(2) || '0.00'}`}
        subtitle="monthly"
        size="sm"
      />
      <StatCard
        icon={FileText}
        title="Status"
        value="Active"
        subtitle="approved"
        color="emerald"
        size="sm"
      />
      <StatCard
        icon={Calendar}
        title="Collect"
        value={status?.hasCollectedThisMonth ? "Done" : "Ready"}
        subtitle={status?.hasCollectedThisMonth ? "this month" : "now"}
        color={status?.hasCollectedThisMonth ? "blue" : "emerald"}
        size="sm"
      />
    </div>

    {/* Countdown – Only if collected */}
    {status?.hasCollectedThisMonth && status?.nextCollectionWindowStart && (
      <CountdownTimer nextWindowStart={status.nextCollectionWindowStart} />
    )}

    {/* Collection Action – Minimal Card */}
    <div className="bg-[#121826] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-white font-medium text-sm">Salary Collection</h3>
          <p className="text-[#D4AF37]/60 text-xs mt-0.5">
            {status?.hasCollectedThisMonth 
              ? "Collected for this cycle" 
              : "Ready to receive your income"}
          </p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded ${
          status?.hasCollectedThisMonth
            ? 'bg-emerald-500/10 text-emerald-400'
            : 'bg-[#D4AF37]/15 text-[#D4AF37]'
        }`}>
          {status?.hasCollectedThisMonth ? 'Collected' : 'Available'}
        </span>
      </div>

      <button
        onClick={handleCollect}
        disabled={status?.hasCollectedThisMonth}
        className={`w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 ${
          status?.hasCollectedThisMonth
            ? 'bg-[#161d2a] text-[#D4AF37]/40 cursor-not-allowed'
            : 'bg-gradient-to-r from-[#D4AF37] to-[#c69c2e] text-gray-900'
        }`}
      >
        {status?.hasCollectedThisMonth ? (
          <>
            <CheckCircle className="w-4 h-4" />
            Collected
          </>
        ) : (
          <>
            <Coins className="w-4 h-4" />
            Collect ${status?.salaryAmount?.toFixed(2) || '0.00'}
          </>
        )}
      </button>
    </div>

    {/* Progress – Ultra Compact */}
    <div className="bg-[#121826] rounded-xl p-3">
      <div className="flex justify-between text-[11px] text-[#D4AF37]/70 mb-1.5">
        <span>Team Progress</span>
        <span>{status?.currentTeam || 0} / {status?.requiredTeam || 0}</span>
      </div>
      <div className="h-1.5 bg-[#161d2a] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#D4AF37] to-[#c69c2e]"
          style={{ width: `${status?.requiredTeam ? Math.min(100, (status.currentTeam / status.requiredTeam) * 100) : 0}%` }}
        />
      </div>
    </div>
  </div>
)}

{activeTab === 'history' && (
  <div className="bg-[#121826] rounded-xl">
    {/* Header – Minimal */}
    <div className="p-3.5 border-b border-[#1e2535]/30 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-[#D4AF37]" />
        <h3 className="text-white font-medium text-sm">Payment History</h3>
      </div>
      {isHistoryLoading && <RotateCw className="w-3.5 h-3.5 animate-spin text-[#D4AF37]/60" />}
    </div>

    {/* Empty State */}
    {history.length === 0 ? (
      <div className="p-6 text-center">
        <div className="w-10 h-10 bg-[#161d2a] rounded-full flex items-center justify-center mx-auto mb-2">
          <FileText className="w-5 h-5 text-[#D4AF37]/40" />
        </div>
        <p className="text-[#D4AF37]/60 text-sm">No payments yet</p>
      </div>
    ) : (
      /* History List – Tight, No Dividers */
      <div>
        {history.map((item, index) => (
          <div
            key={index}
            onClick={() => setSelectedPayment(item)}
            className="p-3.5 hover:bg-[#141b2a] cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-emerald-500/10 rounded-md">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">
                    {format(parseISO(`${item.month.slice(0,4)}-${item.month.slice(4)}-01`), 'MMM yyyy')}
                  </p>
                  <p className="text-[#D4AF37]/50 text-[10px] mt-0.5">
                    {item.date ? format(new Date(item.date), 'MMM dd, yyyy') : 'Collected'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-emerald-400 font-bold text-sm">${item.amount.toFixed(2)}</p>
                <ChevronRight className="w-4 h-4 text-[#D4AF37]/40 ml-auto mt-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}
      </div>
    </div>
  );

  const renderPendingReview = () => (
    <div className="max-w-md mx-auto">
      <div className="bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm rounded-2xl p-5  text-center">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-10 h-10 text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Application Under Review</h2>
        <p className="text-white/60 mb-6">
          Your application is being verified. This usually takes 24-48 hours.
          You'll receive a notification once approved.
        </p>
        <div className="bg-amber-500/10 rounded-xl p-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
            <p className="text-amber-400 font-medium">Verification in Progress</p>
          </div>
          <p className="text-sm text-white/60">Check back later for updates</p>
        </div>
      </div>
    </div>
  );

  if (loading) return renderLoading();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950">
      <BalanceCard />
      
      <div className="p-4 md:p-6">
        {!status?.isEligible && renderNotEligible()}
        {status?.isEligible && (!status?.applicationStatus || status?.applicationStatus === 'rejected') && renderApplicationForm()}
        {status?.applicationStatus === 'pending' && renderPendingReview()}
        {status?.applicationStatus === 'approved' && renderApprovedDashboard()}

        {(error || success) && (status?.applicationStatus === 'approved') && (
          <div className={`fixed bottom-4 right-4 max-w-md p-4 rounded-xl shadow-2xl border transition-all duration-300 animate-slideIn ${
            success 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            <div className="flex items-center gap-3">
              {success ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              )}
              <p className="text-sm">{success || error}</p>
              <button
                onClick={() => { setSuccess(''); setError(''); }}
                className="ml-4 p-1 hover:bg-white/10 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedPayment && (
        <ReceiptModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </div>
  );
};

export default MonthlySalary;