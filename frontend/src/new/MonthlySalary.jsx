import React, { useState, useEffect, useContext, useCallback } from 'react';
import { UserContext } from '../UserContext/UserContext';
import axios from 'axios';
import {
  Coins, CheckCircle, RotateCw, History, Upload, User, Smartphone, MessageCircle,
  Trophy, Users, Calendar, AlertTriangle, FileText, ShieldCheck, ChevronDown,
  CreditCard, BadgeCheck, Clock, Target, Check,
} from 'lucide-react';
import NavBar from '../NavBar';
import { useNavigate } from 'react-router-dom';
import { RemoveTrailingZeros } from '../../utils/utils';

/* ── Confetti ── */
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
          if (timeLeft <= 0) return clearInterval(interval);
          confetti({ ...defaults, particleCount: 50 * (timeLeft / duration), origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 }, colors: ['#C6A15B', '#D8BA7C', '#161618', '#EDEDEE'] });
        }, 250);
      })
      .catch(console.warn);
  };
  return trigger;
};

/* ── Animated team gauge ── */
const TeamGauge = ({ current, required }) => {
  const pct = required ? Math.min(100, (current / required) * 100) : 0;
  const R = 54, C = 2 * Math.PI * R;
  const [offset, setOffset] = useState(C);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setOffset(C - (pct / 100) * C));
    return () => cancelAnimationFrame(raf);
  }, [pct, C]);
  return (
    <div className="relative w-32 h-32 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={R} fill="none" stroke="#212125" strokeWidth="7" />
        <circle cx="64" cy="64" r={R} fill="none" stroke="#C6A15B" strokeWidth="7" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="tnum text-[22px] font-semibold text-[#EDEDEE] leading-none">{current}<span className="text-[#6F6F76] text-[15px]">/{required}</span></p>
        <p className="fi text-[9px] uppercase tracking-[0.12em] text-[#6F6F76] mt-1">members</p>
      </div>
    </div>
  );
};

