import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext/UserContext';
import { useToast } from './ToastContext';

export const Login = () => {
  const { paymentOk, isAuthCheckComplete, fetchUserData, isRejected, isAuthenticated, approved } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [values, setValues] = useState({ email: '', password: '' });
  const [showModal, setShowModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;
    axios.get(`${import.meta.env.VITE_API_BASE_URL}`, { withCredentials: true })
      .then(res => {
        if (isMounted && res.data.Status === '!valid') navigate('/');
      })
      .catch(err => console.error("Error: ", err));
    return () => { isMounted = false; };
  }, [navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      if (isRejected || paymentOk === 0) navigate('/payment');
      else if (approved === 1 && paymentOk === 1) navigate('/wallet-page');
      else if (paymentOk === 1 && approved === 0) navigate('/waiting');
      else navigate('/');
    }
  }, [isAuthenticated, isRejected, approved, paymentOk, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/login`, values, { withCredentials: true });
      if (res.data.Status === "Success") await fetchUserData();
      else setError(res.data.Error);
    } catch (err) {
      console.error("Error: ", err);
      setError("An unexpected error occurred. Please try again.");
    }
    setLoading(false);
  };

  const handleSendPassword = () => {
    setLoading(true);
    axios.post(`${import.meta.env.VITE_API_BASE_URL}/sendPassword`, { userEmail })
      .then(() => { setLoading(false); setShowModal(false); showToast('Password Sent', 'success'); })
      .catch(() => { setLoading(false); showToast('Email Not Found', 'error'); });
  };

  const handleSocialClick = (provider) => showToast(`${provider} sign-in coming soon`, 'info');

  const SecureBadge = () => (
    <div className="flex items-center gap-2 h-8 px-3 rounded-full bg-[#212125]">
      <span className="relative flex w-1.5 h-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C6A15B] opacity-60" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#C6A15B]" />
      </span>
      <span className="fi text-[11px] font-medium text-[#A0A0A6]">24/7 Online</span>
    </div>
  );

  // The form — shared by desktop panel and mobile bottom sheet
  const formContent = (
    <>
      {error && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[#241619] mb-5">
          <svg className="w-4 h-4 text-[#D08B74] flex-shrink-0 mt-[1px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="fi text-[13px] text-[#E2A896] leading-snug">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="fi text-[13px] font-medium text-[#A0A0A6]">Email</label>
          <input
            type="email"
            value={values.email}
            onChange={(e) => setValues({ ...values, email: e.target.value })}
            placeholder="you@example.com"
            className="fi w-full h-12 px-4 text-[14.5px] text-[#EDEDEE] bg-[#212125] rounded-xl outline-none transition-all duration-200 focus:bg-[#27272C] focus:ring-2 focus:ring-[#C6A15B]/30 placeholder:text-[#57575D]"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="fi text-[13px] font-medium text-[#A0A0A6]">Password</label>
            <button
              type="button"
              onClick={() => { setUserEmail(values.email); setShowModal(true); }}
              className="fi text-[12.5px] font-medium text-[#6F6F76] hover:text-[#C6A15B] transition-colors"
            >
              Forgot?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={values.password}
              onChange={(e) => setValues({ ...values, password: e.target.value })}
              placeholder="••••••••"
              className="fi w-full h-12 px-4 pr-11 text-[14.5px] text-[#EDEDEE] bg-[#212125] rounded-xl outline-none transition-all duration-200 focus:bg-[#27272C] focus:ring-2 focus:ring-[#C6A15B]/30 placeholder:text-[#57575D]"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6F6F76] hover:text-[#C6A15B] transition-colors"
            >
              {showPassword ? (
                <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.16m-4.78-4.78L3 3" />
                  <path d="M1 1l22 22" />
                </svg>
              ) : (
                <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`fi mt-1 w-full h-12 flex items-center justify-center rounded-xl text-[14.5px] font-semibold transition-all duration-200 disabled:cursor-not-allowed ${
            loading
              ? 'bg-[#A9884A] text-[#161618]'
              : 'bg-[#C6A15B] text-[#161618] hover:bg-[#D8BA7C] shadow-[0_10px_28px_rgba(198,161,91,0.14)]'
          }`}
        >
          {loading ? (
            <div className="w-[18px] h-[18px] border-2 border-[#161618]/25 border-t-[#161618] rounded-full animate-spin" />
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      

     
      <p className="fi text-center text-[13.5px] text-[#A0A0A6] mt-7">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-[#C6A15B] hover:text-[#D8BA7C] transition-colors">
          Sign up
        </Link>
      </p>
    </>
  );

  if (!isAuthCheckComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#161618]">
        <div className="w-7 h-7 border-2 border-[#2E2E33] border-t-[#C6A15B] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#161618] px-3">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@500;600&family=Inter:wght@400;500;600&display=swap');
        .fd { font-family: 'Cormorant', serif; }
        .fi { font-family: 'Inter', sans-serif; }
        ::selection { background: rgba(198,161,91,0.28); color: #EDEDEE; }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #212125 inset;
          -webkit-text-fill-color: #EDEDEE;
          caret-color: #EDEDEE;
          transition: background-color 9999s ease-in-out 0s;
        }
        @keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .rise { animation: rise 0.55s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes sheetUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }
        .sheet { animation: sheetUp 0.6s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes draw { to { stroke-dashoffset: 0; } }
        .spark { stroke-dasharray: 170; stroke-dashoffset: 170; animation: draw 1.6s ease-out 0.5s forwards; }
      `}</style>

      {/* ══════════ DESKTOP ══════════ */}
      <div className="hidden lg:flex items-stretch justify-center min-h-screen">
        <div className="w-full flex">

          {/* Left panel */}
          <div className="hidden lg:flex lg:w-[45%] bg-[#1B1B1E] flex-col px-12 py-10 relative overflow-hidden">
            <div
              className="absolute -right-32 bottom-[-140px] w-[460px] h-[460px] pointer-events-none"
              style={{ background: 'repeating-radial-gradient(circle at center, transparent 0, transparent 15px, rgba(198,161,91,0.05) 15px, rgba(198,161,91,0.05) 16px)' }}
            />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#212125] ring-1 ring-[#C6A15B]/10 flex items-center justify-center p-2">
                  <img src="./logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div className="leading-none">
                  <div className="fi text-[13px] font-semibold tracking-[0.2em] text-[#EDEDEE]">WEBTHREE</div>
                  <div className="fi text-[9.5px] tracking-[0.16em] uppercase text-[#6F6F76] mt-1">Working Around the World</div>
                </div>
              </div>
              <SecureBadge />
            </div>

            <div className="rise relative flex-1 flex flex-col justify-center py-10">
              <h1 className="fd text-[42px] leading-[1.08] font-medium text-[#EDEDEE] max-w-[340px]">
                A clearer view of what's yours.
              </h1>
              <p className="fi text-[14px] leading-relaxed text-[#A0A0A6] mt-5 max-w-[300px]">
                Track your holdings, balance, and history — all in one place, available whenever you need it.
              </p>
            </div>

         
          </div>

          {/* Right panel */}
          <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-10">
            <div className="rise w-full max-w-[350px]">
              <h2 className="fd text-[32px] leading-tight font-medium text-[#EDEDEE]">Welcome back</h2>
              <p className="fi text-[14px] text-[#A0A0A6] mt-1.5 mb-9">Sign in to continue to your account.</p>
              {formContent}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ MOBILE ══════════ */}
      <div className="lg:hidden relative min-h-screen flex flex-col overflow-hidden">

        {/* Ambient layers */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -top-20 -right-24 w-[320px] h-[320px]"
            style={{ background: 'repeating-radial-gradient(circle at center, transparent 0, transparent 14px, rgba(198,161,91,0.05) 14px, rgba(198,161,91,0.05) 15px)' }}
          />
          <div
            className="absolute inset-x-0 top-0 h-72"
            style={{ background: 'radial-gradient(80% 100% at 50% 0%, rgba(198,161,91,0.05), transparent 70%)' }}
          />
        </div>

        {/* Top — brand + greeting + live teaser */}
        <div className="relative flex flex-col  pt-7">
          <div className="rise flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#212125] ring-1 ring-[#C6A15B]/10 flex items-center justify-center p-2">
                <img src="./logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="leading-none">
                <div className="fi text-[13px] font-semibold tracking-[0.2em] text-[#EDEDEE]">WEBTHREE</div>
                <div className="fi text-[9.5px] tracking-[0.16em] uppercase text-[#6F6F76] mt-1">Working Around the World</div>
              </div>
            </div>
            <SecureBadge />
          </div>

          <div className="mt-6 pt-6 pb-7">
            <h2 className="rise fd text-[36px] leading-tight font-medium text-[#EDEDEE]" style={{ animationDelay: '0.08s' }}>
              Welcome back
            </h2>
            <p className="rise fi text-[14px] text-[#A0A0A6] mt-1.5" style={{ animationDelay: '0.14s' }}>
              Sign in to continue to your account.
            </p>
           
          </div>
        </div>

        {/* Bottom sheet — the form */}
        <div className="sheet relative bg-[#1B1B1E] rounded-[28px] px-6 pt-4 pb-8 shadow-[0_-16px_48px_rgba(0,0,0,0.4)]" style={{ animationDelay: '0.12s' }}>
          <div className="w-10 h-1 rounded-full bg-[#2A2A30] mx-auto mb-6" />
          {formContent}
        </div>
      </div>

      {/* Recovery */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 px-2" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-[380px] bg-[#1B1B1E] rounded-t-2xl sm:rounded-2xl p-3   shadow-[0_24px_60px_rgba(0,0,0,0.4)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="fd text-[24px] font-medium text-[#EDEDEE]">Reset password</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6F6F76] hover:text-[#EDEDEE] hover:bg-[#27272C] transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <p className="fi text-[13.5px] text-[#A0A0A6] mb-6">Enter your email and we'll send a reset link.</p>

            <label className="fi text-[13px] font-medium text-[#A0A0A6] block mb-2">Email</label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="you@example.com"
              className="fi w-full h-12 px-4 text-[14.5px] text-[#EDEDEE] bg-[#212125] rounded-xl outline-none transition-all duration-200 focus:bg-[#27272C] focus:ring-2 focus:ring-[#C6A15B]/30 placeholder:text-[#57575D] mb-5"
            />

            <button
              onClick={handleSendPassword}
              disabled={!userEmail || loading}
              className={`fi w-full h-12 flex items-center justify-center rounded-xl text-[14.5px] font-semibold transition-all duration-200 ${
                !userEmail || loading
                  ? 'bg-[#212125] text-[#57575D] cursor-not-allowed'
                  : 'bg-[#C6A15B] text-[#161618] hover:bg-[#D8BA7C] shadow-[0_10px_28px_rgba(198,161,91,0.14)]'
              }`}
            >
              {loading ? (
                <div className="w-[18px] h-[18px] border-2 border-[#161618]/25 border-t-[#161618] rounded-full animate-spin" />
              ) : (
                'Send link'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};