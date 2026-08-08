import React, { useEffect, useState, useCallback, memo, useMemo } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from 'lucide-react';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 10000,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === 'ECONNABORTED') return Promise.reject(new Error('Request timeout. Please try again.'));
        if (!error.response) return Promise.reject(new Error('Network error. Please check your connection.'));
        return Promise.reject(error);
    }
);

// ── Input ──────────────────────────────────────────────
const InputField = memo(({ label, name, type = "text", placeholder, required = true, error, value, onChange, disabled, ...props }) => (
    <div className="flex flex-col gap-2">
        <label className="fi text-[13px] font-medium text-[#A0A0A6]">
            {label} {required && <span className="text-[#C6A15B]/70">*</span>}
        </label>
        <input
            type={type}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`fi w-full h-12 px-4 text-[14.5px] text-[#EDEDEE] bg-[#212125] rounded-xl outline-none transition-all duration-200 placeholder:text-[#57575D] disabled:opacity-50 disabled:cursor-not-allowed ${
                error ? 'ring-2 ring-[#E2A896]/40' : 'focus:bg-[#27272C] focus:ring-2 focus:ring-[#C6A15B]/30'
            }`}
            required={required}
            {...props}
        />
        {error && <p className="fi text-[12px] text-[#E2A896]">{error}</p>}
    </div>
));
InputField.displayName = 'InputField';

