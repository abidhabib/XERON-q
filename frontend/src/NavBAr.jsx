import { useContext, useState } from 'react';
import { BiHomeSmile, BiExit } from "react-icons/bi";
import { AiOutlineSetting, AiOutlineUsergroupAdd } from "react-icons/ai";
import { RiFileCopyLine } from "react-icons/ri";
import { SiRobotframework } from "react-icons/si";
import { FiBriefcase } from "react-icons/fi";
import { useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext/UserContext';
import { motion, AnimatePresence } from 'framer-motion';

// Toast Component
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

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`fixed top-4 right-4 z-[1000] rounded-xl p-4 backdrop-blur-xl border ${bgColor[type]} shadow-lg`}
    >
      <div className="flex items-center gap-3">
        <span className={`text-lg font-medium ${iconColor[type]}`}>
          {icon[type]}
        </span>
        <span className="text-sm text-white/90 font-medium">{message}</span>
      </div>
    </motion.div>
  );
};

// Toast manager hook
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
        <Toast 
          key={toast.id} 
          message={toast.message} 
          type={toast.type} 
        />
      ))}
    </AnimatePresence>
  );
  
  return { showToast, ToastContainer };
};

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { userData, logout } = useContext(UserContext);
  const { showToast, ToastContainer } = useToast();
const goHome = () => {
    navigate("/wallet-page");
  }
  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    logout();
    navigate('/');
    showToast('Logged out successfully', 'success');
  };
const navigate = useNavigate();
  const menuItems = [
        { icon: <SiRobotframework />, label: 'Work', action: () => navigate("/work") },
    { icon: <BiHomeSmile />, label: 'Home', action: () => navigate("/wallet-page") },
    { icon: <AiOutlineUsergroupAdd />, label: 'Team', action: () => navigate("/team") },
    { icon: <RiFileCopyLine />, label: 'Invite', action: () => navigate('/ReferralProgram') },
    { icon: <FiBriefcase />, label: 'W/Salary', action: () => navigate("/week-salary") },
    { icon: <FiBriefcase />, label: 'M/Salary', action: () => navigate("/salaryofMonth") },
    { icon: <AiOutlineSetting />, label: 'Settings', action: () => navigate("/setting") },
    { icon: <BiExit />, label: 'Logout', action: handleLogout, isLogout: true }
  ];

  return (
    <>
      {/* Fixed Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-2 py-3 bg-[#19202a] ">
        {/* Hamburger Menu */}
        <button 
          onClick={toggleMenu}
          className="flex flex-col justify-center items-center w-7 h-7 focus:outline-none"
          aria-label="Toggle menu"
        >
          <span className={`block w-3 h-0.5 bg-white rounded transition-all duration-300 ease-in-out ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
          <span className={`block w-3 h-0.5 bg-white rounded my-1 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-0' : 'opacity-100'}`}></span>
          <span className={`block w-3 h-0.5 bg-white rounded transition-all duration-300 ease-in-out ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
        </button>

        {/* Logo */}
        <div className="flex items-center justify-center">
          <img  src='logo.png' className="w-[135px]" alt="Logo" onClick={goHome} />
        </div>

        {/* Spacer for flex alignment */}
        <div className="w-9"></div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-16 mt-3 left-0 right-0 z-50 bg-[#19202a] shadow-xl rounded-b-2xl"
            >
              <div className="grid grid-cols-4 gap-4 py-8 px-6">
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      item.action();
                      setIsOpen(false);
                    }}
                    className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                      item.isLogout ? 'text-red-400' : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <div className={`bg-white/8 bg-gradient-to-b from-white/8 to-white/5 border border-white/10 rounded-xl p-2 flex items-center justify-center w-10 h-10 ${
                      item.isLogout ? 'border-red-500/20' : 'border-white/20'
                    }`}>
                      {item.icon}
                    </div>
                    <span className="text-sm mt-2">{item.label}</span>
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