/* ── Countdown ── */
const CountdownTimer = ({ nextWindowStart }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    if (!nextWindowStart) return;
    const target = new Date(nextWindowStart);
    const update = () => {
      const diff = target - new Date();
      if (diff <= 0) return setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [nextWindowStart]);
  if (!nextWindowStart) return null;
  const units = [
    { value: timeLeft.days, label: 'Days' },
    { value: timeLeft.hours, label: 'Hours' },
    { value: timeLeft.minutes, label: 'Min' },
    { value: timeLeft.seconds, label: 'Sec' },
  ];
  return (
    <div className="rise rounded-xl bg-[#1B1B1E] ring-1 ring-white/[0.04] p-4 mt-4">
      <div className="flex items-center gap-2.5 mb-3">
        <Clock size={15} className="text-[#C6A15B]" />
        <div>
          <p className="fi text-[12.5px] font-semibold text-[#EDEDEE]">Next collection window</p>
          <p className="fi text-[10.5px] text-[#6F6F76]">Available again in</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {units.map((u) => (
          <div key={u.label} className="text-center rounded-lg bg-[#161618] ring-1 ring-white/[0.05] py-2.5">
            <p className="tnum text-[20px] font-semibold text-[#C6A15B] leading-none">{String(u.value).padStart(2, '0')}</p>
            <p className="fi text-[8.5px] uppercase tracking-[0.12em] text-[#6F6F76] mt-1">{u.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Upload field ── */
const UploadField = ({ label, description, accept, onChange, required, error, icon: Icon = Upload }) => {
  const [preview, setPreview] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert('File must be under 5 MB');
    onChange(file);
    setPreview(URL.createObjectURL(file));
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="fi text-[13px] font-medium text-[#A0A0A6] flex items-center gap-1.5">
          <Icon size={14} className="text-[#C6A15B]" />{label}{required && <span className="text-[#E2A896]">*</span>}
        </label>
        {description && <span className="fi text-[10.5px] text-[#6F6F76]">{description}</span>}
      </div>
      <label
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
        className={`relative flex flex-col items-center justify-center w-full h-32 rounded-xl ring-1 transition-all cursor-pointer group overflow-hidden ${
          error ? 'ring-[#E2A896]/40 bg-[#241619]/40'
            : isDragging ? 'ring-[#C6A15B] bg-[#C6A15B]/[0.06]'
            : preview ? 'ring-[#8FC7A0]/30'
            : 'ring-white/[0.06] bg-[#1B1B1E] hover:ring-[#C6A15B]/25'
        }`}
      >
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload size={22} className="text-white" />
            </div>
            <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#8FC7A0] flex items-center justify-center">
              <Check size={12} className="text-[#161618]" strokeWidth={3} />
            </span>
          </>
        ) : (
          <div className="text-center p-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 transition-colors ${isDragging ? 'bg-[#C6A15B]/20' : 'bg-[#212125]'}`}>
              <Icon size={18} className={isDragging ? 'text-[#C6A15B]' : 'text-[#6F6F76]'} />
            </div>
            <p className="fi text-[12.5px] font-medium text-[#EDEDEE]">{isDragging ? 'Drop file here' : 'Click or drag to upload'}</p>
            <p className="fi text-[10.5px] text-[#6F6F76] mt-0.5">PNG, JPG up to 5MB</p>
          </div>
        )}
        <input type="file" accept={accept} onChange={(e) => handleFile(e.target.files?.[0])} className="hidden" required={required} />
      </label>
      {error && <div className="fi flex items-center gap-1.5 text-[12px] text-[#E2A896]"><AlertTriangle size={13} />{error}</div>}
    </div>
  );
};

/* ── Phone input ── */
const PhoneInput = ({ value, onChange, placeholder, countryCode, onCountryChange, countryOptions, icon: Icon = Smartphone }) => {
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
    <div className="flex flex-col gap-2">
      <label className="fi text-[13px] font-medium text-[#A0A0A6] flex items-center gap-1.5">
        <Icon size={14} className="text-[#C6A15B]" />{placeholder}
      </label>
      <div className="flex gap-2">
        <div className="relative flex-shrink-0">
          <select value={countryCode} onChange={(e) => onCountryChange(e.target.value)}
            className="appearance-none h-12 pl-3 pr-8 rounded-xl bg-[#212125] text-[#EDEDEE] text-[13px] outline-none focus:ring-2 focus:ring-[#C6A15B]/40 cursor-pointer">
            {countryOptions.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6F6F76] pointer-events-none" />
        </div>
        <input type="tel" value={formatPhone(value)} onChange={handlePhoneChange} placeholder="Phone number" inputMode="numeric" required
          className="flex-1 min-w-0 h-12 px-3.5 rounded-xl bg-[#212125] text-[#EDEDEE] text-[14px] outline-none focus:ring-2 focus:ring-[#C6A15B]/40 placeholder:text-[#57575D]" />
      </div>
    </div>
  );
};

const inputCls = 'fi w-full h-12 px-4 text-[14px] text-[#EDEDEE] bg-[#212125] rounded-xl outline-none transition-all focus:bg-[#27272C] focus:ring-2 focus:ring-[#C6A15B]/40 placeholder:text-[#57575D]';

/* ── Main ── */
const MonthlySalary = () => {
  const { Userid } = useContext(UserContext);
  const API = import.meta.env.VITE_API_BASE_URL;
  const triggerConfetti = useConfetti();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadErrors, setUploadErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: '', documentType: 'nic', documentNumber: '',
    phoneCountryCode: '+1', phoneNumber: '', whatsappCountryCode: '+1', whatsappNumber: '',
    identityFront: null, identityBack: null, selfie: null,
  });

  const countryOptions = [
    { code: '+1', name: 'United States' }, { code: '+44', name: 'United Kingdom' }, { code: '+91', name: 'India' },
    { code: '+86', name: 'China' }, { code: '+81', name: 'Japan' }, { code: '+49', name: 'Germany' },
    { code: '+33', name: 'France' }, { code: '+61', name: 'Australia' }, { code: '+971', name: 'UAE' },
    { code: '+966', name: 'Saudi Arabia' }, { code: '+92', name: 'Pakistan' }, { code: '+94', name: 'Sri Lanka' },
  ].sort((a, b) => a.name.localeCompare(b.name));

  const fetchStatus = useCallback(async () => {
    if (!Userid) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API}/api/monthly-salary/status`, { withCredentials: true });
      setStatus(res.data);
    } catch {
      setError('Unable to load salary status. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [Userid, API]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

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
    if (!validateForm()) return setError('Please fill all required fields');
    setIsSubmitting(true); setError(''); setSuccess('');
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v); });
    try {
      await axios.post(`${API}/api/monthly-salary/apply`, formData, { withCredentials: true });
      setSuccess('Application submitted successfully! Verification usually takes 24-48 hours.');
      fetchStatus();
      setForm({ fullName: '', documentType: 'nic', documentNumber: '', phoneCountryCode: '+1', phoneNumber: '', whatsappCountryCode: '+1', whatsappNumber: '', identityFront: null, identityBack: null, selfie: null });
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCollect = async () => {
    try {
      const res = await axios.post(`${API}/api/monthly-salary/collect`, {}, { withCredentials: true });
      setSuccess(`Successfully collected $${RemoveTrailingZeros(res.data.amount)}!`);
      triggerConfetti();
      fetchStatus();
    } catch (err) {
      setError(err.response?.data?.error || 'Collection failed. Please try again later.');
    }
  };

  const pct = status?.requiredTeam ? Math.min(100, ((status.currentTeam || 0) / status.requiredTeam) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#161618]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@500;600&family=Inter:wght@400;500;600;700&display=swap');
        .fd { font-family: 'Cormorant', serif; }
        .fi { font-family: 'Inter', sans-serif; }
        .tnum { font-variant-numeric: tabular-nums; }
        @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .rise { animation: rise 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes auraBreathe { 0%,100% { opacity: 0.5; transform: scale(0.96); } 50% { opacity: 0.9; transform: scale(1.05); } }
        .aura-breathe { animation: auraBreathe 4s ease-in-out infinite; }
        @keyframes spinSlower { to { transform: rotate(360deg); } }
        .spin-slower { animation: spinSlower 26s linear infinite; }
        @keyframes amountBreathe { 0%,100% { opacity: 1; } 50% { opacity: 0.85; } }
        .amount-breathe { animation: amountBreathe 3s ease-in-out infinite; }
      `}</style>

      <NavBar />

      <main className="lg:pl-[120px] pb-28 lg:pb-12">
        <div className="relative max-w-2xl mx-auto px-3 sm:px-6 pt-4 lg:pt-10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-64"
            style={{ background: 'radial-gradient(70% 100% at 50% 0%, rgba(198,161,91,0.05), transparent 70%)' }} />

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-7 h-7 border-2 border-[#2E2E33] border-t-[#C6A15B] rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* ══ LOCKED — build your team ══ */}
              {!status?.isEligible && (
                <>
                  <div className="rise relative flex flex-col items-center text-center">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <div className="aura-breathe absolute inset-0 rounded-full blur-2xl" style={{ background: 'radial-gradient(circle, rgba(198,161,91,0.22), transparent 70%)' }} />
                      <div className="absolute inset-2 rounded-full border border-dashed border-[#C6A15B]/20 spin-slower" />
                      <div className="relative w-16 h-16 rounded-2xl bg-[#C6A15B]/10 ring-1 ring-[#C6A15B]/30 flex items-center justify-center">
                        <Trophy size={26} strokeWidth={1.8} className="text-[#C6A15B]" />
                      </div>
                    </div>
                    <h1 className="fd text-[26px] sm:text-[28px] font-medium text-[#EDEDEE] mt-5">Monthly Salary</h1>
                    <p className="fi text-[13px] text-[#A0A0A6] mt-1 max-w-[300px]">Build your team to unlock a guaranteed monthly income</p>
                  </div>

                  <div className="rise relative mt-6 rounded-2xl bg-[#1B1B1E] ring-1 ring-white/[0.04] p-5 text-center overflow-hidden" style={{ animationDelay: '0.06s' }}>
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-24" style={{ background: 'radial-gradient(70% 100% at 50% 0%, rgba(198,161,91,0.07), transparent 70%)' }} />
                    <p className="fi text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6F6F76]">Your potential earnings</p>
                    <p className="tnum amount-breathe text-[40px] font-semibold text-[#C6A15B] mt-1 leading-none">
                      ${RemoveTrailingZeros(status?.salaryAmount) || '0.00'}<span className="text-[18px] text-[#A0A0A6]">/mo</span>
                    </p>
                    <p className="fi text-[11px] text-[#6F6F76] mt-1.5">upon approval</p>
                  </div>

                  <div className="rise relative mt-4 rounded-2xl bg-[#1B1B1E] ring-1 ring-white/[0.04] p-5 flex items-center gap-5" style={{ animationDelay: '0.1s' }}>
                    <TeamGauge current={status?.currentTeam || 0} required={status?.requiredTeam || 1} />
                    <div className="flex-1 min-w-0">
                      <p className="fi text-[13.5px] font-semibold text-[#EDEDEE]">Team progress</p>
                      <p className="fi text-[11.5px] text-[#A0A0A6] mt-1">{status?.currentTeam || 0} of {status?.requiredTeam || 0} members · {Math.round(pct)}% there</p>
                      <button onClick={() => navigate('/team')} className="fi mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#C6A15B] hover:text-[#D8BA7C] transition-colors">
                        <Users size={14} /> Grow your team
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ══ APPLICATION FORM ══ */}
              {status?.isEligible && (!status?.applicationStatus || status?.applicationStatus === 'rejected') && (
                <>
                  <div className="rise relative">
                    <h1 className="fd text-[26px] sm:text-[28px] font-medium text-[#EDEDEE] leading-tight">Verify your identity</h1>
                    <p className="fi text-[13px] text-[#A0A0A6] mt-0.5">Complete your application to activate salary benefits</p>
                  </div>

                  <div className="rise relative flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-[#C6A15B]/[0.06] ring-1 ring-[#C6A15B]/15 mt-5" style={{ animationDelay: '0.05s' }}>
                    <ShieldCheck size={15} className="text-[#C6A15B] flex-shrink-0" />
                    <p className="fi text-[11.5px] text-[#A0A0A6]">Your documents are encrypted and reviewed securely.</p>
                  </div>

                  {(error || success) && (
                    <div className={`rise relative flex items-start gap-2.5 px-3.5 py-3 rounded-xl mt-4 ring-1 ${success ? 'bg-[#1E2A22] ring-[#8FC7A0]/20' : 'bg-[#241619] ring-[#E2A896]/20'}`}>
                      {success ? <CheckCircle size={16} className="text-[#8FC7A0] flex-shrink-0 mt-[1px]" /> : <AlertTriangle size={16} className="text-[#E2A896] flex-shrink-0 mt-[1px]" />}
                      <p className={`fi text-[13px] leading-snug ${success ? 'text-[#8FC7A0]' : 'text-[#E2A896]'}`}>{success || error}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="relative mt-5 flex flex-col gap-5" style={{ animationDelay: '0.1s' }}>
                    <div className="flex flex-col gap-2">
                      <label className="fi text-[13px] font-medium text-[#A0A0A6]">Full legal name</label>
                      <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Name as it appears on your ID" className={inputCls} required />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="fi text-[13px] font-medium text-[#A0A0A6]">Document type</label>
                        <div className="relative">
                          <select value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value })} className={`${inputCls} appearance-none pr-10 cursor-pointer`} required>
                            <option value="nic">National ID</option>
                            <option value="passport">Passport</option>
                            <option value="driving_license">Driving License</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6F6F76] pointer-events-none" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="fi text-[13px] font-medium text-[#A0A0A6]">Document number</label>
                        <input type="text" value={form.documentNumber} onChange={(e) => setForm({ ...form, documentNumber: e.target.value })} placeholder="ID number" className={inputCls} required />
                      </div>
                    </div>

                    <PhoneInput value={form.phoneNumber} onChange={(val) => setForm({ ...form, phoneNumber: val })} placeholder="Phone number" countryCode={form.phoneCountryCode} onCountryChange={(code) => setForm({ ...form, phoneCountryCode: code })} countryOptions={countryOptions} />
                    <PhoneInput value={form.whatsappNumber} onChange={(val) => setForm({ ...form, whatsappNumber: val })} placeholder="WhatsApp number" countryCode={form.whatsappCountryCode} onCountryChange={(code) => setForm({ ...form, whatsappCountryCode: code })} countryOptions={countryOptions} icon={MessageCircle} />

                    <div className="flex flex-col gap-4 pt-1">
                      <div>
                        <h3 className="fi text-[14px] font-semibold text-[#EDEDEE]">Verification documents</h3>
                        <p className="fi text-[11px] text-[#6F6F76] mt-0.5">Upload clear images for verification</p>
                      </div>
                      <UploadField label="ID front side" description="Clear image of front" accept="image/*" onChange={(file) => setForm({ ...form, identityFront: file })} required error={uploadErrors.identityFront} icon={CreditCard} />
                      <UploadField label="ID back side" description="Clear image of back" accept="image/*" onChange={(file) => setForm({ ...form, identityBack: file })} required error={uploadErrors.identityBack} icon={CreditCard} />
                      <UploadField label="Selfie with ID" description="Face + ID in one frame" accept="image/*" onChange={(file) => setForm({ ...form, selfie: file })} required error={uploadErrors.selfie} icon={User} />
                    </div>

                    <button type="submit" disabled={isSubmitting}
                      className={`fi w-full h-12 rounded-xl flex items-center justify-center gap-2 text-[14px] font-semibold transition-all active:scale-[0.99] ${isSubmitting ? 'bg-[#A9884A] text-[#161618] cursor-not-allowed' : 'bg-[#C6A15B] text-[#161618] hover:bg-[#D8BA7C] shadow-[0_10px_28px_rgba(198,161,91,0.14)]'}`}>
                      {isSubmitting ? <><RotateCw size={16} className="animate-spin" /> Processing…</> : <><ShieldCheck size={16} /> Submit application</>}
                    </button>
                  </form>
                </>
              )}

              {/* ══ PENDING REVIEW ══ */}
              {status?.applicationStatus === 'pending' && (
                <div className="rise relative flex flex-col items-center text-center py-10">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <div className="aura-breathe absolute inset-0 rounded-full blur-2xl" style={{ background: 'radial-gradient(circle, rgba(198,161,91,0.20), transparent 70%)' }} />
                    <div className="absolute inset-1 rounded-full border border-dashed border-[#C6A15B]/20 spin-slower" />
                    <div className="relative w-16 h-16 rounded-full bg-[#C6A15B]/10 ring-1 ring-[#C6A15B]/30 flex items-center justify-center">
                      <Clock size={26} strokeWidth={1.8} className="text-[#C6A15B]" />
                    </div>
                  </div>
                  <h2 className="fd text-[24px] font-medium text-[#EDEDEE] mt-5">Application under review</h2>
                  <p className="fi text-[12.5px] text-[#A0A0A6] mt-1.5 max-w-[280px] leading-relaxed">
                    Your application is being verified. This usually takes 24–48 hours — we'll notify you once approved.
                  </p>
                  <div className="flex items-center gap-2 mt-6 px-3.5 py-2 rounded-full bg-[#C6A15B]/[0.08] ring-1 ring-[#C6A15B]/20">
                    <span className="relative flex w-1.5 h-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C6A15B] opacity-60" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#C6A15B]" />
                    </span>
                    <span className="fi text-[11px] font-medium text-[#C6A15B]">Verification in progress</span>
                  </div>
                </div>
              )}

              {/* ══ APPROVED DASHBOARD ══ */}
              {status?.applicationStatus === 'approved' && (
                <>
                  <div className="rise relative flex items-center justify-between gap-3">
                    <div>
                      <h1 className="fd text-[26px] sm:text-[28px] font-medium text-[#EDEDEE] leading-tight">Monthly Salary</h1>
                      <p className="fi text-[13px] text-[#A0A0A6] mt-0.5">Your guaranteed monthly income</p>
                    </div>
                    <button onClick={() => navigate('/month-salary-history')} className="fi flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#1B1B1E] ring-1 ring-white/[0.05] text-[#A0A0A6] hover:text-[#EDEDEE] hover:ring-[#C6A15B]/20 text-[12px] font-medium transition-all flex-shrink-0">
                      <History size={14} /> History
                    </button>
                  </div>

                  {(error || success) && (
                    <div className={`rise relative flex items-start gap-2.5 px-3.5 py-3 rounded-xl mt-4 ring-1 ${success ? 'bg-[#1E2A22] ring-[#8FC7A0]/20' : 'bg-[#241619] ring-[#E2A896]/20'}`}>
                      {success ? <CheckCircle size={16} className="text-[#8FC7A0] flex-shrink-0 mt-[1px]" /> : <AlertTriangle size={16} className="text-[#E2A896] flex-shrink-0 mt-[1px]" />}
                      <p className={`fi text-[13px] leading-snug ${success ? 'text-[#8FC7A0]' : 'text-[#E2A896]'}`}>{success || error}</p>
                    </div>
                  )}

                  {/* Salary hero */}
                  <div className="rise relative mt-3 rounded-2xl bg-[#1B1B1E] ring-1 ring-white/[0.04] p-4 overflow-hidden" style={{ animationDelay: '0.06s' }}>
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-32" style={{ background: 'radial-gradient(70% 100% at 50% 0%, rgba(198,161,91,0.08), transparent 70%)' }} />
                    <div className="relative flex items-start justify-between">
                      <div>
                        <p className="fi text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6F6F76]">Your monthly salary</p>
                        <p className="tnum amount-breathe text-[42px] font-semibold text-[#C6A15B] mt-1 leading-none">
                          ${RemoveTrailingZeros(status?.salaryAmount) || '0.00'}
                        </p>
                        <span className="fi inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full bg-[#1E2A22] ring-1 ring-[#8FC7A0]/20 text-[10px] font-semibold text-[#8FC7A0]">
                          <BadgeCheck size={12} /> Active
                        </span>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-[#C6A15B]/10 ring-1 ring-[#C6A15B]/20 flex items-center justify-center flex-shrink-0">
                        <Trophy size={22} strokeWidth={1.8} className="text-[#C6A15B]" />
                      </div>
                    </div>
                    <button onClick={handleCollect} disabled={status?.hasCollectedThisMonth}
                      className={`relative fi w-full h-12 rounded-xl mt-5 flex items-center justify-center gap-2 text-[14px] font-semibold transition-all active:scale-[0.99] ${
                        status?.hasCollectedThisMonth ? 'bg-[#212125] text-[#57575D] cursor-not-allowed' : 'bg-[#C6A15B] text-[#161618] hover:bg-[#D8BA7C] shadow-[0_10px_28px_rgba(198,161,91,0.14)]'
                      }`}>
                      {status?.hasCollectedThisMonth ? <><CheckCircle size={16} /> Collected this month</> : <><Coins size={16} /> Collect ${RemoveTrailingZeros(status?.salaryAmount) || '0.00'}</>}
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="rise relative grid grid-cols-2 gap-3 mt-4" style={{ animationDelay: '0.1s' }}>
                    <div className="rounded-xl bg-[#1B1B1E] ring-1 ring-white/[0.04] p-3.5">
                      <div className="flex items-center gap-1.5 text-[#6F6F76]"><Users size={13} /><span className="fi text-[10px] font-semibold uppercase tracking-[0.12em]">Team</span></div>
                      <p className="tnum text-[16px] font-semibold text-[#EDEDEE] mt-1.5">{status?.currentTeam || 0}/{status?.requiredTeam || 0}</p>
                      <p className="fi text-[10px] text-[#6F6F76] mt-0.5">members</p>
                    </div>
                    <div className="rounded-xl bg-[#1B1B1E] ring-1 ring-white/[0.04] p-3.5">
                      <div className="flex items-center gap-1.5 text-[#6F6F76]"><Calendar size={13} /><span className="fi text-[10px] font-semibold uppercase tracking-[0.12em]">This month</span></div>
                      <p className={`tnum text-[16px] font-semibold mt-1.5 ${status?.hasCollectedThisMonth ? 'text-[#A0A0A6]' : 'text-[#8FC7A0]'}`}>{status?.hasCollectedThisMonth ? 'Collected' : 'Ready'}</p>
                      <p className="fi text-[10px] text-[#6F6F76] mt-0.5">{status?.hasCollectedThisMonth ? 'see you next cycle' : 'collect now'}</p>
                    </div>
                  </div>

                  {status?.hasCollectedThisMonth && status?.nextCollectionWindowStart && (
                    <CountdownTimer nextWindowStart={status.nextCollectionWindowStart} />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default MonthlySalary;