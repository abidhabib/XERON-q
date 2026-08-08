import { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from './UserContext/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Users, UserPlus, Settings, Briefcase, LogOut, Menu,
  Mail, CalendarDays, ShieldCheck, Bell, ChevronRight,
} from 'lucide-react';

const spring = { type: 'spring', stiffness: 380, damping: 34 };

/* ── Toast ── */
const Toast = ({ message, type = 'success' }) => {
  const styles = {
    success: { bg: 'bg-[#1E2A22]', ring: 'ring-[#8FC7A0]/20', icon: 'bg-[#8FC7A0]/15 text-[#8FC7A0]', symbol: '✓' },
    error:   { bg: 'bg-[#241619]', ring: 'ring-[#E2A896]/20', icon: 'bg-[#E2A896]/15 text-[#E2A896]', symbol: '✕' },
    info:    { bg: 'bg-[#212125]', ring: 'ring-[#C6A15B]/20', icon: 'bg-[#C6A15B]/15 text-[#C6A15B]', symbol: 'ℹ' },
  };
  const s = styles[type];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`fi fixed top-4 right-4 z-[1000] rounded-xl px-4 py-3 ${s.bg} ring-1 ${s.ring} shadow-[0_12px_32px_rgba(0,0,0,0.4)]`}
    >
      <div className="flex items-center gap-3">
        <span className={`w-5 h-5 flex items-center justify-center rounded-md text-[11px] font-bold ${s.icon}`}>{s.symbol}</span>
        <span className="text-[13.5px] text-[#EDEDEE] font-medium">{message}</span>
      </div>
    </motion.div>
  );
};

const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'success') => {
    const id = Date.now().toString() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };
  const ToastContainer = () => (
    <AnimatePresence>{toasts.map((t) => <Toast key={t.id} message={t.message} type={t.type} />)}</AnimatePresence>
  );
  return { showToast, ToastContainer };
};

/* ── Nav data ── */
const primaryNav = [
  { icon: Home, label: 'Home', path: '/wallet-page' },
  { icon: Briefcase, label: 'Work', path: '/work' },
  { icon: Users, label: 'Team', path: '/team' },
  { icon: CalendarDays, label: 'Monthly', path: '/salaryofMonth' },
];
const accountNav = [
  { icon: UserPlus, label: 'Invite', path: '/ReferralProgram' },
  { icon: Mail, label: 'Contact', path: '/contact-us' },
  { icon: Settings, label: 'Settings', path: '/setting' },
];

