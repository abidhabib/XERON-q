import { useState } from 'react';
import { Sidebar } from '../SideBarSection/Sidebar';
import axios from 'axios';
import { 
  HiOutlineUser,
  HiOutlineLockClosed,
  HiOutlineLockOpen,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineShieldCheck,
  HiOutlineKey,
  HiOutlineExclamationCircle
} from 'react-icons/hi';
import { FaSpinner } from 'react-icons/fa';

export const AccountSetting = () => {
  const [username, setUsername] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [passwordStrength, setPasswordStrength] = useState(0);

  const calculatePasswordStrength = (password) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  };

  const handlePasswordChange = (value) => {
    setNewPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const getStrengthColor = (strength) => {
    if (strength < 50) return 'bg-red-500';
    if (strength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setShowSuccess(false);
    setMessage('');

    // Validation
    if (oldPassword === newPassword) {
      setMessage('New password must be different from current password');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setMessage('Password must be at least 8 characters long');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/changePassword`,
        { username, oldPassword, newPassword },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );

      setMessage(response.data.message || 'Password updated successfully');
      setMessageType('success');
      setShowSuccess(true);
      
      // Clear form on success
      setUsername('');
      setOldPassword('');
      setNewPassword('');
      setPasswordStrength(0);
      
      // Hide success message after 4 seconds
      setTimeout(() => {
        setShowSuccess(false);
        setMessage('');
      }, 4000);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to update password. Please check your credentials.';
      setMessage(errorMsg);
      setMessageType('error');
      setShowSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      <main>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 rounded-lg bg-indigo-100">
                <HiOutlineShieldCheck className="w-6 h-6 text-indigo-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Account Security</h1>
            </div>
            <p className="text-gray-600">Update your password and secure your account</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Info */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <HiOutlineKey className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Password Requirements</h3>
                </div>
                
                <ul className="space-y-3">
                  <li className="flex items-start space-x-2">
                    <HiOutlineCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Minimum 8 characters</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <HiOutlineCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">At least one uppercase letter</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <HiOutlineCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">At least one number</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <HiOutlineCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">At least one special character</span>
                  </li>
                </ul>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    <HiOutlineExclamationCircle className="w-4 h-4 inline mr-1" />
                    <span>For security reasons, you will be logged out after changing your password.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column - Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  {message && (
                    <div className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
                      messageType === 'success' 
                        ? 'bg-green-50 text-green-800 border border-green-200' 
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {messageType === 'success' ? (
                        <HiOutlineCheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <HiOutlineExclamationCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      )}
                      <span className="text-sm">{message}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Username Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <HiOutlineUser className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                          className="block w-full pl-10 pr-4 py-3 text-base rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors placeholder-gray-400"
                          placeholder="admin.username"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* Current Password Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <HiOutlineLockClosed className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          required
                          className="block w-full pl-10 pr-4 py-3 text-base rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors placeholder-gray-400"
                          placeholder="••••••••"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* New Password Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <HiOutlineLockOpen className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => handlePasswordChange(e.target.value)}
                          required
                          className="block w-full pl-10 pr-4 py-3 text-base rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors placeholder-gray-400"
                          placeholder="••••••••"
                          disabled={isLoading}
                        />
                      </div>
                      
                      {/* Password Strength Meter */}
                      {newPassword && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600">Password strength</span>
                            <span className="font-medium text-gray-700">{passwordStrength}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`}
                              style={{ width: `${passwordStrength}%` }}
                            />
                          </div>
                          <p className="mt-2 text-xs text-gray-500">
                            {passwordStrength < 50 && 'Weak password'}
                            {passwordStrength >= 50 && passwordStrength < 75 && 'Moderate password'}
                            {passwordStrength >= 75 && 'Strong password'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full flex justify-center items-center py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 ${
                          isLoading 
                            ? 'bg-indigo-400 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm hover:shadow'
                        }`}
                      >
                        {isLoading ? (
                          <>
                            <FaSpinner className="animate-spin mr-3" />
                            Updating Password...
                          </>
                        ) : (
                          <>
                            <HiOutlineRefresh className="mr-3" />
                            Change Password
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Need help? Contact your system administrator for support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};