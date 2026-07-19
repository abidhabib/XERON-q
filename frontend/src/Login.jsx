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

  // --- ORIGINAL AUTH CHECK (unchanged) ---
  useEffect(() => {
    let isMounted = true;
    axios.get(`${import.meta.env.VITE_API_BASE_URL}`, { withCredentials: true })
      .then(res => {
        if (isMounted && res.data.Status === '!valid') {
          navigate('/');
        }
      })
      .catch(err => console.error("Error: ", err));
    return () => { isMounted = false; };
  }, [navigate]);

  // --- ORIGINAL NAVIGATION LOGIC (unchanged) ---
  useEffect(() => {
    if (isAuthenticated) {
      if (isRejected || paymentOk === 0) {
        navigate('/payment');
      } else if (approved === 1 && paymentOk === 1) {
        navigate('/wallet-page');
      } else if (paymentOk === 1 && approved === 0) {
        navigate('/waiting');
      } else {
        navigate('/');
      }
    }
  }, [isAuthenticated, isRejected, approved, paymentOk, navigate]);

  // --- ORIGINAL SUBMIT (unchanged) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/login`, values, { withCredentials: true });
      if (res.data.Status === "Success") {
        await fetchUserData();
      } else {
        setError(res.data.Error);
      }
    } catch (err) {
      console.error("Error: ", err);
      setError("An unexpected error occurred. Please try again.");
    }

    setLoading(false);
  };

  // --- ORIGINAL PASSWORD SEND (unchanged) ---
  const handleSendPassword = () => {
    setLoading(true);
    axios.post(`${import.meta.env.VITE_API_BASE_URL}/sendPassword`, { userEmail })
      .then(() => {
        setLoading(false);
        setShowModal(false);
        showToast('Password Sent', 'success');
      })
      .catch(() => {
        setLoading(false);
        showToast('Email Not Found', 'error');
      });
  };

  // --- LOADING STATE (unchanged) ---
  if (!isAuthCheckComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0e11]">
        <div className="w-48 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
          <div className="h-full bg-[#f0b90b] animate-pulse rounded-full" style={{ width: '60%' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-6 bg-[#0b0e11]">
      <div className="w-full max-w-[360px]">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <img src="./logo.png" alt="Logo" width={72} className="rounded-[20px]" />
          <h1 className="text-2xl font-semibold text-white tracking-wide">Welcome back</h1>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#2a1515]">
              <svg className="w-[18px] h-[18px] text-[#f6465d] flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-sm text-[#f6465d] leading-snug">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-medium text-[#848e9c] uppercase tracking-wider">Email</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#5e6673]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                <input
                  type="email"
                  value={values.email}
                  onChange={(e) => setValues({ ...values, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full h-[52px] pl-11 pr-4 text-base text-white bg-[#1a1a1a] rounded-lg outline-none transition-colors focus:bg-[#252525] placeholder:text-[#5e6673]"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-medium text-[#848e9c] uppercase tracking-wider">Password</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#5e6673]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={values.password}
                  onChange={(e) => setValues({ ...values, password: e.target.value })}
                  placeholder="Enter your password"
                  className="w-full h-[52px] pl-11 pr-12 text-base text-white bg-[#1a1a1a] rounded-lg outline-none transition-colors focus:bg-[#252525] placeholder:text-[#5e6673]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#5e6673] hover:text-[#848e9c]"
                >
                  {showPassword ? (
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.16m-4.78-4.78L3 3"/>
                      <path d="M1 1l22 22"/>
                    </svg>
                  ) : (
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <button
              type="button"
              onClick={() => { setUserEmail(values.email); setShowModal(true); }}
              className="self-end text-sm text-[#848e9c] hover:text-[#f0b90b] transition-colors py-1"
            >
              Forgot password?
            </button>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full h-[52px] flex items-center justify-center gap-2 rounded-lg font-semibold text-base transition-all active:scale-[0.97] active:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 ${
                loading
                  ? 'bg-[#1a1a1a] text-[#5e6673]'
                  : 'bg-[#f0b90b] text-[#0b0e11]'
              }`}
            >
              {loading ? (
                <div className="w-[18px] h-[18px] border-2 border-[#0b0e11]/30 border-t-[#0b0e11] rounded-full animate-spin" />
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Password Recovery Bottom Sheet */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-[360px] bg-[#0b0e11] rounded-t-2xl p-6 animate-in slide-in-from-bottom" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-white">Password Recovery</h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center bg-[#1a1a1a] rounded-lg hover:bg-[#252525]"
              >
                <svg className="w-4 h-4 text-[#848e9c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <p className="text-sm text-[#848e9c] mb-4">Enter your email to receive a password reset link.</p>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-[52px] px-3.5 text-base text-white bg-[#1a1a1a] rounded-lg outline-none mb-4 focus:bg-[#252525] placeholder:text-[#5e6673]"
            />
            <button
              onClick={handleSendPassword}
              disabled={!userEmail || loading}
              className={`w-full h-[52px] flex items-center justify-center gap-2 rounded-lg font-semibold text-base ${
                !userEmail || loading
                  ? 'bg-[#1a1a1a] text-[#5e6673] opacity-40 cursor-not-allowed'
                  : 'bg-[#f0b90b] text-[#0b0e11] active:opacity-90'
              }`}
            >
              {loading ? (
                <div className="w-[18px] h-[18px] border-2 border-[#0b0e11]/30 border-t-[#0b0e11] rounded-full animate-spin" />
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};