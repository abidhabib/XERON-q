import { useContext, useState, useEffect } from 'react';
import { UserContext } from '../UserContext/UserContext';
import { ArrowUpRight, Banknote, ShieldCheck, Send, Headphones } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { RemoveTrailingZeros } from '../../utils/utils';

const ProgressRing = ({ progress }) => {
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c - (progress / 100) * c;
  return <div className="relative w-[68px] h-[68px] flex-shrink-0"><svg className="w-full h-full -rotate-90" viewBox="0 0 64 64"><circle cx="32" cy="32" r={r} fill="none" stroke="#212125" strokeWidth="5" /><circle cx="32" cy="32" r={r} fill="none" stroke="#C6A15B" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s ease-out' }} /></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="tnum text-[11px] text-[#EDEDEE] leading-none">{progress}%</span><span className="text-[6.5px] font-medium text-[#6F6F76] uppercase tracking-wide mt-0.5">Progress</span></div></div>;
};
ProgressRing.propTypes = { progress: () => null };

function BalanceCard() {
  const { NewName, currBalance, backend_wallet, total_withdrawal, level } = useContext(UserContext);
  const navigate = useNavigate();
  const progress = backend_wallet ? Math.min(Math.round((backend_wallet / 3) * 100), 100) : 0;
  const [displayBalance, setDisplayBalance] = useState(0);
  useEffect(() => {
    const target = parseFloat(currBalance) || 0;
    const duration = 900;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setDisplayBalance(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [currBalance]);
  const menuItems = [
    { name: 'Cashout', icon: <ArrowUpRight size={19} strokeWidth={2.4} />, onClick: () => navigate('/cashout'), primary: true },
    { name: 'Salary', icon: <Banknote size={18} strokeWidth={2} />, link: '/salaryofMonth' },
    { name: 'Transactions', icon: <Send size={18} strokeWidth={2} />, link: '/wallet' },
    { name: 'Need Help', icon: <Headphones size={18} strokeWidth={2} />, link: '/contact-us' },
  ];
  return <div><style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); .fi { font-family: 'Inter', sans-serif; } .tnum { font-variant-numeric: tabular-nums; } @keyframes cardRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .card-rise { animation: cardRise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }`}</style><div className="fi card-rise relative overflow-hidden bg-[#1E1E22] rounded-xl p-4 ring-1 ring-white/[0.04] shadow-[0_16px_40px_rgba(0,0,0,0.28)]"><div className="absolute -top-16 -right-16 w-56 h-56 pointer-events-none" style={{ background: 'repeating-radial-gradient(circle at center, transparent 0, transparent 12px, rgba(198,161,91,0.05) 12px, rgba(198,161,91,0.05) 13px)' }} /><div className="relative flex items-start justify-between"><div><p className="text-[11px] font-medium text-[#6F6F76] mb-2">Available balance</p><div className="flex items-end gap-2"><p className="tnum text-[36px] font-medium text-[#EDEDEE] leading-none tracking-tight"><span className="text-[#A0A0A6] text-[22px] mr-0.5">$</span>{RemoveTrailingZeros(displayBalance.toFixed(2))}</p><span className="text-[9.5px] font-semibold text-[#6F6F76] bg-[#212125] rounded px-1.5 py-[3px] mb-[3px] tracking-wide">USD</span></div><div className="flex items-center gap-2 mt-4"><span className="text-[13px] font-semibold text-[#A0A0A6]">{NewName || 'User'}</span><span className="flex items-center gap-1 h-5 px-1.5 rounded-full bg-[#212125] text-[9.5px] font-medium text-[#6F6F76]"><ShieldCheck size={10} strokeWidth={2.5} className="text-[#C6A15B]" />Lv {level || 1}</span></div></div><ProgressRing progress={progress} /></div><div className="relative flex items-center justify-between mt-3 pt-4 border-t border-white/[0.05]"><span className="text-[11px] font-medium text-[#6F6F76]">Total cashout</span><span className="tnum text-[14px] font-semibold text-[#A0A0A6]"><span className="text-[#6F6F76] text-[11px] mr-0.5">$</span>{RemoveTrailingZeros(total_withdrawal)}</span></div><div className="relative grid grid-cols-4 gap-4 mt-4">{menuItems.map((item, i) => { const inner = <><div className={`relative w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200 group-active:scale-90 ${item.primary ? 'bg-gradient-to-br from-[#20b889] to-[#07836a] text-white ring-1 ring-[#78e5c7]/60 shadow-[0_8px_20px_rgba(16,163,127,0.38)] group-hover:brightness-110' : 'bg-[#212125] text-[#A0A0A6] group-hover:bg-[#27272C]'}`}>{item.icon}</div><span className={`text-[10.5px] font-semibold mt-1.5 ${item.primary ? 'text-[#79e4c6]' : 'text-[#6F6F76]'}`}>{item.name}</span></>; return item.link ? <Link key={i} to={item.link} className="group flex flex-col items-center" aria-label={item.name}>{inner}</Link> : <button key={i} onClick={item.onClick} className="group flex flex-col items-center" aria-label={item.name}>{inner}</button>; })}</div></div></div>;
}

export default BalanceCard;
