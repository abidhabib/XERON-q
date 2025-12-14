import React, { useState, useEffect, useContext } from 'react';
import NavBar from './NavBAr';
import { UserContext } from './UserContext/UserContext';
import BalanceCard from './new/BalanceCard';

// ✅ Lucide Icons (clean, minimal, consistent)
import { 
  Link, 
  Copy, 
  Send, 
  MessageCircle, 
  MessageSquare, 
  Share2,
  CheckCircle
} from 'lucide-react';

const ReferralProgram = () => {
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const { Userid } = useContext(UserContext);

  useEffect(() => {
    if (Userid) {
      // ✅ Fixed: no extra spaces in URL
      const link = `https://rovexking.com/signup?ref=${Userid}`;
      setInviteLink(link);
    }
  }, [Userid]);

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnPlatform = (platform) => {
    const shareText = "Join this platform using my referral link:";
    let shareUrl = '';

    switch (platform) {
      case 'whatsapp':
        // ✅ Correct WhatsApp API format
        shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText + " " + inviteLink)}`;
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
    <div className="flex flex-col min-h-screen bg-[#111827]">
      <div className="sticky top-0 z-50 bg-[#111827]">
        <NavBar />
      </div>

      <BalanceCard />

      <div className="px-2 pb-6 pt-2">
        <div className="bg-[#19202a] rounded-2xl">
          {/* Header */}
          <div className="p-4 border-b border-[#26303b]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Invite Friends & Earn
              </h2>
              <span className="text-[11px] bg-[#1c2a3a] text-[#D4AF37] px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <p className="text-[#D4AF37]/70 text-xs mt-1">
              Share your link to unlock rewards
            </p>
          </div>

          {/* Main Content */}
          <div className="p-4">
            {/* Referral Link */}
            <div className="mb-5">
              <label className="block text-[11px] font-medium text-[#D4AF37]/80 mb-2">
                Your referral link
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                  <div className="flex items-center bg-[#1c2a3a] rounded-lg px-3 py-2.5">
                    <Link className="text-[#D4AF37]/60 mr-2 w-4 h-4" />
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      className="bg-transparent text-white w-full outline-none text-sm truncate"
                    />
                  </div>
                </div>
                <button
                  onClick={copyLink}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                    copied
                      ? 'bg-emerald-500 text-white animate-pulse'
                      : 'bg-[#D4AF37] text-gray-900 hover:bg-[#e8c04e]'
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Share via */}
            <div className="mb-5">
              <h3 className="text-[11px] font-medium text-[#D4AF37]/80 mb-2.5">Share via</h3>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'whatsapp', icon: <Send className="w-5 h-5 text-emerald-400" />, label: 'WhatsApp' },
                  { id: 'telegram', icon: <MessageCircle className="w-5 h-5 text-blue-400" />, label: 'Telegram' },
                  { id: 'twitter', icon: <MessageSquare className="w-5 h-5 text-sky-400" />, label: 'Twitter' },
                  { id: 'facebook', icon: <Share2 className="w-5 h-5 text-blue-500" />, label: 'Facebook' },
                ].map((item) => (
                  <button
                    key={item.id}
                    className="flex flex-col items-center justify-center gap-1 bg-[#1c2a3a] hover:bg-[#26303b] p-2.5 rounded-lg transition-colors"
                    onClick={() => shareOnPlatform(item.id)}
                  >
                    {item.icon}
                    <span className="text-[11px] text-[#D4AF37]/90">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Benefits - Minimal Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { color: 'text-emerald-400', bg: 'bg-emerald-900/20', title: '10% Commission', desc: 'From referrals’ earnings' },
                { color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10', title: 'Unlimited Invites', desc: 'Invite as many as you want' },
                { color: 'text-amber-400', bg: 'bg-amber-900/20', title: 'Instant Rewards', desc: 'Get bonuses immediately' },
                { color: 'text-purple-400', bg: 'bg-purple-900/20', title: 'Tier Benefits', desc: 'Unlock higher rewards' },
              ].map((item, idx) => (
                <div key={idx} className={`rounded-lg p-3 ${item.bg}`}>
                  <p className="text-[11px] font-medium text-white">{item.title}</p>
                  <p className="text-[10px] text-[#D4AF37]/70 mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralProgram;