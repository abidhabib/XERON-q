import React, { useEffect, useState, useCallback, memo, useMemo } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiPhone, FiLock, FiMapPin } from 'react-icons/fi';
import { Eye, EyeOff } from 'lucide-react';

// Axios instance with timeout and interceptors
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 10000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === 'ECONNABORTED') {
            return Promise.reject(new Error('Request timeout. Please try again.'));
        }
        if (!error.response) {
            return Promise.reject(new Error('Network error. Please check your connection.'));
        }
        return Promise.reject(error);
    }
);

// ─────────────────────────────────────────────────────────────
// ✅ REUSABLE INPUT COMPONENTS
// ─────────────────────────────────────────────────────────────

const InputField = memo(({ 
    label, 
    name, 
    type = "text", 
    placeholder, 
    icon: Icon, 
    required = true,
    error,
    value,
    onChange,
    disabled,
    ...props 
}) => (
    <div>
        <label className="block text-[#D4AF37]/80 text-sm mb-1.5">
            {label} {required && <span className="text-rose-400">*</span>}
        </label>
        <div className="relative">
            <div className="absolute left-3.5 top-2.5 text-[#D4AF37]/50">
                <Icon className="w-4 h-4" />
            </div>
            <input
                type={type}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={`w-full pl-10 pr-4 py-2.5 bg-[#1c2a3a] rounded-xl text-white placeholder-[#D4AF37]/40 text-sm focus:outline-none focus:ring-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    error ? 'focus:ring-rose-500' : 'focus:ring-[#D4AF37]'
                }`}
                required={required}
                {...props}
            />
        </div>
        {error && <p className="text-rose-400 text-xs mt-1">{error}</p>}
    </div>
));
InputField.displayName = 'InputField';

