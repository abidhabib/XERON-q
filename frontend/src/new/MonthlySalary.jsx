// src/pages/MonthlySalary.jsx
import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { UserContext } from '../UserContext/UserContext';
import axios from 'axios';
import {
  Coins,
  AlertTriangle,
  CheckCircle,
  RotateCw,
  History,
  Upload,
  User,
  Smartphone,
  MessageCircle,
  Trophy,
  Users,
  TrendingUp,
  Calendar,
  Star,
  Eye
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import BalanceCard from './BalanceCard';

// ✅ Self-contained Confetti Hook (no external file)
const useConfetti = () => {
  const trigger = () => {
    if (typeof window === 'undefined') return;

    // Dynamically import confetti only when needed
    import('canvas-confetti')
      .then((confettiModule) => {
        const confetti = confettiModule.default;
        if (confetti) {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#D4AF37', '#c69c2e', '#FFFFFF', '#FFD700']
          });
        }
      })
      .catch((err) => console.warn('Confetti failed to load:', err));
  };
  return trigger;
};

// ✅ Enhanced UploadField with better UX
const UploadField = ({ label, accept, onChange, required, error }) => {
  const [preview, setPreview] = useState('');

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be under 5 MB');
        return;
      }
      onChange(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  return (
    <div>
      <label className="text-[#D4AF37]/70 text-xs block mb-1.5 flex items-center gap-1.5">
        <Upload className="w-3 h-3" />
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors
        ${error 
          ? 'border-rose-500 bg-rose-900/10' 
          : 'border-[#1c2a3a] bg-[#1c2a3a] hover:bg-[#202c3b]'
        }`}>
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
        ) : (
          <div className="text-center">
            <Upload className="w-5 h-5 text-[#D4AF37]/50 mx-auto mb-1" />
            <span className="text-[#D4AF37]/50 text-xs">Tap to upload image</span>
          </div>
        )}
        <input
          type="file"
          accept={accept}
          onChange={handleFile}
          className="hidden"
          required={required}
        />
      </label>
      {error && <p className="text-rose-400 text-xs mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {error}</p>}
    </div>
  );
};

// ✅ Phone input with digit-only enforcement
const PhoneInput = ({ value, onChange, placeholder, countryCode, onCountryChange, countryOptions }) => {
  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, ''); // digits only
    onChange(val);
  };

  return (
    <div className="flex gap-2">
      <select
        value={countryCode}
        onChange={(e) => onCountryChange(e.target.value)}
        className="w-1/3 bg-[#1c2a3a] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
      >
        {countryOptions.map((country) => (
          <option key={country.code} value={country.code}>
            {country.code}
          </option>
        ))}
      </select>
      <input
        type="tel"
        value={value}
        onChange={handlePhoneChange}
        className="flex-1 bg-[#1c2a3a] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
        placeholder={placeholder}
        inputMode="numeric"
        required
      />
    </div>
  );
};

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
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [hasFetchedHistory, setHasFetchedHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const countryOptions = [
    { code: '+93', name: 'Afghanistan' },
    { code: '+355', name: 'Albania' },
    { code: '+213', name: 'Algeria' },
    { code: '+376', name: 'Andorra' },
    { code: '+244', name: 'Angola' },
    { code: '+54', name: 'Argentina' },
    { code: '+374', name: 'Armenia' },
    { code: '+61', name: 'Australia' },
    { code: '+43', name: 'Austria' },
    { code: '+994', name: 'Azerbaijan' },

    { code: '+973', name: 'Bahrain' },
    { code: '+880', name: 'Bangladesh' },
    { code: '+32', name: 'Belgium' },
    { code: '+229', name: 'Benin' },
    { code: '+591', name: 'Bolivia' },
    { code: '+387', name: 'Bosnia and Herzegovina' },
    { code: '+267', name: 'Botswana' },
    { code: '+55', name: 'Brazil' },
    { code: '+359', name: 'Bulgaria' },

    { code: '+855', name: 'Cambodia' },
    { code: '+1', name: 'Canada' },
    { code: '+237', name: 'Cameroon' },
    { code: '+56', name: 'Chile' },
    { code: '+86', name: 'China' },
    { code: '+57', name: 'Colombia' },
    { code: '+506', name: 'Costa Rica' },
    { code: '+385', name: 'Croatia' },
    { code: '+357', name: 'Cyprus' },
    { code: '+420', name: 'Czech Republic' },

    { code: '+45', name: 'Denmark' },
    { code: '+20', name: 'Egypt' },
    { code: '+372', name: 'Estonia' },
    { code: '+251', name: 'Ethiopia' },

    { code: '+358', name: 'Finland' },
    { code: '+33', name: 'France' },

    { code: '+49', name: 'Germany' },
    { code: '+233', name: 'Ghana' },
    { code: '+30', name: 'Greece' },

    { code: '+852', name: 'Hong Kong' },
    { code: '+36', name: 'Hungary' },

    { code: '+91', name: 'India' },
    { code: '+62', name: 'Indonesia' },
    { code: '+98', name: 'Iran' },
    { code: '+964', name: 'Iraq' },
    { code: '+353', name: 'Ireland' },
    { code: '+972', name: 'Israel' },
    { code: '+39', name: 'Italy' },

    { code: '+81', name: 'Japan' },
    { code: '+962', name: 'Jordan' },

    { code: '+254', name: 'Kenya' },
    { code: '+965', name: 'Kuwait' },

    { code: '+371', name: 'Latvia' },
    { code: '+961', name: 'Lebanon' },
    { code: '+218', name: 'Libya' },
    { code: '+370', name: 'Lithuania' },
    { code: '+352', name: 'Luxembourg' },

    { code: '+60', name: 'Malaysia' },
    { code: '+212', name: 'Morocco' },
    { code: '+52', name: 'Mexico' },

    { code: '+31', name: 'Netherlands' },
    { code: '+64', name: 'New Zealand' },
    { code: '+234', name: 'Nigeria' },
    { code: '+47', name: 'Norway' },

    { code: '+968', name: 'Oman' },

    { code: '+92', name: 'Pakistan' },
    { code: '+63', name: 'Philippines' },
    { code: '+48', name: 'Poland' },
    { code: '+351', name: 'Portugal' },

    { code: '+974', name: 'Qatar' },

    { code: '+40', name: 'Romania' },
    { code: '+7', name: 'Russia' },

    { code: '+966', name: 'Saudi Arabia' },
    { code: '+221', name: 'Senegal' },
    { code: '+65', name: 'Singapore' },
    { code: '+27', name: 'South Africa' },
    { code: '+82', name: 'South Korea' },
    { code: '+34', name: 'Spain' },
    { code: '+94', name: 'Sri Lanka' },
    { code: '+46', name: 'Sweden' },
    { code: '+41', name: 'Switzerland' },

    { code: '+255', name: 'Tanzania' },
    { code: '+66', name: 'Thailand' },
    { code: '+216', name: 'Tunisia' },
    { code: '+90', name: 'Turkey' },

    { code: '+971', name: 'United Arab Emirates' },
    { code: '+44', name: 'United Kingdom' },
    { code: '+1', name: 'United States' },

    { code: '+84', name: 'Vietnam' },
    { code: '+263', name: 'Zimbabwe' },
    { code: '+00', name: 'Others' }
  ].sort((a, b) => a.name.localeCompare(b.name));

  const fetchStatus = useCallback(async () => {
    if (!Userid) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API}/api/monthly-salary/status`, { withCredentials: true });
      setStatus(res.data);
    } catch (err) {
      setError('Unable to load salary program status. Please try again.');
      console.error('Status fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [Userid, API]);

  const fetchHistory = async () => {
    if (!Userid || hasFetchedHistory) return;
    setIsHistoryLoading(true);
    try {
      const res = await axios.get(`${API}/api/monthly-salary/history`, { withCredentials: true });
      setHistory(res.data.history || []);
      setHasFetchedHistory(true);
    } catch (err) {
      console.error('History fetch failed:', err);
      setError('Failed to load payment history.');
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!form.identityFront) errors.identityFront = 'Required';
    if (!form.identityBack) errors.identityBack = 'Required';
    if (!form.selfie) errors.selfie = 'Required';
    setUploadErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('fullName', form.fullName.trim());
    formData.append('documentType', form.documentType);
    formData.append('documentNumber', form.documentNumber.trim());
    formData.append('phoneCountryCode', form.phoneCountryCode);
    formData.append('phoneNumber', form.phoneNumber);
    formData.append('whatsappCountryCode', form.whatsappCountryCode);
    formData.append('whatsappNumber', form.whatsappNumber);
    formData.append('identityFront', form.identityFront);
    formData.append('identityBack', form.identityBack);
    formData.append('selfie', form.selfie);

    try {
      await axios.post(`${API}/api/monthly-salary/apply`, formData, {
        withCredentials: true,
      });
      setSuccess('Your application has been submitted successfully. Our team will review it shortly.');
      fetchStatus();
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCollect = async () => {
    try {
      const res = await axios.post(`${API}/api/monthly-salary/collect`, {}, { withCredentials: true });
      setSuccess(`🎉 Salary of $${res.data.amount} collected successfully!`);
      triggerConfetti(); // ✨ Celebrate!
      fetchStatus();
      if (!hasFetchedHistory) fetchHistory();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to collect salary.');
    }
  };
useEffect(() => {
  console.log('Frontend User ID:', Userid);
}, [Userid]);
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Group history by month (YYYYMM)
  const groupedHistory = history.reduce((acc, item) => {
    const monthKey = item.month; // e.g., "202512"
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#111827] items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#111827]">
      <BalanceCard />
      <div className="px-4 py-4 flex-1">
        {!status?.isEligible && (
          <div className="bg-[#19202a] rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-[#1c2a3a] rounded-full flex items-center justify-center mx-auto mb-5">
              <Coins className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-3">Monthly Salary Program</h2>
            <p className="text-[#D4AF37]/80 text-sm mb-5">
              Unlock a guaranteed monthly income by building your team.
            </p>
            
            {status?.currentWindow && (
              <div className="bg-[#1c2a3a] rounded-xl p-3.5 mb-5 text-[#D4AF37]/70 text-xs font-medium">
                Active Window: {status.currentWindow.start} – {status.currentWindow.end}
              </div>
            )}

            <div className="bg-[#1c2a3a] rounded-xl p-4 mb-5">
              <p className="text-[#D4AF37]/70 text-xs mb-1.5">Potential Earnings</p>
              <p className="text-white text-xl font-bold">${status?.salaryAmount?.toFixed(2) || '0.00'}</p>
            </div>
            
            <div className="bg-[#1c2a3a] rounded-xl p-4">
              <p className="text-[#D4AF37]/70 text-xs mb-2">Team Progress (This Window)</p>
              <p className="text-white font-semibold text-lg">{status?.currentTeam || 0} / {status?.requiredTeam || 0} members</p>
              <div className="mt-2.5 h-2 bg-[#1c2a3a] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#D4AF37] to-[#c69c2e]"
                  style={{ width: `${status?.requiredTeam ? Math.min(100, (status.currentTeam / status.requiredTeam) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {status?.applicationStatus === 'pending' && (
          <div className="bg-[#19202a] rounded-2xl p-6 text-center">
            <div className="w-14 h-14 bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-amber-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Application Under Review</h3>
            <p className="text-[#D4AF37]/70 text-sm">
              Our compliance team is verifying your identity documents. You’ll receive a notification within 24–48 hours.
            </p>
          </div>
        )}

        {(!status?.applicationStatus || status?.applicationStatus === 'rejected') && status?.isEligible && (
          <div className="bg-[#19202a] rounded-2xl p-3">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-[#D4AF37]" />
              <h2 className="text-lg font-semibold text-white">Submit Salary Application</h2>
            </div>
            <p className="text-[#D4AF37]/70 text-xs mb-5">
              Provide valid identification to activate your monthly salary benefit.
            </p>

            {error && (
              <div className="bg-rose-900/20 border border-rose-800/50 rounded-xl p-3 mb-5 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                <span className="text-rose-400 text-sm">{error}</span>
              </div>
            )}
            {success && (
              <div className="bg-emerald-900/20 border border-emerald-800/50 rounded-xl p-3 mb-5 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-emerald-400 text-sm">{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[#D4AF37]/70 text-xs block mb-1.5 flex items-center gap-1">
                  <User className="w-3 h-3" /> Full Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full bg-[#1c2a3a] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  placeholder="As per government ID"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#D4AF37]/70 text-xs block mb-1.5">ID Type</label>
                  <select
                    value={form.documentType}
                    onChange={(e) => setForm({ ...form, documentType: e.target.value })}
                    className="w-full bg-[#1c2a3a] text-white rounded-xl px-4 py-3 text-sm focus:outline-none"
                    required
                  >
                    <option value="nic">National ID Card</option>
                    <option value="passport">Passport</option>
                    <option value="driving_license">Driving License</option>
                  </select>
                </div>
                <div>
                  <label className="text-[#D4AF37]/70 text-xs block mb-1.5">ID Number</label>
                  <input
                    type="text"
                    value={form.documentNumber}
                    onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
                    className="w-full bg-[#1c2a3a] text-white rounded-xl px-4 py-3 text-sm focus:outline-none"
                    placeholder="Enter document number"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[#D4AF37]/70 text-xs block mb-1.5 flex items-center gap-1">
                    <Smartphone className="w-3 h-3" /> Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <PhoneInput
                    value={form.phoneNumber}
                    onChange={(val) => setForm({ ...form, phoneNumber: val })}
                    placeholder="1234567890"
                    countryCode={form.phoneCountryCode}
                    onCountryChange={(code) => setForm({ ...form, phoneCountryCode: code })}
                    countryOptions={countryOptions}
                  />
                </div>

                <div>
                  <label className="text-[#D4AF37]/70 text-xs block mb-1.5 flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" /> WhatsApp Number <span className="text-rose-500">*</span>
                  </label>
                  <PhoneInput
                    value={form.whatsappNumber}
                    onChange={(val) => setForm({ ...form, whatsappNumber: val })}
                    placeholder="1234567890"
                    countryCode={form.whatsappCountryCode}
                    onCountryChange={(code) => setForm({ ...form, whatsappCountryCode: code })}
                    countryOptions={countryOptions}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <UploadField
                  label="Government ID (Front)"
                  accept="image/*"
                  onChange={(file) => {
                    setForm({ ...form, identityFront: file });
                    setUploadErrors(prev => ({ ...prev, identityFront: '' }));
                  }}
                  required
                  error={uploadErrors.identityFront}
                />
                <UploadField
                  label="Government ID (Back)"
                  accept="image/*"
                  onChange={(file) => {
                    setForm({ ...form, identityBack: file });
                    setUploadErrors(prev => ({ ...prev, identityBack: '' }));
                  }}
                  required
                  error={uploadErrors.identityBack}
                />
                <UploadField
                  label="Clear Selfie (Face Visible)"
                  accept="image/*"
                  onChange={(file) => {
                    setForm({ ...form, selfie: file });
                    setUploadErrors(prev => ({ ...prev, selfie: '' }));
                  }}
                  required
                  error={uploadErrors.selfie}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-3 py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#c69c2e] text-gray-900 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-80"
              >
                {isSubmitting ? <RotateCw className="w-4 h-4 animate-spin" /> : 'Submit Application'}
              </button>
            </form>
          </div>
        )}

        {status?.applicationStatus === 'approved' && (
          <>
            {/* Salary Info Card */}
            <div className="bg-gradient-to-br from-[#1c2a3a] to-[#19202a] rounded-2xl p-5 mb-4 border border-[#222f3f]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#D4AF37]/70 text-sm font-medium flex items-center gap-1.5">
                    <Trophy className="w-4 h-4" />
                    Monthly Salary
                  </p>
                  <p className="text-white text-2xl font-bold mt-1">${status.salaryAmount?.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-900/20 px-3 py-1.5 rounded-full">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 text-xs font-medium">Approved</span>
                </div>
              </div>
            </div>

            {/* Motivation Cards */}
            <div className="grid grid-cols-1 gap-3 mb-5">
              <div className="bg-[#1c2a3a] rounded-xl p-4 border border-[#222f3f]">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-900/20 rounded-lg">
                    <Users className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-sm">Build Your Team</h3>
                    <p className="text-[#D4AF37]/70 text-xs mt-1">
                      Recruit {status.requiredTeam} members to unlock higher rewards.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-[#1c2a3a] rounded-xl p-4 border border-[#222f3f]">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-900/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-sm">Passive Income</h3>
                    <p className="text-[#D4AF37]/70 text-xs mt-1">
                      Earn ${status.salaryAmount} every month — automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Collect Button */}
            <button
              onClick={handleCollect}
              disabled={status.hasCollectedThisMonth}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-200 ${
                status.hasCollectedThisMonth
                  ? 'bg-[#1c2a3a] text-[#D4AF37]/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#D4AF37] to-[#c69c2e] text-gray-900 hover:shadow-lg hover:scale-[1.02] active:scale-[1.00]'
              }`}
            >
              {status.hasCollectedThisMonth ? (
                <>
                  <Star className="w-5 h-5" />
                  Collected This Month
                </>
              ) : (
                'Collect Salary'
              )}
            </button>

            {/* History Toggle */}
            <button
              onClick={() => {
                if (!hasFetchedHistory) fetchHistory();
                setShowHistory(!showHistory);
              }}
              disabled={isHistoryLoading}
              className="w-full mt-4 py-3 bg-[#19202a] hover:bg-[#1c2a3a] rounded-xl text-[#D4AF37] font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {isHistoryLoading ? (
                <RotateCw className="w-4 h-4 animate-spin" />
              ) : (
                <History className="w-4 h-4" />
              )}
              {showHistory ? 'Hide History' : 'View Salary History'}
            </button>

            {/* Animated History Section */}
            {showHistory && history.length > 0 && (
              <div className="mt-5 space-y-4">
                {Object.entries(groupedHistory).map(([monthKey, payments]) => {
                  const date = parseISO(`${monthKey.slice(0,4)}-${monthKey.slice(4)}-01`);
                  return (
                    <div key={monthKey} className="bg-[#19202a] rounded-xl p-4 border border-[#222f3f] animate-fadeIn">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#D4AF37]" />
                          <h3 className="text-white font-semibold">
                            {format(date, 'MMMM yyyy')}
                          </h3>
                        </div>
                        <span className="text-emerald-400 font-bold text-lg">
                          ${payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {payments.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-[#D4AF37]/70">Payment</span>
                            <span className="text-white">${item.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Alerts */}
            {error && (
              <div className="mt-4 p-3 bg-rose-900/20 border border-rose-800/50 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400 mt-0.5" />
                <span className="text-rose-400 text-sm">{error}</span>
              </div>
            )}
            {success && (
              <div className="mt-4 p-3 bg-emerald-900/20 border border-emerald-800/50 rounded-xl flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                <span className="text-emerald-400 text-sm">{success}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MonthlySalary;