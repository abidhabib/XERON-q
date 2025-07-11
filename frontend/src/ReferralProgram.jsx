import React, { useState, useEffect, useContext } from 'react';
import { FaCopy, FaWhatsapp, FaTelegram, FaTwitter, FaFacebook, FaLink, FaGift, FaUsers, FaLockOpen, FaChartLine } from 'react-icons/fa';
import { motion } from 'framer-motion';
import NavBar from './NavBAr';
import { UserContext } from './UserContext/UserContext';

const ReferralProgram = () => {
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const { Userid } = useContext(UserContext);

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
      case 'whatsapp': shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + inviteLink)}`; break;
      case 'telegram': shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`; break;
      case 'twitter': shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText + " " + inviteLink)}`; break;
      case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}`; break;
      default: return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const benefits = [
    {
      title: "Earn Rewards",
      description: "Get bonuses for each friend who signs up",
      icon: <FaGift className="text-indigo-500" />
    },
    {
      title: "Expand Network",
      description: "Grow your professional connections",
      icon: <FaUsers className="text-green-500" />
    },
    {
      title: "Unlock Features",
      description: "Access higher tiers as you grow",
      icon: <FaLockOpen className="text-amber-500" />
    },
    {
      title: "Boost Earnings",
      description: "Earn from your referrals' activity",
      icon: <FaChartLine className="text-rose-500" />
    }
  ];

  return (
    <>
      <NavBar />
      <div className="max-w-4xl mx-auto px-2 pt-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          {/* Header */}
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                Invite Friends & Earn
              </h2>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                Bonus Active
              </span>
            </div>
            <p className="text-gray-500 mt-1 text-sm">
              Share your link to unlock rewards when friends join
            </p>
          </div>
          
          {/* Main Content */}
          <div className="p-2">
            {/* Referral Link Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your referral link
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                    <FaLink className="text-gray-400 mr-2" />
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      className="bg-transparent text-gray-700 w-full outline-none font-mono text-sm truncate"
                    />
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={copyLink}
                  className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
                    copied 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  } transition-colors whitespace-nowrap`}
                >
                  <FaCopy className="text-sm" />
                  {copied ? "Copied!" : "Copy Link"}
                </motion.button>
              </div>
            </div>
            
            {/* Sharing Options */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Share via</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <motion.button
                  whileHover={{ y: -2 }}
                  className="flex flex-col items-center justify-center gap-1 bg-white border border-gray-200 text-gray-600 p-3 rounded-lg hover:border-green-300 transition-all"
                  onClick={() => shareOnPlatform('whatsapp')}
                >
                  <FaWhatsapp className="text-xl text-green-500" />
                  <span className="text-xs">WhatsApp</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ y: -2 }}
                  className="flex flex-col items-center justify-center gap-1 bg-white border border-gray-200 text-gray-600 p-3 rounded-lg hover:border-blue-300 transition-all"
                  onClick={() => shareOnPlatform('telegram')}
                >
                  <FaTelegram className="text-xl text-blue-500" />
                  <span className="text-xs">Telegram</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ y: -2 }}
                  className="flex flex-col items-center justify-center gap-1 bg-white border border-gray-200 text-gray-600 p-3 rounded-lg hover:border-sky-300 transition-all"
                  onClick={() => shareOnPlatform('twitter')}
                >
                  <FaTwitter className="text-xl text-sky-500" />
                  <span className="text-xs">Twitter</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ y: -2 }}
                  className="flex flex-col items-center justify-center gap-1 bg-white border border-gray-200 text-gray-600 p-3 rounded-lg hover:border-blue-400 transition-all"
                  onClick={() => shareOnPlatform('facebook')}
                >
                  <FaFacebook className="text-xl text-blue-700" />
                  <span className="text-xs">Facebook</span>
                </motion.button>
              </div>
            </div>
            
            {/* Benefits Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Why share?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-gray-50 border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-50 rounded-lg">
                        {benefit.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{benefit.title}</h4>
                        <p className="text-gray-500 mt-1 text-sm">{benefit.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
    
        </motion.div>
      </div>
    </>
  );
};

export default ReferralProgram;