// ── Password ───────────────────────────────────────────
const PasswordField = memo(({ label, name, showPassword, onTogglePassword, value, onChange, error, disabled, showStrength = false, passwordStrength, showMatchIndicator = false, isMatch = null }) => {
    const strengthStyles = {
        1: { bar: 'w-1/5 bg-[#5C5348]', text: 'text-[#6F6F76]' },
        2: { bar: 'w-2/5 bg-[#8A744F]', text: 'text-[#A0A0A6]' },
        3: { bar: 'w-3/5 bg-[#B0925C]', text: 'text-[#A0A0A6]' },
        4: { bar: 'w-4/5 bg-[#C6A15B]', text: 'text-[#C6A15B]' },
        5: { bar: 'w-full bg-[#D8BA7C]', text: 'text-[#D8BA7C]' },
    };
    const level = Math.max(1, Math.min(passwordStrength?.score || 1, 5));
    const s = strengthStyles[level];

    return (
        <div className="flex flex-col gap-2">
            <label className="fi text-[13px] font-medium text-[#A0A0A6]">
                {label} <span className="text-[#C6A15B]/70">*</span>
            </label>
            <div className="relative">
                <input
                    type={showPassword ? "text" : "password"}
                    name={name}
                    placeholder="••••••••"
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className={`fi w-full h-12 px-4 pr-11 text-[14.5px] text-[#EDEDEE] bg-[#212125] rounded-xl outline-none transition-all duration-200 placeholder:text-[#57575D] disabled:opacity-50 disabled:cursor-not-allowed ${
                        error ? 'ring-2 ring-[#E2A896]/40' :
                        showMatchIndicator && isMatch === false ? 'ring-2 ring-[#E2A896]/40' :
                        'focus:bg-[#27272C] focus:ring-2 focus:ring-[#C6A15B]/30'
                    }`}
                    required
                    minLength={8}
                />
                {showMatchIndicator && isMatch !== null && name === 'confirmPassword' && (
                    <div className="absolute right-11 top-1/2 -translate-y-1/2">
                        {isMatch ? (
                            <svg className="w-4 h-4 text-[#C6A15B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 text-[#E2A896]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                    </div>
                )}
                <button
                    type="button"
                    onClick={onTogglePassword}
                    disabled={disabled}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6F6F76] hover:text-[#C6A15B] transition-colors disabled:opacity-50"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? <EyeOff className="w-[17px] h-[17px]" /> : <Eye className="w-[17px] h-[17px]" />}
                </button>
            </div>

            {showStrength && value && (
                <div className="mt-0.5">
                    <div className="flex items-center gap-2.5">
                        <div className="flex-1 h-1 bg-[#212125] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-300 ${s.bar}`} />
                        </div>
                        <span className={`fi text-[11px] ${s.text}`}>{passwordStrength.message}</span>
                    </div>
                    <p className="fi text-[11px] text-[#6F6F76] mt-1.5">Min 8 characters, with uppercase, number & symbol</p>
                </div>
            )}

            {error && <p className="fi text-[12px] text-[#E2A896]">{error}</p>}
            {showMatchIndicator && name === 'confirmPassword' && isMatch === false && !error && (
                <p className="fi text-[12px] text-[#E2A896]">Passwords do not match</p>
            )}
        </div>
    );
});
PasswordField.displayName = 'PasswordField';

// ── Main ───────────────────────────────────────────────
const Signup = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [formData, setFormData] = useState({
        name: "", email: "", phoneNumber: "", password: "", confirmPassword: "", city: "", completeAddress: "",
    });

    const [uiState, setUiState] = useState({
        isLoading: false, referrer: "", acceptTerms: false, showPassword: false, showConfirmPassword: false,
        buttonText: "Create Account", buttonStatus: "idle", fieldErrors: {}
    });

    const [passwordStrength, setPasswordStrength] = useState({ score: 0, message: '', color: 'gray' });

    const passwordMatch = useMemo(() => {
        if (!formData.confirmPassword) return null;
        return formData.password === formData.confirmPassword;
    }, [formData.password, formData.confirmPassword]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const ref = params.get("ref");
        if (ref && /^\d+$/.test(ref)) setUiState(prev => ({ ...prev, referrer: ref }));
    }, [location]);

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
        setUiState(prev => ({ ...prev, fieldErrors: { ...prev.fieldErrors, [name]: '' } }));
        if (name === 'password') setPasswordStrength(calculatePasswordStrength(value));
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
        if (email && !emailRegex.test(email)) errors.email = 'Please enter a valid email address';
        if (password && password.length < 8) errors.password = 'Password must be at least 8 characters';
        if (password && confirmPassword && password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

        const phoneRegex = /^03\d{9}$/;
        if (phoneNumber && !phoneRegex.test(phoneNumber.replace(/\s/g, ''))) errors.phoneNumber = 'Enter valid Pakistani mobile number (03xxxxxxxxx)';
        if (!acceptTerms) errors.terms = 'You must accept the terms and conditions';

        return errors;
    }, [formData, uiState.acceptTerms]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setUiState(prev => ({ ...prev, isLoading: true, buttonStatus: "loading", buttonText: "Creating Account...", fieldErrors: {} }));

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            const firstError = Object.values(validationErrors)[0];
            setUiState(prev => ({ ...prev, isLoading: false, buttonStatus: "error", buttonText: firstError, fieldErrors: validationErrors }));
            setTimeout(() => setUiState(prev => ({ ...prev, buttonStatus: "idle", buttonText: "Create Account" })), 3000);
            return;
        }

        const { ...payload } = formData;
        const url = uiState.referrer ? `/register?ref=${uiState.referrer}` : '/register';

        try {
            const response = await api.post(url, payload);
            if (response.data.status === "success") {
                localStorage.setItem("Userid", response.data.userId);
                setUiState(prev => ({ ...prev, buttonStatus: "success", buttonText: "Account Created! Redirecting..." }));
                setTimeout(() => navigate("/payment"), 1500);
            } else {
                throw new Error(response.data.error || 'Registration failed');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.message || 'An error occurred during registration';
            setUiState(prev => ({ ...prev, isLoading: false, buttonStatus: "error", buttonText: errorMessage, fieldErrors: {} }));
            setTimeout(() => setUiState(prev => ({ ...prev, buttonStatus: "idle", buttonText: "Create Account" })), 3000);
        }
    }, [formData, uiState.referrer, validateForm, navigate]);

    const getButtonStyles = useCallback(() => {
        const base = "fi w-full h-12 rounded-xl text-[14.5px] font-semibold flex items-center justify-center transition-all duration-200 mt-2 disabled:cursor-not-allowed";
        switch (uiState.buttonStatus) {
            case "loading": return `${base} bg-[#A9884A] text-[#161618] cursor-not-allowed`;
            case "success": return `${base} bg-[#1E2A22] text-[#8FC7A0]`;
            case "error":   return `${base} bg-[#241619] text-[#E2A896]`;
            default:        return `${base} bg-[#C6A15B] text-[#161618] hover:bg-[#D8BA7C] shadow-[0_10px_28px_rgba(198,161,91,0.14)] active:scale-[0.99]`;
        }
    }, [uiState.buttonStatus]);

    const getButtonIcon = useCallback(() => {
        switch (uiState.buttonStatus) {
            case "loading":
                return <div className="animate-spin w-4 h-4 border-2 border-[#161618]/25 border-t-[#161618] rounded-full mr-2" />;
            case "success":
                return <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>;
            case "error":
                return <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
            default:
                return null;
        }
    }, [uiState.buttonStatus]);

    const SecureBadge = () => (
        <div className="flex items-center gap-2 h-8 px-3 rounded-full bg-[#212125]">
            <span className="relative flex w-1.5 h-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C6A15B] opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#C6A15B]" />
            </span>
            <span className="fi text-[11px] font-medium text-[#A0A0A6]">Secure</span>
        </div>
    );

    // Shared form
    const formContent = (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            <InputField label="Full Name" name="name" placeholder="Enter your full name" value={formData.name} onChange={handleInputChange} disabled={uiState.isLoading} error={uiState.fieldErrors.name} />
            <InputField label="Email Address" name="email" type="email" placeholder="your@email.com" value={formData.email} onChange={handleInputChange} disabled={uiState.isLoading} error={uiState.fieldErrors.email} />
            <InputField label="Phone Number" name="phoneNumber" type="tel" placeholder="03xxxxxxxxx" value={formData.phoneNumber} onChange={handleInputChange} disabled={uiState.isLoading} error={uiState.fieldErrors.phoneNumber} pattern="03[0-9]{9}" inputMode="numeric" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputField label="State" name="city" placeholder="Enter your state" value={formData.city} onChange={handleInputChange} disabled={uiState.isLoading} error={uiState.fieldErrors.city} />
                <InputField label="City" name="completeAddress" placeholder="Enter your city" value={formData.completeAddress} onChange={handleInputChange} disabled={uiState.isLoading} error={uiState.fieldErrors.completeAddress} />
            </div>

            <PasswordField label="Password" name="password" value={formData.password} onChange={handleInputChange} showPassword={uiState.showPassword} onTogglePassword={() => setUiState(prev => ({ ...prev, showPassword: !prev.showPassword }))} disabled={uiState.isLoading} error={uiState.fieldErrors.password} showStrength={true} passwordStrength={passwordStrength} />
            <PasswordField label="Confirm Password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} showPassword={uiState.showConfirmPassword} onTogglePassword={() => setUiState(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))} disabled={uiState.isLoading} error={uiState.fieldErrors.confirmPassword} showMatchIndicator={true} isMatch={passwordMatch} />

            <div>
                <div className="flex items-start gap-2.5">
                    <input
                        id="terms"
                        type="checkbox"
                        checked={uiState.acceptTerms}
                        onChange={() => setUiState(prev => ({ ...prev, acceptTerms: !prev.acceptTerms }))}
                        disabled={uiState.isLoading}
                        className="mt-0.5 w-4 h-4 rounded accent-[#C6A15B] bg-[#212125] focus:ring-0 focus:ring-offset-0 disabled:opacity-50"
                    />
                    <label htmlFor="terms" className="fi text-[13px] leading-relaxed text-[#A0A0A6]">
                        I agree to the{" "}
                        <a href="/terms" className="text-[#C6A15B] hover:text-[#D8BA7C] transition-colors" target="_blank" rel="noopener noreferrer">Terms of Service</a>{" "}
                        and{" "}
                        <a href="/privacy" className="text-[#C6A15B] hover:text-[#D8BA7C] transition-colors" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                    </label>
                </div>
                {uiState.fieldErrors.terms && <p className="fi text-[12px] text-[#E2A896] mt-1.5">{uiState.fieldErrors.terms}</p>}
            </div>

            <button type="submit" disabled={uiState.isLoading} className={getButtonStyles()}>
                {getButtonIcon()}
                {uiState.buttonText}
            </button>

            <div className="fi text-center text-[13.5px] text-[#A0A0A6] mt-1">
                Already have an account?{" "}
                <a href="/login" className="font-semibold text-[#C6A15B] hover:text-[#D8BA7C] transition-colors">Sign in</a>
            </div>
        </form>
    );

    const benefits = [
        { title: 'Secure holdings tracking', desc: 'Your assets, monitored and protected.' },
        { title: 'Real-time insights', desc: 'Balance and history, always current.' },
        { title: 'Private member access', desc: 'A higher standard of service.' },
    ];

    return (
        <div className="min-h-screen bg-[#161618]">
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
            `}</style>

            {/* ══════════ DESKTOP ══════════ */}
            <div className="hidden lg:flex items-stretch justify-center min-h-screen">
                <div className="w-full flex">

                    {/* Left panel */}
                    <div className="hidden lg:flex lg:w-[44%] bg-[#1B1B1E] flex-col px-12 py-10 relative overflow-hidden">
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
                            <h1 className="fd text-[40px] leading-[1.08] font-medium text-[#EDEDEE] max-w-[340px]">
                                Join a private standard of wealth.
                            </h1>
                            <p className="fi text-[14px] leading-relaxed text-[#A0A0A6] mt-5 max-w-[300px]">
                                Create your account and take control of your holdings in one considered place.
                            </p>

                            <div className="mt-10 space-y-5 max-w-[320px]">
                                {benefits.map((b, i) => (
                                    <div key={i} className="flex gap-3.5">
                                        <div className="w-8 h-8 rounded-lg bg-[#212125] flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <svg className="w-4 h-4 text-[#C6A15B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="fi text-[14px] font-medium text-[#EDEDEE]">{b.title}</div>
                                            <div className="fi text-[13px] text-[#A0A0A6] mt-0.5">{b.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right panel */}
                    <div className="flex-1 flex px-6 py-12 sm:px-10">
                        <div className="rise w-full max-w-[380px] m-auto">
                            <h2 className="fd text-[32px] leading-tight font-medium text-[#EDEDEE]">Create account</h2>
                            <p className="fi text-[14px] text-[#A0A0A6] mt-1.5 mb-8">It only takes a minute to get started.</p>
                            {formContent}
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════ MOBILE ══════════ */}
            <div className="lg:hidden relative min-h-screen overflow-hidden">
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

                <div className="relative px-6 pt-7 pb-12">
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

                    <div className="mt-9">
                        <h2 className="rise fd text-[32px] leading-tight font-medium text-[#EDEDEE]" style={{ animationDelay: '0.08s' }}>Create account</h2>
                        <p className="rise fi text-[14px] text-[#A0A0A6] mt-1.5" style={{ animationDelay: '0.14s' }}>Join a private standard of wealth.</p>
                    </div>

                    <div className="rise mt-8" style={{ animationDelay: '0.2s' }}>
                        {formContent}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;