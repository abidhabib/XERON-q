import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios'; 
import { useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext/UserContext';
import NavBar from './NavBAr';
import BalanceCard from './new/BalanceCard';

// ✅ Lucide Icons (clean, modern, consistent)
import { 
  User, 
  Phone, 
  Lock, 
  Camera, 
  Check, 
  RotateCw 
} from 'lucide-react';

const UserProfileUpdate = () => {
  const { userData, fetchUserData } = useContext(UserContext);
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

  useEffect(() => {
    if (!userData) {
      navigate('/'); 
    } else {
      setName(userData.name || '');
      setPhoneNumber(userData.phoneNumber || '');
      setLoading(false);
      
      if (userData.profile_picture) {
        setProfilePicturePreview(`${import.meta.env.VITE_API_BASE_URL}/${userData.profile_picture}`);
      }
    }
  }, [userData, navigate]);

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match('image.*')) {
        setError('Please select an image file');
        return;
      }
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
      setPasswordError('New password must be different');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    
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
      if (profilePicture) formData.append('profilePicture', profilePicture);
      if (currentPassword && newPassword) {
        formData.append('currentPassword', currentPassword);
        formData.append('newPassword', newPassword);
      }

      const response = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/updateProfile`, 
        formData,
        { 
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      if (response.data.status === 'success') {
        setUpdateSuccess(true);
        fetchUserData();
        setTimeout(() => setUpdateSuccess(false), 3000);
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setError(response.data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error:', error);
      if (error.response?.status === 400) {
        setError(error.response.data.error || 'Invalid input');
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
      <div className="flex flex-col min-h-screen bg-[#111827] items-center justify-center">
        <RotateCw className="w-8 h-8 text-[#D4AF37] animate-spin" />
        <p className="mt-3 text-[#D4AF37]/70 text-sm">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#111827]">
      <div className="sticky top-0 z-50 bg-[#111827]">
        <NavBar />
      </div>

      <BalanceCard />

      <div className="px-2 pb-6 pt-2">
        <div className="bg-[#19202a] rounded-2xl p-4">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">Profile Settings</h2>
            <p className="text-[#D4AF37]/70 text-sm mt-1">Manage your account information</p>
          </div>
          
          {(error || passwordError) && (
            <div className="mb-5 p-3 bg-rose-900/20 border border-rose-800/30 rounded-xl">
              <p className="text-rose-400 text-sm">{error || passwordError}</p>
            </div>
          )}
          
          {updateSuccess && (
            <div className="mb-5 p-3 bg-emerald-900/20 border border-emerald-800/30 rounded-xl flex items-center">
              <Check className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0" />
              <p className="text-emerald-400 text-sm">Profile updated successfully!</p>
            </div>
          )}
          
          <form onSubmit={handleUpdate} className="space-y-5">
            {/* Profile Picture */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {profilePicturePreview ? (
                  <img 
                    src={profilePicturePreview} 
                    alt="Profile" 
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#26303b]"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#1c2a3a] flex items-center justify-center">
                    <User className="w-6 h-6 text-[#D4AF37]/60" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-[#D4AF37] rounded-full p-1 cursor-pointer hover:opacity-90 transition-opacity">
                  <Camera className="w-4 h-4 text-gray-900" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleProfilePictureChange}
                  />
                </label>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Profile Picture</p>
                <p className="text-[#D4AF37]/70 text-xs">JPG, PNG (max 2MB)</p>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-[#D4AF37]/80 text-sm mb-2">Full Name</label>
              <div className="relative">
                <div className="absolute left-3.5 top-3 text-[#D4AF37]/60">
                  <User className="w-4.5 h-4.5" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#1c2a3a] rounded-xl text-white placeholder-[#D4AF37]/40 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all text-sm"
                  placeholder="Enter your full name"
                />
              </div>
            </div>
            
            {/* Phone */}
            <div>
              <label className="block text-[#D4AF37]/80 text-sm mb-2">Phone Number</label>
              <div className="relative">
                <div className="absolute left-3.5 top-3 text-[#D4AF37]/60">
                  <Phone className="w-4.5 h-4.5" />
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#1c2a3a] rounded-xl text-white placeholder-[#D4AF37]/40 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all text-sm"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            
            {/* Password Section */}
            <div className="pt-3 border-t border-[#26303b]">
              <h3 className="text-white text-sm font-medium mb-4">Change Password</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[#D4AF37]/80 text-sm mb-2">Current Password</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-3 text-[#D4AF37]/60">
                      <Lock className="w-4.5 h-4.5" />
                    </div>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-[#1c2a3a] rounded-xl text-white placeholder-[#D4AF37]/40 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all text-sm"
                      placeholder="Enter current password"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[#D4AF37]/80 text-sm mb-2">New Password</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-3 text-[#D4AF37]/60">
                      <Lock className="w-4.5 h-4.5" />
                    </div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-[#1c2a3a] rounded-xl text-white placeholder-[#D4AF37]/40 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all text-sm"
                      placeholder="Enter new password"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Update Button */}
            <button
              type="submit"
              disabled={updating}
              className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${
                updating
                  ? 'bg-[#1c2a3a] text-[#D4AF37]/70 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#D4AF37] to-[#c69c2e] text-gray-900 shadow-[0_2px_6px_rgba(212,175,55,0.2)] hover:from-[#e8c04e] hover:to-[#d4af37]'
              }`}
            >
              {updating ? (
                <div className="flex items-center justify-center gap-2">
                  <RotateCw className="w-4 h-4 animate-spin" />
                  Updating...
                </div>
              ) : (
                'Update Profile'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfileUpdate;