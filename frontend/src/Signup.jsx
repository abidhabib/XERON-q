import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Check, CircleCheck, Eye, EyeOff, LockKeyhole, Mail, MapPin, Phone, ShieldCheck, UserRound } from 'lucide-react';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10_000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ECONNABORTED') return Promise.reject(new Error('Request timed out. Please try again.'));
    if (!error.response) return Promise.reject(new Error('Network error. Please check your connection.'));
    return Promise.reject(error);
  }
);

const passwordScore = password => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
};

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ name: '', email: '', phoneNumber: '', password: '', confirmPassword: '', city: '', completeAddress: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [referrer, setReferrer] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const ref = new URLSearchParams(location.search).get('ref');
    if (ref && /^\d+$/.test(ref)) setReferrer(ref);
  }, [location.search]);

  const strength = useMemo(() => passwordScore(formData.password), [formData.password]);
  const passwordsMatch = formData.confirmPassword ? formData.password === formData.confirmPassword : null;
  const isLoading = status === 'loading';

  const updateField = useCallback(event => {
    const { name, value } = event.target;
    setFormData(previous => ({ ...previous, [name]: value }));
    setFieldErrors(previous => ({ ...previous, [name]: '' }));
    setMessage('');
  }, []);

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Enter a valid email address.';
    if (!/^03\d{9}$/.test(formData.phoneNumber.replace(/\s/g, ''))) errors.phoneNumber = 'Use a Pakistani number: 03xxxxxxxxx.';
    if (formData.password.length < 8) errors.password = 'Use at least 8 characters.';
    if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
    if (!formData.city.trim()) errors.city = 'Enter your state.';
    if (!formData.completeAddress.trim()) errors.completeAddress = 'Enter your city.';
    if (!acceptTerms) errors.terms = 'Please accept the terms to continue.';
    return errors;
  };

  const handleSubmit = async event => {
    event.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setStatus('error');
      setMessage('Review the highlighted fields and try again.');
      return;
    }
    setStatus('loading');
    setMessage('');
    try {
      const url = referrer ? `/register?ref=${referrer}` : '/register';
      const response = await api.post(url, formData);
      if (response.data.status !== 'success') throw new Error(response.data.error || 'Registration failed.');
      localStorage.setItem('Userid', response.data.userId);
      setStatus('success');
      setMessage('Account created. Taking you to secure payment…');
      window.setTimeout(() => navigate('/payment'), 1200);
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.error || error.message || 'Unable to create your account.');
    }
  };

  const inputClass = error => `h-12 w-full rounded-xl border bg-slate-50 px-11 pr-4 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'border-slate-200 focus:border-[#d5a927] focus:ring-[#d5a927]/15'} disabled:cursor-not-allowed disabled:opacity-60`;
  const fieldIcon = icon => <span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>;

  return (
    <div className="min-h-dvh bg-[#f5f5f3] text-slate-900">
      <header className="relative overflow-hidden rounded-b-[8px] bg-[#20252b] px-3 pb-8 pt-3 shadow-[0_10px_30px_rgba(25,31,38,0.16)] sm:rounded-b-[36px] sm:pb-10">
        <div className="mx-auto flex max-w-md justify-center"><img src="/logo.png" alt="Rovexking" className="h-12 w-auto object-contain sm:h-14" /></div>
        <div className="mx-auto mt-6 max-w-md text-center"><div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-[#efbf34] ring-1 ring-white/10"><ShieldCheck size={20} /></div><p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#efbf34]">Member registration</p><h1 className="mt-1.5 text-2xl font-bold tracking-tight text-white">Create your account</h1><p className="mt-1.5 text-sm leading-6 text-slate-300">A few details and you’ll be ready to begin.</p></div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pb-10 pt-5 sm:pt-7">
        <form onSubmit={handleSubmit} noValidate className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-6">
          <div className="mb-6 flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold">Your details</h2><p className="mt-1 text-sm text-slate-500">Fields marked with <span className="font-bold text-[#ad8200]">*</span> are required.</p></div>{referrer && <span className="shrink-0 rounded-full bg-[#f9f1d5] px-2.5 py-1 text-xs font-semibold text-[#8a6800]">Invited</span>}</div>

          {message && <div className={`mb-5 flex items-start gap-2.5 rounded-xl border px-3 py-3 text-sm ${status === 'success' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-rose-100 bg-rose-50 text-rose-700'}`} role="alert">{status === 'success' ? <CircleCheck aria-hidden="true" size={18} className="mt-0.5 shrink-0" /> : <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-current" />}{message}</div>}

          <div className="space-y-4">
            <div><label htmlFor="signup-name" className="mb-1.5 block text-sm font-medium text-slate-700">Full name <span className="text-[#ad8200]">*</span></label><div className="relative">{fieldIcon(<UserRound size={18} />)}<input id="signup-name" name="name" autoComplete="name" value={formData.name} onChange={updateField} disabled={isLoading} placeholder="Your full name" className={inputClass(fieldErrors.name)} /></div>{fieldErrors.name && <p className="mt-1.5 text-xs text-rose-600">{fieldErrors.name}</p>}</div>
            <div><label htmlFor="signup-email" className="mb-1.5 block text-sm font-medium text-slate-700">Email address <span className="text-[#ad8200]">*</span></label><div className="relative">{fieldIcon(<Mail size={18} />)}<input id="signup-email" name="email" type="email" autoComplete="email" value={formData.email} onChange={updateField} disabled={isLoading} placeholder="Enter Eamil Address" className={inputClass(fieldErrors.email)} /></div>{fieldErrors.email && <p className="mt-1.5 text-xs text-rose-600">{fieldErrors.email}</p>}</div>
            <div><label htmlFor="signup-phone" className="mb-1.5 block text-sm font-medium text-slate-700">Mobile number <span className="text-[#ad8200]">*</span></label><div className="relative">{fieldIcon(<Phone size={18} />)}<input id="signup-phone" name="phoneNumber" type="tel" autoComplete="tel" inputMode="numeric" value={formData.phoneNumber} onChange={updateField} disabled={isLoading} placeholder="03xxxxxxxxx" className={inputClass(fieldErrors.phoneNumber)} /></div>{fieldErrors.phoneNumber && <p className="mt-1.5 text-xs text-rose-600">{fieldErrors.phoneNumber}</p>}</div>
          </div>

          <div className="my-6 border-t border-slate-100 pt-6"><div className="mt-2 grid gap-4 sm:grid-cols-2"><div><label htmlFor="signup-state" className="mb-1.5 block text-sm font-medium text-slate-700">State <span className="text-[#ad8200]">*</span></label><div className="relative">{fieldIcon(<MapPin size={18} />)}<input id="signup-state" name="city" autoComplete="address-level1" value={formData.city} onChange={updateField} disabled={isLoading} placeholder="Your state" className={inputClass(fieldErrors.city)} /></div>{fieldErrors.city && <p className="mt-1.5 text-xs text-rose-600">{fieldErrors.city}</p>}</div><div><label htmlFor="signup-city" className="mb-1.5 block text-sm font-medium text-slate-700">City <span className="text-[#ad8200]">*</span></label><div className="relative">{fieldIcon(<MapPin size={18} />)}<input id="signup-city" name="completeAddress" autoComplete="address-level2" value={formData.completeAddress} onChange={updateField} disabled={isLoading} placeholder="Your city" className={inputClass(fieldErrors.completeAddress)} /></div>{fieldErrors.completeAddress && <p className="mt-1.5 text-xs text-rose-600">{fieldErrors.completeAddress}</p>}</div></div></div>

          <div className="my-6 border-t border-slate-100 pt-6"><h3 className="text-base font-bold">Secure your account</h3><p className="mt-1 text-sm text-slate-500">Use a strong password you don’t use elsewhere.</p><div className="mt-4 space-y-4"><div><label htmlFor="signup-password" className="mb-1.5 block text-sm font-medium text-slate-700">Password <span className="text-[#ad8200]">*</span></label><div className="relative">{fieldIcon(<LockKeyhole size={18} />)}<input id="signup-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={formData.password} onChange={updateField} disabled={isLoading} placeholder="At least 8 characters" className={inputClass(fieldErrors.password)} /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:text-[#ad8200] focus:outline-none focus:ring-2 focus:ring-[#d5a927]/30">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{formData.password && <div className="mt-2"><div className="flex h-1.5 gap-1" aria-label={`Password strength: ${strength} of 5`}><span className={`flex-1 rounded-full ${strength >= 1 ? 'bg-rose-400' : 'bg-slate-100'}`} /><span className={`flex-1 rounded-full ${strength >= 2 ? 'bg-amber-400' : 'bg-slate-100'}`} /><span className={`flex-1 rounded-full ${strength >= 3 ? 'bg-[#d5a927]' : 'bg-slate-100'}`} /><span className={`flex-1 rounded-full ${strength >= 4 ? 'bg-emerald-400' : 'bg-slate-100'}`} /><span className={`flex-1 rounded-full ${strength >= 5 ? 'bg-emerald-600' : 'bg-slate-100'}`} /></div><p className="mt-1.5 text-xs text-slate-500">Use 8+ characters, uppercase letters, numbers, and symbols.</p></div>}{fieldErrors.password && <p className="mt-1.5 text-xs text-rose-600">{fieldErrors.password}</p>}</div>
            <div><label htmlFor="signup-confirm-password" className="mb-1.5 block text-sm font-medium text-slate-700">Confirm password <span className="text-[#ad8200]">*</span></label><div className="relative">{fieldIcon(<LockKeyhole size={18} />)}<input id="signup-confirm-password" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" value={formData.confirmPassword} onChange={updateField} disabled={isLoading} placeholder="Repeat your password" className={inputClass(fieldErrors.confirmPassword || passwordsMatch === false)} /><button type="button" onClick={() => setShowConfirmPassword(value => !value)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'} className="absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:text-[#ad8200] focus:outline-none focus:ring-2 focus:ring-[#d5a927]/30">{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{passwordsMatch === true && <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-700"><Check aria-hidden="true" size={14} /> Passwords match</p>}{fieldErrors.confirmPassword && <p className="mt-1.5 text-xs text-rose-600">{fieldErrors.confirmPassword}</p>}</div></div></div>

          <div className="flex items-start gap-3"><input id="signup-terms" type="checkbox" checked={acceptTerms} onChange={event => { setAcceptTerms(event.target.checked); setFieldErrors(previous => ({ ...previous, terms: '' })); }} disabled={isLoading} className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-[#ad8200] focus:ring-[#d5a927]" /><label htmlFor="signup-terms" className="text-sm leading-6 text-slate-600">I agree to the <a className="font-semibold text-[#8a6800] underline-offset-2 hover:underline" href="/terms" target="_blank" rel="noreferrer">Terms of Service</a> and <a className="font-semibold text-[#8a6800] underline-offset-2 hover:underline" href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.</label></div>
          {fieldErrors.terms && <p className="mt-1.5 text-xs text-rose-600">{fieldErrors.terms}</p>}

          <button type="submit" disabled={isLoading || status === 'success'} className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-[#20252b] text-sm font-bold text-white shadow-sm transition hover:bg-[#313840] focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-70">{isLoading ? <span className="flex items-center gap-2"><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Creating account…</span> : status === 'success' ? 'Account created' : 'Create account'}</button>
          <p className="mt-6 text-center text-sm text-slate-500">Already a member? <Link to="/" className="font-bold text-[#8a6800] hover:text-[#614b00]">Sign in</Link></p>
        </form>
        <p className="mt-5 text-center text-xs leading-5 text-slate-400">Your account information is used only to provide and secure your membership.</p>
      </main>
    </div>
  );
};

export default Signup;
