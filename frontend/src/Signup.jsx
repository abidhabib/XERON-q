import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { UserContext } from "./UserContext/UserContext";
import { FiUser, FiMail, FiPhone, FiLock, FiMapPin } from 'react-icons/fi';

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [referrer, setReferrer] = useState("");
  const [phoneError, setPhoneError] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const [user, setUser] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    city: "",
    completeAddress: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get("ref");
    if (ref) setReferrer(ref);
  }, [location]);

  // Show toast notification
  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
    
    // Clear phone error when user types
    if (name === "phoneNumber") setPhoneError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation checks
    let hasError = false;
    for (const field in user) {
      if (!user[field]) {
        showToast(`Please fill in the ${field} field`, "error");
        hasError = true;
        break;
      }
    }

    if (hasError) {
      setIsLoading(false);
      return;
    }

    if (user.password !== user.confirmPassword) {
      showToast("Passwords do not match", "error");
      setIsLoading(false);
      return;
    }
    
    if (!(user.phoneNumber.length === 11 && user.phoneNumber.startsWith('03'))) {
      setPhoneError('Phone must start with 03 and be 11 digits');
      setIsLoading(false);
      return;
    }
    
    if (!acceptTerms) {
      showToast("Please accept the terms and conditions", "error");
      setIsLoading(false);
      return;
    }
    
    const url = referrer
      ? `${import.meta.env.VITE_API_BASE_URL}/register?ref=${referrer}`
      : `${import.meta.env.VITE_API_BASE_URL}/register`;
  
    try {
      const response = await axios.post(url, user, { withCredentials: true });
      
      if (response.data.status === "success") {
        localStorage.setItem("Userid", response.data.userId);
        showToast("Account created! Redirecting...", "success");
        setTimeout(() => navigate("/Payment"), 1500);
      } else {
        showToast(response.data.error || "Registration failed", "error");
      }
    } catch (error) {
      showToast(error.response?.data?.message || "An error occurred", "error");
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-indigo-50 p-4">
      {/* Custom Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg transition-all transform ${
          toast.type === "success" 
            ? "bg-green-100 border border-green-300 text-green-700" 
            : "bg-red-100 border border-red-300 text-red-700"
        } animate-fade-in-down`}>
          <div className="flex items-center">
            <div className={`mr-2 w-6 h-6 rounded-full flex items-center justify-center ${
              toast.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}>
              {toast.type === "success" ? (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              )}
            </div>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className="w-full max-w-md">
       
        
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="p-1 bg-[#19202a]"></div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              {/* Name */}
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400">
                  <FiUser className="w-3 h-3" />
                </div>
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={user.name}
                  onChange={handleInputChange}
                  className="w-full pl-10 text-sm pr-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  required
                />
              </div>
              
              {/* Email */}
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400">
                  <FiMail className="w-3 h-3" />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={user.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 text-sm pr-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  required
                />
              </div>
              
              {/* Phone */}
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400">
                  <FiPhone className="w-3 h-3" />
                </div>
                <input
                  type="number"
                  name="phoneNumber"
                  placeholder="Phone Number (03xxxxxxxxx)"
                  value={user.phoneNumber}
                  onChange={handleInputChange}
                  className={`w-full pl-10 text-sm pr-4 py-2 bg-gray-50 rounded-lg border ${
                    phoneError ? "border-red-300" : "border-gray-200"
                  } focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all`}
                  required
                />
                {phoneError && <p className="text-red-500 text-xs mt-1 pl-1">{phoneError}</p>}
              </div>
              
              {/* State */}
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400">
                  <FiMapPin className="w-3 h-3" />
                </div>
                <input
                  type="text"
                  name="city"
                  placeholder="State"
                  value={user.city}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 text-sm py-2 bg-gray-50 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  required
                />
              </div>
              
              {/* City */}
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400">
                  <FiMapPin className="w-3 h-3" />
                </div>
                <input
                  type="text"
                  name="completeAddress"
                  placeholder="City"
                  value={user.completeAddress}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  required
                />
              </div>
              
              {/* Password */}
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400">
                  <FiLock className="w-3 h-3" />
                </div>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={user.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  required
                />
              </div>
              
              {/* Confirm Password */}
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400">
                  <FiLock className="w-3 h-3" />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={user.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  required
                />
              </div>
            </div>
            
            {/* Terms & Conditions */}
            <div className="flex items-start gap-2 mt-4">
              <input
                id="terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={() => setAcceptTerms(!acceptTerms)}
                className="mt-1 w-3 h-3 border-gray-300 text-indigo-600 focus:ring-indigo-500 rounded"
                required
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                I agree to the{" "}
                <a href="/terms" className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white py-2 text-sm rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin w-3 h-3 border-2 border-white/30 border-t-white rounded-full" />
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
            
            {/* Login Link */}
            <div className="text-center mt-6 text-sm text-gray-600">
              Already have an account?{" "}
              <a href="/" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Login here
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;