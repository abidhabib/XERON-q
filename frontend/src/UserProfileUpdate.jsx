import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios'; 
import { useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext/UserContext';
import { FiUser, FiPhone, FiLock, FiCamera, FiCheck } from 'react-icons/fi';
import NavBar from './NavBAr';
import { AiOutlineVerified } from "react-icons/ai";
import { FiHome, FiMail as FiMailNav, FiUsers } from "react-icons/fi";
import NotificationBell from './NotificationBell';

const UserProfileUpdate = () => {
  const { userData, fetchUserData, NewName, currBalance, backend_wallet } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

  const menuItems = [
    { 
      name: "Home", 
      link: "/wallet", 
      icon: <FiHome className="w-4 h-4" />,
      label: "Dashboard Home"
    },
    { 
      name: "Alerts", 
      link: "/alerts", 
      icon: <NotificationBell iconClass="w-4 h-4" />,
      label: "View Notifications"
    },
    { 
      name: "Contact", 
      link: "/contact", 
      icon: <FiMailNav className="w-4 h-4" />,
      label: "Contact Support"
    },
    { 
      name: "Team", 
      link: "/team", 
      icon: <FiUsers className="w-4 h-4" />,
      label: "View Team"
    }
  ];

  // Calculate progress (backend_wallet / 3)
  const progress = backend_wallet ? Math.min(Math.round((backend_wallet / 3) * 100), 100) : 0;

  // Format currency properly
  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toFixed(2);
  };

  useEffect(() => {
    if (!userData) {
      navigate('/'); 
    } else {
      setName(userData.name || '');
      setPhoneNumber(userData.phoneNumber || '');
      setLoading(false);
      
      // Set profile picture preview if exists
      if (userData.profile_picture) {
        setProfilePicturePreview(`${import.meta.env.VITE_API_BASE_URL}/${userData.profile_picture}`);
      }
    }
  }, [userData, navigate]);

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.match('image.*')) {
        setError('Please select an image file');
        return;
      }
      
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('File size too large. Max 2MB allowed');
        return;
      }
      
      setProfilePicture(file);
      setProfilePicturePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const validatePasswords = () => {
    if (currentPassword && !newPassword) {
      setPasswordError('Please enter a new password');
      return false;
    }
    
    if (!currentPassword && newPassword) {
      setPasswordError('Please enter your current password');
      return false;
    }
    
    if (currentPassword && newPassword && currentPassword === newPassword) {
      setPasswordError('New password must be different from current password');
      return false;
    }
    
    setPasswordError('');
    return true;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    
    // Validation
    if (!name.trim() || !phoneNumber.trim()) {
      setError('Name and phone number are required');
      setUpdating(false);
      return;
    }
    
    if (!validatePasswords()) {
      setUpdating(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('phoneNumber', phoneNumber.trim());
      
      if (profilePicture) {
        formData.append('profilePicture', profilePicture);
      }
      
      if (currentPassword && newPassword) {
        formData.append('currentPassword', currentPassword);
        formData.append('newPassword', newPassword);
      }

      const response = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/updateProfile`, 
        formData,
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.status === 'success') {
        setUpdateSuccess(true);
        fetchUserData();
        setTimeout(() => setUpdateSuccess(false), 3000);
        // Reset password fields after successful update
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setError(response.data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error:', error);
      if (error.response?.status === 400) {
        setError(error.response.data.error || 'Invalid input data');
      } else if (error.response?.status === 401) {
        setError('Session expired. Please login again.');
        setTimeout(() => navigate('/'), 2000);
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <div className="fixed top-0 left-0 right-0 z-50">
          <NavBar />
        </div>
        <div className="flex flex-col flex-1 pt-16">
          <div className="flex items-center justify-center flex-1">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-gray-600 text-sm">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Fixed Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <NavBar />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 pt-16">
        {/* Mini Dashboard */}
        <div className="py-4 bg-[#19202a] shadow">
          <div className="flex items-center px-3 mb-2.5">
            <p className="text-white uppercase flex items-center text-sm font-medium">
              {NewName || 'User'} 
              <span className="text-green-500 ml-1">
                <AiOutlineVerified className="w-4 h-4" />
              </span>
            </p>
          </div>

          <div className="flex justify-between items-center px-3 mb-3.5">
            <p className="text-white text-lg font-bold">
              ${formatCurrency(currBalance)}
            </p>
            <div className="px-2 py-1 font-bold text-green-400 bg-transparent border border-green-400 rounded-full text-xs">
              Progress {progress}%
            </div>
          </div>

          <div className="px-3 pb-1.5">
            <div className="grid grid-cols-4 gap-1.5">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => navigate(item.link)}
                  className="flex flex-col items-center p-1.5 text-white hover:bg-white/10 rounded transition-colors"
                  aria-label={item.label}
                >
                  <div className="border border-white/20 rounded-full p-2 mb-0.5 flex items-center justify-center bg-white/5">
                    {item.icon}
                  </div>
                  <span className="text-xs text-center">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="px-3 py-4 flex-1">
          <div className="max-w-md mx-auto w-full">
            <div className="bg-white rounded-lg shadow-sm   p-3">
              <div className="mb-4">
                <h2 className="text-base font-bold text-gray-900">Profile Settings</h2>
                <p className="text-xs text-gray-500 mt-1">Manage your account information</p>
              </div>
              
              {(error || passwordError) && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-xs">{error || passwordError}</p>
                </div>
              )}
              
              {updateSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <FiCheck className="text-green-600 mr-2" />
                    <p className="text-green-700 text-xs">Profile updated successfully!</p>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleUpdate} className="space-y-4">
                {/* Profile Picture */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {profilePicturePreview ? (
                      <img 
                        src={profilePicturePreview} 
                        alt="Profile" 
                        className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center">
                        <FiUser className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 bg-indigo-500 rounded-full p-1 cursor-pointer">
                      <FiCamera className="w-3.5 h-3.5 text-white" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleProfilePictureChange}
                      />
                    </label>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Profile Picture</p>
                    <p className="text-xs text-gray-500">JPG, PNG (max 2MB)</p>
                  </div>
                </div>

                {/* Name Field */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400">
                      <FiUser className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-sm"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>
                
                {/* Phone Number Field */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400">
                      <FiPhone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-sm"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                
                {/* Password Change Section */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Change Password</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Current Password</label>
                      <div className="relative">
                        <div className="absolute left-3 top-3 text-gray-400">
                          <FiLock className="w-4 h-4" />
                        </div>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-sm"
                          placeholder="Enter current password"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">New Password</label>
                      <div className="relative">
                        <div className="absolute left-3 top-3 text-gray-400">
                          <FiLock className="w-4 h-4" />
                        </div>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-sm"
                          placeholder="Enter new password"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Update Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={updating}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 text-sm rounded-lg font-medium shadow-sm transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {updating ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                        <span>Updating...</span>
                      </div>
                    ) : (
                      'Update Profile'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileUpdate;