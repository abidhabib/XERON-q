import React, { useState, useEffect, useContext } from 'react';
import { FaCopy, FaWhatsapp, FaTelegram, FaTwitter, FaFacebook, FaLink } from 'react-icons/fa';
import { FiHome, FiMail, FiUsers } from "react-icons/fi";
import { AiOutlineVerified } from "react-icons/ai";
import NavBar from './NavBAr';
import { UserContext } from './UserContext/UserContext';
import NotificationBell from './NotificationBell';
import { useNavigate } from 'react-router-dom';

const ReferralProgram = () => {
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const { Userid, NewName, currBalance, backend_wallet } = useContext(UserContext);
  const navigate = useNavigate();

  const menuItems = [
    { 
      name: "Home", 
      link: "/wallet", 
      icon: <FiHome className="w-5 h-5" />,
      label: "Dashboard Home"
    },
    { 
      name: "Alerts", 
      link: "/alerts", 
      icon: <NotificationBell iconClass="w-5 h-5" />,
      label: "View Notifications"
    },
    { 
      name: "Contact", 
      link: "/contact", 
      icon: <FiMail className="w-5 h-5" />,
      label: "Contact Support"
    },
    { 
      name: "Team", 
      link: "/team", 
      icon: <FiUsers className="w-5 h-5" />,
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
    const userId = Userid;
    const link = `https://CHECKING.RUN.PLACE/signup?ref=${userId}`;
    setInviteLink(link);
  }, [Userid]);

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnPlatform = (platform) => {
    let shareUrl = '';
    const shareText = "Join this platform using my referral link:";
    
    switch(platform) {
      case 'whatsapp': 
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + inviteLink)}`;
        break;
      case 'telegram': 
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;
        break;
      case 'twitter': 
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText + " " + inviteLink)}`;
        break;
      case 'facebook': 
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}`;
        break;
      default: 
        return;
    }
    
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Fixed Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <NavBar />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 pt-16">
        {/* Mini Dashboard - EXACT SAME HEIGHT AS ABOUT COMPONENT */}
        <div className="py-6 bg-[#19202a] shadow-lg">
          <div className="flex items-center px-4 mb-4">
            <p className="text-white uppercase flex items-center text-lg font-medium">
              {NewName || 'User'} 
              <span className="text-green-500 ml-1">
                <AiOutlineVerified className="w-5 h-5" />
              </span>
            </p>
          </div>

          <div className="flex justify-between items-center px-4 mb-6">
            <p className="text-white text-2xl font-bold">
              ${formatCurrency(currBalance)}
            </p>
            <div className="px-3 py-1.5 font-bold text-green-400 bg-transparent border border-green-400 rounded-full text-xs">
              Progress {progress}%
            </div>
          </div>

          <div className="px-4 pb-2">
            <div className="grid grid-cols-4 gap-2">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => navigate(item.link)}
                  className="flex flex-col items-center p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                  aria-label={item.label}
                >
                  <div className="border border-white/20 rounded-full p-2.5 mb-1 flex items-center justify-center bg-white/5">
                    {item.icon}
                  </div>
                  <span className="text-xs text-center mt-1">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Referral Content - Maintaining consistent spacing */}
        <div className="px-4 mt-6 pb-6 flex-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Invite Friends & Earn
                </h2>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>
              <p className="text-gray-500 text-xs mt-1">
                Share your link to unlock rewards
              </p>
            </div>
            
            {/* Main Content */}
            <div className="p-4">
              {/* Referral Link Section */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Your referral link
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-grow">
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded px-3 py-2">
                      <FaLink className="text-gray-400 mr-2 text-sm" />
                      <input
                        type="text"
                        value={inviteLink}
                        readOnly
                        className="bg-transparent text-gray-700 w-full outline-none text-sm truncate"
                      />
                    </div>
                  </div>
                  <button
                    onClick={copyLink}
                    className={`px-3 py-2 rounded text-sm flex items-center justify-center gap-1.5 ${
                      copied 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    } transition-colors whitespace-nowrap`}
                  >
                    <FaCopy className="text-xs" />
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
              
              {/* Sharing Options */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-700 mb-2.5">Share via</h3>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    className="flex flex-col items-center justify-center gap-1 bg-white border border-gray-200 text-gray-600 p-2.5 rounded hover:border-green-300 transition-colors"
                    onClick={() => shareOnPlatform('whatsapp')}
                  >
                    <FaWhatsapp className="text-lg text-green-500" />
                    <span className="text-xs">WhatsApp</span>
                  </button>
                  
                  <button
                    className="flex flex-col items-center justify-center gap-1 bg-white border border-gray-200 text-gray-600 p-2.5 rounded hover:border-blue-300 transition-colors"
                    onClick={() => shareOnPlatform('telegram')}
                  >
                    <FaTelegram className="text-lg text-blue-500" />
                    <span className="text-xs">Telegram</span>
                  </button>
                  
                  <button
                    className="flex flex-col items-center justify-center gap-1 bg-white border border-gray-200 text-gray-600 p-2.5 rounded hover:border-sky-300 transition-colors"
                    onClick={() => shareOnPlatform('twitter')}
                  >
                    <FaTwitter className="text-lg text-sky-500" />
                    <span className="text-xs">Twitter</span>
                  </button>
                  
                  <button
                    className="flex flex-col items-center justify-center gap-1 bg-white border border-gray-200 text-gray-600 p-2.5 rounded hover:border-blue-400 transition-colors"
                    onClick={() => shareOnPlatform('facebook')}
                  >
                    <FaFacebook className="text-lg text-blue-700" />
                    <span className="text-xs">Facebook</span>
                  </button>
                </div>
              </div>
              
              {/* Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-blue-50 border border-blue-100 rounded p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="text-xs font-medium text-gray-900">Earn 10% commission</p>
                      <p className="text-xs text-gray-600">From referrals' earnings</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-100 rounded p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div>
                      <p className="text-xs font-medium text-gray-900">Unlimited invites</p>
                      <p className="text-xs text-gray-600">Invite as many as you want</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-amber-50 border border-amber-100 rounded p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <div>
                      <p className="text-xs font-medium text-gray-900">Instant rewards</p>
                      <p className="text-xs text-gray-600">Get bonuses immediately</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-100 rounded p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <div>
                      <p className="text-xs font-medium text-gray-900">Tier benefits</p>
                      <p className="text-xs text-gray-600">Unlock higher rewards</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralProgram;