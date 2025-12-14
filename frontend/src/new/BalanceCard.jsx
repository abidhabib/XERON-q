// BalanceCard.jsx - Updated with mark all on click
import React from 'react';
import { useContext } from 'react';
import { UserContext } from '../UserContext/UserContext';
import {
  Wallet,
  Send,
  Users,
  Bell,
  Mail,
  CheckCheck
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
    Userid // Need userId for markAllNotificationsAsRead
  } = useContext(UserContext);
  
  const navigate = useNavigate();
  const location = useLocation();

  const toWithdraw = () => {
    navigate('/cashout');
  };

  const isOnWalletPage = location.pathname === '/wallet';

  // Handle Alert icon click
  const handleAlertClick = async (e) => {
    e.preventDefault(); // Prevent default navigation
    
    // If there are unread notifications, mark all as read
    if (unreadCount > 0 && Userid) {
      try {
        await markAllNotificationsAsRead(Userid);
        // Show a quick feedback
        const icon = e.currentTarget.querySelector('div');
        if (icon) {
          icon.classList.add('scale-125', 'text-green-400');
          setTimeout(() => {
            icon.classList.remove('scale-125', 'text-green-400');
          }, 300);
        }
      } catch (error) {
        console.error('Error marking all as read:', error);
      }
    }
    
    // Navigate to alerts page after a short delay
    setTimeout(() => {
      navigate('/alerts');
    }, 150);
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
    { name: 'Salary', link: '/contact', icon: <Mail size={20} className="text-[#D4AF37]" />, label: 'Contact Support' },
    { name: 'Team', link: '/team', icon: <Users size={20} className="text-[#D4AF37]" />, label: 'View Team' },
    { 
      name: 'Alert', 
      link: '/alerts', 
      icon: <Bell size={20} className="text-[#D4AF37]" />, 
      label: 'View Notifications',
      onClick: handleAlertClick // Add custom click handler
    },
  ];

  const progress = backend_wallet ? Math.min(Math.round((backend_wallet / 3) * 100), 100) : 0;

  const [balanceLoaded, setBalanceLoaded] = React.useState(false);
  React.useEffect(() => {
    setBalanceLoaded(true);
  }, [currBalance]);

  return (
    <div className="relative pt-4 bg-[#19202a] rounded-3xl overflow-hidden">
      
      {/* Your content */}
      <div className="flex items-center justify-between px-4 mb-4 mt-1">
        <p className="text-white text-base font-medium flex items-center">
          {NewName || 'User'}
          <CheckCheck size={16} className="text-emerald-400 ml-1" />
        </p>
        <span className="text-[12px] font-medium text-[#D4AF37]/90">
          {progress}% Progress
        </span>
      </div>

      <div className="px-4 mb-4">
        <div className="flex justify-between items-end">
          <div>
            <p className={`text-white text-2xl font-semibold tracking-tight transition-all duration-700 ${balanceLoaded ? 'opacity-100' : 'opacity-0'}`}>
              ${RemoveTrailingZeros(currBalance)}
            </p>
            <p className="text-[11px] text-[#D4AF37]/80 mt-1 tracking-wide uppercase">Available Balance</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-white/85 text-2xl font-semibold tracking-tight">${RemoveTrailingZeros(total_withdrawal)}</p>
            <p className="text-[11px] text-gray-500 mt-1 tracking-wide uppercase">Total Cashout</p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="grid grid-cols-4 gap-2">
          {menuItems.map((item, index) => {
            if (item.isAction) {
              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="flex flex-col items-center p-2 transition-all duration-200 cursor-pointer group"
                  aria-label="Send to Cashout"
                >
                  <div className="transition-transform duration-200 group-hover:scale-105">
                    {item.actionIcon}
                  </div>
                  <span className="mt-2 text-[11px] font-medium text-[#D4AF37] transition-opacity duration-200 group-hover:opacity-100 opacity-90">
                    Send
                  </span>
                </button>
              );
            }
            
            // Special handling for Alert/Notifications with badge
            if (item.name === 'Alert') {
              return (
                <div key={index} className="relative">
                  <button
                    onClick={item.onClick} // Use custom click handler
                    className="flex flex-col items-center p-2 transition-all duration-200 group w-full"
                    aria-label={item.label}
                  >
                    <div className="relative transition-transform duration-200 group-hover:scale-105 text-[#D4AF37]">
                      {item.icon}
                      {/* Unread Notification Badge - shows globally */}
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5">
                          <span className="absolute w-full h-full bg-gradient-to-br from-rose-500 to-amber-500 rounded-full animate-pulse"></span>
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
                </div>
              );
            }
            
            return (
              <Link
                key={index}
                to={item.link}
                className="flex flex-col items-center p-2 transition-all duration-200 group"
                aria-label={item.label}
              >
                <div className="transition-transform duration-200 group-hover:scale-105 text-[#D4AF37]">
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

      {/* COLOR ILLUSION */}
      <div 
        className="absolute left-0 right-0 h-4"
        style={{
          background: 'radial-gradient(circle at 50% 0, #19202a 60%, #111827 120%)'
        }}
      />
    </div>
  );
}

export default BalanceCard;