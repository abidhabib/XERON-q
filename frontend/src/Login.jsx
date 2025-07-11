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
                showToast('Password Sent','sucess')
            })
            .catch(() => {
                setLoading(false);
                showToast('Eamil Not Found','error')

            });
    };

    if (!isAuthCheckComplete) {
        return <div className="loading-container"><div className="loader-bar"></div></div>;
    }
return (
    <>
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Welcome 
            </h1>
            
            <form className="space-y-4" onSubmit={handleSubmit}>
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        value={values.email}
                        onChange={(e) => setValues({ ...values, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                    </label>
                    <input
                        type="password"
                        value={values.password}
                        onChange={(e) => setValues({ ...values, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div className="text-center text-sm">
                    <button
                        type="button"
                        onClick={() => setShowModal(true)}
                        className="text-blue-600 hover:text-blue-500 font-medium"
                    >
                        Forgot Password?
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white py-2 text-sm rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed ${
                        loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                >
                    {loading ? "Signing In..." : "Sign In"}
                </button>
            </form>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-sm p-6 w-full max-w-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">Password Recovery</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                &times;
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            Enter your email address to receive a password reset link.
                        </p>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleSendPassword}
                            disabled={!userEmail || loading}
                            className={`w-full mt-4 py-2 px-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                !userEmail || loading ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                        >
                            {loading ? "Sending..." : "Send Reset Link"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
</>
);
};