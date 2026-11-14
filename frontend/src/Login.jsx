import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, X } from 'lucide-react';
import { UserContext } from './UserContext/UserContext';
import { useToast } from './ToastContext';

export const Login = () => {
  const { paymentOk, isAuthCheckComplete, fetchUserData, isRejected, isAuthenticated, approved } = useContext(UserContext);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [values, setValues] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [sendingRecovery, setSendingRecovery] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (isRejected || paymentOk === 0) navigate('/payment');
    else if (approved === 1 && paymentOk === 1) navigate('/wallet-page');
    else if (paymentOk === 1 && approved === 0) navigate('/waiting');
  }, [isAuthenticated, isRejected, approved, paymentOk, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/login`, values, { withCredentials: true });
      if (response.data.Status === 'Success') await fetchUserData();
      else setError(response.data.Error || 'Unable to sign in with those details.');
    } catch (_) {
      setError('Unable to sign in right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecovery = async () => {
    if (!recoveryEmail) return;
    setSendingRecovery(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/sendPassword`, { userEmail: recoveryEmail });
      setShowRecovery(false);
      showToast('Password reset instructions sent.', 'success');
    } catch (_) {
      showToast('No account was found for that email.', 'error');
    } finally {
      setSendingRecovery(false);
    }
  };

  if (!isAuthCheckComplete) {
    return <div className="min-h-screen grid place-items-center bg-[#f5f5f3]"><span className="w-7 h-7 rounded-full border-2 border-slate-200 border-t-[#d5a927] animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f3] text-slate-900">
      <header className="relative overflow-hidden rounded-b-[8px] bg-[#20252b] px-3 pb-3 pt-3 shadow-[0_10px_30px_rgba(25,31,38,0.16)] sm:rounded-b-[36px]">
        <div className="mx-auto flex max-w-md items-center justify-center">
          <img src="/logo.png" alt="Rovexking" className="h-12 w-auto object-contain sm:h-14" />
        </div>
        <div className="mx-auto mt-7 max-w-md text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#efbf34] ring-1 ring-white/10"><ShieldCheck size={20} /></div>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#efbf34]">Secure access</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-white">Welcome back</h1>
          <p className="mt-1.5 text-sm leading-6 text-slate-300">Sign in to manage your account and rewards.</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pb-10 pt-5 sm:pt-7">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Sign in</h2>
            <p className="mt-1 text-sm text-slate-500">Enter your account details below.</p>
          </div>

          {error && <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50 px-3 py-3 text-sm text-rose-700" role="alert"><span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" />{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-slate-700">Email address</label>
              <div className="relative"><Mail aria-hidden="true" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input id="login-email" type="email" autoComplete="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} placeholder="Your Email Address" required className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-[15px] text-slate-900 outline-none transition focus:border-[#d5a927] focus:bg-white focus:ring-4 focus:ring-[#d5a927]/15" /></div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3"><label htmlFor="login-password" className="text-sm font-medium text-slate-700">Password</label><button type="button" onClick={() => { setRecoveryEmail(values.email); setShowRecovery(true); }} className="min-h-[36px] text-sm font-semibold text-[#ad8200] hover:text-[#765800] focus:outline-none focus:underline">Forgot password?</button></div>
              <div className="relative"><LockKeyhole aria-hidden="true" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} placeholder="Enter your password" required className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-[15px] text-slate-900 outline-none transition focus:border-[#d5a927] focus:bg-white focus:ring-4 focus:ring-[#d5a927]/15" /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:text-[#ad8200] focus:outline-none focus:ring-2 focus:ring-[#d5a927]/30">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
            </div>

            <button type="submit" disabled={submitting} className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-[#20252b] text-sm font-bold text-white shadow-sm transition hover:bg-[#313840] focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-70">{submitting ? <span className="flex items-center gap-2"><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Signing in…</span> : 'Sign in securely'}</button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">New here? <Link to="/register" className="font-bold text-[#ad8200] hover:text-[#765800]">Create an account</Link></p>
        </section>
        <p className="mt-5 text-center text-xs leading-5 text-slate-400">Protected account access. Keep your password private and never share verification codes.</p>
      </main>

      {showRecovery && <div className="fixed inset-0 z-50 flex items-end bg-slate-950/40 p-0 backdrop-blur-[2px] sm:items-center sm:justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="recovery-title" onMouseDown={() => setShowRecovery(false)}><section className="w-full rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-sm sm:rounded-2xl" onMouseDown={event => event.stopPropagation()}><div className="flex items-start justify-between gap-3"><div><h2 id="recovery-title" className="text-lg font-bold text-slate-900">Reset password</h2><p className="mt-1 text-sm text-slate-500">We’ll send recovery instructions to your email.</p></div><button type="button" aria-label="Close" onClick={() => setShowRecovery(false)} className="grid h-11 w-11 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"><X size={20} /></button></div><label htmlFor="recovery-email" className="mb-1.5 mt-5 block text-sm font-medium text-slate-700">Email address</label><input id="recovery-email" type="email" autoComplete="email" value={recoveryEmail} onChange={event => setRecoveryEmail(event.target.value)} placeholder="Your Email Address" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-[15px] outline-none focus:border-[#d5a927] focus:bg-white focus:ring-4 focus:ring-[#d5a927]/15" /><button type="button" onClick={handleRecovery} disabled={!recoveryEmail || sendingRecovery} className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-[#20252b] text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{sendingRecovery ? 'Sending…' : 'Send recovery email'}</button></section></div>}
    </div>
  );
};
