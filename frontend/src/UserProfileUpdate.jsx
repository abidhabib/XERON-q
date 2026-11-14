/* eslint-disable react/prop-types */
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext/UserContext';
import NavBar from './NavBar';
import { User, Camera, Lock, Check, RotateCw, Eye, EyeOff, AlertCircle, Bell, BriefcaseBusiness, CalendarDays, ShieldCheck, Users } from 'lucide-react';

const inputCls =
  'fi w-full h-12 px-4 text-[15px] text-[#20262d] bg-white border border-[#e1e5ea] rounded-xl outline-none transition-all duration-200 focus:border-[#C6A15B] focus:ring-2 focus:ring-[#C6A15B]/20 placeholder:text-[#9aa4b2] disabled:opacity-50';

const UserProfileUpdate = () => {
  const { userData, fetchUserData, NewName, currBalance, total_withdrawal, backend_wallet } = useContext(UserContext);
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
  const progress = backend_wallet ? Math.min(Math.round((Number(backend_wallet) / 3) * 100), 100) : 0;
  const available = Number(currBalance || 0).toFixed(1).replace(/\.0$/, '');
  const cashout = Number(total_withdrawal || 0).toFixed(1).replace(/\.0$/, '');

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-[#f5f5f4] shadow-[0_0_40px_rgba(19,25,32,0.06)]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@500;600&family=Inter:wght@400;500;600;700&display=swap');
        .fd { font-family: 'Cormorant', serif; }
        .fi { font-family: 'Inter', sans-serif; }
        @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .rise { animation: rise 0.45s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      <header className="relative min-h-[300px] overflow-hidden rounded-b-[14px] bg-[#20262d] px-[25px] pt-[14px] shadow-[0_8px_20px_rgba(22,28,35,0.16)]">
        <NavBar />
        <div className="mt-[25px] flex items-center justify-between gap-3">
          <p className="flex min-w-0 items-center gap-1.5 truncate text-[15px] font-semibold text-white"><span className="truncate">{NewName || 'Member'}</span><ShieldCheck size={17} className="shrink-0 text-[#e3b900]" /></p>
          <span className="shrink-0 rounded-full bg-[#4c4330] px-2.5 py-1 text-[10px] font-semibold text-[#f5c927]">{progress}% Progress</span>
        </div>
        <div className="mt-[18px] grid grid-cols-2">
          <div><p className="text-[27px] font-semibold leading-none tracking-[-0.04em] text-white"><span className="mr-0.5 text-[20px] text-[#dce4ee]">$</span>{available}</p><p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-[#8191a5]">Available balance</p></div>
          <div className="pt-[8px] text-right"><p className="text-[19px] font-semibold leading-none tracking-[-0.03em] text-[#c7d1dc]"><span className="mr-0.5 text-[14px]">$</span>{cashout}</p><p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-[#8191a5]">Total cashout</p></div>
        </div>
        <div className="mt-[31px] grid grid-cols-4 gap-5">
          {[["Wallet", BriefcaseBusiness, "/wallet"], ["Salary", CalendarDays, "/salaryofMonth"], ["Team", Users, "/team"], ["Alert", Bell, "/alerts"]].map(([label, Icon, path]) => <button key={label} type="button" onClick={() => navigate(path)} className="flex min-w-0 flex-col items-center gap-1.5 text-[#93a1b3]"><span className="grid h-[42px] w-[42px] place-items-center rounded-xl bg-[#303943]"><Icon size={19} strokeWidth={2} /></span><span className="text-[10px] font-medium">{label}</span></button>)}
        </div>
      </header>

      <main className="pb-8">
        <div className="relative mx-auto max-w-md px-4 pt-3">

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <RotateCw className="w-7 h-7 text-[#C6A15B] animate-spin" />
              <p className="fi mt-3 text-[#778497] text-[13px]">Loading profile…</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="rise relative">
                <h1 className="fi text-[22px] font-bold text-[#20262d] leading-tight">Profile settings</h1>
                <p className="fi text-[13px] text-[#778497] mt-1">Manage your account information</p>
              </div>

              {/* Avatar editor */}
              <div className="rise relative flex flex-col items-center mt-7" style={{ animationDelay: '0.05s' }}>
                <div className="relative">
                  {profilePicturePreview ? (
                    <img src={profilePicturePreview} alt="Profile" className="w-20 h-20 rounded-full object-cover ring-2 ring-[#C6A15B]/30" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-white ring-1 ring-[#e1e5ea] shadow-sm flex items-center justify-center">
                      {initials ? (
                        <span className="fi text-[22px] font-semibold text-[#C6A15B]">{initials}</span>
                      ) : (
                        <User size={30} className="text-[#778497]" strokeWidth={1.6} />
                      )}
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 grid h-10 w-10 place-items-center rounded-full bg-[#C6A15B] cursor-pointer transition-colors hover:bg-[#D8BA7C] ring-2 ring-[#f5f5f4]">
                    <Camera size={14} className="text-[#161618]" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleProfilePictureChange} />
                  </label>
                </div>
                <p className="fi text-[12.5px] font-medium text-[#20262d] mt-3">Profile photo</p>
              </div>

              {/* Alerts */}
              {error && (
                <div role="alert" className="rise relative flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-[#fff4f2] ring-1 ring-[#E2A896]/30 mt-6">
                  <AlertCircle size={16} className="text-[#E2A896] flex-shrink-0 mt-[1px]" />
                  <p className="fi text-[13px] text-[#E2A896] leading-snug">{error}</p>
                </div>
              )}
              {updateSuccess && (
                <div role="status" className="rise relative flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-[#effaf2] ring-1 ring-[#8FC7A0]/30 mt-6">
                  <Check size={16} className="text-[#8FC7A0] flex-shrink-0" strokeWidth={2.5} />
                  <p className="fi text-[13px] text-[#8FC7A0]">Profile updated successfully</p>
                </div>
              )}

              <form onSubmit={handleUpdate}>
                {/* Profile */}
                <div className="relative mt-7">
                  <p className="fi text-[11px] font-semibold uppercase tracking-[0.14em] text-[#778497] mb-3">Profile</p>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="profile-name" className="fi text-[13px] font-medium text-[#536276]">Full name</label>
                      <input id="profile-name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="profile-phone" className="fi text-[13px] font-medium text-[#536276]">Phone number</label>
                      <input id="profile-phone" type="tel" inputMode="tel" autoComplete="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Enter phone number" className={inputCls} />
                    </div>
                  </div>
                </div>

                {/* Security */}
                <div className="relative mt-6 rounded-2xl bg-white ring-1 ring-[#e1e5ea] p-4 shadow-[0_3px_10px_rgba(22,28,35,0.04)]">
                  <div className="flex items-center gap-2">
                    <Lock size={14} className="text-[#C6A15B]" />
                    <h3 className="fi text-[13px] font-semibold text-[#20262d]">Change password</h3>
                  </div>
                  <p className="fi text-[11px] text-[#778497] mt-1 mb-4">Leave blank to keep your current password.</p>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="current-password" className="fi text-[13px] font-medium text-[#536276]">Current password</label>
                      <div className="relative">
                        <input id="current-password" autoComplete="current-password" type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" className={`${inputCls} pr-11`} />
                        <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center text-[#778497] transition-colors hover:text-[#C6A15B]" aria-label={showCurrent ? 'Hide password' : 'Show password'}>
                          {showCurrent ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="new-password" className="fi text-[13px] font-medium text-[#536276]">New password</label>
                      <div className="relative">
                        <input id="new-password" autoComplete="new-password" type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className={`${inputCls} pr-11`} />
                        <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center text-[#778497] transition-colors hover:text-[#C6A15B]" aria-label={showNew ? 'Hide password' : 'Show password'}>
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