/* ── Desktop dock item (icon + tooltip + gliding halo) ── */
const DockItem = ({ icon: Icon, label, path }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const active = location.pathname === path;
  return (
    <button
      onClick={() => navigate(path)}
      className="group relative w-11 h-11 flex items-center justify-center rounded-xl hover:scale-110 transition-transform duration-200"
      aria-label={label}
    >
      {active && (
        <motion.span layoutId="dock-active" className="absolute inset-0 rounded-xl bg-[#C6A15B]/12 ring-1 ring-[#C6A15B]/30" transition={spring} />
      )}
      <Icon size={20} strokeWidth={2} className={`relative z-10 transition-colors ${active ? 'text-[#C6A15B]' : 'text-[#6F6F76] group-hover:text-[#A0A0A6]'}`} />
      <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-[#212125] ring-1 ring-white/[0.08] text-[11.5px] font-medium text-[#EDEDEE] whitespace-nowrap opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none transition-all duration-150 z-50 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
        {label}
      </span>
    </button>
  );
};

/* ── Mobile tab ── */
const MobileTab = ({
  icon: Icon,
  label,
  path,
  badge = 0,
  onClick
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const active = location.pathname === path;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(path);
    }
  };
  return (
    <button onClick={handleClick} className="relative flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl" aria-label={label}>
      {active && <motion.span layoutId="mtab-active" className="absolute inset-0 rounded-xl bg-[#C6A15B]/10" transition={spring} />}
      <span className="relative z-10">
        <Icon size={20} strokeWidth={2} className={`transition-colors ${active ? 'text-[#C6A15B]' : 'text-[#6F6F76]'}`} />
        {badge > 0 && (
          <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-0.5 rounded-full bg-[#B4553F] text-white text-[8.5px] font-bold flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      <span className={`relative z-10 text-[9.5px] font-medium transition-colors ${active ? 'text-[#C6A15B]' : 'text-[#6F6F76]'}`}>{label}</span>
    </button>
  );
};

/* ── NavBar ── */
const NavBar = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { logout, NewName, level, unreadCount,markAllNotificationsAsRead,Userid } = useContext(UserContext);
  const { showToast, ToastContainer } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const goHome = () => navigate('/wallet-page');
  const handleLogout = () => { logout(); navigate('/'); showToast('Logged out successfully', 'success'); };
  const sheetGo = (path) => { navigate(path); setSheetOpen(false); };

  const initial = (NewName || 'U').charAt(0).toUpperCase();
  const homeActive = location.pathname === '/wallet-page';
const handleAlertClick = async () => {
  if (unreadCount > 0 && Userid) {
    await markAllNotificationsAsRead(Userid);
  }

  navigate('/alerts');
};
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .fi { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* ══ Desktop — floating icon dock ══ */}
      <aside className="fi hidden lg:flex flex-col fixed inset-y-4 left-4 w-[76px] items-center bg-[#1B1B1E]/85 backdrop-blur-xl rounded-2xl ring-1 ring-white/[0.06] shadow-[0_20px_50px_rgba(0,0,0,0.4)] z-40 py-4">
        {/* brand */}
        <button onClick={goHome} className="w-11 h-11 rounded-xl bg-[#212125] ring-1 ring-[#C6A15B]/15 flex items-center justify-center p-2 hover:ring-[#C6A15B]/40 hover:scale-105 transition-all" aria-label="Home">
          <img src="logo.png" alt="Logo" className="w-full h-full object-contain" />
        </button>

        {/* nav icons */}
        <div className="mt-5 flex flex-col items-center gap-1.5 flex-1 w-full">
          {primaryNav.map((item) => <DockItem key={item.path} {...item} />)}
          <div className="w-6 h-px bg-white/[0.08] my-2" />
          {accountNav.map((item) => <DockItem key={item.path} {...item} />)}
        </div>

        {/* profile popover */}
        <div className="relative mt-2">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-10 h-10 rounded-full bg-[#C6A15B]/15 ring-1 ring-[#C6A15B]/25 flex items-center justify-center text-[#C6A15B] text-[14px] font-semibold hover:scale-105 transition-transform"
            aria-label="Profile"
          >
            {initial}
          </button>
          <AnimatePresence>
            {profileOpen && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                  className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-52 bg-[#212125] rounded-xl ring-1 ring-white/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.5)] p-3 z-50"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-full bg-[#C6A15B]/15 flex items-center justify-center text-[#C6A15B] text-[13px] font-semibold flex-shrink-0">{initial}</span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#EDEDEE] truncate">{NewName || 'User'}</p>
                      <p className="flex items-center gap-1 text-[10px] text-[#6F6F76] mt-0.5">
                        <ShieldCheck size={10} strokeWidth={2.5} className="text-[#C6A15B]" /> Level {level || 1}
                      </p>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="mt-3 w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-[#241619]/60 text-[#E2A896] text-[12.5px] font-medium hover:bg-[#241619] transition-colors">
                    <LogOut size={15} /> Log out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* ══ Mobile — floating tab bar with raised home orb ══ */}
      <div className="fi lg:hidden fixed bottom-4 inset-x-4 z-40 pointer-events-none">
        <div className="pointer-events-auto mx-auto max-w-md relative">
          {/* raised center home button */}
          <button
            onClick={goHome}
            aria-label="Home"
            className={`absolute left-1/2 -translate-x-1/2 -top-6 w-14 h-14 rounded-full flex items-center justify-center z-10 transition-all active:scale-95 ${
              homeActive ? 'bg-[#C6A15B] shadow-[0_10px_30px_rgba(198,161,91,0.55)]' : 'bg-[#C6A15B] shadow-[0_8px_22px_rgba(198,161,91,0.35)]'
            }`}
          >
            <Home size={22} strokeWidth={2.2} className="text-[#161618]" />
          </button>

          <div className="flex items-center bg-[#1B1B1E]/95 backdrop-blur-md rounded-2xl ring-1 ring-white/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.45)] px-2 py-1.5">
            <MobileTab icon={Briefcase} label="Work" path="/work" />
            <MobileTab icon={Users} label="Team" path="/team" />
            <div className="w-16 flex-shrink-0" />
            <MobileTab icon={Bell} label="Alerts" path="/alerts" badge={unreadCount} 
            onClick={handleAlertClick}
            />
            <button onClick={() => setSheetOpen(true)} className="relative flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl" aria-label="Menu">
              <Menu size={20} strokeWidth={2} className="relative z-10 text-[#6F6F76]" />
              <span className="relative z-10 text-[9.5px] font-medium text-[#6F6F76]">Menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══ Mobile — bottom sheet menu ══ */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheetOpen(false)} className="fi lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="fi lg:hidden fixed bottom-0 inset-x-0 z-[70] bg-[#1B1B1E] rounded-t-[24px] ring-1 ring-white/[0.06] shadow-[0_-16px_48px_rgba(0,0,0,0.5)] pb-6"
            >
              <div className="pt-3 flex justify-center"><div className="w-10 h-1 bg-[#2A2A30] rounded-full" /></div>
              <div className="px-4 mt-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#212125]">
                  <span className="w-10 h-10 rounded-full bg-[#C6A15B]/15 flex items-center justify-center text-[#C6A15B] text-[14px] font-semibold flex-shrink-0">{initial}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold text-[#EDEDEE] truncate">{NewName || 'User'}</p>
                    <p className="flex items-center gap-1 text-[10.5px] text-[#6F6F76] mt-0.5">
                      <ShieldCheck size={11} strokeWidth={2.5} className="text-[#C6A15B]" /> Level {level || 1}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-1">
                  {accountNav.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button key={item.path} onClick={() => sheetGo(item.path)} className="flex items-center gap-3 px-3 h-12 rounded-xl text-[#A0A0A6] hover:bg-[#212125] hover:text-[#EDEDEE] transition-colors">
                        <Icon size={19} strokeWidth={2} className="text-[#6F6F76]" />
                        <span className="flex-1 text-left text-[13.5px] font-medium">{item.label}</span>
                        <ChevronRight size={16} className="text-[#6F6F76]" />
                      </button>
                    );
                  })}
                </div>

                <button onClick={handleLogout} className="mt-3 w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-[#241619]/60 text-[#E2A896] text-[13.5px] font-medium hover:bg-[#241619] transition-colors">
                  <LogOut size={18} /> Log out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ToastContainer />
    </>
  );
};

export default NavBar;