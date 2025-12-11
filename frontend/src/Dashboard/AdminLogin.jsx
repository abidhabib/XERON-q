import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Axios from 'axios';
import { UserContext } from '../UserContext/UserContext';
import { jwtDecode } from 'jwt-decode';
import { Lock, Mail, Loader2 } from 'lucide-react';

const AdminLogin = () => {
    const { setAdminAuthenticated } = useContext(UserContext);
    const [isLoading, setIsLoading] = useState(false);
    const [loginUserName, setLoginUserName] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const navigateTo = useNavigate();
    const [loginStatus, setLoginStatus] = useState('');
    const [shake, setShake] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.exp * 1000 > Date.now()) {
                    setAdminAuthenticated(true);
                    navigateTo('/adminpanel');
                }
            } catch (error) {
                localStorage.removeItem('adminToken');
            }
        }
    }, []);

    const loginUser = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setShake(false);
        
        if (!loginUserName || !loginPassword) {
            setLoginStatus('Please enter username and password');
            setShake(true);
            setIsLoading(false);
            return;
        }
        
        try {
            const response = await Axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/admin-login`,
                {
                    LoginUserName: loginUserName,
                    LoginPassword: loginPassword
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
    
            if (response.data.token) {
                const decoded = jwtDecode(response.data.token);
                
                if (decoded.isAdmin !== true) {
                    throw new Error('Invalid admin credentials');
                }
                
                localStorage.setItem('adminToken', response.data.token);
                setAdminAuthenticated(true);
                navigateTo('/adminpanel');
            } else {
                setLoginStatus(response.data.message || 'Authentication failed');
                setShake(true);
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Authentication failed. Please try again.';
            setLoginStatus(message);
            setShake(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (loginStatus) {
            const timer = setTimeout(() => {
                setLoginStatus('');
                setShake(false);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [loginStatus]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                        <Lock className="h-6 w-6 text-white" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Admin Panel
                </h2>
            
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200">
                    <form className="space-y-6" onSubmit={loginUser}>
                        {loginStatus && (
                            <div 
                                className={`rounded-md p-4 transition-all duration-300 ${
                                    shake ? 'animate-shake' : ''
                                } ${
                                    loginStatus.includes('failed') || loginStatus.includes('Invalid') 
                                    ? 'bg-red-50 border border-red-200' 
                                    : 'bg-yellow-50 border border-yellow-200'
                                }`}
                            >
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        {loginStatus.includes('failed') || loginStatus.includes('Invalid') ? (
                                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="ml-3">
                                        <p className={`text-sm font-medium ${
                                            loginStatus.includes('failed') || loginStatus.includes('Invalid') 
                                            ? 'text-red-800' 
                                            : 'text-yellow-800'
                                        }`}>
                                            {loginStatus}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={loginUserName}
                                    onChange={(e) => setLoginUserName(e.target.value)}
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
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
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