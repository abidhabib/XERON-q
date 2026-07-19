import React, { useState, useEffect, useContext } from 'react';
import NavBar from './NavBar';
import { UserContext } from './UserContext/UserContext';
import BalanceCard from './new/BalanceCard';
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
    <div className="flex flex-col min-h-screen bg-[#f5f5f5]">
      <div className="sticky top-0 z-50 bg-[#f5f5f5]">
        <NavBar />
      </div>

      <BalanceCard />

      <div className="px-4 pb-6 pt-3">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-[#f5f5f5]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#1e2329]">Invite Friends & Earn</h2>
                <p className="text-xs text-[#848e9c] mt-0.5">Share your link to unlock rewards</p>
              </div>
              <span className="text-[11px] font-medium text-[#f0b90b] bg-[#f0b90b]/10 px-2.5 py-0.5 rounded-full">
                Active
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="p-4">
            {/* Referral Link */}
            <div className="mb-5">
              <label className="block text-[11px] font-medium text-[#848e9c] uppercase tracking-wider mb-2">
                Your referral link
              </label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 bg-[#fafafa] rounded-lg px-3 h-12">
                  <Link className="w-4 h-4 text-[#848e9c]" />
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="bg-transparent text-[#1e2329] w-full outline-none text-[13px] truncate font-mono"
                  />
                </div>
                <button
                  onClick={copyLink}
                  className={`h-10 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                    copied
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-[#f0b90b] text-[#0b0e11] active:opacity-85'
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Share via */}
            <div className="mb-5">
              <h3 className="text-[11px] font-medium text-[#848e9c] uppercase tracking-wider mb-2.5">Share via</h3>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'whatsapp', icon: <Send className="w-5 h-5 text-emerald-500" />, label: 'WhatsApp' },
                  { id: 'telegram', icon: <MessageCircle className="w-5 h-5 text-blue-500" />, label: 'Telegram' },
                  { id: 'twitter', icon: <MessageSquare className="w-5 h-5 text-sky-500" />, label: 'Twitter' },
                  { id: 'facebook', icon: <Share2 className="w-5 h-5 text-blue-600" />, label: 'Facebook' },
                ].map((item) => (
                  <button
                    key={item.id}
                    className="flex flex-col items-center gap-1.5 bg-[#fafafa] hover:bg-[#f0f0f0] active:bg-[#e8e8e8] p-3 rounded-lg transition-colors"
                    onClick={() => shareOnPlatform(item.id)}
                  >
                    {item.icon}
                    <span className="text-[11px] font-medium text-[#848e9c]">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { title: '10% Commission', desc: 'From referrals earnings' },
                { title: 'Unlimited Invites', desc: 'Invite as many as you want' },
                { title: 'Instant Rewards', desc: 'Get bonuses immediately' },
                { title: 'Tier Benefits', desc: 'Unlock higher rewards' },
              ].map((item, idx) => (
                <div key={idx} className="bg-[#fafafa] rounded-lg p-3">
                  <p className="text-xs font-semibold text-[#1e2329]">{item.title}</p>
                  <p className="text-[11px] text-[#848e9c] mt-1">{item.desc}</p>
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