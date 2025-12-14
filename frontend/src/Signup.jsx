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
  const [buttonStatus, setButtonStatus] = useState("idle"); // idle, loading, success, error

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
    
    // Clear phone error when user types
    if (name === "phoneNumber") setPhoneError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setButtonStatus("loading");
    setButtonText("Creating Account...");

    // Validation checks
    let hasError = false;
    for (const field in user) {
      if (!user[field]) {
        setButtonStatus("error");
        setButtonText(`Please fill in the ${field} field`);
        setTimeout(() => {
          setButtonStatus("idle");
          setButtonText("Create Account");
        }, 2000);
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
      setTimeout(() => {
        setButtonStatus("idle");
        setButtonText("Create Account");
      }, 2000);
      setIsLoading(false);
      return;
    }
    
    if (!(user.phoneNumber.length > 11 )) {
      setPhoneError('Enter Correct Phone Number');
      setButtonStatus("error");
      setButtonText("Invalid Phone Number");
      setTimeout(() => {
        setButtonStatus("idle");
        setButtonText("Create Account");
      }, 2000);
      setIsLoading(false);
      return;
    }
    
    if (!acceptTerms) {
      setButtonStatus("error");
      setButtonText("Accept terms & conditions");
      setTimeout(() => {
        setButtonStatus("idle");
        setButtonText("Create Account");
      }, 2000);
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
        setTimeout(() => {
          setButtonStatus("idle");
          setButtonText("Create Account");
        }, 2000);
      }
    } catch (error) {
      setButtonStatus("error");
      setButtonText(error.response?.data?.message || "An error occurred");
      setTimeout(() => {
        setButtonStatus("idle");
        setButtonText("Create Account");
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine button styles based on status
  const getButtonStyles = () => {
    switch(buttonStatus) {
      case "loading":
        return "bg-[#fcc845] text-dark";
      case "success":
        return "bg-green-600 text-white";
      case "error":
        return "bg-red-600 text-white";
      default:
        return "bg-[#fcc845] text-dark hover:bg-[#f5b634]";
    }
  };

  // Determine button icon based on status
  const getButtonIcon = () => {
    switch(buttonStatus) {
      case "loading":
        return (
          <div className="animate-spin w-4 h-4 border-2 border-dark/30 border-t-dark rounded-full mr-2" />
        );
      case "success":
        return (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        );
      case "error":
        return (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-900">
      <img src="./logo.png" alt="Logo" width={150} className='mb-4' />
      
      <div className="w-full max-w-md bg-[#19202a] rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-poppins text-[#fcc845] mb-6 text-center">
          Create Account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[#fcc845] mb-1">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-gray-400">
                <FiUser className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={user.name}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 text-[#fcc845] bg-transparent border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fcc845]"
                required
              />
            </div>
          </div>
          
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[#fcc845] mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-gray-400">
                <FiMail className="w-4 h-4" />
              </div>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={user.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 text-[#fcc845] bg-transparent border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fcc845]"
                required
              />
            </div>
          </div>
          
          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-[#fcc845] mb-1">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-gray-400">
                <FiPhone className="w-4 h-4" />
              </div>
              <input
                type="number"
                name="phoneNumber"
                placeholder="03xxxxxxxxx"
                value={user.phoneNumber}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-2 text-[#fcc845] bg-transparent border ${
                  phoneError ? "border-red-500" : "border-gray-600"
                } rounded-md focus:outline-none focus:ring-2 focus:ring-[#fcc845]`}
                required
              />
            </div>
            {phoneError && <p className="text-red-500 text-xs mt-1 pl-1">{phoneError}</p>}
          </div>
          
          {/* State */}
          <div>
            <label className="block text-sm font-medium text-[#fcc845] mb-1">
              State
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-gray-400">
                <FiMapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="city"
                placeholder="Enter your state"
                value={user.city}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 text-[#fcc845] bg-transparent border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fcc845]"
                required
              />
            </div>
          </div>
          
          {/* City */}
          <div>
            <label className="block text-sm font-medium text-[#fcc845] mb-1">
              City
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-gray-400">
                <FiMapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="completeAddress"
                placeholder="Enter your city"
                value={user.completeAddress}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 text-[#fcc845] bg-transparent border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fcc845]"
                required
              />
            </div>
          </div>
          
          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-[#fcc845] mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-gray-400">
                <FiLock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={user.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-10 py-2 text-[#fcc845] bg-transparent border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fcc845]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#fcc845] focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          
          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-[#fcc845] mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-gray-400">
                <FiLock className="w-4 h-4" />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm your password"
                value={user.confirmPassword}
                onChange={handleInputChange}
                className="w-full pl-10 pr-10 py-2 text-[#fcc845] bg-transparent border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fcc845]"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#fcc845] focus:outline-none"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          
          {/* Terms & Conditions */}
          <div className="flex items-start gap-2 mt-4">
            <input
              id="terms"
              type="checkbox"
              checked={acceptTerms}
              onChange={() => setAcceptTerms(!acceptTerms)}
              className="mt-1 w-4 h-4 border-gray-600 bg-transparent text-[#fcc845] focus:ring-[#fcc845] rounded focus:ring-0 focus:ring-offset-0"
              required
            />
            <label htmlFor="terms" className="text-sm text-gray-300">
              I agree to the{" "}
              <a href="/terms" className="text-[#fcc845] hover:text-yellow-300 underline" target="_blank" rel="noopener noreferrer">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-[#fcc845] hover:text-yellow-300 underline" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>
            </label>
          </div>

          {/* Submit Button */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={isLoading && buttonStatus === "loading"}
              className={`w-full ${getButtonStyles()} py-2 text-sm rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center`}
            >
              {getButtonIcon()}
              {buttonText}
            </button>
          </div>
          
          {/* Login Link */}
          <div className="text-center mt-6 text-sm text-gray-300">
            Already have an account?{" "}
            <a href="/" className="text-[#fcc845] hover:text-yellow-300 font-medium underline">
              Login here
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;