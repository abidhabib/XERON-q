import React from 'react';
import { useContext } from 'react';
import { UserContext } from '../UserContext/UserContext';
import {
  Wallet,
  Send,
  Users,
  Bell,
  Mail,
  CheckCheck,
  Crown,
  Shield,
  Receipt
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { RemoveTrailingZeros } from '../../utils/utils';

function BalanceCard() {
  const { 
    NewName, 
    currBalance, 
    backend_wallet, 
    total_withdrawal,
    unreadCount,
    markAllNotificationsAsRead,
    Userid,
    level
  } = useContext(UserContext);
  
  const navigate = useNavigate();
  const location = useLocation();
  const isOnWalletPage = location.pathname === '/wallet';
  const isOnAlertsPage = location.pathname === '/alerts';

  const toWithdraw = () => {
    navigate('/cashout');
  };

  const handleAlertClick = async (e) => {
    e.preventDefault();
    if (!isOnAlertsPage && unreadCount > 0 && Userid && markAllNotificationsAsRead) {
      try {
        await markAllNotificationsAsRead(Userid);
      } catch (error) {
        console.error('Error marking all as read:', error);
      }
    }
    navigate('/alerts');
  };

  const menuItems = [
    {
      name: 'Wallet',
      link: isOnWalletPage ? '#' : '/wallet',
      icon: <Wallet size={20} className="text-[#D4AF37]" />,
      label: 'Dashboard Home',
      onClick: isOnWalletPage ? toWithdraw : null,
      isAction: isOnWalletPage,
      actionIcon: <Send size={20} className="text-[#D4AF37]" />
    },
    { name: 'Salary', link: '/week-salary', icon: <Receipt size={20} className="text-[#D4AF37]" />, label: 'Contact Support' },
    { name: 'Team', link: '/team', icon: <Users size={20} className="text-[#D4AF37]" />, label: 'View Team' },
    { 
      name: 'Alert', 
      link: '/alerts', 
      icon: <Bell size={20} className="text-[#D4AF37]" />, 
      label: 'View Notifications',
      onClick: handleAlertClick
    },
  ];

  const progress = backend_wallet ? Math.min(Math.round((backend_wallet / 3) * 100), 100) : 0;

  const [balanceLoaded, setBalanceLoaded] = React.useState(false);
  React.useEffect(() => {
    setBalanceLoaded(true);
  }, [currBalance]);

  return (
    <div className="relative pt-4 bg-[#19202a] rounded-3xl overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-4 mt-1">
        <p className="text-white text-base font-medium flex items-center">
          {NewName || 'User'}
<div className="relative ml-2 w-5 h-5 flex items-center justify-center">
  <Shield size={50} className="text-[#f8c23c]" strokeWidth={2} />
  <span className="absolute inset-0 flex items-center justify-center text-[12px]  text-white">
    {level || 1}
  </span>
</div>        </p>
        <span className="text-[12px] font-medium text-[#D4AF37]/90">
          {progress}% Progress
        </span>
      </div>

      {/* Balance */}
      <div className="px-4 mb-4">
        <div className="flex justify-between items-end">
          <div>
            <p className={`text-white text-2xl font-semibold tracking-tight transition-all duration-700 ${balanceLoaded ? 'opacity-100' : 'opacity-0'}`}>
              ${RemoveTrailingZeros(currBalance)}
            </p>
            <p className="text-[11px] text-[#f8c23c] mt-1 tracking-wide uppercase">Available Balance</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-white/85 text-2xl font-semibold tracking-tight">
              ${RemoveTrailingZeros(total_withdrawal)}
            </p>
            <p className="text-[11px] text-gray-500 mt-1 tracking-wide uppercase">Total Cashout</p>
          </div>
        </div>
      </div>

      {/* Menu — ✅ Matches NavBar Style */}
      <div className="pb-4">
        <div className="grid grid-cols-4 gap-2 ">
        {menuItems.map((item, index) => {
  if (item.isAction) {
    return (
      <button
        key={index}
        onClick={item.onClick}
        className="flex flex-col items-center group"
        aria-label="Send to Cashout"
      >
        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1c2a3a] group-hover:bg-[#26303b] transition-colors">
          {item.actionIcon}
        </div>
        <span className="mt-2 text-[11px] font-medium text-[#D4AF37]">Send</span>
      </button>
    );
  }

  // ✅ Special handling for Alert — badge inside same-size container
  if (item.name === 'Alert') {
    return (
      <button
        key={index}
        onClick={item.onClick}
        className="flex flex-col items-center group"
        aria-label={item.label}
      >
        {/* Icon container — fixed size, centered */}
        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1c2a3a] group-hover:bg-[#26303b] transition-colors relative">
          {item.icon}
          {/* ✅ Badge inside — doesn’t affect layout */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5">
              <span className="absolute inset-0 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full animate-pulse"></span>
              <span className="relative z-10 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          )}
        </div>
        <span className="mt-2 text-[11px] font-medium text-white/80 group-hover:text-white transition-colors">
          {item.name}
        </span>
      </button>
    );
  }

  return (
    <Link
      key={index}
      to={item.link}
      className="flex flex-col items-center group"
      aria-label={item.label}
    >
      <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1c2a3a] group-hover:bg-[#26303b] transition-colors">
        {item.icon}
      </div>
      <span className="mt-2 text-[11px] font-medium text-white/80 group-hover:text-white transition-colors">
        {item.name}
      </span>
    </Link>
  );
})}
        </div>
      </div>

      {/* Color Illusion */}
      <div 
        style={{
          background: 'radial-gradient(circle at 50% 0, #19202a 60%, #111827 120%)'
        }}
      />
    </div>
  );
}

export default BalanceCard;