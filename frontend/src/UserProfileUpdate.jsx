import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext/UserContext';
import NavBar from './NavBar';
import { User, Camera, Lock, Check, RotateCw, Eye, EyeOff, AlertCircle } from 'lucide-react';

const inputCls =
  'fi w-full h-12 px-4 text-[14.5px] text-[#EDEDEE] bg-[#212125] rounded-xl outline-none transition-all duration-200 focus:bg-[#27272C] focus:ring-2 focus:ring-[#C6A15B]/30 placeholder:text-[#57575D] disabled:opacity-50';

const UserProfileUpdate = () => {
  const { userData, fetchUserData } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
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
        setProfilePicturePreview(`${import.meta.env.VITE_IMAGES_BASE_URL}${userData.profile_picture}`);
      }
    }
  }, [userData, navigate]);

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match('image.*')) return setError('Please select an image file');
      if (file.size > 2 * 1024 * 1024) return setError('File size too large. Max 2MB allowed');
      setProfilePicture(file);
      setProfilePicturePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const validatePasswords = () => {
    if (currentPassword && !newPassword) return setPasswordError('Please enter a new password'), false;
    if (!currentPassword && newPassword) return setPasswordError('Please enter your current password'), false;
    if (currentPassword && newPassword && currentPassword === newPassword) return setPasswordError('New password must be different'), false;
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

      const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/updateProfile`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.status === 'success') {
        setUpdateSuccess(true);
        fetchUserData();
        setTimeout(() => setUpdateSuccess(false), 3000);
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setError(response.data.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error:', err);
      if (err.response?.status === 400) setError(err.response.data.error || 'Invalid input');
      else if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        setTimeout(() => navigate('/'), 2000);
      } else setError('Failed to update profile. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const initials = name.trim()
    ? name.trim().split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '';

  return (
    <div className="min-h-screen bg-[#161618]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@500;600&family=Inter:wght@400;500;600;700&display=swap');
        .fd { font-family: 'Cormorant', serif; }
        .fi { font-family: 'Inter', sans-serif; }
        @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .rise { animation: rise 0.45s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      <NavBar />

      <main className="lg:pl-[300px] pb-28 lg:pb-12">
        <div className="relative max-w-md mx-auto px-4 sm:px-6 pt-3 lg:pt-10">

          <div className="pointer-events-none absolute inset-x-0 top-0 h-56"
            style={{ background: 'radial-gradient(70% 100% at 50% 0%, rgba(198,161,91,0.05), transparent 70%)' }} />

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <RotateCw className="w-7 h-7 text-[#C6A15B] animate-spin" />
              <p className="fi mt-3 text-[#A0A0A6] text-[13px]">Loading profile…</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="rise relative">
                <h1 className="fd text-[26px] sm:text-[28px] font-medium text-[#EDEDEE] leading-tight">Profile Settings</h1>
                <p className="fi text-[13px] text-[#A0A0A6] mt-0.5">Manage your account information</p>
              </div>

              {/* Avatar editor */}
              <div className="rise relative flex flex-col items-center mt-7" style={{ animationDelay: '0.05s' }}>
                <div className="relative">
                  {profilePicturePreview ? (
                    <img src={profilePicturePreview} alt="Profile" className="w-20 h-20 rounded-full object-cover ring-2 ring-[#C6A15B]/30" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-[#212125] ring-1 ring-white/[0.06] flex items-center justify-center">
                      {initials ? (
                        <span className="fi text-[22px] font-semibold text-[#C6A15B]">{initials}</span>
                      ) : (
                        <User size={30} className="text-[#6F6F76]" strokeWidth={1.6} />
                      )}
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#C6A15B] flex items-center justify-center cursor-pointer hover:bg-[#D8BA7C] transition-colors ring-2 ring-[#161618]">
                    <Camera size={14} className="text-[#161618]" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleProfilePictureChange} />
                  </label>
                </div>
                <p className="fi text-[12.5px] font-medium text-[#EDEDEE] mt-3">Profile photo</p>
                <p className="fi text-[11px] text-[#6F6F76] mt-0.5">JPG or PNG, max 2MB</p>
              </div>

              {/* Alerts */}
              {error && (
                <div className="rise relative flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-[#241619] ring-1 ring-[#E2A896]/20 mt-6">
                  <AlertCircle size={16} className="text-[#E2A896] flex-shrink-0 mt-[1px]" />
                  <p className="fi text-[13px] text-[#E2A896] leading-snug">{error}</p>
                </div>
              )}
              {updateSuccess && (
                <div className="rise relative flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-[#1E2A22] ring-1 ring-[#8FC7A0]/20 mt-6">
                  <Check size={16} className="text-[#8FC7A0] flex-shrink-0" strokeWidth={2.5} />
                  <p className="fi text-[13px] text-[#8FC7A0]">Profile updated successfully</p>
                </div>
              )}

              <form onSubmit={handleUpdate}>
                {/* Profile */}
                <div className="relative mt-7">
                  <p className="fi text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6F6F76] mb-3">Profile</p>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="fi text-[13px] font-medium text-[#A0A0A6]">Full name</label>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="fi text-[13px] font-medium text-[#A0A0A6]">Phone number</label>
                      <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Enter phone number" className={inputCls} />
                    </div>
                  </div>
                </div>

                {/* Security */}
                <div className="relative mt-6 rounded-xl bg-[#1B1B1E] ring-1 ring-white/[0.04] p-4">
                  <div className="flex items-center gap-2">
                    <Lock size={14} className="text-[#C6A15B]" />
                    <h3 className="fi text-[13px] font-semibold text-[#EDEDEE]">Change password</h3>
                  </div>
                  <p className="fi text-[11px] text-[#6F6F76] mt-1 mb-4">Leave blank to keep your current password.</p>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="fi text-[13px] font-medium text-[#A0A0A6]">Current password</label>
                      <div className="relative">
                        <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" className={`${inputCls} pr-11`} />
                        <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6F6F76] hover:text-[#C6A15B] transition-colors" aria-label={showCurrent ? 'Hide password' : 'Show password'}>
                          {showCurrent ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="fi text-[13px] font-medium text-[#A0A0A6]">New password</label>
                      <div className="relative">
                        <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className={`${inputCls} pr-11`} />
                        <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6F6F76] hover:text-[#C6A15B] transition-colors" aria-label={showNew ? 'Hide password' : 'Show password'}>
                          {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {passwordError && (
                    <p className="fi flex items-center gap-1.5 text-[12px] text-[#E2A896] mt-3">
                      <AlertCircle size={13} className="flex-shrink-0" /> {passwordError}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={updating}
                  className={`fi w-full h-12 rounded-xl mt-6 flex items-center justify-center gap-2 text-[14px] font-semibold transition-all active:scale-[0.99] ${
                    updating
                      ? 'bg-[#A9884A] text-[#161618] cursor-not-allowed'
                      : 'bg-[#C6A15B] text-[#161618] hover:bg-[#D8BA7C] shadow-[0_10px_28px_rgba(198,161,91,0.14)]'
                  }`}
                >
                  {updating ? (
                    <>
                      <RotateCw size={16} className="animate-spin" /> Updating…
                    </>
                  ) : (
                    'Update profile'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserProfileUpdate;