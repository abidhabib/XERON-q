import { useContext, useEffect, useState } from 'react';
import './nav.css';
import { BiHomeSmile } from "react-icons/bi";
import { AiOutlineSetting, AiOutlineUsergroupAdd } from "react-icons/ai";
import { BiExit } from "react-icons/bi";
import { RiFileCopyLine } from "react-icons/ri";
import { useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext/UserContext';
import { SiRobotframework } from "react-icons/si";
import { FiBriefcase } from "react-icons/fi";
import { motion, AnimatePresence } from 'framer-motion';

// Custom Liquid Glass Toast Component
const LiquidGlassToast = ({ message, type = 'success' }) => {
  const iconMap = {
    success: '✓',
    error: '✕',
    loading: '⥁'
  };
  
  const colorMap = {
    success: 'bg-emerald-400/20 border-emerald-400/40',
    error: 'bg-rose-400/20 border-rose-400/40',
    loading: 'bg-blue-400/20 border-blue-400/40'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative rounded-xl p-4 backdrop-blur-xl border ${colorMap[type]} shadow-lg overflow-hidden`}
    >
      {/* Liquid glass effect layers */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-white/5 to-transparent" />
      
      {/* Content */}
      <div className="relative z-10 flex items-center gap-3">
        <div className={`text-lg font-medium ${type === 'success' ? 'text-emerald-300' : type === 'error' ? 'text-rose-300' : 'text-blue-300'}`}>
          {iconMap[type]}
        </div>
        <span className="text-sm text-white/90 font-medium">{message}</span>
      </div>
      
      {/* Animated progress bar */}
      {type !== 'loading' && (
        <motion.div 
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/60 to-transparent"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 3, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
};

// Toast manager hook
const useLiquidToast = () => {
  const [toasts, setToasts] = useState([]);
  
  const showToast = (message, type = 'success', duration = 3000) => {
    const id = Date.now().toString();
    setToasts(toasts => [...toasts, { id, message, type }]);
    
    if (type !== 'loading') {
      setTimeout(() => {
        setToasts(toasts => toasts.filter(toast => toast.id !== id));
      }, duration);
    }
  };
  
  const removeToast = (id) => {
    setToasts(toasts => toasts.filter(toast => toast.id !== id));
  };
  
  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-[1000] space-y-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <LiquidGlassToast message={toast.message} type={toast.type} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
  
  return { showToast, removeToast, ToastContainer };
};

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { userData, logout } = useContext(UserContext);
  const [inviteLink, setInviteLink] = useState('');
  const { showToast, ToastContainer } = useLiquidToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (userData && userData.id) {
      const link = `https://CHECKING.RUN.PLACE/signup?ref=${userData.id}`;
      setInviteLink(link);
    }
  }, [userData]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    showToast('Logged out successfully', 'success');
  };

  const copyLink = () => {
   navigate('/ReferralProgram')
  };

  return (
    <>
      <nav className="navbar p-3">
        <div className={`hamburger ${isOpen ? 'open' : ''}`} onClick={toggleMenu}>
          <span className="bar top-bar"></span>
          <span className="bar middle-bar"></span>
          <span className="bar bottom-bar"></span>
        </div>

        <div className="logo flex items-center justify-center ">
          <img src='logo.svg' className="logo w-20"  alt="Logo" />
        </div>

        <ul className={`nav-menu shadow p-4 ${isOpen ? 'open' : ''}`}>
          <li className="nav-item" onClick={() => navigate("/wallet-page")}>
            <div className="icon">
              <BiHomeSmile />
            </div>
            <span>Home</span>
          </li>

          <li className="nav-item" onClick={() => navigate("/team")}>
            <div className="icon">
              <AiOutlineUsergroupAdd />
            </div>
            <span>Team</span>
          </li>

          <li className="nav-item" onClick={copyLink}>
            <div className="icon">
              <RiFileCopyLine />
            </div>
            <span>Invite</span>
          </li>

          <li className="nav-item" onClick={() => navigate("/tasks")}>
            <div className="icon"><SiRobotframework /></div>
            <span>Work</span>
          </li>
          
          <li className="nav-item" onClick={() => navigate("/week-salary")}>
            <div className="icon"><FiBriefcase /></div>
            <span>W<span className='text-green-300'>/</span>Salary</span>
          </li>
          
          <li className="nav-item" onClick={() => navigate("/salaryofMonth")}>
            <div className="icon"><FiBriefcase /></div>
            <span>M<span className='text-green-300'>/</span>Salary</span>
          </li>
          
          <li className="nav-item" onClick={() => navigate("/setting")}>
            <div className="icon"><AiOutlineSetting /></div>
            <span>Settings</span>
          </li>
          
          <li className="nav-item" onClick={handleLogout}>
            <div className="icon">
              <BiExit />
            </div>
            <span className='text-danger'>Logout</span>
          </li>
        </ul>
      </nav>

      <ToastContainer />
    </>
  );
};

export default NavBar;