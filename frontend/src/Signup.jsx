import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiPhone, FiLock, FiMapPin } from 'react-icons/fi';
import { Eye, EyeOff } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [referrer, setReferrer] = useState("");
  const [phoneError, setPhoneError] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [buttonText, setButtonText] = useState("Create Account");
  const [buttonStatus, setButtonStatus] = useState("idle");

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
    if (name === "phoneNumber") setPhoneError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setButtonStatus("loading");
    setButtonText("Creating Account...");

    // Validation
    let hasError = false;
    for (const field in user) {
      if (!user[field]) {
        setButtonStatus("error");
        setButtonText(`Please fill in the ${field} field`);
        setTimeout(() => { setButtonStatus("idle"); setButtonText("Create Account"); }, 2000);
        hasError = true;
        break;
      }
    }

    if (hasError) {
      setIsLoading(false);
      return;
    }

    if (user.password !== user.confirmPassword) {
      setButtonStatus("error");
      setButtonText("Passwords do not match");
      setTimeout(() => { setButtonStatus("idle"); setButtonText("Create Account"); }, 2000);
      setIsLoading(false);
      return;
    }
    
    if (!(user.phoneNumber.length > 10)) {
      setPhoneError('Enter Correct Phone Number');
      setButtonStatus("error");
      setButtonText("Invalid Phone Number");
      setTimeout(() => { setButtonStatus("idle"); setButtonText("Create Account"); }, 2000);
      setIsLoading(false);
      return;
    }
    
    if (!acceptTerms) {
      setButtonStatus("error");
      setButtonText("Accept terms & conditions");
      setTimeout(() => { setButtonStatus("idle"); setButtonText("Create Account"); }, 2000);
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
        setButtonStatus("success");
        setButtonText("Account Created! Redirecting...");
        setTimeout(() => navigate("/Payment"), 1500);
      } else {
        setButtonStatus("error");
        setButtonText(response.data.error || "Registration failed");
        setTimeout(() => { setButtonStatus("idle"); setButtonText("Create Account"); }, 2000);
      }
    } catch (error) {
      setButtonStatus("error");
      setButtonText(error.response?.data?.message || "An error occurred");
      setTimeout(() => { setButtonStatus("idle"); setButtonText("Create Account"); }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonStyles = () => {
    switch(buttonStatus) {
      case "loading": return "bg-[#1c2a3a] text-[#D4AF37]/70 cursor-not-allowed";
      case "success": return "bg-emerald-600/20 text-emerald-400 border border-emerald-800/30";
      case "error": return "bg-rose-900/20 text-rose-400 border border-rose-800/30";
      default: return "bg-gradient-to-r from-[#D4AF37] to-[#c69c2e] text-gray-900 shadow-[0_4px_12px_rgba(212,175,55,0.15)] hover:from-[#e8c04e] hover:to-[#d4af37]";
    }
  };

  const getButtonIcon = () => {
    switch(buttonStatus) {
      case "loading":
        return <div className="animate-spin w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full mr-2" />;
      case "success":
        return <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>;
      case "error":
        return <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#111827]">
      <img src="./logo.png" alt="Logo" width={120} className="mb-6" />
      
      <div className="w-full max-w-md bg-[#19202a] rounded-2xl p-6 shadow-xl">
        <h1 className="text-2xl font-semibold text-center text-[#D4AF37] mb-6">
          Create Account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-[#D4AF37]/80 text-sm mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-2.5 text-[#D4AF37]/50">
                <FiUser className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={user.name}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2.5 bg-[#1c2a3a] rounded-xl text-white placeholder-[#D4AF37]/40 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all"
                required
              />
            </div>
          </div>
          
          {/* Email */}
          <div>
            <label className="block text-[#D4AF37]/80 text-sm mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-2.5 text-[#D4AF37]/50">
                <FiMail className="w-4 h-4" />
              </div>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={user.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2.5 bg-[#1c2a3a] rounded-xl text-white placeholder-[#D4AF37]/40 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all"
                required
              />
            </div>
          </div>
          
          {/* Phone */}
          <div>
            <label className="block text-[#D4AF37]/80 text-sm mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-2.5 text-[#D4AF37]/50">
                <FiPhone className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="phoneNumber"
                placeholder="03xxxxxxxxx"
                value={user.phoneNumber}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-2.5 bg-[#1c2a3a] rounded-xl text-white placeholder-[#D4AF37]/40 text-sm focus:outline-none focus:ring-1 ${
                  phoneError ? 'focus:ring-rose-500' : 'focus:ring-[#D4AF37]'
                } transition-all`}
                required
              />
            </div>
            {phoneError && <p className="text-rose-400 text-xs mt-1">{phoneError}</p>}
          </div>
          
          {/* State */}
          <div>
            <label className="block text-[#D4AF37]/80 text-sm mb-1.5">
              State
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-2.5 text-[#D4AF37]/50">
                <FiMapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="city"
                placeholder="Enter your state"
                value={user.city}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2.5 bg-[#1c2a3a] rounded-xl text-white placeholder-[#D4AF37]/40 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all"
                required
              />
            </div>
          </div>
          
          {/* City */}
          <div>
            <label className="block text-[#D4AF37]/80 text-sm mb-1.5">
              City
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-2.5 text-[#D4AF37]/50">
                <FiMapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="completeAddress"
                placeholder="Enter your city"
                value={user.completeAddress}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2.5 bg-[#1c2a3a] rounded-xl text-white placeholder-[#D4AF37]/40 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all"
                required
              />
            </div>
          </div>
          
          {/* Password */}
          <div>
            <label className="block text-[#D4AF37]/80 text-sm mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-2.5 text-[#D4AF37]/50">
                <FiLock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={user.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-10 py-2.5 bg-[#1c2a3a] rounded-xl text-white placeholder-[#D4AF37]/40 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>
          
          {/* Confirm Password */}
          <div>
            <label className="block text-[#D4AF37]/80 text-sm mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-2.5 text-[#D4AF37]/50">
                <FiLock className="w-4 h-4" />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="••••••••"
                value={user.confirmPassword}
                onChange={handleInputChange}
                className="w-full pl-10 pr-10 py-2.5 bg-[#1c2a3a] rounded-xl text-white placeholder-[#D4AF37]/40 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>
          
          {/* Terms & Conditions */}
          <div className="flex items-start gap-2.5 mt-3">
            <input
              id="terms"
              type="checkbox"
              checked={acceptTerms}
              onChange={() => setAcceptTerms(!acceptTerms)}
              className="mt-0.5 w-4 h-4 rounded accent-[#D4AF37] bg-[#1c2a3a] border-[#D4AF37]/30 focus:ring-0 focus:ring-offset-0"
              required
            />
            <label htmlFor="terms" className="text-[#D4AF37]/70 text-sm">
              I agree to the{" "}
              <a href="/terms" className="text-[#D4AF37] hover:text-[#e8c04e] underline" target="_blank" rel="noopener noreferrer">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-[#D4AF37] hover:text-[#e8c04e] underline" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading && buttonStatus === "loading"}
            className={`w-full ${getButtonStyles()} py-2.5 rounded-xl font-medium text-sm flex items-center justify-center transition-all mt-4`}
          >
            {getButtonIcon()}
            {buttonText}
          </button>
          
          {/* Login Link */}
          <div className="text-center mt-4 text-sm text-[#D4AF37]/70">
            Already have an account?{" "}
            <a href="/" className="text-[#D4AF37] hover:text-[#e8c04e] font-medium">
              Login here
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;