import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext/UserContext';
import { motion, AnimatePresence } from 'framer-motion';

// ✅ Lucide Icons (clean, modern, consistent stroke)
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

// Toast Component (unchanged — already elegant)
const Toast = ({ message, type = 'success' }) => {
  const bgColor = {
    success: 'bg-emerald-500/20 border-emerald-500/40',
    error: 'bg-rose-500/20 border-rose-500/40',
    info: 'bg-blue-500/20 border-blue-500/40'
  };

  const iconColor = {
    success: 'text-emerald-400',
    error: 'text-rose-400',
    info: 'text-blue-400'
  };

  const icon = { success: '✓', error: '✕', info: 'ℹ' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`fixed top-4 right-4 z-[1000] rounded-xl p-4 backdrop-blur-xl border ${bgColor[type]} shadow-lg`}
    >
      <div className="flex items-center gap-3">
        <span className={`text-lg font-medium ${iconColor[type]}`}>{icon[type]}</span>
        <span className="text-sm text-white/90 font-medium">{message}</span>
      </div>
    </motion.div>
  );
};

const useToast = () => {
  const [toasts, setToasts] = useState([]);
  
  const showToast = (message, type = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };
  
  const ToastContainer = () => (
    <AnimatePresence>
      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast.message} type={toast.type} />
      ))}
    </AnimatePresence>
  );
  
  return { showToast, ToastContainer };
};

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useContext(UserContext);
  const { showToast, ToastContainer } = useToast();
  const navigate = useNavigate();

  const goHome = () => {
    navigate("/wallet-page");
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    showToast('Logged out successfully', 'success');
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  // ✅ Simplified menu with Lucide icons
  const menuItems = [
    { icon: <Briefcase className="w-5 h-5" />, label: 'Work', action: () => navigate("/work") },
    { icon: <Home className="w-5 h-5" />, label: 'Home', action: () => navigate("/wallet-page") },
    { icon: <Users className="w-5 h-5" />, label: 'Team', action: () => navigate("/team") },
    { icon: <Copy className="w-5 h-5" />, label: 'Invite', action: () => navigate('/ReferralProgram') },
    { icon: <Mail className="w-5 h-5" />, label: 'Contact', action: () => navigate("/contact-us") },
    { icon: <Briefcase className="w-5 h-5" />, label: 'M/Salary', action: () => navigate("/salaryofMonth") },
    { icon: <Settings className="w-5 h-5" />, label: 'Settings', action: () => navigate("/setting") },
    { icon: <LogOut className="w-5 h-5" />, label: 'Logout', action: handleLogout, isLogout: true }
  ];

  return (
    <>
      {/* Fixed Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-[#19202a]">
        {/* Hamburger */}
        <button 
          onClick={toggleMenu}
          className="text-[#D4AF37] hover:text-[#e8c04e] transition-colors"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Logo */}
        <div className="flex items-center justify-center">
          <img src="logo.png" className="w-[135px]" alt="Logo" onClick={goHome} />
        </div>

        {/* Spacer */}
        <div className="w-9"></div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-16 mt-3 left-0 right-0 z-50 bg-[#19202a] rounded-2xl shadow-2xl  pb-4 "
            >
              <div className="grid grid-cols-4 gap-3 p-2">
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      item.action();
                      setIsOpen(false);
                    }}
                    className={`flex flex-col items-center p-2 rounded-xl transition-colors group ${
                      item.isLogout ? 'text-[#D4AF37]/80' : 'text-[#D4AF37] hover:text-[#e8c04e]'
                    }`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1c2a3a] group-hover:bg-[#26303b] transition-colors">
                      {item.icon}
                    </div>
                    <span className="text-[11px] mt-2 font-medium">{item.label}</span>
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