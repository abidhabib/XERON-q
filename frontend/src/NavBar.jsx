import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Users,
  Copy,
  Settings,
  Briefcase,
  LogOut,
  Menu,
  X,
  Mail
} from 'lucide-react';

// Toast (Binance dark)
const Toast = ({ message, type = 'success' }) => {
  const styles = {
    success: { bg: 'bg-[#0E2E1F]', border: 'border-[#0ECB81]/20', icon: 'bg-[#0ECB81]/15 text-[#0ECB81]', symbol: '✓' },
    error: { bg: 'bg-[#3A1A1A]', border: 'border-[#F6465D]/20', icon: 'bg-[#F6465D]/15 text-[#F6465D]', symbol: '✕' },
    info: { bg: 'bg-[#1A2332]', border: 'border-[#2B3139]', icon: 'bg-[#F0B90B]/15 text-[#F0B90B]', symbol: 'ℹ' }
  };
  const s = styles[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`fixed top-4 right-4 z-[1000] rounded-xl p-3.5 ${s.bg} border ${s.border} shadow-lg`}
    >
      <div className="flex items-center gap-3">
        <span className={`w-5 h-5 flex items-center justify-center rounded-md text-xs font-bold ${s.icon}`}>{s.symbol}</span>
        <span className="text-sm text-[#EAECEF] font-medium">{message}</span>
      </div>
    </motion.div>
  );
};

const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };
  const ToastContainer = () => (
    <AnimatePresence>
      {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} />)}
    </AnimatePresence>
  );
  return { showToast, ToastContainer };
};

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useContext(UserContext);
  const { showToast, ToastContainer } = useToast();
  const navigate = useNavigate();

  const goHome = () => navigate("/wallet-page");

  const handleLogout = () => {
    logout();
    navigate('/');
    showToast('Logged out successfully', 'success');
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  const menuItems = [
    { icon: <Briefcase size={20} className="text-[#848e9c]" />, label: 'Work', action: () => navigate("/work") },
    { icon: <Home size={20} className="text-[#848e9c]" />, label: 'Home', action: () => navigate("/wallet-page") },
    { icon: <Users size={20} className="text-[#848e9c]" />, label: 'Team', action: () => navigate("/team") },
    { icon: <Copy size={20} className="text-[#848e9c]" />, label: 'Invite', action: () => navigate('/ReferralProgram') },
    { icon: <Mail size={20} className="text-[#848e9c]" />, label: 'Contact', action: () => navigate("/contact-us") },
    { icon: <Briefcase size={20} className="text-[#848e9c]" />, label: 'M/Salary', action: () => navigate("/salaryofMonth") },
    { icon: <Settings size={20} className="text-[#848e9c]" />, label: 'Settings', action: () => navigate("/setting") },
    { icon: <LogOut size={20} className="text-[#F6465D]" />, label: 'Logout', action: handleLogout, isLogout: true }
  ];

  return (
    <>
      {/* Top Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-[#1E2329]">
        <button
          onClick={toggleMenu}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#2B3139] hover:bg-[#2B3139]/80 transition-colors text-[#EAECEF]"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="flex items-center justify-center">
          <img src="logo.png" className="w-[120px]" alt="Logo" onClick={goHome} />
        </div>

        <div className="w-10" />
      </nav>

      {/* Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="fixed top-16 rounded-b-2xl w-full z-50 bg-[#1E2329] shadow-xl pb-3"
            >
              <div className="min-h-[54px]"></div>

              <div className="grid grid-cols-4 gap-2 px-2">
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => { item.action(); setIsOpen(false); }}
                    className={`flex flex-col items-center p-2.5 rounded-xl transition-colors ${
                      item.isLogout ? 'text-[#F6465D] hover:bg-[#3A1A1A]' : 'text-[#EAECEF] hover:bg-[#2B3139]'
                    }`}
                  >
                    <div className={`w-11 h-11 flex items-center justify-center rounded-xl ${item.isLogout ? 'bg-[#3A1A1A]' : 'bg-[#2B3139]'}`}>
                      {item.icon}
                    </div>
                    <span className={`text-[11px] mt-1.5 font-medium ${item.isLogout ? 'text-[#F6465D]' : 'text-[#848e9c]'}`}>
                      {item.label}
                    </span>
                  </button>
                ))}
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