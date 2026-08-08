import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Axios from 'axios';
import { UserContext } from '../UserContext/UserContext';
import { jwtDecode } from 'jwt-decode';
import { Lock, Mail, Loader2 } from 'lucide-react';

const AdminLogin = () => {
    const { setAdminAuthenticated } = useContext(UserContext);
    const navigateTo = useNavigate();

    // 1. Use Refs for inputs to PREVENT re-renders on every keystroke
    const emailRef = useRef(null);
    const passwordRef = useRef(null);

    // 2. Consolidate states: Only keep loading and a single error state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('adminTokens');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.exp * 1000 > Date.now()) {
                    setAdminAuthenticated(true);
                    navigateTo('/admin');
                }
            } catch (err) {
                localStorage.removeItem('adminTokens');
            }
        }
    }, []);

    const loginUser = async (e) => {
        e.preventDefault();
        
        // Read values directly from refs instead of state
        const email = emailRef.current?.value;
        const password = passwordRef.current?.value;

        if (!email || !password) {
            setError('Please enter username and password');
            return;
        }

        setIsLoading(true);
        setError(''); // Clear previous errors

        try {
            const response = await Axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/admin-login`,
                { LoginUserName: email, LoginPassword: password },
                { headers: { 'Content-Type': 'application/json' } }
            );

            if (response.data.token) {
                const decoded = jwtDecode(response.data.token);
                if (decoded.isAdmin !== true) {
                    throw new Error('Invalid admin credentials');
                }
                localStorage.setItem('adminTokens', response.data.token);
                setAdminAuthenticated(true);
                navigateTo('/admin');
            } else {
                setError(response.data.message || 'Authentication failed');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Authentication failed. Please try again.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-hide error after 4 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 4000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {/* Add Logo/Title here if needed */}
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200">
                    <form className="space-y-6" onSubmit={loginUser}>
                        {/* 3. Use key={error} to restart animation without a separate 'shake' state */}
                        {error && (
                            <div 
                                key={error} 
                                className="rounded-md p-4 animate-shake bg-red-50 border border-red-200 transition-all duration-300"
                            >
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-red-800">
                                            {error}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                {/* Uncontrolled Input: No onChange, no value prop */}
                                <input
                                    ref={emailRef}
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200"
                                    placeholder="admin@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                {/* Uncontrolled Input: No onChange, no value prop */}
                                <input
                                    ref={passwordRef}
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign in to Dashboard'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;