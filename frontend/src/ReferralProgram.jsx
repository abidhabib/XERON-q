/* eslint-disable react/prop-types */
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import { UserContext } from './UserContext/UserContext';
import { Copy, CheckCircle, Link2, Check, Bell, BriefcaseBusiness, CalendarDays, ShieldCheck, Users } from 'lucide-react';

/* Real brand marks (currentColor) */
const platforms = [
  { id: 'whatsapp', label: 'WhatsApp', path: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z' },
  { id: 'telegram', label: 'Telegram', path: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z' },
  { id: 'twitter', label: 'X', path: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z' },
  { id: 'facebook', label: 'Facebook', path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
];

const perks = [
  { title: 'Unlimited invites', desc: 'Bring as many friends as you like.' },
  { title: 'Instant rewards', desc: 'Bonuses land the moment they earn.' },
  { title: 'Tier benefits', desc: 'Climb tiers to unlock higher rates.' },
];

const SectionLabel = ({ children }) => (
  <p className="fi text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7f91a7]">{children}</p>
);

const ReferralProgram = () => {
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const { Userid, NewName, currBalance, total_withdrawal, backend_wallet } = useContext(UserContext);
  const navigate = useNavigate();
  const progress = backend_wallet ? Math.min(Math.round((Number(backend_wallet) / 3) * 100), 100) : 0;
  const available = Number(currBalance || 0).toFixed(1).replace(/\.0$/, '');
  const cashout = Number(total_withdrawal || 0).toFixed(1).replace(/\.0$/, '');

  useEffect(() => {
    if (Userid) setInviteLink(`https://rovexking.com/signup?ref=${Userid}`);
  }, [Userid]);

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnPlatform = (platform) => {
    const shareText = 'Join this platform using my referral link:';
    let shareUrl = '';
    switch (platform) {
      case 'whatsapp': shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + inviteLink)}`; break;
      case 'telegram': shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`; break;
      case 'twitter': shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText + ' ' + inviteLink)}`; break;
      case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}`; break;
      default: return;
    }
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="min-h-dvh bg-[#f5f5f4]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@500;600&family=Inter:wght@400;500;600;700&display=swap');
        .fd { font-family: 'Cormorant', serif; }
        .fi { font-family: 'Inter', sans-serif; }
        .tnum { font-variant-numeric: tabular-nums; }
        @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .rise { animation: rise 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes copiedPop { 0% { transform: scale(1); } 40% { transform: scale(1.02); } 100% { transform: scale(1); } }
        .copied-pop { animation: copiedPop 0.35s ease-out; }
      `}</style>

      <div className="mx-auto min-h-dvh max-w-md overflow-hidden bg-[#f5f5f4]">
        <header className="min-h-[300px] rounded-b-[14px] bg-[#20262d] px-[25px] pt-[14px] shadow-[0_8px_20px_rgba(22,28,35,0.16)]"><NavBar />
          <div className="mt-[25px] flex items-center justify-between gap-3"><p className="flex min-w-0 items-center gap-1.5 truncate text-[15px] font-semibold text-white"><span className="truncate">{NewName || 'Member'}</span><ShieldCheck size={17} className="shrink-0 text-[#e3b900]" /></p><span className="shrink-0 rounded-full bg-[#4c4330] px-2.5 py-1 text-[10px] font-semibold text-[#f5c927]">{progress}% Progress</span></div>
          <div className="mt-[18px] grid grid-cols-2"><div><p className="text-[27px] font-semibold leading-none tracking-[-0.04em] text-white"><span className="mr-0.5 text-[20px] text-[#dce4ee]">$</span>{available}</p><p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-[#8191a5]">Available balance</p></div><div className="pt-[8px] text-right"><p className="text-[19px] font-semibold leading-none tracking-[-0.03em] text-[#c7d1dc]"><span className="mr-0.5 text-[14px]">$</span>{cashout}</p><p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-[#8191a5]">Total cashout</p></div></div>
          <div className="mt-[31px] grid grid-cols-4 gap-5">{[["Wallet", BriefcaseBusiness, "/wallet"], ["Salary", CalendarDays, "/SalaryofMonth"], ["Team", Users, "/team"], ["Alert", Bell, "/alerts"]].map(([label, Icon, path]) => <button key={label} type="button" onClick={() => navigate(path)} className="flex min-w-0 flex-col items-center gap-1.5 text-[#93a1b3]"><span className="grid h-[42px] w-[42px] place-items-center rounded-xl bg-[#303943]"><Icon size={19} strokeWidth={2} /></span><span className="text-[10px] font-medium">{label}</span></button>)}</div>
        </header>
      <main className="pb-8"><div className="relative mx-auto max-w-md px-4 pt-3">

          {/* Header */}
          <div className="rise relative flex items-start justify-between gap-4">
            <div>
              <h1 className="fi text-[21px] font-semibold text-[#17212b] leading-tight">Invite &amp; earn</h1>
              <p className="fi text-[13px] text-[#7f91a7] mt-1">Share your link, earn from every friend who joins.</p>
            </div>
           
          </div>

          {/* The link — hero object */}
          <div className="rise relative mt-4 rounded-xl bg-white shadow-[0_2px_5px_rgba(27,38,49,0.08)] p-4" style={{ animationDelay: '0.06s' }}>
            <SectionLabel>Your referral link</SectionLabel>
            <div className="flex items-center gap-2.5 mt-2.5 rounded-lg bg-[#f5f7f9] ring-1 ring-[#dce4ec] px-3.5 h-12 overflow-hidden">
              <Link2 size={15} className="text-[#718195] flex-shrink-0" />
              {inviteLink ? (
                <p className="fi text-[12.5px] font-mono truncate">
                  <span className="text-[#52657b]">https://rovexking.com/signup</span>
                  <span className="text-[#b58e00]">?ref={Userid}</span>
                </p>
              ) : (
                <p className="fi text-[12.5px] text-[#7f91a7]">Preparing your link…</p>
              )}
            </div>
            <button
              onClick={copyLink}
              disabled={!inviteLink}
              className={`fi w-full h-11 rounded-lg mt-3 flex items-center justify-center gap-2 text-[13.5px] font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                copied
                  ? 'copied-pop bg-[#1E2A22] text-[#8FC7A0]'
                  : 'bg-[#C6A15B] text-[#161618] hover:bg-[#D8BA7C] shadow-[0_10px_28px_rgba(198,161,91,0.14)] active:scale-[0.99]'
              }`}
            >
              {copied ? <><CheckCircle size={16} /> Copied</> : <><Copy size={15} /> Copy link</>}
            </button>
          </div>

          {/* Share */}
          <div className="relative mt-7">
            <SectionLabel>Share via</SectionLabel>
            <div className="flex items-start gap-3 sm:gap-4 mt-3.5">
              {platforms.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => shareOnPlatform(p.id)}
                  className="rise group flex flex-col items-center gap-1.5 w-16"
                  style={{ animationDelay: `${0.1 + i * 0.05}s` }}
                  aria-label={`Share on ${p.label}`}
                >
                  <span className="w-12 h-12 rounded-full bg-white shadow-[0_2px_5px_rgba(27,38,49,0.08)] flex items-center justify-center text-[#718195] group-hover:text-[#b58e00] transition-all duration-200">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d={p.path} /></svg>
                  </span>
                  <span className="fi text-[10px] font-medium text-[#718195] transition-colors">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

   
        </div>
      </main></div>
    </div>
  );
};

export default ReferralProgram;