const PasswordField = memo(({ 
    label, 
    name, 
    showPassword, 
    onTogglePassword,
    value,
    onChange,
    error,
    disabled,
    showStrength = false,
    passwordStrength,
    showMatchIndicator = false,
    isMatch = null
}) => (
    <div>
        <label className="block text-[#D4AF37]/80 text-sm mb-1.5">
            {label} <span className="text-rose-400">*</span>
        </label>
        <div className="relative">
            <div className="absolute left-3.5 top-2.5 text-[#D4AF37]/50">
                <FiLock className="w-4 h-4" />
            </div>
            <input
                type={showPassword ? "text" : "password"}
                name={name}
                placeholder="••••••••"
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={`w-full pl-10 pr-10 py-2.5 bg-[#1c2a3a] rounded-xl text-white placeholder-[#D4AF37]/40 text-sm focus:outline-none focus:ring-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    error ? ' focus:ring-rose-500' : 
                    showMatchIndicator && isMatch === false ? ' border-rose-500 focus:ring-rose-500' :
                    showMatchIndicator && isMatch === true ? ' border-emerald-500/50 focus:ring-emerald-500/50' :
                    'focus:ring-[#D4AF37]'
                }`}
                required
                minLength={8}
            />
            {showMatchIndicator && isMatch !== null && name === 'confirmPassword' && (
                <div className="absolute inset-y-0 right-10 flex items-center">
                    {isMatch ? (
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                </div>
            )}
            <button
                type="button"
                onClick={onTogglePassword}
                disabled={disabled}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors disabled:opacity-50"
                aria-label={showPassword ? "Hide password" : "Show password"}
            >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
        </div>
        {showStrength && value && (
            <div className="mt-1.5">
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-[#1c2a3a] rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-300 ${
                                passwordStrength.score <= 1 ? 'bg-red-500 w-1/5' :
                                passwordStrength.score === 2 ? 'bg-orange-500 w-2/5' :
                                passwordStrength.score === 3 ? 'bg-yellow-500 w-3/5' :
                                passwordStrength.score === 4 ? 'bg-blue-500 w-4/5' :
                                'bg-emerald-500 w-full'
                            }`}
                        />
                    </div>
                    <span className={`text-xs ${
                        passwordStrength.score <= 1 ? 'text-red-400' :
                        passwordStrength.score === 2 ? 'text-orange-400' :
                        passwordStrength.score === 3 ? 'text-yellow-400' :
                        passwordStrength.score === 4 ? 'text-blue-400' :
                        'text-emerald-400'
                    }`}>
                        {passwordStrength.message}
                    </span>
                </div>
                <p className="text-[#D4AF37]/50 text-xs mt-1">
                    Min 8 chars, include uppercase, number & symbol
                </p>
            </div>
        )}
        {error && <p className="text-rose-400 text-xs mt-1">{error}</p>}
        {showMatchIndicator && name === 'confirmPassword' && isMatch === false && !error && (
            <p className="text-rose-400 text-xs mt-1">Passwords do not match</p>
        )}
    </div>
));
PasswordField.displayName = 'PasswordField';

// ─────────────────────────────────────────────────────────────
// ✅ MAIN SIGNUP COMPONENT
// ─────────────────────────────────────────────────────────────

const Signup = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phoneNumber: "",
        password: "",
        confirmPassword: "",
        city: "",
        completeAddress: "",
    });

    const [uiState, setUiState] = useState({
        isLoading: false,
        referrer: "",
        acceptTerms: false,
        showPassword: false,
        showConfirmPassword: false,
        buttonText: "Create Account",
        buttonStatus: "idle",
        fieldErrors: {}
    });

    const [passwordStrength, setPasswordStrength] = useState({
        score: 0,
        message: '',
        color: 'gray'
    });

    // ✅ Compute password match status
    const passwordMatch = useMemo(() => {
        if (!formData.confirmPassword) return null;
        return formData.password === formData.confirmPassword;
    }, [formData.password, formData.confirmPassword]);

    // Extract referrer from URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const ref = params.get("ref");
        if (ref && /^\d+$/.test(ref)) {
            setUiState(prev => ({ ...prev, referrer: ref }));
        }
    }, [location]);

    // Calculate password strength
    const calculatePasswordStrength = useCallback((password) => {
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        const strengthMap = {
            0: { message: 'Too weak', color: 'red' },
            1: { message: 'Weak', color: 'orange' },
            2: { message: 'Fair', color: 'yellow' },
            3: { message: 'Good', color: 'blue' },
            4: { message: 'Strong', color: 'green' },
            5: { message: 'Very Strong', color: 'emerald' }
        };

        return { score, ...strengthMap[score] };
    }, []);

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        
        setFormData(prev => ({ ...prev, [name]: value }));
        
        setUiState(prev => ({
            ...prev,
            fieldErrors: { ...prev.fieldErrors, [name]: '' }
        }));

        if (name === 'password') {
            setPasswordStrength(calculatePasswordStrength(value));
        }
    }, [calculatePasswordStrength]);

    const validateForm = useCallback(() => {
        const errors = {};
        const { name, email, phoneNumber, password, confirmPassword, city, completeAddress } = formData;
        const { acceptTerms } = uiState;

        if (!name.trim()) errors.name = 'Full name is required';
        if (!email.trim()) errors.email = 'Email is required';
        if (!phoneNumber.trim()) errors.phoneNumber = 'Phone number is required';
        if (!password) errors.password = 'Password is required';
        if (!confirmPassword) errors.confirmPassword = 'Please confirm your password';
        if (!city.trim()) errors.city = 'State is required';
        if (!completeAddress.trim()) errors.completeAddress = 'City is required';

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (password && password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        }

        if (password && confirmPassword && password !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        const phoneRegex = /^03\d{9}$/;
        if (phoneNumber && !phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
            errors.phoneNumber = 'Enter valid Pakistani mobile number (03xxxxxxxxx)';
        }

        if (!acceptTerms) {
            errors.terms = 'You must accept the terms and conditions';
        }

        return errors;
    }, [formData, uiState.acceptTerms]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        
        setUiState(prev => ({
            ...prev,
            isLoading: true,
            buttonStatus: "loading",
            buttonText: "Creating Account...",
            fieldErrors: {}
        }));

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            const firstError = Object.values(validationErrors)[0];
            
            setUiState(prev => ({
                ...prev,
                isLoading: false,
                buttonStatus: "error",
                buttonText: firstError,
                fieldErrors: validationErrors
            }));

            setTimeout(() => {
                setUiState(prev => ({
                    ...prev,
                    buttonStatus: "idle",
                    buttonText: "Create Account"
                }));
            }, 3000);
            return;
        }

        const {  ...payload } = formData;
        
        const url = uiState.referrer
            ? `/register?ref=${uiState.referrer}`
            : '/register';

        try {
            const response = await api.post(url, payload);

            if (response.data.status === "success") {
                localStorage.setItem("Userid", response.data.userId);
                
                setUiState(prev => ({
                    ...prev,
                    buttonStatus: "success",
                    buttonText: "Account Created! Redirecting..."
                }));

                setTimeout(() => navigate("/payment"), 1500);
            } else {
                throw new Error(response.data.error || 'Registration failed');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error 
                || error.message 
                || 'An error occurred during registration';

            setUiState(prev => ({
                ...prev,
                isLoading: false,
                buttonStatus: "error",
                buttonText: errorMessage,
                fieldErrors: {}
            }));

            setTimeout(() => {
                setUiState(prev => ({
                    ...prev,
                    buttonStatus: "idle",
                    buttonText: "Create Account"
                }));
            }, 3000);
        }
    }, [formData, uiState.referrer, validateForm, navigate]);

    const getButtonStyles = useCallback(() => {
        const baseStyles = "w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center transition-all duration-300 mt-4 disabled:opacity-50 disabled:cursor-not-allowed";
        
        switch(uiState.buttonStatus) {
            case "loading": 
                return `${baseStyles} bg-[#1c2a3a] text-[#D4AF37]/70 cursor-not-allowed`;
            case "success": 
                return `${baseStyles} bg-emerald-600/20 text-emerald-400`;
            case "error": 
                return `${baseStyles} bg-rose-900/20 text-rose-400 `;
            default: 
                return `${baseStyles} bg-gradient-to-r from-[#D4AF37] to-[#c69c2e] text-gray-900 shadow-[0_4px_12px_rgba(212,175,55,0.15)] hover:from-[#e8c04e] hover:to-[#d4af37] hover:shadow-[0_6px_16px_rgba(212,175,55,0.25)] active:scale-[0.98]`;
        }
    }, [uiState.buttonStatus]);

    const getButtonIcon = useCallback(() => {
        switch(uiState.buttonStatus) {
            case "loading":
                return (
                    <div className="animate-spin w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full mr-2" />
                );
            case "success":
                return (
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                );
            case "error":
                return (
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                );
            default:
                return null;
        }
    }, [uiState.buttonStatus]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#111827]">
            <img src="./logo.png" alt="Logo" width={120} className="mb-6" />
            
            <div className="w-full max-w-md bg-[#19202a] rounded-2xl p-6 shadow-xl ">
                <h1 className="text-2xl font-semibold text-center text-[#D4AF37] mb-6">
                    Create Account
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    {/* Name */}
                    <InputField
                        label="Full Name"
                        name="name"
                        placeholder="Enter your full name"
                        icon={FiUser}
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={uiState.isLoading}
                        error={uiState.fieldErrors.name}
                    />
                    
                    {/* Email */}
                    <InputField
                        label="Email Address"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        icon={FiMail}
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={uiState.isLoading}
                        error={uiState.fieldErrors.email}
                    />
                    
                    {/* Phone */}
                    <InputField
                        label="Phone Number"
                        name="phoneNumber"
                        type="tel"
                        placeholder="03xxxxxxxxx"
                        icon={FiPhone}
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        disabled={uiState.isLoading}
                        error={uiState.fieldErrors.phoneNumber}
                        pattern="03[0-9]{9}"
                        inputMode="numeric"
                    />
                    
                    {/* State */}
                    <InputField
                        label="State"
                        name="city"
                        placeholder="Enter your state"
                        icon={FiMapPin}
                        value={formData.city}
                        onChange={handleInputChange}
                        disabled={uiState.isLoading}
                        error={uiState.fieldErrors.city}
                    />
                    
                    {/* City/Address */}
                    <InputField
                        label="City"
                        name="completeAddress"
                        placeholder="Enter your city"
                        icon={FiMapPin}
                        value={formData.completeAddress}
                        onChange={handleInputChange}
                        disabled={uiState.isLoading}
                        error={uiState.fieldErrors.completeAddress}
                    />
                    
                    {/* ✅ Password - WITH strength indicator */}
                    <PasswordField
                        label="Password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        showPassword={uiState.showPassword}
                        onTogglePassword={() => setUiState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                        disabled={uiState.isLoading}
                        error={uiState.fieldErrors.password}
                        showStrength={true}
                        passwordStrength={passwordStrength}
                    />
                    
                    {/* ✅ Confirm Password - WITH match indicator */}
                    <PasswordField
                        label="Confirm Password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        showPassword={uiState.showConfirmPassword}
                        onTogglePassword={() => setUiState(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                        disabled={uiState.isLoading}
                        error={uiState.fieldErrors.confirmPassword}
                        showMatchIndicator={true}
                        isMatch={passwordMatch}
                    />
                    
                    {/* Terms & Conditions */}
                    <div className="flex items-start gap-2.5 mt-3">
                        <input
                            id="terms"
                            type="checkbox"
                            checked={uiState.acceptTerms}
                            onChange={() => setUiState(prev => ({ ...prev, acceptTerms: !prev.acceptTerms }))}
                            disabled={uiState.isLoading}
                            className="mt-0.5 w-4 h-4 rounded accent-[#D4AF37] bg-[#1c2a3a] focus:ring-0 focus:ring-offset-0 disabled:opacity-50"
                        />
                        <label htmlFor="terms" className="text-[#D4AF37]/70 text-sm">
                            I agree to the{" "}
                            <a href="/terms" className="text-[#D4AF37] hover:text-[#e8c04e] underline transition-colors" target="_blank" rel="noopener noreferrer">
                                Terms of Service
                            </a>{" "}
                            and{" "}
                            <a href="/privacy" className="text-[#D4AF37] hover:text-[#e8c04e] underline transition-colors" target="_blank" rel="noopener noreferrer">
                                Privacy Policy
                            </a>
                        </label>
                    </div>
                    {uiState.fieldErrors.terms && (
                        <p className="text-rose-400 text-xs">{uiState.fieldErrors.terms}</p>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={uiState.isLoading}
                        className={getButtonStyles()}
                    >
                        {getButtonIcon()}
                        {uiState.buttonText}
                    </button>
                    
                    {/* Login Link */}
                    <div className="text-center mt-4 text-sm text-[#D4AF37]/70">
                        Already have an account?{" "}
                        <a href="/login" className="text-[#D4AF37] hover:text-[#e8c04e] font-medium transition-colors">
                            Login here
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;