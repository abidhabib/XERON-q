import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios'; 
import { useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext/UserContext';
import BalanceCard from './new/BalanceCard';

// ✅ Lucide Icons
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
      <div className="flex flex-col min-h-screen bg-[#F5F5F5] items-center justify-center">
        <RotateCw className="w-8 h-8 text-[#F0B90B] animate-spin" />
        <p className="mt-3 text-[#707A8A] text-sm">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F5]">
  alerts

      <BalanceCard />

      <div className="px-3 pb-6 pt-2">
        <div className="bg-white rounded-2xl p-4 border border-[#E6E8EB] shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[#1E2026]">Profile Settings</h2>
            <p className="text-[#707A8A] text-sm mt-1">Manage your account information</p>
          </div>

          {(error || passwordError) && (
            <div className="mb-5 p-3 bg-rose-50 border border-rose-200 rounded-xl">
              <p className="text-rose-600 text-sm">{error || passwordError}</p>
            </div>
          )}

          {updateSuccess && (
            <div className="mb-5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center">
              <Check className="w-4 h-4 text-emerald-600 mr-2 flex-shrink-0" />
              <p className="text-emerald-600 text-sm">Profile updated successfully!</p>
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
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#E6E8EB]"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#F5F5F5] border border-[#E6E8EB] flex items-center justify-center">
                    <User className="w-6 h-6 text-[#C5C8CE]" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-[#F0B90B] rounded-full p-1.5 cursor-pointer hover:opacity-90 transition-opacity shadow-sm border-2 border-white">
                  <Camera className="w-3.5 h-3.5 text-[#1E2026]" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleProfilePictureChange}
                  />
                </label>
              </div>
              <div>
                <p className="text-[#1E2026] text-sm font-medium">Profile Picture</p>
                <p className="text-[#707A8A] text-xs">JPG, PNG (max 2MB)</p>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-[#1E2026] text-sm font-medium mb-2">Full Name</label>
              <div className="relative">
                <div className="absolute left-3.5 top-3 text-[#C5C8CE]">
                  <User className="w-[18px] h-[18px]" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-[#E6E8EB] rounded-xl text-[#1E2026] placeholder-[#C5C8CE] focus:outline-none focus:ring-2 focus:ring-[#F0B90B]/30 focus:border-[#F0B90B] transition-all text-sm"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[#1E2026] text-sm font-medium mb-2">Phone Number</label>
              <div className="relative">
                <div className="absolute left-3.5 top-3 text-[#C5C8CE]">
                  <Phone className="w-[18px] h-[18px]" />
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-[#E6E8EB] rounded-xl text-[#1E2026] placeholder-[#C5C8CE] focus:outline-none focus:ring-2 focus:ring-[#F0B90B]/30 focus:border-[#F0B90B] transition-all text-sm"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            {/* Password Section */}
            <div className="pt-3 border-t border-[#F0F0F0]">
              <h3 className="text-[#1E2026] text-sm font-semibold mb-4">Change Password</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[#1E2026] text-sm font-medium mb-2">Current Password</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-3 text-[#C5C8CE]">
                      <Lock className="w-[18px] h-[18px]" />
                    </div>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-[#E6E8EB] rounded-xl text-[#1E2026] placeholder-[#C5C8CE] focus:outline-none focus:ring-2 focus:ring-[#F0B90B]/30 focus:border-[#F0B90B] transition-all text-sm"
                      placeholder="Enter current password"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#1E2026] text-sm font-medium mb-2">New Password</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-3 text-[#C5C8CE]">
                      <Lock className="w-[18px] h-[18px]" />
                    </div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-[#E6E8EB] rounded-xl text-[#1E2026] placeholder-[#C5C8CE] focus:outline-none focus:ring-2 focus:ring-[#F0B90B]/30 focus:border-[#F0B90B] transition-all text-sm"
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
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                updating
                  ? 'bg-[#F5F5F5] text-[#C5C8CE] cursor-not-allowed border border-[#E6E8EB]'
                  : 'bg-[#F0B90B] text-[#1E2026] hover:bg-[#E5AC00] active:scale-[0.98] shadow-sm'
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