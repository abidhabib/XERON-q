import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext/UserContext';
import './styles.css';
import { useToast } from './ToastContext';

export const Login = () => {
  const { paymentOk, isAuthCheckComplete, fetchUserData, isRejected, isAuthenticated, approved } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [values, setValues] = useState({ email: '', password: '' });
  const [showModal, setShowModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();
  const { showToast } = useToast();

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

  if (!isAuthCheckComplete) {
    return <div className="loading-container"><div className="loader-bar"></div></div>;
  }

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 bg-[#111827]">
        <img src="./logo.png" alt="Logo" width={140} className="mb-6" />
        
        <div className="w-full max-w-md bg-[#19202a] rounded-2xl p-6 shadow-xl">
          <h1 className="text-2xl meddon-regular font-semibold text-center text-[#D4AF37] mb-6">
            Welcome
          </h1>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-rose-900/20 border border-rose-800/30 rounded-xl">
                <p className="text-center text-rose-400 text-sm">{error}</p>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-[#D4AF37]/80 text-sm mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={values.email}
                onChange={(e) => setValues({ ...values, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#1c2a3a] rounded-xl text-white placeholder-[#D4AF37]/40 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all"
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-[#D4AF37]/80 text-sm mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={values.password}
                onChange={(e) => setValues({ ...values, password: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#1c2a3a] rounded-xl text-white placeholder-[#D4AF37]/40 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Forgot Password (Optional) */}
            {/* <div className="text-center">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="text-xs text-[#D4AF37]/70 hover:text-[#D4AF37] transition-colors"
              >
                Forgot password?
              </button>
            </div> */}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all ${
                loading
                  ? 'bg-[#1c2a3a] text-[#D4AF37]/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#D4AF37] to-[#c69c2e] text-gray-900 shadow-[0_4px_12px_rgba(212,175,55,0.15)] hover:from-[#e8c04e] hover:to-[#d4af37]'
              }`}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>

      {/* Password Recovery Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-[#19202a] rounded-2xl p-6 border border-[#26303b]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Password Recovery</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#D4AF37]/60 hover:text-[#D4AF37]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <p className="text-[#D4AF37]/60 text-sm mb-4">
              Enter your email to receive a password reset link.
            </p>
            <input
              type="email"
              placeholder="you@example.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#1c2a3a] rounded-xl text-white placeholder-[#D4AF37]/40 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            />
            <button
              onClick={handleSendPassword}
              disabled={!userEmail || loading}
              className={`w-full mt-4 py-2.5 rounded-xl font-medium text-sm ${
                !userEmail || loading
                  ? 'bg-[#1c2a3a] text-[#D4AF37]/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#D4AF37] to-[#c69c2e] text-gray-900'
              }`}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};