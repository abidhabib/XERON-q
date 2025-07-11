import React, { useState } from 'react';
import { Sidebar } from '../SideBarSection/Sidebar';
import axios from 'axios';
import { 
  HiOutlineUser,
  HiOutlineLockClosed,
  HiOutlineLockOpen,
  HiOutlineRefresh,
  HiOutlineCheckCircle
} from 'react-icons/hi';
import { FaSpinner } from 'react-icons/fa';

export const AccountSetting = () => {
  const [username, setUsername] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setShowSuccess(false);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/changePassword`, {
        username,
        oldPassword,
        newPassword
      });

      setMessage(response.data.message);
      setShowSuccess(true);
      
      // Clear form on success
      setUsername('');
      setOldPassword('');
      setNewPassword('');
      
      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update password');
      setShowSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 p-4 ml-10 md:p-6 ml-0 md:ml-64">
      <div className="max-w-md mx-auto">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-indigo-100 text-indigo-600 mb-4">
              <HiOutlineLockClosed className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Account Security</h1>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {showSuccess ? (
              <div className="mb-6 p-4 rounded-lg bg-green-50 text-green-700 flex items-center">
                <HiOutlineCheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{message}</span>
              </div>
            ) : message ? (
              <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700">
                {message}
              </div>
            ) : null}

            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiOutlineUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="block w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-transparent"
                    placeholder="Enter your username"
                  />
                </div>
              </div>
              
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiOutlineLockClosed className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    className="block w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-transparent"
                    placeholder="Enter current password"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiOutlineLockOpen className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="block w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-transparent"
                    placeholder="Enter new password"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Use 8+ characters with a mix of letters, numbers & symbols
                </p>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center py-2 px-4 rounded-lg text-white font-medium transition-colors ${
                  isLoading 
                    ? 'bg-indigo-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <HiOutlineRefresh className="mr-2" />
                    Change Password
                  </>
                )}
              </button>
            </form>
          </div>
          
        
        </div>
      </div>
    </div>
  );
};